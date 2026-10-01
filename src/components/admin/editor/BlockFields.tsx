"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Minus, Plus, X } from "lucide-react";
import type { Block, BlockOf } from "@/lib/blocks";
import { MediaPicker } from "@/components/admin/MediaPicker";
import { Select } from "@/components/ui/Select";
import { RichTextArea } from "./RichTextArea";

/**
 * Inline editors for each block type. Each receives the block and `onChange(nextBlock)`.
 * The first focusable control carries data-autofocus so the canvas can focus new blocks.
 */
type Props<T extends Block["type"]> = { block: BlockOf<T>; onChange: (b: Block) => void; invalid?: boolean };

const iconBtn = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted hover:bg-sand hover:text-rust focus-visible:outline-2 focus-visible:outline-signal disabled:opacity-30 disabled:hover:bg-transparent";
const addBtn = "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-signal";

export function Segmented<T extends string | number>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-full bg-white p-0.5">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition focus-visible:outline-2 focus-visible:outline-signal ${o.value === value ? "bg-ink text-white" : "text-muted hover:text-ink"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- heading

export function HeadingFields({ block, onChange, invalid }: Props<"heading">) {
  return (
    <div className="space-y-2">
      <Segmented<2 | 3> label="Heading level" value={block.level} onChange={(level) => onChange({ ...block, level })} options={[{ value: 2, label: "H2 · Section" }, { value: 3, label: "H3 · Sub-heading" }]} />
      <input
        data-autofocus
        aria-label="Heading text"
        aria-invalid={invalid || undefined}
        value={block.text}
        placeholder="Section title"
        onChange={(e) => onChange({ ...block, text: e.target.value })}
        className={`w-full rounded-xl border bg-white px-3.5 py-2 font-display font-bold outline-none focus:border-transparent focus:ring-2 focus:ring-ink/10 ${block.level === 2 ?"text-xl":"text-lg"} ${invalid && !block.text.trim() ?"border-rust":"border-transparent"}`}
      />
    </div>
  );
}

// ---------------------------------------------------------------- paragraph

export function ParagraphFields({ block, onChange }: Props<"paragraph">) {
  return (
    <div data-autofocus-wrap>
      <RichTextArea toolbar label="Paragraph" value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="Write something… Use the toolbar for bold text and links." minRows={3} />
    </div>
  );
}

// ---------------------------------------------------------------- list

export function ListFields({ block, onChange }: Props<"list">) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusAt, setFocusAt] = useState<number | null>(null);
  useEffect(() => {
    if (focusAt === null) return;
    refs.current[focusAt]?.focus();
    setFocusAt(null);
  }, [focusAt]);

  const setItems = (items: string[]) => onChange({ ...block, items });
  const insertAfter = (i: number) => {
    const items = [...block.items];
    items.splice(i + 1, 0, "");
    setItems(items);
    setFocusAt(i + 1);
  };
  const remove = (i: number) => {
    if (block.items.length <= 1) return setItems([""]);
    setItems(block.items.filter((_, j) => j !== i));
    setFocusAt(Math.max(0, i - 1));
  };
  const keyDown = (i: number) => (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      insertAfter(i);
    } else if (e.key === "Backspace" && !block.items[i] && block.items.length > 1) {
      e.preventDefault();
      remove(i);
    }
  };

  return (
    <div className="space-y-2">
      <Segmented<"ul" | "ol"> label="List style" value={block.ordered ? "ol" : "ul"} onChange={(v) => onChange({ ...block, ordered: v === "ol" || undefined })} options={[{ value: "ul", label: "• Bulleted" }, { value: "ol", label: "1. Numbered" }]} />
      <ol className="space-y-1.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span aria-hidden className="w-5 shrink-0 text-right text-sm font-semibold text-signal-dark">{block.ordered ? `${i + 1}.` : "•"}</span>
            <input
              ref={(el) => {
                refs.current[i] = el;
              }}
              data-autofocus={i === 0 ? true : undefined}
              aria-label={`Item ${i + 1}`}
              className="input py-2"
              value={item}
              placeholder="List item"
              onChange={(e) => setItems(block.items.map((x, j) => (j === i ? e.target.value : x)))}
              onKeyDown={keyDown(i)}
            />
            <button type="button" className={iconBtn} onClick={() => remove(i)} aria-label={`Remove item ${i + 1}`}>
              <X aria-hidden className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ol>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={addBtn} onClick={() => insertAfter(block.items.length - 1)}>
          <Plus aria-hidden className="h-3.5 w-3.5" /> Add item
        </button>
        <span className="text-[11px] text-muted">Enter adds an item · Backspace on an empty item removes it</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- image

export function ImageFields({ block, onChange, invalid }: Props<"image">) {
  const id = useId();
  const altMissing = invalid && !block.alt.trim();
  return (
    <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      <MediaPicker
        value={block.src}
        allowEmpty={false}
        onChange={(src) => {
          const { width: _w, height: _h, ...rest } = block;
          void _w;
          void _h;
          onChange({ ...rest, src });
        }}
        label="Image"
      />
      <div className="space-y-3">
        <div>
          <label htmlFor={`${id}-alt`} className="label">Alt text <span className="normal-case tracking-normal text-rust">*</span></label>
          <input
            id={`${id}-alt`}
            data-autofocus
            className={`input ${altMissing ? "border-rust" : ""}`}
            value={block.alt}
            aria-invalid={altMissing || undefined}
            aria-describedby={`${id}-alth`}
            placeholder="e.g. Shrink-wrapped pallet of mixed small appliances"
            onChange={(e) => onChange({ ...block, alt: e.target.value })}
          />
          <p id={`${id}-alth`} className={`mt-1 text-xs ${altMissing ? "font-medium text-rust" : "text-muted"}`}>
            Describe what the photo shows for people using screen readers and for search engines. Required.
          </p>
        </div>
        <div>
          <label htmlFor={`${id}-cap`} className="label">Caption <span className="normal-case tracking-normal text-muted">(optional)</span></label>
          <input id={`${id}-cap`} className="input" value={block.caption ?? ""} onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })} placeholder="Shown under the image" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- table

