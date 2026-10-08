import { describe, expect, it } from 'vitest';

import { paginateBlocks } from '../paginate.js';
import type { MeasuredBlock } from '../types.js';

const block = (
  height: number,
  opts: Partial<Omit<MeasuredBlock, 'height'>> = {},
): MeasuredBlock => ({
  height,
  spaceBefore: opts.spaceBefore ?? 0,
  keepWithNext: opts.keepWithNext ?? false,
});

describe('paginateBlocks', () => {
  it('keeps everything on one page when it fits', () => {
    expect(paginateBlocks([block(40), block(40), block(20)], 100)).toEqual([[0, 1, 2]]);
  });

  it('breaks before a block that would overflow, never splitting it', () => {
    expect(paginateBlocks([block(60), block(30), block(30)], 100)).toEqual([[0, 1], [2]]);
  });

  it('drops spaceBefore for the first block on a page', () => {
    const pages = paginateBlocks(
      [block(50), block(40, { spaceBefore: 10 }), block(95, { spaceBefore: 10 })],
      100,
    );
    expect(pages).toEqual([[0, 1], [2]]);
  });

  it('moves a heading to the next page together with its first item', () => {
    const pages = paginateBlocks([block(80), block(10, { keepWithNext: true }), block(30)], 100);
    expect(pages).toEqual([[0], [1, 2]]);
  });

  it('follows chained keepWithNext blocks', () => {
    const pages = paginateBlocks(
      [block(60), block(10, { keepWithNext: true }), block(20, { keepWithNext: true }), block(20)],
      100,
    );
    expect(pages).toEqual([[0], [1, 2, 3]]);
  });

  it('flows a keep-together group that cannot fit on any page', () => {
    const pages = paginateBlocks([block(50), block(30, { keepWithNext: true }), block(90)], 100);
    expect(pages).toEqual([[0, 1], [2]]);
  });

  it('gives an oversized block its own page', () => {
    expect(paginateBlocks([block(20), block(150), block(20)], 100)).toEqual([[0], [1], [2]]);
  });

  it('tolerates sub-pixel rounding', () => {
    expect(paginateBlocks([block(50.4), block(50.4)], 100)).toEqual([[0, 1]]);
  });

  it('returns no pages for no blocks', () => {
    expect(paginateBlocks([], 100)).toEqual([]);
  });
});
