import type { Lot } from '@prisma/client';
import { CONDITIONS, LOT_SIZES } from './format';
import { isLotPhotoUrl } from './mediaUrls';
import sourcePhotos from '../content/source-photos.json';
import { cleanProductPhotos } from './product-photos';

type MerchantLot = Pick<Lot, 'sku' | 'slug' | 'title' | 'description' | 'images' | 'status' | 'available' | 'priceCents' | 'condition' | 'sourceCondition' | 'externalSku' | 'externalUrl' | 'brand' | 'lotSize' | 'weightLbs'> & { compareAtPriceCents?: number; category?: { name: string } | null; subcategory?: { name: string } | null };
const cachedPhotos = new Map(sourcePhotos.map(p => [p.sourceUrl, p.src]));
const googleCondition: Record<string, string> = { NEW: 'new', SHELF_PULL: 'new', CUSTOMER_RETURN: 'used', MIXED: 'used', SALVAGE: 'used' };
const xml = (value: string) => value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const plain = (value: string, limit: number) => value.replace(/<[^>]+>/g, ' ').replace(/[*_#>`]+/g, '').replace(/\s+/g, ' ').trim().slice(0, limit);

/** Assigned product galleries only; category fallback photography is never exported. */
function productPhoto(url: string, externalUrl: string | null) {
  if (isLotPhotoUrl(url) || /^\/images\/products\/(?:clean-)?[a-f0-9]{16}\.(?:webp|png)$/i.test(url)) return true;
  try {
    const image = new URL(url), product = new URL(externalUrl ?? '');
    return image.protocol === 'https:' && product.protocol === 'https:' && image.hostname === product.hostname && (
      image.hostname === 'jaxwholesaleliquidation.com' && image.pathname.startsWith('/media/product-images/') ||
      ['goldstackliquidation.com', 'usapalletliquidators.com'].includes(image.hostname) && image.pathname.startsWith('/wp-content/uploads/')
    );
  } catch { return false; }
}

export function buildMerchantFeed(lots: MerchantLot[], siteUrl: string, storeName = 'PalletPort') {
  const base = new URL(siteUrl).origin;
  const items: string[] = [];
  const omitted: { sku: string; reason: string }[] = [];
  let skipped = 0;
  for (const lot of lots) {
    if (lot.status !== 'ACTIVE' || lot.available <= 0) continue;
    const photos = [...new Set(cleanProductPhotos(lot.images).filter(p => productPhoto(p, lot.externalUrl)).map(p => new URL(cachedPhotos.get(p) ?? p, base).href))];
    if (!photos.length || !lot.sku || !lot.title.trim() || !lot.description.trim() || lot.priceCents <= 0) {
      skipped++;
      omitted.push({sku:lot.sku,reason:!photos.length?'missing_product_photo':'incomplete_product_data'});
      continue;
    }
    const size = LOT_SIZES[lot.lotSize]?.label ?? lot.lotSize;
    const condition = lot.sourceCondition || CONDITIONS[lot.condition]?.label || lot.condition;
    const description = plain(lot.description, 5000);
    const structured = /^(GS|LS|USA)-/.test(lot.externalSku ?? '');
    const onSale = (lot.compareAtPriceCents ?? 0) > lot.priceCents;
    const fields: [string, string | undefined][] = [
      ['g:id', lot.sku], ['g:title', plain(lot.title, 150)], ['g:description', structured ? undefined : description],
      ['g:link', `${base}/lots/${encodeURIComponent(lot.slug)}`], ['g:image_link', photos[0]],
      ['g:availability', 'in_stock'], ['g:price', `${((onSale ? lot.compareAtPriceCents! : lot.priceCents) / 100).toFixed(2)} USD`],
      ['g:sale_price', onSale ? `${(lot.priceCents / 100).toFixed(2)} USD` : undefined],
      ['g:condition', googleCondition[lot.condition] ?? 'used'], ['g:brand', lot.brand || undefined], ['g:identifier_exists', 'no'],
      ['g:product_type', [lot.category?.name, lot.subcategory?.name].filter(Boolean).join(' > ') || undefined],
      ['g:shipping_weight', lot.weightLbs > 0 && lot.weightLbs <= 2000 ? `${lot.weightLbs} lb` : undefined],
      ['g:shipping_label', lot.lotSize === 'CASE' ? 'case_pack' : lot.lotSize === 'TRUCKLOAD' ? 'truckload' : 'pallet'],
      ['g:custom_label_0', size], ['g:custom_label_1', condition.slice(0, 100)],
    ];
    items.push([
      '<item>', ...fields.filter(([,value]) => value).map(([key,value]) => `<${key}>${xml(value!)}</${key}>`),
      ...(structured ? [`<g:structured_description><g:digital_source_type>trained_algorithmic_media</g:digital_source_type><g:content>${xml(description)}</g:content></g:structured_description>`] : []),
      ...photos.slice(1,11).map(p => `<g:additional_image_link>${xml(p)}</g:additional_image_link>`), '</item>',
    ].join(''));
  }
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n<channel>\n<title>${xml(storeName)} liquidation lots</title>\n<link>${xml(base)}</link>\n<description>In-stock liquidation pallets, truckloads and case packs. ${items.length} products listed.</description>\n${items.join('\n')}\n</channel>\n</rss>`;
  return { body, listed: items.length, skipped, omitted };
}
