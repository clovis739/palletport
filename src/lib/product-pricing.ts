import { z } from 'zod';

export const productPriceFields = {
  price: z.coerce.number().finite().min(0.01, 'Enter a sale price of at least $0.01').max(21_474_836.47),
  originalPrice: z.coerce.number().finite().nonnegative().max(21_474_836.47).optional().default(0),
};
export function salePriceCents(original: number, discountPercent = 35) {
  if (!Number.isSafeInteger(original) || original <= 0 || discountPercent <= 0 || discountPercent >= 100) throw new Error('Invalid discount');
  return Math.max(1, Math.round(original * (100 - discountPercent) / 100));
}

/** Keep embedded FOB text consistent with the editable structured product address. */
export function updateProductFob(text: string, address: string, previousAddress?: string) {
  const replaced = previousAddress ? text.split(previousAddress).join(address) : text;
  return replaced.replace(/(^|\n)(FOB(?: location)?\s*:)\s*[^\n]*/gi, (_, prefix: string) => `${prefix}FOB: ${address}`);
}
