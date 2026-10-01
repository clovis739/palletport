import type { ReactNode } from "react";
import { Search } from "lucide-react";

/**
 * Search + filters row for list pages. The search is a plain GET form (works without JS), so the page reads
 * `searchParams.q`. Pass other active params in `keep` so searching doesn't drop them.
 *
 *   <Toolbar q={q} placeholder="Search orders…" keep={{ status }}>
 *     <Tabs items={…} />                         // or <Select name="…" form="toolbar-form"> filters
 *   </Toolbar>
 */
export function Toolbar({
  q = "",
  placeholder = "Search…",
  action,
  keep = {},
  children,
  end,
  formId = "toolbar-form",
  className = "",
}: {
  q?: string;
  placeholder?: string;
  /** Form action path; defaults to the current URL. */
  action?: string;
  /** Extra query params to preserve as hidden inputs. Undefined/empty values are skipped. */
  keep?: Record<string, string | undefined>;
  /** Filters rendered next to the search box. Inputs can join the form with form={formId}. */
  children?: ReactNode;
  /** Right-aligned content (e.g. result count, export button). */
  end?: ReactNode;
  formId?: string;
  className?: string;
}) {
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 ${className}`}>
      <form id={formId} action={action} method="get" role="search" className="relative w-full min-w-0 sm:w-72">
        {Object.entries(keep).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
        <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input type="search" name="q" defaultValue={q} placeholder={placeholder} aria-label={placeholder} className="input py-2 pl-9" />
      </form>
      {children && <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>}
      {end && <div className="ml-auto flex items-center gap-2 text-sm text-muted">{end}</div>}
    </div>
  );
}
