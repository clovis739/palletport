"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { useT } from "@/i18n/client";

/** Read-only referral link with a Copy button (falls back to selecting the text). */
export function CopyLink({ value }: { value: string }) {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const copy = async (input: HTMLInputElement | null) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      input?.select();
    }
  };
  return (
    <div className="mt-4 flex gap-2">
      <input id="ref-link" readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="w-full min-w-0 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm" aria-label={t("Your referral link")} />
      <button type="button" onClick={(e) => copy(e.currentTarget.previousElementSibling as HTMLInputElement)} className="btn-primary shrink-0 py-2.5" aria-live="polite">
        {copied ? <><Check aria-hidden className="h-4 w-4" /> {t("Copied")}</> : <><Copy aria-hidden className="h-4 w-4" /> {t("Copy")}</>}
      </button>
    </div>
  );
}
