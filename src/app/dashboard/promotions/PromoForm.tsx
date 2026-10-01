"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { createPromo, updatePromo, type AdminFormState } from "@/app/actions/seller";
import { ActionMessage } from "@/components/admin/Flash";
import { SaveBar } from "@/components/admin/SaveBar";
import { Toggle } from "@/components/admin/FormField";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";

export type PromoDefaults = {
  id: string;
  code: string;
  kind: "percent" | "amount";
  value: number;
  minSubtotal: number;
  description: string;
  firstOrderOnly: boolean;
  active: boolean;
  expiresAt: string; // YYYY-MM-DD or ""
};

function Fields({ d }: { d?: PromoDefaults }) {
  const [kind, setKind] = useState<"percent" | "amount">(d?.kind ?? "percent");
  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="p-kind">Type</label>
          <Select id="p-kind" name="kind" className="input" value={kind} onChange={(e) => setKind(e.target.value === "amount" ? "amount" : "percent")}>
            <option value="percent">% off</option>
            <option value="amount">$ off</option>
          </Select>
        </div>
        <div>
          <label className="label" htmlFor="p-value">{kind === "percent" ? "Percent (max 50)" : "Amount ($)"}</label>
          <input id="p-value" name="value" type="number" min={1} max={kind === "percent" ? 50 : undefined} step="1" defaultValue={d?.value} className="input" required />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="p-min">Minimum spend ($)</label>
          <input id="p-min" name="minSubtotal" type="number" min={0} step="1" defaultValue={d?.minSubtotal ?? 0} className="input" />
        </div>
        <div>
          <label className="label" htmlFor="p-exp">Expires (optional)</label>
          <input id="p-exp" name="expiresAt" type="date" defaultValue={d?.expiresAt ?? ""} className="input" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="p-desc">Description (optional)</label>
        <input id="p-desc" name="description" maxLength={200} defaultValue={d?.description ?? ""} className="input" placeholder="Shown to buyers, e.g. 10% off your first pallet" />
      </div>
      <Toggle name="firstOrderOnly" label="First-time buyers only" description="Only accounts with no previous orders can use it." defaultChecked={d?.firstOrderOnly ?? false} />
    </>
  );
}

export function NewPromoForm() {
  const [state, action] = useActionState<{ error?: string } | undefined, FormData>(createPromo, undefined);
  const [n, setN] = useState(0);
  const prev = useRef(state);
  useEffect(() => {
    if (state !== prev.current && state && !state.error) setN((x) => x + 1);
    prev.current = state;
  }, [state]);
  return (
    <form action={action} key={n} className="space-y-3">
      <div>
        <label className="label" htmlFor="p-code">Code</label>
        <input id="p-code" name="code" className="input font-mono uppercase" placeholder="SPRING15" required pattern="[A-Za-z0-9]{4,20}" title="4–20 letters or numbers" autoComplete="off" />
      </div>
      <Fields />
      <ActionMessage state={state?.error ? state : n > 0 ? { ok: "Promotion created" } : undefined} />
      <SubmitButton className="btn-primary w-full" pendingText="Creating…">Create code</SubmitButton>
    </form>
  );
}

export function EditPromoForm({ d }: { d: PromoDefaults }) {
  const [state, action] = useActionState<AdminFormState, FormData>(updatePromo, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={d.id} />
      <Toggle name="active" label="Active" description="Paused codes are rejected at checkout." defaultChecked={d.active} />
      <Fields d={d} />
      {state?.ok && <ActionMessage state={{ ok: state.ok }} />}
      <SaveBar bleed={false} resetKey={state?.savedAt} message={state?.error} />
    </form>
  );
}
