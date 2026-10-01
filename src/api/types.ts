export type Role = 'admin' | 'coach' | 'parent';
export type AttendanceStatus = 'present' | 'absent' | 'excused';
export type PaymentStatus = 'paid' | 'unpaid';
export type StrongHand = 'right' | 'left';
export type Position =
  | 'goalkeeper'
  | 'left_wing'
  | 'right_wing'
  | 'left_back'
  | 'right_back'
  | 'center_back'
  | 'pivot';

export const CATEGORIES = ['U9', 'U11', 'U13', 'U15', 'U17', 'U19', 'Seniors'] as const;
export type Category = (typeof CATEGORIES)[number];

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  createdAt?: string;
}

export interface UserRef {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface TechnicalSheet {
  _id?: string;
  playerId?: string;
  height?: number;
  weight?: number;
  strongHand?: StrongHand;
  mainPosition?: Position;
  secondaryPosition?: Position;
  jerseyNumber?: number;
  notes?: string;
  updatedAt?: string;
}

export interface Player {
  _id: string;
  name: string;
  dateOfBirth: string;
  parentId: UserRef | string;
  category: Category;
  monthlyFee: number;
  active: boolean;
  createdAt?: string;
}

export interface PlayerDetail extends Player {
  age: number;
  technicalSheet: TechnicalSheet | null;
}

export interface AttendanceRecord {
  _id: string;
  date: string;
  status: AttendanceStatus;
}

export interface PlayerAttendanceMonth {
  month: number;
  year: number;
  records: AttendanceRecord[];
  summary: Record<AttendanceStatus, number> & { total: number; rate: number | null };
}

export interface RollCallRow {
  playerId: string;
  name: string;
  category: Category;
  status: AttendanceStatus | null;
}

export interface Payment {
  _id: string;
  month: number;
  year: number;
  status: PaymentStatus;
  amount: number;
  paymentDate?: string;
}

export interface PaymentGridRow {
  playerId: string;
  name: string;
  category: Category;
  status: PaymentStatus;
  amount: number;
  paymentDate: string | null;
  markedByName: string | null;
}

export interface PaymentStats {
  month: number;
  year: number;
  activePlayers: number;
  expected: number;
  collected: number;
  outstanding: number;
  paidCount: number;
  unpaidCount: number;
  collectionRate: number;
  trend: { month: number; year: number; collected: number }[];
}

export interface PaymentCell {
  status: PaymentStatus;
  amount: number;
  paymentDate: string | null;
  markedByName: string;
}

export interface PaymentYearRow {
  playerId: string;
  name: string;
  category: Category;
  monthlyFee: number;
  /** First month the player owes a fee (registration or first recorded payment). */
  since: { year: number; month: number };
  /** Index 0 = January. null = no record yet. */
  months: (PaymentCell | null)[];
}

export type ActivityAction =
  | 'attendance.mark'
  | 'payment.paid'
  | 'payment.unpaid'
  | 'sheet.update'
  | 'player.create'
  | 'player.update'
  | 'player.delete'
  | 'user.create'
  | 'user.update'
  | 'user.delete';

export interface ActivityLog {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: Role;
  action: ActivityAction;
  playerId?: string;
  playerName?: string;
  targetUserName?: string;
  summary: string;
  meta?: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityPage {
  items: ActivityLog[];
  total: number;
  page: number;
  pages: number;
}

export interface ActivitySummaryRow {
  actorId: string;
  actorName: string;
  actorRole: Role;
  attendance: number;
  paid: number;
  unpaid: number;
  sheets: number;
  total: number;
  lastAt: string | null;
}
