"use client";

import { useId, useState, type ReactNode } from "react";
import { ChevronDown, Loader2, Trash2, X } from "lucide-react";
import { SEO_DESC_MAX, SEO_TITLE_MAX, todayIso, type EditorEntry, type EditorMeta, type EditorOptions } from "@/lib/content-editor";
import { deleteEntryAction } from "@/app/actions/content";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { StatusPill } from "@/components/admin/Badge";
import { Toggle } from "@/components/admin/FormField";
import { Select } from "@/components/ui/Select";

type Doc = Omit<EditorEntry, "blocks">;
type Patch = (p: Partial<Doc>) => void;
type MetaPatch = (p: Partial<EditorMeta>) => void;

export function Panel({ title, children, defaultOpen = true, tone }: { title: string; children: ReactNode; defaultOpen?: boolean; tone?: "danger" }) {
  return (
    <details open={defaultOpen} className={`group rounded-2xl border bg-white ${tone ==="danger"?"border-rust/30":"border-transparent"}`}>
      <summary className={`flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold focus-visible:outline-2 focus-visible:outline-signal [&::-webkit-details-marker]:hidden ${tone === "danger" ? "text-rust" : ""}`}>
        {title}
        <ChevronDown aria-hidden className="h-4 w-4 shrink-0 text-muted transition-transform group-open:rotate-180" />
      </summary>
      <div className="space-y-4 px-4 py-4">{children}</div>
    </details>
  );
}

export function Counter({ n, max, id }: { n: number; max: number; id?: string }) {
  const over = n > max;
  return (
    <span id={id} className={`text-[11px] tabular-nums ${over ? "font-semibold text-rust" : n > max * 0.9 ? "text-amber-700" : "text-muted"}`} aria-live="polite">
      {n}/{max}
      {over && <span className="sr-only"> — too long</span>}
    </span>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <p role="alert" className="mt-1 text-xs font-medium text-rust">{msg}</p> : null;
}

function TagInput({ value, onChange, suggestions }: { value: string[]; onChange: (v: string[]) => void; suggestions: string[] }) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const add = (raw: string) => {
    const t = raw.trim().replace(/,+$/, "").slice(0, 40);
    if (t && !value.some((v) => v.toLowerCase() === t.toLowerCase()) && value.length < 20) onChange([...value, t]);
    setDraft("");
  };
  return (
    <div>
      <label htmlFor={`${id}-in`} className="label">Tags</label>
      <div className="flex flex-wrap items-center gap-1.5 rounded-lg bg-white p-1.5 focus-within:ring-2 focus-within:ring-ink/10">
        {value.map((t) => (
          <span key={t} className="inline-flex items-center gap-1 rounded-full bg-sand py-0.5 pl-2.5 pr-1 text-xs font-semibold">
            {t}
            <button type="button" className="grid h-5 w-5 place-items-center rounded-full hover:bg-ink hover:text-white" aria-label={`Remove tag ${t}`} onClick={() => onChange(value.filter((v) => v !== t))}>
              <X aria-hidden className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          id={`${id}-in`}
          list={`${id}-dl`}
          className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-base outline-none sm:text-sm"
          placeholder={value.length ? "Add tag…" : "e.g. Freight, Manifests"}
          value={draft}
          onChange={(e) => (e.target.value.endsWith(",") ? add(e.target.value) : setDraft(e.target.value))}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(draft);
            } else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
          }}
          onBlur={() => draft && add(draft)}
          aria-describedby={`${id}-h`}
        />
        <datalist id={`${id}-dl`}>
          {suggestions.filter((s) => !value.includes(s)).map((s) => <option key={s} value={s} />)}
        </datalist>
      </div>
      <p id={`${id}-h`} className="mt-1 text-xs text-muted">Enter or comma adds a tag. Tags link to filtered blog lists.</p>
    </div>
  );
}

