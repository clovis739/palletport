"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "btn-primary",
  pendingText,
  name,
  value,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  /** Optional submitter name/value (e.g. two buttons in one form). Only the clicked one shows `pendingText`. */
  name?: string;
  value?: string;
}) {
  const { pending, data } = useFormStatus();
  const mine = !name || !data || data.get(name) === value;
  return (
    <button type="submit" name={name} value={value} className={className} disabled={pending}>
      {pending && mine ? pendingText ?? "Working…" : children}
    </button>
  );
}
