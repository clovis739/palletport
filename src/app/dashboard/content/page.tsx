import Link from "next/link";
import { Copy, Database, ExternalLink, Eye, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { isOwner } from "@/lib/permissions";
import { AUTHORS, CONTENT_TYPES, CONTENT_TYPE_INFO, codeContent, contentSource, entryPath, isContentType, listEntries, type ContentArticle, type ContentType } from "@/lib/content";
import { deleteEntryAction, duplicateEntryAction, importDefaultContentAction, setEntryStatusAction } from "@/app/actions/content";
import { ActionForm } from "@/components/forms/ActionForm";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { Card } from "@/components/admin/Card";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { DataTable } from "@/components/admin/DataTable";
import { EmptyState } from "@/components/admin/EmptyState";
import { Toggle } from "@/components/admin/FormField";
import { PageHeader } from "@/components/admin/PageHeader";
import { Tabs } from "@/components/admin/Tabs";
import { Toolbar } from "@/components/admin/Toolbar";

export const metadata = { title: "Pages & posts" };

type SP = Promise<{ type?: string; q?: string; status?: string; sort?: string }>;
const STATUS = ["ALL", "PUBLISHED", "DRAFT"] as const;
const SORTS = { updated: "Last updated", published: "Publish date", title: "Title A–Z" } as const;
type Sort = keyof typeof SORTS;

const NEW_LABEL: Record<ContentType, string> = { POST: "New post", GUIDE: "New guide", HELP: "New help article", LEGAL: "New legal page", PAGE: "New page" };

function timeAgo(d?: Date | null) {
  if (!d) return "—";
  const s = Math.round((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} h ago`;
  const days = Math.round(h / 24);
  if (days < 30) return `${days} d ago`;
  return d.toLocaleDateString("en-US", { dateStyle: "medium" });
}

const btn = "inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3 text-xs font-semibold text-ink focus-visible:outline-2 focus-visible:outline-signal";

export default async function ContentPage({ searchParams }: { searchParams: SP }) {
  const { user } = await requireStaff("content", "/dashboard/content");
  const sp = await searchParams;
  const type: ContentType = sp.type && isContentType(sp.type) ? sp.type : "POST";
  const q = (sp.q ?? "").trim();
  const status = (STATUS as readonly string[]).includes(sp.status ?? "") ? (sp.status as (typeof STATUS)[number]) : "ALL";
  const sort: Sort = sp.sort && sp.sort in SORTS ? (sp.sort as Sort) : "updated";
  const owner = isOwner(user.role);

  const [grouped, sources, all] = await Promise.all([
    db.contentEntry.groupBy({ by: ["type"], _count: true }).catch(() => [] as { type: string; _count: number }[]),
    Promise.all(CONTENT_TYPES.map(async (t) => [t, await contentSource(t)] as const)),
    listEntries(type, { status: "ALL" }),
  ]);
  const source = Object.fromEntries(sources) as Record<ContentType, "db" | "code">;
  const count = (t: ContentType) => (source[t] === "db" ? grouped.find((g) => g.type === t)?._count ?? 0 : codeContent(t).length);
  const info = CONTENT_TYPE_INFO[type];
  const builtIn = source[type] === "code" && codeContent(type).length > 0;

  const term = q.toLowerCase();
  let rows = all.filter((e) => (status === "ALL" || e.status === status) && (!term || [e.title, e.slug, e.excerpt, e.category ?? ""].join(" ").toLowerCase().includes(term)));
  rows = [...rows].sort((a, b) =>
    sort === "title"
      ? a.title.localeCompare(b.title)
      : sort === "published"
        ? (b.date ?? "").localeCompare(a.date ?? "")
        : (b.updatedAt?.getTime() ?? 0) - (a.updatedAt?.getTime() ?? 0),
  );
  const statusCounts = { ALL: all.length, PUBLISHED: all.filter((e) => e.status === "PUBLISHED").length, DRAFT: all.filter((e) => e.status === "DRAFT").length };

  const qs = (over: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const v = { type, q: q || undefined, status: status === "ALL" ? undefined : status, sort: sort === "updated" ? undefined : sort, ...over };
    for (const [k, val] of Object.entries(v)) if (val) p.set(k, val);
    return `/dashboard/content?${p.toString()}`;
  };
  const back = qs({});
  const newHref = `/dashboard/content/new?type=${type}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pages & posts"
        description="Blog posts, buying guides, help articles, legal pages and custom pages — written in the visual block editor."
        actions={
          builtIn ? (
            <span className="btn-primary pointer-events-none opacity-50" aria-disabled="true" title="Import the built-in content first">
              <Plus aria-hidden className="h-4 w-4" /> {NEW_LABEL[type]}
            </span>
          ) : (
            <Link href={newHref} className="btn-primary">
              <Plus aria-hidden className="h-4 w-4" /> {NEW_LABEL[type]}
            </Link>
          )
        }
      />

      <Tabs
        label="Content types"
        current={type}
        items={CONTENT_TYPES.map((t) => ({ value: t, label: CONTENT_TYPE_INFO[t].plural, href: `/dashboard/content?type=${t}`, count: count(t) }))}
      />

      {builtIn && (
        <section aria-label="Built-in content" className="rounded-2xl border border-signal/40 bg-signal/[0.04] p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-signal/15 text-signal-dark">
              <Database aria-hidden className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 space-y-2">
              <h2 className="font-display text-lg font-bold">{info.plural} are showing the built-in content</h2>
              <p className="text-sm text-ink/75">
                Until the built-in {info.plural.toLowerCase()} are imported, the site serves them read-only from the code and they can’t be edited here.
                Importing copies every built-in blog post, guide, help article and legal page into the editor as published entries — the public site looks exactly the same afterwards.
              </p>
              {owner ? (
                <div className="pt-2">
                  <ActionForm action={importDefaultContentAction} submitLabel="Import built-in content" submitClass="btn-primary" className="space-y-3">
                    {null}
                  </ActionForm>
                </div>
              ) : (
                <p className="text-sm font-semibold">Ask the store owner to import the built-in content to start editing.</p>
              )}
            </div>
          </div>
        </section>
      )}

      <Toolbar
        q={q}
        placeholder={`Search ${info.plural.toLowerCase()}…`}
        action="/dashboard/content"
        keep={{ type, status: status === "ALL" ? undefined : status, sort: sort === "updated" ? undefined : sort }}
        end={`${rows.length} ${rows.length === 1 ? "entry" : "entries"}`}
      >
        <Tabs
          variant="pills"
          label="Status"
          current={status}
          items={STATUS.map((s) => ({ value: s, label: s === "ALL" ? "All" : s === "PUBLISHED" ? "Published" : "Drafts", href: qs({ status: s === "ALL" ? undefined : s }), count: statusCounts[s] }))}
        />
      </Toolbar>

      <div className="-mt-2 flex flex-wrap items-center gap-1.5 text-xs" aria-label="Sort">
        <span className="mr-1 font-semibold uppercase tracking-wider text-muted">Sort</span>
        {(Object.keys(SORTS) as Sort[]).map((s) => (
          <Link key={s} href={qs({ sort: s === "updated" ? undefined : s })} aria-current={s === sort ? "true" : undefined} className={`rounded-full px-2.5 py-1 font-semibold ${s === sort ? "bg-sand text-ink" : "text-muted hover:text-ink"}`}>
            {SORTS[s]}
          </Link>
        ))}
      </div>

      <Card padded={false}>
        <DataTable
          rows={rows}
          rowKey={(e) => e.id ?? `code-${e.slug}`}
          caption={info.plural}
          minWidth={820}
          columns={[
            {
              key: "title",
              header: "Title",
              cell: (e) => (
                <div className="min-w-0">
                  {e.source === "db" && e.id ? (
                    <Link href={`/dashboard/content/${e.id}`} className="font-semibold text-ink hover:text-signal-dark hover:underline">{e.title}</Link>
                  ) : (
                    <span className="font-semibold">{e.title}</span>
                  )}
                  <p className="truncate text-xs font-normal text-muted">{entryPath(type, e.slug)}</p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              cell: (e) => (
                <span className="inline-flex flex-wrap items-center gap-1">
                  <StatusPill status={e.status} />
                  {e.source === "code" && <Badge tone="muted">Built-in</Badge>}
                  {e.featured && <Badge tone="signal">Featured</Badge>}
                </span>
              ),
            },
            { key: "category", header: "Category", hideOnMobile: true, cell: (e) => <span className="text-ink/80">{e.category || "—"}</span> },
            ...(type === "POST"
              ? [{ key: "author", header: "Author", hideOnMobile: true, cell: (e: ContentArticle) => <span className="text-ink/80">{e.author ? AUTHORS[e.author]?.name ?? e.author : "—"}</span> }]
              : []),
            {
              key: "updated",
              header: "Updated",
              hideOnMobile: true,
              cell: (e) => (e.updatedAt ? <time dateTime={e.updatedAt.toISOString()} title={e.updatedAt.toLocaleString("en-US")}>{timeAgo(e.updatedAt)}</time> : <span className="text-muted">{e.date ?? "—"}</span>),
            },
            { key: "actions", header: <span className="sr-only">Actions</span>, align: "right", cell: (e) => <RowActions e={e} type={type} back={back} /> },
          ]}
          empty={
            <EmptyState
              icon={FileText}
              title={q || status !== "ALL" ? "Nothing matches" : `No ${info.plural.toLowerCase()} yet`}
              description={q || status !== "ALL" ? "Try another search or status." : builtIn ? undefined : "Write the first one in the block editor."}
              action={
                q || status !== "ALL" ? (
                  <Link href={`/dashboard/content?type=${type}`} className="btn-ghost">Clear filters</Link>
                ) : builtIn ? undefined : (
                  <Link href={newHref} className="btn-primary"><Plus aria-hidden className="h-4 w-4" /> {NEW_LABEL[type]}</Link>
                )
              }
            />
          }
        />
      </Card>

      {owner && (
        <details className="group rounded-2xl bg-white">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-sm font-semibold sm:px-5 [&::-webkit-details-marker]:hidden">
            Content source & re-import
            <span className="text-xs font-normal text-muted group-open:hidden">Owner only</span>
          </summary>
          <div className="space-y-4 p-4 sm:p-5">
            <ul className="flex flex-wrap gap-2 text-sm">
              {CONTENT_TYPES.map((t) => (
                <li key={t}>
                  <Badge tone={source[t] === "db" ? "moss" : "muted"}>{CONTENT_TYPE_INFO[t].plural}: {source[t] === "db" ? "database" : "built-in"}</Badge>
                </li>
              ))}
            </ul>
            <ActionForm action={importDefaultContentAction} submitLabel="Import built-in content" submitClass="btn-dark">
              <p className="text-sm text-muted">Copies the built-in blog posts, guides, help articles and legal pages into the editor as published entries. Entries that already exist are skipped.</p>
              <Toggle name="force" label="Overwrite entries that already exist" description="Replaces edited copies with the built-in versions. This can’t be undone." />
            </ActionForm>
          </div>
        </details>
      )}
    </div>
  );
}

function RowActions({ e, type, back }: { e: ContentArticle; type: ContentType; back: string }) {
  const live = entryPath(type, e.slug);
  if (e.source === "code" || !e.id) {
    return (
      <a href={live} target="_blank" rel="noopener" className={btn}>
        View live <ExternalLink aria-hidden className="h-3.5 w-3.5" />
      </a>
    );
  }
  const published = e.status === "PUBLISHED";
  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5">
      <Link href={`/dashboard/content/${e.id}`} className={btn}>
        <Pencil aria-hidden className="h-3.5 w-3.5" /> Edit
      </Link>
      <a href={published ? live : `${live}?preview=1`} target="_blank" rel="noopener" className={btn} aria-label={`${published ? "View live" : "Preview draft"}: ${e.title}`}>
        {published ? <ExternalLink aria-hidden className="h-3.5 w-3.5" /> : <Eye aria-hidden className="h-3.5 w-3.5" />}
        {published ? "View" : "Preview"}
      </a>
      <form action={duplicateEntryAction}>
        <input type="hidden" name="id" value={e.id} />
        <input type="hidden" name="back" value={back} />
        <button type="submit" className={btn} aria-label={`Duplicate ${e.title}`}>
          <Copy aria-hidden className="h-3.5 w-3.5" /> Duplicate
        </button>
      </form>
      <form action={setEntryStatusAction}>
        <input type="hidden" name="id" value={e.id} />
        <input type="hidden" name="back" value={back} />
        <input type="hidden" name="to" value={published ? "DRAFT" : "PUBLISHED"} />
        <button type="submit" className={published ? btn : `${btn} border-moss/40 text-moss hover:border-moss`}>
          {published ? "Unpublish" : "Publish"}
        </button>
      </form>
      <form action={deleteEntryAction}>
        <input type="hidden" name="id" value={e.id} />
        <input type="hidden" name="back" value={back} />
        <ConfirmButton prompt="Delete?" confirmLabel="Delete" className={`${btn} text-rust hover:border-rust`} confirmClassName="inline-flex h-8 items-center rounded-full bg-rust px-3 text-xs font-semibold text-white hover:bg-rust/90 disabled:opacity-60">
          <Trash2 aria-hidden className="h-3.5 w-3.5" /> Delete
        </ConfirmButton>
      </form>
    </div>
  );
}
