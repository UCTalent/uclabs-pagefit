export const PARAGRAPHS = [
  'Pagination for print is deceptively hard. Browsers flow content into one endless column, while paper wants fixed-size sheets where no line is sliced by the page edge and no heading is stranded at the bottom of a page.',
  'pagefit measures every block off-screen with the exact fonts and column widths of the final page, then packs the blocks greedily. Headings travel with the content that follows them, and long paragraphs are split between lines rather than through them.',
  'Phân trang để in ấn khó hơn vẻ ngoài của nó. Trình duyệt dàn nội dung thành một cột dài vô tận, còn giấy in cần các trang cố định, nơi không dòng chữ nào bị mép trang cắt ngang và không tiêu đề nào bị bỏ lại một mình ở cuối trang.',
  'Because the preview is plain HTML, the same component that renders on screen can be printed to a vector PDF by headless Chromium. Text stays selectable and searchable, which matters for documents that are parsed by machines as well as read by people.',
  'Each column of a page is paginated independently, so a sidebar that runs longer than the main column simply continues on the next page with its own background, and the page count is the longest of the columns.',
];

export const FACTS = [
  ['Engine', 'DOM measurement'],
  ['Output', 'Vector PDF'],
  ['Columns', 'Unlimited'],
  ['Page sizes', 'A4, A5, Letter, Legal'],
  ['Ngôn ngữ', 'Tiếng Việt có dấu'],
];

export const BULLETS = [
  'No line is ever cut by a page edge',
  'Headings stay with the content that follows them',
  'Long paragraphs split between lines, with no orphans or widows',
  'Rows that a tall label hangs over stay on the same page',
];
