import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ListingCopy } from "@/content/listingCopy";
import { FaqSection } from "./FaqSection";
import { getI18n } from "@/i18n/server";

/**
 * Fuller buyer copy for a listing page, rendered below the lot grid so lots stay first on mobile.
 * Two columns on desktop (intro + key facts), stacked on small screens. All text is server-rendered.
 */
export async function ListingGuide({ copy }: { copy: ListingCopy }) {
  const { t, lh } = await getI18n();
  return (
    <div className="mt-14 space-y-12 pt-10 sm:mt-16 sm:pt-12">
      <section aria-labelledby="listing-guide-title" className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-12">
        <div className="min-w-0">
          <p className="label">{t("Buyer's guide")}</p>
          <h2 id="listing-guide-title" className="break-words font-display text-2xl font-bold sm:text-3xl">{copy.heading}</h2>
          <div className="mt-4 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink/80">
            {copy.intro.map((p) => <p key={p}>{p}</p>)}
          </div>
        </div>
        <aside className="min-w-0 self-start rounded-2xl bg-sand/60 p-5 sm:p-6" aria-label={t("Key facts")}>
          <p className="font-display text-lg font-bold">{t("Key facts")}</p>
          <dl className="mt-3 text-sm">
            {copy.facts.map(([label, value]) => (
              <div key={label} className="grid grid-cols-[7rem_minmax(0,1fr)] gap-3 py-2.5">
                <dt className="font-semibold text-muted">{label}</dt>
                <dd className="break-words">{value}</dd>
              </div>
            ))}
          </dl>
          {copy.links.length > 0 && (
            <ul className="mt-4 space-y-1 pt-4 text-sm">
              {copy.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={lh(href)} className="inline-flex min-h-8 items-center gap-1.5 font-semibold text-signal-dark hover:underline">
                    {label}<ArrowRight aria-hidden className="h-3.5 w-3.5 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </section>
      <FaqSection items={copy.faqs} className="max-w-3xl" />
    </div>
  );
}
