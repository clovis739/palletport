"use client";

import { Card } from "@/components/admin/Card";
import { FormSection } from "@/components/admin/FormField";
import { Logo } from "@/components/Logo";
import { ContactDetails, SocialLinks } from "@/components/ContactDetails";
import { saveBusiness } from "@/app/actions/site";
import type { BusinessSettings } from "@/lib/settings-schema";
import { SettingsForm } from "../_components/SettingsForm";
import { SortableList, Text } from "../_components/fields";

type Value = BusinessSettings & { storeLocation: string };

function Preview({ b }: { b: Value }) {
  return (
    <>
      <div>
        <p className="label">Footer preview</p>
        <div className="overflow-hidden rounded-2xl bg-ink p-4 text-white/80" aria-label="Footer preview">
          <Logo className="text-white" />
          <div className="mt-3 space-y-3">
            <ContactDetails business={b} tone="dark" className="text-white/70" />
            <SocialLinks links={b.socialLinks.filter((l) => l.label && l.href)} tone="dark" />
            {!b.email && !b.salesEmail && !b.phone && !b.whatsapp && !b.addressStreet && <p className="text-xs text-white/50">Add an email, phone or street address to show contact details in the footer.</p>}
          </div>
          <p className="mt-4 pt-3 text-xs text-white/50">© {new Date().getFullYear()} {b.name || "Your business"}. All rights reserved.</p>
        </div>
      </div>
      <div>
        <p className="label">Contact page preview</p>
        <div className="card space-y-3 p-4 text-sm">
          {b.pickupNote && <p><span className="font-semibold">Warehouse pickup:</span> {b.pickupNote}</p>}
          {b.hours && <p><span className="font-semibold">Hours:</span> {b.hours}</p>}
          <ContactDetails business={b} showHours={false} />
          <SocialLinks links={b.socialLinks.filter((l) => l.label && l.href)} />
        </div>
      </div>
    </>
  );
}

export function BusinessForm({ initial }: { initial: Value }) {
  return (
    <SettingsForm initial={initial} action={saveBusiness} aside={(v) => <Preview b={v} />}>
      {(f) => (
        <Card>
          <FormSection title="Business" description="Your trading name and one-line description. The name and location are also used on lots, the About page and checkout.">
            <Text f={f} path="name" label="Business name" required autoComplete="organization" />
            <Text f={f} path="tagline" label="Tagline" max={160} hint="One sentence about what you sell." />
            <div>
              <Text f={f} path="storeLocation" label="Warehouse location" required hint='Shown as "Warehouse in …", e.g. Columbus, OH.' />
              {f.value.addressCity && (
                <button
                  type="button"
                  className="mt-1 text-xs font-semibold text-signal-dark hover:underline"
                  onClick={() => f.update((d) => void (d.storeLocation = [d.addressCity, d.addressRegion].filter(Boolean).join(", ")))}
                >
                  Use city &amp; region from the address
                </button>
              )}
            </div>
          </FormSection>

          <FormSection title="Contact" description="Leave a field empty to hide it. Phone numbers: include the country code if you sell abroad.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Text f={f} path="email" type="email" label="Support email" placeholder="help@example.com" autoComplete="email" />
              <Text f={f} path="salesEmail" type="email" label="Sales email" placeholder="sales@example.com" hint="For bulk and truckload enquiries." />
              <Text f={f} path="phone" type="tel" label="Phone" placeholder="+1 614 555 0100" autoComplete="tel" />
              <Text f={f} path="whatsapp" type="tel" label="WhatsApp" placeholder="+1 614 555 0100" hint="Include the country code. Shows the floating “Chat on WhatsApp” button on every page (leave empty to hide it)." />
            </div>
          </FormSection>

          <FormSection title="Warehouse address" description="The street address is only shown when you fill it in. Pickup stays by appointment.">
            <Text f={f} path="addressStreet" label="Street" autoComplete="street-address" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Text f={f} path="addressCity" label="City" autoComplete="address-level2" />
              <Text f={f} path="addressRegion" label="State / region" autoComplete="address-level1" />
              <Text f={f} path="addressPostal" label="ZIP / postal code" autoComplete="postal-code" />
              <Text f={f} path="country" label="Country" hint="Two-letter code, e.g. US" autoComplete="country" />
            </div>
          </FormSection>

          <FormSection title="Hours & pickup" description="Shown on the Contact page.">
            <Text f={f} path="hours" label="Opening hours" placeholder="Monday–Friday, 8am–6pm ET" />
            <Text f={f} path="pickupNote" label="Pickup note" rows={3} max={300} hint="Explain how warehouse pickup appointments work." />
          </FormSection>

          <FormSection title="Google Business Profile" description="Shows your Google rating and reviews, the map on the Contact page and a 'Write a review' button. Leave empty to hide them.">
            <Text f={f} path="googlePlaceId" label="Google Place ID" placeholder="ChIJ…" hint="Find it with Google's Place ID Finder (search “Place ID finder”), then paste it here." />
            <Text f={f} path="googleMapsUrl" label="Google profile link" placeholder="https://maps.app.goo.gl/…" hint="In Google Maps, open your business → Share → Copy link." />
          </FormSection>

          <FormSection title="Social links" description="Profiles you want customers to find. Links must start with https://.">
            <SortableList
              f={f}
              path="socialLinks"
              dense
              max={12}
              addLabel="Add social link"
              newItem={() => ({ label: "", href: "https://" })}
              itemName={(it, i) => (it as { label: string }).label || `social link ${i + 1}`}
              empty={<p className="text-sm text-muted">No social links yet.</p>}
              render={(p) => (
                <div className="grid gap-3 sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)]">
                  <Text f={f} path={`${p}.label`} label="Label" placeholder="Facebook" />
                  <Text f={f} path={`${p}.href`} type="url" label="URL" placeholder="https://facebook.com/…" />
                </div>
              )}
            />
          </FormSection>
        </Card>
      )}
    </SettingsForm>
  );
}
