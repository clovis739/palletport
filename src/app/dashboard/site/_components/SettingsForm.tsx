"use client";

import { useActionState, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { SaveBar } from "@/components/admin/SaveBar";
import { Toast } from "@/components/admin/Flash";
import type { SiteFormState } from "@/app/actions/site";

/**
 * Client wrapper shared by every Site settings editor.
 *
 * The whole settings group lives in React state (`value`), is edited through `update(draft => { … })` and
 * posted as JSON in a hidden `payload` field. The server action validates it with zod and returns
 * `fieldErrors` keyed by dotted path ("header.2.children.0.href"), which editors show inline via `err(path)`.
 * The sticky <SaveBar> handles Save / Discard and the unsaved-changes warning.
 */
export type FormCtx<T> = {
  value: T;
  update: (fn: (draft: T) => void) => void;
  /** Inline error for an exact path. */
  err: (path: string) => string | undefined;
  /** True if any error sits at or below this path (to highlight a collapsed row). */
  hasErr: (prefix: string) => boolean;
};

export function SettingsForm<T>({
  initial,
  action,
  children,
  saveLabel = "Save changes",
  aside,
}: {
  initial: T;
  action: (state: SiteFormState, fd: FormData) => Promise<SiteFormState>;
  children: (ctx: FormCtx<T>) => ReactNode;
  saveLabel?: string;
  /** Sticky side column on xl screens (live preview). */
  aside?: (value: T) => ReactNode;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [value, setValue] = useState<T>(initial);
  const [baseline, setBaseline] = useState<T>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [savedKey, setSavedKey] = useState<number | undefined>(undefined);
  const closeToast = useCallback(() => setToast(null), []);
  const formRef = useRef<HTMLFormElement>(null);
  /** React 19 resets a form after its action runs; that reset must not undo the edits we just saved. */
  const autoReset = useRef(false);
  const latest = useRef(value);
  latest.current = value;

  useEffect(() => {
    if (!state) return;
    setErrors(state.fieldErrors ?? {});
    if (state.ok) {
      setBaseline(latest.current);
      setSavedKey(state.savedAt);
      setToast(state.ok);
    }
    if (state.fieldErrors) {
      // Bring the first invalid field into view.
      requestAnimationFrame(() => formRef.current?.querySelector<HTMLElement>("[aria-invalid='true']")?.focus());
    }
  }, [state]);

  const update = useCallback((fn: (draft: T) => void) => {
    setValue((prev) => {
      const next = structuredClone(prev);
      fn(next);
      return next;
    });
    // Button-driven edits (reorder, add, remove, pickers) don't fire input events: tell the SaveBar.
    queueMicrotask(() => formRef.current?.dispatchEvent(new Event("change", { bubbles: true })));
  }, []);

  const ctx: FormCtx<T> = {
    value,
    update,
    err: (p) => errors[p],
    hasErr: (prefix) => Object.keys(errors).some((k) => k === prefix || k.startsWith(`${prefix}.`)),
  };

  return (
    <form
      ref={formRef}
      action={formAction}
      noValidate
      onSubmit={() => {
        autoReset.current = true;
      }}
      onReset={() => {
        if (autoReset.current) {
          autoReset.current = false;
          return;
        }
        setValue(baseline);
        setErrors({});
      }}
    >
      <input type="hidden" name="payload" value={JSON.stringify(value)} />
      {aside ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="min-w-0 space-y-6">{children(ctx)}</div>
          <div className="min-w-0">
            <div className="space-y-4 xl:sticky xl:top-20">{aside(value)}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">{children(ctx)}</div>
      )}
      <SaveBar saveLabel={saveLabel} resetKey={savedKey} message={state?.error} />
      {toast && <Toast message={toast} onClose={closeToast} />}
    </form>
  );
}
