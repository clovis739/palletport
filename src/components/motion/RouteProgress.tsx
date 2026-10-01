"use client";

import { Suspense, useCallback, useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gsap } from "gsap";
import "./motion-setup";

const SAFETY_MS = 10_000;

/** Normalized "path?query" key, identical whether built from location or useSearchParams. */
const keyOf = (pathname: string, search: string) => {
  const q = new URLSearchParams(search).toString();
  return q ? `${pathname}?${q}` : pathname;
};
const locationKey = () => keyOf(window.location.pathname, window.location.search);

/**
 * 3px signal-colored route progress bar. Starts on internal link clicks to a different path/search
 * and on back/forward, creeps toward ~85%, and completes when the URL actually changes.
 * Opt a link out with `data-no-progress`.
 */
export function RouteProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const tl = useRef<ReturnType<typeof gsap.timeline> | null>(null);
  const active = useRef(false);
  const safety = useRef(0);
  const currentKey = useRef<string>("");

  const finish = useCallback(() => {
    const bar = barRef.current;
    clearTimeout(safety.current);
    if (!bar || !active.current) return;
    active.current = false;
    tl.current?.kill();
    tl.current = gsap
      .timeline()
      .to(bar, { scaleX: 1, duration: 0.2, ease: "power2.out" })
      .to(bar, { opacity: 0, duration: 0.3, ease: "power1.out" }, "+=0.05")
      .set(bar, { scaleX: 0 });
  }, []);

  const start = useCallback(() => {
    const bar = barRef.current;
    if (!bar) return;
    active.current = true;
    tl.current?.kill();
    tl.current = gsap
      .timeline()
      .set(bar, { scaleX: 0, opacity: 1 })
      .to(bar, { scaleX: 0.3, duration: 0.3, ease: "power2.out" })
      .to(bar, { scaleX: 0.6, duration: 1.5, ease: "power1.out" })
      .to(bar, { scaleX: 0.85, duration: 8, ease: "power1.out" });
    clearTimeout(safety.current);
    safety.current = window.setTimeout(finish, SAFETY_MS);
  }, [finish]);

  useEffect(() => {
    currentKey.current = locationKey();

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.hasAttribute("download") || a.hasAttribute("data-no-progress")) return;
      if (a.target && a.target !== "_self") return;
      const url = new URL(a.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname.startsWith("/api/")) return; // file downloads / route handlers: no client navigation
      if (keyOf(url.pathname, url.search) === locationKey()) return; // hash-only / same page
      start();
    };
    const onPop = () => {
      // Location is already updated here; ignore hash-only history entries.
      if (locationKey() !== currentKey.current) start();
    };

    window.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPop);
      clearTimeout(safety.current);
      tl.current?.kill();
    };
  }, [start]);

  const onRouteChange = useCallback(
    (key: string) => {
      if (key === currentKey.current) return;
      currentKey.current = key;
      finish();
    },
    [finish],
  );

  return (
    <>
      <div
        ref={barRef}
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px] origin-left bg-signal"
        style={{ transform: "scaleX(0)", opacity: 0 }}
      />
      {/* useSearchParams needs a Suspense boundary; isolating it here keeps static pages static. */}
      <Suspense fallback={null}>
        <RouteWatcher onChange={onRouteChange} />
      </Suspense>
    </>
  );
}

function RouteWatcher({ onChange }: { onChange: (key: string) => void }) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  useEffect(() => {
    onChange(keyOf(pathname, search));
  }, [pathname, search, onChange]);
  return null;
}
