"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { Check, Loader2, ShoppingCart } from "lucide-react";
import { useFormStatus } from "react-dom";
import { quickAddToCart, type QuickAddState } from "@/app/actions/cart";

function Button({ added, title }: { added: boolean; title: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label={added ? `Added ${title} to cart` : `Add ${title} to cart`}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors disabled:cursor-wait ${
        added ? "bg-moss text-white" : "bg-ink text-white hover:bg-signal"
      }`}
    >
      {pending ? (
        <><Loader2 aria-hidden className="h-4 w-4 animate-spin" /> Adding…</>
      ) : added ? (
        <><Check aria-hidden className="h-4 w-4" /> Added</>
      ) : (
        <><ShoppingCart aria-hidden className="h-4 w-4" /> Add to cart</>
      )}
    </button>
  );
}

/** Add-to-cart button on product cards: adds one lot without leaving the page, then offers a link to the cart. */
export function CardAddToCart({ lotId, title }: { lotId: string; title: string }) {
  const [state, action] = useActionState<QuickAddState, FormData>(quickAddToCart, undefined);
  const [added, setAdded] = useState(false);
  // Page to return to after signing in (read on the client so the card stays usable on static pages).
  const [back, setBack] = useState("/");
  useEffect(() => setBack(window.location.pathname + window.location.search), []);
  useEffect(() => {
    if (!state?.ok) return;
    setAdded(true);
    const t = window.setTimeout(() => setAdded(false), 2500);
    return () => window.clearTimeout(t);
  }, [state]);
  return (
    <form action={action} className="space-y-1.5">
      <input type="hidden" name="lotId" value={lotId} />
      <input type="hidden" name="back" value={back} />
      <Button added={added} title={title} />
      <p aria-live="polite" className="min-h-4 text-center text-xs">
        {state?.error ? (
          <span className="font-medium text-rust">{state.error}</span>
        ) : added ? (
          <Link href="/cart" className="font-semibold text-signal-dark hover:underline">View cart</Link>
        ) : null}
      </p>
    </form>
  );
}
