# @uclabs/react-pagefit

React bindings for [pagefit](../../README.md): `<PagedDocument>` renders columns of blocks as
fixed-size pages, plus the `splittableText` helper. Peer dependencies: `react`, `react-dom` ≥ 18.

| Prop            | Default         | Description                                                      |
| --------------- | --------------- | ---------------------------------------------------------------- |
| `columns`       | —               | `ColumnConfig[]`: `id`, `blocks`, `width?`, `padding?`, `style?` |
| `pageSize`      | `PAGE_SIZES.A4` | `{ width, height }` in CSS pixels                                |
| `pageStyle`     | —               | Base text styles of every page (font, color, background)         |
| `pageClassName` | —               | Class name for every page                                        |
| `pageGap`       | `24`            | Gap between pages on screen (0 when printing)                    |
| `onPaginate`    | —               | Called with `{ pageCount }` after each pagination                |

See the [root README](../../README.md) for block options and how measurement works.
