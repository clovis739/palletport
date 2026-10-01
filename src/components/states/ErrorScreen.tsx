"use client";

import Link from "next/link";
import { useEffect } from "react";
import { StackArt } from "./StatusScreen";
import { RotateCw } from "lucide-react";

/** Client-side error boundary UI with a retry button. Used by every error.tsx. */
export function ErrorScreen({
  error,
  reset,
  title = "Something went wrong on our side",
  message = "An unexpected error stopped this page from loading. Try again — if it keeps happening, contact support and quote the reference below.",
  backHref = "/",
  backLabel = "Go to homepage",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  useEffect(() => {
    // Hook up an error tracker (Sentry, etc.) here.
    console.error(error);
  }, [error]);

  const offline = typeof navigator !== "undefined" && !navigator.onLine;
  return (
    <div className="container-pp grid min-h-[60vh] place-items-center py-10 sm:py-16" role="alert">
      <div className="max-w-xl text-center">
        <StackArt code={offline ? "OFF" : 500} />
        <p className="mt-6 font-display text-sm font-bold uppercase tracking-[0.2em] text-rust">{offline ? "No connection" : "Error 500"}</p>
        <h1 className="mt-2 font-display text-3xl font-bold">{offline ? "You're offline" : title}</h1>
        <p className="mx-auto mt-3 max-w-md text-ink/70">{offline ? "Check your internet connection, then try again." : message}</p>
        {error.digest && <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button onClick={() => reset()} className="btn-primary"><RotateCw aria-hidden className="h-4 w-4" /> Try again</button>
          <Link href={backHref} className="btn-ghost">{backLabel}</Link>
        </div>
      </div>
    </div>
  );
}
