import "server-only";
import { isLotPhotoUrl, isMediaLibUrl } from "@/lib/mediaUrls";
import type { Media, Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { CONTENT_TYPE_INFO, isContentType } from "@/lib/content-model";
import { parseImages } from "@/lib/lotImages";
import { CI } from "@/lib/dbText";
import {
  MEDIA_MIME,
  MEDIA_PAGE_SIZE,
  extOf,
  normalizeQuery,
  type MediaItem,
  type MediaMeta,
  type MediaQuery,
  type MediaUsage,
} from "@/components/admin/media/types";

/**
 * Server-side queries for the media library (used by /dashboard/media and src/app/actions/media.ts).
 * Callers check permissions first.
 */

const SETTING_SCREENS: Record<string, { label: string; href: string }> = {
  home: { label: "Homepage", href: "/dashboard/site/homepage" },
  navigation: { label: "Navigation", href: "/dashboard/site/navigation" },
  about: { label: "About page", href: "/dashboard/site" },
  seo: { label: "SEO defaults", href: "/dashboard/site" },
  announcement: { label: "Announcement bar", href: "/dashboard/site" },
  business: { label: "Business profile", href: "/dashboard/site" },
};

type UsageIndex = {
  entries: { id: string; type: string; title: string; status: string; hay: string }[];
  settings: { key: string; hay: string }[];
};

async function usageIndex(): Promise<UsageIndex> {
  const [entries, settings] = await Promise.all([
    db.contentEntry.findMany({ select: { id: true, type: true, title: true, status: true, blocks: true, meta: true } }),
    db.siteSetting.findMany({ select: { key: true, value: true } }),
  ]);
  return {
    entries: entries.map((e) => ({ id: e.id, type: e.type, title: e.title, status: e.status, hay: `${e.blocks}\n${e.meta}` })),
    settings: settings.map((s) => ({ key: s.key, hay: s.value })),
  };
}

function usagesIn(idx: UsageIndex, url: string): MediaUsage[] {
  const out: MediaUsage[] = [];
  for (const e of idx.entries) {
    if (!e.hay.includes(url)) continue;
    const typeLabel = isContentType(e.type) ? CONTENT_TYPE_INFO[e.type].label : e.type;
    out.push({ kind: "content", id: e.id, label: e.title || "(untitled)", sub: `${typeLabel}${e.status === "DRAFT" ? " · Draft" : ""}`, href: `/dashboard/content/${e.id}` });
  }
  for (const s of idx.settings) {
    if (!s.hay.includes(url)) continue;
    const screen = SETTING_SCREENS[s.key] ?? { label: s.key, href: "/dashboard/site" };
    out.push({ kind: "setting", id: s.key, label: screen.label, sub: "Site settings", href: screen.href });
  }
  return out;
}

/** Where a media URL is referenced: content blocks/meta and site settings. */
export async function usageOf(url: string): Promise<MediaUsage[]> {
  if (!url) return [];
  return usagesIn(await usageIndex(), url);
}

/** Usage for many URLs with a single scan. */
export async function usageMap(urls: string[]): Promise<Map<string, MediaUsage[]>> {
  const map = new Map<string, MediaUsage[]>();
  if (!urls.length) return map;
  const idx = await usageIndex();
  for (const u of urls) map.set(u, usagesIn(idx, u));
  return map;
}

async function uploaderNames(ids: (string | null)[]) {
  const unique = [...new Set(ids.filter((x): x is string => !!x))];
  if (!unique.length) return new Map<string, string>();
  const users = await db.user.findMany({ where: { id: { in: unique } }, select: { id: true, name: true, email: true } });
  return new Map(users.map((u) => [u.id, u.name || u.email]));
}

export async function toItems(rows: Media[]): Promise<MediaItem[]> {
  const [names, usage] = await Promise.all([uploaderNames(rows.map((r) => r.uploadedById)), usageMap(rows.map((r) => r.url))]);
  return rows.map((m) => ({
    id: m.id,
    url: m.url,
    filename: m.filename,
    mime: m.mime,
    ext: extOf(m.mime, m.url),
    size: m.size,
    width: m.width,
    height: m.height,
    alt: m.alt,
    createdAt: m.createdAt.toISOString(),
    uploadedBy: m.uploadedById ? (names.get(m.uploadedById) ?? "Former staff member") : null,
    uses: usage.get(m.url)?.length ?? 0,
  }));
}

function whereFor(query: MediaQuery): Prisma.MediaWhereInput {
  const q = normalizeQuery(query);
  const and: Prisma.MediaWhereInput[] = [];
  // SQLite LIKE is case-insensitive for ASCII, so `contains` works as a friendly search.
  if (q.q) and.push({ OR: [{ filename: { contains: q.q, ...CI } }, { alt: { contains: q.q, ...CI } }, { url: { contains: q.q, ...CI } }] });
  if (q.type) and.push({ mime: MEDIA_MIME[q.type] });
  if (q.missingAlt) and.push({ alt: "" });
  return and.length ? { AND: and } : {};
}

function orderFor(sort: MediaQuery["sort"]): Prisma.MediaOrderByWithRelationInput[] {
  if (sort === "oldest") return [{ createdAt: "asc" }, { id: "asc" }];
  if (sort === "largest") return [{ size: "desc" }, { createdAt: "desc" }, { id: "desc" }];
  return [{ createdAt: "desc" }, { id: "desc" }];
}

/** One page (48) of the library. `cursor` is an opaque offset string returned as `nextCursor`. */
export async function queryMedia(query: MediaQuery, take = MEDIA_PAGE_SIZE) {
  const q = normalizeQuery(query);
  const skip = Math.max(0, Math.min(1_000_000, parseInt(query.cursor ?? "0", 10) || 0));
  const where = whereFor(q);
  const [rows, total] = await Promise.all([
    db.media.findMany({ where, orderBy: orderFor(q.sort), skip, take: take + 1 }),
    db.media.count({ where }),
  ]);
  const more = rows.length > take;
  const items = await toItems(more ? rows.slice(0, take) : rows);
  return { items, total, nextCursor: more ? String(skip + take) : null };
}

export async function storageSummary() {
  const [agg, missingAlt, byMime] = await Promise.all([
    db.media.aggregate({ _count: { _all: true }, _sum: { size: true } }),
    db.media.count({ where: { alt: "" } }),
    db.media.groupBy({ by: ["mime"], _count: { _all: true }, _sum: { size: true } }),
  ]);
  return {
    count: agg._count._all,
    bytes: agg._sum.size ?? 0,
    missingAlt,
    byType: byMime
      .map((m) => ({ ext: extOf(m.mime).toUpperCase(), count: m._count._all, bytes: m._sum.size ?? 0 }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Alt text, dimensions etc. for media URLs (for the picker's selection caption). */
export async function metaFor(urls: string[]): Promise<MediaMeta[]> {
  const list = [...new Set(urls.filter((u) => typeof u === "string" && isMediaLibUrl(u)))].slice(0, 100);
  if (!list.length) return [];
  const rows = await db.media.findMany({ where: { url: { in: list } }, select: { url: true, alt: true, width: true, height: true, filename: true, size: true } });
  return rows;
}

/** Lots with uploaded photos (for the read-only "Lot photos" tab). */
export async function lotPhotos(take = 120) {
  const lots = await db.lot.findMany({
    where: { images: { not: "" } },
    select: { id: true, title: true, status: true, images: true },
    orderBy: { createdAt: "desc" },
    take,
  });
  return lots
    .map((l) => ({ id: l.id, title: l.title, status: l.status, images: parseImages(l.images).filter((u) => isLotPhotoUrl(u)) }))
    .filter((l) => l.images.length > 0);
}
