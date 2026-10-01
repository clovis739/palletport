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

/** A lot photo we uploaded (disk or Blob). */
export function isLotPhotoUrl(url: string) {
  return url.startsWith("/media/lots/") || (isBlobUrl(url) && new URL(url).pathname.startsWith("/lots/"));
}

/** A media library file we uploaded (disk or Blob). */
export function isMediaLibUrl(url: string) {
  return url.startsWith("/media/lib/") || (isBlobUrl(url) && new URL(url).pathname.startsWith("/media/"));
}
