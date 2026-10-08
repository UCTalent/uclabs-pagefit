import { PAGEFIT_ATTR, type PageSize, type Spacing } from '@uclabs/pagefit';
import type { CSSProperties } from 'react';

import type { ColumnConfig } from './types.js';

export const PAGE_RESET: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'stretch',
  background: '#fff',
  color: '#000',
  fontFamily: 'sans-serif',
  fontSize: 16,
  fontStyle: 'normal',
  fontWeight: 400,
  lineHeight: 1.5,
  letterSpacing: 'normal',
  wordSpacing: 'normal',
  textAlign: 'left',
  textIndent: 0,
  textTransform: 'none',
  whiteSpace: 'normal',
  wordBreak: 'normal',
  overflowWrap: 'break-word',
  direction: 'ltr',
  WebkitPrintColorAdjust: 'exact',
  printColorAdjust: 'exact',
};

export const BLOCK_STYLE: CSSProperties = { display: 'flow-root' };

export const resolvePadding = (padding: ColumnConfig['padding']): Spacing => {
  if (typeof padding === 'number') {
    return { top: padding, right: padding, bottom: padding, left: padding };
  }
  return { top: 0, right: 0, bottom: 0, left: 0, ...padding };
};

export const columnStyle = (column: ColumnConfig): CSSProperties => {
  const padding = resolvePadding(column.padding);
  const sizing: CSSProperties =
    column.width === undefined ? { flex: 1, minWidth: 0 } : { width: column.width, flexShrink: 0 };
  return {
    ...sizing,
    paddingTop: padding.top,
    paddingRight: padding.right,
    paddingBottom: padding.bottom,
    paddingLeft: padding.left,
    ...column.style,
  };
};

export const contentHeight = (column: ColumnConfig, pageSize: PageSize): number => {
  const padding = resolvePadding(column.padding);
  return pageSize.height - padding.top - padding.bottom;
};

export const globalCss = (pageSize: PageSize): string => {
  const frame = `[${PAGEFIT_ATTR.frame}]`;
  const page = `[${PAGEFIT_ATTR.page}]`;
  return [
    `${frame}, ${frame} * { box-sizing: border-box; }`,
    `@page { size: ${pageSize.width}px ${pageSize.height}px; margin: 0; }`,
    '@media print {',
    '  html, body { margin: 0 !important; padding: 0 !important; }',
    `  [${PAGEFIT_ATTR.root}] { gap: 0 !important; }`,
    `  ${page} { box-shadow: none !important; break-after: page; }`,
    `  ${page}:last-child { break-after: auto; }`,
    '}',
  ].join('\n');
};
