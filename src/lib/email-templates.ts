/**
 * Customer lifecycle emails (order shipped / picked up, delivered, cancelled, welcome, resale certificate).
 * Pure builders on top of email-layout.ts: each returns { subject, html, text }. Sending lives in status-email.ts.
 */
import { money } from "./format";
import { BRAND, callout, emailBase, emailLayout, esc, factTable, paragraph, sectionTitle } from "./email-layout";

export type Built = { subject: string; html: string; text: string };

export type StatusOrder = {
  id: string;
  number: string;
  totalCents: number;
  deliveryMethod: string;
  trackingNo?: string | null;
  carrier?: string | null;
  paidAt?: Date | null;
  amountPaidCents?: number;
  shipName: string;
  shipAddress: string;
  shipCity: string;
  shipRegion: string;
  shipPostal: string;
  user: { name: string; email: string };
  items: { title: string; quantity: number; priceCents: number }[];
};

const SANS = "Inter,'Helvetica Neue',Helvetica,Arial,sans-serif";

function itemList(order: StatusOrder) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:11px 12px 11px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:${SANS};font-size:13px;line-height:1.5">${esc(i.title)}<br><span style="color:${BRAND.muted}">Qty ${i.quantity}</span></td><td style="padding:11px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:${SANS};font-size:13px;font-weight:600;text-align:right;white-space:nowrap;vertical-align:top">${money(i.priceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>${factTable([["Order total", money(order.totalCents)]], false)}`;
}

const orderUrl = (o: StatusOrder) => `${emailBase()}/orders/${encodeURIComponent(o.id)}`;
const address = (o: StatusOrder) => [o.shipAddress, o.shipCity, o.shipRegion, o.shipPostal].filter(Boolean).join(", ");
const itemsText = (o: StatusOrder) => o.items.map((i) => `- ${i.quantity} x ${i.title}`).join("\n");

// ---------- shipped / picked up ----------

export function orderShippedEmail(o: StatusOrder, updated = false): Built {
  const pickup = o.deliveryMethod === "PICKUP";
  const heading = pickup ? "Your order has been picked up" : updated ? "Your tracking details were updated" : "Your order is on its way";
  const tracking: [string, string][] = pickup
    ? [["Picked up by", o.shipName || o.user.name]]
    : [["Order", o.number], ...(o.carrier ? ([["Carrier", o.carrier]] as [string, string][]) : []), ["Delivering to", address(o)]];
  const intro = pickup
    ? `Thanks, ${esc(o.user.name)}. Your lots left our warehouse today. We hope they sell fast.`
    : `Good news, ${esc(o.user.name)}. Your freight has left our warehouse. ${o.trackingNo ? "Use the PRO / tracking number below with the carrier to follow the delivery." : "We'll share tracking details as soon as the carrier provides them."}`;
  const tips = pickup
    ? ""
    : sectionTitle("When the truck arrives") +
      paragraph("Count the pallets and check the shrink-wrap before you sign. Write any damage or missing pallets on the delivery receipt (bill of lading), take photos, and reply to this email the same day so we can help with a claim.");
  const html = emailLayout({
    title: heading,
    preheader: pickup ? `Order ${o.number} was collected from our warehouse.` : `Order ${o.number} shipped${o.carrier ? ` with ${o.carrier}` : ""}${o.trackingNo ? ` · PRO ${o.trackingNo}` : ""}.`,
    eyebrow: pickup ? "Picked up" : updated ? "Tracking update" : "Shipped",
    heading,
    introHtml: intro,
    bodyHtml: (o.trackingNo && !pickup ? callout("PRO / tracking number", o.trackingNo) : callout("Order number", o.number)) + sectionTitle(pickup ? "Pickup details" : "Shipment details") + factTable(tracking) + sectionTitle("What's in it") + itemList(o) + tips,
    cta: { label: "View your order", href: orderUrl(o) },
    noteHtml: pickup ? "Questions about your order? Reply to this email and our team will help." : "Questions about your delivery? Reply to this email and our team will help.",
    reason: "You are receiving this because you placed an order on our site.",
  });
  const text = [
    heading,
    "",
    `Order: ${o.number}`,
    ...(pickup ? [] : [o.carrier ? `Carrier: ${o.carrier}` : "", o.trackingNo ? `PRO / tracking number: ${o.trackingNo}` : "", `Delivering to: ${address(o)}`]).filter(Boolean),
    "",
    itemsText(o),
    "",
    ...(pickup ? [] : ["When the truck arrives: count the pallets and note any damage on the delivery receipt before you sign, then reply to this email the same day.", ""]),
    `View your order: ${orderUrl(o)}`,
  ].join("\n");
  return { subject: `${heading} · ${o.number} | PalletPort`, html, text };
}

