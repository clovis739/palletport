/**
 * Shared media-library types and helpers (pure, client-safe). Used by src/app/actions/media.ts,
 * the /dashboard/media page and <MediaPicker>.
 */

export const MEDIA_PAGE_SIZE = 48;
// 4 MB: Vercel rejects request bodies over 4.5 MB, and each upload is one request.
export const MEDIA_MAX_MB = 4;
export const MEDIA_MAX_UPLOAD_BYTES = MEDIA_MAX_MB * 1024 * 1024;
export const ALT_MAX = 300;

export const MEDIA_TYPE_FILTERS = [
  { value: "", label: "All types" },
  { value: "jpg", label: "JPG" },
  { value: "png", label: "PNG" },
  { value: "webp", label: "WebP" },
  { value: "gif", label: "GIF" },
] as const;
export type MediaTypeFilter = "" | "jpg" | "png" | "webp" | "gif";

export const MEDIA_MIME: Record<Exclude<MediaTypeFilter, "">, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export const MEDIA_SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "largest", label: "Largest first" },
] as const;
export type MediaSort = "newest" | "oldest" | "largest";

export type MediaQuery = { q?: string; type?: MediaTypeFilter; missingAlt?: boolean; sort?: MediaSort; cursor?: string | null };

/** A Media row as sent to the browser. */
export type MediaItem = {
  id: string;
  url: string;
  filename: string;
  mime: string;
  ext: string;
  size: number;
  width: number | null;
  height: number | null;
  alt: string;
  createdAt: string; // ISO
  uploadedBy: string | null;
  /** Number of pages / settings that reference the URL. */
  uses: number;
};

export type MediaPage = { items: MediaItem[]; nextCursor: string | null; total: number; canUpload: boolean; error?: string };

export type MediaUsage = { kind: "content" | "setting"; id: string; label: string; sub: string; href: string };

/** Lightweight info the picker shows under a selection. */
export type MediaMeta = { url: string; alt: string; width: number | null; height: number | null; filename: string; size: number };

export function normalizeQuery(q: Partial<Record<string, unknown>>): Required<Omit<MediaQuery, "cursor">> {
  const type = String(q.type ?? "");
  const sort = String(q.sort ?? "");
  return {
    q: String(q.q ?? "").trim().slice(0, 100),
    type: (["jpg", "png", "webp", "gif"].includes(type) ? type : "") as MediaTypeFilter,
    missingAlt: q.missingAlt === true || q.missingAlt === "1" || q.missingAlt === "true",
    sort: (["newest", "oldest", "largest"].includes(sort) ? sort : "newest") as MediaSort,
  };
}

export function extOf(mime: string, url = "") {
  const m = Object.entries(MEDIA_MIME).find(([, v]) => v === mime);
  return m ? m[0] : (url.split(".").pop() ?? "").toLowerCase();
}

export function formatBytes(n: number) {
  if (!Number.isFinite(n) || n <= 0) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

export function formatDims(w: number | null | undefined, h: number | null | undefined) {
  return w && h ? `${w} × ${h}` : "";
}

export function formatDate(iso: string) {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}
