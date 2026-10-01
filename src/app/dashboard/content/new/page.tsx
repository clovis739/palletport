import Link from "next/link";
import { Database } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { CONTENT_TYPE_INFO, codeContent, contentSource, isContentType, type ContentType } from "@/lib/content";
import { emptyEntry } from "@/lib/content-editor";
import { EmptyState } from "@/components/admin/EmptyState";
import { Card } from "@/components/admin/Card";
import { PageHeader } from "@/components/admin/PageHeader";
import { EntryEditor } from "@/components/admin/editor/EntryEditor";
import { loadEditorOptions } from "../editor-options";

export const metadata = { title: "New entry" };

export default async function NewEntryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  await requireStaff("content", "/dashboard/content/new");
  const { type: t } = await searchParams;
  const type: ContentType = t && isContentType(t) ? t : "POST";
  const info = CONTENT_TYPE_INFO[type];

  if ((await contentSource(type)) === "code" && codeContent(type).length) {
    return (
      <>
        <PageHeader title={`New ${info.label.toLowerCase()}`} back={{ href: `/dashboard/content?type=${type}`, label: info.plural }} />
        <Card>
          <EmptyState
            icon={Database}
            title="Import the built-in content first"
            description={`${info.plural} are still served read-only from the built-in content. Creating one now would hide all the built-in ${info.plural.toLowerCase()} from the site, so the owner needs to import them first.`}
            action={<Link href={`/dashboard/content?type=${type}`} className="btn-primary">Go to {info.plural.toLowerCase()}</Link>}
          />
        </Card>
      </>
    );
  }

  const options = await loadEditorOptions(type);
  return <EntryEditor key={`new-${type}`} initial={emptyEntry(type)} options={options} />;
}
