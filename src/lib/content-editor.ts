/**
 * Block editor data model (pure, client-safe): the plain, serialisable shape the editor works with and the
 * helpers that convert a ContentArticle into it. Only *type* imports from content-model so client bundles
 * don't pull in the built-in TS articles.
 *
 * Used by src/app/dashboard/content/** (server), src/app/actions/content.ts and src/components/admin/editor/**.
 */
import type { Block } from "./blocks";
import type { ContentArticle, ContentStatus, ContentType } from "./content-model";

export type EditorMeta = {
  cover: string;
  hue?: number;
  /** Publish date (YYYY-MM-DD). LEGAL: effective date. */
  date: string;
  /** Last substantive revision (YYYY-MM-DD) — shows "Updated …" on posts. */
  updated: string;
  seoTitle: string;
  seoDescription: string;
  featured: boolean;
  noindex: boolean;
  /** GUIDE: recommended collection slug + lot category slugs for "popular lots". */
  collection: string;
  categories: string[];
};

export type EditorEntry = {
  id?: string;
  type: ContentType;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  tags: string[];
  author: string;
  status: ContentStatus;
  blocks: Block[];
  meta: EditorMeta;
  publishedAt: string | null;
  updatedAt: string | null;
};

export type SaveEntryResult = {
  ok?: string;
  error?: string;
  /** Field name → message (title, slug, excerpt, cover, seoTitle …). */
  fieldErrors?: Record<string, string>;
  /** Block id → message. */
  blockErrors?: Record<string, string>;
  entry?: EditorEntry;
  savedAt?: string;
};

export type EditorOptions = {
  typeLabel: string;
  basePath: string;
  siteHost: string;
  siteName: string;
  categories: string[];
  tags: string[];
  authors: { key: string; name: string }[];
  collections: { slug: string; title: string }[];
  lotCategories: { slug: string; name: string }[];
  /** Existing slugs of this type (client-side uniqueness hint; the server re-checks). */
  slugs: string[];
  canDelete: boolean;
};

export const SEO_TITLE_MAX = 60;
export const SEO_DESC_MAX = 155;
export const EXCERPT_MAX = 300;

export const todayIso = () => new Date().toISOString().slice(0, 10);

export function slugify(s: string) {
  return s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Deterministic ids for blocks without one (safe during SSR: no random values in render). */
export function withBlockIds(blocks: Block[], prefix = "b"): Block[] {
  const seen = new Set<string>();
  return blocks.map((b, i) => {
    let id = b.id && !seen.has(b.id) ? b.id : `${prefix}${i}`;
    while (seen.has(id)) id = `${id}x`;
    seen.add(id);
    return { ...b, id };
  });
}

export function emptyEntry(type: ContentType): EditorEntry {
  return {
    type,
    title: "",
    slug: "",
    excerpt: "",
    category: "",
    tags: [],
    author: type === "POST" ? "team" : "",
    status: "DRAFT",
    blocks: withBlockIds([{ type: "paragraph", text: "" }]),
    meta: { cover: "", hue: type === "GUIDE" ? 24 : undefined, date: "", updated: "", seoTitle: "", seoDescription: "", featured: false, noindex: false, collection: "", categories: [] },
    publishedAt: null,
    updatedAt: null,
  };
}

export function toEditorEntry(a: ContentArticle): EditorEntry {
  const m = a.meta ?? {};
  return {
    id: a.id,
    type: a.type,
    title: a.title,
    slug: a.slug,
    excerpt: a.excerpt ?? "",
    category: a.category ?? "",
    tags: a.tags ?? [],
    author: a.author ?? "",
    status: a.status,
    blocks: withBlockIds(a.blocks),
    meta: {
      cover: m.cover ?? "",
      hue: m.hue,
      date: m.date ?? a.date ?? "",
      updated: m.updated ?? "",
      seoTitle: m.seoTitle ?? "",
      seoDescription: m.seoDescription ?? "",
      featured: !!m.featured,
      noindex: !!m.noindex,
      collection: m.collection ?? "",
      categories: m.categories ?? [],
    },
    publishedAt: a.publishedAt ? a.publishedAt.toISOString() : null,
    updatedAt: a.updatedAt ? a.updatedAt.toISOString() : null,
  };
}
