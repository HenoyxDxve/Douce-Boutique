import React, { useEffect, useState } from 'react';
import { Package, Search, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiService from '@/lib/api';

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'en_attente', label: 'En attente' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'expedie', label: 'Expédiée' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' },
];

const statutCouleur: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  confirmee: 'bg-green-100 text-green-700',
  expedie: 'bg-blue-100 text-blue-700',
  livree: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
};

export default function AdminCommandes() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const charger = async () => {
    setChargement(true);
    try {
      const data: any = await apiService.getAllCommandes();
      setCommandes(Array.isArray(data) ? data : []);
    } catch {
      setCommandes([]);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    charger();
  }, []);

  const handleUpdateStatut = async (
    commandeId: string,
    newStatut: string,
  ) => {
    setUpdatingId(commandeId);
    try {
      await apiService.updateCommandeStatut(commandeId, newStatut);
      setCommandes((prev) =>
        prev.map((c) =>
          c.id === commandeId ? { ...c, statut: newStatut } : c,
        ),
      );
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtres = commandes.filter((c) => {
    const matchRecherche =
      c.numero?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.utilisateur_email?.toLowerCase().includes(recherche.toLowerCase());
    const matchStatut = !filtreStatut || c.statut === filtreStatut;
    return matchRecherche && matchStatut;
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Gestion des commandes</h1>
        <button
          onClick={charger}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
        >
          <RefreshCw size={16} />
          Actualiser
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher par numéro ou email..."
            className="pl-9"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          className="border border-border rounded-md px-3 py-2 text-sm bg-background"
        >
          {STATUTS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {chargement ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p>Aucune commande trouvée</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">N°</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtres.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/50 transition">
                  <td className="px-4 py-3 font-mono text-xs font-semibold">
                    #{c.numero}
                  </td>
                  <td className="px-4 py-3">
                    <div>{c.utilisateur_nom || '—'}</div>
                    <div className="text-muted-foreground text-xs">
                      {c.utilisateur_email}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(c.date_commande).toLocaleDateString('fr-FR')}
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    {parseFloat(c.prix_total).toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        statutCouleur[c.statut] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {STATUTS.find((s) => s.value === c.statut)?.label ||
                        c.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={c.statut}
                      disabled={updatingId === c.id}
                      onChange={(e) =>
                        handleUpdateStatut(c.id, e.target.value)
                      }
                      className="border border-border rounded px-2 py-1 text-xs bg-background disabled:opacity-50"
                    >
                      {STATUTS.filter((s) => s.value).map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
