import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { BadgeCheck, CheckCheck, Inbox as InboxIcon, Mail, RotateCcw } from "lucide-react";
import { requireStaff } from "@/lib/auth";
import { db } from "@/lib/db";
import { timeAgo } from "@/lib/format";
import { can } from "@/lib/permissions";
import { getSetting } from "@/lib/settings";
import { parsePage, qs } from "@/lib/commerce";
import { reviewCertificate, setInquiryHandled } from "@/app/actions/admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { Card } from "@/components/admin/Card";
import { Tabs } from "@/components/admin/Tabs";
import { EmptyState } from "@/components/admin/EmptyState";
import { Badge, StatusPill } from "@/components/admin/Badge";
import { CopyButton } from "@/components/admin/CopyButton";
import { Pagination } from "@/components/admin/ListControls";
import { SubmitButton } from "@/components/SubmitButton";

export const metadata = { title: "Inbox" };

const BASE = "/dashboard/inbox";
const PER_PAGE = 30;
const TOPICS: Record<string, string> = {
  CONTACT: "Contact",
  NEWSLETTER: "Newsletter",
  PRO: "Pro program",
  VOLUME: "Volume buying",
  AFFILIATE: "Affiliate",
  EVENTS: "Events",
  INTEGRATIONS: "Integrations",
};
type SP = Record<string, string | undefined>;

export default async function InboxPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const { user } = await requireStaff("inbox", BASE);
  const tab = sp.tab === "messages" ? "messages" : sp.tab === "certs" ? "certs" : "";
  const [pendingCount, openCount] = await Promise.all([db.user.count({ where: { certStatus: "PENDING" } }), db.inquiry.count({ where: { handled: false } })]);
  // Default tab: whichever has work waiting (certificates first).
  const active = tab || (pendingCount || !openCount ? "certs" : "messages");

  return (
    <>
      <PageHeader title="Inbox" description="Resale certificates waiting for review and messages from the contact and program forms." />
      <Tabs
        className="mb-6"
        label="Inbox sections"
        current={active}
        items={[
          { value: "certs", label: "Resale certificates", href: `${BASE}?tab=certs`, count: pendingCount },
          { value: "messages", label: "Messages", href: `${BASE}?tab=messages`, count: openCount },
        ]}
      />
      {active === "certs" ? <Certificates canCustomers={can(user.role, "customers")} /> : <Messages sp={sp} />}
    </>
  );
}

