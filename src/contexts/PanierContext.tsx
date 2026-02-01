import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Produit } from '@/data/produits';

export interface ArticlePanier {
  produit: Produit;
  quantite: number;
  taille?: string;
  couleur?: string;
}

interface PanierContextType {
  articles: ArticlePanier[];
  ajouterAuPanier: (produit: Produit, quantite?: number, taille?: string, couleur?: string) => void;
  retirerDuPanier: (produitId: string) => void;
  modifierQuantite: (produitId: string, quantite: number) => void;
  viderPanier: () => void;
  nombreArticles: number;
  totalPanier: number;
}

const PanierContext = createContext<PanierContextType | undefined>(undefined);

export const PanierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [articles, setArticles] = useState<ArticlePanier[]>([]);

  const ajouterAuPanier = (produit: Produit, quantite = 1, taille?: string, couleur?: string) => {
    setArticles((prev) => {
      const articleExistant = prev.find(
        (a) => a.produit.id === produit.id && a.taille === taille && a.couleur === couleur
      );

      if (articleExistant) {
        return prev.map((a) =>
          a.produit.id === produit.id && a.taille === taille && a.couleur === couleur
            ? { ...a, quantite: a.quantite + quantite }
            : a
        );
      }

      return [...prev, { produit, quantite, taille, couleur }];
    });
  };

  const retirerDuPanier = (produitId: string) => {
    setArticles((prev) => prev.filter((a) => a.produit.id !== produitId));
  };

  const modifierQuantite = (produitId: string, quantite: number) => {
    if (quantite <= 0) {
      retirerDuPanier(produitId);
      return;
    }
    setArticles((prev) =>
      prev.map((a) => (a.produit.id === produitId ? { ...a, quantite } : a))
    );
  };

  const viderPanier = () => {
    setArticles([]);
  };

  const nombreArticles = articles.reduce((total, a) => total + a.quantite, 0);

  const totalPanier = articles.reduce(
    (total, a) => total + a.produit.prix * a.quantite,
    0
  );

  return (
    <PanierContext.Provider
      value={{
        articles,
        ajouterAuPanier,
        retirerDuPanier,
        modifierQuantite,
        viderPanier,
        nombreArticles,
        totalPanier,
      }}
    >
      {children}
    </PanierContext.Provider>
  );
};

export const usePanier = () => {
  const context = useContext(PanierContext);
  if (!context) {
    throw new Error('usePanier doit être utilisé dans un PanierProvider');
  }
  return context;
};
