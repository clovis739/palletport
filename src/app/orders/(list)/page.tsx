import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { StatusPill } from "../StatusPill";
import { privateMetadataT } from "@/lib/seo";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { getI18n } from "@/i18n/server";
import { LOCALE_TAG } from "@/i18n/config";

const PER_PAGE = 10;

export const generateMetadata = () => privateMetadataT("Your orders");

export default async function OrdersPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const user = await requireUser("/orders");
  const { t, lh, locale } = await getI18n();
  const total = await db.order.count({ where: { userId: user.id } });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const orders = await db.order.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  return (
    <div className="container-pp py-10">
      <h1 className="mb-6 font-display text-3xl font-bold">{t("Your orders")}</h1>
      {orders.length === 0 ? (
        <div className="card p-8 sm:p-12 text-center">
          <p className="font-display text-lg font-semibold">{t("No orders yet")}</p>
          <Link href={lh("/lots")} className="btn-primary mt-4">{t("Browse lots")}</Link>
        </div>
      ) : (
        <div className="card">
          {orders.map((o) => (
            <Link key={o.id} href={lh(`/orders/${o.id}`)} className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4 hover:bg-sand/40 sm:p-5">
              <div className="min-w-0 flex-1">
                <p className="break-all font-mono text-sm font-semibold">{o.number}</p>
                <p className="text-xs text-muted">{o.createdAt.toLocaleDateString(LOCALE_TAG[locale])} · {t(o.items.length > 1 ? "{n} lots" : "{n} lot", { n: o.items.length })}</p>
              </div>
              <StatusPill status={o.status} />
              <p className="shrink-0 text-right font-display font-bold sm:w-28">{money(o.totalCents)}</p>
            </Link>
          ))}
        </div>
      )}
      <Pager base="/orders" page={page} perPage={PER_PAGE} total={total} noun="orders" className="mt-6" />
    </div>
  );
}
