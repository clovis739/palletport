import { notFound } from "next/navigation";
import { getStaffUser, requireStaff } from "@/lib/auth";
import { can } from "@/lib/permissions";
import { getEntryById } from "@/lib/content";
import { toEditorEntry } from "@/lib/content-editor";
import { EntryEditor } from "@/components/admin/editor/EntryEditor";
import { loadEditorOptions } from "../editor-options";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const staff = await getStaffUser();
  if (!staff || !can(staff.role, "content")) return { title: "Edit entry" };
  const e = await getEntryById((await params).id).catch(() => null);
  return { title: e ? `Edit: ${e.title}` : "Edit entry" };
}

export default async function EditEntryPage({ params }: { params: Params }) {
  const { id } = await params;
  await requireStaff("content", `/dashboard/content/${id}`);
  const entry = await getEntryById(id);
  if (!entry) notFound();
  const options = await loadEditorOptions(entry.type, entry.id);
  return <EntryEditor key={entry.id} initial={toEditorEntry(entry)} options={options} />;
}
