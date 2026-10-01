// Registers GSAP plugins once, in the browser only. Import this module for its side effect
// before using ScrollTrigger / ScrollToPlugin / useGSAP. Import gsap itself straight from the
// "gsap" package in each component (this file must not be named gsap.ts: a local file with the
// same name as the package can be resolved in place of the package and break the imports).
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, ScrollToPlugin, useGSAP);
}

/** gsap.matchMedia query under which motion is allowed. */
export const MOTION_OK = "(prefers-reduced-motion: no-preference)";

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
