import { ImageResponse } from "next/og";

// Stable 512×512 PNG of the PalletPort mark — used as the Organization logo in JSON-LD and in the web app manifest.
export const dynamic = "force-static";

export function GET() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fbf8f1" }}>
        <svg width="400" height="400" viewBox="0 0 32 32">
          <rect x="4" y="4" width="11" height="10" rx="1.5" fill="#13233f" />
          <rect x="17" y="4" width="11" height="10" rx="1.5" fill="#f0641e" />
          <rect x="4" y="16" width="24" height="5" rx="1.5" fill="#13233f" />
          <rect x="5" y="23" width="4" height="5" fill="#13233f" />
          <rect x="14" y="23" width="4" height="5" fill="#13233f" />
          <rect x="23" y="23" width="4" height="5" fill="#13233f" />
        </svg>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
