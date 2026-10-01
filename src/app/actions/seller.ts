"use server";

import { notifyOrderEvent } from "@/lib/status-email";
import { forbidden, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { can, isStaff, type Perm } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";
import { slugify } from "@/lib/format";
import { saveLotPhotos, deleteLotPhoto } from "@/lib/uploads";
import { MAX_LOT_PHOTOS, parseImages } from "@/lib/lotImages";
import { withFlash } from "@/components/admin/flashUrl";
import type { FormState } from "./auth";

/**
 * Guard for store actions. `perm` is the staff permission required (see src/lib/permissions.ts);
 * "owner" means the ADMIN role only (business settings). Signed out → login; no permission → 403.
 * Returns the company store record and the acting user (for audit logging).
 */
async function storeFor(next: string, perm: Perm | "owner") {
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(next)}`);
  const user = await db.user.findUnique({ where: { id: session.userId }, select: { id: true, email: true, role: true } });
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  const allowed = perm === "owner" ? user.role === "ADMIN" : isStaff(user.role) && can(user.role, perm);
  if (!allowed) forbidden();
  return { seller: await getStore(), user };
}

const manifestLine = z.object({ sku: z.string(), name: z.string().min(1), qty: z.number().int().positive(), unitMsrpCents: z.number().int().nonnegative() });

const lotSchema = z.object({
  title: z.string().trim().min(5, "Title is too short"),
  description: z.string().trim().min(20, "Description is too short"),
  categoryId: z.string().min(1, "Choose a category"),
  subcategoryId: z.string().optional(),
  condition: z.enum(["NEW", "SHELF_PULL", "CUSTOMER_RETURN", "MIXED", "SALVAGE"]),
  lotSize: z.enum(["CASE", "PALLET", "TRUCKLOAD"]).default("PALLET"),
  source: z.string().trim().max(80).optional().default(""),
  brand: z.string().trim().max(60).optional().default(""),
  price: z.coerce.number().positive("Enter a price"),
  palletCount: z.coerce.number().int().min(1).max(26),
  weightLbs: z.coerce.number().int().min(1, "Enter a weight"),
  available: z.coerce.number().int().min(0).max(100),
  manifest: z.string().trim().min(1, "Add at least one manifest line"),
});

/** Reuse the existing spelling of a brand ("dewalt" → "DeWALT") so brand filters don't split. */
async function canonicalBrand(brand: string) {
  const b = brand.replace(/\s+/g, " ").trim();
  if (!b) return "";
  const known = await db.lot.findMany({ where: { NOT: { brand: "" } }, select: { brand: true }, distinct: ["brand"] });
  return known.find((k) => k.brand.toLowerCase() === b.toLowerCase())?.brand ?? b;
}

/** The subcategory must belong to the chosen category (the form can be submitted with a stale pick). */
async function checkTree(categoryId: string, subcategoryId?: string) {
  const cat = await db.category.findUnique({ where: { id: categoryId }, select: { id: true } });
  if (!cat) return "Choose a category";
  if (subcategoryId) {
    const sub = await db.subcategory.findUnique({ where: { id: subcategoryId }, select: { categoryId: true } });
    if (!sub || sub.categoryId !== categoryId) return "That subcategory isn't in the chosen category";
  }
  return null;
}

// Manifest is pasted as CSV lines: name, qty, unit MSRP (USD) [, sku]
function parseManifest(text: string) {
  return text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line, i) => {
      const [name, qty, msrp, sku] = line.split(",").map((s) => s.trim());
      return manifestLine.parse({
        name,
        qty: Number(qty),
        unitMsrpCents: Math.round(Number(msrp) * 100),
        sku: sku || `LINE-${i + 1}`,
      });
    });
}

export async function createLot(_: FormState, formData: FormData): Promise<FormState> {
  const { seller, user } = await storeFor("/dashboard/new", "lots");

  const parsed = lotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;

  let manifest;
  try {
    manifest = parseManifest(d.manifest);
  } catch {
    return { error: "Manifest lines must look like: Item name, quantity, unit MSRP" };
  }

  const msrpCents = manifest.reduce((a, m) => a + m.qty * m.unitMsrpCents, 0);
  const units = manifest.reduce((a, m) => a + m.qty, 0);

  if (d.available < 1) return { error: "A new lot needs at least 1 in stock" };
  const treeError = await checkTree(d.categoryId, d.subcategoryId);
  if (treeError) return { error: treeError };
  const brand = await canonicalBrand(d.brand);
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length > MAX_LOT_PHOTOS) return { error: `Add up to ${MAX_LOT_PHOTOS} photos per lot.` };
  const lot = await db.lot.create({
    data: {
      slug: `${slugify(d.title)}-${Date.now().toString(36)}`,
      title: d.title,
      description: d.description,
      condition: d.condition,
      lotSize: d.lotSize,
      source: d.source,
      brand,
      priceCents: Math.round(d.price * 100),
      msrpCents,
      units,
      palletCount: d.palletCount,
      weightLbs: d.weightLbs,
      available: d.available,
      shipsFrom: seller.location,
      categoryId: d.categoryId,
      subcategoryId: d.subcategoryId || null,
      sellerId: seller.id,
      manifest: { create: manifest },
    },
  });
  await logAudit(user, "lot.create", lot.title, lot.id);
  const saved = await saveLotPhotos(photos, lot.id);
  if (saved.urls.length) await db.lot.update({ where: { id: lot.id }, data: { images: saved.urls.join("\n") } });
  if (saved.error) redirect(`/dashboard/lots/${lot.id}?photoError=${encodeURIComponent(saved.error)}`);
  revalidatePath("/lots");
  redirect(`/lots/${lot.slug}`);
}

export async function setLotStatus(formData: FormData) {
  const { seller, user } = await storeFor("/dashboard", "lots");
  const id = String(formData.get("id"));
  const status = String(formData.get("status"));
  if (!["ACTIVE", "DRAFT"].includes(status)) return;
  await db.lot.updateMany({ where: { id, sellerId: seller.id }, data: { status } });
  await logAudit(user, "lot.status", id, status);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lots");
}

export async function updateOrderStatus(formData: FormData) {
  const { seller, user } = await storeFor("/dashboard", "orders");
  const orderId = String(formData.get("orderId"));
  const status = String(formData.get("status"));
  if (!["CONFIRMED", "SHIPPED", "DELIVERED"].includes(status)) return;
  const trackingNo = String(formData.get("trackingNo") ?? "").trim();
  const owns = await db.orderItem.findFirst({ where: { orderId, sellerId: seller.id } });
  if (!owns) return;
  const order = await db.order.update({ where: { id: orderId }, data: { status, ...(trackingNo ? { trackingNo } : {}) } });
  if (status === "SHIPPED" || status === "DELIVERED") await notifyOrderEvent(order.id, status === "SHIPPED" ? "shipped" : "delivered");
  await logAudit(user, "order.status", order.number, `${status}${trackingNo ? ` · tracking ${trackingNo}` : ""}`);
  revalidatePath("/dashboard");
}

export async function updateLot(_: FormState, formData: FormData): Promise<FormState> {
  const id = String(formData.get("id"));
  const { seller, user } = await storeFor(`/dashboard/lots/${id}`, "lots");
  const lot = await db.lot.findFirst({ where: { id, sellerId: seller.id } });
  if (!lot) return { error: "Lot not found" };
  const parsed = lotSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  let manifest;
  try {
    manifest = parseManifest(d.manifest);
  } catch {
    return { error: "Manifest lines must look like: Item name, quantity, unit MSRP" };
  }
  const treeError = await checkTree(d.categoryId, d.subcategoryId);
  if (treeError) return { error: treeError };
  const brand = await canonicalBrand(d.brand);
  // Photos: keep the ticked existing ones (cover first), delete the rest, append new uploads.
  const existing = parseImages(lot.images);
  const cover = String(formData.get("cover") ?? "");
  let kept = formData.getAll("keepImage").map(String).filter((u) => existing.includes(u));
  if (cover && kept.includes(cover)) kept = [cover, ...kept.filter((u) => u !== cover)];
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  if (kept.length + photos.length > MAX_LOT_PHOTOS) return { error: `A lot can have up to ${MAX_LOT_PHOTOS} photos — remove some first.` };
  const saved = await saveLotPhotos(photos, id);
  if (saved.error) {
    await Promise.all(saved.urls.map(deleteLotPhoto));
    return { error: saved.error };
  }
  await Promise.all(existing.filter((u) => !kept.includes(u)).map(deleteLotPhoto));
  const images = [...kept, ...saved.urls].join("\n");

  await db.$transaction([
    db.manifestItem.deleteMany({ where: { lotId: id } }),
    db.lot.update({
      where: { id },
      data: {
        title: d.title,
        description: d.description,
        condition: d.condition,
        lotSize: d.lotSize,
        source: d.source,
        brand,
        priceCents: Math.round(d.price * 100),
        palletCount: d.palletCount,
        weightLbs: d.weightLbs,
        available: d.available,
        // Quantity drives stock status: 0 sells a live lot out, restocking a sold-out lot puts it back on sale.
        status: lot.status === "SOLD_OUT" && d.available > 0 ? "ACTIVE" : lot.status === "ACTIVE" && d.available === 0 ? "SOLD_OUT" : lot.status,
        categoryId: d.categoryId,
        subcategoryId: d.subcategoryId || null,
        msrpCents: manifest.reduce((a, m) => a + m.qty * m.unitMsrpCents, 0),
        units: manifest.reduce((a, m) => a + m.qty, 0),
        manifest: { create: manifest },
        images,
      },
    }),
  ]);
  await logAudit(user, "lot.update", d.title, id);
  revalidatePath("/dashboard");
  redirect(`/lots/${lot.slug}`);
}

export async function deleteLot(formData: FormData) {
  const { seller, user } = await storeFor("/dashboard", "lots");
  const id = String(formData.get("id"));
  const sold = await db.orderItem.count({ where: { lotId: id } });
  await logAudit(user, sold > 0 ? "lot.hide" : "lot.delete", id);
  if (sold > 0) {
    // Keep order history intact; just hide it.
    await db.lot.updateMany({ where: { id, sellerId: seller.id }, data: { status: "DRAFT" } });
  } else {
    const lot = await db.lot.findFirst({ where: { id, sellerId: seller.id }, select: { images: true } });
    await db.lot.deleteMany({ where: { id, sellerId: seller.id } });
    if (lot) await Promise.all(parseImages(lot.images).map(deleteLotPhoto));
  }
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/lots");
  redirect(withFlash("/dashboard/lots", sold > 0 ? "Lot has orders, so it was hidden (set to draft) instead of deleted" : "Lot deleted"));
}

const storeSchema = z.object({
  name: z.string().trim().min(2, "Enter your business name"),
  location: z.string().trim().min(2, "Enter your warehouse city"),
  bio: z.string().trim().min(20, "Tell buyers a bit more (20+ characters)"),
  minOrder: z.coerce.number().min(0).default(0),
});

export async function updateStore(_: FormState, formData: FormData): Promise<FormState> {
  const { seller, user } = await storeFor("/dashboard/settings", "owner");
  const parsed = storeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { minOrder, ...rest } = parsed.data;
  await db.seller.update({
    where: { id: seller.id },
    data: { ...rest, minOrderCents: Math.round(minOrder * 100), pickup: formData.get("pickup") === "on" },
  });
  await logAudit(user, "store.update", rest.name);
  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { error: undefined };
}

const promoSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{4,20}$/, "Codes are 4–20 letters or numbers"),
  kind: z.enum(["percent", "amount"]),
  value: z.coerce.number().positive("Enter a discount value"),
  minSubtotal: z.coerce.number().min(0).default(0),
  description: z.string().trim().max(200).optional().default(""),
  expiresAt: z.string().trim().optional().default(""),
});

function parseExpiry(v: string): Date | null | "invalid" {
  if (!v) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return "invalid";
  const d = new Date(`${v}T23:59:59Z`);
  return Number.isNaN(d.getTime()) ? "invalid" : d;
}

export async function createPromo(_: FormState, formData: FormData): Promise<FormState> {
  const { seller, user } = await storeFor("/dashboard/promotions", "promotions");
  const parsed = promoSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.kind === "percent" && d.value > 50) return { error: "Percentage discounts are capped at 50%" };
  if (await db.promo.findUnique({ where: { code: d.code } })) return { error: "That code is taken" };
  const expiresAt = parseExpiry(d.expiresAt);
  if (expiresAt === "invalid") return { error: "Enter a valid expiry date" };
  await db.promo.create({
    data: {
      code: d.code,
      sellerId: seller.id,
      description: d.description || (d.kind === "percent" ? `${d.value}% off your order` : `$${d.value} off your order`),
      percentOff: d.kind === "percent" ? Math.round(d.value) : null,
      amountOffCents: d.kind === "amount" ? Math.round(d.value * 100) : null,
      minSubtotalCents: Math.round(d.minSubtotal * 100),
      firstOrderOnly: formData.get("firstOrderOnly") === "on",
      expiresAt,
    },
  });
  await logAudit(user, "promo.create", d.code);
  revalidatePath("/dashboard/promotions");
  return { error: undefined };
}

export async function togglePromo(formData: FormData) {
  const { seller, user } = await storeFor("/dashboard/promotions", "promotions");
  const id = String(formData.get("id"));
  const promo = await db.promo.findFirst({ where: { id, OR: [{ sellerId: seller.id }, { sellerId: null }] } });
  if (promo) {
    await db.promo.update({ where: { id }, data: { active: !promo.active } });
    await logAudit(user, "promo.toggle", promo.code, promo.active ? "deactivated" : "activated");
  }
  revalidatePath("/dashboard/promotions");
}

// ---------------------------------------------------------------------------------------------
// Commerce admin additions (lots list bulk/quick edit, promo editing, store settings).
// ---------------------------------------------------------------------------------------------

export type AdminFormState = { error?: string; ok?: string; savedAt?: number } | undefined;

const promoEditSchema = z.object({
  id: z.string().min(1),
  kind: z.enum(["percent", "amount"]),
  value: z.coerce.number().positive("Enter a discount value"),
  minSubtotal: z.coerce.number().min(0).default(0),
  description: z.string().trim().max(200).optional().default(""),
  expiresAt: z.string().trim().optional().default(""),
});

/** Edit a promo's terms. The code itself can't change (past orders reference it). */
export async function updatePromo(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const { seller, user } = await storeFor("/dashboard/promotions", "promotions");
  const parsed = promoEditSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  if (d.kind === "percent" && d.value > 50) return { error: "Percentage discounts are capped at 50%" };
  const expiresAt = parseExpiry(d.expiresAt);
  if (expiresAt === "invalid") return { error: "Enter a valid expiry date" };
  const promo = await db.promo.findFirst({ where: { id: d.id, OR: [{ sellerId: seller.id }, { sellerId: null }] } });
  if (!promo) return { error: "Promotion not found" };
  await db.promo.update({
    where: { id: promo.id },
    data: {
      description: d.description || (d.kind === "percent" ? `${d.value}% off your order` : `$${d.value} off your order`),
      percentOff: d.kind === "percent" ? Math.round(d.value) : null,
      amountOffCents: d.kind === "amount" ? Math.round(d.value * 100) : null,
      minSubtotalCents: Math.round(d.minSubtotal * 100),
      firstOrderOnly: formData.get("firstOrderOnly") === "on",
      active: formData.get("active") === "on",
      expiresAt,
    },
  });
  await logAudit(user, "promo.update", promo.code);
  revalidatePath("/dashboard/promotions");
  revalidatePath(`/dashboard/promotions/${promo.id}`);
  return { ok: "Promotion saved", savedAt: Date.now() };
}

const BULK_OPS = ["publish", "draft", "feature", "unfeature", "delete", "move"] as const;

function lotsBack(v: FormDataEntryValue | null) {
  const s = typeof v === "string" ? v : "";
  return s.startsWith("/dashboard/lots") && !s.startsWith("//") ? s : "/dashboard/lots";
}

/** Bulk actions from the lots table: publish / draft / feature / unfeature / delete (or hide if sold). */
export async function bulkLots(formData: FormData) {
  const { seller, user } = await storeFor("/dashboard/lots", "lots");
  const back = lotsBack(formData.get("back"));
  const op = String(formData.get("op") ?? "");
  const ids = [...new Set(formData.getAll("ids").map(String))].slice(0, 200);
  if (!(BULK_OPS as readonly string[]).includes(op)) redirect(withFlash(back, "Choose a bulk action", "error"));
  if (!ids.length) redirect(withFlash(back, "Select at least one lot", "error"));
  const lots = await db.lot.findMany({ where: { id: { in: ids }, sellerId: seller.id }, select: { id: true, status: true, images: true, _count: { select: { orderItems: true } } } });
  let done = 0;
  let skipped = 0;
  let hidden = 0;

  if (op === "publish") {
    const ok = lots.filter((l) => l.status === "DRAFT");
    skipped = lots.length - ok.length;
    done = (await db.lot.updateMany({ where: { id: { in: ok.map((l) => l.id) } }, data: { status: "ACTIVE" } })).count;
  } else if (op === "draft") {
    const ok = lots.filter((l) => l.status === "ACTIVE");
    skipped = lots.length - ok.length;
    done = (await db.lot.updateMany({ where: { id: { in: ok.map((l) => l.id) } }, data: { status: "DRAFT" } })).count;
  } else if (op === "move") {
    // target = "cat:<categoryId>" (no subcategory) or "sub:<subcategoryId>" (its category too)
    const [kind, tid] = String(formData.get("target") ?? "").split(":");
    const target =
      kind === "sub"
        ? await db.subcategory.findUnique({ where: { id: tid }, select: { id: true, categoryId: true } }).then((x) => (x ? { categoryId: x.categoryId, subcategoryId: x.id } : null))
        : kind === "cat"
          ? await db.category.findUnique({ where: { id: tid }, select: { id: true } }).then((x) => (x ? { categoryId: x.id, subcategoryId: null } : null))
          : null;
    if (!target) redirect(withFlash(back, "Choose a category to move the lots to", "error"));
    done = (await db.lot.updateMany({ where: { id: { in: lots.map((l) => l.id) } }, data: target })).count;
  } else if (op === "feature" || op === "unfeature") {
    done = (await db.lot.updateMany({ where: { id: { in: lots.map((l) => l.id) } }, data: { featured: op === "feature" } })).count;
  } else {
    const sold = lots.filter((l) => l._count.orderItems > 0);
    const free = lots.filter((l) => l._count.orderItems === 0);
    hidden = (await db.lot.updateMany({ where: { id: { in: sold.map((l) => l.id) } }, data: { status: "DRAFT" } })).count;
    done = (await db.lot.deleteMany({ where: { id: { in: free.map((l) => l.id) }, sellerId: seller.id } })).count;
    await Promise.all(free.flatMap((l) => parseImages(l.images)).map(deleteLotPhoto));
  }
  await logAudit(user, "lot.bulk", `${op} · ${lots.length} lots`, `${done} changed${hidden ? `, ${hidden} hidden` : ""}${skipped ? `, ${skipped} skipped` : ""}`);
  revalidatePath("/dashboard/lots");
  revalidatePath("/lots");
  revalidatePath("/");
  const verb = { publish: "published", draft: "moved to draft", feature: "featured", unfeature: "unfeatured", delete: "deleted", move: "moved" }[op as (typeof BULK_OPS)[number]];
  const msg = `${done} lot${done === 1 ? "" : "s"} ${verb}${hidden ? ` · ${hidden} with orders hidden instead` : ""}${skipped ? ` · ${skipped} skipped (${op === "publish" ? "not drafts" : "not active"})` : ""}`;
  redirect(withFlash(back, msg, done || hidden ? "success" : "info"));
}

const quickSchema = z.object({
  id: z.string().min(1),
  price: z.string().trim().optional().default(""),
  available: z.string().trim().optional().default(""),
});

/** Inline edit from the lots table: price + quantity in stock (0 = sold out, restocking reactivates). */
export async function quickEditLot(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const { seller, user } = await storeFor("/dashboard/lots", "lots");
  const parsed = quickSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Invalid input" };
  const d = parsed.data;
  const lot = await db.lot.findFirst({ where: { id: d.id, sellerId: seller.id } });
  if (!lot) return { error: "Lot not found" };
  const num = (s: string) => (s === "" ? NaN : Number(s));

  {
    const price = num(d.price);
    const available = num(d.available);
    if (!Number.isFinite(price) || price <= 0) return { error: "Enter a price above 0" };
    if (!Number.isInteger(available) || available < 0 || available > 100) return { error: "Quantity must be 0–100" };
    const status = available === 0 && lot.status === "ACTIVE" ? "SOLD_OUT" : available > 0 && lot.status === "SOLD_OUT" ? "ACTIVE" : lot.status;
    await db.lot.update({ where: { id: lot.id }, data: { priceCents: Math.round(price * 100), available, status } });
    await logAudit(user, "lot.quick", lot.title, `price $${price} · qty ${available}${status !== lot.status ? ` · ${lot.status} → ${status}` : ""}`);
  }
  revalidatePath("/dashboard/lots");
  revalidatePath(`/lots/${lot.slug}`);
  return { ok: "Saved", savedAt: Date.now() };
}

const storeSettingsSchema = z.object({
  minOrder: z.coerce.number().min(0, "Minimum order can't be negative").max(1_000_000),
  bio: z.string().trim().min(20, "Store bio needs at least 20 characters").max(1000),
});

/** Commerce settings (minimum order, pickup at checkout, store bio). Name/location live in Site settings → Business profile. */
export async function updateStoreSettings(_: AdminFormState, formData: FormData): Promise<AdminFormState> {
  const { seller, user } = await storeFor("/dashboard/settings", "owner");
  const parsed = storeSettingsSchema.safeParse({ minOrder: formData.get("minOrder") || 0, bio: formData.get("bio") ?? "" });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const minOrderCents = Math.round(parsed.data.minOrder * 100);
  const pickup = formData.get("pickup") === "on";
  await db.seller.update({ where: { id: seller.id }, data: { minOrderCents, pickup, bio: parsed.data.bio } });
  await logAudit(user, "store.update", "store settings", `minimum order $${parsed.data.minOrder} · pickup ${pickup ? "on" : "off"}${parsed.data.bio !== seller.bio ? " · bio" : ""}`);
  revalidatePath("/dashboard/settings");
  revalidatePath("/", "layout");
  return { ok: "Store settings saved", savedAt: Date.now() };
}
