"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/i18n/client";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, LogOut, Menu, Search, ShoppingCart, X } from "lucide-react";
import { logout } from "@/app/actions/auth";
import { useSmoothScroll } from "@/components/motion/MotionProvider";

type NavUser = { name: string; label: string; isStaff: boolean; canInbox: boolean } | null;

/** A "Shop" link in the drawer (from the navigation settings: header links, then mobile extras). */
export type MobileLink = { label: string; href: string; children: { label: string; href: string }[] };

const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

/** Hamburger + slide-in drawer used below the lg breakpoint. */
export type MobileGroup = { label: string; links: { label: string; href: string }[] };

export function MobileNav({ user, cartCount, links, categoryGroups = [] }: { user: NavUser; cartCount: number; links: MobileLink[]; /** Categories by department (collapsible). */ categoryGroups?: MobileGroup[] }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // The drawer stays in the DOM while it slides out: `render` = in the DOM, `shown` = slid in.
  const [render, setRender] = useState(false);
  const [shown, setShown] = useState(false);
  // Only one category group is expanded at a time.
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  useEffect(() => {
    if (open) {
      setRender(true);
      const id = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(id);
    }
    setShown(false);
    const t = window.setTimeout(() => setRender(false), 320);
    return () => window.clearTimeout(t);
  }, [open]);
  const pathname = usePathname();
  const { t: tr, lh } = useI18n();

  useEffect(() => setMounted(true), []);
  // Close whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  // Pause smooth scrolling while the drawer is open (no-op when Lenis is off).
  const { lenis } = useSmoothScroll();
  useEffect(() => {
    if (!open || !lenis) return;
    lenis.stop();
    return () => lenis.start();
  }, [open, lenis]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const account: [string, string][] = user
    ? [["/account", "Account"], ["/orders", "Orders"], ["/account/favorites", "Saved lots"], ["/account/referrals", "Refer a business"]].map(([h, l]) => [lh(h), tr(l)])
    : [];
  const link = "flex min-h-11 items-center rounded-lg px-3 py-2 hover:bg-sand";

  const drawer = (
    <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label={tr("Site menu")} data-lenis-prevent>
      <button
        type="button"
        aria-label={tr("Close menu")}
        className={`absolute inset-0 h-full w-full bg-ink/50 transition-opacity duration-300 ease-out motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
        onClick={() => setOpen(false)}
      />
      <div
        className={`absolute inset-y-0 right-0 flex w-[min(22rem,100%)] flex-col overflow-y-auto bg-paper pb-[max(1rem,env(safe-area-inset-bottom))] pt-[env(safe-area-inset-top)] transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] will-change-transform motion-reduce:transition-none ${shown ? "translate-x-0" : "translate-x-full"}`}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest("a")) setOpen(false);
        }}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <span className="font-display text-lg font-bold">{tr("Menu")}</span>
          <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label={tr("Close menu")}>
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 px-4 py-4 text-sm font-medium">
          <LanguageSwitcher variant="menu" />
          <form action={lh("/search")} className="relative" onSubmit={() => setOpen(false)}>
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" type="search" placeholder={tr("Search products, brands, SKUs…")} aria-label={tr("Search lots")} className="input rounded-full bg-white pl-10" />
          </form>

          {user?.isStaff && (
            <div className="grid gap-2">
              <Link href="/dashboard" className="flex min-h-11 items-center gap-2 rounded-lg bg-sand px-3 py-2 font-semibold hover:bg-line">
                <LayoutDashboard aria-hidden className="h-4 w-4" /> {tr("Admin")}
              </Link>
              {user.canInbox && <Link href="/dashboard/inbox" className={link}>{tr("Approvals & inbox")}</Link>}
            </div>
          )}

          <div>
            <p className="label px-3">{tr("Shop")}</p>
            <ul>
              {links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  {isExternal(l.href) ? (
                    <a href={l.href} className={link} {...(/^https?:/i.test(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{l.label}</a>
                  ) : (
                    <Link href={l.href} className={link}>{l.label}</Link>
                  )}
                  {l.children.length > 0 && (
                    <ul className="mb-1 ml-3 pl-2">
                      {l.children.map((c, j) => (
                        <li key={`${c.href}-${j}`}>
                          {isExternal(c.href) ? (
                            <a href={c.href} className={`${link} text-ink/80`} {...(/^https?:/i.test(c.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{c.label}</a>
                          ) : (
                            <Link href={c.href} className={`${link} text-ink/80`}>{c.label}</Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {categoryGroups.length > 0 && (
            <div>
              <p className="label px-3">{tr("Categories")}</p>
              <ul>
                {categoryGroups.map((g) => (
                  <li key={g.label}>
                    {(() => {
                      const isOpen = openGroup === g.label;
                      const id = `mnav-${g.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
                      return (
                        <>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={id}
                            onClick={() => setOpenGroup(isOpen ? null : g.label)}
                            className={`${link} w-full justify-between text-left ${isOpen ? "bg-sand text-signal-dark" : ""}`}
                          >
                            {g.label}
                            <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${isOpen ? "rotate-180 text-signal-dark" : "text-muted"}`} />
                          </button>
                          <div
                            id={id}
                            inert={!isOpen}
                            className={`grid transition-[grid-template-rows,opacity] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                          >
                            <ul className="mb-1 ml-3 overflow-hidden pl-2">
                              {g.links.map((c) => (
                                <li key={c.href}><Link href={c.href} className={`${link} text-ink/80`}>{c.label}</Link></li>
                              ))}
                            </ul>
                          </div>
                        </>
                      );
                    })()}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {user ? (
            <div>
              <p className="label truncate px-3">{user.label}</p>
              <ul>
                {account.map(([href, label]) => (
                  <li key={href}><Link href={href} className={link}>{label}</Link></li>
                ))}
                <li>
                  <Link href={lh("/cart")} className={`${link} gap-2`}>
                    <ShoppingCart aria-hidden className="h-4 w-4" /> {tr("Cart")}{cartCount > 0 ? ` (${cartCount})` : ""}
                  </Link>
                </li>
                <li>
                  <form action={logout}>
                    <button className={`${link} w-full gap-2 text-left text-muted`}><LogOut aria-hidden className="h-4 w-4" /> {tr("Sign out")}</button>
                  </form>
                </li>
              </ul>
            </div>
          ) : (
            <div className="grid gap-2">
              <Link href={lh("/register")} className="btn-dark w-full py-3">{tr("Create account")}</Link>
              <Link href={lh("/login")} className="btn-ghost w-full py-3">{tr("Sign in")}</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid h-10 w-10 place-items-center rounded-full hover:bg-sand lg:hidden"
        aria-label={tr("Open menu")}
        aria-expanded={open}
      >
        <Menu aria-hidden className="h-6 w-6" strokeWidth={1.8} />
      </button>
      {mounted && render && createPortal(drawer, document.body)}
    </>
  );
}