// ---------- delivered ----------

export function orderDeliveredEmail(o: StatusOrder): Built {
  const heading = "Your order was delivered";
  const html = emailLayout({
    title: heading,
    preheader: `Order ${o.number} was marked delivered.`,
    eyebrow: "Delivered",
    heading,
    introHtml: `Hi ${esc(o.user.name)}, the carrier has marked order <strong>${esc(o.number)}</strong> as delivered. We hope everything arrived in good shape.`,
    bodyHtml:
      callout("Order number", o.number) +
      sectionTitle("What was delivered") +
      itemList(o) +
      sectionTitle("Something not right?") +
      paragraph("If pallets are missing or damaged, or the contents don't match the manifest, reply to this email with photos as soon as you can so we can look into it."),
    cta: { label: "View your order", href: orderUrl(o) },
    noteHtml: `Ready for the next one? <a href="${esc(emailBase())}/new" style="color:${BRAND.signalDark}">See the newest lots</a>.`,
    reason: "You are receiving this because you placed an order on our site.",
  });
  const text = [heading, "", `Order: ${o.number}`, "", itemsText(o), "", "If anything is missing or damaged, reply to this email with photos.", "", `View your order: ${orderUrl(o)}`].join("\n");
  return { subject: `Delivered · ${o.number} | PalletPort`, html, text };
}

// ---------- cancelled ----------

export function orderCancelledEmail(o: StatusOrder, opts: { byBuyer?: boolean; audience?: "customer" | "team" } = {}): Built {
  const team = opts.audience === "team";
  const paid = Boolean(o.paidAt) || (o.amountPaidCents ?? 0) > 0;
  const heading = team ? `Order ${o.number} was cancelled by the buyer` : "Your order was cancelled";
  const intro = team
    ? `<strong>${esc(o.user.name)}</strong> (${esc(o.user.email)}) cancelled this order from their account. The lots are back in stock.`
    : opts.byBuyer
      ? `Hi ${esc(o.user.name)}, as requested, order <strong>${esc(o.number)}</strong> has been cancelled.`
      : `Hi ${esc(o.user.name)}, order <strong>${esc(o.number)}</strong> has been cancelled by our team. If you weren't expecting this, reply to this email and we'll explain.`;
  const money_ = paid
    ? paragraph(`<strong>About your payment:</strong> our team will arrange a refund of the ${money(o.amountPaidCents || o.totalCents)} you paid. Reply to this email if you have any questions about the refund.`)
    : paragraph("No payment was taken for this order, so there is nothing to refund.");
  const html = emailLayout({
    title: heading,
    preheader: team ? `${o.user.name} cancelled ${o.number} (${money(o.totalCents)}).` : `Order ${o.number} has been cancelled.`,
    eyebrow: team ? "Order cancelled" : "Cancelled",
    heading,
    introHtml: intro,
    bodyHtml: callout("Order number", o.number) + sectionTitle("Cancelled items") + itemList(o) + (team ? "" : money_),
    cta: team ? { label: "Open the order", href: `${emailBase()}/dashboard/orders/${encodeURIComponent(o.id)}` } : { label: "Browse lots in stock", href: `${emailBase()}/lots` },
    noteHtml: team ? undefined : "Questions? Just reply to this email.",
    reason: team ? "Store notification for an order cancelled on the site." : "You are receiving this because you placed an order on our site.",
  });
  const text = [heading, "", `Order: ${o.number}`, "", itemsText(o), "", team ? "" : paid ? `Our team will arrange a refund of the ${money(o.amountPaidCents || o.totalCents)} you paid.` : "No payment was taken for this order.", "", team ? `${emailBase()}/dashboard/orders/${o.id}` : `Browse lots: ${emailBase()}/lots`].join("\n");
  return { subject: `${team ? "Buyer cancelled" : "Cancelled"} · ${o.number} | PalletPort`, html, text };
}

// ---------- welcome ----------

