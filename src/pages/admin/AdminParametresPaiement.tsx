import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';
import { Truck, Wallet, Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface NumeroPaiement {
  id: string;
  operateur: string;
  operateur_nom: string;
  numero: string;
  nom_beneficiaire: string;
  actif: boolean;
}

const OPERATEURS = [
  { value: 'orange', label: 'Orange Money' },
  { value: 'mtn', label: 'MTN Money' },
  { value: 'wave', label: 'Wave' },
  { value: 'moov', label: 'Moov Money' },
  { value: 'autre', label: 'Autre' },
];

export default function AdminParametresPaiement() {
  const { estAdmin } = useAuth();

  const [fraisLivraison, setFraisLivraison] = useState('');
  const [chargementFrais, setChargementFrais] = useState(true);
  const [enregistrementFrais, setEnregistrementFrais] = useState(false);

  const [numeros, setNumeros] = useState<NumeroPaiement[]>([]);
  const [chargementNumeros, setChargementNumeros] = useState(true);
  const [editing, setEditing] = useState<NumeroPaiement | null>(null);
  const [modalOuverte, setModalOuverte] = useState(false);
  const [form, setForm] = useState<Partial<NumeroPaiement>>({});

  const chargerFrais = async () => {
    try {
      setChargementFrais(true);
      const data = await apiService.getFraisLivraison();
      setFraisLivraison(String(Number(data.frais_livraison)));
    } catch (e) {
      console.error(e);
    } finally {
      setChargementFrais(false);
    }
  };

  const chargerNumeros = async () => {
    try {
      setChargementNumeros(true);
      const data = (await apiService.getNumerosPaiement()) as NumeroPaiement[];
      setNumeros(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargementNumeros(false);
    }
  };

  useEffect(() => {
    if (!estAdmin) return;
    chargerFrais();
    chargerNumeros();
  }, [estAdmin]);

  if (!estAdmin) return <div className="p-8">Accès refusé</div>;

  const handleEnregistrerFrais = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnregistrementFrais(true);
    try {
      await apiService.updateFraisLivraison(Number(fraisLivraison));
      toast.success('Frais de livraison mis à jour ✅');
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    } finally {
      setEnregistrementFrais(false);
    }
  };

  const startCreate = () => {
    setEditing(null);
    setForm({ operateur: 'orange', numero: '', nom_beneficiaire: '', actif: true });
    setModalOuverte(true);
  };

  const startEdit = (n: NumeroPaiement) => {
    setEditing(n);
    setForm({ ...n });
    setModalOuverte(true);
  };

  const handleSaveNumero = async () => {
    if (!form.numero || !form.nom_beneficiaire) {
      alert('Numéro et bénéficiaire requis');
      return;
    }
    try {
      if (editing) {
        await apiService.updateNumeroPaiement(editing.id, form as any);
      } else {
        await apiService.createNumeroPaiement(form as any);
      }
      await chargerNumeros();
      setModalOuverte(false);
      setForm({});
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  const handleDeleteNumero = async (id: string) => {
    if (!confirm('Supprimer ce numéro de paiement ?')) return;
    try {
      await apiService.deleteNumeroPaiement(id);
      setNumeros(numeros.filter((n) => n.id !== id));
    } catch (e: any) {
      alert(e?.message || 'Erreur suppression');
    }
  };

  const toggleActif = async (n: NumeroPaiement) => {
    try {
      await apiService.updateNumeroPaiement(n.id, { actif: !n.actif });
      setNumeros(numeros.map((x) => (x.id === n.id ? { ...x, actif: !x.actif } : x)));
    } catch (e: any) {
      alert(e?.message || 'Erreur');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-semibold gradient-text">Paramètres de paiement</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Frais de livraison et numéros Mobile Money proposés aux clients.
        </p>
      </div>

      {/* Frais de livraison */}
      <div className="bg-card rounded-2xl p-6 shadow-soft max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <Truck className="text-primary" size={22} />
          <h2 className="font-semibold">Frais de livraison</h2>
        </div>
        {chargementFrais ? (
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
        ) : (
          <form onSubmit={handleEnregistrerFrais} className="flex items-end gap-3">
            <div className="flex-1">
              <label htmlFor="frais-livraison-input" className="block text-sm text-muted-foreground mb-1">Montant (FCFA)</label>
              <input
                id="frais-livraison-input"
                type="number"
                min="0"
                value={fraisLivraison}
                onChange={(e) => setFraisLivraison(e.target.value)}
                className="w-full p-2 border rounded-lg input-elegant"
              />
            </div>
            <button
              type="submit"
              disabled={enregistrementFrais}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition disabled:opacity-50"
            >
              {enregistrementFrais ? '...' : 'Enregistrer'}
            </button>
          </form>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          Appliqué automatiquement à chaque nouvelle commande : {formaterPrix(Number(fraisLivraison) || 0)}
        </p>
      </div>

      {/* Numéros Mobile Money */}
      <div className="bg-card rounded-2xl p-6 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet className="text-primary" size={22} />
            <h2 className="font-semibold">Numéros Mobile Money</h2>
          </div>
          <button
            onClick={startCreate}
            className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition text-sm"
          >
            <Plus size={16} /> Ajouter un numéro
          </button>
        </div>

        {chargementNumeros ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
          </div>
        ) : numeros.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Aucun numéro configuré.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Opérateur</th>
                  <th className="px-4 py-3 text-left font-semibold">Numéro</th>
                  <th className="px-4 py-3 text-left font-semibold">Bénéficiaire</th>
                  <th className="px-4 py-3 text-left font-semibold">Statut</th>
                  <th className="px-4 py-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {numeros.map((n) => (
                  <tr key={n.id} className="border-t hover:bg-secondary/30 transition">
                    <td className="px-4 py-3">{n.operateur_nom}</td>
                    <td className="px-4 py-3 font-mono">{n.numero}</td>
                    <td className="px-4 py-3">{n.nom_beneficiaire}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleActif(n)}
                        className={`px-2 py-1 rounded-full text-xs font-medium transition ${
                          n.actif ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {n.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <button onClick={() => startEdit(n)} title="Modifier" className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteNumero(n.id)} title="Supprimer" className="p-1 text-destructive hover:bg-red-50 rounded">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOuverte && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-hover max-w-md w-full p-6">
            <h2 className="text-xl font-serif font-semibold mb-4 gradient-text">
              {editing ? 'Modifier le numéro' : 'Ajouter un numéro'}
            </h2>
            <div className="space-y-4">
              <select
                aria-label="Opérateur"
                value={form.operateur ?? 'orange'}
                onChange={(e) => setForm({ ...form, operateur: e.target.value })}
                className="w-full p-2 border rounded-lg input-elegant"
              >
                {OPERATEURS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <input
                value={form.numero ?? ''}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
                placeholder="Numéro (ex: 0700000000)"
                className="w-full p-2 border rounded-lg input-elegant"
              />
              <input
                value={form.nom_beneficiaire ?? ''}
                onChange={(e) => setForm({ ...form, nom_beneficiaire: e.target.value })}
                placeholder="Nom du bénéficiaire"
                className="w-full p-2 border rounded-lg input-elegant"
              />
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.actif ?? true}
                  onChange={(e) => setForm({ ...form, actif: e.target.checked })}
                />
                Actif (visible par les clients)
              </label>
            </div>
            <div className="mt-6 flex gap-3">
              <button onClick={handleSaveNumero} className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition">
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
