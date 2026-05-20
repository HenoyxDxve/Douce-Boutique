import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useFavoris } from '@/contexts/FavorisContext';
import { usePanier } from '@/contexts/PanierContext';
import { produits, formaterPrix } from '@/data/produits';
import { toast } from 'sonner';

export default function Favoris() {
  const navigate = useNavigate();
  const { estConnecte } = useAuth();
  const { favorisIds, chargement, toggleFavoris } = useFavoris();
  const { ajouterAuPanier } = usePanier();

  // Récupérer les produits locaux correspondant aux favoris
  const produitsFavoris = produits.filter((p) => favorisIds.has(p.id));

  if (!estConnecte) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart size={36} className="text-red-400" />
          </div>
          <h1 className="text-2xl font-serif mb-3">Mes Favoris</h1>
          <p className="text-muted-foreground mb-6">
            Connectez-vous pour retrouver vos produits favoris.
          </p>
          <Link to="/connexion">
            <Button className="btn-primary">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (chargement) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">
            Mes Favoris
            {produitsFavoris.length > 0 && (
              <span className="text-primary ml-2">
                ({produitsFavoris.length})
              </span>
            )}
          </h1>
          <p className="text-muted-foreground mt-1">
            {produitsFavoris.length === 0
              ? 'Aucun produit en favori pour le moment'
              : `${produitsFavoris.length} produit${produitsFavoris.length > 1 ? 's' : ''} sauvegardé${produitsFavoris.length > 1 ? 's' : ''}`}
          </p>
        </div>

        {produitsFavoris.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart size={40} className="text-muted-foreground" />
            </div>
            <h2 className="text-xl font-serif mb-3">
              Votre liste de favoris est vide
            </h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Parcourez notre catalogue et cliquez sur le cœur pour sauvegarder
              vos articles préférés.
            </p>
            <Link to="/catalogue">
              <Button className="btn-primary">
                Découvrir la boutique
                <ArrowRight className="ml-2" size={18} />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {produitsFavoris.map((produit) => (
              <div
                key={produit.id}
                className="bg-card rounded-2xl shadow-soft overflow-hidden group animate-fade-in"
              >
                {/* Image */}
                <Link
                  to={`/produit/${produit.id}`}
                  className="block relative aspect-[3/4] overflow-hidden bg-cream"
                >
                  <img
                    src={produit.images[0]}
                    alt={produit.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {produit.enPromotion && produit.prixOriginal && (
                    <span className="badge-promo absolute top-3 left-3">
                      -{Math.round(((produit.prixOriginal - produit.prix) / produit.prixOriginal) * 100)}%
                    </span>
                  )}
                  {produit.nouveau && (
                    <span className="badge-new absolute top-3 left-3">
                      Nouveau
                    </span>
                  )}
                </Link>

                {/* Infos */}
                <div className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    {produit.categorie}
                  </p>
                  <Link to={`/produit/${produit.id}`}>
                    <h3 className="font-medium text-foreground hover:text-primary transition-colors line-clamp-1 mb-2">
                      {produit.nom}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg font-semibold text-primary">
                      {formaterPrix(produit.prix)}
                    </span>
                    {produit.prixOriginal && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formaterPrix(produit.prixOriginal)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 btn-primary py-2 text-sm"
                      onClick={() => {
                        ajouterAuPanier(produit);
                        toast.success('Ajouté au panier ! 🛍️', {
                          description: produit.nom,
                        });
                      }}
                    >
                      <ShoppingBag size={15} className="mr-1.5" />
                      Ajouter
                    </Button>
                    <button
                      onClick={() => toggleFavoris(produit.id)}
                      className="p-2.5 rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive hover:bg-destructive/5 transition-colors"
                      aria-label="Retirer des favoris"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
