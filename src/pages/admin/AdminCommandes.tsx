import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Package, Search, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';
import { resolveImageUrl } from '@/lib/images';

const STATUTS = [
  { value: '', label: 'Tous' },
  { value: 'en_attente', label: 'Reçue' },
  { value: 'confirmee', label: 'Confirmée' },
  { value: 'en_preparation', label: 'En préparation' },
  { value: 'en_livraison', label: 'En livraison' },
  { value: 'livree', label: 'Livrée' },
  { value: 'annulee', label: 'Annulée' },
];

const statutCouleur: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  confirmee: 'bg-blue-100 text-blue-700',
  en_preparation: 'bg-purple-100 text-purple-700',
  en_livraison: 'bg-indigo-100 text-indigo-700',
  livree: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
};

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  livraison: 'À la livraison',
  mobile_money_direct: 'Mobile Money direct',
  cinetpay: 'CinetPay (carte/MoMo)',
};

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  echoue: 'Échoué',
};

const statutPaiementCouleur: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  paye: 'bg-green-100 text-green-700',
  echoue: 'bg-red-100 text-red-700',
};

export default function AdminCommandes() {
  const [commandes, setCommandes] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [searchParams] = useSearchParams();
  const [filtreStatut, setFiltreStatut] = useState(searchParams.get('statut') || '');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      await charger();
    } catch (e) {
      alert("Erreur lors de la mise à jour du statut");
    } finally {
      setUpdatingId(null);
    }
  };

  const filtres = commandes.filter((c) => {
    const matchRecherche =
      c.numero?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.utilisateur_email?.toLowerCase().includes(recherche.toLowerCase()) ||
      c.telephone_livraison?.includes(recherche);
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
            placeholder="Rechercher par numéro, email ou téléphone..."
            className="pl-9"
          />
        </div>
        <select
          value={filtreStatut}
          onChange={(e) => setFiltreStatut(e.target.value)}
          title="Filtrer par statut"
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
                <th className="px-2 py-3"></th>
                <th className="text-left px-4 py-3 font-medium">N°</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Paiement</th>
                <th className="text-left px-4 py-3 font-medium">Total</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-left px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtres.map((c) => (
                <React.Fragment key={c.id}>
                  <tr className="hover:bg-secondary/50 transition">
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === c.id ? null : c.id)}
                        className="text-muted-foreground hover:text-primary"
                        title="Voir le détail"
                      >
                        {expandedId === c.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs font-semibold">
                      #{c.numero}
                      <div className="text-muted-foreground font-normal">
                        {new Date(c.date_commande).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>{c.utilisateur_nom || '—'}</div>
                      <div className="text-muted-foreground text-xs">
                        {c.telephone_livraison || c.utilisateur_email}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {new Date(c.date_commande).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs">{MODE_PAIEMENT_LABELS[c.mode_paiement] || c.mode_paiement}</div>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${statutPaiementCouleur[c.statut_paiement] || 'bg-gray-100 text-gray-700'}`}>
                        {STATUT_PAIEMENT_LABELS[c.statut_paiement] || c.statut_paiement}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold">
                      {formaterPrix(parseFloat(c.prix_total))}
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
                        title="Changer le statut de la commande"
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
                  {expandedId === c.id && (
                    <tr className="bg-secondary/30">
                      <td></td>
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                          <div>
                            <p className="font-semibold mb-1">Livraison</p>
                            <p className="text-muted-foreground">
                              {c.telephone_livraison && <>📞 {c.telephone_livraison}<br /></>}
                              {c.adresse_livraison}, {c.ville_livraison}
                              {c.code_postal_livraison ? ` ${c.code_postal_livraison}` : ''}
                              {c.pays_livraison ? ` — ${c.pays_livraison}` : ''}
                            </p>
                            {c.notes && <p className="text-muted-foreground mt-1 italic">Note : {c.notes}</p>}
                          </div>
                          <div>
                            <p className="font-semibold mb-1">Montants</p>
                            <div className="text-muted-foreground space-y-0.5">
                              <div className="flex justify-between max-w-[200px]">
                                <span>Sous-total produits</span>
                                <span>{formaterPrix(parseFloat(c.montant_produits))}</span>
                              </div>
                              <div className="flex justify-between max-w-[200px]">
                                <span>Frais de livraison</span>
                                <span>{formaterPrix(parseFloat(c.frais_livraison))}</span>
                              </div>
                              <div className="flex justify-between max-w-[200px] font-semibold text-foreground">
                                <span>Total</span>
                                <span>{formaterPrix(parseFloat(c.prix_total))}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="font-semibold text-xs mb-2">Articles</p>
                        <div className="space-y-2">
                          {(c.lignes || []).map((ligne: any) => (
                            <div key={ligne.id} className="flex items-center gap-3 text-xs bg-card rounded-lg p-2">
                              <img
                                src={resolveImageUrl(ligne.produit_image)}
                                alt={ligne.produit_nom}
                                className="w-10 h-12 object-cover rounded flex-shrink-0"
                              />
                              <div className="flex-1">
                                <p className="font-medium">{ligne.produit_nom}</p>
                                <p className="text-muted-foreground">
                                  Qté {ligne.quantite} × {formaterPrix(parseFloat(ligne.prix_unitaire))}
                                  {ligne.taille ? ` · ${ligne.taille}` : ''}
                                  {ligne.couleur ? ` · ${ligne.couleur}` : ''}
                                </p>
                              </div>
                              <span className="font-semibold">
                                {formaterPrix(parseFloat(ligne.prix_unitaire) * ligne.quantite)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
