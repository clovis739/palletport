"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";

/**
 * Sticky bottom bar with Save / Discard for long forms. Put it as the LAST child inside the <form>.
 * It watches the form for edits: hidden until something changes (unless `alwaysVisible`), "Discard"
 * resets the form, "Save" submits. Pass a changing `resetKey` (e.g. a save counter) to mark clean after saving.
 *
 *   const [state, action] = useActionState(saveBusiness, undefined);
 *   <form action={action}>
 *     …fields…
 *     <SaveBar resetKey={state?.savedAt} message={state?.error} />
 *   </form>
 */
export function SaveBar({
  saveLabel = "Save changes",
  discardLabel = "Discard",
  message,
  alwaysVisible = false,
  resetKey,
  warnOnLeave = true,
  bleed = true,
}: {
  saveLabel?: string;
  discardLabel?: string;
  /** Error or status text shown in the bar. */
  message?: string;
  alwaysVisible?: boolean;
  resetKey?: string | number;
  /** Ask before closing the tab with unsaved changes. */
  warnOnLeave?: boolean;
  /** Stretch edge to edge of the admin content area (form placed directly in the page). Set false inside a Card. */
  bleed?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [dirty, setDirty] = useState(false);
  const { pending } = useFormStatus();

  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const mark = () => setDirty(true);
    form.addEventListener("input", mark);
    form.addEventListener("change", mark);
    return () => {
      form.removeEventListener("input", mark);
      form.removeEventListener("change", mark);
    };
  }, []);

  useEffect(() => setDirty(false), [resetKey]);

  useEffect(() => {
    if (!dirty || !warnOnLeave) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty, warnOnLeave]);

  const show = alwaysVisible || dirty || pending || !!message;
  return (
    <div ref={ref} className={`sticky bottom-0 z-20 mt-6 ${bleed ? "-mx-4 sm:-mx-6 lg:-mx-8" : ""} ${show ? "" : "pointer-events-none h-0 overflow-hidden opacity-0"}`} aria-hidden={!show}>
      <div className="flex flex-wrap items-center gap-3 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8">
        <p className={`min-w-0 flex-1 text-sm ${message ? "font-medium text-rust" : "text-muted"}`} role={message ? "alert" : undefined}>
          {message ?? (dirty ? "You have unsaved changes." : "")}
        </p>
        <button
          type="button"
          className="btn-ghost py-2"
          disabled={pending || !dirty}
          tabIndex={show ? undefined : -1}
          onClick={() => {
            ref.current?.closest("form")?.reset();
            setDirty(false);
          }}
        >
          {discardLabel}
        </button>
        <button type="submit" className="btn-primary py-2" disabled={pending} tabIndex={show ? undefined : -1}>
          {pending ? "Saving…" : saveLabel}
        </button>
      </div>
    </div>
  );
}
