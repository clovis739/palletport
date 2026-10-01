"use client";

import { useState } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { Field, FormSection } from "@/components/admin/FormField";
import { Select } from "@/components/ui/Select";
import { AnnouncementBar } from "@/components/AnnouncementBar";
import { saveAnnouncement } from "@/app/actions/site";
import type { AnnouncementSettings } from "@/lib/settings-schema";
import { SettingsForm } from "../_components/SettingsForm";
import { LinkEditor, Switch, Text } from "../_components/fields";

const TONE_HELP: Record<AnnouncementSettings["tone"], string> = {
  info: "Navy — everyday news (default).",
  promo: "Orange — sales and offers.",
  warning: "Amber — closures, delays, important notices.",
};

function Preview({ a }: { a: AnnouncementSettings }) {
  const [device, setDevice] = useState<"desktop" | "phone">("desktop");
  const shown = { ...a, enabled: true, text: a.text || "Your announcement text" };
  return (
    <Card
      title="Live preview"
      padded={false}
      actions={
        <div role="group" aria-label="Preview size" className="inline-flex rounded-full p-0.5">
          {(["desktop", "phone"] as const).map((d) => (
            <button key={d} type="button" aria-pressed={device === d} onClick={() => setDevice(d)} className={`grid h-8 w-8 place-items-center rounded-full ${device === d ? "bg-ink text-white" : "text-muted hover:text-ink"}`} aria-label={d === "desktop" ? "Desktop" : "Phone"}>
              {d === "desktop" ? <Monitor aria-hidden className="h-4 w-4" /> : <Smartphone aria-hidden className="h-4 w-4" />}
            </button>
          ))}
        </div>
      }
    >
      <div className="bg-sand/40 p-3 sm:p-4">
        <div className={`mx-auto overflow-hidden rounded-xl bg-paper ${device ==="phone"?"max-w-[360px]":""}`}>
          {/* The bar picks its phone/desktop text by viewport width, so the phone frame shows the short text explicitly. */}
          <AnnouncementBar preview settings={device === "phone" ? { ...shown, text: shown.mobileText || shown.text, href: undefined } : { ...shown, mobileText: shown.text }} />
          <div className="flex h-10 items-center gap-2 px-3">
            <span className="h-3 w-16 rounded bg-ink/80" />
            <span className="ml-auto h-3 w-24 rounded bg-line" />
          </div>
          <div className="space-y-2 p-3">
            <span className="block h-3 w-3/4 rounded bg-line" />
            <span className="block h-3 w-1/2 rounded bg-line" />
          </div>
        </div>
        {!a.enabled && <p className="mt-3 text-center text-xs font-semibold text-rust">The bar is turned off — visitors won’t see it.</p>}
      </div>
    </Card>
  );
}

export function AnnouncementForm({ initial }: { initial: AnnouncementSettings }) {
  return (
    <SettingsForm initial={initial} action={saveAnnouncement} aside={(v) => <Preview a={v} />}>
      {(f) => (
        <Card>
          <FormSection title="Visibility">
            <Switch f={f} path="enabled" label="Show the announcement bar" description="On every storefront page, above the header." />
          </FormSection>
          <FormSection title="Message" description="Keep it short. The phone version is used on small screens.">
            <Text f={f} path="text" label="Text" max={160} ideal={[20, 100]} placeholder="Fixed prices on every lot · Free freight on orders over $7,500" />
            <Text f={f} path="mobileText" label="Shorter text for phones" max={70} hint="Optional. Falls back to the text above." />
          </FormSection>
          <FormSection title="Link" description="Optional. Shown next to the text on tablets and desktops.">
            <LinkEditor f={f} labelPath="linkLabel" hrefPath="href" labelText="Link label" urlText="Link URL" />
          </FormSection>
          <FormSection title="Colour">
            <Field label="Tone" htmlFor="announcement-tone" hint={TONE_HELP[f.value.tone]}>
              <Select id="announcement-tone" value={f.value.tone} onChange={(e) => f.update((d) => void (d.tone = e.target.value as AnnouncementSettings["tone"]))}>
                <option value="info">Info (navy)</option>
                <option value="promo">Promo (orange)</option>
                <option value="warning">Warning (amber)</option>
              </Select>
            </Field>
          </FormSection>
        </Card>
      )}
    </SettingsForm>
  );
}
