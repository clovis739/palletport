import "server-only";
import { db } from "./db";

/** Start times (ISO) already taken by other, non-cancelled warehouse visits from `from` on. */
export async function bookedVisitTimes(from = new Date()) {
  const rows = await db.order.findMany({
    where: { visitAt: { gte: from }, status: { not: "CANCELLED" } },
    select: { visitAt: true },
  });
  return rows.map((r) => r.visitAt!.toISOString());
}
