import { AlertTriangle, Info, Lightbulb } from "lucide-react";
import type { Block } from "@/lib/blocks";
import { slugifyHeading } from "@/lib/blocks";
import { RichText } from "./RichText";
import { SiteImage } from "./SiteImage";
import { FaqAccordion } from "./FaqAccordion";

const CALLOUT = {
  info: { icon: Info, cls: "bg-sand/60", iconCls: "text-ink" },
  tip: { icon: Lightbulb, cls: "border-moss/25 bg-moss/5", iconCls: "text-moss" },
  warning: { icon: AlertTriangle, cls: "border-rust/25 bg-rust/5", iconCls: "text-rust" },
} as const;

/**
 * Server renderer for content blocks, using the site's article prose styles (same look as blog posts).
 *
 *   <Blocks blocks={entry.blocks} />                      // blog/guide/help/legal body
 *   <Blocks blocks={entry.blocks} size="sm" />            // denser (help center, sidebars)
 *
 * H2 headings get ids (slugified) that match blocksToc() for "On this page" navigation.
 */
export function Blocks({ blocks, size = "md", className = "" }: { blocks: Block[]; size?: "sm" | "md"; className?: string }) {
  const text = size === "sm" ? "text-[15px]" : "text-[16px]";
  return (
    <div className={`space-y-5 leading-relaxed text-ink/85 ${text} ${className}`}>
      {blocks.map((b, i) => (
        <BlockView key={b.id ?? i} block={b} />
      ))}
    </div>
  );
}

export function BlockView({ block: b }: { block: Block }) {
  switch (b.type) {
    case "heading":
      return b.level === 2 ? (
        <h2 id={slugifyHeading(b.text)} className="scroll-mt-40 pt-3 font-display text-xl font-bold text-ink sm:text-2xl"><RichText text={b.text} /></h2>
      ) : (
        <h3 className="pt-1 font-display text-lg font-bold text-ink"><RichText text={b.text} /></h3>
      );

    case "paragraph":
      return b.text ? <p><RichText text={b.text} /></p> : null;

    case "list": {
      const items = b.items.filter(Boolean);
      if (!items.length) return null;
      return b.ordered ? (
        <ol className="list-decimal space-y-1.5 pl-5 marker:font-semibold marker:text-signal-dark">{items.map((t, j) => <li key={j}><RichText text={t} /></li>)}</ol>
      ) : (
        <ul className="list-disc space-y-1.5 pl-5 marker:text-signal">{items.map((t, j) => <li key={j}><RichText text={t} /></li>)}</ul>
      );
    }

    case "image":
      return (
        <figure className="space-y-2">
          <SiteImage
            src={b.src}
            alt={b.alt}
            width={b.width ?? 1000}
            height={b.height}
            ratio={b.width && b.height ? b.width / b.height : 16 / 9}
            sizes="(max-width: 1024px) 100vw, 720px"
            className="h-auto w-full rounded-2xl"
          />
          {b.caption && <figcaption className="text-center text-xs text-muted"><RichText text={b.caption} /></figcaption>}
        </figure>
      );

    case "table":
      return (
        <figure className="overflow-x-auto overscroll-x-contain rounded-2xl bg-white">
          <table className="w-full min-w-[520px] text-left text-sm">
            {b.caption && <caption className="px-4 pt-3 text-left text-xs font-semibold uppercase tracking-wider text-muted">{b.caption}</caption>}
            {b.head.length > 0 && (
              <thead className="bg-sand">
                <tr>{b.head.map((c, j) => <th key={j} scope="col" className="px-4 py-3 font-semibold text-ink">{c}</th>)}</tr>
              </thead>
            )}
            <tbody >
              {b.rows.map((r, j) => (
                <tr key={j} className="align-top">
                  {r.map((c, k) =>
                    k === 0 ? (
                      <th key={k} scope="row" className="px-4 py-3 font-semibold text-ink"><RichText text={c} /></th>
                    ) : (
                      <td key={k} className="px-4 py-3"><RichText text={c} /></td>
                    ),
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </figure>
      );

    case "faq": {
      const items = b.items.filter((f) => f.q && f.a);
      if (!items.length) return null;
      return (
        <FaqAccordion
          className="not-prose"
          defaultOpen={null}
          // Questions are plain text (they sit inside the toggle button, so no links); answers keep formatting and links.
          items={items.map((f) => ({ q: f.q.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1").replace(/[*_`]/g, ""), a: <p><RichText text={f.a} /></p> }))}
        />
      );
    }

    case "callout": {
      const c = CALLOUT[b.tone];
      const Icon = c.icon;
      return (
        <aside className={`flex gap-3 rounded-2xl p-4 sm:p-5 ${c.cls}`}>
          <Icon aria-hidden className={`mt-0.5 h-5 w-5 shrink-0 ${c.iconCls}`} />
          <div className="min-w-0 space-y-1">
            {b.title && <p className="font-display font-bold text-ink">{b.title}</p>}
            <p><RichText text={b.text} /></p>
          </div>
        </aside>
      );
    }

    case "quote":
      return b.text ? (
        <blockquote className="border-l-4 border-signal pl-4 sm:pl-5">
          <p className="font-display text-lg font-semibold leading-snug text-ink sm:text-xl"><RichText text={b.text} /></p>
          {b.cite && <footer className="mt-2 text-sm text-muted">— {b.cite}</footer>}
        </blockquote>
      ) : null;

    case "divider":
      return <div className="h-4" aria-hidden />;
  }
}
