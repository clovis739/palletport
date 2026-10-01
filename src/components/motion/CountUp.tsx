"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "./motion-setup";
import { money } from "@/lib/format";

/** Serializable formats, so server components can pass them (functions can't cross the boundary). */
export type CountUpFormat = "number" | "money" | "percent";

const nf = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

function formatValue(v: number, format: CountUpFormat) {
  if (format === "money") return money(Math.round(v)); // value in cents, like money()
  if (format === "percent") return `${Math.round(v)}%`;
  return nf.format(Math.round(v));
}

/**
 * Renders the final formatted value on the server (SEO / no-JS), then counts up from 0 the first
 * time it scrolls into view. Writes straight into React's own text node, so re-renders stay in sync.
 */
export function CountUp({
  value,
  format = "number",
  duration = 1.4,
  className,
}: {
  value: number;
  format?: CountUpFormat;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const final = formatValue(value, format);

  useGSAP(
    () => {
      const text = ref.current?.firstChild;
      if (!ref.current || !text || text.nodeType !== Node.TEXT_NODE || prefersReducedMotion() || value === 0) return;
      const counter = { v: 0 };
      text.nodeValue = formatValue(0, format);
      gsap.to(counter, {
        v: value,
        duration,
        ease: "power2.out",
        onUpdate: () => {
          text.nodeValue = formatValue(counter.v, format);
        },
        onComplete: () => {
          text.nodeValue = final;
        },
        scrollTrigger: { trigger: ref.current, start: "clamp(top 95%)", once: true },
      });
      // No text restore on revert: when `value` changes React writes the new final text itself, and a
      // cleanup write could land after React's and leave a stale number.
    },
    { scope: ref, dependencies: [value, format, duration] },
  );

  return (
    <span ref={ref} className={`tabular-nums${className ? ` ${className}` : ""}`}>
      {final}
    </span>
  );
}
