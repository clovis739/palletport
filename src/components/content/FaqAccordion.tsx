"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export type Faq = { q: string; a: string };
/** Items may also be rich content (e.g. content blocks with links); JSON-LD uses the plain-text Faq type. */
export type FaqItem = { q: ReactNode; a: ReactNode };

/**
 * FAQ accordion with a smooth height + fade transition (CSS grid rows 0fr → 1fr, so no JS measuring).
 * Answers stay in the server-rendered HTML while collapsed (search engines and Ctrl+F still see them);
 * collapsed answers are `inert` so keyboard and screen-reader users only reach open ones.
 * Only one answer is open at a time: opening a question closes the one that was open (both animate together).
 */
export function FaqAccordion({ items, defaultOpen = 0, className = "mt-5" }: { items: FaqItem[]; defaultOpen?: number | null; className?: string }) {
  const base = useId();
  const [open, setOpen] = useState<number | null>(defaultOpen);
  const toggle = (i: number) => setOpen((prev) => (prev === i ? null : i));

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((f, i) => {
        const isOpen = open === i;
        const btn = `${base}-q${i}`;
        const panel = `${base}-a${i}`;
        return (
          <div
            key={i}
            className={`rounded-2xl transition-colors duration-300 ${isOpen ? "bg-signal/10" : "bg-sand hover:bg-signal/5"}`}
          >
            <h3 className="m-0">
              <button
                type="button"
                id={btn}
                aria-expanded={isOpen}
                aria-controls={panel}
                onClick={() => toggle(i)}
                className="flex min-h-14 w-full cursor-pointer items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal sm:px-5"
              >
                <span className="min-w-0 break-words">{f.q}</span>
                <span
                  aria-hidden
                  className={`grid h-8 w-8 shrink-0 place-items-center rounded-full transition-[transform,background-color,color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                    isOpen ? "rotate-180 bg-signal text-white" : "bg-white text-signal-dark"
                  }`}
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </button>
            </h3>
            <div
              id={panel}
              role="region"
              aria-labelledby={btn}
              inert={!isOpen}
              className={`grid transition-[grid-template-rows,opacity] duration-400 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
              }`}
            >
              <div className="overflow-hidden">
                <div
                  className={`px-4 pb-5 text-sm leading-relaxed text-ink/80 transition-transform duration-400 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none sm:px-5 sm:text-base ${
                    isOpen ? "translate-y-0" : "-translate-y-2"
                  }`}
                >
                  {f.a}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
