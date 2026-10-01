"use client";

import { createContext, useContext, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, GripVertical, Link2, Plus, Search, Trash2 } from "lucide-react";
import { TextArea, TextField, Toggle } from "@/components/admin/FormField";
import { MediaPicker } from "@/components/admin/MediaPicker";
import type { FormCtx } from "./SettingsForm";

/* ------------------------------------------------------------------ path helpers */

type Any = Record<string, unknown> | unknown[];

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

export function setPath(obj: unknown, path: string, v: unknown) {
  const keys = path.split(".");
  let o = obj as Any;
  for (const k of keys.slice(0, -1)) o = (o as Record<string, unknown>)[k] as Any;
  (o as Record<string, unknown>)[keys[keys.length - 1]] = v;
}

/* ------------------------------------------------------------------ simple controlled fields */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type F = FormCtx<any>;

export function CharCount({ value, max, ideal }: { value: string; max: number; ideal?: [number, number] }) {
  const n = value.length;
  const tone = n > max ? "text-rust font-semibold" : ideal && (n < ideal[0] || n > ideal[1]) ? "text-amber-700" : "text-muted";
  return (
    <span className={`tabular-nums ${tone}`} aria-live="polite">
      {n}/{max}
    </span>
  );
}

export function Text({
  f,
  path,
  label,
  hint,
  placeholder,
  type = "text",
  rows,
  max,
  ideal,
  className,
  required,
  autoComplete,
}: {
  f: F;
  path: string;
  label: ReactNode;
  hint?: ReactNode;
  placeholder?: string;
  type?: string;
  /** Renders a textarea with this many rows. */
  rows?: number;
  /** Shows a character counter. */
  max?: number;
  ideal?: [number, number];
  className?: string;
  required?: boolean;
  autoComplete?: string;
}) {
  const v = String(getPath(f.value, path) ?? "");
  const set = (next: string) => f.update((d) => setPath(d, path, next));
  const counter = max ? <CharCount value={v} max={max} ideal={ideal} /> : null;
  const fullHint = hint || counter ? (
    <span className="flex flex-wrap justify-between gap-2">
      <span>{hint}</span>
      {counter}
    </span>
  ) : undefined;
  const common = { name: path, label: required ? <>{label} <span className="text-rust" aria-hidden>*</span></> : label, hint: fullHint, error: f.err(path), placeholder, wrapClassName: className, required, "aria-required": required || undefined };
  return rows ? (
    <TextArea {...common} rows={rows} value={v} onChange={(e) => set(e.target.value)} />
  ) : (
    <TextField {...common} type={type} value={v} autoComplete={autoComplete ?? "off"} onChange={(e) => set(e.target.value)} />
  );
}

export function Switch({ f, path, label, description }: { f: F; path: string; label: ReactNode; description?: ReactNode }) {
  const checked = !!getPath(f.value, path);
  return <Toggle name={path} label={label} description={description} checked={checked} onChange={(e) => f.update((d) => setPath(d, path, e.target.checked))} />;
}

