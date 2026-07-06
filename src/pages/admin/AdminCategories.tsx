import React, { useEffect, useState } from 'react';
import apiService from '@/lib/api';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Categorie {
  id: string;
  nom: string;
  slug: string;
  description?: string;
  icone?: string;
}

const slugifier = (texte: string) =>
  texte
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export default function AdminCategories() {
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [editing, setEditing] = useState<Categorie | null>(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [form, setForm] = useState<Partial<Categorie>>({});

  const charger = async () => {
    try {
      setChargement(true);
      const c: any = await apiService.getCategories();
      setCategories(Array.isArray(c) ? c : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const startCreate = () => {
    setEditing(null);
    setForm({ nom: '', slug: '', description: '', icone: '📦' });
    setModalOuverte(true);
  };

  const startEdit = (c: Categorie) => {
    setEditing(c);
    setForm({ ...c });
    setModalOuverte(true);
  };

  const handleSave = async () => {
    if (!form.nom) {
      alert('Le nom est requis');
      return;
    }
    const slug = form.slug || slugifier(form.nom);
    try {
      if (editing) {
        await apiService.updateCategorie(editing.id, { ...form, slug });
      } else {
        await apiService.createCategorie({
          nom: form.nom!,
          slug,
          description: form.description,
          icone: form.icone,
        });
      }
      await charger();
      setModalOuverte(false);
      setForm({});
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette catégorie ? Les produits associés seront aussi supprimés.')) return;
    try {
      await apiService.deleteCategorie(id);
      setCategories(categories.filter((c) => c.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-semibold gradient-text">Catégories</h1>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition">
          <Plus size={18} /> Créer une catégorie
        </button>
      </div>

      {chargement ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Icône</th>
                <th className="px-4 py-3 text-left font-semibold">Nom</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-t hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 text-xl">{c.icone}</td>
                  <td className="px-4 py-3">{c.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.slug}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(c)} title="Modifier" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(c.id)} title="Supprimer" className="p-1 text-destructive hover:bg-red-50 rounded">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-hover max-w-md w-full p-6">
            <h2 className="text-2xl font-serif font-semibold mb-4 gradient-text">
              {editing ? 'Modifier la catégorie' : 'Créer une catégorie'}
            </h2>
            <div className="space-y-4">
              <input
                value={form.nom ?? ''}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                placeholder="Nom"
                className="w-full p-2 border rounded-lg input-elegant"
              />
              <input
                value={form.slug ?? ''}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="Slug (auto si vide)"
                className="w-full p-2 border rounded-lg input-elegant"
              />
              <input
                value={form.icone ?? ''}
                onChange={(e) => setForm({ ...form, icone: e.target.value })}
                placeholder="Icône (emoji)"
                className="w-full p-2 border rounded-lg input-elegant"
              />
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Description"
                className="w-full p-2 border rounded-lg input-elegant"
                rows={2}
              />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition">
                Enregistrer
              </button>
              <button onClick={() => setModalOuverte(false)} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
