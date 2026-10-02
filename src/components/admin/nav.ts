import {
  Activity,
  BarChart3,
  Boxes,
  Building2,
  FileText,
  FolderTree,
  Home,
  Image as ImageIcon,
  Inbox,
  CreditCard,
  Info,
  Mail,
  LayoutDashboard,
  Megaphone,
  Menu as MenuIcon,
  PlusCircle,
  Search,
  Settings2,
  ShoppingBag,
  Store,
  TicketPercent,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { Perm } from "@/lib/permissions";

/** Cookie holding the sidebar state ("collapsed" | "open"), read by the admin layout to avoid a flash. */
export const NAV_COOKIE = "pp_admin_nav";

/** Keys of the cheap counts shown as sidebar badges (computed in src/app/dashboard/layout.tsx). */
export type BadgeKey = "inbox" | "orders";
export type NavBadges = Partial<Record<BadgeKey, number>>;

export type AdminNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Required permission; omitted = any staff. "owner" = ADMIN role only. */
  perm?: Perm | "owner";
  badge?: BadgeKey;
  /** Match only the exact path (not sub-paths). */
  exact?: boolean;
};
export type AdminNavGroup = { label?: string; items: AdminNavItem[] };

/**
 * Admin sidebar. Add new sections here (keep hrefs under /dashboard). Items the user lacks the
 * permission for are hidden; the page itself must still guard with requireStaff(perm).
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  { items: [{ href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true }] },
  {
    label: "Sales",
    items: [
      { href: "/dashboard/orders", label: "Orders", icon: ShoppingBag, perm: "orders", badge: "orders" },
      { href: "/dashboard/customers", label: "Customers", icon: Users, perm: "customers" },
      { href: "/dashboard/promotions", label: "Promotions", icon: TicketPercent, perm: "promotions" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/dashboard/lots", label: "Lots", icon: Boxes, perm: "lots" },
      { href: "/dashboard/new", label: "New lot", icon: PlusCircle, perm: "lots" },
      { href: "/dashboard/categories", label: "Categories & brands", icon: FolderTree, perm: "lots" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/dashboard/content", label: "Pages & posts", icon: FileText, perm: "content" },
      { href: "/dashboard/media", label: "Media", icon: ImageIcon, perm: "media" },
    ],
  },
  {
    label: "Site",
    items: [
      { href: "/dashboard/site", label: "Site settings", icon: Settings2, perm: "site", exact: true },
      { href: "/dashboard/site/business", label: "Business profile", icon: Building2, perm: "site" },
      { href: "/dashboard/site/navigation", label: "Navigation", icon: MenuIcon, perm: "site" },
      { href: "/dashboard/site/announcement", label: "Announcement bar", icon: Megaphone, perm: "site" },
      { href: "/dashboard/site/homepage", label: "Homepage", icon: Home, perm: "site" },
      { href: "/dashboard/site/about", label: "About page", icon: Info, perm: "site" },
      { href: "/dashboard/site/contact", label: "Contact page", icon: Mail, perm: "site" },
      { href: "/dashboard/site/checkout", label: "Checkout", icon: CreditCard, perm: "site" },
      { href: "/dashboard/site/seo", label: "SEO defaults", icon: Search, perm: "site" },
      // Commerce-owned page (minimum order, pickup at checkout, store bio). Name/location moved to Business profile.
      { href: "/dashboard/settings", label: "Store settings", icon: Store, perm: "owner" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3, perm: "analytics" },
      { href: "/dashboard/activity", label: "Activity log", icon: Activity, perm: "activity" },
    ],
  },
  { label: "Team", items: [{ href: "/dashboard/staff", label: "Staff", icon: UserCog, perm: "staff" }] },
  { items: [{ href: "/dashboard/inbox", label: "Inbox", icon: Inbox, perm: "inbox", badge: "inbox" }] },
];

export function navAllowed(item: AdminNavItem, role: string, perms: readonly Perm[]) {
  if (!item.perm) return true;
  if (item.perm === "owner") return role === "ADMIN";
  return perms.includes(item.perm);
}

export function isActive(item: AdminNavItem, path: string) {
  return item.exact ? path === item.href : path === item.href || path.startsWith(`${item.href}/`);
}

/** Label of the nav item matching the current path (longest match), for the top bar. */
export function currentNavLabel(path: string) {
  let best: AdminNavItem | undefined;
  for (const g of ADMIN_NAV) for (const i of g.items) if (isActive(i, path) || path.startsWith(`${i.href}/`)) if (!best || i.href.length > best.href.length) best = i;
  return best?.label ?? "Admin";
}
