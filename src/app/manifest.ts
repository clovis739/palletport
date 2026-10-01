import type { MetadataRoute } from "next";
import { SITE_NAME } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE_NAME} — Wholesale liquidation pallets`,
    short_name: SITE_NAME,
    description: "Manifested liquidation pallets, truckloads and case packs sold direct from our warehouse.",
    start_url: "/",
    display: "standalone",
    background_color: "#fbf8f1",
    theme_color: "#13233f",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
