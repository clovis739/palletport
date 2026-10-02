import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type { Media } from "@prisma/client";
import { isBlobUrl, isCloudinaryUrl } from "./mediaUrls";

// Where uploaded files go (first one configured wins):
// 1. Cloudinary when CLOUDINARY_URL (cloudinary://KEY:SECRET@CLOUD) or CLOUDINARY_CLOUD_NAME + CLOUDINARY_API_KEY +
//    CLOUDINARY_API_SECRET are set. Files go to <CLOUDINARY_FOLDER or "palletport">/lots and /media, public CDN URLs.
//    Recommended for Netlify (photos load from Cloudinary, so they don't use the site's own bandwidth).
// 2. Vercel Blob when BLOB_READ_WRITE_TOKEN is set. Files: lots/<file> and media/<file>, public URLs.
// 3. Otherwise the local disk (development): <project>/uploads/lots → /media/lots/[file],
//    <project>/uploads/media → /media/lib/[file]. (Files written to public/ after a build aren't served.)
// Hosted servers (Netlify, Vercel) can't keep files on disk, so uploads there need 1 or 2.

type CloudinaryCfg = { cloud: string; key: string; secret: string; folder: string };

function cloudinaryCfg(): CloudinaryCfg | null {
  const folder = (process.env.CLOUDINARY_FOLDER || "palletport").replace(/^\/+|\/+$/g, "");
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const m = url.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
    if (m) return { key: m[1], secret: m[2], cloud: m[3], folder };
  }
  const cloud = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const key = process.env.CLOUDINARY_API_KEY?.trim();
  const secret = process.env.CLOUDINARY_API_SECRET?.trim();
  return cloud && key && secret ? { cloud, key, secret, folder } : null;
}

const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const hosted = () => !!(process.env.NETLIFY || process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);

/** Message when a deployment has nowhere to keep uploads. */
function storageMissing(): string | null {
  if (cloudinaryCfg() || useBlob() || !hosted()) return null;
  return "Photo storage isn't set up yet: add your Cloudinary keys (CLOUDINARY_URL) in the hosting settings, then redeploy.";
}

/** Cloudinary signature: SHA-1 of the sorted params plus the API secret. */
function cloudinarySign(params: Record<string, string>, secret: string) {
  const base = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  return createHash("sha1").update(base + secret).digest("hex");
}

async function cloudinaryUpload(cfg: CloudinaryCfg, folder: string, name: string, buf: Buffer, contentType: string) {
  const params = { folder: `${cfg.folder}/${folder}`, public_id: name.replace(/\.[^.]+$/, ""), timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(buf)], { type: contentType }), name);
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", cfg.key);
  form.append("signature", cloudinarySign(params, cfg.secret));
  const res = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/image/upload`, { method: "POST", body: form, signal: AbortSignal.timeout(30000) });
  const data = (await res.json().catch(() => ({}))) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok || !data.secure_url) throw new Error(`Photo upload failed (${res.status})${data.error?.message ? `: ${data.error.message}` : ""}`);
  return data.secure_url;
}

/** public_id from a Cloudinary delivery URL: .../image/upload/[transforms/][v123/]<public_id>.<ext> */
function cloudinaryPublicId(url: string) {
  const m = new URL(url).pathname.match(/\/image\/upload\/(?:[^/]*,[^/]*\/)*(?:v\d+\/)?(.+)\.[a-z0-9]+$/i);
  return m ? decodeURIComponent(m[1]) : null;
}

async function cloudinaryDelete(url: string) {
  const cfg = cloudinaryCfg();
  const publicId = cfg && cloudinaryPublicId(url);
  if (!cfg || !publicId || !publicId.startsWith(`${cfg.folder}/`)) return;
  const params = { public_id: publicId, timestamp: String(Math.floor(Date.now() / 1000)) };
  const form = new FormData();
  for (const [k, v] of Object.entries(params)) form.append(k, v);
  form.append("api_key", cfg.key);
  form.append("signature", cloudinarySign(params, cfg.secret));
  await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cfg.cloud)}/image/destroy`, { method: "POST", body: form, signal: AbortSignal.timeout(15000) }).catch(() => {});
}

async function storeFile(folder: "lots" | "media", name: string, buf: Buffer, contentType: string, diskDir: string, diskPrefix: string) {
  const cfg = cloudinaryCfg();
  if (cfg) return cloudinaryUpload(cfg, folder, name, buf, contentType);
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${name}`, buf, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  await mkdir(diskDir, { recursive: true });
  await writeFile(path.join(diskDir, name), buf);
  return diskPrefix + name;
}

/** Deletes a file we stored remotely (Cloudinary or Vercel Blob). Local files are handled by the callers. */
async function removeBlob(url: string) {
  if (isCloudinaryUrl(url)) return cloudinaryDelete(url);
  if (!isBlobUrl(url) || !useBlob()) return;
  const { del } = await import("@vercel/blob");
  await del(url).catch(() => {});
}

const LOT_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" } as const;
export const UPLOAD_DIR = path.join(process.cwd(), "uploads", "lots");
export const MEDIA_PREFIX = "/media/lots/";
export const FILE_NAME = /^[a-z0-9-]{8,80}\.(jpg|png|webp)$/;
const MAX_BYTES = 8 * 1024 * 1024;

function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.subarray(0, 4).toString("ascii") === "RIFF" && buf.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

/** Validates and stores uploaded images. Returns public URLs, or an error message. */
export async function saveLotPhotos(files: File[], lotId: string): Promise<{ urls: string[]; error?: string }> {
  const real = files.filter((f) => f && typeof f === "object" && f.size > 0);
  if (!real.length) return { urls: [] };
  const missing = storageMissing();
  if (missing) return { urls: [], error: missing };
  const urls: string[] = [];
  for (const f of real) {
    if (f.size > MAX_BYTES) return { urls, error: `“${f.name}” is larger than 8 MB.` };
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = sniff(buf);
    if (!ext) return { urls, error: `“${f.name}” isn't a JPG, PNG or WebP image.` };
    const name = `${lotId.toLowerCase().replace(/[^a-z0-9]/g, "")}-${randomUUID().slice(0, 8)}.${ext}`;
    urls.push(await storeFile("lots", name, buf, LOT_TYPES[ext], UPLOAD_DIR, MEDIA_PREFIX));
  }
  return { urls };
}

