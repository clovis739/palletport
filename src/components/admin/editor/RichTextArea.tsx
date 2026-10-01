"use client";

import { forwardRef, useCallback, useId, useImperativeHandle, useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Bold, Link2, X } from "lucide-react";

export type RichTextAreaHandle = { focus: () => void };

/**
 * Auto-growing textarea for block text. With `toolbar`, adds Bold (**text**) and Link ([label](/path)) buttons —
 * the same inline syntax <RichText> renders. Shortcuts: Ctrl/⌘+B bold, Ctrl/⌘+K link.
 */
export const RichTextArea = forwardRef<
  RichTextAreaHandle,
  {
    value: string;
    onChange: (v: string) => void;
    label: string;
    placeholder?: string;
    toolbar?: boolean;
    className?: string;
    minRows?: number;
    invalid?: boolean;
    onKeyDown?: (e: KeyboardEvent<HTMLTextAreaElement>) => void;
  }
>(function RichTextArea({ value, onChange, label, placeholder, toolbar = false, className = "", minRows = 2, invalid, onKeyDown }, ref) {
  const el = useRef<HTMLTextAreaElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const sel = useRef<[number, number]>([0, 0]);
  const labelIn = useRef<HTMLInputElement>(null);
  const hrefIn = useRef<HTMLInputElement>(null);
  const id = useId();
  const [link, setLink] = useState({ label: "", href: "", error: "" });

  useImperativeHandle(ref, () => ({ focus: () => el.current?.focus() }), []);

  useLayoutEffect(() => {
    const t = el.current;
    if (!t) return;
    t.style.height = "auto";
    t.style.height = `${t.scrollHeight + 2}px`;
  }, [value]);

  const replace = useCallback(
    (start: number, end: number, text: string, selectFrom: number, selectTo: number) => {
      onChange(value.slice(0, start) + text + value.slice(end));
      requestAnimationFrame(() => {
        const t = el.current;
        if (!t) return;
        t.focus();
        t.setSelectionRange(start + selectFrom, start + selectTo);
      });
    },
    [onChange, value],
  );

  const bold = useCallback(() => {
    const t = el.current;
    if (!t) return;
    const s = t.selectionStart;
    const e = t.selectionEnd;
    const picked = value.slice(s, e);
    // Toggle off when the selection is already wrapped.
    if (value.slice(s - 2, s) === "**" && value.slice(e, e + 2) === "**") {
      replace(s - 2, e + 2, picked, 0, picked.length);
      return;
    }
    const inner = picked || "bold text";
    replace(s, e, `**${inner}**`, 2, 2 + inner.length);
  }, [replace, value]);

  const openLink = useCallback(() => {
    const t = el.current;
    if (!t) return;
    sel.current = [t.selectionStart, t.selectionEnd];
    const picked = value.slice(t.selectionStart, t.selectionEnd);
    const m = /^\[([^\]]+)\]\(([^)]*)\)$/.exec(picked);
    const label = m ? m[1] : picked;
    setLink({ label, href: m ? m[2] : "", error: "" });
    dialog.current?.showModal();
    requestAnimationFrame(() => (label ? hrefIn : labelIn).current?.focus());
  }, [value]);

  function insertLink() {
    const href = link.href.trim();
    const label = link.label.trim().replace(/[[\]]/g, "");
    if (!label) return setLink((l) => ({ ...l, error: "Add the link text." }));
    if (!/^(\/[^\s)]*|https?:\/\/[^\s)]+)$/i.test(href)) return setLink((l) => ({ ...l, error: "Use a site path like /help/freight or a full https:// address." }));
    dialog.current?.close();
    const [s, e] = sel.current;
    const md = `[${label}](${href})`;
    replace(s, e, md, md.length, md.length);
  }

  function keyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (toolbar && (e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
      const k = e.key.toLowerCase();
      if (k === "b") {
        e.preventDefault();
        return bold();
      }
      if (k === "k") {
        e.preventDefault();
        return openLink();
      }
    }
    onKeyDown?.(e);
  }

  const tb = "grid h-8 w-8 place-items-center rounded-md text-ink/70 hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal";

  return (
    <div className={`rounded-xl border bg-white transition focus-within:border-transparent focus-within:ring-2 focus-within:ring-ink/10 ${invalid ?"border-rust":"border-transparent"} ${className}`}>
      {toolbar && (
        <div role="toolbar" aria-label={`${label} formatting`} className="flex items-center gap-0.5 px-1.5 py-1">
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={bold} title="Bold (Ctrl+B)" aria-label="Bold">
            <Bold aria-hidden className="h-4 w-4" />
          </button>
          <button type="button" className={tb} onMouseDown={(e) => e.preventDefault()} onClick={openLink} title="Link (Ctrl+K)" aria-label="Insert link">
            <Link2 aria-hidden className="h-4 w-4" />
          </button>
          <span className="ml-auto hidden pr-1.5 text-[11px] text-muted sm:inline">**bold** · [text](/path)</span>
        </div>
      )}
      <textarea
        ref={el}
        id={id}
        aria-label={label}
        aria-invalid={invalid || undefined}
        value={value}
        rows={minRows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={keyDown}
        className="block w-full resize-none overflow-hidden rounded-xl bg-transparent px-3.5 py-2.5 text-base leading-relaxed outline-none sm:text-[15px]"
      />
      {toolbar && (
        <dialog
          ref={dialog}
          aria-labelledby={`${id}-lt`}
          className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-ink backdrop:bg-ink/40"
          onClose={() => el.current?.focus()}
        >
          <form
            method="dialog"
            className="space-y-4 p-5"
            onSubmit={(e) => {
              e.preventDefault();
              insertLink();
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id={`${id}-lt`} className="font-display text-lg font-bold">Insert link</h2>
              <button type="button" className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-sand" aria-label="Close" onClick={() => dialog.current?.close()}>
                <X aria-hidden className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label htmlFor={`${id}-ll`} className="label">Link text</label>
              <input id={`${id}-ll`} className="input" value={link.label} onChange={(e) => setLink({ ...link, label: e.target.value, error: "" })} ref={labelIn} />
            </div>
            <div>
              <label htmlFor={`${id}-lh`} className="label">Address</label>
              <input
                id={`${id}-lh`}
                className="input"
                inputMode="url"
                placeholder="/help/freight or https://…"
                value={link.href}
                onChange={(e) => setLink({ ...link, href: e.target.value, error: "" })}
                ref={hrefIn}
                aria-describedby={`${id}-lhint`}
              />
              <p id={`${id}-lhint`} className={`mt-1 text-xs ${link.error ? "font-medium text-rust" : "text-muted"}`} role={link.error ? "alert" : undefined}>
                {link.error || "Site pages start with / (opens in the same tab). External links need https://."}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={() => dialog.current?.close()}>Cancel</button>
              <button type="submit" className="btn-dark">Insert link</button>
            </div>
          </form>
        </dialog>
      )}
    </div>
  );
});
