"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ExternalLink, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/admin/Card";
import { FormSection, Toggle } from "@/components/admin/FormField";
import { Badge } from "@/components/admin/Badge";
import { saveHome } from "@/app/actions/site";
import type { HomeSectionKey, HomeSettings } from "@/lib/settings-schema";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { LinkEditor, MediaField, SortableList, Switch, Text } from "../_components/fields";

type F = FormCtx<HomeSettings>;

const SECTION_INFO: Record<HomeSectionKey, { name: string; note: string; subtitle?: string }> = {
  closingSoon: { name: "Recently added", note: "In-stock lots, newest first, 8 per page with page numbers." },
  lotSizes: { name: "Lot sizes", note: "Case packs, pallets and truckloads with live counts." },
  categories: { name: "Categories", note: "Every catalog category with its lot count." },
  buyNow: { name: "Best value", note: "In-stock lots with the lowest price against retail (not already shown as featured)." },
  howItWorks: { name: "How buying works", note: "Dark band with numbered steps and a button." },
  conditions: { name: "Conditions", note: "The five condition grades." },
  collections: { name: "Collections", note: "Four collection tiles. Sits together with the guides row when it comes right before it." },
  guides: { name: "Buying guides row", note: "Links to every buying guide. The heading is the label before the links.", subtitle: "Small note under the links" },
  recentlySold: { name: "Recently sold", note: "The latest sold-out lots. Shares a row with the About and Contact cards when they are next to it." },
  aboutCard: { name: "About card", note: "Store name and warehouse location. The heading is the small label; the subtitle replaces your store bio.", subtitle: "Text (default: your store bio)" },
  contactCard: { name: "Contact card", note: "Invites buyers to tell you what they need." },
  blog: { name: "Blog teaser", note: "The three newest blog posts." },
};

function SectionRow({ f, i }: { f: F; i: number }) {
  const key = (f.value.order ?? [])[i];
  const info = SECTION_INFO[key];
  const s = f.value.sections[key];
  const base = `sections.${key}`;
  const [open, setOpen] = useState(f.hasErr(base));
  return (
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <ChevronDown aria-hidden className={`h-4 w-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`} />
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2 font-semibold">
              {info.name}
              {s.enabled ? <Badge tone="moss"><Eye aria-hidden className="h-3 w-3" /> Shown</Badge> : <Badge tone="muted"><EyeOff aria-hidden className="h-3 w-3" /> Hidden</Badge>}
            </span>
            <span className="block truncate text-xs text-muted">{s.title || info.note}</span>
          </span>
        </button>
        <Toggle name={`${base}.enabled`} label={<span className="sr-only">Show {info.name}</span>} checked={s.enabled} onChange={(e) => f.update((d) => void (d.sections[key].enabled = e.target.checked))} />
      </div>
      {open && (
        <div className="mt-3 space-y-3 pt-3">
          <p className="text-xs text-muted">{info.note}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <Text f={f} path={`${base}.title`} label={key === "aboutCard" ? "Label" : "Heading"} />
            <Text f={f} path={`${base}.subtitle`} label={info.subtitle ?? "Subheading"} hint="Optional" />
          </div>
          {key === "howItWorks" && (
            <div className="space-y-3 rounded-xl bg-sand/50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted">Steps</p>
              <SortableList
                f={f}
                path="howItWorksSteps"
                dense
                max={6}
                addLabel="Add step"
                newItem={() => ({ title: "", text: "" })}
                itemName={(it, j) => (it as { title?: string }).title || `step ${j + 1}`}
                render={(p) => (
                  <div className="space-y-2">
                    <Text f={f} path={`${p}.title`} label="Step title" />
                    <Text f={f} path={`${p}.text`} label="Step text" rows={2} />
                  </div>
                )}
              />
              <p className="pt-2 text-xs font-semibold uppercase tracking-wider text-muted">Button</p>
              <LinkEditor f={f} path="howItWorksCta" labelText="Button label" urlText="Button link" compact />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function HomeForm({ initial }: { initial: HomeSettings }) {
  return (
    <SettingsForm initial={initial} action={saveHome}>
      {(f) => (
        <>
          <Card
            title="Hero"
            description="The first thing visitors see: photo, headline and the big search box."
            actions={
              <Link href="/" target="_blank" rel="noopener" className="btn-ghost py-2">
                <ExternalLink aria-hidden className="h-4 w-4" /> Preview homepage
              </Link>
            }
          >
            <FormSection title="Text">
              <Text f={f} path="heroEyebrow" label="Eyebrow" max={80} hint="Small orange line above the headline." />
              <Text f={f} path="heroTitle" label="Headline" rows={2} max={110} ideal={[30, 80]} required />
              <Text f={f} path="heroSubtitle" label="Subheading" rows={2} max={220} />
              <Text f={f} path="heroSearchPlaceholder" label="Search box placeholder" max={80} />
            </FormSection>
            <FormSection title="Photo" description="Shown behind the hero text with a dark overlay, so busy photos work too. Wide images (16:9) look best.">
              <MediaField f={f} path="heroPhoto" label="Hero photo" hint="Leave empty for a plain navy background." />
            </FormSection>
            <FormSection title="Quick links" description="Buttons under the search box.">
              <SortableList f={f} path="heroLinks" dense max={8} addLabel="Add quick link" newItem={() => ({ label: "", href: "" })} itemName={(it, i) => (it as { label?: string }).label || `quick link ${i + 1}`} render={(p) => <LinkEditor f={f} path={p} compact />} />
            </FormSection>
          </Card>

          <Card title="Stats strip" description="Live numbers under the hero.">
            <div className="space-y-4">
              <Switch f={f} path="stats.enabled" label="Show the stats strip" />
              {f.value.stats.enabled && (
                <div className="grid gap-4 rounded-xl bg-sand/40 p-4 sm:grid-cols-2">
                  <Switch f={f} path="stats.liveAuctions" label="Lots in stock" description="Count of lots on sale." />
                  <Switch f={f} path="stats.endingHour" label="New this week" description="Lots listed in the last 7 days." />
                  <Switch f={f} path="stats.retailValue" label="Retail value listed" />
                  <Switch f={f} path="stats.typicalPrice" label="Typical price" description="Your own figure, below." />
                  {f.value.stats.typicalPrice && (
                    <>
                      <Text f={f} path="stats.typicalPriceValue" label="Figure" placeholder="10–35%" />
                      <Text f={f} path="stats.typicalPriceLabel" label="Caption" placeholder="typical price vs. retail" />
                    </>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Card title="Sections" description="Show or hide each section, rename it, and drag (or use the arrows) to change the order. Open a row to edit its heading.">
            <SortableList f={f} path="order" dense removable={false} rowKey={(k) => String(k)} itemName={(k) => SECTION_INFO[k as HomeSectionKey]?.name ?? String(k)} render={(_, i) => <SectionRow f={f} i={i} />} />
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
