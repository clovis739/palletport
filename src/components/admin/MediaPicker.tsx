"use client";

/**
 * MediaPicker — choose an image for a setting or content block.
 *
 * Value is an "image ref" (see src/lib/imageRef.ts): a stock photo key ("heroWarehouse"),
 * a media-library URL ("/media/lib/..."), a lot photo URL, or an https URL. Empty string = no image.
 *
 * STABLE INTERFACE — used by the content editor and the site settings forms.
 *   <MediaPicker name="heroPhoto" defaultValue="heroWarehouse" />             // uncontrolled, submits via hidden input
 *   <MediaPicker value={ref} onChange={setRef} />                               // controlled (e.g. inside the block editor)
 * Props: name?, value?, defaultValue?, onChange?, label?, hint?, allowStock? (default true), allowEmpty? (default true)
 * Additive (optional): onPick?(ref, info) — also receives alt text / dimensions of the chosen image
 *   (e.g. to fill an image block's alt, width and height). info is null when the image is removed.
 *
 * Opens an accessible modal (portal on <body>, focus trap, Esc closes, focus returns) with tabs:
 * Library (default, searchable, "Load more"), Upload (drag & drop; the upload is auto-selected),
 * Stock photos (when allowStock) and Link (paste a URL). All buttons are type="button" and the dialog lives
 * outside the parent <form>, so it never submits it. The library is fetched only when the dialog opens.
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { isLotPhotoUrl, isMediaLibUrl } from "@/lib/mediaUrls";
import { AlertTriangle, Check, ImageIcon, Library, Link2, Loader2, Search, Sparkles, Upload, X } from "lucide-react";
import { isImageUrl, resolveImageRef, stockPhotoOptions } from "@/lib/imageRef";
import { PHOTOS, photoSrc } from "@/content/photos";
import { listMediaAction, mediaMetaAction } from "@/app/actions/media";
import { Dialog } from "./media/Dialog";
import { UploadZone } from "./media/UploadZone";
import { formatBytes, formatDims, type MediaItem, type MediaMeta } from "./media/types";

export type PickedImage = {
  source: "library" | "upload" | "stock" | "url";
  alt: string;
  width: number | null;
  height: number | null;
  filename?: string;
};

export type MediaPickerProps = {
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (ref: string) => void;
  label?: string;
  hint?: string;
  allowStock?: boolean;
  allowEmpty?: boolean;
  /** Optional: called with details of the chosen image (after onChange). */
  onPick?: (ref: string, info: PickedImage | null) => void;
};

export function refPreviewSrc(ref: string, width = 320) {
  const r = resolveImageRef(ref);
  if (r.kind === "stock") return photoSrc(r.photo, width);
  if (r.kind === "url") return r.src;
  return "";
}

// ---------------------------------------------------------------------------------------------
// Batched, cached lookups of media-library alt text / dimensions (one action call for all pickers on a page).
const metaCache = new Map<string, MediaMeta | null>();
const waiters = new Map<string, ((m: MediaMeta | null) => void)[]>();
let batchTimer: ReturnType<typeof setTimeout> | null = null;

function rememberMeta(m: MediaItem | MediaMeta) {
  metaCache.set(m.url, { url: m.url, alt: m.alt, width: m.width, height: m.height, filename: m.filename, size: m.size });
}

function flushMeta() {
  batchTimer = null;
  const urls = [...waiters.keys()];
  const pending = new Map(waiters);
  waiters.clear();
  mediaMetaAction(urls)
    .then((rows) => {
      const found = new Map(rows.map((r) => [r.url, r]));
      for (const u of urls) {
        const m = found.get(u) ?? null;
        metaCache.set(u, m);
        pending.get(u)?.forEach((cb) => cb(m));
      }
    })
    .catch(() => urls.forEach((u) => pending.get(u)?.forEach((cb) => cb(null))));
}

function loadMeta(url: string): Promise<MediaMeta | null> {
  if (metaCache.has(url)) return Promise.resolve(metaCache.get(url)!);
  return new Promise((resolve) => {
    waiters.set(url, [...(waiters.get(url) ?? []), resolve]);
    if (!batchTimer) batchTimer = setTimeout(flushMeta, 40);
  });
}

/** Caption info for any ref (sync part; media-library URLs are completed by loadMeta). */
function describe(ref: string, meta?: MediaMeta | null): { alt: string; caption: string; kind: PickedImage["source"] | "none" } {
  const r = resolveImageRef(ref);
  if (r.kind === "none") return { alt: "", caption: "", kind: "none" };
  if (r.kind === "stock") return { alt: r.photo.alt, caption: "Representative image", kind: "stock" };
  if (meta) return { alt: meta.alt, caption: [formatDims(meta.width, meta.height), formatBytes(meta.size)].filter(Boolean).join(" · "), kind: "library" };
  return { alt: "", caption: isLotPhotoUrl(r.src) ? "Lot photo" : isMediaLibUrl(r.src) ? "Media library" : "Linked image", kind: "url" };
}

