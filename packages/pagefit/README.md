# @uclabs/pagefit

Framework-agnostic core of [pagefit](../../README.md): the pagination algorithm, DOM measurement,
page sizes and the `data-pagefit-*` attribute contract.

```ts
import { PAGE_SIZES, layoutColumn, paginateBlocks } from '@uclabs/pagefit';
```

- `paginateBlocks(blocks, pageHeight)` — pack measured blocks (`height`, `spaceBefore`,
  `keepWithNext`) into pages; returns block indices per page.
- `layoutColumn(columnEl, specs, contentHeight)` — measure the `[data-pagefit-block]` children
  of a column element, resolve overhangs and splittable text, and paginate.
- `PAGE_SIZES` — A4, A5, Letter, Legal in CSS pixels; `mmToPx`, `ptToPx` helpers.

Most apps use [`@uclabs/react-pagefit`](../react-pagefit) instead of calling these directly.
