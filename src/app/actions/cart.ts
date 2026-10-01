"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { purchasePrice } from "@/lib/format";

export async function addToCart(formData: FormData) {
  const lotId = String(formData.get("lotId"));
  const qty = Math.max(1, Number(formData.get("quantity") ?? 1));
  const session = await getSession();
  const lot = await db.lot.findUnique({ where: { id: lotId } });
  if (!lot) return;
  if (!session) redirect(`/login?next=/lots/${lot.slug}`);
  if (purchasePrice(lot) === null) return;

  const existing = await db.cartItem.findUnique({
    where: { userId_lotId: { userId: session.userId, lotId } },
  });
  const quantity = Math.min(lot.available, (existing?.quantity ?? 0) + qty);
  await db.cartItem.upsert({
    where: { userId_lotId: { userId: session.userId, lotId } },
    create: { userId: session.userId, lotId, quantity },
    update: { quantity },
  });
  revalidatePath("/", "layout");
  // "Buy now" skips the cart page and goes straight to checkout.
  redirect(formData.get("intent") === "buy" ? "/checkout" : "/cart");
}

export async function updateCartItem(formData: FormData) {
  const session = await getSession();
  if (!session) redirect("/login?next=/cart");
  const id = String(formData.get("id"));
  const quantity = Number(formData.get("quantity"));
  const item = await db.cartItem.findFirst({ where: { id, userId: session.userId }, include: { lot: true } });
  if (!item) return;
  if (quantity <= 0) {
    await db.cartItem.delete({ where: { id } });
  } else {
    await db.cartItem.update({ where: { id }, data: { quantity: Math.min(quantity, item.lot.available) } });
  }
  revalidatePath("/", "layout");
}

export type QuickAddState = { ok?: boolean; error?: string; at?: number } | undefined;

/**
 * "Add to cart" from a product card: adds one lot and stays on the page (the header cart count refreshes).
 * Signed-out visitors are sent to sign in and brought back to the page they were on.
 */
export async function quickAddToCart(_: QuickAddState, formData: FormData): Promise<QuickAddState> {
  const lotId = String(formData.get("lotId") ?? "");
  const back = String(formData.get("back") ?? "/");
  const session = await getSession();
  if (!session) redirect(`/login?next=${encodeURIComponent(back.startsWith("/") && !back.startsWith("//") ? back : "/")}`);
  const lot = await db.lot.findUnique({ where: { id: lotId } });
  if (!lot || purchasePrice(lot) === null) return { error: "This lot has sold out" };
  const existing = await db.cartItem.findUnique({ where: { userId_lotId: { userId: session.userId, lotId } } });
  if (existing && existing.quantity >= lot.available) return { error: `All ${lot.available} in stock are in your cart` };
  const quantity = Math.min(lot.available, (existing?.quantity ?? 0) + 1);
  await db.cartItem.upsert({
    where: { userId_lotId: { userId: session.userId, lotId } },
    create: { userId: session.userId, lotId, quantity },
    update: { quantity },
  });
  revalidatePath("/", "layout");
  return { ok: true, at: Date.now() };
}
