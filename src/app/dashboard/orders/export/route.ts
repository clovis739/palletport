import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import { DELIVERY_LABEL, csvCell, orderWhere, parseOrderFilters, paymentLabel } from "@/lib/commerce";

export const dynamic = "force-dynamic";

/** CSV of the orders matching the same filters as /dashboard/orders (max 10,000 rows). */
export async function GET(req: Request) {
  const { user } = await requireStaff("orders", "/dashboard/orders");
  const sp = Object.fromEntries(new URL(req.url).searchParams);
  const f = parseOrderFilters(sp);
  const orders = await db.order.findMany({
    where: orderWhere(f),
    include: { user: { select: { name: true, email: true, businessName: true } }, items: { select: { title: true, quantity: true, priceCents: true } } },
    orderBy: { createdAt: "desc" },
    take: 10000,
  });

  const head = [
    "Order", "Date", "Status", "Payment", "Paid at", "Buyer", "Business", "Email", "Items", "Subtotal", "Discount", "Promo", "Freight", "Total",
    "Delivery", "Ship to", "Address", "City", "Region", "Postal", "Country", "Dock", "Residential", "PO", "Carrier", "Tracking",
  ];
  const $ = (c: number) => (c / 100).toFixed(2);
  const lines = orders.map((o) =>
    [
      o.number, o.createdAt.toISOString(), o.status, paymentLabel(o.paymentMethod), o.paidAt?.toISOString() ?? "",
      o.user.name, o.user.businessName ?? "", o.user.email,
      o.items.map((i) => `${i.quantity}x ${i.title} @ ${$(i.priceCents)}`).join("; "),
      $(o.subtotalCents), $(o.discountCents), o.promoCode ?? "", $(o.shippingCents), $(o.totalCents),
      DELIVERY_LABEL[o.deliveryMethod] ?? o.deliveryMethod, o.shipName, o.shipAddress, o.shipCity, o.shipRegion, o.shipPostal, o.shipCountry,
      o.dockAccess ? "yes" : "no", o.residential ? "yes" : "no", o.poNumber ?? "", o.carrier ?? "", o.trackingNo ?? "",
    ].map(csvCell).join(","),
  );
  await logAudit(user, "order.export", `${orders.length} orders`, new URL(req.url).search);
  const body = "﻿" + [head.join(","), ...lines].join("\r\n");
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
