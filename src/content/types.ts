export type FaqItem = { q: string; a: string };
export type TableBlock = { head: string[]; rows: string[][]; caption?: string };
/**
 * One body section. `p`, `list`, `table` and `faq` render in that order under the optional `h` heading.
 * Blog posts may use inline links in text as `[label](/path)`; other renderers show the text as-is.
 * `faq` renders visible question/answer pairs and feeds FAQPage JSON-LD on blog posts.
 */
export type Section = { h?: string; p?: string[]; list?: string[]; table?: TableBlock; faq?: FaqItem[] };
export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  category?: string;
  date?: string; // ISO
  updated?: string; // ISO, last substantive revision
  readMins?: number;
  hue?: number;
  author?: string;
  tags?: string[];
  featured?: boolean;
  body: Section[];
};
