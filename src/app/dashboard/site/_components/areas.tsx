import Link from "next/link";
import { Building2, CircleHelp, ExternalLink, Home, Info, Megaphone, Menu as MenuIcon, Search, type LucideIcon } from "lucide-react";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { resetArea } from "@/app/actions/site";
import type { SettingsKey } from "@/lib/settings-schema";

/** The Site settings areas, in hub order. */
export const SITE_AREAS: { key: SettingsKey; title: string; description: string; href: string; preview: string; icon: LucideIcon }[] = [
  { key: "business", title: "Business profile", description: "Name, tagline, contact emails and phones, WhatsApp, address, hours, pickup note and social links.", href: "/dashboard/site/business", preview: "/contact", icon: Building2 },
  { key: "navigation", title: "Navigation", description: "Header quick links and dropdowns, mobile menu extras, footer columns, blurb and legal links.", href: "/dashboard/site/navigation", preview: "/", icon: MenuIcon },
  { key: "announcement", title: "Announcement bar", description: "The strip above the header: on/off, message, link and colour.", href: "/dashboard/site/announcement", preview: "/", icon: Megaphone },
  { key: "home", title: "Homepage", description: "Hero text and photo, stats, and every homepage section: show, hide, rename and reorder.", href: "/dashboard/site/homepage", preview: "/", icon: Home },
  { key: "about", title: "About page", description: "Hero, photos, mission, sustainability, buying promises, advantages and thank-you cards.", href: "/dashboard/site/about", preview: "/about", icon: Info },
  { key: "faqs", title: "FAQs", description: "The questions and answers at the bottom of the homepage, about page and blog.", href: "/dashboard/site/faqs", preview: "/#faq", icon: CircleHelp },
  { key: "seo", title: "SEO defaults", description: "Default page title, title template, description and social sharing image.", href: "/dashboard/site/seo", preview: "/", icon: Search },
];

export function areaOf(key: SettingsKey) {
  return SITE_AREAS.find((a) => a.key === key)!;
}

/** "Reset to defaults" with inline confirm (stays on the editor when `stay`). */
export function ResetAreaButton({ area, stay = false, label = "Reset to defaults" }: { area: SettingsKey; stay?: boolean; label?: string }) {
  const a = areaOf(area);
  return (
    <form action={resetArea}>
      <input type="hidden" name="area" value={area} />
      {stay && <input type="hidden" name="back" value="area" />}
      <ConfirmButton className="btn-ghost py-2 text-rust" prompt={`Restore the default ${a.title.toLowerCase()}?`} confirmLabel="Reset">
        {label}
      </ConfirmButton>
    </form>
  );
}

/** Header actions shared by the editor pages: open the live page + reset. */
export function AreaActions({ area }: { area: SettingsKey }) {
  const a = areaOf(area);
  return (
    <>
      <Link href={a.preview} target="_blank" rel="noopener" className="btn-ghost py-2">
        <ExternalLink aria-hidden className="h-4 w-4" /> View on site
      </Link>
      <ResetAreaButton area={area} stay />
    </>
  );
}
