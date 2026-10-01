import { Check, CheckCircle2, ChevronLeft, ChevronRight, Clock, Minus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { paymentsApi } from '../../api/endpoints';
import type { Payment } from '../../api/types';
import { formatDate, formatMoney, MONTHS, MONTHS_SHORT } from '../../lib/labels';
import { Badge, cx, ErrorBox, Kicker, Spinner } from '../ui';

export function KhalesBadge({ paid }: { paid: boolean }) {
  return <Badge tone={paid ? 'green' : 'red'}>{paid ? 'Khalès' : 'Non khalès'}</Badge>;
}

export default function PaymentTab({ playerId, monthlyFee, registeredAt }: { playerId: string; monthlyFee: number; registeredAt?: string }) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const [history, setHistory] = useState<Payment[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [year, setYear] = useState(currentYear);

  useEffect(() => {
    setHistory(null);
    paymentsApi.history(playerId).then(setHistory).catch((e) => setError(errorMessage(e)));
  }, [playerId]);

  if (error) return <ErrorBox message={error} />;
  if (!history) return <Spinner />;

  const find = (m: number, y: number) => history.find((p) => p.month === m && p.year === y);
  const current = find(currentMonth, currentYear);
  const paid = current?.status === 'paid';
  const StatusIcon = paid ? CheckCircle2 : Clock;

  // Fees are owed from registration, or from the first recorded payment if earlier.
  const reg = registeredAt ? new Date(registeredAt) : now;
  const since = Math.min(reg.getFullYear() * 12 + reg.getMonth(), ...history.map((p) => p.year * 12 + p.month - 1));
  const isRegistered = (m: number) => year * 12 + m - 1 >= since;
  const isDue = (m: number) => isRegistered(m) && (year < currentYear || (year === currentYear && m <= currentMonth));
  const cells = MONTHS.map((label, i) => ({ label, month: i + 1, payment: find(i + 1, year) }));
  const dueCells = cells.filter((c) => isDue(c.month));
  const paidCount = dueCells.filter((c) => c.payment?.status === 'paid').length;
  const unpaidMonths = dueCells.filter((c) => c.payment?.status !== 'paid');
  const yearsWithData = new Set(history.map((p) => p.year));
  const yearBtn = 'flex size-11 items-center justify-center text-white/70 transition-colors hover:bg-blaze hover:text-white disabled:opacity-30 disabled:hover:bg-transparent';

  return (
    <div className="space-y-6">
      {/* Current month — scoreboard */}
      <div className={cx('cut-br relative overflow-hidden p-6 text-white sm:p-8', paid ? 'bg-win' : 'bg-loss')}>
        <span className="stripes pointer-events-none absolute inset-y-0 right-0 w-1/3 text-white/10" aria-hidden />
        <div className="relative">
          <p className="text-xs font-bold tracking-[0.2em] text-white/80 uppercase">
            Cotisation · {MONTHS[currentMonth - 1]} {currentYear}
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <p className="flex items-center gap-3 font-display text-6xl font-black sm:text-7xl">
              <StatusIcon className="size-12 shrink-0 sm:size-14" strokeWidth={2.5} aria-hidden />
              {paid ? 'Khalès' : 'Non khalès'}
            </p>
            <p className="font-display text-5xl font-black text-white/90">{formatMoney(current?.amount ?? monthlyFee)}</p>
          </div>
          <p className="mt-3 font-medium text-white/85">
            {paid ? `Payé le ${formatDate(current?.paymentDate)} — merci !` : 'Paiement pas encore enregistré par le coach.'}
          </p>
        </div>
      </div>

      {/* Season grid */}
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <Kicker>Mois par mois</Kicker>
          <div className="inline-flex items-center bg-ink">
            <button onClick={() => setYear(year - 1)} className={yearBtn} disabled={!yearsWithData.has(year - 1)} aria-label="Année précédente">
              <ChevronLeft className="size-5" />
            </button>
            <span className="min-w-20 text-center font-display text-2xl font-extrabold text-volt" aria-live="polite">
              {year}
            </span>
            <button onClick={() => setYear(year + 1)} className={yearBtn} disabled={year >= currentYear} aria-label="Année suivante">
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>

        <div className="mb-3 flex flex-wrap items-center gap-x-6 gap-y-1 border-l-4 border-ink bg-white px-4 py-3">
          <p className="font-display text-3xl font-black">
            <span className={paidCount === dueCells.length ? 'text-win' : 'text-loss'}>{paidCount}</span>
            <span className="text-ink/30">/{dueCells.length}</span>
            <span className="ml-2 text-base text-ink/50">mois payés</span>
          </p>
          {unpaidMonths.length > 0 && (
            <p className="text-sm font-semibold text-loss">
              À régler : {unpaidMonths.map((c) => c.label).join(', ')}
            </p>
          )}
        </div>

        <ol className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {cells.map(({ label, month, payment }) => {
            const ok = payment?.status === 'paid';
            const due = isDue(month);
            const isNow = year === currentYear && month === currentMonth;
            const Icon = ok ? Check : due ? X : Minus;
            return (
              <li
                key={month}
                className={cx(
                  'relative flex flex-col justify-between p-3',
                  ok ? 'bg-win text-white' : due ? 'border-2 border-loss/40 bg-loss/10 text-loss' : 'border-2 border-dashed border-ink/10 text-ink/30',
                  isNow && 'outline-3 outline-offset-2 outline-blaze',
                )}
                aria-label={`${label} ${year} : ${ok ? 'khalès' : due ? 'non khalès' : isRegistered(month) ? 'pas encore dû' : 'pas encore inscrit'}`}
              >
                <div className="flex items-start justify-between">
                  <span className="font-display text-2xl font-black">{MONTHS_SHORT[month - 1]}</span>
                  <Icon className="size-5" strokeWidth={3} aria-hidden />
                </div>
                <span className={cx('mt-3 text-[11px] font-bold tracking-wide uppercase', ok ? 'text-white/85' : '')}>
                  {ok ? formatDate(payment?.paymentDate).slice(0, 5) : due ? 'Non khalès' : isRegistered(month) ? 'À venir' : '—'}
                </span>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
