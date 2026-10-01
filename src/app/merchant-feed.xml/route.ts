import { db } from "@/lib/db";
import { CONDITIONS, LOT_SIZES, purchasePrice } from "@/lib/format";
import { parseImages } from "@/lib/lotImages";
import { isLotPhotoUrl } from "@/lib/mediaUrls";
import { lotNumber } from "@/lib/seo";
import { requestSiteUrl } from "@/lib/site-url";

/**
 * Google Merchant Center product feed (RSS 2.0 + g: namespace): /merchant-feed.xml
 * Add it in Merchant Center → Products → Add product source → "Add products from a file" → scheduled fetch.
 *
 * Only in-stock lots with at least one real uploaded photo are listed. Google rejects stock/illustrative
 * images for products, so lots that only show stock photos are left out until you upload their own photos.
 * Shipping and tax are configured in Merchant Center itself.
 */
export const dynamic = "force-dynamic";

const GOOGLE_CONDITION: Record<string, "new" | "used" | "refurbished"> = {
  NEW: "new",
  SHELF_PULL: "new",
  CUSTOMER_RETURN: "used",
  MIXED: "used",
  SALVAGE: "used",
};

const xml = (s: string) =>
  s
    // strip characters XML 1.0 doesn't allow
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/** Plain text for the description (no markdown/HTML), max 5000 chars as Google requires. */
const plain = (s: string) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/[*_#>`]+/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 5000);

const money = (cents: number) => `${(cents / 100).toFixed(2)} USD`;

export async function GET() {
  const base = await requestSiteUrl();
  const abs = (u: string) => (u.startsWith("/") ? `${base}${u}` : u);
  const lots = await db.lot.findMany({
    where: { status: "ACTIVE", available: { gt: 0 } },
    include: { category: { select: { name: true } }, subcategory: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 5000,
  });

  const items: string[] = [];
  let skipped = 0;
  for (const lot of lots) {
    const photos = parseImages(lot.images).filter(isLotPhotoUrl).map(abs);
    const price = purchasePrice(lot);
    if (!photos.length || price === null) {
      skipped++;
      continue;
    }
    const size = LOT_SIZES[lot.lotSize]?.label ?? lot.lotSize;
    const type = [lot.category?.name, lot.subcategory?.name].filter(Boolean).join(" > ");
    const cond = CONDITIONS[lot.condition]?.label ?? lot.condition;
    const description = plain(
      `${lot.description} ${size}${lot.units ? `, ${lot.units} units` : ""}. Condition: ${cond}. Full manifest on the product page.`,
    );
    const fields: [string, string | undefined][] = [
      ["g:id", lot.externalSku ?? lotNumber(lot)],
      ["g:title", lot.title.slice(0, 150)],
      ["g:description", description],
      ["g:link", `${base}/lots/${lot.slug}`],
      ["g:image_link", photos[0]],
      ["g:availability", "in_stock"],
      ["g:price", money(price)],
      ["g:condition", GOOGLE_CONDITION[lot.condition] ?? "used"],
      ["g:brand", lot.brand || undefined],
      // Mixed liquidation lots have no GTIN/MPN.
      ["g:identifier_exists", "no"],
      ["g:product_type", type || undefined],
      ["g:is_bundle", lot.units > 1 ? "yes" : undefined],
      ["g:shipping_weight", lot.weightLbs ? `${lot.weightLbs} lb` : undefined],
      ["g:custom_label_0", size],
      ["g:custom_label_1", cond],
    ];
    items.push(
      [
        "<item>",
        ...fields.filter(([, v]) => v).map(([k, v]) => `<${k}>${xml(String(v))}</${k}>`),
        ...photos.slice(1, 11).map((p) => `<g:additional_image_link>${xml(p)}</g:additional_image_link>`),
        "</item>",
      ].join(""),
    );
  }

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">
<channel>
<title>PalletPort liquidation lots</title>
<link>${xml(base)}</link>
<description>In-stock manifested liquidation pallets, truckloads and case packs. ${items.length} listed, ${skipped} waiting for their own photos.</description>
${items.join("\n")}
</channel>
</rss>`;
  return new Response(body, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      "X-Robots-Tag": "noindex",
    },
  });
}
