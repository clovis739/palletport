import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { LotCard } from "@/components/LotCard";
import { SiteImage } from "@/components/content/SiteImage";
import { SUBCATEGORY_ORDER, brandCounts, categoryImage } from "@/lib/catalog";
import { NextIcon } from "@/components/Icons";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { JsonLd, breadcrumbJsonLd, itemListJsonLd, pageMetadata } from "@/lib/seo";
import { CATEGORY_COPY } from "@/content/categoryCopy";
import { GUIDES } from "@/content/guides";
import { FaqSection } from "@/components/content/FaqSection";
import { ArrowRight } from "lucide-react";
import { getI18n } from "@/i18n/server";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const { t } = await getI18n();
  const c = await db.category.findUnique({ where: { slug }, select: { name: true, blurb: true, _count: { select: { lots: { where: { status: "ACTIVE" } } } } } });
  if (!c) return { title: t("Category not found"), robots: { index: false } };
  return pageMetadata({
    title: t("{name} liquidation pallets", { name: t(c.name) }),
    description: `${t(c.blurb)} ${t("{n} {name} lots available now — manifested pallets, truckloads and case packs sold direct from our warehouse.", { n: c._count.lots, name: t(c.name).toLowerCase() })}`,
    path: `/c/${slug}`,
  });
}

const lotInclude = { category: true, seller: true } as const;

const NEW_PER_PAGE = 8;
const VALUE_PER_PAGE = 4;

