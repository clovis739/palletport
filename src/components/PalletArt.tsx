// Procedural pallet illustration so the site works without product photos.
// Replace with real lot photos (e.g. an images[] field on Lot) when you add photo uploads.
function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function PalletArt({ seed, hue = 24, className = "" }: { seed: string; hue?: number; className?: string }) {
  const r = hash(seed);
  const rows = 3 + Math.floor(r() * 2);
  const boxes: { x: number; y: number; w: number; h: number; l: number }[] = [];
  let y = 150;
  for (let row = 0; row < rows; row++) {
    const h = 24 + Math.floor(r() * 12);
    y -= h;
    let x = 44 + Math.floor(r() * 6);
    const end = 276 - Math.floor(r() * 10);
    while (x < end - 20) {
      const w = Math.min(end - x, 34 + Math.floor(r() * 46));
      boxes.push({ x, y, w: w - 3, h: h - 3, l: 52 + Math.floor(r() * 18) });
      x += w;
    }
  }
  return (
    <svg viewBox="0 0 320 200" className={className} role="img" aria-label="Pallet illustration">
      <rect width="320" height="200" fill={`hsl(${hue} 45% 93%)`} />
      <ellipse cx="160" cy="182" rx="130" ry="8" fill={`hsl(${hue} 30% 80%)`} />
      {boxes.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={b.y} width={b.w} height={b.h} rx="2" fill={`hsl(${hue} 38% ${b.l}%)`} />
          <rect x={b.x + b.w / 2 - 3} y={b.y} width="6" height={b.h} fill={`hsl(${hue} 30% ${b.l - 10}%)`} opacity=".5" />
        </g>
      ))}
      {/* stretch wrap sheen */}
      <rect x="40" y={y - 4} width="240" height={154 - y} rx="4" fill="white" opacity=".12" />
      {/* pallet */}
      <rect x="36" y="152" width="248" height="7" fill="#b9864f" />
      <rect x="44" y="159" width="18" height="12" fill="#9c6c3b" />
      <rect x="151" y="159" width="18" height="12" fill="#9c6c3b" />
      <rect x="258" y="159" width="18" height="12" fill="#9c6c3b" />
      <rect x="36" y="171" width="248" height="6" fill="#b9864f" />
    </svg>
  );
}
