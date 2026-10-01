import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/admin/PageHeader";
import { lotFormOptions } from "@/lib/catalog";
import { createLot } from "@/app/actions/seller";
import { LotForm } from "../LotForm";

export const metadata = { title: "New lot" };

export default async function NewLotPage() {
  await requireStaff("lots", "/dashboard/new");
  const options = await lotFormOptions();
  return (
    <>
      <PageHeader title="New lot" description="Create a fixed-price listing with its manifest, stock and photos. It goes live when you publish." back={{ href: "/dashboard/lots", label: "All lots" }} />
      <LotForm {...options} action={createLot} submitLabel="Publish lot" />
    </>
  );
}
