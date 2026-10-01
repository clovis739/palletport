import Link from "next/link";
import { TicketPercent } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { promoState } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { SubmitButton } from "@/components/SubmitButton";
import { togglePromo } from "@/app/actions/seller";
import { NewPromoForm } from "./PromoForm";
import { Pagination } from "@/components/admin/ListControls";

const PER_PAGE = 25;

export const metadata = { title: "Promotions" };

export default async function Promotions({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const pageRaw = Math.floor(Number((await searchParams).page) || 1);
  const { seller } = await requireStaff("promotions", "/dashboard/promotions");
  const [promos, usage] = await Promise.all([
    db.promo.findMany({ where: { OR: [{ sellerId: seller.id }, { sellerId: null }] }, orderBy: { createdAt: "desc" } }),
    db.order.groupBy({ by: ["promoCode"], where: { promoCode: { not: null }, status: { not: "CANCELLED" } }, _count: { _all: true }, _sum: { discountCents: true, totalCents: true } }),
  ]);
  const use = new Map(usage.map((u) => [u.promoCode, u]));
  const totalDiscount = usage.reduce((a, u) => a + (u._sum.discountCents ?? 0), 0);
  const totalRevenue = usage.reduce((a, u) => a + (u._sum.totalCents ?? 0), 0);
  const totalOrders = usage.reduce((a, u) => a + u._count._all, 0);
  const pages = Math.max(1, Math.ceil(promos.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, pageRaw));
  const shown = promos.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const live = promos.filter((p) => promoState(p).label === "Active").length;

  return (
    <>
      <PageHeader title="Promotions" description="Discount codes buyers enter at checkout." />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active codes" value={live} icon={TicketPercent} hint={`${promos.length} total`} />
        <StatCard label="Orders with a code" value={totalOrders.toLocaleString()} hint="all time, not cancelled" />
        <StatCard label="Discounts given" value={money(totalDiscount)} />
        <StatCard label="Revenue from promo orders" value={money(totalRevenue)} hint={totalDiscount ? `${(totalRevenue / totalDiscount).toFixed(1)}× the discount` : undefined} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card padded={false} className="h-fit">
          <DataTable
            rows={shown}
            rowKey={(p) => p.id}
            caption="Promotions"
            minWidth={720}
            columns={[
              {
                key: "code",
                header: "Code",
                cell: (p) => (
                  <div className="min-w-0 text-left">
                    <Link href={`/dashboard/promotions/${p.id}`} className="font-mono font-bold hover:text-signal-dark hover:underline">{p.code}</Link>
                    {p.description && <span className="block max-w-[14rem] truncate text-xs text-muted">{p.description}</span>}
                  </div>
                ),
              },
              {
                key: "offer",
                header: "Offer",
                cell: (p) => (
                  <span className="text-sm">
                    {p.percentOff ? `${p.percentOff}% off` : `${money(p.amountOffCents ?? 0)} off`}
                    <span className="block text-xs text-muted">{[p.minSubtotalCents ? `min ${money(p.minSubtotalCents)}` : "", p.firstOrderOnly ? "first order" : ""].filter(Boolean).join(" · ") || "any order"}</span>
                  </span>
                ),
              },
              { key: "state", header: "Status", cell: (p) => { const s = promoState(p); return <span className="text-xs"><Badge tone={s.tone}>{s.label}</Badge>{p.expiresAt && <span className="block text-muted">{s.label === "Expired" ? "ended" : "until"} {p.expiresAt.toLocaleDateString()}</span>}</span>; } },
              { key: "uses", header: "Uses", align: "right", cell: (p) => <span className="tabular-nums">{p.uses}</span> },
              {
                key: "impact",
                header: "Discount / revenue",
                align: "right",
                cell: (p) => {
                  const u = use.get(p.code);
                  return u ? <span className="text-xs tabular-nums">−{money(u._sum.discountCents ?? 0)}<span className="block text-muted">{money(u._sum.totalCents ?? 0)} · {u._count._all} orders</span></span> : <span className="text-xs text-muted">—</span>;
                },
              },
              {
                key: "act",
                header: <span className="sr-only">Actions</span>,
                align: "right",
                cell: (p) => (
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/dashboard/promotions/${p.id}`} className="rounded-full px-2.5 py-1 text-xs font-semibold hover:bg-sand">Edit</Link>
                    <form action={togglePromo}>
                      <input type="hidden" name="id" value={p.id} />
                      <SubmitButton className="rounded-full px-2.5 py-1 text-xs font-semibold text-signal-dark hover:bg-sand" pendingText="…">{p.active ? "Pause" : "Activate"}</SubmitButton>
                    </form>
                  </div>
                ),
              },
            ]}
            empty={<EmptyState icon={TicketPercent} compact title="No promotions yet" description="Create a first-order code to turn new visitors into buyers." />}
          />
          <Pagination base="/dashboard/promotions" params={{}} page={page} perPage={PER_PAGE} total={promos.length} />
        </Card>
        <Card title="New promotion" className="h-fit">
          <NewPromoForm />
        </Card>
      </div>
    </>
  );
}
