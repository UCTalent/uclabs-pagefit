import { PAGEFIT_READY_SELECTOR } from '@uclabs/pagefit';
import type { Browser } from 'puppeteer-core';
import { describe, expect, it, vi } from 'vitest';

import { renderPdf } from '../renderPdf.js';

type RequestHandler = (request: {
  url: () => string;
  continue: () => Promise<void>;
  abort: () => Promise<void>;
}) => void;

const createFakeBrowser = (options: { failOn?: 'waitForSelector' } = {}) => {
  let onRequest: RequestHandler | undefined;
  const pdfBytes = new Uint8Array([37, 80, 68, 70]);
  const page = {
    setDefaultTimeout: vi.fn(),
    setRequestInterception: vi.fn(async () => undefined),
    on: vi.fn((event: string, handler: RequestHandler) => {
      if (event === 'request') onRequest = handler;
    }),
    goto: vi.fn(async () => null),
    setContent: vi.fn(async () => undefined),
    waitForSelector: vi.fn(async () => {
      if (options.failOn === 'waitForSelector') throw new Error('timeout');
      return null;
    }),
    evaluate: vi.fn(async () => undefined),
    pdf: vi.fn(async () => pdfBytes),
    close: vi.fn(async () => undefined),
  };
  const browser = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
  return {
    browser: browser as unknown as Browser,
    page,
    pdfBytes,
    sendRequest: (url: string) => {
      const request = {
        url: () => url,
        continue: vi.fn(async () => undefined),
        abort: vi.fn(async () => undefined),
      };
      onRequest?.(request);
      return request;
    },
  };
};

describe('renderPdf', () => {
  it('waits for the pagefit ready flag and prints with the CSS page size', async () => {
    const fake = createFakeBrowser();
    const bytes = await renderPdf(
      { url: 'http://localhost/doc' },
      { browser: fake.browser, timeoutMs: 5000 },
    );

    expect(bytes).toBe(fake.pdfBytes);
    expect(fake.page.setDefaultTimeout).toHaveBeenCalledWith(5000);
    expect(fake.page.goto).toHaveBeenCalledWith('http://localhost/doc', {
      waitUntil: 'networkidle0',
    });
    expect(fake.page.waitForSelector).toHaveBeenCalledWith(PAGEFIT_READY_SELECTOR);
    expect(fake.page.pdf).toHaveBeenCalledWith({ printBackground: true, preferCSSPageSize: true });
    expect(fake.page.close).toHaveBeenCalled();
  });

  it('renders inline HTML and merges custom pdf options', async () => {
    const fake = createFakeBrowser();
    await renderPdf({ html: '<p>hi</p>' }, { browser: fake.browser, pdf: { tagged: true } });

    expect(fake.page.setContent).toHaveBeenCalledWith('<p>hi</p>', { waitUntil: 'load' });
    expect(fake.page.pdf).toHaveBeenCalledWith({
      printBackground: true,
      preferCSSPageSize: true,
      tagged: true,
    });
  });

  it('runs beforePrint after the document is ready and before printing', async () => {
    const fake = createFakeBrowser();
    const order: string[] = [];
    fake.page.evaluate.mockImplementation(async () => {
      order.push('fonts');
    });
    fake.page.pdf.mockImplementation(async () => {
      order.push('pdf');
      return fake.pdfBytes;
    });
    await renderPdf(
      { url: 'http://localhost/doc' },
      {
        browser: fake.browser,
        beforePrint: async (page) => {
          order.push(page === (fake.page as unknown) ? 'beforePrint' : 'wrong page');
        },
      },
    );
    expect(order).toEqual(['fonts', 'beforePrint', 'pdf']);
  });

  it('blocks requests rejected by allowRequest', async () => {
    const fake = createFakeBrowser();
    await renderPdf(
      { html: '<p>hi</p>' },
      { browser: fake.browser, allowRequest: (url) => url.startsWith('http://localhost') },
    );

    expect(fake.page.setRequestInterception).toHaveBeenCalledWith(true);
    expect(fake.sendRequest('http://localhost/font.woff2').continue).toHaveBeenCalled();
    expect(fake.sendRequest('http://169.254.169.254/meta').abort).toHaveBeenCalled();
  });

  it('closes the page but never a caller-provided browser, even on failure', async () => {
    const fake = createFakeBrowser({ failOn: 'waitForSelector' });
    await expect(
      renderPdf({ url: 'http://localhost/doc' }, { browser: fake.browser }),
    ).rejects.toThrow('timeout');

    expect(fake.page.close).toHaveBeenCalled();
    expect((fake.browser as unknown as { close: () => void }).close).not.toHaveBeenCalled();
  });
});
