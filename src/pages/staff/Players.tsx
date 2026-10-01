import { ChevronRight, Plus, Shirt } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/client';
import { playersApi } from '../../api/endpoints';
import { CATEGORIES, type Player } from '../../api/types';
import PlayerForm from '../../components/PlayerForm';
import { Badge, Button, DataTable, EmptyState, ErrorBox, Modal, PageHeader, Select, Spinner } from '../../components/ui';
import { formatDay, formatMoney, refName } from '../../lib/labels';

export default function Players() {
  const navigate = useNavigate();
  const [players, setPlayers] = useState<Player[] | null>(null);
  const [category, setCategory] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = () => {
    setPlayers(null);
    playersApi
      .list({ category: category || undefined })
      .then(setPlayers)
      .catch((e) => setError(errorMessage(e)));
  };
  useEffect(load, [category]);

  return (
    <>
      <PageHeader
        kicker="Toute l'académie"
        title="Joueurs"
        subtitle={players ? `${players.length} joueur${players.length > 1 ? 's' : ''}` : undefined}
        actions={
          <>
            <Select value={category} onChange={(e) => setCategory(e.target.value)} className="!w-auto" aria-label="Filtrer par catégorie">
              <option value="">Toutes catégories</option>
              {CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <Button onClick={() => setOpen(true)}>
              <Plus className="size-5" aria-hidden /> Ajouter
            </Button>
          </>
        }
      />
      <ErrorBox message={error} />
      {!players && !error && <Spinner />}
      {players?.length === 0 && (
        <EmptyState icon={<Shirt className="size-12" />}>Aucun joueur. Créez d'abord un compte parent, puis ajoutez l'enfant.</EmptyState>
      )}

      {players && players.length > 0 && (
        <DataTable
          head={
            <tr>
              <th>Joueur</th>
              <th>Catégorie</th>
              <th className="hidden md:table-cell">Naissance</th>
              <th className="hidden sm:table-cell">Parent</th>
              <th className="hidden sm:table-cell">Cotisation</th>
              <th className="w-10" />
            </tr>
          }
        >
          {players.map((p) => (
            <tr
              key={p._id}
              tabIndex={0}
              onClick={() => navigate(`/players/${p._id}`)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/players/${p._id}`)}
              className="group cursor-pointer transition-colors hover:bg-blaze-50 focus-visible:bg-blaze-50"
            >
              <td>
                <span className="font-display text-xl font-extrabold">{p.name}</span>
                {!p.active && <Badge tone="slate" className="ml-2">Inactif</Badge>}
                <span className="block text-xs text-ink/50 sm:hidden">{refName(p.parentId)}</span>
              </td>
              <td>
                <Badge tone="ink">{p.category}</Badge>
              </td>
              <td className="hidden text-ink/60 md:table-cell">{formatDay(p.dateOfBirth)}</td>
              <td className="hidden text-ink/70 sm:table-cell">{refName(p.parentId)}</td>
              <td className="hidden font-semibold sm:table-cell">{formatMoney(p.monthlyFee)}</td>
              <td>
                <ChevronRight className="size-5 text-ink/30 transition-transform group-hover:translate-x-1 group-hover:text-blaze" aria-hidden />
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={open} title="Nouveau joueur" onClose={() => setOpen(false)}>
        <PlayerForm
          submitLabel="Ajouter le joueur"
          onCancel={() => setOpen(false)}
          onSubmit={async (data) => {
            const created = await playersApi.create(data);
            setOpen(false);
            navigate(`/players/${created._id}`);
          }}
        />
      </Modal>
    </>
  );
}
