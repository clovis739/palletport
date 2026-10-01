import Link from "next/link";
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

type Params = Record<string, string | number | undefined | null>;

function href(base: string, params: Params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") u.set(k, String(v));
  const s = u.toString();
  return s ? `${base}?${s}` : base;
}

/**
 * Sortable column header link (server). `params` are the current filters (without sort/dir/page).
 *
 *   header: <SortHeader base="/dashboard/orders" params={filters} field="total" sort={sort} dir={dir}>Total</SortHeader>
 */
export function SortHeader({ base, params, field, sort, dir, children, defaultDir = "desc" }: { base: string; params: Params; field: string; sort: string; dir: "asc" | "desc"; children: React.ReactNode; defaultDir?: "asc" | "desc" }) {
  const active = sort === field;
  const next = active ? (dir === "asc" ? "desc" : "asc") : defaultDir;
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <Link
      href={href(base, { ...params, sort: field, dir: next })}
      className={`inline-flex items-center gap-1 rounded uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-signal ${active ? "text-ink" : ""}`}
      aria-label={`Sort by ${typeof children === "string" ? children : field}, ${next === "asc" ? "ascending" : "descending"}`}
    >
      {children}
      <Icon aria-hidden className={`h-3 w-3 ${active ? "" : "opacity-40"}`} />
    </Link>
  );
}

/** Previous / next pagination with "x–y of n" (server). */
export function Pagination({ base, params, page, perPage, total }: { base: string; params: Params; page: number; perPage: number; total: number }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (total === 0) return null;
  const from = (page - 1) * perPage + 1;
  const to = Math.min(total, page * perPage);
  const btn = "inline-flex h-9 items-center gap-1 rounded-full bg-white px-3 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-signal";
  const off = "inline-flex h-9 items-center gap-1 rounded-full bg-sand/60 px-3 text-xs font-semibold text-muted/60";
  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm sm:px-5">
      <p className="text-xs text-muted">
        <span className="tabular-nums">{from.toLocaleString()}–{to.toLocaleString()}</span> of <span className="tabular-nums">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-2">
        {page > 1 ? (
          <Link href={href(base, { ...params, page: page - 1 })} className={btn} rel="prev"><ChevronLeft aria-hidden className="h-4 w-4" /> Previous</Link>
        ) : (
          <span className={off} aria-disabled="true"><ChevronLeft aria-hidden className="h-4 w-4" /> Previous</span>
        )}
        <span className="text-xs text-muted tabular-nums">Page {page} of {pages}</span>
        {page < pages ? (
          <Link href={href(base, { ...params, page: page + 1 })} className={btn} rel="next">Next <ChevronRight aria-hidden className="h-4 w-4" /></Link>
        ) : (
          <span className={off} aria-disabled="true">Next <ChevronRight aria-hidden className="h-4 w-4" /></span>
        )}
      </div>
    </nav>
  );
}

/** 7 / 30 / 90 day segmented switcher driven by `?range=` (server). */
export function RangeSwitcher({ base, current, params = {}, options = [7, 30, 90] }: { base: string; current: number; params?: Params; options?: number[] }) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-full bg-white p-0.5">
      {options.map((d) => (
        <Link
          key={d}
          href={href(base, { ...params, range: d })}
          aria-current={d === current ? "page" : undefined}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold focus-visible:outline-2 focus-visible:outline-signal ${d === current ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          {d} days
        </Link>
      ))}
    </nav>
  );
}

/** Small "Apply filters" + "Clear" pair for toolbar filter forms. */
export function FilterButtons({ formId = "toolbar-form", clearHref, active }: { formId?: string; clearHref: string; active: boolean }) {
  return (
    <>
      <button type="submit" form={formId} className="btn-dark py-2 text-xs">Apply</button>
      {active && <Link href={clearHref} className="rounded-full px-3 py-2 text-xs font-semibold text-muted hover:text-ink">Clear filters</Link>}
    </>
  );
}
