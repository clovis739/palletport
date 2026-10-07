import Link from "next/link";
import { db } from "@/lib/db";
import { LotCard } from "@/components/LotCard";
import { pageMetadata } from "@/lib/seo";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { getI18n } from "@/i18n/server";

const PER_PAGE = 24;

export const generateMetadata = () => pageMetadata({
  title: "New liquidation pallet arrivals (last 14 days)",
  description:
    "Every liquidation lot listed in the last 14 days, grouped by day: fixed-price pallets, truckloads and case packs, each manifested and graded by our warehouse team.",
  path: "/new",
});
export const dynamic = "force-dynamic";

export default async function NewArrivals({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { t, lh } = await getI18n();
  const since = new Date(Date.now() - 14 * 86400000);
  const where = { status: "ACTIVE" as const, createdAt: { gte: since } };
  const total = await db.lot.count({ where });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const lots = await db.lot.findMany({
    where,
    include: { category: true, seller: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });

  const groups = new Map<string, typeof lots>();
  for (const l of lots) {
    const days = Math.floor((Date.now() - l.createdAt.getTime()) / 86400000);
    const key = days === 0 ? "Today" : days === 1 ? "Yesterday" : days < 7 ? "This week" : "Last week";
    groups.set(key, [...(groups.get(key) ?? []), l]);
  }

  return (
    <div className="container-pp py-10">
      <h1 className="font-display text-3xl font-bold">{t("New arrivals")}</h1>
      <p className="mb-8 text-muted">{t("{n} lots listed in the last 14 days. Fresh lots sell fastest — check back daily.", { n: total })}</p>

      {[...groups.entries()].map(([label, items]) => (
        <section key={label} className="mb-12">
          <h2 className="mb-4 font-display text-xl font-bold">{t(label)} <span className="text-sm font-normal text-muted">· {t(items.length === 1 ? "{n} lot" : "{n} lots", { n: items.length })}</span></h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">{items.map((l) => <LotCard key={l.id} lot={l} />)}</div>
        </section>
      ))}
      <Pager base="/new" page={page} perPage={PER_PAGE} total={total} className="-mt-2" />
      {lots.length === 0 && <p className="card p-6 sm:p-10 text-center text-muted">{t("Nothing new in the last two weeks.")} <Link href={lh("/lots")} className="font-semibold text-signal-dark">{t("Browse all lots")}</Link></p>}
    </div>
  );
}
