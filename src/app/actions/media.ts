"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCurrentUser, requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { deleteMedia, saveMedia } from "@/lib/uploads";
import { metaFor, queryMedia, toItems, usageMap, usageOf } from "@/app/dashboard/media/_lib/media-data";
import { ALT_MAX, type MediaItem, type MediaMeta, type MediaPage, type MediaQuery, type MediaUsage } from "@/components/admin/media/types";

/**
 * Media library actions. Mutations require the "media" permission and are audit-logged
 * (media.upload / media.update / media.delete). Read actions used by <MediaPicker> also accept
 * staff with "content" or "site" (they pick images but don't manage the library).
 * None of these call revalidatePath for admin pages (they're dynamic); callers refresh what they show.
 */

async function pickerUser() {
  const user = await getCurrentUser();
  if (!user || !(can(user.role, "media") || can(user.role, "content") || can(user.role, "site"))) return null;
  return user;
}

const querySchema = z
  .object({
    q: z.string().max(200).optional(),
    type: z.enum(["", "jpg", "png", "webp", "gif"]).optional(),
    missingAlt: z.boolean().optional(),
    sort: z.enum(["newest", "oldest", "largest"]).optional(),
    cursor: z.string().max(12).nullish(),
  })
  .strip();

/** One page (48 items) of the library. Pass the returned `nextCursor` back as `cursor` for "Load more". */
export async function listMediaAction(input: MediaQuery = {}): Promise<MediaPage> {
  const user = await pickerUser();
  if (!user) return { items: [], nextCursor: null, total: 0, canUpload: false, error: "You don't have access to the media library." };
  const parsed = querySchema.safeParse(input ?? {});
  if (!parsed.success) return { items: [], nextCursor: null, total: 0, canUpload: can(user.role, "media"), error: "Invalid search." };
  const page = await queryMedia(parsed.data);
  return { ...page, canUpload: can(user.role, "media") };
}

/** Pages and settings that reference a media URL. */
export async function mediaUsage(url: string): Promise<MediaUsage[]> {
  if (!(await pickerUser())) return [];
  const u = z.string().max(500).safeParse(url);
  return u.success ? usageOf(u.data) : [];
}

/** Alt text / dimensions for media URLs (picker selection caption). */
export async function mediaMetaAction(urls: string[]): Promise<MediaMeta[]> {
  if (!(await pickerUser())) return [];
  const parsed = z.array(z.string().max(500)).max(100).safeParse(urls);
  return parsed.success ? metaFor(parsed.data) : [];
}

export type UploadResult = { items: MediaItem[]; error?: string; ok?: string };

/** Uploads the `files` in the FormData (optional `alt` for all). The UI sends one file per call for per-file status. */
export async function uploadMediaAction(fd: FormData): Promise<UploadResult> {
  const { user } = await requireStaff("media", "/dashboard/media");
  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (!files.length) return { items: [], error: "Choose at least one image." };
  if (files.length > 20) return { items: [], error: "Upload up to 20 images at a time." };
  const alt = z.string().max(ALT_MAX).catch("").parse(String(fd.get("alt") ?? "")).trim();
  const { media, error } = await saveMedia(files, user, { alt });
  if (media.length) {
    await logAudit(user, "media.upload", media.map((m) => m.filename).join(", "), `${media.length} file${media.length === 1 ? "" : "s"}: ${media.map((m) => m.url).join(" ")}`);
  }
  const items = await toItems(media);
  return { items, error, ok: media.length ? `${media.length} image${media.length === 1 ? "" : "s"} uploaded` : undefined };
}

const altSchema = z.object({ id: z.string().min(1).max(40), alt: z.string().max(ALT_MAX, `Keep alt text under ${ALT_MAX} characters.`) });

export async function updateAltAction(input: { id: string; alt: string }): Promise<{ ok?: string; error?: string; item?: MediaItem }> {
  const { user } = await requireStaff("media", "/dashboard/media");
  const parsed = altSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid alt text." };
  const alt = parsed.data.alt.replace(/\s+/g, " ").trim();
  const existing = await db.media.findUnique({ where: { id: parsed.data.id } });
  if (!existing) return { error: "That image no longer exists." };
  if (existing.alt === alt) return { ok: "No changes", item: (await toItems([existing]))[0] };
  const row = await db.media.update({ where: { id: existing.id }, data: { alt } });
  await logAudit(user, "media.update", row.filename, `alt: “${existing.alt}” → “${alt}”`);
  return { ok: "Alt text saved", item: (await toItems([row]))[0] };
}

export type DeleteResult = { ok?: string; error?: string; deleted: string[]; inUse?: { id: string; filename: string; uses: number }[] };

const deleteSchema = z.object({ ids: z.array(z.string().min(1).max(40)).min(1).max(200), force: z.boolean().optional() });

/**
 * Deletes media rows + files. Refuses when any image is referenced by content or settings unless
 * `force` is true (the UI shows the warning first and then passes force).
 */
export async function bulkDeleteMediaAction(input: { ids: string[]; force?: boolean }): Promise<DeleteResult> {
  const { user } = await requireStaff("media", "/dashboard/media");
  const parsed = deleteSchema.safeParse(input);
  if (!parsed.success) return { deleted: [], error: "Nothing to delete." };
  const ids = [...new Set(parsed.data.ids)];
  const rows = await db.media.findMany({ where: { id: { in: ids } }, select: { id: true, url: true, filename: true } });
  const usage = await usageMap(rows.map((r) => r.url));
  const inUse = rows.map((r) => ({ id: r.id, filename: r.filename, uses: usage.get(r.url)?.length ?? 0 })).filter((r) => r.uses > 0);
  if (inUse.length && !parsed.data.force) {
    return {
      deleted: [],
      inUse,
      error: inUse.length === 1 ? `“${inUse[0].filename}” is used on the site. Confirm to delete it anyway.` : `${inUse.length} images are used on the site. Confirm to delete them anyway.`,
    };
  }
  const deleted: string[] = [];
  for (const r of rows) {
    const m = await deleteMedia(r.id);
    if (m) deleted.push(m.id);
  }
  if (deleted.length) {
    const names = rows.filter((r) => deleted.includes(r.id)).map((r) => r.filename);
    await logAudit(user, "media.delete", names.join(", "), `${deleted.length} file${deleted.length === 1 ? "" : "s"}${inUse.length ? `; ${inUse.length} were in use` : ""}: ${rows.map((r) => r.url).join(" ")}`);
    // Pages that showed a deleted image now point at a missing file: refresh the storefront cache.
    if (inUse.length) revalidatePath("/", "layout");
  }
  const missing = ids.length - deleted.length;
  return {
    deleted,
    ok: deleted.length ? `${deleted.length} image${deleted.length === 1 ? "" : "s"} deleted` : undefined,
    error: missing > 0 && !deleted.length ? "Those images were already deleted." : undefined,
  };
}

export async function deleteMediaAction(input: { id: string; force?: boolean }): Promise<DeleteResult> {
  return bulkDeleteMediaAction({ ids: [input?.id].filter(Boolean) as string[], force: input?.force });
}
