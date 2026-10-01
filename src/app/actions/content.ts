"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin, requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { withFlash } from "@/components/admin/flashUrl";
import { blockSchema, readMinutes, type Block } from "@/lib/blocks";
import { resolveImageRef } from "@/lib/imageRef";
import {
  CONTENT_STATUSES,
  CONTENT_TYPES,
  CONTENT_TYPE_INFO,
  codeContent,
  entryPath,
  importDefaultContent,
  parseMeta,
  revalidateEntry,
  rowToArticle,
  type ContentType,
  type EntryMeta,
} from "@/lib/content";
import { SLUG_RE, toEditorEntry, type SaveEntryResult } from "@/lib/content-editor";

export type ContentActionState = { error?: string; ok?: string } | undefined;

const LIST = "/dashboard/content";

/**
 * Owner only: copies the built-in articles (blog posts, guides, help, legal) into the content database so they
 * can be edited in the block editor. Existing entries are kept unless the form sends force=on.
 * Usage: <ActionForm action={importDefaultContentAction} submitLabel="Import default content">…</ActionForm>
 */
export async function importDefaultContentAction(_: ContentActionState, formData: FormData): Promise<ContentActionState> {
  const { user } = await requireAdmin("/dashboard/content");
  try {
    const r = await importDefaultContent(user, { force: formData.get("force") === "on" });
    revalidatePath(LIST);
    return { ok: `Imported: ${r.created} created, ${r.updated} overwritten, ${r.skipped} already existed.` };
  } catch (e) {
    console.error(e);
    return { error: "Import failed. Has the database been updated (npx prisma db push)?" };
  }
}

// ---------------------------------------------------------------- helpers

const isoDate = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "Use a valid date");
const RESERVED: Partial<Record<ContentType, string[]>> = { POST: ["category", "tag", "page", "feed"] };

const payloadSchema = z.object({
  id: z.string().max(64).optional(),
  type: z.enum(CONTENT_TYPES),
  title: z.string().trim().min(1, "Add a title").max(200, "Keep the title under 200 characters"),
  slug: z.string().trim().max(100, "Keep the URL under 100 characters"),
  excerpt: z.string().trim().max(500, "Keep the excerpt under 500 characters"),
  category: z.string().trim().max(60, "Category is too long"),
  tags: z.array(z.string().trim().min(1).max(40)).max(20, "Up to 20 tags"),
  author: z.string().trim().max(60),
  status: z.enum(CONTENT_STATUSES),
  blocks: z.array(z.unknown()).max(600, "Too many blocks"),
  meta: z.object({
    cover: z.string().trim().max(500),
    hue: z.number().int().min(0).max(360).optional(),
    date: isoDate,
    updated: isoDate,
    seoTitle: z.string().trim().max(120, "SEO title is too long"),
    seoDescription: z.string().trim().max(320, "SEO description is too long"),
    featured: z.boolean(),
    noindex: z.boolean(),
    collection: z.string().trim().max(80),
    categories: z.array(z.string().trim().min(1).max(80)).max(20),
  }),
});
export type SaveEntryPayload = z.input<typeof payloadSchema>;

const BLOCK_MSG: Record<string, string> = {
  heading: "Heading text is empty.",
  image: "Choose an image.",
  table: "The table is incomplete.",
};

/** Validates blocks one by one so errors point at the block (by id). */
function validateBlocks(raw: unknown[]): { blocks: Block[]; errors: Record<string, string> } {
  const blocks: Block[] = [];
  const errors: Record<string, string> = {};
  raw.forEach((b, i) => {
    const key = (b && typeof b === "object" && typeof (b as { id?: unknown }).id === "string" ? (b as { id: string }).id : `#${i}`) || `#${i}`;
    const r = blockSchema.safeParse(b);
    if (!r.success) {
      const type = (b as { type?: string } | null)?.type ?? "";
      errors[key] = BLOCK_MSG[type] ?? "This block is incomplete.";
      return;
    }
    const block = r.data;
    if (block.type === "image") {
      if (resolveImageRef(block.src).kind === "none") errors[key] = "Choose an image.";
      else if (!block.alt.trim()) errors[key] = "Add alt text: describe the image for screen readers and search.";
    }
    blocks.push(block);
  });
  return { blocks, errors };
}

function revalidateContent(type: ContentType, slugs: string[]) {
  for (const s of new Set(slugs.filter(Boolean))) revalidateEntry(type, s);
  if (type === "POST") revalidatePath("/blog/category/[slug]", "page");
  revalidatePath("/");
  revalidatePath("/llms.txt");
  revalidatePath(LIST);
}

async function typeInDb(type: ContentType) {
  return (await db.contentEntry.count({ where: { type } })) > 0;
}

function codeLocked(type: ContentType) {
  return codeContent(type).length > 0;
}

const safeBack = (v: FormDataEntryValue | null) => {
  const s = typeof v === "string" ? v : "";
  return s.startsWith(LIST) && !s.startsWith("//") ? s : LIST;
};

