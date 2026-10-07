import Link from "next/link";
import { LOT_SIZES, money } from "@/lib/format";
import { pageMetadata } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

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

export default async function HowToBuy() {
  const { t, lh } = await getI18n();
  return (
    <>
      <section className="bg-ink text-white">
        <div className="container-pp py-10 sm:py-14">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{t("Buyer guide")}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-5xl">{t("How to order")}</h1>
          <p className="mt-3 max-w-2xl text-white/70">
            {t("Every lot has one fixed price. Find what you want, add it to your cart and check out, like any online store.")}
          </p>
        </div>
      </section>

      <div className="container-pp grid grid-cols-1 gap-12 py-10 sm:py-12 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0 space-y-12">
          <section>
            <h2 className="font-display text-2xl font-bold">{t("1. Four steps to your first order")}</h2>
            <ol className="mt-4 grid gap-4 sm:grid-cols-2">
              {STEPS.map(([h, d], i) => (
                <li key={h} className="card p-5">
                  <span className="grid h-8 w-8 place-items-center rounded-full bg-signal font-display text-sm font-bold text-white">{i + 1}</span>
                  <p className="mt-3 font-display text-lg font-bold">{t(h)}</p>
                  <p className="mt-1 text-sm text-ink/80">{t(d)}</p>
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">{t("2. Prices")}</h2>
            <p className="mt-3 text-ink/80">
              {t("The price on the lot page is the price you pay for the lot. There's no bidding and no reserve. Freight to your ZIP is added at checkout, and sales tax is added unless you have an approved resale certificate on file. Promo codes can be applied in the cart.")}
            </p>
            <p className="mt-3 text-ink/80">
              {t("A lot in your cart isn't reserved. Other buyers can still order it until you complete checkout, so check out once you've decided.")}
            </p>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">{t("3. Paying")}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80 marker:text-signal">
              <li><strong>{t("Card")}</strong>: {t("your order is confirmed immediately.")}</li>
              <li><strong>{t("Wire / ACH")}</strong>: {t("we confirm the order once we've reviewed it and received payment.")}</li>
              <li><strong>Net 30</strong>: {t("available to verified resellers with an approved resale certificate.")}</li>
              <li>{t("While an order is Pending you can cancel it from your")} <Link href={lh("/orders")} className="font-semibold text-signal-dark hover:underline">{t("Orders")}</Link> {t("page.")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">{t("4. After you order")}</h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-ink/80 marker:text-signal">
              <li>{t("We prepare and wrap your lots and book the freight.")}</li>
              <li>{t("Your order page shows each step, and the tracking (PRO) number once the shipment is booked.")}</li>
              <li>{t("Inspect the delivery and note any visible damage on the delivery receipt before you sign.")}</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-2xl font-bold">{t("5. Lot sizes & shipping")}</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              {Object.entries(LOT_SIZES).map(([k, v]) => (
                <div key={k} className="card p-5">
                  <p className="font-display text-lg font-bold">{t(v.plural)}</p>
                  <p className="mt-1 text-sm text-muted">{t(v.note)}</p>
                </div>
              ))}
            </div>
            <p className="mt-4 text-sm text-ink/80">
              {t("Pallet freight is estimated at {perPallet} per pallet and free on orders over {free}. Truckloads are quoted per trailer.", { perPallet: money(17500), free: money(750000) })}{" "}
              {t("Warehouse pickup is available by appointment only:")}{" "}
              <Link href={lh("/contact?topic=pickup")} className="font-semibold text-signal-dark hover:underline">{t("request it through Contact")}</Link> {t("before checkout.")}
            </p>
          </section>
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-40 lg:h-fit">
          <div className="card p-5">
            <p className="font-display text-lg font-bold">{t("Ready to order?")}</p>
            <p className="mt-1 text-sm text-muted">{t("Create a free business account in under a minute.")}</p>
            <Link href={lh("/register")} className="btn-primary mt-4 w-full">{t("Create account")}</Link>
            <Link href={lh("/lots")} className="btn-ghost mt-2 w-full">{t("Shop all lots")}</Link>
          </div>
          <div className="rounded-2xl bg-sand p-5 text-sm">
            <p className="font-semibold">{t("Tips from experienced buyers")}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-ink/80">
              <li>{t("Price in freight before you order.")}</li>
              <li>{t("Check the top five manifest lines — they carry most of the value.")}</li>
              <li>{t("Compare with")} <Link href={lh("/lots?sold=1")} className="font-semibold text-signal-dark">{t("recently sold")}</Link> {t("lots.")}</li>
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
