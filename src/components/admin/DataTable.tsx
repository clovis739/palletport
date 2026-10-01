import type { ReactNode } from "react";

export type Column<T> = {
  /** Unique key for the column. */
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  align?: "left" | "right" | "center";
  /** Extra classes for <th>/<td> (e.g. widths). */
  className?: string;
  /** Hide in the stacked mobile card (still shown in the table). */
  hideOnMobile?: boolean;
  /** Mobile: render as the card title (no label). Default: the first column. */
  primary?: boolean;
};

/**
 * Responsive table: a real <table> on md+ and stacked label/value cards on phones.
 * Server component — pass plain rows and `cell` render functions.
 *
 *   <DataTable
 *     rows={orders}
 *     rowKey={(o) => o.id}
 *     columns={[
 *       { key: "no", header: "Order", cell: (o) => <Link href={…}>{o.number}</Link> },
 *       { key: "total", header: "Total", align: "right", cell: (o) => money(o.totalCents) },
 *       { key: "status", header: "Status", cell: (o) => <StatusPill status={o.status} /> },
 *     ]}
 *     empty={<EmptyState title="No orders yet" compact />}
 *   />
 */
export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty,
  caption,
  minWidth = 640,
  className = "",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T, index: number) => string;
  empty?: ReactNode;
  caption?: string;
  /** Table min width in px before it scrolls sideways (md+). */
  minWidth?: number;
  className?: string;
}) {
  if (!rows.length) return <div className={className}>{empty ?? <p className="p-6 text-center text-sm text-muted">Nothing here yet.</p>}</div>;
  const align = (a?: Column<T>["align"]) => (a === "right" ? "text-right" : a === "center" ? "text-center" : "text-left");
  const primary = columns.find((c) => c.primary) ?? columns[0];

  return (
    <div className={className}>
      {/* md+: table */}
      <div className="hidden overflow-x-auto overscroll-x-contain md:block">
        <table className="w-full text-sm" style={{ minWidth }}>
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead className="bg-sand/40 text-xs uppercase tracking-wider text-muted">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`px-4 py-3 font-semibold ${align(c.align)} ${c.className ?? ""}`}>{c.header}</th>
              ))}
            </tr>
          </thead>
          <tbody >
            {rows.map((r, i) => (
              <tr key={rowKey(r, i)} className="align-middle transition-colors hover:bg-sand/25">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 ${align(c.align)} ${c.className ?? ""}`}>{c.cell(r)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* phones: stacked cards */}
      <ul className="md:hidden" aria-label={caption}>
        {rows.map((r, i) => (
          <li key={rowKey(r, i)} className="space-y-2 p-4">
            <div className="min-w-0 break-words font-semibold">{primary.cell(r)}</div>
            <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-sm">
              {columns
                .filter((c) => c !== primary && !c.hideOnMobile)
                .map((c) => (
                  <div key={c.key} className="contents">
                    <dt className="text-xs text-muted">{c.header}</dt>
                    <dd className="min-w-0 break-words text-right">{c.cell(r)}</dd>
                  </div>
                ))}
            </dl>
          </li>
        ))}
      </ul>
    </div>
  );
}
