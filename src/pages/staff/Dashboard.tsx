import { ArrowUpRight, Banknote, ClipboardCheck, CreditCard, Gauge, Shirt, TrendingDown, UserPlus, Users, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { paymentsApi } from '../../api/endpoints';
import type { PaymentStats } from '../../api/types';
import { ErrorBox, Kicker, MonthPicker, PageHeader, Spinner, StatTile } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatMoney, MONTHS, MONTHS_SHORT } from '../../lib/labels';

const QUICK_ACTIONS: { to: string; label: string; hint: string; icon: LucideIcon }[] = [
  { to: '/attendance', label: "Faire l'appel", hint: 'Séance du jour', icon: ClipboardCheck },
  { to: '/payments', label: 'Paiements', hint: 'Marquer les cotisations', icon: CreditCard },
  { to: '/players', label: 'Joueurs', hint: 'Fiches techniques', icon: Shirt },
  { to: '/parents', label: 'Compte parent', hint: 'Créer des accès', icon: UserPlus },
];

function QuickAction({ to, label, hint, icon: Icon }: (typeof QUICK_ACTIONS)[number]) {
  return (
    <Link
      to={to}
      className="group relative flex min-h-16 items-center gap-3 border-2 border-ink/10 bg-white p-4 transition-all hover:border-ink hover:bg-ink hover:text-white"
    >
      <span className="flex size-10 shrink-0 items-center justify-center bg-blaze text-white">
        <Icon className="size-5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-xl leading-none font-extrabold">{label}</span>
        <span className="mt-1 hidden text-xs text-ink/50 group-hover:text-white/60 sm:block">{hint}</span>
      </span>
      <ArrowUpRight className="size-5 shrink-0 opacity-30 transition-opacity group-hover:text-volt group-hover:opacity-100" aria-hidden />
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAdmin) return; // club finances are admin-only
    setStats(null);
    paymentsApi.stats(month, year).then(setStats).catch((e) => setError(errorMessage(e)));
  }, [month, year, isAdmin]);

  const firstName = user?.name.split(' ').pop() ?? '';

  // Coach view: daily tools only — no club money figures.
  if (!isAdmin) {
    return (
      <>
        <PageHeader kicker="Espace coach" title={`Salut ${firstName}`} subtitle="Vos outils du quotidien, en un coup d'œil." />
        <div className="grid animate-rise grid-cols-1 gap-3 sm:grid-cols-2">
          {QUICK_ACTIONS.map((a) => (
            <QuickAction key={a.to} {...a} />
          ))}
        </div>
      </>
    );
  }

  const maxTrend = Math.max(1, ...(stats?.trend.map((t) => t.collected) ?? [1]));

  return (
    <>
      <PageHeader
        kicker="Vue d'ensemble du club"
        title={`Salut ${firstName}`}
        subtitle="Les chiffres du mois, en un coup d'œil."
        actions={<MonthPicker month={month} year={year} labels={MONTHS} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />
      <ErrorBox message={error} />
      {!stats && !error && <Spinner />}

      {stats && (
        <div className="space-y-8">
          {/* Scoreboard hero */}
          <div className="cut-br court-bg relative grid animate-rise gap-6 overflow-hidden p-6 text-white sm:grid-cols-[1fr_auto] sm:p-8">
            <div>
              <p className="text-xs font-bold tracking-[0.2em] text-white/50 uppercase">Taux de recouvrement</p>
              <p className="mt-2 font-display text-8xl font-black text-volt sm:text-9xl">
                {stats.collectionRate}
                <span className="text-5xl text-white/40">%</span>
              </p>
              <div className="mt-4 h-3 w-full max-w-md bg-white/10" role="progressbar" aria-valuenow={stats.collectionRate} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full bg-volt transition-all duration-700" style={{ width: `${stats.collectionRate}%` }} />
              </div>
            </div>
            <div className="flex items-end gap-8 sm:flex-col sm:items-end sm:justify-end sm:gap-3 sm:text-right">
              <div>
                <p className="font-display text-6xl font-black">
                  {stats.paidCount}
                  <span className="text-white/30">/{stats.activePlayers}</span>
                </p>
                <p className="text-xs font-bold tracking-wider text-white/50 uppercase">Joueurs Payé</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <StatTile label="Encaissé" value={formatMoney(stats.collected)} tone="win" icon={<Banknote className="size-5" />} hint={`sur ${formatMoney(stats.expected)}`} />
            <StatTile label="Reste à encaisser" value={formatMoney(stats.outstanding)} tone="loss" icon={<TrendingDown className="size-5" />} />
            <StatTile label="Non Payé" value={stats.unpaidCount} tone="hold" icon={<Users className="size-5" />} hint="joueurs à relancer" />
            <StatTile label="Joueurs actifs" value={stats.activePlayers} tone="blaze" icon={<Gauge className="size-5" />} />
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <section className="border-2 border-ink/10 bg-white p-5 sm:p-6">
              <Kicker>Encaissements · 6 mois</Kicker>
              <div className="mt-6 flex h-56 items-end gap-2 sm:gap-4" role="img" aria-label="Encaissements des 6 derniers mois">
                {stats.trend.map((t) => {
                  const active = t.month === month && t.year === year;
                  return (
                    <div key={`${t.year}-${t.month}`} className="flex h-full flex-1 flex-col items-center gap-2">
                      <span className={`h-5 font-display text-lg font-bold whitespace-nowrap ${active ? 'text-blaze' : 'text-ink/50'}`}>
                        {t.collected ? t.collected : ''}
                      </span>
                      <div className="flex w-full flex-1 items-end justify-center">
                        <div
                          className={`relative w-full max-w-14 overflow-hidden transition-all duration-700 ${active ? 'bg-blaze' : 'bg-ink'}`}
                          style={{ height: `${Math.max((t.collected / maxTrend) * 100, 2)}%` }}
                        >
                          {active && <span className="stripes absolute inset-0 text-white/15" />}
                        </div>
                      </div>
                      <span className={`font-display text-lg font-bold ${active ? 'text-ink' : 'text-ink/40'}`}>{MONTHS_SHORT[t.month - 1]}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <Kicker className="mb-3">Actions rapides</Kicker>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
                {QUICK_ACTIONS.map((a) => (
                  <QuickAction key={a.to} {...a} />
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </>
  );
}
