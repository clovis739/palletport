"use client";

import { useActionState, useState } from "react";
import { SubmitButton } from "@/components/SubmitButton";

type State = { error?: string; ok?: string } | undefined;

/**
 * Generic client wrapper so server pages can render forms bound to a server action
 * with inline error/success messages, without writing a client component per form.
 */
export function ActionForm({
  action,
  children,
  submitLabel,
  submitClass = "btn-primary",
  successText,
  className = "space-y-4",
  resetOnSuccess = false,
}: {
  action: (state: State, formData: FormData) => Promise<State>;
  children: React.ReactNode;
  submitLabel: string;
  submitClass?: string;
  successText?: string;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [okCount, setOkCount] = useState(0);
  const [state, formAction] = useActionState(async (prev: State, fd: FormData) => {
    const result = await action(prev, fd);
    if (!result?.error) setOkCount((n) => n + 1);
    return result;
  }, undefined);
  const success = okCount > 0 && state && !state.error ? state.ok ?? successText : undefined;
  return (
    <form action={formAction} className={className} key={resetOnSuccess ? okCount : 0}>
      {children}
      {state?.error && <p className="rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}
      {success && <p className="rounded-lg bg-moss/10 p-3 text-sm font-medium text-moss">{success}</p>}
      <SubmitButton className={submitClass}>{submitLabel}</SubmitButton>
    </form>
  );
}
