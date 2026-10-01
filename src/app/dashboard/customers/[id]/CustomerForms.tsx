"use client";

import { useActionState } from "react";
import { KeyRound } from "lucide-react";
import { createResetLink, updateCustomer, type CustomerState } from "@/app/actions/customers";
import { SaveBar } from "@/components/admin/SaveBar";
import { ActionMessage } from "@/components/admin/Flash";
import { CopyButton } from "@/components/admin/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";

export type ProfileDefaults = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  businessName: string | null;
  businessType: string | null;
  shipAddress: string | null;
  shipCity: string | null;
  shipRegion: string | null;
  shipPostal: string | null;
  shipCountry: string | null;
};

function Text({ name, label, value, type = "text", required, autoComplete, className = "" }: { name: string; label: string; value: string | null; type?: string; required?: boolean; autoComplete?: string; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={`c-${name}`} className="label">{label}</label>
      <input id={`c-${name}`} name={name} type={type} defaultValue={value ?? ""} required={required} autoComplete={autoComplete} maxLength={200} className="input" />
    </div>
  );
}

export function ProfileForm({ d, businessTypes, disabledReason }: { d: ProfileDefaults; businessTypes: string[]; disabledReason?: string }) {
  const [state, action] = useActionState<CustomerState, FormData>(updateCustomer, undefined);
  const types = d.businessType && !businessTypes.includes(d.businessType) ? [d.businessType, ...businessTypes] : businessTypes;
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={d.id} />
      {disabledReason && <p className="rounded-lg bg-sand p-3 text-sm">{disabledReason}</p>}
      <fieldset disabled={!!disabledReason} className="space-y-5 disabled:opacity-60">
        <div className="grid gap-4 sm:grid-cols-2">
          <Text name="name" label="Contact name" value={d.name} required autoComplete="off" />
          <Text name="email" label="Email" type="email" value={d.email} required autoComplete="off" />
          <Text name="phone" label="Phone" type="tel" value={d.phone} autoComplete="off" />
          <Text name="businessName" label="Business name" value={d.businessName} autoComplete="off" />
          <div className="min-w-0 sm:col-span-2">
            <label htmlFor="c-businessType" className="label">Business type</label>
            <Select id="c-businessType" name="businessType" defaultValue={d.businessType ?? ""} className="input">
              <option value="">Not specified</option>
              {types.map((t) => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">Default shipping address</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Text name="shipAddress" label="Street address" value={d.shipAddress} className="sm:col-span-2" autoComplete="off" />
            <Text name="shipCity" label="City" value={d.shipCity} autoComplete="off" />
            <Text name="shipRegion" label="State / region" value={d.shipRegion} autoComplete="off" />
            <Text name="shipPostal" label="Postal code" value={d.shipPostal} autoComplete="off" />
            <Text name="shipCountry" label="Country" value={d.shipCountry} autoComplete="off" />
          </div>
        </div>
      </fieldset>
      {state?.ok && <ActionMessage state={{ ok: state.ok }} />}
      {!disabledReason && <SaveBar bleed={false} resetKey={state?.savedAt} message={state?.error} />}
    </form>
  );
}

export function ResetLinkForm({ id, disabledReason }: { id: string; disabledReason?: string }) {
  const [state, action] = useActionState<CustomerState, FormData>(createResetLink, undefined);
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="id" value={id} />
      <p className="text-sm text-muted">
        Creates a one-time link (valid 24 hours) the customer can use to choose a new password. <strong className="text-ink">No email is sent</strong> — the site has no email service yet, so copy the link and send it to the customer yourself. Older unused links stop working.
      </p>
      {disabledReason ? (
        <p className="text-sm text-muted">{disabledReason}</p>
      ) : (
        <SubmitButton className="btn-ghost py-2 text-xs" pendingText="Creating…"><KeyRound aria-hidden className="h-3.5 w-3.5" /> Generate reset link</SubmitButton>
      )}
      {state?.error && <ActionMessage state={{ error: state.error }} />}
      {state?.link && (
        <div className="rounded-lg bg-sand/40 p-3">
          <label htmlFor="reset-link" className="label">Reset link</label>
          <div className="flex items-center gap-1">
            <input id="reset-link" readOnly value={state.link} className="input min-w-0 flex-1 py-1.5 font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
            <CopyButton text={state.link} label="Copy link" />
          </div>
          {state.expiresAt && <p className="mt-1 text-xs text-muted">Expires {new Date(state.expiresAt).toLocaleString()}.</p>}
        </div>
      )}
    </form>
  );
}
