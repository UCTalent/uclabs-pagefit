import type { MeasuredBlock } from './types.js';

const EPSILON_PX = 1;

const costAt = (block: MeasuredBlock, isFirstOnPage: boolean): number =>
  block.height + (isFirstOnPage ? 0 : block.spaceBefore);

const chainEnd = (blocks: MeasuredBlock[], start: number): number => {
  let end = start;
  while (end < blocks.length - 1 && blocks[end].keepWithNext) end++;
  return end;
};

const freshPageCost = (blocks: MeasuredBlock[], start: number, end: number): number => {
  let cost = costAt(blocks[start], true);
  for (let j = start + 1; j <= end; j++) cost += costAt(blocks[j], false);
  return cost;
};

export const paginateBlocks = (blocks: MeasuredBlock[], pageHeight: number): number[][] => {
  const limit = pageHeight + EPSILON_PX;
  const pages: number[][] = [];
  let current: number[] = [];
  let used = 0;

  const breakPage = () => {
    pages.push(current);
    current = [];
    used = 0;
  };

  let i = 0;
  while (i < blocks.length) {
    const end = chainEnd(blocks, i);
    const groupCost = freshPageCost(blocks, i, end);
    const overflows = used + blocks[i].spaceBefore + groupCost > limit;
    if (current.length > 0 && overflows && groupCost <= limit) breakPage();

    for (let j = i; j <= end; j++) {
      if (current.length > 0 && used + costAt(blocks[j], false) > limit) breakPage();
      used += costAt(blocks[j], current.length === 0);
      current.push(j);
    }
    i = end + 1;
  }

  if (current.length > 0) pages.push(current);
  return pages;
};
