import { Check, Megaphone } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage } from '../../api/client';
import { scheduleApi } from '../../api/endpoints';
import { Button, ErrorBox, Field, PageHeader, Spinner, Textarea } from '../../components/ui';

/** Admin: publishes the weekly training program (shown on the login page and in the parent space). */
export default function SchedulePage() {
  const [content, setContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    scheduleApi
      .get()
      .then((s) => setContent(s.content ?? ''))
      .catch((e) => setError(errorMessage(e)));
  }, []);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await scheduleApi.update(content ?? '');
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        kicker="Annonces"
        title="Programme des séances"
        subtitle="Publié sur la page de connexion et visible par tous les parents. Mettez-le à jour chaque semaine."
      />
      <ErrorBox message={error} />
      {content === null && !error && <Spinner />}

      {content !== null && (
        <form onSubmit={save} className="max-w-3xl space-y-5">
          <Field
            label="Texte du programme"
            hint="Texte libre — l'arabe est automatiquement affiché de droite à gauche. Laissez vide pour masquer l'annonce."
          >
            <Textarea
              rows={14}
              dir="auto"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="⏰ ستكون التمارين يوم السبت و الأحد…"
              className="text-lg leading-relaxed"
            />
          </Field>

          <div className="border-l-4 border-volt bg-white px-4 py-3 text-sm text-ink/70">
            <strong className="text-ink">Aperçu :</strong> les sauts de ligne sont conservés. Emojis bienvenus 🏐 — les parents
            voient ce texte dès la page de connexion.
          </div>

          <div className="flex items-center justify-end gap-4">
            {saved && (
              <span className="flex items-center gap-1 text-sm font-bold text-win" role="status">
                <Check className="size-4" aria-hidden /> Programme publié
              </span>
            )}
            <Button type="submit" disabled={saving}>
              <Megaphone className="size-5" aria-hidden />
              {saving ? 'Publication…' : 'Publier le programme'}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
