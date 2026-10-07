import type { Block } from "@/lib/blocks";
import type { Section } from "@/content/types";
import { localizeHref, type Locale, type TFunction } from "./config";

/** Translates one piece of article text and points its internal [label](/path) links at the Spanish pages. */
export function localizeText(text: string | undefined, t: TFunction, locale: Locale): string {
  if (!text) return text ?? "";
  const s = t(text);
  return locale === "es" ? s.replace(/\]\((\/[^)\s]*)\)/g, (_m, path: string) => `](${localizeHref(path, locale)})`) : s;
}

function localizeBlock(b: Block, tx: (s: string) => string): Block {
  switch (b.type) {
    case "heading":
    case "paragraph":
    case "quote":
      return { ...b, text: tx(b.text) };
    case "list":
      return { ...b, items: b.items.map(tx) };
    case "image":
      return { ...b, alt: tx(b.alt), ...(b.caption ? { caption: tx(b.caption) } : {}) };
    case "table":
      return { ...b, head: b.head.map(tx), rows: b.rows.map((r) => r.map(tx)), ...(b.caption ? { caption: tx(b.caption) } : {}) };
    case "faq":
      return { ...b, items: b.items.map((f) => ({ q: tx(f.q), a: tx(f.a) })) };
    case "callout":
      return { ...b, text: tx(b.text), ...(b.title ? { title: tx(b.title) } : {}) };
    default:
      return b;
  }
}

type Localizable = {
  title: string;
  excerpt: string;
  category?: string;
  body: Section[];
  blocks: Block[];
  meta: { seoTitle?: string; seoDescription?: string } & Record<string, unknown>;
};

/** Spanish version of a help article, guide, policy or custom page (text only; slugs, images and dates stay). */
export function localizeArticle<A extends Localizable>(a: A, t: TFunction, locale: Locale): A {
  if (locale === "en") return a;
  const tx = (s: string) => localizeText(s, t, locale);
  return {
    ...a,
    title: tx(a.title),
    excerpt: tx(a.excerpt),
    ...(a.category ? { category: tx(a.category) } : {}),
    body: a.body.map((s) => ({
      ...s,
      ...(s.h ? { h: tx(s.h) } : {}),
      ...(s.p ? { p: s.p.map(tx) } : {}),
      ...(s.list ? { list: s.list.map(tx) } : {}),
      ...(s.faq ? { faq: s.faq.map((f) => ({ q: tx(f.q), a: tx(f.a) })) } : {}),
      ...(s.table ? { table: { ...s.table, head: s.table.head.map(tx), rows: s.table.rows.map((r) => r.map(tx)) } } : {}),
    })),
    blocks: a.blocks.map((b) => localizeBlock(b, tx)),
    meta: {
      ...a.meta,
      ...(a.meta.seoTitle ? { seoTitle: tx(a.meta.seoTitle) } : {}),
      ...(a.meta.seoDescription ? { seoDescription: tx(a.meta.seoDescription) } : {}),
    },
  };
}
