import "server-only";
import type { db } from "@/lib/db";

type OrderReader = Pick<typeof db, "order">;
type OrderTransaction = Pick<typeof db, "order" | "$queryRaw">;

export const ORDER_LIMIT_MESSAGE = "You already have an order. You can place another only after it is cancelled or deleted.";

/** Every existing order except CANCELLED blocks another, including delivered orders. */
export function findBlockingOrder(client: OrderReader, userId: string) {
  return client.order.findFirst({
    where: { userId, status: { not: "CANCELLED" } },
    select: { id: true, number: true, status: true },
    orderBy: { createdAt: "desc" },
  });
}

/** Must run first inside a ReadCommitted order-creation transaction. */
export async function guardOrderPlacement(tx: OrderTransaction, userId: string) {
  // Lock the stable account row even when it has no orders. Both checkout paths
  // share this lock, so concurrent submissions cannot both see an empty history.
  const users = await tx.$queryRaw<{ id: string }[]>`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;
  if (!users.length) throw new Error("Your account is no longer available. Please sign in again.");
  if (await findBlockingOrder(tx, userId)) throw new Error(ORDER_LIMIT_MESSAGE);
}
