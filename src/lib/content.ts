import "server-only";
import { cache } from "react";
import { revalidatePath } from "next/cache";
import { db } from "./db";
import { logAudit, type AuditActor } from "./audit";
import { DEFAULT_BRAND, rebrandDeep } from "./settings-schema";
import {
  CONTENT_TYPES,
  articleToRowData,
  codeContent,
  entryPath,
  rowToArticle,
  type ContentArticle,
  type ContentStatus,
  type ContentType,
} from "./content-model";

export * from "./content-model";

/**
 * DB-backed content with TS fallbacks.
 *
 * Rule: if the DB has ANY ContentEntry of a type (draft or published), that type is served from the DB only.
 * Otherwise the TS content in src/content/* is served (so the site works before "Import default content").
 * All reads are cached per request with React cache().
 */

const typeInDb = cache(async (type: ContentType): Promise<boolean> => {
  try {
    return (await db.contentEntry.count({ where: { type } })) > 0;
  } catch {
    return false; // table missing (before `prisma db push`)
  }
});

/** Blog posts, guides, help and legal text follow a business rename (see rebrandText in settings-schema). */
async function rebrandArticles(list: ContentArticle[]): Promise<ContentArticle[]> {
  const { getBrand } = await import("./brand");
  const brand = await getBrand();
  return brand === DEFAULT_BRAND ? list : rebrandDeep(list, brand);
}

const byDateDesc = (a: ContentArticle, b: ContentArticle) => (b.date ?? "").localeCompare(a.date ?? "");

/**
 * Entries of a type. Default: published only, newest first (by meta.date, then updatedAt).
 * `status: "ALL"` includes drafts (admin lists).
 */
export const listEntries = cache(async (type: ContentType, opts: { status?: ContentStatus | "ALL" } = {}): Promise<ContentArticle[]> => {
  const status = opts.status ?? "PUBLISHED";
  if (!(await typeInDb(type))) {
    return status === "DRAFT" ? [] : rebrandArticles(codeContent(type));
  }
  const rows = await db.contentEntry.findMany({
    where: { type, ...(status === "ALL" ? {} : { status }) },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
  });
  return rebrandArticles(rows.map(rowToArticle));
});

/**
 * One entry by slug. Published only unless `preview` (staff previews of drafts — check permissions first).
 * Returns null when missing.
 */
export async function getEntry(type: ContentType, slug: string, opts: { preview?: boolean } = {}): Promise<ContentArticle | null> {
  if (!(await typeInDb(type))) {
    const a = codeContent(type).find((x) => x.slug === slug);
    return a ? (await rebrandArticles([a]))[0] : null;
  }
  const row = await db.contentEntry.findUnique({ where: { type_slug: { type, slug } } });
  if (!row) return null;
  if (row.status !== "PUBLISHED" && !opts.preview) return null;
  return (await rebrandArticles([rowToArticle(row)]))[0];
}

/** Admin: one entry by id (any status). */
export async function getEntryById(id: string): Promise<ContentArticle | null> {
  const row = await db.contentEntry.findUnique({ where: { id } });
  return row ? rowToArticle(row) : null;
}

// Convenience getters matching today's public pages.
export const getPublishedPosts = cache(async () => [...(await listEntries("POST"))].sort(byDateDesc));
export const getPublishedGuides = cache(async () => listEntries("GUIDE"));
export const getHelpArticles = cache(async () => listEntries("HELP"));
export const getLegalPages = cache(async () => listEntries("LEGAL"));
export const getPublishedPages = cache(async () => listEntries("PAGE"));
export const getPost = (slug: string, opts?: { preview?: boolean }) => getEntry("POST", slug, opts);
export const getGuide = (slug: string, opts?: { preview?: boolean }) => getEntry("GUIDE", slug, opts);
export const getHelpArticle = (slug: string, opts?: { preview?: boolean }) => getEntry("HELP", slug, opts);
export const getLegalPage = (slug: string, opts?: { preview?: boolean }) => getEntry("LEGAL", slug, opts);
export const getPage = (slug: string, opts?: { preview?: boolean }) => getEntry("PAGE", slug, opts);

/** Whether a type is served from the DB (true) or from the TS fallback (false). */
export async function contentSource(type: ContentType): Promise<"db" | "code"> {
  return (await typeInDb(type)) ? "db" : "code";
}

export type ImportResult = { created: number; updated: number; skipped: number };

/**
 * Copies all TS content (POSTS, GUIDES, HELP, LEGAL) into ContentEntry as PUBLISHED, with blocks converted
 * from sections and meta (cover, hue, readMins, date, updated, featured, collection, categories).
 * Existing entries (same type + slug) are left alone unless `force`. Callers must check the owner role.
 */
export async function importDefaultContent(user: AuditActor, opts: { force?: boolean } = {}): Promise<ImportResult> {
  const result: ImportResult = { created: 0, updated: 0, skipped: 0 };
  for (const type of CONTENT_TYPES) {
    for (const a of codeContent(type)) {
      const data = articleToRowData(a);
      const existing = await db.contentEntry.findUnique({ where: { type_slug: { type, slug: a.slug } }, select: { id: true } });
      if (existing && !opts.force) {
        result.skipped++;
        continue;
      }
      if (existing) {
        await db.contentEntry.update({ where: { id: existing.id }, data: { ...data, updatedById: user?.id ?? null } });
        result.updated++;
      } else {
        await db.contentEntry.create({ data: { ...data, updatedById: user?.id ?? null } });
        result.created++;
      }
    }
  }
  await logAudit(user, "content.import", opts.force ? "all (overwrite)" : "all", `${result.created} created, ${result.updated} updated, ${result.skipped} skipped`);
  revalidatePath("/", "layout");
  return result;
}

/** Revalidates the public page of an entry plus its listing (call after saving/publishing). */
export function revalidateEntry(type: ContentType, slug: string) {
  revalidatePath(entryPath(type, slug));
  revalidatePath(entryPath(type, "").replace(/\/$/, "") || "/");
  revalidatePath("/sitemap.xml");
}
