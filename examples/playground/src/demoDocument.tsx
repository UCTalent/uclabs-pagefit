import { type Block, type ColumnConfig, splittableText } from '@uclabs/react-pagefit';

import { BULLETS, FACTS, PARAGRAPHS } from './content.ts';

const ACCENT = '#1e3a5f';

const heading = (key: string, text: string, spaceBefore = 24): Block => ({
  key,
  spaceBefore,
  keepWithNext: true,
  node: (
    <h2
      style={{
        margin: 0,
        paddingBottom: 6,
        fontSize: 18,
        borderBottom: `2px solid ${ACCENT}`,
        color: ACCENT,
      }}
    >
      {text}
    </h2>
  ),
});

const paragraph = (key: string, text: string): Block =>
  splittableText(
    key,
    text,
    (value) => <p style={{ margin: 0, fontSize: 14, lineHeight: 1.7 }}>{value}</p>,
    {
      spaceBefore: 10,
    },
  );

const bullet = (key: string, text: string): Block => ({
  key,
  spaceBefore: 6,
  node: (
    <div style={{ display: 'flex', gap: 8, fontSize: 14 }}>
      <span style={{ color: ACCENT }}>●</span>
      <span>{text}</span>
    </div>
  ),
});

const chapter = (index: number, paragraphsPerChapter: number): Block[] => [
  heading(`h${index}`, `Chapter ${index + 1}`, index === 0 ? 0 : 24),
  ...Array.from({ length: paragraphsPerChapter }, (_, p) =>
    paragraph(`h${index}-p${p}`, PARAGRAPHS[(index + p) % PARAGRAPHS.length]),
  ),
  ...(index % 2 === 0 ? BULLETS.map((text, b) => bullet(`h${index}-b${b}`, text)) : []),
];

const sidebarBlocks = (factCount: number): Block[] => [
  {
    key: 'logo',
    node: <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: 1 }}>pagefit</div>,
  },
  {
    key: 'facts-title',
    spaceBefore: 24,
    keepWithNext: true,
    node: <div style={{ fontSize: 12, textTransform: 'uppercase', opacity: 0.7 }}>Facts</div>,
  },
  ...Array.from({ length: factCount }, (_, i) => {
    const [label, value] = FACTS[i % FACTS.length];
    return {
      key: `fact-${i}`,
      spaceBefore: 10,
      node: (
        <div style={{ fontSize: 13 }}>
          <div style={{ opacity: 0.7 }}>{label}</div>
          <div style={{ fontWeight: 600 }}>{value}</div>
        </div>
      ),
    };
  }),
];

export type DemoOptions = {
  chapters: number;
  paragraphsPerChapter: number;
  facts: number;
  sidebar: boolean;
};

export const buildDemoColumns = (options: DemoOptions): ColumnConfig[] => {
  const main: ColumnConfig = {
    id: 'main',
    padding: { top: 48, right: 48, bottom: 48, left: 40 },
    blocks: Array.from({ length: options.chapters }, (_, i) =>
      chapter(i, options.paragraphsPerChapter),
    ).flat(),
  };
  if (!options.sidebar) return [main];
  const sidebar: ColumnConfig = {
    id: 'sidebar',
    width: 220,
    padding: { top: 48, right: 24, bottom: 48, left: 24 },
    style: { background: ACCENT, color: '#f8fafc' },
    blocks: sidebarBlocks(options.facts),
  };
  return [sidebar, main];
};
