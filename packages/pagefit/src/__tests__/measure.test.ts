import { afterEach, describe, expect, it, vi } from 'vitest';

import { PAGEFIT_ATTR } from '../attributes.js';
import { layoutColumn, sliceLines } from '../measure.js';
import { PAGE_SIZES } from '../page-sizes.js';
import type { BlockSpec } from '../types.js';

type FakeBlock = { spec: BlockSpec; top: number; height: number; overhangBottom?: number };

const rect = (top: number, height: number) =>
  ({ top, bottom: top + height, height, left: 0, right: 100, width: 100, x: 0, y: top }) as DOMRect;

const buildColumn = (blocks: FakeBlock[]) => {
  const column = document.createElement('div');
  for (const { spec, top, height, overhangBottom } of blocks) {
    const el = document.createElement('div');
    el.setAttribute(PAGEFIT_ATTR.block, '');
    el.textContent = spec.splitText ?? spec.key;
    el.getBoundingClientRect = () => rect(top, height);
    if (overhangBottom !== undefined) {
      const hang = document.createElement('span');
      hang.setAttribute(PAGEFIT_ATTR.overhang, '');
      hang.getBoundingClientRect = () => rect(top, overhangBottom - top);
      el.appendChild(hang);
    }
    column.appendChild(el);
  }
  return column;
};

const stubLineRects = (charsPerLine: number, lineHeight: number) => {
  let start = 0;
  const fakeRange = {
    setStart: (_node: Node, offset: number) => {
      start = offset;
    },
    setEnd: () => undefined,
    getClientRects: () => [rect(Math.floor(start / charsPerLine) * lineHeight, lineHeight)],
  };
  vi.spyOn(document, 'createRange').mockReturnValue(fakeRange as unknown as Range);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('layoutColumn', () => {
  it('returns null until the DOM matches the block list', () => {
    const column = buildColumn([{ spec: { key: 'a' }, top: 0, height: 10 }]);
    expect(layoutColumn(column, [{ key: 'a' }, { key: 'b' }], 100)).toBeNull();
    expect(layoutColumn(null, [], 100)).toBeNull();
  });

  it('keeps rows covered by a hanging left column on the same page', () => {
    const blocks: FakeBlock[] = [
      { spec: { key: 'intro' }, top: 0, height: 60 },
      { spec: { key: 'head', group: 'e' }, top: 60, height: 20, overhangBottom: 110 },
      { spec: { key: 'b1', group: 'e' }, top: 80, height: 20 },
      { spec: { key: 'b2', group: 'e' }, top: 100, height: 20 },
    ];
    const layout = layoutColumn(
      buildColumn(blocks),
      blocks.map((b) => b.spec),
      100,
    );
    expect(layout?.pages).toEqual([[{ index: 0 }], [{ index: 1 }, { index: 2 }, { index: 3 }]]);
    expect(layout?.padBottom).toEqual({});
  });

  it('pads the last row when the overhang outlasts its group', () => {
    const blocks: FakeBlock[] = [
      { spec: { key: 'head', group: 'e' }, top: 0, height: 20, overhangBottom: 50 },
      { spec: { key: 'b1', group: 'e' }, top: 20, height: 10 },
      { spec: { key: 'next' }, top: 30, height: 10 },
    ];
    const layout = layoutColumn(
      buildColumn(blocks),
      blocks.map((b) => b.spec),
      500,
    );
    expect(layout?.padBottom).toEqual({ b1: 20 });
  });

  it('splits a long paragraph between lines without orphans or widows', () => {
    const text = 'x'.repeat(100);
    stubLineRects(10, 10);
    const blocks: FakeBlock[] = [
      { spec: { key: 'title' }, top: 0, height: 40 },
      { spec: { key: 'p', splitText: text }, top: 40, height: 100 },
    ];
    const layout = layoutColumn(
      buildColumn(blocks),
      blocks.map((b) => b.spec),
      95,
    );
    expect(layout?.lineStarts.p).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
    expect(layout?.pages).toEqual([
      [{ index: 0 }, { index: 1, lines: [0, 4] }],
      [{ index: 1, lines: [5, 9] }],
    ]);
  });
});

describe('sliceLines', () => {
  it('returns the text of an inclusive line range', () => {
    const text = 'one two three four';
    expect(sliceLines(text, [0, 4, 8, 14], [1, 2])).toBe('two three');
    expect(sliceLines(text, [0, 4, 8, 14], [3, 3])).toBe('four');
  });
});

describe('PAGE_SIZES', () => {
  it('matches the CSS pixel size of A4 used by browsers', () => {
    expect(PAGE_SIZES.A4).toEqual({ width: 794, height: 1123 });
  });
});
