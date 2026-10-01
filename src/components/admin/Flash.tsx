"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { FLASH_PARAM, FLASH_TONE_PARAM, type FlashTone } from "./flashUrl";

const TONE: Record<FlashTone, { cls: string; icon: typeof Info }> = {
  success: { cls: "border-moss/30 bg-white text-moss", icon: CheckCircle2 },
  error: { cls: "border-rust/30 bg-white text-rust", icon: AlertCircle },
  info: { cls: "bg-white text-ink", icon: Info },
};

/** Floating toast. Controlled: render it when you have a message; it calls onClose after `duration`. */
export function Toast({ message, tone = "success", onClose, duration = 5000 }: { message: string; tone?: FlashTone; onClose: () => void; duration?: number }) {
  useEffect(() => {
    const t = setTimeout(onClose, duration);
    return () => clearTimeout(t);
  }, [message, duration, onClose]);
  const { cls, icon: Icon } = TONE[tone];
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:justify-end sm:px-6">
      <div role={tone === "error" ? "alert" : "status"} className={`pointer-events-auto flex max-w-md items-start gap-3 rounded-xl px-4 py-3 text-sm font-medium ${cls}`}>
        <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
        <p className="min-w-0 flex-1 text-ink">{message}</p>
        <button type="button" onClick={onClose} aria-label="Dismiss" className="-m-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-sand">
          <X aria-hidden className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

/** Shows `?flash=` messages set with withFlash() and removes them from the URL. Mounted once by the shell. */
export function FlashToast() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<{ text: string; tone: FlashTone } | null>(null);

  useEffect(() => {
    const text = params.get(FLASH_PARAM);
    if (!text) return;
    const t = params.get(FLASH_TONE_PARAM);
    setMsg({ text, tone: t === "error" || t === "info" ? t : "success" });
    const rest = new URLSearchParams(params.toString());
    rest.delete(FLASH_PARAM);
    rest.delete(FLASH_TONE_PARAM);
    const qs = rest.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
  }, [params, pathname, router]);

  return msg ? <Toast message={msg.text} tone={msg.tone} onClose={() => setMsg(null)} /> : null;
}

/**
 * Inline result of a useActionState form: `<ActionMessage state={state} />` where state is
 * `{ error?: string; ok?: string } | undefined`.
 */
export function ActionMessage({ state, className = "" }: { state: { error?: string; ok?: string } | undefined | null; className?: string }) {
  if (!state?.error && !state?.ok) return null;
  return state.error ? (
    <p role="alert" className={`flex items-start gap-2 rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust ${className}`}>
      <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> {state.error}
    </p>
  ) : (
    <p role="status" className={`flex items-start gap-2 rounded-lg bg-moss/10 p-3 text-sm font-medium text-moss ${className}`}>
      <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" /> {state.ok}
    </p>
  );
}
