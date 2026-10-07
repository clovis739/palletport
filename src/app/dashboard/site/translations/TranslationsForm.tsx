"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Plus, RotateCcw, Search } from "lucide-react";
import { Select } from "@/components/ui/Select";
import { saveTranslations } from "@/app/actions/translations";

export type TranslationRow = {
  /** Dictionary key (the English text as written in the code, or the owner's own text). */
  key: string;
  /** English text as shown on the site (with the current business name). */
  label: string;
  /** Built-in Spanish ("" when there is none). */
  builtIn: string;
  /** The owner's saved Spanish ("" when not changed). */
  saved: string;
  group: string;
};

const PER_PAGE = 20;
type Show = "all" | "changed" | "missing";

export function TranslationsForm({ rows: initialRows, groups }: { rows: TranslationRow[]; groups: string[] }) {
  const [state, action, pending] = useActionState(saveTranslations, undefined);
  const [rows, setRows] = useState(initialRows);
  // English key → Spanish the owner typed (only rows they touched or saved before).
  const [edits, setEdits] = useState<Record<string, string>>(() => Object.fromEntries(initialRows.filter((r) => r.saved).map((r) => [r.key, r.saved])));
  const [dirty, setDirty] = useState(false);
  const [group, setGroup] = useState(initialRows.some((r) => r.group === groups[0]) ? groups[0] : "all");
  const [show, setShow] = useState<Show>("all");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [newEn, setNewEn] = useState("");
  const [newEs, setNewEs] = useState("");

  useEffect(() => {
    if (state?.savedAt) setDirty(false);
  }, [state?.savedAt]);
  useEffect(() => {
    if (!dirty) return;
    const onLeave = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onLeave);
    return () => window.removeEventListener("beforeunload", onLeave);
  }, [dirty]);

  const spanish = (r: TranslationRow) => edits[r.key] ?? r.builtIn;
  const changed = (r: TranslationRow) => r.key in edits && edits[r.key].trim() !== "" && edits[r.key] !== r.builtIn;
  const missing = (r: TranslationRow) => !spanish(r).trim();

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: rows.length };
    for (const r of rows) c[r.group] = (c[r.group] ?? 0) + 1;
    return c;
  }, [rows]);

  const view = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (group === "all" || r.group === group) &&
        (show === "all" || (show === "changed" ? changed(r) : missing(r))) &&
        (!needle || r.label.toLowerCase().includes(needle) || spanish(r).toLowerCase().includes(needle)),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, group, show, q, edits]);

  const pages = Math.max(1, Math.ceil(view.length / PER_PAGE));
  const current = Math.min(page, pages);
  const shown = view.slice((current - 1) * PER_PAGE, current * PER_PAGE);
  const missingCount = rows.filter(missing).length;

  const set = (key: string, value: string) => {
    setEdits((e) => ({ ...e, [key]: value }));
    setDirty(true);
  };
  const reset = (key: string) => {
    setEdits((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
    setDirty(true);
  };
  const addOwn = () => {
    const en = newEn.trim();
    const es = newEs.trim();
    if (!en || !es) return;
    if (!rows.some((r) => r.key === en)) setRows((rs) => [{ key: en, label: en, builtIn: "", saved: "", group: "Your site text" }, ...rs]);
    set(en, es);
    setNewEn("");
    setNewEs("");
    setGroup("Your site text");
    setShow("all");
    setQ(en);
    setPage(1);
  };

  const payload = JSON.stringify(Object.fromEntries(Object.entries(edits).filter(([, v]) => v.trim())));

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="payload" value={payload} />

      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,14rem)_minmax(0,12rem)]">
          <label className="relative block min-w-0">
            <span className="sr-only">Search English or Spanish text</span>
            <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={q}
              onChange={(e) => { setQ(e.target.value); setPage(1); }}
              placeholder="Search English or Spanish text"
              className="input pl-9"
            />
          </label>
          <Select value={group} onChange={(e) => { setGroup(e.target.value); setPage(1); }} className="input" aria-label="Section">
            <option value="all">All sections ({counts.all ?? 0})</option>
            {groups.filter((g) => counts[g]).map((g) => <option key={g} value={g}>{g} ({counts[g]})</option>)}
          </Select>
          <Select value={show} onChange={(e) => { setShow(e.target.value as Show); setPage(1); }} className="input" aria-label="Show">
            <option value="all">Show everything</option>
            <option value="changed">Changed by you</option>
            <option value="missing">No Spanish yet ({missingCount})</option>
          </Select>
        </div>
        <p className="mt-3 text-xs text-muted">
          Use <code className="rounded bg-sand px-1">{"{name}"}</code>-style placeholders exactly as they appear in the English text. Leave a box empty to show the English text on the Spanish site.
        </p>
      </div>

      <ul className="space-y-3">
        {shown.map((r) => {
          const value = spanish(r);
          const isChanged = changed(r);
          const id = `tr-${encodeURIComponent(r.key).slice(0, 80)}`;
          return (
            <li key={r.key} className="grid gap-3 rounded-2xl bg-white p-4 sm:p-5 lg:grid-cols-2">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">English · {r.group}</p>
                <p className="mt-1 whitespace-pre-line break-words text-sm">{r.label}</p>
              </div>
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor={id} className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                    Español {isChanged ? <span className="ml-1 rounded-full bg-moss/10 px-2 py-0.5 normal-case tracking-normal text-moss">changed</span> : !value.trim() ? <span className="ml-1 rounded-full bg-amber-100 px-2 py-0.5 normal-case tracking-normal text-amber-900">missing</span> : null}
                  </label>
                  {r.key in edits && (
                    <button type="button" onClick={() => reset(r.key)} className="inline-flex items-center gap-1 text-xs font-semibold text-muted hover:text-ink">
                      <RotateCcw aria-hidden className="h-3.5 w-3.5" /> {r.builtIn ? "Use built-in" : "Clear"}
                    </button>
                  )}
                </div>
                <textarea
                  id={id}
                  value={value}
                  onChange={(e) => set(r.key, e.target.value)}
                  rows={Math.min(6, Math.max(1, Math.ceil(Math.max(r.label.length, value.length) / 70)))}
                  className="input mt-1"
                  lang="es"
                />
              </div>
            </li>
          );
        })}
        {shown.length === 0 && <li className="rounded-2xl bg-white p-8 text-center text-sm text-muted">Nothing matches. Try another search or section.</li>}
      </ul>

      {view.length > PER_PAGE && (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="text-xs text-muted">
            {((current - 1) * PER_PAGE + 1).toLocaleString()}–{Math.min(view.length, current * PER_PAGE).toLocaleString()} of {view.length.toLocaleString()}
          </p>
          <div className="flex gap-2">
            <button type="button" disabled={current <= 1} onClick={() => setPage(current - 1)} className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold disabled:opacity-40">
              <ChevronLeft aria-hidden className="h-4 w-4" /> Prev
            </button>
            <span className="inline-flex h-9 items-center px-2 text-xs text-muted">Page {current} of {pages}</span>
            <button type="button" disabled={current >= pages} onClick={() => setPage(current + 1)} className="inline-flex h-9 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold disabled:opacity-40">
              Next <ChevronRight aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </nav>
      )}

      <div className="rounded-2xl bg-white p-4 sm:p-5">
        <p className="font-display font-bold">Add Spanish for other text</p>
        <p className="mt-1 text-sm text-muted">Paste English text exactly as it appears on the site (for example a lot&apos;s heading or a page you wrote), then its Spanish.</p>
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <textarea value={newEn} onChange={(e) => setNewEn(e.target.value)} rows={2} placeholder="English text" className="input" aria-label="English text" />
          <textarea value={newEs} onChange={(e) => setNewEs(e.target.value)} rows={2} placeholder="Texto en español" className="input" aria-label="Spanish text" lang="es" />
        </div>
        <button type="button" onClick={addOwn} disabled={!newEn.trim() || !newEs.trim()} className="btn-ghost mt-3 py-2 text-sm disabled:opacity-40">
          <Plus aria-hidden className="h-4 w-4" /> Add translation
        </button>
      </div>

      <div className="sticky bottom-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8">
        <div className="flex flex-wrap items-center gap-3 bg-white/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:px-6 lg:px-8">
          <p className={`min-w-0 flex-1 text-sm ${state?.error ? "font-medium text-rust" : state?.ok && !dirty ? "font-medium text-moss" : "text-muted"}`} role={state?.error ? "alert" : undefined}>
            {state?.error ?? (dirty ? "You have unsaved changes." : state?.ok ?? `${Object.keys(edits).length} of your own translations`)}
          </p>
          <button type="submit" className="btn-primary py-2" disabled={pending || !dirty}>
            {pending ? "Saving…" : "Save translations"}
          </button>
        </div>
      </div>
    </form>
  );
}