function useMeta(ref: string) {
  const isLib = isMediaLibUrl(ref);
  const [meta, setMeta] = useState<MediaMeta | null | undefined>(() => (isLib ? metaCache.get(ref) : null));
  useEffect(() => {
    if (!isLib) {
      setMeta(null);
      return;
    }
    let live = true;
    setMeta(metaCache.get(ref));
    loadMeta(ref).then((m) => live && setMeta(m));
    return () => {
      live = false;
    };
  }, [ref, isLib]);
  return meta;
}

/** Turns a pasted URL into an image ref: same-site absolute URLs become paths. Returns "" when invalid. */
function normalizeUrl(input: string) {
  let v = input.trim();
  if (!v) return "";
  try {
    if (typeof window !== "undefined" && v.startsWith(window.location.origin + "/")) v = v.slice(window.location.origin.length);
  } catch {
    /* ignore */
  }
  if (v.startsWith("//")) return "";
  return isImageUrl(v) && !/\s/.test(v) ? v : "";
}

// ---------------------------------------------------------------------------------------------

type Tab = "library" | "upload" | "stock" | "link";
type Draft = { ref: string; info: PickedImage } | null;

export function MediaPicker({ name, value, defaultValue = "", onChange, label, hint, allowStock = true, allowEmpty = true, onPick }: MediaPickerProps) {
  const id = useId();
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const [open, setOpen] = useState(false);
  const hidden = useRef<HTMLInputElement>(null);
  const notify = useRef(false);
  const meta = useMeta(current);
  const info = describe(current, meta);
  const preview = refPreviewSrc(current);

  // Let form listeners (e.g. <SaveBar>) know the hidden value changed.
  useEffect(() => {
    if (!notify.current) return;
    notify.current = false;
    hidden.current?.dispatchEvent(new Event("input", { bubbles: true }));
    hidden.current?.dispatchEvent(new Event("change", { bubbles: true }));
  }, [current]);

  function commit(ref: string, picked: PickedImage | null) {
    if (value === undefined) setInner(ref);
    notify.current = true;
    onChange?.(ref);
    onPick?.(ref, picked);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {label && <label htmlFor={`${id}-btn`} className="label">{label}</label>}
      {name && <input ref={hidden} type="hidden" name={name} value={current} />}
      <div className="flex items-center gap-3">
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={() => setOpen(true)}
          className="grid h-16 w-24 shrink-0 place-items-center overflow-hidden rounded-lg bg-sand"
        >
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="" width={96} height={64} className="h-full w-full object-cover" />
          ) : (
            <ImageIcon aria-hidden className="h-5 w-5 text-muted" />
          )}
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap gap-2">
            <button id={`${id}-btn`} type="button" className="btn-ghost py-2" aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
              {current ? "Change image" : "Choose image"}
            </button>
            {allowEmpty && current && (
              <button type="button" className="btn-ghost py-2 text-rust" onClick={() => commit("", null)}>
                <X aria-hidden className="h-4 w-4" /> Remove
              </button>
            )}
          </div>
          {current && (
            <p className="truncate text-xs text-muted" title={info.alt || current}>
              {info.kind === "library" && !info.alt ? (
                <span className="font-semibold text-amber-700">No alt text</span>
              ) : info.alt ? (
                <span className="text-ink">{info.alt}</span>
              ) : meta === undefined && isMediaLibUrl(current) ? (
                "Loading…"
              ) : (
                <span className="font-mono">{current}</span>
              )}
              {info.caption && <span> · {info.caption}</span>}
            </p>
          )}
        </div>
      </div>
      {hint && <p className="text-xs text-muted">{hint}</p>}

      <PickerDialog open={open} onClose={() => setOpen(false)} current={current} allowStock={allowStock} onConfirm={commit} title={label ? `Choose image — ${label}` : "Choose image"} />
    </div>
  );
}

// ---------------------------------------------------------------------------------------------

