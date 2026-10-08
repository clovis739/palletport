"use server";

import { revalidatePath } from "@/lib/public-cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { withFlash } from "@/components/admin/flashUrl";
import { notifyOrderEvent } from "@/lib/status-email";

/**
 * Admin order workflow (staff with the "orders" permission). Buyer-facing flows stay in ./orders.ts.
 * Every action redirects back to the order page with a flash message and writes an audit entry
 * (target = order number, so the order timeline can show it).
 */

const idSchema = z.string().min(1).max(64);

async function load(fd: FormData) {
  const id = idSchema.safeParse(fd.get("id"));
  const { user } = await requireStaff("orders", "/dashboard/orders");
  if (!id.success) redirect(withFlash("/dashboard/orders", "Order not found", "error"));
  const order = await db.order.findUnique({ where: { id: id.data }, include: { items: { include: { lot: true } } } });
  if (!order) redirect(withFlash("/dashboard/orders", "Order not found", "error"));
  return { user, order, back: `/dashboard/orders/${order.id}` };
}

function refresh(id: string) {
  revalidatePath(`/dashboard/orders/${id}`);
  revalidatePath("/dashboard/orders");
  revalidatePath(`/orders/${id}`);
  revalidatePath("/dashboard", "layout"); // sidebar badge + overview
}

export async function confirmOrder(fd: FormData) {
  const { user, order, back } = await load(fd);
  if (order.status !== "PENDING") redirect(withFlash(back, "Only pending orders can be confirmed", "error"));
  await db.order.update({ where: { id: order.id }, data: { status: "CONFIRMED" } });
  await logAudit(user, "order.confirm", order.number, "PENDING → CONFIRMED");
  refresh(order.id);
  redirect(withFlash(back, "Order confirmed"));
}

export async function markOrderPaid(fd: FormData) {
  const { user, order, back } = await load(fd);
  if (order.status === "CANCELLED") redirect(withFlash(back, "This order is cancelled", "error"));
  if (order.paidAt) redirect(withFlash(back, "This order is already marked paid", "info"));
  const method = order.paymentMethod;
  const status = order.status === "PENDING" ? "CONFIRMED" : order.status;
  // Warehouse visit with a deposit not yet received: record the deposit first (confirms the visit).
  if (order.visitAt && order.dueNowCents < order.totalCents && order.amountPaidCents < order.dueNowCents) {
    await db.order.update({ where: { id: order.id }, data: { amountPaidCents: order.dueNowCents, status } });
    await logAudit(user, "order.paid", order.number, `deposit ${(order.dueNowCents / 100).toFixed(2)} · ${method}${status !== order.status ? ` · ${order.status} → ${status}` : ""}`);
    refresh(order.id);
    redirect(withFlash(back, "Deposit recorded — visit confirmed"));
  }
  await db.order.update({ where: { id: order.id }, data: { paidAt: new Date(), amountPaidCents: order.totalCents, paymentMethod: method, status } });
  await logAudit(user, "order.paid", order.number, `${method}${status !== order.status ? ` · ${order.status} → ${status}` : ""}`);
  refresh(order.id);
  redirect(withFlash(back, "Payment recorded"));
}

const shipSchema = z.object({
  trackingNo: z.string().trim().max(80).optional().default(""),
  carrier: z.string().trim().max(60).optional().default(""),
});

export async function markOrderShipped(fd: FormData) {
  const { user, order, back } = await load(fd);
  const parsed = shipSchema.safeParse({ trackingNo: fd.get("trackingNo") ?? "", carrier: fd.get("carrier") ?? "" });
  if (!parsed.success) redirect(withFlash(back, "Tracking number or carrier is too long", "error"));
  const { trackingNo, carrier } = parsed.data;
  if (order.status !== "CONFIRMED" && order.status !== "SHIPPED") redirect(withFlash(back, "Confirm the order before shipping it", "error"));
  if (order.deliveryMethod !== "PICKUP" && !trackingNo) redirect(withFlash(back, "Enter the freight PRO / tracking number", "error"));
  const updating = order.status === "SHIPPED";
  await db.order.update({
    where: { id: order.id },
    data: { status: "SHIPPED", trackingNo: trackingNo || null, carrier: carrier || null, ...(updating ? {} : { shippedAt: new Date() }) },
  });
  await notifyOrderEvent(order.id, updating ? "tracking" : "shipped");
  await logAudit(user, "order.shipped", order.number, [updating ? "tracking updated" : "CONFIRMED → SHIPPED", carrier, trackingNo && `tracking ${trackingNo}`].filter(Boolean).join(" · "));
  refresh(order.id);
  redirect(withFlash(back, updating ? "Tracking updated" : order.deliveryMethod === "PICKUP" ? "Marked as picked up" : "Marked as shipped"));
}

export async function markOrderDelivered(fd: FormData) {
  const { user, order, back } = await load(fd);
  if (order.status !== "SHIPPED") redirect(withFlash(back, "Only shipped orders can be marked delivered", "error"));
  await db.order.update({ where: { id: order.id }, data: { status: "DELIVERED", deliveredAt: new Date() } });
  await notifyOrderEvent(order.id, "delivered");
  await logAudit(user, "order.delivered", order.number, "SHIPPED → DELIVERED");
  refresh(order.id);
  redirect(withFlash(back, "Marked as delivered"));
}

/**
 * Cancels an order that hasn't shipped. Lots get their quantity back (and go live again if they had sold out and
 * weren't hidden). A promo code's use count is given back. Refunds for money already received are handled outside the site.
 */
export async function adminCancelOrder(fd: FormData) {
  const { user, order, back } = await load(fd);
  if (!["PENDING", "CONFIRMED"].includes(order.status)) redirect(withFlash(back, "Shipped, delivered or cancelled orders can't be cancelled", "error"));
  await db.$transaction([
    db.order.update({ where: { id: order.id }, data: { status: "CANCELLED", cancelledAt: new Date() } }),
    ...order.items.map((i) =>
      db.lot.update({
        where: { id: i.lotId },
        data: { available: { increment: i.quantity }, ...(i.lot.status === "SOLD_OUT" ? { status: "ACTIVE" } : {}) },
      }),
    ),
    ...(order.promoCode ? [db.promo.updateMany({ where: { code: order.promoCode, uses: { gt: 0 } }, data: { uses: { decrement: 1 } } })] : []),
  ]);
  await notifyOrderEvent(order.id, "cancelled");
  await logAudit(user, "order.cancel", order.number, `${order.status} → CANCELLED${order.paidAt ? " · was paid: refund manually" : ""}`);
  refresh(order.id);
  revalidatePath("/lots");
  redirect(withFlash(back, order.paidAt ? "Order cancelled. Refund the payment manually." : "Order cancelled"));
}

export async function saveOrderNotes(fd: FormData) {
  const { user, order, back } = await load(fd);
  const notes = String(fd.get("adminNotes") ?? "").trim().slice(0, 4000);
  await db.order.update({ where: { id: order.id }, data: { adminNotes: notes || null } });
  await logAudit(user, "order.note", order.number, notes ? `${notes.length} characters` : "cleared");
  revalidatePath(back);
  redirect(withFlash(back, "Notes saved"));
}
