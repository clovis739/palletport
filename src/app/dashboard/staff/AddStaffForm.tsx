"use client";

import { useActionState, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { addStaff, type StaffState } from "@/app/actions/staff";
import { ActionMessage } from "@/components/admin/Flash";
import { CopyButton } from "@/components/admin/CopyButton";
import { SubmitButton } from "@/components/SubmitButton";
import { Select } from "@/components/ui/Select";

const ROLE_OPTIONS = [
  ["MANAGER", "Manager"],
  ["EDITOR", "Editor"],
  ["ADMIN", "Owner"],
] as const;

export function AddStaffForm() {
  const [state, action] = useActionState<StaffState, FormData>(addStaff, undefined);
  const [mode, setMode] = useState<"new" | "promote">("new");
  return (
    <div className="space-y-4">
      <div role="radiogroup" aria-label="How to add" className="grid grid-cols-2 gap-1 rounded-full bg-sand/40 p-1 text-xs font-semibold">
        {(["new", "promote"] as const).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`rounded-full px-3 py-1.5 focus-visible:outline-2 focus-visible:outline-signal ${mode === m ? "bg-ink text-white" : "text-muted hover:text-ink"}`}>
            {m === "new" ? "Create account" : "Promote existing customer"}
          </button>
        ))}
      </div>

      <form action={action} key={`${mode}-${state?.savedAt ?? 0}`} className="space-y-3">
        <input type="hidden" name="mode" value={mode} />
        {mode === "new" && (
          <div>
            <label htmlFor="s-name" className="label">Name</label>
            <input id="s-name" name="name" className="input" required maxLength={120} autoComplete="off" />
          </div>
        )}
        <div>
          <label htmlFor="s-email" className="label">{mode === "new" ? "Email" : "Customer's email"}</label>
          <input id="s-email" name="email" type="email" className="input" required maxLength={200} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="s-role" className="label">Role</label>
          <Select id="s-role" name="role" defaultValue="MANAGER" className="input">
            {ROLE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <p className="text-xs text-muted">
          {mode === "new" ? "A temporary password is generated and shown once. Send it to them yourself (no email is sent) and ask them to change it under Account → Security." : "They keep their password and order history, and see the Admin link next time they load a page."}
        </p>
        <SubmitButton className="btn-primary w-full" pendingText="Saving…">{mode === "new" ? "Create staff account" : "Give admin access"}</SubmitButton>
      </form>

      <ActionMessage state={state?.error ? { error: state.error } : state?.ok ? { ok: state.ok } : undefined} />
      {state?.tempPassword && (
        <div className="rounded-xl border border-signal/40 bg-signal/5 p-3 text-sm">
          <p className="flex items-center gap-1.5 font-semibold"><AlertTriangle aria-hidden className="h-4 w-4 text-signal" /> Temporary password — shown only once</p>
          <p className="mt-1 break-all text-xs text-muted">{state.email}</p>
          <div className="mt-2 flex items-center gap-1">
            <code className="min-w-0 flex-1 break-all rounded-lg bg-white px-3 py-2 font-mono text-sm">{state.tempPassword}</code>
            <CopyButton text={state.tempPassword} label="Copy password" />
          </div>
        </div>
      )}
    </div>
  );
}
