"use client";

import { useActionState, useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { quickEditLot, type AdminFormState } from "@/app/actions/seller";
import { SubmitButton } from "@/components/SubmitButton";

type Props = {
  id: string;
  title: string;
  /** Display text for the current price column. */
  priceLabel: string;
  sub?: string;
  price: number; // dollars
  available: number;
};

/** Price cell with an inline editor for price + quantity in stock. */
export function LotQuickEdit({ id, title, priceLabel, sub, price, available }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action] = useActionState<AdminFormState, FormData>(quickEditLot, undefined);
  useEffect(() => {
    if (state?.ok) setOpen(false);
  }, [state]);

  if (!open) {
    return (
      <div className="inline-flex items-center gap-1.5">
        <span className="text-right">
          <span className="block font-semibold tabular-nums">{priceLabel}</span>
          {sub && <span className="block text-[11px] text-muted">{sub}</span>}
          {state?.ok && <span className="block text-[11px] text-moss" role="status">Saved</span>}
        </span>
        <button type="button" onClick={() => setOpen(true)} className="grid h-7 w-7 place-items-center rounded-full text-muted hover:bg-sand hover:text-ink focus-visible:outline-2 focus-visible:outline-signal" aria-label={`Quick edit price and quantity for ${title}`}>
          <Pencil aria-hidden className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }
  return (
    <form action={action} className="inline-flex flex-wrap items-end justify-end gap-1.5 text-left" onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      <input type="hidden" name="id" value={id} />
      <>
          <label className="text-[11px] text-muted">
            Price $
            <input name="price" type="number" min={1} step="1" defaultValue={price} className="input mt-0.5 w-24 py-1 text-sm" required autoFocus />
          </label>
          <label className="text-[11px] text-muted">
            Qty
            <input name="available" type="number" min={0} max={100} step="1" defaultValue={available} className="input mt-0.5 w-16 py-1 text-sm" required />
          </label>
      </>
      <SubmitButton className="btn-dark px-3 py-1.5 text-xs" pendingText="…">Save</SubmitButton>
      <button type="button" onClick={() => setOpen(false)} className="rounded-full px-2 py-1.5 text-xs font-semibold text-muted hover:text-ink">Cancel</button>
      {state?.error && <p role="alert" className="basis-full text-right text-[11px] font-medium text-rust">{state.error}</p>}
    </form>
  );
}
