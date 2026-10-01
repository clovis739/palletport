"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

/**
 * Copies `text` to the clipboard. `<CopyButton text={email} label="Copy email" />`
 * Falls back to selecting a hidden textarea when the Clipboard API is unavailable.
 */
export function CopyButton({ text, label = "Copy", className = "", showLabel = false }: { text: string; label?: string; className?: string; showLabel?: boolean }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
    setDone(true);
    setTimeout(() => setDone(false), 1800);
  };
  const Icon = done ? Check : Copy;
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={showLabel ? undefined : label}
      title={label}
      className={`inline-flex min-h-8 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-muted hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal ${className}`}
    >
      <Icon aria-hidden className={`h-3.5 w-3.5 ${done ? "text-moss" : ""}`} />
      {showLabel && <span>{done ? "Copied" : label}</span>}
      <span className="sr-only" aria-live="polite">{done ? "Copied" : ""}</span>
    </button>
  );
}
