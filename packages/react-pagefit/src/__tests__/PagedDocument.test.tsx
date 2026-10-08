import { PAGEFIT_ATTR } from '@uclabs/pagefit';
import { cleanup, render, waitFor } from '@testing-library/react';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { splittableText } from '../blocks.js';
import { PagedDocument } from '../PagedDocument.js';
import type { ColumnConfig } from '../types.js';

const columns: ColumnConfig[] = [
  {
    id: 'main',
    padding: 20,
    blocks: [
      { key: 'title', node: <h1>Title</h1>, keepWithNext: true },
      splittableText('intro', 'Hello world', (text) => <p>{text}</p>, { spaceBefore: 8 }),
    ],
  },
  { id: 'side', width: 200, blocks: [{ key: 'note', node: <span>Note</span> }] },
];

afterEach(cleanup);

describe('PagedDocument', () => {
  it('renders an unpaginated, not-ready flow on the server', () => {
    const html = renderToString(<PagedDocument columns={columns} />);
    expect(html).toContain(`${PAGEFIT_ATTR.ready}="false"`);
    expect(html).not.toContain(`${PAGEFIT_ATTR.page}=""`);
    expect(html).toContain('Hello world');
  });

  it('paginates after mount and reports the page count', async () => {
    const onPaginate = vi.fn();
    const { container } = render(<PagedDocument columns={columns} onPaginate={onPaginate} />);

    await waitFor(() => expect(onPaginate).toHaveBeenCalledWith({ pageCount: 1 }));
    const root = container.querySelector(`[${PAGEFIT_ATTR.root}]`);
    await waitFor(() => expect(root?.getAttribute(PAGEFIT_ATTR.ready)).toBe('true'));

    const pages = container.querySelectorAll(`[${PAGEFIT_ATTR.page}]`);
    expect(pages).toHaveLength(1);
    expect(pages[0].textContent).toBe('TitleHello worldNote');
  });

  it('renders the measuring layer outside the document root', async () => {
    render(<PagedDocument columns={columns} />);
    await waitFor(() =>
      expect(document.body.querySelector(`[${PAGEFIT_ATTR.measure}]`)).not.toBeNull(),
    );
    const layer = document.body.querySelector(`[${PAGEFIT_ATTR.measure}]`);
    expect(layer?.getAttribute('aria-hidden')).toBe('true');
    expect(layer?.querySelectorAll(`[${PAGEFIT_ATTR.block}]`)).toHaveLength(3);
  });

  it('sizes pages and columns from the configuration', async () => {
    const { container } = render(
      <PagedDocument columns={columns} pageSize={{ width: 500, height: 700 }} />,
    );
    await waitFor(() => expect(container.querySelector(`[${PAGEFIT_ATTR.page}]`)).not.toBeNull());
    const page = container.querySelector<HTMLElement>(`[${PAGEFIT_ATTR.page}]`);
    expect(page?.style.width).toBe('500px');
    expect(page?.style.height).toBe('700px');
    const side = page?.querySelector<HTMLElement>(`[${PAGEFIT_ATTR.column}="side"]`);
    expect(side?.style.width).toBe('200px');
  });
});
