import { ImageResponse } from "next/og";
import { db } from "@/lib/db";
import { conditionLabel, LOT_SIZES, money, pctOfRetail } from "@/lib/format";
import { getBrandLogo } from "@/lib/brand";

// Social card for a lot: title, price, % of retail and condition. Text only — no product photo, so a stock
// picture is never presented as the actual lot.
export const alt = "Liquidation lot summary";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function LotOgImage({ params }: { params: Promise<{ slug: string }> }) {
  const brand = await getBrandLogo();
  const { slug } = await params;
  const lot = await db.lot.findUnique({
    where: { slug },
    select: { title: true, priceCents: true, msrpCents: true, condition: true, status: true, units: true, lotSize: true },
  });
  const visible = lot && lot.status !== "DRAFT";
  const priceLabel = !visible ? "" : lot.status === "ACTIVE" ? "Price" : "Sold out";
  const title = visible ? (lot.title.length > 90 ? `${lot.title.slice(0, 88).trimEnd()}…` : lot.title) : "Liquidation lots";

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#13233f", color: "#fbf8f1", padding: 64 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 36, fontWeight: 700 }}>
            {brand.accent && brand.name.includes(brand.accent) ? (
              <>
                <span>{brand.name.slice(0, brand.name.lastIndexOf(brand.accent))}</span>
                <span style={{ color: "#f0641e" }}>{brand.accent}</span>
                <span>{brand.name.slice(brand.name.lastIndexOf(brand.accent) + brand.accent.length)}</span>
              </>
            ) : (
              <span>{brand.name}</span>
            )}
          </div>
          {visible && (
            <div style={{ display: "flex", gap: 12, fontSize: 24 }}>
              <span style={{ display: "flex", padding: "8px 16px", borderRadius: 8, background: "#f0641e", color: "#fbf8f1", fontWeight: 700 }}>
                {lot.status === "ACTIVE" ? "IN STOCK" : "SOLD OUT"}
              </span>
              <span style={{ display: "flex", padding: "8px 16px", borderRadius: 8, border: "2px solid rgba(251,248,241,0.4)" }}>{conditionLabel(lot.condition)}</span>
            </div>
          )}
        </div>
        <div style={{ display: "flex", fontSize: 60, fontWeight: 700, lineHeight: 1.1, maxWidth: 1070 }}>{title}</div>
        {visible ? (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 56 }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, color: "rgba(251,248,241,0.65)" }}>{priceLabel}</span>
              <span style={{ fontSize: 72, fontWeight: 700, color: "#f0641e" }}>{money(lot.priceCents)}</span>
            </div>
            {lot.msrpCents > 0 && (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: 24, color: "rgba(251,248,241,0.65)" }}>of est. retail {money(lot.msrpCents)}</span>
                <span style={{ fontSize: 56, fontWeight: 700 }}>{pctOfRetail(lot.priceCents, lot.msrpCents)}%</span>
              </div>
            )}
            {lot.units > 0 && <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 24, color: "rgba(251,248,241,0.65)" }}>{LOT_SIZES[lot.lotSize]?.label ?? "Lot"}</span>
              <span style={{ fontSize: 56, fontWeight: 700 }}>{lot.units.toLocaleString("en-US")} units</span>
            </div>}
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 32 }}>Manifested pallets, truckloads and case packs</div>
        )}
      </div>
    ),
    size,
  );
}
