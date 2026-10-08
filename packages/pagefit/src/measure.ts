import { PAGEFIT_ATTR } from './attributes.js';
import { paginateBlocks } from './paginate.js';
import type { BlockSpec, ColumnLayout, LineRange, MeasuredBlock, PlacedBlock } from './types.js';

const findTextNode = (el: Element, text: string): Node | null => {
  const walker = el.ownerDocument.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && node.textContent !== text) node = walker.nextNode();
  return node;
};

export const readLineStarts = (el: Element, text: string): number[] => {
  const node = findTextNode(el, text);
  if (!node) return [0];

  const range = el.ownerDocument.createRange();
  if (typeof range.getClientRects !== 'function') return [0];
  const starts = [0];
  let lineTop: number | null = null;
  for (let i = 0; i < text.length; i++) {
    if (/\s/.test(text[i])) continue;
    range.setStart(node, i);
    range.setEnd(node, i + 1);
    const rect = range.getClientRects()[0];
    if (!rect) continue;
    if (lineTop === null) {
      lineTop = rect.top;
    } else if (rect.top > lineTop + rect.height / 2) {
      starts.push(i);
      lineTop = rect.top;
    }
  }
  return starts;
};

export const sliceLines = (text: string, starts: number[], [from, to]: LineRange): string =>
  text.slice(starts[from], starts[to + 1] ?? text.length).trim();

const coverOverhangs = (
  nodes: Element[],
  blocks: BlockSpec[],
  measured: MeasuredBlock[],
): Record<string, number> => {
  const padBottom: Record<string, number> = {};
  blocks.forEach((block, i) => {
    const overhangEl = nodes[i].querySelector(`[${PAGEFIT_ATTR.overhang}]`);
    if (!overhangEl) return;
    let remaining =
      overhangEl.getBoundingClientRect().bottom - nodes[i].getBoundingClientRect().bottom;
    let last = i;
    while (remaining > 0 && last + 1 < blocks.length && blocks[last + 1].group === block.group) {
      measured[last].keepWithNext = true;
      last++;
      remaining -= measured[last].height;
    }
    if (remaining > 0) {
      const pad = Math.ceil(remaining);
      padBottom[blocks[last].key] = pad;
      measured[last].height += pad;
    }
  });
  return padBottom;
};

const lineItemKeepsWithNext = (line: number, count: number, blockKeeps: boolean): boolean =>
  line === count - 1 ? blockKeeps : line === 0 || line === count - 2;

type Items = { items: PlacedBlock[]; sizes: MeasuredBlock[]; lineStarts: Record<string, number[]> };

const expandSplitBlocks = (
  nodes: Element[],
  blocks: BlockSpec[],
  measured: MeasuredBlock[],
): Items => {
  const result: Items = { items: [], sizes: [], lineStarts: {} };
  blocks.forEach((block, i) => {
    const starts = block.splitText ? readLineStarts(nodes[i], block.splitText) : null;
    if (!starts || starts.length < 2) {
      result.items.push({ index: i });
      result.sizes.push(measured[i]);
      return;
    }
    result.lineStarts[block.key] = starts;
    const lineHeight = measured[i].height / starts.length;
    for (let line = 0; line < starts.length; line++) {
      result.items.push({ index: i, lines: [line, line] });
      result.sizes.push({
        height: lineHeight,
        spaceBefore: line === 0 ? measured[i].spaceBefore : 0,
        keepWithNext: lineItemKeepsWithNext(line, starts.length, measured[i].keepWithNext),
      });
    }
  });
  return result;
};

const mergeLines = (items: PlacedBlock[], itemIndices: number[]): PlacedBlock[] =>
  itemIndices.reduce<PlacedBlock[]>((placed, itemIndex) => {
    const item = items[itemIndex];
    const prev = placed[placed.length - 1];
    if (item.lines && prev?.lines && prev.index === item.index) {
      prev.lines = [prev.lines[0], item.lines[1]];
    } else {
      placed.push(item.lines ? { index: item.index, lines: [...item.lines] } : item);
    }
    return placed;
  }, []);

export const layoutColumn = (
  column: Element | null,
  blocks: BlockSpec[],
  contentHeight: number,
): ColumnLayout | null => {
  if (!column) return null;
  const nodes = Array.from(column.querySelectorAll(`:scope > [${PAGEFIT_ATTR.block}]`));
  if (nodes.length !== blocks.length) return null;

  const measured: MeasuredBlock[] = blocks.map((block, i) => ({
    height: nodes[i].getBoundingClientRect().height,
    spaceBefore: block.spaceBefore ?? 0,
    keepWithNext: block.keepWithNext ?? false,
  }));
  const padBottom = coverOverhangs(nodes, blocks, measured);
  const { items, sizes, lineStarts } = expandSplitBlocks(nodes, blocks, measured);
  const pages = paginateBlocks(sizes, contentHeight).map((indices) => mergeLines(items, indices));
  return { pages, padBottom, lineStarts };
};
