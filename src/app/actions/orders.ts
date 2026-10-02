"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { purchasePrice } from "@/lib/format";
import { estimateShipments, freightTotal } from "@/lib/shipping";
import { evaluatePromo } from "@/lib/promo";
import { PROMO_COOKIE } from "@/lib/cart";
import { cookies } from "next/headers";
import { LIMITS, rateLimit } from "@/lib/rateLimit";
import type { FormState } from "./auth";
import { notifyCreatedOrder } from "@/lib/order-email";
import { notifyOrderEvent } from "@/lib/status-email";
import { getSetting } from "@/lib/settings";
import { referralDiscount } from "@/lib/referrals";

const checkoutSchema = z.object({
  shipName: z.string().trim().min(2, "Enter a receiving name"),
  shipAddress: z.string().trim().min(4, "Enter a street address"),
  shipCity: z.string().trim().min(2, "Enter a city"),
  shipRegion: z.string().trim().min(2, "Enter a state or region"),
  shipPostal: z.string().trim().min(3, "Enter a postal code"),
  shipCountry: z.string().trim().min(2, "Enter a country"),
  phone: z.string().trim().max(30).optional(),
  /** Checked against the enabled methods in Admin → Site settings → Checkout below. */
  paymentMethod: z.string().trim().regex(/^[A-Z0-9_]{2,24}$/, "Choose a payment method"),
  dockAccess: z.string().optional(),
  deliveryMethod: z.enum(["FREIGHT", "PICKUP"]).default("FREIGHT"),
  residential: z.string().optional(),
  poNumber: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(500).optional(),
  terms: z.literal("on", { errorMap: () => ({ message: "Please accept the purchase terms to place your order" }) }),
});

function orderNumber() {
  return `PP-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;
}

export async function placeOrder(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login?next=/checkout");

  const rl = rateLimit(`checkout:${session.userId}`, LIMITS.checkout.max, LIMITS.checkout.windowMs);
  if (!rl.ok) return { error: rl.message };
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { dockAccess, residential, deliveryMethod, poNumber, notes, phone, terms: _terms, ...ship } = parsed.data;

  // Payment method and checkout fields as configured by the owner.
  const cfg = await getSetting("checkout");
  if (!cfg.paymentMethods.some((m) => m.enabled && m.id === ship.paymentMethod)) return { error: "That payment method isn't available. Please choose another." };
  const req = (on: { show: boolean; required: boolean; label: string }, v?: string) => on.show && on.required && !v;
  if (req(cfg.fields.phone, phone)) return { error: `Enter: ${cfg.fields.phone.label}` };
  if (req(cfg.fields.poNumber, poNumber)) return { error: `Enter: ${cfg.fields.poNumber.label}` };
  if (req(cfg.fields.notes, notes)) return { error: `Enter: ${cfg.fields.notes.label}` };
  const extras: string[] = [];
  for (const cf of cfg.customFields) {
    const v = String(formData.get(`cf_${cf.id}`) ?? "").trim().slice(0, cf.type === "textarea" ? 500 : 200);
    if (cf.required && !v) return { error: `Enter: ${cf.label}` };
    if (v) extras.push(`[${cf.label}: ${v}]`);
  }

  if (ship.paymentMethod === "NET30") {
    const u = await db.user.findUnique({ where: { id: session.userId }, select: { certStatus: true } });
    if (u?.certStatus !== "APPROVED") return { error: "Net 30 terms need an approved resale certificate. Add one under Account → Business verification." };
  }
  const store = await cookies();
  const promoCode = store.get(PROMO_COOKIE)?.value ?? "";

  let orderId: string;
  try {
    orderId = await db.$transaction(async (tx) => {
      const rows = await tx.cartItem.findMany({ where: { userId: session.userId }, include: { lot: true } });
      if (rows.length === 0) throw new Error("Your cart is empty");

      const items = rows.map((i) => {
        const unit = purchasePrice(i.lot);
        if (unit === null || i.lot.available < i.quantity) {
          throw new Error(`"${i.lot.title}" is no longer available in that quantity`);
        }
        return { ...i, unitCents: unit };
      });

      const subtotalCents = items.reduce((a, i) => a + i.unitCents * i.quantity, 0);
      const sellersById = new Map((await tx.seller.findMany({ where: { id: { in: items.map((i) => i.lot.sellerId) } }, select: { id: true, name: true } })).map((x) => [x.id, x.name] as const));
      const shippingCents = freightTotal(
        estimateShipments(
          items.map((i) => ({
            sellerId: i.lot.sellerId,
            sellerName: sellersById.get(i.lot.sellerId) ?? "",
            shipsFrom: i.lot.shipsFrom,
            lotSize: i.lot.lotSize,
            palletCount: i.lot.palletCount,
            weightLbs: i.lot.weightLbs,
            quantity: i.quantity,
            priceCents: i.unitCents,
          })),
          { toZip: ship.shipPostal, method: deliveryMethod, liftgate: dockAccess !== "on", residential: residential === "on" },
          subtotalCents,
        ),
      );

      const sellers = await tx.seller.findMany({ where: { id: { in: [...new Set(items.map((i) => i.lot.sellerId))] } } });
      // Warehouse pickup is by appointment only. It can be chosen at checkout only while the store's pickup setting is on.
      if (deliveryMethod === "PICKUP" && sellers.some((s) => !s.pickup)) {
        throw new Error("Warehouse pickup is by appointment only. Choose delivery, or contact us to request a pickup appointment before you order.");
      }
      for (const s of sellers) {
        const spent = items.filter((i) => i.lot.sellerId === s.id).reduce((a, i) => a + i.unitCents * i.quantity, 0);
        if (spent < s.minOrderCents) throw new Error(`${s.name} has a $${(s.minOrderCents / 100).toLocaleString()} minimum order`);
      }

      let discountCents = 0;
      let appliedCode: string | null = null;
      if (promoCode) {
        const r = await evaluatePromo(promoCode, session.userId, items.map((i) => ({ sellerId: i.lot.sellerId, priceCents: i.unitCents, quantity: i.quantity })));
        if (r.ok) {
          discountCents = r.discountCents;
          appliedCode = r.code;
          await tx.promo.update({ where: { code: r.code }, data: { uses: { increment: 1 } } });
        }
      }
      // "Give $100, get $100": applied automatically when no promo code is used (see src/lib/referrals.ts).
      if (!appliedCode) {
        const ref = await referralDiscount(session.userId, subtotalCents, tx);
        if (ref.discount) {
          discountCents = ref.discount.cents;
          appliedCode = ref.discount.code;
        }
      }

      // TODO(payments): for CARD, create a Stripe PaymentIntent here and only confirm the order on webhook success.
      const order = await tx.order.create({
        data: {
          number: orderNumber(),
          userId: session.userId,
          status: ship.paymentMethod === "CARD" ? "CONFIRMED" : "PENDING",
          subtotalCents,
          discountCents,
          promoCode: appliedCode,
          shippingCents,
          totalCents: subtotalCents - discountCents + shippingCents,
          dockAccess: dockAccess === "on",
          residential: residential === "on",
          deliveryMethod,
          poNumber: poNumber || null,
          notes: [phone ? `[Delivery phone: ${phone}]` : "", ...extras, notes ?? ""].filter(Boolean).join("\n") || null,
          ...ship,
          items: {
            create: items.map((i) => ({
              lotId: i.lotId,
              sellerId: i.lot.sellerId,
              title: i.lot.title,
              priceCents: i.unitCents,
              quantity: i.quantity,
            })),
          },
        },
      });

      for (const i of items) {
        const remaining = i.lot.available - i.quantity;
        await tx.lot.update({
          where: { id: i.lotId },
          data: { available: remaining, status: remaining <= 0 ? "SOLD_OUT" : i.lot.status },
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: session.userId } });
      return order.id;
    });
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not place order" };
  }

  await notifyCreatedOrder(orderId);

  store.delete(PROMO_COOKIE);
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?placed=1`);
}

