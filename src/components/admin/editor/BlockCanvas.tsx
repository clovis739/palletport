"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type DragEvent, type KeyboardEvent } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CircleHelp,
  Copy,
  GripVertical,
  Heading2,
  ImageIcon,
  Info,
  List,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Table,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { BLOCK_TYPES, emptyBlock, type Block, type BlockType } from "@/lib/blocks";
import { BlockFields } from "./BlockFields";
import { newBlockId, type BlockAction } from "./blockState";

export const BLOCK_ICONS: Record<BlockType, LucideIcon> = {
  heading: Heading2,
  paragraph: Pilcrow,
  list: List,
  image: ImageIcon,
  table: Table,
  faq: CircleHelp,
  callout: Info,
  quote: Quote,
  divider: Minus,
};
const LABEL = Object.fromEntries(BLOCK_TYPES.map((b) => [b.type, b.label])) as Record<BlockType, string>;

type FocusReq = { id: string; target: "body" | "handle"; n: number } | null;

type Api = {
  dispatch: Dispatch<BlockAction>;
  insert: (at: number, type: BlockType) => void;
  remove: (id: string, index: number) => void;
  focus: (id: string, target: "body" | "handle") => void;
  dragStart: (id: string) => void;
  dragOver: (index: number, after: boolean) => void;
  drop: () => void;
  dragEnd: () => void;
};

/**
 * The block canvas: blocks with inline editors, a toolbar per block (drag handle, move, convert, duplicate,
 * delete) and "+" insert menus between blocks. Block items are memoised: typing re-renders only that block.
 */
