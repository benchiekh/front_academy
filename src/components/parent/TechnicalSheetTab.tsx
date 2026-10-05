import { Check, MessageSquareQuote, Pencil, Save } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { errorMessage } from '../../api/client';
import { playersApi } from '../../api/endpoints';
import type { PlayerDetail, Position, StrongHand, TechnicalSheet } from '../../api/types';
import { formatDate, HAND_LABELS, POSITION_LABELS } from '../../lib/labels';
import { Button, EmptyState, ErrorBox, Field, Input, Kicker, Modal, Select } from '../ui';

/** Positions on a half court (x%, y%) — attacking the goal on the left, so the attacker's left is at the bottom. */
const COURT_SPOTS: Record<Position, [number, number]> = {
  goalkeeper: [7, 50],
  left_wing: [14, 90],
  right_wing: [14, 10],
  pivot: [30, 50],
  left_back: [55, 78],
  center_back: [62, 50],
  right_back: [55, 22],
};

const num = (v: string) => (v === '' ? undefined : Number(v));

function Metric({ label, value, unit }: { label: string; value?: string | number; unit?: string }) {
  return (
    <div className="min-w-0 border-2 border-ink/10 bg-white px-3 py-3 sm:px-4">
      <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">{label}</p>
      <p className="mt-1 font-display text-2xl font-black break-words sm:text-4xl">
        {value ?? <span className="text-ink/25">—</span>}
        {value !== undefined && unit && <span className="ml-1 text-base text-ink/40 sm:text-xl">{unit}</span>}
      </p>
    </div>
  );
}

