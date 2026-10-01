import { requestSiteUrl } from "@/lib/site-url";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AccountShell } from "../AccountNav";
import { privateMetadata } from "@/lib/seo";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";

const PER_PAGE = 20;

export const metadata = privateMetadata("Refer a business");

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser("/account/referrals");
  const where = { referredBy: u.referralCode };
  const total = await db.user.count({ where });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const referred = await db.user.findMany({
    where,
    select: { id: true, businessName: true, name: true, createdAt: true, _count: { select: { orders: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });
  const origin = await requestSiteUrl();
  const link = `${origin}/register?ref=${u.referralCode}`;
  return (
    <AccountShell active="/account/referrals" title="Refer a business">
      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl bg-ink p-5 sm:p-6 text-white">
          <p className="font-display text-2xl font-bold">Give $100, get $100</p>
          <p className="mt-1 text-sm text-white/70">When a business you refer places its first order over $1,000, you both get $100 off your next order.</p>
          <div className="mt-4 flex gap-2">
            <input readOnly value={link} className="w-full min-w-0 rounded-lg border border-white/30 bg-white/10 px-3.5 py-2.5 text-base text-white sm:text-sm" aria-label="Your referral link" />
          </div>
          <p className="mt-2 text-xs text-white/60">Your code: <span className="break-all font-mono font-bold text-white">{u.referralCode}</span></p>
        </div>
        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Your referrals ({total})</h2>
          {referred.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No referrals yet. Share your link with other resellers.</p>
          ) : (
            <ul className="mt-3 text-sm">
              {referred.map((r) => (
                <li key={r.id} className="flex justify-between gap-3 py-2">
                  <span className="min-w-0 break-words">{r.businessName ?? r.name}</span>
                  <span className={`shrink-0 ${r._count.orders ? "font-semibold text-moss" : "text-muted"}`}>{r._count.orders ? "Reward earned" : "Signed up"}</span>
                </li>
              ))}
            </ul>
          )}
          <Pager base="/account/referrals" page={page} perPage={PER_PAGE} total={total} noun="referrals" className="mt-4" />
        </div>
      </div>
    </AccountShell>
  );
}
