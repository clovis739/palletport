"use client";

import { Card } from "@/components/admin/Card";
import { FormSection } from "@/components/admin/FormField";
import { saveAbout } from "@/app/actions/site";
import { fillTokens, type AboutSettings } from "@/lib/settings-schema";
import { SettingsForm, type FormCtx } from "../_components/SettingsForm";
import { LinkEditor, MediaField, SortableList, Text } from "../_components/fields";

type F = FormCtx<AboutSettings>;
const cardName = (what: string) => (it: unknown, i: number) => (it as { title?: string }).title || `${what} ${i + 1}`;

/** Cards with title, text and a call-to-action link (advantages). */
function CtaCardRows({ f, path, what, max }: { f: F; path: string; what: string; max: number }) {
  return (
    <SortableList
      f={f}
      path={path}
      dense
      max={max}
      addLabel={`Add ${what}`}
      newItem={() => ({ title: "", text: "", href: "", cta: "" })}
      itemName={cardName(what)}
      render={(p) => (
        <div className="space-y-2">
          <Text f={f} path={`${p}.title`} label="Title" />
          <Text f={f} path={`${p}.text`} label="Text" rows={2} />
          <LinkEditor f={f} labelPath={`${p}.cta`} hrefPath={`${p}.href`} labelText="Link text" urlText="Link" compact />
        </div>
      )}
    />
  );
}

/** Cards whose title is also their link text (promises, thank-you cards). */
function CardLinkRows({ f, path, what, max }: { f: F; path: string; what: string; max: number }) {
  return (
    <SortableList
      f={f}
      path={path}
      dense
      max={max}
      addLabel={`Add ${what}`}
      newItem={() => ({ title: "", text: "", href: "" })}
      itemName={cardName(what)}
      render={(p) => (
        <div className="space-y-2">
          <div className="grid gap-2 sm:grid-cols-2">
            <Text f={f} path={`${p}.title`} label="Title" />
            <Text f={f} path={`${p}.href`} label="Link" placeholder="/page or https://…" />
          </div>
          <Text f={f} path={`${p}.text`} label="Text" rows={2} />
        </div>
      )}
    />
  );
}

export function AboutForm({ initial, storeName, storeLocation }: { initial: AboutSettings; storeName: string; storeLocation: string }) {
  return (
    <SettingsForm initial={initial} action={saveAbout}>
      {(f) => (
        <>
          <Card title="Hero">
            <FormSection title="Text" description="Use {name} and {location} in the intro to insert your business name and warehouse location.">
              <Text f={f} path="heroEyebrow" label="Eyebrow" max={60} />
              <Text f={f} path="heroTitle" label="Headline" rows={2} max={100} required />
              <Text f={f} path="heroIntro" label="Intro" rows={4} max={400} />
              {f.value.heroIntro.includes("{") && (
                <p className="rounded-lg bg-sand/60 p-3 text-xs text-ink/75">
                  <span className="font-semibold">Reads as: </span>
                  {fillTokens(f.value.heroIntro, { name: storeName, location: storeLocation })}
                </p>
              )}
            </FormSection>
            <FormSection title="Background photo" description="Full-width photo behind the hero text, darkened on the left so the text stays readable (like the homepage). Landscape, at least 1600 px wide. Your own warehouse photo works best.">
              <MediaField f={f} path="heroBg" label="Background photo" />
            </FormSection>
            <FormSection title="Numbers heading" description="Heading above the live stats cards.">
              <Text f={f} path="statsTitle" label="Heading" />
            </FormSection>
          </Card>

          <Card title="Mission">
            <FormSection title="Heading">
              <Text f={f} path="mission.eyebrow" label="Eyebrow" />
              <Text f={f} path="mission.title" label="Title" rows={2} />
            </FormSection>
            <FormSection title="Paragraphs">
              <SortableList
                f={f}
                path="mission.paragraphs"
                dense
                max={6}
                addLabel="Add paragraph"
                newItem={() => ""}
                itemName={(_, i) => `paragraph ${i + 1}`}
                render={(p, i) => <Text f={f} path={p} label={`Paragraph ${i + 1}`} rows={3} />}
              />
            </FormSection>
            <FormSection title="Link">
              <LinkEditor f={f} labelPath="mission.linkLabel" hrefPath="mission.linkHref" labelText="Link text" urlText="Link" />
            </FormSection>
          </Card>

          <Card title="Sustainability">
            <FormSection title="Text">
              <Text f={f} path="sustainability.eyebrow" label="Eyebrow" />
              <Text f={f} path="sustainability.title" label="Title" rows={2} />
              <Text f={f} path="sustainability.body" label="Body" rows={4} />
              <LinkEditor f={f} labelPath="sustainability.linkLabel" hrefPath="sustainability.linkHref" labelText="Link text" urlText="Link" />
            </FormSection>
            <FormSection title="Photo" description="16:10, shown beside the text. Leave empty for text only.">
              <MediaField f={f} path="sustainability.photo" label="Photo" />
            </FormSection>
          </Card>

          <Card title="Transparent buying" description="Dark band with up to four promise cards (icons are assigned in order).">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Text f={f} path="transparent.eyebrow" label="Eyebrow" />
                <Text f={f} path="transparent.title" label="Title" />
              </div>
              <CardLinkRows f={f} path="transparent.cards" what="card" max={8} />
            </div>
          </Card>

          <Card title="Who buys from us" description="The cards below this heading are your buying guides.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Text f={f} path="audiences.eyebrow" label="Eyebrow" />
              <Text f={f} path="audiences.title" label="Title" />
              <Text f={f} path="audiences.intro" label="Intro" rows={2} hint="Optional" className="sm:col-span-2" />
            </div>
          </Card>

          <Card title="Advantages" description="Three cards with a call to action each (icons are assigned in order).">
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Text f={f} path="advantages.eyebrow" label="Eyebrow" />
                <Text f={f} path="advantages.title" label="Title" />
              </div>
              <CtaCardRows f={f} path="advantages.cards" what="advantage" max={6} />
            </div>
          </Card>

          <Card title="Thank you">
            <div className="space-y-4">
              <Text f={f} path="thanks.title" label="Title" />
              <Text f={f} path="thanks.body" label="Text" rows={3} />
              <CardLinkRows f={f} path="thanks.cards" what="card" max={6} />
            </div>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
