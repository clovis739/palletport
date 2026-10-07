import Link from "next/link";
import { notFound } from "next/navigation";
import { getHelpArticle, getHelpArticles } from "@/lib/content";
import { blocksFaq } from "@/lib/blocks";
import { Blocks } from "@/components/content/Blocks";
import { PreviewBanner } from "@/components/content/PreviewBanner";
import { canPreview, PREVIEW_ROBOTS } from "@/lib/preview";
import { JsonLd, breadcrumbJsonLd, faqJsonLd, pageMetadata, sectionsText } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

type Params = Promise<{ slug: string }>;
type Search = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const a = await getHelpArticle(slug, { preview });
  const { t } = await getI18n();
  if (!a) return { title: t("Help article not found"), robots: { index: false } };
  const md = await pageMetadata({
    title: a.meta.seoTitle || `${a.title} — ${t("Help")}`,
    description: a.meta.seoDescription || `${a.excerpt} ${sectionsText(a.body)}`,
    path: `/help/${slug}`,
    noIndex: !!a.meta.noindex,
  });
  return preview ? { ...md, robots: PREVIEW_ROBOTS } : md;
}

export default async function HelpArticle({ params, searchParams }: { params: Params; searchParams: Search }) {
  const { slug } = await params;
  const preview = await canPreview(searchParams);
  const [a, all] = await Promise.all([getHelpArticle(slug, { preview }), getHelpArticles()]);
  if (!a) notFound();
  const { t, lh } = await getI18n();
  const related = all.filter((x) => x.category === a.category && x.slug !== a.slug);
  // FAQ markup mirrors the visible text: the article title when it's phrased as a question, plus any
  // sub-headings that are questions, each answered by the text shown beneath it, plus visible FAQ blocks.
  const subQs = a.body.filter((s) => s.h?.trim().endsWith("?"));
  const faq = faqJsonLd([
    ...(a.title.trim().endsWith("?") ? [{ q: a.title, a: sectionsText(a.body.filter((s) => !subQs.includes(s))) }] : []),
    ...subQs.map((s) => ({ q: s.h!, a: sectionsText([s]) })),
    ...blocksFaq(a.blocks),
  ]);
  return (
    <>
      {preview && <PreviewBanner id={a.id} status={a.status} />}
      <div className="container-pp grid grid-cols-1 gap-10 py-8 sm:py-10 lg:grid-cols-[minmax(0,1fr)_280px]">
        <JsonLd data={[breadcrumbJsonLd([{ name: "Help center", path: "/help" }, { name: a.title, path: `/help/${a.slug}` }]), ...(faq ? [faq] : [])]} />
        <article className="min-w-0 max-w-2xl">
          <nav className="mb-2 text-xs text-muted"><Link href={lh("/help")} className="hover:underline">{t("Help center")}</Link>{a.category && <> / {a.category}</>}</nav>
          <h1 className="mb-2 break-words font-display text-2xl font-bold sm:text-3xl">{a.title}</h1>
          <p className="mb-8 text-base text-muted sm:text-lg">{a.excerpt}</p>
          <Blocks blocks={a.blocks} size="sm" />
          <div className="mt-10 rounded-xl bg-white p-5 text-sm">
            {t("Still stuck?")} <Link href={lh("/contact")} className="font-semibold text-signal-dark hover:underline">{t("Contact support")}</Link> {t("and we'll reply within one business day.")}
          </div>
        </article>
        {related.length > 0 && (
          <aside className="min-w-0">
            <p className="label">{t("More in {category}", { category: a.category ?? "" })}</p>
            <ul className="space-y-2 text-sm">
              {related.map((r) => <li key={r.slug}><Link href={lh(`/help/${r.slug}`)} className="inline-block py-0.5 hover:underline">{r.title}</Link></li>)}
            </ul>
          </aside>
        )}
      </div>
    </>
  );
}
