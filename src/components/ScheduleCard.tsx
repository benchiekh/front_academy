import { Megaphone } from 'lucide-react';
import { useEffect, useState } from 'react';
import { scheduleApi } from '../api/endpoints';
import type { Schedule } from '../api/types';
import { BallLoader, cx } from './ui';

/**
 * The weekly training program published by the admin.
 * Shows a bouncing ball while loading (the backend can take a moment to wake up),
 * then hides itself when there is no program. `dir="auto"` renders Arabic programs right-to-left.
 * variant "glass": translucent over a photo background; "solid": plain dark card.
 */
export default function ScheduleCard({ className, variant = 'solid' }: { className?: string; variant?: 'solid' | 'glass' }) {
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    scheduleApi
      .get()
      .then((s) => {
        if (alive) setSchedule(s);
      })
      .catch(() => {
        if (alive) setSchedule(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const isGlass = variant === 'glass';

  const shell = cx(
    'cut-br relative animate-rise overflow-hidden text-white',
    isGlass ? 'border border-white/20 bg-ink/40 p-4 shadow-xl backdrop-blur-sm sm:p-5' : 'border-l-8 border-volt bg-ink p-5 sm:p-6',
    className,
  );

  if (loading) {
    return (
      <div className={shell}>
        <BallLoader onDark label="Chargement du programme…" />
      </div>
    );
  }

  if (!schedule?.content?.trim()) return null;

  return (
    <div className={shell}>
      <div className={cx('flex items-center gap-2 text-volt', isGlass ? 'mb-2' : 'mb-3')}>
        <Megaphone className={cx('shrink-0', isGlass ? 'size-4' : 'size-5')} aria-hidden />
        <p className={cx('font-bold tracking-[0.2em] uppercase', isGlass ? 'text-[11px]' : 'text-xs')}>Programme des séances</p>
        <span className="ml-auto h-px flex-1 bg-volt/30" aria-hidden />
      </div>
      <p
        dir="auto"
        className={cx(
          'leading-relaxed font-medium whitespace-pre-line text-white/95',
          isGlass ? 'text-sm sm:text-base' : 'text-base sm:text-lg',
        )}
      >
        {schedule.content}
      </p>
    </div>
  );
}
