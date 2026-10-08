import Link from "next/link";
import { Search, X } from "lucide-react";
import type { Prisma } from "@prisma/client";
import { getBrowseProducts } from "@/lib/storefront-products";
import { brandCounts, getCatalog } from "@/lib/catalog";
import { groupCategories } from "@/lib/taxonomy";
import { Pager, pageParam } from "@/components/ui/Pager";
import { LotCard } from "@/components/LotCard";
import { CONDITIONS, LOT_SIZES, US_STATES } from "@/lib/format";
import { FilterPanel } from "./FilterPanel";
import { Select } from "@/components/ui/Select";
import { getPublicStore as getStore } from "@/lib/store";
import { LISTING_COPY, localizeListingCopy, type ListingKey } from "@/content/listingCopy";
import { ListingGuide } from "@/components/content/ListingGuide";
import { CI } from "@/lib/dbText";
import { getI18n } from "@/i18n/server";

export type SearchParams = Record<string, string | string[] | undefined>;

const PAGE_SIZE = 24;
const SORTS: Record<string, string> = {
  new: "Newest first",
  value: "Lowest % of retail",
  price_asc: "Price: low to high",
  price_desc: "Price: high to low",
  popular: "Most popular",
  retail: "Highest retail value",
  units: "Most units",
};

function one(v: string | string[] | undefined) {
  return Array.isArray(v) ? v[0] : v;
}

/**
 * The shared product grid used by /lots, /new, the category and the lot-size pages.
 * `fixed` pins filters for a landing page (e.g. size=PALLET) and hides that facet.
 */
