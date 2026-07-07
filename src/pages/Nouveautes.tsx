import React from 'react';
import CarteProduit from '@/components/CarteProduit';
import { useProduits } from '@/hooks/useProduits';

const Nouveautes: React.FC = () => {
  const { data: produits = [], isLoading } = useProduits();
  const produitsNouveaux = produits.filter((p) => p.nouveau);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-12">
          <span className="inline-block text-4xl mb-4">✨</span>
          <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
            Nouveautés
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Découvrez les dernières pièces de notre collection. Du style et de l'élégance pour sublimer votre garde-robe.
          </p>
        </div>

        {/* Grille de produits */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : produitsNouveaux.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {produitsNouveaux.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              De nouvelles pièces arrivent bientôt !
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Nouveautes;
