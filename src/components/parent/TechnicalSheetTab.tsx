import { MessageSquareQuote } from 'lucide-react';
import type { PlayerDetail, Position } from '../../api/types';
import { formatDate, HAND_LABELS, POSITION_LABELS } from '../../lib/labels';
import { EmptyState, Kicker } from '../ui';

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

function Metric({ label, value, unit }: { label: string; value?: string | number; unit?: string }) {
  return (
    <div className="border-2 border-ink/10 bg-white px-4 py-3">
      <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">{label}</p>
      <p className="mt-1 font-display text-4xl font-black">
        {value ?? <span className="text-ink/25">—</span>}
        {value !== undefined && unit && <span className="ml-1 text-xl text-ink/40">{unit}</span>}
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
                  ? 'size-6 bg-blaze ring-4 ring-blaze/40 sm:size-8'
                  : isSecondary
                    ? 'size-5 bg-volt ring-4 ring-volt/30 sm:size-6'
                    : 'size-2.5 bg-white/30'
              }`}
            />
          </div>
        );
      })}
      <div className="absolute right-3 bottom-2 flex gap-3 text-[10px] font-bold tracking-wider text-white/70 uppercase">
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-blaze" /> Principal
        </span>
        <span className="flex items-center gap-1">
          <span className="size-2.5 rounded-full bg-volt" /> Secondaire
        </span>
      </div>
    </div>
  );
}

export default function TechnicalSheetTab({ player }: { player: PlayerDetail }) {
  const s = player.technicalSheet;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <Kicker>Fiche technique</Kicker>
        {s?.updatedAt && <p className="text-xs text-ink/50">Mise à jour le {formatDate(s.updatedAt)}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <CourtMap main={s?.mainPosition} secondary={s?.secondaryPosition} />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="border-l-4 border-blaze bg-white px-4 py-3">
              <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">Poste principal</p>
              <p className="font-display text-2xl font-black">{s?.mainPosition ? POSITION_LABELS[s.mainPosition] : '—'}</p>
            </div>
            <div className="border-l-4 border-volt bg-white px-4 py-3">
              <p className="text-[11px] font-bold tracking-[0.15em] text-ink/50 uppercase">Poste secondaire</p>
              <p className="font-display text-2xl font-black">{s?.secondaryPosition ? POSITION_LABELS[s.secondaryPosition] : '—'}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 content-start gap-3">
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
          <blockquote className="relative border-l-8 border-blaze bg-ink p-6 text-white">
            <MessageSquareQuote className="absolute top-4 right-4 size-8 text-white/15" aria-hidden />
            <p className="text-lg leading-relaxed whitespace-pre-line">{s.notes}</p>
          </blockquote>
        ) : (
          <EmptyState>Le coach n'a pas encore ajouté de remarques.</EmptyState>
        )}
      </section>
    </div>
  );
}
