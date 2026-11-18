// The logo sheet keeps the mark identical on light and dark backgrounds,
// so these are fixed brand colors rather than theme tokens.
const BRAND_GREEN = '#008652';
const BRAND_WHITE = '#fefeff';

const SIZES = {
  topbar: { markPx: 28, wordmark: 'text-[22px]', gap: 'gap-[7px]' },
  auth: { markPx: 36, wordmark: 'text-[30px]', gap: 'gap-[9px]' },
} as const;

export type LogoSize = keyof typeof SIZES;

// The wordmark is real text, so it is the logo's accessible name;
// the mark beside it is decoration.
export function Logo({ size }: Readonly<{ size: LogoSize }>) {
  const { markPx, wordmark, gap } = SIZES[size];

  return (
    <div className={`flex items-center ${gap}`}>
      <svg
        width={markPx}
        height={markPx}
        viewBox="0 0 64 64"
        aria-hidden="true"
      >
        <rect width="64" height="64" rx="16" fill={BRAND_GREEN} />
        <polyline
          points="16,44 26,22 38,40 48,20"
          fill="none"
          stroke={BRAND_WHITE}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="48" cy="20" r="5" fill={BRAND_WHITE} />
      </svg>
      <span
        className={`${wordmark} font-extrabold leading-none tracking-[-0.03em] text-typography-950`}
      >
        NuMo
      </span>
    </div>
  );
}
