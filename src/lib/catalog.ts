import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { CATEGORY_HERO_PHOTOS, CATEGORY_PHOTOS, photoKeyFor } from "@/content/photos";
import { groupCategories } from "@/lib/taxonomy";

/**
 * Storefront reads of the catalogue tree (Admin → Categories). One query per request (React cache), ordered by
 * the owner's menu order. Hidden categories are left out of menus and lists but their pages still work.
 */

export const CATEGORY_ORDER = [{ position: "asc" as const }, { name: "asc" as const }];
export const SUBCATEGORY_ORDER = [{ position: "asc" as const }, { name: "asc" as const }];

export type CatalogCategory = Awaited<ReturnType<typeof loadCatalog>>[number];

async function loadCatalog() {
  const [cats, counts, subCounts] = await Promise.all([
    db.category.findMany({
      orderBy: CATEGORY_ORDER,
      select: {
        id: true,
        name: true,
        slug: true,
        blurb: true,
        hue: true,
        group: true,
        image: true,
        hidden: true,
        subcategories: { orderBy: SUBCATEGORY_ORDER, select: { id: true, name: true, slug: true } },
      },
    }),
    db.lot.groupBy({ by: ["categoryId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    db.lot.groupBy({ by: ["subcategoryId"], where: { status: "ACTIVE", NOT: { subcategoryId: null } }, _count: { _all: true } }),
  ]);
  const n = new Map(counts.map((c) => [c.categoryId, c._count._all]));
  const sn = new Map(subCounts.map((c) => [c.subcategoryId, c._count._all]));
  return cats.map((c) => ({
    ...c,
    lotCount: n.get(c.id) ?? 0,
    subcategories: c.subcategories.map((s) => ({ ...s, lotCount: sn.get(s.id) ?? 0 })),
  }));
}

/** Every category (hidden ones included) with subcategories and active-lot counts. */
export const getCatalog = cache(loadCatalog);

/** Visible categories only, in menu order. */
export const getVisibleCategories = cache(async () => (await getCatalog()).filter((c) => !c.hidden));

/** Visible categories grouped by department for mega-menus and the categories page. */
export const getCategoryGroups = cache(async () => groupCategories(await getVisibleCategories()));

/** Image ref for a category card/hero: the owner's upload, else the default stock photo for the slug. */
export function categoryImage(c: { slug: string; image?: string | null }, hero = false) {
  if (c.image) return c.image;
  return photoKeyFor(c.slug, hero ? { ...CATEGORY_PHOTOS, ...CATEGORY_HERO_PHOTOS } : CATEGORY_PHOTOS);
}

/** Distinct brands with active-lot counts, optionally within one category (for filters and the admin). */
export async function brandCounts(where: { categoryId?: string; subcategoryId?: string; activeOnly?: boolean } = {}) {
  const rows = await db.lot.groupBy({
    by: ["brand"],
    where: {
      NOT: { brand: "" },
      ...(where.activeOnly === false ? {} : { status: "ACTIVE" }),
      ...(where.categoryId ? { categoryId: where.categoryId } : {}),
      ...(where.subcategoryId ? { subcategoryId: where.subcategoryId } : {}),
    },
    _count: { _all: true },
  });
  return rows.map((r) => ({ brand: r.brand, count: r._count._all })).sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand));
}

/** Options for the admin lot form: the category tree (menu order), known brands and sources for suggestions. */
export async function lotFormOptions() {
  const [categories, brands, sources] = await Promise.all([
    db.category.findMany({
      orderBy: CATEGORY_ORDER,
      select: { id: true, name: true, group: true, subcategories: { orderBy: SUBCATEGORY_ORDER, select: { id: true, name: true } } },
    }),
    db.lot.findMany({ where: { NOT: { brand: "" } }, select: { brand: true }, distinct: ["brand"], orderBy: { brand: "asc" } }),
    db.lot.findMany({ where: { NOT: { source: "" } }, select: { source: true }, distinct: ["source"], orderBy: { source: "asc" } }),
  ]);
  return { categories, brands: brands.map((b) => b.brand), sources: sources.map((s) => s.source) };
}