export async function cancelOrder(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  const id = String(formData.get("orderId"));
  const order = await db.order.findFirst({ where: { id, userId: session.userId }, include: { items: { include: { lot: true } } } });
  if (!order || order.status !== "PENDING") return;
  await db.$transaction([
    db.order.update({ where: { id }, data: { status: "CANCELLED" } }),
    ...order.items.map((i) => db.lot.update({ where: { id: i.lotId }, data: { available: { increment: i.quantity }, status: "ACTIVE" } })),
  ]);
  await notifyOrderEvent(id, "buyer-cancelled");
  revalidatePath(`/orders/${id}`);
}

export async function reorder(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/orders");
  const id = String(formData.get("orderId"));
  const order = await db.order.findFirst({ where: { id, userId: session.userId }, include: { items: { include: { lot: true } } } });
  if (!order) return;
  for (const i of order.items) {
    if (purchasePrice(i.lot) === null || i.lot.available < 1) continue;
    await db.cartItem.upsert({
      where: { userId_lotId: { userId: session.userId, lotId: i.lotId } },
      create: { userId: session.userId, lotId: i.lotId, quantity: Math.min(i.quantity, i.lot.available) },
      update: {},
    });
  }
  revalidatePath("/", "layout");
  redirect("/cart");
}

const reviewSchema = z.object({
  orderId: z.string(),
  sellerId: z.string(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().min(10, "Write at least a sentence"),
});

export async function submitReview(_: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) redirect("/login");
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { orderId, sellerId, rating, body } = parsed.data;
  const order = await db.order.findFirst({ where: { id: orderId, userId: session.userId, status: "DELIVERED", items: { some: { sellerId } } } });
  if (!order) return { error: "You can review a seller once the order is delivered" };
  const exists = await db.review.findUnique({ where: { orderId_sellerId: { orderId, sellerId } } });
  if (exists) return { error: "You already reviewed this seller for this order" };
  await db.review.create({ data: { orderId, sellerId, userId: session.userId, rating, body } });
  const agg = await db.review.aggregate({ where: { sellerId }, _avg: { rating: true } });
  await db.seller.update({ where: { id: sellerId }, data: { rating: Math.round((agg._avg.rating ?? rating) * 10) / 10 } });
  revalidatePath(`/orders/${orderId}`);
  return { error: undefined };
}
