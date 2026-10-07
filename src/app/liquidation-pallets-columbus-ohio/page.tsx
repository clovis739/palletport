import Link from "next/link";
import { Boxes, CalendarClock, FileText, MapPin, Package, Sparkles, Truck } from "lucide-react";
import { db } from "@/lib/db";
import { getStore } from "@/lib/store";
import { LotCard } from "@/components/LotCard";
import { Photo } from "@/components/Photo";
import { PHOTOS } from "@/content/photos";
import { NextIcon } from "@/components/Icons";
import { FaqSection } from "@/components/content/FaqSection";
import { LocationMap } from "@/components/content/LocationMap";
import { GoogleReviews } from "@/components/content/GoogleReviews";
import { getSetting } from "@/lib/settings";
import { JsonLd, breadcrumbJsonLd, pageMetadata, webPageJsonLd } from "@/lib/seo";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

const PATH = "/liquidation-pallets-columbus-ohio";
const TITLE = "Liquidation pallets in Columbus, Ohio";
const DESCRIPTION =
  "Manifested liquidation pallets, truckloads and case packs from our Columbus, Ohio warehouse, delivered across Ohio and the Midwest. Pickup by appointment.";

export const generateMetadata = () => pageMetadata({ title: TITLE, description: DESCRIPTION, path: PATH });

const lotInclude = { category: true, seller: true } as const;

