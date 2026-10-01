/**
 * "Image refs" are how settings and content blocks point at a picture. A ref is either
 *   - a stock photo key from src/content/photos.ts (PHOTOS), e.g. "heroWarehouse", or
 *   - a media library URL ("/media/lib/<file>"), a lot photo URL ("/media/lots/<file>") or an absolute https URL.
 * Pure module: safe in client and server components. Render refs with <SiteImage> (src/components/content/SiteImage.tsx).
 */
import { PHOTOS, type PhotoKey, type StockPhoto } from "../content/photos";

export type ResolvedImage =
  | { kind: "stock"; key: PhotoKey; photo: StockPhoto }
  | { kind: "url"; src: string }
  | { kind: "none" };

export function isStockKey(ref: string): ref is PhotoKey {
  return Object.prototype.hasOwnProperty.call(PHOTOS, ref);
}

export function isImageUrl(ref: string) {
  return ref.startsWith("/") || /^https:\/\//i.test(ref);
}

export function resolveImageRef(ref: string | null | undefined): ResolvedImage {
  const r = (ref ?? "").trim();
  if (!r) return { kind: "none" };
  if (isStockKey(r)) return { kind: "stock", key: r, photo: PHOTOS[r] };
  if (isImageUrl(r)) return { kind: "url", src: r };
  return { kind: "none" };
}

/** All stock photo keys with their alt text (for image pickers). */
export function stockPhotoOptions() {
  return (Object.keys(PHOTOS) as PhotoKey[]).map((key) => ({ key, alt: PHOTOS[key].alt, id: PHOTOS[key].id }));
}
