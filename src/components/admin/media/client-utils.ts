/**
 * Browser helpers for the media library (upload preparation, clipboard). Only call from client components.
 */
import { MEDIA_MAX_MB, MEDIA_MAX_UPLOAD_BYTES } from "./types";

const MAX_EDGE = 2400;
const SMALL_ENOUGH = 500_000; // leave files alone below this size when they're also ≤ MAX_EDGE
const QUALITY = 0.85;

export const ACCEPT = "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif";

function toBlob(canvas: HTMLCanvasElement, type: string) {
  return new Promise<Blob | null>((r) => canvas.toBlob(r, type, QUALITY));
}

function kindOf(file: File): "jpeg" | "png" | "webp" | "gif" | null {
  const t = file.type.toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") return "jpeg";
  if (t === "image/png" || t === "image/webp" || t === "image/gif") return t.slice(6) as "png" | "webp" | "gif";
  // Some browsers/OSes leave the type empty: fall back to the extension (the server sniffs bytes anyway).
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "jpg" || ext === "jpeg") return "jpeg";
  if (ext === "png" || ext === "webp" || ext === "gif") return ext;
  return null;
}

/** Friendly reason a file can't be uploaded, or null when it's fine (size is checked after optimizing). */
export function rejectReason(file: File): string | null {
  if (!kindOf(file)) {
    const ext = file.name.includes(".") ? file.name.split(".").pop()!.toUpperCase() : "This file type";
    return `${ext === "SVG" ? "SVG images" : `${ext} files`} can't be uploaded. Use JPG, PNG, WebP or GIF.`;
  }
  return null;
}

export function tooLarge(file: File) {
  return file.size > MEDIA_MAX_UPLOAD_BYTES ? `Too large (${(file.size / 1024 / 1024).toFixed(1)} MB). The limit is ${MEDIA_MAX_MB} MB.` : null;
}

/**
 * Shrinks big JPEG/PNG/WebP images in the browser before upload: longest edge capped at 2400px, re-encoded
 * as WebP where the browser supports encoding it (Safari silently returns PNG for unsupported types, so we
 * check blob.type). JPEGs fall back to JPEG; PNGs stay PNG (keeps transparency). GIFs are never touched
 * (animation). Keeps the original when re-encoding would not make it smaller.
 */
export async function prepareImage(file: File): Promise<File> {
  const kind = kindOf(file);
  if (!kind || kind === "gif" || typeof createImageBitmap !== "function") return file;
  try {
    const bmp = await createImageBitmap(file);
    const longEdge = Math.max(bmp.width, bmp.height);
    if (file.size <= SMALL_ENOUGH && longEdge <= MAX_EDGE) {
      bmp.close();
      return file;
    }
    const scale = Math.min(1, MAX_EDGE / longEdge);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bmp.width * scale));
    canvas.height = Math.max(1, Math.round(bmp.height * scale));
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    let blob = await toBlob(canvas, "image/webp");
    let ext = "webp";
    if (!blob || blob.type !== "image/webp") {
      if (kind === "png") {
        blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"));
        ext = "png";
      } else {
        blob = await toBlob(canvas, "image/jpeg");
        ext = "jpg";
      }
    }
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], `${file.name.replace(/\.\w+$/, "") || "image"}.${ext}`, { type: blob.type });
  } catch {
    return file;
  }
}

/** Copies text to the clipboard; falls back to a hidden textarea + execCommand on older/insecure contexts. */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.style.top = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  } catch {
    return false;
  }
}

/** Absolute URL for a site-relative media path (what people paste into emails or other tools). */
export function absoluteUrl(url: string) {
  if (typeof window === "undefined" || !url.startsWith("/")) return url;
  return window.location.origin + url;
}
