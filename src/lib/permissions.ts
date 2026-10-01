/**
 * Admin roles and permissions. Pure data + helpers (no server-only imports), so client components
 * such as the admin sidebar can use `can()` to hide links. The real checks happen server-side in
 * `requireStaff(perm)` (src/lib/auth.ts) and in every server action.
 *
 *   ADMIN    Owner. Everything, including site settings, staff, activity log and business settings.
 *   MANAGER  Runs the shop: orders, lots, customers, promotions, analytics, inbox.
 *   EDITOR   Runs the content: pages & posts, media library, analytics (read-only).
 *   BUYER    A customer. No admin access. (Legacy "SELLER" is treated the same.)
 */

export const PERMS = ["orders", "lots", "customers", "promotions", "analytics", "inbox", "content", "media", "site", "staff", "activity"] as const;
export type Perm = (typeof PERMS)[number];

export const ROLES = ["ADMIN", "MANAGER", "EDITOR", "BUYER"] as const;
export type Role = (typeof ROLES)[number];

export const STAFF_ROLES = ["ADMIN", "MANAGER", "EDITOR"] as const satisfies readonly Role[];
export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_PERMS: Record<Role, readonly Perm[]> = {
  ADMIN: PERMS,
  MANAGER: ["orders", "lots", "customers", "promotions", "analytics", "inbox"],
  EDITOR: ["content", "media", "analytics"],
  BUYER: [],
};

export const ROLE_INFO: Record<Role, { label: string; description: string; tone: "signal" | "ink" | "moss" | "muted" }> = {
  ADMIN: { label: "Owner", description: "Full control, including site settings, staff accounts and the activity log.", tone: "signal" },
  MANAGER: { label: "Manager", description: "Orders, lots, customers, promotions, analytics and the inbox.", tone: "ink" },
  EDITOR: { label: "Editor", description: "Pages, blog posts, guides, help articles and the media library. Can view analytics.", tone: "moss" },
  BUYER: { label: "Buyer", description: "Customer account with no admin access.", tone: "muted" },
};

export const PERM_INFO: Record<Perm, string> = {
  orders: "Orders",
  lots: "Lots & listings",
  customers: "Customers",
  promotions: "Promotions",
  analytics: "Analytics",
  inbox: "Approvals & inbox",
  content: "Pages & posts",
  media: "Media library",
  site: "Site settings",
  staff: "Staff",
  activity: "Activity log",
};

export function asRole(role: string | null | undefined): Role {
  return (ROLES as readonly string[]).includes(role ?? "") ? (role as Role) : "BUYER";
}

export function isStaff(role: string | null | undefined): role is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(role ?? "");
}

export function isOwner(role: string | null | undefined) {
  return role === "ADMIN";
}

export function can(role: string | null | undefined, perm: Perm): boolean {
  return ROLE_PERMS[asRole(role)].includes(perm);
}

/** Every permission the role holds (handy to pass to client components). */
export function permsOf(role: string | null | undefined): Perm[] {
  return [...ROLE_PERMS[asRole(role)]];
}
