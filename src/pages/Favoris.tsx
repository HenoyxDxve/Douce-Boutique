import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import apiService from '@/lib/api.ts';
// Header and Footer are provided globally by the app layout

interface Produit {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prix_original?: number;
  categorie_nom: string;
  image_principale?: string;
  stock: number;
  en_stock: boolean;
  pourcentage_reduction: number;
  nouveau: boolean;
  en_promotion: boolean;
}

interface Favoris {
  id: string;
  produit: Produit;
  date_ajout: string;
}

export default function Favoris() {
  const { estConnecte } = useAuth();
  const [favoris, setFavoris] = useState<Favoris[]>([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    const chargerFavoris = async () => {
      if (!estConnecte) {
        setChargement(false);
        return;
      }

      try {
        const data = await apiService.getFavoris();
        setFavoris(Array.isArray(data) ? data : []);
      } catch (err) {
        setErreur('Erreur lors du chargement des favoris');
        console.error(err);
      } finally {
        setChargement(false);
      }
    };

    chargerFavoris();
  }, [estConnecte]);

  const removeFavoris = async (produitId: string) => {
    try {
      await apiService.removeFromFavoris(produitId);
      setFavoris(favoris.filter((f) => f.produit.id !== produitId));
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
    }
  };

  if (!estConnecte) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">❤️ Mes Favoris</h1>
          <p className="text-gray-600 mb-6">Connectez-vous pour voir vos favoris</p>
          <Button href="/connexion" className="bg-pink-600 hover:bg-pink-700">
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p>Chargement des favoris...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-bold mb-2">❤️ Mes Favoris</h1>
          <p className="text-gray-600 mb-8">
            {favoris.length === 0 ? 'Aucun produit favori pour le moment' : `${favoris.length} produit(s) en favori`}
          </p>

          {erreur && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {erreur}
            </div>
          )}

          {favoris.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-lg text-gray-600">
                Vous n'avez pas encore d'articles en favoris
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {favoris.map((fav) => (
                <div
                  key={fav.id}
                  className="bg-white rounded-lg shadow hover:shadow-lg transition overflow-hidden"
                >
                  {fav.produit.image_principale && (
                    <img
                      src={fav.produit.image_principale}
                      alt={fav.produit.nom}
                      className="w-full h-48 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {fav.produit.nom}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {fav.produit.categorie_nom}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        {fav.produit.en_promotion ? (
                          <>
                            <span className="text-xl font-bold text-pink-600">
                              {fav.produit.prix.toFixed(2)} €
                            </span>
                            <span className="ml-2 text-sm text-gray-500 line-through">
                              {fav.produit.prix_original?.toFixed(2)} €
                            </span>
                          </>
                        ) : (
                          <span className="text-xl font-bold text-gray-900">
                            {fav.produit.prix.toFixed(2)} €
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFavoris(fav.produit.id)}
                      className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 rounded transition"
                    >
                      <Heart className="w-4 h-4 fill-current" />
                      Retirer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
}
