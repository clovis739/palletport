import "server-only";
import { db } from "./db";

type Line = { sellerId: string; priceCents: number; quantity: number };

export type PromoResult =
  | { ok: true; code: string; discountCents: number; description: string }
  | { ok: false; error: string };

/** Validates a promo code against a cart and returns the discount. */
export async function evaluatePromo(rawCode: string, userId: string, lines: Line[]): Promise<PromoResult> {
  const code = rawCode.trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a code" };
  const promo = await db.promo.findUnique({ where: { code } });
  if (!promo || !promo.active) return { ok: false, error: "That code isn't valid" };
  if (promo.expiresAt && promo.expiresAt < new Date()) return { ok: false, error: "That code has expired" };

  if (promo.firstOrderOnly) {
    const prior = await db.order.count({ where: { userId } });
    if (prior > 0) return { ok: false, error: "That code is for first orders only" };
  }

  const eligible = lines.filter((l) => !promo.sellerId || l.sellerId === promo.sellerId);
  const base = eligible.reduce((a, l) => a + l.priceCents * l.quantity, 0);
  if (base === 0) return { ok: false, error: "No lots in your cart qualify for that code" };
  if (base < promo.minSubtotalCents) {
    return { ok: false, error: `Spend at least $${(promo.minSubtotalCents / 100).toLocaleString()} to use that code` };
  }

  const discountCents = Math.min(
    base,
    promo.percentOff ? Math.round((base * promo.percentOff) / 100) : promo.amountOffCents ?? 0,
  );
  return { ok: true, code, discountCents, description: promo.description };
}
