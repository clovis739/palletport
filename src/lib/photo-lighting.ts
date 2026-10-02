import type { CSSProperties } from 'react';
import lighting from '../content/photo-lighting.json';

const corrections: Record<string, {brightness: number; contrast: number}> = lighting;

/** Subtle display correction for measured dark photos; preserve other caller styles. */
export function photoLightingStyle(src?: string, style?: CSSProperties): CSSProperties | undefined {
  const correction = src ? corrections[src] : undefined;
  if (!correction) return style;
  const filter = `brightness(${correction.brightness}) contrast(${correction.contrast})`;
  return {...style, filter: [filter, style?.filter === 'none' ? undefined : style?.filter].filter(Boolean).join(' ')};
}
