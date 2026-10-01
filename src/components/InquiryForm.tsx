"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/app/actions/inquiry";
import { SubmitButton } from "./SubmitButton";

type Field = "name" | "company" | "body";

export function InquiryForm({
  topic,
  fields = ["name", "company", "body"],
  submitLabel = "Send",
  bodyLabel = "Message",
  dark = false,
  inline = false,
  defaultBody = "",
}: {
  topic: "CONTACT" | "NEWSLETTER" | "PRO" | "VOLUME" | "AFFILIATE" | "EVENTS" | "INTEGRATIONS";
  fields?: Field[];
  submitLabel?: string;
  bodyLabel?: string;
  dark?: boolean;
  inline?: boolean;
  defaultBody?: string;
}) {
  const [state, action] = useActionState(submitInquiry, undefined);
  if (state?.ok) return <p className={`rounded-lg p-3 text-sm font-medium ${dark ? "bg-white/10 text-white" : "bg-moss/10 text-moss"}`}>{state.ok}</p>;
  const input = dark ? "w-full min-w-0 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2.5 text-base text-white outline-none transition-[border-color,box-shadow] placeholder:text-white/50 hover:border-white/50 focus:border-signal focus:ring-3 focus:ring-signal/30 sm:text-sm" : "input";
  const label = dark ? "mb-1.5 block text-xs font-semibold uppercase tracking-wider text-white/60" : "label";
  return (
    <form action={action} className={inline ? "flex flex-col gap-2 sm:flex-row" : "space-y-4"}>
      <input type="hidden" name="topic" value={topic} />
      {!inline && fields.includes("name") && <div><label className={label} htmlFor={`${topic}-name`}>Name</label><input id={`${topic}-name`} name="name" className={input} required /></div>}
      {inline ? (
        <input name="email" type="email" required placeholder="you@business.com" aria-label="Email" className={input} />
      ) : (
        <div><label className={label} htmlFor={`${topic}-email`}>Work email</label><input id={`${topic}-email`} name="email" type="email" className={input} required /></div>
      )}
      {!inline && fields.includes("company") && <div><label className={label} htmlFor={`${topic}-company`}>Business</label><input id={`${topic}-company`} name="company" className={input} /></div>}
      {!inline && fields.includes("body") && <div><label className={label} htmlFor={`${topic}-body`}>{bodyLabel}</label><textarea id={`${topic}-body`} name="body" rows={4} defaultValue={defaultBody} className={input} /></div>}
      {state?.error && <p className="text-sm font-medium text-rust">{state.error}</p>}
      <SubmitButton className={`${dark ? "btn-primary" : "btn-dark"} ${inline ? "shrink-0" : "w-full"}`}>{submitLabel}</SubmitButton>
    </form>
  );
}
