export function BrandMark({ size }: { size: number }) {
  return (
    <svg className="sl-brand-mark" width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <path fill="var(--sl-mark)" d="M32 5C17.64 5 6 15.52 6 28.5c0 6.82 3.22 12.97 8.38 17.27L10.9 56.2a2 2 0 0 0 2.53 2.5l12.24-6.78c2.05.39 4.17.58 6.33.58 14.36 0 26-10.52 26-24S46.36 5 32 5Z" />
      <path fill="none" stroke="var(--sl-mark-letter)" strokeLinecap="round" strokeWidth="6" d="M41.25 19.7c-2.3-2.12-5.4-3.2-9.02-3.2-5.52 0-9.23 2.65-9.23 6.52 0 3.6 2.94 5.31 9.34 6.7 6.01 1.31 8.66 3.16 8.66 6.72 0 4.12-3.98 7.06-9.85 7.06-4.14 0-7.52-1.27-9.9-3.74" />
      <circle cx="46.5" cy="13.5" r="4.5" fill="var(--sl-mark-dot)" />
    </svg>
  );
}

