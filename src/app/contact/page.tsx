import Link from "next/link";
import { InquiryForm } from "@/components/InquiryForm";
import { JsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { getStore } from "@/lib/store";
import { DEFAULTS, getSetting } from "@/lib/settings";
import { ContactDetails, SocialLinks, hasDirectContact } from "@/components/ContactDetails";
import { LocationMap } from "@/components/content/LocationMap";
import { GoogleReviews } from "@/components/content/GoogleReviews";

export const metadata = pageMetadata({
  title: "Contact our warehouse team",
  description:
    "Questions about a lot, an order, bulk buying or a warehouse pickup appointment? Send our warehouse team a message. We reply within one business day.",
  path: "/contact",
});

export default async function Contact({ searchParams }: { searchParams: Promise<{ lot?: string; topic?: string }> }) {
  const { lot, topic } = await searchParams;
  const pickup = topic === "pickup";
  const [store, business] = await Promise.all([getStore(), getSetting("business")]);
  // The default pickup note keeps the original wording (with the warehouse city); a custom note is shown as written.
  const customPickup = business.pickupNote && business.pickupNote !== DEFAULTS.business.pickupNote;
  const lotNo = lot?.replace(/[^A-Za-z0-9]/g, "").slice(0, 12).toUpperCase();
  return (
    <>
    <div className="container-pp grid grid-cols-1 gap-8 py-10 sm:py-14 md:grid-cols-2 md:gap-10">
      <div className="min-w-0 space-y-5">
        <JsonLd data={webPageJsonLd("ContactPage", "Contact us", "/contact")} />
        <h1 className="font-display text-3xl sm:text-4xl font-bold">Contact us</h1>
        <p className="text-ink/75">Questions about a lot, an order, bulk buying or a pickup appointment? Our warehouse team replies within one business day.</p>
        <div className="card space-y-3 p-5 text-sm">
          <p><span className="font-semibold">Order issue?</span> Include your order number (for example PP-XXXX) so we can find it quickly.</p>
          {customPickup ? (
            <p><span className="font-semibold">Warehouse pickup:</span> {business.pickupNote}</p>
          ) : business.pickupNote ? (
            <p><span className="font-semibold">Warehouse pickup:</span> by appointment only, in {store.location}. There&apos;s no walk-in store. Tell us the lot or order and when you&apos;d like to come, and we&apos;ll confirm a time.</p>
          ) : null}
          <p><span className="font-semibold">Quick answers:</span> <Link href="/help" className="font-semibold text-signal-dark hover:underline">Help center</Link></p>
          {business.hours && <p><span className="font-semibold">Hours:</span> {business.hours}</p>}
        </div>
        {(hasDirectContact(business) || business.socialLinks.length > 0) && (
          <div className="card space-y-4 p-5">
            <h2 className="font-display text-lg font-bold">Reach us directly</h2>
            <ContactDetails business={business} showHours={false} />
            <SocialLinks links={business.socialLinks} />
          </div>
        )}
      </div>
      <div className="card min-w-0 p-5 sm:p-6">
        {lotNo && <p className="mb-4 rounded-lg bg-sand p-3 text-sm">Your question is about <strong>lot #{lotNo}</strong>.</p>}
        {pickup && (
          <p className="mb-4 rounded-lg bg-sand p-3 text-sm">
            <strong>Requesting a pickup appointment.</strong> Include the lot or order number, the vehicle you&apos;ll bring and a few days and times that suit you. Please don&apos;t travel until we&apos;ve confirmed.
          </p>
        )}
        <InquiryForm
          topic="CONTACT"
          submitLabel={pickup ? "Request pickup appointment" : "Send message"}
          bodyLabel="How can we help?"
          defaultBody={pickup ? `Pickup appointment request${lotNo ? ` for lot #${lotNo}` : ""}. Preferred days/times: ` : lotNo ? `Question about lot #${lotNo}: ` : ""}
        />
      </div>
    </div>
    <div className="container-pp pb-4">
      <LocationMap business={business} note={business.pickupNote ? "Pickup is by appointment only. Please book before you travel." : undefined} />
    </div>
    <GoogleReviews business={business} className="container-pp py-10 sm:py-12" />
    </>
  );
}
