import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Media } from "@prisma/client";
import { isBlobUrl } from "./mediaUrls";

// Where uploaded files go:
// - Vercel Blob when BLOB_READ_WRITE_TOKEN is set (production on Vercel: add a Blob store in the project's
//   Storage tab and the token is set for you). Files: lots/<file> and media/<file>, public URLs.
// - Otherwise the local disk (development): <project>/uploads/lots → /media/lots/[file],
//   <project>/uploads/media → /media/lib/[file]. (Files written to public/ after a build aren't served.)
// Vercel's servers can't keep files on disk, so uploads there require the Blob store.
const useBlob = () => !!process.env.BLOB_READ_WRITE_TOKEN;

/** Message when a deployment has nowhere to keep uploads (Vercel without a Blob store). */
function storageMissing(): string | null {
  return !useBlob() && process.env.VERCEL ? "Photo storage isn't set up yet: add a Blob store in Vercel → Storage, then redeploy." : null;
}

async function storeFile(folder: "lots" | "media", name: string, buf: Buffer, contentType: string, diskDir: string, diskPrefix: string) {
  if (useBlob()) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`${folder}/${name}`, buf, { access: "public", contentType, addRandomSuffix: false });
    return blob.url;
  }
  await mkdir(diskDir, { recursive: true });
  await writeFile(path.join(diskDir, name), buf);
  return diskPrefix + name;
}

async function removeBlob(url: string) {
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
  if (isBlobUrl(url)) return removeBlob(url);
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
export const MEDIA_MAX_BYTES = 4 * 1024 * 1024; // matches MEDIA_MAX_MB (Vercel request limit is 4.5 MB)
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
  if (isBlobUrl(m.url)) await removeBlob(m.url);
  else if (m.url.startsWith(MEDIA_LIB_PREFIX)) {
    const name = m.url.slice(MEDIA_LIB_PREFIX.length);
    if (MEDIA_FILE_NAME.test(name)) await unlink(path.join(MEDIA_DIR, name)).catch(() => {});
  }
  return m;
}
