import Link from "next/link";
import { notFound } from "next/navigation";
import { Eye, ExternalLink, Heart, ShoppingBag, Star, Tag } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, pctOfRetail } from "@/lib/format";
import { PageHeader } from "@/components/admin/PageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { SubmitButton } from "@/components/SubmitButton";
import { deleteLot, setLotStatus, updateLot } from "@/app/actions/seller";
import { toggleFeatured } from "@/app/actions/admin";
import { lotFormOptions } from "@/lib/catalog";
import { LotForm } from "../../LotForm";
import { parseImages } from "@/lib/lotImages";

export const metadata = { title: "Edit lot" };

export default async function EditLotPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ photoError?: string }> }) {
  const { id } = await params;
  const { photoError } = await searchParams;
  const { seller } = await requireStaff("lots", `/dashboard/lots/${id}`);
  const [lot, options] = await Promise.all([
    db.lot.findFirst({ where: { id, sellerId: seller.id }, include: { manifest: true, _count: { select: { favorites: true, orderItems: true } } } }),
    lotFormOptions(),
  ]);
  if (!lot) notFound();
  const sold = await db.orderItem.aggregate({ where: { lotId: lot.id, order: { status: { not: "CANCELLED" } } }, _sum: { quantity: true } });
  const manifest = lot.manifest.map((m) => `${m.name.replace(/,/g, " ")}, ${m.qty}, ${(m.unitMsrpCents / 100).toFixed(2)}, ${m.sku}`).join("\n");
  const canToggle = lot.status === "ACTIVE" || lot.status === "DRAFT";

  return (
    <>
      <PageHeader
        title={lot.title}
        back={{ href: "/dashboard/lots", label: "All lots" }}
        meta={
          <>
            <StatusPill status={lot.status} />
            {lot.featured && <Badge tone="signal"><Star aria-hidden className="h-3 w-3 fill-current" /> Featured</Badge>}
            <span>{lot.available} in stock</span>
          </>
        }
        actions={
          <>
            <Link href={`/lots/${lot.slug}`} className="btn-ghost"><ExternalLink aria-hidden className="h-4 w-4" /> View listing</Link>
            <form action={toggleFeatured}>
              <input type="hidden" name="lotId" value={lot.id} />
              <SubmitButton className="btn-ghost" pendingText="…">{lot.featured ? "Unfeature" : "Feature"}</SubmitButton>
            </form>
            {canToggle && (
              <form action={setLotStatus}>
                <input type="hidden" name="id" value={lot.id} />
                <input type="hidden" name="status" value={lot.status === "ACTIVE" ? "DRAFT" : "ACTIVE"} />
                <SubmitButton className="btn-ghost" pendingText="…">{lot.status === "ACTIVE" ? "Move to draft" : "Publish"}</SubmitButton>
              </form>
            )}
            <form action={deleteLot}>
              <input type="hidden" name="id" value={lot.id} />
              <ConfirmButton confirmLabel={lot._count.orderItems ? "Hide lot" : "Delete lot"} prompt={lot._count.orderItems ? "It has orders — hide it?" : "Delete this lot?"}>Delete</ConfirmButton>
            </form>
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Views" value={lot.views.toLocaleString()} icon={Eye} />
        <StatCard label="Saves" value={lot._count.favorites} icon={Heart} />
        <StatCard label="Price" value={money(lot.priceCents)} icon={Tag} hint={`${lot.available} in stock · ${pctOfRetail(lot.priceCents, lot.msrpCents)}% of retail`} />
        <StatCard label="Units sold" value={sold._sum.quantity ?? 0} icon={ShoppingBag} href={`/dashboard/orders?q=${encodeURIComponent(lot.title.slice(0, 60))}`} hint="View orders" />
      </div>

      {photoError && <p role="alert" className="mb-4 rounded-xl bg-rust/10 p-4 text-sm font-medium text-rust">The lot was saved, but a photo couldn&apos;t be uploaded: {photoError}</p>}
      <LotForm
        {...options}
        action={updateLot}
        submitLabel="Save changes"
        defaults={{
          id: lot.id,
          images: parseImages(lot.images),
          title: lot.title,
          description: lot.description,
          categoryId: lot.categoryId,
          subcategoryId: lot.subcategoryId,
          condition: lot.condition,
          price: lot.priceCents / 100,
          originalPrice: lot.compareAtPriceCents / 100,
          shipsFrom: lot.shipsFrom,
          lotSize: lot.lotSize,
          source: lot.source,
          brand: lot.brand,
          palletCount: lot.palletCount,
          weightLbs: lot.weightLbs,
          available: lot.available,
          manifest,
        }}
      />
    </>
  );
}
