import { Check, CheckCheck, ClipboardCheck, FileText, UserCheck, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { attendanceApi } from '../../api/endpoints';
import { CATEGORIES, type AttendanceStatus, type RollCallRow } from '../../api/types';
import { Button, EmptyState, ErrorBox, Input, PageHeader, Select, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { ATTENDANCE_LABELS, ATTENDANCE_STYLES, todayISO } from '../../lib/labels';

const STATUSES: { key: AttendanceStatus; icon: typeof Check }[] = [
  { key: 'present', icon: Check },
  { key: 'absent', icon: X },
  { key: 'excused', icon: FileText },
];

/** Daily roll call: one tap per player, then save everything in one request. */
export default function AttendancePage() {
  const [date, setDate] = useState(todayISO());
  const [category, setCategory] = useState('');
  const [rows, setRows] = useState<RollCallRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [markedBy, setMarkedBy] = useState<{ name: string; at: string } | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    setRows(null);
    setError(null);
    setMessage(null);
    attendanceApi
      .day(date, category || undefined)
      .then((d) => {
        setRows(d.players);
        setMarkedBy(d.markedBy);
      })
      .catch((e) => setError(errorMessage(e)));
  }, [date, category]);

  const setStatus = (playerId: string, status: AttendanceStatus) => {
    setMessage(null);
    setRows((r) => r?.map((p) => (p.playerId === playerId ? { ...p, status } : p)) ?? null);
  };

  const markAllPresent = () => setRows((r) => r?.map((p) => ({ ...p, status: p.status ?? 'present' })) ?? null);

  const save = async () => {
    const records = (rows ?? []).filter((r) => r.status).map((r) => ({ playerId: r.playerId, status: r.status! }));
    if (!records.length) return;
    setSaving(true);
    setMessage(null);
    try {
      await attendanceApi.bulk(date, records);
      setMessage(`Appel enregistré · ${records.length} joueurs`);
      setMarkedBy({ name: user?.name ?? '', at: new Date().toISOString() });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const count = (s: AttendanceStatus) => rows?.filter((r) => r.status === s).length ?? 0;
  const unmarked = rows?.filter((r) => !r.status).length ?? 0;

  return (
    <>
      <PageHeader
        kicker="Feuille de match"
        title="Présences"
        subtitle="Un tap par joueur, puis enregistrez l'appel."
        actions={
          <>
            <Input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="!w-auto" aria-label="Date de la séance" />
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="!w-auto" aria-label="Filtrer par catégorie">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </>
        }
      />
      <ErrorBox message={error} />
      {!rows && !error && <Spinner />}
      {rows?.length === 0 && <EmptyState icon={<ClipboardCheck className="size-12" />}>Aucun joueur actif dans cette sélection.</EmptyState>}

      {rows && rows.length > 0 && (
        <>
          {/* Who took this roll call (traçabilité) */}
          <p className="mb-3 flex items-center gap-2 text-sm text-ink/60">
            <UserCheck className="size-4 text-blaze" aria-hidden />
            {markedBy ? (
              <>
                Appel enregistré par <strong className="font-semibold text-ink">{markedBy.name}</strong>{' '}
                <span className="text-ink/40">
                  · {new Date(markedBy.at).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </>
            ) : (
              "Pas encore d'appel enregistré pour cette séance."
            )}
          </p>

          {/* Scoreboard strip */}
          <div className="mb-4 grid grid-cols-3 bg-ink text-white sm:flex sm:items-stretch">
            {STATUSES.map(({ key }) => (
              <div key={key} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-r border-white/10 px-3 py-3 sm:gap-3 sm:px-5">
                <span className={`size-3 ${ATTENDANCE_STYLES[key].split(' ')[0]}`} aria-hidden />
                <span className="font-display text-3xl font-black">{count(key)}</span>
                <span className="text-xs font-bold tracking-wider text-white/50 uppercase">{ATTENDANCE_LABELS[key]}</span>
              </div>
            ))}
            {unmarked > 0 && (
              <div className="hidden items-center gap-3 px-5 py-3 sm:flex">
                <span className="font-display text-3xl font-black text-white/40">{unmarked}</span>
                <span className="text-xs font-bold tracking-wider text-white/40 uppercase">à marquer</span>
              </div>
            )}
            <button onClick={markAllPresent} className="col-span-3 flex min-h-11 items-center justify-center gap-2 bg-volt px-5 sm:ml-auto font-display text-lg font-bold text-ink hover:bg-volt-600">
              <CheckCheck className="size-5" aria-hidden /> Tous présents
            </button>
          </div>

          <ul className="space-y-2">
            {rows.map((r, i) => (
              <li
                key={r.playerId}
                className="flex animate-rise flex-col gap-3 border-2 border-ink/10 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-5"
                style={{ animationDelay: `${Math.min(i, 10) * 30}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className={`h-10 w-1.5 shrink-0 ${r.status ? ATTENDANCE_STYLES[r.status].split(' ')[0] : 'bg-ink/10'}`} aria-hidden />
                  <div>
                    <p className="font-display text-2xl font-extrabold">{r.name}</p>
                    <p className="text-xs font-bold tracking-wider text-ink/40 uppercase">{r.category}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-1.5 sm:flex" role="radiogroup" aria-label={`Présence de ${r.name}`}>
                  {STATUSES.map(({ key, icon: Icon }) => (
                    <button
                      key={key}
                      role="radio"
                      aria-checked={r.status === key}
                      onClick={() => setStatus(r.playerId, key)}
                      className={`flex min-h-11 items-center justify-center gap-1.5 px-2 text-sm font-bold tracking-wide uppercase transition-all sm:px-4 ${
                        r.status === key ? `${ATTENDANCE_STYLES[key]} skew-tag` : 'bg-paper text-ink/50 hover:bg-ink/10 hover:text-ink'
                      }`}
                    >
                      <Icon className="size-4" aria-hidden />
                      {ATTENDANCE_LABELS[key]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-0 mt-4 flex flex-wrap items-center justify-end gap-4 bg-paper/95 py-4 backdrop-blur">
            {message && (
              <span className="flex items-center gap-1.5 text-sm font-bold text-win" role="status">
                <Check className="size-4" aria-hidden /> {message}
              </span>
            )}
            <Button onClick={save} disabled={saving || rows.every((r) => !r.status)}>
              {saving ? 'Enregistrement…' : "Enregistrer l'appel"}
            </Button>
          </div>
        </>
      )}
    </>
  );
}
