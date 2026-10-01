import "server-only";
import { headers } from "next/headers";
import { configuredSiteUrl, isLocalUrl, siteUrl } from "@/lib/seo";

/**
 * The site's base URL for the current request (no trailing slash).
 *
 * 1. A configured public URL (APP_URL or the hosting platform's variable) always wins, so canonical links and
 *    the sitemap stay on the real domain even when the site is reached through another address.
 * 2. Otherwise the host the visitor used (x-forwarded-host / host, with x-forwarded-proto), so it works on any
 *    port, LAN address or new domain without editing .env.
 * 3. Otherwise the running server's own origin (see siteUrl()).
 */
export async function requestSiteUrl(): Promise<string> {
  const configured = configuredSiteUrl();
  if (configured) return configured;
  try {
    const h = await headers();
    const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
    if (host && /^[a-z0-9.\-:[\]]+$/i.test(host)) {
      const fwd = (h.get("x-forwarded-proto") ?? "").split(",")[0].trim();
      const proto = fwd === "http" || fwd === "https" ? fwd : isLocalUrl(`http://${host}`) || /^(\d+\.){3}\d+(:\d+)?$/.test(host) ? "http" : "https";
      return `${proto}://${host}`;
    }
  } catch {
    /* outside a request (build time) */
  }
  return siteUrl();
}
