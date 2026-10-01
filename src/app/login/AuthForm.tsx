"use client";

import { useActionState } from "react";
import { login, register } from "@/app/actions/auth";
import { SubmitButton } from "@/components/SubmitButton";
import { BUSINESS_TYPES } from "@/lib/format";
import { Select } from "@/components/ui/Select";

export function AuthForm({ mode, next, referral = "" }: { mode: "login" | "register"; next: string; referral?: string }) {
  const [state, action] = useActionState(mode === "login" ? login : register, undefined);
  return (
    <form action={action} className="card space-y-4 p-5 sm:p-6">
      <input type="hidden" name="next" value={next} />
      {mode === "register" && (
        <>
          <div><label className="label" htmlFor="name">Your name</label><input id="name" name="name" className="input" required autoComplete="name" /></div>
          <div><label className="label" htmlFor="businessName">Business name</label><input id="businessName" name="businessName" className="input" required autoComplete="organization" /></div>
          <div>
            <label className="label" htmlFor="businessType">What kind of business?</label>
            <Select id="businessType" name="businessType" className="input" defaultValue="">
              <option value="">Select…</option>
              {BUSINESS_TYPES.map((t) => <option key={t}>{t}</option>)}
            </Select>
          </div>
          <input type="hidden" name="ref" value={referral} />
        </>
      )}
      <div><label className="label" htmlFor="email">Email</label><input id="email" name="email" type="email" className="input" required autoComplete="email" /></div>
      <div>
        <label className="label" htmlFor="password">Password</label>
        <input id="password" name="password" type="password" className="input" required minLength={mode === "register" ? 8 : undefined} autoComplete={mode === "login" ? "current-password" : "new-password"} />
      </div>
      {mode === "login" && (
        <p className="-mt-2 text-right text-xs"><a href="/forgot-password" className="font-semibold text-signal-dark hover:underline">Forgot password?</a></p>
      )}
      {state?.error && <p className="rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust">{state.error}</p>}
      <SubmitButton className="btn-primary w-full py-3">{mode === "login" ? "Sign in" : "Create buyer account"}</SubmitButton>
    </form>
  );
}
