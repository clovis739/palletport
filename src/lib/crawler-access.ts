/** Optional third-party SEO/scraping crawlers, not search engines or Merchant crawlers. */
export const UNNECESSARY_CRAWLERS = ["AhrefsBot", "SemrushBot", "MJ12bot", "DotBot", "BLEXBot", "CCBot", "Bytespider"];

const unwanted = new RegExp(`(?:^|[^a-z0-9_-])(?:${UNNECESSARY_CRAWLERS.join("|")})(?:$|[^a-z0-9_-])`, "i");

/** UA matching is a cost control, not identity verification; spoofed browser UAs can bypass it. */
export function rejectCrawler(userAgent: string, pathname: string, method: string) {
  if (method !== "GET" && method !== "HEAD") return false;
  const path = pathname === "/es" ? "/" : pathname.replace(/^\/es\//, "/");
  // Let private-route authentication and admin concealment keep their existing responses.
  if (/^\/(?:dashboard|api|cart|checkout|account|orders)(?:\/|$)/.test(path)) return false;
  if (["/robots.txt", "/sitemap.xml", "/merchant-feed.xml"].includes(path)) return false;
  return unwanted.test(userAgent);
}
