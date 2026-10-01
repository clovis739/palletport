import Link from "next/link";
import { ArrowDown, ArrowUp, EyeOff, FolderTree, Pencil, Plus, Tags, Wand2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_ORDER, SUBCATEGORY_ORDER, categoryImage } from "@/lib/catalog";
import { TAXONOMY, groupCategories } from "@/lib/taxonomy";
import { moveCategory, syncTaxonomy } from "@/app/actions/catalog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Badge } from "@/components/admin/Badge";
import { StatCard } from "@/components/admin/StatCard";
import { EmptyState } from "@/components/admin/EmptyState";
import { SubmitButton } from "@/components/SubmitButton";
import { SiteImage } from "@/components/content/SiteImage";

export const metadata = { title: "Categories" };

const BASE = "/dashboard/categories";

export default async function CategoriesAdmin() {
  await requireStaff("lots", BASE);
  const [cats, lotCounts, activeCounts, subCounts, unassigned, brandRows] = await Promise.all([
    db.category.findMany({ orderBy: CATEGORY_ORDER, include: { subcategories: { orderBy: SUBCATEGORY_ORDER } } }),
    db.lot.groupBy({ by: ["categoryId"], _count: { _all: true } }),
    db.lot.groupBy({ by: ["categoryId"], where: { status: "ACTIVE" }, _count: { _all: true } }),
    db.lot.groupBy({ by: ["subcategoryId"], where: { NOT: { subcategoryId: null } }, _count: { _all: true } }),
    db.lot.count({ where: { subcategoryId: null } }),
    db.lot.groupBy({ by: ["brand"], where: { NOT: { brand: "" } } }),
  ]);
  const total = new Map(lotCounts.map((c) => [c.categoryId, c._count._all]));
  const active = new Map(activeCounts.map((c) => [c.categoryId, c._count._all]));
  const subN = new Map(subCounts.map((c) => [c.subcategoryId, c._count._all]));
  const groups = groupCategories(cats);

  const slugs = new Set(cats.map((c) => c.slug));
  const subSlugs = new Set(cats.flatMap((c) => c.subcategories.map((s) => s.slug)));
  const missingCats = TAXONOMY.filter((t) => !slugs.has(t.slug)).length;
  const missingSubs = TAXONOMY.flatMap((t) => t.subs).filter((s) => !subSlugs.has(s.slug)).length;
  const subTotal = cats.reduce((a, c) => a + c.subcategories.length, 0);

  return (
    <>
      <PageHeader
        title="Categories"
        description="How the shop is organised: department groups → categories → subcategories. Brands are set on each lot."
        actions={
          <>
            <Link href={`${BASE}/brands`} className="btn-ghost"><Tags aria-hidden className="h-4 w-4" /> Brands</Link>
            <Link href={`${BASE}/new`} className="btn-primary"><Plus aria-hidden className="h-4 w-4" /> New category</Link>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Categories" value={cats.length} hint={`${groups.length} department groups`} />
        <StatCard label="Subcategories" value={subTotal} />
        <StatCard label="Brands" value={brandRows.length} hint="set on lots" />
        <StatCard label="Lots with no subcategory" value={unassigned} hint={unassigned ? "filter them in Lots" : "all sorted"} />
      </div>

      {(missingCats > 0 || missingSubs > 0) && (
        <Card className="mb-6" title="Standard structure available" description={`${missingCats} categories and ${missingSubs} subcategories from the standard PalletPort structure aren't in your shop yet. Adding them never renames, moves or deletes what you have.`}>
          <form action={syncTaxonomy}>
            <SubmitButton className="btn-dark" pendingText="Adding…"><Wand2 aria-hidden className="h-4 w-4" /> Add the missing ones</SubmitButton>
          </form>
        </Card>
      )}

      {cats.length === 0 ? (
        <Card>
          <EmptyState icon={FolderTree} title="No categories yet" description="Add the standard structure above, or create your own." action={<Link href={`${BASE}/new`} className="btn-primary">New category</Link>} />
        </Card>
      ) : (
        <div className="space-y-8">
          {groups.map(({ group, items }) => (
            <section key={group} aria-labelledby={`g-${group}`}>
              <h2 id={`g-${group}`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{group}</h2>
              <ul className="grid gap-3 lg:grid-cols-2">
                {items.map((c, i) => (
                  <li key={c.id} className="flex min-w-0 gap-3 rounded-2xl bg-white p-3 sm:p-4">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl" style={{ background: `hsl(${c.hue} 45% 90%)` }}>
                      <SiteImage src={categoryImage(c)} alt="" width={64} ratio={1} sizes="64px" className="h-full w-full" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Link href={`${BASE}/${c.id}`} className="font-display font-bold hover:text-signal-dark hover:underline">{c.name}</Link>
                        {c.hidden && <Badge tone="muted"><EyeOff aria-hidden className="h-3 w-3" /> Hidden</Badge>}
                        <span className="text-xs text-muted">
                          {active.get(c.id) ?? 0} live · {total.get(c.id) ?? 0} total
                        </span>
                      </div>
                      <p className="truncate text-xs text-muted">/c/{c.slug} · {c.blurb}</p>
                      <ul className="mt-2 flex flex-wrap gap-1.5">
                        {c.subcategories.map((s) => (
                          <li key={s.id}>
                            <Link href={`/dashboard/lots?category=${c.id}&sub=${s.id}`} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-0.5 text-[11px] font-medium hover:bg-line">
                              {s.name} <span className="text-muted">{subN.get(s.id) ?? 0}</span>
                            </Link>
                          </li>
                        ))}
                        {c.subcategories.length === 0 && <li className="text-[11px] text-muted">No subcategories</li>}
                      </ul>
                    </div>
                    <div className="flex shrink-0 flex-col items-end justify-between gap-2">
                      <Link href={`${BASE}/${c.id}`} className="grid h-9 w-9 place-items-center rounded-full hover:bg-sand" aria-label={`Edit ${c.name}`}><Pencil aria-hidden className="h-4 w-4" /></Link>
                      <div className="flex">
                        <form action={moveCategory}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="dir" value="up" />
                          <button disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label={`Move ${c.name} up`}><ArrowUp aria-hidden className="h-4 w-4" /></button>
                        </form>
                        <form action={moveCategory}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="dir" value="down" />
                          <button disabled={i === items.length - 1} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label={`Move ${c.name} down`}><ArrowDown aria-hidden className="h-4 w-4" /></button>
                        </form>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
