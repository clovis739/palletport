/**
 * Customer lifecycle emails (order shipped / picked up, delivered, cancelled, welcome, resale certificate).
 * Pure builders on top of email-layout.ts: each returns { subject, html, text }. Sending lives in status-email.ts.
 */
import { money } from "./format";
import { BRAND, callout, emailBase, emailLayout, emailLinkBase, esc, factTable, paragraph, sectionTitle } from "./email-layout";
import { paymentEmailHtml } from "./payment-email";

/** Translation for the customer's language (identity for English and for team emails). */
export type Tr = (text: string, vars?: Record<string, string | number>) => string;
export type Lang = "en" | "es";
const same: Tr = (text, vars) => (vars ? text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m)) : text);

export type Built = { subject: string; html: string; text: string };

export type StatusOrder = {
  id: string;
  number: string;
  totalCents: number;
  deliveryMethod: string;
  paymentMethod?: string;
  paymentName?: string;
  paymentLogo?: string;
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

function itemList(order: StatusOrder, t: Tr = same) {
  const rows = order.items
    .map(
      (i) =>
        `<tr><td style="padding:11px 12px 11px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:${SANS};font-size:13px;line-height:1.5">${esc(i.title)}<br><span style="color:${BRAND.muted}">${esc(t("Qty {n}", { n: i.quantity }))}</span></td><td style="padding:11px 0;border-bottom:1px solid ${BRAND.line};color:${BRAND.ink};font-family:${SANS};font-size:13px;font-weight:600;text-align:right;white-space:nowrap;vertical-align:top">${money(i.priceCents * i.quantity)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">${rows}</table>${factTable([[t("Order total"), money(order.totalCents)]], false)}${paymentEmailHtml(order.paymentMethod, order.paymentName ? t(order.paymentName) : undefined, order.paymentLogo)}`;
}

const orderUrl = (o: StatusOrder, lang: Lang = "en") => `${emailLinkBase(lang)}/orders/${encodeURIComponent(o.id)}`;
const address = (o: StatusOrder) => [o.shipAddress, o.shipCity, o.shipRegion, o.shipPostal].filter(Boolean).join(", ");
const itemsText = (o: StatusOrder) => o.items.map((i) => `- ${i.quantity} x ${i.title}`).join("\n");

// ---------- shipped / picked up ----------

export function orderShippedEmail(o: StatusOrder, updated = false, t: Tr = same, lang: Lang = "en"): Built {
  const pickup = o.deliveryMethod === "PICKUP";
  const heading = t(pickup ? "Your order has been picked up" : updated ? "Your tracking details were updated" : "Your order is on its way");
  const tracking: [string, string][] = pickup
    ? [[t("Picked up by"), o.shipName || o.user.name]]
    : [[t("Order"), o.number], ...(o.carrier ? ([[t("Carrier"), o.carrier]] as [string, string][]) : []), [t("Delivering to"), address(o)]];
  const intro = pickup
    ? t("Thanks, {name}. Your lots left our warehouse today. We hope they sell fast.", { name: esc(o.user.name) })
    : `${t("Good news, {name}. Your freight has left our warehouse.", { name: esc(o.user.name) })} ${t(o.trackingNo ? "Use the PRO / tracking number below with the carrier to follow the delivery." : "We'll share tracking details as soon as the carrier provides them.")}`;
  const tips = pickup
    ? ""
    : sectionTitle(t("When the truck arrives")) +
      paragraph(esc(t("Count the pallets and check the shrink-wrap before you sign. Write any damage or missing pallets on the delivery receipt (bill of lading), take photos, and reply to this email the same day so we can help with a claim.")));
  const html = emailLayout({
    lang,
    title: heading,
    preheader: pickup
      ? t("Order {number} was collected from our warehouse.", { number: o.number })
      : `${t("Order {number} shipped", { number: o.number })}${o.carrier ? ` · ${o.carrier}` : ""}${o.trackingNo ? ` · PRO ${o.trackingNo}` : ""}.`,
    eyebrow: t(pickup ? "Picked up" : updated ? "Tracking update" : "Shipped"),
    heading,
    introHtml: intro,
    bodyHtml:
      (o.trackingNo && !pickup ? callout(t("PRO / tracking number"), o.trackingNo) : callout(t("Order number"), o.number)) +
      sectionTitle(t(pickup ? "Pickup details" : "Shipment details")) +
      factTable(tracking) +
      sectionTitle(t("What's in it")) +
      itemList(o, t) +
      tips,
    cta: { label: t("View your order"), href: orderUrl(o, lang) },
    noteHtml: esc(t(pickup ? "Questions about your order? Reply to this email and our team will help." : "Questions about your delivery? Reply to this email and our team will help.")),
    reason: t("You are receiving this because you placed an order on our site."),
  });
  const text = [
    heading,
    "",
    `${t("Order")}: ${o.number}`,
    ...(pickup ? [] : [o.carrier ? `${t("Carrier")}: ${o.carrier}` : "", o.trackingNo ? `${t("PRO / tracking number")}: ${o.trackingNo}` : "", `${t("Delivering to")}: ${address(o)}`]).filter(Boolean),
    "",
    itemsText(o),
    "",
    ...(pickup ? [] : [t("When the truck arrives: count the pallets and note any damage on the delivery receipt before you sign, then reply to this email the same day."), ""]),
    `${t("View your order")}: ${orderUrl(o, lang)}`,
  ].join("\n");
  return { subject: `${heading} · ${o.number} | PalletPort`, html, text };
}

// ---------- delivered ----------

export function orderDeliveredEmail(o: StatusOrder, t: Tr = same, lang: Lang = "en"): Built {
  const heading = t("Your order was delivered");
  const html = emailLayout({
    lang,
    title: heading,
    preheader: t("Order {number} was marked delivered.", { number: o.number }),
    eyebrow: t("Delivered"),
    heading,
    introHtml: t("Hi {name}, the carrier has marked order {number} as delivered. We hope everything arrived in good shape.", { name: esc(o.user.name), number: `<strong>${esc(o.number)}</strong>` }),
    bodyHtml:
      callout(t("Order number"), o.number) +
      sectionTitle(t("What was delivered")) +
      itemList(o, t) +
      sectionTitle(t("Something not right?")) +
      paragraph(esc(t("If pallets are missing or damaged, or the contents don't match the manifest, reply to this email with photos as soon as you can so we can look into it."))),
    cta: { label: t("View your order"), href: orderUrl(o, lang) },
    noteHtml: `${esc(t("Ready for the next one?"))} <a href="${esc(emailLinkBase(lang))}/new" style="color:${BRAND.signalDark}">${esc(t("See the newest lots"))}</a>.`,
    reason: t("You are receiving this because you placed an order on our site."),
  });
  const text = [heading, "", `${t("Order")}: ${o.number}`, "", itemsText(o), "", t("If anything is missing or damaged, reply to this email with photos."), "", `${t("View your order")}: ${orderUrl(o, lang)}`].join("\n");
  return { subject: `${t("Delivered")} · ${o.number} | PalletPort`, html, text };
}

// ---------- cancelled ----------

export function orderCancelledEmail(o: StatusOrder, opts: { byBuyer?: boolean; audience?: "customer" | "team" } = {}, t: Tr = same, lang: Lang = "en"): Built {
  const team = opts.audience === "team";
  if (team) { t = same; lang = "en"; }
  const paid = Boolean(o.paidAt) || (o.amountPaidCents ?? 0) > 0;
  const heading = team ? `Order ${o.number} was cancelled by the buyer` : t("Your order was cancelled");
  const intro = team
    ? `<strong>${esc(o.user.name)}</strong> (${esc(o.user.email)}) cancelled this order from their account. The lots are back in stock.`
    : opts.byBuyer
      ? t("Hi {name}, as requested, order {number} has been cancelled.", { name: esc(o.user.name), number: `<strong>${esc(o.number)}</strong>` })
      : t("Hi {name}, order {number} has been cancelled by our team. If you weren't expecting this, reply to this email and we'll explain.", { name: esc(o.user.name), number: `<strong>${esc(o.number)}</strong>` });
  const refund = money(o.amountPaidCents || o.totalCents);
  const money_ = paid
    ? paragraph(`<strong>${esc(t("About your payment:"))}</strong> ${esc(t("our team will arrange a refund of the {amount} you paid. Reply to this email if you have any questions about the refund.", { amount: refund }))}`)
    : paragraph(esc(t("No payment was taken for this order, so there is nothing to refund.")));
  const html = emailLayout({
    lang,
    title: heading,
    preheader: team ? `${o.user.name} cancelled ${o.number} (${money(o.totalCents)}).` : t("Order {number} has been cancelled.", { number: o.number }),
    eyebrow: team ? "Order cancelled" : t("Cancelled"),
    heading,
    introHtml: intro,
    bodyHtml: callout(t("Order number"), o.number) + sectionTitle(t("Cancelled items")) + itemList(o, t) + (team ? "" : money_),
    cta: team ? { label: "Open the order", href: `${emailBase()}/dashboard/orders/${encodeURIComponent(o.id)}` } : { label: t("Browse lots in stock"), href: `${emailLinkBase(lang)}/lots` },
    noteHtml: team ? undefined : esc(t("Questions? Just reply to this email.")),
    reason: team ? "Store notification for an order cancelled on the site." : t("You are receiving this because you placed an order on our site."),
  });
  const text = [heading, "", `${t("Order")}: ${o.number}`, "", itemsText(o), "", team ? "" : paid ? t("Our team will arrange a refund of the {amount} you paid.", { amount: refund }) : t("No payment was taken for this order."), "", team ? `${emailBase()}/dashboard/orders/${o.id}` : `${t("Browse lots")}: ${emailLinkBase(lang)}/lots`].join("\n");
  return { subject: `${team ? "Buyer cancelled" : t("Cancelled")} · ${o.number} | PalletPort`, html, text };
}

// ---------- welcome ----------

export function welcomeEmail(u: { name: string; businessName?: string | null }, t: Tr = same, lang: Lang = "en"): Built {
  const base = emailLinkBase(lang);
  const heading = t("Welcome to PalletPort, {name}", { name: u.name.split(" ")[0] });
  const step = (n: number, title: string, text: string) =>
    `<tr><td style="padding:12px 14px 12px 0;vertical-align:top;width:34px"><div style="width:30px;height:30px;border-radius:999px;background:${BRAND.signalTint};color:${BRAND.signalDark};font-family:${SANS};font-size:13px;font-weight:700;line-height:30px;text-align:center">${n}</div></td><td style="padding:12px 0;border-bottom:1px solid ${BRAND.line};vertical-align:top"><div style="color:${BRAND.ink};font-family:${SANS};font-size:14px;font-weight:700">${title}</div><div style="margin-top:3px;color:${BRAND.text};font-family:${SANS};font-size:13px;line-height:1.6">${text}</div></td></tr>`;
  const ready = u.businessName
    ? t("Your account for {business} is ready.", { business: `<strong>${esc(u.businessName)}</strong>` })
    : esc(t("Your account is ready."));
  const html = emailLayout({
    lang,
    title: heading,
    preheader: t("Your account is ready. Here's how buying works."),
    eyebrow: t("Account created"),
    heading,
    introHtml: `${ready} ${esc(t("Every lot on PalletPort comes from our own warehouse, with a manifest and a condition grade, at one fixed price."))}`,
    bodyHtml:
      sectionTitle(t("How buying works")) +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">` +
      step(1, esc(t("Pick your lots")), `${esc(t("Browse by category, lot size or condition and open the manifest to see what's inside."))} <a href="${esc(base)}/lots" style="color:${BRAND.signalDark}">${esc(t("Browse lots"))}</a>`) +
      step(2, esc(t("Check out")), esc(t("Add lots to your cart and choose freight delivery or a warehouse pickup."))) +
      step(3, esc(t("Get verified")), `${esc(t("Add your resale certificate to unlock Net 30 terms and tax-exempt checkout."))} <a href="${esc(base)}/account/verification" style="color:${BRAND.signalDark}">${esc(t("Add certificate"))}</a>`) +
      `</table>`,
    cta: { label: t("Start browsing"), href: `${base}/lots` },
    noteHtml: esc(t("Questions before your first order? Just reply to this email.")),
    reason: t("You are receiving this because you created an account on our site."),
  });
  const text = [
    heading,
    "",
    t("Your account is ready."),
    "",
    `1. ${t("Pick your lots")}: ${base}/lots`,
    `2. ${t("Check out with freight delivery or a warehouse pickup.")}`,
    `3. ${t("Add your resale certificate for Net 30 terms and tax-exempt checkout:")} ${base}/account/verification`,
    "",
    t("Questions? Just reply to this email."),
  ].join("\n");
  return { subject: t("Welcome to PalletPort"), html, text };
}

// ---------- resale certificate ----------

export function certificateEmail(u: { name: string }, status: "APPROVED" | "REJECTED", note?: string | null, t: Tr = same, lang: Lang = "en"): Built {
  const base = emailLinkBase(lang);
  const approved = status === "APPROVED";
  const heading = t(approved ? "You're a verified reseller" : "We couldn't verify your certificate");
  const noteHtml = note ? sectionTitle(t(approved ? "Note from our team" : "What we need")) + `<div style="padding:14px 16px;background:${BRAND.sand};border-radius:10px;color:${BRAND.ink};font-family:${SANS};font-size:14px;line-height:1.7;white-space:pre-wrap">${esc(note)}</div>` : "";
  const html = emailLayout({
    lang,
    title: heading,
    preheader: t(approved ? "Net 30 terms and tax-exempt checkout are now on for your account." : "Please update your resale certificate so we can verify your account."),
    eyebrow: t(approved ? "Certificate approved" : "Certificate needs attention"),
    heading,
    introHtml: approved
      ? t("Hi {name}, we've approved your resale certificate. Your account now has {net30} and {taxExempt}.", { name: esc(u.name), net30: `<strong>${esc(t("Net 30 terms"))}</strong>`, taxExempt: `<strong>${esc(t("tax-exempt checkout"))}</strong>` })
      : t("Hi {name}, we reviewed your resale certificate but couldn't approve it yet. You can upload an updated one from your account.", { name: esc(u.name) }),
    bodyHtml: (approved ? factTable([[t("Status"), t("Verified reseller")], [t("Payment terms"), t("Net 30 available")], [t("Sales tax"), t("Tax-exempt checkout")]]) : "") + noteHtml,
    cta: approved ? { label: t("Shop lots"), href: `${base}/lots` } : { label: t("Update certificate"), href: `${base}/account/verification` },
    noteHtml: esc(t("Questions? Just reply to this email.")),
    reason: t("You are receiving this because you submitted a resale certificate on our site."),
  });
  const text = [
    heading,
    "",
    t(approved ? "Your account now has Net 30 terms and tax-exempt checkout." : "Please upload an updated resale certificate."),
    note ? `\n${t("Note")}: ${note}` : "",
    "",
    approved ? `${t("Shop lots")}: ${base}/lots` : `${t("Update certificate")}: ${base}/account/verification`,
  ].join("\n");
  return {
    subject: approved ? t("Your resale certificate is approved | PalletPort") : t("Action needed: resale certificate | PalletPort"),
    html,
    text,
  };
}
