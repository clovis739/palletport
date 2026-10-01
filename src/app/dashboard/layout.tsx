import { Suspense } from "react";
import { cookies } from "next/headers";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { can, permsOf } from "@/lib/permissions";
import { privateMetadata } from "@/lib/seo";
import { AdminShell } from "@/components/admin/AdminShell";
import { FlashToast } from "@/components/admin/Flash";
import { NAV_COOKIE, type NavBadges } from "@/components/admin/nav";

// Admin pages are private: never indexed (child pages only set their titles).
export const metadata = privateMetadata("Admin");

/** Cheap sidebar counts, only for sections the user can open. */
async function navBadges(role: string): Promise<NavBadges> {
  const [certs, inquiries, toConfirm] = await Promise.all([
    can(role, "inbox") ? db.user.count({ where: { certStatus: "PENDING" } }) : 0,
    can(role, "inbox") ? db.inquiry.count({ where: { handled: false } }) : 0,
    can(role, "orders") ? db.order.count({ where: { status: "PENDING" } }) : 0,
  ]);
  return { inbox: certs + inquiries, orders: toConfirm };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, seller } = await requireStaff();
  const [badges, jar] = await Promise.all([navBadges(user.role), cookies()]);
  return (
    <AdminShell
      user={{ name: user.name, email: user.email, role: user.role }}
      perms={permsOf(user.role)}
      storeName={seller.name}
      badges={badges}
      initialCollapsed={jar.get(NAV_COOKIE)?.value === "collapsed"}
    >
      {children}
      <Suspense fallback={null}>
        <FlashToast />
      </Suspense>
    </AdminShell>
  );
}