async function Certificates({ canCustomers }: { canCustomers: boolean }) {
  const [pending, recent] = await Promise.all([
    db.user.findMany({ where: { certStatus: "PENDING" }, orderBy: { createdAt: "asc" }, take: 100 }),
    db.auditLog.findMany({ where: { action: { in: ["customer.certificate", "inbox.certificate"] } }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);
  return (
    <div className="space-y-6">
      <Card title={`Waiting for review (${pending.length})`} description="Approving unlocks Net 30 terms and the verified badge. Add a note to explain a rejection." padded={false}>
        {pending.length === 0 ? (
          <EmptyState icon={BadgeCheck} compact title="Nothing to review" description="New certificate submissions will appear here." />
        ) : (
          <ul >
            {pending.map((u) => (
              <li key={u.id} className="grid gap-3 p-4 sm:px-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:items-start">
                <div className="min-w-0">
                  <p className="break-words font-semibold">
                    {canCustomers ? <Link href={`/dashboard/customers/${u.id}`} className="hover:underline">{u.businessName ?? u.name}</Link> : u.businessName ?? u.name}
                  </p>
                  <p className="flex items-center gap-1 break-all text-xs text-muted">{u.email}<CopyButton text={u.email} label="Copy email" /></p>
                  <p className="mt-1 text-xs text-muted">{u.businessType ?? "Business type not given"} · joined {timeAgo(u.createdAt)}</p>
                  <p className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg bg-sand/60 px-3 py-1.5 text-sm">
                    <span className="text-xs text-muted">Certificate</span>
                    <span className="break-all font-mono font-semibold">{u.certState ?? "—"} · {u.certNumber ?? "—"}</span>
                  </p>
                </div>
                <form action={reviewCertificate} className="space-y-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <label htmlFor={`note-${u.id}`} className="sr-only">Note for {u.email}</label>
                  <input id={`note-${u.id}`} name="note" maxLength={500} placeholder="Note (optional, e.g. reason for rejection)" className="input py-2 text-sm" />
                  <div className="flex flex-wrap gap-2">
                    <button type="submit" name="status" value="APPROVED" className="btn-dark py-1.5 text-xs">Approve</button>
                    <button type="submit" name="status" value="REJECTED" className="btn-ghost py-1.5 text-xs text-rust">Reject</button>
                  </div>
                </form>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {recent.length > 0 && (
        <Card title="Recently reviewed" padded={false}>
          <ul className="text-sm">
            {recent.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 sm:px-5">
                <StatusPill status={r.detail.startsWith("APPROVED") ? "APPROVED" : "REJECTED"} />
                <span className="min-w-0 flex-1 truncate">{r.target}</span>
                <span className="text-xs text-muted">{r.userEmail} · {timeAgo(r.createdAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

async function Messages({ sp }: { sp: SP }) {
  const topic = TOPICS[sp.topic ?? ""] ? sp.topic! : "";
  const status = sp.status === "handled" || sp.status === "all" ? sp.status : "open";
  const page = parsePage(sp.page);
  const where: Prisma.InquiryWhereInput = {
    ...(topic ? { topic } : {}),
    ...(status === "open" ? { handled: false } : status === "handled" ? { handled: true } : {}),
  };
  const [total, rows, byTopic, biz] = await Promise.all([
    db.inquiry.count({ where }),
    db.inquiry.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PER_PAGE, take: PER_PAGE }),
    db.inquiry.groupBy({ by: ["topic"], where: status === "open" ? { handled: false } : status === "handled" ? { handled: true } : {}, _count: { _all: true } }),
    getSetting("business"),
  ]);
  const tc = (t: string) => byTopic.find((b) => b.topic === t)?._count._all ?? 0;
  const params = { tab: "messages", topic, status: status === "open" ? "" : status };
  const topicHref = (t: string) => `${BASE}${qs({ ...params, topic: t })}`;
  const statusHref = (s: string) => `${BASE}${qs({ ...params, status: s === "open" ? "" : s })}`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="pills"
          label="Topic"
          current={topic || "ALL"}
          items={[
            { value: "ALL", label: "All topics", href: topicHref(""), count: byTopic.reduce((a, b) => a + b._count._all, 0) },
            ...Object.entries(TOPICS).filter(([k]) => tc(k) > 0 || k === topic).map(([k, v]) => ({ value: k, label: v, href: topicHref(k), count: tc(k) })),
          ]}
        />
        <Tabs
          variant="pills"
          label="Status"
          current={status}
          items={[
            { value: "open", label: "Open", href: statusHref("open") },
            { value: "handled", label: "Handled", href: statusHref("handled") },
            { value: "all", label: "All", href: statusHref("all") },
          ]}
        />
      </div>
      <Card padded={false}>
        {rows.length === 0 ? (
          <EmptyState icon={InboxIcon} compact title={status === "open" ? "Inbox zero" : "No messages here"} description={status === "open" ? "Contact, newsletter and program requests will appear here." : undefined} />
        ) : (
          <ul >
            {rows.map((m) => {
              const subject = `Re: your ${biz.name} ${TOPICS[m.topic]?.toLowerCase() ?? "message"}${m.topic === "CONTACT" ? "" : " request"}`;
              const quoted = m.body ? `\n\n---\n${m.name || m.email} wrote:\n${m.body.slice(0, 1500)}` : "";
              const mailto = `mailto:${m.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`Hi ${m.name.split(" ")[0] || "there"},\n\n${quoted}`)}`;
              return (
                <li key={m.id} className={`p-4 sm:px-5 ${m.handled ? "bg-sand/20" : ""}`}>
                  <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
                    <Badge tone={m.topic === "CONTACT" ? "signal" : m.topic === "NEWSLETTER" ? "muted" : "ink"}>{TOPICS[m.topic] ?? m.topic}</Badge>
                    <div className="min-w-0 flex-1 basis-60">
                      <p className="break-words font-semibold">
                        {m.name || m.email}
                        {m.company && <span className="font-normal text-muted"> · {m.company}</span>}
                        {m.handled && <Badge tone="moss" className="ml-2 align-middle">Handled</Badge>}
                      </p>
                      <p className="flex flex-wrap items-center gap-1 text-xs text-muted">
                        <span className="break-all">{m.email}</span>
                        <CopyButton text={m.email} label="Copy email" />
                        <span>· <time dateTime={m.createdAt.toISOString()} title={m.createdAt.toLocaleString()}>{timeAgo(m.createdAt)}</time></span>
                      </p>
                      {m.body && <p className="mt-2 whitespace-pre-wrap break-words text-sm">{m.body}</p>}
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {m.topic !== "NEWSLETTER" && (
                        <a href={mailto} className="btn-ghost py-1.5 text-xs"><Mail aria-hidden className="h-3.5 w-3.5" /> Reply</a>
                      )}
                      <form action={setInquiryHandled}>
                        <input type="hidden" name="id" value={m.id} />
                        <input type="hidden" name="handled" value={m.handled ? "0" : "1"} />
                        <SubmitButton className={m.handled ? "btn-ghost py-1.5 text-xs" : "btn-dark py-1.5 text-xs"} pendingText="…">
                          {m.handled ? <><RotateCcw aria-hidden className="h-3.5 w-3.5" /> Reopen</> : <><CheckCheck aria-hidden className="h-3.5 w-3.5" /> Mark handled</>}
                        </SubmitButton>
                      </form>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <Pagination base={BASE} params={params} page={page} perPage={PER_PAGE} total={total} />
      </Card>
      <p className="mt-3 text-xs text-muted">“Reply” opens your email app with the message quoted. There&apos;s no email service in the site yet, so replies are sent from your own mailbox.</p>
    </>
  );
}
