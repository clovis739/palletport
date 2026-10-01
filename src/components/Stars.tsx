import { Star } from "lucide-react";

export function Stars({ value, className = "", size = "h-3.5 w-3.5" }: { value: number; className?: string; size?: string }) {
  const full = Math.round(value);
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} aria-hidden className={`${size} ${i <= full ? "fill-signal text-signal" : "fill-line text-line"}`} />
      ))}
    </span>
  );
}
