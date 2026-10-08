export const PAGEFIT_ATTR = {
  root: 'data-pagefit-root',
  ready: 'data-pagefit-ready',
  page: 'data-pagefit-page',
  frame: 'data-pagefit-frame',
  measure: 'data-pagefit-measure',
  column: 'data-pagefit-column',
  block: 'data-pagefit-block',
  overhang: 'data-pagefit-overhang',
} as const;

export const PAGEFIT_READY_SELECTOR = `[${PAGEFIT_ATTR.ready}="true"]`;
