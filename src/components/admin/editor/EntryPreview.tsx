"use client";

import { memo } from "react";
import type { Block } from "@/lib/blocks";
import { readMinutes } from "@/lib/blocks";
import type { EditorEntry, EditorOptions } from "@/lib/content-editor";
import { Blocks } from "@/components/content/Blocks";
import { SiteImage } from "@/components/content/SiteImage";

const fmt = (d: string) => (d ? new Date(`${d}T12:00:00`).toLocaleDateString("en-US", { dateStyle: "long" }) : "");

/**
 * Live preview using the public renderer (<Blocks>, the same component the storefront uses) inside a
 * simplified page header for the entry type.
 */
export const EntryPreview = memo(function EntryPreview({ doc, blocks, options }: { doc: Omit<EditorEntry, "blocks">; blocks: Block[]; options: EditorOptions }) {
  const t = doc.type;
  const author = options.authors.find((a) => a.key === doc.author)?.name ?? options.authors[0]?.name;
  const dense = t === "GUIDE" || t === "HELP" || t === "LEGAL";
  const cover = doc.meta.cover;
  const bg = t === "GUIDE" ? { background: `hsl(${doc.meta.hue ?? 24} 45% 93%)` } : undefined;

  return (
    <div className="overflow-hidden rounded-2xl bg-paper" aria-label="Preview">
      <div className="flex items-center gap-2 bg-white px-3 py-2 text-[11px] text-muted">
        <span aria-hidden className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
          <span className="h-2 w-2 rounded-full bg-line" />
        </span>
        <span className="min-w-0 truncate">{options.siteHost}{options.basePath}/{doc.slug || "…"}</span>
      </div>
      <header className={t ==="GUIDE"?"":"bg-sand/50"} style={bg}>
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          {t === "POST" && (doc.category || doc.tags.length > 0) && (
            <div className="mb-3 flex flex-wrap gap-2">
              {doc.category && <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">{doc.category}</span>}
              {doc.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-white px-3 py-1 text-xs font-semibold">{tag}</span>
              ))}
            </div>
          )}
          {t === "HELP" && doc.category && <p className="mb-2 text-xs text-muted">Help center / {doc.category}</p>}
          <h1 className={`break-words font-display font-bold leading-tight ${t === "POST" || t === "PAGE" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"}`}>
            {doc.title || <span className="text-muted">Untitled</span>}
          </h1>
          {doc.excerpt && t !== "LEGAL" && <p className="mt-3 text-base text-ink/70">{doc.excerpt}</p>}
          {t === "POST" && (
            <p className="mt-4 text-xs text-muted">
              {author} · {fmt(doc.meta.date) || "Not published yet"}
              {doc.meta.updated && doc.meta.updated !== doc.meta.date && <> · Updated {fmt(doc.meta.updated)}</>} · {readMinutes(blocks)} min read
            </p>
          )}
          {t === "LEGAL" && (doc.meta.updated || doc.meta.date) && <p className="mt-1 text-sm text-muted">Last updated {fmt(doc.meta.updated || doc.meta.date)}</p>}
        </div>
      </header>
      <div className="px-5 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-2xl">
          {(t === "POST" || t === "PAGE") && cover && (
            <SiteImage src={cover} width={1000} ratio={16 / 9} sizes="720px" className="mb-8 aspect-[16/9] w-full rounded-2xl" />
          )}
          {blocks.length ? (
            <Blocks blocks={blocks} size={dense ? "sm" : "md"} />
          ) : (
            <p className="rounded-xl p-6 text-center text-sm text-muted">Add blocks to see them here.</p>
          )}
        </div>
      </div>
    </div>
  );
});
