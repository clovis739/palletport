import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Activity } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { AUDIT_AREAS, auditLabel, dateRangeWhere, parsePage, qs } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Toolbar } from "@/components/admin/Toolbar";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, type Tone } from "@/components/admin/Badge";
import { FilterButtons, Pagination } from "@/components/admin/ListControls";
import { Select } from "@/components/ui/Select";
import { CI } from "@/lib/dbText";

export const metadata = { title: "Activity log" };

const BASE = "/dashboard/activity";
const PER_PAGE = 50;
type SP = Record<string, string | undefined>;
const isDate = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
const looksLikeId = (s: string) => /^c[a-z0-9]{20,32}$/.test(s);

const AREA_TONE: Record<string, Tone> = { order: "signal", lot: "ink", customer: "moss", staff: "rust", inbox: "amber", promo: "neutral" };

export default async function ActivityPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  await requireStaff("activity", BASE);
  const q = (sp.q ?? "").trim().slice(0, 100);
  const area = AUDIT_AREAS.some((a) => a.value === sp.area) ? sp.area! : "";
  const from = isDate(sp.from) ? sp.from! : "";
  const to = isDate(sp.to) ? sp.to! : "";
  const people = await db.auditLog.groupBy({ by: ["userEmail"], _count: { _all: true }, orderBy: { userEmail: "asc" } });
  const who = people.some((p) => p.userEmail === sp.user) ? sp.user! : "";
  const page = parsePage(sp.page);
  const created = dateRangeWhere(from, to);

  const where: Prisma.AuditLogWhereInput = {
    ...(who ? { userEmail: who } : {}),
    ...(area ? { action: { startsWith: area } } : {}),
    ...(created ? { createdAt: created } : {}),
    ...(q ? { OR: [{ action: { contains: q, ...CI } }, { target: { contains: q, ...CI } }, { detail: { contains: q, ...CI } }, { userEmail: { contains: q, ...CI } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
  ]);

  // Resolve link targets for this page in a few batched queries.
  const numbers = rows.filter((r) => r.action.startsWith("order.")).map((r) => r.target);
  const lotIds = rows.filter((r) => r.action.startsWith("lot.")).flatMap((r) => [r.target, r.detail]).filter(looksLikeId);
  const emails = rows.filter((r) => /^(customer|staff|inbox\.certificate)/.test(r.action)).map((r) => r.target);
  const codes = rows.filter((r) => r.action.startsWith("promo.")).map((r) => r.target);
  const [orders, lots, users, promos] = await Promise.all([
    numbers.length ? db.order.findMany({ where: { number: { in: numbers } }, select: { id: true, number: true } }) : [],
    lotIds.length ? db.lot.findMany({ where: { id: { in: lotIds } }, select: { id: true, title: true } }) : [],
    emails.length ? db.user.findMany({ where: { email: { in: emails } }, select: { id: true, email: true } }) : [],
    codes.length ? db.promo.findMany({ where: { code: { in: codes } }, select: { id: true, code: true } }) : [],
  ]);
  const orderBy = new Map(orders.map((o) => [o.number, o.id]));
  const lotBy = new Map(lots.map((l) => [l.id, l.title]));
  const userBy = new Map(users.map((u) => [u.email, u.id]));
  const promoBy = new Map(promos.map((p) => [p.code, p.id]));

  function link(r: (typeof rows)[number]): { href: string; label: string } | null {
    const [a] = r.action.split(".");
    if (a === "order" && orderBy.has(r.target)) return { href: `/dashboard/orders/${orderBy.get(r.target)}`, label: r.target };
    if (a === "lot") {
      const id = [r.target, r.detail].find((s) => lotBy.has(s));
      if (id) return { href: `/dashboard/lots/${id}`, label: lotBy.get(id)! };
    }
    if (userBy.has(r.target)) return { href: `/dashboard/customers/${userBy.get(r.target)}`, label: r.target };
    if (a === "promo" && promoBy.has(r.target)) return { href: `/dashboard/promotions/${promoBy.get(r.target)}`, label: r.target };
    if (a === "inbox") return { href: "/dashboard/inbox?tab=messages&status=all", label: r.target };
    if (a === "store") return { href: "/dashboard/settings", label: r.target || "Store settings" };
    if (a === "settings" || a === "nav" || a === "home") return { href: "/dashboard/site", label: r.target || "Site settings" };
    if (a === "content" && r.detail.startsWith("/") && !r.detail.startsWith("//")) return { href: r.detail, label: r.target };
    if (a === "media") return { href: "/dashboard/media", label: r.target };
    return null;
  }

  const filterParams = { q, user: who, area, from, to };
  const filtersActive = !!(q || who || area || from || to);

  return (
    <>
      <PageHeader title="Activity log" description="Who changed what in the admin, and when. Owner only." />

      <Toolbar q={q} placeholder="Search action, target or detail…" end={`${total.toLocaleString()} entr${total === 1 ? "y" : "ies"}`}>
        <div className="w-52">
          <Select name="user" form="toolbar-form" defaultValue={who} aria-label="Person" className="input py-2">
            <option value="">Everyone</option>
            {people.map((p) => <option key={p.userEmail || "system"} value={p.userEmail}>{p.userEmail || "System"} ({p._count._all})</option>)}
          </Select>
        </div>
        <div className="w-40">
          <Select name="area" form="toolbar-form" defaultValue={area} aria-label="Area" className="input py-2">
            <option value="">All areas</option>
            {AUDIT_AREAS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
          </Select>
        </div>
        <label className="flex items-center gap-1.5 text-xs text-muted">From <input type="date" name="from" form="toolbar-form" defaultValue={from} className="input w-auto py-1.5" /></label>
        <label className="flex items-center gap-1.5 text-xs text-muted">To <input type="date" name="to" form="toolbar-form" defaultValue={to} className="input w-auto py-1.5" /></label>
        <FilterButtons clearHref={BASE} active={filtersActive} />
      </Toolbar>

      <Card padded={false}>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          caption="Activity log"
          minWidth={820}
          columns={[
            {
              key: "what",
              header: "Action",
              cell: (r) => {
                const [a] = r.action.split(".");
                const l = link(r);
                return (
                  <div className="min-w-0 text-left">
                    <p className="font-medium">{auditLabel(r.action)}</p>
                    <p className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
                      <Badge tone={AREA_TONE[a] ?? "muted"}>{r.action}</Badge>
                      {l ? <Link href={l.href} className="max-w-[18rem] truncate font-semibold text-signal-dark hover:underline">{l.label}</Link> : r.target && <span className="max-w-[18rem] truncate">{r.target}</span>}
                    </p>
                  </div>
                );
              },
            },
            { key: "detail", header: "Detail", cell: (r) => <span className="block max-w-[22rem] break-words text-xs md:text-left">{r.detail && !looksLikeId(r.detail) ? r.detail : "—"}</span> },
            { key: "who", header: "By", cell: (r) => <span className="text-xs">{r.userEmail ? <Link href={`${BASE}${qs({ ...filterParams, user: r.userEmail })}`} className="hover:underline">{r.userEmail}</Link> : "System"}</span> },
            {
              key: "when",
              header: "When",
              align: "right",
              cell: (r) => <time dateTime={r.createdAt.toISOString()} title={r.createdAt.toLocaleString()} className="whitespace-nowrap text-xs">{timeAgo(r.createdAt)}<span className="block text-muted">{r.createdAt.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</span></time>,
            },
          ]}
          empty={<EmptyState icon={Activity} compact title={filtersActive ? "No entries match" : "No activity yet"} description={filtersActive ? "Try different filters." : "Changes made in the admin will be listed here."} action={filtersActive ? <Link href={BASE} className="btn-ghost">Clear filters</Link> : undefined} />}
        />
        <Pagination base={BASE} params={filterParams} page={page} perPage={PER_PAGE} total={total} />
      </Card>
    </>
  );
}
