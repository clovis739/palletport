import { ArrowLeft, ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";

/** Sizing for icons that sit inline with text: they scale with the surrounding font size. */
export const ic = "inline-block h-[1em] w-[1em] shrink-0 align-[-0.125em]";

/** Trailing "go" arrow for links and cards (nudges right on group hover). */
export function NextIcon({ className = "" }: { className?: string }) {
  return <ArrowRight aria-hidden className={`${ic} ml-1 transition-transform group-hover:translate-x-0.5 ${className}`} />;
}

/** Leading "back" arrow. */
export function PrevIcon({ className = "" }: { className?: string }) {
  return <ArrowLeft aria-hidden className={`${ic} mr-1 ${className}`} />;
}

/** Separator for menu paths, e.g. "Account › Orders". */
export function PathSep() {
  return <ChevronRight aria-hidden className={`${ic} mx-0.5`} />;
}

/** Render any Lucide icon inline with text. */
export function InlineIcon({ icon: Icon, className = "" }: { icon: LucideIcon; className?: string }) {
  return <Icon aria-hidden className={`${ic} ${className}`} />;
}
