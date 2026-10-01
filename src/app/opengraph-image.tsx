import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

// Default social card for every page that doesn't have its own (lot pages do: lots/[slug]/opengraph-image.tsx).
export const alt = `${SITE_NAME} — wholesale liquidation pallets, truckloads and case packs`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#13233f", color: "#fbf8f1", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 32 32">
            <rect x="4" y="4" width="11" height="10" rx="1.5" fill="#fbf8f1" />
            <rect x="17" y="4" width="11" height="10" rx="1.5" fill="#f0641e" />
            <rect x="4" y="16" width="24" height="5" rx="1.5" fill="#fbf8f1" />
            <rect x="5" y="23" width="4" height="5" fill="#fbf8f1" />
            <rect x="14" y="23" width="4" height="5" fill="#fbf8f1" />
            <rect x="23" y="23" width="4" height="5" fill="#fbf8f1" />
          </svg>
          <div style={{ display: "flex", fontSize: 52, fontWeight: 700 }}>
            {SITE_NAME === "PalletPort" ? (
              <>
                <span>Pallet</span>
                <span style={{ color: "#f0641e" }}>Port</span>
              </>
            ) : (
              <span>{SITE_NAME}</span>
            )}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", fontSize: 26, letterSpacing: 4, textTransform: "uppercase", color: "#f0641e" }}>Liquidation pallets, direct from our warehouse</div>
          <div style={{ display: "flex", fontSize: 64, fontWeight: 700, lineHeight: 1.08, maxWidth: 1000 }}>Manifested returns & overstock by the case, pallet or truckload.</div>
          <div style={{ display: "flex", fontSize: 28, color: "rgba(251,248,241,0.7)" }}>Fixed prices · Every lot manifested</div>
        </div>
        <div style={{ display: "flex", height: 12, width: 240, background: "#f0641e", borderRadius: 6 }} />
      </div>
    ),
    size,
  );
}
