import "server-only";
import { money } from "@/lib/format";
import { emailConfigured, sendEmail, validEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, paymentLabel } from "@/lib/commerce";
import { formatVisit } from "@/lib/visits";
import { BRAND, callout, emailBase, emailLayout, emailLinkBase, esc, factTable, paragraph, sectionTitle } from "@/lib/email-layout";
import { getUserLocale } from "@/lib/user-locale";
import { getTFor } from "@/i18n/server";
import type { TFunction } from "@/i18n/config";

type Lang = "en" | "es";
const same: TFunction = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text);
import { getSetting } from "@/lib/settings";
import { paymentEmailHtml } from "@/lib/payment-email";

type OrderNotice = {
  id: string; number: string; status: string; paymentMethod: string;
  subtotalCents: number; shippingCents: number; discountCents: number; totalCents: number;
  dockAccess: boolean; residential: boolean;
  deliveryMethod: string; shipName: string; shipAddress: string; shipCity: string;
  shipRegion: string; shipPostal: string; shipCountry: string; phone?: string | null;
  poNumber?: string | null; notes?: string | null; visitAt?: Date | null;
  user: { name: string; email: string };
  items: { title: string; quantity: number; priceCents: number }[];
};


function orderFacts(order: OrderNotice, t: TFunction = same, lang: Lang = "en") {
  const shipTo = [order.shipAddress, order.shipCity, order.shipRegion, order.shipPostal, order.shipCountry].filter(Boolean).join(", ");
  const savedNotes = order.notes ?? "";
  const submittedPhone = savedNotes.match(/^\[Delivery phone: ([^\]]+)\](?:\n|$)/)?.[1]
    ?? savedNotes.match(/^Phone: ([^\r\n]+)/)?.[1]
    ?? order.phone ?? "";
  const customerNotes = savedNotes.replace(/^\[Delivery phone: [^\]]+\](?:\n|$)/, "").replace(/^Phone: [^\r\n]+(?:\n|$)/, "").trim();
  return [
    ["Order number", order.number], [t("Order status"), t(ORDER_STATUS_LABEL[order.status] ?? order.status)], [t("Payment method"), t(paymentLabel(order.paymentMethod))],
    [t("Receiving name"), order.shipName],
    [t("Delivery"), t(order.deliveryMethod === "PICKUP" ? "Warehouse pickup" : "Freight delivery")],
    ...(order.deliveryMethod === "PICKUP" ? [[t("Visit time"), order.visitAt ? formatVisit(order.visitAt, lang) : t("To be arranged")]] : [[t("Ship to"), shipTo]]),
    ...(submittedPhone ? [[t("Phone"), submittedPhone]] : []),
    ...(order.deliveryMethod !== "PICKUP" ? [[t("Loading dock"), t(order.dockAccess ? "Available" : "Not available")], [t("Residential delivery"), t(order.residential ? "Yes" : "No")]] : []),
    ...(order.poNumber ? [[t("PO number"), order.poNumber]] : []),
    ...(customerNotes ? [[t("Your notes"), customerNotes]] : []),
  ];
}

/** Payment instructions for manual methods (Zelle, Wire, …) from Admin → Site settings → Checkout. */
type PayNote = { name: string; instructions: string; logo?: string } | null;

function emailHtml(order: OrderNotice, audience: "customer" | "team", pay: PayNote = null, t: TFunction = same, lang: Lang = "en") {
  if (audience === "team") { t = same; lang = "en"; }
  const base = emailBase();
  const orderUrl = `${emailLinkBase(lang)}/orders/${encodeURIComponent(order.id)}`;
  const isBooking = Boolean(order.visitAt);
  const kind = isBooking ? "visit booking" : "order";
  const heading = audience === "customer"
    ? t(isBooking ? "Your visit booking request was received" : "We have received your order")
    : `${isBooking ? "New visit booking" : "New order"} ${order.number}`;
  const intro = audience === "customer"
    ? t(isBooking ? "Thanks, {name}. Your warehouse visit request is with our team. Here is a copy of what you submitted." : "Thanks, {name}. Your order is with our team. Here is a copy of what you submitted.", { name: esc(order.user.name) })
    : `A new ${kind} was placed by <strong>${esc(order.user.name)}</strong>. Reply directly to this email to contact the customer.`;
  const items = order.items.map((item) =>
    `<tr ><td style="padding:13px 12px 13px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5">${esc(item.title)}<br><span style="color:${BRAND.muted}">${esc(t("Qty {n}", { n: item.quantity }))} &times; ${money(item.priceCents)}</span></td><td style="padding:13px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;text-align:right;white-space:nowrap;vertical-align:top">${money(item.priceCents * item.quantity)}</td></tr>`).join("");
  const totals: [string, string][] = [
    [t("Subtotal"), money(order.subtotalCents)],
    ...(order.discountCents ? ([[t("Discount"), `-${money(order.discountCents)}`]] as [string, string][]) : []),
    [t("Shipping"), order.deliveryMethod === "PICKUP" ? t("Pickup (free)") : money(order.shippingCents)],
  ];
  const grand = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="padding:14px 0 0;border-top:2px solid ${BRAND.ink};color:${BRAND.ink};font-family:'Space Grotesk',Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700">${esc(t(isBooking ? "Visit total" : "Order total"))}</td><td style="padding:14px 0 0;border-top:2px solid ${BRAND.ink};color:${BRAND.ink};font-family:'Space Grotesk',Inter,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;text-align:right;white-space:nowrap">${money(order.totalCents)}</td></tr></table>`;
  const body =
    callout(t(isBooking ? "Booking number" : "Order number"), order.number) +
    paymentEmailHtml(order.paymentMethod, t(pay?.name || paymentLabel(order.paymentMethod)), pay?.logo) +
    (audience === "customer" && pay?.instructions ? sectionTitle(t("How to pay with {name}", { name: t(pay.name) })) + paragraph(esc(pay.instructions).replace(/\n/g, "<br>")) : "") +
    sectionTitle(t(isBooking ? "Items for your visit" : "Items ordered")) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>` +
    factTable(totals, false) + grand +
    sectionTitle(audience === "customer" ? t("Your details") : (isBooking ? "Booking details" : "Order details")) +
    factTable((orderFacts(order, t, lang) as [string, string][]).filter(([k]) => k !== "Order number")) +
    (audience === "team" ? sectionTitle("Customer") + factTable([["Name", order.user.name], ["Email", order.user.email]]) : "");
  return emailLayout({
    lang,
    title: heading,
    preheader: audience === "customer"
      ? `${t(isBooking ? "Booking" : "Order")} ${order.number} · ${money(order.totalCents)} · ${t("we'll be in touch about the next steps.")}`
      : `${order.user.name} · ${money(order.totalCents)} · ${order.items.length} lot${order.items.length === 1 ? "" : "s"}`,
    eyebrow: audience === "customer" ? t(isBooking ? "Visit booking confirmation" : "Order confirmation") : (isBooking ? "New visit booking" : "New order"),
    heading,
    introHtml: intro,
    bodyHtml: body,
    cta: { label: t(isBooking ? "View booking details" : "View order details"), href: audience === "customer" ? orderUrl : `${base}/dashboard/orders/${encodeURIComponent(order.id)}` },
    noteHtml: audience === "customer" ? esc(t("Questions? Just reply to this email and our team will help.")) : undefined,
    reason: audience === "customer"
      ? t(isBooking ? "You are receiving this because a visit booking was placed with this email address on our site." : "You are receiving this because an order was placed with this email address on our site.")
      : `Store notification for ${isBooking ? "a" : "an"} ${kind} placed on the site.`,
  });
}

