import { CheckCircle2, FileText, Percent, XCircle } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { errorMessage } from '../../api/client';
import { attendanceApi } from '../../api/endpoints';
import type { AttendanceStatus, PlayerAttendanceMonth } from '../../api/types';
import { ATTENDANCE_LABELS, ATTENDANCE_STYLES, MONTHS, WEEKDAYS_SHORT } from '../../lib/labels';
import { ErrorBox, MonthPicker, Spinner, StatTile } from '../ui';

const STATUS_MARK: Record<AttendanceStatus, string> = { present: 'P', absent: 'A', excused: 'J' };

export default function AttendanceTab({ playerId }: { playerId: string }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<PlayerAttendanceMonth | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    attendanceApi
      .playerMonth(playerId, month, year)
      .then(setData)
      .catch((e) => setError(errorMessage(e)));
  }, [playerId, month, year]);

  // Records are stored at UTC midnight → key by UTC day of month.
  const byDay = useMemo(() => {
    const map = new Map<number, AttendanceStatus>();
    data?.records.forEach((r) => map.set(new Date(r.date).getUTCDate(), r.status));
    return map;
  }, [data]);

  const daysInMonth = new Date(year, month, 0).getDate();
  const leadingBlanks = (new Date(year, month - 1, 1).getDay() + 6) % 7; // Monday-first
  const isToday = (d: number) => d === now.getDate() && month === now.getMonth() + 1 && year === now.getFullYear();

  return (
    <div className="space-y-6">
      <MonthPicker
        month={month}
        year={year}
        labels={MONTHS}
        onChange={(m, y) => {
          setMonth(m);
          setYear(y);
        }}
      />

      <ErrorBox message={error} />
      {!data && !error && <Spinner />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Présent" value={data.summary.present} tone="win" icon={<CheckCircle2 className="size-5" />} />
            <StatTile label="Absent" value={data.summary.absent} tone="loss" icon={<XCircle className="size-5" />} />
            <StatTile label="Justifié" value={data.summary.excused} tone="hold" icon={<FileText className="size-5" />} />
            <StatTile
              label="Assiduité"
              value={data.summary.rate === null ? '—' : `${data.summary.rate}%`}
              tone="blaze"
              icon={<Percent className="size-5" />}
            />
          </div>

          <div className="border-2 border-ink/10 bg-white p-3 sm:p-5">
            <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold tracking-wider text-ink/40 uppercase sm:gap-2">
              {WEEKDAYS_SHORT.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>
            <div className="mt-1 grid grid-cols-7 gap-1 sm:gap-2">
              {Array.from({ length: leadingBlanks }, (_, i) => (
                <div key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const status = byDay.get(day);
                return (
                  <div
                    key={day}
                    aria-label={`${day} ${MONTHS[month - 1]}${status ? ` : ${ATTENDANCE_LABELS[status]}` : ''}`}
                    className={`relative flex aspect-square flex-col items-center justify-center sm:aspect-auto sm:h-16 ${
                      status ? ATTENDANCE_STYLES[status] : 'bg-paper text-ink/35'
                    } ${isToday(day) ? 'outline-3 outline-offset-2 outline-blaze' : ''}`}
                  >
                    <span className="font-display text-xl font-extrabold sm:text-2xl">{day}</span>
                    {status && (
                      <span className="absolute top-0.5 right-1 text-[10px] font-bold opacity-80" aria-hidden>
                        {STATUS_MARK[status]}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-ink/60">
              {(Object.keys(ATTENDANCE_LABELS) as AttendanceStatus[]).map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5">
                  <span className={`flex size-4 items-center justify-center text-[9px] font-bold ${ATTENDANCE_STYLES[s]}`}>{STATUS_MARK[s]}</span>
                  {ATTENDANCE_LABELS[s]}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5">
                <span className="size-4 bg-paper ring-1 ring-ink/10" /> Pas de séance
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
