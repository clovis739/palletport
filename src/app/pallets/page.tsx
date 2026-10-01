import { LotBrowser, type SearchParams } from "@/components/browse/LotBrowser";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Manifested liquidation pallets for resale",
  description:
    "Manifested liquidation pallets shipped by LTL freight — customer returns, shelf pulls and overstock by the single pallet or a few at a time.",
  path: "/pallets",
});

export default async function PalletsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <LotBrowser sp={await searchParams} basePath="/pallets" fixed={{ size: "PALLET" }} heading="Pallets" guide="pallets" />;
}
