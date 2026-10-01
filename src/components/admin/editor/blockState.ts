import type { Block, BlockType } from "@/lib/blocks";

/** Block list reducer for the editor. Blocks always carry a stable `id` (React key). */
export type BlockAction =
  | { t: "set"; id: string; block: Block }
  | { t: "insert"; at: number; block: Block }
  | { t: "remove"; id: string }
  | { t: "move"; id: string; to: number }
  | { t: "moveBy"; id: string; delta: number }
  | { t: "duplicate"; id: string; newId: string }
  | { t: "convert"; id: string; to: Extract<BlockType, "heading" | "paragraph"> }
  | { t: "reset"; blocks: Block[] };

let seq = 0;
/** New block id (only call from event handlers, never during render). */
export const newBlockId = () => `n${Date.now().toString(36)}${(seq++).toString(36)}`;

export function blocksReducer(state: Block[], a: BlockAction): Block[] {
  switch (a.t) {
    case "set":
      return state.map((b) => (b.id === a.id ? { ...a.block, id: a.id } : b));
    case "insert": {
      const next = [...state];
      next.splice(Math.max(0, Math.min(a.at, next.length)), 0, a.block);
      return next;
    }
    case "remove":
      return state.filter((b) => b.id !== a.id);
    case "move": {
      const from = state.findIndex((b) => b.id === a.id);
      if (from < 0) return state;
      let to = Math.max(0, Math.min(a.to, state.length));
      if (to > from) to--; // index after removal
      if (to === from) return state;
      const next = [...state];
      const [b] = next.splice(from, 1);
      next.splice(to, 0, b);
      return next;
    }
    case "moveBy": {
      const from = state.findIndex((b) => b.id === a.id);
      const to = from + a.delta;
      if (from < 0 || to < 0 || to >= state.length) return state;
      const next = [...state];
      const [b] = next.splice(from, 1);
      next.splice(to, 0, b);
      return next;
    }
    case "duplicate": {
      const i = state.findIndex((b) => b.id === a.id);
      if (i < 0) return state;
      const copy = { ...structuredClone(state[i]), id: a.newId };
      const next = [...state];
      next.splice(i + 1, 0, copy);
      return next;
    }
    case "convert":
      return state.map((b): Block => {
        if (b.id !== a.id) return b;
        if (a.to === "heading" && b.type === "paragraph") return { id: b.id, type: "heading", level: 2, text: b.text.replace(/\s+/g, " ").trim() };
        if (a.to === "paragraph" && b.type === "heading") return { id: b.id, type: "paragraph", text: b.text };
        return b;
      });
    case "reset":
      return a.blocks;
  }
}
