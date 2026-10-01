import Link from "next/link";
import { Logo } from "./Logo";
import { getCurrentUser } from "@/lib/auth";
import { getCartCount } from "@/lib/cart";
import { getCategoryGroups } from "@/lib/catalog";
import { logout } from "@/app/actions/auth";
import { initials } from "@/lib/format";
import { MobileNav, type MobileLink } from "./MobileNav";
import { NavDropdown } from "./NavDropdown";
import { getSettings, headerTones, type NavTone } from "@/lib/settings";
import { can, isStaff } from "@/lib/permissions";
import { Heart, LayoutDashboard, LogOut, Search, ShoppingCart } from "lucide-react";

const PILL: Record<NavTone, string> = {
  primary: "shrink-0 rounded-full bg-ink px-3 py-1.5 font-semibold text-white hover:bg-ink-2",
  urgent: "shrink-0 rounded-full px-3 py-1.5 font-semibold text-rust hover:bg-sand",
  default: "shrink-0 rounded-full px-3 py-1.5 font-semibold hover:bg-sand",
};

/** Storefront header. Quick links (Admin → Site → Navigation) are grouped under "Shop"; DB categories under "Categories" (a mega menu by department group). */
export async function Header() {
  const [user, categoryGroups, settings] = await Promise.all([getCurrentUser(), getCategoryGroups(), getSettings()]);
  const nav = settings.navigation;
  const tones = headerTones(nav.header);
  const mobileLinks: MobileLink[] = [
    ...nav.header.map((h) => ({ label: h.label, href: h.href, children: h.children ?? [] })),
    ...(nav.mobileExtra ?? []).map((l) => ({ label: l.label, href: l.href, children: [] })),
  ];
  // Three centred drop-downs. Plain quick links from Admin → Site → Navigation are sorted by URL:
  // lot-size pages go under "Lot sizes", everything else under "Shop". Categories come from the database.
  const SIZE_PATHS = ["/truckloads", "/pallets", "/case-packs"];
  const plain = nav.header.filter((h) => !h.children?.length).map((h) => ({ label: h.label, href: h.href }));
  const sizeLinks = plain.filter((l) => SIZE_PATHS.some((p) => l.href === p || l.href.startsWith(`${p}?`)));
  const shopLinks = plain.filter((l) => !sizeLinks.includes(l));
  const megaGroups = categoryGroups.map((g) => ({ label: g.group, links: g.items.map((c) => ({ label: c.name, href: `/c/${c.slug}`, note: c.lotCount ? String(c.lotCount) : undefined })) }));
  const groupLinks = nav.header.map((item, i) => ({ item, i })).filter(({ item }) => item.children?.length);
  const cartCount = user ? await getCartCount(user.id) : 0;
  const staff = isStaff(user?.role);
  const canInbox = staff && can(user?.role, "inbox");

  return (
    <header className="relative top-0 z-40 bg-white [@media(min-height:560px)]:sticky">
      <div className="container-pp flex h-16 items-center gap-3 sm:gap-4 lg:grid lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:gap-6">
        <Link href="/" className="shrink-0 justify-self-start text-ink"><Logo /></Link>
        {/* Centre: three drop-downs on large screens; the search box takes this spot on tablets. */}
        <div className="hidden min-w-0 items-center justify-center gap-1 whitespace-nowrap text-sm lg:flex" aria-label="Shop menu" role="navigation">
          {shopLinks.length > 0 && (
            <NavDropdown item={{ label: "Shop", href: "/lots" }} allLabel="All lots" childLinks={shopLinks} className={PILL.default} />
          )}
          {sizeLinks.length > 0 && (
            <NavDropdown item={{ label: "Lot sizes", href: "/lots" }} showAll={false} childLinks={sizeLinks} className={PILL.default} />
          )}
          {megaGroups.length > 0 && (
            <NavDropdown item={{ label: "Categories", href: "/categories" }} allLabel="Browse all categories" childLinks={[]} groups={megaGroups} className={PILL.default} />
          )}
          {groupLinks.map(({ item, i }) => (
            <NavDropdown key={`${item.href}-${i}`} item={item} childLinks={item.children ?? []} className={PILL[tones[i]]} />
          ))}
        </div>
        <form action="/search" className="relative hidden flex-1 md:block lg:hidden">
          <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input name="q" type="search" aria-label="Search lots" placeholder="Search products, brands, SKUs…" className="input rounded-full pl-10" />
        </form>
        <nav className="relative ml-auto flex shrink-0 items-center gap-1 justify-self-end whitespace-nowrap text-sm font-medium sm:gap-2 lg:ml-0 lg:gap-3">
          {/* Search: icon on small desktops (1024–1279px), full box from 1280px so the bar never wraps. */}
          <Link href="/search" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-sand lg:grid xl:hidden" aria-label="Search lots">
            <Search aria-hidden className="h-5 w-5" strokeWidth={1.8} />
          </Link>
          <form action="/search" className="relative hidden xl:block xl:w-52 2xl:w-64">
            <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input name="q" type="search" aria-label="Search lots" placeholder="Search lots…" className="input rounded-full pl-10" />
          </form>
          {staff && (
            <Link href="/dashboard" className="hidden items-center gap-1.5 rounded-full bg-sand px-3 py-2 font-semibold hover:bg-line xl:inline-flex">
              <LayoutDashboard aria-hidden className="h-4 w-4" /> Admin
            </Link>
          )}
          {user ? (
            <>
              <Link href="/orders" className="hidden rounded-full px-3 py-2 hover:bg-sand xl:block">My orders</Link>
              <Link href="/account/favorites" className="hidden h-10 w-10 place-items-center rounded-full hover:bg-sand sm:grid" aria-label="Saved lots">
                <Heart aria-hidden className="h-6 w-6" strokeWidth={1.8} />
              </Link>
              <details className="sm:relative">
                <summary aria-label="Account menu" className="grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full bg-ink font-display text-xs font-bold text-white">{initials(user.name)}</summary>
                <div className="pp-pop pp-pop-in absolute right-0 mt-2 w-56 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-2 text-sm">
                  <p className="truncate px-3 py-2 text-xs text-muted">{user.businessName ?? user.email}</p>
                  {[["/account", "Account"], ["/orders", "Orders"], ["/account/favorites", "Saved lots"], ["/account/referrals", "Refer a business"], ...(staff ? [["/dashboard", "Admin"]] : []), ...(canInbox ? [["/dashboard/inbox", "Approvals & inbox"]] : [])].map(([href, label]) => (
                    <Link key={href} href={href} className="block rounded-lg px-3 py-2 hover:bg-sand">{label}</Link>
                  ))}
                  <form action={logout}><button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-muted hover:bg-sand"><LogOut aria-hidden className="h-4 w-4" /> Sign out</button></form>
                </div>
              </details>
            </>
          ) : (
            <>
              <div className="hidden items-center gap-3 sm:flex">
                <Link href="/login" className="inline-flex h-10 items-center rounded-full px-4 font-semibold hover:bg-sand">Sign in</Link>
                <Link href="/register" className="btn-dark h-10 shrink-0 px-5">Create account</Link>
              </div>
            </>
          )}
          <Link href="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-sand" aria-label="Cart">
            <ShoppingCart aria-hidden className="h-6 w-6" strokeWidth={1.8} />
            {cartCount > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-signal px-1 text-[11px] font-bold text-white">{cartCount}</span>}
          </Link>
          <MobileNav user={user ? { name: user.name, label: user.businessName ?? user.email, isStaff: staff, canInbox } : null} cartCount={cartCount} links={mobileLinks} categoryGroups={megaGroups} />
        </nav>
      </div>
    </header>
  );
}
