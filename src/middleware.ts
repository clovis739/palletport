import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";
import { isStaff } from "@/lib/permissions";

const PROTECTED = ["/cart", "/checkout", "/orders", "/account"]; // the admin (/dashboard) is guarded server-side and 404s for non-staff

/**
 * Runs before every page:
 *  1. HTTPS — redirects plain HTTP to HTTPS in production (behind a proxy/CDN).
 *  2. Maintenance — MAINTENANCE_MODE=1 serves /maintenance with HTTP 503 (admins can bypass with ?bypass=MAINTENANCE_BYPASS).
 *  3. Admin — /dashboard 404s for anyone whose session isn't a staff role.
 *  4. Auth — signed-out users are sent to /login; an expired/invalid session shows the "session expired" notice.
 */
export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // 1. Force HTTPS in production.
  const proto = req.headers.get("x-forwarded-proto");
  if (process.env.NODE_ENV === "production" && process.env.FORCE_HTTPS !== "0" && proto === "http") {
    const url = req.nextUrl.clone();
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  // 2. Maintenance mode.
  if (process.env.MAINTENANCE_MODE === "1" && pathname !== "/maintenance") {
    const bypass = process.env.MAINTENANCE_BYPASS;
    if (bypass && req.nextUrl.searchParams.get("bypass") === bypass) {
      const res = NextResponse.next();
      res.cookies.set("pp_bypass", bypass, { httpOnly: true, path: "/", maxAge: 60 * 60 * 8 });
      return res;
    }
    if (!bypass || req.cookies.get("pp_bypass")?.value !== bypass) {
      const url = req.nextUrl.clone();
      url.pathname = "/maintenance";
      url.search = "";
      return NextResponse.rewrite(url, { status: 503, headers: { "Retry-After": "3600" } });
    }
  }

  // 3. The admin is invisible to everyone but staff: a real 404 (status + page) before any HTML streams,
  //    so its page titles never leak. The dashboard layout still re-checks the role against the database.
  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value);
    if (!session || !isStaff(session.role)) {
      const url = req.nextUrl.clone();
      url.pathname = "/__not-found";
      url.search = "";
      return NextResponse.rewrite(url, { status: 404, headers: { "X-Robots-Tag": "noindex" } });
    }
  }

  // 4. Auth for protected areas.
  if (PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await verifySession(raw);
    if (!session) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.search = `?next=${encodeURIComponent(pathname + search)}${raw ? "&expired=1" : ""}`;
      const res = NextResponse.redirect(url);
      if (raw) res.cookies.delete(SESSION_COOKIE); // expired or tampered token
      return res;
    }
  }
  return NextResponse.next();
}

export const config = {
  // Everything except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js|woff2?)$).*)"],
};
