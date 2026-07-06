import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, ChevronDown, Grid, List, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import CarteProduit from '@/components/CarteProduit';
import { Produit } from '@/data/produits';
import { useProduits, useCategories } from '@/hooks/useProduits';

type TriOption = 'populaire' | 'prix-asc' | 'prix-desc' | 'nouveau';

const Catalogue: React.FC = () => {
  const { data: produits = [], isLoading } = useProduits();
  const { data: categories = [] } = useCategories();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtresOuverts, setFiltresOuverts] = useState(false);
  const [tri, setTri] = useState<TriOption>('populaire');
  const [categoriesSelectionnees, setCategoriesSelectionnees] = useState<string[]>(
    searchParams.get('categorie') ? [searchParams.get('categorie')!] : []
  );
  const [prixMax, setPrixMax] = useState<number | null>(null);
  const [afficherPromo, setAfficherPromo] = useState(false);

  // Filtrer les produits
  const produitsFiltres = useMemo(() => {
    let resultat = [...produits];

    // Filtre par catégorie
    if (categoriesSelectionnees.length > 0) {
      resultat = resultat.filter((p) => categoriesSelectionnees.includes(p.categorie));
    }

    // Filtre par prix
    if (prixMax) {
      resultat = resultat.filter((p) => p.prix <= prixMax);
    }

    // Filtre promotions
    if (afficherPromo) {
      resultat = resultat.filter((p) => p.enPromotion);
    }

    // Tri
    switch (tri) {
      case 'prix-asc':
        resultat.sort((a, b) => a.prix - b.prix);
        break;
      case 'prix-desc':
        resultat.sort((a, b) => b.prix - a.prix);
        break;
      case 'nouveau':
        resultat.sort((a, b) => (b.nouveau ? 1 : 0) - (a.nouveau ? 1 : 0));
        break;
      default:
        break;
    }

    return resultat;
  }, [produits, categoriesSelectionnees, prixMax, afficherPromo, tri]);

  const gererCategorieChange = (catId: string) => {
    setCategoriesSelectionnees((prev) =>
      prev.includes(catId) ? prev.filter((c) => c !== catId) : [...prev, catId]
    );
  };

  const reinitialiserFiltres = () => {
    setCategoriesSelectionnees([]);
    setPrixMax(null);
    setAfficherPromo(false);
    setSearchParams({});
  };

  const nombreFiltresActifs =
    categoriesSelectionnees.length + (prixMax ? 1 : 0) + (afficherPromo ? 1 : 0);

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">Notre Boutique</h1>
          <p className="text-muted-foreground">
            {produitsFiltres.length} article{produitsFiltres.length > 1 ? 's' : ''} trouvé
            {produitsFiltres.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filtres - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Filtres</h3>
                {nombreFiltresActifs > 0 && (
                  <button
                    onClick={reinitialiserFiltres}
                    className="text-sm text-primary hover:underline"
                  >
                    Réinitialiser
                  </button>
                )}
              </div>

              {/* Catégories */}
              <div>
                <h4 className="font-medium mb-3">Catégories</h4>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                    >
                      <Checkbox
                        checked={categoriesSelectionnees.includes(cat.id)}
                        onCheckedChange={() => gererCategorieChange(cat.id)}
                      />
                      <span className="text-sm">{cat.icone} {cat.nom}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div>
                <h4 className="font-medium mb-3">Prix maximum</h4>
                <div className="space-y-2">
                  {[25000, 50000, 75000, 100000].map((prix) => (
                    <label
                      key={prix}
                      className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors"
                    >
                      <Checkbox
                        checked={prixMax === prix}
                        onCheckedChange={() => setPrixMax(prixMax === prix ? null : prix)}
                      />
                      <span className="text-sm">Moins de {prix.toLocaleString()} FCFA</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Promotions */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer hover:text-primary transition-colors">
                  <Checkbox checked={afficherPromo} onCheckedChange={() => setAfficherPromo(!afficherPromo)} />
                  <span className="text-sm font-medium">🔥 En promotion uniquement</span>
                </label>
              </div>
            </div>
          </aside>

          {/* Contenu principal */}
          <div className="flex-1">
            {/* Barre d'outils */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
              {/* Bouton filtres mobile */}
              <button
                className="lg:hidden flex items-center gap-2 px-4 py-2 border border-border rounded-full hover:bg-secondary transition-colors"
                onClick={() => setFiltresOuverts(true)}
              >
                <Filter size={18} />
                Filtres
                {nombreFiltresActifs > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full">
                    {nombreFiltresActifs}
                  </span>
                )}
              </button>

              {/* Tri */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-muted-foreground hidden sm:inline">Trier par :</span>
                <select
                  value={tri}
                  onChange={(e) => setTri(e.target.value as TriOption)}
                  className="bg-transparent border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="populaire">Popularité</option>
                  <option value="nouveau">Nouveautés</option>
                  <option value="prix-asc">Prix croissant</option>
                  <option value="prix-desc">Prix décroissant</option>
                </select>
              </div>
            </div>

            {/* Grille de produits */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
              </div>
            ) : produitsFiltres.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {produitsFiltres.map((produit) => (
                  <CarteProduit key={produit.id} produit={produit} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  Aucun produit ne correspond à vos critères.
                </p>
                <Button onClick={reinitialiserFiltres} className="btn-secondary">
                  Voir tous les produits
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Modal filtres mobile */}
        {filtresOuverts && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-foreground/50" onClick={() => setFiltresOuverts(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Filtres</h3>
                <button onClick={() => setFiltresOuverts(false)} className="p-2 hover:bg-secondary rounded-full">
                  <X size={24} />
                </button>
              </div>

              {/* Catégories */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Catégories</h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => gererCategorieChange(cat.id)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        categoriesSelectionnees.includes(cat.id)
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary text-foreground'
                      }`}
                    >
                      {cat.icone} {cat.nom}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prix */}
              <div className="mb-6">
                <h4 className="font-medium mb-3">Prix maximum</h4>
                <div className="flex flex-wrap gap-2">
                  {[25000, 50000, 75000, 100000].map((prix) => (
                    <button
                      key={prix}
                      onClick={() => setPrixMax(prixMax === prix ? null : prix)}
                      className={`px-4 py-2 rounded-full text-sm transition-colors ${
                        prixMax === prix ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                      }`}
                    >
                      {prix.toLocaleString()} FCFA
                    </button>
                  ))}
                </div>
              </div>

              {/* Promotions */}
              <div className="mb-6">
                <button
                  onClick={() => setAfficherPromo(!afficherPromo)}
                  className={`px-4 py-2 rounded-full text-sm transition-colors ${
                    afficherPromo ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  🔥 En promotion
                </button>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button onClick={reinitialiserFiltres} variant="outline" className="flex-1">
                  Réinitialiser
                </Button>
                <Button onClick={() => setFiltresOuverts(false)} className="flex-1 btn-primary">
                  Voir {produitsFiltres.length} résultat{produitsFiltres.length > 1 ? 's' : ''}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Catalogue;
