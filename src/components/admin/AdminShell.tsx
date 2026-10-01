"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { ChevronsLeft, ChevronsRight, ExternalLink, LogOut, Menu, Search, User, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { ROLE_INFO, asRole, type Perm } from "@/lib/permissions";
import { ADMIN_NAV, NAV_COOKIE, currentNavLabel, isActive, navAllowed, type NavBadges } from "./nav";
import { Badge } from "./Badge";

type ShellUser = { name: string; email: string; role: string };

/**
 * Admin chrome: ink sidebar (collapsible to icons on desktop, a drawer on phones), top bar with
 * global search, "View site" and the user menu. Pages render their own <PageHeader> inside `children`.
 */
export function AdminShell({
  user,
  perms,
  storeName,
  badges,
  initialCollapsed,
  children,
}: {
  user: ShellUser;
  perms: Perm[];
  storeName: string;
  badges: NavBadges;
  initialCollapsed: boolean;
  children: ReactNode;
}) {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => setDrawer(false), [path]);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawer]);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${NAV_COOKIE}=${next ? "collapsed" : "open"}; path=/dashboard; max-age=31536000; samesite=lax`;
  };

  return (
    <div className="min-h-dvh bg-[#f5f1e8]">
      <a href="#admin-main" className="sr-only z-[80] rounded-lg bg-white px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden flex-col bg-ink text-white transition-[width] duration-200 lg:flex ${collapsed ? "w-[72px]" : "w-64"}`}
        aria-label="Admin"
      >
        <SidebarBody user={user} perms={perms} storeName={storeName} badges={badges} collapsed={collapsed} path={path} />
        <button
          type="button"
          onClick={toggleCollapsed}
          className="flex h-11 shrink-0 items-center gap-2 px-5 text-xs font-semibold text-white/60 hover:bg-white/5 hover:text-white focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
        >
          {collapsed ? <ChevronsRight aria-hidden className="h-4 w-4" /> : <><ChevronsLeft aria-hidden className="h-4 w-4" /> Collapse</>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu" data-lenis-prevent>
          <button type="button" aria-label="Close menu" className="absolute inset-0 h-full w-full bg-ink/60" onClick={() => setDrawer(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-[min(18rem,86vw)] flex-col bg-ink pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white">
            <button
              type="button"
              onClick={() => setDrawer(false)}
              className="absolute right-2 top-2 grid h-10 w-10 place-items-center rounded-full text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Close menu"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>
            <SidebarBody user={user} perms={perms} storeName={storeName} badges={badges} collapsed={false} path={path} />
          </aside>
        </div>
      )}

      <div className={`flex min-h-dvh min-w-0 flex-col bg-sand transition-[padding] duration-200 ${collapsed ? "lg:pl-[72px]" : "lg:pl-64"}`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 bg-white">
          <div className="flex h-14 items-center gap-2 px-3 sm:gap-3 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-lg hover:bg-sand lg:hidden"
              aria-label="Open admin menu"
              aria-expanded={drawer}
            >
              <Menu aria-hidden className="h-5 w-5" />
            </button>
            <p className="min-w-0 truncate font-display text-base font-bold lg:hidden">{currentNavLabel(path)}</p>
            <GlobalSearch perms={perms} />
            <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
              <Link href="/" className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold hover:bg-sand focus-visible:outline-2 focus-visible:outline-signal sm:inline-flex" target="_blank">
                View site <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </Link>
              <UserMenu user={user} />
            </div>
          </div>
        </header>

        {/* The root layout already wraps pages in <main>, so this is a plain region. */}
        <div id="admin-main" tabIndex={-1} className="min-w-0 flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SidebarBody({
  user,
  perms,
  storeName,
  badges,
  collapsed,
  path,
}: {
  user: ShellUser;
  perms: Perm[];
  storeName: string;
  badges: NavBadges;
  collapsed: boolean;
  path: string;
}) {
  const groups = ADMIN_NAV.map((g) => ({ ...g, items: g.items.filter((i) => navAllowed(i, user.role, perms)) })).filter((g) => g.items.length);
  return (
    <>
      <Link
        href="/dashboard"
        className={`flex h-16 shrink-0 items-center gap-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal ${collapsed ?"justify-center px-2":"px-5"}`}
        title={collapsed ? storeName : undefined}
      >
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-signal font-display text-sm font-bold">{storeName.slice(0, 2).toUpperCase()}</span>
        {!collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{storeName}</span>
            <span className="text-[11px] uppercase tracking-wider text-white/50">Admin</span>
          </span>
        )}
      </Link>
      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4 [scrollbar-width:thin]" aria-label="Admin sections" data-lenis-prevent>
        {groups.map((g, gi) => (
          <div key={g.label ?? gi} className={gi ? "mt-5" : ""}>
            {g.label && !collapsed && <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">{g.label}</p>}
            {g.label && collapsed && <div className="mx-3 mb-2" aria-hidden />}
            <ul className="space-y-0.5">
              {g.items.map((item) => {
                const active = isActive(item, path);
                const count = item.badge ? badges[item.badge] ?? 0 : 0;
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      title={collapsed ? `${item.label}${count ? ` (${count})` : ""}` : undefined}
                      className={`group relative flex min-h-10 items-center gap-3 rounded-lg text-sm transition-colors focus-visible:outline-2 focus-visible:outline-signal ${
                        collapsed ? "justify-center px-2" : "px-3"
                      } ${active ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white"}`}
                    >
                      {active && <span aria-hidden className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-signal" />}
                      <Icon aria-hidden className={`h-[18px] w-[18px] shrink-0 ${active ? "text-signal" : ""}`} />
                      {collapsed ? <span className="sr-only">{item.label}</span> : <span className="min-w-0 flex-1 truncate">{item.label}</span>}
                      {count > 0 &&
                        (collapsed ? (
                          <span aria-hidden className="absolute right-2 top-2 h-2 w-2 rounded-full bg-signal" />
                        ) : (
                          <span className="rounded-full bg-signal px-2 py-0.5 text-[11px] font-bold text-white">
                            {count > 99 ? "99+" : count}
                            <span className="sr-only"> pending</span>
                          </span>
                        ))}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </>
  );
}

function GlobalSearch({ perms }: { perms: Perm[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const listId = useId();
  const box = useRef<HTMLFormElement>(null);
  const targets = [
    ...(perms.includes("orders") ? [{ href: "/dashboard/orders", label: "orders" }] : []),
    ...(perms.includes("lots") ? [{ href: "/dashboard/lots", label: "lots" }] : []),
  ];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!targets.length) return null;
  const term = q.trim();
  return (
    <form
      ref={box}
      role="search"
      className="relative hidden min-w-0 max-w-md flex-1 md:block"
      onSubmit={(e) => {
        e.preventDefault();
        if (!term) return;
        setOpen(false);
        router.push(`${targets[0].href}?q=${encodeURIComponent(term)}`);
      }}
    >
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
        placeholder={`Search ${targets.map((t) => t.label).join(" and ")}…`}
        aria-label="Search the admin"
        aria-controls={listId}
        aria-expanded={open && !!term}
        className="w-full rounded-lg border border-[#cfd4dc] bg-white py-2 pl-9 pr-3 text-sm outline-none transition-[border-color,box-shadow] hover:border-[#aab1bd] focus:border-signal focus:ring-3 focus:ring-signal/20"
      />
      {open && term && (
        <ul id={listId} className="pp-pop absolute left-0 right-0 top-full mt-1 overflow-hidden rounded-xl bg-white py-1 text-sm">
          {targets.map((t) => (
            <li key={t.href}>
              <Link href={`${t.href}?q=${encodeURIComponent(term)}`} onClick={() => setOpen(false)} className="flex items-center gap-2 px-3 py-2 hover:bg-sand focus-visible:bg-sand focus-visible:outline-none">
                <Search aria-hidden className="h-3.5 w-3.5 text-muted" /> Search {t.label} for <strong className="truncate">“{term}”</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}

function UserMenu({ user }: { user: ShellUser }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const role = ROLE_INFO[asRole(user.role)];
  const initials = user.name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase() || "?";

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        className="flex items-center gap-2 rounded-full p-1 pr-1 hover:bg-sand focus-visible:outline-2 focus-visible:outline-signal sm:pr-3"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">{initials}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold">{user.name}</span>
          <span className="text-[11px] text-muted">{role.label}</span>
        </span>
      </button>
      {open && (
        <div id={menuId} role="menu" className="pp-pop absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white p-2 text-sm">
          <div className="px-3 py-2">
            <p className="truncate font-semibold">{user.name}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
            <Badge tone={role.tone} className="mt-2">{role.label}</Badge>
          </div>
          <div className="my-1" />
          <Link role="menuitem" href="/" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sand" onClick={() => setOpen(false)}>
            <ExternalLink aria-hidden className="h-4 w-4 text-muted" /> View site
          </Link>
          <Link role="menuitem" href="/account" className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-sand" onClick={() => setOpen(false)}>
            <User aria-hidden className="h-4 w-4 text-muted" /> My account
          </Link>
          <form action={logout}>
            <button role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted hover:bg-sand">
              <LogOut aria-hidden className="h-4 w-4" /> Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