export async function LotBrowser({
  sp,
  basePath = "/lots",
  fixed = {},
  heading,
  intro,
  guide,
}: {
  sp: SearchParams;
  basePath?: string;
  fixed?: Record<string, string>;
  heading?: string;
  intro?: string;
  /** Adds the page's buyer copy (short lead above the grid, intro + FAQ below it). */
  guide?: ListingKey;
}) {
  const { t, lh } = await getI18n();
  // Buyer's guide copy: translated first (keys keep their {location} token), then the warehouse city is filled in.
  const raw = guide ? LISTING_COPY[guide] : null;
  const copy = raw
    ? localizeListingCopy(
        {
          lead: t(raw.lead),
          heading: t(raw.heading),
          intro: raw.intro.map((p) => t(p)),
          facts: raw.facts.map(([l, v]): [string, string] => [t(l), t(v)]),
          links: raw.links.map(([l, h]): [string, string] => [t(l), h]),
          faqs: raw.faqs.map((f) => ({ q: t(f.q), a: t(f.a) })),
        },
        (await getStore()).location,
      )
    : null;
  const get = (k: string) => fixed[k] ?? one(sp[k]) ?? "";

  const q = get("q").trim();
  const category = get("category");
  const sub = get("sub");
  const brand = get("brand").trim().slice(0, 60);
  const condition = get("condition");
  const size = get("size");
  const state = get("state");
  const min = Number(get("min")) || 0;
  const max = Number(get("max")) || 0;
  const defaultSort = "new";
  const sort = SORTS[get("sort")] ? get("sort") : defaultSort;
  const showSold = get("sold") === "1";

  const where: Prisma.LotWhereInput = {
    status: showSold ? { in: ["ACTIVE", "SOLD_OUT"] } : "ACTIVE",
    ...(category ? { category: { slug: category } } : {}),
    ...(condition ? { condition } : {}),
    ...(sub ? { subcategory: { slug: sub } } : {}),
    ...(brand ? { brand } : {}),
    ...(size && LOT_SIZES[size] ? { lotSize: size } : {}),
    ...(state ? { shipsFrom: { endsWith: `, ${state}`, ...CI } } : {}),
    ...(min || max ? { priceCents: { ...(min ? { gte: min * 100 } : {}), ...(max ? { lte: max * 100 } : {}) } } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, ...CI } },
            { sku: { contains: q, ...CI } },
            { brand: { contains: q, ...CI } },
            { id: { endsWith: q.toLowerCase() } },
            { manifest: { some: { sku: { contains: q, ...CI } } } },
            { description: { contains: q, ...CI } },
            { manifest: { some: { name: { contains: q, ...CI } } } },
          ],
        }
      : {}),
  };

  const [{ lots, total, page }, catalog] = await Promise.all([getBrowseProducts(where, sort, pageParam(get("page"))), getCatalog()]);
  // Hidden categories stay out of the filter list unless one is selected (e.g. reached by a direct link).
  const categories = catalog.filter((c) => !c.hidden || c.slug === category);
  const catGroups = groupCategories(categories);
  const scopeCat = categories.find((c) => c.slug === category);
  const scopeSub = scopeCat?.subcategories.find((s) => s.slug === sub);
  const brands = await brandCounts({ categoryId: scopeCat?.id, subcategoryId: scopeSub?.id });

  const current: Record<string, string> = { q, category, sub, brand, condition, size, state, min: min ? String(min) : "", max: max ? String(max) : "", sort: sort === defaultSort ? "" : sort, sold: showSold ? "1" : "" };
  for (const k of Object.keys(fixed)) delete current[k];
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(current)) if (v) params.set(k, v);
  const href = (patch: Record<string, string | number | null>) => {
    const p = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") p.delete(k);
      else p.set(k, String(v));
    }
    p.delete("page");
    if (patch.page) p.set("page", String(patch.page));
    const s = p.toString();
    return lh(s ? `${basePath}?${s}` : basePath);
  };
  const hidden = (omit: string[]) =>
    Object.entries(current).filter(([k, v]) => v && !omit.includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />);

  const activeCat = categories.find((c) => c.slug === category);
  const activeSub = activeCat?.subcategories.find((s) => s.slug === sub);
  const base = activeSub ? t(activeSub.name) : activeCat ? t(activeCat.name) : q ? t("Results for “{q}”", { q }) : t("All lots");
  const title = heading ? t(heading) : brand ? (activeSub || activeCat ? `${brand} · ${base}` : t("{brand} lots", { brand })) : base;
  const action = lh(basePath);
  const chip = (on: boolean) => `inline-flex min-h-8 items-center rounded-full px-3 py-1 text-xs font-medium ${on ? " bg-ink text-white" : " bg-white "}`;
  // The page lead describes the unfiltered page; a category or search view shows the category blurb instead.
  const lead = intro ? t(intro) : (activeCat || q ? undefined : copy?.lead ? t(copy.lead) : undefined);
  const activeFilters = Object.entries(current).filter(([k, v]) => v && !["sort", "page"].includes(k));

  return (
    <div className="container-pp py-6 sm:py-8">
      <nav className="mb-2 break-words text-xs text-muted"><Link href={lh("/")} className="hover:underline">{t("Home")}</Link> / {title}</nav>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">{title}</h1>
          <p className="text-sm text-muted">
            <span className="font-semibold text-ink">{t(total === 1 ? "{n} lot" : "{n} lots", { n: total.toLocaleString() })}</span>
            {lead ? ` · ${lead}` : activeCat ? ` · ${t(activeCat.blurb)}` : ""}
          </p>
        </div>
        <form action={action} className="flex w-full items-center gap-2 sm:w-auto">
          {hidden(["sort"])}
          <label htmlFor="sort" className="shrink-0 text-sm text-muted">{t("Sort")}</label>
          <Select id="sort" name="sort" defaultValue={sort} className="input min-w-0 flex-1 py-2 sm:w-auto sm:flex-none">
            {Object.entries(SORTS).map(([k, v]) => <option key={k} value={k}>{t(v)}</option>)}
          </Select>
          <button className="btn-ghost shrink-0 py-2">{t("Apply")}</button>
        </form>
      </div>

      <form action={action} className="mb-5 flex max-w-2xl gap-2">
        {hidden(["q"])}
        <input name="q" type="search" defaultValue={q} placeholder={t("Search by product, brand or SKU")} className="input rounded-full" aria-label={t("Search lots")} />
        <button className="btn-primary shrink-0 px-4 sm:px-5" aria-label={t("Search")}><Search aria-hidden className="h-4 w-4" /><span className="hidden sm:inline">{t("Search")}</span></button>
      </form>

      {!fixed.size && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden [&>a]:shrink-0 [&>a]:whitespace-nowrap">
          <Link href={href({ size: null })} className={chip(!size)}>{t("All sizes")}</Link>
          {Object.entries(LOT_SIZES).map(([k, v]) => (
            <Link key={k} href={href({ size: size === k ? null : k })} className={chip(size === k)}>{t(v.plural)}</Link>
          ))}
        </div>
      )}

      {activeFilters.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-muted">{t("Filters")}:</span>
          {activeFilters.map(([k, v]) => (
            <Link key={k} href={href({ [k]: null, ...(k === "category" ? { sub: null } : {}) })} className="inline-flex max-w-full items-center gap-1 rounded-full bg-sand px-3 py-1.5 font-semibold hover:bg-line">
              {k === "min" ? `≥ $${v}` : k === "max" ? `≤ $${v}` : k === "sold" ? t("Incl. sold out") : k === "category" ? t(activeCat?.name ?? v) : k === "sub" ? t(activeSub?.name ?? v) : t(CONDITIONS[v]?.label ?? LOT_SIZES[v]?.plural ?? v)}
              <X aria-hidden className="h-3.5 w-3.5 shrink-0" />
            </Link>
          ))}
          <Link href={action} className="font-semibold text-signal-dark hover:underline">{t("Clear all")}</Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
        <FilterPanel activeCount={activeFilters.filter(([k]) => k !== "q").length}>
          {!fixed.category && (
            <div>
              <h3 className="label">{t("Category")}</h3>
              <ul className="space-y-0.5 text-sm">
                <li><Link href={href({ category: null, sub: null, brand: null })} className={`block rounded-lg px-2 py-1.5 hover:bg-sand ${!category ? "bg-sand font-semibold" : ""}`}>{t("All categories")}</Link></li>
                {catGroups.map((g) => (
                  <li key={g.group}>
                    {catGroups.length > 1 && <p className="mt-3 px-2 pb-0.5 text-[11px] font-semibold uppercase tracking-wider text-muted">{t(g.group)}</p>}
                    <ul className="space-y-0.5">
                {g.items.map((c) => (
                  <li key={c.id}>
                    <Link href={href({ category: c.slug, sub: null, brand: null })} className={`flex items-baseline justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-sand ${category === c.slug && !sub ? "bg-sand font-semibold" : ""}`}>
                      <span className="min-w-0">{t(c.name)}</span>
                      <span className="shrink-0 text-[11px] tabular-nums text-muted">{c.lotCount}</span>
                    </Link>
                    {category === c.slug && (
                      <ul className="ml-3 pl-2">
                        {c.subcategories.map((s) => (
                          <li key={s.id}>
                            <Link href={href({ sub: s.slug, brand: null })} className={`flex items-baseline justify-between gap-2 rounded-lg px-2 py-1 text-[13px] hover:bg-sand ${sub === s.slug ? "bg-sand font-semibold" : "text-ink/75"}`}>
                              <span className="min-w-0">{t(s.name)}</span>
                              <span className="shrink-0 text-[11px] tabular-nums text-muted">{s.lotCount}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {brands.length > 0 && (
            <div>
              <h3 className="label">{t("Brand")}</h3>
              <div className="flex flex-wrap gap-2">
                {brands.slice(0, 24).map((b) => (
                  <Link key={b.brand} href={href({ brand: brand === b.brand ? null : b.brand })} className={chip(brand === b.brand)}>
                    {b.brand}<span className={`ml-1 ${brand === b.brand ? "text-white/70" : "text-muted"}`}>{b.count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
          <div>
            <h3 className="label">{t("Condition")}</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(CONDITIONS).map(([k, c]) => <Link key={k} href={href({ condition: condition === k ? null : k })} className={chip(condition === k)}>{t(c.label)}</Link>)}
            </div>
          </div>
          <form action={action} className="space-y-2">
            {hidden(["state"])}
            <h3 className="label pt-2">{t("Ships from")}</h3>
            <Select name="state" defaultValue={state} className="input py-2">
              <option value="">{t("Any state")}</option>
              {US_STATES.map((s) => <option key={s}>{s}</option>)}
            </Select>
            <button className="btn-ghost w-full py-2">{t("Apply")}</button>
          </form>
          <form action={action} className="space-y-2">
            {hidden(["min", "max", "sold"])}
            <h3 className="label">{t("Price (USD)")}</h3>
            <div className="flex items-center gap-2">
              <input name="min" type="number" inputMode="numeric" min={0} placeholder={t("Min")} aria-label={t("Minimum price")} defaultValue={min || ""} className="input" />
              <span className="text-muted">–</span>
              <input name="max" type="number" inputMode="numeric" min={0} placeholder={t("Max")} aria-label={t("Maximum price")} defaultValue={max || ""} className="input" />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="sold" value="1" defaultChecked={showSold} className="h-4 w-4 shrink-0 accent-signal" /> {t("Include sold-out lots")}
            </label>
            <button className="btn-dark w-full">{t("Update results")}</button>
          </form>
        </FilterPanel>

        <section className="min-w-0">
          {lots.length === 0 ? (
            <div className="card grid place-items-center p-8 sm:p-16 text-center">
              <p className="font-display text-lg font-semibold">{t("No lots match those filters")}</p>
              <p className="mt-1 text-sm text-muted">{t("Try another lot size or condition, or widen the price range.")}</p>
              <Link href={action} className="btn-primary mt-5">{t("Reset filters")}</Link>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {lots.map((l, i) => <LotCard key={l.id} lot={l} priority={i < 2} />)}
            </div>
          )}
          <Pager base={basePath} params={Object.fromEntries(params)} page={page} perPage={PAGE_SIZE} total={total} />
        </section>
      </div>
      {copy && <ListingGuide copy={copy} />}
    </div>
  );
}
