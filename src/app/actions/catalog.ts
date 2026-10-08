"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "@/lib/public-cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";
import { TAXONOMY } from "@/lib/taxonomy";
import { withFlash } from "@/components/admin/flashUrl";
import type { AdminFormState } from "./seller";

/**
 * Admin → Categories: the catalogue tree (categories, subcategories) and brands.
 * Every action needs the "lots" permission and is audit-logged. Nothing here deletes lots:
 * deleting a category requires moving its lots first; deleting a subcategory leaves its lots in the category.
 */

const BASE = "/dashboard/categories";

async function guard() {
  const { user } = await requireStaff("lots", BASE);
  return user;
}

function refresh() {
  revalidatePath("/", "layout");
}

/** Safe in-admin return path from a form field. */
function backTo(v: FormDataEntryValue | null, fallback = BASE) {
  const s = String(v ?? "");
  return s.startsWith("/dashboard/") ? s : fallback;
}

const hueSchema = z.coerce.number().int().min(0).max(360);
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and dashes only");

const categorySchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Enter a category name").max(60),
  slug: z.string().trim().optional().default(""),
  group: z.string().trim().max(40).optional().default(""),
  blurb: z.string().trim().min(3, "Add a short description (shown under the name)").max(160),
  hue: hueSchema.optional().default(24),
  image: z.string().trim().max(500).optional().default(""),
  hidden: z.string().optional(),
});

/** Create or update a category. The slug (URL) can only change while the category has no lots. */
export async function saveCategory(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const user = await guard();
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const slugParsed = slugSchema.safeParse(d.slug || slugify(d.name));
  if (!slugParsed.success) return { error: `Slug: ${slugParsed.error.issues[0].message}` };
  let slug = slugParsed.data;
  const data = { name: d.name, group: d.group, blurb: d.blurb.replace(/\.$/, ""), hue: d.hue, image: d.image, hidden: d.hidden === "on" };

  if (d.id) {
    const cur = await db.category.findUnique({ where: { id: d.id }, include: { _count: { select: { lots: true } } } });
    if (!cur) return { error: "Category not found" };
    if (slug !== cur.slug && cur._count.lots > 0) slug = cur.slug; // URLs of listed lots stay stable
    if (slug !== cur.slug && (await db.category.findUnique({ where: { slug } }))) return { error: "Another category already uses that slug" };
    await db.category.update({ where: { id: d.id }, data: { ...data, slug } });
    await logAudit(user, "category.update", d.name, slug);
    refresh();
    return { ok: "Category saved", savedAt: Date.now() };
  }

  if (await db.category.findUnique({ where: { slug } })) return { error: "A category with that slug already exists" };
  const last = await db.category.aggregate({ _max: { position: true } });
  const created = await db.category.create({ data: { ...data, slug, position: (last._max.position ?? 0) + 10 } });
  await logAudit(user, "category.create", d.name, slug);
  refresh();
  redirect(withFlash(`${BASE}/${created.id}`, `Created ${d.name}. Add its subcategories below.`));
}

/** Move a category up or down within its department group. */
export async function moveCategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const cur = await db.category.findUnique({ where: { id } });
  if (!cur) redirect(BASE);
  const siblings = await db.category.findMany({ where: { group: cur.group }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const i = siblings.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i >= 0 && j >= 0 && j < siblings.length) {
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    await db.$transaction(siblings.map((s, n) => db.category.update({ where: { id: s.id }, data: { position: (n + 1) * 10 } })));
    refresh();
  }
  redirect(backTo(formData.get("back")));
}

/** Delete a category. If it has lots, they're moved to `moveTo` first (required). Its subcategories are removed. */
export async function deleteCategory(formData: FormData) {
  const user = await guard();
  const id = String(formData.get("id") ?? "");
  const moveTo = String(formData.get("moveTo") ?? "");
  const cat = await db.category.findUnique({ where: { id }, include: { _count: { select: { lots: true } } } });
  if (!cat) redirect(withFlash(BASE, "Category not found", "error"));
  if (cat._count.lots > 0) {
    if (!moveTo || moveTo === id || !(await db.category.findUnique({ where: { id: moveTo } }))) {
      redirect(withFlash(`${BASE}/${id}`, `Choose where to move its ${cat._count.lots} lots first`, "error"));
    }
    await db.lot.updateMany({ where: { categoryId: id }, data: { categoryId: moveTo, subcategoryId: null } });
  }
  await db.category.delete({ where: { id } });
  await logAudit(user, "category.delete", cat.name, cat._count.lots ? `${cat._count.lots} lots moved` : "");
  refresh();
  redirect(withFlash(BASE, `Deleted ${cat.name}${cat._count.lots ? ` and moved its ${cat._count.lots} lots` : ""}`));
}

