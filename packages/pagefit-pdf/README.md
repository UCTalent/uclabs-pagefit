# @uclabs/pagefit-pdf

Print a [pagefit](../../README.md) page to a vector PDF with headless Chromium.
Peer dependency: `puppeteer-core` ≥ 22 — you provide the browser.

```ts
const pdf: Uint8Array = await renderPdf({ url }, { browser, allowRequest, timeoutMs: 30000 });
```

| Option          | Description                                                                              |
| --------------- | ---------------------------------------------------------------------------------------- |
| `browser`       | Reused `Browser` (recommended). Otherwise one is launched with `launch`.                 |
| `launch`        | `puppeteer-core` launch options (needs `executablePath`).                                |
| `allowRequest`  | Return `false` to block a request; use it to stop SSRF in services.                      |
| `beforePrint`   | `async (page) => {}` run after the document is ready, before printing (checks, metrics). |
| `readySelector` | Defaults to `[data-pagefit-ready="true"]`.                                               |
| `timeoutMs`     | Defaults to 30 000.                                                                      |
| `pdf`           | Extra `page.pdf()` options; defaults use the CSS `@page` size and backgrounds.           |

Sources can be `{ url }` or `{ html }`. Never pass a URL or HTML that comes from an untrusted
caller.
