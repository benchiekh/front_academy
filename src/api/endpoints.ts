import { api } from './client';
import type {
  ActivityPage,
  ActivitySummaryRow,
  AttendanceStatus,
  Payment,
  PaymentGridRow,
  PaymentStats,
  PaymentYearRow,
  PaymentStatus,
  Player,
  PlayerAttendanceMonth,
  PlayerDetail,
  Role,
  RollCallRow,
  Schedule,
  TechnicalSheet,
  User,
} from './types';

export const authApi = {
  login: (email: string, password: string) =>
    api
      .post<{ accessToken: string; user: User }>('/auth/login', { email, password })
      .then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
};

export interface NewUser {
  name: string;
  email: string;
  phone?: string;
  password?: string;
  role: Role;
}

export const usersApi = {
  list: (role?: Role) => api.get<User[]>('/users', { params: { role } }).then((r) => r.data),
  create: (data: NewUser) =>
    api
      .post<{ user: User; credentials: { email: string; password: string } }>('/users', data)
      .then((r) => r.data),
  update: (id: string, data: Partial<NewUser>) =>
    api.patch<User>(`/users/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/${id}`),
};

export type PlayerInput = Pick<Player, 'name' | 'dateOfBirth' | 'category' | 'monthlyFee'> & {
  parentId: string;
  active?: boolean;
};

export const playersApi = {
  list: (params?: { category?: string; active?: boolean }) =>
    api.get<Player[]>('/players', { params }).then((r) => r.data),
  mine: () => api.get<PlayerDetail[]>('/players/mine').then((r) => r.data),
  get: (id: string) => api.get<PlayerDetail>(`/players/${id}`).then((r) => r.data),
  create: (data: PlayerInput) => api.post<Player>('/players', data).then((r) => r.data),
  update: (id: string, data: Partial<PlayerInput>) =>
    api.patch<Player>(`/players/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/players/${id}`),
  saveSheet: (id: string, data: TechnicalSheet) =>
    api.put<TechnicalSheet>(`/players/${id}/technical-sheet`, data).then((r) => r.data),
};

export const attendanceApi = {
  day: (date: string, category?: string) =>
    api
      .get<{ date: string; markedBy: { name: string; at: string } | null; players: RollCallRow[] }>('/attendance', {
        params: { date, category },
      })
      .then((r) => r.data),
  bulk: (date: string, records: { playerId: string; status: AttendanceStatus }[]) =>
    api.post('/attendance/bulk', { date, records }).then((r) => r.data),
  playerMonth: (id: string, month: number, year: number) =>
    api
      .get<PlayerAttendanceMonth>(`/attendance/player/${id}`, { params: { month, year } })
      .then((r) => r.data),
};

export const paymentsApi = {
  month: (month: number, year: number, category?: string) =>
    api
      .get<PaymentGridRow[]>('/payments', { params: { month, year, category } })
      .then((r) => r.data),
  year: (year: number, category?: string) =>
    api.get<PaymentYearRow[]>('/payments/year', { params: { year, category } }).then((r) => r.data),
  stats: (month: number, year: number) =>
    api.get<PaymentStats>('/payments/stats', { params: { month, year } }).then((r) => r.data),
  history: (playerId: string) =>
    api.get<Payment[]>(`/payments/player/${playerId}`).then((r) => r.data),
  upsert: (data: {
    playerId: string;
    month: number;
    year: number;
    status: PaymentStatus;
    amount?: number;
    paymentDate?: string;
  }) => api.put<Payment>('/payments', data).then((r) => r.data),
};

export const scheduleApi = {
  /** Public — no token needed (login page). */
  get: () => api.get<Schedule>('/schedule').then((r) => r.data),
  update: (content: string) => api.put<Schedule>('/schedule', { content }).then((r) => r.data),
};

export interface ActivityQuery {
  actorId?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export const activityApi = {
  list: (params: ActivityQuery) => api.get<ActivityPage>('/activity', { params }).then((r) => r.data),
  summary: (month: number, year: number) =>
    api.get<ActivitySummaryRow[]>('/activity/summary', { params: { month, year } }).then((r) => r.data),
};
