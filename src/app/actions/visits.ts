"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { getStore } from "@/lib/store";
import { purchasePrice } from "@/lib/format";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import { amountDueNow, checkVisitSlot } from "@/lib/visits";
import type { FormState } from "./auth";
import { notifyCreatedOrder } from "@/lib/order-email";
import { rememberRequestLocale } from "@/lib/user-locale";
import { getT } from "@/i18n/server";
import { translateMessage } from "@/i18n/config";
import { Prisma } from "@prisma/client";
import { guardOrderPlacement } from "@/lib/order-placement";

const visitSchema = z.object({
  lotId: z.string().min(1),
  qty: z.coerce.number().int().min(1).max(100),
  at: z.string().min(1, "Choose a visit time"),
  collectorName: z.string().trim().min(2, "Enter the name of the person collecting"),
  phone: z.string().trim().max(30).optional(),
  paymentMethod: z.enum(["CARD", "WIRE"]),
  notes: z.string().trim().max(500).optional(),
  terms: z.literal("on", { errorMap: () => ({ message: "Please accept the visit and payment terms" }) }),
});

function orderNumber() {
  return `PP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;
}

/**
 * Places a warehouse-pickup order with a booked visit. Payment due now: 35% refundable deposit for orders of $600+,
 * otherwise the full amount. Card = paid now → visit confirmed; Wire/ACH = pending until the payment arrives.
 */
export async function bookVisit(state: FormState, formData: FormData): Promise<FormState> {
  const result = await bookVisitInner(state, formData);
  if (result?.error) return { ...result, error: translateMessage(result.error, await getT()) };
  return result;
}

async function bookVisitInner(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/lots");
  const rl = rateLimit(`checkout:${session.userId}`, LIMITS.checkout.max, LIMITS.checkout.windowMs);
  if (!rl.ok) return { error: rl.message };
  const parsed = visitSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  const store = await getStore();

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      await guardOrderPlacement(tx, session.userId);
      const lot = await tx.lot.findUnique({ where: { id: d.lotId } });
      const unit = lot ? purchasePrice(lot) : null;
      if (!lot || unit === null) throw new Error("This lot is no longer available");
      if (lot.available < d.qty) throw new Error(`Only ${lot.available} of this lot ${lot.available === 1 ? "is" : "are"} in stock`);

      const taken = await tx.order.findMany({ where: { visitAt: new Date(d.at), status: { not: "CANCELLED" } }, select: { visitAt: true } });
      const slotError = checkVisitSlot(d.at, new Date(), taken.map((t) => t.visitAt!.toISOString()));
      if (slotError) throw new Error(slotError);

      const total = unit * d.qty;
      const { dueNowCents } = amountDueNow(total);
      const paidNow = d.paymentMethod === "CARD";
      // TODO(payments): charge `dueNowCents` with Stripe before confirming; until then card payments are recorded as paid.
      const order = await tx.order.create({
        data: {
          number: orderNumber(),
          userId: session.userId,
          status: paidNow ? "CONFIRMED" : "PENDING",
          paymentMethod: d.paymentMethod,
          subtotalCents: total,
          shippingCents: 0,
          totalCents: total,
          deliveryMethod: "PICKUP",
          shipName: d.collectorName,
          shipAddress: "Warehouse pickup",
          shipCity: store.location.split(",")[0]?.trim() || store.location,
          shipRegion: store.location.split(",")[1]?.trim() || "",
          shipPostal: "",
          shipCountry: "US",
          notes: [d.phone ? `Phone: ${d.phone}` : "", d.notes ?? ""].filter(Boolean).join("\n") || null,
          visitAt: new Date(d.at),
          dueNowCents,
          amountPaidCents: paidNow ? dueNowCents : 0,
          paidAt: paidNow && dueNowCents >= total ? new Date() : null,
          items: { create: [{ lotId: lot.id, sellerId: lot.sellerId, title: lot.title, priceCents: unit, quantity: d.qty }] },
        },
      });
      const remaining = lot.available - d.qty;
      await tx.lot.update({ where: { id: lot.id }, data: { available: remaining, status: remaining <= 0 ? "SOLD_OUT" : lot.status } });
      return order.id;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not book the visit" };
  }
  await rememberRequestLocale(session.userId);
  await notifyCreatedOrder(orderId);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?placed=1`);
}
