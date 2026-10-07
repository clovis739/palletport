import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { ORDER_LIMIT_MESSAGE } from "@/lib/order-placement";

export async function ExistingOrderNotice({ order }: { order: { id: string; number: string } }) {
  const { t, lh } = await getI18n();
  return (
    <div className="container-pp max-w-2xl py-10">
      <h1 className="font-display text-2xl font-bold">{t("Order already placed")}</h1>
      <p className="mt-4 text-sm text-muted" role="status">{t(ORDER_LIMIT_MESSAGE)}</p>
      <Link href={lh(`/orders/${order.id}`)} className="btn-primary mt-6">{t("View order {number}", { number: order.number })}</Link>
    </div>
  );
}
