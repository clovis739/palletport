import Link from "next/link";
import { HELP_TOPICS } from "@/content/help";
import { getHelpArticles } from "@/lib/content";
import { blocksText } from "@/lib/blocks";
import { pageMetadata } from "@/lib/seo";

// Help searches (?q=) canonicalise to /help and are kept out of the index.
export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  return pageMetadata({
    title: "Help center",
    description:
      "Answers on ordering, payment, Net 30 terms, condition grades, freight and delivery, manifest discrepancies and managing your account.",
    path: "/help",
    noIndex: !!q?.trim(),
  });
}

export default async function HelpCenter({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = "" } = await searchParams;
  const term = q.trim().toLowerCase();
  const articles = await getHelpArticles();
  const results = term ? articles.filter((a) => [a.title, a.excerpt, blocksText(a.blocks)].join(" ").toLowerCase().includes(term)) : [];
  // Built-in topics first, then any new categories created in the editor.
  const topics: { key: string; blurb: string }[] = [
    ...HELP_TOPICS,
    ...[...new Set(articles.map((a) => a.category ?? ""))].filter((c) => c && !HELP_TOPICS.some((t) => t.key === c)).map((key) => ({ key, blurb: "" })),
    ...(articles.some((a) => !a.category) ? [{ key: "", blurb: "" }] : []),
  ];
  return (
    <>
      <section >
        <div className="container-pp py-10 sm:py-14 text-center">
          <h1 className="font-display text-3xl sm:text-4xl font-bold">How can we help?</h1>
          <form className="mx-auto mt-6 max-w-xl">
            <input name="q" type="search" aria-label="Search help articles" defaultValue={q} placeholder="Search: freight, Net 30, promo codes…" className="input rounded-full py-3.5 text-base" />
          </form>
        </div>
      </section>
      <div className="container-pp py-10 sm:py-12">
        {term ? (
          <section className="mx-auto max-w-3xl">
            <h2 className="mb-4 break-words font-display text-xl font-bold">{results.length} result{results.length === 1 ? "" : "s"} for “{q}”</h2>
            <ul className="card">
              {results.map((a) => (
                <li key={a.slug}><Link href={`/help/${a.slug}`} className="block p-4 hover:bg-sand/40"><span className="font-semibold">{a.title}</span><span className="block text-sm text-muted">{a.excerpt}</span></Link></li>
              ))}
              {results.length === 0 && <li className="p-6 text-center text-sm text-muted">Nothing found. <Link href="/contact" className="font-semibold text-signal-dark">Contact support</Link></li>}
            </ul>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {topics.map((t) => (
              <section key={t.key || "more"} className="card min-w-0 p-5 sm:p-6">
                <h2 className="font-display text-xl font-bold">{t.key || "More help"}</h2>
                {t.blurb ? <p className="mb-3 text-sm text-muted">{t.blurb}</p> : <div className="mb-3" />}
                <ul className="space-y-2 text-sm">
                  {articles.filter((a) => (a.category ?? "") === t.key).map((a) => (
                    <li key={a.slug}><Link href={`/help/${a.slug}`} className="inline-block py-0.5 font-medium hover:text-signal-dark hover:underline">{a.title}</Link></li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <div className="mt-12 rounded-2xl bg-ink p-6 text-center text-white sm:p-8">
          <p className="font-display text-xl font-bold">Can't find an answer?</p>
          <p className="text-sm text-white/70">Our support team replies within one business day.</p>
          <Link href="/contact" className="btn-primary mt-4">Contact support</Link>
        </div>
      </div>
    </>
  );
}
