import { AlertTriangle, ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');

type Variant = 'primary' | 'volt' | 'dark' | 'secondary' | 'danger' | 'ghost';
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-blaze text-white hover:bg-blaze-600 shadow-[4px_4px_0_0_var(--color-ink)] hover:shadow-[2px_2px_0_0_var(--color-ink)] hover:translate-x-[2px] hover:translate-y-[2px]',
  volt: 'bg-volt text-ink hover:bg-volt-600 shadow-[4px_4px_0_0_var(--color-ink)] hover:shadow-[2px_2px_0_0_var(--color-ink)] hover:translate-x-[2px] hover:translate-y-[2px]',
  dark: 'bg-ink text-white hover:bg-ink-3',
  secondary: 'bg-white text-ink ring-2 ring-ink hover:bg-ink hover:text-white',
  danger: 'bg-white text-loss ring-2 ring-loss hover:bg-loss hover:text-white',
  ghost: 'text-ink/70 hover:bg-ink/5 hover:text-ink',
};

export function Button({
  variant = 'primary',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      {...props}
      className={cx(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-5 py-2 font-display text-lg font-bold tracking-wide transition-all duration-150 disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        className,
      )}
    />
  );
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('rounded-sm border-2 border-ink/10 bg-white p-4 sm:p-6', className)}>{children}</div>;
}

/** Small uppercase label with an orange slash — used above headings. */
export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cx('flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-blaze uppercase', className)}>
      <span className="inline-block h-3 w-1.5 -skew-x-[20deg] bg-blaze" aria-hidden />
      {children}
    </p>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold tracking-wider text-ink/70 uppercase">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-ink/50">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full min-h-11 rounded-sm border-2 border-ink/15 bg-white px-3 py-2 text-base text-ink transition-colors placeholder:text-ink/40 hover:border-ink/30 focus:border-blaze focus:outline-none focus-visible:outline-none';

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(inputClass, props.className)} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(inputClass, 'cursor-pointer pr-8 font-medium', props.className)} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(inputClass, 'leading-relaxed', props.className)} />;
}

export type Tone = 'green' | 'red' | 'amber' | 'slate' | 'blaze' | 'volt' | 'ink';
const TONES: Record<Tone, string> = {
  green: 'bg-win text-white',
  red: 'bg-loss text-white',
  amber: 'bg-hold text-ink',
  slate: 'bg-ink/10 text-ink',
  blaze: 'bg-blaze text-white',
  volt: 'bg-volt text-ink',
  ink: 'bg-ink text-white',
};

export function Badge({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cx('skew-tag inline-flex items-center gap-1 px-3 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap uppercase', TONES[tone], className)}>
      {children}
    </span>
  );
}

export function PageHeader({ kicker, title, subtitle, actions }: { kicker?: string; title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-8 flex animate-rise flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker && <Kicker className="mb-2">{kicker}</Kicker>}
        <h1 className="font-display text-5xl font-black text-ink sm:text-6xl">{title}</h1>
        {subtitle && <p className="mt-2 text-ink/60">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Big number tile — scoreboard style. */
export function StatTile({
  label,
  value,
  hint,
  tone = 'ink',
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: 'ink' | 'blaze' | 'win' | 'loss' | 'hold';
  icon?: ReactNode;
  className?: string;
}) {
  const toneText = { ink: 'text-ink', blaze: 'text-blaze', win: 'text-win', loss: 'text-loss', hold: 'text-hold' }[tone];
  const toneBar = { ink: 'bg-ink', blaze: 'bg-blaze', win: 'bg-win', loss: 'bg-loss', hold: 'bg-hold' }[tone];
  return (
    <div className={cx('relative overflow-hidden rounded-sm border-2 border-ink/10 bg-white p-4 sm:p-5', className)}>
      <span className={cx('absolute inset-y-0 left-0 w-1.5', toneBar)} aria-hidden />
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-bold tracking-wider text-ink/60 uppercase">{label}</p>
        {icon && <span className={cx('shrink-0', toneText)}>{icon}</span>}
      </div>
      <p className={cx('mt-2 font-display text-3xl font-black whitespace-nowrap sm:text-5xl', toneText)}>{value}</p>
      {hint && <p className="mt-1 text-sm text-ink/55">{hint}</p>}
    </div>
  );
}

/** Jersey-number avatar with stripes. Falls back to the initial. */
export function JerseyAvatar({ number, name, size = 'md', className }: { number?: number; name: string; size?: 'md' | 'lg'; className?: string }) {
  const dims = size === 'lg' ? 'size-20 text-5xl' : 'size-14 text-3xl';
  return (
    <div className={cx('cut-br relative flex shrink-0 items-center justify-center overflow-hidden bg-blaze font-display font-black text-white', dims, className)} aria-hidden>
      <span className="stripes absolute inset-0 text-white/10" />
      <span className="relative">{number ?? name.charAt(0)}</span>
    </div>
  );
}

export function Spinner({ label = 'Chargement…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm font-semibold tracking-wider text-ink/50 uppercase" role="status">
      <span className="relative size-7 animate-bounce rounded-full bg-blaze">
        <span className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 bg-ink/30" />
      </span>
      {label}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert" className="mb-4 flex items-center gap-3 rounded-sm border-l-4 border-loss bg-loss/10 px-4 py-3 text-sm font-medium text-loss">
      <AlertTriangle className="size-5 shrink-0" aria-hidden />
      {message}
    </div>
  );
}

export function EmptyState({ children, icon }: { children: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-sm border-2 border-dashed border-ink/15 px-6 py-14 text-center text-ink/55">
      {icon && <span className="text-ink/25">{icon}</span>}
      <p className="max-w-sm">{children}</p>
    </div>
  );
}

export function Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/70 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[92vh] w-full animate-rise overflow-y-auto bg-white sm:max-w-lg sm:cut-br"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-4 border-blaze bg-ink px-6 py-4">
          <h2 className="font-display text-3xl font-black text-white">{title}</h2>
          <button onClick={onClose} className="flex size-11 items-center justify-center text-white/60 hover:text-white" aria-label="Fermer">
            <X className="size-6" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

/** Month/year navigator used by payments, stats and the attendance calendar. */
export function MonthPicker({
  month,
  year,
  onChange,
  labels,
}: {
  month: number;
  year: number;
  onChange: (m: number, y: number) => void;
  labels: string[];
}) {
  const shift = (delta: number) => {
    const d = new Date(year, month - 1 + delta, 1);
    onChange(d.getMonth() + 1, d.getFullYear());
  };
  const btn = 'flex size-11 items-center justify-center text-white/70 transition-colors hover:bg-blaze hover:text-white';
  return (
    <div className="inline-flex items-center bg-ink">
      <button onClick={() => shift(-1)} className={btn} aria-label="Mois précédent">
        <ChevronLeft className="size-5" />
      </button>
      <span className="min-w-40 px-2 text-center font-display text-2xl font-extrabold text-white" aria-live="polite">
        {labels[month - 1]} <span className="text-volt">{year}</span>
      </span>
      <button onClick={() => shift(1)} className={btn} aria-label="Mois suivant">
        <ChevronRight className="size-5" />
      </button>
    </div>
  );
}

/** Table shell with ink header. */
export function DataTable({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-sm border-2 border-ink/10 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-ink text-xs font-bold tracking-wider text-white/70 uppercase [&_th]:px-4 [&_th]:py-3">{head}</thead>
          <tbody className="divide-y divide-ink/5 [&_td]:px-4 [&_td]:py-3.5">{children}</tbody>
        </table>
      </div>
    </div>
  );
}
