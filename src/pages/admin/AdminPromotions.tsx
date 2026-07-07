import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';
import { resolveImageUrl } from '@/lib/images';
import { Percent, Check, X } from 'lucide-react';

interface Produit {
  id: string;
  nom: string;
  prix: number;
  prix_original?: number | null;
  en_promotion: boolean;
  image_principale?: string | null;
  pourcentage_reduction?: number | string;
}

export default function AdminPromotions() {
  const { estAdmin } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [edition, setEdition] = useState<Record<string, string>>({});
  const [enregistrement, setEnregistrement] = useState<string | null>(null);

  const charger = async () => {
    try {
      setChargement(true);
      const p: any = await apiService.getProduits();
      setProduits(Array.isArray(p) ? p : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (!estAdmin) return;
    charger();
  }, [estAdmin]);

  if (!estAdmin) return <div className="p-8">Accès refusé</div>;

  const appliquerPromotion = async (produit: Produit) => {
    const prixOriginalSaisi = edition[produit.id];
    const prixOriginal = prixOriginalSaisi ? Number(prixOriginalSaisi) : null;

    if (prixOriginal !== null && prixOriginal <= produit.prix) {
      alert('Le prix original doit être supérieur au prix actuel.');
      return;
    }

    setEnregistrement(produit.id);
    try {
      await apiService.updateProduit(produit.id, {
        prix_original: prixOriginal,
        en_promotion: prixOriginal !== null,
      });
      await charger();
      setEdition((prev) => {
        const next = { ...prev };
        delete next[produit.id];
        return next;
      });
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnregistrement(null);
    }
  };

  const retirerPromotion = async (produit: Produit) => {
    setEnregistrement(produit.id);
    try {
      await apiService.updateProduit(produit.id, { prix_original: null, en_promotion: false });
      await charger();
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de la mise à jour');
    } finally {
      setEnregistrement(null);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Percent className="text-primary" size={28} />
        <div>
          <h1 className="text-3xl font-serif font-semibold gradient-text">Promotions & Réductions</h1>
          <p className="text-muted-foreground text-sm">Définissez un prix barré pour activer une promotion sur un produit.</p>
        </div>
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
                <th className="px-4 py-3 text-left font-semibold">Produit</th>
                <th className="px-4 py-3 text-left font-semibold">Prix actuel</th>
                <th className="px-4 py-3 text-left font-semibold">Prix original (barré)</th>
                <th className="px-4 py-3 text-left font-semibold">Réduction</th>
                <th className="px-4 py-3 text-left font-semibold">Statut</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {produits.map((p) => (
                <tr key={p.id} className="border-t hover:bg-secondary/30 transition">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img src={resolveImageUrl(p.image_principale)} alt={p.nom} className="w-10 h-12 object-cover rounded" />
                      <span>{p.nom}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">{formaterPrix(Number(p.prix))}</td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      placeholder="Ex: 60000"
                      value={edition[p.id] ?? (p.prix_original ? String(p.prix_original) : '')}
                      onChange={(e) => setEdition((prev) => ({ ...prev, [p.id]: e.target.value }))}
                      className="w-28 p-1.5 border rounded-lg input-elegant text-sm"
                    />
                  </td>
                  <td className="px-4 py-3">
                    {p.en_promotion && p.prix_original ? (
                      <span className="badge-promo">
                        -{Math.round(((Number(p.prix_original) - Number(p.prix)) / Number(p.prix_original)) * 100)}%
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {p.en_promotion ? (
                      <span className="px-2 py-0.5 bg-rose-light text-rose-dark rounded-full text-xs">En promotion</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-muted text-muted-foreground rounded-full text-xs">Prix normal</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => appliquerPromotion(p)}
                        disabled={enregistrement === p.id}
                        className="p-1.5 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                        title="Appliquer"
                      >
                        <Check size={16} />
                      </button>
                      {p.en_promotion && (
                        <button
                          onClick={() => retirerPromotion(p)}
                          disabled={enregistrement === p.id}
                          className="p-1.5 text-destructive hover:bg-red-50 rounded disabled:opacity-50"
                          title="Retirer la promotion"
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
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
