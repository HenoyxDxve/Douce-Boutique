import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api.ts';
import { Trash2, Edit2, Plus } from 'lucide-react';

interface Categorie {
  id: string;
  nom: string;
  slug?: string;
}

interface Produit {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prix_original?: number | null;
  categorie: string;
  categorie_nom?: string;
  stock?: number;
  nouveau?: boolean;
  en_promotion?: boolean;
}

export default function AdminProduits() {
  const { estAdmin } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [recherche, setRecherche] = useState('');
  const [filtreCategorie, setFiltreCategorie] = useState('');

  const [editing, setEditing] = useState<Produit | null>(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [form, setForm] = useState<Partial<Produit>>({});

  useEffect(() => {
    if (!estAdmin) return;
    const charger = async () => {
      try {
        setChargement(true);
        const p: any = await apiService.getProduits();
        const c: any = await apiService.getCategories();
        setProduits(Array.isArray(p) ? p : []);
        setCategories(Array.isArray(c) ? c : []);
      } catch (e) {
        console.error(e);
        setErreur('Erreur lors du chargement');
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, [estAdmin]);

  if (!estAdmin) return <div className="p-8">Accès refusé</div>;

  const filtres = produits.filter((p) => {
    const matchRecherche = p.nom.toLowerCase().includes(recherche.toLowerCase()) || 
                           p.description.toLowerCase().includes(recherche.toLowerCase());
    const matchCategorie = !filtreCategorie || p.categorie === filtreCategorie;
    return matchRecherche && matchCategorie;
  });

  const startCreate = () => {
    setEditing(null);
    setForm({ nom: '', description: '', prix: 0, categorie: categories[0]?.id ?? '', stock: 0 });
    setModalOuverte(true);
  };

  const startEdit = (p: Produit) => {
    setEditing(p);
    setForm({ ...p });
    setModalOuverte(true);
  };

  const handleSave = async () => {
    try {
      if (!form.nom || !form.categorie) {
        alert('Nom et catégorie requis');
        return;
      }
      if (editing) {
        await apiService.updateProduit(editing.id, form as any);
      } else {
        await apiService.createProduit(form as any);
      }
      const p: any = await apiService.getProduits();
      setProduits(Array.isArray(p) ? p : []);
      setModalOuverte(false);
      setForm({});
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) return;
    try {
      await apiService.deleteProduit(id);
      setProduits(produits.filter((x) => x.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif font-semibold gradient-text">Gestion des Produits</h1>
        <button onClick={startCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition">
          <Plus size={18} /> Créer un produit
        </button>
      </div>

      {erreur && <div className="text-red-600 mb-4">{erreur}</div>}

      <div className="mb-4 flex gap-4">
        <input 
          value={recherche} 
          onChange={(e) => setRecherche(e.target.value)} 
          placeholder="Rechercher par nom ou description..." 
          className="flex-1 p-2 border rounded-lg input-elegant"
        />
        <select 
          value={filtreCategorie} 
          onChange={(e) => setFiltreCategorie(e.target.value)} 
          className="p-2 border rounded-lg input-elegant"
        >
          <option value="">-- Toutes catégories --</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {chargement ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun produit trouvé</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Nom</th>
                <th className="px-4 py-3 text-left font-semibold">Prix</th>
                <th className="px-4 py-3 text-left font-semibold">Catégorie</th>
                <th className="px-4 py-3 text-left font-semibold">Stock</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map((p) => (
                <tr key={p.id} className="border-t hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">{p.nom}</td>
                  <td className="px-4 py-3 font-medium text-primary">{p.prix?.toFixed?.(2) ?? p.prix} €</td>
                  <td className="px-4 py-3">{p.categorie_nom ?? p.categorie}</td>
                  <td className="px-4 py-3">{p.stock ?? 0}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button onClick={() => startEdit(p)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 text-destructive hover:bg-red-50 rounded">
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
            <h2 className="text-2xl font-serif font-semibold mb-4 gradient-text">{editing ? 'Modifier le produit' : 'Créer un produit'}</h2>
            <div className="space-y-4">
              <input value={form.nom ?? ''} onChange={(e) => setForm({...form, nom: e.target.value})} placeholder="Nom" className="w-full p-2 border rounded-lg input-elegant" />
              <textarea value={form.description ?? ''} onChange={(e) => setForm({...form, description: e.target.value})} placeholder="Description" className="w-full p-2 border rounded-lg input-elegant" rows={3} />
              <input value={String(form.prix ?? '')} onChange={(e) => setForm({...form, prix: Number(e.target.value)})} placeholder="Prix" type="number" className="w-full p-2 border rounded-lg input-elegant" />
              <input value={String(form.prix_original ?? '')} onChange={(e) => setForm({...form, prix_original: e.target.value ? Number(e.target.value) : null})} placeholder="Prix original (promo)" type="number" className="w-full p-2 border rounded-lg input-elegant" />
              <select value={form.categorie ?? ''} onChange={(e) => setForm({...form, categorie: e.target.value})} className="w-full p-2 border rounded-lg input-elegant">
                <option value="">-- Catégorie --</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
              </select>
              <input value={String(form.stock ?? '')} onChange={(e) => setForm({...form, stock: Number(e.target.value)})} placeholder="Stock" type="number" className="w-full p-2 border rounded-lg input-elegant" />
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSave} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition">Enregistrer</button>
              <button onClick={() => setModalOuverte(false)} className="flex-1 px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