/** Local date/time (the server renders UTC, the browser its own zone — hence suppressHydrationWarning). */
function When({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {new Date(iso).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
    </time>
  );
}

// ---------------------------------------------------------------- panels

export function StatusPanel({
  doc,
  meta,
  saving,
  dirty,
  savedAt,
  onSave,
}: {
  doc: Doc;
  meta: MetaPatch;
  saving: false | "save" | "publish" | "unpublish";
  dirty: boolean;
  savedAt: string | null;
  onSave: (to?: "PUBLISHED" | "DRAFT") => void;
}) {
  const id = useId();
  const published = doc.status === "PUBLISHED";
  const legal = doc.type === "LEGAL";
  return (
    <Panel title="Status & publish">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill status={saving === "publish" ? "PUBLISHED" : saving === "unpublish" ? "DRAFT" : doc.status} />
        <span className="text-xs text-muted" aria-live="polite">
          {saving ? "Saving…" : dirty ? <span className="font-semibold text-amber-700">Unsaved changes</span> : savedAt ? <>Saved <When iso={savedAt} /></> : doc.id ? "No changes" : "Not saved yet"}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${id}-date`} className="label">{legal ? "Effective" : "Publish date"}</label>
          <input id={`${id}-date`} type="date" className="input px-2.5" value={doc.meta.date} onChange={(e) => meta({ date: e.target.value })} />
        </div>
        <div>
          <label htmlFor={`${id}-upd`} className="label">{legal ? "Revised" : "Updated"}</label>
          <input id={`${id}-upd`} type="date" className="input px-2.5" value={doc.meta.updated} onChange={(e) => meta({ updated: e.target.value })} />
        </div>
      </div>
      <p className="-mt-2 text-xs text-muted">
        {legal ? "Shown as “Last updated” (revised date, else effective date). " : "Empty publish date = today when you publish. "}
        <button type="button" className="font-semibold text-signal-dark underline underline-offset-2 hover:no-underline" onClick={() => meta({ updated: todayIso() })}>
          Mark updated today
        </button>
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-primary flex-1" disabled={!!saving} onClick={() => onSave(published ? undefined : "PUBLISHED")}>
          {saving === (published ? "save" : "publish") && <Loader2 aria-hidden className="h-4 w-4 animate-spin" />}
          {published ? "Update" : "Publish"}
        </button>
        {published ? (
          <button type="button" className="btn-ghost" disabled={!!saving} onClick={() => onSave("DRAFT")}>Unpublish</button>
        ) : (
          <button type="button" className="btn-ghost" disabled={!!saving} onClick={() => onSave()}>Save draft</button>
        )}
      </div>
      {doc.updatedAt && <p className="text-xs text-muted">Last saved <When iso={doc.updatedAt} />. Ctrl/⌘ + S saves.</p>}
    </Panel>
  );
}

export function SeoPanel({ doc, meta, options, errors }: { doc: Doc; meta: MetaPatch; options: EditorOptions; errors: Record<string, string> }) {
  const id = useId();
  const suffix = ` · ${options.siteName}`;
  const baseTitle = doc.type === "GUIDE" ? `${doc.title} — buying guide` : doc.type === "HELP" ? `${doc.title} — Help` : doc.title;
  const title = (doc.meta.seoTitle || baseTitle || "Untitled") + suffix;
  const desc = doc.meta.seoDescription || doc.excerpt || "Add an excerpt or SEO description — search engines show it under the title.";
  const crumbs = [options.siteHost, ...options.basePath.split("/").filter(Boolean), doc.slug || "…"];
  const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s);
  return (
    <Panel title="Search engine listing" defaultOpen={false}>
      <div className="rounded-xl bg-paper p-3" aria-label="Search result preview">
        <p className="truncate text-xs text-ink/70">{crumbs.join(" › ")}</p>
        <p className="mt-0.5 line-clamp-2 text-[17px] leading-snug text-[#1a0dab]">{cut(title, 70)}</p>
        <p className="mt-1 line-clamp-3 text-[13px] leading-snug text-ink/75">{cut(desc, 160)}</p>
      </div>
      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={`${id}-t`} className="label">SEO title</label>
          <Counter n={(doc.meta.seoTitle || baseTitle).length + suffix.length} max={SEO_TITLE_MAX} />
        </div>
        <input id={`${id}-t`} className="input" value={doc.meta.seoTitle} placeholder={baseTitle || "Defaults to the title"} onChange={(e) => meta({ seoTitle: e.target.value })} aria-invalid={!!errors.seoTitle || undefined} />
        <Err msg={errors.seoTitle} />
      </div>
      <div>
        <div className="flex items-end justify-between gap-2">
          <label htmlFor={`${id}-d`} className="label">Meta description</label>
          <Counter n={(doc.meta.seoDescription || doc.excerpt).length} max={SEO_DESC_MAX} />
        </div>
        <textarea id={`${id}-d`} rows={3} className="input resize-y" value={doc.meta.seoDescription} placeholder={doc.excerpt || "Defaults to the excerpt"} onChange={(e) => meta({ seoDescription: e.target.value })} aria-invalid={!!errors.seoDescription || undefined} />
        <Err msg={errors.seoDescription} />
      </div>
      <Toggle name="noindex" label="Hide from search engines" description="Adds noindex and leaves the page out of the sitemap." checked={doc.meta.noindex} onChange={(e) => meta({ noindex: e.target.checked })} />
    </Panel>
  );
}

export function CoverPanel({ doc, meta, errors }: { doc: Doc; meta: MetaPatch; errors: Record<string, string> }) {
  if (doc.type !== "POST" && doc.type !== "GUIDE" && doc.type !== "PAGE") return null;
  return (
    <Panel title="Cover image">
      <MediaPicker
        value={doc.meta.cover}
        onChange={(cover) => meta({ cover })}
        hint={doc.type === "PAGE" ? "Shown above the page body and in social shares." : "Used on cards, at the top of the page and in social shares. Empty = the default photo."}
      />
      <Err msg={errors.cover} />
    </Panel>
  );
}

export function TaxonomyPanel({ doc, patch, meta, options, errors }: { doc: Doc; patch: Patch; meta: MetaPatch; options: EditorOptions; errors: Record<string, string> }) {
  const id = useId();
  if (doc.type === "POST") {
    return (
      <Panel title="Category, tags & author">
        <div>
          <label htmlFor={`${id}-cat`} className="label">Category</label>
          <input id={`${id}-cat`} list={`${id}-cats`} className="input" value={doc.category} placeholder="Choose or type a new one" onChange={(e) => patch({ category: e.target.value })} aria-invalid={!!errors.category || undefined} />
          <datalist id={`${id}-cats`}>{options.categories.map((c) => <option key={c} value={c} />)}</datalist>
          <Err msg={errors.category} />
        </div>
        <TagInput value={doc.tags} onChange={(tags) => patch({ tags })} suggestions={options.tags} />
        <div>
          <label htmlFor={`${id}-au`} className="label">Author</label>
          <Select id={`${id}-au`} value={doc.author || "team"} onChange={(e) => patch({ author: e.target.value })}>
            {options.authors.map((a) => <option key={a.key} value={a.key}>{a.name}</option>)}
            {doc.author && !options.authors.some((a) => a.key === doc.author) && <option value={doc.author}>{doc.author}</option>}
          </Select>
        </div>
        <Toggle name="featured" label="Featured post" description="Shown large at the top of the blog." checked={doc.meta.featured} onChange={(e) => meta({ featured: e.target.checked })} />
      </Panel>
    );
  }
  if (doc.type === "HELP") {
    return (
      <Panel title="Help topic">
        <div>
          <label htmlFor={`${id}-cat`} className="label">Topic</label>
          <input id={`${id}-cat`} list={`${id}-cats`} className="input" value={doc.category} placeholder="e.g. Buying" onChange={(e) => patch({ category: e.target.value })} />
          <datalist id={`${id}-cats`}>{options.categories.map((c) => <option key={c} value={c} />)}</datalist>
          <p className="mt-1 text-xs text-muted">Articles are grouped by topic on the help center. A new topic appears as its own group.</p>
        </div>
      </Panel>
    );
  }
  if (doc.type === "GUIDE") {
    const hue = doc.meta.hue ?? 24;
    return (
      <Panel title="Guide settings">
        <div>
          <div className="flex items-end justify-between">
            <label htmlFor={`${id}-hue`} className="label">Header colour</label>
            <span aria-hidden className="mb-1.5 h-5 w-10 rounded-md" style={{ background: `hsl(${hue} 45% 93%)` }} />
          </div>
          <input
            id={`${id}-hue`}
            type="range"
            min={0}
            max={360}
            value={hue}
            onChange={(e) => meta({ hue: Number(e.target.value) })}
            className="h-3 w-full cursor-pointer appearance-none rounded-full accent-ink"
            style={{ background: "linear-gradient(90deg, hsl(0 60% 85%), hsl(60 60% 85%), hsl(120 60% 85%), hsl(180 60% 85%), hsl(240 60% 85%), hsl(300 60% 85%), hsl(360 60% 85%))" }}
            aria-valuetext={`Hue ${hue}`}
          />
        </div>
        <div>
          <label htmlFor={`${id}-col`} className="label">Recommended collection</label>
          <Select id={`${id}-col`} value={doc.meta.collection} onChange={(e) => meta({ collection: e.target.value })}>
            <option value="">None</option>
            {options.collections.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
          </Select>
        </div>
        {options.lotCategories.length > 0 && (
          <fieldset>
            <legend className="label">Popular lots from</legend>
            <div className="flex flex-wrap gap-1.5">
              {options.lotCategories.map((c) => {
                const on = doc.meta.categories.includes(c.slug);
                return (
                  <label key={c.slug} className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold transition has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-signal ${on ?"bg-ink text-white":"bg-white"}`}>
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => meta({ categories: on ? doc.meta.categories.filter((s) => s !== c.slug) : [...doc.meta.categories, c.slug] })} />
                    {c.name}
                  </label>
                );
              })}
            </div>
          </fieldset>
        )}
      </Panel>
    );
  }
  return null;
}

export function DangerPanel({ doc, canDelete }: { doc: Doc; canDelete: boolean }) {
  if (!doc.id) return null;
  return (
    <Panel title="Danger zone" defaultOpen={false} tone="danger">
      {canDelete ? (
        <form action={deleteEntryAction} className="space-y-2">
          <input type="hidden" name="id" value={doc.id} />
          <input type="hidden" name="back" value={`/dashboard/content/${doc.id}`} />
          <p className="text-xs text-muted">Deleting removes the page from the site immediately. This can’t be undone — unpublish instead to keep a copy.</p>
          <ConfirmButton prompt="Delete for good?" confirmLabel="Delete" className="btn-ghost w-full border-rust/40 text-rust hover:border-rust">
            <Trash2 aria-hidden className="h-4 w-4" /> Delete {doc.type === "POST" ? "post" : "entry"}
          </ConfirmButton>
        </form>
      ) : (
        <p className="text-xs text-muted">This is the last entry of its type in the database. Deleting it would bring back the built-in content, so unpublish it instead.</p>
      )}
    </Panel>
  );
}
