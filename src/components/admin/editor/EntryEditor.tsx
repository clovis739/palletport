"use client";

import Link from "next/link";
import { useCallback, useDeferredValue, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState, useTransition } from "react";
import { AlertCircle, CheckCircle2, ChevronLeft, Columns2, ExternalLink, Eye, Info, Loader2, PanelRight, Pencil, X } from "lucide-react";
import type { Block } from "@/lib/blocks";
import { EXCERPT_MAX, SLUG_RE, slugify, type EditorEntry, type EditorMeta, type EditorOptions } from "@/lib/content-editor";
import { saveEntryAction } from "@/app/actions/content";
import { StatusPill } from "@/components/admin/Badge";
import { BlockCanvas } from "./BlockCanvas";
import { blocksReducer } from "./blockState";
import { EntryPreview } from "./EntryPreview";
import { Counter, CoverPanel, DangerPanel, SeoPanel, StatusPanel, TaxonomyPanel } from "./EditorSidebar";

type Doc = Omit<EditorEntry, "blocks">;
type Mode = "edit" | "preview" | "split";
type Saving = false | "save" | "publish" | "unpublish";
type Notice = { message: string; tone: "success" | "error" | "info"; undo?: () => void; n: number };

const PLACEHOLDER: Record<Doc["type"], string> = {
  POST: "Post title",
  GUIDE: "Guide title, e.g. Stocking a bin store",
  HELP: "Question or topic, e.g. How do I place an order?",
  LEGAL: "Policy title",
  PAGE: "Page title",
};

/** Comparable snapshot for the unsaved-changes check (server timestamps excluded). */
const snapshot = (d: Doc, b: Block[]) => JSON.stringify([{ ...d, publishedAt: null, updatedAt: null }, b]);

/**
 * The visual block editor (client). Holds the whole document in state, saves it with the saveEntryAction
 * server action (Ctrl/⌘+S), tracks unsaved changes and renders a live preview with the public <Blocks> renderer.
 */
