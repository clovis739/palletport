import { ArrowLeftRight, Banknote, CreditCard, FileText, Landmark, Smartphone, Wallet, Zap, type LucideIcon } from "lucide-react";
import { resolveImageRef } from "@/lib/imageRef";
import type { PaymentIcon } from "@/lib/settings-schema";
import { PAYMENT_BRAND_LOGOS } from "@/lib/payment-logos";

const ICONS: Record<PaymentIcon, LucideIcon> = {
  card: CreditCard,
  bank: Landmark,
  transfer: ArrowLeftRight,
  phone: Smartphone,
  wallet: Wallet,
  cash: Banknote,
  invoice: FileText,
  zap: Zap,
};
export const PAYMENT_ICON_LABEL: Record<PaymentIcon, string> = {
  card: "Card",
  bank: "Bank",
  transfer: "Transfer",
  phone: "Phone",
  wallet: "Wallet",
  cash: "Cash",
  invoice: "Invoice",
  zap: "Instant",
};

/**
 * Admin uploads override built-in payment brand marks. Unbranded methods use a generic icon.
 * Always decorative: the method name is shown next to it.
 */
export function PaymentMethodIcon({ icon, logo, methodId, size = "md" }: { icon: PaymentIcon; logo?: string; methodId?: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-8 w-14" : "h-10 w-16";
  const img = resolveImageRef(logo);
  const id = methodId?.toUpperCase() ?? "";
  const src = img.kind === "url" ? img.src : id !== "CARD" ? PAYMENT_BRAND_LOGOS[id]?.[0] : undefined;
  if (src) {
    return (
      <span aria-hidden className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-md ${id === "ZELLE" && img.kind !== "url" ? "bg-[#6d1ed4]" : "bg-white"} p-1.5 ring-1 ring-line`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="max-h-full max-w-full object-contain" decoding="async" />
      </span>
    );
  }
  if (id === "CARD") return (
    <span aria-hidden className={`flex ${size === "sm" ? "h-8 w-14" : "h-10 w-16"} shrink-0 items-center justify-center gap-1 rounded-md bg-white p-1 ring-1 ring-line`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/payments/visa.svg" alt="" className="w-6 object-contain" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/images/payments/mastercard.svg" alt="" className="w-5 object-contain" />
    </span>
  );
  const Icon = ICONS[icon] ?? CreditCard;
  return (
    <span aria-hidden className={`grid ${box} shrink-0 place-items-center rounded-md bg-sand text-ink`}>
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}
