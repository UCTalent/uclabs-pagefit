import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { renderPdf } from '@uclabs/pagefit-pdf';
import puppeteer from 'puppeteer-core';
import { preview } from 'vite';

const appRoot = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const outDir = path.join(appRoot, 'out');

const SCENARIOS = [
  { name: 'default', query: '' },
  { name: 'long', query: 'chapters=12&paragraphs=5&facts=60' },
  { name: 'letter-single-column', query: 'size=Letter&sidebar=0&chapters=8' },
];

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
].filter(Boolean);

const findChrome = () => {
  const found = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
  if (!found) throw new Error('Chrome not found. Set CHROME_PATH to a Chrome/Chromium executable.');
  return found;
};

const inspectPages = () => {
  const pages = Array.from(document.querySelectorAll('[data-pagefit-page]'));
  const overflows = [];
  pages.forEach((page, pageIndex) => {
    const pageRect = page.getBoundingClientRect();
    page.querySelectorAll('[data-pagefit-column]').forEach((column) => {
      const limit = pageRect.bottom - parseFloat(getComputedStyle(column).paddingBottom);
      const bottoms = Array.from(column.querySelectorAll('*')).map((el) => el.getBoundingClientRect().bottom);
      const maxBottom = Math.max(pageRect.top, ...bottoms);
      if (maxBottom > limit + 0.5) {
        overflows.push({ page: pageIndex + 1, column: column.getAttribute('data-pagefit-column'), by: maxBottom - limit });
      }
    });
  });
  return { pageCount: pages.length, overflows };
};

const countPdfPages = (bytes) => (Buffer.from(bytes).toString('latin1').match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;

const runScenario = async (browser, baseUrl, scenario) => {
  const url = `${baseUrl}?print&${scenario.query}`;
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.waitForSelector('[data-pagefit-ready="true"]', { timeout: 30000 });
  const dom = await page.evaluate(inspectPages);
  await page.close();

  const pdf = await renderPdf({ url }, { browser, allowRequest: (requestUrl) => requestUrl.startsWith(baseUrl) });
  const file = path.join(outDir, `${scenario.name}.pdf`);
  await writeFile(file, pdf);

  const pdfPages = countPdfPages(pdf);
  const ok = dom.overflows.length === 0 && pdfPages === dom.pageCount;
  console.log(
    `${ok ? 'PASS' : 'FAIL'} ${scenario.name}: ${dom.pageCount} DOM page(s), ${pdfPages} PDF page(s), ` +
      `${dom.overflows.length} overflow(s), ${Math.round(pdf.length / 1024)} KB -> ${path.relative(appRoot, file)}`,
  );
  if (dom.overflows.length > 0) console.log(JSON.stringify(dom.overflows));
  return ok;
};

const main = async () => {
  await mkdir(outDir, { recursive: true });
  const server = await preview({ root: appRoot, preview: { port: 4179, strictPort: false, open: false } });
  const baseUrl = server.resolvedUrls.local[0];
  const browser = await puppeteer.launch({ executablePath: findChrome(), headless: true });
  try {
    const results = [];
    for (const scenario of SCENARIOS) results.push(await runScenario(browser, baseUrl, scenario));
    if (results.includes(false)) process.exitCode = 1;
  } finally {
    await browser.close();
    await server.close();
  }
};

await main();
