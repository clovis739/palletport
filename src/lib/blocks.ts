/**
 * Content blocks: the document model of the visual block editor. Pure module (types, zod schema,
 * converters, text helpers) — safe in client components and in prisma/seed.ts (relative imports only).
 * Render blocks with <Blocks> from src/components/content/Blocks.tsx.
 *
 * Inline text syntax (paragraph, list items, table cells, faq, callout, quote):
 *   [label](/path) or [label](https://…)  → link      **bold** → strong
 */
import { z } from "zod";
import type { FaqItem, Section } from "../content/types";

const text = z.string();
const id = z.string().optional(); // stable key for editors (optional)

export const blockSchema = z.discriminatedUnion("type", [
  z.object({ id, type: z.literal("heading"), level: z.union([z.literal(2), z.literal(3)]), text: text.min(1) }),
  z.object({ id, type: z.literal("paragraph"), text }),
  z.object({ id, type: z.literal("list"), ordered: z.boolean().optional(), items: z.array(text) }),
  z.object({
    id,
    type: z.literal("image"),
    /** Stock photo key (src/content/photos.ts) or media URL — see src/lib/imageRef.ts */
    src: text.min(1),
    alt: text,
    caption: text.optional(),
    /** Intrinsic size for media URLs (from the Media row); reserves layout space. */
    width: z.number().int().positive().optional(),
    height: z.number().int().positive().optional(),
  }),
  z.object({ id, type: z.literal("table"), head: z.array(text), rows: z.array(z.array(text)), caption: text.optional() }),
  z.object({ id, type: z.literal("faq"), items: z.array(z.object({ q: text, a: text })) }),
  z.object({ id, type: z.literal("callout"), tone: z.enum(["info", "tip", "warning"]), title: text.optional(), text }),
  z.object({ id, type: z.literal("quote"), text, cite: text.optional() }),
  z.object({ id, type: z.literal("divider") }),
]);

export type Block = z.infer<typeof blockSchema>;
export type BlockType = Block["type"];
export type BlockOf<T extends BlockType> = Extract<Block, { type: T }>;
export const blocksSchema = z.array(blockSchema);

export const BLOCK_TYPES: { type: BlockType; label: string; description: string }[] = [
  { type: "heading", label: "Heading", description: "Section title (H2) or sub-heading (H3). H2s build the table of contents." },
  { type: "paragraph", label: "Paragraph", description: "Body text. Supports [links](/path) and **bold**." },
  { type: "list", label: "List", description: "Bulleted or numbered list." },
  { type: "image", label: "Image", description: "Photo from the media library or stock photos, with alt text and caption." },
  { type: "table", label: "Table", description: "Comparison table. First column renders as row headers." },
  { type: "faq", label: "FAQ", description: "Visible questions and answers (also feeds FAQ structured data on posts)." },
  { type: "callout", label: "Callout", description: "Highlighted note: info, tip or warning." },
  { type: "quote", label: "Quote", description: "Pull quote with optional attribution." },
  { type: "divider", label: "Divider", description: "Horizontal rule between sections." },
];

/** An empty block of the given type (for "add block" buttons). */
export function emptyBlock(type: BlockType): Block {
  switch (type) {
    case "heading": return { type, level: 2, text: "New section" };
    case "paragraph": return { type, text: "" };
    case "list": return { type, items: [""] };
    case "image": return { type, src: "warehouseBoxes", alt: "" };
    case "table": return { type, head: ["Column 1", "Column 2"], rows: [["", ""]] };
    case "faq": return { type, items: [{ q: "", a: "" }] };
    case "callout": return { type, tone: "info", text: "" };
    case "quote": return { type, text: "" };
    case "divider": return { type };
  }
}

/** Parses stored JSON into blocks. Invalid blocks are dropped (never throws). */
export function parseBlocks(json: string | null | undefined): Block[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json || "[]");
  } catch {
    return [];
  }
  if (!Array.isArray(raw)) return [];
  const out: Block[] = [];
  for (const b of raw) {
    const r = blockSchema.safeParse(b);
    if (r.success) out.push(r.data);
  }
  return out;
}

// ---------- converters between the legacy Section model and blocks ----------