function PickerDialog({
  open,
  onClose,
  current,
  allowStock,
  onConfirm,
  title,
}: {
  open: boolean;
  onClose: () => void;
  current: string;
  allowStock: boolean;
  onConfirm: (ref: string, info: PickedImage) => void;
  title: string;
}) {
  const baseId = useId();
  const tabs = useMemo(
    () =>
      [
        { id: "library" as const, label: "Library", icon: Library },
        { id: "upload" as const, label: "Upload", icon: Upload },
        ...(allowStock ? [{ id: "stock" as const, label: "Stock photos", icon: Sparkles }] : []),
        { id: "link" as const, label: "Link", icon: Link2 },
      ] satisfies { id: Tab; label: string; icon: typeof Library }[],
    [allowStock],
  );
  const [tab, setTab] = useState<Tab>("library");
  const [visited, setVisited] = useState<Set<Tab>>(new Set(["library"]));
  const [draft, setDraft] = useState<Draft>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const activeTab = useRef<HTMLButtonElement | null>(null);

  // Reset per opening: start on the tab that matches the current value.
  useEffect(() => {
    if (!open) return;
    const r = resolveImageRef(current);
    const start: Tab = r.kind === "stock" && allowStock ? "stock" : r.kind === "url" && !isMediaLibUrl(current) ? "link" : "library";
    setTab(start);
    setVisited(new Set(["library", start]));
    if (r.kind === "none") setDraft(null);
    else {
      const m = metaCache.get(current);
      const d = describe(current, m);
      setDraft({ ref: current, info: { source: d.kind === "none" ? "url" : d.kind, alt: d.alt, width: m?.width ?? null, height: m?.height ?? null, filename: m?.filename } });
    }
  }, [open, current, allowStock]);

  function select(t: Tab) {
    setTab(t);
    setVisited((v) => (v.has(t) ? v : new Set([...v, t])));
  }

  function onTabKey(e: KeyboardEvent<HTMLButtonElement>) {
    const i = tabs.findIndex((t) => t.id === tab);
    let n = -1;
    if (e.key === "ArrowRight") n = (i + 1) % tabs.length;
    else if (e.key === "ArrowLeft") n = (i - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") n = 0;
    else if (e.key === "End") n = tabs.length - 1;
    if (n < 0) return;
    e.preventDefault();
    select(tabs[n].id);
    tabRefs.current[tabs[n].id]?.focus();
  }

  const confirm = useCallback(
    (d: Draft) => {
      if (d) onConfirm(d.ref, d.info);
    },
    [onConfirm],
  );

  const draftPreview = draft ? refPreviewSrc(draft.ref, 160) : "";
  const dims = draft ? formatDims(draft.info.width, draft.info.height) : "";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      initialFocus={activeTab}
      title={title}
      description="Pick from the library, upload a new image, or use a stock photo."
      footer={
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3" aria-live="polite">
            {draft ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={draftPreview} alt="" width={56} height={40} className="h-10 w-14 shrink-0 rounded-md bg-sand object-cover" />
                <div className="min-w-0 text-xs">
                  <p className="truncate font-semibold" title={draft.info.alt}>
                    {draft.info.alt || (draft.info.source === "url" ? draft.ref : <span className="inline-flex items-center gap-1 text-amber-700"><AlertTriangle aria-hidden className="h-3 w-3" /> No alt text</span>)}
                  </p>
                  <p className="truncate text-muted">
                    {[draft.info.filename, dims, draft.info.source === "stock" ? "Stock photo" : draft.info.source === "url" ? "Linked image" : ""].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">No image selected</p>
            )}
          </div>
          <div className="flex w-full gap-2 sm:w-auto">
            <button type="button" className="btn-ghost flex-1 py-2 sm:flex-none" onClick={onClose}>
              Cancel
            </button>
            <button type="button" className="btn-primary flex-1 py-2 sm:flex-none" disabled={!draft} onClick={() => confirm(draft)}>
              <Check aria-hidden className="h-4 w-4" /> Use image
            </button>
          </div>
        </div>
      }
    >
      <div className="sticky top-0 z-10 bg-white px-2 sm:px-4">
        <div role="tablist" aria-label="Image source" className="-mb-px flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((t) => {
            const on = tab === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                  if (on) activeTab.current = el;
                }}
                type="button"
                role="tab"
                id={`${baseId}-tab-${t.id}`}
                aria-selected={on}
                aria-controls={`${baseId}-panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => select(t.id)}
                onKeyDown={onTabKey}
                className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-signal ${on ? "border-signal text-ink" : "border-transparent text-muted hover:text-ink"}`}
              >
                <Icon aria-hidden className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {tabs.map((t) =>
        visited.has(t.id) ? (
          <div key={t.id} role="tabpanel" id={`${baseId}-panel-${t.id}`} aria-labelledby={`${baseId}-tab-${t.id}`} hidden={tab !== t.id} className="p-4 sm:p-5">
            {t.id === "library" && open && <LibraryPanel draft={draft} setDraft={setDraft} onConfirm={confirm} />}
            {t.id === "upload" && (
              <UploadPanel
                onUploaded={(items) => {
                  const m = items[items.length - 1];
                  if (!m) return;
                  rememberMeta(m);
                  libraryBus.push(items);
                  setDraft({ ref: m.url, info: { source: "upload", alt: m.alt, width: m.width, height: m.height, filename: m.filename } });
                }}
              />
            )}
            {t.id === "stock" && <StockPanel draft={draft} setDraft={setDraft} onConfirm={confirm} />}
            {t.id === "link" && <LinkPanel draft={draft} setDraft={setDraft} />}
          </div>
        ) : null,
      )}
    </Dialog>
  );
}

