import Link from "next/link";
import { notFound } from "next/navigation";
import { DollarSign, Heart, Mail, Package, Phone, ShoppingBag } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { BUSINESS_TYPES, money, timeAgo } from "@/lib/format";
import { ROLE_INFO, ROLES, asRole, isStaff } from "@/lib/permissions";
import { PAYMENT_LABEL, REVENUE_STATUSES } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { StatCard } from "@/components/admin/StatCard";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { CopyButton } from "@/components/admin/CopyButton";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";
import { reviewCertificate } from "@/app/actions/admin";
import { setCustomerPro } from "@/app/actions/customers";
import { changeRole } from "@/app/actions/staff";
import { ProfileForm, ResetLinkForm } from "./CustomerForms";

export const metadata = { title: "Customer" };

export default async function CustomerDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user: me } = await requireStaff("customers", `/dashboard/customers/${id}`);
  const c = await db.user.findUnique({ where: { id }, include: { _count: { select: { favorites: true, orders: true } } } });
  if (!c) notFound();
  const [orders, saved, bought, spend, adminCount] = await Promise.all([
    db.order.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 25, include: { items: { select: { title: true } } } }),
    db.favorite.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 15, include: { lot: { select: { id: true, title: true, status: true, priceCents: true, available: true } } } }),
    db.orderItem.aggregate({ where: { order: { userId: id, status: { not: "CANCELLED" } } }, _sum: { quantity: true } }),
    db.order.aggregate({ where: { userId: id, status: { in: [...REVENUE_STATUSES] } }, _sum: { totalCents: true } }),
    db.user.count({ where: { role: "ADMIN" } }),
  ]);
  const role = asRole(c.role);
  const owner = me.role === "ADMIN";
  const self = me.id === c.id;
  const staffTarget = isStaff(c.role);
  const lockReason = staffTarget && !owner && !self ? "This is a staff account — only the owner can edit it or reset its password." : undefined;
  const back = `/dashboard/customers/${c.id}`;

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/customers", label: "All customers" }}
        title={c.businessName ?? c.name}
        description={c.businessName ? c.name : undefined}
        meta={
          <>
            <Badge tone={ROLE_INFO[role].tone}>{ROLE_INFO[role].label}</Badge>
            {c.certStatus !== "NONE" && <StatusPill status={c.certStatus} label={`Certificate ${c.certStatus.toLowerCase()}`} />}
            {c.isPro && <Badge tone="signal">Pro</Badge>}
            <span>Joined {c.createdAt.toLocaleDateString("en-US", { dateStyle: "medium" })}</span>
          </>
        }
        actions={
          <>
            <a href={`mailto:${c.email}`} className="btn-ghost"><Mail aria-hidden className="h-4 w-4" /> Email</a>
            {c.phone && <a href={`tel:${c.phone.replace(/[^\d+]/g, "")}`} className="btn-ghost"><Phone aria-hidden className="h-4 w-4" /> Call</a>}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Total spend" value={money(spend._sum.totalCents ?? 0)} icon={DollarSign} hint="confirmed & fulfilled orders" />
        <StatCard label="Orders" value={c._count.orders} icon={ShoppingBag} href={`/dashboard/orders?q=${encodeURIComponent(c.email)}`} />
        <StatCard label="Lots bought" value={bought._sum.quantity ?? 0} icon={Package} hint="excluding cancelled orders" />
        <StatCard label="Saved lots" value={c._count.favorites} icon={Heart} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card title="Orders" padded={false} actions={c._count.orders > orders.length ? <Link href={`/dashboard/orders?q=${encodeURIComponent(c.email)}`} className="text-xs font-semibold text-signal-dark">All {c._count.orders}</Link> : undefined}>
            <DataTable
              rows={orders}
              rowKey={(o) => o.id}
              caption="Customer orders"
              minWidth={560}
              columns={[
                { key: "no", header: "Order", cell: (o) => <Link href={`/dashboard/orders/${o.id}`} className="font-mono font-semibold hover:underline">{o.number}</Link> },
                { key: "date", header: "Date", cell: (o) => <span className="text-xs">{o.createdAt.toLocaleDateString()}</span> },
                { key: "lots", header: "Lots", hideOnMobile: true, cell: (o) => <span className="block max-w-[14rem] truncate text-xs">{o.items.map((i) => i.title).join(", ")}</span> },
                { key: "pay", header: "Payment", hideOnMobile: true, cell: (o) => <span className="text-xs">{PAYMENT_LABEL[o.paymentMethod] ?? o.paymentMethod}</span> },
                { key: "status", header: "Status", cell: (o) => <StatusPill status={o.status} /> },
                { key: "total", header: "Total", align: "right", cell: (o) => <span className="font-semibold tabular-nums">{money(o.totalCents)}</span> },
              ]}
              empty={<EmptyState icon={ShoppingBag} compact title="No orders yet" />}
            />
          </Card>

          <Card title="Saved lots" padded={false}>
            <DataTable
              rows={saved}
              rowKey={(f) => f.id}
              caption="Saved lots"
              minWidth={520}
              columns={[
                { key: "lot", header: "Lot", cell: (f) => <Link href={`/dashboard/lots/${f.lot.id}`} className="line-clamp-1 hover:underline">{f.lot.title}</Link> },
                { key: "price", header: "Price", align: "right", cell: (f) => <span className="tabular-nums">{money(f.lot.priceCents)}</span> },
                { key: "stock", header: "Stock", cell: (f) => (f.lot.status === "ACTIVE" ? <Badge tone="moss">{f.lot.available} in stock</Badge> : <Badge tone="muted">Sold out</Badge>) },
                { key: "when", header: "Saved", align: "right", cell: (f) => <span className="text-xs text-muted">{timeAgo(f.createdAt)}</span> },
              ]}
              empty={<EmptyState icon={Heart} compact title="No saved lots" />}
            />
          </Card>

          <Card title="Profile & shipping" description="Email must be unique across accounts.">
            <ProfileForm
              businessTypes={BUSINESS_TYPES}
              disabledReason={lockReason}
              d={{ id: c.id, name: c.name, email: c.email, phone: c.phone, businessName: c.businessName, businessType: c.businessType, shipAddress: c.shipAddress, shipCity: c.shipCity, shipRegion: c.shipRegion, shipPostal: c.shipPostal, shipCountry: c.shipCountry }}
            />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Contact">
            <dl className="space-y-2 text-sm">
              <div><dt className="label mb-0.5">Email</dt><dd className="flex items-center gap-1 break-all">{c.email}<CopyButton text={c.email} label="Copy email" /></dd></div>
              {c.phone && <div><dt className="label mb-0.5">Phone</dt><dd className="flex items-center gap-1">{c.phone}<CopyButton text={c.phone} label="Copy phone" /></dd></div>}
              {c.businessType && <div><dt className="label mb-0.5">Business type</dt><dd>{c.businessType}</dd></div>}
              {c.referredBy && <div><dt className="label mb-0.5">Referred by code</dt><dd className="font-mono text-xs">{c.referredBy}</dd></div>}
            </dl>
          </Card>

          <Card title="Resale certificate" description="Approval unlocks Net 30 terms and verified pricing.">
            {c.certStatus === "NONE" ? (
              <p className="text-sm text-muted">No certificate submitted yet.</p>
            ) : (
              <div className="space-y-3">
                <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1 text-sm">
                  <dt className="text-muted">Status</dt><dd><StatusPill status={c.certStatus} /></dd>
                  <dt className="text-muted">Number</dt><dd className="break-all font-mono">{c.certNumber ?? "—"}</dd>
                  <dt className="text-muted">State</dt><dd>{c.certState ?? "—"}</dd>
                  {c.certNote && (<><dt className="text-muted">Note</dt><dd className="break-words">{c.certNote}</dd></>)}
                </dl>
                <form action={reviewCertificate} className="space-y-2 pt-3">
                  <input type="hidden" name="userId" value={c.id} />
                  <label htmlFor="cert-note" className="label">Review note (optional)</label>
                  <textarea id="cert-note" name="note" rows={2} maxLength={500} className="input resize-y text-sm" placeholder="e.g. Expired certificate — ask for a current one" />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" name="status" value="APPROVED" className="btn-dark py-1.5 text-xs">{c.certStatus === "APPROVED" ? "Approve again" : "Approve"}</button>
                    <button type="submit" name="status" value="REJECTED" className="btn-ghost py-1.5 text-xs text-rust">Reject</button>
                  </div>
                </form>
              </div>
            )}
          </Card>

          <Card title="Pro membership">
            <form action={setCustomerPro} className="flex items-center justify-between gap-3">
              <input type="hidden" name="id" value={c.id} />
              <input type="hidden" name="pro" value={c.isPro ? "0" : "1"} />
              <p className="text-sm">{c.isPro ? "This customer is a Pro member." : "Not a Pro member."}</p>
              <SubmitButton className={c.isPro ? "btn-ghost py-1.5 text-xs" : "btn-dark py-1.5 text-xs"} pendingText="…">{c.isPro ? "Remove Pro" : "Make Pro"}</SubmitButton>
            </form>
          </Card>

          <Card title="Password reset">
            <ResetLinkForm id={c.id} disabledReason={lockReason} />
          </Card>

          {owner && (
            <Card title="Role & admin access" description="Owner only.">
              {self ? (
                <p className="text-sm text-muted">This is your account. You can&apos;t change your own role.</p>
              ) : role === "ADMIN" && adminCount <= 1 ? (
                <p className="text-sm text-muted">This is the only owner account. Make someone else Owner before changing it.</p>
              ) : (
                <form action={changeRole} className="space-y-2">
                  <input type="hidden" name="userId" value={c.id} />
                  <input type="hidden" name="back" value={back} />
                  <label htmlFor="role" className="label">Role</label>
                  <Select id="role" name="role" defaultValue={role} className="input py-2">
                    {[...ROLES].reverse().map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}{r === "BUYER" ? " (no admin access)" : ""}</option>)}
                  </Select>
                  <p className="text-xs text-muted">{ROLE_INFO[role].description}</p>
                  <ConfirmButton className="btn-dark py-1.5 text-xs" confirmClassName="btn-primary py-1.5 text-xs" confirmLabel="Change role" prompt="Change this account's role?">Change role…</ConfirmButton>
                </form>
              )}
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
