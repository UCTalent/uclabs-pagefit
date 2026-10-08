import {
  type BlockSpec,
  type ColumnLayout,
  layoutColumn,
  PAGEFIT_ATTR,
  type PageSize,
} from '@uclabs/pagefit';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { contentHeight } from './styles.js';
import type { Block, ColumnConfig } from './types.js';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

type Stored = { layouts: ColumnLayout[]; blockLists: Block[][] };

const sameBlockLists = (a: Block[][], b: Block[][]): boolean =>
  a.length === b.length && a.every((list, i) => list === b[i]);

const sameStored = (a: Stored | null, b: Stored): boolean =>
  a !== null &&
  sameBlockLists(a.blockLists, b.blockLists) &&
  JSON.stringify(a.layouts) === JSON.stringify(b.layouts);

const toSpec = (block: Block): BlockSpec => ({
  key: block.key,
  spaceBefore: block.spaceBefore,
  keepWithNext: block.keepWithNext,
  group: block.group,
  splitText: block.splitText?.text,
});

const measureColumns = (
  root: HTMLElement,
  columns: ColumnConfig[],
  pageSize: PageSize,
): Stored | null => {
  const columnEls = Array.from(root.querySelectorAll(`[${PAGEFIT_ATTR.column}]`));
  const layouts: ColumnLayout[] = [];
  for (const [i, column] of columns.entries()) {
    const layout = layoutColumn(
      columnEls[i] ?? null,
      column.blocks.map(toSpec),
      contentHeight(column, pageSize),
    );
    if (!layout) return null;
    layouts.push(layout);
  }
  return { layouts, blockLists: columns.map((column) => column.blocks) };
};

const useFontsReady = (mounted: boolean, onChange: () => void): boolean => {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!mounted) return;
    const fonts = typeof document === 'undefined' ? undefined : document.fonts;
    if (!fonts) {
      setReady(true);
      return;
    }
    let cancelled = false;
    const handle = () => {
      if (cancelled) return;
      setReady(fonts.status === 'loaded');
      onChange();
    };
    fonts.ready.then(handle);
    fonts.addEventListener('loadingdone', handle);
    return () => {
      cancelled = true;
      fonts.removeEventListener('loadingdone', handle);
    };
  }, [mounted, onChange]);
  return ready;
};

export const usePagination = (columns: ColumnConfig[], pageSize: PageSize) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const measureRef = useRef<HTMLDivElement>(null);
  const [stored, setStored] = useState<Stored | null>(null);

  const measure = useCallback(() => {
    const root = measureRef.current;
    const next = root ? measureColumns(root, columns, pageSize) : null;
    if (next) setStored((prev) => (sameStored(prev, next) ? prev : next));
  }, [columns, pageSize]);

  useIsomorphicLayoutEffect(() => {
    if (!mounted) return;
    measure();
    const root = measureRef.current;
    if (!root || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    root
      .querySelectorAll(`[${PAGEFIT_ATTR.block}], [${PAGEFIT_ATTR.overhang}]`)
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mounted, measure]);

  const fontsReady = useFontsReady(mounted, measure);
  const current = columns.map((column) => column.blocks);
  const layouts = stored && sameBlockLists(stored.blockLists, current) ? stored.layouts : null;

  return { mounted, measureRef, layouts, fontsReady };
};
