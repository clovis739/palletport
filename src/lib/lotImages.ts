// Lot photos: real uploads when the lot has them, otherwise a category stock photo that the UI labels as such.
import { projectImageUrl } from "./project-image-cdn";
import { CATEGORY_POOLS, LOT_TOPICS, PHOTOS, photoSrc, type StockPhoto } from "@/content/photos";
import { cleanProductPhotos } from './product-photos';

export const MAX_LOT_PHOTOS = 10;

export type LotImage = { src: string; alt: string; stock: boolean; sourceSrc?: string };

export function parseImages(images?: string | null): string[] {
  return cleanProductPhotos(images);
}

/** Stable number for a lot: the "-<n>" suffix on seeded slugs, otherwise a hash of the slug. */
function lotNumber(slug: string) {
  const m = slug.match(/-(\d+)$/);
  if (m) return Number(m[1]);
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** Photos that match the lot's title (falls back to its category), rotated so neighbouring lots differ. */
function stockFor(slug: string, title: string, categorySlug?: string): StockPhoto[] {
  const topic = LOT_TOPICS.find((t) => t.keywords.test(title));
  const candidates = topic?.photos ?? (CATEGORY_POOLS[categorySlug ?? ""] ?? CATEGORY_POOLS["general-merchandise"]).map((k) => PHOTOS[k]);
  const pool = [...new Map(candidates.map(photo => [photo.id, photo])).values()];
  const start = lotNumber(slug) % pool.length;
  return [...pool.slice(start), ...pool.slice(0, start)];
}

type LotLike = { slug: string; title: string; images?: string | null; category?: { slug?: string } | null };

const MAX_ALT = 125;

/** "<title> — photo 2 of 5", with the title shortened (on a word boundary) so the whole alt stays within 125 chars. */
function uploadAlt(title: string, i: number, n: number) {
  const suffix = ` — photo ${i + 1} of ${n}`;
  const room = MAX_ALT - suffix.length;
  let t = title.trim().replace(/\s+/g, " ");
  if (t.length > room) {
    t = t.slice(0, room - 1);
    const sp = t.lastIndexOf(" ");
    if (sp > room / 2) t = t.slice(0, sp);
    t = t.replace(/[\s,;:—-]+$/, "") + "…";
  }
  return t + suffix;
}

/** All photos for a lot's gallery. Stock photos are cropped by the CDN to `ratio` (width / height). */
export function lotImages(lot: LotLike, width = 1200, ratio = 16 / 10): LotImage[] {
  const real = parseImages(lot.images);
  if (real.length) return real.map((src, i) => ({ src: projectImageUrl(src), sourceSrc: src, alt: uploadAlt(lot.title, i, real.length), stock: false }));
  return stockFor(lot.slug, lot.title, lot.category?.slug).map((ph) => ({ src: projectImageUrl(photoSrc(ph, width, ratio)), sourceSrc: ph.src, alt: ph.alt, stock: true }));
}

/** Cover photo for cards, cart and checkout thumbnails. */
export function lotCover(lot: LotLike, width = 640, ratio = 16 / 10): LotImage {
  return lotImages(lot, width, ratio)[0];
}
