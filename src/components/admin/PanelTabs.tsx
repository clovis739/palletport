"use client";

import { useId, useState, type KeyboardEvent, type ReactNode } from "react";

/**
 * In-page tabs (client) with ARIA tabs pattern and arrow-key navigation. Inactive panels stay mounted
 * (hidden), so form fields inside every tab are still submitted.
 *
 *   <PanelTabs tabs={[{ id: "content", label: "Content", panel: <…/> }, { id: "seo", label: "SEO", panel: <…/> }]} />
 */
export function PanelTabs({ tabs, initial, className = "" }: { tabs: { id: string; label: ReactNode; panel: ReactNode }[]; initial?: string; className?: string }) {
  const [active, setActive] = useState(initial ?? tabs[0]?.id);
  const base = useId();
  const onKey = (e: KeyboardEvent, i: number) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setActive(next.id);
    document.getElementById(`${base}-tab-${next.id}`)?.focus();
  };
  return (
    <div className={className}>
      <div role="tablist" className="mb-4 flex gap-1 overflow-x-auto [scrollbar-width:none]">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`${base}-tab-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`${base}-panel-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-signal ${active === t.id ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"}`}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div key={t.id} id={`${base}-panel-${t.id}`} role="tabpanel" aria-labelledby={`${base}-tab-${t.id}`} hidden={active !== t.id}>
          {t.panel}
        </div>
      ))}
    </div>
  );
}
