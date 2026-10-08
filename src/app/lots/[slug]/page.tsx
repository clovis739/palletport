import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getPublicLot, getRelatedCards } from "@/lib/storefront-products";
import { getSession } from "@/lib/auth";
import { LotCard } from "@/components/LotCard";
import { SubmitButton } from "@/components/SubmitButton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { Stars } from "@/components/Stars";
import { ConditionBadge } from "@/components/ConditionBadge";
import { LotGallery } from "@/components/lot/LotGallery";
import { lotImages } from "@/lib/lotImages";
import { ShippingEstimator } from "@/components/lot/ShippingEstimator";
import { ManifestTable } from "@/components/lot/ManifestTable";
import { CopyLink } from "@/components/lot/CopyLink";
import { Select } from "@/components/ui/Select";
import { VisitBooking } from "@/components/lot/VisitBooking";
import { bookedVisitTimes } from "@/lib/visits-server";
import { addToCart } from "@/app/actions/cart";
import { GaEvent, GaOnSubmit } from "@/components/analytics/GaEvent";
import { gaMoney, type GaItem } from "@/lib/analytics";
import { NextIcon } from "@/components/Icons";
import { getI18n } from "@/i18n/server";
import { Check, Star, MessageCircle } from "lucide-react";
import {
  CONDITIONS,
  LOT_SIZES,
  money,
  pctOfRetail,
  purchasePrice,
  timeAgo,
} from "@/lib/format";
import { JsonLd, breadcrumbJsonLd, lotIndexable, pageMetadata, productJsonLd } from "@/lib/seo";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  const { t } = await getI18n();
  const lot = await getPublicLot(slug);
  if (!lot || lot.status === "DRAFT") return { title: t("Lot not found"), robots: { index: false } };
  const cond = t(CONDITIONS[lot.condition]?.label ?? lot.condition);
  const suffix = ` — ${cond} · ${money(lot.priceCents)}`;
  const room = Math.max(24, 60 - suffix.length);
  const short = lot.title.length <= room ? lot.title : `${lot.title.slice(0, room - 1).replace(/\s+\S*$/, "")}…`;
  const priceBit = lot.status === "ACTIVE" ? t("{price}, in stock.", { price: money(lot.priceCents) }) : t("Sold out.");
  // Lead with this lot's own manifest: the two lines with the highest extended retail (qty × unit MSRP).
  const top = [...lot.manifest]
    .sort((a, b) => b.qty * b.unitMsrpCents - a.qty * a.unitMsrpCents)
    .slice(0, 2)
    .map((m) => (m.qty > 1 ? `${m.qty}× ${m.name}` : m.name));
  const units = lot.units > 0 ? t("{n} units", { n: lot.units.toLocaleString("en-US") }) : t("Assorted inventory");
  const size = lot.palletCount > 1 ? t(" on {n} pallets", { n: lot.palletCount }) : lot.lotSize === "CASE" ? t(" (case pack)") : "";
  const lead = top.length ? `${units}${size} ${t("incl.")} ${top.join(" & ")}${lot.manifest.length > 2 ? t(" + more") : ""}.` : `${units}${size}.`;
  const pct = pctOfRetail(lot.priceCents, lot.msrpCents);
  return pageMetadata({
    title: `${short}${suffix}`,
    absoluteTitle: true,
    description: lot.externalSku
      ? `${lot.description.slice(0, 150)} ${priceBit} ${t("Ships from {place}.", { place: lot.shipsFrom })}`
      : `${lead} ${cond} · ${t("{pct}% of {retail} retail", { pct, retail: money(lot.msrpCents) })} · ${priceBit} ${t("Ships from {place}.", { place: lot.shipsFrom })}`,
    path: `/lots/${slug}`,
    image: `/lots/${slug}/opengraph-image`,
    imageAlt: lot.title,
    // Sold-out lots more than SOLD_INDEX_DAYS past their sale stay reachable
    // for buyers but drop out of search results (the sitemap applies the same rule via lotIndexable()).
    noIndex: !lotIndexable(lot),
  });
}

