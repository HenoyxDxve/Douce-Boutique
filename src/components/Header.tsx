import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingBag, User, Search, Menu, X, Heart, LogOut } from 'lucide-react';
import { usePanier } from '@/contexts/PanierContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import apiService from '@/lib/api.ts';

const Header: React.FC = () => {
  const [menuOuvert, setMenuOuvert] = useState(false);
  const [rechercheOuverte, setRechercheOuverte] = useState(false);
  const { nombreArticles } = usePanier();
  const { estConnecte, estAdmin, utilisateur, deconnexion } = useAuth();
  const location = useLocation();

  const liens = [
    { href: '/', label: 'Accueil' },
    { href: '/catalogue', label: 'Boutique' },
    { href: '/promotions', label: 'Promotions' },
    { href: '/nouveautes', label: 'Nouveautés' },
  ];

  const estActif = (href: string) => location.pathname === href;

  const handleDeconnexion = () => {
    deconnexion();
    setMenuOuvert(false);
  };

  const redirectionAdmin = () => {
    // Demander au backend de créer une session admin (en utilisant le JWT stocké)
    apiService.createAdminSession()
      .then(() => {
        // Rediriger vers le tableau de bord admin du frontend
        window.location.href = 'http://localhost:8081/admin/dashboard';
      })
      .catch((err) => {
        console.error('Erreur création session admin:', err);
        // Fallback vers Django admin
        window.open('http://localhost:8000/admin/', '_blank');
      });
  };

  return (
    <header className="sticky top-0 z-50 bg-card/95 backdrop-blur-md border-b border-border">
      {/* Bannière promo */}
      <div className="bg-primary text-primary-foreground text-center py-2 text-sm">
        <span className="font-medium">🎀 Livraison gratuite dès 50 000 FCFA d'achat !</span>
      </div>

      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Menu mobile */}
          <button
            className="md:hidden p-2 hover:bg-secondary rounded-full transition-colors"
            onClick={() => setMenuOuvert(!menuOuvert)}
            aria-label="Menu"
          >
            {menuOuvert ? <X size={24} /> : <Menu size={24} />}
          </button>

          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <h1 className="text-2xl md:text-3xl font-serif font-semibold text-foreground">
              <span className="text-primary">Belle</span>Boutique
            </h1>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center space-x-8">
            {liens.map((lien) => (
              <Link
                key={lien.href}
                to={lien.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  estActif(lien.href)
                    ? 'text-primary border-b-2 border-primary pb-1'
                    : 'text-foreground'
                }`}
              >
                {lien.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-2 md:space-x-4">
            {/* Recherche */}
            <div className="relative">
              {rechercheOuverte ? (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center animate-fade-in">
                  <Input
                    type="text"
                    placeholder="Rechercher..."
                    className="w-48 md:w-64 input-elegant"
                    autoFocus
                    onBlur={() => setRechercheOuverte(false)}
                  />
                </div>
              ) : (
                <button
                  className="p-2 hover:bg-secondary rounded-full transition-colors"
                  onClick={() => setRechercheOuverte(true)}
                  aria-label="Rechercher"
                >
                  <Search size={20} />
                </button>
              )}
            </div>

            {/* Favoris - visible si connecté */}
            {estConnecte && (
              <Link to="/favoris" className="hidden md:flex p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Favoris">
                <Heart size={20} />
              </Link>
            )}

            {/* Compte ou Admin */}
            {estConnecte ? (
              <>
                {estAdmin ? (
                  <button
                    onClick={redirectionAdmin}
                    className="hidden md:flex p-2 hover:bg-secondary rounded-full transition-colors text-primary font-bold"
                    aria-label="Admin"
                    title="Dashboard Admin"
                  >
                    ⚙️
                  </button>
                ) : (
                  <Link to="/compte" className="hidden md:flex p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Mon compte">
                    <User size={20} />
                  </Link>
                )}
              </>
            ) : (
              <Link to="/connexion" className="hidden md:flex p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Connexion">
                <User size={20} />
              </Link>
            )}

            {/* Panier */}
            <Link to="/panier" className="relative p-2 hover:bg-secondary rounded-full transition-colors" aria-label="Panier">
              <ShoppingBag size={20} />
              {nombreArticles > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium animate-scale-in">
                  {nombreArticles}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Menu mobile ouvert */}
        {menuOuvert && (
          <nav className="md:hidden py-4 border-t border-border animate-slide-up">
            <div className="flex flex-col space-y-3">
              {liens.map((lien) => (
                <Link
                  key={lien.href}
                  to={lien.href}
                  className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                    estActif(lien.href)
                      ? 'bg-secondary text-primary'
                      : 'text-foreground hover:bg-secondary'
                  }`}
                  onClick={() => setMenuOuvert(false)}
                >
                  {lien.label}
                </Link>
              ))}
              {estConnecte && (
                <>
                  <Link
                    to="/favoris"
                    className="py-2 px-4 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                    onClick={() => setMenuOuvert(false)}
                  >
                    <Heart size={16} />
                    Favoris
                  </Link>
                  {estAdmin && (
                    <button
                      onClick={() => {
                        redirectionAdmin();
                        setMenuOuvert(false);
                      }}
                      className="py-2 px-4 rounded-lg text-sm font-medium text-primary hover:bg-secondary transition-colors text-left"
                    >
                      ⚙️ Dashboard Admin
                    </button>
                  )}
                  <button
                    onClick={handleDeconnexion}
                    className="py-2 px-4 rounded-lg text-sm font-medium text-foreground hover:bg-secondary transition-colors flex items-center gap-2"
                  >
                    <LogOut size={16} />
                    Déconnexion
                  </button>
                </>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
