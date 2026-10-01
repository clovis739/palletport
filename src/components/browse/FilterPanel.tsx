"use client";

import { useState } from "react";
import { ChevronDown, SlidersHorizontal } from "lucide-react";

/**
 * Collapsible wrapper for the browse filters. Below lg the filters sit behind a toggle so
 * results show first; from lg up they are always visible as a sidebar.
 */
export function FilterPanel({ activeCount, children }: { activeCount: number; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <aside className="min-w-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="lot-filters"
        className="flex min-h-11 w-full items-center justify-between gap-3 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold lg:hidden"
      >
        <span className="inline-flex items-center gap-2">
          <SlidersHorizontal aria-hidden className="h-4 w-4" />
          Filters
          {activeCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1.5 text-[11px] font-bold text-white">{activeCount}</span>}
        </span>
        <ChevronDown aria-hidden className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div id="lot-filters" className={`${open ?"mt-4 block rounded-xl bg-white p-4":"hidden"} space-y-6 lg:mt-0 lg:block lg:bg-transparent lg:p-0`}>
        {children}
      </div>
    </aside>
  );
}
