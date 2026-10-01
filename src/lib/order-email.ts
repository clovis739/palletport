import "server-only";
import { money } from "@/lib/format";
import { emailConfigured, sendEmail, validEmail } from "@/lib/email";
import { db } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/commerce";
import { formatVisit } from "@/lib/visits";
import { BRAND, callout, emailBase, emailLayout, esc, factTable, sectionTitle } from "@/lib/email-layout";

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


function orderFacts(order: OrderNotice) {
  const shipTo = [order.shipAddress, order.shipCity, order.shipRegion, order.shipPostal, order.shipCountry].filter(Boolean).join(", ");
  const savedNotes = order.notes ?? "";
  const submittedPhone = savedNotes.match(/^\[Delivery phone: ([^\]]+)\](?:\n|$)/)?.[1]
    ?? savedNotes.match(/^Phone: ([^\r\n]+)/)?.[1]
    ?? order.phone ?? "";
  const customerNotes = savedNotes.replace(/^\[Delivery phone: [^\]]+\](?:\n|$)/, "").replace(/^Phone: [^\r\n]+(?:\n|$)/, "").trim();
  return [
    ["Order number", order.number], ["Order status", ORDER_STATUS_LABEL[order.status] ?? order.status], ["Payment method", PAYMENT_LABEL[order.paymentMethod] ?? order.paymentMethod],
    ["Receiving name", order.shipName],
    ["Delivery", order.deliveryMethod === "PICKUP" ? "Warehouse pickup" : "Freight delivery"],
    ...(order.deliveryMethod === "PICKUP" ? [["Visit time", order.visitAt ? formatVisit(order.visitAt) : "To be arranged"]] : [["Ship to", shipTo]]),
    ...(submittedPhone ? [["Phone", submittedPhone]] : []),
    ...(order.deliveryMethod !== "PICKUP" ? [["Loading dock", order.dockAccess ? "Available" : "Not available"], ["Residential delivery", order.residential ? "Yes" : "No"]] : []),
    ...(order.poNumber ? [["PO number", order.poNumber]] : []),
    ...(customerNotes ? [["Your notes", customerNotes]] : []),
  ];
}

function emailHtml(order: OrderNotice, audience: "customer" | "team") {
  const base = emailBase();
  const orderUrl = `${base}/orders/${encodeURIComponent(order.id)}`;
  const isBooking = Boolean(order.visitAt);
  const kind = isBooking ? "visit booking" : "order";
  const heading = audience === "customer"
    ? (isBooking ? "Your visit booking request was received" : "We have received your order")
    : `${isBooking ? "New visit booking" : "New order"} ${order.number}`;
  const intro = audience === "customer"
    ? `Thanks, ${esc(order.user.name)}. Your ${isBooking ? "warehouse visit request" : "order"} is with our team. Here is a copy of what you submitted.`
    : `A new ${kind} was placed by <strong>${esc(order.user.name)}</strong>. Reply directly to this email to contact the customer.`;
  const items = order.items.map((item) =>
    `<tr ><td style="padding:13px 12px 13px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;line-height:1.5">${esc(item.title)}<br><span style="color:${BRAND.muted}">Qty ${item.quantity} &times; ${money(item.priceCents)}</span></td><td style="padding:13px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:Inter,Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;text-align:right;white-space:nowrap;vertical-align:top">${money(item.priceCents * item.quantity)}</td></tr>`).join("");
  const totals: [string, string][] = [
    ["Subtotal", money(order.subtotalCents)],
    ...(order.discountCents ? ([["Discount", `-${money(order.discountCents)}`]] as [string, string][]) : []),
    ["Shipping", order.deliveryMethod === "PICKUP" ? "Pickup (free)" : money(order.shippingCents)],
  ];
  const grand = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td style="padding:14px 0 0;border-top:2px solid ${BRAND.ink};color:${BRAND.ink};font-family:'Space Grotesk',Inter,Helvetica,Arial,sans-serif;font-size:15px;font-weight:700">${isBooking ? "Visit total" : "Order total"}</td><td style="padding:14px 0 0;border-top:2px solid ${BRAND.ink};color:${BRAND.ink};font-family:'Space Grotesk',Inter,Helvetica,Arial,sans-serif;font-size:20px;font-weight:700;text-align:right;white-space:nowrap">${money(order.totalCents)}</td></tr></table>`;
  const body =
    callout(isBooking ? "Booking number" : "Order number", order.number) +
    sectionTitle(isBooking ? "Items for your visit" : "Items ordered") +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${items}</table>` +
    factTable(totals, false) + grand +
    sectionTitle(audience === "customer" ? "Your details" : (isBooking ? "Booking details" : "Order details")) +
    factTable((orderFacts(order) as [string, string][]).filter(([k]) => k !== "Order number")) +
    (audience === "team" ? sectionTitle("Customer") + factTable([["Name", order.user.name], ["Email", order.user.email]]) : "");
  return emailLayout({
    title: heading,
    preheader: audience === "customer"
      ? `${isBooking ? "Booking" : "Order"} ${order.number} · ${money(order.totalCents)} · we'll be in touch about the next steps.`
      : `${order.user.name} · ${money(order.totalCents)} · ${order.items.length} lot${order.items.length === 1 ? "" : "s"}`,
    eyebrow: audience === "customer" ? (isBooking ? "Visit booking confirmation" : "Order confirmation") : (isBooking ? "New visit booking" : "New order"),
    heading,
    introHtml: intro,
    bodyHtml: body,
    cta: { label: `View ${isBooking ? "booking" : "order"} details`, href: audience === "customer" ? orderUrl : `${base}/dashboard/orders/${encodeURIComponent(order.id)}` },
    noteHtml: audience === "customer" ? "Questions? Just reply to this email and our team will help." : undefined,
    reason: audience === "customer"
      ? `You are receiving this because ${isBooking ? "a" : "an"} ${kind} was placed with this email address on our site.`
      : `Store notification for ${isBooking ? "a" : "an"} ${kind} placed on the site.`,
  });
}

