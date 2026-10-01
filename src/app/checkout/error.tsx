"use client";

import { ErrorScreen } from "@/components/states/ErrorScreen";

export default function CheckoutError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <ErrorScreen
      error={error}
      reset={reset}
      title="Checkout hit a problem"
      message="Your order was not placed and you have not been charged. Your cart is saved — try again, or go back to review it."
      backHref="/cart"
      backLabel="Back to cart"
    />
  );
}
