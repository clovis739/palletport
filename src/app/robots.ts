import type { MetadataRoute } from "next";
import { requestSiteUrl } from "@/lib/site-url";

// Private / transactional areas. These pages also send `noindex`, so this list only saves crawl budget.
// The admin is deliberately NOT listed here (listing it would advertise it); its pages are noindex and 404 for non-staff.
const PRIVATE = ["/cart", "/checkout", "/account", "/orders", "/api/", "/reset-password/", "/status/"];

// Search engines — always allowed. (Bingbot also powers Bing, DuckDuckGo and Copilot answers; blocking it removes
// the site from Bing search, so it lives here rather than in the AI list.)
const SEARCH_ENGINES = ["Googlebot", "Bingbot", "Applebot", "DuckDuckBot"];

// AI crawlers and AI-training control tokens. Allowed by default; set ALLOW_AI_CRAWLERS=false to opt out.
// This is the owner's choice: allowing them lets assistants read and cite the catalogue and help pages.
const AI_CRAWLERS = [
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
];

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = await requestSiteUrl();
  const allowAi = process.env.ALLOW_AI_CRAWLERS?.trim().toLowerCase() !== "false";
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      { userAgent: SEARCH_ENGINES, allow: "/", disallow: PRIVATE },
      allowAi ? { userAgent: AI_CRAWLERS, allow: "/", disallow: PRIVATE } : { userAgent: AI_CRAWLERS, disallow: "/" },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
