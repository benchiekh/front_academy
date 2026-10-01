import { CalendarDays, ClipboardList, LogOut, Wallet, type LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { playersApi } from '../../api/endpoints';
import type { PlayerDetail } from '../../api/types';
import { Logo } from '../../components/Logo';
import AttendanceTab from '../../components/parent/AttendanceTab';
import PaymentTab from '../../components/parent/PaymentTab';
import TechnicalSheetTab from '../../components/parent/TechnicalSheetTab';
import { Badge, EmptyState, ErrorBox, JerseyAvatar, Spinner } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { formatDay, POSITION_LABELS } from '../../lib/labels';

const TABS: { key: 'payment' | 'attendance' | 'sheet'; label: string; icon: LucideIcon }[] = [
  { key: 'payment', label: 'Paiement', icon: Wallet },
  { key: 'attendance', label: 'Présence', icon: CalendarDays },
  { key: 'sheet', label: 'Fiche', icon: ClipboardList },
];
type TabKey = (typeof TABS)[number]['key'];

/** Read-only dashboard for parents: one tab per data type, one child at a time. */
export default function ParentDashboard() {
  const { user, logout } = useAuth();
  const [children, setChildren] = useState<PlayerDetail[] | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>('payment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    playersApi
      .mine()
      .then((list) => {
        setChildren(list);
        setSelectedId(list[0]?._id ?? null);
      })
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const child = children?.find((c) => c._id === selectedId);
  const sheet = child?.technicalSheet;

  return (
    <div className="min-h-screen pb-24 sm:pb-12">
      {/* Hero */}
      <header className="court-bg relative overflow-hidden border-b-4 border-blaze text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 pt-4">
          <Logo subtitle="Espace parent" />
          <button
            onClick={logout}
            className="flex min-h-11 items-center gap-2 px-3 text-sm font-semibold text-white/60 transition-colors hover:text-white"
          >
            <LogOut className="size-4" aria-hidden />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

        <div className="mx-auto max-w-4xl px-4 pt-8 pb-6">
          <p className="text-sm text-white/50">Bonjour {user?.name},</p>

          {children && children.length > 1 && (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Choisir un enfant">
              {children.map((c) => (
                <button
                  key={c._id}
                  role="tab"
                  aria-selected={c._id === selectedId}
                  onClick={() => setSelectedId(c._id)}
                  className={`skew-tag min-h-11 shrink-0 px-5 font-display text-lg font-bold transition-colors ${
                    c._id === selectedId ? 'bg-volt text-ink' : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  {c.name.split(' ')[0]}
                </button>
              ))}
            </div>
          )}

          {child && (
            <div key={child._id} className="mt-6 flex animate-rise items-end gap-4 sm:gap-6">
              <JerseyAvatar number={sheet?.jerseyNumber} name={child.name} size="lg" />
              <div className="min-w-0 pb-1">
                <div className="mb-2 flex flex-wrap gap-2">
                  <Badge tone="volt">{child.category}</Badge>
                  {sheet?.mainPosition && <Badge tone="blaze">{POSITION_LABELS[sheet.mainPosition]}</Badge>}
                </div>
                <h1 className="font-display text-4xl font-black break-words sm:text-6xl">{child.name}</h1>
                <p className="mt-1 text-sm text-white/50">
                  {child.age} ans · né(e) le {formatDay(child.dateOfBirth)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Desktop tabs sit on the hero's bottom edge */}
        {child && (
          <div className="mx-auto hidden max-w-4xl gap-1 px-4 sm:flex" role="tablist" aria-label="Sections">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex min-h-12 items-center gap-2 px-6 font-display text-xl font-bold transition-colors ${
                  tab === key ? 'bg-paper text-ink' : 'text-white/50 hover:text-white'
                }`}
              >
                <Icon className="size-5" aria-hidden />
                {label === 'Fiche' ? 'Fiche technique' : label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-4xl px-4 py-6 sm:py-8">
        <ErrorBox message={error} />
        {!children && !error && <Spinner />}
        {children?.length === 0 && <EmptyState>Aucun enfant n'est encore lié à votre compte. Contactez le coach.</EmptyState>}

        {child && (
          <div role="tabpanel" key={`${child._id}-${tab}`} className="animate-rise">
            {tab === 'payment' && <PaymentTab playerId={child._id} monthlyFee={child.monthlyFee} registeredAt={child.createdAt} />}
            {tab === 'attendance' && <AttendanceTab playerId={child._id} />}
            {tab === 'sheet' && <TechnicalSheetTab player={child} />}
          </div>
        )}
      </main>

      {/* Mobile bottom tab bar */}
      {child && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t-4 border-blaze bg-ink pb-[env(safe-area-inset-bottom)] sm:hidden" role="tablist" aria-label="Sections">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={`flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-bold tracking-wider uppercase transition-colors ${
                tab === key ? 'text-volt' : 'text-white/50'
              }`}
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
