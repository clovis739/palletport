"use client";

import { ArrowUpRight, Boxes, MessageCircle } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { Field, FormSection } from "@/components/admin/FormField";
import { Select } from "@/components/ui/Select";
import { saveWhatsAppGroups } from "@/app/actions/site";
import { WA_GROUP_ICONS, whatsappLinkFrom, type WhatsAppGroupsSettings } from "@/lib/settings-schema";
import { WA_ICONS } from "@/components/WhatsAppGroups";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { SortableList, Switch, Text, getPath, setPath } from "../_components/fields";

type F = FormCtx<WhatsAppGroupsSettings>;

const ICON_LABEL: Record<(typeof WA_GROUP_ICONS)[number], string> = {
  fashion: "Clothing",
  general: "Boxes / everything",
  electronics: "Electronics",
  home: "Home & furniture",
  tools: "Tools",
  toys: "Toys",
  star: "Star / VIP",
};

const VALID = /^https:\/\/(chat\.whatsapp\.com\/[A-Za-z0-9]+|(www\.)?whatsapp\.com\/channel\/[A-Za-z0-9]+)$/i;

/** Invite link box: accepts the bare link or WhatsApp's whole share message and keeps only the link. */
function LinkField({ f, path, i }: { f: F; path: string; i: number }) {
  const v = String(getPath(f.value, path) ?? "");
  const ok = VALID.test(v);
  return (
    <Field
      label={<>Invite link <span className="text-rust" aria-hidden>*</span></>}
      htmlFor={`wa-link-${i}`}
      error={f.err(path)}
      hint={
        v && !ok ? (
          <span className="text-rust">This doesn&apos;t look like a WhatsApp group link yet.</span>
        ) : ok ? (
          <a href={v} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-signal-dark hover:underline">
            Test this link <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        ) : (
          "In WhatsApp: open the group → Group info → Invite via link → Copy link. Paste the link or the whole message."
        )
      }
    >
      <input
        id={`wa-link-${i}`}
        className="input"
        inputMode="url"
        autoComplete="off"
        placeholder="https://chat.whatsapp.com/…"
        value={v}
        onChange={(e) => f.update((d) => setPath(d, path, e.target.value))}
        onPaste={(e) => {
          const text = e.clipboardData.getData("text");
          const link = whatsappLinkFrom(text);
          if (link !== text.trim()) {
            e.preventDefault();
            f.update((d) => setPath(d, path, link));
          }
        }}
        onBlur={() => f.update((d) => setPath(d, path, whatsappLinkFrom(v)))}
      />
    </Field>
  );
}

function Preview({ w }: { w: WhatsAppGroupsSettings }) {
  return (
    <div className="space-y-4">
      <div>
        <p className="label">Bar above the header</p>
        <div className="flex items-center justify-center gap-2 rounded-xl bg-ink px-3 py-2 text-xs text-white">
          <span aria-hidden className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#25D366]"><MessageCircle className="h-3 w-3" /></span>
          <span className="min-w-0 truncate"><strong>{w.barText || "…"}</strong>{w.barSubtext && <span className="text-white/70"> · {w.barSubtext}</span>}</span>
          <span className="rounded-full bg-signal px-2.5 py-1 font-semibold">Join</span>
        </div>
      </div>
      <div>
        <p className="label">Popup</p>
        <div className="rounded-2xl bg-white p-4 ring-1 ring-line">
          <p className="font-display text-lg font-bold leading-tight">{w.title || "…"}</p>
          {w.description && <p className="mt-1 text-xs text-ink/75">{w.description}</p>}
          <ul className="mt-3 space-y-2">
            {w.groups.map((g, i) => {
              const Icon = WA_ICONS[g.icon] ?? Boxes;
              return (
                <li key={i} className="flex items-center gap-2 rounded-lg bg-sand p-2">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white"><Icon aria-hidden className="h-4 w-4" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold">{g.title || "Group name"}</span>
                    {g.subtitle && <span className="block truncate text-xs text-muted">{g.subtitle}</span>}
                  </span>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${VALID.test(g.href) ? "bg-signal" : "bg-rust"}`}>{VALID.test(g.href) ? "Join" : "Link?"}</span>
                </li>
              );
            })}
          </ul>
        </div>
        {!w.enabled && <p className="mt-2 text-center text-xs font-semibold text-rust">Turned off: visitors don&apos;t see the popup or the bar.</p>}
      </div>
    </div>
  );
}

export function WhatsAppGroupsForm({ initial }: { initial: WhatsAppGroupsSettings }) {
  return (
    <SettingsForm initial={initial} action={saveWhatsAppGroups} aside={(v) => <Preview w={v} />}>
      {(f) => (
        <>
          <Card title="Groups" description="Each group gets a Join button in the popup. Drag to reorder.">
            {f.err("groups") && <p className="mb-3 rounded-lg bg-rust/10 p-3 text-sm font-medium text-rust">{f.err("groups")}</p>}
            <SortableList
              f={f}
              path="groups"
              max={6}
              addLabel="Add group"
              newItem={() => ({ title: "", subtitle: "", href: "", icon: "general" })}
              itemName={(it, i) => (it as { title?: string }).title || `group ${i + 1}`}
              empty={<p className="text-sm text-muted">No groups yet. Add one and paste its invite link.</p>}
              render={(p, i) => (
                <div className="space-y-3">
                  <LinkField f={f} path={`${p}.href`} i={i} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Text f={f} path={`${p}.title`} label="Group name" max={40} required placeholder="Clothing & Shoes" />
                    <Field label="Icon" htmlFor={`wa-icon-${i}`}>
                      <Select id={`wa-icon-${i}`} value={f.value.groups[i]?.icon ?? "general"} onChange={(e) => f.update((d) => setPath(d, `${p}.icon`, e.target.value))}>
                        {WA_GROUP_ICONS.map((k) => <option key={k} value={k}>{ICON_LABEL[k]}</option>)}
                      </Select>
                    </Field>
                  </div>
                  <Text f={f} path={`${p}.subtitle`} label="Short description" max={70} placeholder="Apparel, footwear and fashion deals" />
                </div>
              )}
            />
          </Card>

          <Card>
            <FormSection title="Visibility">
              <Switch f={f} path="enabled" label="Show WhatsApp groups on the site" description="The popup and the Join bar on every storefront page." />
              <Switch f={f} path="autoOpen" label="Open the popup automatically for new visitors" description="Off: only the Join bar shows, and the popup opens when someone clicks Join." />
              <Field label="Open after (seconds)" htmlFor="wa-delay" error={f.err("delaySeconds")} hint="How long a first-time visitor is on the page before the popup opens.">
                <input
                  id="wa-delay"
                  type="number"
                  min={0}
                  max={120}
                  className="input w-28"
                  value={f.value.delaySeconds}
                  onChange={(e) => f.update((d) => void (d.delaySeconds = Math.max(0, Math.min(120, Math.round(Number(e.target.value) || 0)))))}
                />
              </Field>
            </FormSection>
            <FormSection title="Popup wording">
              <Text f={f} path="title" label="Heading" max={60} required />
              <Text f={f} path="description" label="Text under the heading" rows={3} max={240} />
            </FormSection>
            <FormSection title="Bar above the header" description="Shown after a visitor closes the popup (or always, when the popup doesn't open by itself).">
              <Text f={f} path="barText" label="Bar text" max={50} required />
              <Text f={f} path="barSubtext" label="Extra text (wider screens)" max={60} />
            </FormSection>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
