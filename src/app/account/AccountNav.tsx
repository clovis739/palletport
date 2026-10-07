import Link from "next/link";
import { getI18n } from "@/i18n/server";
import { BadgeCheck, Heart, KeyRound, Package, UserRound, UsersRound, type LucideIcon } from "lucide-react";

const LINKS: [string, string, LucideIcon][] = [
  ["/account", "Profile & address", UserRound],
  ["/account/verification", "Business verification", BadgeCheck],
  ["/account/favorites", "Saved lots", Heart],
  ["/orders", "Orders", Package],
  ["/account/referrals", "Refer a business", UsersRound],
  ["/account/security", "Password & security", KeyRound],
];

export async function AccountNav({ active }: { active: string }) {
  const { t, lh } = await getI18n();
  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0 [&::-webkit-scrollbar]:hidden">
      {LINKS.map(([href, label, Icon]) => (
        <Link key={href} href={lh(href)} className={`flex shrink-0 items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active === href ? "bg-ink font-semibold text-white" : "hover:bg-sand"}`}>
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}

export async function AccountShell({ active, title, children }: { active: string; title: string; children: React.ReactNode }) {
  const { t } = await getI18n();
  return (
    <div className="container-pp grid grid-cols-1 gap-6 py-8 sm:py-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-8">
      <aside className="min-w-0"><AccountNav active={active} /></aside>
      <div className="min-w-0">
        <h1 className="mb-6 font-display text-2xl font-bold sm:text-3xl">{t(title)}</h1>
        {children}
      </div>
    </div>
  );
}
