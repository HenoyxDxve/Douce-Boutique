import React from 'react';
import CarteProduit from '@/components/CarteProduit';
import { useProduits } from '@/hooks/useProduits';

const Promotions: React.FC = () => {
  const { data: produits = [], isLoading } = useProduits();
  const produitsEnPromo = produits.filter((p) => p.enPromotion);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="text-center mb-12">
          <span className="inline-block text-4xl mb-4">🔥</span>
          <h1 className="text-3xl md:text-5xl font-serif text-foreground mb-4">
            Promotions
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Profitez de nos meilleures offres du moment. Des réductions exceptionnelles sur une sélection de pièces.
          </p>
        </div>

        {/* Bannière */}
        <div className="bg-primary rounded-3xl p-8 md:p-12 text-center mb-12">
          <h2 className="text-2xl md:text-4xl font-serif text-primary-foreground mb-4">
            Jusqu'à -30% sur une sélection
          </h2>
          <p className="text-primary-foreground/90 text-lg">
            Offre limitée • Ne manquez pas ces opportunités uniques
          </p>
        </div>

        {/* Grille de produits */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : produitsEnPromo.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {produitsEnPromo.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">
              Aucune promotion en cours pour le moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotions;
