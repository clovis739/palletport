import type { ReactNode } from "react";

/**
 * Dependency-free SVG charts for the admin (server components). Each chart is a <figure> with an SVG that has
 * <title>/<desc>, plus a collapsible data table fallback for screen readers and exact numbers.
 *
 *   <LineChart title="Revenue per day" labels={["Sep 1", …]} series={[{ label: "Revenue", values: cents }]}
 *     format={(c) => money(c)} />
 *   <BarChart title="Orders by status" items={[{ label: "Pending", value: 3, href: "…" }]} />
 *   <HBarChart title="Revenue by category" items={[{ label: "Tools", value: 120000 }]} format={money} />
 */

type Fmt = (n: number) => string;
const plain: Fmt = (n) => n.toLocaleString("en-US");

function niceMax(max: number) {
  if (max <= 0) return 1;
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw) ?? 10 * mag;
  return step * 4;
}

let uid = 0;
const nextId = (p: string) => `${p}-${(uid = (uid + 1) % 1e6)}`;

function DataTableFallback({ caption, head, rows }: { caption: string; head: string[]; rows: ReactNode[][] }) {
  return (
    <details className="group mt-3 text-xs">
      <summary className="inline-flex cursor-pointer select-none items-center gap-1 rounded font-semibold text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-signal">
        Show data table
      </summary>
      <div className="mt-2 max-h-72 overflow-auto rounded-lg">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-sand text-muted">
            <tr>{head.map((h, i) => <th key={h} scope="col" className={`px-3 py-1.5 font-semibold ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
          </thead>
          <tbody >
            {rows.map((r, i) => (
              <tr key={i}>{r.map((c, j) => (j === 0 ? <th key={j} scope="row" className="px-3 py-1 font-normal">{c}</th> : <td key={j} className="px-3 py-1 text-right tabular-nums">{c}</td>))}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

export type Series = { label: string; values: number[]; /** text colour class (stroke uses currentColor) */ className?: string; dashed?: boolean; area?: boolean };

/** Line / area chart over evenly spaced labels (days, weeks). First series is drawn as an area by default. */
export function LineChart({
  title,
  description,
  labels,
  series,
  format = plain,
  height = 200,
  hideTitle = false,
}: {
  title: string;
  description?: string;
  labels: string[];
  series: Series[];
  format?: Fmt;
  height?: number;
  hideTitle?: boolean;
}) {
  const tId = nextId("lc-t");
  const dId = nextId("lc-d");
  const n = labels.length;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.values)));
  const W = 1000;
  const H = height;
  const PAD = 6;
  const x = (i: number) => (n <= 1 ? W / 2 : (i / (n - 1)) * W);
  const y = (v: number) => PAD + (1 - v / max) * (H - PAD);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const total = series[0]?.values.reduce((a, b) => a + b, 0) ?? 0;
  const desc = description ?? `${series.map((s) => s.label).join(" and ")} over ${n} periods from ${labels[0]} to ${labels[n - 1]}. Total ${format(total)}.`;
  const mid = Math.floor((n - 1) / 2);

  return (
    <figure className="min-w-0">
      {!hideTitle && <figcaption className="mb-3 text-sm font-semibold">{title}</figcaption>}
      <div className="flex gap-2">
        <div aria-hidden className="relative w-14 shrink-0 text-right text-[11px] tabular-nums text-muted" style={{ height }}>
          {ticks.map((t) => (
            <span key={t} className="absolute right-0 -translate-y-1/2 whitespace-nowrap" style={{ top: `${(y(t) / H) * 100}%` }}>{format(t)}</span>
          ))}
        </div>
        <div className="relative min-w-0 flex-1" style={{ height }}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-labelledby={`${tId} ${dId}`}>
            <title id={tId}>{title}</title>
            <desc id={dId}>{desc}</desc>
            {series.map((s, si) => {
              if (!s.values.length) return null;
              const d = s.values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
              const area = s.area ?? si === 0;
              return (
                <g key={s.label} className={s.className ?? (si === 0 ? "text-signal" : "text-ink/40")}>
                  {area && <path d={`${d} L${x(s.values.length - 1)},${H} L${x(0)},${H} Z`} fill="currentColor" opacity={0.12} />}
                  <path d={d} fill="none" stroke="currentColor" strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" strokeDasharray={s.dashed ? "5 4" : undefined} />
                </g>
              );
            })}
            {/* Hover targets with native tooltips */}
            {labels.map((l, i) => (
              <rect key={i} x={n <= 1 ? 0 : x(i) - W / (n - 1) / 2} width={n <= 1 ? W : W / (n - 1)} y={0} height={H} fill="transparent" className="hover:fill-ink/5">
                <title>{`${l}: ${series.map((s) => `${s.label} ${format(s.values[i] ?? 0)}`).join(", ")}`}</title>
              </rect>
            ))}
          </svg>
        </div>
      </div>
      <div aria-hidden className="mt-1.5 flex justify-between gap-2 pl-16 text-[11px] text-muted">
        <span>{labels[0]}</span>
        {n > 2 && <span className="hidden sm:inline">{labels[mid]}</span>}
        <span>{labels[n - 1]}</span>
      </div>
      {series.length > 1 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 pl-16 text-xs text-muted">
          {series.map((s, si) => (
            <li key={s.label} className="inline-flex items-center gap-1.5">
              <svg aria-hidden width="18" height="6" className={s.className ?? (si === 0 ? "text-signal" : "text-ink/40")}><line x1="0" x2="18" y1="3" y2="3" stroke="currentColor" strokeWidth="2" strokeDasharray={s.dashed ? "4 3" : undefined} /></svg>
              {s.label}
            </li>
          ))}
        </ul>
      )}
      <DataTableFallback caption={title} head={["Period", ...series.map((s) => s.label)]} rows={labels.map((l, i) => [l, ...series.map((s) => format(s.values[i] ?? 0))])} />
    </figure>
  );
}

export type BarItem = { label: string; value: number; href?: string; className?: string };

/** Vertical bars for a handful of categories (e.g. orders by status). */
export function BarChart({ title, description, items, format = plain, height = 160, hideTitle = false }: { title: string; description?: string; items: BarItem[]; format?: Fmt; height?: number; hideTitle?: boolean }) {
  const tId = nextId("bc-t");
  const dId = nextId("bc-d");
  const max = niceMax(Math.max(0, ...items.map((i) => i.value)));
  const W = 100 * items.length;
  const desc = description ?? items.map((i) => `${i.label}: ${format(i.value)}`).join("; ");
  return (
    <figure className="min-w-0">
      {!hideTitle && <figcaption className="mb-3 text-sm font-semibold">{title}</figcaption>}
      <div className="relative" style={{ height }}>
        <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full" role="img" aria-labelledby={`${tId} ${dId}`}>
          <title id={tId}>{title}</title>
          <desc id={dId}>{desc}</desc>
          {items.map((it, i) => {
            const h = (it.value / max) * (height - 4);
            return (
              <rect key={it.label} x={i * 100 + 22} width={56} y={height - h} height={Math.max(h, it.value ? 2 : 0)} rx={3} fill="currentColor" className={it.className ?? "text-ink"}>
                <title>{`${it.label}: ${format(it.value)}`}</title>
              </rect>
            );
          })}
        </svg>
      </div>
      <ul className="mt-2 grid text-center text-[11px] leading-tight" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((it) => {
          const body = (
            <>
              <span className="block font-display text-sm font-bold tabular-nums text-ink">{format(it.value)}</span>
              <span className="block break-words text-muted">{it.label}</span>
            </>
          );
          return <li key={it.label} className="min-w-0 px-0.5">{it.href ? <a href={it.href} className="block rounded hover:bg-sand/60 focus-visible:outline-2 focus-visible:outline-signal">{body}</a> : body}</li>;
        })}
      </ul>
    </figure>
  );
}

/** Horizontal bars with labels and values (e.g. revenue by category). Readable as a plain list. */
export function HBarChart({ title, items, format = plain, hideTitle = false, empty = "No data in this period.", max: maxProp }: { title: string; items: (BarItem & { note?: string })[]; format?: Fmt; hideTitle?: boolean; empty?: ReactNode; max?: number }) {
  const max = maxProp ?? Math.max(1, ...items.map((i) => i.value));
  return (
    <figure className="min-w-0">
      {!hideTitle && <figcaption className="mb-3 text-sm font-semibold">{title}</figcaption>}
      {items.length === 0 ? (
        <p className="text-sm text-muted">{empty}</p>
      ) : (
        <ul className="space-y-3" aria-label={title}>
          {items.map((it) => (
            <li key={it.label} className="min-w-0">
              <div className="flex items-baseline justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">{it.href ? <a href={it.href} className="hover:underline">{it.label}</a> : it.label}{it.note && <span className="ml-1 text-xs text-muted">{it.note}</span>}</span>
                <span className="shrink-0 font-semibold tabular-nums">{format(it.value)}</span>
              </div>
              <svg aria-hidden viewBox="0 0 100 6" preserveAspectRatio="none" className={`mt-1 h-2 w-full ${it.className ?? "text-ink"}`}>
                <rect x={0} y={0} width={100} height={6} rx={3} className="fill-sand" />
                <rect x={0} y={0} width={Math.max(0.5, (it.value / max) * 100)} height={6} rx={3} fill="currentColor" />
              </svg>
            </li>
          ))}
        </ul>
      )}
    </figure>
  );
}
