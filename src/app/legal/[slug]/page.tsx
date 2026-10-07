import Link from "next/link";
import { notFound } from "next/navigation";
import { getLegalPage, getLegalPages } from "@/lib/content";
import { Blocks } from "@/components/content/Blocks";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { canPreview, PREVIEW_ROBOTS } from "@/lib/preview";
import { JsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { getI18n } from "@/i18n/server";
import { LOCALE_TAG } from "@/i18n/config";

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const doc = await getLegalPage(slug, { preview });
  if (!doc) return { title: (await getI18n()).t("Policy not found"), robots: { index: false } };
  const md = await pageMetadata({ title: doc.meta.seoTitle || doc.title, description: doc.meta.seoDescription || doc.excerpt, path: `/legal/${slug}`, noIndex: !!doc.meta.noindex });
  return preview ? { ...md, robots: PREVIEW_ROBOTS } : md;
}

export default async function LegalPage({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const [doc, all] = await Promise.all([getLegalPage(slug, { preview }), getLegalPages()]);
  if (!doc) notFound();
  const { t, lh, locale } = await getI18n();
  const effective = doc.updated ?? doc.date;
  return (
    <>
      {preview && <PreviewBanner id={doc.id} status={doc.status} />}
      <div className="container-pp grid grid-cols-1 gap-8 py-8 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0">
          <p className="label">{t("Policies")}</p>
          <nav className="-mx-4 flex gap-1 overflow-x-auto overscroll-x-contain px-4 pb-1 text-sm [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
            {all.map((l) => (
              <Link key={l.slug} href={lh(`/legal/${l.slug}`)} className={`shrink-0 whitespace-nowrap rounded-lg px-3 py-2 lg:whitespace-normal lg:py-1.5 ${l.slug === slug ? "bg-sand font-semibold" : "hover:bg-sand"}`}>{l.title}</Link>
            ))}
          </nav>
        </aside>
        <article className="min-w-0 max-w-2xl" lang="en">
          <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: doc.title, path: `/legal/${doc.slug}` }])} />
          <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">{doc.title}</h1>
          {effective && <p className="mb-8 mt-1 text-sm text-muted">{t("Last updated {date}", { date: new Date(`${effective}T12:00:00`).toLocaleDateString(LOCALE_TAG[locale], { dateStyle: "long" }) })}</p>}
          {locale === "es" && (
            <p lang={locale === "es" ? "es" : undefined} className="mb-6 rounded-xl bg-sand p-3 text-xs text-ink/75">
              {t("This policy is available in English only.")}
            </p>
          )}
          <Blocks blocks={doc.blocks} size="sm" className={effective ? "" : "mt-8"} />
        </article>
      </div>
    </>
  );
}