export default async function ColumbusOhioPage() {
  const [store, lots, categories, business] = await Promise.all([
    getStore(),
    db.lot.findMany({ where: { status: "ACTIVE" }, include: lotInclude, orderBy: [{ featured: "desc" }, { createdAt: "desc" }], take: 8 }),
    db.category.findMany({ where: { hidden: false }, orderBy: [{ position: "asc" }, { name: "asc" }], select: { name: true, slug: true, _count: { select: { lots: { where: { status: "ACTIVE" } } } } } }),
    getSetting("business"),
  ]);
  const where = store.location;
  const { t, lh } = await getI18n();

  const faqs = [
    {
      q: t("Can I pick up a pallet in Columbus?"),
      a: t("Yes, by appointment at our warehouse in {place}. Open any lot and choose “Warehouse pickup · book a visit” to pick a weekday (Monday to Friday) and a 50-minute time at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full. There's no walk-in store or showroom.", { place: where }),
    },
    {
      q: t("Do you deliver to Cleveland, Cincinnati, Dayton and Toledo?"),
      a: t("Yes. We ship to any US address, including every city in Ohio. Pallets go by LTL freight, full truckloads on a 53-foot trailer, and case packs by parcel."),
    },
    {
      q: t("How fast is delivery in Ohio?"),
      a: t("It depends on the carrier, the lot size and your exact location. Enter your ZIP on any lot page to see a freight estimate with an expected transit time, and your order page shows tracking once the shipment is booked."),
    },
    {
      q: t("Can I see the pallets before I buy?"),
      a: t("We don't have a walk-in store. Every lot page has the full manifest with SKUs, quantities and retail values, plus the condition grade. If you have a question about a specific lot, use Ask a question on the lot page and our warehouse team will reply."),
    },
    {
      q: t("Do I need a loading dock?"),
      a: t("Not for pallets or case packs. Choose liftgate delivery at checkout if you don't have a dock, and have a pallet jack ready. Full truckloads need a dock and a forklift."),
    },
  ];

  const ways = [
    { href: lh("/pallets"), icon: Package, t: t("Pallets"), d: t("One or a few standard 48×40 pallets, shipped by LTL freight.") },
    { href: lh("/truckloads"), icon: Truck, t: t("Truckloads"), d: t("Full trailers of 18–26 pallets for volume buyers with a dock.") },
    { href: lh("/case-packs"), icon: Boxes, t: t("Case packs"), d: t("Sealed cartons by parcel. The easiest way to try a category.") },
    { href: lh("/new"), icon: Sparkles, t: t("New arrivals"), d: t("The latest lots from our warehouse floor, all at fixed prices.") },
  ];

  const steps = [
    ["Register your business", "Create a free buyer account. Add a resale certificate for tax-exempt buying and Net 30 terms."],
    ["Read the manifest", "Check the item list, condition grade and a freight estimate for your ZIP on the lot page."],
    ["Add to cart & check out", "Every lot has one fixed price. Pick a quantity, add it to your cart and check out."],
    ["Pay and receive", "Pay by card, wire/ACH or Net 30. We book the freight and add tracking to your order."],
  ];

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Columbus, Ohio", path: PATH }]),
          webPageJsonLd("WebPage", t(TITLE), PATH, t(DESCRIPTION)),
        ]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden bg-ink text-white">
        <Photo photo={PHOTOS.boxesOnPallets} width={1600} ratio={16 / 9} sizes="100vw" priority alt="" className="absolute inset-0 h-full w-full" />
        <div className="absolute inset-0 bg-ink/80" />
        <div data-hero className="container-pp relative py-10 sm:py-14 md:py-20">
          <nav className="mb-3 text-xs text-white/60"><Link href={lh("/")} className="hover:underline">{t("Home")}</Link> / Columbus, Ohio</nav>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-signal">
            <MapPin aria-hidden className="h-4 w-4 shrink-0" /> {t("Our warehouse:")} {where}
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.1] sm:text-5xl sm:leading-[1.05]">
            {t("Liquidation pallets from our Columbus, Ohio warehouse")}
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/75 sm:text-lg">
            {t("We sell our own manifested lots of customer returns, shelf pulls and overstock by the case, pallet or truckload, and deliver across Ohio and the rest of the country.")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href={lh("/lots")} className="btn-primary">{t("Browse current lots")}</Link>
            <Link href={lh("/lots")} className="inline-flex min-h-11 items-center rounded-full px-5 py-2 text-sm font-semibold hover:bg-white/10">{t("Book a warehouse visit")}</Link>
          </div>
        </div>
      </section>

      <div className="container-pp space-y-14 py-10 sm:space-y-16 sm:py-14">
        {/* Who we are + pickup */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="label">{t("Who we are")}</p>
            <h2 className="font-display text-2xl font-bold sm:text-3xl">{t("One warehouse, our own inventory")}</h2>
            <div className="mt-4 max-w-2xl space-y-4 text-[15px] leading-relaxed text-ink/80">
              <p>
                {t("{name} isn't a marketplace of outside sellers. Every lot on the site is ours: we buy returns, shelf pulls and overstock, then sort, grade and manifest each lot in our warehouse in {place} before it goes on sale.", { name: store.name, place: where })}
              </p>
              <p>
                {t("That makes us a practical source for Ohio and Midwest resellers: bin stores, discount and dollar stores, online sellers, flea-market vendors and refurbishers. Each lot page shows the manifest, the condition grade, the unit count and a freight estimate for your ZIP, so you know what you're buying and what delivery will cost before you order.")}
              </p>
            </div>
          </div>
          <aside aria-labelledby="pickup-title" className="min-w-0 self-start rounded-2xl bg-sand/70 p-5 sm:p-6">
            <CalendarClock aria-hidden className="h-6 w-6 text-signal-dark" />
            <h2 id="pickup-title" className="mt-2 font-display text-lg font-bold">{t("Pickup is by appointment only")}</h2>
            <p className="mt-2 text-sm text-ink/80">
              {t("There's no walk-in store or showroom. If you'd rather collect than pay for freight, open the lot and choose")} <strong>{t("Warehouse pickup · book a visit")}</strong>: {t("pick a weekday and a 50-minute time at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full.")}
            </p>
            <Link href={lh("/lots")} className="btn-dark mt-4 w-full">{t("Choose a lot to collect")}</Link>
          </aside>
        </section>

        {/* What you can buy */}
        <section aria-labelledby="buy-title">
          <p className="label">{t("What you can buy")}</p>
          <h2 id="buy-title" className="font-display text-2xl font-bold sm:text-3xl">{t("By the case, pallet or truckload")}</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {ways.map((w) => (
              <li key={w.href}>
                <Link href={w.href} className="card flex h-full flex-col p-5 transition hover:-translate-y-0.5">
                  <w.icon aria-hidden className="h-6 w-6 text-signal-dark" />
                  <span className="mt-3 font-display text-lg font-bold">{w.t}</span>
                  <span className="mt-1 text-sm text-muted">{w.d}</span>
                </Link>
              </li>
            ))}
          </ul>
          {categories.length > 0 && (
            <div className="mt-6">
              <h3 className="label">{t("Shop by category")}</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <Link key={c.slug} href={lh(`/c/${c.slug}`)} className="inline-flex min-h-9 items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-sm font-medium">
                    {t(c.name)}<span className="text-xs text-muted">{c._count.lots}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Live lots */}
        {lots.length > 0 && (
          <section aria-labelledby="lots-title">
            <div className="mb-4 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
              <h2 id="lots-title" className="font-display text-2xl font-bold sm:text-3xl">{t("On sale now")}</h2>
              <Link href={lh("/lots")} className="text-sm font-semibold text-signal-dark hover:underline">{t("All lots")}<NextIcon /></Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{lots.map((l) => <LotCard key={l.id} lot={l} />)}</div>
          </section>
        )}

        {/* Delivery */}
        <section aria-labelledby="delivery-title" className="grid grid-cols-1 gap-8 rounded-3xl bg-ink p-6 text-white sm:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:gap-12">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-signal">{t("Delivery")}</p>
            <h2 id="delivery-title" className="mt-2 font-display text-2xl font-bold sm:text-3xl">{t("Across Ohio and neighboring states")}</h2>
            <p className="mt-3 text-white/75">
              {t("We ship from {place} to any US address, from Cleveland, Toledo, Dayton and Cincinnati to Indiana, Michigan, Kentucky, Pennsylvania and West Virginia. Enter your ZIP on any lot page for a freight estimate before you order.", { place: where })}
            </p>
          </div>
          <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            {[
              ["LTL freight", "Pallet lots. Dock delivery, or liftgate if you don't have a dock."],
              ["Full truckload", "A 53-foot trailer. Needs a loading dock and a forklift."],
              ["Parcel", "Case packs in sealed cartons. No dock or pallet jack needed."],
            ].map(([h, d]) => (
              <li key={h} className="rounded-2xl bg-white/5 p-4">
                <p className="font-display font-semibold">{t(h)}</p>
                <p className="mt-1 text-sm text-white/65">{t(d)}</p>
              </li>
            ))}
          </ul>
        </section>

        <LocationMap business={business} title={t("Our Columbus warehouse")} note={t("Pickup is by appointment only. Book a visit from any lot page.")} />
        <GoogleReviews business={business} className="" />

        {/* How buying works */}
        <section aria-labelledby="how-title">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 id="how-title" className="font-display text-2xl font-bold sm:text-3xl">{t("How buying works")}</h2>
            <Link href={lh("/how-to-buy")} className="text-sm font-semibold text-signal-dark hover:underline">{t("Full buying guide")}<NextIcon /></Link>
          </div>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(([h, d], i) => (
              <li key={h} className="rounded-2xl bg-sand/60 p-5">
                <span className="font-display text-sm font-bold text-signal-dark">0{i + 1}</span>
                <h3 className="mt-2 font-display text-lg font-semibold">{t(h)}</h3>
                <p className="mt-1 text-sm text-ink/75">{t(d)}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 text-sm text-muted">
            <FileText aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {t("15-day returns with written approval, including when an order doesn't match its listing. See our")}{" "}
              <Link href={lh("/legal/returns-and-disputes")} className="font-semibold text-signal-dark hover:underline">{t("Return & Refund Policy")}</Link>.
            </span>
          </p>
        </section>

        <FaqSection items={faqs} title={t("Columbus and Ohio buyers: common questions")} className="max-w-3xl" />
      </div>
    </>
  );
}
