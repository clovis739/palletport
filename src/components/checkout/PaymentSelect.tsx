"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, Lock } from "lucide-react";
import { PaymentMethodIcon } from "./PaymentMethodIcon";
import type { PaymentIcon } from "@/lib/settings-schema";

export type PaymentOption = { id: string; name: string; description: string; icon: PaymentIcon; logo: string; locked?: boolean; lockedNote?: string };

/**
 * Payment method dropdown with icons (a native <select> can't show logos). ARIA "select-only combobox" pattern:
 * button + listbox; ↑/↓/Home/End move, Enter/Space choose, Esc closes, typing a letter jumps to the next match.
 * Posts the chosen code in a hidden input named `name`.
 */
export function PaymentSelect({ name, options, value, onChange }: { name: string; options: PaymentOption[]; value: string; onChange: (id: string) => void }) {
  const uid = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(() => Math.max(0, options.findIndex((o) => o.id === value)));
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const selected = options.find((o) => o.id === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) list.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  const step = (from: number, dir: 1 | -1) => {
    for (let n = 1; n <= options.length; n++) {
      const i = (from + dir * n + options.length) % options.length;
      if (!options[i].locked) return i;
    }
    return from;
  };
  const choose = (i: number) => {
    const o = options[i];
    if (!o || o.locked) return;
    onChange(o.id);
    setOpen(false);
    button.current?.focus();
  };
  const openList = () => {
    setActive(Math.max(0, options.findIndex((o) => o.id === value)));
    setOpen(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (["ArrowDown", "ArrowUp", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        openList();
      }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => step(a, 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => step(a, -1)); }
    else if (e.key === "Home") { e.preventDefault(); setActive(step(-1, 1)); }
    else if (e.key === "End") { e.preventDefault(); setActive(step(options.length, -1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(active); }
    else if (e.key === "Escape" || e.key === "Tab") { setOpen(false); }
    else if (/^[a-z0-9]$/i.test(e.key)) {
      const k = e.key.toLowerCase();
      const start = active + 1;
      for (let n = 0; n < options.length; n++) {
        const i = (start + n) % options.length;
        if (!options[i].locked && options[i].name.toLowerCase().startsWith(k)) { setActive(i); break; }
      }
    }
  };

  return (
    <div>
      <input type="hidden" name={name} value={selected?.id ?? ""} />
      <span id={`${uid}-label`} className="label">Payment method</span>
      <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={`${uid}-list`}
        aria-labelledby={`${uid}-label ${uid}-value`}
        aria-activedescendant={open ? `${uid}-opt-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
        className="input flex w-full items-center gap-3 py-2.5 text-left focus-visible:outline-2 focus-visible:outline-signal"
      >
        {selected && <PaymentMethodIcon icon={selected.icon} logo={selected.logo} size="sm" />}
        <span id={`${uid}-value`} className="min-w-0 flex-1 truncate font-semibold">{selected?.name ?? "Choose a payment method"}</span>
        <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 text-muted transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <ul
          ref={list}
          id={`${uid}-list`}
          role="listbox"
          aria-labelledby={`${uid}-label`}
          className="absolute inset-x-0 top-full z-30 mt-1 max-h-80 overflow-y-auto overscroll-contain rounded-xl bg-white p-1.5 ring-1 ring-line"
          data-lenis-prevent
        >
          {options.map((o, i) => {
            const isSel = o.id === selected?.id;
            return (
              <li
                key={o.id}
                id={`${uid}-opt-${i}`}
                data-index={i}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.locked || undefined}
                onPointerEnter={() => !o.locked && setActive(i)}
                onClick={() => choose(i)}
                className={`flex min-w-0 items-start gap-3 rounded-lg p-2.5 ${o.locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"} ${i === active && !o.locked ? "bg-sand" : ""}`}
              >
                <PaymentMethodIcon icon={o.icon} logo={o.logo} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">
                    {o.name}
                    {o.locked && <Lock aria-hidden className="h-3.5 w-3.5 text-muted" />}
                  </span>
                  <span className="block text-xs text-muted">{o.locked ? o.lockedNote : o.description}</span>
                </span>
                {isSel && <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-signal-dark" />}
              </li>
            );
          })}
        </ul>
      )}
      </div>
      {selected?.description && <p className="mt-2 text-sm text-muted">{selected.description}</p>}
    </div>
  );
}
