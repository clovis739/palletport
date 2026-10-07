import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { StatusPill } from "../StatusPill";
import { cancelOrder, reorder, submitReview } from "@/app/actions/orders";
import { ActionForm } from "@/components/forms/ActionForm";
import { Stars } from "@/components/Stars";
import { PrevIcon } from "@/components/Icons";
import { Select } from "@/components/ui/Select";
import { privateMetadataT } from "@/lib/seo";
import { formatVisit } from "@/lib/visits";
import { CalendarDays } from "lucide-react";
import { GaEvent } from "@/components/analytics/GaEvent";
import { getSetting } from "@/lib/settings";
import { paymentLabel } from "@/lib/commerce";
import { gaMoney } from "@/lib/analytics";
import { getI18n } from "@/i18n/server";
import { LOCALE_TAG } from "@/i18n/config";

export const generateMetadata = () => privateMetadataT("Order details");

const STEPS = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];
const PAY: Record<string, string> = { CARD: "Card", NET30: "Net 30 terms", WIRE: "Wire / ACH" };
const payName = (id: string, methods: { id: string; name: string }[]) => methods.find((m) => m.id === id)?.name ?? PAY[id] ?? paymentLabel(id);

export default async function OrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ placed?: string }> }) {
  const { id } = await params;
  const { placed } = await searchParams;
  const user = await requireUser(`/orders/${id}`);
  const { t, lh, locale } = await getI18n();
  const order = await db.order.findFirst({
    where: { id, userId: user.id },
    include: { items: { include: { seller: true, lot: { select: { slug: true, sku: true } } } }, reviews: true },
  });
  if (!order) notFound();
  const { paymentMethods } = await getSetting("checkout");
  const payMethod = paymentMethods.find((m) => m.id === order.paymentMethod);
  // How to pay (Zelle, Wire, …): shown until the order is paid or cancelled.
  const payInstructions = payMethod?.instructions && order.status === "PENDING" && order.amountPaidCents < order.totalCents ? payMethod.instructions : "";
  const step = STEPS.indexOf(order.status);

  return (
    <div className="container-pp max-w-4xl py-10">
      {placed && (
        <GaEvent
          name="purchase"
          onceKey={`purchase:${order.id}`}
          params={{
            transaction_id: order.number,
            currency: "USD",
            value: gaMoney(order.totalCents),
            shipping: gaMoney(order.shippingCents),
            ...(order.promoCode ? { coupon: order.promoCode } : {}),
            items: order.items.map((i) => ({ item_id: i.lot.sku, item_name: i.title, price: gaMoney(i.priceCents), quantity: i.quantity })),
          }}
        />
      )}
      {placed && (
        <div className="mb-6 rounded-2xl bg-moss p-5 text-white">
          <p className="font-display text-lg font-bold">{t(order.visitAt ? "Visit booked — thank you!" : "Order placed — thank you!")}</p>
          <p className="text-sm text-white/80">
            {t(order.visitAt
              ? order.status === "CONFIRMED"
                ? "Your payment is received and your warehouse visit is confirmed. We'll email the address and dock details."
                : "Your visit is reserved. It's confirmed as soon as your payment arrives — we'll email wire/ACH details."
              : "Our warehouse team will confirm your order and freight within one business day.")}
          </p>
        </div>
      )}
      {payInstructions && (
        <div className="mb-6 rounded-2xl bg-sand p-5">
          <p className="font-display font-bold">{t("How to pay with {name}", { name: payMethod?.name ?? "" })}</p>
          <p className="mt-1 whitespace-pre-line text-sm text-ink/80">{payInstructions}</p>
          <p className="mt-2 text-xs text-muted">{t("Your order number:")} <span className="font-semibold text-ink">{order.number}</span></p>
        </div>
      )}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <Link href={lh("/orders")} className="text-xs text-muted hover:underline"><PrevIcon />{t("All orders")}</Link>
          <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">{t("Order")} <span className="break-all">{order.number}</span></h1>
          <p className="text-sm text-muted">{t("Placed {date}", { date: order.createdAt.toLocaleString(LOCALE_TAG[locale]) })} · {t(payName(order.paymentMethod, paymentMethods))}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill status={order.status} />
          <form action={reorder}>
            <input type="hidden" name="orderId" value={order.id} />
            <button className="btn-ghost py-2 text-xs">{t("Reorder")}</button>
          </form>
          {order.status === "PENDING" && (
            <form action={cancelOrder}>
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn-ghost py-2 text-xs text-rust">{t("Cancel order")}</button>
            </form>
          )}
        </div>
      </div>
      {order.visitAt && (
        <div className="mb-6 grid gap-3 rounded-2xl bg-white p-4 text-sm sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center sm:p-5">
          <CalendarDays aria-hidden className="h-6 w-6 text-signal" />
          <div className="min-w-0">
            <p className="font-semibold">{t("Warehouse visit")} · {formatVisit(order.visitAt, locale)}</p>
            <p className="text-muted">
              {order.status === "CANCELLED"
                ? t("This visit was cancelled.")
                : order.status === "PENDING"
                  ? t("Awaiting payment of {amount} to confirm the visit.", { amount: money(order.dueNowCents) })
                  : t("Visit confirmed · collecting: {name}", { name: order.shipName })}
            </p>
          </div>
          <dl className="text-right">
            <dt className="text-xs text-muted">{t("Paid")}</dt>
            <dd className="font-semibold">{t("{paid} of {total}", { paid: money(order.amountPaidCents), total: money(order.totalCents) })}</dd>
            {order.amountPaidCents > 0 && order.amountPaidCents < order.totalCents && (
              <dd className="text-xs text-muted">{t("Balance {amount} at your visit", { amount: money(order.totalCents - order.amountPaidCents) })}</dd>
            )}
          </dl>
        </div>
      )}
      {order.trackingNo && (
        <p className="mb-6 rounded-xl bg-white p-4 text-sm">
          {t("Freight PRO / tracking number:")} <span className="break-all font-mono font-bold">{order.trackingNo}</span>
        </p>
      )}

      {order.status !== "CANCELLED" && (
        <ol className="mb-8 grid grid-cols-4 gap-2">
          {STEPS.map((s, i) => (
            <li key={s} className="space-y-1.5">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-signal" : "bg-line"}`} />
              <p className={`text-[11px] font-semibold sm:text-xs ${i <= step ? "text-ink" : "text-muted"}`}>{t(s.charAt(0) + s.slice(1).toLowerCase())}</p>
            </li>
          ))}
        </ol>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1fr)_280px]">
        <div className="card h-fit min-w-0">
          {order.items.map((i) => (
            <div key={i.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
              <div className="min-w-0 break-words">
                <Link href={lh(`/lots/${i.lot.slug}`)} className="font-semibold hover:underline">{i.quantity}× {i.title}</Link>
              </div>
              <p className="shrink-0 font-display font-bold">{money(i.priceCents * i.quantity)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="card space-y-2 p-5 text-sm">
            <div className="flex justify-between"><span>{t("Subtotal")}</span><span>{money(order.subtotalCents)}</span></div>
            {order.discountCents > 0 && (
              <div className="flex justify-between text-moss"><span>{order.promoCode === "REFERRAL-WELCOME" ? t("Referral welcome discount") : order.promoCode === "REFERRAL-REWARD" ? t("Referral reward") : t("Promo {code}", { code: order.promoCode ?? "" })}</span><span>−{money(order.discountCents)}</span></div>
            )}
            <div className="flex justify-between"><span>{t("Freight")}</span><span>{order.shippingCents ? money(order.shippingCents) : t("Free")}</span></div>
            <div className="flex justify-between pt-2 font-bold"><span>{t("Total")}</span><span className="font-display">{money(order.totalCents)}</span></div>
          </div>
          <div className="card break-words p-5 text-sm">
            <p className="label">{t("Deliver to")}</p>
            <p className="font-semibold">{order.shipName}</p>
            <p>{order.shipAddress}</p>
            <p>{order.shipCity}, {order.shipRegion} {order.shipPostal}</p>
            <p>{order.shipCountry}</p>
            <p className="mt-2 text-xs text-muted">
              {t(order.deliveryMethod === "PICKUP" ? "Warehouse pickup (by appointment)" : order.dockAccess ? "Dock delivery" : "Liftgate delivery")}
              {order.residential ? ` · ${t("residential")}` : ""}
            </p>
            {order.poNumber && <p className="mt-1 text-xs">PO: <span className="font-mono">{order.poNumber}</span></p>}
            {order.notes && <p className="mt-1 text-xs text-ink/75">{t("Notes:")} {order.notes}</p>}
          </div>
        </div>
      </div>

      {order.status === "DELIVERED" && (
        <section className="mt-10">
          <h2 className="mb-4 font-display text-xl font-bold">{t("Review your order")}</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {order.items.filter((i, idx) => order.items.findIndex((x) => x.sellerId === i.sellerId) === idx).map(({ seller }) => {
              const existing = order.reviews.find((r) => r.sellerId === seller.id);
              return (
                <div key={seller.id} className="card p-5">
                  <p className="font-semibold">{t("How did this order go?")}</p>
                  {existing ? (
                    <div className="mt-2 text-sm"><Stars value={existing.rating} /><p className="mt-1 text-ink/80">{existing.body}</p></div>
                  ) : (
                    <ActionForm action={submitReview} submitLabel="Post review" successText="Thanks for your review!" className="mt-3 space-y-3">
                      <input type="hidden" name="orderId" value={order.id} />
                      <input type="hidden" name="sellerId" value={seller.id} />
                      <Select name="rating" defaultValue="5" className="input" aria-label={t("Rating")}>
                        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{t(n > 1 ? "{n} stars" : "{n} star", { n })}</option>)}
                      </Select>
                      <textarea name="body" rows={3} required placeholder={t("Did the manifest match? How was packaging and freight?")} className="input" />
                    </ActionForm>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
