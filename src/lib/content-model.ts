/**
 * Content entry model shared by the server API (src/lib/content.ts), admin editors and prisma/seed.ts.
 * Pure module with relative imports only.
 *
 * A ContentEntry row stores JSON strings (tags, blocks, meta). `rowToArticle()` turns a row into a
 * ContentArticle — the same shape public pages use today (`Article` from src/content/types.ts, incl. the
 * legacy `body: Section[]`) plus `blocks` and admin fields.
 */
import { z } from "zod";
import type { Article } from "../content/types";
import { POSTS, AUTHORS } from "../content/blog";
import { GUIDES } from "../content/guides";
import { HELP } from "../content/help";
import { LEGAL } from "../content/legal";
import { BLOG_PHOTOS, GUIDE_PHOTOS } from "../content/photos";
import { blocksToSections, parseBlocks, sectionsToBlocks, type Block } from "./blocks";

export const CONTENT_TYPES = ["POST", "GUIDE", "HELP", "LEGAL", "PAGE"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const CONTENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const CONTENT_TYPE_INFO: Record<ContentType, { label: string; plural: string; basePath: string }> = {
  POST: { label: "Blog post", plural: "Blog posts", basePath: "/blog" },
  GUIDE: { label: "Guide", plural: "Guides", basePath: "/guides" },
  HELP: { label: "Help article", plural: "Help articles", basePath: "/help" },
  LEGAL: { label: "Legal page", plural: "Legal pages", basePath: "/legal" },
  PAGE: { label: "Page", plural: "Pages", basePath: "/p" },
};

export function isContentType(t: string): t is ContentType {
  return (CONTENT_TYPES as readonly string[]).includes(t);
}

/** Public URL of an entry. PAGE entries are served at /p/<slug> (route to be built by the content agent). */
export function entryPath(type: ContentType, slug: string) {
  return `${CONTENT_TYPE_INFO[type].basePath}/${slug}`;
}

/** Everything that isn't a column lives in `meta` (JSON). All optional. */
export const entryMetaSchema = z
  .object({
    /** Cover image ref: stock photo key or media URL (src/lib/imageRef.ts). Empty = the page's default photo. */
    cover: z.string().optional(),
    hue: z.number().optional(),
    readMins: z.number().optional(),
    /** ISO date (YYYY-MM-DD) shown as the publish date. */
    date: z.string().optional(),
    /** ISO date of the last substantive revision. */
    updated: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    featured: z.boolean().optional(),
    noindex: z.boolean().optional(),
    /** GUIDE: recommended collection slug and category slugs for "popular lots". */
    collection: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .passthrough();
export type EntryMeta = z.infer<typeof entryMetaSchema>;

export function parseMeta(json: string | null | undefined): EntryMeta {
  try {
    const r = entryMetaSchema.safeParse(JSON.parse(json || "{}"));
    return r.success ? r.data : {};
  } catch {
    return {};
  }
}

export function parseTags(json: string | null | undefined): string[] {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v.filter((t): t is string => typeof t === "string") : [];
  } catch {
    return [];
  }
}

/** Article as public pages consume it, plus blocks and admin fields. */
export type ContentArticle = Article & {
  type: ContentType;
  blocks: Block[];
  status: ContentStatus;
  meta: EntryMeta;
  /** "db" = ContentEntry row, "code" = TS fallback in src/content. */
  source: "db" | "code";
  id?: string;
  publishedAt?: Date | null;
  updatedAt?: Date;
  /** GUIDE only (mirrors src/content/guides.ts). */
  collection?: string;
  categories?: string[];
};

/** Minimal row shape (matches Prisma's ContentEntry). */
export type ContentRow = {
  id: string;
  type: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string;
  author: string;
  status: string;
  blocks: string;
  meta: string;
  publishedAt: Date | null;
  updatedAt: Date;
};

export function rowToArticle(row: ContentRow): ContentArticle {
  const blocks = parseBlocks(row.blocks);
  const meta = parseMeta(row.meta);
  const type = isContentType(row.type) ? row.type : "PAGE";
  return {
    id: row.id,
    type,
    source: "db",
    status: row.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category || undefined,
    tags: parseTags(row.tags),
    author: row.author || undefined,
    date: meta.date ?? (row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : undefined),
    updated: meta.updated,
    readMins: meta.readMins,
    hue: meta.hue,
    featured: meta.featured,
    collection: meta.collection,
    categories: meta.categories,
    meta,
    blocks,
    body: blocksToSections(blocks),
    publishedAt: row.publishedAt,
    updatedAt: row.updatedAt,
  };
}

type CodeArticle = Article & { collection?: string; categories?: string[] };

/** TS content (src/content/*) → ContentArticle, used as the fallback before content is imported. */
export function codeToArticle(type: ContentType, a: CodeArticle): ContentArticle {
  const meta = articleMeta(type, a);
  return { ...a, type, source: "code", status: "PUBLISHED", meta, blocks: sectionsToBlocks(a.body) };
}

function articleMeta(type: ContentType, a: CodeArticle): EntryMeta {
  const cover = type === "POST" ? BLOG_PHOTOS[a.slug] : type === "GUIDE" ? GUIDE_PHOTOS[a.slug] : undefined;
  const m: EntryMeta = {
    ...(cover ? { cover } : {}),
    ...(a.hue !== undefined ? { hue: a.hue } : {}),
    ...(a.readMins !== undefined ? { readMins: a.readMins } : {}),
    ...(a.date ? { date: a.date } : {}),
    ...(a.updated ? { updated: a.updated } : {}),
    ...(a.featured ? { featured: true } : {}),
    ...(a.collection ? { collection: a.collection } : {}),
    ...(a.categories ? { categories: a.categories } : {}),
  };
  return m;
}

/** The TS content for a type (PAGE has none). */
export function codeContent(type: ContentType): ContentArticle[] {
  const list: CodeArticle[] = type === "POST" ? POSTS : type === "GUIDE" ? GUIDES : type === "HELP" ? HELP : type === "LEGAL" ? LEGAL : [];
  return list.map((a) => codeToArticle(type, a));
}

/** Prisma create data for a TS article (used by importDefaultContent and the seed). */
export function articleToRowData(a: ContentArticle) {
  return {
    type: a.type,
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? "",
    category: a.category ?? "",
    tags: JSON.stringify(a.tags ?? []),
    author: a.author ?? "",
    status: "PUBLISHED",
    blocks: JSON.stringify(a.blocks),
    meta: JSON.stringify(a.meta),
    publishedAt: a.date ? new Date(`${a.date}T12:00:00Z`) : new Date(),
  };
}

/** Every TS article of every type, ready to insert. */
export function defaultContentRows() {
  return CONTENT_TYPES.flatMap((t) => codeContent(t)).map(articleToRowData);
}

export { AUTHORS };