export function EntryEditor({ initial, options }: { initial: EditorEntry; options: EditorOptions }) {
  const [doc, setDoc] = useState<Doc>(() => {
    const { blocks: _b, ...rest } = initial;
    void _b;
    return rest;
  });
  const [blocks, dispatch] = useReducer(blocksReducer, initial.blocks);
  const [saved, setSaved] = useState(() => snapshot(doc, initial.blocks));
  const [savedSlug, setSavedSlug] = useState(initial.id ? initial.slug : "");
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [saving, setSaving] = useState<Saving>(false);
  const [, startTransition] = useTransition();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [blockErrors, setBlockErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);
  const [mode, setMode] = useState<Mode>("edit");
  const [showSide, setShowSide] = useState(true);
  const [tab, setTab] = useState<"content" | "settings">("content");

  const titleRef = useRef<HTMLTextAreaElement>(null);
  const excerptRef = useRef<HTMLTextAreaElement>(null);
  // Auto-grow the title and excerpt fields.
  useLayoutEffect(() => {
    for (const el of [titleRef.current, excerptRef.current]) {
      if (!el) continue;
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight + 2}px`;
    }
  }, [doc.title, doc.excerpt, mode, tab]);

  const dirty = useMemo(() => snapshot(doc, blocks) !== saved, [doc, blocks, saved]);
  const docRef = useRef(doc);
  const blocksRef = useRef(blocks);
  const savingRef = useRef(saving);
  docRef.current = doc;
  blocksRef.current = blocks;
  savingRef.current = saving;

  const patch = useCallback((p: Partial<Doc>) => setDoc((d) => ({ ...d, ...p })), []);
  const meta = useCallback((p: Partial<EditorMeta>) => setDoc((d) => ({ ...d, meta: { ...d.meta, ...p } })), []);
  const notify = useCallback((message: string, tone: Notice["tone"] = "success", undo?: () => void) => setNotice({ message, tone, undo, n: Date.now() }), []);

  // ---------------------------------------------------------------- save
  const save = useCallback(
    (to?: "PUBLISHED" | "DRAFT") => {
      if (savingRef.current) return;
      const d = docRef.current;
      const b = blocksRef.current;
      const status = to ?? d.status;
      const kind: Saving = status === "PUBLISHED" && d.status !== "PUBLISHED" ? "publish" : status === "DRAFT" && d.status === "PUBLISHED" ? "unpublish" : "save";
      setSaving(kind);
      savingRef.current = kind;
      startTransition(async () => {
        try {
          const r = await saveEntryAction({
            id: d.id,
            type: d.type,
            title: d.title,
            slug: d.slug,
            excerpt: d.excerpt,
            category: d.category,
            tags: d.tags,
            author: d.author,
            status,
            blocks: b,
            meta: d.meta,
          });
          if (r.error || !r.entry) {
            const fe = r.fieldErrors ?? {};
            const be = r.blockErrors ?? {};
            setFieldErrors(fe);
            setBlockErrors(be);
            notify(r.error ?? "Could not save.", "error");
            const contentErr = Object.keys(be).length > 0 || "title" in fe || "slug" in fe || "excerpt" in fe;
            if (!contentErr && Object.keys(fe).length) {
              setTab("settings");
              setShowSide(true);
            } else setTab("content");
            requestAnimationFrame(() => {
              const el = document.querySelector<HTMLElement>("[data-editor] [aria-invalid='true'], [data-editor] [role='alert']");
              el?.scrollIntoView({ block: "center", behavior: "smooth" });
              if (el && el.matches("input, textarea")) el.focus({ preventScroll: true });
            });
            return;
          }
          const e = r.entry;
          const next = (cur: Doc): Doc => ({ ...cur, id: e.id, status: e.status, publishedAt: e.publishedAt, updatedAt: e.updatedAt, meta: { ...cur.meta, date: cur.meta.date || e.meta.date } });
          setDoc(next);
          setSaved(snapshot(next(d), b));
          setSavedSlug(d.slug);
          setSavedAt(r.savedAt ?? new Date().toISOString());
          setFieldErrors({});
          setBlockErrors({});
          notify(r.ok ?? "Saved");
          if (!d.id && e.id) window.history.replaceState(null, "", `/dashboard/content/${e.id}`);
        } catch {
          notify("Could not save — check your connection and try again.", "error");
        } finally {
          setSaving(false);
          savingRef.current = false;
        }
      });
    },
    [notify],
  );

  // Ctrl/⌘+S saves (keeps the current status).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.altKey && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [save]);

  // Unsaved-changes guard: tab close/reload, and in-app link clicks.
  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      if (!window.confirm("You have unsaved changes. Leave without saving?")) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", onUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty]);

  // Toast auto-dismiss
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), notice.undo ? 7000 : notice.tone === "error" ? 8000 : 4000);
    return () => clearTimeout(t);
  }, [notice]);

  const onRemoved = useCallback(
    (block: Block, index: number) => notify("Block deleted", "info", () => dispatch({ t: "insert", at: index, block })),
    [notify],
  );

  // ---------------------------------------------------------------- fields
  const setTitle = (title: string) => setDoc((d) => ({ ...d, title, slug: slugTouched ? d.slug : slugify(title) }));
  const slugIssue = !doc.slug
    ? ""
    : !SLUG_RE.test(doc.slug)
      ? "Use lowercase letters, numbers and single hyphens."
      : options.slugs.includes(doc.slug)
        ? `Another ${options.typeLabel.toLowerCase()} already uses this URL.`
        : "";
  const slugChangedLive = doc.status === "PUBLISHED" && savedSlug && doc.slug !== savedSlug;

  const previewDoc = useDeferredValue(doc);
  const previewBlocks = useDeferredValue(blocks);
  const livePath = savedSlug ? `${options.basePath}/${savedSlug}` : "";
  const published = doc.status === "PUBLISHED";
  const back = `/dashboard/content?type=${doc.type}`;

  function changeMode(m: Mode) {
    setMode(m);
    if (m === "split") setShowSide(false);
    if (m === "edit") setShowSide(true);
  }

  const modeBtn = (m: Mode, label: string, Icon: typeof Eye, extra = "") => (
    <button
      type="button"
      role="radio"
      aria-checked={mode === m}
      onClick={() => changeMode(m)}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-signal ${mode === m ? "bg-ink text-white" : "text-muted hover:text-ink"} ${extra}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  const editorPane = (
    <div className="min-w-0 space-y-4">
      <section aria-label="Title and summary" className="space-y-3 rounded-2xl bg-white p-4 sm:p-5">
        <div>
          <label htmlFor="entry-title" className="sr-only">Title</label>
          <textarea
            ref={titleRef}
            id="entry-title"
            rows={1}
            value={doc.title}
            onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
            placeholder={PLACEHOLDER[doc.type]}
            aria-invalid={!!fieldErrors.title || undefined}
            className="block w-full resize-none bg-transparent font-display text-2xl font-bold leading-tight outline-none overflow-hidden placeholder:text-ink/25 sm:text-3xl"
          />
          {fieldErrors.title && <p role="alert" className="mt-1 text-xs font-medium text-rust">{fieldErrors.title}</p>}
        </div>

        <div>
          <div className="flex min-w-0 flex-wrap items-center gap-x-1 gap-y-1 text-sm">
            <label htmlFor="entry-slug" className="shrink-0 text-muted">
              <span className="sr-only">URL slug. Full address: </span>
              <span className="hidden sm:inline">{options.siteHost}</span>
              {options.basePath}/
            </label>
            <input
              id="entry-slug"
              value={doc.slug}
              onChange={(e) => {
                setSlugTouched(true);
                patch({ slug: e.target.value.toLowerCase().replace(/\s+/g, "-") });
              }}
              onBlur={() => doc.slug && patch({ slug: slugify(doc.slug) })}
              spellCheck={false}
              autoCapitalize="none"
              aria-invalid={!!(fieldErrors.slug || slugIssue) || undefined}
              aria-describedby="entry-slug-hint"
              placeholder="url-slug"
              className={`min-w-[8rem] flex-1 rounded-md border bg-paper px-2 py-1 font-mono text-[13px] outline-none focus:border-transparent focus:bg-white ${fieldErrors.slug || slugIssue ?"border-rust":"border-transparent"}`}
            />
            {slugTouched && doc.title && slugify(doc.title) !== doc.slug && (
              <button type="button" className="rounded-md px-2 py-1 text-xs font-semibold text-signal-dark hover:bg-sand" onClick={() => { setSlugTouched(false); patch({ slug: slugify(doc.title) }); }}>
                Use title
              </button>
            )}
          </div>
          <p id="entry-slug-hint" className={`mt-1 text-xs ${fieldErrors.slug || slugIssue ? "font-medium text-rust" : slugChangedLive ? "font-medium text-amber-700" : "text-muted"}`} role={fieldErrors.slug ? "alert" : undefined}>
            {fieldErrors.slug || slugIssue || (slugChangedLive ? "Changing the address of a published page breaks existing links to it." : slugTouched ? "Custom address." : "Generated from the title until you edit it.")}
          </p>
        </div>

        <div>
          <div className="flex items-end justify-between gap-2">
            <label htmlFor="entry-excerpt" className="label">{doc.type === "HELP" ? "Short answer" : "Excerpt"}</label>
            <Counter n={doc.excerpt.length} max={EXCERPT_MAX} />
          </div>
          <textarea
            ref={excerptRef}
            id="entry-excerpt"
            rows={2}
            value={doc.excerpt}
            onChange={(e) => patch({ excerpt: e.target.value })}
            aria-invalid={!!fieldErrors.excerpt || undefined}
            aria-describedby="entry-excerpt-hint"
            placeholder="One or two sentences that sum it up."
            className="input resize-none overflow-hidden"
          />
          <p id="entry-excerpt-hint" className={`mt-1 text-xs ${fieldErrors.excerpt ? "font-medium text-rust" : "text-muted"}`}>
            {fieldErrors.excerpt || "Shown under the title and on cards, and used as the search description unless you set one."}
          </p>
        </div>
      </section>

      {Object.keys(blockErrors).length > 0 && (
        <p role="alert" className="flex items-center gap-2 rounded-xl border border-rust/30 bg-rust/5 px-3 py-2 text-sm font-medium text-rust">
          <AlertCircle aria-hidden className="h-4 w-4 shrink-0" />
          {Object.keys(blockErrors).length === 1 ? "1 block needs attention." : `${Object.keys(blockErrors).length} blocks need attention.`}
        </p>
      )}

      <section aria-label="Content blocks">
        <BlockCanvas blocks={blocks} dispatch={dispatch} errors={blockErrors} onRemoved={onRemoved} />
      </section>
    </div>
  );

  const preview = <EntryPreview doc={previewDoc} blocks={previewBlocks} options={options} />;

  return (
    <div data-editor className="-mt-2 sm:-mt-4">
      {/* Top bar */}
      <div className="sticky top-14 z-20 -mx-4 mb-4 bg-white/95 px-4 py-2.5 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Link href={back} className="inline-flex items-center gap-1 rounded-md py-1 text-sm font-semibold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal">
            <ChevronLeft aria-hidden className="h-4 w-4" />
            <span className="hidden sm:inline">{options.typeLabel === "Page" ? "Pages" : `${options.typeLabel}s`}</span>
            <span className="sm:hidden">Back</span>
          </Link>
          <StatusPill status={saving === "publish" ? "PUBLISHED" : saving === "unpublish" ? "DRAFT" : doc.status} />
          <span className="hidden text-xs text-muted sm:inline" aria-live="polite">
            {saving ? "Saving…" : dirty ? <span className="font-semibold text-amber-700">● Unsaved changes</span> : doc.id ? "All changes saved" : "New — not saved yet"}
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div role="radiogroup" aria-label="Editor view" className="inline-flex rounded-full bg-white p-0.5">
              {modeBtn("edit", "Edit", Pencil)}
              {modeBtn("preview", "Preview", Eye)}
              {modeBtn("split", "Split", Columns2, "hidden xl:inline-flex")}
            </div>
            <button
              type="button"
              onClick={() => setShowSide((s) => !s)}
              aria-pressed={showSide}
              aria-label="Show settings sidebar"
              title="Settings sidebar"
              className={`hidden h-9 w-9 place-items-center rounded-full focus-visible:outline-2 focus-visible:outline-signal lg:grid ${showSide ?"bg-ink text-white":"bg-white text-ink"}`}
            >
              <PanelRight aria-hidden className="h-4 w-4" />
            </button>
            {livePath && (
              <a
                href={published ? livePath : `${livePath}?preview=1`}
                target="_blank"
                rel="noopener"
                className="hidden h-9 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-signal sm:inline-flex"
              >
                {published ? "View live" : "Preview draft"} <ExternalLink aria-hidden className="h-3.5 w-3.5" />
              </a>
            )}
            {published ? (
              <button type="button" className="btn-primary px-4 py-2" disabled={!!saving} onClick={() => save()}>
                {saving === "save" && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />} Update
              </button>
            ) : (
              <>
                <button type="button" className="btn-ghost px-4 py-2" disabled={!!saving} onClick={() => save()}>
                  {saving === "save" && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />} Save<span className="hidden sm:inline"> draft</span>
                </button>
                <button type="button" className="btn-primary px-4 py-2" disabled={!!saving} onClick={() => save("PUBLISHED")}>
                  {saving === "publish" && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />} Publish
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Phones & tablets: content / settings tabs */}
      <div role="tablist" aria-label="Editor sections" className="mb-4 grid grid-cols-2 rounded-full bg-white p-0.5 lg:hidden">
        {(["content", "settings"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            id={`editor-tab-${t}`}
            aria-selected={tab === t}
            aria-controls={`editor-${t}`}
            onClick={() => setTab(t)}
            className={`rounded-full py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-signal ${tab === t ? "bg-ink text-white" : "text-muted"}`}
          >
            {t === "content" ? "Content" : "Settings"}
            {t === "settings" && Object.keys(fieldErrors).some((k) => !["title", "slug", "excerpt"].includes(k)) && <span className="ml-1 text-rust">•</span>}
          </button>
        ))}
      </div>

      <div className={`grid grid-cols-1 gap-6 ${showSide ? "lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        <div id="editor-content" role="tabpanel" aria-labelledby="editor-tab-content" className={`min-w-0 ${tab === "settings" ? "hidden lg:block" : ""}`}>
          {mode === "edit" && editorPane}
          {mode === "preview" && preview}
          {mode === "split" && (
            <div className="xl:grid xl:grid-cols-2 xl:gap-6">
              {editorPane}
              <div className="hidden min-w-0 xl:block">
                <div className="sticky top-32 max-h-[calc(100dvh-9rem)] overflow-auto overscroll-contain rounded-2xl" data-lenis-prevent>
                  {preview}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside
          id="editor-settings"
          role="tabpanel"
          aria-labelledby="editor-tab-settings"
          className={`min-w-0 space-y-3 ${tab === "content" ? "hidden" : "block"} ${showSide ? "lg:block" : "lg:hidden"} lg:sticky lg:top-32 lg:max-h-[calc(100dvh-9rem)] lg:overflow-y-auto lg:overscroll-contain lg:pb-4`}
          data-lenis-prevent
        >
          <StatusPanel doc={doc} meta={meta} saving={saving} dirty={dirty} savedAt={savedAt} onSave={save} />
          <TaxonomyPanel doc={doc} patch={patch} meta={meta} options={options} errors={fieldErrors} />
          <CoverPanel doc={doc} meta={meta} errors={fieldErrors} />
          <SeoPanel doc={doc} meta={meta} options={options} errors={fieldErrors} />
          <DangerPanel doc={doc} canDelete={options.canDelete} />
        </aside>
      </div>

      {notice && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[70] flex justify-center px-4 pb-[env(safe-area-inset-bottom)] sm:bottom-6 sm:justify-end sm:px-6">
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-medium ${notice.tone ==="error"?"border-rust/30 text-rust": notice.tone ==="success"?"border-moss/30 text-moss":"border-transparent text-ink"}`}
          >
            {notice.tone === "error" ? <AlertCircle aria-hidden className="h-4 w-4 shrink-0" /> : notice.tone === "success" ? <CheckCircle2 aria-hidden className="h-4 w-4 shrink-0" /> : <Info aria-hidden className="h-4 w-4 shrink-0" />}
            <p className="min-w-0 flex-1 text-ink">{notice.message}</p>
            {notice.undo && (
              <button
                type="button"
                className="rounded-full px-2.5 py-1 text-xs font-bold text-signal-dark hover:bg-sand"
                onClick={() => {
                  notice.undo?.();
                  setNotice(null);
                }}
              >
                Undo
              </button>
            )}
            <button type="button" onClick={() => setNotice(null)} aria-label="Dismiss" className="-m-1 grid h-7 w-7 shrink-0 place-items-center rounded-full text-muted hover:bg-sand">
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
