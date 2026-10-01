import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSetting } from "@/lib/settings";
import { conditionLabel, money, LOT_SIZES } from "@/lib/format";
import { DELIVERY_LABEL, PAYMENT_LABEL, isPaid } from "@/lib/commerce";
import { Tabs } from "@/components/admin/Tabs";
import { PrintButton } from "./PrintButton";

export const metadata = { title: "Print order" };

// Print only the document: hide the admin chrome and everything else on the page.
const PRINT_CSS = `
@media print {
  @page { margin: 14mm; }
  body * { visibility: hidden !important; }
  #print-doc, #print-doc * { visibility: visible !important; }
  #print-doc { position: absolute; left: 0; top: 0; width: 100%; border: 0 !important; box-shadow: none !important; padding: 0 !important; }
  .no-print { display: none !important; }
}`;

export default async function PrintOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ doc?: string }> }) {
  const { id } = await params;
  const doc = (await searchParams).doc === "slip" ? "slip" : "invoice";
  await requireStaff("orders", `/dashboard/orders/${id}/print`);
  const [order, biz] = await Promise.all([
    db.order.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true, businessName: true, phone: true } },
        items: { include: { lot: { select: { slug: true, condition: true, lotSize: true, palletCount: true, weightLbs: true, units: true, manifest: { select: { sku: true, name: true, qty: true }, take: 60 } } } } },
      },
    }),
    getSetting("business"),
  ]);
  if (!order) notFound();
  const slip = doc === "slip";
  const pallets = order.items.reduce((a, i) => a + (i.lot.lotSize === "CASE" ? 0 : i.lot.palletCount * i.quantity), 0);
  const weight = order.items.reduce((a, i) => a + i.lot.weightLbs * i.quantity, 0);
  const bizAddress = [biz.addressStreet, [biz.addressCity, biz.addressRegion, biz.addressPostal].filter(Boolean).join(" "), biz.country].filter(Boolean);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />
      <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link href={`/dashboard/orders/${order.id}`} className="text-xs font-semibold text-muted hover:text-ink">← Back to order</Link>
          <Tabs
            variant="pills"
            label="Document"
            current={doc}
            items={[
              { value: "invoice", label: "Invoice", href: `/dashboard/orders/${order.id}/print` },
              { value: "slip", label: "Packing slip", href: `/dashboard/orders/${order.id}/print?doc=slip` },
            ]}
          />
        </div>
        <PrintButton label={slip ? "Print packing slip" : "Print invoice"} />
      </div>

      <article id="print-doc" className="mx-auto max-w-3xl rounded-2xl bg-white p-6 text-sm text-ink sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 pb-5">
          <div>
            <p className="font-display text-2xl font-bold">{biz.name}</p>
            {bizAddress.map((l) => <p key={l} className="text-xs">{l}</p>)}
            <p className="text-xs">{[biz.email, biz.phone].filter(Boolean).join(" · ")}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-xl font-bold uppercase tracking-wide">{slip ? "Packing slip" : "Invoice"}</p>
            <p className="font-mono text-sm">{order.number}</p>
            <p className="text-xs">Date: {order.createdAt.toLocaleDateString("en-US", { dateStyle: "long" })}</p>
            {order.poNumber && <p className="text-xs">PO: {order.poNumber}</p>}
            {!slip && <p className="mt-1 text-xs font-semibold">{isPaid(order) ? "PAID" : order.status === "CANCELLED" ? "CANCELLED" : "PAYMENT DUE"}</p>}
          </div>
        </header>

        <section className="grid gap-6 py-5 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{slip ? "Ship to" : "Bill to"}</p>
            {slip ? (
              <address className="not-italic">
                <p className="font-semibold">{order.shipName}</p>
                <p>{order.shipAddress}</p>
                <p>{order.shipCity}, {order.shipRegion} {order.shipPostal}</p>
                <p>{order.shipCountry}</p>
              </address>
            ) : (
              <address className="not-italic">
                <p className="font-semibold">{order.user.businessName ?? order.user.name}</p>
                {order.user.businessName && <p>{order.user.name}</p>}
                <p>{order.user.email}</p>
                {order.user.phone && <p>{order.user.phone}</p>}
              </address>
            )}
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{slip ? "Shipment" : "Ship to"}</p>
            {slip ? (
              <dl className="grid grid-cols-[auto_1fr] gap-x-3">
                <dt>Method</dt><dd>{DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}</dd>
                {order.carrier && (<><dt>Carrier</dt><dd>{order.carrier}</dd></>)}
                {order.trackingNo && (<><dt>PRO / tracking</dt><dd className="font-mono">{order.trackingNo}</dd></>)}
                <dt>Handling units</dt><dd>{pallets ? `${pallets} pallet${pallets === 1 ? "" : "s"}` : "Parcel"} · {weight.toLocaleString()} lbs</dd>
                {order.deliveryMethod !== "PICKUP" && (<><dt>Unloading</dt><dd>{order.dockAccess ? "Loading dock" : "Liftgate"}{order.residential ? " · residential" : ""}</dd></>)}
              </dl>
            ) : (
              <address className="not-italic">
                <p className="font-semibold">{order.shipName}</p>
                <p>{order.shipAddress}</p>
                <p>{order.shipCity}, {order.shipRegion} {order.shipPostal}</p>
                <p>{order.shipCountry}</p>
              </address>
            )}
          </div>
        </section>

        <table className="w-full text-left">
          <thead className="text-[11px] uppercase tracking-wider">
            <tr>
              <th className="py-2 pr-2">Lot</th>
              <th className="py-2 pr-2">{slip ? "Size" : "Condition"}</th>
              <th className="py-2 pr-2 text-right">Qty</th>
              {!slip && <th className="py-2 pr-2 text-right">Unit</th>}
              {!slip && <th className="py-2 text-right">Amount</th>}
              {slip && <th className="py-2 text-right">Packed ✓</th>}
            </tr>
          </thead>
          <tbody >
            {order.items.map((i) => (
              <tr key={i.id} className="align-top">
                <td className="py-2 pr-2">
                  <p className="font-medium">{i.title}</p>
                  {slip && i.lot.manifest.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted">
                      {i.lot.units.toLocaleString()} units · {i.lot.manifest.slice(0, 8).map((m) => `${m.qty}× ${m.name}`).join(", ")}
                      {i.lot.manifest.length > 8 && ", …"}
                    </p>
                  )}
                </td>
                <td className="py-2 pr-2 text-xs">{slip ? `${LOT_SIZES[i.lot.lotSize]?.label ?? i.lot.lotSize}${i.lot.lotSize !== "CASE" ? ` · ${i.lot.palletCount} plt` : ""} · ${i.lot.weightLbs.toLocaleString()} lbs` : conditionLabel(i.lot.condition)}</td>
                <td className="py-2 pr-2 text-right tabular-nums">{i.quantity}</td>
                {!slip && <td className="py-2 pr-2 text-right tabular-nums">{money(i.priceCents, { cents: true })}</td>}
                {!slip && <td className="py-2 text-right tabular-nums">{money(i.priceCents * i.quantity, { cents: true })}</td>}
                {slip && <td className="py-2 text-right">☐</td>}
              </tr>
            ))}
          </tbody>
        </table>

        {!slip && (
          <dl className="ml-auto mt-4 w-full max-w-xs space-y-1">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{money(order.subtotalCents, { cents: true })}</dd></div>
            {order.discountCents > 0 && <div className="flex justify-between"><dt>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</dt><dd className="tabular-nums">−{money(order.discountCents, { cents: true })}</dd></div>}
            <div className="flex justify-between"><dt>{order.deliveryMethod === "PICKUP" ? "Pickup" : "Freight"}</dt><dd className="tabular-nums">{money(order.shippingCents, { cents: true })}</dd></div>
            <div className="flex justify-between pt-1 font-display text-base font-bold"><dt>Total (USD)</dt><dd className="tabular-nums">{money(order.totalCents, { cents: true })}</dd></div>
          </dl>
        )}

        <footer className="mt-8 grid gap-4 pt-4 text-xs sm:grid-cols-2">
          {slip ? (
            <>
              <p>Inspect pallets on delivery and note any visible damage on the carrier&apos;s bill of lading before signing.</p>
              <div className="space-y-4">
                <p className="pb-5">Received by (print &amp; sign)</p>
                <p className="pb-5">Date</p>
              </div>
            </>
          ) : (
            <>
              <p>Payment: {PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod}{order.paymentMethod === "NET30" ? " — due 30 days from the invoice date." : ""}</p>
              <p className="sm:text-right">Liquidation goods are sold as described in the lot listing and manifest. Thank you for your business.</p>
            </>
          )}
        </footer>
      </article>
    </>
  );
}
