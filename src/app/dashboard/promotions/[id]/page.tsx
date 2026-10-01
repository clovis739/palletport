import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money } from "@/lib/format";
import { promoState } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { EditPromoForm } from "../PromoForm";

export const metadata = { title: "Edit promotion" };

export default async function EditPromo({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { seller } = await requireStaff("promotions", `/dashboard/promotions/${id}`);
  const p = await db.promo.findFirst({ where: { id, OR: [{ sellerId: seller.id }, { sellerId: null }] } });
  if (!p) notFound();
  const orders = await db.order.findMany({ where: { promoCode: p.code }, orderBy: { createdAt: "desc" }, take: 50, include: { user: { select: { name: true, businessName: true } } } });
  const live = orders.filter((o) => o.status !== "CANCELLED");
  const discount = live.reduce((a, o) => a + o.discountCents, 0);
  const revenue = live.reduce((a, o) => a + o.totalCents, 0);
  const s = promoState(p);

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/promotions", label: "All promotions" }}
        title={<span className="font-mono">{p.code}</span>}
        description={p.description}
        meta={<><Badge tone={s.tone}>{s.label}</Badge><span>Created {p.createdAt.toLocaleDateString()}</span>{!p.sellerId && <span>· site-wide</span>}</>}
      />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Uses" value={p.uses} hint="counter at checkout" />
        <StatCard label="Orders (not cancelled)" value={live.length} />
        <StatCard label="Discount given" value={money(discount)} />
        <StatCard label="Order revenue" value={money(revenue)} hint={live.length ? `avg ${money(Math.round(revenue / live.length))}` : undefined} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card title="Terms" description="The code itself can't be changed because past orders reference it.">
          <EditPromoForm
            d={{
              id: p.id,
              code: p.code,
              kind: p.percentOff ? "percent" : "amount",
              value: p.percentOff ?? (p.amountOffCents ?? 0) / 100,
              minSubtotal: p.minSubtotalCents / 100,
              description: p.description,
              firstOrderOnly: p.firstOrderOnly,
              active: p.active,
              expiresAt: p.expiresAt ? p.expiresAt.toISOString().slice(0, 10) : "",
            }}
          />
        </Card>
        <Card title="Orders using this code" padded={false}>
          <DataTable
            rows={orders}
            rowKey={(o) => o.id}
            caption="Orders using this code"
            minWidth={480}
            columns={[
              { key: "no", header: "Order", cell: (o) => <Link href={`/dashboard/orders/${o.id}`} className="font-mono font-semibold hover:underline">{o.number}</Link> },
              { key: "buyer", header: "Buyer", cell: (o) => <span className="text-xs">{o.user.businessName ?? o.user.name}</span> },
              { key: "status", header: "Status", cell: (o) => <StatusPill status={o.status} /> },
              { key: "disc", header: "Discount", align: "right", cell: (o) => <span className="tabular-nums text-moss">−{money(o.discountCents)}</span> },
              { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-semibold tabular-nums">{money(o.totalCents)}</span> },
            ]}
            empty={<EmptyState compact title="Not used yet" />}
          />
        </Card>
      </div>
    </>
  );
}
