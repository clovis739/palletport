import Link from "next/link";
import { getCategoryGroups, categoryImage } from "@/lib/catalog";
import { SiteImage } from "@/components/content/SiteImage";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getBrand } from "@/lib/brand";
import { getI18n } from "@/i18n/server";

export const generateMetadata = () => pageMetadata({
  title: "Shop liquidation pallets by category",
  description:
    "Every liquidation lot we sell, sorted by department: phones and computers, TVs, video games, appliances, clothing, shoes, household essentials, tools, automotive and more, with live lot counts.",
  path: "/categories",
});
export const dynamic = "force-dynamic";

const anchor = (g: string) => g.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default async function CategoriesPage() {
  const brand = await getBrand();
  const { t, lh } = await getI18n();
  const groups = await getCategoryGroups();
  return (
    <div className="container-pp py-10">
      <JsonLd data={breadcrumbJsonLd([{ name: "Categories", path: "/categories" }])} />
      <h1 className="font-display text-3xl font-bold">{t("All categories")}</h1>
      <p className="text-muted">{t("Every lot on {brand}, organised by department and what's inside.", { brand })}</p>

      {groups.length > 1 && (
        <nav aria-label={t("Departments")} className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
          {groups.map((g) => (
            <a key={g.group} href={`#${anchor(g.group)}`} className="inline-flex min-h-9 shrink-0 items-center whitespace-nowrap rounded-full bg-sand px-3.5 py-1.5 text-xs font-semibold hover:bg-line">
              {t(g.group)}
            </a>
          ))}
        </nav>
      )}

      <div className="mt-8 space-y-12">
        {groups.map((g) => (
          <section key={g.group} id={anchor(g.group)} aria-labelledby={`h-${anchor(g.group)}`} className="scroll-mt-24">
            <h2 id={`h-${anchor(g.group)}`} className="mb-4 font-display text-xl font-bold sm:text-2xl">{t(g.group)}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((c) => (
                <div key={c.id} className="card overflow-hidden">
                  <Link href={lh(`/c/${c.slug}`)} className="block" tabIndex={-1} aria-hidden>
                    <SiteImage src={categoryImage(c)} alt="" width={640} ratio={16 / 7} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="aspect-[16/7] w-full" />
                  </Link>
                  <div className="p-5">
                    <Link href={lh(`/c/${c.slug}`)} className="font-display text-xl font-bold hover:text-signal-dark">{t(c.name)}</Link>
                    <p className="text-sm text-muted">{t(c.blurb)} · {t(c.lotCount === 1 ? "{n} lot" : "{n} lots", { n: c.lotCount })}</p>
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {c.subcategories.map((s) => (
                        <li key={s.id}>
                          <Link href={lh(`/lots?category=${c.slug}&sub=${s.slug}`)} className="inline-flex min-h-8 items-center rounded-full bg-sand px-3 py-1 text-xs font-medium hover:bg-line">
                            {t(s.name)} <span className="ml-1 text-muted">({s.lotCount})</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
