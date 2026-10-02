import Link from "next/link";
import { LOT_SIZES, money } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";

export const generateMetadata = () => pageMetadata({
  title: "How to order liquidation pallets",
  description:
    "How ordering works: find a lot, check the manifest, add it to your cart and check out at the listed price. Payment options, freight, delivery and pickup.",
  path: "/how-to-buy",
});

const STEPS: [string, string][] = [
  ["Find a lot", "Browse by lot size or category, or search by product, brand or SKU. Filter by condition, category and price."],
  ["Check the manifest", "Every lot page lists the SKUs, quantities, retail values and condition grade, plus a freight estimate for your ZIP."],
  ["Add to cart", "Choose a quantity where more than one identical lot is in stock. Use Buy now to go straight to checkout."],
  ["Check out", "Enter your delivery details and pay the listed price plus freight. Card orders are confirmed right away."],
];

export default function HowToBuy() {
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-pp py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">Buyer guide</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">How to order</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            Every lot has one fixed price. Find what you want, add it to your cart and check out, like any online store.
          </p>
        </div>
      </section>

      <div className="container-pp grid grid-cols-1 gap-12 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-display text-2xl font-bold">1. Four steps to your first order</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {STEPS.map(([t, d], i) => (
                <li key={t} className="card p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-signal font-display text-sm font-bold text-white">{i + 1}</span>
                  <p className="mt-3 font-display text-lg font-bold">{t}</p>
                  <p className="mt-1 text-sm text-ink/80">{d}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">2. Prices</h2>
            <p className="mt-3 text-ink/80">
              The price on the lot page is the price you pay for the lot. There&apos;s no bidding and no reserve. Freight to your ZIP is added at
              checkout, and sales tax is added unless you have an approved resale certificate on file. Promo codes can be applied in the cart.
            </p>
            <p className="mt-3 text-ink/80">
              A lot in your cart isn&apos;t reserved. Other buyers can still order it until you complete checkout, so check out once you&apos;ve decided.
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">3. Paying</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80 marker:text-signal">
              <li><strong>Card</strong>: your order is confirmed immediately.</li>
              <li><strong>Wire / ACH</strong>: we confirm the order once we&apos;ve reviewed it and received payment.</li>
              <li><strong>Net 30</strong>: available to verified resellers with an approved resale certificate.</li>
              <li>While an order is Pending you can cancel it from your <Link href="/orders" className="font-semibold text-signal-dark hover:underline">Orders</Link> page.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">4. After you order</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80 marker:text-signal">
              <li>We prepare and wrap your lots and book the freight.</li>
              <li>Your order page shows each step, and the tracking (PRO) number once the shipment is booked.</li>
              <li>Inspect the delivery and note any visible damage on the delivery receipt before you sign.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">5. Lot sizes & shipping</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Object.entries(LOT_SIZES).map(([k, v]) => (
                <div key={k} className="card p-5">
                  <p className="font-display text-lg font-bold">{v.plural}</p>
                  <p className="mt-1 text-sm text-muted">{v.note}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink/80">
              Pallet freight is estimated at {money(17500)} per pallet and free on orders over {money(750000)}. Truckloads are quoted per trailer.
              Warehouse pickup is available by appointment only:{" "}
              <Link href="/contact?topic=pickup" className="font-semibold text-signal-dark hover:underline">request it through Contact</Link> before checkout.
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-40 lg:h-fit">
          <div className="card p-5">
            <p className="font-display text-lg font-bold">Ready to order?</p>
            <p className="mt-1 text-sm text-muted">Create a free business account in under a minute.</p>
            <Link href="/register" className="btn-primary mt-4 w-full">Create account</Link>
            <Link href="/lots" className="btn-ghost mt-2 w-full">Shop all lots</Link>
          </div>
          <div className="rounded-2xl bg-sand p-5 text-sm">
            <p className="font-semibold">Tips from experienced buyers</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
              <li>Price in freight before you order.</li>
              <li>Check the top five manifest lines — they carry most of the value.</li>
              <li>Compare with <Link href="/lots?sold=1" className="font-semibold text-signal-dark">recently sold</Link> lots.</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
