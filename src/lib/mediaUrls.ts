/**
 * Recognises uploaded-file URLs wherever they're stored. Pure module (safe in client components).
 *
 * Local development (no Blob token) stores files on disk and serves them at
 *   /media/lots/<file>   lot photos
 *   /media/lib/<file>    media library
 * On Vercel, files live in Vercel Blob under the same folders:
 *   https://<store>.public.blob.vercel-storage.com/lots/<file>
 *   https://<store>.public.blob.vercel-storage.com/media/<file>
 */

const BLOB_HOST = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\//i;

export function isBlobUrl(url: string) {
  return BLOB_HOST.test(url);
}

const CLOUDINARY = /^https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\//i;

/** A Cloudinary image (uploaded by the admin when Cloudinary is the photo storage). */
export function isCloudinaryUrl(url: string) {
  return CLOUDINARY.test(url);
}

/** Folder segment of an uploaded Cloudinary file: ".../<folder>/lots/<file>" → "lots". */
function cloudinaryKind(url: string) {
  return new URL(url).pathname.match(/\/(lots|media)\/[^/]+$/)?.[1];
}

/**
 * Display URL for an uploaded image. Cloudinary images are resized and served in the best format for the
 * browser (WebP/AVIF) — `width` is the largest size the page shows. Other URLs are returned unchanged.
 * Feeds and structured data should keep the original URL.
 */
export function displayImage(url: string, width?: number) {
  if (!url || !isCloudinaryUrl(url)) return url;
  const t = ["f_auto", "q_auto", ...(width ? ["c_limit", `w_${Math.round(Math.min(width, 2000))}`] : [])].join(",");
  return url.replace(/\/image\/upload\//, `/image/upload/${t}/`);
}

/** A lot photo we uploaded (disk, Vercel Blob or Cloudinary). */
export function isLotPhotoUrl(url: string) {
  return url.startsWith("/media/lots/") || (isBlobUrl(url) && new URL(url).pathname.startsWith("/lots/")) || (isCloudinaryUrl(url) && cloudinaryKind(url) === "lots");
}

/** A media library file we uploaded (disk, Vercel Blob or Cloudinary). */
export function isMediaLibUrl(url: string) {
  return url.startsWith("/media/lib/") || (isBlobUrl(url) && new URL(url).pathname.startsWith("/media/")) || (isCloudinaryUrl(url) && cloudinaryKind(url) === "media");
}
