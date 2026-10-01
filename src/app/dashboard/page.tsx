import Link from "next/link";
import {
  BadgeCheck,
  BarChart3,
  Boxes,
  CircleDollarSign,
  FileText,
  Image as ImageIcon,
  Mail,
  Package,
  PackageX,
  Percent,
  Plus,
  Receipt,
  ShoppingBag,
  Truck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { db } from "@/lib/db";
import { money, timeAgo } from "@/lib/format";
import { ORDER_STATUSES, ORDER_STATUS_LABEL, auditLabel, dayLabel, delta, parseRange, rangeWindow } from "@/lib/commerce";
import { categoryRevenue, salesMetrics } from "@/lib/metrics";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard, Sparkline } from "@/components/admin/StatCard";
import { Card } from "@/components/admin/Card";
import { StatusPill } from "@/components/admin/Badge";
import { EmptyState } from "@/components/admin/EmptyState";
import { RangeSwitcher } from "@/components/admin/ListControls";
import { BarChart, HBarChart, LineChart } from "@/components/admin/charts";

export const metadata = { title: "Overview" };

type Attention = { key: string; icon: LucideIcon; tone: "rust" | "amber" | "ink"; title: string; detail: string; href: string; count: number };

export default async function DashboardOverview({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  const { user, seller } = await requireStaff();
  const firstName = user.name.split(" ")[0];

  // Editors (content-only staff) get a content-focused overview without sales data.
  if (!can(user.role, "orders")) {
    const links = [
      { href: "/dashboard/content", label: "Pages & posts", text: "Write and publish blog posts, guides and pages.", icon: FileText, ok: can(user.role, "content") },
      { href: "/dashboard/media", label: "Media library", text: "Upload and manage images.", icon: ImageIcon, ok: can(user.role, "media") },
      { href: "/dashboard/analytics", label: "Analytics", text: "See how the store is doing.", icon: BarChart3, ok: can(user.role, "analytics") },
    ].filter((l) => l.ok);
    return (
      <>
        <PageHeader title={`Welcome back, ${firstName}`} description="Pick up where you left off." />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="group rounded-2xl bg-white p-5 transition focus-visible:outline-2 focus-visible:outline-signal">
              <l.icon aria-hidden className="h-5 w-5 text-signal" />
              <p className="mt-3 font-display text-lg font-bold group-hover:text-signal-dark">{l.label}</p>
              <p className="mt-1 text-sm text-muted">{l.text}</p>
            </Link>
          ))}
        </div>
      </>
    );
  }

  const range = parseRange((await searchParams).range);
  const win = rangeWindow(range);
  const canInbox = can(user.role, "inbox");
  const canLots = can(user.role, "lots");
  const canActivity = can(user.role, "activity");

  const [m, cats, inStock, views, pending, unshipped, oldestUnshipped, pendingCerts, openInquiries, soldOut, lowStock, recentOrders, recentActivity] = await Promise.all([
    salesMetrics(win),
    categoryRevenue(win),
    db.lot.count({ where: { sellerId: seller.id, status: "ACTIVE" } }),
    db.lot.aggregate({ where: { sellerId: seller.id }, _sum: { views: true } }),
    db.order.count({ where: { status: "PENDING" } }),
    db.order.count({ where: { status: "CONFIRMED" } }),
    db.order.findFirst({ where: { status: "CONFIRMED" }, orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    canInbox ? db.user.count({ where: { certStatus: "PENDING" } }) : 0,
    canInbox ? db.inquiry.count({ where: { handled: false } }) : 0,
    canLots ? db.lot.count({ where: { sellerId: seller.id, status: "SOLD_OUT" } }) : 0,
    canLots ? db.lot.findMany({ where: { sellerId: seller.id, status: "ACTIVE", available: { lte: 2 }, orderItems: { some: {} } }, orderBy: { available: "asc" }, take: 5, select: { id: true, title: true, available: true } }) : [],
    db.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { user: { select: { name: true, businessName: true } } } }),
    canActivity ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }) : [],
  ]);

  const totalViews = views._sum.views ?? 0;
  const statusCounts = ORDER_STATUSES.map((s) => ({ s, n: m.orders.filter((o) => o.status === s).length }));
  const labels = win.keys.map(dayLabel);
  const attention: Attention[] = [
    { key: "pending", icon: Receipt, tone: "amber" as const, title: "Orders to confirm", detail: "Wire / Net 30 orders waiting for payment or confirmation.", href: "/dashboard/orders?status=PENDING", count: pending },
    { key: "unshipped", icon: Truck, tone: "ink" as const, title: "Confirmed orders to ship", detail: oldestUnshipped ? `Oldest placed ${timeAgo(oldestUnshipped.createdAt)}.` : "", href: "/dashboard/orders?status=CONFIRMED&sort=created&dir=asc", count: unshipped },
    { key: "certs", icon: BadgeCheck, tone: "amber" as const, title: "Resale certificates to review", detail: "Approval unlocks Net 30 terms.", href: "/dashboard/inbox?tab=certs", count: pendingCerts },
    { key: "inquiries", icon: Mail, tone: "ink" as const, title: "Unanswered messages", detail: "Contact and program requests.", href: "/dashboard/inbox?tab=messages", count: openInquiries },
    { key: "soldout", icon: PackageX, tone: "ink" as const, title: "Lots sold out", detail: "Restock, or leave them as sold.", href: "/dashboard/lots?status=SOLD_OUT", count: soldOut },
    { key: "low", icon: Boxes, tone: "ink" as const, title: "Selling lots with ≤ 2 left", detail: lowStock.map((l) => `${l.title} (${l.available})`).slice(0, 2).join(" · "), href: "/dashboard/lots?status=ACTIVE&sort=created", count: lowStock.length },
  ].filter((a) => a.count > 0);

  const hint = `vs previous ${range} days`;
  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description={`Here's what's happening at ${seller.name}.`}
        actions={
          <>
            <RangeSwitcher base="/dashboard" current={range} />
            {canLots && <Link href="/dashboard/new" className="btn-primary"><Plus aria-hidden className="h-4 w-4" /> New lot</Link>}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 2xl:grid-cols-4">
        <StatCard label={`Revenue (${range} days)`} value={money(m.revenue)} icon={CircleDollarSign} href={`/dashboard/analytics?range=${range}`} delta={delta(m.revenue, m.prevRevenue)} hint={hint}>
          <Sparkline values={m.revenueDaily} label="Daily revenue" />
        </StatCard>
        <StatCard label="Orders placed" value={m.ordersCount.toLocaleString()} icon={ShoppingBag} href="/dashboard/orders" delta={delta(m.ordersCount, m.prevOrdersCount)} hint={hint}>
          <Sparkline values={m.ordersDaily} label="Daily orders" className="text-ink" />
        </StatCard>
        <StatCard label="Average order value" value={money(m.aov)} icon={Receipt} delta={delta(m.aov, m.prevAov)} hint={`${m.paidCount} paid/confirmed orders`} />
        <StatCard label="Lots in stock" value={inStock.toLocaleString()} icon={Boxes} href="/dashboard/lots?status=ACTIVE" hint={lowStock.length ? `${lowStock.length} selling lot${lowStock.length === 1 ? "" : "s"} low on stock` : "on sale right now"} />
        <StatCard label="Lots sold" value={m.lotsSold.toLocaleString()} icon={Package} delta={delta(m.lotsSold, m.prevLotsSold)} hint={hint}>
          <Sparkline values={m.lotsSoldDaily} label="Daily lots sold" className="text-ink" />
        </StatCard>
        <StatCard label="New customers" value={m.newCustomers.toLocaleString()} icon={UserPlus} href="/dashboard/customers?role=BUYER&sort=joined" delta={delta(m.newCustomers, m.prevNewCustomers)} hint={hint}>
          <Sparkline values={m.newCustomersDaily} label="Daily sign-ups" className="text-moss" />
        </StatCard>
        <StatCard
          label="Conversion (proxy)"
          value={totalViews ? `${((m.ordersCount / totalViews) * 1000).toFixed(1)}` : "—"}
          icon={Percent}
          hint={`orders per 1,000 lot views. Proxy: views are all-time totals (${totalViews.toLocaleString()}), not per period.`}
        />
      </div>

      {attention.length > 0 && (
        <Card title="Needs attention" description="Work waiting on the team, most urgent first." className="mb-6" padded={false}>
          <ul className="grid grid-cols-[minmax(0,1fr)] md:grid-cols-2">
            {attention.map((a) => (
              <li key={a.key} className="min-w-0">
                <Link href={a.href} className="flex items-start gap-3 px-4 py-3 transition hover:bg-sand/40 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal sm:px-5">
                  <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${a.tone === "rust" ? "bg-rust/10 text-rust" : a.tone === "amber" ? "bg-amber-100 text-amber-800" : "bg-sand text-ink"}`}>
                    <a.icon aria-hidden className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold">{a.title}</span>
                    {a.detail && <span className="block truncate text-xs text-muted">{a.detail}</span>}
                  </span>
                  <span className="shrink-0 font-display text-lg font-bold tabular-nums">{a.count}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title="Revenue per day" description={`Confirmed, shipped and delivered orders (incl. freight) · last ${range} days vs the ${range} before`}>
          <LineChart
            hideTitle
            title={`Revenue per day, last ${range} days`}
            labels={labels}
            series={[
              { label: `Last ${range} days`, values: m.revenueDaily },
              { label: `Previous ${range} days`, values: m.prevRevenueDaily, dashed: true, area: false },
            ]}
            format={(c) => money(c)}
          />
        </Card>
        <Card title="Orders by status" description={`Orders placed in the last ${range} days`}>
          <BarChart
            hideTitle
            title={`Orders by status, last ${range} days`}
            items={statusCounts.map(({ s, n }) => ({
              label: ORDER_STATUS_LABEL[s].replace("Awaiting payment", "Awaiting pay"),
              value: n,
              href: `/dashboard/orders?status=${s}`,
              className: s === "CANCELLED" ? "text-rust" : s === "DELIVERED" ? "text-moss" : s === "PENDING" ? "text-signal" : "text-ink",
            }))}
          />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <Card title="Revenue by category" description="Merchandise only (no freight)">
          <HBarChart hideTitle title={`Revenue by category, last ${range} days`} items={cats.slice(0, 8).map((c) => ({ label: c.name, value: c.cents, href: `/dashboard/lots?category=${c.id}` }))} format={(c) => money(c)} />
        </Card>

        <Card title="Recent orders" padded={false} actions={<Link href="/dashboard/orders" className="text-xs font-semibold text-signal-dark hover:underline">All orders</Link>}>
          {recentOrders.length === 0 ? (
            <EmptyState icon={ShoppingBag} compact title="No orders yet" description="Share the store to get the first sale." />
          ) : (
            <ul >
              {recentOrders.map((o) => (
                <li key={o.id}>
                  <Link href={`/dashboard/orders/${o.id}`} className="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-sand/40 sm:px-5">
                    <span className="min-w-0 flex-1">
                      <span className="block font-mono text-xs font-semibold">{o.number}</span>
                      <span className="block truncate text-xs text-muted">{o.user.businessName ?? o.user.name} · {timeAgo(o.createdAt)}</span>
                    </span>
                    <StatusPill status={o.status} />
                    <span className="w-16 shrink-0 text-right font-semibold tabular-nums">{money(o.totalCents)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {canActivity ? (
          <Card title="Recent activity" padded={false} actions={<Link href="/dashboard/activity" className="text-xs font-semibold text-signal-dark hover:underline">Activity log</Link>}>
            {recentActivity.length === 0 ? (
              <EmptyState compact title="No activity yet" />
            ) : (
              <ul >
                {recentActivity.map((a) => (
                  <li key={a.id} className="px-4 py-2.5 text-sm sm:px-5">
                    <p className="truncate"><span className="font-medium">{auditLabel(a.action)}</span>{a.target && <span className="text-muted"> · {a.target}</span>}</p>
                    <p className="truncate text-xs text-muted">{a.userEmail || "System"} · {timeAgo(a.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ) : (
          <Card title="Low stock" padded={false} actions={<Link href="/dashboard/lots?status=ACTIVE" className="text-xs font-semibold text-signal-dark hover:underline">Lots</Link>}>
            {lowStock.length === 0 ? (
              <EmptyState icon={Boxes} compact title="Stock looks healthy" description="No selling lot is down to its last two." />
            ) : (
              <ul >
                {lowStock.map((l) => (
                  <li key={l.id}>
                    <Link href={`/dashboard/lots/${l.id}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-sand/40 sm:px-5">
                      <span className="min-w-0 truncate">{l.title}</span>
                      <span className="shrink-0 text-xs text-muted">{l.available} left</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        )}
      </div>
    </>
  );
}