/** Tiny channel so uploads show up at the top of an already-loaded library list. */
const libraryBus = {
  listeners: new Set<(items: MediaItem[]) => void>(),
  push(items: MediaItem[]) {
    this.listeners.forEach((l) => l(items));
  },
};

type PanelProps = { draft: Draft; setDraft: (d: Draft) => void; onConfirm: (d: Draft) => void };

function LibraryPanel({ draft, setDraft, onConfirm }: PanelProps) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  const load = useCallback(async (query: string, from: string | null) => {
    const my = ++reqId.current;
    setLoading(true);
    setError(null);
    try {
      const page = await listMediaAction({ q: query, cursor: from });
      if (my !== reqId.current) return;
      page.items.forEach(rememberMeta);
      if (page.error) setError(page.error);
      setItems((prev) => {
        if (!from || !prev) return page.items;
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setCursor(page.nextCursor);
      setTotal(page.total);
    } catch {
      if (my === reqId.current) setError("Couldn't load the media library. Try again.");
    } finally {
      if (my === reqId.current) setLoading(false);
    }
  }, []);

  // First load immediately, later searches debounced.
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      load("", null);
      return;
    }
    const t = setTimeout(() => load(q.trim(), null), 300);
    return () => clearTimeout(t);
  }, [q, load]);

  useEffect(() => {
    const l = (added: MediaItem[]) => {
      setItems((prev) => [...added, ...(prev ?? []).filter((p) => !added.some((a) => a.id === p.id))]);
      setTotal((t) => t + added.length);
    };
    libraryBus.listeners.add(l);
    return () => {
      libraryBus.listeners.delete(l);
    };
  }, []);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
          placeholder="Search by filename or alt text…"
          aria-label="Search the media library"
          className="input py-2 pl-9"
        />
      </div>
      {error && <p className="text-sm font-medium text-rust" role="alert">{error}</p>}
      {items === null ? (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" aria-hidden>
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i} className="aspect-square animate-pulse rounded-lg bg-sand" />
          ))}
        </ul>
      ) : items.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted">{q ? "No images match your search." : "The library is empty. Use the Upload tab to add images."}</p>
      ) : (
        <>
          <p className="sr-only" aria-live="polite">{total} images</p>
          <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5" aria-label="Media library images">
            {items.map((m) => {
              const on = draft?.ref === m.url;
              const d: Draft = { ref: m.url, info: { source: "library", alt: m.alt, width: m.width, height: m.height, filename: m.filename } };
              return (
                <li key={m.id} className="min-w-0">
                  <button
                    type="button"
                    aria-pressed={on}
                    aria-label={`${m.filename}${m.alt ? `: ${m.alt}` : " (no alt text)"}`}
                    title={m.alt || m.filename}
                    onClick={() => setDraft(d)}
                    onDoubleClick={() => onConfirm(d)}
                    className={`relative block aspect-square w-full overflow-hidden rounded-lg border-2 bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${on ?"border-signal ring-2 ring-signal/30":"border-transparent hover:border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" width={160} height={160} loading="lazy" decoding="async" className="h-full w-full object-cover" />
                    {on && (
                      <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-signal text-white">
                        <Check aria-hidden className="h-3.5 w-3.5" />
                      </span>
                    )}
                    {!m.alt && <span className="absolute bottom-1 left-1 rounded bg-amber-100 px-1 text-[10px] font-bold text-amber-800">No alt</span>}
                  </button>
                  <p className="mt-1 truncate text-[11px] text-muted">{formatDims(m.width, m.height) || m.filename}</p>
                </li>
              );
            })}
          </ul>
          {cursor && (
            <div className="flex justify-center">
              <button type="button" className="btn-ghost py-2" disabled={loading} onClick={() => load(q.trim(), cursor)}>
                {loading && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />} Load more ({Math.max(0, total - items.length)} left)
              </button>
            </div>
          )}
        </>
      )}
      {loading && items !== null && !cursor && <p className="text-center text-xs text-muted">Loading…</p>}
    </div>
  );
}

function UploadPanel({ onUploaded }: { onUploaded: (items: MediaItem[]) => void }) {
  return (
    <div className="space-y-3">
      <UploadZone onUploaded={onUploaded} compact />
      <p className="text-xs text-muted">The last uploaded image is selected automatically. Add alt text in Admin → Media for images that need it.</p>
    </div>
  );
}

function StockPanel({ draft, setDraft, onConfirm }: PanelProps) {
  const stock = useMemo(() => stockPhotoOptions(), []);
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(60);
  const searchId = useId();
  const filtered = useMemo(() => {
    const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    return stock.filter(s => terms.every(term => `${s.key} ${s.alt}`.toLowerCase().includes(term)));
  }, [stock, query]);
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted">Choose a representative product or pallet image.</p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label htmlFor={searchId} className="mb-1 block text-xs font-semibold">Search photos</label>
          <input id={searchId} type="search" value={query} onChange={e => { setQuery(e.target.value); setLimit(60); }} placeholder="Search products, pallets or image keys" className="w-full rounded-lg border border-line px-3 py-2 text-sm" />
        </div>
      </div>
      <p role="status" className="text-xs text-muted">{filtered.length} matching photos</p>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-5">
        {filtered.slice(0, limit).map((s) => {
          const on = draft?.ref === s.key;
          const d: Draft = { ref: s.key, info: { source: "stock", alt: s.alt, width: null, height: null, filename: s.key } };
          return (
            <li key={s.key} className="min-w-0">
              <button
                type="button"
                aria-pressed={on}
                aria-label={s.alt}
                title={s.alt}
                onClick={() => setDraft(d)}
                onDoubleClick={() => onConfirm(d)}
                className={`relative block w-full overflow-hidden rounded-lg border-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${on ?"border-signal ring-2 ring-signal/30":"border-transparent hover:border-transparent"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={refPreviewSrc(s.key, 240)} alt="" width={240} height={160} loading="lazy" decoding="async" className="aspect-[3/2] w-full object-cover" />
                {on && (
                  <span className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-signal text-white">
                    <Check aria-hidden className="h-3.5 w-3.5" />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
      {!filtered.length && <p className="py-4 text-sm text-muted">No photos match. Try another search.</p>}
      {filtered.length > limit && <button type="button" onClick={() => setLimit(n => n + 60)} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold">Load more photos</button>}
    </div>
  );
}

function LinkPanel({ draft, setDraft }: Omit<PanelProps, "onConfirm">) {
  const inputId = useId();
  const [url, setUrl] = useState(draft?.info.source === "url" ? draft.ref : "");
  const [error, setError] = useState<string | null>(null);
  const [broken, setBroken] = useState(false);
  const ref = normalizeUrl(url);

  function use() {
    if (!ref) {
      setError("Enter a site path starting with / (e.g. /media/lib/photo.jpg) or an https:// URL.");
      return;
    }
    setError(null);
    const meta = metaCache.get(ref);
    setDraft({ ref, info: { source: meta ? "library" : "url", alt: meta?.alt ?? "", width: meta?.width ?? null, height: meta?.height ?? null, filename: meta?.filename } });
    if (isMediaLibUrl(ref) && !meta) {
      loadMeta(ref).then((m) => m && setDraft({ ref, info: { source: "library", alt: m.alt, width: m.width, height: m.height, filename: m.filename } }));
    }
  }

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="label">Image URL</label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id={inputId}
          className="input"
          inputMode="url"
          placeholder="/media/lib/… or https://…"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setBroken(false);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              use();
            }
          }}
          aria-invalid={!!error || undefined}
          aria-describedby={`${inputId}-hint`}
        />
        <button type="button" className="btn-dark shrink-0 py-2" disabled={!url.trim()} onClick={use}>
          Select URL
        </button>
      </div>
      <p id={`${inputId}-hint`} className="text-xs text-muted">
        Tip: copy an image's URL from Admin → Media. External images must use https and load from their own server, which may be slower.
      </p>
      {error && <p className="text-sm font-medium text-rust" role="alert">{error}</p>}
      {ref && (
        <div className="overflow-hidden rounded-xl bg-sand">
          {broken ? (
            <p className="p-6 text-center text-sm text-rust">This image couldn't be loaded. Check the URL.</p>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ref} alt="Preview of the linked image" className="mx-auto max-h-64 w-auto max-w-full object-contain" onError={() => setBroken(true)} />
          )}
        </div>
      )}
    </div>
  );
}
