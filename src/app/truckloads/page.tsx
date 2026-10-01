import { LotBrowser, type SearchParams } from "@/components/browse/LotBrowser";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Liquidation truckloads of 18–26 pallets",
  description:
    "Full-trailer liquidation truckloads of 18–26 manifested pallets for bin stores, discount chains, wholesalers and exporters. Freight quoted by ZIP.",
  path: "/truckloads",
});

export default async function TruckloadsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return <LotBrowser sp={await searchParams} basePath="/truckloads" fixed={{ size: "TRUCKLOAD" }} heading="Truckloads" guide="truckloads" />;
}