function CourtMap({ main, secondary }: { main?: Position; secondary?: Position }) {
  return (
    <div className="court-bg relative aspect-[1.6] w-full overflow-hidden border-4 border-ink">
      {/* goal area & 9m line */}
      <div className="absolute top-1/2 left-0 h-[70%] w-[28%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/40" />
      <div className="absolute top-1/2 left-0 h-[105%] w-[46%] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-white/25" />
      <div className="absolute inset-y-[35%] left-0 w-1.5 bg-white" />
      <div className="absolute inset-y-0 right-0 w-0.5 bg-white/30" />

      {(Object.keys(COURT_SPOTS) as Position[]).map((p) => {
        const [x, y] = COURT_SPOTS[p];
        const isMain = p === main;
        const isSecondary = p === secondary;
        return (
          <div
            key={p}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${x}%`, top: `${y}%` }}
            title={POSITION_LABELS[p]}
          >
            <span
              className={`block rounded-full transition-all ${
                isMain
                  ? 'size-5 bg-blaze ring-4 ring-blaze/40 sm:size-8'
                  : isSecondary
                    ? 'size-4 bg-volt ring-4 ring-volt/30 sm:size-6'
                    : 'size-2 bg-white/30 sm:size-2.5'
              }`}
            />
          </div>
        );
      })}
      <div className="absolute right-2 bottom-1.5 flex gap-2 text-[9px] font-bold tracking-wider text-white/70 uppercase sm:right-3 sm:bottom-2 sm:gap-3 sm:text-[10px]">
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-blaze sm:size-2.5" /> Principal
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2 rounded-full bg-volt sm:size-2.5" /> Secondaire
        </span>
      </div>
    </div>
  );
}

export default function TechnicalSheetTab({ player, onSaved }: { player: PlayerDetail; onSaved?: () => void }) {
  const s = player.technicalSheet;
  const [editOpen, setEditOpen] = useState(false);
  const [sheet, setSheet] = useState<TechnicalSheet>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openEdit = () => {
    setSheet(player.technicalSheet ?? {});
    setError(null);
    setEditOpen(true);
  };

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { height, weight, strongHand, mainPosition, secondaryPosition, jerseyNumber } = sheet;
      await playersApi.saveSheet(player._id, { height, weight, strongHand, mainPosition, secondaryPosition, jerseyNumber });
      setEditOpen(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      onSaved?.();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const positionOptions = (
    <>
      <option value="">—</option>
      {(Object.keys(POSITION_LABELS) as Position[]).map((p) => (
        <option key={p} value={p}>
          {POSITION_LABELS[p]}
        </option>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Kicker>Fiche technique</Kicker>
          {s?.updatedAt && <p className="mt-1 text-xs text-ink/50">Mise à jour le {formatDate(s.updatedAt)}</p>}
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="flex items-center gap-1 text-sm font-bold text-win" role="status">
              <Check className="size-4" aria-hidden /> Enregistrée
            </span>
          )}
          <Button variant="volt" onClick={openEdit} className="min-h-11 px-4 text-base">
            <Pencil className="size-4" aria-hidden /> Modifier
          </Button>
        </div>
      </div>

      {!s && (
        <EmptyState icon={<Pencil className="size-10" />}>
          La fiche de {player.name.split(' ')[0]} n'est pas encore remplie. Appuyez sur « Modifier » pour renseigner sa
          taille, son poids, sa main forte et ses postes.
        </EmptyState>
      )}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="min-w-0">
          <CourtMap main={s?.mainPosition} secondary={s?.secondaryPosition} />
          <div className="mt-3 grid grid-cols-1 gap-3 min-[400px]:grid-cols-2">
            <div className="border-l-4 border-blaze bg-white px-4 py-3">
              <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">Poste principal</p>
              <p className="font-display text-xl font-black break-words sm:text-2xl">
                {s?.mainPosition ? POSITION_LABELS[s.mainPosition] : '—'}
              </p>
            </div>
            <div className="border-l-4 border-volt bg-white px-4 py-3">
              <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">Poste secondaire</p>
              <p className="font-display text-xl font-black break-words sm:text-2xl">
                {s?.secondaryPosition ? POSITION_LABELS[s.secondaryPosition] : '—'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 content-start gap-2 sm:gap-3">
          <Metric label="Âge" value={player.age} unit="ans" />
          <Metric label="Catégorie" value={player.category} />
          <Metric label="Taille" value={s?.height} unit="cm" />
          <Metric label="Poids" value={s?.weight} unit="kg" />
          <Metric label="Main forte" value={s?.strongHand && HAND_LABELS[s.strongHand]} />
          <Metric label="Maillot" value={s?.jerseyNumber ? `#${s.jerseyNumber}` : undefined} />
        </div>
      </div>

      <section>
        <Kicker className="mb-3">Le mot du coach</Kicker>
        {s?.notes ? (
          <blockquote className="relative border-l-8 border-blaze bg-ink p-4 text-white sm:p-6">
            <MessageSquareQuote className="absolute top-3 right-3 size-6 text-white/15 sm:top-4 sm:right-4 sm:size-8" aria-hidden />
            <p className="text-base leading-relaxed whitespace-pre-line sm:text-lg">{s.notes}</p>
          </blockquote>
        ) : (
          <EmptyState>Le coach n'a pas encore ajouté de remarques.</EmptyState>
        )}
      </section>

      <Modal open={editOpen} title={`Fiche de ${player.name.split(' ')[0]}`} onClose={() => setEditOpen(false)}>
        <form onSubmit={save} className="space-y-5">
          <ErrorBox message={error} />
          <div>
            <Kicker className="mb-4">Physique</Kicker>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Taille (cm)">
                <Input type="number" min={50} max={250} value={sheet.height ?? ''} onChange={(e) => setSheet({ ...sheet, height: num(e.target.value) })} />
              </Field>
              <Field label="Poids (kg)">
                <Input type="number" min={10} max={200} step="0.1" value={sheet.weight ?? ''} onChange={(e) => setSheet({ ...sheet, weight: num(e.target.value) })} />
              </Field>
              <Field label="Main forte">
                <Select value={sheet.strongHand ?? ''} onChange={(e) => setSheet({ ...sheet, strongHand: (e.target.value || undefined) as StrongHand | undefined })}>
                  <option value="">—</option>
                  {(Object.keys(HAND_LABELS) as StrongHand[]).map((h) => (
                    <option key={h} value={h}>
                      {HAND_LABELS[h]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="N° maillot">
                <Input type="number" min={1} max={99} value={sheet.jerseyNumber ?? ''} onChange={(e) => setSheet({ ...sheet, jerseyNumber: num(e.target.value) })} />
              </Field>
            </div>
          </div>
          <div>
            <Kicker className="mb-4">Terrain</Kicker>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Poste principal">
                <Select value={sheet.mainPosition ?? ''} onChange={(e) => setSheet({ ...sheet, mainPosition: (e.target.value || undefined) as Position | undefined })}>
                  {positionOptions}
                </Select>
              </Field>
              <Field label="Poste secondaire">
                <Select value={sheet.secondaryPosition ?? ''} onChange={(e) => setSheet({ ...sheet, secondaryPosition: (e.target.value || undefined) as Position | undefined })}>
                  {positionOptions}
                </Select>
              </Field>
            </div>
          </div>
          <p className="text-xs text-ink/50">Seul le coach peut modifier ses remarques.</p>
          <div className="flex items-center justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => setEditOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              <Save className="size-5" aria-hidden />
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
