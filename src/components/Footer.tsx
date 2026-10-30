import { Logo } from "./Logo";
import { Star } from "lucide-react";
import { writeReviewUrl } from "@/lib/google-business";
import { InquiryForm } from "./InquiryForm";
import { SmartLink } from "./NavDropdown";
import { ContactDetails, SocialLinks } from "./ContactDetails";
import { getSettings } from "@/lib/settings";
import { getI18n } from "@/i18n/server";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { getVisibleCategories } from "@/lib/catalog";
import Link from "next/link";

/** lg column templates by number of link columns (static strings so Tailwind generates them). */
const LG_COLS: Record<number, string> = {
  0: "lg:grid-cols-1",
  1: "lg:grid-cols-[1.5fr_1fr]",
  2: "lg:grid-cols-[1.5fr_repeat(2,1fr)]",
  3: "lg:grid-cols-[1.5fr_repeat(3,1fr)]",
  4: "lg:grid-cols-[1.5fr_repeat(4,1fr)]",
  5: "lg:grid-cols-[1.5fr_repeat(5,1fr)]",
};

/** Storefront footer. Columns, blurb and legal links: `navigation` settings. Contact + social: `business` settings. */
export async function Footer() {
  const [{ navigation: nav, business }, { t, lh }, categories] = await Promise.all([getSettings(), getI18n(), getVisibleCategories()]);
  const cols = nav.footerColumns.slice(0, 5);
  return (
    <footer className="mt-20 bg-ink text-white/80">
      <div className={`container-pp grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:grid-cols-3 sm:py-14 ${LG_COLS[cols.length]}`}>
        <div className="col-span-2 space-y-4 sm:col-span-3 lg:col-span-1">
          <Logo className="text-white" />
          {nav.footerBlurb && <p className="max-w-xs text-sm text-white/60">{nav.footerBlurb}</p>}
          <ContactDetails business={business} tone="dark" fullAddress className="max-w-xs text-white/70" />
          {(business.googlePlaceId || business.googleMapsUrl) && (
            <a
              href={writeReviewUrl(business) || business.googleMapsUrl}
              target="_blank"
              rel="noopener"
              className="tap inline-flex items-center gap-1.5 text-sm font-semibold text-white hover:text-signal"
            >
              <Star aria-hidden className="h-4 w-4 fill-signal text-signal" /> {business.googlePlaceId ? t("Review us on Google") : t("See our Google reviews")}
            </a>
          )}
          <SocialLinks links={business.socialLinks} tone="dark" />
          <div className="max-w-sm">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-white">{t("The Monday Manifest")}</p>
            <InquiryForm topic="NEWSLETTER" inline dark submitLabel={t("Join")} />
          </div>
        </div>
        {cols.map((col, ci) => (
          <div key={`${col.title}-${ci}`} className="min-w-0">
            <h4 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-white">{col.title}</h4>
            <ul className="space-y-2 text-sm">
              {col.links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  <SmartLink href={l.href} className="tap inline-block py-0.5 hover:text-signal">{l.label}</SmartLink>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      {categories.length > 0 && (
        // Every category linked from every page, so buyers and Google can always reach the category pages.
        <nav aria-label={t("Shop liquidation pallets by category")} className="container-pp border-t border-white/10 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white">{t("Shop liquidation pallets by category")}</p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={lh(`/c/${c.slug}`)} className="tap inline-block py-0.5 hover:text-signal">{t(c.name)}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div >
        <div className="container-pp flex flex-col gap-3 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] text-xs text-white/50 md:flex-row md:flex-wrap md:items-center md:justify-between">
          <span className="flex flex-wrap items-center gap-3">© {new Date().getFullYear()} {business.name}. {t("All rights reserved.")} <LanguageSwitcher variant="dark" /></span>
          {nav.legalLinks.length > 0 && (
            <nav aria-label={t("Legal")} className="flex flex-wrap gap-x-4 gap-y-2">
              {nav.legalLinks.map((l, i) => (
                <SmartLink key={`${l.href}-${i}`} href={l.href} className="tap hover:text-white">{l.label}</SmartLink>
              ))}
            </nav>
          )}
        </div>
      </div>
    </footer>
  );
}
