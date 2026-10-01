import { lotCover } from "@/lib/lotImages";
import { ProductPhoto } from "./ProductPhoto";

/** Small lot image for cart and order lists. */
export function LotThumb({ lot, className = "" }: { lot: { slug: string; title: string; images?: string | null; category?: { slug?: string } | null }; className?: string }) {
  const c = lotCover(lot, 240, 4 / 3);
  // eslint-disable-next-line @next/next/no-img-element
  return <ProductPhoto src={c.src} alt={c.alt} width={240} height={180} loading="lazy" decoding="async" className={`aspect-[4/3] w-full bg-sand object-cover ${className}`} />;
}
