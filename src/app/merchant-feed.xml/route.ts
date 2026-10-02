import { db } from '@/lib/db';
import { buildMerchantFeed } from '@/lib/merchant-feed';
import { requestSiteUrl } from '@/lib/site-url';
import { getSettings } from '@/lib/settings';

/** Scheduled-fetch RSS feed. Shipping rates and tax remain configured in Merchant Center. */
export const dynamic = 'force-dynamic';

export async function GET() {
  const [base, settings, lots] = await Promise.all([
    requestSiteUrl(), getSettings(),
    db.lot.findMany({
      where: { status: 'ACTIVE', available: { gt: 0 } },
      include: { category: { select: { name: true } }, subcategory: { select: { name: true } } },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    }),
  ]);
  const { body } = buildMerchantFeed(lots, base, settings.business.name);
  return new Response(body, { headers: {
    'Content-Type': 'application/xml; charset=utf-8',
    'Cache-Control': 'public, max-age=0, s-maxage=300, stale-while-revalidate=300',
    'X-Robots-Tag': 'noindex',
  } });
}
