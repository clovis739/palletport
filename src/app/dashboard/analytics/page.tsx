import Link from "next/link";
import { CircleDollarSign, Package, Percent, Receipt, ShoppingBag, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { can } from "@/lib/permissions";
import { LOT_SIZES, conditionLabel, money } from "@/lib/format";
import { REVENUE_STATUSES, chunk, chunkLabels, delta, parseRange, rangeWindow } from "@/lib/commerce";
import { salesMetrics } from "@/lib/metrics";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { StatCard } from "@/components/admin/StatCard";
import { RangeSwitcher } from "@/components/admin/ListControls";
import { HBarChart, LineChart } from "@/components/admin/charts";

export const metadata = { title: "Analytics" };

function Table({ caption, head, rows, empty = "No data in this period." }: { caption: string; head: { label: string; right?: boolean }[]; rows: React.ReactNode[][]; empty?: string }) {
  if (!rows.length) return <p className="p-5 text-sm text-muted">{empty}</p>;
  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <table className="w-full min-w-[520px] text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-sand/40 text-xs uppercase tracking-wider text-muted">
          <tr>{head.map((h) => <th key={h.label} scope="col" className={`px-4 py-2.5 font-semibold ${h.right ? "text-right" : "text-left"}`}>{h.label}</th>)}</tr>
        </thead>
        <tbody >
          {rows.map((r, i) => (
            <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="max-w-[16rem] px-4 py-2 text-left font-normal">{c}</th> : <td key={j} className={`px-4 py-2 tabular-nums ${head[j]?.right ? "text-right" : ""}`}>{c}</td>))}</tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { user, seller } = await requireStaff("analytics", "/dashboard/analytics");
  const range = parseRange((await searchParams).range);
  const win = rangeWindow(range);
  const bucket = range > 30 ? 7 : 1;
  const linkLots = can(user.role, "lots");

  const [m, items, lots, categories, firstOrders] = await Promise.all([
    salesMetrics(win),
    db.orderItem.findMany({
      where: { order: { createdAt: { gte: win.start }, status: { in: [...REVENUE_STATUSES] } } },
      select: { priceCents: true, quantity: true, lot: { select: { id: true, title: true, msrpCents: true, condition: true, categoryId: true, lotSize: true } } },
    }),
    db.lot.findMany({ where: { sellerId: seller.id }, select: { id: true, title: true, views: true, status: true, categoryId: true, _count: { select: { favorites: true } } } }),
    db.category.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    db.order.groupBy({ by: ["userId"], where: { status: { not: "CANCELLED" } }, _min: { createdAt: true } }),
  ]);
  const catName = new Map(categories.map((c) => [c.id, c.name]));

  // ---- Trends ----
  const labels = chunkLabels(win.keys, bucket);
  const revenueB = chunk(m.revenueDaily, bucket);
  const ordersB = chunk(m.ordersDaily, bucket);
  const revCountDaily = win.keys.map((k) => m.revOrders.filter((o) => o.createdAt.toISOString().slice(0, 10) === k).length);
  const revCountB = chunk(revCountDaily, bucket);
  const aovB = revenueB.map((r, i) => (revCountB[i] ? Math.round(r / revCountB[i]) : 0));

  // ---- New vs returning buyers (by first non-cancelled order ever) ----
  const firstAt = new Map(firstOrders.map((f) => [f.userId, f._min.createdAt]));
  const buyers = new Map<string, Date>(); // buyer → first order in this period
  for (const o of m.orders) if (o.status !== "CANCELLED" && (!buyers.has(o.userId) || o.createdAt < buyers.get(o.userId)!)) buyers.set(o.userId, o.createdAt);
  let newBuyers = 0;
  let returning = 0;
  const newDaily = win.keys.map(() => 0);
  const retDaily = win.keys.map(() => 0);
  for (const [uid, at] of buyers) {
    const first = firstAt.get(uid);
    const isNew = !!first && first >= win.start;
    const i = win.keys.indexOf(at.toISOString().slice(0, 10));
    if (isNew) { newBuyers++; if (i >= 0) newDaily[i]++; } else { returning++; if (i >= 0) retDaily[i]++; }
  }

  // ---- Sales mix (paid/confirmed order lines in the period) ----
  type Line = (typeof items)[number];
  const pctOfRetail = (ls: Line[]) => {
    const retail = ls.reduce((a, i) => a + i.lot.msrpCents * i.quantity, 0);
    return retail ? Math.round((ls.reduce((a, i) => a + i.priceCents * i.quantity, 0) / retail) * 100) : null;
  };
  const groupLines = (key: (i: Line) => string) => {
    const g = new Map<string, Line[]>();
    for (const i of items) g.set(key(i), [...(g.get(key(i)) ?? []), i]);
    return [...g.entries()];
  };
  const soldPct = pctOfRetail(items);
  const byCondition = groupLines((i) => i.lot.condition)
    .map(([k, ls]) => ({ name: conditionLabel(k), n: ls.reduce((a, i) => a + i.quantity, 0), pct: pctOfRetail(ls) ?? 0 }))
    .sort((a, b) => b.pct - a.pct);
  const bySize = groupLines((i) => i.lot.lotSize)
    .map(([k, ls]) => ({ name: LOT_SIZES[k]?.plural ?? k, units: ls.reduce((a, i) => a + i.quantity, 0), cents: ls.reduce((a, i) => a + i.priceCents * i.quantity, 0) }))
    .sort((a, b) => b.cents - a.cents);

  // ---- Lots ----
  const lotRevenue = new Map<string, { title: string; cents: number; units: number }>();
  for (const i of items) {
    const e = lotRevenue.get(i.lot.id) ?? { title: i.lot.title, cents: 0, units: 0 };
    e.cents += i.priceCents * i.quantity;
    e.units += i.quantity;
    lotRevenue.set(i.lot.id, e);
  }
  const topViews = [...lots].sort((a, b) => b.views - a.views).slice(0, 8);
  const topSaves = lots.filter((l) => l._count.favorites > 0).sort((a, b) => b._count.favorites - a._count.favorites).slice(0, 8);
  const topRevenue = [...lotRevenue.entries()].sort((a, b) => b[1].cents - a[1].cents).slice(0, 8);

  // ---- Category performance ----
  const catRows = categories
    .map((c) => {
      const cl = lots.filter((l) => l.categoryId === c.id);
      const ci = items.filter((i) => i.lot.categoryId === c.id);
      const revenue = ci.reduce((a, i) => a + i.priceCents * i.quantity, 0);
      const retail = ci.reduce((a, i) => a + i.lot.msrpCents * i.quantity, 0);
      return {
        id: c.id,
        name: c.name,
        active: cl.filter((l) => l.status === "ACTIVE").length,
        views: cl.reduce((a, l) => a + l.views, 0),
        saves: cl.reduce((a, l) => a + l._count.favorites, 0),
        units: ci.reduce((a, i) => a + i.quantity, 0),
        revenue,
        pctRetail: retail ? Math.round((revenue / retail) * 100) : null,
      };
    })
    .filter((r) => r.active || r.views || r.units)
    .sort((a, b) => b.revenue - a.revenue || b.views - a.views);

  // ---- Promo codes ----
  const promoMap = new Map<string, { orders: number; discount: number; revenue: number }>();
  for (const o of m.revOrders) {
    if (!o.promoCode) continue;
    const e = promoMap.get(o.promoCode) ?? { orders: 0, discount: 0, revenue: 0 };
    e.orders++;
    e.discount += o.discountCents;
    e.revenue += o.totalCents;
    promoMap.set(o.promoCode, e);
  }
  const promoRows = [...promoMap.entries()].sort((a, b) => b[1].revenue - a[1].revenue);
  const lotLink = (id: string, title: string) => (linkLots ? <Link href={`/dashboard/lots/${id}`} className="hover:underline">{title}</Link> : title);
  const hint = `vs previous ${range} days`;

  return (
    <>
      <PageHeader
        title="Analytics"
        description={`Sales, buyers and lots over the last ${range} days. Revenue counts confirmed, shipped and delivered orders.`}
        actions={<RangeSwitcher base="/dashboard/analytics" current={range} />}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-6">
        <StatCard label="Revenue" value={money(m.revenue)} icon={CircleDollarSign} delta={delta(m.revenue, m.prevRevenue)} hint={hint} />
        <StatCard label="Orders placed" value={m.ordersCount.toLocaleString()} icon={ShoppingBag} delta={delta(m.ordersCount, m.prevOrdersCount)} hint={hint} />
        <StatCard label="Average order" value={money(m.aov)} icon={Receipt} delta={delta(m.aov, m.prevAov)} hint={hint} />
        <StatCard label="Buyers" value={buyers.size} icon={Users} hint={`${newBuyers} new · ${returning} returning`} />
        <StatCard label="Lots sold" value={m.lotsSold.toLocaleString()} icon={Package} delta={delta(m.lotsSold, m.prevLotsSold)} hint={hint} />
        <StatCard label="Sold at % of retail" value={soldPct !== null ? `${soldPct}%` : "—"} icon={Percent} hint="price ÷ manifest retail, paid orders" />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Revenue" description={bucket > 1 ? "Per week" : "Per day"}>
          <LineChart hideTitle title={`Revenue ${bucket > 1 ? "per week" : "per day"}, last ${range} days`} labels={labels} series={[{ label: "Revenue", values: revenueB }]} format={(c) => money(c)} />
        </Card>
        <Card title="Orders placed" description={`${bucket > 1 ? "Per week" : "Per day"} · all statuses except cancelled`}>
          <LineChart hideTitle title={`Orders ${bucket > 1 ? "per week" : "per day"}, last ${range} days`} labels={labels} series={[{ label: "Orders", values: ordersB, className: "text-ink" }]} />
        </Card>
        <Card title="Average order value" description={`Revenue ÷ paid/confirmed orders, ${bucket > 1 ? "per week" : "per day"} (0 = no orders)`}>
          <LineChart hideTitle title="Average order value trend" labels={labels} series={[{ label: "AOV", values: aovB, className: "text-moss" }]} format={(c) => money(c)} />
        </Card>
        <Card title="New vs returning buyers" description="New = first-ever order placed in this period">
          <LineChart
            hideTitle
            title="New vs returning buyers"
            labels={labels}
            series={[
              { label: `New (${newBuyers})`, values: chunk(newDaily, bucket), className: "text-signal" },
              { label: `Returning (${returning})`, values: chunk(retDaily, bucket), className: "text-ink", area: false },
            ]}
          />
        </Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold">Sales mix</h2>
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card title="Price as % of retail, by condition" description={`Sold price ÷ manifest retail value (MSRP), paid orders in the last ${range} days`}>
          <HBarChart hideTitle title="Sold price as percent of retail by condition" items={byCondition.map((r) => ({ label: r.name, value: r.pct, note: `${r.n} sold` }))} format={(n) => `${n}%`} max={Math.max(40, ...byCondition.map((r) => r.pct))} empty="No sales in this period." />
        </Card>
        <Card title="Revenue by lot size" description={`Merchandise only (no freight), last ${range} days`}>
          <HBarChart hideTitle title="Revenue by lot size" items={bySize.map((r) => ({ label: r.name, value: r.cents, note: `${r.units} sold` }))} format={(c) => money(c)} empty="No sales in this period." />
        </Card>
      </div>

      <h2 className="mb-3 font-display text-lg font-bold">Top lots</h2>
      <div className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="By revenue" description={`Last ${range} days`} padded={false}>
          <Table caption="Top lots by revenue" head={[{ label: "Lot" }, { label: "Units", right: true }, { label: "Revenue", right: true }]} rows={topRevenue.map(([id, r]) => [lotLink(id, r.title), r.units, money(r.cents)])} />
        </Card>
        <Card title="By views" description="All-time views (views aren't tracked per day)" padded={false}>
          <Table caption="Top lots by views" head={[{ label: "Lot" }, { label: "Views", right: true }, { label: "Saves", right: true }]} rows={topViews.map((l) => [lotLink(l.id, l.title), l.views.toLocaleString(), l._count.favorites])} empty="No lots yet." />
        </Card>
        <Card title="By saves" description="Lots buyers saved, all time" padded={false}>
          <Table caption="Top lots by saves" head={[{ label: "Lot" }, { label: "Saves", right: true }, { label: "Status", right: true }]} rows={topSaves.map((l) => [lotLink(l.id, l.title), l._count.favorites, l.status === "ACTIVE" ? "In stock" : l.status === "SOLD_OUT" ? "Sold out" : l.status.toLowerCase()])} empty="No saved lots yet." />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Category performance" description={`Revenue, units and % of retail for the last ${range} days. Views and saves are all-time (proxy for interest).`} padded={false}>
          <Table
            caption="Category performance"
            head={[{ label: "Category" }, { label: "Active lots", right: true }, { label: "Views*", right: true }, { label: "Saves*", right: true }, { label: "Units sold", right: true }, { label: "Revenue", right: true }, { label: "% of retail", right: true }]}
            rows={catRows.map((r) => [linkLots ? <Link key={r.id} href={`/dashboard/lots?category=${r.id}`} className="hover:underline">{r.name}</Link> : r.name, r.active, r.views.toLocaleString(), r.saves, r.units, money(r.revenue), r.pctRetail !== null ? `${r.pctRetail}%` : "—"])}
          />
          <p className="px-4 py-2 text-xs text-muted">* all-time totals.</p>
        </Card>
        <Card title="Promo code usage" description={`Paid/confirmed orders with a code, last ${range} days`} padded={false}>
          <Table
            caption="Promo code usage"
            head={[{ label: "Code" }, { label: "Orders", right: true }, { label: "Discount", right: true }, { label: "Revenue", right: true }]}
            rows={promoRows.map(([code, r]) => [<span key={code} className="font-mono font-semibold">{code}</span>, r.orders, `−${money(r.discount)}`, money(r.revenue)])}
            empty="No promo codes used in this period."
          />
        </Card>
      </div>
      <p className="mt-6 text-xs text-muted">All figures come from the store database — no external analytics. Days are UTC. Revenue includes freight and is net of discounts; category and lot revenue are merchandise only.</p>
    </>
  );
}
