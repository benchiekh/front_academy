import { CalendarDays, Check, ChevronLeft, ChevronRight, CreditCard, Grid3x3, Minus, Search, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { errorMessage } from '../../api/client';
import { paymentsApi } from '../../api/endpoints';
import { CATEGORIES, type PaymentGridRow, type PaymentStatus, type PaymentYearRow } from '../../api/types';
import { KhalesBadge } from '../../components/parent/PaymentTab';
import { cx, EmptyState, ErrorBox, Input, MonthPicker, PageHeader, Select, Spinner, StatTile } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatDate, formatMoney, MONTHS, MONTHS_SHORT } from '../../lib/labels';

type View = 'month' | 'year';

/** Payments: a month list (one switch per player) and a year grid (players × 12 months). */
export default function PaymentsPage() {
  const [view, setView] = useState<View>('month');
  const [category, setCategory] = useState('');

  return (
    <>
      <PageHeader
        kicker="Cotisations"
        title="Paiements"
        subtitle="Consultez qui est khalès, mois par mois."
        actions={
          <>
            <div className="inline-flex bg-ink p-1" role="tablist" aria-label="Affichage">
              {(
                [
                  ['month', 'Par mois', CalendarDays],
                  ['year', 'Année', Grid3x3],
                ] as const
              ).map(([key, label, Icon]) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={view === key}
                  onClick={() => setView(key)}
                  className={cx(
                    'flex min-h-10 items-center gap-2 px-4 font-display text-lg font-bold transition-colors',
                    view === key ? 'bg-volt text-ink' : 'text-white/60 hover:text-white',
                  )}
                >
                  <Icon className="size-4" aria-hidden /> {label}
                </button>
              ))}
            </div>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="!w-auto" aria-label="Filtrer par catégorie">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </>
        }
      />
      {view === 'month' ? <MonthView category={category} /> : <YearView category={category} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Month view                                                          */
/* ------------------------------------------------------------------ */

type Filter = 'all' | 'paid' | 'unpaid';

function MonthView({ category }: { category: string }) {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<PaymentGridRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setRows(null);
    setError(null);
    paymentsApi
      .month(month, year, category || undefined)
      .then(setRows)
      .catch((e) => setError(errorMessage(e)));
  }, [month, year, category]);

  const toggle = async (row: PaymentGridRow) => {
    const status: PaymentStatus = row.status === 'paid' ? 'unpaid' : 'paid';
    setBusy(row.playerId);
    try {
      const saved = await paymentsApi.upsert({ playerId: row.playerId, month, year, status, amount: row.amount });
      setRows((r) =>
        r?.map((p) =>
          p.playerId === row.playerId
            ? { ...p, status: saved.status, paymentDate: saved.paymentDate ?? null, markedByName: user?.name ?? null }
            : p,
        ) ?? null,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const paid = rows?.filter((r) => r.status === 'paid') ?? [];
  const collected = paid.reduce((s, r) => s + r.amount, 0);
  const expected = rows?.reduce((s, r) => s + r.amount, 0) ?? 0;
  const counts = { all: rows?.length ?? 0, paid: paid.length, unpaid: (rows?.length ?? 0) - paid.length };

  const visible = (rows ?? []).filter(
    (r) => (filter === 'all' || r.status === filter) && r.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  const FILTERS: { key: Filter; label: string; tone: string }[] = [
    { key: 'all', label: 'Tous', tone: 'bg-ink text-white' },
    { key: 'paid', label: 'Khalès', tone: 'bg-win text-white' },
    { key: 'unpaid', label: 'Non khalès', tone: 'bg-loss text-white' },
  ];

  return (
    <>
      <div className="mb-6">
        <MonthPicker month={month} year={year} labels={MONTHS} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>
      <ErrorBox message={error} />
      {!rows && !error && <Spinner />}
      {rows?.length === 0 && <EmptyState icon={<CreditCard className="size-12" />}>Aucun joueur actif dans cette sélection.</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-3 gap-3">
            <StatTile label="Khalès" value={`${counts.paid}/${counts.all}`} tone="win" />
            <StatTile label="Encaissé" value={formatMoney(collected)} tone="ink" hint={`sur ${formatMoney(expected)}`} />
            <StatTile label="Reste" value={formatMoney(expected - collected)} tone="loss" />
          </div>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-1.5" role="radiogroup" aria-label="Filtrer par statut">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  role="radio"
                  aria-checked={filter === f.key}
                  onClick={() => setFilter(f.key)}
                  className={cx(
                    'skew-tag flex min-h-10 items-center gap-2 px-4 text-sm font-bold tracking-wide uppercase transition-colors',
                    filter === f.key ? f.tone : 'bg-white text-ink/60 hover:bg-ink/5',
                  )}
                >
                  {f.label}
                  <span className={cx('font-display text-lg', filter === f.key ? 'opacity-80' : 'text-ink/40')}>{counts[f.key]}</span>
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink/35" aria-hidden />
              <Input type="search" placeholder="Rechercher un joueur" value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9" aria-label="Rechercher un joueur" />
            </div>
          </div>

          {visible.length === 0 ? (
            <EmptyState>Aucun joueur ne correspond à ce filtre.</EmptyState>
          ) : (
            <ul className="space-y-2">
              {visible.map((r) => {
                const isPaid = r.status === 'paid';
                return (
                  <li key={r.playerId} className="flex items-center gap-4 border-2 border-ink/10 bg-white py-3 pr-4 pl-3 sm:pl-5">
                    <span className={cx('h-10 w-1.5 shrink-0 transition-colors', isPaid ? 'bg-win' : 'bg-loss')} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-2xl font-extrabold">{r.name}</p>
                      <p className="text-xs text-ink/50">
                        <span className="font-bold tracking-wider uppercase">{r.category}</span> · {formatMoney(r.amount)}
                        {isPaid && ` · payé le ${formatDate(r.paymentDate)}`}
                        {r.markedByName && (
                          <span className="text-ink/40">
                            {' · par '}
                            <strong className="font-semibold text-ink/70">{r.markedByName}</strong>
                          </span>
                        )}
                      </p>
                    </div>
                    <span className="hidden sm:inline">
                      <KhalesBadge paid={isPaid} />
                    </span>
                    <button
                      role="switch"
                      aria-checked={isPaid}
                      aria-label={`${r.name} : ${isPaid ? 'khalès' : 'non khalès'}`}
                      disabled={busy === r.playerId}
                      onClick={() => toggle(r)}
                      className={cx('relative h-9 w-16 shrink-0 transition-colors disabled:opacity-50', isPaid ? 'bg-win' : 'bg-ink/20')}
                    >
                      <span
                        className={cx(
                          'absolute top-1 flex size-7 items-center justify-center bg-white shadow transition-all duration-200',
                          isPaid ? 'left-8 text-win' : 'left-1 text-ink/40',
                        )}
                      >
                        {isPaid ? <Check className="size-4" strokeWidth={3} /> : <Minus className="size-4" />}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Year view — players × 12 months                                     */
/* ------------------------------------------------------------------ */

function YearView({ category }: { category: string }) {
  const { user } = useAuth();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<PaymentYearRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    setRows(null);
    setError(null);
    paymentsApi
      .year(year, category || undefined)
      .then(setRows)
      .catch((e) => setError(errorMessage(e)));
  }, [year, category]);

  /** A month is "due" once it has started. */
  const isDue = (m: number) => year < now.getFullYear() || (year === now.getFullYear() && m <= now.getMonth() + 1);
  /** Months before the player joined are not owed. */
  const isRegistered = (r: PaymentYearRow, m: number) => year * 12 + m >= r.since.year * 12 + r.since.month;
  const owes = (r: PaymentYearRow, m: number) => isDue(m) && isRegistered(r, m);
  const isCurrent = (m: number) => year === now.getFullYear() && m === now.getMonth() + 1;

  const toggle = async (row: PaymentYearRow, monthIdx: number) => {
    const cell = row.months[monthIdx];
    const status: PaymentStatus = cell?.status === 'paid' ? 'unpaid' : 'paid';
    const k = `${row.playerId}-${monthIdx}`;
    setBusy(k);
    try {
      const saved = await paymentsApi.upsert({
        playerId: row.playerId,
        month: monthIdx + 1,
        year,
        status,
        amount: cell?.amount ?? row.monthlyFee,
      });
      setRows((rs) =>
        rs?.map((r) =>
          r.playerId !== row.playerId
            ? r
            : {
                ...r,
                months: r.months.map((c, i) =>
                  i === monthIdx
                    ? { status: saved.status, amount: saved.amount, paymentDate: saved.paymentDate ?? null, markedByName: user?.name ?? '' }
                    : c,
                ),
              },
        ) ?? null,
      );
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(null);
    }
  };

  const totals = useMemo(() => {
    const perMonth = Array.from({ length: 12 }, (_, i) =>
      (rows ?? []).reduce(
        (acc, r) => {
          const c = r.months[i];
          if (c?.status === 'paid') {
            acc.count++;
            acc.amount += c.amount;
          }
          return acc;
        },
        { count: 0, amount: 0 },
      ),
    );
    const collected = perMonth.reduce((s, m) => s + m.amount, 0);
    const lateCells = (rows ?? []).reduce(
      (s, r) => s + r.months.filter((c, i) => owes(r, i + 1) && c?.status !== 'paid').length,
      0,
    );
    return { perMonth, collected, lateCells };
  }, [rows, year]);

  const yearBtn = 'flex size-11 items-center justify-center text-white/70 transition-colors hover:bg-blaze hover:text-white';

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <div className="inline-flex items-center bg-ink">
          <button onClick={() => setYear(year - 1)} className={yearBtn} aria-label="Année précédente">
            <ChevronLeft className="size-5" />
          </button>
          <span className="min-w-28 text-center font-display text-2xl font-extrabold text-white" aria-live="polite">
            Saison <span className="text-volt">{year}</span>
          </span>
          <button onClick={() => setYear(year + 1)} className={yearBtn} aria-label="Année suivante">
            <ChevronRight className="size-5" />
          </button>
        </div>
        <Legend />
      </div>

      <ErrorBox message={error} />
      {!rows && !error && <Spinner />}
      {rows?.length === 0 && <EmptyState icon={<Grid3x3 className="size-12" />}>Aucun joueur actif dans cette sélection.</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatTile label={`Encaissé ${year}`} value={formatMoney(totals.collected)} tone="win" />
            <StatTile label="Mois impayés" value={totals.lateCells} tone="loss" hint="tous joueurs confondus" />
            <StatTile label="Joueurs" value={rows.length} tone="ink" className="col-span-2 sm:col-span-1" />
          </div>

          <p className="mb-2 text-xs text-ink/50 sm:hidden">← Faites glisser le tableau pour voir tous les mois →</p>
          <div className="overflow-x-auto border-2 border-ink/10 bg-white">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-ink text-white">
                  <th className="sticky left-0 z-10 min-w-40 bg-ink px-4 py-3 text-left text-xs font-bold tracking-wider text-white/70 uppercase">Joueur</th>
                  {MONTHS.map((m, i) => (
                    <th
                      key={m}
                      scope="col"
                      className={cx('px-1 py-3 text-center font-display text-base font-bold', isCurrent(i + 1) ? 'bg-blaze text-white' : 'text-white/70')}
                    >
                      {MONTHS_SHORT[i]}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-center text-xs font-bold tracking-wider text-white/70 uppercase">Payés</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/5">
                {rows.map((r) => {
                  const paidCount = r.months.filter((c) => c?.status === 'paid').length;
                  const dueCount = MONTHS.filter((_, i) => owes(r, i + 1)).length;
                  return (
                    <tr key={r.playerId} className="group hover:bg-paper">
                      <th scope="row" className="sticky left-0 z-10 bg-white px-4 py-2 text-left group-hover:bg-paper">
                        <span className="block font-display text-lg leading-tight font-extrabold whitespace-nowrap">{r.name}</span>
                        <span className="text-[11px] font-bold tracking-wider text-ink/40 uppercase">
                          {r.category} · {formatMoney(r.monthlyFee)}
                        </span>
                      </th>
                      {r.months.map((cell, i) => (
                        <td key={i} className={cx('px-0.5 py-1.5 text-center', isCurrent(i + 1) && 'bg-blaze-50')}>
                          <Cell
                            paid={cell?.status === 'paid'}
                            due={owes(r, i + 1)}
                            registered={isRegistered(r, i + 1)}
                            busy={busy === `${r.playerId}-${i}`}
                            label={`${r.name}, ${MONTHS[i]} ${year}`}
                            title={
                              cell?.status === 'paid'
                                ? `Payé le ${formatDate(cell.paymentDate)} · ${formatMoney(cell.amount)} · par ${cell.markedByName}`
                                : cell
                                  ? `Non khalès · modifié par ${cell.markedByName}`
                                  : undefined
                            }
                            onClick={() => toggle(r, i)}
                          />
                        </td>
                      ))}
                      <td className="px-3 text-center font-display text-xl font-black whitespace-nowrap">
                        <span className={paidCount >= dueCount ? 'text-win' : 'text-loss'}>{paidCount}</span>
                        <span className="text-ink/30">/{dueCount}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-4 border-ink bg-paper">
                  <th scope="row" className="sticky left-0 z-10 bg-paper px-4 py-3 text-left text-xs font-bold tracking-wider text-ink/60 uppercase">
                    Encaissé
                  </th>
                  {totals.perMonth.map((t, i) => (
                    <td key={i} className={cx('px-1 py-3 text-center', isCurrent(i + 1) && 'bg-blaze-50')}>
                      <span className="block font-display text-base font-black">{t.amount || '—'}</span>
                      <span className="text-[10px] font-bold text-ink/40">{t.count ? `${t.count} pay.` : ''}</span>
                    </td>
                  ))}
                  <td className="px-3 py-3 text-center font-display text-lg font-black whitespace-nowrap text-win">{formatMoney(totals.collected)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink/50">Cliquez sur une case pour la passer en khalès / non khalès.</p>
        </>
      )}
    </>
  );
}

function Cell({ paid, due, registered, busy, label, title, onClick }: { paid: boolean; due: boolean; registered: boolean; busy: boolean; label: string; title?: string; onClick: () => void }) {
  const state = paid ? 'paid' : due ? 'late' : 'future';
  const idle = registered ? 'Pas encore dû' : 'Pas encore inscrit';
  const styles = {
    paid: 'bg-win text-white hover:bg-win/80',
    late: 'bg-loss/15 text-loss hover:bg-loss hover:text-white',
    future: 'bg-paper text-ink/25 hover:bg-ink/10 hover:text-ink/60',
  }[state];
  const Icon = paid ? Check : due ? X : Minus;
  return (
    <button
      onClick={onClick}
      disabled={busy}
      aria-pressed={paid}
      aria-label={`${label} : ${paid ? 'khalès' : due ? 'non khalès' : idle.toLowerCase()}`}
      title={title ?? (paid ? 'Khalès' : due ? 'Non khalès' : idle)}
      className={cx('mx-auto flex size-10 items-center justify-center transition-colors disabled:animate-pulse', styles)}
    >
      <Icon className="size-5" strokeWidth={paid ? 3 : 2.5} aria-hidden />
    </button>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-xs font-semibold text-ink/60">
      <span className="flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center bg-win text-white">
          <Check className="size-3" strokeWidth={3} />
        </span>
        Khalès
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center bg-loss/15 text-loss">
          <X className="size-3" strokeWidth={3} />
        </span>
        Non khalès
      </span>
      <span className="flex items-center gap-1.5">
        <span className="flex size-5 items-center justify-center bg-paper text-ink/30 ring-1 ring-ink/10">
          <Minus className="size-3" />
        </span>
        Pas dû / pas inscrit
      </span>
    </div>
  );
}