export function welcomeEmail(u: { name: string; businessName?: string | null }): Built {
  const base = emailBase();
  const heading = `Welcome to PalletPort, ${u.name.split(" ")[0]}`;
  const step = (n: number, title: string, text: string) =>
    `<tr><td style="padding:12px 14px 12px 0;vertical-align:top;width:34px"><div style="width:30px;height:30px;border-radius:999px;background:${BRAND.signalTint};color:${BRAND.signalDark};font-family:${SANS};font-size:13px;font-weight:700;line-height:30px;text-align:center">${n}</div></td><td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};vertical-align:top"><div style="color:${BRAND.ink};font-family:${SANS};font-size:14px;font-weight:700">${title}</div><div style="margin-top:3px;color:${BRAND.text};font-family:${SANS};font-size:13px;line-height:1.6">${text}</div></td></tr>`;
  const html = emailLayout({
    title: heading,
    preheader: "Your account is ready. Here's how buying works.",
    eyebrow: "Account created",
    heading,
    introHtml: `Your account${u.businessName ? ` for <strong>${esc(u.businessName)}</strong>` : ""} is ready. Every lot on PalletPort comes from our own warehouse, with a manifest and a condition grade, at one fixed price.`,
    bodyHtml:
      sectionTitle("How buying works") +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
      step(1, "Pick your lots", `Browse by category, lot size or condition and open the manifest to see what's inside. <a href="${esc(base)}/lots" style="color:${BRAND.signalDark}">Browse lots</a>`) +
      step(2, "Check out", "Add lots to your cart and choose freight delivery or a warehouse pickup.") +
      step(3, "Get verified", `Add your resale certificate to unlock Net 30 terms and tax-exempt checkout. <a href="${esc(base)}/account/verification" style="color:${BRAND.signalDark}">Add certificate</a>`) +
      `</table>`,
    cta: { label: "Start browsing", href: `${base}/lots` },
    noteHtml: "Questions before your first order? Just reply to this email.",
    reason: "You are receiving this because you created an account on our site.",
  });
  const text = [heading, "", "Your account is ready.", "", `1. Pick your lots: ${base}/lots`, "2. Check out with freight delivery or a warehouse pickup.", `3. Add your resale certificate for Net 30 terms and tax-exempt checkout: ${base}/account/verification`, "", "Questions? Just reply to this email."].join("\n");
  return { subject: "Welcome to PalletPort", html, text };
}

// ---------- resale certificate ----------

export function certificateEmail(u: { name: string }, status: "APPROVED" | "REJECTED", note?: string | null): Built {
  const base = emailBase();
  const approved = status === "APPROVED";
  const heading = approved ? "You're a verified reseller" : "We couldn't verify your certificate";
  const noteHtml = note ? sectionTitle(approved ? "Note from our team" : "What we need") + `<div style="padding:14px 16px;background:${BRAND.sand};border-radius:10px;color:${BRAND.ink};font-family:${SANS};font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(note)}</div>` : "";
  const html = emailLayout({
    title: heading,
    preheader: approved ? "Net 30 terms and tax-exempt checkout are now on for your account." : "Please update your resale certificate so we can verify your account.",
    eyebrow: approved ? "Certificate approved" : "Certificate needs attention",
    heading,
    introHtml: approved
      ? `Hi ${esc(u.name)}, we've approved your resale certificate. Your account now has <strong>Net 30 terms</strong> and <strong>tax-exempt checkout</strong>.`
      : `Hi ${esc(u.name)}, we reviewed your resale certificate but couldn't approve it yet. You can upload an updated one from your account.`,
    bodyHtml: (approved ? factTable([["Status", "Verified reseller"], ["Payment terms", "Net 30 available"], ["Sales tax", "Tax-exempt checkout"]]) : "") + noteHtml,
    cta: approved ? { label: "Shop lots", href: `${base}/lots` } : { label: "Update certificate", href: `${base}/account/verification` },
    noteHtml: "Questions? Just reply to this email.",
    reason: "You are receiving this because you submitted a resale certificate on our site.",
  });
  const text = [heading, "", approved ? "Your account now has Net 30 terms and tax-exempt checkout." : "Please upload an updated resale certificate.", note ? `\nNote: ${note}` : "", "", approved ? `Shop lots: ${base}/lots` : `Update certificate: ${base}/account/verification`].join("\n");
  return { subject: approved ? "Your resale certificate is approved | PalletPort" : "Action needed: resale certificate | PalletPort", html, text };
}