export function TableFields({ block, onChange }: Props<"table">) {
  const cols = Math.max(1, block.head.length, ...block.rows.map((r) => r.length));
  const norm = (r: string[]) => Array.from({ length: cols }, (_, i) => r[i] ?? "");
  const head = norm(block.head);
  const rows = block.rows.map(norm);
  const set = (h: string[], r: string[][]) => onChange({ ...block, head: h, rows: r });
  const cell = "w-full min-w-[8rem] rounded-md bg-transparent px-2 py-1.5 text-sm outline-none focus:bg-white";

  return (
    <div className="space-y-3">
      <input className="input py-2" aria-label="Table caption" placeholder="Caption (optional), e.g. Typical costs by lot size" value={block.caption ?? ""} onChange={(e) => onChange({ ...block, caption: e.target.value || undefined })} />
      <div className="overflow-x-auto overscroll-x-contain rounded-xl" data-lenis-prevent>
        <table className="w-full text-left">
          <thead className="bg-sand/70">
            <tr>
              {head.map((h, c) => (
                <th key={c} scope="col" className="p-1 align-top">
                  <div className="flex items-center gap-1">
                    <input
                      data-autofocus={c === 0 ? true : undefined}
                      aria-label={`Column ${c + 1} heading`}
                      className={`${cell} font-semibold`}
                      value={h}
                      onChange={(e) => set(head.map((x, j) => (j === c ? e.target.value : x)), rows)}
                    />
                    <button
                      type="button"
                      className={iconBtn}
                      disabled={cols <= 1}
                      aria-label={`Remove column ${c + 1}`}
                      onClick={() => set(head.filter((_, j) => j !== c), rows.map((r) => r.filter((_, j) => j !== c)))}
                    >
                      <Minus aria-hidden className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </th>
              ))}
              <th className="w-10 p-1" aria-hidden />
            </tr>
          </thead>
          <tbody >
            {rows.map((r, ri) => (
              <tr key={ri}>
                {r.map((v, c) => (
                  <td key={c} className="p-1 align-top">
                    <input
                      aria-label={`Row ${ri + 1}, ${head[c] || `column ${c + 1}`}`}
                      className={`${cell} ${c === 0 ? "font-semibold" : ""}`}
                      value={v}
                      onChange={(e) => set(head, rows.map((row, i) => (i === ri ? row.map((x, j) => (j === c ? e.target.value : x)) : row)))}
                    />
                  </td>
                ))}
                <td className="p-1 align-top">
                  <button type="button" className={iconBtn} aria-label={`Remove row ${ri + 1}`} onClick={() => set(head, rows.filter((_, i) => i !== ri))}>
                    <X aria-hidden className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={addBtn} onClick={() => set(head, [...rows, Array(cols).fill("")])}>
          <Plus aria-hidden className="h-3.5 w-3.5" /> Add row
        </button>
        <button type="button" className={addBtn} disabled={cols >= 8} onClick={() => set([...head, `Column ${cols + 1}`], rows.map((r) => [...r, ""]))}>
          <Plus aria-hidden className="h-3.5 w-3.5" /> Add column
        </button>
        <span className="self-center text-[11px] text-muted">The first column shows as row headings.</span>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- faq

export function FaqFields({ block, onChange, invalid }: Props<"faq">) {
  const set = (items: { q: string; a: string }[]) => onChange({ ...block, items });
  return (
    <div className="space-y-3">
      {block.items.map((f, i) => (
        <fieldset key={i} className="space-y-2 rounded-xl bg-paper/60 p-3">
          <legend className="sr-only">Question {i + 1}</legend>
          <div className="flex items-center gap-2">
            <span aria-hidden className="w-6 shrink-0 font-display text-sm font-bold text-signal-dark">Q{i + 1}</span>
            <input
              data-autofocus={i === 0 ? true : undefined}
              aria-label={`Question ${i + 1}`}
              className={`input py-2 font-semibold ${invalid && !f.q.trim() ? "border-rust" : ""}`}
              placeholder="Question"
              value={f.q}
              onChange={(e) => set(block.items.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)))}
            />
            <button type="button" className={iconBtn} aria-label={`Remove question ${i + 1}`} onClick={() => set(block.items.length > 1 ? block.items.filter((_, j) => j !== i) : [{ q: "", a: "" }])}>
              <X aria-hidden className="h-4 w-4" />
            </button>
          </div>
          <div className="pl-8">
            <RichTextArea toolbar label={`Answer ${i + 1}`} value={f.a} placeholder="Answer (visible on the page)" onChange={(a) => set(block.items.map((x, j) => (j === i ? { ...x, a } : x)))} />
          </div>
        </fieldset>
      ))}
      <button type="button" className={addBtn} onClick={() => set([...block.items, { q: "", a: "" }])}>
        <Plus aria-hidden className="h-3.5 w-3.5" /> Add question
      </button>
    </div>
  );
}

// ---------------------------------------------------------------- callout / quote / divider

export function CalloutFields({ block, onChange }: Props<"callout">) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="grid gap-2 sm:grid-cols-[10rem_minmax(0,1fr)]">
        <div>
          <label htmlFor={`${id}-tone`} className="sr-only">Callout style</label>
          <Select id={`${id}-tone`} value={block.tone} onChange={(e) => onChange({ ...block, tone: e.target.value as BlockOf<"callout">["tone"] })}>
            <option value="info">Info</option>
            <option value="tip">Tip</option>
            <option value="warning">Warning</option>
          </Select>
        </div>
        <input data-autofocus aria-label="Callout title" className="input py-2 font-semibold" placeholder="Title (optional)" value={block.title ?? ""} onChange={(e) => onChange({ ...block, title: e.target.value || undefined })} />
      </div>
      <RichTextArea toolbar label="Callout text" value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="The note to highlight" />
    </div>
  );
}

export function QuoteFields({ block, onChange }: Props<"quote">) {
  return (
    <div className="space-y-2 border-l-4 border-signal pl-3">
      <div data-autofocus-wrap>
        <RichTextArea label="Quote" value={block.text} onChange={(text) => onChange({ ...block, text })} placeholder="The quote" className="font-display" />
      </div>
      <input aria-label="Attribution" className="input py-2" placeholder="— Who said it (optional)" value={block.cite ?? ""} onChange={(e) => onChange({ ...block, cite: e.target.value || undefined })} />
    </div>
  );
}

export function DividerFields() {
  return <div className="rounded bg-sand py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-muted" aria-label="Divider">Section break</div>;
}

export function BlockFields({ block, onChange, invalid }: { block: Block; onChange: (b: Block) => void; invalid?: boolean }) {
  switch (block.type) {
    case "heading": return <HeadingFields block={block} onChange={onChange} invalid={invalid} />;
    case "paragraph": return <ParagraphFields block={block} onChange={onChange} />;
    case "list": return <ListFields block={block} onChange={onChange} />;
    case "image": return <ImageFields block={block} onChange={onChange} invalid={invalid} />;
    case "table": return <TableFields block={block} onChange={onChange} />;
    case "faq": return <FaqFields block={block} onChange={onChange} invalid={invalid} />;
    case "callout": return <CalloutFields block={block} onChange={onChange} />;
    case "quote": return <QuoteFields block={block} onChange={onChange} />;
    case "divider": return <DividerFields />;
  }
}
