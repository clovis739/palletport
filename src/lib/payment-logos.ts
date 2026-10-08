import { resolveImageRef } from './imageRef';

export const PAYMENT_BRAND_LOGOS: Record<string, string[]> = {
  CARD: ['/images/payments/visa.svg', '/images/payments/mastercard.svg'],
  ZELLE: ['/images/payments/zelle.png'],
  APPLE_PAY: ['/images/payments/apple-pay.svg'],
  CHIME: ['/images/payments/chime.svg'],
};

export function paymentLogoSources(methodId: string, customLogo?: string, email = false) {
  const custom = resolveImageRef(customLogo);
  if (custom.kind === 'url') return [custom.src];
  return (PAYMENT_BRAND_LOGOS[methodId.toUpperCase()] ?? []).map(src => email ? src.replace(/\.svg$/, '.png') : src);
}
