"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { LotImage } from "@/lib/lotImages";
import { ProductPhoto } from "./ProductPhoto";

export function LotGallery({ images, badge }: { images: LotImage[]; badge?: React.ReactNode }) {
  const [active, setActive] = useState(0);
  const n = images.length;
  const img = images[active];
  return (
    <div className="space-y-3">
      <div className="card relative overflow-hidden bg-sand">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <ProductPhoto
          src={img.src}
          alt={img.alt}
          width={1200}
          height={750}
          loading="eager"
          fetchPriority={active === 0 ? "high" : undefined}
          className="aspect-[16/10] w-full object-cover"
        />
        {badge && <div className="absolute left-3 top-3 flex gap-1.5">{badge}</div>}
        {img.stock && <span className="absolute bottom-3 left-3 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-semibold text-white">Representative image</span>}
        {n > 1 && (
          <>
            <span className="absolute bottom-3 right-3 rounded-md bg-ink/80 px-2 py-1 text-[11px] font-semibold text-white">{active + 1} / {n}</span>
            <button type="button" aria-label="Previous photo" onClick={() => setActive((a) => (a - 1 + n) % n)} className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 hover:bg-white"><ChevronLeft aria-hidden className="h-5 w-5" /></button>
            <button type="button" aria-label="Next photo" onClick={() => setActive((a) => (a + 1) % n)} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 hover:bg-white"><ChevronRight aria-hidden className="h-5 w-5" /></button>
          </>
        )}
      </div>
      {n > 1 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {images.map((im, i) => (
            <button key={im.src} type="button" onClick={() => setActive(i)} aria-label={`Show photo ${i + 1}`} className={`overflow-hidden rounded-lg border-2 ${i === active ? "border-signal" : "border-transparent opacity-70 hover:opacity-100"}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <ProductPhoto src={im.src} alt="" width={160} height={120} loading="lazy" decoding="async" className="aspect-[4/3] w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
