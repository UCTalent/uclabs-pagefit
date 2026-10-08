import { type ColumnLayout, PAGE_SIZES, PAGEFIT_ATTR } from '@uclabs/pagefit';
import { type RefObject, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';

import { FlowColumn, Frame, PageColumn } from './Frame.js';
import { globalCss } from './styles.js';
import type { ColumnConfig, PagedDocumentProps } from './types.js';
import { usePagination } from './usePagination.js';

const MEASURE_LAYER_STYLE = {
  position: 'absolute',
  top: 0,
  left: -100000,
  visibility: 'hidden',
  pointerEvents: 'none',
  contain: 'layout style',
} as const;

type FrameSharedProps = Pick<PagedDocumentProps, 'pageStyle' | 'pageClassName'> & {
  columns: ColumnConfig[];
  pageSize: NonNullable<PagedDocumentProps['pageSize']>;
};

const MeasureLayer = ({
  measureRef,
  ...frame
}: FrameSharedProps & { measureRef: RefObject<HTMLDivElement> }) =>
  createPortal(
    <div
      ref={measureRef}
      aria-hidden
      {...{ [PAGEFIT_ATTR.measure]: '' }}
      style={MEASURE_LAYER_STYLE}
    >
      <Frame
        columns={frame.columns}
        pageSize={frame.pageSize}
        pageStyle={frame.pageStyle}
        renderColumn={(column) => <FlowColumn blocks={column.blocks} />}
      />
    </div>,
    document.body,
  );

const Pages = ({ layouts, ...frame }: FrameSharedProps & { layouts: ColumnLayout[] }) => {
  const pageCount = Math.max(1, ...layouts.map((layout) => layout.pages.length));
  return (
    <>
      {Array.from({ length: pageCount }, (_, pageIndex) => (
        <Frame
          key={pageIndex}
          isPage
          columns={frame.columns}
          pageSize={frame.pageSize}
          pageStyle={frame.pageStyle}
          className={frame.pageClassName}
          renderColumn={(column, columnIndex) => (
            <PageColumn
              blocks={column.blocks}
              placed={layouts[columnIndex].pages[pageIndex] ?? []}
              layout={layouts[columnIndex]}
            />
          )}
        />
      ))}
    </>
  );
};

export const PagedDocument = ({
  columns,
  pageSize = PAGE_SIZES.A4,
  pageStyle,
  pageClassName,
  pageGap = 24,
  className,
  style,
  onPaginate,
}: PagedDocumentProps) => {
  const { mounted, measureRef, layouts, fontsReady } = usePagination(columns, pageSize);
  const pageCount = layouts ? Math.max(1, ...layouts.map((layout) => layout.pages.length)) : null;
  const css = useMemo(() => globalCss(pageSize), [pageSize]);
  const frame = { columns, pageSize, pageStyle, pageClassName };

  useEffect(() => {
    if (pageCount !== null) onPaginate?.({ pageCount });
  }, [pageCount, onPaginate]);

  return (
    <div
      {...{
        [PAGEFIT_ATTR.root]: '',
        [PAGEFIT_ATTR.ready]: String(pageCount !== null && fontsReady),
      }}
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: pageGap,
        width: pageSize.width,
        ...style,
      }}
    >
      <style>{css}</style>
      {layouts ? (
        <Pages {...frame} layouts={layouts} />
      ) : (
        <Frame
          {...frame}
          className={pageClassName}
          renderColumn={(column) => <FlowColumn blocks={column.blocks} />}
        />
      )}
      {mounted && <MeasureLayer {...frame} measureRef={measureRef} />}
    </div>
  );
};