export async function deleteLotPhoto(url: string) {
  if (isBlobUrl(url) || isCloudinaryUrl(url)) return removeBlob(url);
  if (!url.startsWith(MEDIA_PREFIX)) return;
  const name = url.slice(MEDIA_PREFIX.length);
  if (!FILE_NAME.test(name)) return;
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
}

// ---------------------------------------------------------------------------------------------
// Media library (admin): generic images stored in <project>/uploads/media, served by /media/lib/[file],
// one Media row per file. Lot photo functions above are unchanged.
// ---------------------------------------------------------------------------------------------

export const MEDIA_DIR = path.join(process.cwd(), "uploads", "media");
export const MEDIA_LIB_PREFIX = "/media/lib/";
export const MEDIA_FILE_NAME = /^[a-z0-9-]{8,100}\.(jpg|png|webp|gif)$/;
export const MEDIA_MAX_BYTES = 4 * 1024 * 1024; // matches MEDIA_MAX_MB (Vercel request limit is 4.5 MB, Netlify 6 MB)
export const MEDIA_TYPES = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", gif: "image/gif" } as const;
export type MediaExt = keyof typeof MEDIA_TYPES;

function sniffMedia(buf: Buffer): MediaExt | null {
  const lot = sniff(buf);
  if (lot) return lot;
  const head = buf.subarray(0, 6).toString("ascii");
  if (head === "GIF87a" || head === "GIF89a") return "gif";
  return null;
}

/** Reads pixel dimensions from the file header (JPEG SOF, PNG IHDR, GIF screen, WebP VP8/VP8L/VP8X). */
export function imageSize(buf: Buffer, ext: MediaExt): { width: number; height: number } | null {
  try {
    if (ext === "png") return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    if (ext === "gif") return { width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    if (ext === "webp") {
      const chunk = buf.subarray(12, 16).toString("ascii");
      if (chunk === "VP8X") return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
      if (chunk === "VP8L") {
        const b = buf.readUInt32LE(21);
        return { width: 1 + (b & 0x3fff), height: 1 + ((b >> 14) & 0x3fff) };
      }
      if (chunk === "VP8 ") return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
      return null;
    }
    // JPEG: walk markers to the first SOFn.
    let i = 2;
    while (i + 9 < buf.length) {
      if (buf[i] !== 0xff) return null;
      const marker = buf[i + 1];
      if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) { i += 2; continue; }
      const len = buf.readUInt16BE(i + 2);
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) };
      }
      i += 2 + len;
    }
  } catch {
    /* truncated header */
  }
  return null;
}

function safeBase(name: string) {
  const base = name.replace(/\.[^.]*$/, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60);
  return base || "image";
}

export type MediaUploader = { id: string } | null | undefined;

/**
 * Validates and stores uploaded images in the media library (JPG, PNG, WebP or GIF; ≤ 8 MB each; the type is
 * sniffed from the bytes, never trusted from the browser). Creates one Media row per file.
 * Stops at the first invalid file and returns what was saved so far plus an error message.
 * Callers must check permissions first (`requireStaff("media")`).
 */
export async function saveMedia(files: File[], user: MediaUploader, opts: { alt?: string } = {}) {
  const { db } = await import("./db");
  const real = files.filter((f) => f && typeof f === "object" && f.size > 0);
  const media: Media[] = [];
  if (!real.length) return { media };
  const missing = storageMissing();
  if (missing) return { media, error: missing };
  for (const f of real) {
    if (f.size > MEDIA_MAX_BYTES) return { media, error: `“${f.name}” is larger than 4 MB.` };
    const buf = Buffer.from(await f.arrayBuffer());
    const ext = sniffMedia(buf);
    if (!ext) return { media, error: `“${f.name}” isn't a JPG, PNG, WebP or GIF image.` };
    const file = `${safeBase(f.name)}-${randomUUID().slice(0, 8)}.${ext}`;
    const url = await storeFile("media", file, buf, MEDIA_TYPES[ext], MEDIA_DIR, MEDIA_LIB_PREFIX);
    const size = imageSize(buf, ext);
    media.push(
      await db.media.create({
        data: {
          url,
          filename: f.name.slice(0, 200) || file,
          mime: MEDIA_TYPES[ext],
          size: buf.length,
          width: size?.width ?? null,
          height: size?.height ?? null,
          alt: opts.alt ?? "",
          uploadedById: user?.id ?? null,
        },
      }),
    );
  }
  return { media };
}

/** Deletes a Media row and its file. Returns the deleted row (or null). */
export async function deleteMedia(id: string) {
  const { db } = await import("./db");
  const m = await db.media.findUnique({ where: { id } });
  if (!m) return null;
  await db.media.delete({ where: { id } });
  if (isBlobUrl(m.url) || isCloudinaryUrl(m.url)) await removeBlob(m.url);
  else if (m.url.startsWith(MEDIA_LIB_PREFIX)) {
    const name = m.url.slice(MEDIA_LIB_PREFIX.length);
    if (MEDIA_FILE_NAME.test(name)) await unlink(path.join(MEDIA_DIR, name)).catch(() => {});
  }
  return m;
}