const SECTIONS = [
  ["overview", "Overview"],
  ["manifest", "Manifest"],
  ["shipping", "Shipping & pickup"],
  ["terms", "Payment & terms"],
  ["reviews", "Reviews"],
] as const;

export default async function LotPage({ params }: { params: Params }) {
  const { slug } = await params;
  const lot = await getPublicLot(slug);
  if (!lot || lot.status === "DRAFT") notFound();
  const { t, lh } = await getI18n();

  const session = await getSession();
  const [saved, reviews, me, related, booked] = await Promise.all([
    session ? db.favorite.findUnique({ where: { userId_lotId: { userId: session.userId, lotId: lot.id } } }) : null,
    db.review.findMany({ where: { sellerId: lot.sellerId }, include: { user: { select: { businessName: true, name: true } } }, orderBy: { createdAt: "desc" }, take: 3 }),
    session ? db.user.findUnique({ where: { id: session.userId }, select: { shipPostal: true } }) : null,
    getRelatedCards(lot.categoryId, lot.id),
    bookedVisitTimes(),
  ]);

  const buyPrice = purchasePrice(lot);
  const pct = pctOfRetail(lot.priceCents, lot.msrpCents);
  const perUnit = lot.units > 0 ? Math.round(lot.priceCents / lot.units) : null;
  const lotNo = lot.id.slice(-6).toUpperCase();
  const top = lot.manifest.slice(0, 3);
  const topShare = lot.msrpCents ? Math.round((top.reduce((a, m) => a + m.qty * m.unitMsrpCents, 0) / lot.msrpCents) * 100) : 0;

  const facts: [string, string][] = [
    [t("Lot #"), lotNo],
    [t("SKU"), lot.sku],
    ...(lot.sourceOriginalPriceCents ? [[t("Previous listed price"), money(lot.sourceOriginalPriceCents)] as [string, string]] : []),
    ...(lot.msrpCents > 0 ? [[t("Est. retail"), money(lot.msrpCents)] as [string, string]] : []),
    ...(lot.units > 0 ? [[t("Units"), lot.units.toLocaleString()] as [string, string]] : []),
    [t("Condition"), lot.sourceCondition || t(CONDITIONS[lot.condition]?.label || lot.condition)],
    [t("Lot size"), t(LOT_SIZES[lot.lotSize]?.label ?? lot.lotSize)],
    [t("Pallets"), lot.lotSize === "CASE" ? "—" : lot.palletCount > 0 ? String(lot.palletCount) : t("Not specified")],
    ...(lot.weightLbs > 0 ? [[t("Weight"), `${lot.weightLbs.toLocaleString()} ${t("lbs")}`] as [string, string]] : []),
    [t("FOB"), lot.shipsFrom],
    ...(lot.brand ? ([[t("Brand"), lot.brand]] as [string, string][]) : []),
    [t("Category"), lot.subcategory ? `${t(lot.category.name)} / ${t(lot.subcategory.name)}` : t(lot.category.name)],
    ...(perUnit !== null ? [[t("Price / unit"), money(perUnit, { cents: true })] as [string, string]] : []),
    ...(lot.sourceDelivery ? [[t("Delivery"), lot.sourceDelivery] as [string, string]] : []),
    [t("In stock"), lot.status === "ACTIVE" ? String(lot.available) : t("Sold out")],
  ];

  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/lots" },
    { name: lot.category.name, path: `/c/${lot.category.slug}` },
    ...(lot.subcategory ? [{ name: lot.subcategory.name, path: `/lots?category=${lot.category.slug}&sub=${lot.subcategory.slug}` }] : []),
    { name: lot.title, path: `/lots/${lot.slug}` },
  ];

  const gaItem: GaItem = {
    item_id: lot.sku,
    item_name: lot.title,
    price: gaMoney(buyPrice ?? lot.priceCents),
    item_category: lot.category.name,
    ...(lot.subcategory ? { item_category2: lot.subcategory.name } : {}),
  };

  return (
    <div className="container-pp py-6">
      <JsonLd data={[productJsonLd(lot, lot.seller.name), breadcrumbJsonLd(crumbs)]} />
      <GaEvent name="view_item" params={{ currency: "USD", value: gaItem.price, items: [gaItem] }} />
      <nav className="mb-4 text-xs text-muted">
        <Link href={lh("/")} className="hover:underline">{t("Home")}</Link> /{" "}
        <Link href={lh("/lots")} className="hover:underline">{t("Shop")}</Link> /{" "}
        <Link href={lh(`/c/${lot.category.slug}`)} className="hover:underline">{t(lot.category.name)}</Link>
        {lot.subcategory && (
          <> / <Link href={lh(`/lots?category=${lot.category.slug}&sub=${lot.subcategory.slug}`)} className="hover:underline">{t(lot.subcategory.name)}</Link></>
        )}
      </nav>

      {/* Title row */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 max-w-3xl">
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
            <ConditionBadge condition={lot.condition} />
            <span className="font-mono text-muted">{t("Lot #{n}", { n: lotNo })}</span>
            <span className="text-muted">· {t(lot.views === 0 ? "{n} view" : "{n} views", { n: lot.views + 1 })}</span>
          </div>
          <h1 className="break-words font-display text-2xl font-bold leading-tight sm:text-3xl">{lot.title}</h1>
          <p className="mt-1 text-sm text-muted">
            {lot.units > 0 ? `${t("{n} units", { n: lot.units.toLocaleString() })} · ` : ""}{lot.msrpCents > 0 ? `${t("{price} est. retail", { price: money(lot.msrpCents) })} · ` : ""}FOB: {lot.shipsFrom}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <FavoriteButton lotId={lot.id} saved={!!saved} back={lh(`/lots/${lot.slug}`)} />
          <CopyLink />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_380px]">
        {/* Left column, top: gallery + key facts. On phones the purchase box follows right after this. */}
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-1">
          <LotGallery images={lotImages(lot)} />

          {/* Key facts */}
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-line text-sm sm:grid-cols-3 lg:grid-cols-4">
            {facts.map(([k, v]) => (
              <div key={k} className="bg-white p-3">
                <dt className="text-[11px] font-semibold uppercase tracking-wider text-muted">{k}</dt>
                <dd className="truncate font-semibold" title={v}>{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right column: sticky purchase box */}
        <aside className="min-w-0 space-y-4 md:grid md:grid-cols-2 md:items-start md:gap-4 md:space-y-0 lg:col-start-2 lg:block lg:space-y-4 lg:row-span-2 lg:row-start-1 lg:self-start lg:[@media(min-height:560px)]:sticky lg:[@media(min-height:560px)]:top-[148px] lg:[@media(min-height:560px)]:max-h-[calc(100dvh-164px)] lg:[@media(min-height:560px)]:overflow-y-auto lg:[@media(min-height:560px)]:overscroll-contain">
          <div className="card space-y-4 p-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Price")}</p>
              <p className="font-display text-3xl font-bold sm:text-4xl">{money(lot.priceCents)}</p>
              {lot.compareAtPriceCents > lot.priceCents && <p className="mt-1 text-sm text-muted">{t("Original price")} <span className="line-through">{money(lot.compareAtPriceCents)}</span></p>}
              <p className="break-words text-sm text-muted">
                {perUnit !== null ? <>{money(perUnit, { cents: true })} {t("per unit")} ·{" "}</> : null}
                {buyPrice !== null ? <span className="font-semibold text-moss">{lot.available > 1 ? t("{n} in stock", { n: lot.available }) : t("In stock")}</span> : t("Sold out")}
              </p>
            </div>

            {buyPrice !== null ? (
              <form action={addToCart} className="space-y-3 pt-2">
                <input type="hidden" name="lotId" value={lot.id} />
                <GaOnSubmit name="add_to_cart" params={{ currency: "USD", items: [gaItem] }} />
                {lot.available > 1 && (
                  <label className="flex items-center justify-between text-sm">
                    <span>{t("Quantity")}</span>
                    <Select name="quantity" className="input w-24 shrink-0 py-2">
                      {Array.from({ length: Math.min(lot.available, 20) }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
                    </Select>
                  </label>
                )}
                <SubmitButton name="intent" value="cart" className="btn-primary w-full py-3" pendingText={t("Adding…")}>{t("Add to cart")}</SubmitButton>
                <SubmitButton name="intent" value="buy" className="btn-dark w-full py-3" pendingText={t("Going to checkout…")}>{t("Buy now")}</SubmitButton>
              </form>
            ) : null}
            {buyPrice !== null ? (
              <div className="space-y-1.5">
                <p className="pt-1 text-center text-xs font-semibold uppercase tracking-wider text-muted">{t("or collect it yourself")}</p>
                <VisitBooking
                  lot={{ slug: lot.slug, title: lot.title, priceCents: lot.priceCents, available: lot.available }}
                  booked={booked}
                  signedIn={!!session}
                  location={lot.shipsFrom}
                />
              </div>
            ) : buyPrice === null ? (
              <div className="space-y-2">
                <p className="rounded-lg bg-sand p-3 text-center text-sm font-semibold">{t("This lot has sold out.")}</p>
                <Link href={lh(`/c/${lot.category.slug}`)} className="btn-ghost w-full py-2.5 text-sm">{t("Shop similar {name}", { name: t(lot.category.name) })}</Link>
              </div>
            ) : null}

            <ul className="space-y-1.5 pt-4 text-xs text-ink/75">
              {lot.manifest.length > 0 && <li className="flex items-start gap-2"><Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /><span>{t("Full manifest — {skus} SKUs, {units} units", { skus: lot.manifest.length, units: lot.units.toLocaleString() })}</span></li>}
              {lot.msrpCents > 0 && <li className="flex items-start gap-2"><Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /><span>{t("Est. retail {price} ({pct}% of retail)", { price: money(lot.msrpCents), pct })}</span></li>}
              <li className="flex items-start gap-2"><Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /><span>{t("Sold & shipped by {name}", { name: lot.seller.name })} · <Star aria-hidden className="inline-block h-[1em] w-[1em] fill-signal align-[-0.125em] text-signal" /> {lot.seller.rating.toFixed(1)}</span></li>
              <li className="flex items-start gap-2"><Check aria-hidden className="mt-0.5 h-3.5 w-3.5 shrink-0 text-moss" /><span>{t("Pay by card, wire/ACH or Net 30")}</span></li>
            </ul>
          </div>

          <ShippingEstimator
            pickup={lot.seller.pickup}
            defaultZip={me?.shipPostal}
            line={{
              sellerId: lot.sellerId,
              sellerName: lot.seller.name,
              shipsFrom: lot.shipsFrom,
              lotSize: lot.lotSize,
              palletCount: lot.palletCount,
              weightLbs: lot.weightLbs,
              quantity: 1,
              priceCents: buyPrice ?? lot.priceCents,
            }}
          />
        </aside>

        {/* Left column, below: detail sections */}
        <div className="min-w-0 space-y-8 lg:col-start-1 lg:row-start-2">
          {/* Section nav */}
          <nav aria-label={t("On this page")} className="-mx-1 flex gap-2 overflow-x-auto overscroll-x-contain px-1 pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {SECTIONS.filter(([id]) => id !== "manifest" || lot.manifest.length > 0).map(([id, label]) => (
              <a key={id} href={`#${id}`} className="shrink-0 rounded-full bg-sand px-3.5 py-1.5 text-sm font-semibold text-ink transition-colors hover:bg-signal hover:text-white focus-visible:bg-signal focus-visible:text-white focus-visible:outline-none">{t(label)}</a>
            ))}
          </nav>

          <section id="overview" className="scroll-mt-24 space-y-4">
            <h2 className="font-display text-xl font-bold">{t("Overview")}</h2>
            <p className="whitespace-pre-line leading-relaxed text-ink/85">{lot.description}</p>
            {(lot.msrpCents > 0 || lot.manifest.length > 0) && <div className="grid gap-3 sm:grid-cols-3">
              {lot.msrpCents > 0 && <>
              <div className="rounded-xl bg-sand/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Price vs. retail")}</p>
                <p className="font-display text-2xl font-bold">{pct}%</p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full bg-signal" style={{ width: `${Math.min(100, pct)}%` }} /></div>
              </div>
              <div className="rounded-xl bg-sand/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Top 3 lines")}</p>
                <p className="font-display text-2xl font-bold">{topShare}%</p>
                <p className="text-xs text-muted">{t("of the lot's retail value")}</p>
              </div>
              </>}
              {lot.manifest.length > 0 &&
              <div className="rounded-xl bg-sand/60 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{t("Distinct items")}</p>
                <p className="font-display text-2xl font-bold">{lot.manifest.length}</p>
                <p className="text-xs text-muted">{t("SKUs on the manifest")}</p>
              </div>}
            </div>}
            <div className="rounded-xl bg-white p-4 text-sm">
              <p className="font-semibold">{t("Condition")}: {lot.sourceCondition || t(CONDITIONS[lot.condition]?.label ?? "")}</p>
              {!lot.externalSku && <p className="mt-1 text-ink/75">{t(CONDITIONS[lot.condition]?.note ?? "")} {t("Lots are sold as-is according to this grade.")}</p>}
              {lot.externalSku && <p className="mt-1 text-ink/75">{t("Product assortment and packaging may vary. Review the description and photos before ordering.")}</p>}
            </div>
            {top.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">{t("Highest-value items")}</p>
                <ul className="grid gap-2 sm:grid-cols-3">
                  {top.map((m) => (
                    <li key={m.id} className="rounded-xl bg-white p-3 text-sm">
                      <p className="line-clamp-1 font-medium">{m.name}</p>
                      <p className="text-xs text-muted">{m.qty} × {money(m.unitMsrpCents)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {lot.manifest.length > 0 && <section id="manifest" className="scroll-mt-24">
            <h2 className="mb-3 font-display text-xl font-bold">{t("Manifest")}</h2>
            <ManifestTable rows={lot.manifest} csvHref={`/lots/${lot.slug}/manifest.csv`} />
            <p className="mt-2 text-xs text-muted">{t("Manifests are prepared by our warehouse team. Small count variances are normal; see the Return & Refund Policy if something doesn't match.")}</p>
          </section>}

          <section id="shipping" className="scroll-mt-24 space-y-3">
            <h2 className="font-display text-xl font-bold">{t("Shipping & pickup")}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="card p-4 text-sm">
                <p className="font-semibold">{t(lot.lotSize === "CASE" ? "Parcel delivery" : lot.lotSize === "TRUCKLOAD" ? "Full truckload" : "LTL freight")}</p>
                <p className="mt-1 text-ink/75">
                  {lot.externalSku
                    ? t("Shipping weight and packaging dimensions are not confirmed for this listing. Contact us if you need an exact freight quote before ordering.")
                    : lot.lotSize === "CASE"
                    ? t("Ships in sealed cartons by parcel carrier. No dock needed.")
                    : lot.lotSize === "TRUCKLOAD"
                      ? t("{n} pallets on a 53' trailer. A loading dock and forklift are required.", { n: lot.palletCount })
                      : t(lot.palletCount > 1 ? "{n} standard 48×40 pallets, about {lbs} lbs each. Liftgate available if you don't have a dock." : "{n} standard 48×40 pallet, about {lbs} lbs each. Liftgate available if you don't have a dock.", { n: lot.palletCount, lbs: Math.round(lot.weightLbs / Math.max(1, lot.palletCount)).toLocaleString() })}
                </p>
              </div>
              <div className="card p-4 text-sm">
                <p className="font-semibold">{t("Warehouse pickup by appointment")}</p>
                <p className="mt-1 text-ink/75">
                  {t("Collect from our warehouse in {place}, Monday to Friday.", { place: lot.shipsFrom })}{" "}
                  {t("Use")} <strong>{t("Warehouse pickup · book a visit")}</strong>{" "}
                  {t("above to choose a 50-minute visit at least 45 hours ahead. Orders of $600 or more pay a refundable 35% deposit to confirm; smaller orders pay in full. There's no walk-in store.")}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted">{t("Freight is free on orders over $7,500 (liftgate and residential fees still apply). Inspect pallets and note any damage on the delivery receipt before signing.")}</p>
          </section>

          <section id="terms" className="scroll-mt-24 space-y-3">
            <h2 className="font-display text-xl font-bold">{t("Payment & terms")}</h2>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Payment", "Card, wire/ACH, or Net 30 for verified resellers."],
                ["Checkout", "Pay the listed price plus freight. We confirm and prepare your order within one business day."],
                ["Sales tax", "Charged where applicable unless a valid resale certificate is on file."],
                ["Returns", "15-day returns with written approval. Sold per the condition grade; see the Return & Refund Policy."],
              ].map(([h, d]) => (
                <li key={h} className="rounded-xl bg-white p-4">
                  <p className="font-semibold">{t(h)}</p>
                  <p className="text-ink/75">{t(d)}</p>
                </li>
              ))}
            </ul>
            <p className="text-xs"><Link href={lh("/legal/returns-and-disputes")} className="font-semibold text-signal-dark hover:underline">{t("Return & Refund Policy")}</Link> · <Link href={lh("/how-to-buy")} className="font-semibold text-signal-dark hover:underline">{t("How ordering works")}</Link></p>
          </section>

          <section id="reviews" className="scroll-mt-24 grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
            <div className="card p-5">
              <p className="font-display text-lg font-bold">{t("Questions about this lot?")}</p>
              <p className="mt-1 text-sm text-ink/75">
                {t("Ask our warehouse team about photos, testing, freight or a pickup appointment. Quote lot #{lot} and we'll reply within one business day.", { lot: lotNo })}
              </p>
              <p className="mt-3 flex items-center gap-1 text-xs text-muted">
                <Stars value={lot.seller.rating} /> {lot.seller.rating.toFixed(1)} {t(lot.seller._count.reviews === 1 ? "from {n} customer review" : "from {n} customer reviews", { n: lot.seller._count.reviews })}
              </p>
              <Link href={lh(`/contact?lot=${lotNo}`)} className="btn-ghost mt-4 py-2 text-xs"><MessageCircle aria-hidden className="h-3.5 w-3.5" /> {t("Ask a question")}</Link>
            </div>
            <div className="space-y-3">
              <h2 className="font-display text-xl font-bold">{t("Customer reviews")}</h2>
              {reviews.length === 0 && <p className="text-sm text-muted">{t("No reviews yet.")}</p>}
              {reviews.map((r) => (
                <div key={r.id} className="card p-4">
                  <div className="flex items-center justify-between"><Stars value={r.rating} /><span className="text-xs text-muted">{timeAgo(r.createdAt)}</span></div>
                  <p className="mt-1 text-sm">{r.body}</p>
                  <p className="mt-1 text-xs font-semibold text-muted">{r.user.businessName ?? r.user.name}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>

      {related.length > 0 && (
        <section className="mt-14">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <h2 className="font-display text-2xl font-bold">{t("Similar lots")}</h2>
            <Link href={lh(`/c/${lot.category.slug}`)} className="text-sm font-semibold text-signal-dark hover:underline">{t("More {name}", { name: t(lot.category.name) })}<NextIcon /></Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{related.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        </section>
      )}
    </div>
  );
}
