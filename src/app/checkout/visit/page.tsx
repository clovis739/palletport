import Link from "next/link";
import { ProductPhoto } from "@/components/lot/ProductPhoto";
import { notFound } from "next/navigation";
import { CalendarDays, MapPin, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { money, purchasePrice } from "@/lib/format";
import { lotCover } from "@/lib/lotImages";
import { privateMetadata } from "@/lib/seo";
import { amountDueNow, checkVisitSlot, formatVisit } from "@/lib/visits";
import { bookedVisitTimes } from "@/lib/visits-server";
import { VisitCheckoutForm } from "./VisitCheckoutForm";

export const metadata = privateMetadata("Book a warehouse visit");

type SP = Promise<{ lot?: string; qty?: string; at?: string }>;

export default async function VisitCheckoutPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const here = `/checkout/visit?lot=${encodeURIComponent(sp.lot ?? "")}&qty=${encodeURIComponent(sp.qty ?? "1")}&at=${encodeURIComponent(sp.at ?? "")}`;
  const user = await requireUser(here);
  const lot = sp.lot ? await db.lot.findUnique({ where: { slug: sp.lot }, include: { category: true } }) : null;
  if (!lot || lot.status === "DRAFT") notFound();
  const store = await getStore();
  const unit = purchasePrice(lot);
  const qty = Math.max(1, Math.min(Number(sp.qty) || 1, lot.available || 1));
  const at = sp.at ?? "";
  const slotError = checkVisitSlot(at, new Date(), await bookedVisitTimes());
  const total = (unit ?? lot.priceCents) * qty;
  const { deposit, dueNowCents } = amountDueNow(total);
  const cover = lotCover(lot, 320, 4 / 3);
  const problem = unit === null ? "This lot has sold out." : lot.available < qty ? `Only ${lot.available} in stock.` : slotError;

  return (
    <div className="container-pp py-8 sm:py-12">
      <nav className="mb-3 text-xs text-muted"><Link href={`/lots/${lot.slug}`} className="hover:underline">← Back to the lot</Link></nav>
      <h1 className="font-display text-3xl font-bold">Confirm your warehouse visit</h1>
      <p className="mt-1 text-muted">Pay now to confirm the appointment, then collect your order at our warehouse in {store.location}.</p>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
          {problem ? (
            <div className="card p-6">
              <p className="font-semibold text-rust">{problem}</p>
              <Link href={`/lots/${lot.slug}`} className="btn-dark mt-4">Choose another time</Link>
            </div>
          ) : (
            <VisitCheckoutForm
              lotId={lot.id}
              qty={qty}
              at={at}
              defaultName={user.name}
              defaultPhone={user.phone ?? ""}
              deposit={deposit}
              dueNowLabel={money(dueNowCents)}
            />
          )}
        </div>

        <aside className="min-w-0 space-y-4 lg:sticky lg:top-40 lg:self-start">
          <div className="card space-y-4 p-5">
            <div className="flex gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProductPhoto src={cover.src} alt="" width={96} height={72} className="h-18 w-24 shrink-0 rounded-lg object-cover" />
              <div className="min-w-0">
                <p className="line-clamp-2 font-semibold">{lot.title}</p>
                <p className="text-xs text-muted">{qty} × {money(unit ?? lot.priceCents)}</p>
              </div>
            </div>
            <div className="space-y-2 rounded-xl bg-white p-3 text-sm">
              <p className="flex items-start gap-2"><CalendarDays aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-signal" /><span>{at && !slotError ? formatVisit(at) : "No visit time selected"}</span></p>
              <p className="flex items-start gap-2"><MapPin aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-signal" /><span>Warehouse pickup, {store.location}. We email the exact address and dock details with your confirmation.</span></p>
            </div>
            <dl className="space-y-1.5 text-sm">
              <div className="flex justify-between"><dt>Order total</dt><dd className="font-semibold">{money(total)}</dd></div>
              <div className="flex justify-between"><dt>Freight</dt><dd>None (you collect)</dd></div>
              <div className="flex justify-between pt-2 text-base font-bold"><dt>{deposit ? "Pay now (35% deposit)" : "Pay now (full amount)"}</dt><dd className="text-signal-dark">{money(dueNowCents)}</dd></div>
              {deposit && <div className="flex justify-between text-muted"><dt>Balance at your visit</dt><dd>{money(total - dueNowCents)}</dd></div>}
            </dl>
            <p className="flex gap-2 text-xs leading-relaxed text-ink/75">
              <ShieldCheck aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-moss" />
              Orders of $600 or more require a refundable 35% payment to confirm the visit. Orders below $600 must be paid in full. The payment is refundable if the product does not match after inspection.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
