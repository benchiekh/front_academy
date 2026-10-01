import { cx } from './ui';

/** Handball mark: orange ball with seams inside an angled ink badge. */
export function BallMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={cx('shrink-0', className)} aria-hidden>
      <circle cx="20" cy="20" r="17" fill="var(--color-blaze)" />
      <path
        d="M3 20h34M20 3c-6 6-6 28 0 34M20 3c6 6 6 28 0 34M7 9c7 4 19 4 26 0M7 31c7-4 19-4 26 0"
        stroke="var(--color-ink)"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({ subtitle, className }: { subtitle?: string; className?: string }) {
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <BallMark className="size-10" />
      <div className="leading-none">
        <p className="font-display text-2xl font-black text-white">
          Handball<span className="text-blaze">.</span>Academy
        </p>
        {subtitle && <p className="mt-1 text-[11px] font-bold tracking-[0.2em] text-volt uppercase">{subtitle}</p>}
      </div>
    </div>
  );
}
