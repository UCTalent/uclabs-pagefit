import { PAGEFIT_READY_SELECTOR } from '@uclabs/pagefit';
import type { Browser, LaunchOptions, Page, PDFOptions } from 'puppeteer-core';

export type PdfSource = { url: string } | { html: string };

export type RenderPdfOptions = {
  browser?: Browser;
  launch?: LaunchOptions;
  timeoutMs?: number;
  readySelector?: string;
  allowRequest?: (url: string) => boolean;
  beforePrint?: (page: Page) => Promise<void>;
  pdf?: PDFOptions;
};

const DEFAULT_TIMEOUT_MS = 30_000;

const launchBrowser = async (options: LaunchOptions | undefined): Promise<Browser> => {
  const puppeteer = await import('puppeteer-core');
  return puppeteer.default.launch(options);
};

const restrictRequests = async (page: Page, allowRequest: (url: string) => boolean) => {
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    if (allowRequest(request.url())) {
      void request.continue();
    } else {
      void request.abort('blockedbyclient');
    }
  });
};

const loadSource = async (page: Page, source: PdfSource) => {
  if ('url' in source) {
    await page.goto(source.url, { waitUntil: 'networkidle0' });
  } else {
    await page.setContent(source.html, { waitUntil: 'load' });
  }
};

const printPage = async (
  page: Page,
  source: PdfSource,
  options: RenderPdfOptions,
): Promise<Uint8Array> => {
  page.setDefaultTimeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  if (options.allowRequest) await restrictRequests(page, options.allowRequest);
  await loadSource(page, source);
  await page.waitForSelector(options.readySelector ?? PAGEFIT_READY_SELECTOR);
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  if (options.beforePrint) await options.beforePrint(page);
  return page.pdf({ printBackground: true, preferCSSPageSize: true, ...options.pdf });
};

export const renderPdf = async (
  source: PdfSource,
  options: RenderPdfOptions = {},
): Promise<Uint8Array> => {
  const ownBrowser = options.browser ? null : await launchBrowser(options.launch);
  const browser = options.browser ?? (ownBrowser as Browser);
  const page = await browser.newPage();
  try {
    return await printPage(page, source, options);
  } finally {
    await page.close();
    await ownBrowser?.close();
  }
};
