"use client";

import Lenis from "lenis";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MOTION_OK, prefersReducedMotion } from "./motion-setup";

/* -------------------------------------------------------------------------------------------------
 * Smooth scrolling (Lenis on native scroll, driven by the GSAP ticker), smooth hash-link scrolling
 * with a sticky-header offset, route-change scroll handling and ScrollTrigger reveals.
 *
 * Inner scroll containers (drawers, dropdown lists, modals, tables) should carry `data-lenis-prevent`
 * so wheel events inside them scroll the container instead of the page.
 * Opt a subtree out of scroll reveals with `data-no-reveal`; opt an element in with `data-reveal`,
 * or stagger a container's children with `data-reveal-stagger`.
 * -----------------------------------------------------------------------------------------------*/

type ScrollTarget = HTMLElement | number | string;
type ScrollOpts = { immediate?: boolean; offset?: number };

type SmoothScrollValue = {
  /** The Lenis instance, or null when smooth scrolling is off (reduced motion, SSR, not mounted). */
  lenis: Lenis | null;
  /** Scroll to an element, a y position or a "#hash"/id, offset for the sticky header. */
  scrollTo: (target: ScrollTarget, opts?: ScrollOpts) => void;
};

const SmoothScrollContext = createContext<SmoothScrollValue>({
  lenis: null,
  scrollTo: (target, opts) => scrollToTarget(null, target, opts),
});

export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/* ------------------------------------------ helpers ------------------------------------------ */

/** Height of the site header while it is actually sticky/fixed (it is static on very short viewports). */
function headerOffset() {
  const header = document.querySelector<HTMLElement>("body > header") ?? document.querySelector<HTMLElement>("header");
  if (!header) return 0;
  const pos = getComputedStyle(header).position;
  return pos === "sticky" || pos === "fixed" ? header.getBoundingClientRect().height : 0;
}

function resolveTarget(target: ScrollTarget): HTMLElement | number | null {
  if (typeof target !== "string") return target;
  let id = target.startsWith("#") ? target.slice(1) : target;
  try {
    id = decodeURIComponent(id);
  } catch {
    /* keep raw id */
  }
  if (id === "" || id === "top") return 0;
  return document.getElementById(id) ?? (document.getElementsByName(id)[0] as HTMLElement | undefined) ?? null;
}

function targetY(el: HTMLElement, extraOffset?: number) {
  // Respect scroll-margin-top (the lot page uses scroll-mt-48 to clear its sticky section nav).
  const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const offset = extraOffset ?? Math.max(margin, headerOffset() + 16);
  return Math.max(0, el.getBoundingClientRect().top + window.scrollY - offset);
}

function focusTarget(el: HTMLElement) {
  if (!el.matches("a[href], button, input, select, textarea, [tabindex]")) el.setAttribute("tabindex", "-1");
  el.focus({ preventScroll: true });
}

function scrollToTarget(lenis: Lenis | null, target: ScrollTarget, opts: ScrollOpts = {}) {
  if (typeof window === "undefined") return false;
  const resolved = resolveTarget(target);
  if (resolved === null) return false;
  const y = typeof resolved === "number" ? resolved : targetY(resolved, opts.offset);
  const immediate = opts.immediate || prefersReducedMotion();

  if (lenis) {
    const distance = Math.abs(y - window.scrollY);
    lenis.scrollTo(y, {
      immediate,
      force: true,
      duration: Math.min(1.4, 0.6 + distance / 5000),
      easing: (t: number) => 1 - Math.pow(1 - t, 4),
    });
  } else if (immediate) {
    window.scrollTo(0, y);
  } else {
    gsap.to(window, { scrollTo: { y, autoKill: true }, duration: 0.8, ease: "power3.inOut", overwrite: true });
  }
  if (typeof resolved !== "number") focusTarget(resolved);
  return true;
}

/* ------------------------------------------ reveals ------------------------------------------ */

