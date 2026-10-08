# pagefit

**Pixel-accurate pagination for React — no line is ever cut by a page break.**

pagefit lays HTML content out as fixed-size pages (A4, Letter, …) the way a word processor
would: it measures every block with the real fonts and column widths, packs blocks into pages,
keeps headings with what follows them and splits long paragraphs _between_ lines. Because the
result is plain HTML, the same component is your on-screen preview and, printed by headless
Chromium, a vector PDF with selectable, searchable text.

| Package | What it does | Source |
| --- | --- | --- |
| [`@uclabs/pagefit`](https://www.npmjs.com/package/@uclabs/pagefit) | Framework-agnostic pagination algorithm and DOM measurement | [packages/pagefit](./packages/pagefit) |
| [`@uclabs/react-pagefit`](https://www.npmjs.com/package/@uclabs/react-pagefit) | `<PagedDocument>` React component | [packages/react-pagefit](./packages/react-pagefit) |
| [`@uclabs/pagefit-pdf`](https://www.npmjs.com/package/@uclabs/pagefit-pdf) | Node helper that prints a pagefit page to PDF with your Chromium | [packages/pagefit-pdf](./packages/pagefit-pdf) |

## Quick start

```tsx
import { PAGE_SIZES, PagedDocument, splittableText, type ColumnConfig } from '@uclabs/react-pagefit';

const columns: ColumnConfig[] = [
  {
    id: 'main',
    padding: 48,
    blocks: [
      { key: 'title', keepWithNext: true, node: <h1 style={{ margin: 0 }}>Report</h1> },
      splittableText('intro', longText, (text) => <p style={{ margin: 0 }}>{text}</p>, {
        spaceBefore: 12,
      }),
    ],
  },
];

export const Report = () => (
  <PagedDocument
    columns={columns}
    pageSize={PAGE_SIZES.A4}
    pageStyle={{ fontFamily: 'Inter, sans-serif' }}
  />
);
```

Memoize `columns` (or each column's `blocks` array): pagination re-runs whenever the block arrays
change identity.

## Concepts

A document is a list of **columns**; each column is a list of **blocks**. A block is the
smallest unit the paginator places, and it is never split — except splittable text.

| Block field    | Meaning                                                                                                                                                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `key`          | Stable unique id within the column.                                                                                                                                                                                                                                                  |
| `node`         | What to render.                                                                                                                                                                                                                                                                      |
| `spaceBefore`  | Gap above the block in px. Dropped when the block starts a page, so pages never begin with a hole. Use this instead of CSS margins between blocks.                                                                                                                                   |
| `keepWithNext` | Never end a page right after this block (headings, entry titles). Chains across consecutive blocks.                                                                                                                                                                                  |
| `group`        | Blocks of one entry. If the first block contains an element marked `data-pagefit-overhang` that hangs below it (e.g. an absolutely positioned label column), the following blocks of the group it overlaps stay on the same page, and any remaining overhang becomes bottom padding. |
| `splitText`    | Created by `splittableText(key, text, render)`. A paragraph that may be split between lines; the first two and last two lines always stay together.                                                                                                                                  |

Each column is paginated independently: a long sidebar continues on the next page with its own
background, and the page count is the longest column.

### How it works

1. A hidden copy of the document is rendered in a portal with identical styles and widths, every
   block in one tall column.
2. Each block's height is measured. For splittable text, the start offset of every visual line
   is found with `Range.getClientRects()`.
3. `paginateBlocks` greedily fills pages: a block that does not fit moves to the next page
   together with any `keepWithNext` chain before it.
4. Real pages are rendered at the exact page size with `overflow: hidden`; a split paragraph is
   rendered as the substring of its lines on each page, which wraps exactly like the original.
5. Measurement re-runs when blocks change, when a measured element resizes and when web fonts
   finish loading. The root gets `data-pagefit-ready="true"` once pages are final and fonts are
   loaded.

`pageStyle` sets the base text styles of every page. Inherited styles of the host page are reset
on purpose, because the measuring copy lives outside your component tree and must match the
pages exactly.

## PDF

```ts
import puppeteer from 'puppeteer-core';
import { renderPdf } from '@uclabs/pagefit-pdf';

const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH });
const pdf = await renderPdf(
  { url: 'http://localhost:3000/print/report' },
  { browser, allowRequest: (url) => url.startsWith('http://localhost:3000/') },
);
```

`renderPdf` waits for `data-pagefit-ready="true"` and `document.fonts.ready`, then prints with
the CSS `@page` size the component emits. You bring the browser: `puppeteer-core` is a peer
dependency and the library never calls any hosted service.

**Running it as a service:** render only your own pages (never a URL or HTML supplied by the
caller), pass `allowRequest` to block every other origin, authenticate callers, rate-limit, and
reuse one browser across requests.

## Development

```bash
pnpm install
pnpm build        # all packages
pnpm test         # unit tests (vitest)
pnpm lint         # eslint + no comments + arrow functions only
pnpm e2e          # real Chrome: overflow checks + PDF export of the playground
pnpm --filter @uclabs/pagefit-playground dev
```

`pnpm e2e` looks for Chrome in the usual locations; set `CHROME_PATH` otherwise. PDFs are written
to `examples/playground/out/`.

To try local changes in another app without publishing, build in watch mode
(`pnpm --filter @uclabs/react-pagefit dev`) and link it from the app (`pnpm link <path>/packages/react-pagefit`).
Keep `react` a single copy: it is a peer dependency here.

## Releasing

Packages are published to npm under the [`@uclabs`](https://www.npmjs.com/org/uclabs) scope and
versioned together with [changesets](https://github.com/changesets/changesets):
`pnpm changeset` → `pnpm version-packages` → `pnpm release` (needs `NPM_TOKEN`; copy
`.npmrc.example` to `.npmrc`).

## License

[MIT](./LICENSE)
