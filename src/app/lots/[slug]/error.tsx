"use client";

import { ErrorScreen } from "@/components/states/ErrorScreen";

export default function LotError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      title="We couldn't load this lot"
      message="The lot details failed to load. Your cart is safe — try again in a moment."
      backHref="/lots"
      backLabel="Back to all lots"
    />
  );
}