export default async function CategoryLanding({ params, searchParams }: { params: Params; searchParams: Promise<{ page?: string; value?: string }> }) {
  const sp = await searchParams;
  const { slug } = await params;
  const category = await db.category.findUnique({
    where: { slug },
    include: { subcategories: { orderBy: SUBCATEGORY_ORDER, include: { _count: { select: { lots: { where: { status: "ACTIVE" } } } } } } },
  });
  if (!category) notFound();
  const { t, lh } = await getI18n();
  const name = t(category.name);

  const base = { categoryId: category.id, status: "ACTIVE" };
  const [bestValue, brands] = await Promise.all([db.lot.findMany({ where: base, include: lotInclude }), brandCounts({ categoryId: category.id })]);
  const total = bestValue.length;
  // "Newly listed" (?page=) and "Best value" (?value=) are paginated separately; each pager keeps the other's page.
  const newPage = pageParam(sp.page, pageCount(total, NEW_PER_PAGE));
  const valuePage = pageParam(sp.value, pageCount(total, VALUE_PER_PAGE));
  const newest = [...bestValue]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))
    .slice((newPage - 1) * NEW_PER_PAGE, newPage * NEW_PER_PAGE);
  const value = bestValue
    .sort((a, b) => a.priceCents / a.msrpCents - b.priceCents / b.msrpCents)
    .slice((valuePage - 1) * VALUE_PER_PAGE, valuePage * VALUE_PER_PAGE);
  const keep = { page: newPage > 1 ? newPage : undefined, value: valuePage > 1 ? valuePage : undefined };
  const copy = CATEGORY_COPY[category.slug];
  // Guides this category is popular with: from the copy file, or from the guides' own category tags as a fallback.
  type Guide = (typeof GUIDES)[number];
  const guideSource: (Guide | undefined)[] = copy ? copy.popularWith.map((g) => GUIDES.find((x) => x.slug === g)) : GUIDES.filter((g) => g.categories.includes(category.slug));
  const popular = guideSource.filter((g): g is Guide => !!g);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Categories", path: "/categories" }, { name: category.name, path: `/c/${category.slug}` }]),
          itemListJsonLd(`${category.name} — newest lots`, newest),
        ]}
      />
      <section  style={{ background: `hsl(${category.hue} 45% 94%)` }}>
        <div className="container-pp grid grid-cols-1 items-center gap-6 py-8 sm:py-12 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:gap-8">
          <div className="min-w-0">
            <nav className="mb-2 text-xs text-muted"><Link href={lh("/categories")} className="hover:underline">{t("Categories")}</Link> / {name}</nav>
            <h1 className="break-words font-display text-3xl font-bold sm:text-5xl">{name}</h1>
            <p className="mt-2 max-w-lg text-ink/70">{t(category.blurb)}. {t("Manifested pallets from our own warehouse, priced well below retail.")}</p>
            <Link href={lh(`/lots?category=${category.slug}`)} className="btn-dark mt-5">{t("Shop all {name}", { name: name.toLowerCase() })}</Link>
          </div>
          <SiteImage src={categoryImage(category, true)} alt="" width={720} ratio={1.6} priority className="aspect-[16/10] w-full rounded-2xl" />
        </div>
      </section>

      <div className="container-pp space-y-12 py-10 sm:space-y-14 sm:py-12">
        {category.subcategories.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-2xl font-bold">{t("Shop by subcategory")}</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {category.subcategories.map((s) => (
                <Link key={s.id} href={lh(`/lots?category=${category.slug}&sub=${s.slug}`)} className="card min-w-0 p-4 transition hover:text-signal-dark">
                  <p className="break-words font-display font-semibold">{t(s.name)}</p>
                  <p className="text-xs text-muted">{t(s._count.lots === 1 ? "{n} lot" : "{n} lots", { n: s._count.lots })}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section>
            <h2 className="mb-4 font-display text-2xl font-bold">{t("Shop by brand")}</h2>
            <ul className="flex flex-wrap gap-2">
              {brands.map((b) => (
                <li key={b.brand}>
                  <Link href={lh(`/lots?category=${category.slug}&brand=${encodeURIComponent(b.brand)}`)} className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-sand px-4 py-2 text-sm font-semibold hover:bg-line">
                    {b.brand} <span className="text-xs font-medium text-muted">{b.count}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {newest.length === 0 ? (
          <section className="card p-8 text-center sm:p-12">
            <p className="font-display text-lg font-semibold">{t("No {name} lots in stock right now", { name: name.toLowerCase() })}</p>
            <p className="mt-1 text-sm text-muted">{t("New loads arrive every week. Tell us what you're after and we'll let you know when it lands.")}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href={lh(`/contact?topic=sourcing&category=${category.slug}`)} className="btn-primary">{t("Request this category")}</Link>
              <Link href={lh("/lots")} className="btn-ghost">{t("Shop all lots")}</Link>
            </div>
          </section>
        ) : (
          <>
          <section id="best-value" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-2xl font-bold">{t("Best value right now")}</h2>
              <Link href={lh(`/lots?category=${category.slug}&sort=value`)} className="text-sm font-semibold text-signal-dark hover:underline">{t("See more")}<NextIcon /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{value.map((l) => <LotCard key={l.id} lot={l} />)}</div>
            <Pager base={`/c/${category.slug}`} params={keep} param="value" hash="best-value" page={valuePage} perPage={VALUE_PER_PAGE} total={total} className="mt-8" />
          </section>

          <section id="newest" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 className="font-display text-2xl font-bold">{t("Newly listed")}</h2>
              <Link href={lh(`/lots?category=${category.slug}`)} className="text-sm font-semibold text-signal-dark hover:underline">{t("View all")}<NextIcon /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{newest.map((l) => <LotCard key={l.id} lot={l} />)}</div>
            <Pager base={`/c/${category.slug}`} params={keep} param="page" hash="newest" page={newPage} perPage={NEW_PER_PAGE} total={total} className="mt-8" />
          </section>
          </>
        )}

        {(copy || popular.length > 0) && (
          <section aria-labelledby="category-guide-title" className="grid grid-cols-1 gap-8 pt-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
            <div className="min-w-0">
              <p className="label">{t("Buyer's guide")}</p>
              <h2 id="category-guide-title" className="break-words font-display text-2xl font-bold sm:text-3xl">{t("Buying {name} liquidation lots", { name: name.toLowerCase() })}</h2>
              {copy ? (
                <div className="mt-4 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink/80">
                  {copy.intro.map((p) => <p key={p}>{t(p)}</p>)}
                </div>
              ) : (
                <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink/80">
                  {t(category.blurb)}. {t("Every lot has a full manifest, a condition grade and a freight estimate by ZIP on the lot page.")}
                </p>
              )}
            </div>
            {popular.length > 0 && (
              <aside aria-label={t("Popular with")} className="min-w-0 self-start rounded-2xl p-5 sm:p-6" style={{ background: `hsl(${category.hue} 45% 94%)` }}>
                <p className="font-display text-lg font-bold">{t("Popular with")}</p>
                <ul className="mt-3 space-y-2">
                  {popular.map((g) => (
                    <li key={g.slug}>
                      <Link href={lh(`/guides/${g.slug}`)} className="group flex min-h-11 items-center justify-between gap-3 rounded-xl bg-white/80 px-4 py-2.5 text-sm font-semibold transition hover:bg-white">
                        <span className="min-w-0 break-words">{t(g.title)}</span>
                        <ArrowRight aria-hidden className="h-4 w-4 shrink-0 text-signal-dark transition group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </aside>
            )}
          </section>
        )}

        {copy && <FaqSection items={copy.faqs.map((f) => ({ ...f, q: t(f.q), a: t(f.a) }))} title={t("{name} lots: common questions", { name })} className="max-w-3xl" />}
      </div>
    </>
  );
}
