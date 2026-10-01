import Link from "next/link";
import { Tags } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { renameBrand } from "@/app/actions/catalog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge } from "@/components/admin/Badge";
import { SubmitButton } from "@/components/SubmitButton";
import { Pagination } from "@/components/admin/ListControls";

export const metadata = { title: "Brands" };

const BASE = "/dashboard/categories/brands";
const PER_PAGE = 50;

export default async function BrandsAdmin({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireStaff("lots", BASE);
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().toLowerCase();
  const [all, active, cats] = await Promise.all([
    db.lot.groupBy({ by: ["brand", "categoryId"], where: { NOT: { brand: "" } }, _count: { _all: true } }),
    db.lot.groupBy({ by: ["brand"], where: { NOT: { brand: "" }, status: "ACTIVE" }, _count: { _all: true } }),
    db.category.findMany({ select: { id: true, name: true } }),
  ]);
  const catName = new Map(cats.map((c) => [c.id, c.name]));
  const live = new Map(active.map((a) => [a.brand, a._count._all]));
  const byBrand = new Map<string, { brand: string; total: number; categories: string[] }>();
  for (const r of all) {
    const b = byBrand.get(r.brand) ?? { brand: r.brand, total: 0, categories: [] };
    b.total += r._count._all;
    b.categories.push(catName.get(r.categoryId) ?? "?");
    byBrand.set(r.brand, b);
  }
  const rows = [...byBrand.values()].filter((b) => !q || b.brand.toLowerCase().includes(q)).sort((a, b) => a.brand.localeCompare(b.brand));
  // Likely duplicates: same letters once case, spaces and punctuation are ignored ("DeWalt" / "DEWALT" / "De Walt").
  const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const pages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const page = Math.min(pages, Math.max(1, Math.floor(Number(sp.page) || 1)));
  const shown = rows.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const dupes = new Set([...byBrand.keys()].filter((b, _, arr) => arr.some((o) => o !== b && key(o) === key(b))));

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/categories", label: "Categories" }}
        title="Brands"
        description="Brands come from the Brand field on each lot. Rename one here to update every lot at once; type an existing brand's name to merge them."
      />
      <Card padded={false}>
        <form className="flex items-center gap-2 px-4 py-3 sm:px-5">
          <label className="sr-only" htmlFor="brand-q">Search brands</label>
          <input id="brand-q" name="q" defaultValue={q} type="search" placeholder="Search brands…" className="input max-w-xs py-2" />
          <button className="btn-ghost py-2">Search</button>
          <span className="ml-auto text-xs text-muted">{rows.length} brands</span>
        </form>
        <DataTable
          rows={shown}
          rowKey={(b) => b.brand}
          caption="Brands"
          minWidth={720}
          columns={[
            {
              key: "brand",
              header: "Brand",
              primary: true,
              cell: (b) => (
                <div className="min-w-0">
                  <Link href={`/dashboard/lots?brand=${encodeURIComponent(b.brand)}`} className="font-semibold hover:text-signal-dark hover:underline">{b.brand}</Link>
                  {dupes.has(b.brand) && <Badge tone="amber" className="ml-2">Possible duplicate</Badge>}
                  <span className="block truncate text-xs text-muted">{[...new Set(b.categories)].join(", ")}</span>
                </div>
              ),
            },
            { key: "lots", header: "Lots", align: "right", cell: (b) => <span className="tabular-nums">{live.get(b.brand) ?? 0} live<span className="block text-[11px] text-muted">{b.total} total</span></span> },
            {
              key: "rename",
              header: "Rename or merge",
              cell: (b) => (
                <form action={renameBrand} className="flex items-center gap-2">
                  <input type="hidden" name="from" value={b.brand} />
                  <input type="hidden" name="back" value={BASE} />
                  <input name="to" defaultValue={b.brand} maxLength={60} aria-label={`New name for ${b.brand}`} className="input min-w-0 flex-1 py-1.5" />
                  <SubmitButton className="btn-ghost shrink-0 px-3 py-1.5 text-xs" pendingText="…">Apply</SubmitButton>
                </form>
              ),
            },
          ]}
          empty={<EmptyState icon={Tags} compact title={q ? "No brands match" : "No brands yet"} description="Set a brand on a lot (Lots → edit → Brand) and it appears here." />}
        />
        <Pagination base={BASE} params={{ q: q || undefined }} page={page} perPage={PER_PAGE} total={rows.length} />
      </Card>
      <p className="mt-3 text-xs text-muted">Clearing the name (leave it empty) removes the brand from those lots; they show as mixed / unbranded.</p>
    </>
  );
}
