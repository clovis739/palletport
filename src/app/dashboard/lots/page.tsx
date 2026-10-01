import { ProductPhoto } from "@/components/lot/ProductPhoto";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { Boxes, Camera, Plus, Star } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { LOT_SIZES, money } from "@/lib/format";
import { lotCover, parseImages } from "@/lib/lotImages";
import { parsePage, parseSort, qs } from "@/lib/commerce";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Toolbar } from "@/components/admin/Toolbar";
import { Tabs } from "@/components/admin/Tabs";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { FilterButtons, Pagination, SortHeader } from "@/components/admin/ListControls";
import { Select } from "@/components/ui/Select";
import { LotsBulkBar } from "./LotsBulkBar";
import { LotQuickEdit } from "./LotQuickEdit";
import { CATEGORY_ORDER, SUBCATEGORY_ORDER } from "@/lib/catalog";
import { CI } from "@/lib/dbText";

export const metadata = { title: "Lots" };

const BASE = "/dashboard/lots";
const PER_PAGE = 25;
const BULK_FORM_ID = "lots-bulk-form";
const STATUSES = ["ACTIVE", "DRAFT", "SOLD_OUT"] as const;
const SORTS = { created: "createdAt", title: "title", price: "priceCents", stock: "available", views: "views" } as const;
type SP = Record<string, string | undefined>;

