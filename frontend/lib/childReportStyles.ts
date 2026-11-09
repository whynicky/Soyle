export const childReportStyles = `
  :root {
    color-scheme: light dark;
    --page: #f8f7f4;
    --paper: #fff;
    --ink: #242522;
    --muted: #545851;
    --line: #e3e5df;
    --accent: #365a46;
    --tint: #edf3ee;
    font: 1rem/1.5 system-ui, sans-serif;
  }
  @media screen and (prefers-color-scheme: dark) {
    :root {
      --page: #181818;
      --paper: #1f1f1f;
      --ink: #f2f1ee;
      --muted: #bdbfba;
      --line: #3f423d;
      --accent: #c2e1cb;
      --tint: #272727;
    }
  }
  * { box-sizing: border-box; }
  body { margin: 0; color: var(--ink); background: var(--page); overflow-wrap: anywhere; }
  main { max-width: 52rem; margin: 48px auto; padding: 48px; background: var(--paper); border-radius: 24px; }
  h1, h2, h3, p, dl, dd { margin: 0; }
  h1, h2 { text-wrap: balance; }
  h1 { font-size: 2.25rem; line-height: 2.5rem; font-weight: 650; letter-spacing: -.035em; }
  h2 { font-size: 1.25rem; line-height: 1.75rem; font-weight: 650; margin-bottom: 12px; }
  h3 { font-size: 1rem; line-height: 1.5rem; font-weight: 600; margin: 20px 0 8px; }
  p { text-wrap: pretty; }
  .brand { display: block; height: 24px; margin-bottom: 32px; }
  .eyebrow { color: var(--accent); font-size: .875rem; line-height: 1.25rem; font-weight: 600; margin-bottom: 8px; }
  .profile { display: flex; flex-wrap: wrap; gap: 16px 32px; margin-top: 16px; }
  dt, small, time, footer { color: var(--muted); font-size: .875rem; line-height: 1.25rem; }
  dd > time { color: var(--ink); }
  .word-summary { background: var(--tint); padding: 16px 24px; border-radius: 16px; }
  .word-summary > p, .muted { color: var(--muted); font-size: .875rem; line-height: 1.25rem; }
  .word-summary dl { display: grid; gap: 12px; margin-top: 12px; }
  .word-summary dt { color: var(--accent); font-weight: 650; }
  .word-summary dd { margin-top: 4px; }
  .participation { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 8px; }
  .participation > div { border-top: 1px solid var(--line); padding-top: 8px; }
  .participation dd { font-size: 1.25rem; line-height: 1.75rem; font-weight: 650; }
  .observation-hint { margin-top: 8px; }
  .appendix { margin-top: 24px; border: 1px solid var(--line); border-radius: 12px; padding: 0 16px; }
  .appendix summary { cursor: pointer; padding: 12px 0; font-weight: 600; }
  .appendix :focus-visible { outline: 2px solid var(--accent); outline-offset: 4px; }
  .appendix[open] { padding-bottom: 16px; }
  .appendix section { margin-top: 16px; }
  section { margin-top: 32px; }
  ul { margin: 0; padding: 0; list-style: none; }
  .records li, .permissions > div { border-top: 1px solid var(--line); padding: 12px 0; }
  .entry, .permissions > div { display: flex; justify-content: space-between; align-items: baseline; gap: 4px 16px; }
  .entry time { flex-shrink: 0; }
  .entry strong { font-weight: 600; }
  .entry small { display: block; margin-top: 4px; }
  .entry p { margin-top: 4px; white-space: pre-wrap; }
  .empty { color: var(--muted); padding: 12px 0; border-top: 1px solid var(--line); }
  .gallery { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 12rem), 1fr)); gap: 16px; }
  .gallery li { min-width: 0; border: 1px solid var(--line); border-radius: 12px; padding: 12px; }
  .gallery .entry { display: block; }
  .gallery img { display: block; width: 100%; max-height: 12rem; object-fit: contain; margin-bottom: 8px; }
  .permissions dd { flex-shrink: 0; }
  footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid var(--line); }
  .print-hint { margin-top: 8px; }
  @media screen and (max-width: 48rem) {
    main { margin: 0; padding: 24px; border-radius: 0; }
    h1 { font-size: 1.875rem; line-height: 2.25rem; }
    .entry, .permissions > div { display: grid; }
    .word-summary { padding: 16px; }
  }
  @page { size: A4; margin: 16mm; }
  @media print {
    :root { color-scheme: light; }
    body, main { background: #fff; }
    main { margin: 0; padding: 0; max-width: none; }
    .word-summary { border: 1px solid var(--line); }
    header, li, .word-summary, .participation, .permissions > div { break-inside: avoid; }
    h2, h3 { break-after: avoid; }
    .print-hint, .appendix:not([open]) { display: none; }
  }
`;
