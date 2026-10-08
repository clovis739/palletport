"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { CONDITIONS, LOT_SIZES, SOURCES } from "@/lib/format";
import { groupCategories } from "@/lib/taxonomy";
import { PhotoPicker } from "@/components/lot/PhotoPicker";
import { Select } from "@/components/ui/Select";
import { Card } from "@/components/admin/Card";
import { SaveBar } from "@/components/admin/SaveBar";

type Cat = { id: string; name: string; group?: string; subcategories: { id: string; name: string }[] };
type State = { error?: string } | undefined;
export type LotDefaults = {
  id?: string;
  title?: string;
  description?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  condition?: string;
  price?: number;
  originalPrice?: number;
  shipsFrom?: string;
  palletCount?: number;
  weightLbs?: number;
  available?: number;
  manifest?: string;
  lotSize?: string;
  source?: string;
  brand?: string;
  images?: string[];
};

/**
 * Create / edit a lot: sectioned cards with a sticky SaveBar. Field names and validation are unchanged
 * (createLot / updateLot in src/app/actions/seller.ts).
 */
export function LotForm({
  categories,
  brands = [],
  sources = [],
  action,
  defaults = {},
  submitLabel,
}: {
  categories: Cat[];
  /** Brands already used on lots (suggestions). */
  brands?: string[];
  /** Sources already used on lots (suggestions, added to the standard list). */
  sources?: string[];
  action: (s: State, fd: FormData) => Promise<State>;
  defaults?: LotDefaults;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, undefined);
  const [catId, setCatId] = useState(defaults.categoryId ?? "");
  const subs = categories.find((c) => c.id === catId)?.subcategories ?? [];
  const grouped = groupCategories(categories.map((c) => ({ ...c, group: c.group ?? "" })));
  const editing = !!defaults.id;

  return (
    <form action={formAction} className="min-w-0">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {state?.error && <p role="alert" className="mb-4 rounded-xl bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card title="Details" description="What buyers see first in search and on the lot page.">
            <div className="space-y-4">
              <div>
                <label className="label" htmlFor="title">Title</label>
                <input id="title" name="title" defaultValue={defaults.title} className="input" placeholder="e.g. Small Kitchen Appliances Pallet" required minLength={5} maxLength={140} />
              </div>
              <div className="grid gap-4 sm:grid-cols-3 sm:items-end">
                <div>
                  <label className="label flex items-center justify-between gap-2" htmlFor="categoryId">Category <Link href="/dashboard/categories" className="text-[11px] font-semibold normal-case tracking-normal text-signal-dark hover:underline">Manage</Link></label>
                  <Select id="categoryId" name="categoryId" className="input" required value={catId} onChange={(e) => setCatId(e.target.value)}>
                    <option value="" disabled>Choose…</option>
                    {grouped.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </optgroup>
                    ))}
                  </Select>
                </div>
                <div>
                  <label className="label" htmlFor="subcategoryId">Subcategory</label>
                  <Select id="subcategoryId" name="subcategoryId" className="input" defaultValue={defaults.subcategoryId ?? ""} key={catId}>
                    <option value="">None</option>
                    {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="label" htmlFor="condition">Condition</label>
                  <Select id="condition" name="condition" className="input" required defaultValue={defaults.condition ?? "CUSTOMER_RETURN"}>
                    {Object.entries(CONDITIONS).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 sm:items-end">
                <div>
                  <label className="label" htmlFor="lotSize">Lot size</label>
                  <Select id="lotSize" name="lotSize" className="input" defaultValue={defaults.lotSize ?? "PALLET"}>
                    {Object.entries(LOT_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                </div>
              </div>
              <div>
                <label className="label" htmlFor="brand">Brand</label>
                <input id="brand" name="brand" list="lot-brands" className="input" defaultValue={defaults.brand ?? ""} maxLength={60} placeholder="Main brand, or leave empty for mixed brands" />
                <datalist id="lot-brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
                <p className="mt-1 text-xs text-muted">Buyers can filter by brand. Pick an existing spelling so the filter doesn&apos;t split.</p>
              </div>
              <div>
                <label className="label" htmlFor="description">Description</label>
                <textarea id="description" name="description" rows={5} defaultValue={defaults.description} className="input resize-y" placeholder="Packaging, grading notes, pickup options…" required minLength={20} />
                <p className="mt-1 text-xs text-muted">At least 20 characters.</p>
              </div>
            </div>
          </Card>

          <Card title="Manifest" description="Items on the lot. Retail value and unit count are calculated from it.">
            <label className="sr-only" htmlFor="manifest">Manifest</label>
            <textarea id="manifest" name="manifest" rows={10} defaultValue={defaults.manifest} className="input resize-y font-mono text-xs" placeholder={"Air fryer 5qt, 24, 89.99, SKU-001\nStand blender, 18, 69\nElectric kettle, 40, 34.50"} />
            <p className="mt-1 text-xs text-muted">One line per item: <code>name, quantity, unit MSRP[, SKU]</code>. Paste rows from a spreadsheet saved as CSV.</p>
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card title="Pricing & stock" description="Buyers check out at this price. Quantity is how many identical lots you have (0 = sold out).">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label" htmlFor="price">Sale price per lot (USD)</label><input id="price" name="price" type="number" min={0.01} step="0.01" defaultValue={defaults.price} className="input" required /></div>
              <div><label className="label" htmlFor="originalPrice">Original price (USD)</label><input id="originalPrice" name="originalPrice" type="number" min={0} step="0.01" defaultValue={defaults.originalPrice ?? 0} className="input" /><p className="mt-1 text-xs text-muted">Shown crossed out when higher than the sale price. Use 0 to hide it.</p></div>
              <div><label className="label" htmlFor="available">Quantity in stock</label><input id="available" name="available" type="number" min={editing ? 0 : 1} max={100} defaultValue={defaults.available ?? 1} className="input" required /></div>
            </div>
          </Card>

          <Card title="Shipping" description="Used for freight quotes at checkout.">
            <div className="mb-4"><label className="label" htmlFor="shipsFrom">FOB / ships from address</label><input id="shipsFrom" name="shipsFrom" defaultValue={defaults.shipsFrom ?? "1150 Corrugated Way, Columbus, OH 43201, USA"} className="input" required maxLength={300} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label" htmlFor="palletCount">Pallets</label><input id="palletCount" name="palletCount" type="number" min={0} max={26} defaultValue={defaults.palletCount ?? 1} className="input" required /></div>
              <div><label className="label" htmlFor="weightLbs">Weight (lbs)</label><input id="weightLbs" name="weightLbs" type="number" min={0} defaultValue={defaults.weightLbs ?? 0} className="input" required /></div>
            </div>
          </Card>

          <Card title="Photos" description="The first photo is the cover. Without photos, a labelled stock photo is shown.">
            <PhotoPicker existing={defaults.images} max={Math.max(10, defaults.images?.length ?? 0)} />
          </Card>
        </div>
      </div>

      <SaveBar saveLabel={submitLabel} alwaysVisible={!editing} message={state?.error} />
    </form>
  );
}
