import { ArrowLeftRight, Banknote, CreditCard, FileText, Landmark, Smartphone, Wallet, Zap, type LucideIcon } from "lucide-react";
import { resolveImageRef } from "@/lib/imageRef";
import type { PaymentIcon } from "@/lib/settings-schema";

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
 * Payment method mark: the uploaded logo when there is one (the provider's official acceptance mark), otherwise a
 * generic icon on a sand tile. Always decorative: the method name is shown next to it.
 */
export function PaymentMethodIcon({ icon, logo, size = "md" }: { icon: PaymentIcon; logo?: string; size?: "sm" | "md" }) {
  const box = size === "sm" ? "h-7 w-10" : "h-9 w-12";
  const img = resolveImageRef(logo);
  if (img.kind === "url") {
    return (
      <span aria-hidden className={`grid ${box} shrink-0 place-items-center overflow-hidden rounded-md bg-white p-1 ring-1 ring-line`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.src} alt="" className="max-h-full max-w-full object-contain" loading="lazy" decoding="async" />
      </span>
    );
  }
  const Icon = ICONS[icon] ?? CreditCard;
  return (
    <span aria-hidden className={`grid ${box} shrink-0 place-items-center rounded-md bg-sand text-ink`}>
      <Icon className={size === "sm" ? "h-4 w-4" : "h-5 w-5"} />
    </span>
  );
}
