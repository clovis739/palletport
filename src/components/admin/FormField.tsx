import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

/**
 * Form helpers (server-safe; work inside client forms too). Inputs use the site's `.input` / `.label` classes.
 *
 *   <FormSection title="Contact" description="Shown on the contact page and in the footer.">
 *     <TextField name="email" label="Support email" type="email" defaultValue={b.email} hint="Leave empty to hide" />
 *     <TextArea name="pickupNote" label="Pickup note" rows={3} defaultValue={b.pickupNote} />
 *     <Toggle name="enabled" label="Show announcement bar" defaultChecked={a.enabled} />
 *   </FormSection>
 *
 * For dropdowns use <Select> from src/components/ui/Select.tsx inside <Field>.
 */
export function Field({ label, htmlFor, hint, error, children, className = "" }: { label: ReactNode; htmlFor?: string; hint?: ReactNode; error?: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="label">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs font-medium text-rust">{error}</p> : hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </div>
  );
}

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & { name: string; label: ReactNode; hint?: ReactNode; error?: string; wrapClassName?: string };
export function TextField({ label, hint, error, wrapClassName, id, className = "", ...input }: TextFieldProps) {
  const fid = id ?? `f-${input.name}`;
  return (
    <Field label={label} htmlFor={fid} hint={hint} error={error} className={wrapClassName}>
      <input id={fid} aria-invalid={error ? true : undefined} className={`input ${className}`} {...input} />
    </Field>
  );
}

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { name: string; label: ReactNode; hint?: ReactNode; error?: string; wrapClassName?: string };
export function TextArea({ label, hint, error, wrapClassName, id, className = "", rows = 4, ...input }: TextAreaProps) {
  const fid = id ?? `f-${input.name}`;
  return (
    <Field label={label} htmlFor={fid} hint={hint} error={error} className={wrapClassName}>
      <textarea id={fid} rows={rows} aria-invalid={error ? true : undefined} className={`input resize-y ${className}`} {...input} />
    </Field>
  );
}

/** Accessible switch built on a checkbox (submits "on" when checked, like any checkbox). */
export function Toggle({ label, description, className = "", ...input }: InputHTMLAttributes<HTMLInputElement> & { name: string; label: ReactNode; description?: ReactNode }) {
  return (
    <label className={`flex cursor-pointer items-start justify-between gap-4 ${className}`}>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{label}</span>
        {description && <span className="block text-xs text-muted">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0">
        <input type="checkbox" role="switch" className="peer sr-only" {...input} />
        <span aria-hidden className="h-6 w-11 rounded-full bg-line transition-colors peer-checked:bg-moss peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-signal peer-disabled:opacity-50" />
        <span aria-hidden className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

/** Two-column form group: title/description left on lg, fields right. */
export function FormSection({ title, description, children, className = "" }: { title: ReactNode; description?: ReactNode; children: ReactNode; className?: string }) {
  return (
    // Responsive to the space the card actually has (container queries), not the window: with the admin sidebar
    // and a preview column open, a wide window can still leave a narrow card. Title beside the fields from 42rem;
    // grids inside the fields column can use @sm:/@md: (the fields column is a container too).
    <section className={`@container py-6 first:pt-0 last:pb-0 ${className}`}>
      <div className="grid gap-4 @2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] @2xl:gap-8">
        <div className="min-w-0">
          <h2 className="font-display text-base font-bold">{title}</h2>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        <div className="@container min-w-0 space-y-4">{children}</div>
      </div>
    </section>
  );
}
