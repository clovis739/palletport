"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

/**
 * Floating "Chat on WhatsApp" button (bottom-left on every storefront page). Opens WhatsApp with a short,
 * pre-filled message that includes the page the buyer is looking at. The number comes from
 * Admin → Site settings → Business profile → WhatsApp; nothing renders when it's empty. Hidden inside the admin.
 */
export function WhatsAppButton({ number, businessName }: { number: string; businessName: string }) {
  const pathname = usePathname();
  const [href, setHref] = useState(`https://wa.me/${number}`);

  useEffect(() => {
    const title = document.title.split(" · ")[0];
    const text = `Hi ${businessName}, I have a question about: ${title}\n${window.location.href}`;
    setHref(`https://wa.me/${number}?text=${encodeURIComponent(text)}`);
  }, [pathname, number, businessName]);

  if (!number || pathname.startsWith("/dashboard")) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with ${businessName} on WhatsApp (opens WhatsApp)`}
      className="group fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-[60] inline-flex h-14 items-center gap-2 rounded-full bg-signal pl-4 pr-4 text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-signal-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal motion-reduce:transition-none sm:bottom-6 sm:left-6"
    >
      <MessageCircle aria-hidden className="h-6 w-6 shrink-0" strokeWidth={2} />
      <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-semibold transition-[max-width] duration-300 group-hover:max-w-40 group-focus-visible:max-w-40 motion-reduce:transition-none sm:max-w-40">
        Chat on WhatsApp
      </span>
    </a>
  );
}