// ---------- subcategories

const subSchema = z.object({
  id: z.string().optional(),
  categoryId: z.string().min(1),
  name: z.string().trim().min(2, "Enter a subcategory name").max(60),
  slug: z.string().trim().optional().default(""),
});

/** Add a subcategory, or rename one. New slugs are "<category-slug>-<name>" so they stay unique. */
export async function saveSubcategory(formData: FormData) {
  const user = await guard();
  const back = backTo(formData.get("back"));
  const parsed = subSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withFlash(back, parsed.error.issues[0].message, "error"));
  const d = parsed.data;
  const cat = await db.category.findUnique({ where: { id: d.categoryId } });
  if (!cat) redirect(withFlash(back, "Category not found", "error"));

  if (d.id) {
    const cur = await db.subcategory.findUnique({ where: { id: d.id }, include: { _count: { select: { lots: true } } } });
    if (!cur) redirect(withFlash(back, "Subcategory not found", "error"));
    let slug = cur.slug;
    if (d.slug && d.slug !== cur.slug && cur._count.lots === 0) {
      const s = slugSchema.safeParse(d.slug);
      if (!s.success) redirect(withFlash(back, `Slug: ${s.error.issues[0].message}`, "error"));
      if (await db.subcategory.findUnique({ where: { slug: s.data } })) redirect(withFlash(back, "That slug is already used", "error"));
      slug = s.data;
    }
    await db.subcategory.update({ where: { id: cur.id }, data: { name: d.name, slug } });
    await logAudit(user, "subcategory.update", `${cat.name} › ${d.name}`);
    refresh();
    redirect(withFlash(back, `Saved ${d.name}`));
  }

  let slug = `${cat.slug}-${slugify(d.name.replace(/&/g, " ").replace(/['’]/g, ""))}`;
  if (await db.subcategory.findUnique({ where: { slug } })) slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
  const last = await db.subcategory.aggregate({ where: { categoryId: cat.id }, _max: { position: true } });
  await db.subcategory.create({ data: { name: d.name, slug, categoryId: cat.id, position: (last._max.position ?? 0) + 10 } });
  await logAudit(user, "subcategory.create", `${cat.name} › ${d.name}`);
  refresh();
  redirect(withFlash(back, `Added ${d.name}`));
}

export async function moveSubcategory(formData: FormData) {
  await guard();
  const id = String(formData.get("id") ?? "");
  const dir = formData.get("dir") === "up" ? -1 : 1;
  const back = backTo(formData.get("back"));
  const cur = await db.subcategory.findUnique({ where: { id } });
  if (!cur) redirect(back);
  const siblings = await db.subcategory.findMany({ where: { categoryId: cur.categoryId }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { id: true } });
  const i = siblings.findIndex((s) => s.id === id);
  const j = i + dir;
  if (i >= 0 && j >= 0 && j < siblings.length) {
    [siblings[i], siblings[j]] = [siblings[j], siblings[i]];
    await db.$transaction(siblings.map((s, n) => db.subcategory.update({ where: { id: s.id }, data: { position: (n + 1) * 10 } })));
    refresh();
  }
  redirect(back);
}

/** Move a subcategory (and every lot in it) to another category. */
export async function transferSubcategory(formData: FormData) {
  const user = await guard();
  const id = String(formData.get("id") ?? "");
  const to = String(formData.get("to") ?? "");
  const back = backTo(formData.get("back"));
  const [sub, target] = await Promise.all([db.subcategory.findUnique({ where: { id }, include: { category: true } }), db.category.findUnique({ where: { id: to } })]);
  if (!sub || !target) redirect(withFlash(back, "Choose a category to move it to", "error"));
  if (sub.categoryId === target.id) redirect(back);
  const last = await db.subcategory.aggregate({ where: { categoryId: target.id }, _max: { position: true } });
  const [, moved] = await db.$transaction([
    db.subcategory.update({ where: { id }, data: { categoryId: target.id, position: (last._max.position ?? 0) + 10 } }),
    db.lot.updateMany({ where: { subcategoryId: id }, data: { categoryId: target.id } }),
  ]);
  await logAudit(user, "subcategory.move", sub.name, `${sub.category.name} → ${target.name} · ${moved.count} lots`);
  refresh();
  redirect(withFlash(back, `Moved ${sub.name} to ${target.name}${moved.count ? ` with ${moved.count} lots` : ""}`));
}

