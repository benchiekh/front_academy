import { useEffect, useState, type FormEvent } from 'react';
import { errorMessage } from '../api/client';
import { usersApi } from '../api/endpoints';
import type { User } from '../api/types';
import { Copy, KeyRound, Pencil, Trash2, UserPlus, Users } from 'lucide-react';
import { Button, DataTable, EmptyState, ErrorBox, Field, Input, Modal, PageHeader, Spinner } from './ui';

const COPY = {
  parent: { title: 'Parents', singular: 'parent', subtitle: 'Créez les accès des parents et remettez-leur leurs identifiants.' },
  coach: { title: 'Coachs', singular: 'coach', subtitle: "Comptes des entraîneurs de l'académie." },
};

/** Shared list + create page for parent accounts (coach/admin) and coach accounts (admin). */
export default function UserManager({ role }: { role: 'parent' | 'coach' }) {
  const copy = COPY[role];
  const [users, setUsers] = useState<User[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [resetFor, setResetFor] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [copied, setCopied] = useState(false);
  const [editFor, setEditFor] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ name: '', email: '', phone: '' });

  const load = () => usersApi.list(role).then(setUsers).catch((e) => setError(errorMessage(e)));
  useEffect(() => {
    load();
  }, [role]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const res = await usersApi.create({
        role,
        name: form.name,
        email: form.email,
        phone: form.phone || undefined,
        password: form.password || undefined,
      });
      setCredentials(res.credentials);
      setCopied(false);
      setOpen(false);
      setForm({ name: '', email: '', phone: '', password: '' });
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: User) => {
    setFormError(null);
    setEditFor(u);
    setEditForm({ name: u.name, email: u.email, phone: u.phone ?? '' });
  };

  const onEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editFor) return;
    setSaving(true);
    setFormError(null);
    try {
      await usersApi.update(editFor._id, {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
      });
      setEditFor(null);
      load();
    } catch (err) {
      setFormError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const onReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!resetFor) return;
    try {
      await usersApi.update(resetFor._id, { password: newPassword });
      setCredentials({ email: resetFor.email, password: newPassword });
      setResetFor(null);
      setNewPassword('');
    } catch (err) {
      setFormError(errorMessage(err));
    }
  };

  const onDelete = async (u: User) => {
    if (!confirm(`Supprimer le compte de ${u.name} ?`)) return;
    try {
      await usersApi.remove(u._id);
      load();
    } catch (err) {
      setError(errorMessage(err));
    }
  };

  return (
    <>
      <PageHeader
        kicker="Comptes & accès"
        title={copy.title}
        subtitle={copy.subtitle}
        actions={
          <Button onClick={() => { setFormError(null); setOpen(true); }}>
            <UserPlus className="size-5" aria-hidden /> Nouveau {copy.singular}
          </Button>
        }
      />

      {credentials && (
        <div className="cut-br mb-6 animate-rise bg-volt p-5 text-ink sm:p-6" role="status">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <KeyRound className="mt-1 size-6 shrink-0" aria-hidden />
              <div>
                <p className="font-display text-2xl font-black">Identifiants à transmettre</p>
                <p className="mt-1 font-mono text-base">
                  {credentials.email} · <span className="bg-ink px-2 py-0.5 font-bold text-volt">{credentials.password}</span>
                </p>
                <p className="mt-1 text-xs font-semibold text-ink/60">Ce mot de passe ne sera plus affiché après fermeture.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="dark"
                onClick={() => {
                  navigator.clipboard?.writeText(`Email: ${credentials.email}\nMot de passe: ${credentials.password}`);
                  setCopied(true);
                }}
              >
                <Copy className="size-4" aria-hidden /> {copied ? 'Copié !' : 'Copier'}
              </Button>
              <Button variant="ghost" onClick={() => { setCredentials(null); setCopied(false); }}>
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      <ErrorBox message={error} />
      {!users && !error && <Spinner />}
      {users?.length === 0 && <EmptyState icon={<Users className="size-12" />}>Aucun {copy.singular} pour le moment.</EmptyState>}

      {users && users.length > 0 && (
        <DataTable
          head={
            <tr>
              <th>Nom</th>
              <th>Email</th>
              <th className="hidden sm:table-cell">Téléphone</th>
              <th className="text-right">Actions</th>
            </tr>
          }
        >
          {users.map((u) => (
            <tr key={u._id} className="transition-colors hover:bg-blaze-50">
              <td className="font-display text-xl font-extrabold whitespace-nowrap">{u.name}</td>
              <td className="text-ink/70">{u.email}</td>
              <td className="hidden text-ink/70 sm:table-cell">{u.phone ?? '—'}</td>
              <td className="text-right whitespace-nowrap">
                <button
                  onClick={() => openEdit(u)}
                  className="inline-flex size-11 items-center justify-center text-ink/50 hover:bg-volt hover:text-ink"
                  aria-label={`Modifier ${u.name}`}
                  title="Modifier"
                >
                  <Pencil className="size-5" />
                </button>
                <button
                  onClick={() => { setFormError(null); setResetFor(u); }}
                  className="inline-flex size-11 items-center justify-center text-ink/50 hover:bg-ink hover:text-white"
                  aria-label={`Changer le mot de passe de ${u.name}`}
                  title="Mot de passe"
                >
                  <KeyRound className="size-5" />
                </button>
                <button
                  onClick={() => onDelete(u)}
                  className="inline-flex size-11 items-center justify-center text-ink/50 hover:bg-loss hover:text-white"
                  aria-label={`Supprimer ${u.name}`}
                  title="Supprimer"
                >
                  <Trash2 className="size-5" />
                </button>
              </td>
            </tr>
          ))}
        </DataTable>
      )}

      <Modal open={open} title={`Nouveau ${copy.singular}`} onClose={() => setOpen(false)}>
        <form onSubmit={onCreate} className="space-y-4">
          <ErrorBox message={formError} />
          <Field label="Nom complet">
            <Input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email (identifiant de connexion)">
            <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </Field>
          <Field label="Mot de passe (laisser vide pour en générer un)">
            <Input minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Création…' : 'Créer le compte'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!editFor} title={`Modifier — ${editFor?.name ?? ''}`} onClose={() => setEditFor(null)}>
        <form onSubmit={onEdit} className="space-y-4">
          <ErrorBox message={formError} />
          <Field label="Nom complet">
            <Input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
          </Field>
          <Field label="Email (identifiant de connexion)">
            <Input type="email" required value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setEditFor(null)}>
              Annuler
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={!!resetFor} title={`Nouveau mot de passe — ${resetFor?.name ?? ''}`} onClose={() => setResetFor(null)}>
        <form onSubmit={onReset} className="space-y-4">
          <ErrorBox message={formError} />
          <Field label="Nouveau mot de passe">
            <Input required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setResetFor(null)}>
              Annuler
            </Button>
            <Button type="submit">Enregistrer</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