function orderText(order: OrderNotice, audience: "customer" | "team", t: TFunction = same, lang: Lang = "en") {
  if (audience === "team") { t = same; lang = "en"; }
  const base = emailLinkBase(lang);
  return [
    audience === "customer" ? t(order.visitAt ? "Thanks, {name}. We have received your visit booking." : "Thanks, {name}. We have received your order.", { name: order.user.name }) : `New ${order.visitAt ? "visit booking" : "order"} from ${order.user.name}.`,
    `${t(order.visitAt ? "Booking" : "Order")}: ${order.number}`, `${t("Email")}: ${order.user.email}`, ...orderFacts(order, t, lang).map(([key, value]) => `${key === "Order number" ? t("Order number") : key}: ${value}`),
    "", `${t("Items")}:`, ...order.items.map((item) => t("{qty} x {title} at {price} each", { qty: item.quantity, title: item.title, price: money(item.priceCents) })),
    "", `${t("Subtotal")}: ${money(order.subtotalCents)}`, `${t("Shipping")}: ${money(order.shippingCents)}`, `${t("Total")}: ${money(order.totalCents)}`,
    `${t("View order")}: ${base}/orders/${order.id}`,
  ].join("\n");
}

/** Send confirmation and store notification after the order commits; email failures never undo checkout. */
export async function notifyStoreOfOrder(order: OrderNotice, t: TFunction = same, lang: Lang = "en") {
  const adminTo = process.env.EMAIL_TO?.trim();
  if (!emailConfigured()) {
    console.warn(`Order ${order.number} was saved, but email sending is not configured.`);
    return;
  }
  const jobs: Promise<unknown>[] = [];
  let pay: PayNote = null;
  try {
    const m = (await getSetting("checkout")).paymentMethods.find((x) => x.id === order.paymentMethod);
    if (m) pay = { name: m.name, instructions: m.instructions && order.status === "PENDING" ? t(m.instructions) : "", logo: m.logo };
  } catch {
    /* settings unavailable: send without payment instructions */
  }
  jobs.push(sendEmail({
    to: order.user.email,
    subject: `${t(order.visitAt ? "Visit booking received" : "Order received")} · ${order.number} | PalletPort`,
    text: orderText(order, "customer", t, lang) + (pay?.instructions ? `\n\n${t("How to pay with {name}", { name: t(pay.name) })}:\n${pay.instructions}` : ""),
    html: emailHtml(order, "customer", pay, t, lang),
    idempotencyKey: `order-customer/${order.id}`,
  }).catch(() => console.warn(`Order ${order.number} was saved, but its customer confirmation could not be sent.`)));
  if (validEmail(adminTo)) {
    jobs.push(sendEmail({
      to: adminTo!,
      replyTo: order.user.email,
      subject: `New ${order.visitAt ? "visit booking" : "order"} · ${order.number} | PalletPort`,
      text: orderText(order, "team"),
      html: emailHtml(order, "team", pay),
      idempotencyKey: `order-admin/${order.id}`,
    }).catch(() => console.warn(`Order ${order.number} was saved, but its store notification could not be sent.`)));
  } else {
    console.warn(`Order ${order.number} was saved, but EMAIL_TO is not a valid inbox address.`);
  }
  await Promise.all(jobs);
}

/** Load the saved checkout details only after commit. Never let a mail or follow-up read failure interrupt checkout. */
export async function notifyCreatedOrder(orderId: string) {
  try {
    const order = await db.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { name: true, email: true } }, items: { select: { title: true, quantity: true, priceCents: true } } },
    });
    if (order) {
      const lang = await getUserLocale(order.userId);
      await notifyStoreOfOrder(order, await getTFor(lang), lang);
    }
  } catch {
    console.warn("The order was saved, but email confirmation could not be prepared.");
  }
}
