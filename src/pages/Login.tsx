import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../api/client';
import { BallMark, Logo } from '../components/Logo';
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
      {/* Court side */}
      <section className="court-bg relative flex flex-col justify-between overflow-hidden px-6 py-8 sm:px-10 lg:py-12">
        <Logo subtitle="Club de formation" />

        <div className="relative z-10 my-8 animate-rise lg:my-0">
          <Kicker className="mb-4 text-volt [&>span]:bg-volt">Saison 2026 · 2027</Kicker>
          <h1 className="font-display text-[clamp(2.75rem,13vw,4.5rem)] lg:text-[clamp(4rem,7vw,7.5rem)] font-black text-white">
            Jouer.
            <br />
            <span className="text-blaze">Progresser.</span>
            <br />
            Gagner.
          </h1>
          <p className="mt-6 hidden max-w-md text-lg text-white/60 sm:block">
            Présences, cotisations et fiches techniques de vos joueurs — tout le club au même endroit.
          </p>
        </div>

        <div className="hidden gap-8 text-white lg:flex">
          {[
            ['7', 'joueurs sur le terrain'],
            ['60′', 'de match'],
            ['1', 'seule équipe'],
          ].map(([n, l]) => (
            <div key={l}>
              <p className="font-display text-5xl font-black text-volt">{n}</p>
              <p className="text-xs font-semibold tracking-wider text-white/50 uppercase">{l}</p>
            </div>
          ))}
        </div>

        <BallMark className="pointer-events-none absolute -right-24 -bottom-24 size-96 rotate-12 opacity-[0.08] lg:opacity-15" />
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
