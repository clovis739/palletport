import { LotBrowser, type SearchParams } from "@/components/browse/LotBrowser";
import { db } from "@/lib/db";
import { pageMetadata } from "@/lib/seo";

const LOTS_META = {
  title: "Liquidation lots for sale: pallets, truckloads & case packs",
  description:
    "Browse available pallets, truckloads and case packs at fixed prices. Review each listing for its condition, location, photos and available inventory.",
};

type Props = { searchParams: Promise<SearchParams> };

/**
 * Filtered views are canonical to /lots, except a view filtered ONLY by one category, which duplicates the
 * dedicated category page — that one points at /c/<slug>.
 */
export async function generateMetadata({ searchParams }: Props) {
  const sp = await searchParams;
  const active = Object.entries(sp).filter(([, v]) => (Array.isArray(v) ? v.some(Boolean) : Boolean(v)));
  let path = "/lots";
  if (active.length === 1 && active[0][0] === "category" && typeof active[0][1] === "string" && /^[a-z0-9-]+$/.test(active[0][1])) {
    const cat = await db.category.findUnique({ where: { slug: active[0][1] }, select: { slug: true } });
    if (cat) path = `/c/${cat.slug}`;
  }
  return pageMetadata({ ...LOTS_META, path });
}

export default async function LotsPage({ searchParams }: Props) {
  return <LotBrowser sp={await searchParams} guide="lots" />;
}
