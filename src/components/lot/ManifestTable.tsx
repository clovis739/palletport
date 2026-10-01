"use client";

import { useMemo, useState } from "react";
import { ArrowDown, Download } from "lucide-react";

type Row = { id: string; sku: string; name: string; qty: number; unitMsrpCents: number };

function usd(c: number, cents = false) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: cents ? 2 : 0, maximumFractionDigits: cents ? 2 : 0 }).format(c / 100);
}

export function ManifestTable({ rows, csvHref }: { rows: Row[]; csvHref: string }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<"ext" | "qty" | "unit" | "name">("ext");
  const view = useMemo(() => {
    const t = q.trim().toLowerCase();
    const f = t ? rows.filter((r) => r.name.toLowerCase().includes(t) || r.sku.toLowerCase().includes(t)) : rows;
    return [...f].sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "qty" ? b.qty - a.qty : sort === "unit" ? b.unitMsrpCents - a.unitMsrpCents : b.qty * b.unitMsrpCents - a.qty * a.unitMsrpCents,
    );
  }, [rows, q, sort]);
  const units = view.reduce((a, r) => a + r.qty, 0);
  const ext = view.reduce((a, r) => a + r.qty * r.unitMsrpCents, 0);
  const th = (k: typeof sort, label: string, right = false) => (
    <th className={`whitespace-nowrap px-4 py-3 ${right ? "text-right" : ""}`}>
      <button type="button" onClick={() => setSort(k)} className={`uppercase tracking-wider ${sort === k ? "text-ink" : ""}`}>{label}{sort === k && <ArrowDown aria-hidden className="ml-0.5 inline-block h-3 w-3 align-[-0.1em]" />}</button>
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this manifest" className="input w-full py-2 sm:max-w-xs" aria-label="Search manifest" />
        <span className="text-xs text-muted">{view.length} of {rows.length} lines</span>
        <a href={csvHref} className="btn-ghost py-2 text-xs sm:ml-auto"><Download aria-hidden className="h-3.5 w-3.5" /> Download manifest (CSV)</a>
      </div>
      <div className="card overflow-x-auto overscroll-x-contain">
        <table className="w-full min-w-[540px] text-sm">
          <thead className="bg-sand/60 text-left text-xs text-muted">
            <tr>
              <th className="px-4 py-3 uppercase tracking-wider">SKU</th>
              {th("name", "Item")}
              {th("qty", "Qty", true)}
              {th("unit", "Unit retail", true)}
              {th("ext", "Ext. retail", true)}
            </tr>
          </thead>
          <tbody >
            {view.map((m) => (
              <tr key={m.id} className="hover:bg-sand/30">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">{m.sku}</td>
                <td className="min-w-[12rem] px-4 py-3 font-medium">{m.name}</td>
                <td className="px-4 py-3 text-right">{m.qty.toLocaleString()}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right">{usd(m.unitMsrpCents, true)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-semibold">{usd(m.qty * m.unitMsrpCents)}</td>
              </tr>
            ))}
            {view.length === 0 && <tr><td colSpan={5} className="p-6 text-center text-muted">No lines match “{q}”.</td></tr>}
          </tbody>
          <tfoot className="font-semibold">
            <tr>
              <td className="px-4 py-3" colSpan={2}>{q ? "Filtered total" : "Total"}</td>
              <td className="px-4 py-3 text-right">{units.toLocaleString()}</td>
              <td />
              <td className="px-4 py-3 text-right">{usd(ext)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
