import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Download, Users } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { ROLE_INFO, asRole } from "@/lib/permissions";
import { REVENUE_STATUSES, parsePage, parseSort, qs } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Toolbar } from "@/components/admin/Toolbar";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { FilterButtons, Pagination, SortHeader } from "@/components/admin/ListControls";
import { StatCard } from "@/components/admin/StatCard";
import { Select } from "@/components/ui/Select";
import { CI } from "@/lib/dbText";

export const metadata = { title: "Customers" };

const BASE = "/dashboard/customers";
const PER_PAGE = 30;
const SORTS = ["joined", "name", "spend", "orders", "last"] as const;
const ROLE_FILTERS = ["BUYER", "STAFF", "ADMIN", "MANAGER", "EDITOR"];
const CERTS = ["NONE", "PENDING", "APPROVED", "REJECTED"];
type SP = Record<string, string | undefined>;

export default async function CustomersPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff("customers", BASE);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const role = ROLE_FILTERS.includes(sp.role ?? "") ? sp.role! : "";
  const cert = CERTS.includes(sp.cert ?? "") ? sp.cert! : "";
  const pro = sp.pro === "1" ? "1" : "";
  const { sort, dir } = parseSort(sp.sort, sp.dir, SORTS, "joined");
  const page = parsePage(sp.page);

  const where: Prisma.UserWhereInput = {
    ...(role === "BUYER" ? { role: { notIn: ["ADMIN", "MANAGER", "EDITOR"] } } : role === "STAFF" ? { role: { in: ["ADMIN", "MANAGER", "EDITOR"] } } : role ? { role } : {}),
    ...(cert ? { certStatus: cert } : {}),
    ...(pro ? { isPro: true } : {}),
    ...(q ? { OR: [{ name: { contains: q, ...CI } }, { email: { contains: q, ...CI } }, { businessName: { contains: q, ...CI } }, { phone: { contains: q, ...CI } }, { shipCity: { contains: q, ...CI } }] } : {}),
  };

  const since30 = new Date(Date.now() - 30 * 86400000);
  // Small-store approach: load matching users + order aggregates, then sort/paginate in memory (keeps spend sortable).
  const [users, spendRows, orderRows, totals] = await Promise.all([
    db.user.findMany({
      where,
      select: { id: true, name: true, email: true, businessName: true, businessType: true, role: true, certStatus: true, isPro: true, createdAt: true, shipCity: true, shipRegion: true },
      take: 5000,
    }),
    db.order.groupBy({ by: ["userId"], where: { status: { in: [...REVENUE_STATUSES] } }, _sum: { totalCents: true } }),
    db.order.groupBy({ by: ["userId"], where: { status: { not: "CANCELLED" } }, _count: { _all: true }, _max: { createdAt: true } }),
    Promise.all([
      db.user.count({ where: { role: { notIn: ["ADMIN", "MANAGER", "EDITOR"] } } }),
      db.user.count({ where: { createdAt: { gte: since30 }, role: { notIn: ["ADMIN", "MANAGER", "EDITOR"] } } }),
      db.user.count({ where: { certStatus: "PENDING" } }),
      db.user.count({ where: { isPro: true } }),
    ]),
  ]);
  const [buyerCount, new30, pendingCerts, proCount] = totals;
  const spend = new Map(spendRows.map((r) => [r.userId, r._sum.totalCents ?? 0]));
  const ord = new Map(orderRows.map((r) => [r.userId, { n: r._count._all, last: r._max.createdAt }]));
  const rows = users.map((u) => ({ ...u, spend: spend.get(u.id) ?? 0, orders: ord.get(u.id)?.n ?? 0, last: ord.get(u.id)?.last ?? null }));
  const sign = dir === "asc" ? 1 : -1;
  rows.sort((a, b) => {
    const v =
      sort === "name" ? (a.businessName ?? a.name).localeCompare(b.businessName ?? b.name)
      : sort === "spend" ? a.spend - b.spend
      : sort === "orders" ? a.orders - b.orders
      : sort === "last" ? (a.last?.getTime() ?? 0) - (b.last?.getTime() ?? 0)
      : a.createdAt.getTime() - b.createdAt.getTime();
    return v * sign || b.createdAt.getTime() - a.createdAt.getTime();
  });
  const total = rows.length;
  const pageRows = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const filterParams = { q, role, cert, pro };
  const sortParams = { ...filterParams, sort, dir };
  const filtersActive = !!(q || role || cert || pro);
  const sh = (field: string, label: string, d: "asc" | "desc" = "desc") => <SortHeader base={BASE} params={filterParams} field={field} sort={sort} dir={dir} defaultDir={d}>{label}</SortHeader>;
  const repeat = orderRows.filter((r) => r._count._all > 1).length;

  return (
    <>
      <PageHeader title="Customers" description="Buyer accounts, their orders and verification status." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Buyer accounts" value={buyerCount.toLocaleString()} icon={Users} hint={`${repeat} repeat buyers`} />
        <StatCard label="New (30 days)" value={new30.toLocaleString()} href={`${BASE}${qs({ role: "BUYER", sort: "joined" })}`} />
        <StatCard label="Certificates to review" value={pendingCerts} href={`${BASE}?cert=PENDING`} />
        <StatCard label="Pro members" value={proCount} href={`${BASE}?pro=1`} />
      </div>

      <Toolbar q={q} placeholder="Name, email, business, phone or city…" keep={{ sort: sp.sort, dir: sp.dir }} end={`${total.toLocaleString()} account${total === 1 ? "" : "s"}`}>
        <div className="w-40">
          <Select name="role" form="toolbar-form" defaultValue={role} aria-label="Role" className="input py-2">
            <option value="">Any role</option>
            <option value="BUYER">Buyers</option>
            <option value="STAFF">All staff</option>
            <option value="ADMIN">Owners</option>
            <option value="MANAGER">Managers</option>
            <option value="EDITOR">Editors</option>
          </Select>
        </div>
        <div className="w-44">
          <Select name="cert" form="toolbar-form" defaultValue={cert} aria-label="Certificate status" className="input py-2">
            <option value="">Any certificate</option>
            <option value="PENDING">Pending review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="NONE">None submitted</option>
          </Select>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-semibold">
          <input type="checkbox" name="pro" value="1" form="toolbar-form" defaultChecked={!!pro} className="h-4 w-4 accent-signal" /> Pro only
        </label>
        <FilterButtons clearHref={BASE} active={filtersActive} />
      </Toolbar>

      <Card padded={false}>
        <DataTable
          rows={pageRows}
          rowKey={(u) => u.id}
          caption="Customers"
          minWidth={900}
          columns={[
            {
              key: "name",
              header: sh("name", "Customer", "asc"),
              cell: (u) => (
                <div className="min-w-0 max-w-[18rem] text-left">
                  <Link href={`${BASE}/${u.id}`} className="block truncate font-medium hover:text-signal-dark hover:underline">{u.businessName ?? u.name}</Link>
                  <span className="block truncate text-xs text-muted">{u.businessName ? `${u.name} · ` : ""}{u.email}</span>
                </div>
              ),
            },
            {
              key: "tags",
              header: "Status",
              cell: (u) => (
                <span className="inline-flex flex-wrap gap-1">
                  {asRole(u.role) !== "BUYER" && <Badge tone={ROLE_INFO[asRole(u.role)].tone}>{ROLE_INFO[asRole(u.role)].label}</Badge>}
                  {u.certStatus !== "NONE" && <StatusPill status={u.certStatus} label={u.certStatus === "PENDING" ? "Cert pending" : u.certStatus === "APPROVED" ? "Verified" : "Cert rejected"} />}
                  {u.isPro && <Badge tone="signal">Pro</Badge>}
                </span>
              ),
            },
            { key: "type", header: "Business type", hideOnMobile: true, cell: (u) => <span className="text-xs">{u.businessType ?? "—"}</span> },
            { key: "loc", header: "Location", hideOnMobile: true, cell: (u) => <span className="text-xs">{[u.shipCity, u.shipRegion].filter(Boolean).join(", ") || "—"}</span> },
            { key: "orders", header: sh("orders", "Orders"), align: "right", cell: (u) => <span className="tabular-nums">{u.orders}</span> },
            { key: "spend", header: sh("spend", "Spend"), align: "right", cell: (u) => <span className="font-semibold tabular-nums">{money(u.spend)}</span> },
            { key: "last", header: sh("last", "Last order"), hideOnMobile: true, cell: (u) => <span className="whitespace-nowrap text-xs">{u.last ? u.last.toLocaleDateString() : "—"}</span> },
            { key: "joined", header: sh("joined", "Joined"), cell: (u) => <span className="whitespace-nowrap text-xs">{u.createdAt.toLocaleDateString()}</span> },
          ]}
          empty={<EmptyState icon={Users} compact title={filtersActive ? "No customers match" : "No customers yet"} description={filtersActive ? "Try different filters." : "Accounts appear here when buyers sign up."} action={filtersActive ? <Link href={BASE} className="btn-ghost">Clear filters</Link> : undefined} />}
        />
        <Pagination base={BASE} params={sortParams} page={page} perPage={PER_PAGE} total={total} />
      </Card>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
        <Download aria-hidden className="h-3.5 w-3.5" /> Spend counts confirmed, shipped and delivered orders (incl. freight). Need a customer&apos;s orders as CSV? Search their email on <Link href="/dashboard/orders" className="font-semibold text-signal-dark">Orders</Link> and export.
      </p>
    </>
  );
}
