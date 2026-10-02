import { mkdirSync, writeFileSync } from 'node:fs';
import { db } from '../src/lib/db';
import { buildMerchantFeed } from '../src/lib/merchant-feed';
async function main() {
  const base = process.env.APP_URL;
  if (!base || new URL(base).protocol !== 'https:' || /localhost|127\.0\.0\.1/.test(new URL(base).hostname)) throw new Error('Set APP_URL to the public HTTPS store domain before exporting');
  const [lots, business] = await Promise.all([
    db.lot.findMany({where:{status:'ACTIVE',available:{gt:0}},include:{category:{select:{name:true}},subcategory:{select:{name:true}}},orderBy:[{createdAt:'desc'},{id:'desc'}]}),
    db.siteSetting.findUnique({where:{key:'business'}}),
  ]);
  const feed = buildMerchantFeed(lots, base, business ? JSON.parse(business.value).name : 'PalletPort');
  mkdirSync('docs', {recursive:true});
  writeFileSync('docs/merchant-feed.xml',feed.body);
  writeFileSync('docs/MERCHANT-FEED-REPORT.json',JSON.stringify({generatedAt:new Date().toISOString(),listed:feed.listed,skipped:feed.skipped,omitted:feed.omitted},null,2)+'\n');
  console.log(JSON.stringify({file:'docs/merchant-feed.xml',feedUrl:`${new URL(base).origin}/merchant-feed.xml`,listed:feed.listed,skipped:feed.skipped},null,2));
}
main().catch(error=>{console.error(error?.code??error.message);process.exitCode=1}).finally(()=>db.$disconnect());
