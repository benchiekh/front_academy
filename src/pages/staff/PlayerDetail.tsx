import { ArrowLeft, Check, Pencil, Save, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { playersApi } from '../../api/endpoints';
import type { PlayerDetail, Position, StrongHand, TechnicalSheet } from '../../api/types';
import PlayerForm from '../../components/PlayerForm';
import AttendanceTab from '../../components/parent/AttendanceTab';
import PaymentTab from '../../components/parent/PaymentTab';
import { Badge, Button, ErrorBox, Field, Input, JerseyAvatar, Kicker, Modal, Select, Spinner, Textarea } from '../../components/ui';
import { HAND_LABELS, POSITION_LABELS, refId, refName } from '../../lib/labels';

const num = (v: string) => (v === '' ? undefined : Number(v));

const SECTIONS = [
  ['sheet', 'Fiche technique'],
  ['attendance', 'Présences'],
  ['payments', 'Paiements'],
] as const;

export default function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [player, setPlayer] = useState<PlayerDetail | null>(null);
  const [sheet, setSheet] = useState<TechnicalSheet>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [section, setSection] = useState<(typeof SECTIONS)[number][0]>('sheet');

  const load = () =>
    playersApi
      .get(id!)
      .then((p) => {
        setPlayer(p);
        setSheet(p.technicalSheet ?? {});
      })
      .catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, [id]);

  const saveSheet = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const { height, weight, strongHand, mainPosition, secondaryPosition, jerseyNumber, notes } = sheet;
      await playersApi.saveSheet(id!, { height, weight, strongHand, mainPosition, secondaryPosition, jerseyNumber, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      load();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async () => {
    if (!player || !confirm(`Supprimer ${player.name} et tout son historique ?`)) return;
    await playersApi.remove(player._id);
    navigate('/players');
  };

  if (!player) return error ? <ErrorBox message={error} /> : <Spinner />;

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
    <>
      <Link to="/players" className="inline-flex min-h-11 items-center gap-2 text-sm font-bold tracking-wider text-ink/60 uppercase hover:text-blaze">
        <ArrowLeft className="size-4" aria-hidden /> Joueurs
      </Link>

      {/* Player hero */}
      <div className="cut-br court-bg mt-2 mb-6 flex animate-rise flex-col gap-5 p-5 text-white sm:flex-row sm:items-end sm:justify-between sm:p-7">
        <div className="flex items-end gap-5">
          <JerseyAvatar number={player.technicalSheet?.jerseyNumber} name={player.name} size="lg" />
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-2">
              <Badge tone="volt">{player.category}</Badge>
              {!player.active && <Badge tone="slate">Inactif</Badge>}
            </div>
            <h1 className="font-display text-5xl font-black">{player.name}</h1>
            <p className="mt-1 text-sm text-white/50">
              {player.age} ans · Parent : {refName(player.parentId)}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="volt" onClick={() => setEditOpen(true)}>
            <Pencil className="size-4" aria-hidden /> Modifier
          </Button>
          <button
            onClick={onDelete}
            className="flex size-11 items-center justify-center text-white/50 ring-2 ring-white/20 transition-colors hover:bg-loss hover:text-white hover:ring-loss"
            aria-label="Supprimer le joueur"
            title="Supprimer"
          >
            <Trash2 className="size-5" />
          </button>
        </div>
      </div>

      <div className="mb-6 flex gap-1 overflow-x-auto border-b-4 border-ink" role="tablist">
        {SECTIONS.map(([k, label]) => (
          <button
            key={k}
            role="tab"
            aria-selected={section === k}
            onClick={() => setSection(k)}
            className={`min-h-12 shrink-0 px-5 font-display text-xl font-bold transition-colors ${
              section === k ? 'bg-ink text-white' : 'text-ink/50 hover:text-ink'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div key={section} className="animate-rise">
        {section === 'sheet' && (
          <form onSubmit={saveSheet} className="space-y-6 border-2 border-ink/10 bg-white p-5 sm:p-7">
            <ErrorBox message={error} />
            <div>
              <Kicker className="mb-4">Physique</Kicker>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
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
            <Field label="Remarques du coach" hint="Visibles par le parent.">
              <Textarea rows={4} maxLength={2000} value={sheet.notes ?? ''} onChange={(e) => setSheet({ ...sheet, notes: e.target.value })} />
            </Field>
            <div className="flex items-center justify-end gap-4">
              {saved && (
                <span className="flex items-center gap-1 text-sm font-bold text-win" role="status">
                  <Check className="size-4" aria-hidden /> Fiche enregistrée
                </span>
              )}
              <Button type="submit" disabled={saving}>
                <Save className="size-5" aria-hidden />
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        )}
        {section === 'attendance' && <AttendanceTab playerId={player._id} />}
        {section === 'payments' && <PaymentTab playerId={player._id} monthlyFee={player.monthlyFee} registeredAt={player.createdAt} />}
      </div>

      <Modal open={editOpen} title="Modifier le joueur" onClose={() => setEditOpen(false)}>
        <PlayerForm
          submitLabel="Enregistrer"
          initial={{
            name: player.name,
            dateOfBirth: player.dateOfBirth,
            category: player.category,
            monthlyFee: player.monthlyFee,
            parentId: refId(player.parentId),
          }}
          onCancel={() => setEditOpen(false)}
          onSubmit={async (data) => {
            await playersApi.update(player._id, data);
            setEditOpen(false);
            load();
          }}
        />
      </Modal>
    </>
  );
}
