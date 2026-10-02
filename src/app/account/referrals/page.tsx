import { requestSiteUrl } from "@/lib/site-url";
import { requireUser } from "@/lib/auth";
import { AccountShell } from "../AccountNav";
import { privateMetadata } from "@/lib/seo";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";
import { referralSummary, type ReferralState } from "@/lib/referrals";
import { CopyLink } from "./CopyLink";

const PER_PAGE = 20;

export const metadata = privateMetadata("Refer a business");

const STATE: Record<ReferralState, { label: string; className: string }> = {
  signed_up: { label: "Signed up · waiting for a $1,000+ order", className: "text-muted" },
  ordered: { label: "Ordered · reward unlocks once it's paid or shipped", className: "text-signal-dark" },
  earned: { label: "Reward earned · $100", className: "font-semibold text-moss" },
};

export default async function ReferralsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser("/account/referrals");
  const s = (await referralSummary(u.id))!;
  const total = s.referrals.length;
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const rows = s.referrals.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const link = `${await requestSiteUrl()}/register?ref=${encodeURIComponent(s.code)}`;
  return (
    <AccountShell active="/account/referrals" title="Refer a business">
      <div className="max-w-2xl space-y-6">
        <div className="rounded-2xl bg-ink p-5 text-white sm:p-6">
          <p className="font-display text-2xl font-bold">Give $100, get $100</p>
          <p className="mt-1 text-sm text-white/70">When a business you refer places its first order over $1,000, you both get $100 off: they save $100 on that order, and you get $100 off your next one.</p>
          <CopyLink value={link} />
          <p className="mt-2 text-xs text-white/60">Your code: <span className="break-all font-mono font-bold text-white">{s.code}</span></p>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="card p-4"><p className="font-display text-2xl font-bold tabular-nums">{total}</p><p className="text-xs text-muted">Referred</p></div>
          <div className="card p-4"><p className="font-display text-2xl font-bold tabular-nums">{s.earned}</p><p className="text-xs text-muted">Rewards earned</p></div>
          <div className="card p-4"><p className="font-display text-2xl font-bold tabular-nums text-moss">${(s.creditsAvailable * 100).toLocaleString()}</p><p className="text-xs text-muted">Ready to use</p></div>
        </div>
        {s.creditsAvailable > 0 && (
          <p className="rounded-lg bg-moss/10 p-3 text-sm text-moss">
            You have {s.creditsAvailable === 1 ? "a $100 reward" : `${s.creditsAvailable} × $100 rewards`} waiting. $100 comes off your next order automatically at checkout (one reward per order, not combined with promo codes).
          </p>
        )}
        {s.welcomeAvailable && (
          <p className="rounded-lg bg-sand p-3 text-sm">You were referred by another business: $100 comes off your first order of $1,000 or more, automatically at checkout.</p>
        )}

        <div className="card p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold">Your referrals ({total})</h2>
          {rows.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No referrals yet. Share your link with other resellers. They need to create their account through it.</p>
          ) : (
            <ul className="mt-3 text-sm">
              {rows.map((r) => (
                <li key={r.id} className="flex flex-wrap justify-between gap-x-3 gap-y-0.5 py-2">
                  <span className="min-w-0 break-words font-medium">{r.name}</span>
                  <span className={`text-xs sm:text-sm ${STATE[r.state].className}`}>{STATE[r.state].label}</span>
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
