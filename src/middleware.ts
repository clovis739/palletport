import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { isStaff } from "@/lib/permissions";
import { LOCALE_COOKIE, LOCALE_HEADER, isLocalizablePath, stripLocale } from "@/i18n/config";

const PROTECTED = ["/cart", "/checkout", "/orders", "/account"]; // the admin (/dashboard) is guarded server-side and 404s for non-staff

/**
 * Runs before every page:
 *  1. HTTPS — redirects plain HTTP to HTTPS in production (behind a proxy/CDN).
 *  2. Admin — /dashboard 404s for anyone whose session isn't a staff role.
 *  3. Maintenance — MAINTENANCE_MODE=1 serves /maintenance with HTTP 503 (admins can bypass with ?bypass=MAINTENANCE_BYPASS).
 *  4. Auth — signed-out users are sent to /login; an expired/invalid session shows the "session expired" notice.
 *  5. Language — /es/… is served in Spanish (rewritten to the same page with the x-locale header) and remembered
 *     in a cookie; a visitor who chose Spanish is sent to the /es version of English links; ?lang=en switches back.
 */
export async function middleware(req: NextRequest) {
  const { search } = req.nextUrl;
  const rawPath = req.nextUrl.pathname;
  const isEs = rawPath === "/es" || rawPath.startsWith("/es/");
  // All checks below use the page path without the /es prefix.
  const pathname = isEs ? stripLocale(rawPath) : rawPath;
  const pageRequest = req.method === "GET" && isLocalizablePath(pathname);

  // 5a. Language switch back to English: /lots?lang=en → /lots (cookie = en).
  if (req.nextUrl.searchParams.get("lang") === "en" && pageRequest) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    url.searchParams.delete("lang");
    const res = NextResponse.redirect(url, 307);
    res.cookies.set(LOCALE_COOKIE, "en", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return res;
  }
  // 5b. /es/dashboard, /es/api… are not translated: send them to the normal URL.
  if (isEs && !isLocalizablePath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    return NextResponse.redirect(url, 308);
  }
  // 5c. Visitor chose Spanish earlier and followed an English link: keep them in Spanish.
  if (!isEs && pageRequest && req.cookies.get(LOCALE_COOKIE)?.value === "es" && !req.headers.get("next-action")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname === "/" ? "/es" : `/es${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  // 1. Force HTTPS in production.
  const proto = req.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS !== "0" && proto === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // Reject before maintenance handling or any page HTML can stream. Server guards also
  // check the current database role, so a stale staff cookie cannot authorize data access.
  const admin = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const privateHeaders = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "private, no-store" };
  if (admin) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session || !isStaff(session.role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/__not-found";
      url.search = "";
      return NextResponse.rewrite(url, { status: 404, headers: privateHeaders });
    }
  }

  let newBypass: string | undefined;
  // 3. Maintenance mode. A bypass skips maintenance only, never authentication.
  if (process.env.MAINTENANCE_MODE === "1" && pathname !== "/maintenance") {
    const bypass = process.env.MAINTENANCE_BYPASS;
    if (bypass && req.nextUrl.searchParams.get("bypass") === bypass) {
      newBypass = bypass;
    } else if (!bypass || req.cookies.get("pp_bypass")?.value !== bypass) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.rewrite(url, { status: 503, headers: { "Retry-After": "3600", ...(admin ? privateHeaders : {}) } });
    }
  }

  // 4. Auth for protected areas.
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(raw);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = isEs ? "/es/login" : "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}${raw ? "&expired=1" : ""}`;
      const res = NextResponse.redirect(url);
      if (raw) res.cookies.delete(SESSION_COOKIE); // expired or tampered token
      return res;
    }
  }
  // Tell the page which language to render (never trust a client-sent x-locale header).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set(LOCALE_HEADER, isEs ? "es" : "en");
  let res: NextResponse;
  if (isEs) {
    const url = req.nextUrl.clone();
    url.pathname = pathname;
    res = NextResponse.rewrite(url, { request: { headers: requestHeaders } });
    if (req.cookies.get(LOCALE_COOKIE)?.value !== "es") res.cookies.set(LOCALE_COOKIE, "es", { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  } else {
    res = NextResponse.next({ headers: admin ? privateHeaders : undefined, request: { headers: requestHeaders } });
  }
  if (newBypass) res.cookies.set("pp_bypass", newBypass, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 8,
  });
  return res;
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/dashboard/:path*", "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)"],
};
