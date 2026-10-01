import { ClipboardCheck, CreditCard, History, LayoutDashboard, LogOut, Menu, Shirt, UserCog, Users, X } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Logo } from '../components/Logo';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { to: '/players', label: 'Joueurs', icon: Shirt },
  { to: '/attendance', label: 'Présences', icon: ClipboardCheck },
  { to: '/payments', label: 'Paiements', icon: CreditCard },
  { to: '/parents', label: 'Parents', icon: Users },
  { to: '/coaches', label: 'Coachs', icon: UserCog, adminOnly: true },
  { to: '/activity', label: 'Traçabilité', icon: History, adminOnly: true },
];

export default function StaffLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const items = NAV.filter((n) => !n.adminOnly || user?.role === 'admin');

  const sidebar = (
    <nav className="court-bg flex h-full flex-col text-white" aria-label="Navigation principale">
      <div className="flex items-center justify-between px-5 py-6">
        <Logo subtitle={user?.role === 'admin' ? 'Administration' : 'Espace coach'} />
        <button onClick={() => setOpen(false)} className="flex size-11 items-center justify-center text-white/60 hover:text-white lg:hidden" aria-label="Fermer le menu">
          <X className="size-6" />
        </button>
      </div>

      <ul className="flex-1 space-y-1 px-3 pt-4">
        {items.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `group relative flex min-h-12 items-center gap-3 px-4 font-display text-xl font-bold tracking-wide transition-colors ${
                  isActive ? 'bg-blaze text-white skew-tag' : 'text-white/60 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="m-3 flex items-center gap-3 border-t border-white/10 px-2 pt-4 pb-2">
        <div className="flex size-11 shrink-0 items-center justify-center bg-volt font-display text-2xl font-black text-ink">
          {user?.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{user?.name}</p>
          <p className="truncate text-xs text-white/50">{user?.email}</p>
        </div>
        <button onClick={logout} className="flex size-11 shrink-0 items-center justify-center text-white/50 transition-colors hover:bg-loss hover:text-white" aria-label="Se déconnecter" title="Se déconnecter">
          <LogOut className="size-5" />
        </button>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen lg:pl-72">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r-4 border-blaze lg:block">{sidebar}</aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-ink/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 max-w-[85vw] animate-slide-in border-r-4 border-blaze shadow-2xl">{sidebar}</aside>
        </div>
      )}

      <header className="sticky top-0 z-30 flex items-center justify-between border-b-4 border-blaze bg-ink px-4 py-2 lg:hidden">
        <Logo />
        <button onClick={() => setOpen(true)} className="flex size-11 items-center justify-center text-white" aria-label="Ouvrir le menu">
          <Menu className="size-6" />
        </button>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-12">
        <Outlet />
      </main>
    </div>
  );
}
