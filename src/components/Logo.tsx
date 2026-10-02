"use client";

import { useBrand } from "./BrandProvider";

/**
 * Header/footer logo: the pallet mark + the business name (Admin → Site settings → Business profile).
 * The "accent" part of the name (e.g. "Port") is shown in orange. Pass name/accent to preview unsaved values.
 */
export function Logo({ className = "", name, accent }: { className?: string; name?: string; accent?: string }) {
  const brand = useBrand();
  const text = (name ?? brand.name).trim() || "PalletPort";
  const acc = (accent ?? brand.accent).trim();
  const i = acc ? text.lastIndexOf(acc) : -1;
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
        <rect x="4" y="4" width="11" height="10" rx="1.5" fill="currentColor" />
        <rect x="17" y="4" width="11" height="10" rx="1.5" fill="#f0641e" />
        <rect x="4" y="16" width="24" height="5" rx="1.5" fill="currentColor" />
        <rect x="5" y="23" width="4" height="5" fill="currentColor" />
        <rect x="14" y="23" width="4" height="5" fill="currentColor" />
        <rect x="23" y="23" width="4" height="5" fill="currentColor" />
      </svg>
      <span className="font-display text-xl font-bold tracking-tight">
        {i >= 0 ? (
          <>
            {text.slice(0, i)}
            <span className="text-signal">{acc}</span>
            {text.slice(i + acc.length)}
          </>
        ) : (
          text
        )}
      </span>
    </span>
  );
}
