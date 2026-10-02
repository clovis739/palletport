"use client";

import { Card } from "@/components/admin/Card";
import { Field, FormSection } from "@/components/admin/FormField";
import { Select } from "@/components/ui/Select";
import { saveCheckout } from "@/app/actions/site";
import { BUILTIN_PAYMENT_IDS, PAYMENT_ICONS, type CheckoutSettings, type PaymentIcon } from "@/lib/settings-schema";
import { PaymentMethodIcon, PAYMENT_ICON_LABEL } from "@/components/checkout/PaymentMethodIcon";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { MediaField, SortableList, Switch, Text, getPath, setPath } from "../_components/fields";

type F = FormCtx<CheckoutSettings>;

const BUILTIN_NOTE: Record<string, string> = {
  CARD: "Built-in: shows the card step. Turn it off if you don't take cards.",
  WIRE: "Built-in: bank transfer. Orders stay Pending until you mark them paid.",
  NET30: "Built-in: only buyers with an approved resale certificate can choose it.",
};

function FieldRow({ f, path, title }: { f: F; path: "fields.phone" | "fields.poNumber" | "fields.notes"; title: string }) {
  const shown = !!getPath(f.value, `${path}.show`);
  return (
    <FormSection title={title}>
      <Switch f={f} path={`${path}.show`} label="Show this field" />
      {shown && (
        <>
          <Switch f={f} path={`${path}.required`} label="Required" description="Buyers can't place the order without it." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Text f={f} path={`${path}.label`} label="Label" max={80} required />
            <Text f={f} path={`${path}.placeholder`} label="Placeholder" max={120} hint="Optional hint inside the box." />
          </div>
        </>
      )}
    </FormSection>
  );
}

function IconPicker({ f, path, id }: { f: F; path: string; id: string }) {
  const v = (getPath(f.value, path) as PaymentIcon) ?? "card";
  return (
    <Field label="Icon" htmlFor={id} hint="Used when no logo is uploaded.">
      <Select id={id} value={v} onChange={(e) => f.update((d) => setPath(d, path, e.target.value))}>
        {PAYMENT_ICONS.map((k) => <option key={k} value={k}>{PAYMENT_ICON_LABEL[k]}</option>)}
      </Select>
    </Field>
  );
}

export function CheckoutSettingsForm({ initial }: { initial: CheckoutSettings }) {
  return (
    <SettingsForm initial={initial} action={saveCheckout}>
      {(f) => (
        <>
          <Card title="Payment methods" description="Buyers pick one from a dropdown at checkout, in this order. Drag to reorder, switch off to hide, or add your own.">
            <div className="space-y-4">
              <Text f={f} path="paymentTitle" label="Step heading" max={40} required />
              {f.err("paymentMethods") && <p className="rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust">{f.err("paymentMethods")}</p>}
              <SortableList
                f={f}
                path="paymentMethods"
                max={12}
                addLabel="Add payment method"
                newItem={() => ({ id: "", enabled: true, name: "", description: "", instructions: "", icon: "wallet", logo: "" })}
                itemName={(it, i) => (it as { name?: string }).name || `method ${i + 1}`}
                rowKey={(_, i) => `pm-${i}`}
                render={(p, i) => {
                  const m = f.value.paymentMethods[i];
                  const builtin = (BUILTIN_PAYMENT_IDS as readonly string[]).includes(m?.id ?? "");
                  return (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <PaymentMethodIcon icon={m?.icon ?? "card"} logo={m?.logo} />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-semibold">{m?.name || "New payment method"}</p>
                          <p className="text-xs text-muted">{builtin ? BUILTIN_NOTE[m!.id] : "Manual payment: the order stays Pending until you mark it paid."}</p>
                        </div>
                      </div>
                      <Switch f={f} path={`${p}.enabled`} label="Show at checkout" />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Text f={f} path={`${p}.name`} label="Name" max={40} required placeholder="e.g. Cash App" />
                        {builtin ? (
                          <Field label="Code" htmlFor={`pm-code-${i}`} hint="Built-in code (can't be changed).">
                            <input id={`pm-code-${i}`} className="input bg-sand/50" value={m?.id} readOnly />
                          </Field>
                        ) : (
                          <Text f={f} path={`${p}.id`} label="Code" max={24} required placeholder="CASH_APP" hint="Saved on each order. Capital letters, digits and _." />
                        )}
                      </div>
                      <Text f={f} path={`${p}.description`} label="Short note in the dropdown" max={120} />
                      <Text f={f} path={`${p}.instructions`} label="Payment instructions" rows={3} max={600} hint="Shown on the order page and in the confirmation email while the order is unpaid: where to send the money and what to include." />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <IconPicker f={f} path={`${p}.icon`} id={`pm-icon-${i}`} />
                        <MediaField f={f} path={`${p}.logo`} label="Logo (optional)" allowStock={false} hint="Upload the provider's official logo from their brand/press page. Square or wide, transparent PNG or SVG." />
                      </div>
                    </div>
                  );
                }}
              />
              <p className="rounded-lg bg-sand/60 p-3 text-xs text-ink/75">
                Gift cards can&apos;t be added as a payment method. Asking buyers to pay with gift cards is the best-known sign of a scam,
                buyers get no protection, and Google and card networks treat it as a fraud signal.
              </p>
            </div>
          </Card>

          <Card title="Checkout fields" description="The delivery address fields are always required (we need them to ship and price freight).">
            <FieldRow f={f} path="fields.phone" title="Delivery contact phone" />
            <FieldRow f={f} path="fields.poNumber" title="PO number" />
            <FieldRow f={f} path="fields.notes" title="Notes for our team / carrier" />
          </Card>

          <Card title="Extra fields" description="Your own questions, e.g. “Resale certificate number” or “How did you hear about us?”. Answers are saved in the order notes.">
            <SortableList
              f={f}
              path="customFields"
              max={6}
              addLabel="Add field"
              newItem={() => ({ id: `field_${Math.random().toString(36).slice(2, 8)}`, label: "", type: "text", required: false, placeholder: "" })}
              itemName={(it, i) => (it as { label?: string }).label || `field ${i + 1}`}
              empty={<p className="text-sm text-muted">No extra fields yet.</p>}
              render={(p, i) => (
                <div className="space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Text f={f} path={`${p}.label`} label="Label" max={80} required />
                    <Field label="Type" htmlFor={`cf-type-${i}`}>
                      <Select id={`cf-type-${i}`} value={f.value.customFields[i]?.type ?? "text"} onChange={(e) => f.update((d) => setPath(d, `${p}.type`, e.target.value))}>
                        <option value="text">Short answer</option>
                        <option value="textarea">Long answer</option>
                      </Select>
                    </Field>
                  </div>
                  <Text f={f} path={`${p}.placeholder`} label="Placeholder" max={120} />
                  <Switch f={f} path={`${p}.required`} label="Required" />
                </div>
              )}
            />
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
