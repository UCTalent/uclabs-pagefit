export type PageSize = {
  width: number;
  height: number;
};

export type Spacing = {
  top: number;
  right: number;
  bottom: number;
  left: number;
};

export type BlockSpec = {
  key: string;
  spaceBefore?: number;
  keepWithNext?: boolean;
  group?: string;
  splitText?: string;
};

export type MeasuredBlock = {
  height: number;
  spaceBefore: number;
  keepWithNext: boolean;
};

export type LineRange = [number, number];

export type PlacedBlock = {
  index: number;
  lines?: LineRange;
};

export type ColumnLayout = {
  pages: PlacedBlock[][];
  padBottom: Record<string, number>;
  lineStarts: Record<string, number[]>;
};
