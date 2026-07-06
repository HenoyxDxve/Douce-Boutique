import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag } from 'lucide-react';
import { Produit, formaterPrix, calculerReduction } from '@/data/produits';
import { usePanier } from '@/contexts/PanierContext';
import { useFavoris } from '@/contexts/FavorisContext';
import { toast } from 'sonner';

interface CarteProduitProps {
  produit: Produit;
}

const CarteProduit: React.FC<CarteProduitProps> = ({ produit }) => {
  const { ajouterAuPanier } = usePanier();
  const { isFavoris, toggleFavoris } = useFavoris();

  const estFavoris = isFavoris(produit.id);

  const gererAjoutPanier = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    ajouterAuPanier(produit);
    toast.success('Article ajouté au panier ! 🛍️', {
      description: produit.nom,
    });
  };

  const gererFavoris = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    await toggleFavoris(produit.id);
  };

  return (
      <Link
        to={`/produit/${produit.id}`}
        className="group card-product block animate-fade-in"
      >
        {/* Image */}
        <div className="relative aspect-[3/4] overflow-hidden bg-cream">
          <img
            src={produit.images[0]}
            alt={produit.nom}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {produit.enPromotion && produit.prixOriginal && (
              <span className="badge-promo">
                -{calculerReduction(produit.prixOriginal, produit.prix)}%
              </span>
            )}
            {produit.nouveau && <span className="badge-new">Nouveau</span>}
          </div>

          {/* Actions au survol */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300" />
          <div className="absolute bottom-4 left-4 right-4 flex justify-center gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
            <button
              onClick={gererAjoutPanier}
              className="flex-1 bg-card text-foreground hover:bg-primary hover:text-primary-foreground py-3 px-4 rounded-full font-medium text-sm flex items-center justify-center gap-2 transition-colors shadow-card"
            >
              <ShoppingBag size={16} />
              Ajouter
            </button>
            <button
              onClick={gererFavoris}
              className={`p-3 rounded-full transition-colors shadow-card ${
                estFavoris
                  ? 'bg-red-500 text-white'
                  : 'bg-card text-foreground hover:bg-red-500 hover:text-white'
              }`}
              aria-label="Ajouter aux favoris"
            >
              <Heart size={16} fill={estFavoris ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Informations */}
        <div className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
            {produit.categorie}
          </p>
          <h3 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-1">
            {produit.nom}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-primary">
              {formaterPrix(produit.prix)}
            </span>
            {produit.prixOriginal && (
              <span className="text-sm text-muted-foreground line-through">
                {formaterPrix(produit.prixOriginal)}
              </span>
            )}
          </div>

          {/* Couleurs disponibles */}
          {produit.couleurs && produit.couleurs.length > 0 && (
            <div className="flex items-center gap-1 mt-3">
              {produit.couleurs.slice(0, 4).map((couleur, index) => (
                <div
                  key={index}
                  className="w-4 h-4 rounded-full border border-border"
                  style={{ backgroundColor: getCouleurHex(couleur) }}
                  title={couleur}
                />
              ))}
              {produit.couleurs.length > 4 && (
                <span className="text-xs text-muted-foreground ml-1">
                  +{produit.couleurs.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </Link>
  );
};

// Convertir les noms de couleurs en hex
const getCouleurHex = (nom: string): string => {
  const couleurs: Record<string, string> = {
    'Rose': '#E8B4B8',
    'Bleu ciel': '#87CEEB',
    'Blanc': '#FFFFFF',
    'Noir': '#1A1A1A',
    'Champagne': '#F7E7CE',
    'Bordeaux': '#722F37',
    'Beige': '#F5F5DC',
    'Marine': '#1A237E',
    'Camel': '#C19A6B',
    'Nude': '#E3BC9A',
    'Rouge': '#C41E3A',
    'Or': '#D4AF37',
    'Argent': '#C0C0C0',
  };
  return couleurs[nom] || '#E0E0E0';
};

export default CarteProduit;
