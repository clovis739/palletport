import { LotBrowser, type SearchParams } from "@/components/browse/LotBrowser";
import { pageMetadata } from "@/lib/seo";

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  // The bare /search page is indexable; any parameterised result page is not (it would be thin/duplicate content).
  const hasParams = Object.values(sp).some((v) => v !== undefined && v !== "");
  return pageMetadata({
    title: q ? `Search: ${q.slice(0, 40)}` : "Search liquidation lots",
    description: "Search every liquidation lot by product, brand, SKU or category, then filter by condition, lot size and price.",
    path: "/search",
    noIndex: hasParams,
  });
}

// Search results page: every lot, with the full filter sidebar.
export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim();
  return <LotBrowser sp={sp} basePath="/search" heading={q ? `Results for “${q}”` : "Search all lots"} />;
}
