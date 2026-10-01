import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { usersApi, type PlayerInput } from '../api/endpoints';
import { CATEGORIES, type Category, type User } from '../api/types';
import { Button, ErrorBox, Field, Input, Select } from './ui';

export default function PlayerForm({
  initial,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Partial<PlayerInput>;
  submitLabel: string;
  onSubmit: (data: PlayerInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [parents, setParents] = useState<User[]>([]);
  const [form, setForm] = useState<PlayerInput>({
    name: '',
    dateOfBirth: '',
    category: 'U13',
    monthlyFee: 0,
    parentId: '',
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    usersApi.list('parent').then(setParents).catch(() => undefined);
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <ErrorBox message={error} />
      <Field label="Nom complet">
        <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date de naissance">
          <Input type="date" required value={form.dateOfBirth.slice(0, 10)} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
        </Field>
        <Field label="Catégorie">
          <Select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })}>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Parent">
        <Select required value={form.parentId} onChange={(e) => setForm({ ...form, parentId: e.target.value })}>
          <option value="">— Choisir un parent —</option>
          {parents.map((p) => (
            <option key={p._id} value={p._id}>
              {p.name} ({p.email})
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Cotisation mensuelle (DT)">
        <Input type="number" min={0} step="0.5" value={form.monthlyFee} onChange={(e) => setForm({ ...form, monthlyFee: Number(e.target.value) })} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
