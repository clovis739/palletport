import type { MetadataRoute } from "next";
import { isLotPhotoUrl } from "@/lib/mediaUrls";
import { cleanProductPhotos } from "@/lib/product-photos";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { cachedPublic } from "@/lib/public-cache";
import { COLLECTIONS } from "@/lib/collections";
import { blogCategories, categorySlug } from "@/lib/blog";
import { getHelpArticles, getLegalPages, getPublishedGuides, getPublishedPages, getPublishedPosts, type ContentArticle } from "@/lib/content";
import { LATEST_ORDER_SELECT, SOLD_INDEX_DAYS, lotIndexable } from "@/lib/seo";
import { requestSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

type Entry = MetadataRoute.Sitemap[number];

/*
 * Protocol limits: 50,000 URLs and 50 MB (uncompressed) per sitemap file. One file is plenty today. When the
 * catalogue nears ~45k URLs, export `generateSitemaps()` from this file returning [{ id: 0 }, { id: 1 }, ...]
 * and accept `{ id }` in the default export to emit one chunk per id (e.g. static+content in id 0, lots paged
 * by createdAt in the rest). Next then serves /sitemap/<id>.xml — point robots.ts at each chunk (or a
 * sitemap index route) instead of /sitemap.xml.
 *
 * changefreq/priority are deliberately omitted (Google ignores them). lastModified is only set from a real
 * content change — never the generation time.
 */

// Only indexable, public pages. Private areas (cart, checkout, account, orders, dashboard, admin), auth
// pages, status/maintenance/offline screens, /search and parameterised/filtered URLs are deliberately left out.
// `listing` marks pages whose content is the live lot grid: their lastModified is the newest matching lot.
const STATIC: { path: string; listing?: Prisma.LotWhereInput }[] = [
  { path: "", listing: {} },
  { path: "/lots", listing: {} },
  { path: "/pallets", listing: { lotSize: "PALLET" } },
  { path: "/truckloads", listing: { lotSize: "TRUCKLOAD" } },
  { path: "/case-packs", listing: { lotSize: "CASE" } },
  { path: "/categories" },
  { path: "/collections" },
  { path: "/new", listing: {} },
  { path: "/trending" },
  { path: "/how-to-buy" },
  { path: "/how-it-works" },
  { path: "/help" },
  { path: "/guides" },
  { path: "/blog" },
  { path: "/about" },
  { path: "/liquidation-pallets-columbus-ohio" },
  { path: "/contact" },
  { path: "/pro" },
  { path: "/volume-buyers" },
  { path: "/affiliates" },
  { path: "/events" },
  { path: "/integrations" },
  { path: "/site-map" },
];

const date = (d?: string) => (d ? new Date(`${d}T12:00:00Z`) : undefined);
const later = (a: Date, b?: Date | null) => (b && b > a ? b : a);

/** Assigned product photos only (stock/fallback photos are never listed). */
const uploadedPhotos = (images: string, base: string) =>
  cleanProductPhotos(images)
    .filter((s) => isLotPhotoUrl(s) || /^\/images\/products\/(?:clean-)?[a-f0-9]{16}\.(?:webp|png)$/i.test(s))
    .map((s) => (s.startsWith("/") ? `${base}${s}` : s));

const getSitemapInventory = cachedPublic(async () => {
  const soldCutoff = new Date(Date.now() - SOLD_INDEX_DAYS * 86400000);
  // SOLD_OUT candidates: anything that could still be inside the window (lotIndexable() makes the final call).
  const lotWhere: Prisma.LotWhereInput = {
    OR: [
      { status: "ACTIVE" },
      { status: "SOLD_OUT", OR: [{ createdAt: { gte: soldCutoff } }, { orderItems: { some: { order: { createdAt: { gte: soldCutoff } } } } }] },
    ],
  };
  return Promise.all([
    db.lot.findMany({
      where: lotWhere,
      select: {
        id: true, slug: true, status: true, createdAt: true, images: true,
        category: { select: { slug: true } },
        orderItems: LATEST_ORDER_SELECT,
      },
    }),
    db.category.findMany({ where: { hidden: false }, select: { slug: true } }),
    Promise.all(
      STATIC.map((s) =>
        s.listing
          ? db.lot.findFirst({ where: { ...s.listing, status: "ACTIVE" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } })
          : null,
      ),
    ),
    Promise.all(
      COLLECTIONS.map((c) =>
        db.lot.findFirst({ where: { AND: [c.where, { status: "ACTIVE" }] }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      ),
    ),
  ] as const);
}, "sitemap-inventory", 300);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = await requestSiteUrl();

  // Content (DB entries, or the built-in TS content before import). Entries marked noindex are left out.
  const indexable = (list: ContentArticle[]) => list.filter((a) => !a.meta.noindex);
  const [posts, help, guides, legal, pages, blogCats] = await Promise.all([
    getPublishedPosts().then(indexable),
    getHelpArticles().then(indexable),
    getPublishedGuides().then(indexable),
    getLegalPages().then(indexable),
    getPublishedPages().then(indexable),
    blogCategories(),
  ]);

  const [candidates, categories, listingDates, collectionDates] = await getSitemapInventory();

  const now = Date.now();
  const lots = candidates.filter((l) => lotIndexable(l, now));

  // Category pages list active lots: lastModified = newest active lot in the category.
  const catUpdated = new Map<string, Date>();
  for (const l of lots) {
    if (l.status !== "ACTIVE") continue;
    const prev = catUpdated.get(l.category.slug);
    if (!prev || prev < l.createdAt) catUpdated.set(l.category.slug, l.createdAt);
  }
  const latestPost = posts.map((p) => p.updated ?? p.date ?? "").sort().pop();

  // Pages with a Spanish version (/es/…) are listed twice, each pointing at both languages (hreflang).
  const bilingual = (e: Entry): Entry[] => {
    const path = e.url.slice(base.length) || "/";
    const en = `${base}${path}`;
    const es = `${base}/es${path === "/" ? "" : path}`;
    const alternates = { languages: { "en-US": en, "es-US": es, "x-default": en } };
    return [{ ...e, url: en, alternates }, { ...e, url: es, alternates }];
  };

  const translated: Entry[] = [
    ...STATIC.map((s, i) => ({
      url: `${base}${s.path || "/"}`,
      lastModified: s.listing ? listingDates[i]?.createdAt : s.path === "/blog" ? date(latestPost) : undefined,
    })),
    ...categories.map((c) => ({ url: `${base}/c/${c.slug}`, lastModified: catUpdated.get(c.slug) })),
    ...COLLECTIONS.map((c, i) => ({ url: `${base}/collections/${c.slug}`, lastModified: collectionDates[i]?.createdAt })),
    ...lots.map((l) => {
      const images = uploadedPhotos(l.images, base);
      return {
        url: `${base}/lots/${l.slug}`,
        lastModified: later(l.createdAt, l.orderItems?.[0]?.order.createdAt),
        ...(images.length ? { images } : {}),
      };
    }),
  ].flatMap(bilingual);

  const out: Entry[] = [
    ...translated,
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: date(p.updated ?? p.date) })),
    ...blogCats.map((c) => ({ url: `${base}/blog/category/${categorySlug(c)}` })),
    ...help.map((h) => ({ url: `${base}/help/${h.slug}`, lastModified: date(h.updated ?? h.date) })),
    ...guides.map((g) => ({ url: `${base}/guides/${g.slug}`, lastModified: date(g.updated ?? g.date) })),
    ...legal.map((l) => ({ url: `${base}/legal/${l.slug}`, lastModified: date(l.updated ?? l.date) })),
    ...pages.map((pg) => ({ url: `${base}/p/${pg.slug}`, lastModified: date(pg.updated ?? pg.date) })),
  ];
  return [...new Map(out.map((entry) => [entry.url, entry])).values()];
}
