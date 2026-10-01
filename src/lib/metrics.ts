import "server-only";
import { db } from "./db";
import { REVENUE_STATUSES, bucketByDay, dayKey, type RangeWindow } from "./commerce";

/**
 * Sales metrics for the admin overview and analytics (current period vs the previous period of equal length).
 * Revenue = order totals (incl. freight, after discounts) of CONFIRMED / SHIPPED / DELIVERED orders, by order date.
 */

const isRevenue = (s: string) => (REVENUE_STATUSES as readonly string[]).includes(s);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

export function prevKeys(win: RangeWindow) {
  return Array.from({ length: win.days }, (_, i) => dayKey(new Date(win.prevStart.getTime() + i * 86400000)));
}

export async function salesMetrics(win: RangeWindow) {
  const [orders, newUsers, lines] = await Promise.all([
    db.order.findMany({
      where: { createdAt: { gte: win.prevStart } },
      select: { id: true, createdAt: true, status: true, totalCents: true, discountCents: true, promoCode: true, userId: true },
    }),
    db.user.findMany({ where: { createdAt: { gte: win.prevStart }, role: { notIn: ["ADMIN", "MANAGER", "EDITOR"] } }, select: { createdAt: true } }),
    // Lots sold = order-line quantities of orders that weren't cancelled, dated by the order.
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: win.prevStart }, status: { not: "CANCELLED" } } },
      select: { quantity: true, order: { select: { createdAt: true } } },
    }),
  ]);
  const pk = prevKeys(win);
  const inCur = <T extends { createdAt: Date }>(xs: T[]) => xs.filter((x) => x.createdAt >= win.start);
  const inPrev = <T extends { createdAt: Date }>(xs: T[]) => xs.filter((x) => x.createdAt < win.start);

  const sold = lines.map((l) => ({ createdAt: l.order.createdAt, quantity: l.quantity }));
  const placed = orders.filter((o) => o.status !== "CANCELLED");
  const rev = orders.filter((o) => isRevenue(o.status));
  const cur = { placed: inCur(placed), rev: inCur(rev), users: inCur(newUsers), sold: inCur(sold), all: inCur(orders) };
  const prev = { placed: inPrev(placed), rev: inPrev(rev), users: inPrev(newUsers), sold: inPrev(sold) };

  const revenue = sum(cur.rev.map((o) => o.totalCents));
  const prevRevenue = sum(prev.rev.map((o) => o.totalCents));
  return {
    orders: cur.all,
    revenue,
    prevRevenue,
    revenueDaily: bucketByDay(cur.rev, win.keys, (o) => o.createdAt, (o) => o.totalCents),
    prevRevenueDaily: bucketByDay(prev.rev, pk, (o) => o.createdAt, (o) => o.totalCents),
    ordersCount: cur.placed.length,
    prevOrdersCount: prev.placed.length,
    ordersDaily: bucketByDay(cur.placed, win.keys, (o) => o.createdAt),
    paidCount: cur.rev.length,
    aov: cur.rev.length ? Math.round(revenue / cur.rev.length) : 0,
    prevAov: prev.rev.length ? Math.round(prevRevenue / prev.rev.length) : 0,
    newCustomers: cur.users.length,
    prevNewCustomers: prev.users.length,
    newCustomersDaily: bucketByDay(cur.users, win.keys, (u) => u.createdAt),
    lotsSold: sum(cur.sold.map((l) => l.quantity)),
    prevLotsSold: sum(prev.sold.map((l) => l.quantity)),
    lotsSoldDaily: bucketByDay(cur.sold, win.keys, (l) => l.createdAt, (l) => l.quantity),
    revOrders: cur.rev,
    prevRevOrders: prev.rev,
  };
}

/** Revenue per category from order lines of revenue orders in the period (merchandise only, no freight). */
export async function categoryRevenue(win: RangeWindow) {
  const items = await db.orderItem.findMany({
    where: { order: { createdAt: { gte: win.start }, status: { in: [...REVENUE_STATUSES] } } },
    select: { priceCents: true, quantity: true, lot: { select: { category: { select: { id: true, name: true, slug: true } } } } },
  });
  const m = new Map<string, { id: string; name: string; slug: string; cents: number }>();
  for (const i of items) {
    const c = i.lot.category;
    const e = m.get(c.id) ?? { ...c, cents: 0 };
    e.cents += i.priceCents * i.quantity;
    m.set(c.id, e);
  }
  return [...m.values()].sort((a, b) => b.cents - a.cents);
}
