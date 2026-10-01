"use client";

import { useActionState } from "react";
import { updateStoreSettings, type AdminFormState } from "@/app/actions/seller";
import { FormSection, Toggle } from "@/components/admin/FormField";
import { ActionMessage } from "@/components/admin/Flash";
import { SaveBar } from "@/components/admin/SaveBar";

export function StoreSettingsForm({ minOrder, pickup, bio }: { minOrder: number; pickup: boolean; bio: string }) {
  const [state, action] = useActionState<AdminFormState, FormData>(updateStoreSettings, undefined);
  return (
    <form action={action}>
      <FormSection title="Checkout" description="Rules applied when buyers place an order.">
        <div className="max-w-xs">
          <label htmlFor="minOrder" className="label">Minimum order value (USD)</label>
          <input id="minOrder" name="minOrder" type="number" min={0} step="1" defaultValue={minOrder} className="input" aria-describedby="minOrder-hint" />
          <p id="minOrder-hint" className="mt-1 text-xs text-muted">Cart subtotal (before freight) needed to check out. 0 = no minimum.</p>
        </div>
      </FormSection>
      <FormSection title="Delivery" description="How buyers can receive their lots.">
        <Toggle
          name="pickup"
          defaultChecked={pickup}
          label="Offer warehouse pickup at checkout"
          description="When off, buyers can't choose pickup at checkout but can still request a pickup appointment through Contact."
        />
      </FormSection>
      <FormSection title="Store bio" description="Short description of the warehouse, shown on lot pages and as the default text of the homepage About card.">
        <div>
          <label htmlFor="bio" className="label">Bio</label>
          <textarea id="bio" name="bio" rows={4} minLength={20} maxLength={1000} defaultValue={bio} className="input resize-y" required />
        </div>
      </FormSection>
      {state?.ok && <ActionMessage state={{ ok: state.ok }} className="mt-4" />}
      <SaveBar bleed={false} resetKey={state?.savedAt} message={state?.error} />
    </form>
  );
}
