import type { BlockSpec, PageSize, Spacing } from '@uclabs/pagefit';
import type { CSSProperties, ReactNode } from 'react';

export type SplitText = {
  text: string;
  render: (text: string) => ReactNode;
};

export type Block = Omit<BlockSpec, 'splitText'> & {
  node: ReactNode;
  splitText?: SplitText;
};

export type ColumnConfig = {
  id: string;
  blocks: Block[];
  width?: number | string;
  padding?: number | Partial<Spacing>;
  style?: CSSProperties;
};

export type PaginateResult = {
  pageCount: number;
};

export type PagedDocumentProps = {
  columns: ColumnConfig[];
  pageSize?: PageSize;
  pageStyle?: CSSProperties;
  pageClassName?: string;
  pageGap?: number;
  className?: string;
  style?: CSSProperties;
  onPaginate?: (result: PaginateResult) => void;
};
