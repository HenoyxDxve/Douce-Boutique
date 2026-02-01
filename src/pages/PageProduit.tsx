import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Heart, Minus, Plus, ShoppingBag, Truck, RefreshCw, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { produits, formaterPrix, calculerReduction, Produit } from '@/data/produits';
import { usePanier } from '@/contexts/PanierContext';
import CarteProduit from '@/components/CarteProduit';
import { toast } from 'sonner';

const PageProduit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { ajouterAuPanier } = usePanier();

  const produit = produits.find((p) => p.id === id);

  const [quantite, setQuantite] = useState(1);
  const [tailleSelectionnee, setTailleSelectionnee] = useState<string | undefined>(
    produit?.tailles?.[0]
  );
  const [couleurSelectionnee, setCouleurSelectionnee] = useState<string | undefined>(
    produit?.couleurs?.[0]
  );
  const [imageActive, setImageActive] = useState(0);

  if (!produit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-4">Produit non trouvé</h1>
          <Link to="/catalogue">
            <Button className="btn-primary">Retour à la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  const gererAjoutPanier = () => {
    ajouterAuPanier(produit, quantite, tailleSelectionnee, couleurSelectionnee);
    toast.success('Ajouté au panier ! 🛍️', {
      description: `${produit.nom} x${quantite}`,
      action: {
        label: 'Voir le panier',
        onClick: () => navigate('/panier'),
      },
    });
  };

  const produitsSimilaires = produits
    .filter((p) => p.categorie === produit.categorie && p.id !== produit.id)
    .slice(0, 4);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Fil d'Ariane */}
        <nav className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <ChevronLeft size={20} />
            Retour
          </button>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[3/4] bg-cream rounded-2xl overflow-hidden">
              <img
                src={produit.images[imageActive]}
                alt={produit.nom}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnails */}
            {produit.images.length > 1 && (
              <div className="flex gap-2">
                {produit.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setImageActive(index)}
                    className={`w-20 h-24 rounded-lg overflow-hidden border-2 transition-colors ${
                      imageActive === index ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Informations */}
          <div className="lg:sticky lg:top-28 lg:self-start">
            {/* Badges */}
            <div className="flex gap-2 mb-4">
              {produit.enPromotion && produit.prixOriginal && (
                <span className="badge-promo">
                  -{calculerReduction(produit.prixOriginal, produit.prix)}%
                </span>
              )}
              {produit.nouveau && <span className="badge-new">Nouveau</span>}
            </div>

            {/* Catégorie */}
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
              {produit.categorie}
            </p>

            {/* Nom */}
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-4">
              {produit.nom}
            </h1>

            {/* Prix */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-3xl font-semibold text-primary">
                {formaterPrix(produit.prix)}
              </span>
              {produit.prixOriginal && (
                <span className="text-xl text-muted-foreground line-through">
                  {formaterPrix(produit.prixOriginal)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground leading-relaxed mb-8">
              {produit.description}
            </p>

            {/* Tailles */}
            {produit.tailles && produit.tailles.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Taille</h3>
                <div className="flex flex-wrap gap-2">
                  {produit.tailles.map((taille) => (
                    <button
                      key={taille}
                      onClick={() => setTailleSelectionnee(taille)}
                      className={`min-w-[48px] h-12 px-4 rounded-lg border text-sm font-medium transition-all ${
                        tailleSelectionnee === taille
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border hover:border-primary'
                      }`}
                    >
                      {taille}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Couleurs */}
            {produit.couleurs && produit.couleurs.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium mb-3">Couleur : {couleurSelectionnee}</h3>
                <div className="flex flex-wrap gap-3">
                  {produit.couleurs.map((couleur) => (
                    <button
                      key={couleur}
                      onClick={() => setCouleurSelectionnee(couleur)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${
                        couleurSelectionnee === couleur
                          ? 'border-primary ring-2 ring-primary/30'
                          : 'border-border'
                      }`}
                      style={{ backgroundColor: getCouleurHex(couleur) }}
                      title={couleur}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Quantité */}
            <div className="mb-8">
              <h3 className="font-medium mb-3">Quantité</h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-full">
                  <button
                    onClick={() => setQuantite(Math.max(1, quantite - 1))}
                    className="p-3 hover:bg-secondary rounded-l-full transition-colors"
                    aria-label="Diminuer la quantité"
                  >
                    <Minus size={18} />
                  </button>
                  <span className="w-12 text-center font-medium">{quantite}</span>
                  <button
                    onClick={() => setQuantite(quantite + 1)}
                    className="p-3 hover:bg-secondary rounded-r-full transition-colors"
                    aria-label="Augmenter la quantité"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {produit.stock} en stock
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-8">
              <Button
                onClick={gererAjoutPanier}
                className="flex-1 btn-primary py-6 text-base"
                disabled={produit.stock === 0}
              >
                <ShoppingBag className="mr-2" size={20} />
                Ajouter au panier
              </Button>
              <Button
                variant="outline"
                className="p-4 border-border hover:bg-secondary hover:text-primary"
                onClick={() => toast.success('Ajouté aux favoris ! ❤️')}
                aria-label="Ajouter aux favoris"
              >
                <Heart size={24} />
              </Button>
            </div>

            {/* Avantages */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary/50 rounded-2xl">
              <div className="flex items-center gap-2 text-sm">
                <Truck size={18} className="text-primary flex-shrink-0" />
                <span>Livraison rapide</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RefreshCw size={18} className="text-primary flex-shrink-0" />
                <span>Retour 14 jours</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield size={18} className="text-primary flex-shrink-0" />
                <span>Paiement sécurisé</span>
              </div>
            </div>
          </div>
        </div>

        {/* Produits similaires */}
        {produitsSimilaires.length > 0 && (
          <section className="mt-16 md:mt-24">
            <h2 className="section-title mb-8">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {produitsSimilaires.map((p) => (
                <CarteProduit key={p.id} produit={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

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

export default PageProduit;
