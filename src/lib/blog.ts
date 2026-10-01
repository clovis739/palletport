import "server-only";
import { cache } from "react";
import { AUTHORS, BLOG_CATEGORIES } from "@/content/blog";
import type { Article } from "@/content/types";
import { BLOG_PHOTOS, photoSrc } from "@/content/photos";
import { resolveImageRef } from "@/lib/imageRef";
import { blocksFaq, blocksToc, readMinutes } from "@/lib/blocks";
import { getPost as getPostEntry, getPublishedPosts, type ContentArticle } from "@/lib/content";

/**
 * Blog helpers on top of src/lib/content.ts (DB entries with the TS fallback). Server only.
 * Posts are `ContentArticle`s: use `post.blocks` for the body (render with <Blocks>).
 */

export const slugifyText = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const categorySlug = (c: string) => slugifyText(c);

/** Published posts, newest first. */
export const allPosts = cache(async (): Promise<ContentArticle[]> => getPublishedPosts());

/** One post (published; drafts too with `preview` — check staff permissions first). */
export function getPost(slug: string, opts?: { preview?: boolean }) {
  return getPostEntry(slug, opts);
}

/** The built-in categories followed by any extra categories used by published posts. */
export const blogCategories = cache(async (): Promise<string[]> => {
  const extra = (await allPosts()).map((p) => p.category ?? "").filter((c) => c && !BLOG_CATEGORIES.includes(c));
  return [...BLOG_CATEGORIES, ...new Set(extra)];
});

export async function categoryFromSlug(slug: string) {
  return (await blogCategories()).find((c) => categorySlug(c) === slug);
}

/** Byline. Unknown author keys fall back to the editorial team. */
export function authorOf(p: Pick<Article, "author">) {
  return AUTHORS[p.author ?? "team"] ?? AUTHORS.team;
}

export const allTags = cache(async () => {
  const count = new Map<string, number>();
  for (const p of await allPosts()) for (const t of p.tags ?? []) count.set(t, (count.get(t) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]);
});

/** Posts sharing a category or tag, most overlap first. */
export async function relatedPosts(post: Article, n = 3) {
  return (await allPosts())
    .filter((p) => p.slug !== post.slug)
    .map((p) => ({ p, score: (p.category === post.category ? 2 : 0) + (p.tags ?? []).filter((t) => post.tags?.includes(t)).length }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.p);
}

export async function neighbours(slug: string) {
  const list = await allPosts();
  const i = list.findIndex((p) => p.slug === slug);
  return { newer: i > 0 ? list[i - 1] : undefined, older: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined };
}

export function formatDate(d?: string, style: "medium" | "long" = "medium") {
  return d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { dateStyle: style }) : "";
}

/** Cover image ref of a post: the editor's cover, else the built-in photo for the slug (else a default). */
export function postCover(p: { slug: string; meta?: { cover?: string } }): string {
  return p.meta?.cover || BLOG_PHOTOS[p.slug] || "warehouseBoxes";
}

/** Absolute-or-root-relative URL + alt for an image ref (for Open Graph / JSON-LD images). */
export function imageRefUrl(ref: string | undefined, width = 1200): { url: string; alt?: string } | undefined {
  const r = resolveImageRef(ref);
  if (r.kind === "stock") return { url: photoSrc(r.photo, width), alt: r.photo.alt };
  if (r.kind === "url") return { url: r.src };
  return undefined;
}

/** Minutes to read: the stored value, else computed from the blocks. */
export function postReadMins(p: { readMins?: number; blocks?: ContentArticle["blocks"] }) {
  return p.readMins ?? (p.blocks ? readMinutes(p.blocks) : 1);
}

/** Inline link syntax used in body text: `[label](/path)` or `[label](https://…)`. */
export const INLINE_LINK = /\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]*)\)/g;

/** Plain text with inline link markup reduced to its label (for JSON-LD and other text-only uses). */
export const stripInlineLinks = (s: string) => s.replace(INLINE_LINK, "$1");

/** Visible FAQ items in a post body (questions and answers as plain text). */
export function postFaq(p: ContentArticle) {
  return blocksFaq(p.blocks);
}

/** "On this page" entries (H2 blocks). */
export function postToc(p: ContentArticle) {
  return blocksToc(p.blocks);
}

export { AUTHORS };
