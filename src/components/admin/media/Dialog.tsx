"use client";

import { useEffect, useId, useRef, useState, type ReactNode, type SyntheticEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE =
  'a[href],area[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),iframe,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';

/**
 * Accessible modal dialog used by the media library drawer and <MediaPicker>.
 * - Rendered in a portal on <body>, so it never sits inside (or submits) a parent <form>; React events are
 *   stopped at the dialog root so parent handlers (block editors, forms) don't react to typing in it.
 * - Focus moves into the dialog (initialFocus or first focusable), Tab is trapped, Esc closes,
 *   focus returns to the element that opened it. The rest of the page is made `inert` and doesn't scroll.
 * variant "center" = large centered panel (full screen on phones); "drawer" = right-hand sheet.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  variant = "center",
  initialFocus,
  headerExtra,
  className = "",
}: {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  variant?: "center" | "drawer";
  initialFocus?: React.RefObject<HTMLElement | null>;
  headerExtra?: ReactNode;
  className?: string;
}) {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Create the portal host when opening.
  useEffect(() => {
    if (!open) return;
    const el = document.createElement("div");
    el.setAttribute("data-media-dialog", "");
    document.body.appendChild(el);
    setHost(el);
    return () => {
      el.remove();
      setHost(null);
    };
  }, [open]);

  // Focus management, inert background, scroll lock.
  useEffect(() => {
    if (!open || !host) return;
    const opener = document.activeElement as HTMLElement | null;
    const siblings = [...document.body.children].filter((c): c is HTMLElement => c !== host && c instanceof HTMLElement && !c.inert);
    siblings.forEach((s) => (s.inert = true));
    const root = document.documentElement;
    const prevOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    const t = requestAnimationFrame(() => {
      const target = initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current;
      target?.focus();
    });
    return () => {
      cancelAnimationFrame(t);
      siblings.forEach((s) => (s.inert = false));
      root.style.overflow = prevOverflow;
      if (opener && document.contains(opener)) opener.focus();
    };
    // initialFocus is a ref: read once on open.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, host]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      if (e.defaultPrevented) return;
      e.preventDefault();
      onCloseRef.current();
      return;
    }
    if (e.key !== "Tab" || !panel.current) return;
    const items = [...panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => el.offsetParent !== null || el === document.activeElement);
    if (!items.length) {
      e.preventDefault();
      panel.current.focus();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === panel.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  if (!open || !host) return null;

  const stop = (e: SyntheticEvent) => e.stopPropagation();
  const drawer = variant === "drawer";

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex"
      onKeyDown={(e) => {
        onKeyDown(e);
        e.stopPropagation();
      }}
      onClick={stop}
      onChange={stop}
      onInput={stop}
      onSubmit={stop}
      onPointerDown={stop}
      onMouseDown={stop}
      onKeyUp={stop}
    >
      <div aria-hidden className="absolute inset-0 bg-ink/50 backdrop-blur-[2px] motion-safe:animate-[pp-fade_.15s_ease-out]" onClick={() => onCloseRef.current()} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        tabIndex={-1}
        data-lenis-prevent
        className={`relative flex min-h-0 flex-col bg-white outline-none ${
 drawer
 ?"ml-auto h-full w-full max-w-lg motion-safe:animate-[pp-slide_.2s_ease-out]"
 :"m-0 h-full w-full sm:m-auto sm:h-[min(88vh,820px)] sm:max-w-4xl sm:rounded-2xl"
 } ${className}`}
      >
        <div className="flex shrink-0 items-start gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="truncate font-display text-base font-bold sm:text-lg">{title}</h2>
            {description && <p id={descId} className="mt-0.5 truncate text-xs text-muted sm:text-sm">{description}</p>}
          </div>
          {headerExtra}
          <button type="button" onClick={() => onCloseRef.current()} aria-label="Close" className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal">
            <X aria-hidden className="h-5 w-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" data-lenis-prevent>
          {children}
        </div>
        {footer && <div className="shrink-0 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">{footer}</div>}
      </div>
      <style>{`@keyframes pp-fade{from{opacity:0}}@keyframes pp-slide{from{transform:translateX(24px);opacity:0}}`}</style>
    </div>,
    host,
  );
}
