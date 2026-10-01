"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

type L = { label: string; href: string };

export const isExternalHref = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

/** Link that uses next/link for internal paths and a plain <a> (new tab for http) for external ones. */
export function SmartLink({ href, className, children, onClick }: { href: string; className?: string; children: React.ReactNode; onClick?: () => void }) {
  if (isExternalHref(href)) {
    const http = /^https?:/i.test(href);
    return (
      <a href={href} className={className} onClick={onClick} {...(http ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}

/**
 * Header quick link with a dropdown of child links. The header strip scrolls horizontally, so the panel is
 * portalled and positioned under the button (fixed) instead of being clipped by the strip.
 */
export type LinkGroup = { label: string; links: (L & { note?: string })[] };

export function NavDropdown({
  item,
  childLinks,
  className,
  allLabel,
  showAll = true,
  groups,
}: {
  item: L;
  childLinks: L[];
  className: string;
  /** Text for the first ("see everything") link; defaults to "All <label>". */
  allLabel?: string;
  /** Set false to list only the child links. */
  showAll?: boolean;
  /** Mega-menu mode: links in titled columns (e.g. categories by department). `childLinks` is ignored. */
  groups?: LinkGroup[];
}) {
  const mega = !!groups?.length;
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number; width: number } | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const id = useId();
  const pathname = usePathname();
  // Hover (mouse / pen): open right away on enter, close shortly after leaving both the button and the panel
  // (the short delay lets the pointer cross the gap between them). Touch and keyboard keep click / Enter.
  const closeTimer = useRef<number | null>(null);
  const hoverOpened = useRef(false);
  const cancelClose = () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
  };
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    cancelClose();
    if (!open) {
      hoverOpened.current = true;
      place();
      setOpen(true);
    }
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType === "touch") return;
    cancelClose();
    closeTimer.current = window.setTimeout(() => {
      setOpen(false);
      hoverOpened.current = false;
    }, 180);
  };
  useEffect(() => cancelClose, []);

  const place = useCallback(() => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const vw = document.documentElement.clientWidth;
    const w = Math.min(mega ? 1040 : 256, vw - 16);
    // The mega menu is centred under the button (clamped to the viewport); the small list aligns to its left edge.
    const left = mega ? r.left + r.width / 2 - w / 2 : r.left;
    // Width comes from JS (clientWidth excludes the scrollbar, unlike 100vw), so the panel never slides under it.
    setPos({ left: Math.max(8, Math.min(left, vw - w - 8)), top: r.bottom + 6, width: w });
  }, [mega]);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) hoverOpened.current = false;
  }, [open]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    const onMove = (e: Event) => {
      if (e.target instanceof Node && panel.current?.contains(e.target)) return;
      place();
    };
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!btn.current?.contains(t) && !panel.current?.contains(t)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btn.current?.focus();
      }
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    document.addEventListener("pointerdown", onDown, true);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
      document.removeEventListener("pointerdown", onDown, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, place]);

  const focusItem = (dir: 1 | -1 | "first") => {
    const links = Array.from(panel.current?.querySelectorAll<HTMLAnchorElement>("a") ?? []);
    if (!links.length) return;
    const i = links.indexOf(document.activeElement as HTMLAnchorElement);
    const next = dir === "first" ? 0 : (i + dir + links.length) % links.length;
    links[next]?.focus();
  };

  const links: L[] = showAll ? [item, ...childLinks] : childLinks;
  return (
    <>
      <button
        ref={btn}
        type="button"
        className={`${className} inline-flex items-center gap-1 ${open && !/\bbg-ink\b/.test(className) ? "bg-sand text-signal-dark" : ""}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        data-open={open || undefined}
        onPointerEnter={hoverOpen}
        onPointerLeave={hoverClose}
        onClick={() => {
          // A click right after hover-opening keeps the menu open instead of toggling it shut.
          if (hoverOpened.current) {
            hoverOpened.current = false;
            setOpen(true);
            return;
          }
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setOpen(true);
            requestAnimationFrame(() => focusItem("first"));
          }
        }}
      >
        {item.label}
        <ChevronDown aria-hidden className={`h-3.5 w-3.5 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open &&
        pos &&
        createPortal(
          <div
            ref={panel}
            id={id}
            className={`pp-pop pp-pop-in fixed z-[55] overflow-y-auto overscroll-contain rounded-xl bg-white text-sm ${mega ? "max-h-[min(80vh,40rem)] p-4" : "max-h-[min(70vh,28rem)] p-1.5"}`}
            data-lenis-prevent=""
            style={{ left: pos.left, top: pos.top, width: pos.width }}
            onPointerEnter={(e) => e.pointerType !== "touch" && cancelClose()}
            onPointerLeave={hoverClose}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown" || e.key === "ArrowUp") {
                e.preventDefault();
                focusItem(e.key === "ArrowDown" ? 1 : -1);
              } else if (e.key === "Tab") setOpen(false);
            }}
          >
            {mega ? (
              <>
                <div className="grid grid-cols-2 gap-x-6 gap-y-5 md:grid-cols-3 xl:grid-cols-6">
                  {groups!.map((g) => (
                    <div key={g.label} className="min-w-0">
                      <p className="mb-1.5 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.label}</p>
                      <ul>
                        {g.links.map((l) => (
                          <li key={l.href}>
                            <SmartLink href={l.href} onClick={() => setOpen(false)} className="flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-sand hover:text-signal-dark focus-visible:bg-sand focus-visible:outline-none">
                              <span className="min-w-0 whitespace-normal font-medium">{l.label}</span>
                              {l.note && <span className="shrink-0 text-[11px] tabular-nums text-muted">{l.note}</span>}
                            </SmartLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
                {showAll && (
                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-sand px-3 py-2.5">
                    <span className="text-xs text-muted">Every lot, organised by what&apos;s inside.</span>
                    <SmartLink href={item.href} onClick={() => setOpen(false)} className="text-sm font-semibold text-signal-dark hover:underline focus-visible:underline focus-visible:outline-none">
                      {allLabel ?? `All ${item.label.toLowerCase()}`} →
                    </SmartLink>
                  </div>
                )}
              </>
            ) : (
            <ul>
              {links.map((l, i) => (
                <li key={`${l.href}-${i}`}>
                  <SmartLink href={l.href} onClick={() => setOpen(false)} className={`block rounded-lg px-3 py-2 hover:bg-sand focus-visible:bg-sand focus-visible:outline-none ${showAll && i === 0 ? "font-semibold" : ""}`}>
                    {showAll && i === 0 ? allLabel ?? `All ${l.label.toLowerCase()}` : l.label}
                  </SmartLink>
                </li>
              ))}
            </ul>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
