import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { Logo } from '../components/Logo';
import ScheduleCard from '../components/ScheduleCard';
import { Button, ErrorBox, Field, Input, Kicker } from '../components/ui';
import { homeFor, useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(homeFor(user.role), { replace: true });
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.15fr_1fr]">
      {/* Court side — team photo + weekly program over it */}
      <section className="relative flex min-h-[55vh] flex-col overflow-hidden px-6 py-6 sm:px-10 lg:min-h-0 lg:py-12">
        <img src="/login-bg.jpg" alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/20 to-ink/65" aria-hidden />

        <div className="relative z-10">
          <Logo subtitle="Club de formation" />
        </div>

        <div className="relative z-10 flex flex-1 items-center py-6">
          <ScheduleCard variant="glass" className="max-h-[50vh] w-full max-w-xl overflow-y-auto lg:max-h-[60vh]" />
        </div>
      </section>

      {/* Form side */}
      <section className="flex items-center justify-center bg-paper px-6 py-12">
        <form onSubmit={onSubmit} className="w-full max-w-sm animate-rise space-y-5" noValidate={false}>
          <div>
            <Kicker>Espace membres</Kicker>
            <h2 className="mt-2 font-display text-5xl font-black">Connexion</h2>
            <p className="mt-2 text-ink/60">Coachs, administration et parents.</p>
          </div>

          <ErrorBox message={error} />

          <Field label="Email">
            <div className="relative">
              <Mail className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink/35" aria-hidden />
              <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10" />
            </div>
          </Field>
          <Field label="Mot de passe">
            <div className="relative">
              <Lock className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-ink/35" aria-hidden />
              <Input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10"
              />
            </div>
          </Field>

          <Button type="submit" className="w-full text-xl" disabled={loading}>
            {loading ? 'Connexion…' : 'Entrer sur le terrain'}
            {!loading && <ArrowRight className="size-5" aria-hidden />}
          </Button>

          <p className="border-l-4 border-volt bg-white px-4 py-3 text-sm text-ink/70">
            <strong className="text-ink">Parents :</strong> utilisez les identifiants fournis par votre coach.
          </p>
        </form>
      </section>
    </div>
  );
}