export function MediaField({ f, path, label, hint, allowEmpty = true }: { f: F; path: string; label: string; hint?: string; allowEmpty?: boolean }) {
  const v = String(getPath(f.value, path) ?? "");
  const e = f.err(path);
  return (
    <div>
      <MediaPicker label={label} hint={hint} value={v} allowEmpty={allowEmpty} onChange={(ref) => f.update((d) => setPath(d, path, ref))} />
      {e && <p className="mt-1 text-xs font-medium text-rust">{e}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ link picker */

export type LinkGroup = { label: string; links: { label: string; href: string }[] };
const LinkSuggestions = createContext<LinkGroup[]>([]);
export function LinkSuggestionsProvider({ groups, children }: { groups: LinkGroup[]; children: ReactNode }) {
  return <LinkSuggestions.Provider value={groups}>{children}</LinkSuggestions.Provider>;
}

function LinkPicker({ onPick, onClose }: { onPick: (l: { label: string; href: string }) => void; onClose: () => void }) {
  const groups = useContext(LinkSuggestions);
  const [q, setQ] = useState("");
  const id = useId();
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({ ...g, links: needle ? g.links.filter((l) => `${l.label} ${l.href}`.toLowerCase().includes(needle)) : g.links }))
      .filter((g) => g.links.length);
  }, [groups, q]);
  return (
    <div className="mt-2 rounded-xl bg-white p-2" onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), onClose())}>
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          autoFocus
          className="input pl-9"
          placeholder="Search pages, categories, guides…"
          aria-label="Search site pages"
          aria-controls={id}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
        />
      </div>
      <div id={id} className="mt-2 max-h-64 overflow-y-auto overscroll-contain" data-lenis-prevent>
        {filtered.length === 0 && <p className="px-2 py-3 text-sm text-muted">No matching pages. You can type any path (/…) or https:// link.</p>}
        {filtered.map((g) => (
          <div key={g.label} className="py-1">
            <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted">{g.label}</p>
            <ul>
              {g.links.map((l) => (
                <li key={`${g.label}-${l.href}`}>
                  <button type="button" onClick={() => onPick(l)} className="flex w-full min-w-0 items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-sand focus-visible:bg-sand focus-visible:outline-none">
                    <span className="truncate font-medium">{l.label}</span>
                    <span className="shrink-0 truncate text-xs text-muted">{l.href}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Label + URL for a `{ label, href }` object at `path`, with a searchable picker of internal pages. */
export function LinkEditor({
  f,
  path,
  labelText = "Label",
  urlText = "Link",
  compact = false,
  labelPath = `${path}.label`,
  hrefPath = `${path}.href`,
}: {
  f: F;
  /** Path of a `{ label, href }` object; or pass labelPath + hrefPath for differently named fields. */
  path?: string;
  labelText?: string;
  urlText?: string;
  compact?: boolean;
  labelPath?: string;
  hrefPath?: string;
}) {
  const [open, setOpen] = useState(false);
  const curLabel = String(getPath(f.value, labelPath) ?? "");
  return (
    <div className="min-w-0">
      <div className={`grid gap-3 ${compact ? "sm:grid-cols-2" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"}`}>
        <Text f={f} path={labelPath} label={labelText} />
        <div className="min-w-0">
          <div className="flex items-end gap-2">
            <Text f={f} path={hrefPath} label={urlText} placeholder="/page or https://…" className="min-w-0 flex-1" />
            <button type="button" className="btn-ghost mb-px h-[42px] shrink-0 px-3" aria-expanded={open} onClick={() => setOpen((o) => !o)} title="Pick a page">
              <Link2 aria-hidden className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">Pick</span>
            </button>
          </div>
        </div>
      </div>
      {open && (
        <LinkPicker
          onClose={() => setOpen(false)}
          onPick={(l) => {
            f.update((d) => {
              setPath(d, hrefPath, l.href);
              if (!curLabel) setPath(d, labelPath, l.label);
            });
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ sortable list */

function move<T>(list: T[], from: number, to: number) {
  const next = [...list];
  const [it] = next.splice(from, 1);
  next.splice(to, 0, it);
  return next;
}

/**
 * Reorderable list of rows bound to an array at `path`: drag the handle (pointer) or use the up/down buttons
 * (keyboard, touch). Each row is rendered by `render(itemPath, index)`.
 */
export function SortableList({
  f,
  path,
  render,
  newItem,
  addLabel = "Add",
  itemName,
  max,
  min = 0,
  empty,
  dense = false,
  removable = true,
  rowKey,
}: {
  f: F;
  path: string;
  render: (itemPath: string, index: number) => ReactNode;
  newItem?: () => unknown;
  addLabel?: string;
  /** Accessible name of a row, e.g. (i) => `link ${i + 1}`. */
  itemName: (item: unknown, index: number) => string;
  max?: number;
  min?: number;
  empty?: ReactNode;
  dense?: boolean;
  /** false = fixed set of rows (reorder only). */
  removable?: boolean;
  /** Stable React key per row (defaults to the index). */
  rowKey?: (item: unknown, index: number) => string;
}) {
  const items = (getPath(f.value, path) as unknown[] | undefined) ?? [];
  const [armed, setArmed] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const [announce, setAnnounce] = useState("");
  const dragFrom = useRef<number | null>(null);

  const set = (next: unknown[]) => f.update((d) => setPath(d, path, next));
  const doMove = (from: number, to: number) => {
    if (to < 0 || to >= items.length || from === to) return;
    set(move(items, from, to));
    setAnnounce(`Moved ${itemName(items[from], from)} to position ${to + 1} of ${items.length}`);
  };

  return (
    <div className="space-y-2">
      <span className="sr-only" aria-live="polite">{announce}</span>
      {items.length === 0 && empty}
      <ol className="space-y-2">
        {items.map((item, i) => {
          const name = itemName(item, i);
          return (
            <li
              key={rowKey ? rowKey(item, i) : i}
              draggable={armed === i}
              onDragStart={(e) => {
                dragFrom.current = i;
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", String(i));
              }}
              onDragOver={(e) => {
                if (dragFrom.current === null) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (over !== i) setOver(i);
              }}
              onDragLeave={() => over === i && setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                if (dragFrom.current !== null) doMove(dragFrom.current, i);
                dragFrom.current = null;
                setOver(null);
                setArmed(null);
              }}
              onDragEnd={() => {
                dragFrom.current = null;
                setOver(null);
                setArmed(null);
              }}
              className={`flex min-w-0 gap-2 rounded-xl bg-white ${dense ?"p-2":"p-3"} transition-colors ${f.hasErr(`${path}.${i}`) ?"border-rust/60": over === i ?"border-signal ring-2 ring-signal/20":"border-transparent"}`}
            >
              <div className="flex shrink-0 flex-col items-center gap-1">
                <span
                  className="hidden cursor-grab touch-none rounded p-1 text-muted hover:bg-sand hover:text-ink active:cursor-grabbing sm:block"
                  onPointerDown={() => setArmed(i)}
                  onPointerUp={() => setArmed(null)}
                  title="Drag to reorder"
                  aria-hidden
                >
                  <GripVertical className="h-4 w-4" />
                </span>
                <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-sand hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => doMove(i, i - 1)} aria-label={`Move ${name} up`}>
                  <ArrowUp aria-hidden className="h-3.5 w-3.5" />
                </button>
                <button type="button" className="grid h-7 w-7 place-items-center rounded-md text-muted hover:bg-sand hover:text-ink disabled:opacity-30" disabled={i === items.length - 1} onClick={() => doMove(i, i + 1)} aria-label={`Move ${name} down`}>
                  <ArrowDown aria-hidden className="h-3.5 w-3.5" />
                </button>
              </div>
              <div className="min-w-0 flex-1">{render(`${path}.${i}`, i)}</div>
              <div className={`shrink-0 ${removable ? "" : "hidden"}`}>
                <button
                  type="button"
                  className="grid h-8 w-8 place-items-center rounded-md text-muted hover:bg-rust/10 hover:text-rust disabled:opacity-30"
                  disabled={items.length <= min}
                  onClick={() => {
                    set(items.filter((_, j) => j !== i));
                    setAnnounce(`Removed ${name}`);
                  }}
                  aria-label={`Remove ${name}`}
                >
                  <Trash2 aria-hidden className="h-4 w-4" />
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      {f.err(path) && <p className="text-xs font-medium text-rust">{f.err(path)}</p>}
      {newItem && (!max || items.length < max) && (
        <button type="button" className="btn-ghost py-2" onClick={() => set([...items, newItem()])}>
          <Plus aria-hidden className="h-4 w-4" /> {addLabel}
        </button>
      )}
    </div>
  );
}
