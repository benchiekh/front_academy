import {
  Banknote,
  ClipboardCheck,
  ClipboardList,
  History,
  KeyRound,
  Pencil,
  RotateCcw,
  Trash2,
  Undo2,
  UserPlus,
  UserX,
  type LucideIcon,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { activityApi, type ActivityQuery } from '../../api/endpoints';
import type { ActivityAction, ActivityLog, ActivitySummaryRow } from '../../api/types';
import { Badge, Button, cx, EmptyState, ErrorBox, Field, Input, Kicker, MonthPicker, PageHeader, Select, Spinner, type Tone } from '../../components/ui';
import { MONTHS } from '../../lib/labels';

const ACTION_STYLE: Record<ActivityAction, { icon: LucideIcon; box: string; label: string; tone: Tone }> = {
  'attendance.mark': { icon: ClipboardCheck, box: 'bg-blaze text-white', label: 'Appel', tone: 'blaze' },
  'payment.paid': { icon: Banknote, box: 'bg-win text-white', label: 'Khalès', tone: 'green' },
  'payment.unpaid': { icon: Undo2, box: 'bg-loss text-white', label: 'Non khalès', tone: 'red' },
  'sheet.update': { icon: ClipboardList, box: 'bg-ink text-white', label: 'Fiche', tone: 'ink' },
  'player.create': { icon: UserPlus, box: 'bg-volt text-ink', label: 'Joueur', tone: 'volt' },
  'player.update': { icon: Pencil, box: 'bg-ink/10 text-ink', label: 'Joueur', tone: 'slate' },
  'player.delete': { icon: Trash2, box: 'bg-loss text-white', label: 'Suppression', tone: 'red' },
  'user.create': { icon: KeyRound, box: 'bg-volt text-ink', label: 'Compte', tone: 'volt' },
  'user.update': { icon: KeyRound, box: 'bg-ink/10 text-ink', label: 'Compte', tone: 'slate' },
  'user.delete': { icon: UserX, box: 'bg-loss text-white', label: 'Suppression', tone: 'red' },
};

const TYPE_FILTERS = [
  { value: '', label: 'Toutes les actions' },
  { value: 'attendance', label: 'Appels (présences)' },
  { value: 'payment', label: 'Paiements' },
  { value: 'payment.unpaid', label: 'Paiements annulés (non khalès)' },
  { value: 'sheet', label: 'Fiches techniques' },
  { value: 'player', label: 'Joueurs' },
  { value: 'user', label: 'Comptes' },
];

const PAGE_SIZE = 40;

const dayKey = (iso: string) => new Date(iso).toLocaleDateString('fr-CA'); // YYYY-MM-DD, local
const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Aujourd'hui";
  if (d.toDateString() === yesterday.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};
const timeLabel = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
const relative = (iso: string | null) => {
  if (!iso) return 'Aucune activité';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return `Aujourd'hui à ${timeLabel(iso)}`;
  if (days === 1) return 'Hier';
  return `Il y a ${days} jours`;
};

/** Admin-only journal: who took each roll call, who marked each payment, who edited what. */
export default function ActivityPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [summary, setSummary] = useState<ActivitySummaryRow[] | null>(null);

  const [filters, setFilters] = useState<ActivityQuery>({});
  const [items, setItems] = useState<ActivityLog[] | null>(null);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSummary(null);
    activityApi.summary(month, year).then(setSummary).catch((e) => setError(errorMessage(e)));
  }, [month, year]);

  const load = useCallback(
    async (p: number) => {
      const res = await activityApi.list({ ...filters, page: p, limit: PAGE_SIZE });
      setItems((prev) => (p === 1 ? res.items : [...(prev ?? []), ...res.items]));
      setPage(res.page);
      setPages(res.pages);
      setTotal(res.total);
    },
    [filters],
  );

  useEffect(() => {
    setItems(null);
    setError(null);
    load(1).catch((e) => setError(errorMessage(e)));
  }, [load]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await load(page + 1);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoadingMore(false);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, ActivityLog[]>();
    (items ?? []).forEach((i) => {
      const k = dayKey(i.createdAt);
      map.set(k, [...(map.get(k) ?? []), i]);
    });
    return [...map.entries()];
  }, [items]);

  const set = (patch: Partial<ActivityQuery>) => setFilters((f) => ({ ...f, ...patch }));
  const hasFilters = Object.values(filters).some(Boolean);
  const selectedActor = summary?.find((s) => s.actorId === filters.actorId);

  return (
    <>
      <PageHeader
        kicker="Administration"
        title="Traçabilité"
        subtitle="Qui a fait l'appel, qui a marqué les paiements, qui a modifié quoi — tout est journalisé."
        actions={<MonthPicker month={month} year={year} labels={MONTHS} onChange={(m, y) => { setMonth(m); setYear(y); }} />}
      />

      {/* Coach scoreboard for the month */}
      <Kicker className="mb-3">Activité par coach · {MONTHS[month - 1]} {year}</Kicker>
      {!summary && !error && <Spinner />}
      {summary && (
        <div className="mb-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {summary
            .filter((s) => s.actorRole === 'coach' || s.total > 0)
            .map((s) => {
              const active = filters.actorId === s.actorId;
              return (
                <button
                  key={s.actorId}
                  onClick={() => set({ actorId: active ? undefined : s.actorId })}
                  aria-pressed={active}
                  className={cx(
                    'group relative border-2 bg-white p-4 text-left transition-all hover:border-ink',
                    active ? 'border-blaze shadow-[4px_4px_0_0_var(--color-blaze)]' : 'border-ink/10',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <span className={cx('flex size-11 shrink-0 items-center justify-center font-display text-2xl font-black', active ? 'bg-blaze text-white' : 'bg-volt text-ink')}>
                      {s.actorName.replace(/^Coach /, '').charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-2xl leading-none font-extrabold">{s.actorName}</p>
                      <p className="mt-1 text-xs text-ink/50">{relative(s.lastAt)}</p>
                    </div>
                    {s.actorRole === 'admin' && <Badge tone="ink">Admin</Badge>}
                  </div>
                  <dl className="mt-4 grid grid-cols-4 gap-2 border-t border-ink/10 pt-3 text-center">
                    {[
                      ['Appels', s.attendance, 'text-blaze'],
                      ['Khalès', s.paid, 'text-win'],
                      ['Annulés', s.unpaid, 'text-loss'],
                      ['Fiches', s.sheets, 'text-ink'],
                    ].map(([label, value, tone]) => (
                      <div key={label as string}>
                        <dd className={cx('font-display text-3xl font-black', tone as string, !value && 'opacity-25')}>{value}</dd>
                        <dt className="text-[10px] font-bold tracking-wider text-ink/45 uppercase">{label}</dt>
                      </div>
                    ))}
                  </dl>
                  <span className="mt-3 block text-xs font-semibold text-ink/40 group-hover:text-blaze">
                    {active ? '✓ Journal filtré sur ce coach' : 'Voir son journal →'}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 grid gap-3 border-2 border-ink/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto] lg:items-end">
        <Field label="Coach / auteur">
          <Select value={filters.actorId ?? ''} onChange={(e) => set({ actorId: e.target.value || undefined })}>
            <option value="">Tout le monde</option>
            {summary?.map((s) => (
              <option key={s.actorId} value={s.actorId}>
                {s.actorName}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Type d'action">
          <Select value={filters.action ?? ''} onChange={(e) => set({ action: e.target.value || undefined })}>
            {TYPE_FILTERS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Du">
          <Input type="date" value={filters.from ?? ''} max={filters.to} onChange={(e) => set({ from: e.target.value || undefined })} />
        </Field>
        <Field label="Au">
          <Input type="date" value={filters.to ?? ''} min={filters.from} onChange={(e) => set({ to: e.target.value || undefined })} />
        </Field>
        <Button variant="ghost" onClick={() => setFilters({})} disabled={!hasFilters} className="sm:col-span-2 lg:col-span-1">
          <RotateCcw className="size-4" aria-hidden /> Réinitialiser
        </Button>
      </div>

      <ErrorBox message={error} />

      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <Kicker>
          Journal{selectedActor ? ` · ${selectedActor.actorName}` : ''}
        </Kicker>
        {items && <p className="text-sm text-ink/50">{total} action{total > 1 ? 's' : ''}</p>}
      </div>

      {!items && !error && <Spinner />}
      {items?.length === 0 && <EmptyState icon={<History className="size-12" />}>Aucune action ne correspond à ces filtres.</EmptyState>}

      {groups.map(([key, entries]) => (
        <section key={key} className="mb-6">
          <h2 className="sticky top-14 z-10 mb-2 bg-paper/95 py-1 font-display text-xl font-extrabold text-ink/70 capitalize backdrop-blur lg:top-0">
            {dayLabel(entries[0].createdAt)}
          </h2>
          <ol className="relative space-y-2 border-l-4 border-ink/10 pl-4 sm:pl-6">
            {entries.map((e) => {
              const st = ACTION_STYLE[e.action];
              const Icon = st.icon;
              const linkPlayer = e.playerId && e.action !== 'player.delete';
              return (
                <li key={e._id} className="relative flex gap-3 border-2 border-ink/10 bg-white p-3 sm:gap-4 sm:p-4">
                  <span className="absolute top-5 -left-[26px] size-3 rounded-full bg-ink/20 ring-4 ring-paper sm:-left-[34px]" aria-hidden />
                  <span className={cx('flex size-10 shrink-0 items-center justify-center', st.box)} aria-hidden>
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="leading-snug">
                      <button
                        onClick={() => set({ actorId: e.actorId })}
                        className="font-display text-lg font-extrabold text-ink hover:text-blaze"
                        title={`Filtrer sur ${e.actorName}`}
                      >
                        {e.actorName}
                      </button>{' '}
                      <span className="text-ink/75">{e.summary}</span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/45">
                      <time dateTime={e.createdAt} className="font-semibold">
                        {timeLabel(e.createdAt)}
                      </time>
                      <Badge tone={st.tone}>{st.label}</Badge>
                      {e.actorRole === 'admin' && <Badge tone="ink">Admin</Badge>}
                      {linkPlayer && (
                        <Link to={`/players/${e.playerId}`} className="font-semibold text-blaze hover:underline">
                          Voir {e.playerName} →
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      ))}

      {items && page < pages && (
        <div className="flex justify-center py-4">
          <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
            {loadingMore ? 'Chargement…' : `Charger plus (${total - items.length} restantes)`}
          </Button>
        </div>
      )}
    </>
  );
}
