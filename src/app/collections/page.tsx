import Link from "next/link";
import { db } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import { Photo } from "@/components/Photo";
import { COLLECTION_PHOTOS, photoFor } from "@/content/photos";
import { NextIcon } from "@/components/Icons";
import { pageMetadata } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => pageMetadata({
  title: "Curated liquidation pallet collections",
  description:
    "Curated groups of liquidation lots for specific store types, budgets and seasons: bin store starters, pallets under $1,000, truckloads and more.",
  path: "/collections",
});
export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const { t, lh } = await getI18n();
  const counts = await Promise.all(COLLECTIONS.map((c) => db.lot.count({ where: { ...c.where, status: "ACTIVE" } })));
  return (
    <div className="container-pp py-10">
      <h1 className="font-display text-3xl font-bold">{t("Collections")}</h1>
      <p className="mb-8 text-muted">{t("Curated groups of lots for specific store types, budgets and seasons.")}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {COLLECTIONS.map((c, i) => (
          <Link key={c.slug} href={lh(`/collections/${c.slug}`)} className="group card overflow-hidden">
            <Photo photo={photoFor(c.slug, COLLECTION_PHOTOS)} width={400} ratio={4 / 3} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw" className="aspect-[4/3] w-full" />
            <div className="p-4">
              <p className="font-display text-lg font-bold group-hover:text-signal-dark">{t(c.title)}</p>
              <p className="text-sm text-muted">{t(c.tagline)}</p>
              <p className="mt-2 text-xs font-semibold">{t(counts[i] === 1 ? "{n} lot" : "{n} lots", { n: counts[i] })}<NextIcon /></p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
