import Link from "next/link";
import { db } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import { LEGAL } from "@/content/legal";
import { GUIDES } from "@/content/guides";
import { pageMetadata } from "@/lib/seo";
import { getBrand } from "@/lib/brand";

export const generateMetadata = () => pageMetadata({
  title: "Site map",
  description:
    "Every public section of PalletPort on one page: lots by sale type, size and category, collections, buying guides, help articles, the blog and policies.",
  path: "/site-map",
});
export const dynamic = "force-dynamic";

export default async function SiteMap() {
  const brand = await getBrand();
  const [categories] = await Promise.all([
    db.category.findMany({ where: { hidden: false }, orderBy: [{ position: "asc" }, { name: "asc" }], include: { subcategories: { orderBy: [{ position: "asc" }, { name: "asc" }] } } }),
  ]);
  const groups: [string, [string, string][]][] = [
    ["Shop", [["Truckloads", "/truckloads"], ["Pallets", "/pallets"], ["Case packs", "/case-packs"], ["All lots", "/lots"], ["Categories", "/categories"], ["New arrivals", "/new"], ["Trending", "/trending"], ["Collections", "/collections"]]],
    ["Buyers", [["How to order", "/how-to-buy"], ["Create an account", "/register"], ["Sign in", "/login"], ["Cart", "/cart"], ["Orders", "/orders"], ["Saved lots", "/account/favorites"], ["Account", "/account"], ["Business verification", "/account/verification"], ["Refer a business", "/account/referrals"]]],
    ["Programs", [[`${brand} Pro`, "/pro"], ["Volume buyers", "/volume-buyers"], ["Affiliates", "/affiliates"], ["Warehouse Days", "/events"], ["Integrations", "/integrations"]]],
    ["Learn", [["How it works", "/how-it-works"], ["Help center", "/help"], ["The Loading Dock blog", "/blog"], ["Market reports", "/reports"], ["Guides", "/guides"], ...GUIDES.map((g) => [g.title, `/guides/${g.slug}`] as [string, string])]],
    ["Company", [["About", "/about"], ["Columbus, Ohio liquidation pallets", "/liquidation-pallets-columbus-ohio"], ["Contact", "/contact"], ...LEGAL.map((l) => [l.title, `/legal/${l.slug}`] as [string, string])]],
    ["Collections", COLLECTIONS.map((c) => [c.title, `/collections/${c.slug}`])],
  ];
  return (
    <div className="container-pp py-10">
      <h1 className="mb-8 font-display text-3xl font-bold">Site map</h1>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map(([title, links]) => (
          <section key={title}>
            <h2 className="label">{title}</h2>
            <ul className="space-y-1.5 text-sm">{links.map(([l, h]) => <li key={h}><Link href={h} className="hover:underline">{l}</Link></li>)}</ul>
          </section>
        ))}
        <section className="sm:col-span-2 lg:col-span-4">
          <h2 className="label">Categories</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <ul key={c.id} className="space-y-1 text-sm">
                <li><Link href={`/c/${c.slug}`} className="font-semibold hover:underline">{c.name}</Link></li>
                {c.subcategories.map((s) => <li key={s.id}><Link href={`/lots?category=${c.slug}&sub=${s.slug}`} className="text-ink/75 hover:underline">{s.name}</Link></li>)}
              </ul>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
