"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { prefersReducedMotion } from "./motion-setup";

type RevealProps = {
  as?: React.ElementType;
  delay?: number;
  y?: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * Fades/slides its content in when scrolled into view. Content that is already on screen at mount is
 * left alone (the page transition covers it), and nothing is hidden before JS runs.
 * Marked `data-no-reveal` so MotionProvider's global reveals don't animate this subtree twice.
 */
export function Reveal({ as: Tag = "div", delay = 0, y = 24, className, children }: RevealProps) {
  const ref = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || prefersReducedMotion()) return;
      if (el.getBoundingClientRect().top < window.innerHeight) return;
      gsap.set(el, { opacity: 0, y });
      gsap.to(el, {
        opacity: 1,
        y: 0,
        delay,
        duration: 0.7,
        ease: "power3.out",
        clearProps: "opacity,transform",
        scrollTrigger: { trigger: el, start: "clamp(top 92%)", once: true },
      });
    },
    { scope: ref, dependencies: [delay, y] },
  );

  return (
    <Tag ref={ref} className={className} data-no-reveal="">
      {children}
    </Tag>
  );
}
