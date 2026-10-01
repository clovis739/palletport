import Link from "next/link";
import { CONDITIONS, FREE_FREIGHT_THRESHOLD_CENTS, money } from "@/lib/format";
import { Photo } from "@/components/Photo";
import { PHOTOS } from "@/content/photos";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How our liquidation warehouse works",
  description:
    "We buy customer returns and overstock by the truckload, then sort, grade and manifest every pallet in our own Columbus-area warehouse to sell direct.",
  path: "/how-it-works",
});

export default function HowItWorks() {
  return (
    <>
      <section className="relative overflow-hidden bg-ink text-white">
        <Photo photo={PHOTOS.warehouseWide} width={1600} ratio={16 / 9} sizes="100vw" priority alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-ink/75" />
        <div className="container-pp relative py-12 sm:py-20 text-center">
          <h1 className="font-display text-3xl font-bold sm:text-5xl">How PalletPort works</h1>
          <p className="mx-auto mt-3 max-w-2xl text-white/70">We buy returns and overstock by the truckload, sort and manifest every pallet in our own warehouse, and sell it direct to resellers — so you see exactly what's on a pallet before you buy.</p>
        </div>
      </section>

      <section className="container-pp grid gap-10 py-10 sm:py-16 lg:grid-cols-2">
        <div>
          <p className="label">For buyers</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">Buy with the full picture</h2>
          <ol className="mt-6 space-y-5">
            {[
              ["Create a business account", "Free for any reseller. Add your resale certificate to unlock Net 30 terms."],
              ["Browse and compare", "Filter by category, condition, lot size and price. Every lot shows its manifest, percent of retail and price per unit."],
              ["Ask before you buy", "Contact our warehouse team about photos, testing or bundle deals."],
              ["Check out", "Pay by card, wire/ACH, or Net 30. Add a promo code if you have one."],
              ["Receive and review", `Freight is ${money(17500)} per pallet and free over ${money(FREE_FREIGHT_THRESHOLD_CENTS)}. Track your PRO number and leave a review after delivery.`],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-signal font-display font-bold text-white">{i + 1}</span>
                <span><span className="block font-display text-lg font-semibold">{t}</span><span className="text-sm text-muted">{d}</span></span>
              </li>
            ))}
          </ol>
          <Link href="/register" className="btn-primary mt-8">Create a buyer account</Link>
        </div>
        <div>
          <p className="label">Behind the scenes</p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold">What happens in our warehouse</h2>
          <ol className="mt-6 space-y-5">
            {[
              ["We source", "We buy customer returns, shelf pulls and overstock from retailers and distributors."],
              ["We sort & grade", "Every load is unpacked, graded by condition and rebuilt onto pallets or into case packs."],
              ["We manifest", "Each lot is scanned so you get SKUs, quantities and retail values before you order."],
              ["We ship", "We book LTL, truckload or parcel delivery to your address. Or book a weekday warehouse pickup visit from the lot page."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink font-display font-bold text-white">{i + 1}</span>
                <span><span className="block font-display text-lg font-semibold">{t}</span><span className="text-sm text-muted">{d}</span></span>
              </li>
            ))}
          </ol>
          <Link href="/about" className="btn-dark mt-8">About our warehouse</Link>
        </div>
      </section>

      {/* Warehouse to your dock, in pictures */}
      <section className="container-pp pb-10 sm:pb-16">
        <div className="grid gap-4 sm:grid-cols-3">
          {([
            [PHOTOS.vanBoxes, "1. Receive", "Truckloads of returns and overstock arrive from retailers."],
            [PHOTOS.clipboard, "2. Sort & manifest", "We sort, grade and list every item before a lot goes live."],
            [PHOTOS.freightTruck, "3. Ship to you", "Wrapped pallets leave our dock by LTL or truckload; case packs go by parcel."],
          ] as const).map(([ph, t, d]) => (
            <figure key={t} className="card overflow-hidden">
              <Photo photo={ph} width={480} ratio={4 / 3} sizes="(max-width: 640px) 100vw, 33vw" className="aspect-[4/3] w-full" />
              <figcaption className="p-4">
                <p className="font-display font-bold">{t}</p>
                <p className="text-sm text-muted">{d}</p>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>

      <section id="conditions" >
        <div className="container-pp py-10 sm:py-14">
          <h2 className="mb-6 font-display text-2xl font-bold">Condition grades</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {Object.entries(CONDITIONS).map(([k, c]) => (
              <div key={k} className="card p-4">
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${c.tone}`}>{c.label}</span>
                <p className="mt-2 text-sm text-ink/75">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-pp py-10 sm:py-14 text-center">
        <h2 className="font-display text-2xl font-bold">Still have questions?</h2>
        <p className="mt-1 text-muted">Our help center covers payments, freight, disputes and selling.</p>
        <Link href="/help" className="btn-ghost mt-5">Visit the help center</Link>
      </section>
    </>
  );
}