const setMeta = (m: EntryMeta, key: string, value: unknown) => {
  const rec = m as Record<string, unknown>;
  if (value === undefined || value === "" || value === false || (Array.isArray(value) && !value.length)) delete rec[key];
  else rec[key] = value;
};

// ---------------------------------------------------------------- save (block editor)

/**
 * Creates or updates an entry from the block editor. The client sends the whole document; `status` decides
 * publish/unpublish. Validates everything with zod (blocks with the foundation schema), checks slug
 * uniqueness per type, audits and revalidates the public pages.
 */
export async function saveEntryAction(input: SaveEntryPayload): Promise<SaveEntryResult> {
  const { user } = await requireStaff("content", LIST);

  const parsed = payloadSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const i of parsed.error.issues) {
      const k = String(i.path[0] === "meta" ? i.path[1] : i.path[0]);
      fieldErrors[k] ??= i.message;
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }
  const p = parsed.data;
  const fieldErrors: Record<string, string> = {};

  const existing = p.id ? await db.contentEntry.findUnique({ where: { id: p.id } }) : null;
  if (p.id && !existing) return { error: "This entry no longer exists. It may have been deleted." };
  const type = (existing?.type as ContentType | undefined) ?? p.type;

  if (!existing && codeLocked(type) && !(await typeInDb(type))) {
    return { error: `${CONTENT_TYPE_INFO[type].plural} are still served from the built-in content. Ask the owner to import it first.` };
  }

  const slug = p.slug || "";
  if (!slug) fieldErrors.slug = "Add a URL slug.";
  else if (!SLUG_RE.test(slug)) fieldErrors.slug = "Use lowercase letters, numbers and single hyphens.";
  else if (RESERVED[type]?.includes(slug)) fieldErrors.slug = "This URL is reserved. Choose another.";
  else {
    const clash = await db.contentEntry.findUnique({ where: { type_slug: { type, slug } }, select: { id: true } });
    if (clash && clash.id !== existing?.id) fieldErrors.slug = `Another ${CONTENT_TYPE_INFO[type].label.toLowerCase()} already uses this URL.`;
  }
  if (p.meta.cover && resolveImageRef(p.meta.cover).kind === "none") fieldErrors.cover = "Choose a stock photo or a media library image.";

  const { blocks, errors: blockErrors } = validateBlocks(p.blocks);
  if (Object.keys(fieldErrors).length || Object.keys(blockErrors).length) {
    const nb = Object.keys(blockErrors).length;
    return {
      error: nb ? `${nb} block${nb === 1 ? " needs" : "s need"} attention${Object.keys(fieldErrors).length ? ", and some fields too" : ""}.` : "Please fix the highlighted fields.",
      fieldErrors,
      blockErrors,
    };
  }

  // meta: keep unknown (passthrough) keys of the stored meta, overwrite the managed ones
  const meta: EntryMeta = existing ? parseMeta(existing.meta) : {};
  setMeta(meta, "cover", p.meta.cover);
  setMeta(meta, "hue", type === "GUIDE" ? p.meta.hue : existing ? meta.hue : undefined);
  setMeta(meta, "date", p.meta.date);
  setMeta(meta, "updated", p.meta.updated);
  setMeta(meta, "seoTitle", p.meta.seoTitle);
  setMeta(meta, "seoDescription", p.meta.seoDescription);
  setMeta(meta, "featured", type === "POST" ? p.meta.featured : false);
  setMeta(meta, "noindex", p.meta.noindex);
  if (type === "GUIDE") {
    setMeta(meta, "collection", p.meta.collection);
    setMeta(meta, "categories", [...new Set(p.meta.categories)]);
  }
  if (type === "POST") meta.readMins = readMinutes(blocks);

  const publishing = p.status === "PUBLISHED";
  let publishedAt = existing?.publishedAt ?? null;
  if (publishing) {
    if (meta.date) publishedAt = new Date(`${meta.date}T12:00:00Z`);
    else {
      publishedAt ??= new Date();
      meta.date = publishedAt.toISOString().slice(0, 10);
    }
  }

  const data = {
    slug,
    title: p.title,
    excerpt: p.excerpt,
    category: type === "POST" || type === "HELP" ? p.category : existing?.category ?? "",
    tags: JSON.stringify(type === "POST" ? [...new Set(p.tags)] : existing ? JSON.parse(existing.tags || "[]") : []),
    author: type === "POST" ? p.author : existing?.author ?? "",
    status: p.status,
    blocks: JSON.stringify(blocks),
    meta: JSON.stringify(meta),
    publishedAt,
    updatedById: user.id,
  };

  let row;
  try {
    row = existing
      ? await db.contentEntry.update({ where: { id: existing.id }, data })
      : await db.contentEntry.create({ data: { ...data, type } });
  } catch (e) {
    if ((e as { code?: string })?.code === "P2002") return { error: "Please fix the highlighted fields.", fieldErrors: { slug: "Another entry already uses this URL." } };
    console.error(e);
    return { error: "Could not save. Please try again." };
  }

  const path = entryPath(type, slug);
  await logAudit(user, existing ? "content.update" : "content.create", p.title, `${CONTENT_TYPE_INFO[type].label} ${path}`);
  const wasPublished = existing?.status === "PUBLISHED";
  if (publishing && !wasPublished) await logAudit(user, "content.publish", p.title, path);
  if (!publishing && wasPublished) await logAudit(user, "content.unpublish", p.title, path);

  revalidateContent(type, [slug, existing?.slug ?? ""]);
  revalidatePath(`${LIST}/${row.id}`);

  const ok = publishing && !wasPublished ? "Published" : !publishing && wasPublished ? "Unpublished — now a draft" : existing ? (publishing ? "Updated" : "Draft saved") : "Created";
  return { ok, entry: toEditorEntry(rowToArticle(row)), savedAt: new Date().toISOString() };
}

