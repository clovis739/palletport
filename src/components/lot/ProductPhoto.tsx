import type { ImgHTMLAttributes } from "react";

/** Consistent site branding on every displayed product photo. */
export function ProductPhoto({ className = "", ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <span className={`product-photo relative block overflow-hidden ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img {...props} className="block h-full w-full object-cover" />
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 flex select-none items-center justify-center">
        <svg viewBox="0 0 600 400" className="h-full w-full" focusable="false">
          <text x="300" y="210" textAnchor="middle" transform="rotate(-24 300 200)" fill="white" fillOpacity="0.42" stroke="black" strokeOpacity="0.22" strokeWidth="1.5" paintOrder="stroke" fontFamily="Arial, sans-serif" fontSize="70" fontWeight="700">PalletPort</text>
        </svg>
      </span>
    </span>
  );
}
