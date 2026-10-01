"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { AlertTriangle, CheckSquare, Copy, LayoutGrid, ImageOff, List, Loader2, Search, Square, Trash2, X } from "lucide-react";
import { bulkDeleteMediaAction, listMediaAction } from "@/app/actions/media";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { EmptyState } from "@/components/admin/EmptyState";
import { Toast } from "@/components/admin/Flash";
import { Select } from "@/components/ui/Select";
import { UploadZone } from "@/components/admin/media/UploadZone";
import { absoluteUrl, copyText } from "@/components/admin/media/client-utils";
import {
  MEDIA_SORTS,
  MEDIA_TYPE_FILTERS,
  formatBytes,
  formatDate,
  formatDims,
  type MediaItem,
  type MediaSort,
  type MediaTypeFilter,
} from "@/components/admin/media/types";
import { MediaDetail } from "./MediaDetail";

type Query = { q: string; type: MediaTypeFilter; missingAlt: boolean; sort: MediaSort };
type View = "grid" | "list";
const VIEW_KEY = "pp_media_view";

function hrefFor(pathname: string, q: Query) {
  const p = new URLSearchParams();
  if (q.q) p.set("q", q.q);
  if (q.type) p.set("type", q.type);
  if (q.missingAlt) p.set("alt", "missing");
  if (q.sort !== "newest") p.set("sort", q.sort);
  const s = p.toString();
  return s ? `${pathname}?${s}` : pathname;
}

