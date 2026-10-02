import { ProductPhoto } from "@/components/lot/ProductPhoto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, Circle, Printer } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, conditionLabel } from "@/lib/format";
import { lotCover } from "@/lib/lotImages";
import { CARRIERS, DELIVERY_LABEL, auditLabel, isPaid, paymentLabel } from "@/lib/commerce";
import { formatVisit } from "@/lib/visits";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { CopyButton } from "@/components/admin/CopyButton";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/SubmitButton";
import { adminCancelOrder, confirmOrder, markOrderDelivered, markOrderPaid, markOrderShipped, saveOrderNotes } from "@/app/actions/orderAdmin";

export const metadata = { title: "Order" };

const STEPS = [
  { key: "PLACED", label: "Placed" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
];
const STEP_INDEX: Record<string, number> = { PENDING: 0, CONFIRMED: 1, SHIPPED: 2, DELIVERED: 3 };

type Event = { at: Date | null; title: string; detail?: string; who?: string };

export default async function OrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireStaff("orders", `/dashboard/orders/${id}`);
  const order = await db.order.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true, businessName: true, phone: true, certStatus: true, isPro: true, _count: { select: { orders: true } } } },
      items: { include: { lot: { select: { id: true, slug: true, title: true, images: true, condition: true, lotSize: true, palletCount: true, weightLbs: true, category: { select: { slug: true, name: true } } } } } },
    },
  });
  if (!order) notFound();
  const audit = await db.auditLog.findMany({ where: { target: order.number, action: { startsWith: "order." } }, orderBy: { createdAt: "asc" }, take: 100 });

  // ---- Timeline: order fields + audit entries for this order ----
  const events: Event[] = [
    { at: order.createdAt, title: "Order placed", detail: `${paymentLabel(order.paymentMethod)} · ${money(order.totalCents)}` },
  ];
  for (const a of audit) events.push({ at: a.createdAt, title: auditLabel(a.action), detail: a.detail, who: a.userEmail });
  const has = (action: string) => audit.some((a) => a.action === action || (a.action === "order.status" && a.detail.startsWith(action)));
  if (order.paidAt && !has("order.paid")) events.push({ at: order.paidAt, title: "Payment recorded" });
  if (order.shippedAt && !has("order.shipped") && !has("SHIPPED")) events.push({ at: order.shippedAt, title: "Shipped" });
  if (order.deliveredAt && !has("order.delivered") && !has("DELIVERED")) events.push({ at: order.deliveredAt, title: "Delivered" });
  if (order.cancelledAt && !has("order.cancel")) events.push({ at: order.cancelledAt, title: "Cancelled" });
  // Status reached without any recorded event (e.g. demo data or buyer self-service): show it undated.
  if (["SHIPPED", "DELIVERED"].includes(order.status) && !order.shippedAt && !has("order.shipped") && !has("SHIPPED")) events.push({ at: null, title: "Shipped", detail: "Date not recorded" });
  if (order.status === "DELIVERED" && !order.deliveredAt && !has("order.delivered") && !has("DELIVERED")) events.push({ at: null, title: "Delivered", detail: "Date not recorded" });
  if (order.status === "CANCELLED" && !order.cancelledAt && !has("order.cancel")) events.push({ at: null, title: "Cancelled", detail: "Cancelled by the buyer or before this was tracked" });
  events.sort((a, b) => (a.at && b.at ? a.at.getTime() - b.at.getTime() : a.at ? -1 : b.at ? 1 : 0));

  const paid = isPaid(order);
  const step = STEP_INDEX[order.status] ?? -1;
  const address = [order.shipName, order.shipAddress, `${order.shipCity}, ${order.shipRegion} ${order.shipPostal}`.trim(), order.shipCountry].filter((l) => l && l.trim() && l.trim() !== ",").join("\n");
  const missingAddress = !order.shipAddress || !order.shipCity;
  const cancellable = ["PENDING", "CONFIRMED"].includes(order.status);
  const pallets = order.items.reduce((a, i) => a + (i.lot.lotSize === "CASE" ? 0 : i.lot.palletCount * i.quantity), 0);
  const weight = order.items.reduce((a, i) => a + i.lot.weightLbs * i.quantity, 0);

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/orders", label: "All orders" }}
        title={<span className="font-mono">{order.number}</span>}
        description={`Placed ${order.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}`}
        meta={
          <>
            <StatusPill status={order.status} />
            {paid ? <Badge tone="moss">Paid</Badge> : order.status !== "CANCELLED" && order.amountPaidCents > 0 ? <Badge tone="signal">Deposit paid</Badge> : order.status !== "CANCELLED" && <Badge tone="amber">Unpaid</Badge>}
            {order.visitAt && <Badge tone="ink">Visit {formatVisit(order.visitAt)}</Badge>}
            {order.deliveryMethod === "PICKUP" && <Badge>Pickup</Badge>}
          </>
        }
        actions={
          <>
            <Link href={`/dashboard/orders/${order.id}/print`} className="btn-ghost"><Printer aria-hidden className="h-4 w-4" /> Packing slip / invoice</Link>
          </>
        }
      />

      {/* Progress */}
      {order.status !== "CANCELLED" && (
        <ol className="mb-6 grid grid-cols-4 gap-1 text-center text-[11px] font-semibold sm:text-xs" aria-label="Order progress">
          {STEPS.map((s, i) => (
            <li key={s.key} aria-current={i === step ? "step" : undefined} className="min-w-0">
              <span className={`block h-1.5 rounded-full ${i <= step ? "bg-moss" : "bg-line"}`} />
              <span className={`mt-1.5 block truncate ${i <= step ? "text-ink" : "text-muted"}`}>{s.label}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card title="Items" description={`${order.items.length} lot${order.items.length === 1 ? "" : "s"} · ${pallets ? `${pallets} pallet${pallets === 1 ? "" : "s"} · ` : ""}${weight.toLocaleString()} lbs`} padded={false}>
            <ul >
              {order.items.map((i) => {
                const cover = lotCover(i.lot, 160, 1);
                return (
                  <li key={i.id} className="flex items-center gap-3 p-4 sm:px-5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProductPhoto src={cover.src} alt="" width={56} height={56} loading="lazy" className="h-14 w-14 shrink-0 rounded-lg bg-sand object-cover" />
                    <div className="min-w-0 flex-1">
                      <Link href={`/dashboard/lots/${i.lot.id}`} className="block break-words font-medium hover:underline">{i.title}</Link>
                      <p className="text-xs text-muted">{i.lot.category.name} · {conditionLabel(i.lot.condition)}</p>
                    </div>
                    <div className="shrink-0 text-right text-sm">
                      <p className="font-semibold tabular-nums">{money(i.priceCents * i.quantity)}</p>
                      <p className="text-xs text-muted tabular-nums">{i.quantity} × {money(i.priceCents)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <dl className="space-y-1.5 bg-sand/30 px-4 py-4 text-sm sm:px-5">
              <div className="flex justify-between gap-3"><dt className="text-muted">Subtotal</dt><dd className="tabular-nums">{money(order.subtotalCents)}</dd></div>
              {order.discountCents > 0 && (
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">Discount{order.promoCode && <> · <Link href="/dashboard/promotions" className="font-mono font-semibold text-ink hover:underline">{order.promoCode}</Link></>}</dt>
                  <dd className="tabular-nums text-moss">−{money(order.discountCents)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-3"><dt className="text-muted">{order.deliveryMethod === "PICKUP" ? "Pickup" : "Freight"}</dt><dd className="tabular-nums">{order.shippingCents ? money(order.shippingCents) : "Free"}</dd></div>
              <div className="flex justify-between gap-3 pt-2 font-display text-base font-bold"><dt>Total</dt><dd className="tabular-nums">{money(order.totalCents)}</dd></div>
            </dl>
          </Card>

          <Card title="Timeline" description="Built from the order and the activity log.">
            <ol className="relative space-y-4 pl-5">
              {events.map((e, i) => (
                <li key={i} className="relative">
                  <span aria-hidden className={`absolute -left-[27px] top-0.5 grid h-4 w-4 place-items-center rounded-full bg-white ${i === events.length - 1 ? "text-signal" : "text-moss"}`}>
                    {e.at ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </span>
                  <p className="text-sm font-semibold">{e.title}</p>
                  <p className="text-xs text-muted">
                    {e.at ? e.at.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    {e.who && <> · {e.who}</>}
                  </p>
                  {e.detail && <p className="mt-0.5 break-words text-xs">{e.detail}</p>}
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Actions">
            <div className="space-y-4">
              {order.status === "PENDING" && (
                <form action={confirmOrder} className="space-y-1.5">
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton className="btn-dark w-full py-2.5" pendingText="Confirming…">Confirm order</SubmitButton>
                  <p className="text-xs text-muted">{order.paymentMethod === "NET30" ? "Net 30: confirm to ship now; mark paid when the invoice is settled." : order.paymentMethod === "WIRE" ? "Wire / ACH: usually confirm once the transfer arrives (use Mark paid)." : "Confirms the order for fulfilment."}</p>
                </form>
              )}

              {!paid && order.status !== "CANCELLED" && (
                <form action={markOrderPaid} className="space-y-2">
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton className={order.status === "PENDING" ? "btn-ghost w-full py-2.5" : "btn-dark w-full py-2.5"} pendingText="Saving…">{order.visitAt && order.dueNowCents < order.totalCents && order.amountPaidCents < order.dueNowCents ? `Deposit received (${money(order.dueNowCents)})` : order.amountPaidCents > 0 ? `Balance received (${money(order.totalCents - order.amountPaidCents)})` : "Mark paid"}</SubmitButton>
                  {order.status === "PENDING" && <p className="text-xs text-muted">Records the payment and confirms the order.</p>}
                </form>
              )}

              {(order.status === "CONFIRMED" || order.status === "SHIPPED") && (
                <form action={markOrderShipped} className="space-y-2 rounded-xl p-3">
                  <input type="hidden" name="id" value={order.id} />
                  <p className="text-sm font-semibold">{order.status === "SHIPPED" ? "Update tracking" : order.deliveryMethod === "PICKUP" ? "Mark picked up" : "Mark shipped"}</p>
                  <div>
                    <label htmlFor="carrier" className="label">Carrier</label>
                    <Select id="carrier" name="carrier" defaultValue={order.carrier ?? ""} className="input py-2">
                      {CARRIERS.map((c) => <option key={c} value={c}>{c || "Not specified"}</option>)}
                      {order.carrier && !CARRIERS.includes(order.carrier) && <option value={order.carrier}>{order.carrier}</option>}
                    </Select>
                  </div>
                  <div>
                    <label htmlFor="trackingNo" className="label">Freight PRO / tracking #{order.deliveryMethod === "PICKUP" && " (optional)"}</label>
                    <input id="trackingNo" name="trackingNo" defaultValue={order.trackingNo ?? ""} className="input py-2 font-mono" maxLength={80} required={order.deliveryMethod !== "PICKUP"} />
                  </div>
                  <SubmitButton className="btn-dark w-full py-2.5" pendingText="Saving…">{order.status === "SHIPPED" ? "Save tracking" : order.deliveryMethod === "PICKUP" ? "Mark picked up" : "Mark shipped"}</SubmitButton>
                </form>
              )}

              {order.status === "SHIPPED" && (
                <form action={markOrderDelivered}>
                  <input type="hidden" name="id" value={order.id} />
                  <SubmitButton className="btn-primary w-full py-2.5" pendingText="Saving…">Mark delivered</SubmitButton>
                </form>
              )}

              {order.status === "DELIVERED" && <p className="flex items-center gap-2 text-sm text-moss"><CheckCircle2 aria-hidden className="h-4 w-4" /> Delivered{order.deliveredAt && ` ${order.deliveredAt.toLocaleDateString()}`}. Nothing left to do{paid ? "" : " but collect payment"}.</p>}
              {order.status === "CANCELLED" && <p className="text-sm text-muted">This order was cancelled{order.cancelledAt && ` on ${order.cancelledAt.toLocaleDateString()}`}.</p>}

              {cancellable && (
                <form action={adminCancelOrder} className="pt-4">
                  <input type="hidden" name="id" value={order.id} />
                  <ConfirmButton confirmLabel="Cancel order" prompt="Cancel this order?" className="btn-ghost w-full py-2 text-rust">Cancel order…</ConfirmButton>
                  <p className="mt-2 text-xs text-muted">
                    The lots get their quantity back and go on sale again. A promo code use is returned.
                    {paid && " This order is paid: refund the buyer outside the site."}
                  </p>
                </form>
              )}
            </div>
          </Card>

          {order.visitAt && (
            <Card title="Warehouse visit">
              <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
                <dt className="text-muted">When</dt><dd className="font-semibold">{formatVisit(order.visitAt)}</dd>
                <dt className="text-muted">Collecting</dt><dd>{order.shipName}</dd>
                <dt className="text-muted">Due up front</dt><dd>{money(order.dueNowCents)}{order.dueNowCents < order.totalCents ? " (35% deposit)" : " (full amount)"}</dd>
                <dt className="text-muted">Received</dt><dd>{money(order.amountPaidCents)}</dd>
                <dt className="text-muted">Balance</dt><dd className={order.totalCents - order.amountPaidCents > 0 ? "font-semibold" : ""}>{money(Math.max(0, order.totalCents - order.amountPaidCents))}</dd>
              </dl>
              <p className="mt-3 text-xs text-muted">
                {order.status === "PENDING" ? "Mark paid when the deposit arrives to confirm the visit. " : ""}Refund the deposit if the lot doesn&apos;t match after inspection.
              </p>
            </Card>
          )}

          <Card title="Buyer">
            <div className="space-y-1 text-sm">
              <Link href={`/dashboard/customers/${order.user.id}`} className="font-semibold hover:underline">{order.user.businessName ?? order.user.name}</Link>
              {order.user.businessName && <p>{order.user.name}</p>}
              <p className="flex items-center gap-1 break-all text-muted">{order.user.email}<CopyButton text={order.user.email} label="Copy email" /></p>
              {order.user.phone && <p className="flex items-center gap-1 text-muted">{order.user.phone}<CopyButton text={order.user.phone} label="Copy phone" /></p>}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <StatusPill status={order.user.certStatus} label={`Certificate: ${order.user.certStatus === "NONE" ? "none" : order.user.certStatus.toLowerCase()}`} />
                {order.user.isPro && <Badge tone="signal">Pro</Badge>}
                <Badge tone="muted">{order.user._count.orders} order{order.user._count.orders === 1 ? "" : "s"}</Badge>
              </div>
            </div>
          </Card>

          <Card title={order.deliveryMethod === "PICKUP" ? "Pickup contact" : "Ship to"} actions={address ? <CopyButton text={address} label="Copy address" showLabel /> : undefined}>
            {missingAddress ? <p className="text-sm text-muted">No address provided yet.</p> : <address className="whitespace-pre-line text-sm not-italic">{address}</address>}
            <dl className="mt-3 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-xs">
              <dt className="text-muted">Delivery</dt><dd>{DELIVERY_LABEL[order.deliveryMethod] ?? order.deliveryMethod}</dd>
              {order.deliveryMethod !== "PICKUP" && (<><dt className="text-muted">Unloading</dt><dd>{order.dockAccess ? "Loading dock" : "Liftgate needed"}</dd></>)}
              {order.deliveryMethod !== "PICKUP" && (<><dt className="text-muted">Location</dt><dd>{order.residential ? "Residential" : "Commercial"}</dd></>)}
              {order.carrier && (<><dt className="text-muted">Carrier</dt><dd>{order.carrier}</dd></>)}
              {order.trackingNo && (<><dt className="text-muted">Tracking</dt><dd className="flex items-center gap-1 break-all font-mono">{order.trackingNo}<CopyButton text={order.trackingNo} label="Copy tracking number" /></dd></>)}
            </dl>
          </Card>

          <Card title="Payment">
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted">Method</dt><dd>{paymentLabel(order.paymentMethod)}</dd>
              <dt className="text-muted">Status</dt><dd>{paid ? `Paid${order.paidAt ? ` ${order.paidAt.toLocaleDateString()}` : " (card at checkout)"}` : order.amountPaidCents > 0 ? `Deposit ${money(order.amountPaidCents)} received` : "Not paid"}</dd>
              {order.poNumber && (<><dt className="text-muted">PO #</dt><dd className="break-all font-mono">{order.poNumber}</dd></>)}
              {order.promoCode && (<><dt className="text-muted">Promo</dt><dd className="font-mono">{order.promoCode} (−{money(order.discountCents)})</dd></>)}
            </dl>
            {order.notes && (
              <div className="mt-3 rounded-lg bg-sand/60 p-3 text-sm">
                <p className="label mb-1">Buyer note</p>
                <p className="whitespace-pre-wrap break-words">{order.notes}</p>
              </div>
            )}
          </Card>

          <Card title="Internal notes" description="Only staff see these.">
            <form action={saveOrderNotes} className="space-y-2">
              <input type="hidden" name="id" value={order.id} />
              <label htmlFor="adminNotes" className="sr-only">Internal notes</label>
              <textarea id="adminNotes" name="adminNotes" rows={4} maxLength={4000} defaultValue={order.adminNotes ?? ""} className="input resize-y text-sm" placeholder="Pickup appointment, freight quote, call notes…" />
              <SubmitButton className="btn-ghost py-2 text-xs" pendingText="Saving…">Save notes</SubmitButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
