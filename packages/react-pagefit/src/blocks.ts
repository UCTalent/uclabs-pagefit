import type { ReactNode } from 'react';

import type { Block } from './types.js';

type BlockOptions = Pick<Block, 'spaceBefore' | 'keepWithNext' | 'group'>;

export const splittableText = (
  key: string,
  text: string,
  render: (text: string) => ReactNode,
  options: BlockOptions = {},
): Block => ({
  key,
  ...options,
  node: render(text),
  splitText: { text, render },
});
