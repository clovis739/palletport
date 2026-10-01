import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LotCard } from "@/components/LotCard";
import { AccountShell } from "../AccountNav";
import { privateMetadata } from "@/lib/seo";
import { Pager, pageCount, pageParam } from "@/components/ui/Pager";

const PER_PAGE = 12;

export const metadata = privateMetadata("Saved lots");

export default async function FavoritesPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const u = await requireUser("/account/favorites");
  const total = await db.favorite.count({ where: { userId: u.id } });
  const page = pageParam((await searchParams).page, pageCount(total, PER_PAGE));
  const favorites = await db.favorite.findMany({
    where: { userId: u.id },
    include: { lot: { include: { category: true, seller: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
  });
  return (
    <AccountShell active="/account/favorites" title="Saved lots">
      <p className="mb-4 text-sm text-muted">Lots you&apos;ve saved. Buy them before they sell out.</p>
      {favorites.length === 0 ? (
        <p className="text-sm text-muted">Tap "Watch" on any lot to track it here. <Link href="/lots" className="font-semibold text-signal-dark">Browse lots</Link></p>
      ) : (
        <>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{favorites.map((f) => <LotCard key={f.id} lot={f.lot} />)}</div>
          <Pager base="/account/favorites" page={page} perPage={PER_PAGE} total={total} noun="saved lots" />
        </>
      )}
    </AccountShell>
  );
}
