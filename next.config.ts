import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const securityHeaders = [
  // Browsers remember to use HTTPS for two years (only sent in production over HTTPS).
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }] : []),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  // Allows verification builds to avoid a running development server's cache.
  distDir: process.env.PALLET_BUILD_DIR || ".next",
  serverExternalPackages: ["bcryptjs"],
  poweredByHeader: false,
  experimental: {
    // Enables forbidden() / unauthorized() and the app/forbidden.tsx + app/unauthorized.tsx screens.
    authInterrupts: true,
    // Lot photo uploads go through Server Actions (default limit is 1 MB). Photos are shrunk in the browser first.
    serverActions: { bodySizeLimit: "40mb" },
    // Requests pass through middleware, which buffers bodies up to this size (default 10 MB).
    middlewareClientMaxBodySize: "40mb",
  },
  // Old marketplace URLs (multi-seller features were removed): send visitors somewhere useful.
  async redirects() {
    return [
      { source: "/sell", destination: "/contact", permanent: true },
      { source: "/sell/:path*", destination: "/contact", permanent: true },
      { source: "/sellers", destination: "/about", permanent: true },
      { source: "/sellers/:path*", destination: "/search", permanent: true },
      { source: "/messages", destination: "/contact", permanent: true },
      { source: "/messages/:path*", destination: "/contact", permanent: true },
      // The store sells at fixed prices only (auctions were retired).
      { source: "/auctions", destination: "/lots", permanent: true },
      { source: "/auctions/:path*", destination: "/lots", permanent: true },
      { source: "/buy-now", destination: "/lots", permanent: true },
      { source: "/bids", destination: "/orders", permanent: true },
      { source: "/blog/auction-bidding-strategy", destination: "/blog/buying-strategy", permanent: true },
      { source: "/help/how-bidding-works", destination: "/how-to-buy", permanent: true },
      { source: "/help/paying-for-won-auctions", destination: "/help/payment-options", permanent: true },
      { source: "/help/retracting-a-bid", destination: "/help/cancel-or-change", permanent: true },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Static image caching only. Personalized HTML must never receive public cache headers.
      { source: "/images/:path*", headers: [
        { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
      ] },
      { source: "/dashboard/:path*", headers: [
        { key: "Cache-Control", value: "private, no-store" },
        { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
      ] },
    ];
  },
};

export default nextConfig;
