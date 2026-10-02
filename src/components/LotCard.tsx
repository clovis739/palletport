import Link from "next/link";
import { ProductPhoto } from "./lot/ProductPhoto";
import { lotCover } from "@/lib/lotImages";
import { ConditionBadge } from "./ConditionBadge";
import { CardAddToCart } from "./lot/CardAddToCart";
import { LOT_SIZES, money, pctOfRetail } from "@/lib/format";
import { ArrowRight, MapPin, Package } from "lucide-react";

export type LotCardData = {
  /** Needed for the card's Add to cart button (omit to show a "View lot" link instead). */
  id?: string;
  slug: string;
  title: string;
  condition: string;
  priceCents: number;
  msrpCents: number;
  units: number;
  palletCount: number;
  shipsFrom: string;
  status: string;
  lotSize?: string;
  available?: number;
  images?: string | null;
  /** Main brand ("" = mixed), shown above the title. */
  brand?: string;
  category: { hue: number; name: string; slug?: string };
  seller?: { name: string; verified: boolean };
};

/**
 * Product card: photo with stock badge, title, key facts (lot #, condition, units, ships from), price and an
 * Add to cart button that works without leaving the page. The photo, the title and "View details" link to the
 * lot page; Add to cart adds the lot without leaving the page. `priority`: above-the-fold cards load the cover eagerly.
 */
export function LotCard({ lot, priority = false }: { lot: LotCardData; priority?: boolean }) {
  const pct = pctOfRetail(lot.priceCents, lot.msrpCents);
  const cover = lotCover(lot);
  const soldOut = lot.status !== "ACTIVE";
  const stock = lot.available ?? 1;
  const perUnit = lot.units > 0 ? Math.round(lot.priceCents / lot.units) : 0;
  const href = `/lots/${lot.slug}`;
  const lotNo = lot.id ? lot.id.slice(-6).toUpperCase() : null;

  return (
    <article className="group card flex flex-col overflow-hidden transition hover:-translate-y-0.5">
      <Link href={href} aria-label={`View details: ${lot.title}`} className="relative block overflow-hidden focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <ProductPhoto
          src={cover.src}
          alt=""
          width={640}
          height={400}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : undefined}
          decoding={priority ? undefined : "async"}
          className="aspect-[16/10] w-full bg-sand object-cover transition duration-300 group-hover:scale-[1.03]"
        />
        <span
          className={`absolute left-3 top-3 rounded-md px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${soldOut ? "bg-ink/80" : "bg-moss"}`}
        >
          {soldOut ? "Sold out" : stock > 1 ? `${stock} in stock` : "In stock"}
        </span>
        {lot.lotSize && (
          <span className="absolute right-3 top-3 rounded-md bg-white/90 px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-ink">
            {LOT_SIZES[lot.lotSize]?.label ?? lot.lotSize}
          </span>
        )}
        {lot.msrpCents > 0 && <span className="absolute bottom-3 right-3 rounded-md bg-white/90 px-2 py-1 font-display text-xs font-bold text-ink">{pct}% of retail</span>}
        {cover.stock && <span className="absolute bottom-3 left-3 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-semibold text-white">Representative image</span>}
        {soldOut && <span className="absolute inset-0 bg-white/40" />}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <h3 className="font-display text-[15px] font-semibold leading-snug">
          {lot.brand && <span className="mb-0.5 block text-[11px] font-semibold uppercase tracking-wider text-muted">{lot.brand}</span>}
          <Link href={href} className="line-clamp-2 hover:text-signal-dark hover:underline focus-visible:outline-2 focus-visible:outline-signal">
            {lot.title}
          </Link>
        </h3>

        {/* Label on the left, value on the right (one row per fact). */}
        <dl className="space-y-1.5 text-xs">
          {lotNo && (
            <div className="flex items-center justify-between gap-3">
              <dt className="shrink-0 text-muted">Lot #</dt>
              <dd className="font-mono font-semibold">{lotNo}</dd>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-muted">Condition</dt>
            <dd><ConditionBadge condition={lot.condition} /></dd>
          </div>
          {lot.units > 0 && <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-muted">Units</dt>
            <dd className="inline-flex items-center gap-1 text-right font-medium">
              <Package aria-hidden className="h-3.5 w-3.5 text-muted" />
              {lot.units.toLocaleString()}{perUnit ? <span className="text-muted">· {money(perUnit)}/unit</span> : null}
            </dd>
          </div>}
          <div className="flex items-center justify-between gap-3">
            <dt className="shrink-0 text-muted">Ships from</dt>
            <dd className="inline-flex min-w-0 items-center justify-end gap-1 font-medium">
              <MapPin aria-hidden className="h-3.5 w-3.5 shrink-0 text-muted" />
              <span className="truncate">{lot.shipsFrom}</span>
            </dd>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <p className="font-display text-2xl font-bold leading-none">{money(lot.priceCents)}</p>
          {lot.msrpCents > 0 && <p className="text-right text-xs text-muted">
            Retail <span className="font-semibold text-ink line-through decoration-muted/60">{money(lot.msrpCents)}</span>
          </p>}
        </div>

        <Link href={href} tabIndex={-1} className="tap inline-flex w-fit items-center gap-1 text-xs font-semibold text-signal-dark hover:underline">
          View details <ArrowRight aria-hidden className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        {soldOut ? (
          <span className="inline-flex h-10 w-full items-center justify-center rounded-full bg-sand text-sm font-semibold text-muted">Sold out</span>
        ) : lot.id ? (
          <CardAddToCart lotId={lot.id} title={lot.title} />
        ) : null}
      </div>
    </article>
  );
}
