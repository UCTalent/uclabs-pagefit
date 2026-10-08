import { PAGE_SIZES, PagedDocument, type PageSizeName } from '@uclabs/react-pagefit';
import { type CSSProperties, type ReactNode, useMemo, useState } from 'react';

import { buildDemoColumns, type DemoOptions } from './demoDocument.tsx';

const params = new URLSearchParams(window.location.search);
const numberParam = (name: string, fallback: number) =>
  Number(params.get(name) ?? fallback) || fallback;

const INITIAL_OPTIONS: DemoOptions = {
  chapters: numberParam('chapters', 4),
  paragraphsPerChapter: numberParam('paragraphs', 3),
  facts: numberParam('facts', 5),
  sidebar: params.get('sidebar') !== '0',
};
const INITIAL_SIZE = (params.get('size') ?? 'A4') as PageSizeName;
const PRINT_MODE = params.has('print');

const PANEL_STYLE: CSSProperties = {
  position: 'sticky',
  top: 24,
  alignSelf: 'flex-start',
  display: 'grid',
  gap: 12,
  width: 240,
  padding: 16,
  background: '#fff',
  borderRadius: 8,
  fontFamily: 'system-ui, sans-serif',
  fontSize: 14,
};

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
  <label style={{ display: 'grid', gap: 4 }}>
    <span>{label}</span>
    {children}
  </label>
);

const NumberField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
}) => (
  <Field label={label}>
    <input
      type="number"
      min={1}
      max={40}
      value={value}
      onChange={(e) => onChange(Number(e.target.value) || 1)}
    />
  </Field>
);

export const App = () => {
  const [options, setOptions] = useState(INITIAL_OPTIONS);
  const [sizeName, setSizeName] = useState<PageSizeName>(INITIAL_SIZE);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const columns = useMemo(() => buildDemoColumns(options), [options]);
  const update = (patch: Partial<DemoOptions>) => setOptions((prev) => ({ ...prev, ...patch }));
  const pageFont = { fontFamily: '"Segoe UI", Roboto, Arial, sans-serif', color: '#1f2937' };

  if (PRINT_MODE) {
    return (
      <PagedDocument
        columns={columns}
        pageSize={PAGE_SIZES[sizeName]}
        pageStyle={pageFont}
        pageGap={0}
      />
    );
  }

  return (
    <div
      style={{ display: 'flex', gap: 24, padding: 24, minHeight: '100vh', background: '#e5e7eb' }}
    >
      <div style={PANEL_STYLE}>
        <strong>pagefit playground</strong>
        <Field label="Page size">
          <select value={sizeName} onChange={(e) => setSizeName(e.target.value as PageSizeName)}>
            {Object.keys(PAGE_SIZES).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </Field>
        <NumberField
          label="Chapters"
          value={options.chapters}
          onChange={(chapters) => update({ chapters })}
        />
        <NumberField
          label="Paragraphs per chapter"
          value={options.paragraphsPerChapter}
          onChange={(paragraphsPerChapter) => update({ paragraphsPerChapter })}
        />
        <NumberField
          label="Sidebar facts"
          value={options.facts}
          onChange={(facts) => update({ facts })}
        />
        <label>
          <input
            type="checkbox"
            checked={options.sidebar}
            onChange={(e) => update({ sidebar: e.target.checked })}
          />{' '}
          Sidebar
        </label>
        <span>{pageCount === null ? 'Measuring…' : `${pageCount} page(s)`}</span>
      </div>
      <PagedDocument
        columns={columns}
        pageSize={PAGE_SIZES[sizeName]}
        pageStyle={{ ...pageFont, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
        onPaginate={({ pageCount: count }) => setPageCount(count)}
      />
    </div>
  );
};
