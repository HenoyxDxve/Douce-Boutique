import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck, Shield, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CarteProduit from '@/components/CarteProduit';
import { useProduits, useCategories } from '@/hooks/useProduits';
import heroBanner from '@/assets/hero-banner.jpg';

const Accueil: React.FC = () => {
  const { data: produits = [] } = useProduits();
  const { data: categories = [] } = useCategories();
  const produitsEnPromo = produits.filter((p) => p.enPromotion).slice(0, 4);
  const produitsNouveaux = produits.filter((p) => p.nouveau).slice(0, 4);
  const produitsPophulaires = produits.slice(0, 4);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroBanner}
            alt="Collection Mode Féminine"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/60 to-transparent" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl animate-slide-up">
            <span className="inline-block text-primary font-medium mb-4 tracking-wide">
              ✨ Nouvelle Collection 2026
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-foreground mb-6 leading-tight">
              Sublimez votre
              <span className="block text-primary">élégance naturelle</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed">
              Découvrez notre sélection exclusive de pièces raffinées,
              conçues pour révéler votre beauté unique.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/catalogue">
                <Button className="btn-primary text-base px-8 py-6 group">
                  Découvrir la boutique
                  <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
                </Button>
              </Link>
              <Link to="/promotions">
                <Button variant="outline" className="btn-secondary text-base px-8 py-6">
                  Voir les promotions
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-8 bg-secondary/50 border-y border-border">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Truck className="text-primary" size={28} />
              <span className="font-medium text-sm">Livraison rapide</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="text-primary" size={28} />
              <span className="font-medium text-sm">Paiement sécurisé</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <RefreshCw className="text-primary" size={28} />
              <span className="font-medium text-sm">Retours gratuits</span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Sparkles className="text-primary" size={28} />
              <span className="font-medium text-sm">Qualité premium</span>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="section-title">Nos catégories</h2>
            <p className="section-subtitle">Explorez notre univers mode</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                to={`/catalogue?categorie=${cat.id}`}
                className="group bg-cream hover:bg-secondary rounded-2xl p-6 text-center transition-all duration-300 hover:shadow-card hover:-translate-y-1"
              >
                <span className="text-4xl mb-3 block">{cat.icone}</span>
                <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {cat.nom}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Promotions */}
      <section className="py-16 md:py-24 bg-rose-light/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title">🔥 Promotions</h2>
              <p className="section-subtitle">Profitez de nos meilleures offres</p>
            </div>
            <Link to="/promotions" className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              Tout voir <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {produitsEnPromo.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link to="/promotions">
              <Button variant="outline" className="btn-secondary">
                Voir toutes les promotions
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Nouveautés */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title">✨ Nouveautés</h2>
              <p className="section-subtitle">Les dernières pièces de la collection</p>
            </div>
            <Link to="/nouveautes" className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              Tout voir <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {produitsNouveaux.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        </div>
      </section>

      {/* Bannière promo */}
      <section className="py-16 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-serif text-primary-foreground mb-4">
            -20% sur votre première commande
          </h2>
          <p className="text-primary-foreground/90 text-lg mb-8 max-w-xl mx-auto">
            Inscrivez-vous et utilisez le code BIENVENUE20 lors de votre premier achat
          </p>
          <Link to="/compte">
            <Button className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8 py-6 text-base">
              Créer mon compte
            </Button>
          </Link>
        </div>
      </section>

      {/* Produits populaires */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="section-title">💕 Les plus populaires</h2>
              <p className="section-subtitle">Les coups de cœur de nos clientes</p>
            </div>
            <Link to="/catalogue" className="hidden md:flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
              Tout voir <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {produitsPophulaires.map((produit) => (
              <CarteProduit key={produit.id} produit={produit} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Accueil;