// ---------------------------------------------------------------- list actions (forms)

/** Form: id, back? — publishes or unpublishes (field `to` = PUBLISHED | DRAFT). */
export async function setEntryStatusAction(formData: FormData) {
  const { user } = await requireStaff("content", LIST);
  const back = safeBack(formData.get("back"));
  const id = String(formData.get("id") ?? "");
  const to = formData.get("to") === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
  const row = await db.contentEntry.findUnique({ where: { id } });
  if (!row) redirect(withFlash(back, "That entry no longer exists.", "error"));
  const type = row.type as ContentType;
  if (row.status !== to) {
    const meta = parseMeta(row.meta);
    let publishedAt = row.publishedAt;
    if (to === "PUBLISHED") {
      if (meta.date) publishedAt = new Date(`${meta.date}T12:00:00Z`);
      else {
        publishedAt ??= new Date();
        meta.date = publishedAt.toISOString().slice(0, 10);
      }
    }
    await db.contentEntry.update({ where: { id }, data: { status: to, publishedAt, meta: JSON.stringify(meta), updatedById: user.id } });
    await logAudit(user, to === "PUBLISHED" ? "content.publish" : "content.unpublish", row.title, entryPath(type, row.slug));
    revalidateContent(type, [row.slug]);
  }
  redirect(withFlash(back, to === "PUBLISHED" ? `Published “${row.title}”` : `“${row.title}” is now a draft`));
}

/** Form: id — copies an entry as a new draft and opens it in the editor. */
export async function duplicateEntryAction(formData: FormData) {
  const { user } = await requireStaff("content", LIST);
  const id = String(formData.get("id") ?? "");
  const row = await db.contentEntry.findUnique({ where: { id } });
  if (!row) redirect(withFlash(safeBack(formData.get("back")), "That entry no longer exists.", "error"));
  const base = `${row.slug.replace(/-copy(-\d+)?$/, "")}-copy`.slice(0, 90);
  let slug = base;
  for (let n = 2; await db.contentEntry.findUnique({ where: { type_slug: { type: row.type, slug } }, select: { id: true } }); n++) slug = `${base}-${n}`;
  const meta = parseMeta(row.meta);
  delete meta.featured;
  const copy = await db.contentEntry.create({
    data: {
      type: row.type,
      slug,
      title: `${row.title} (copy)`.slice(0, 200),
      excerpt: row.excerpt,
      category: row.category,
      tags: row.tags,
      author: row.author,
      status: "DRAFT",
      blocks: row.blocks,
      meta: JSON.stringify(meta),
      publishedAt: null,
      updatedById: user.id,
    },
  });
  await logAudit(user, "content.create", copy.title, `duplicate of ${entryPath(row.type as ContentType, row.slug)}`);
  revalidatePath(LIST);
  redirect(withFlash(`${LIST}/${copy.id}`, "Copy created as a draft"));
}

/** Form: id, back? — deletes an entry (refuses to delete the last entry of a type that has built-in content). */
export async function deleteEntryAction(formData: FormData) {
  const { user } = await requireStaff("content", LIST);
  const back = safeBack(formData.get("back"));
  const id = String(formData.get("id") ?? "");
  const row = await db.contentEntry.findUnique({ where: { id } });
  if (!row) redirect(withFlash(back, "That entry was already deleted.", "info"));
  const type = row.type as ContentType;
  if (codeLocked(type) && (await db.contentEntry.count({ where: { type } })) <= 1) {
    redirect(
      withFlash(
        back.startsWith(`${LIST}/`) ? back : `${LIST}?type=${type}`,
        `This is the last ${CONTENT_TYPE_INFO[type].label.toLowerCase()} in the database — deleting it would bring back the built-in ones. Unpublish it instead.`,
        "error",
      ),
    );
  }
  await db.contentEntry.delete({ where: { id } });
  await logAudit(user, "content.delete", row.title, entryPath(type, row.slug));
  revalidateContent(type, [row.slug]);
  redirect(withFlash(back.startsWith(`${LIST}/`) ? `${LIST}?type=${type}` : back, `Deleted “${row.title}”`));
}
