import { Clock, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import type { BusinessSettings } from "@/lib/settings-schema";

/**
 * Business contact details (email, phone, WhatsApp, street address, hours) as a definition-style list.
 * Pure component (no hooks, no server imports): used by the Footer, the Contact page and the admin preview.
 * Renders nothing when there is nothing to contact.
 */
type B = Pick<BusinessSettings, "email" | "salesEmail" | "phone" | "whatsapp" | "addressStreet" | "addressCity" | "addressRegion" | "addressPostal" | "country" | "hours">;

/** "1150 Corrugated Way, Columbus, OH 43201". `full` adds the country too ("…, USA"); otherwise it is only shown outside the US. */
export function formatAddress(b: Pick<B, "addressStreet" | "addressCity" | "addressRegion" | "addressPostal" | "country">, full = false) {
  const cityLine = [[b.addressCity, b.addressRegion].filter(Boolean).join(", "), b.addressPostal].filter(Boolean).join(" ");
  const code = (b.country || "").trim().toUpperCase();
  const country = !code ? "" : ["US", "USA"].includes(code) ? (full ? "USA" : "") : b.country;
  return [b.addressStreet, cityLine, country].filter(Boolean).join(", ");
}

export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;
export const whatsappHref = (phone: string) => `https://wa.me/${phone.replace(/\D/g, "")}`;

/** True when the business has published any way to reach it directly (not just the contact form). */
export function hasDirectContact(b: Pick<B, "email" | "salesEmail" | "phone" | "whatsapp" | "addressStreet">) {
  return !!(b.email || b.salesEmail || b.phone || b.whatsapp || b.addressStreet);
}

export function ContactDetails({ business: b, tone = "light", showHours = true, fullAddress = false, className = "" }: { business: B; tone?: "light" | "dark"; showHours?: boolean; /** Include the country (e.g. "USA") in the address. */ fullAddress?: boolean; className?: string }) {
  const rows: { icon: typeof Mail; label: string; value: string; href?: string }[] = [];
  if (b.email) rows.push({ icon: Mail, label: "Email", value: b.email, href: `mailto:${b.email}` });
  if (b.salesEmail) rows.push({ icon: Mail, label: "Sales", value: b.salesEmail, href: `mailto:${b.salesEmail}` });
  if (b.phone) rows.push({ icon: Phone, label: "Phone", value: b.phone, href: telHref(b.phone) });
  if (b.whatsapp) rows.push({ icon: MessageCircle, label: "WhatsApp", value: b.whatsapp, href: whatsappHref(b.whatsapp) });
  if (b.addressStreet) rows.push({ icon: MapPin, label: "Warehouse", value: formatAddress(b, fullAddress) });
  if (showHours && b.hours && rows.length) rows.push({ icon: Clock, label: "Hours", value: b.hours });
  if (!rows.length) return null;
  const dark = tone === "dark";
  return (
    <ul className={`space-y-2 text-sm ${className}`}>
      {rows.map((r) => (
        <li key={r.label} className="flex min-w-0 items-start gap-2">
          <r.icon aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 ${dark ? "text-white/50" : "text-signal"}`} />
          <span className="min-w-0 break-words">
            <span className="sr-only">{r.label}: </span>
            {r.href ? (
              <a href={r.href} className={dark ? "tap hover:text-signal" : "tap font-semibold text-signal-dark hover:underline"} {...(r.href.startsWith("https:") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                {r.value}
              </a>
            ) : (
              r.value
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export function SocialLinks({ links, tone = "light", className = "" }: { links: { label: string; href: string }[]; tone?: "light" | "dark"; className?: string }) {
  if (!links.length) return null;
  const dark = tone === "dark";
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`} aria-label="Social media">
      {links.map((l) => (
        <li key={`${l.label}-${l.href}`}>
          <a
            href={l.href}
            target="_blank"
            rel="noopener noreferrer me"
            className={`inline-flex min-h-9 items-center rounded-full px-3 py-1 text-xs font-semibold transition-colors ${dark ?"text-white/80 hover:text-white":"bg-white"}`}
          >
            {l.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
