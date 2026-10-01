import { notFound } from "next/navigation";
import { StatusScreen } from "@/components/states/StatusScreen";
import { STATUS } from "@/lib/status";
import { BrowseSkeleton } from "@/components/states/PageSkeletons";
import { privateMetadata } from "@/lib/seo";

export const metadata = privateMetadata();

export default async function StatusPreview({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (code === "loading") return <BrowseSkeleton />;
  const n = Number(code);
  if (!STATUS[n]) notFound();
  return <StatusScreen code={n} actions={[{ href: "/status", label: "All screens", primary: true }, { href: "/", label: "Homepage" }]} />;
}
