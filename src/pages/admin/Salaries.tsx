import { Pencil, Plus, Trash2, UserRound } from 'lucide-react';
import { useEffect, useState } from 'react';
import { errorMessage } from '../../api/client';
import { paymentsApi, salariesApi } from '../../api/endpoints';
import { Salary } from '../../api/types';
import { Button, DataTable, EmptyState, ErrorBox, Field, Input, Modal, MonthPicker, PageHeader, SearchInput, Select, Spinner, StatTile } from '../../components/ui';
import { byName, formatMoney, MONTHS, nameMatches } from '../../lib/labels';

type SalaryType = 'salary' | 'expense';

const EMPTY_FORM = { id: undefined as string | undefined, name: '', type: 'salary' as SalaryType, amount: '' };

export default function Salaries() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const [salaries, setSalaries] = useState<Salary[] | null>(null);
  const [collected, setCollected] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    setSalaries(null);
    setCollected(null);
    setError(null);
    salariesApi.list(month, year).then(setSalaries).catch((e) => setError(errorMessage(e)));
    // Recettes encaissées du mois = base avant soustraction des salaires/charges.
    paymentsApi.stats(month, year).then((s) => setCollected(s.collected)).catch((e) => setError(errorMessage(e)));
  }, [month, year]);

  const load = () => {
    salariesApi.list(month, year).then(setSalaries).catch((e) => setError(errorMessage(e)));
    paymentsApi.stats(month, year).then((s) => setCollected(s.collected)).catch((e) => setError(errorMessage(e)));
  };

  const totalSalary = salaries?.reduce((acc, s) => (s.type === 'salary' ? acc + s.amount : acc), 0) ?? 0;
  const totalExpense = salaries?.reduce((acc, s) => (s.type === 'expense' ? acc + s.amount : acc), 0) ?? 0;
  const totalCharges = totalSalary + totalExpense;
  const recettes = collected ?? 0;
  const reste = recettes - totalCharges;

  const visible = (salaries ?? [])
    .filter((s) => nameMatches(s.name, query))
    .sort((a, b) => (a.type === b.type ? byName(a, b) : a.type === 'salary' ? -1 : 1));

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (s: Salary) => {
    setForm({ id: s._id, name: s.name, type: s.type, amount: String(s.amount) });
    setFormError(null);
    setOpen(true);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      await salariesApi.upsert({
        id: form.id,
        name: form.name.trim(),
        type: form.type,
        amount: Number(form.amount) || 0,
        month,
        year,
      });
      setOpen(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await salariesApi.remove(deleteId);
      setDeleteId(null);
      load();
    } catch (err) {
      setError(errorMessage(err));
      setDeleteId(null);
    }
  };

  const loading = salaries === null || collected === null;

  return (
    <div>
      <PageHeader
        kicker="Finances"
        title="Salaires & charges"
        subtitle="Salaires des coaches et charges fixes, mois par mois"
        actions={
          <>
            <SearchInput value={query} onChange={setQuery} placeholder="Rechercher un coach ou un libellé" />
            <Button onClick={openCreate}>
              <Plus className="size-5" aria-hidden /> Nouveau salaire/charge
            </Button>
          </>
        }
      />

      <div className="mb-6">
        <MonthPicker month={month} year={year} labels={MONTHS} onChange={(m, y) => { setMonth(m); setYear(y); }} />
      </div>

      <ErrorBox message={error} />
      {loading && !error && <Spinner />}

      {/* --- Récapitulatif du mois --- */}
      {!loading && (
        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
          <StatTile
            label="Recettes du mois"
            value={formatMoney(recettes)}
            tone="win"
            hint="encaissé sur les cotisations"
          />
          <StatTile label="Salaires coaches" value={formatMoney(totalSalary)} tone="ink" />
          <StatTile label="Loyer / charges" value={formatMoney(totalExpense)} tone="hold" />
          <StatTile
            label="Total charges"
            value={formatMoney(totalCharges)}
            tone="blaze"
            hint={`salaires + loyer/extras`}
          />
          <StatTile
            label="Reste"
            value={formatMoney(reste)}
            tone={reste < 0 ? 'loss' : 'win'}
            hint={`recettes − charges`}
          />
        </div>
      )}

      {salaries?.length === 0 && (
        <EmptyState icon={<UserRound className="size-12" />}>
          Aucun salaire/charge pour {MONTHS[month - 1]} {year}.
        </EmptyState>
      )}

      {visible.length > 0 && (
        <DataTable
          head={
            <tr>
              <th>Nom / Libellé</th>
              <th>Type</th>
              <th>Montant</th>
              <th>Ajouté par</th>
              <th className="text-right">Actions</th>
            </tr>
          }
        >
          {visible.map((s) => (
            <tr key={s._id} className="transition-colors hover:bg-blaze-50">
              <td className="font-display text-xl font-extrabold whitespace-nowrap">{s.name}</td>
              <td>
                <span className={s.type === 'salary' ? 'bg-ink text-volt text-xs font-semibold px-2 py-0.5 rounded' : 'bg-loss text-volt text-xs font-semibold px-2 py-0.5 rounded'}>
                  {s.type === 'salary' ? 'Salaire' : 'Charge'}
                </span>
              </td>
              <td className="whitespace-nowrap font-semibold">{formatMoney(s.amount)}</td>
              <td className="text-ink/60">{s.markedByName ?? '—'}</td>
              <td className="text-right whitespace-nowrap">
                <button
                  onClick={() => openEdit(s)}
                  className="inline-flex size-11 items-center justify-center text-ink/50 hover:bg-volt hover:text-ink"
                  aria-label={`Modifier ${s.name}`}
                  title="Modifier"
                >
                  <Pencil className="size-5" aria-hidden />
                </button>
                <button
                  onClick={() => setDeleteId(s._id)}
                  className="inline-flex size-11 items-center justify-center text-ink/50 hover:bg-loss hover:text-white"
                  aria-label={`Supprimer ${s.name}`}
                  title="Supprimer"
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      {salaries && salaries.length > 0 && visible.length === 0 && (
        <EmptyState icon={<UserRound className="size-12" />}>
          Aucun salaire/charge ne correspond à «&nbsp;{query}&nbsp;».
        </EmptyState>
      )}

      {/* --- Modale création/édition --- */}
      <Modal open={open} title={form.id ? 'Modifier — ' + form.name : 'Nouveau salaire/charge'} onClose={() => setOpen(false)}>
        <form onSubmit={onSubmit} className="space-y-4">
          <ErrorBox message={formError} />
          <p className="text-sm text-ink/60">
            Période : <strong className="text-ink">{MONTHS[month - 1]} {year}</strong>
          </p>
          <Field label="Nom / Libellé" hint="Ex : nom du coach, « Loyer », « Extras »…">
            <Input required autoFocus value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Type">
            <Select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as SalaryType })}>
              <option value="salary">Salaire / avance — coach</option>
              <option value="expense">Charge — loyer, extras…</option>
            </Select>
          </Field>
          <Field label="Montant (DT)">
            <Input
              type="number"
              min="0"
              step="0.5"
              required
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
            />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* --- Confirmation suppression --- */}
      <Modal open={!!deleteId} title="Supprimer l'enregistrement" onClose={() => setDeleteId(null)}>
        <p>Voulez-vous vraiment supprimer cet enregistrement de salaire/charge ?</p>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Non
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Supprimer
          </Button>
        </div>
      </Modal>
    </div>
  );
}
