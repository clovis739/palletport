"use client";

import {
  Children,
  Fragment,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { Check, ChevronDown } from "lucide-react";

/**
 * Brand-styled, accessible drop-in replacement for a native <select>.
 *
 * A real (visually hidden) <select> stays in the DOM and owns name / value /
 * required / form / onChange, so FormData, server actions, validation,
 * `key` remounts and `form.requestSubmit()` patterns keep working. The visible
 * UI is a <button role="combobox"> plus a portalled role="listbox" popup.
 */
export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  placeholder?: string;
};

type Opt = { value: string; label: string; node: ReactNode; disabled: boolean };

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number" || typeof node === "bigint") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement(node)) return textOf((node.props as { children?: ReactNode }).children);
  return "";
}

function collect(children: ReactNode, out: Opt[], groupDisabled = false) {
  Children.forEach(children, (child) => {
    if (!isValidElement(child)) return;
    const p = child.props as {
      children?: ReactNode;
      value?: string | number | readonly string[];
      disabled?: boolean;
      label?: string;
    };
    if (child.type === Fragment) return collect(p.children, out, groupDisabled);
    if (child.type === "optgroup") return collect(p.children, out, groupDisabled || !!p.disabled);
    if (child.type !== "option") return;
    const text = textOf(p.children).replace(/\s+/g, " ").trim();
    out.push({
      value: p.value !== undefined ? String(p.value) : text,
      label: p.label ?? text,
      node: p.children ?? p.label,
      disabled: groupDisabled || !!p.disabled,
    });
  });
}

function reducedMotion() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

const GAP = 4;
const EDGE = 8;
const MAX_H = 288; // max-h-72

type Pos = { left: number; top?: number; bottom?: number; minWidth: number; maxWidth: number; maxHeight: number; up: boolean };