const REVEAL_SELECTOR = "[data-reveal], .card, section h2, [data-reveal-stagger] > *";
const REVEAL_EXCLUDE = "header, nav, footer, [role=dialog], [role=listbox], [data-no-reveal]";
const MAX_REVEAL_TARGETS = 150;

/** Candidates below the fold that are safe to hide + reveal. Marks every scanned element as seen. */
function collectRevealTargets(main: HTMLElement, seen: WeakSet<Element>) {
  const fresh = Array.from(main.querySelectorAll<HTMLElement>(REVEAL_SELECTOR)).filter((el) => !seen.has(el));
  fresh.forEach((el) => seen.add(el));
  const candidates = new Set(fresh);
  // Per-scan cache: does this ancestor disqualify its descendants (horizontal scroller, fixed/sticky)?
  const blocked = new Map<Element, boolean>();
  const isBlocking = (node: Element) => {
    let v = blocked.get(node);
    if (v === undefined) {
      const cs = getComputedStyle(node);
      v = cs.overflowX === "auto" || cs.overflowX === "scroll" || cs.position === "fixed" || cs.position === "sticky";
      blocked.set(node, v);
    }
    return v;
  };
  const vh = window.innerHeight;

  return fresh.filter((el) => {
    if (el.closest(REVEAL_EXCLUDE) || gsap.isTweening(el)) return false;
    if (isBlocking(el)) return false;
    for (let p = el.parentElement; p && p !== main; p = p.parentElement) {
      if (candidates.has(p) || isBlocking(p)) return false; // nested in another target / scroller / sticky
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return false; // hidden right now: leave it alone
    return r.top >= vh; // only below the fold; anything visible/above is left untouched
  });
}

/* ------------------------------------------ provider ----------------------------------------- */

export function MotionProvider({ children }: { children: React.ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();
  const prevPath = useRef<string | null>(null);
  const fromPopState = useRef(false);

  // 1) Lenis smooth scrolling on the GSAP ticker. Native scroll underneath, so CSS sticky keeps working.
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      const instance = new Lenis({ lerp: 0.12, smoothWheel: true, syncTouch: false, anchors: false });
      instance.on("scroll", ScrollTrigger.update);
      const tick = (time: number) => instance.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = instance;
      setLenis(instance);
      return () => {
        gsap.ticker.remove(tick);
        gsap.ticker.lagSmoothing(500, 33);
        instance.destroy();
        lenisRef.current = null;
        setLenis(null);
      };
    });
    return () => mm.revert();
  }, []);

  // 2) Same-page hash links (#id, or /current/path#id): smooth scroll with header offset, no jump.
  //    Capture phase on window so we run before next/link's onClick (which bails on defaultPrevented).
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download") || a.hasAttribute("data-no-smooth")) return;
      if (a.target && a.target !== "_self") return;
      const href = a.getAttribute("href") ?? "";
      if (!href.includes("#")) return;
      const url = new URL(a.href, window.location.href);
      const here = window.location;
      if (url.origin !== here.origin || url.pathname !== here.pathname || url.search !== here.search) return;
      if (!scrollToTarget(lenisRef.current, url.hash || "#top")) return; // unknown id: let the browser handle it
      e.preventDefault();
      if (url.hash !== here.hash) window.history.pushState(null, "", url.hash || here.pathname + here.search);
    };
    const onPop = () => {
      // Only flag real route changes; hash-only history entries must not leak into the next navigation.
      fromPopState.current = window.location.pathname !== prevPath.current;
    };
    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
    };
  }, []);

  // 3) Route changes. Layout effect: runs in the same commit as Next's own scroll handler (which lives
  //    below us, so it runs first) and before paint, so there is no visible jump between the two.
  useLayoutEffect(() => {
    if (prevPath.current === null || prevPath.current === pathname) {
      prevPath.current = pathname; // first mount (and the strict-mode re-run) — leave the initial scroll alone
      return;
    }
    prevPath.current = pathname;
    const l = lenisRef.current;

    if (fromPopState.current) {
      // Back/forward: let the browser/Next restore the position; just resync Lenis to it afterwards.
      fromPopState.current = false;
      const id = requestAnimationFrame(() => l?.scrollTo(window.scrollY, { immediate: true, force: true }));
      return () => cancelAnimationFrame(id);
    }

    // Cancel any in-flight smooth scroll so it cannot fight Next's scroll-to-top, then go to top.
    if (l) l.scrollTo(0, { immediate: true, force: true });
    const hash = window.location.hash;
    if (!hash || !l) return; // without Lenis, Next's native hash scroll is already correct

    // Hash on a new route: smooth-scroll to it once it exists (it may still be streaming in).
    let tries = 0;
    let timer = 0;
    const attempt = () => {
      if (scrollToTarget(lenisRef.current, hash) || ++tries > 25) return;
      timer = window.setTimeout(attempt, 120);
    };
    const raf = requestAnimationFrame(attempt);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);

  // 4) Scroll reveals for below-the-fold content, re-scanned as content streams in.
  useEffect(() => {
    const main = document.querySelector("main");
    if (!main) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK, (context: { add: (fn: () => unknown) => unknown }) => {
      const seen = new WeakSet<Element>();
      let scanTimer = 0;
      let refreshTimer = 0;

      const reveal = (batch: Element[]) =>
        context.add(() =>
          gsap.to(batch, {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power3.out",
            stagger: 0.07,
            overwrite: true,
            clearProps: "opacity,transform,transition",
          }),
        );

      const scan = () =>
        context.add(() => {
          const targets = collectRevealTargets(main, seen);
          if (!targets.length || targets.length > MAX_REVEAL_TARGETS) return;
          // Hidden only here, in JS, and only below the fold: no-JS/crawlers always see content.
          // `transition: none` stops Tailwind `transition` classes on cards from fighting the tween.
          gsap.set(targets, { opacity: 0, y: 24, transition: "none" });
          ScrollTrigger.batch(targets, {
            start: "clamp(top 92%)", // clamp: elements near the page end still trigger
            once: true,
            interval: 0.1,
            batchMax: 8,
            onEnter: reveal,
            onEnterBack: reveal,
            onLeave: reveal, // jumped past it (anchor/scrollbar drag): never leave it hidden
          });
        });

      const refreshSoon = (delay = 200) => {
        clearTimeout(refreshTimer);
        refreshTimer = window.setTimeout(() => ScrollTrigger.refresh(), delay);
      };

      scan();
      refreshSoon(600); // after the template's page-enter transition settles

      // Content that streams in (Suspense) or is swapped client-side gets scanned too.
      const mo = new MutationObserver((records) => {
        if (!records.some((r) => Array.from(r.addedNodes).some((n) => n.nodeType === 1))) return;
        clearTimeout(scanTimer);
        scanTimer = window.setTimeout(() => {
          scan();
          refreshSoon();
        }, 120);
      });
      mo.observe(main, { childList: true, subtree: true });

      // Keep trigger positions right as images/fonts change the page height.
      const ro = new ResizeObserver(() => refreshSoon());
      ro.observe(document.body);
      const onLoad = () => ScrollTrigger.refresh();
      if (document.readyState !== "complete") window.addEventListener("load", onLoad, { once: true });

      return () => {
        mo.disconnect();
        ro.disconnect();
        clearTimeout(scanTimer);
        clearTimeout(refreshTimer);
        window.removeEventListener("load", onLoad);
      };
    });

    // Reverts every gsap.set (content visible again), kills the batch ScrollTriggers and tweens.
    return () => mm.revert();
  }, [pathname]);

  const value = useMemo<SmoothScrollValue>(
    () => ({ lenis, scrollTo: (target, opts) => void scrollToTarget(lenis, target, opts) }),
    [lenis],
  );

  return <SmoothScrollContext.Provider value={value}>{children}</SmoothScrollContext.Provider>;
}
