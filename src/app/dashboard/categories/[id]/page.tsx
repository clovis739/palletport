import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowDown, ArrowUp, ExternalLink, Plus } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { CATEGORY_ORDER, SUBCATEGORY_ORDER, brandCounts } from "@/lib/catalog";
import { deleteCategory, deleteSubcategory, moveSubcategory, saveSubcategory, transferSubcategory } from "@/app/actions/catalog";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Badge } from "@/components/admin/Badge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";
import { CategoryForm } from "../CategoryForm";

export const metadata = { title: "Edit category" };

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const here = `/dashboard/categories/${id}`;
  await requireStaff("lots", here);
  const [cat, all] = await Promise.all([
    db.category.findUnique({ where: { id }, include: { subcategories: { orderBy: SUBCATEGORY_ORDER, include: { _count: { select: { lots: true } } } }, _count: { select: { lots: true } } } }),
    db.category.findMany({ orderBy: CATEGORY_ORDER, select: { id: true, name: true, group: true } }),
  ]);
  if (!cat) notFound();
  const [brands, noSub] = await Promise.all([
    brandCounts({ categoryId: cat.id, activeOnly: false }),
    db.lot.count({ where: { categoryId: cat.id, subcategoryId: null } }),
  ]);
  const others = all.filter((c) => c.id !== cat.id);
  const groups = [...new Set(all.map((c) => c.group))];

  return (
    <>
      <PageHeader
        back={{ href: "/dashboard/categories", label: "All categories" }}
        title={cat.name}
        description={cat.blurb}
        meta={
          <>
            {cat.group && <Badge tone="ink">{cat.group}</Badge>}
            {cat.hidden && <Badge tone="muted">Hidden</Badge>}
            <span>{cat._count.lots} lots · {cat.subcategories.length} subcategories</span>
          </>
        }
        actions={
          <>
            <Link href={`/dashboard/lots?category=${cat.id}`} className="btn-ghost">View lots</Link>
            <Link href={`/c/${cat.slug}`} target="_blank" className="btn-ghost"><ExternalLink aria-hidden className="h-4 w-4" /> Open page</Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <CategoryForm
          groups={groups}
          d={{ id: cat.id, name: cat.name, slug: cat.slug, group: cat.group, blurb: cat.blurb, hue: cat.hue, image: cat.image, hidden: cat.hidden, lotCount: cat._count.lots }}
        />

        <div className="min-w-0 space-y-6">
          <Card title="Subcategories" description="Shown as filters on the category page. Rename, reorder, move to another category or delete. Lots are never deleted." padded={false}>
            <ul>
              {cat.subcategories.map((s, i) => (
                <li key={s.id} className="space-y-2 px-4 py-3 odd:bg-sand/30 sm:px-5">
                  <div className="flex items-center gap-2">
                    <form action={saveSubcategory} className="flex min-w-0 flex-1 items-center gap-2">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="categoryId" value={cat.id} />
                      <input type="hidden" name="back" value={here} />
                      <label className="sr-only" htmlFor={`sub-${s.id}`}>Name</label>
                      <input id={`sub-${s.id}`} name="name" defaultValue={s.name} required minLength={2} maxLength={60} className="input min-w-0 flex-1 py-1.5" />
                      <SubmitButton className="btn-ghost shrink-0 px-3 py-1.5 text-xs" pendingText="…">Save</SubmitButton>
                    </form>
                    <form action={moveSubcategory}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="dir" value="up" />
                      <input type="hidden" name="back" value={here} />
                      <button disabled={i === 0} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label={`Move ${s.name} up`}><ArrowUp aria-hidden className="h-4 w-4" /></button>
                    </form>
                    <form action={moveSubcategory}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="dir" value="down" />
                      <input type="hidden" name="back" value={here} />
                      <button disabled={i === cat.subcategories.length - 1} className="grid h-8 w-8 place-items-center rounded-full hover:bg-sand disabled:opacity-30" aria-label={`Move ${s.name} down`}><ArrowDown aria-hidden className="h-4 w-4" /></button>
                    </form>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted">
                    <Link href={`/dashboard/lots?category=${cat.id}&sub=${s.id}`} className="font-semibold text-ink hover:underline">{s._count.lots} lots</Link>
                    <span className="truncate">{s.slug}</span>
                    <form action={transferSubcategory} className="ml-auto flex items-center gap-1.5">
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="back" value={here} />
                      <div className="w-40">
                        <Select name="to" defaultValue="" aria-label={`Move ${s.name} to another category`} className="input py-1 text-xs">
                          <option value="" disabled>Move to…</option>
                          {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                        </Select>
                      </div>
                      <SubmitButton className="btn-ghost px-3 py-1 text-xs" pendingText="Moving…">Move</SubmitButton>
                    </form>
                    <form action={deleteSubcategory}>
                      <input type="hidden" name="id" value={s.id} />
                      <input type="hidden" name="back" value={here} />
                      <ConfirmButton className="rounded-full px-3 py-1 text-xs font-semibold text-rust hover:bg-rust/10" prompt={s._count.lots ? `Its ${s._count.lots} lots stay in ${cat.name}.` : "Delete?"} confirmLabel="Delete">Delete</ConfirmButton>
                    </form>
                  </div>
                </li>
              ))}
              {cat.subcategories.length === 0 && <li className="px-4 py-4 text-sm text-muted sm:px-5">No subcategories yet.</li>}
            </ul>
            <form action={saveSubcategory} className="flex items-center gap-2 bg-sand/40 px-4 py-3 sm:px-5">
              <input type="hidden" name="categoryId" value={cat.id} />
              <input type="hidden" name="back" value={here} />
              <label className="sr-only" htmlFor="new-sub">New subcategory</label>
              <input id="new-sub" name="name" required minLength={2} maxLength={60} placeholder="New subcategory, e.g. Consoles" className="input min-w-0 flex-1 py-2" />
              <SubmitButton className="btn-dark shrink-0 py-2" pendingText="Adding…"><Plus aria-hidden className="h-4 w-4" /> Add</SubmitButton>
            </form>
            {noSub > 0 && (
              <p className="px-4 py-3 text-xs text-muted sm:px-5">
                <Link href={`/dashboard/lots?category=${cat.id}&sub=none`} className="font-semibold text-signal-dark hover:underline">{noSub} lots</Link> in this category have no subcategory.
              </p>
            )}
          </Card>

          <Card title="Brands in this category" description="Set on each lot. Rename or merge brands on the Brands page.">
            {brands.length ? (
              <ul className="flex flex-wrap gap-1.5">
                {brands.map((b) => (
                  <li key={b.brand}>
                    <Link href={`/dashboard/lots?category=${cat.id}&brand=${encodeURIComponent(b.brand)}`} className="inline-flex items-center gap-1 rounded-full bg-sand px-2.5 py-1 text-xs font-medium hover:bg-line">
                      {b.brand} <span className="text-muted">{b.count}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">No brands set on these lots yet.</p>
            )}
          </Card>

          <Card title="Delete category" description={cat._count.lots ? `Move its ${cat._count.lots} lots to another category first. Its subcategories are removed.` : "It has no lots. Its subcategories are removed."}>
            <form action={deleteCategory} className="flex flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={cat.id} />
              {cat._count.lots > 0 && (
                <div className="w-56">
                  <Select name="moveTo" defaultValue="" required aria-label="Move lots to" className="input py-2">
                    <option value="" disabled>Move lots to…</option>
                    {others.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                </div>
              )}
              <ConfirmButton confirmLabel="Delete category">Delete {cat.name}</ConfirmButton>
            </form>
          </Card>
        </div>
      </div>
    </>
  );
}
