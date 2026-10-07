import "server-only";
import { db } from "@/lib/db";
import { emailConfigured, sendEmail, validEmail } from "@/lib/email";
import { getUserLocale } from "@/lib/user-locale";
import { getTFor } from "@/i18n/server";
import type { Locale } from "@/i18n/config";
import { certificateEmail, orderCancelledEmail, orderDeliveredEmail, orderShippedEmail, welcomeEmail, type Built, type StatusOrder } from "@/lib/email-templates";

/**
 * Lifecycle emails. Every function here swallows its own errors: a mail problem must never undo or block
 * the admin action or signup that triggered it (the change is already saved when these run).
 */

async function deliver(to: string, mail: Built, idempotencyKey: string, replyTo?: string) {
  if (!emailConfigured() || !validEmail(to)) return;
  await sendEmail({ to, subject: mail.subject, text: mail.text, html: mail.html, idempotencyKey, ...(replyTo ? { replyTo } : {}) });
}

/** The customer's language and its translator. */
async function customerLang(userId: string): Promise<{ lang: Locale; t: Awaited<ReturnType<typeof getTFor>> }> {
  const lang = await getUserLocale(userId);
  return { lang, t: await getTFor(lang) };
}

async function loadOrder(orderId: string): Promise<(StatusOrder & { userId: string }) | null> {
  return db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true, userId: true, number: true, totalCents: true, deliveryMethod: true, trackingNo: true, carrier: true, paidAt: true, amountPaidCents: true,
      shipName: true, shipAddress: true, shipCity: true, shipRegion: true, shipPostal: true,
      user: { select: { name: true, email: true } },
      items: { select: { title: true, quantity: true, priceCents: true } },
    },
  });
}

export type OrderEvent = "shipped" | "tracking" | "delivered" | "cancelled" | "buyer-cancelled";

export async function notifyOrderEvent(orderId: string, event: OrderEvent) {
  try {
    const o = await loadOrder(orderId);
    if (!o) return;
    const { lang, t } = await customerLang(o.userId);
    const jobs: Promise<unknown>[] = [];
    if (event === "shipped" || event === "tracking") {
      jobs.push(deliver(o.user.email, orderShippedEmail(o, event === "tracking", t, lang), `order-shipped/${o.id}/${o.trackingNo ?? ""}`));
    } else if (event === "delivered") {
      jobs.push(deliver(o.user.email, orderDeliveredEmail(o, t, lang), `order-delivered/${o.id}`));
    } else {
      const byBuyer = event === "buyer-cancelled";
      jobs.push(deliver(o.user.email, orderCancelledEmail(o, { byBuyer }, t, lang), `order-cancelled/${o.id}`));
      const team = process.env.EMAIL_TO?.trim();
      if (byBuyer && team) jobs.push(deliver(team, orderCancelledEmail(o, { byBuyer, audience: "team" }), `order-cancelled-team/${o.id}`, o.user.email));
    }
    await Promise.all(jobs.map((j) => j.catch(() => console.warn(`Order ${o.number}: the ${event} email could not be sent.`))));
  } catch {
    console.warn(`The ${event} email could not be prepared.`);
  }
}

export async function sendWelcomeEmail(user: { id: string; name: string; email: string; businessName?: string | null }) {
  try {
    const { lang, t } = await customerLang(user.id);
    await deliver(user.email, welcomeEmail(user, t, lang), `welcome/${user.id}`);
  } catch {
    console.warn("The welcome email could not be sent.");
  }
}

export async function sendCertificateEmail(user: { id: string; name: string; email: string }, status: string, note?: string | null) {
  if (status !== "APPROVED" && status !== "REJECTED") return;
  try {
    const { lang, t } = await customerLang(user.id);
    await deliver(user.email, certificateEmail(user, status, note, t, lang), `certificate/${user.id}/${status}/${Date.now()}`);
  } catch {
    console.warn("The certificate email could not be sent.");
  }
}
