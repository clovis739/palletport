"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/**
 * Two-step inline confirmation for destructive submits (replaces window.confirm). Place inside a <form>
 * bound to a server action; the first click reveals "Confirm / Cancel", the second submits.
 *
 *   <form action={deleteLot}>
 *     <input type="hidden" name="id" value={lot.id} />
 *     <ConfirmButton confirmLabel="Delete lot">Delete</ConfirmButton>
 *   </form>
 *
 * Use `formAction` to target a different action than the form's, and `name`/`value` to submit a value.
 */
export function ConfirmButton({
  children,
  confirmLabel = "Yes, I'm sure",
  prompt = "Are you sure?",
  className = "btn-ghost text-rust",
  confirmClassName = "inline-flex items-center justify-center rounded-full bg-rust px-4 py-2 text-sm font-semibold text-white hover:bg-rust/90 disabled:opacity-60",
  formAction,
  name,
  value,
  timeoutMs = 6000,
}: {
  children: ReactNode;
  confirmLabel?: ReactNode;
  prompt?: ReactNode;
  className?: string;
  confirmClassName?: string;
  formAction?: (formData: FormData) => void | Promise<void>;
  name?: string;
  value?: string;
  timeoutMs?: number;
}) {
  const [armed, setArmed] = useState(false);
  const { pending } = useFormStatus();
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!armed) return;
    confirmRef.current?.focus();
    const t = setTimeout(() => setArmed(false), timeoutMs);
    return () => clearTimeout(t);
  }, [armed, timeoutMs]);

  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {children}
      </button>
    );
  }
  return (
    <span className="inline-flex flex-wrap items-center gap-2" role="group" aria-live="polite">
      <span className="text-sm font-medium text-rust">{prompt}</span>
      <button ref={confirmRef} type="submit" formAction={formAction} name={name} value={value} disabled={pending} className={confirmClassName}>
        {pending ? "Working…" : confirmLabel}
      </button>
      <button type="button" className="rounded-full px-3 py-2 text-sm font-semibold text-muted hover:bg-sand" onClick={() => setArmed(false)} disabled={pending}>
        Cancel
      </button>
    </span>
  );
}
