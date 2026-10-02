"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Boxes, MessageCircle, Shirt, X } from "lucide-react";
import { WHATSAPP_GROUPS, WHATSAPP_POPUP_DELAY_S, WHATSAPP_POPUP_QUIET_PATHS } from "@/content/whatsappGroups";

const STORAGE_KEY = "pp-wa-groups";
const WA_GREEN = "#25D366";

function readDismissed() {
  try {
    return localStorage.getItem(STORAGE_KEY) === "dismissed";
  } catch {
    return false;
  }
}
function saveDismissed() {
  try {
    localStorage.setItem(STORAGE_KEY, "dismissed");
  } catch {
    /* private mode: the bar still shows for this visit */
  }
}

/**
 * "Join our WhatsApp groups" prompt.
 * - First visit: a dialog opens after a few seconds (not on cart, checkout, sign-in or account pages).
 * - Closing it (×, Not now, Esc, or clicking outside) is remembered on this device; from then on a slim bar
 *   above the header offers "Join" and reopens the dialog.
 * Storefront only (rendered inside HideOnAdmin in the root layout).
 */
export function WhatsAppGroups() {
  const path = usePathname() ?? "";
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(false); // drives the enter/leave animation
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);

  useEffect(() => {
    setMounted(true);
    setDismissed(readDismissed());
  }, []);

  // First-time visitors: open after a short delay, unless they're mid-purchase or signing in.
  useEffect(() => {
    if (!mounted || dismissed || open) return;
    if (WHATSAPP_POPUP_QUIET_PATHS.some((p) => path === p || path.startsWith(`${p}/`))) return;
    const t = window.setTimeout(() => openDialog(), WHATSAPP_POPUP_DELAY_S * 1000);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, dismissed, path]);

  const openDialog = useCallback(() => {
    returnFocus.current = document.activeElement as HTMLElement | null;
    setOpen(true);
    requestAnimationFrame(() => setShown(true));
  }, []);

  const close = useCallback(() => {
    setShown(false);
    saveDismissed();
    setDismissed(true);
    window.setTimeout(() => {
      setOpen(false);
      returnFocus.current?.focus?.();
    }, 220);
  }, []);

  // While open: lock page scroll, Esc closes, Tab stays inside the dialog.
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.documentElement.classList.add("pp-modal-open");
    dialogRef.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "Tab" && dialogRef.current) {
        const items = [...dialogRef.current.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")];
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      document.documentElement.classList.remove("pp-modal-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  if (!mounted) return null;

  return (
    <>
      {dismissed && (
        <div className="bg-ink text-white">
          <div className="container-pp flex min-h-10 items-center justify-center gap-3 py-1.5 text-xs sm:text-sm">
            <span aria-hidden className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ backgroundColor: WA_GREEN }}>
              <MessageCircle className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
            </span>
            <p className="min-w-0 truncate">
              <span className="font-semibold">Join our WhatsApp groups</span>
              <span className="hidden text-white/70 sm:inline"> · new lots and private deals first</span>
            </p>
            <button
              type="button"
              onClick={openDialog}
              className="inline-flex h-7 shrink-0 items-center rounded-full bg-signal px-3 text-xs font-semibold text-white transition-colors hover:bg-signal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              Join
            </button>
          </div>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-[75] flex items-end justify-center sm:items-center sm:p-6" data-lenis-prevent>
          <button
            type="button"
            aria-label="Close"
            tabIndex={-1}
            onClick={close}
            className={`absolute inset-0 h-full w-full cursor-default bg-ink/60 transition-opacity duration-200 motion-reduce:transition-none ${shown ? "opacity-100" : "opacity-0"}`}
          />
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="wa-groups-title"
            aria-describedby="wa-groups-desc"
            className={`relative max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-2xl bg-white pb-[env(safe-area-inset-bottom)] transition-[transform,opacity] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:max-w-md sm:rounded-2xl ${
              shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-6 opacity-0 sm:translate-y-2 sm:scale-[0.98]"
            }`}
          >
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              data-autofocus
              className="absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
            >
              <X aria-hidden className="h-5 w-5" />
            </button>

            <div className="px-5 pb-2 pt-6 sm:px-6 sm:pt-7">
              <span aria-hidden className="grid h-12 w-12 place-items-center rounded-2xl" style={{ backgroundColor: `${WA_GREEN}1f` }}>
                <MessageCircle className="h-6 w-6" style={{ color: "#128C7E" }} strokeWidth={2.25} />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted">WhatsApp groups</p>
              <h2 id="wa-groups-title" className="mt-1 pr-8 font-display text-2xl font-bold leading-tight">
                Join our WhatsApp groups
              </h2>
              <p id="wa-groups-desc" className="mt-2 text-sm leading-relaxed text-ink/75">
                The best way to stay in touch. New lots are posted here before anywhere else, including private deals you won&apos;t find on the site.
              </p>
            </div>

            <ul className="space-y-3 px-5 py-4 sm:px-6">
              {WHATSAPP_GROUPS.map((g) => {
                const Icon = g.icon === "fashion" ? Shirt : Boxes;
                return (
                  <li key={g.id} className="flex items-center gap-3 rounded-xl bg-sand p-3 sm:p-4">
                    <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-white text-ink">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-sm font-bold sm:text-base">{g.title}</p>
                      <p className="text-xs text-muted sm:text-sm">{g.subtitle}</p>
                    </div>
                    <a
                      href={g.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        saveDismissed();
                        setDismissed(true);
                      }}
                      aria-label={`Join the ${g.title} WhatsApp group (opens WhatsApp)`}
                      className="btn-primary shrink-0 px-4 py-2"
                    >
                      Join <ArrowUpRight aria-hidden className="h-4 w-4" />
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center justify-between gap-3 px-5 pb-5 pt-1 sm:px-6 sm:pb-6">
              <p className="text-xs text-muted">Free to join. Leave any time.</p>
              <button type="button" onClick={close} className="rounded-full px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal">
                Not now
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
