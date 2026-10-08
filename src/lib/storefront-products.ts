import "server-only";
import { cache } from "react";
import { db } from "./db";
import { cachedPublic } from "./public-cache";
import type { Prisma } from "@prisma/client";

/** Only fields rendered on a product card; no descriptions, manifests or supplier data. */
export const CARD_SELECT = {
  id: true, slug: true, title: true, condition: true, priceCents: true, compareAtPriceCents: true, msrpCents: true,
  units: true, palletCount: true, shipsFrom: true, status: true, lotSize: true,
  available: true, images: true, brand: true,
  category: { select: { hue: true, name: true, slug: true } },
  seller: { select: { name: true, verified: true } },
} as const;

export const getHomeInventory = cachedPublic(() => db.lot.findMany({
  where: { status: "ACTIVE" },
  select: { id: true, priceCents: true, msrpCents: true, createdAt: true, lotSize: true },
  orderBy: [{ createdAt: "desc" }, { id: "desc" }],
}), "home-inventory", 60);

export const getPublicCards = cachedPublic((ids: string[]) => db.lot.findMany({
  where: { id: { in: ids }, status: { in: ["ACTIVE", "SOLD_OUT"] } }, select: CARD_SELECT,
}), "product-cards", 60);

export const getRecentlySoldCards = cachedPublic(() => db.lot.findMany({
  where: { status: "SOLD_OUT" }, select: CARD_SELECT, orderBy: [{ createdAt: "desc" }, { id: "desc" }], take: 4,
}), "recently-sold", 60);

export const getRelatedCards = cachedPublic((categoryId: string, lotId: string) => db.lot.findMany({
  where: { categoryId, status: "ACTIVE", NOT: { id: lotId } }, select: CARD_SELECT,
  orderBy: [{ featured: "desc" }, { createdAt: "desc" }, { id: "desc" }], take: 4,
}), "related-products", 60);

const SORT_ORDER: Record<string, Prisma.LotOrderByWithRelationInput[]> = {
  new: [{ createdAt: "desc" }, { id: "desc" }],
  price_asc: [{ priceCents: "asc" }, { id: "asc" }],
  price_desc: [{ priceCents: "desc" }, { id: "asc" }],
  popular: [{ views: "desc" }, { id: "asc" }],
  retail: [{ msrpCents: "desc" }, { id: "asc" }],
  units: [{ units: "desc" }, { id: "asc" }],
};

export const getBrowseProducts = cachedPublic(async (where: Prisma.LotWhereInput, sort: string, requestedPage: number) => {
  const perPage = 24;
  // Prisma cannot order by price / retail directly. Fetch only three small fields
  // for that sort, then fetch card data for the selected page, preserving its order.
  if (sort === "value") {
    const summaries = await db.lot.findMany({ where, select: { id: true, priceCents: true, msrpCents: true }, orderBy: { id: "asc" } });
    summaries.sort((a, b) => a.priceCents / a.msrpCents - b.priceCents / b.msrpCents);
    const total = summaries.length;
    const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / perPage)));
    const ids = summaries.slice((page - 1) * perPage, page * perPage).map(l => l.id);
    const rows = ids.length ? await db.lot.findMany({ where: { AND: [where, { id: { in: ids } }] }, select: CARD_SELECT }) : [];
    const byId = new Map(rows.map(l => [l.id, l]));
    return { total, page, lots: ids.flatMap(id => { const row = byId.get(id); return row ? [row] : []; }) };
  }
  const total = await db.lot.count({ where });
  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / perPage)));
  const lots = await db.lot.findMany({ where, select: CARD_SELECT, orderBy: SORT_ORDER[sort] ?? SORT_ORDER.new, skip: (page - 1) * perPage, take: perPage });
  return { total, page, lots };
}, "browse-products", 60);

/** Shared by product HTML and metadata; personalized queries stay outside this cache. */
export const getPublicLot = cache(cachedPublic((slug: string) => db.lot.findUnique({
  where: { slug, status: { not: "DRAFT" } },
  include: {
    category: true, subcategory: true,
    seller: { include: { _count: { select: { lots: { where: { status: "ACTIVE" } }, reviews: true } } } },
    manifest: { orderBy: { unitMsrpCents: "desc" } },
    _count: { select: { favorites: true } },
    orderItems: { orderBy: { order: { createdAt: "desc" } }, take: 1, select: { order: { select: { createdAt: true } } } },
  },
}), "product-detail", 60));
