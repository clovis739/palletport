"use client";

import { useEffect, useRef, useState } from "react";
import { bulkLots } from "@/app/actions/seller";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/SubmitButton";

const BULK_FORM_ID = "lots-bulk-form"; // keep in sync with the lots page

/**
 * Bulk action bar for the lots table. Row checkboxes live in the table and join this form with
 * form="lots-bulk-form" name="ids". Works without JS (except the live count / select-all).
 */
export type BulkTree = { id: string; name: string; subcategories: { id: string; name: string }[] }[];

export function LotsBulkBar({ back, tree = [] }: { back: string; /** Categories for "Move to category". */ tree?: BulkTree }) {
  const [count, setCount] = useState(0);
  const [op, setOp] = useState("");
  const allRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const boxes = () => Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${BULK_FORM_ID}"]`));
    const sync = () => {
      const all = boxes();
      const ids = new Set(all.filter((b) => b.checked).map((b) => b.value));
      const total = new Set(all.map((b) => b.value)).size;
      setCount(ids.size);
      if (allRef.current) {
        allRef.current.checked = total > 0 && ids.size === total;
        allRef.current.indeterminate = ids.size > 0 && ids.size < total;
      }
    };
    // Keep the desktop row and its phone card copy in step.
    const onChange = (e: Event) => {
      const t = e.target as HTMLInputElement;
      if (t?.name === "ids" && t.getAttribute("form") === BULK_FORM_ID) {
        for (const b of boxes()) if (b.value === t.value) b.checked = t.checked;
        sync();
      }
    };
    document.addEventListener("change", onChange);
    sync();
    return () => document.removeEventListener("change", onChange);
  }, []);

  const toggleAll = (on: boolean) => {
    for (const b of document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${BULK_FORM_ID}"]`)) b.checked = on;
    setCount(on ? new Set(Array.from(document.querySelectorAll<HTMLInputElement>(`input[name="ids"][form="${BULK_FORM_ID}"]`)).map((b) => b.value)).size : 0);
  };

  return (
    <form id={BULK_FORM_ID} action={bulkLots} className="flex flex-wrap items-center gap-2 bg-sand/30 px-4 py-2.5 sm:px-5">
      <input type="hidden" name="back" value={back} />
      <label className="flex items-center gap-2 text-xs font-semibold">
        <input ref={allRef} type="checkbox" className="h-4 w-4 accent-signal" onChange={(e) => toggleAll(e.target.checked)} />
        Select all on page
      </label>
      <span className="text-xs text-muted" aria-live="polite">{count ? `${count} selected` : "None selected"}</span>
      <div className="ml-auto flex items-center gap-2">
        <div className="w-44">
          <Select name="op" value={op} onChange={(e) => setOp(e.target.value)} aria-label="Bulk action" className="input py-1.5 text-sm" required>
            <option value="" disabled>Bulk action…</option>
            <option value="publish">Publish</option>
            <option value="draft">Move to draft</option>
            <option value="feature">Feature</option>
            <option value="unfeature">Unfeature</option>
            <option value="move">Move to category…</option>
            <option value="delete">Delete (hide if sold)</option>
          </Select>
        </div>
        {op === "move" && (
          <div className="w-60">
            <Select name="target" defaultValue="" aria-label="Move to" className="input py-1.5 text-sm" required>
              <option value="" disabled>Move to…</option>
              {tree.flatMap((c) => [
                <option key={c.id} value={`cat:${c.id}`}>{c.name}</option>,
                ...c.subcategories.map((s) => <option key={s.id} value={`sub:${s.id}`}>{`${c.name} › ${s.name}`}</option>),
              ])}
            </Select>
          </div>
        )}
        <SubmitButton className="btn-dark py-1.5 text-xs" pendingText="Applying…">Apply</SubmitButton>
      </div>
    </form>
  );
}