function orderText(order: OrderNotice, audience: "customer" | "team") {
  const base = (process.env.APP_URL || "https://liquidationpalletssale.com").replace(/\/+$/, "");
  return [
    audience === "customer" ? `Thanks, ${order.user.name}. We have received your ${order.visitAt ? "visit booking" : "order"}.` : `New ${order.visitAt ? "visit booking" : "order"} from ${order.user.name}.`,
    `${order.visitAt ? "Booking" : "Order"}: ${order.number}`, `Email: ${order.user.email}`, ...orderFacts(order).map(([key, value]) => `${key}: ${value}`),
    "", "Items:", ...order.items.map((item) => `${item.quantity} x ${item.title} at ${money(item.priceCents)} each`),
    "", `Subtotal: ${money(order.subtotalCents)}`, `Shipping: ${money(order.shippingCents)}`, `Total: ${money(order.totalCents)}`,
    `View order: ${base}/orders/${order.id}`,
  ].join("\n");
}

/** Send confirmation and store notification after the order commits; email failures never undo checkout. */
export async function notifyStoreOfOrder(order: OrderNotice) {
  const adminTo = process.env.EMAIL_TO?.trim();
  if (!emailConfigured()) {
    console.warn(`Order ${order.number} was saved, but email sending is not configured.`);
    return;
  }
  const jobs: Promise<unknown>[] = [];
  jobs.push(sendEmail({
    to: order.user.email,
    subject: `${order.visitAt ? "Visit booking received" : "Order received"} · ${order.number} | PalletPort`,
    text: orderText(order, "customer"),
    html: emailHtml(order, "customer"),
    idempotencyKey: `order-customer/${order.id}`,
  }).catch(() => console.warn(`Order ${order.number} was saved, but its customer confirmation could not be sent.`)));
  if (validEmail(adminTo)) {
    jobs.push(sendEmail({
      to: adminTo!,
      replyTo: order.user.email,
      subject: `New ${order.visitAt ? "visit booking" : "order"} · ${order.number} | PalletPort`,
      text: orderText(order, "team"),
      html: emailHtml(order, "team"),
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
    if (order) await notifyStoreOfOrder(order);
  } catch {
    console.warn("The order was saved, but email confirmation could not be prepared.");
  }
}
