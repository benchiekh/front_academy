import type { AttendanceStatus, Position, StrongHand, UserRef } from '../api/types';

export const POSITION_LABELS: Record<Position, string> = {
  goalkeeper: 'Gardien de but',
  left_wing: 'Ailier gauche',
  right_wing: 'Ailier droit',
  left_back: 'Arrière gauche',
  right_back: 'Arrière droit',
  center_back: 'Demi-centre',
  pivot: 'Pivot',
};

export const HAND_LABELS: Record<StrongHand, string> = {
  right: 'Droitier',
  left: 'Gaucher',
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: 'Présent',
  absent: 'Absent',
  excused: 'Justifié',
};

export const ATTENDANCE_STYLES: Record<AttendanceStatus, string> = {
  present: 'bg-win text-white',
  absent: 'bg-loss text-white',
  excused: 'bg-hold text-ink',
};

export const MONTHS = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
];

export const MONTHS_SHORT = ['Jan', 'Fév', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc'];

export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

export const formatMoney = (n: number) =>
  new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(n) + ' DT';

/** For real timestamps (payment date, updatedAt) — shown in the viewer's timezone. */
export const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR') : '—';

/** For date-only values stored at UTC midnight (birth date, attendance day). */
export const formatDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('fr-FR', { timeZone: 'UTC' }) : '—';

/** Local YYYY-MM-DD (the backend normalizes to UTC midnight). */
export const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const refName = (ref: UserRef | string | undefined) =>
  typeof ref === 'object' && ref ? ref.name : '—';

export const refId = (ref: UserRef | string) => (typeof ref === 'object' ? ref._id : ref);
