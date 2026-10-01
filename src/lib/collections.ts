import type { Prisma } from "@prisma/client";

export type Collection = {
  slug: string;
  title: string;
  tagline: string;
  hue: number;
  where: Prisma.LotWhereInput;
  orderBy?: Prisma.LotOrderByWithRelationInput;
};

// Curated, rule-based collections. Add or edit freely — pages are generated from this list.
export const COLLECTIONS: Collection[] = [
  { slug: "bin-store-starter", title: "Bin Store Starter Kit", tagline: "High-unit-count mixed pallets that fill tables fast.", hue: 24, where: { units: { gte: 150 }, condition: { in: ["CUSTOMER_RETURN", "MIXED"] } }, orderBy: { units: "desc" } },
  { slug: "under-1000", title: "Pallets Under $1,000", tagline: "Low-risk lots for first-time buyers and small shops.", hue: 150, where: { priceCents: { lte: 100000 } }, orderBy: { priceCents: "asc" } },
  { slug: "brand-new-overstock", title: "Brand-New Overstock", tagline: "Sealed retail inventory — list it online the day it lands.", hue: 215, where: { condition: "NEW" } },
  { slug: "truckloads", title: "Truckload Deals", tagline: "Multi-pallet lots for high-volume resellers and exporters.", hue: 0, where: { palletCount: { gte: 2 } }, orderBy: { palletCount: "desc" } },
  { slug: "flip-ready-electronics", title: "Flip-Ready Electronics", tagline: "New and shelf-pull tech that sells well on marketplaces.", hue: 250, where: { category: { slug: "electronics" }, condition: { in: ["NEW", "SHELF_PULL"] } } },
  { slug: "repair-and-refurb", title: "Repair & Refurb", tagline: "Salvage lots priced for technicians and parts resellers.", hue: 10, where: { condition: "SALVAGE" } },
  { slug: "holiday-ready", title: "Get Holiday-Ready", tagline: "Toys, decor and gifting stock to land before Q4 traffic.", hue: 330, where: { category: { slug: { in: ["toys-baby", "home-kitchen", "general-merchandise"] } } } },
  { slug: "staff-picks", title: "Staff Picks", tagline: "Lots our buying team would stock in their own stores.", hue: 90, where: { featured: true } },
];

export function getCollection(slug: string) {
  return COLLECTIONS.find((c) => c.slug === slug);
}
