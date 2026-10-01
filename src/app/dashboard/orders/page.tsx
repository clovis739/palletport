import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download, ShoppingBag } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import {
  DELIVERY_LABEL,
  ORDER_SORTS,
  ORDER_STATUSES,
  ORDER_STATUS_LABEL,
  PAYMENT_LABEL,
  isPaid,
  orderWhere,
  parseOrderFilters,
  parsePage,
  parseSort,
  qs,
} from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Toolbar } from "@/components/admin/Toolbar";
import { Tabs } from "@/components/admin/Tabs";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { FilterButtons, Pagination, SortHeader } from "@/components/admin/ListControls";
import { Select } from "@/components/ui/Select";

export const metadata = { title: "Orders" };

const PER_PAGE = 25;
const BASE = "/dashboard/orders";
type SP = Record<string, string | undefined>;

export default async function OrdersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff("orders", BASE);
  const f = parseOrderFilters(sp);
  const { sort, dir } = parseSort(sp.sort, sp.dir, Object.keys(ORDER_SORTS) as (keyof typeof ORDER_SORTS)[], "created");
  const page = parsePage(sp.page);
  const where = orderWhere(f);

  const [total, orders, counts] = await Promise.all([
    db.order.count({ where }),
    db.order.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, businessName: true } }, items: { select: { title: true, quantity: true } } },
      orderBy: [{ [ORDER_SORTS[sort]]: dir } as Prisma.OrderOrderByWithRelationInput, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.order.groupBy({ by: ["status"], where: orderWhere({ ...f, status: "" }), _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;
  const allCount = counts.reduce((a, c) => a + c._count._all, 0);

  // Params that survive sorting / paging (everything but sort, dir, page).
  const filterParams = { q: f.q, status: f.status, pay: f.pay, delivery: f.delivery, from: f.from, to: f.to };
  const sortParams = { ...filterParams, sort, dir };
  const tabHref = (status: string) => `${BASE}${qs({ ...filterParams, status, sort: sp.sort, dir: sp.dir })}`;
  const filtersActive = !!(f.q || f.pay || f.delivery || f.from || f.to);
  const sh = (field: string, label: string) => (
    <SortHeader base={BASE} params={filterParams} field={field} sort={sort} dir={dir}>{label}</SortHeader>
  );

  return (
    <>
      <PageHeader
        title="Orders"
        description="Confirm, collect payment, ship and track everything bought on the site."
        actions={
          <a href={`${BASE}/export${qs(filterParams)}`} className="btn-ghost" download>
            <Download aria-hidden className="h-4 w-4" /> Export CSV
          </a>
        }
      />

      <Tabs
        className="mb-4"
        label="Order status"
        current={f.status || "ALL"}
        items={[
          { value: "ALL", label: "All", href: tabHref(""), count: allCount },
          { value: "OPEN", label: "Needs action", href: tabHref("OPEN"), count: count("PENDING") + count("CONFIRMED") },
          ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS_LABEL[s], href: tabHref(s), count: count(s) })),
        ]}
      />

      <Toolbar q={f.q} placeholder="Order #, buyer, email or lot…" keep={{ status: f.status, sort: sp.sort, dir: sp.dir }} end={`${total.toLocaleString()} order${total === 1 ? "" : "s"}`}>
        <div className="w-40">
          <Select name="pay" form="toolbar-form" defaultValue={f.pay} aria-label="Payment method" className="input py-2">
            <option value="">Any payment</option>
            {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="w-40">
          <Select name="delivery" form="toolbar-form" defaultValue={f.delivery} aria-label="Delivery method" className="input py-2">
            <option value="">Any delivery</option>
            {Object.entries(DELIVERY_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          From <input type="date" name="from" form="toolbar-form" defaultValue={f.from} className="input w-auto py-1.5" />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted">
          To <input type="date" name="to" form="toolbar-form" defaultValue={f.to} className="input w-auto py-1.5" />
        </label>
        <FilterButtons clearHref={`${BASE}${qs({ status: f.status })}`} active={filtersActive} />
      </Toolbar>

      <Card padded={false}>
        <DataTable
          rows={orders}
          rowKey={(o) => o.id}
          caption="Orders"
          minWidth={900}
          columns={[
            {
              key: "number",
              header: sh("number", "Order"),
              cell: (o) => (
                <div className="min-w-0">
                  <Link href={`${BASE}/${o.id}`} className="font-mono font-semibold hover:text-signal-dark hover:underline">{o.number}</Link>
                </div>
              ),
            },
            { key: "created", header: sh("created", "Date"), cell: (o) => <span className="whitespace-nowrap text-xs">{o.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span> },
            {
              key: "buyer",
              header: "Buyer",
              cell: (o) => (
                <div className="min-w-0 max-w-[14rem] md:text-left">
                  <Link href={`/dashboard/customers/${o.user.id}`} className="block truncate font-medium hover:underline">{o.user.businessName ?? o.user.name}</Link>
                  <span className="block truncate text-xs text-muted">{o.user.email}</span>
                </div>
              ),
            },
            {
              key: "items",
              header: "Lots",
              hideOnMobile: true,
              cell: (o) => (
                <span className="block max-w-[16rem] truncate text-xs" title={o.items.map((i) => i.title).join(", ")}>
                  {o.items[0] ? `${o.items[0].quantity}× ${o.items[0].title}` : "—"}
                  {o.items.length > 1 && <span className="text-muted"> +{o.items.length - 1} more</span>}
                </span>
              ),
            },
            {
              key: "payment",
              header: "Payment",
              cell: (o) => (
                <span className="inline-flex flex-wrap items-center gap-1 text-xs">
                  {PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}
                  {isPaid(o) ? <Badge tone="moss">Paid</Badge> : o.status !== "CANCELLED" && o.amountPaidCents > 0 ? <Badge tone="signal">Deposit</Badge> : o.status !== "CANCELLED" ? <Badge tone="amber">Unpaid</Badge> : null}
                  {o.visitAt && <Badge tone="ink">Visit {o.visitAt.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/New_York" })}</Badge>}
                </span>
              ),
            },
            { key: "delivery", header: "Delivery", hideOnMobile: true, cell: (o) => <span className="text-xs">{o.deliveryMethod === "PICKUP" ? "Pickup" : "Freight"}</span> },
            {
              key: "status",
              header: sh("status", "Status"),
              cell: (o) => (
                <span className="inline-flex flex-wrap items-center gap-1">
                  <StatusPill status={o.status} />
                </span>
              ),
            },
            { key: "total", header: sh("total", "Total"), align: "right", cell: (o) => <span className="font-semibold tabular-nums">{money(o.totalCents)}</span> },
          ]}
          empty={
            <EmptyState
              icon={ShoppingBag}
              compact
              title={filtersActive || f.status ? "No orders match" : "No orders yet"}
              description={filtersActive || f.status ? "Try a different status or clear the filters." : "Orders appear here as soon as buyers check out."}
              action={filtersActive || f.status ? <Link href={BASE} className="btn-ghost">Clear filters</Link> : undefined}
            />
          }
        />
        <Pagination base={BASE} params={sortParams} page={page} perPage={PER_PAGE} total={total} />
      </Card>
    </>
  );
}