export default async function LotsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { seller } = await requireStaff("lots", BASE);

  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : "";
  const size = LOT_SIZES[sp.size ?? ""] ? sp.size! : "";
  const photos = sp.photos === "real" || sp.photos === "stock" ? sp.photos : "";
  const featured = sp.featured === "1" ? "1" : "";
  const categories = await db.category.findMany({ orderBy: CATEGORY_ORDER, select: { id: true, name: true, slug: true, subcategories: { orderBy: SUBCATEGORY_ORDER, select: { id: true, name: true } } } });
  const category = categories.some((c) => c.id === sp.category) ? sp.category! : "";
  const subs = categories.find((c) => c.id === category)?.subcategories ?? [];
  const sub = sp.sub === "none" || subs.some((s) => s.id === sp.sub) ? sp.sub! : "";
  const brand = (sp.brand ?? "").trim().slice(0, 60);
  const { sort, dir } = parseSort(sp.sort, sp.dir, Object.keys(SORTS) as (keyof typeof SORTS)[], "created");
  const page = parsePage(sp.page);

  const base: Prisma.LotWhereInput = {
    sellerId: seller.id,
    ...(size ? { lotSize: size } : {}),
    ...(category ? { categoryId: category } : {}),
    ...(sub ? { subcategoryId: sub === "none" ? null : sub } : {}),
    ...(brand ? { brand: brand === "none" ? "" : brand } : {}),
    ...(photos === "real" ? { NOT: { images: "" } } : photos === "stock" ? { images: "" } : {}),
    ...(featured ? { featured: true } : {}),
    ...(q ? { OR: [{ title: { contains: q, ...CI } }, { slug: { contains: q, ...CI } }, { brand: { contains: q, ...CI } }, { manifest: { some: { OR: [{ sku: { contains: q, ...CI } }, { name: { contains: q, ...CI } }] } } }] } : {}),
  };
  const where: Prisma.LotWhereInput = { ...base, ...(status ? { status } : {}) };

  const [total, lots, counts] = await Promise.all([
    db.lot.count({ where }),
    db.lot.findMany({
      where,
      include: { category: { select: { name: true, slug: true } }, subcategory: { select: { name: true } }, _count: { select: { favorites: true } } },
      orderBy: [{ [SORTS[sort]]: dir } as Prisma.LotOrderByWithRelationInput, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
    }),
    db.lot.groupBy({ by: ["status"], where: base, _count: { _all: true } }),
  ]);
  const count = (s: string) => counts.find((c) => c.status === s)?._count._all ?? 0;

  const filterParams = { q, status, size, category, sub, brand, photos, featured };
  const sortParams = { ...filterParams, sort, dir };
  const here = `${BASE}${qs({ ...sortParams, page: page > 1 ? page : undefined })}`;
  const tabHref = (s: string) => `${BASE}${qs({ ...filterParams, status: s, sort: sp.sort, dir: sp.dir })}`;
  const filtersActive = !!(q || size || category || sub || brand || photos || featured);
  const sh = (field: string, label: string, defaultDir: "asc" | "desc" = "desc") => (
    <SortHeader base={BASE} params={filterParams} field={field} sort={sort} dir={dir} defaultDir={defaultDir}>{label}</SortHeader>
  );

  return (
    <>
      <PageHeader
        title="Lots"
        description="Every listing — publish, feature, reprice and restock."
        actions={<Link href="/dashboard/new" className="btn-primary"><Plus aria-hidden className="h-4 w-4" /> New lot</Link>}
      />

      <Tabs
        className="mb-4"
        label="Lot status"
        current={status || "ALL"}
        items={[
          { value: "ALL", label: "All", href: tabHref(""), count: counts.reduce((a, c) => a + c._count._all, 0) },
          { value: "ACTIVE", label: "Active", href: tabHref("ACTIVE"), count: count("ACTIVE") },
          { value: "DRAFT", label: "Draft", href: tabHref("DRAFT"), count: count("DRAFT") },
          { value: "SOLD_OUT", label: "Sold out", href: tabHref("SOLD_OUT"), count: count("SOLD_OUT") },
        ]}
      />

      <Toolbar q={q} placeholder="Title, SKU or manifest item…" keep={{ status, sort: sp.sort, dir: sp.dir }} end={`${total.toLocaleString()} lot${total === 1 ? "" : "s"}`}>
        <div className="w-44">
          <Select name="category" form="toolbar-form" defaultValue={category} aria-label="Category" className="input py-2">
            <option value="">Any category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </div>
        {subs.length > 0 && (
          <div className="w-44">
            <Select name="sub" form="toolbar-form" defaultValue={sub} aria-label="Subcategory" className="input py-2">
              <option value="">Any subcategory</option>
              <option value="none">No subcategory</option>
              {subs.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
        )}
        <input name="brand" form="toolbar-form" defaultValue={brand} placeholder="Brand" aria-label="Brand" className="input w-32 py-2" />
        <div className="w-36">
          <Select name="size" form="toolbar-form" defaultValue={size} aria-label="Lot size" className="input py-2">
            <option value="">Any size</option>
            {Object.entries(LOT_SIZES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </div>
        <div className="w-40">
          <Select name="photos" form="toolbar-form" defaultValue={photos} aria-label="Photos" className="input py-2">
            <option value="">Any photos</option>
            <option value="real">Has real photos</option>
            <option value="stock">Stock photo only</option>
          </Select>
        </div>
        <label className="flex items-center gap-1.5 text-xs font-semibold">
          <input type="checkbox" name="featured" value="1" form="toolbar-form" defaultChecked={!!featured} className="h-4 w-4 accent-signal" /> Featured
        </label>
        <FilterButtons clearHref={`${BASE}${qs({ status })}`} active={filtersActive} />
      </Toolbar>

      <Card padded={false}>
        {lots.length > 0 && <LotsBulkBar back={here} tree={categories} />}
        <DataTable
          rows={lots}
          rowKey={(l) => l.id}
          caption="Lots"
          minWidth={1000}
          columns={[
            {
              key: "title",
              header: sh("title", "Lot", "asc"),
              primary: true,
              cell: (l) => {
                const cover = lotCover(l, 120, 1);
                return (
                  <div className="flex min-w-0 items-center gap-3 text-left">
                    <input type="checkbox" name="ids" value={l.id} form={BULK_FORM_ID} aria-label={`Select ${l.title}`} className="h-4 w-4 shrink-0 accent-signal" />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <ProductPhoto src={cover.src} alt="" width={44} height={44} loading="lazy" className={`h-11 w-11 shrink-0 rounded-lg bg-sand object-cover ${cover.stock ? "opacity-70 grayscale-[40%]" : ""}`} />
                    <div className="min-w-0">
                      <Link href={`${BASE}/${l.id}`} className="line-clamp-2 break-words font-medium hover:text-signal-dark hover:underline">
                        {l.featured && <Star aria-label="Featured" className="mr-1 inline h-3.5 w-3.5 fill-signal text-signal" />}
                        {l.title}
                      </Link>
                      <span className="block text-xs text-muted">
                        {l.category.name}{l.subcategory ? ` › ${l.subcategory.name}` : ""} · {LOT_SIZES[l.lotSize]?.label ?? l.lotSize}
                        {l.brand && <> · <span className="font-semibold text-ink/70">{l.brand}</span></>}
                      </span>
                    </div>
                  </div>
                );
              },
            },
            { key: "status", header: "Status", cell: (l) => <StatusPill status={l.status} /> },
            {
              key: "price",
              header: sh("price", "Price"),
              align: "right",
              cell: (l) => (
                <LotQuickEdit
                  id={l.id}
                  title={l.title}
                  priceLabel={money(l.priceCents)}
                  sub={`${l.available} in stock`}
                  price={l.priceCents / 100}
                  available={l.available}
                />
              ),
            },
            { key: "stock", header: sh("stock", "In stock"), align: "right", cell: (l) => <span className={`tabular-nums ${l.status === "ACTIVE" && l.available <= 2 ? "font-semibold text-rust" : ""}`}>{l.available}</span> },
            { key: "views", header: sh("views", "Views"), align: "right", cell: (l) => <span className="tabular-nums">{l.views.toLocaleString()}<span className="block text-[11px] text-muted">{l._count.favorites} saves</span></span> },
            {
              key: "photos",
              header: "Photos",
              align: "right",
              hideOnMobile: true,
              cell: (l) => {
                const n = parseImages(l.images).length;
                return n ? <span className="inline-flex items-center gap-1 tabular-nums"><Camera aria-hidden className="h-3.5 w-3.5 text-muted" />{n}</span> : <Badge tone="amber">Stock</Badge>;
              },
            },
          ]}
          empty={
            <EmptyState
              icon={Boxes}
              compact
              title={filtersActive || status ? "No lots match" : "No lots yet"}
              description={filtersActive || status ? "Try another status or clear the filters." : "List your first pallet to start selling."}
              action={filtersActive || status ? <Link href={BASE} className="btn-ghost">Clear filters</Link> : <Link href="/dashboard/new" className="btn-primary">New lot</Link>}
            />
          }
        />
        <Pagination base={BASE} params={sortParams} page={page} perPage={PER_PAGE} total={total} />
      </Card>
    </>
  );
}
