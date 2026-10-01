"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "@/components/motion/motion-setup";

// True until the very first template mount has committed. Flipped in a rAF (cancelled on cleanup)
// so React strict mode's mount → unmount → mount still counts as the first load.
let firstLoad = true;

const INTRO_FALLBACK = "h1, p, form, .btn-primary, .btn-dark, .btn-ghost";

/** Hero elements for the first-load intro: `[data-hero] > *`, else the first section's text/CTAs. */
function introTargets(root: HTMLElement): HTMLElement[] {
  const hero = root.querySelector<HTMLElement>("[data-hero]");
  let els: HTMLElement[];
  if (hero) {
    els = Array.from(hero.children) as HTMLElement[];
  } else {
    const section = root.querySelector("section");
    if (!section) return [];
    const found = Array.from(section.querySelectorAll<HTMLElement>(INTRO_FALLBACK));
    const set = new Set(found);
    // Drop matches nested in another match (e.g. a button inside the form) so nothing animates twice.
    els = found.filter((el) => {
      for (let p = el.parentElement; p && p !== section; p = p.parentElement) if (set.has(p)) return false;
      return true;
    });
  }
  const vh = window.innerHeight;
  return els
    .filter((el) => {
      const r = el.getBoundingClientRect();
      return r.height > 0 && r.top < vh && r.bottom > 0;
    })
    .slice(0, 8);
}

/**
 * Re-mounts on every navigation (App Router template). Page-enter fade on navigation, hero intro on
 * first load. Renders children untouched for SSR; all "from" states are applied by GSAP in a layout
 * effect (before paint) and cleared afterwards, so nothing depends on JS to become visible.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const root = ref.current;
      if (!root) return;
      const isFirst = firstLoad;
      const raf = requestAnimationFrame(() => {
        firstLoad = false;
      });
      if (prefersReducedMotion()) return () => cancelAnimationFrame(raf);

      if (isFirst) {
        // SSR HTML has already painted by hydration time; only run the intro if hydration was quick and
        // the visitor is still at the top, otherwise hiding + re-showing the hero would read as a flicker.
        if (performance.now() < 2500 && window.scrollY < 40) {
          const targets = introTargets(root);
          if (targets.length) {
            gsap.from(targets, {
              opacity: 0,
              y: 18,
              duration: 0.7,
              ease: "power3.out",
              stagger: 0.08,
              delay: 0.05,
              clearProps: "opacity,transform",
            });
          }
        }
      } else {
        // Navigation: fade the page in, and nudge its top-level blocks up. The transform goes on the
        // children (not this wrapper) and skips fixed/sticky ones, so position: fixed descendants such as
        // the loading bar are never re-parented to a transformed containing block.
        gsap.from(root, { opacity: 0, duration: 0.45, ease: "power3.out", clearProps: "opacity" });
        const blocks = (Array.from(root.children) as HTMLElement[]).filter((el) => {
          const pos = getComputedStyle(el).position;
          return pos !== "fixed" && pos !== "sticky";
        });
        if (blocks.length) {
          gsap.from(blocks, { y: 12, duration: 0.45, ease: "power3.out", clearProps: "transform" });
        }
      }
      return () => cancelAnimationFrame(raf);
    },
    { scope: ref },
  );

  return <div ref={ref}>{children}</div>;
}
