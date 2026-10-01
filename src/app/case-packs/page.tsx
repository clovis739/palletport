import { LotBrowser, type SearchParams } from "@/components/browse/LotBrowser";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Liquidation case packs shipped by parcel",
  description:
    "Small manifested liquidation lots shipped by parcel in sealed cartons: a low-risk way to test customer returns and overstock before you commit to pallets.",
  path: "/case-packs",
});

export default async function CasepacksPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <LotBrowser sp={await searchParams} basePath="/case-packs" fixed={{ size: "CASE" }} heading="Case packs" guide="case-packs" />;
}
