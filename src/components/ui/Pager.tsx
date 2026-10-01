import Link from "next/link";
import { NextIcon, PrevIcon } from "@/components/Icons";

type Params = Record<string, string | number | undefined | null>;

/** Reads a 1-based page number from a search param, clamped to 1…pages. */
export function pageParam(value: string | string[] | undefined, pages = Infinity) {
  const n = Math.floor(Number(Array.isArray(value) ? value[0] : value) || 1);
  return Math.min(Math.max(1, n), Math.max(1, pages));
}

export function pageCount(total: number, perPage: number) {
  return Math.max(1, Math.ceil(total / perPage));
}

/** Page numbers to show: first, last, current ±1, with gaps as null (1 … 4 5 6 … 12). */
function windowed(page: number, pages: number): (number | null)[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((n) => n >= 1 && n <= pages));
  if (page <= 3) [2, 3, 4].forEach((n) => n <= pages && keep.add(n));
  if (page >= pages - 2) [pages - 1, pages - 2, pages - 3].forEach((n) => n >= 1 && keep.add(n));
  const out: (number | null)[] = [];
  let last = 0;
  for (const n of [...keep].sort((a, b) => a - b)) {
    if (n - last > 1) out.push(null);
    out.push(n);
    last = n;
  }
  return out;
}

/**
 * Storefront pagination (server): Prev · 1 … 4 5 6 … 12 · Next, plus "Showing 25–48 of 280".
 * `params` are the other search params to keep; page 1 drops the page param so it has one URL.
 *
 *   <Pager base="/new" params={{}} page={page} perPage={24} total={total} />
 *   <Pager base="/" param="recent" hash="recently-added" … />   // a paginated section on a bigger page
 */
export function Pager({
  base,
  params = {},
  param = "page",
  hash,
  page,
  perPage,
  total,
  noun = "lots",
  className = "mt-10",
}: {
  base: string;
  params?: Params;
  param?: string;
  hash?: string;
  page: number;
  perPage: number;
  total: number;
  noun?: string;
  className?: string;
}) {
  const pages = pageCount(total, perPage);
  if (total <= perPage) return null;
  const href = (n: number) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (k !== param && v !== undefined && v !== null && v !== "") u.set(k, String(v));
    if (n > 1) u.set(param, String(n));
    const s = u.toString();
    return `${base}${s ? `?${s}` : ""}${hash ? `#${hash}` : ""}`;
  };
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const num = "h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-signal";
  const step = "inline-flex h-10 items-center rounded-full bg-white px-4 text-sm font-semibold hover:bg-signal hover:text-white focus-visible:outline-2 focus-visible:outline-signal";
  const off = "inline-flex h-10 items-center rounded-full bg-sand/60 px-4 text-sm font-semibold text-muted/60";

  return (
    <nav aria-label="Pagination" className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="flex items-center justify-center gap-1.5">
        {page > 1 ? (
          <Link href={href(page - 1)} rel="prev" className={step} aria-label="Previous page"><PrevIcon />Prev</Link>
        ) : (
          <span className={off} aria-disabled="true"><PrevIcon />Prev</span>
        )}
        {/* Phones: "Page 5 of 17" between Prev and Next; wider screens get the page numbers. */}
        <span className="px-3 text-sm font-semibold tabular-nums sm:hidden">Page {page} of {pages}</span>
        {windowed(page, pages).map((n, i) =>
          n === null ? (
            <span key={`gap${i}`} aria-hidden className="hidden px-1 text-muted sm:inline">…</span>
          ) : n === page ? (
            <span key={n} aria-current="page" className={`${num} hidden bg-ink text-white sm:inline-flex`}>{n}</span>
          ) : (
            <Link key={n} href={href(n)} aria-label={`Page ${n}`} className={`${num} hidden bg-white hover:bg-sand sm:inline-flex`}>{n}</Link>
          ),
        )}
        {page < pages ? (
          <Link href={href(page + 1)} rel="next" className={step} aria-label="Next page">Next<NextIcon /></Link>
        ) : (
          <span className={off} aria-disabled="true">Next<NextIcon /></span>
        )}
      </div>
      <p className="text-xs text-muted">
        Showing <span className="tabular-nums">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="tabular-nums">{total.toLocaleString()}</span> {noun}
      </p>
    </nav>
  );
}