export function BlockCanvas({
  blocks,
  dispatch,
  errors,
  onRemoved,
}: {
  blocks: Block[];
  dispatch: Dispatch<BlockAction>;
  errors: Record<string, string>;
  /** Called after a block is deleted (for an "Undo" toast). */
  onRemoved?: (block: Block, index: number) => void;
}) {
  const [focusReq, setFocusReq] = useState<FocusReq>(null);
  const [drag, setDrag] = useState<{ id: string; over: number | null } | null>(null);
  const dragRef = useRef(drag);
  dragRef.current = drag;
  const removedRef = useRef(onRemoved);
  removedRef.current = onRemoved;
  const blocksRef = useRef(blocks);
  blocksRef.current = blocks;

  const api = useMemo<Api>(
    () => ({
      dispatch,
      insert(at, type) {
        const block = { ...emptyBlock(type), id: newBlockId() };
        dispatch({ t: "insert", at, block });
        setFocusReq({ id: block.id!, target: "body", n: Date.now() });
      },
      remove(id, index) {
        const b = blocksRef.current.find((x) => x.id === id);
        dispatch({ t: "remove", id });
        const list = blocksRef.current.filter((x) => x.id !== id);
        const next = list[Math.min(index, list.length - 1)];
        if (next?.id) setFocusReq({ id: next.id, target: "handle", n: Date.now() });
        if (b) removedRef.current?.(b, index);
      },
      focus(id, target) {
        setFocusReq({ id, target, n: Date.now() });
      },
      dragStart(id) {
        setDrag({ id, over: null });
      },
      dragOver(index, after) {
        const d = dragRef.current;
        if (!d) return;
        const over = after ? index + 1 : index;
        if (d.over !== over) setDrag({ ...d, over });
      },
      drop() {
        const d = dragRef.current;
        if (d && d.over !== null) {
          dispatch({ t: "move", id: d.id, to: d.over });
          setFocusReq({ id: d.id, target: "handle", n: Date.now() });
        }
        setDrag(null);
      },
      dragEnd() {
        setDrag(null);
      },
    }),
    [dispatch],
  );

  const total = blocks.length;
  return (
    <div className="space-y-0" onDragOver={(e) => drag && e.preventDefault()} onDrop={(e) => { e.preventDefault(); api.drop(); }}>
      <InsertSlot at={0} onInsert={api.insert} first={total === 0} />
      {blocks.map((b, i) => (
        <div key={b.id}>
          <BlockItem
            block={b}
            index={i}
            total={total}
            error={errors[b.id ?? ""]}
            api={api}
            focusTarget={focusReq && focusReq.id === b.id ? focusReq.target : null}
            focusN={focusReq && focusReq.id === b.id ? focusReq.n : 0}
            dragging={drag?.id === b.id}
            dropBefore={!!drag && drag.over === i && drag.id !== b.id}
            dropAfter={!!drag && drag.over === i + 1 && i === total - 1}
          />
          <InsertSlot at={i + 1} onInsert={api.insert} last={i === total - 1} />
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------- block item

const tbBtn = "grid h-8 w-8 shrink-0 place-items-center rounded-lg text-ink/60 hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal disabled:opacity-30 disabled:hover:bg-transparent";

const BlockItem = memo(function BlockItem({
  block,
  index,
  total,
  error,
  api,
  focusTarget,
  focusN,
  dragging,
  dropBefore,
  dropAfter,
}: {
  block: Block;
  index: number;
  total: number;
  error?: string;
  api: Api;
  focusTarget: "body" | "handle" | null;
  focusN: number;
  dragging: boolean;
  dropBefore: boolean;
  dropAfter: boolean;
}) {
  const id = block.id!;
  const root = useRef<HTMLDivElement>(null);
  const handle = useRef<HTMLButtonElement>(null);
  const [armed, setArmed] = useState(false);
  const Icon = BLOCK_ICONS[block.type];

  useEffect(() => {
    if (!focusTarget) return;
    if (focusTarget === "handle") {
      handle.current?.focus();
      return;
    }
    const el = root.current?.querySelector<HTMLElement>("[data-autofocus], textarea, input:not([type=hidden])");
    (el ?? handle.current)?.focus();
    root.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [focusTarget, focusN]);

  // The block is only draggable while its handle is pressed (so text selection in fields keeps working).
  useEffect(() => {
    if (!armed) return;
    const off = () => setArmed(false);
    window.addEventListener("pointerup", off);
    return () => window.removeEventListener("pointerup", off);
  }, [armed]);

  const onChange = useCallback((b: Block) => api.dispatch({ t: "set", id, block: b }), [api, id]);

  function move(delta: number) {
    api.dispatch({ t: "moveBy", id, delta });
    api.focus(id, "handle");
  }

  function handleKey(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "ArrowUp" && index > 0) {
      e.preventDefault();
      move(-1);
    } else if (e.key === "ArrowDown" && index < total - 1) {
      e.preventDefault();
      move(1);
    }
  }

  function onDragOver(e: DragEvent<HTMLDivElement>) {
    const r = root.current?.getBoundingClientRect();
    if (!r) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    api.dragOver(index, e.clientY > r.top + r.height / 2);
  }

  const convertible = block.type === "paragraph" || block.type === "heading";
  const errId = `${id}-err`;

  return (
    <div className="relative">
      {dropBefore && <DropLine className="-top-1.5" />}
      <div
        ref={root}
        role="group"
        aria-label={`${LABEL[block.type]} block, ${index + 1} of ${total}`}
        aria-describedby={error ? errId : undefined}
        draggable={armed}
        onDragStart={(e) => {
          e.dataTransfer.effectAllowed = "move";
          e.dataTransfer.setData("text/plain", id);
          api.dragStart(id);
        }}
        onDragEnd={() => {
          setArmed(false);
          api.dragEnd();
        }}
        onDragOver={onDragOver}
        className={`group/block rounded-2xl border bg-white transition focus-within:border-transparent ${
 error ?"border-rust ring-2 ring-rust/15":""
 } ${dragging ?"opacity-40":""}`}
      >
        <div className="flex items-center gap-1 px-1.5 py-1">
          <button
            ref={handle}
            type="button"
            className={`${tbBtn} cursor-grab active:cursor-grabbing`}
            aria-label={`Move ${LABEL[block.type].toLowerCase()} block (drag, or use arrow keys)`}
            title="Drag to reorder · ↑/↓ keys move"
            onPointerDown={() => setArmed(true)}
            onPointerUp={() => setArmed(false)}
            onKeyDown={handleKey}
          >
            <GripVertical aria-hidden className="h-4 w-4" />
          </button>
          <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
            <Icon aria-hidden className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{block.type === "heading" ? `Heading ${block.level}` : LABEL[block.type]}</span>
          </span>
          <div className="ml-auto flex items-center">
            {convertible && (
              <button
                type="button"
                className="mr-1 hidden h-8 items-center rounded-lg px-2 text-xs font-semibold text-ink/60 hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal sm:inline-flex"
                onClick={() => {
                  api.dispatch({ t: "convert", id, to: block.type === "paragraph" ? "heading" : "paragraph" });
                  api.focus(id, "body");
                }}
              >
                {block.type === "paragraph" ? "→ Heading" : "→ Paragraph"}
              </button>
            )}
            <button type="button" className={tbBtn} onClick={() => move(-1)} disabled={index === 0} aria-label="Move up">
              <ArrowUp aria-hidden className="h-4 w-4" />
            </button>
            <button type="button" className={tbBtn} onClick={() => move(1)} disabled={index === total - 1} aria-label="Move down">
              <ArrowDown aria-hidden className="h-4 w-4" />
            </button>
            <button
              type="button"
              className={tbBtn}
              aria-label="Duplicate block"
              onClick={() => {
                const newId = newBlockId();
                api.dispatch({ t: "duplicate", id, newId });
                api.focus(newId, "body");
              }}
            >
              <Copy aria-hidden className="h-4 w-4" />
            </button>
            <button type="button" className={`${tbBtn} hover:text-rust`} aria-label="Delete block" onClick={() => api.remove(id, index)}>
              <Trash2 aria-hidden className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-3 sm:p-4">
          {convertible && (
            <button
              type="button"
              className="mb-2 inline-flex h-7 items-center rounded-lg px-2 text-xs font-semibold text-ink/60 hover:bg-sand sm:hidden"
              onClick={() => {
                api.dispatch({ t: "convert", id, to: block.type === "paragraph" ? "heading" : "paragraph" });
                api.focus(id, "body");
              }}
            >
              {block.type === "paragraph" ? "Convert to heading" : "Convert to paragraph"}
            </button>
          )}
          <BlockFields block={block} onChange={onChange} invalid={!!error} />
          {error && (
            <p id={errId} role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-rust">
              <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" /> {error}
            </p>
          )}
        </div>
      </div>
      {dropAfter && <DropLine className="-bottom-1.5" />}
    </div>
  );
});

function DropLine({ className }: { className: string }) {
  return <div aria-hidden className={`pointer-events-none absolute inset-x-2 z-10 h-1 rounded-full bg-signal ${className}`} />;
}

// ---------------------------------------------------------------- insert menu

function InsertSlot({ at, onInsert, first = false, last = false }: { at: number; onInsert: (at: number, t: BlockType) => void; first?: boolean; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    menu.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onDoc = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDoc);
    return () => document.removeEventListener("pointerdown", onDoc);
  }, [open]);

  function close(refocus = true) {
    setOpen(false);
    if (refocus) btn.current?.focus();
  }

  function onMenuKey(e: KeyboardEvent<HTMLDivElement>) {
    const items = [...(menu.current?.querySelectorAll<HTMLButtonElement>("[role=menuitem]") ?? [])];
    const i = items.indexOf(document.activeElement as HTMLButtonElement);
    const cols = window.matchMedia("(min-width: 640px)").matches ? 3 : 2;
    const go = (n: number) => {
      e.preventDefault();
      items[(n + items.length) % items.length]?.focus();
    };
    if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "ArrowRight") go(i + 1);
    else if (e.key === "ArrowLeft") go(i - 1);
    else if (e.key === "ArrowDown") go(i + cols);
    else if (e.key === "ArrowUp") go(i - cols);
    else if (e.key === "Home") go(0);
    else if (e.key === "End") go(items.length - 1);
    else if (e.key === "Tab") setOpen(false);
  }

  const big = first || last;
  return (
    <div ref={wrap} className={`group/slot relative flex items-center justify-center ${big ? "py-3" : "h-6"}`}>
      {!big && <span aria-hidden className="absolute inset-x-6 top-1/2 h-px bg-signal/50 opacity-0 transition group-hover/slot:opacity-100 group-focus-within/slot:opacity-100" />}
      <button
        ref={btn}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={first ? "Add a block" : last ? "Add a block at the end" : `Insert a block at position ${at + 1}`}
        onClick={() => setOpen((o) => !o)}
        className={
 big
 ?"inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink/80 hover:text-ink focus-visible:outline-2 focus-visible:outline-signal"
 :`relative z-[1] grid h-6 w-6 place-items-center rounded-full border border-transparent bg-white text-ink/70 transition hover:border-signal hover:bg-signal hover:text-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-signal group-hover/slot:opacity-100 [@media(hover:none)]:opacity-100 ${open ?"opacity-100":"opacity-0"}`
 }
      >
        <Plus aria-hidden className={big ? "h-4 w-4" : "h-3.5 w-3.5"} />
        {big && (first ? "Add a block" : "Add block")}
      </button>
      {open && (
        <div
          ref={menu}
          role="menu"
          aria-label="Block types"
          onKeyDown={onMenuKey}
          className="pp-pop absolute left-1/2 top-full z-30 mt-1 grid w-[min(34rem,calc(100vw-2rem))] -translate-x-1/2 grid-cols-2 gap-1 rounded-2xl bg-white p-2 sm:grid-cols-3"
        >
          {BLOCK_TYPES.map((b) => {
            const I = BLOCK_ICONS[b.type];
            return (
              <button
                key={b.type}
                type="button"
                role="menuitem"
                title={b.description}
                onClick={() => {
                  setOpen(false);
                  onInsert(at, b.type);
                }}
                className="flex min-w-0 items-start gap-2 rounded-xl p-2 text-left hover:bg-sand focus-visible:bg-sand focus-visible:outline-2 focus-visible:outline-signal"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-sand/70 text-ink">
                  <I aria-hidden className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{b.label}</span>
                  <span className="line-clamp-2 text-[11px] leading-snug text-muted">{b.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
