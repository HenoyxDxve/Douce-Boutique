import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Produit } from '@/data/produits';
import { useAuth } from './AuthContext';
import apiService from '@/lib/api';
import { adaptProduit } from '@/lib/adaptProduit';
import { toast } from 'sonner';

export interface ArticlePanier {
  produit: Produit;
  quantite: number;
  taille?: string;
  couleur?: string;
  articleId?: string;
}

interface PanierContextType {
  articles: ArticlePanier[];
  ajouterAuPanier: (produit: Produit, quantite?: number, taille?: string, couleur?: string) => Promise<void>;
  retirerDuPanier: (produitId: string) => Promise<void>;
  modifierQuantite: (produitId: string, quantite: number) => Promise<void>;
  viderPanier: () => Promise<void>;
  nombreArticles: number;
  totalPanier: number;
}

const STORAGE_KEY = 'panier_invite';

const PanierContext = createContext<PanierContextType | undefined>(undefined);

interface ArticleAPI {
  id: string;
  produit: import('@/types/produit').ProduitAPI;
  quantite: number;
  taille?: string;
  couleur?: string;
}

function adaptArticles(articlesAPI: ArticleAPI[]): ArticlePanier[] {
  return articlesAPI.map((a) => ({
    produit: adaptProduit(a.produit, new Map()),
    quantite: a.quantite,
    taille: a.taille || undefined,
    couleur: a.couleur || undefined,
    articleId: a.id,
  }));
}

function lireLocal(): ArticlePanier[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function ecrireLocal(articles: ArticlePanier[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(articles));
}

export const PanierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { estConnecte } = useAuth();
  const [articles, setArticles] = useState<ArticlePanier[]>([]);

  const chargerPanierServeur = useCallback(async () => {
    try {
      const data: any = await apiService.getPanier();
      setArticles(adaptArticles(data.articles || []));
    } catch {
      /* silencieux */
    }
  }, []);

  useEffect(() => {
    if (!estConnecte) {
      setArticles(lireLocal());
      return;
    }

    const fusionnerEtCharger = async () => {
      const localArticles = lireLocal();
      if (localArticles.length > 0) {
        for (const a of localArticles) {
          try {
            await apiService.addArticlePanier({
              produit_id: a.produit.id,
              quantite: a.quantite,
              taille: a.taille,
              couleur: a.couleur,
            });
          } catch {
            /* article possiblement invalide, on continue */
          }
        }
        localStorage.removeItem(STORAGE_KEY);
      }
      await chargerPanierServeur();
    };

    fusionnerEtCharger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estConnecte]);

  const ajouterAuPanier = async (produit: Produit, quantite = 1, taille?: string, couleur?: string) => {
    if (!estConnecte) {
      setArticles((prev) => {
        const existant = prev.find(
          (a) => a.produit.id === produit.id && a.taille === taille && a.couleur === couleur,
        );
        const next = existant
          ? prev.map((a) =>
              a.produit.id === produit.id && a.taille === taille && a.couleur === couleur
                ? { ...a, quantite: a.quantite + quantite }
                : a,
            )
          : [...prev, { produit, quantite, taille, couleur }];
        ecrireLocal(next);
        return next;
      });
      return;
    }

    try {
      await apiService.addArticlePanier({ produit_id: produit.id, quantite, taille, couleur });
      await chargerPanierServeur();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'ajout au panier');
    }
  };

  const retirerDuPanier = async (produitId: string) => {
    if (!estConnecte) {
      setArticles((prev) => {
        const next = prev.filter((a) => a.produit.id !== produitId);
        ecrireLocal(next);
        return next;
      });
      return;
    }

    const cibles = articles.filter((a) => a.produit.id === produitId && a.articleId);
    try {
      await Promise.all(cibles.map((a) => apiService.removeArticlePanier(a.articleId!)));
      await chargerPanierServeur();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la suppression');
    }
  };

  const modifierQuantite = async (produitId: string, quantite: number) => {
    if (quantite <= 0) {
      await retirerDuPanier(produitId);
      return;
    }

    if (!estConnecte) {
      setArticles((prev) => {
        const next = prev.map((a) => (a.produit.id === produitId ? { ...a, quantite } : a));
        ecrireLocal(next);
        return next;
      });
      return;
    }

    const cible = articles.find((a) => a.produit.id === produitId && a.articleId);
    if (!cible?.articleId) return;
    try {
      await apiService.updateArticlePanier(cible.articleId, quantite);
      await chargerPanierServeur();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
    }
  };

  const viderPanier = async () => {
    if (!estConnecte) {
      setArticles([]);
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    try {
      await apiService.clearPanier();
      setArticles([]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du vidage du panier');
    }
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
