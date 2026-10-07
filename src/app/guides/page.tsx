import Link from "next/link";
import { getPublishedGuides } from "@/lib/content";
import { SiteImage } from "@/components/content/SiteImage";
import { GUIDE_PHOTOS } from "@/content/photos";
import { pageMetadata } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => pageMetadata({
  title: "Liquidation buying guides by store type",
  description:
    "What to buy and skip for bin stores, online resellers, flea-market vendors, discount stores and exporters: which categories, grades and lot sizes fit.",
  path: "/guides",
});

export default async function GuidesIndex() {
  const guides = await getPublishedGuides();
  const { t, lh } = await getI18n();
  return (
    <div className="container-pp py-10">
      <h1 className="font-display text-3xl sm:text-4xl font-bold">{t("Buying guides by store type")}</h1>
      <p className="mb-8 text-muted">{t("What to buy — and what to skip — for the way you sell.")}</p>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <Link key={g.slug} href={lh(`/guides/${g.slug}`)} className="group card overflow-hidden">
            <SiteImage src={g.meta.cover || GUIDE_PHOTOS[g.slug] || "warehouseBoxes"} width={560} ratio={16 / 9} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[16/9] w-full" />
            <div className="p-5">
              <h2 className="font-display text-xl font-bold group-hover:text-signal-dark">{g.title}</h2>
              <p className="text-sm text-muted">{g.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
