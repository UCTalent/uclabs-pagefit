import {
  type ColumnLayout,
  PAGEFIT_ATTR,
  type PageSize,
  type PlacedBlock,
  sliceLines,
} from '@uclabs/pagefit';
import { type CSSProperties, Fragment, type ReactNode } from 'react';

import { BLOCK_STYLE, columnStyle, PAGE_RESET } from './styles.js';
import type { Block, ColumnConfig } from './types.js';

type FrameProps = {
  columns: ColumnConfig[];
  pageSize: PageSize;
  pageStyle?: CSSProperties;
  className?: string;
  isPage?: boolean;
  renderColumn: (column: ColumnConfig, index: number) => ReactNode;
};

export const Frame = ({
  columns,
  pageSize,
  pageStyle,
  className,
  isPage,
  renderColumn,
}: FrameProps) => (
  <div
    {...{ [PAGEFIT_ATTR.frame]: '' }}
    {...(isPage ? { [PAGEFIT_ATTR.page]: '' } : {})}
    className={className}
    style={{
      ...PAGE_RESET,
      width: pageSize.width,
      height: isPage ? pageSize.height : undefined,
      overflow: isPage ? 'hidden' : 'visible',
      ...pageStyle,
    }}
  >
    {columns.map((column, index) => (
      <div key={column.id} {...{ [PAGEFIT_ATTR.column]: column.id }} style={columnStyle(column)}>
        {renderColumn(column, index)}
      </div>
    ))}
  </div>
);

export const FlowColumn = ({ blocks }: { blocks: Block[] }) => (
  <>
    {blocks.map((block) => (
      <Fragment key={block.key}>
        {block.spaceBefore ? <div style={{ height: block.spaceBefore }} /> : null}
        <div {...{ [PAGEFIT_ATTR.block]: '' }} style={BLOCK_STYLE}>
          {block.node}
        </div>
      </Fragment>
    ))}
  </>
);

const placedNode = (block: Block, lines: PlacedBlock['lines'], layout: ColumnLayout): ReactNode => {
  const starts = layout.lineStarts[block.key];
  if (!lines || !block.splitText || !starts) return block.node;
  return block.splitText.render(sliceLines(block.splitText.text, starts, lines));
};

type PageColumnProps = { blocks: Block[]; placed: PlacedBlock[]; layout: ColumnLayout };

export const PageColumn = ({ blocks, placed, layout }: PageColumnProps) => (
  <>
    {placed.map(({ index, lines }, position) => {
      const block = blocks[index];
      const startsBlock = !lines || lines[0] === 0;
      const gap = position === 0 || !startsBlock ? 0 : (block.spaceBefore ?? 0);
      return (
        <div
          key={lines ? `${block.key}:${lines[0]}` : block.key}
          style={{
            ...BLOCK_STYLE,
            paddingTop: gap,
            paddingBottom: layout.padBottom[block.key] ?? 0,
          }}
        >
          {placedNode(block, lines, layout)}
        </div>
      );
    })}
  </>
);