/** Existing TS article sections → blocks (lossless for h / p / list / table / faq). */
export function sectionsToBlocks(sections: Section[]): Block[] {
  const out: Block[] = [];
  for (const s of sections) {
    if (s.h) out.push({ type: "heading", level: 2, text: s.h });
    for (const p of s.p ?? []) out.push({ type: "paragraph", text: p });
    if (s.list?.length) out.push({ type: "list", items: [...s.list] });
    if (s.table) out.push({ type: "table", head: [...s.table.head], rows: s.table.rows.map((r) => [...r]), ...(s.table.caption ? { caption: s.table.caption } : {}) });
    if (s.faq?.length) out.push({ type: "faq", items: s.faq.map((f) => ({ ...f })) });
  }
  return out;
}

/**
 * Blocks → legacy sections, so existing consumers (Prose, sectionsText, postFaq, JSON-LD) keep working with
 * DB content. Lossy: H3s become bold paragraphs, callouts/quotes become paragraphs, images and dividers are dropped.
 */
export function blocksToSections(blocks: Block[]): Section[] {
  const out: Section[] = [];
  let cur: Section = {};
  const flush = () => {
    if (cur.h || cur.p?.length || cur.list?.length || cur.table || cur.faq?.length) out.push(cur);
    cur = {};
  };
  // A Section renders h → p → list → table → faq, so start a new (heading-less) section when order would break.
  const has = (k: "list" | "table" | "faq") => !!cur[k];
  for (const b of blocks) {
    switch (b.type) {
      case "heading":
        if (b.level === 2) {
          flush();
          cur.h = b.text;
        } else {
          if (has("list") || has("table") || has("faq")) flush();
          (cur.p ??= []).push(`**${b.text}**`);
        }
        break;
      case "paragraph":
      case "quote":
      case "callout": {
        const t = b.type === "callout" ? [b.title ? `**${b.title}**` : "", b.text].filter(Boolean).join(" ") : b.type === "quote" ? `“${b.text}”${b.cite ? ` — ${b.cite}` : ""}` : b.text;
        if (!t) break;
        if (has("list") || has("table") || has("faq")) flush();
        (cur.p ??= []).push(t);
        break;
      }
      case "list":
        if (has("list") || has("table") || has("faq")) flush();
        cur.list = [...b.items];
        break;
      case "table":
        if (has("table") || has("faq")) flush();
        cur.table = { head: b.head, rows: b.rows, ...(b.caption ? { caption: b.caption } : {}) };
        break;
      case "faq":
        if (has("faq")) flush();
        cur.faq = b.items;
        break;
      default:
        break;
    }
  }
  flush();
  return out;
}

// ---------- text helpers ----------

/** Inline link syntax `[label](/path)` / `[label](https://…)` (same as src/lib/blog.ts). */
export const INLINE_LINK_RE = /\[([^\]]+)\]\(((?:\/|https?:\/\/)[^)\s]*)\)/g;
export const BOLD_RE = /\*\*([^*]+)\*\*/g;

/** Inline markup reduced to plain text. */
export function plainText(s: string) {
  return s.replace(INLINE_LINK_RE, "$1").replace(BOLD_RE, "$1");
}

/** All readable text in blocks (for search, excerpts, meta descriptions and read-time). */
export function blocksText(blocks: Block[]): string {
  const parts: string[] = [];
  for (const b of blocks) {
    switch (b.type) {
      case "heading": case "paragraph": case "quote": parts.push(b.text); break;
      case "callout": parts.push([b.title, b.text].filter(Boolean).join(". ")); break;
      case "list": parts.push(...b.items); break;
      case "table": parts.push(b.head.join(" "), ...b.rows.map((r) => r.join(" "))); break;
      case "faq": for (const f of b.items) parts.push(f.q, f.a); break;
      case "image": if (b.caption) parts.push(b.caption); break;
      default: break;
    }
  }
  return plainText(parts.join(" ")).replace(/\s+/g, " ").trim();
}

/** Estimated reading time in minutes (220 wpm, min 1). */
export function readMinutes(blocks: Block[]) {
  return Math.max(1, Math.round(blocksText(blocks).split(" ").filter(Boolean).length / 220));
}

/** FAQ items (plain text) from all faq blocks — for FAQPage JSON-LD. */
export function blocksFaq(blocks: Block[]): FaqItem[] {
  return blocks.flatMap((b) => (b.type === "faq" ? b.items : [])).map((f) => ({ q: plainText(f.q), a: plainText(f.a) }));
}

export const slugifyHeading = (s: string) => plainText(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

/** Table of contents from H2 blocks. ids match the anchors <Blocks> renders. */
export function blocksToc(blocks: Block[]) {
  return blocks.flatMap((b) => (b.type === "heading" && b.level === 2 ? [{ id: slugifyHeading(b.text), h: plainText(b.text) }] : []));
}
