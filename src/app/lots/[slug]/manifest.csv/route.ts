import { db } from "@/lib/db";
import { LIMITS, clientIp, rateLimit } from "@/lib/rateLimit";

function cell(v: string | number) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const rl = rateLimit(`csv:${await clientIp()}`, LIMITS.download.max, LIMITS.download.windowMs);
  if (!rl.ok) return new Response(rl.message, { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } });
  const lot = await db.lot.findUnique({ where: { slug }, include: { manifest: { orderBy: { unitMsrpCents: "desc" } } } });
  if (!lot || lot.status === "DRAFT") return new Response("Not found", { status: 404 });
  const rows = [
    ["Lot", "SKU", "Item", "Quantity", "Unit retail (USD)", "Extended retail (USD)"],
    ...lot.manifest.map((m) => [lot.id.slice(-6).toUpperCase(), m.sku, m.name, m.qty, (m.unitMsrpCents / 100).toFixed(2), ((m.qty * m.unitMsrpCents) / 100).toFixed(2)]),
  ];
  const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="manifest-${lot.slug}.csv"`,
    },
  });
}
