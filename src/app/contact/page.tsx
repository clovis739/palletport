import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";
import { JsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { DEFAULTS, fillTokens, getSetting } from "@/lib/settings";
import { ContactDetails, SocialLinks, hasDirectContact } from "@/components/ContactDetails";
import { LocationMap } from "@/components/content/LocationMap";
import { GoogleReviews } from "@/components/content/GoogleReviews";
import { SiteImage } from "@/components/content/SiteImage";
import { getI18n } from "@/i18n/server";

/** All wording on this page: Admin → Site settings → Contact page (`contact` settings). Contact facts: `business`. */
export async function generateMetadata() {
  const contact = await getSetting("contact");
  return pageMetadata({ title: contact.seoTitle, description: contact.seoDescription, path: "/contact" });
}

export default async function Contact({ searchParams }: { searchParams: Promise<{ lot?: string; topic?: string }> }) {
  const { lot, topic } = await searchParams;
  const pickup = topic === "pickup";
  const [store, business, contact] = await Promise.all([getStore(), getSetting("business"), getSetting("contact")]);
  const { t, lh } = await getI18n();
  const tokens = { name: business.name || store.name, location: store.location };
  // The default pickup note keeps the original wording (with the warehouse city); a custom note is shown as written.
  const customPickup = business.pickupNote && business.pickupNote !== DEFAULTS.business.pickupNote;
  const lotNo = lot?.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
  return (
    <>
    <div className="container-pp grid grid-cols-1 gap-8 py-10 sm:py-14 md:grid-cols-2 md:gap-10">
      <div className="min-w-0 space-y-5">
        <JsonLd data={webPageJsonLd("ContactPage", contact.title, "/contact")} />
        <h1 className="font-display text-3xl sm:text-4xl font-bold">{contact.title}</h1>
        {contact.intro && <p className="text-ink/75">{fillTokens(contact.intro, tokens)}</p>}
        {(contact.tips.length > 0 || (contact.showPickup && business.pickupNote) || (contact.showHours && business.hours)) && (
          <div className="card space-y-3 p-5 text-sm">
            {contact.tips.map((tip, i) => (
              <p key={i}>
                {tip.label && <span className="font-semibold">{tip.label}</span>}
                {tip.text && <> {fillTokens(tip.text, tokens)}</>}
                {tip.linkLabel && tip.href && (
                  <>
                    {" "}
                    {tip.href.startsWith("/") ? (
                      <Link href={lh(tip.href)} className="font-semibold text-signal-dark hover:underline">{tip.linkLabel}</Link>
                    ) : (
                      <a href={tip.href} className="font-semibold text-signal-dark hover:underline" {...(/^https?:/.test(tip.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{tip.linkLabel}</a>
                    )}
                  </>
                )}
              </p>
            ))}
            {contact.showPickup && customPickup ? (
              <p><span className="font-semibold">{t("Warehouse pickup:")}</span> {business.pickupNote}</p>
            ) : contact.showPickup && business.pickupNote ? (
              <p><span className="font-semibold">{t("Warehouse pickup:")}</span> {t("by appointment only, in {place}. There's no walk-in store. Tell us the lot or order and when you'd like to come, and we'll confirm a time.", { place: store.location })}</p>
            ) : null}
            {contact.showHours && business.hours && <p><span className="font-semibold">{t("Hours:")}</span> {business.hours}</p>}
          </div>
        )}
        {(hasDirectContact(business) || business.socialLinks.length > 0) && (
          <div className="card space-y-4 p-5">
            {contact.directTitle && <h2 className="font-display text-lg font-bold">{contact.directTitle}</h2>}
            <ContactDetails business={business} showHours={false} />
            <SocialLinks links={business.socialLinks} />
          </div>
        )}
      </div>
      <div className="card min-w-0 p-5 sm:p-6">
        {lotNo && <p className="mb-4 rounded-lg bg-sand p-3 text-sm">{t("Your question is about")} <strong>{t("Lot #{n}", { n: lotNo })}</strong>.</p>}
        {contact.formTitle && <h2 className="mb-4 font-display text-lg font-bold">{contact.formTitle}</h2>}
        {pickup && contact.pickupNotice && <p className="mb-4 rounded-lg bg-sand p-3 text-sm">{contact.pickupNotice}</p>}
        <InquiryForm
          topic="CONTACT"
          submitLabel={pickup ? contact.pickupSubmitLabel : contact.submitLabel}
          bodyLabel={contact.bodyLabel}
          defaultBody={pickup ? `${lotNo ? t("Pickup appointment request for lot #{n}.", { n: lotNo }) : t("Pickup appointment request.")} ${t("Preferred days/times:")} ` : lotNo ? `${t("Question about lot #{n}:", { n: lotNo })} ` : ""}
        />
      </div>
    </div>
    {(business.photos ?? []).length > 0 && (
      <section aria-labelledby="warehouse-photos" className="container-pp pb-8">
        <h2 id="warehouse-photos" className="mb-4 font-display text-xl font-bold sm:text-2xl">{contact.photosTitle || t("Our warehouse")}</h2>
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {(business.photos ?? []).slice(0, 6).map((src, i) => (
            <li key={src} className={`overflow-hidden rounded-xl bg-sand ${i === 0 ? "col-span-2 md:col-span-2 md:row-span-2" : ""}`}>
              <SiteImage src={src} alt={i === 0 ? t("{name} warehouse, {place}", { name: business.name, place: business.addressCity || store.location }) : t("Inside the {name} warehouse", { name: business.name })} width={i === 0 ? 1200 : 600} ratio={3 / 2} sizes={i === 0 ? "(min-width: 768px) 66vw, 100vw" : "(min-width: 768px) 33vw, 50vw"} className="h-full w-full object-cover" />
            </li>
          ))}
        </ul>
      </section>
    )}
    {contact.showMap && (
      <div className="container-pp pb-4">
        <LocationMap business={business} title={contact.mapTitle || undefined} note={business.pickupNote && contact.mapNote ? contact.mapNote : undefined} />
      </div>
    )}
    {contact.showReviews && <GoogleReviews business={business} title={contact.reviewsTitle || undefined} className="container-pp py-10 sm:py-12" />}
    </>
  );
}