/** Delete a subcategory. Its lots stay in the parent category (with no subcategory). */
export async function deleteSubcategory(formData: FormData) {
  const user = await guard();
  const id = String(formData.get("id") ?? "");
  const back = backTo(formData.get("back"));
  const sub = await db.subcategory.findUnique({ where: { id }, include: { category: true, _count: { select: { lots: true } } } });
  if (!sub) redirect(back);
  await db.lot.updateMany({ where: { subcategoryId: id }, data: { subcategoryId: null } });
  await db.subcategory.delete({ where: { id } });
  await logAudit(user, "subcategory.delete", `${sub.category.name} › ${sub.name}`, sub._count.lots ? `${sub._count.lots} lots kept in ${sub.category.name}` : "");
  refresh();
  redirect(withFlash(back, `Deleted ${sub.name}${sub._count.lots ? ` · its ${sub._count.lots} lots stay in ${sub.category.name}` : ""}`));
}

/**
 * Adds any categories and subcategories from the standard structure (src/lib/taxonomy.ts) that are missing,
 * matched by slug. Existing ones are never renamed, moved or deleted; categories with no group get theirs.
 */
export async function syncTaxonomy() {
  const user = await guard();
  const existing = await db.category.findMany({ include: { subcategories: { select: { slug: true } } } });
  const allSubSlugs = new Set((await db.subcategory.findMany({ select: { slug: true } })).map((s) => s.slug));
  let cats = 0;
  let subs = 0;
  for (const [ci, t] of TAXONOMY.entries()) {
    let cat = existing.find((c) => c.slug === t.slug);
    if (!cat) {
      const created = await db.category.create({ data: { name: t.name, slug: t.slug, blurb: t.blurb, hue: t.hue, group: t.group, position: (ci + 1) * 10 } });
      cat = { ...created, subcategories: [] };
      cats++;
    } else if (!cat.group) {
      await db.category.update({ where: { id: cat.id }, data: { group: t.group, position: (ci + 1) * 10 } });
    }
    for (const [si, s] of t.subs.entries()) {
      if (allSubSlugs.has(s.slug)) continue;
      await db.subcategory.create({ data: { name: s.name, slug: s.slug, categoryId: cat.id, position: (si + 1) * 10 } });
      allSubSlugs.add(s.slug);
      subs++;
    }
  }
  await logAudit(user, "category.sync", "standard structure", `${cats} categories, ${subs} subcategories added`);
  refresh();
  redirect(withFlash(BASE, cats || subs ? `Added ${cats} categories and ${subs} subcategories` : "Everything in the standard structure is already here", cats || subs ? "success" : "info"));
}

// ---------- brands

const brandSchema = z.object({
  from: z.string().trim().min(1).max(60),
  to: z.string().trim().max(60).optional().default(""),
});

/** Rename a brand on every lot, merge it into another brand (type that brand's name), or clear it (leave empty). */
export async function renameBrand(formData: FormData) {
  const user = await guard();
  const back = backTo(formData.get("back"), `${BASE}/brands`);
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect(withFlash(back, "Enter a brand name", "error"));
  const { from, to } = parsed.data;
  if (from === to) redirect(back);
  // Match the existing spelling of the target brand, case-insensitively, so "dewalt" merges into "DeWALT".
  const all = await db.lot.findMany({ where: { NOT: { brand: "" } }, select: { brand: true }, distinct: ["brand"] });
  const target = to ? (all.find((b) => b.brand.toLowerCase() === to.toLowerCase() && b.brand !== from)?.brand ?? to) : "";
  const { count } = await db.lot.updateMany({ where: { brand: from }, data: { brand: target } });
  await logAudit(user, "brand.rename", from, `${target || "(cleared)"} · ${count} lots`);
  refresh();
  redirect(withFlash(back, target ? `${from} → ${target} on ${count} lots` : `Cleared ${from} from ${count} lots`));
}
