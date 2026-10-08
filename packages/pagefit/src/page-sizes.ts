import type { PageSize } from './types.js';

const CSS_PX_PER_MM = 96 / 25.4;

export const mmToPx = (mm: number): number => mm * CSS_PX_PER_MM;

export const ptToPx = (pt: number): number => (pt * 96) / 72;

const fromMm = (widthMm: number, heightMm: number): PageSize => ({
  width: Math.round(mmToPx(widthMm)),
  height: Math.round(mmToPx(heightMm)),
});

export const PAGE_SIZES = {
  A4: fromMm(210, 297),
  A5: fromMm(148, 210),
  Letter: { width: 816, height: 1056 },
  Legal: { width: 816, height: 1344 },
} as const satisfies Record<string, PageSize>;

export type PageSizeName = keyof typeof PAGE_SIZES;
