"use client";

import Link from "next/link";
import { Card } from "@/components/admin/Card";
import { FormSection } from "@/components/admin/FormField";
import { saveContact } from "@/app/actions/site";
import { fillTokens, type ContactSettings } from "@/lib/settings-schema";
import { SettingsForm } from "../_components/SettingsForm";
import { LinkEditor, SortableList, Switch, Text } from "../_components/fields";

export function ContactForm({ initial, storeName, storeLocation }: { initial: ContactSettings; storeName: string; storeLocation: string }) {
  return (
    <SettingsForm initial={initial} action={saveContact}>
      {(f) => (
        <>
          <Card title="Top of the page">
            <FormSection title="Heading" description="Use {name} and {location} in the intro to insert your business name and warehouse location.">
              <Text f={f} path="title" label="Heading" max={60} required />
              <Text f={f} path="intro" label="Intro" rows={3} max={300} />
              {f.value.intro.includes("{") && (
                <p className="rounded-lg bg-sand/60 p-3 text-xs text-ink/75">
                  <span className="font-semibold">Reads as: </span>
                  {fillTokens(f.value.intro, { name: storeName, location: storeLocation })}
                </p>
              )}
            </FormSection>
            <FormSection title="Search results" description="The page title in the browser tab and on Google, and the snippet under it.">
              <Text f={f} path="seoTitle" label="Page title" max={70} ideal={[30, 60]} required />
              <Text f={f} path="seoDescription" label="Description" rows={3} max={200} ideal={[120, 160]} />
            </FormSection>
          </Card>

          <Card title="Help notes" description="The first box under the intro. Each note shows its label in bold, then the text and an optional link.">
            <div className="space-y-4">
              <SortableList
                f={f}
                path="tips"
                dense
                max={8}
                addLabel="Add note"
                newItem={() => ({ label: "", text: "", linkLabel: "", href: "" })}
                itemName={(it, i) => (it as { label?: string }).label || `note ${i + 1}`}
                render={(p) => (
                  <div className="space-y-2">
                    <Text f={f} path={`${p}.label`} label="Label (bold)" placeholder="Order issue?" />
                    <Text f={f} path={`${p}.text`} label="Text" rows={2} />
                    <LinkEditor f={f} labelPath={`${p}.linkLabel`} hrefPath={`${p}.href`} labelText="Link text (optional)" urlText="Link" compact />
                  </div>
                )}
              />
              <Switch f={f} path="showPickup" label="Show the warehouse pickup note" description={<>Uses the pickup note from the <Link href="/dashboard/site/business" className="font-semibold underline">Business profile</Link>.</>} />
              <Switch f={f} path="showHours" label="Show opening hours" description="Uses the hours from the Business profile." />
            </div>
          </Card>

          <Card title="Contact details box">
            <FormSection title="Heading" description="The box with your email, phone, WhatsApp, address and social links (edit those in the Business profile).">
              <Text f={f} path="directTitle" label="Heading" max={60} />
            </FormSection>
          </Card>

          <Card title="Message form">
            <FormSection title="Labels">
              <Text f={f} path="formTitle" label="Form heading" max={60} hint="Optional. Shown above the form." />
              <Text f={f} path="bodyLabel" label="Message box label" max={60} required />
              <Text f={f} path="submitLabel" label="Button text" max={40} required />
            </FormSection>
            <FormSection title="Pickup requests" description="Used when a buyer arrives from a “Book a pickup” link (/contact?topic=pickup).">
              <Text f={f} path="pickupNotice" label="Message above the form" rows={3} max={300} />
              <Text f={f} path="pickupSubmitLabel" label="Button text" max={40} required />
            </FormSection>
          </Card>

          <Card title="Lower sections">
            <FormSection title="Warehouse photos" description="Shown only when you have added photos in the Business profile.">
              <Text f={f} path="photosTitle" label="Heading" max={60} />
            </FormSection>
            <FormSection title="Map">
              <Switch f={f} path="showMap" label="Show the map and directions" />
              <Text f={f} path="mapTitle" label="Heading" max={60} />
              <Text f={f} path="mapNote" label="Note under the heading" rows={2} max={200} hint="Shown when you have a pickup note." />
            </FormSection>
            <FormSection title="Google reviews" description="Shown once your Google Business Profile is linked in the Business profile.">
              <Switch f={f} path="showReviews" label="Show Google reviews" />
              <Text f={f} path="reviewsTitle" label="Heading" max={60} />
            </FormSection>
          </Card>
        </>
      )}
    </SettingsForm>
  );
}