export function Select(props: SelectProps) {
  const {
    // → hidden native select
    name, form, required, value, defaultValue, onChange, onInput, onInvalid, autoComplete, multiple, size, children,
    // → visible trigger (composed)
    id: idProp, className, disabled, placeholder, onKeyDown, onKeyUp, onClick, onBlur,
    ...rest
  } = props;

  const autoId = useId();
  const id = idProp ?? `sel-${autoId}`;
  const nativeId = `${id}-native`;
  const listId = `${id}-listbox`;
  const errId = `${id}-error`;

  const options = useMemo(() => {
    const out: Opt[] = [];
    collect(children, out);
    return out;
  }, [children]);

  const controlled = value !== undefined;
  const firstEnabled = () => options.find((o) => !o.disabled)?.value ?? options[0]?.value ?? "";
  const [internal, setInternal] = useState<string>(() => {
    if (defaultValue !== undefined && !Array.isArray(defaultValue)) {
      const dv = String(defaultValue);
      if (options.some((o) => o.value === dv)) return dv;
    }
    return firstEnabled();
  });
  const current = controlled ? (Array.isArray(value) ? String(value[0] ?? "") : String(value)) : internal;
  const selectedIndex = options.findIndex((o) => o.value === current);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : undefined;

  const [open, setOpen] = useState(false);
  const [rendered, setRendered] = useState(false); // stays true during the close animation
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<Pos | null>(null);
  const [error, setError] = useState("");

  const selectRef = useRef<HTMLSelectElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typeahead = useRef({ buffer: "", timer: 0 as ReturnType<typeof setTimeout> | 0 });

  // Uncontrolled: the native select is the source of truth (covers key remounts, option list changes, form reset).
  useIsoLayoutEffect(() => {
    if (controlled) return;
    const el = selectRef.current;
    if (el && el.value !== internal && (el.value !== "" || options.some((o) => o.value === ""))) setInternal(el.value);
  });
  useEffect(() => {
    const el = selectRef.current;
    if (!el) return;
    const sync = () => {
      if (!controlled) setInternal(el.value);
      if (el.validity.valid) setError("");
    };
    const onReset = () => setTimeout(sync, 0);
    el.addEventListener("change", sync);
    el.form?.addEventListener("reset", onReset);
    return () => {
      el.removeEventListener("change", sync);
      el.form?.removeEventListener("reset", onReset);
    };
  }, [controlled]);
  useEffect(() => {
    if (controlled && error && selectRef.current?.validity.valid) setError("");
  }, [controlled, current, error]);

  const enabledFrom = useCallback(
    (start: number, dir: 1 | -1) => {
      for (let i = start; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
      return -1;
    },
    [options],
  );

  const place = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;
    const maxWidth = Math.max(0, vw - EDGE * 2);
    const minWidth = Math.min(r.width, maxWidth);
    const panelW = Math.max(minWidth, Math.min(panelRef.current?.offsetWidth ?? minWidth, maxWidth));
    const left = Math.min(Math.max(EDGE, r.left), Math.max(EDGE, vw - EDGE - panelW));
    const listH = listRef.current ? listRef.current.scrollHeight + 2 : Math.min(MAX_H, options.length * 40 + 10);
    const want = Math.min(MAX_H, listH);
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const up = want > below && above > below;
    const maxHeight = Math.max(80, Math.min(MAX_H, up ? above : below));
    setPos(up ? { left, bottom: vh - r.top + GAP, minWidth, maxWidth, maxHeight, up } : { left, top: r.bottom + GAP, minWidth, maxWidth, maxHeight, up });
  }, [options.length]);

  const openList = useCallback(
    (at?: number) => {
      if (disabled) return;
      const start = at ?? (selectedIndex >= 0 && !options[selectedIndex]?.disabled ? selectedIndex : enabledFrom(0, 1));
      setActive(start);
      setOpen(true);
      setRendered(true);
    },
    [disabled, selectedIndex, options, enabledFrom],
  );

  const closeList = useCallback((refocus = false) => {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }, []);

  const commit = (i: number) => {
    const opt = options[i];
    if (!opt || opt.disabled) return;
    closeList(true);
    const el = selectRef.current;
    if (el && el.value !== opt.value) {
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")?.set;
      if (setter) setter.call(el, opt.value);
      else el.value = opt.value;
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (!controlled) setInternal(opt.value);
  };

  // Position: measure before paint, then follow scroll/resize.
  useIsoLayoutEffect(() => {
    if (!rendered) {
      setPos(null);
      return;
    }
    place();
    const onMove = (e: Event) => {
      if (e.type === "scroll" && e.target instanceof Node && panelRef.current?.contains(e.target)) return;
      place();
    };
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [rendered, place]);

  // Re-measure once the panel exists (real width/height known).
  const measured = pos !== null;
  useIsoLayoutEffect(() => {
    if (rendered && measured) place();
  }, [rendered, measured, options, place]);

  // Open / close animation.
  useIsoLayoutEffect(() => {
    const panel = panelRef.current;
    if (!panel || !pos) return;
    if (open) {
      if (reducedMotion()) {
        gsap.set(panel, { opacity: 1, scale: 1, y: 0 });
        return;
      }
      gsap.killTweensOf(panel);
      gsap.fromTo(
        panel,
        { opacity: 0, scale: 0.97, y: pos.up ? 6 : -6, transformOrigin: pos.up ? "50% 100%" : "50% 0%" },
        { opacity: 1, scale: 1, y: 0, duration: 0.18, ease: "power2.out" },
      );
    } else {
      if (reducedMotion()) {
        setRendered(false);
        return;
      }
      gsap.killTweensOf(panel);
      gsap.to(panel, {
        opacity: 0,
        scale: 0.97,
        y: pos.up ? 4 : -4,
        duration: 0.12,
        ease: "power2.in",
        onComplete: () => setRendered(false),
      });
    }
    // Only re-run when open state flips or the panel first gets a position.
  }, [open, measured]);

  useEffect(() => {
    const panel = panelRef.current;
    return () => {
      if (panel) gsap.killTweensOf(panel);
    };
  }, [rendered]);

  // Click outside closes.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (buttonRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      closeList(false);
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => document.removeEventListener("pointerdown", onDown, true);
  }, [open, closeList]);

  // Keep the active option in view.
  useEffect(() => {
    if (!open || active < 0) return;
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    if (!list || !el) return;
    if (el.offsetTop < list.scrollTop) list.scrollTop = el.offsetTop - 4;
    else if (el.offsetTop + el.offsetHeight > list.scrollTop + list.clientHeight)
      list.scrollTop = el.offsetTop + el.offsetHeight - list.clientHeight + 4;
  }, [open, active, measured]);

  useEffect(() => () => clearTimeout(typeahead.current.timer || undefined), []);

  const typeTo = (ch: string) => {
    const t = typeahead.current;
    clearTimeout(t.timer || undefined);
    t.buffer += ch.toLowerCase();
    t.timer = setTimeout(() => (t.buffer = ""), 600);
    const same = t.buffer.split("").every((c) => c === t.buffer[0]);
    const needle = same ? t.buffer[0] : t.buffer;
    const from = open ? active : selectedIndex;
    const n = options.length;
    for (let k = 0; k < n; k++) {
      const i = (from + (same || t.buffer.length === 1 ? 1 : 0) + k + n) % n;
      const o = options[i];
      if (!o.disabled && o.label.toLowerCase().startsWith(needle)) return i;
    }
    return -1;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e as unknown as React.KeyboardEvent<HTMLSelectElement>);
    if (e.defaultPrevented || disabled) return;
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        if (k === "ArrowUp" && e.altKey) return;
        openList();
      } else if (k === "Home" || k === "End") {
        e.preventDefault();
        openList(k === "Home" ? enabledFrom(0, 1) : enabledFrom(options.length - 1, -1));
      } else if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const i = typeTo(k);
        if (i >= 0) openList(i);
      }
      return;
    }
    switch (k) {
      case "ArrowDown": {
        e.preventDefault();
        const i = enabledFrom(active + 1, 1);
        if (i >= 0) setActive(i);
        return;
      }
      case "ArrowUp": {
        e.preventDefault();
        if (e.altKey) return commit(active);
        const i = enabledFrom(active < 0 ? options.length - 1 : active - 1, -1);
        if (i >= 0) setActive(i);
        return;
      }
      case "Home":
        e.preventDefault();
        return setActive(enabledFrom(0, 1));
      case "End":
        e.preventDefault();
        return setActive(enabledFrom(options.length - 1, -1));
      case "PageDown": {
        e.preventDefault();
        const i = enabledFrom(Math.min(options.length - 1, active + 8), -1);
        if (i >= 0) setActive(i);
        return;
      }
      case "PageUp": {
        e.preventDefault();
        const i = enabledFrom(Math.max(0, active - 8), 1);
        if (i >= 0) setActive(i);
        return;
      }
      case "Enter":
        e.preventDefault();
        if (active >= 0) commit(active);
        else closeList(true);
        return;
      case " ":
        e.preventDefault();
        if (typeahead.current.buffer) {
          const i = typeTo(" ");
          if (i >= 0) setActive(i);
        } else if (active >= 0) commit(active);
        return;
      case "Escape":
        e.preventDefault();
        e.stopPropagation();
        return closeList(true);
      case "Tab":
        return closeList(false);
      default:
        if (k.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          const i = typeTo(k);
          if (i >= 0) setActive(i);
        }
    }
  };

  const handleInvalid = (e: React.FormEvent<HTMLSelectElement>) => {
    onInvalid?.(e);
    const el = e.currentTarget;
    // The native control is hidden, so show the message ourselves and move focus to the visible trigger
    // (only when this is the first invalid field, so we don't fight the browser over focus).
    e.preventDefault();
    setError(el.validationMessage || "Please select an option.");
    const first = el.form
      ? Array.from(el.form.elements).find((f) => (f as HTMLSelectElement).willValidate && !(f as HTMLSelectElement).validity?.valid)
      : el;
    if (first === el) buttonRef.current?.focus();
  };

  const showPlaceholder = !selected || selected.value === "";
  const labelText = !selected ? (placeholder ?? "") : selected.value === "" && placeholder ? placeholder : selected.node;

  const panel =
    rendered && typeof document !== "undefined"
      ? createPortal(
          <div
            ref={panelRef}
            className="pp-pop fixed z-[100] overflow-hidden rounded-xl bg-white text-ink"
            style={{
              left: pos?.left ?? 0,
              top: pos?.top,
              bottom: pos?.bottom,
              minWidth: pos?.minWidth,
              maxWidth: pos?.maxWidth,
              visibility: pos ? "visible" : "hidden",
              opacity: pos && reducedMotion() ? 1 : 0,
            }}
            onMouseDown={(e) => e.preventDefault()}
          >
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              tabIndex={-1}
              aria-label={rest["aria-label"]}
              aria-labelledby={rest["aria-label"] ? undefined : id}
              data-lenis-prevent=""
              className="max-h-72 overflow-y-auto overscroll-contain p-1"
              style={{ maxHeight: pos?.maxHeight }}
            >
              {options.length === 0 ? (
                <div className="flex min-h-10 items-center px-3 text-sm text-muted">No options</div>
              ) : (
                options.map((o, i) => {
                  const isSel = i === selectedIndex;
                  const isActive = i === active;
                  return (
                    <div
                      key={`${i}-${o.value}`}
                      id={`${listId}-opt-${i}`}
                      data-index={i}
                      role="option"
                      aria-selected={isSel}
                      aria-disabled={o.disabled || undefined}
                      onMouseMove={() => !o.disabled && active !== i && setActive(i)}
                      onClick={() => commit(i)}
                      className={[
                        "relative flex min-h-10 select-none items-center rounded-lg py-2 pl-3.5 pr-9 text-base leading-snug break-words sm:text-sm",
                        o.disabled ? "cursor-not-allowed text-muted/60" : "cursor-pointer",
                        isActive && !o.disabled ? "bg-sand" : "",
                        isSel
                          ? "font-semibold text-ink before:absolute before:inset-y-2 before:left-0.5 before:w-[3px] before:rounded-full before:bg-signal"
                          : "",
                      ].join(" ")}
                    >
                      <span className="min-w-0">{o.node}</span>
                      {isSel && <Check aria-hidden className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-signal" strokeWidth={2.75} />}
                    </div>
                  );
                })
              )}
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        {...(rest as unknown as React.ButtonHTMLAttributes<HTMLButtonElement>)}
        ref={buttonRef}
        id={id}
        type="button"
        role="combobox"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={rendered ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? `${listId}-opt-${active}` : undefined}
        aria-required={required || undefined}
        aria-invalid={error ? true : rest["aria-invalid"]}
        aria-describedby={[rest["aria-describedby"], error ? errId : ""].filter(Boolean).join(" ") || undefined}
        data-open={open || undefined}
        className={[
          className ?? "input",
          "flex items-center justify-between gap-2 text-left cursor-pointer disabled:cursor-not-allowed disabled:opacity-60",
          "focus:outline-none focus:border-signal focus:ring-2 focus:ring-signal/25",
          open ? "border-signal ring-2 ring-signal/25" : "",
          error ? "border-rust ring-2 ring-rust/20" : "",
        ].join(" ")}
        onClick={(e) => {
          onClick?.(e as unknown as React.MouseEvent<HTMLSelectElement>);
          if (e.defaultPrevented) return;
          if (open) closeList(true);
          else openList();
        }}
        onKeyDown={handleKeyDown}
        onKeyUp={(e) => {
          onKeyUp?.(e as unknown as React.KeyboardEvent<HTMLSelectElement>);
          if (e.key === " ") e.preventDefault(); // stop Firefox from synthesising a click after Space
        }}
        onBlur={(e) => {
          onBlur?.(e as unknown as React.FocusEvent<HTMLSelectElement>);
          if (open && !panelRef.current?.contains(e.relatedTarget as Node | null)) closeList(false);
        }}
      >
        <span className={`min-w-0 flex-1 truncate ${showPlaceholder ? "text-muted" : ""}`}>{labelText || " "}</span>
        <ChevronDown
          aria-hidden
          className={`h-4 w-4 shrink-0 transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180 text-signal" : "text-muted"}`}
        />
      </button>
      <select
        ref={selectRef}
        id={nativeId}
        name={name}
        form={form}
        required={required}
        disabled={disabled}
        autoComplete={autoComplete}
        multiple={multiple}
        size={size}
        {...(controlled ? { value } : defaultValue !== undefined ? { defaultValue } : {})}
        onChange={onChange}
        onInput={onInput}
        onInvalid={handleInvalid}
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only pointer-events-none"
      >
        {children}
      </select>
      {error && (
        <span id={errId} role="alert" className="mt-1.5 block text-xs font-medium text-rust">
          {error}
        </span>
      )}
      {panel}
    </>
  );
}
