import Link from "next/link";
import { Check, UserCog } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { PERMS, PERM_INFO, ROLE_INFO, ROLE_PERMS, STAFF_ROLES, asRole } from "@/lib/permissions";
import { auditLabel } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";
import { changeRole, removeStaff } from "@/app/actions/staff";
import { AddStaffForm } from "./AddStaffForm";

export const metadata = { title: "Staff" };

export default async function StaffPage() {
  const { user: me } = await requireStaff("staff", "/dashboard/staff");
  const staff = await db.user.findMany({ where: { role: { in: [...STAFF_ROLES] } }, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  const ids = staff.map((s) => s.id);
  const since30 = new Date(Date.now() - 30 * 86400000);
  const [last, recent] = await Promise.all([
    db.auditLog.groupBy({ by: ["userId"], where: { userId: { in: ids } }, _max: { createdAt: true } }),
    db.auditLog.groupBy({ by: ["userId"], where: { userId: { in: ids }, createdAt: { gte: since30 } }, _count: { _all: true } }),
  ]);
  const lastAt = new Map(last.map((l) => [l.userId, l._max.createdAt]));
  const count30 = new Map(recent.map((r) => [r.userId, r._count._all]));
  const lastActions = await Promise.all(
    staff.map((s) => (lastAt.get(s.id) ? db.auditLog.findFirst({ where: { userId: s.id }, orderBy: { createdAt: "desc" }, select: { action: true, target: true } }) : null)),
  );
  const lastAction = new Map(staff.map((s, i) => [s.id, lastActions[i]]));
  const order = { ADMIN: 0, MANAGER: 1, EDITOR: 2, BUYER: 3 } as const;
  staff.sort((a, b) => order[asRole(a.role)] - order[asRole(b.role)] || a.name.localeCompare(b.name));
  const admins = staff.filter((s) => s.role === "ADMIN").length;

  return (
    <>
      <PageHeader title="Staff" description="People who can use the admin, and what each role can do. Owner only." />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card title={`Team (${staff.length})`} padded={false}>
          <DataTable
            rows={staff}
            rowKey={(s) => s.id}
            caption="Staff members"
            minWidth={760}
            columns={[
              {
                key: "name",
                header: "Name",
                cell: (s) => (
                  <div className="min-w-0 text-left">
                    <Link href={`/dashboard/customers/${s.id}`} className="font-medium hover:underline">{s.name}</Link>
                    {s.id === me.id && <span className="ml-1.5 text-xs text-muted">(you)</span>}
                    <span className="block truncate text-xs text-muted">{s.email}</span>
                  </div>
                ),
              },
              { key: "role", header: "Role", cell: (s) => <Badge tone={ROLE_INFO[asRole(s.role)].tone}>{ROLE_INFO[asRole(s.role)].label}</Badge> },
              {
                key: "activity",
                header: "Last activity",
                cell: (s) => {
                  const at = lastAt.get(s.id);
                  const a = lastAction.get(s.id);
                  return at ? (
                    <span className="block text-xs">
                      <Link href={`/dashboard/activity?user=${encodeURIComponent(s.email)}`} className="font-medium hover:underline">{timeAgo(at)}</Link>
                      {a && <span className="block max-w-[14rem] truncate text-muted" title={`${auditLabel(a.action)} ${a.target}`}>{auditLabel(a.action)}</span>}
                      <span className="block text-muted">{count30.get(s.id) ?? 0} actions in 30 days</span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted">No activity yet</span>
                  );
                },
              },
              {
                key: "manage",
                header: "Manage",
                align: "right",
                cell: (s) => {
                  if (s.id === me.id) return <span className="text-xs text-muted">You can&apos;t change your own role</span>;
                  if (s.role === "ADMIN" && admins <= 1) return <span className="text-xs text-muted">Last owner</span>;
                  return (
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <form action={changeRole} className="flex items-center gap-1.5">
                        <input type="hidden" name="userId" value={s.id} />
                        <input type="hidden" name="back" value="/dashboard/staff" />
                        <div className="w-32">
                          <Select name="role" defaultValue={s.role} aria-label={`Role for ${s.name}`} className="input py-1.5 text-sm">
                            {STAFF_ROLES.map((r) => <option key={r} value={r}>{ROLE_INFO[r].label}</option>)}
                          </Select>
                        </div>
                        <SubmitButton className="btn-ghost px-3 py-1.5 text-xs" pendingText="…">Save</SubmitButton>
                      </form>
                      <form action={removeStaff}>
                        <input type="hidden" name="userId" value={s.id} />
                        <input type="hidden" name="back" value="/dashboard/staff" />
                        <ConfirmButton className="rounded-full px-3 py-1.5 text-xs font-semibold text-rust hover:bg-rust/10" confirmClassName="rounded-full bg-rust px-3 py-1.5 text-xs font-semibold text-white" confirmLabel="Remove" prompt="Remove admin access?">Remove</ConfirmButton>
                      </form>
                    </div>
                  );
                },
              },
            ]}
            empty={<EmptyState icon={UserCog} compact title="No staff yet" />}
          />
          <p className="px-4 py-3 text-xs text-muted sm:px-5">Removing access turns the account back into a normal buyer account; nothing is deleted. Role changes apply on their next page load.</p>
        </Card>

        <Card title="Add staff">
          <AddStaffForm />
        </Card>
      </div>

      <h2 className="mb-3 mt-10 font-display text-lg font-bold">What each role can do</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {STAFF_ROLES.map((r) => (
          <Card key={r} title={<span className="inline-flex items-center gap-2"><Badge tone={ROLE_INFO[r].tone}>{ROLE_INFO[r].label}</Badge></span>} description={ROLE_INFO[r].description}>
            <ul className="space-y-1.5 text-sm">
              {PERMS.map((p) => {
                const ok = ROLE_PERMS[r].includes(p);
                return (
                  <li key={p} className={`flex items-center gap-2 ${ok ? "" : "text-muted/60 line-through decoration-line"}`}>
                    <Check aria-hidden className={`h-3.5 w-3.5 shrink-0 ${ok ? "text-moss" : "opacity-0"}`} />
                    <span>{PERM_INFO[p]}{p === "analytics" && r === "EDITOR" ? " (view only)" : ""}</span>
                    <span className="sr-only">{ok ? "(allowed)" : "(not allowed)"}</span>
                  </li>
                );
              })}
              {r === "ADMIN" && <li className="flex items-center gap-2"><Check aria-hidden className="h-3.5 w-3.5 text-moss" /> Store settings</li>}
            </ul>
          </Card>
        ))}
      </div>
    </>
  );
}
