import "server-only";
import { db } from "@/lib/db";
import { SITE_NAME } from "@/lib/seo";
import { requestSiteUrl } from "@/lib/site-url";
import { COLLECTIONS } from "@/lib/collections";
import { BLOG_CATEGORIES } from "@/content/blog";
import { HELP_TOPICS } from "@/content/help";
import { AUTHORS, CONTENT_TYPE_INFO, codeContent, listEntries, type ContentType } from "@/lib/content";
import type { EditorOptions } from "@/lib/content-editor";

/** Pickers and hints for the block editor (categories, tags, authors, collections, slugs in use…). */
export async function loadEditorOptions(type: ContentType, currentId?: string): Promise<EditorOptions> {
  const [entries, lotCategories, dbCount] = await Promise.all([
    listEntries(type, { status: "ALL" }),
    type === "GUIDE" ? db.category.findMany({ orderBy: { name: "asc" }, select: { slug: true, name: true } }) : Promise.resolve([]),
    db.contentEntry.count({ where: { type } }).catch(() => 0),
  ]);
  const base = type === "POST" ? BLOG_CATEGORIES : type === "HELP" ? HELP_TOPICS.map((t) => t.key) : [];
  const used = entries.map((e) => e.category ?? "").filter(Boolean);
  const tagCount = new Map<string, number>();
  for (const e of entries) for (const t of e.tags ?? []) tagCount.set(t, (tagCount.get(t) ?? 0) + 1);
  let host = "palletport.com";
  try {
    host = new URL(await requestSiteUrl()).host;
  } catch {
    /* keep default */
  }
  return {
    typeLabel: CONTENT_TYPE_INFO[type].label,
    basePath: CONTENT_TYPE_INFO[type].basePath,
    siteHost: host,
    siteName: SITE_NAME,
    categories: [...new Set([...base, ...used])],
    tags: [...tagCount.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t),
    authors: Object.entries(AUTHORS).map(([key, a]) => ({ key, name: a.name })),
    collections: COLLECTIONS.map((c) => ({ slug: c.slug, title: c.title })),
    lotCategories,
    slugs: entries.filter((e) => e.id !== currentId).map((e) => e.slug),
    canDelete: !codeContent(type).length || dbCount > 1,
  };
}
