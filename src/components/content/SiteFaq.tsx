import Link from "next/link";
import { getSetting, fillTokens, type FaqPage } from "@/lib/settings";
import { getPublicStore as getStore } from "@/lib/store";
import { JsonLd, faqJsonLd } from "@/lib/seo";
import { FaqAccordion } from "./FaqAccordion";
import { getI18n } from "@/i18n/server";

/**
 * Editable FAQ block for the homepage, about page and blog (Dashboard → Site settings → FAQs).
 * Centered: heading, animated accordion and contact line in one centered column, plus matching FAQPage JSON-LD.
 */
export async function SiteFaq({ page, className = "" }: { page: FaqPage; className?: string }) {
  const [faqs, store, { t, lh }] = await Promise.all([getSetting("faqs"), getStore(), getI18n()]);
  const block = faqs[page];
  if (!block.enabled || !block.items.length) return null;
  const vars = { name: store.name, location: store.location };
  const items = block.items.map((f) => ({ q: fillTokens(f.q, vars), a: fillTokens(f.a, vars) }));
  const title = fillTokens(block.title, vars) || t("Frequently asked questions");
  const id = `faq-${page}`;

  return (
    <section id="faq" aria-labelledby={id} className={`container-pp scroll-mt-40 py-12 sm:py-16 ${className}`}>
      <JsonLd data={faqJsonLd(items)} />
      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <p className="label">{t("FAQ")}</p>
          <h2 id={id} className="mt-2 font-display text-2xl font-bold sm:text-3xl">{title}</h2>
          {block.intro && <p className="mx-auto mt-3 max-w-xl text-muted">{fillTokens(block.intro, vars)}</p>}
        </div>
        <FaqAccordion items={items} className="mt-8" />
        <p className="mt-8 text-center text-sm text-ink/75">
          {t("Still have a question?")}{" "}
          <Link href={lh("/contact")} className="font-semibold text-signal-dark hover:underline">{t("Contact us")}</Link>
          {" "}{t("or visit the")}{" "}
          <Link href={lh("/help")} className="font-semibold text-signal-dark hover:underline">{t("help center")}</Link>.
        </p>
      </div>
    </section>
  );
}
