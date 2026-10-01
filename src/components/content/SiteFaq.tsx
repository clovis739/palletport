import Link from "next/link";
import { getSetting, fillTokens, type FaqPage } from "@/lib/settings";
import { getStore } from "@/lib/store";
import { JsonLd, faqJsonLd } from "@/lib/seo";
import { FaqAccordion } from "./FaqAccordion";

/**
 * Editable FAQ block for the homepage, about page and blog (Dashboard → Site settings → FAQs).
 * Centered: heading, animated accordion and contact line in one centered column, plus matching FAQPage JSON-LD.
 */
export async function SiteFaq({ page, className = "" }: { page: FaqPage; className?: string }) {
  const [faqs, store] = await Promise.all([getSetting("faqs"), getStore()]);
  const block = faqs[page];
  if (!block.enabled || !block.items.length) return null;
  const vars = { name: store.name, location: store.location };
  const items = block.items.map((f) => ({ q: fillTokens(f.q, vars), a: fillTokens(f.a, vars) }));
  const title = fillTokens(block.title, vars) || "Frequently asked questions";
  const id = `faq-${page}`;

  return (
    <section id="faq" aria-labelledby={id} className={`container-pp scroll-mt-40 py-12 sm:py-16 ${className}`}>
      <JsonLd data={faqJsonLd(items)} />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="label">FAQ</p>
          <h2 id={id} className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          {block.intro && <p className="mx-auto mt-3 max-w-xl text-muted">{fillTokens(block.intro, vars)}</p>}
        </div>
        <FaqAccordion items={items} className="mt-8" />
        <p className="mt-8 text-center text-sm text-ink/75">
          Still have a question?{" "}
          <Link href="/contact" className="font-semibold text-signal-dark hover:underline">Contact us</Link>
          {" "}or visit the{" "}
          <Link href="/help" className="font-semibold text-signal-dark hover:underline">help center</Link>.
        </p>
      </div>
    </section>
  );
}
