import "server-only";
import { cookies } from "next/headers";
import { db } from "./db";
import { purchasePrice } from "./format";
import { estimateShipments, freightTotal, type FreightOptions, type ShipLine } from "./shipping";
import { evaluatePromo, type PromoResult } from "./promo";

export const PROMO_COOKIE = "pp_promo";

export async function getCart(userId: string, freight?: Partial<FreightOptions>) {
  const rows = await db.cartItem.findMany({
    where: { userId },
    include: { lot: { include: { seller: true, category: true } } },
    orderBy: { id: "asc" },
  });
  // unitCents = the lot's fixed price.
  const items = rows.map((r) => {
    const unit = purchasePrice(r.lot);
    return { ...r, unitCents: unit ?? r.lot.priceCents, purchasable: unit !== null };
  });
  const subtotalCents = items.reduce((a, i) => a + i.unitCents * i.quantity, 0);
  const pallets = items.reduce((a, i) => a + i.lot.palletCount * i.quantity, 0);
  const user = await db.user.findUnique({ where: { id: userId }, select: { shipPostal: true } });
  const shipLines: ShipLine[] = items.map((i) => ({
    sellerId: i.lot.sellerId,
    sellerName: i.lot.seller.name,
    shipsFrom: i.lot.shipsFrom,
    lotSize: i.lot.lotSize,
    palletCount: i.lot.palletCount,
    weightLbs: i.lot.weightLbs,
    quantity: i.quantity,
    priceCents: i.unitCents,
  }));
  const freightOpts: FreightOptions = {
    toZip: freight?.toZip ?? user?.shipPostal ?? null,
    method: freight?.method ?? "FREIGHT",
    liftgate: freight?.liftgate ?? true,
    residential: freight?.residential ?? false,
  };
  const shipments = estimateShipments(shipLines, freightOpts, subtotalCents);
  const shippingCents = freightTotal(shipments);

  const code = (await cookies()).get(PROMO_COOKIE)?.value ?? "";
  let promo: PromoResult | null = null;
  if (code && items.length) {
    promo = await evaluatePromo(
      code,
      userId,
      items.map((i) => ({ sellerId: i.lot.sellerId, priceCents: i.unitCents, quantity: i.quantity })),
    );
  }
  const discountCents = promo?.ok ? promo.discountCents : 0;

  // Seller minimums: each seller may require a minimum spend.
  const bySeller = new Map<string, { name: string; min: number; total: number }>();
  for (const i of items) {
    const e = bySeller.get(i.lot.sellerId) ?? { name: i.lot.seller.name, min: i.lot.seller.minOrderCents, total: 0 };
    e.total += i.unitCents * i.quantity;
    bySeller.set(i.lot.sellerId, e);
  }
  const minimumsUnmet = [...bySeller.values()].filter((s) => s.total < s.min);

  return {
    items,
    shipLines,
    shipments,
    freightOpts,
    unavailable: items.filter((i) => !i.purchasable),
    subtotalCents,
    pallets,
    shippingCents,
    promoCode: code,
    promo,
    discountCents,
    minimumsUnmet,
    totalCents: subtotalCents - discountCents + shippingCents,
  };
}

export async function getCartCount(userId: string) {
  const agg = await db.cartItem.aggregate({ where: { userId }, _sum: { quantity: true } });
  return agg._sum.quantity ?? 0;
}
