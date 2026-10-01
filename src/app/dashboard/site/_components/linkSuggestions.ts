import "server-only";
import { db } from "@/lib/db";
import { COLLECTIONS } from "@/lib/collections";
import { getHelpArticles, getLegalPages, getPublishedGuides, getPublishedPages, getPublishedPosts } from "@/lib/content";
import type { LinkGroup } from "./fields";

const STATIC: [string, string][] = [
  ["Home", "/"],
  ["All lots", "/lots"],
  ["Best value", "/lots?sort=value"],
  ["Truckloads", "/truckloads"],
  ["Pallets", "/pallets"],
  ["Case packs", "/case-packs"],
  ["All categories", "/categories"],
  ["New arrivals", "/new"],
  ["Trending", "/trending"],
  ["Collections", "/collections"],
  ["How to order", "/how-to-buy"],
  ["How it works", "/how-it-works"],
  ["Buying guides", "/guides"],
  ["Blog", "/blog"],
  ["Help center", "/help"],
  ["Market reports", "/reports"],
  ["Warehouse Days", "/events"],
  ["PalletPort Pro", "/pro"],
  ["Volume buyers", "/volume-buyers"],
  ["Affiliates", "/affiliates"],
  ["Columbus, Ohio pallets", "/liquidation-pallets-columbus-ohio"],
  ["About", "/about"],
  ["Contact", "/contact"],
  ["Create an account", "/register"],
  ["Sign in", "/login"],
  ["My orders", "/orders"],
  ["Refer a business", "/account/referrals"],
  ["Site map", "/site-map"],
  ["Photo credits", "/credits"],
];

/** Internal routes offered by the link picker in the Site editors. */
export async function linkSuggestions(): Promise<LinkGroup[]> {
  const safe = <T,>(p: Promise<T[]>) => p.catch(() => [] as T[]);
  const [categories, pages, guides, posts, help, legal] = await Promise.all([
    safe(db.category.findMany({ orderBy: { name: "asc" }, select: { name: true, slug: true } })),
    safe(getPublishedPages()),
    safe(getPublishedGuides()),
    safe(getPublishedPosts()),
    safe(getHelpArticles()),
    safe(getLegalPages()),
  ]);
  const groups: LinkGroup[] = [
    { label: "Pages", links: STATIC.map(([label, href]) => ({ label, href })) },
    { label: "Custom pages", links: pages.map((p) => ({ label: p.title, href: `/p/${p.slug}` })) },
    { label: "Categories", links: categories.map((c) => ({ label: c.name, href: `/c/${c.slug}` })) },
    { label: "Collections", links: COLLECTIONS.map((c) => ({ label: c.title, href: `/collections/${c.slug}` })) },
    { label: "Buying guides", links: guides.map((g) => ({ label: g.title, href: `/guides/${g.slug}` })) },
    { label: "Blog posts", links: posts.slice(0, 40).map((p) => ({ label: p.title, href: `/blog/${p.slug}` })) },
    { label: "Help articles", links: help.map((h) => ({ label: h.title, href: `/help/${h.slug}` })) },
    { label: "Legal", links: legal.map((l) => ({ label: l.title, href: `/legal/${l.slug}` })) },
  ];
  return groups.filter((g) => g.links.length);
}