export function MediaLibrary({
  initial,
  query,
}: {
  initial: { items: MediaItem[]; nextCursor: string | null; total: number };
  query: Query;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  // Local list state, reset whenever the filters (URL) change. router.refresh() with the same filters keeps it.
  const queryKey = JSON.stringify(query);
  const [shownKey, setShownKey] = useState(queryKey);
  const [items, setItems] = useState(initial.items);
  const [cursor, setCursor] = useState(initial.nextCursor);
  const [total, setTotal] = useState(initial.total);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  if (shownKey !== queryKey) {
    setShownKey(queryKey);
    setItems(initial.items);
    setCursor(initial.nextCursor);
    setTotal(initial.total);
    setSelected(new Set());
  }

  const [view, setView] = useState<View>("grid");
  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "list" || v === "grid") setView(v);
    } catch {
      /* storage blocked */
    }
  }, []);
  function changeView(v: View) {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* ignore */
    }
  }

  const [toast, setToast] = useState<{ text: string; tone: "success" | "error" | "info" } | null>(null);
  const closeToast = useCallback(() => setToast(null), []);
  const [openId, setOpenId] = useState<string | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

  // --- filters ------------------------------------------------------------------------------
  const [search, setSearch] = useState(query.q);
  const lastPushed = useRef(query.q);
  useEffect(() => {
    // Sync only external changes (e.g. "Clear filters"), not the echo of what the user is typing.
    if (query.q === lastPushed.current) return;
    setSearch(query.q);
    lastPushed.current = query.q;
  }, [query.q]);
  const go = useCallback(
    (next: Partial<Query>) => startTransition(() => router.replace(hrefFor(pathname, { ...query, ...next }), { scroll: false })),
    [pathname, query, router],
  );
  useEffect(() => {
    const v = search.trim();
    if (v === lastPushed.current) return;
    const t = setTimeout(() => {
      lastPushed.current = v;
      go({ q: v });
    }, 350);
    return () => clearTimeout(t);
  }, [search, go]);

  // --- data -----------------------------------------------------------------------------------
  const [loadingMore, setLoadingMore] = useState(false);
  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const page = await listMediaAction({ ...query, cursor });
      if (page.error) setToast({ text: page.error, tone: "error" });
      setItems((prev) => {
        const seen = new Set(prev.map((i) => i.id));
        return [...prev, ...page.items.filter((i) => !seen.has(i.id))];
      });
      setCursor(page.nextCursor);
      setTotal(page.total);
    } catch {
      setToast({ text: "Couldn't load more images. Try again.", tone: "error" });
    } finally {
      setLoadingMore(false);
    }
  }

  function onUploaded(added: MediaItem[]) {
    setItems((prev) => [...added, ...prev.filter((p) => !added.some((a) => a.id === p.id))]);
    setTotal((t) => t + added.length);
    router.refresh();
  }

  function onUpdated(item: MediaItem) {
    setItems((prev) => prev.map((p) => (p.id === item.id ? item : p)));
    router.refresh();
  }

  function removeLocal(ids: string[]) {
    const gone = new Set(ids);
    setItems((prev) => prev.filter((p) => !gone.has(p.id)));
    setSelected((s) => new Set([...s].filter((id) => !gone.has(id))));
    setTotal((t) => Math.max(0, t - ids.length));
    if (openId && gone.has(openId)) setOpenId(null);
    router.refresh();
  }

  // --- selection ------------------------------------------------------------------------------
  function toggle(id: string) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  const selectedItems = useMemo(() => items.filter((i) => selected.has(i.id)), [items, selected]);
  const selectedInUse = selectedItems.filter((i) => i.uses > 0);
  const allSelected = items.length > 0 && selectedItems.length === items.length;

  async function copyUrls(list: MediaItem[]) {
    const ok = await copyText(list.map((i) => absoluteUrl(i.url)).join("\n"));
    setToast(ok ? { text: `${list.length} URL${list.length === 1 ? "" : "s"} copied`, tone: "success" } : { text: "Couldn't copy — your browser blocked the clipboard.", tone: "error" });
  }

  async function bulkDelete() {
    const ids = selectedItems.map((i) => i.id);
    if (!ids.length) return;
    try {
      const r = await bulkDeleteMediaAction({ ids, force: selectedInUse.length > 0 });
      if (r.deleted.length) removeLocal(r.deleted);
      if (r.inUse?.length) {
        // Usage changed since the page loaded: show the new counts and ask again.
        const uses = new Map(r.inUse.map((u) => [u.id, u.uses]));
        setItems((prev) => prev.map((p) => (uses.has(p.id) ? { ...p, uses: uses.get(p.id)! } : p)));
      }
      setToast(r.error ? { text: r.error, tone: "error" } : { text: r.ok ?? "Deleted", tone: "success" });
    } catch {
      setToast({ text: "Couldn't delete. You may not have permission.", tone: "error" });
    }
  }

  const filtered = !!(query.q || query.type || query.missingAlt);

  return (
    <div className="space-y-4">
      <UploadZone onUploaded={onUploaded} />

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <form
          role="search"
          className="relative w-full min-w-0 sm:w-72"
          onSubmit={(e) => {
            e.preventDefault();
            lastPushed.current = search.trim();
            go({ q: search.trim() });
          }}
        >
          <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search filename or alt text…" aria-label="Search media" className="input py-2 pl-9" />
        </form>
        <div className="w-[calc(50%-0.25rem)] sm:w-36">
          <Select aria-label="Filter by type" value={query.type} onChange={(e) => go({ type: e.target.value as MediaTypeFilter })} className="input py-2">
            {MEDIA_TYPE_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </Select>
        </div>
        <div className="w-[calc(50%-0.25rem)] sm:w-40">
          <Select aria-label="Sort" value={query.sort} onChange={(e) => go({ sort: e.target.value as MediaSort })} className="input py-2">
            {MEDIA_SORTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </div>
        <button
          type="button"
          aria-pressed={query.missingAlt}
          onClick={() => go({ missingAlt: !query.missingAlt })}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-signal ${query.missingAlt ?"bg-ink text-white":"bg-white"}`}
        >
          <AlertTriangle aria-hidden className="h-3.5 w-3.5" /> Missing alt text
        </button>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-muted" aria-live="polite">
            {pending ? <Loader2 aria-label="Loading" className="h-4 w-4 animate-spin" /> : `${total} image${total === 1 ? "" : "s"}`}
          </span>
          <div role="group" aria-label="View" className="flex rounded-full bg-white p-0.5">
            {(["grid", "list"] as const).map((v) => {
              const Icon = v === "grid" ? LayoutGrid : List;
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  aria-label={v === "grid" ? "Grid view" : "List view"}
                  onClick={() => changeView(v)}
                  className={`grid h-8 w-8 place-items-center rounded-full ${view === v ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
                >
                  <Icon aria-hidden className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Select-all row */}
      {items.length > 0 && (
        <div className="flex items-center gap-2 text-xs text-muted">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 font-semibold hover:bg-sand hover:text-ink"
            onClick={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
          >
            {allSelected ? <CheckSquare aria-hidden className="h-4 w-4" /> : <Square aria-hidden className="h-4 w-4" />}
            {allSelected ? "Clear selection" : `Select all ${items.length} shown`}
          </button>
        </div>
      )}

      {/* Results */}
      <div className={`transition-opacity ${pending ? "opacity-60" : ""}`} aria-busy={pending}>
        {items.length === 0 ? (
          <div className="rounded-2xl bg-white">
            <EmptyState
              icon={ImageOff}
              title={filtered ? "No images match" : "No images yet"}
              description={filtered ? "Try a different search or clear the filters." : "Drag images onto the upload area above, or choose files."}
              action={
                filtered ? (
                  <button type="button" className="btn-ghost" onClick={() => go({ q: "", type: "", missingAlt: false })}>
                    Clear filters
                  </button>
                ) : undefined
              }
            />
          </div>
        ) : view === "grid" ? (
          <ul className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {items.map((m) => {
              const on = selected.has(m.id);
              return (
                <li key={m.id} className="group relative min-w-0">
                  <button
                    type="button"
                    onClick={() => setOpenId(m.id)}
                    aria-label={`Open ${m.filename}${m.alt ? "" : " (missing alt text)"}`}
                    className={`block aspect-square w-full overflow-hidden rounded-xl border-2 bg-sand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal ${on ?"border-signal":"border-transparent hover:border-transparent"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt={m.alt} width={240} height={240} loading="lazy" decoding="async" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  </button>
                  <label className={`absolute left-2 top-2 grid h-7 w-7 cursor-pointer place-items-center rounded-md bg-white/95 transition-opacity ${on || selected.size ?"opacity-100":"opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100"}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(m.id)} aria-label={`Select ${m.filename}`} className="h-4 w-4 accent-[var(--color-signal)]" />
                  </label>
                  <div className="pointer-events-none absolute right-2 top-2 flex flex-col items-end gap-1">
                    {!m.alt && <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">No alt</span>}
                    {m.uses > 0 && <span className="rounded-full bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold text-white">In use</span>}
                  </div>
                  <p className="mt-1.5 truncate text-xs font-semibold" title={m.filename}>{m.filename}</p>
                  <p className="truncate text-[11px] text-muted">
                    {[formatDims(m.width, m.height), formatBytes(m.size), m.ext.toUpperCase()].filter(Boolean).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white">
            <ul >
              {items.map((m) => {
                const on = selected.has(m.id);
                return (
                  <li key={m.id} className={`flex items-center gap-3 px-3 py-2 sm:px-4 ${on ? "bg-signal/5" : ""}`}>
                    <input type="checkbox" checked={on} onChange={() => toggle(m.id)} aria-label={`Select ${m.filename}`} className="h-4 w-4 shrink-0 accent-[var(--color-signal)]" />
                    <button type="button" onClick={() => setOpenId(m.id)} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-signal">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" width={48} height={48} loading="lazy" decoding="async" className="h-12 w-12 shrink-0 rounded-md bg-sand object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{m.filename}</span>
                        <span className={`block truncate text-xs ${m.alt ? "text-muted" : "font-semibold text-amber-700"}`}>{m.alt || "Missing alt text"}</span>
                      </span>
                    </button>
                    <span className="hidden w-12 shrink-0 text-xs font-semibold text-muted md:block">{m.ext.toUpperCase()}</span>
                    <span className="hidden w-24 shrink-0 text-right text-xs text-muted lg:block">{formatDims(m.width, m.height) || "—"}</span>
                    <span className="w-16 shrink-0 text-right text-xs text-muted">{formatBytes(m.size)}</span>
                    <span className="hidden w-16 shrink-0 text-right text-xs sm:block">{m.uses > 0 ? <span className="font-semibold text-ink">{m.uses} use{m.uses === 1 ? "" : "s"}</span> : <span className="text-muted">Unused</span>}</span>
                    <span className="hidden w-24 shrink-0 text-right text-xs text-muted md:block">{formatDate(m.createdAt)}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {cursor && (
        <div className="flex justify-center">
          <button type="button" className="btn-ghost" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
            {loadingMore ? "Loading…" : `Load more (${Math.max(0, total - items.length)} left)`}
          </button>
        </div>
      )}

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8">
          <div className="flex flex-wrap items-center gap-2 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8">
            <p className="mr-auto text-sm font-semibold" aria-live="polite">
              {selected.size} selected
              {selectedInUse.length > 0 && <span className="ml-2 font-normal text-rust">· {selectedInUse.length} in use</span>}
            </p>
            <button type="button" className="btn-ghost py-2" onClick={() => copyUrls(selectedItems)}>
              <Copy aria-hidden className="h-4 w-4" /> Copy URLs
            </button>
            <form action={bulkDelete} className="contents">
              <ConfirmButton
                className="btn-ghost py-2 text-rust"
                confirmLabel={`Delete ${selected.size}`}
                prompt={
                  selectedInUse.length
                    ? `${selectedInUse.length} of these ${selectedInUse.length === 1 ? "is" : "are"} used on the site and will show as missing. Delete anyway?`
                    : `Delete ${selected.size} image${selected.size === 1 ? "" : "s"} permanently?`
                }
              >
                <Trash2 aria-hidden className="h-4 w-4" /> Delete
              </ConfirmButton>
            </form>
            <button type="button" aria-label="Clear selection" className="grid h-9 w-9 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink" onClick={() => setSelected(new Set())}>
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <MediaDetail
        item={openItem}
        onClose={() => setOpenId(null)}
        onUpdated={onUpdated}
        onDeleted={(id) => removeLocal([id])}
        onCopy={(m) => copyUrls([m])}
        onToast={setToast}
      />

      {/* Portalled so it stays interactive/announced while the drawer makes the page inert. */}
      {toast && typeof document !== "undefined" && createPortal(<Toast message={toast.text} tone={toast.tone} onClose={closeToast} />, document.body)}
    </div>
  );
}
