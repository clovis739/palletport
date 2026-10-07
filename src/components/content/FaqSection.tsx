import { FaqAccordion, type Faq } from "./FaqAccordion";
import { JsonLd, faqJsonLd } from "@/lib/seo";
import { getT } from "@/i18n/server";

export type { Faq };

/**
 * Visible FAQ accordion (animated open/close) plus FAQPage JSON-LD built from the same items, so the structured data
 * always matches what buyers can read. Answers are in the server-rendered HTML even while collapsed.
 */
export async function FaqSection({
  items,
  title = "Frequently asked questions",
  id = "faq",
  intro,
  className = "",
  defaultOpen = 0,
}: {
  items: Faq[];
  title?: string;
  intro?: string;
  id?: string;
  className?: string;
  /** Index of the question open on load (null = all closed). */
  defaultOpen?: number | null;
}) {
  if (!items.length) return null;
  const t = await getT();
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={`scroll-mt-40 ${className}`}>
      <JsonLd data={faqJsonLd(items)} />
      <h2 id={`${id}-title`} className="font-display text-2xl font-bold">{t(title)}</h2>
      {intro && <p className="mt-2 text-muted">{intro}</p>}
      <FaqAccordion items={items} defaultOpen={defaultOpen} />
    </section>
  );
}
