import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { useAuth } from './AuthContext';
import apiService from '@/lib/api';
import { toast } from 'sonner';

interface FavorisContextType {
  favorisIds: Set<string>;
  chargement: boolean;
  isFavoris: (produitId: string) => boolean;
  toggleFavoris: (produitId: string) => Promise<void>;
  recharger: () => Promise<void>;
}

const FavorisContext = createContext<FavorisContextType | undefined>(undefined);

export const FavorisProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { estConnecte } = useAuth();
  const [favorisIds, setFavorisIds] = useState<Set<string>>(new Set());
  const [chargement, setChargement] = useState(false);

  const recharger = useCallback(async () => {
    if (!estConnecte) {
      setFavorisIds(new Set());
      return;
    }
    setChargement(true);
    try {
      const data: any = await apiService.getFavoris();
      const ids = new Set<string>(
        Array.isArray(data)
          ? data.map((f: any) => f.produit?.id ?? f.produit_id ?? '')
          : [],
      );
      setFavorisIds(ids);
    } catch {
      /* silencieux */
    } finally {
      setChargement(false);
    }
  }, [estConnecte]);

  useEffect(() => {
    recharger();
  }, [recharger]);

  const isFavoris = (produitId: string) => favorisIds.has(produitId);

  const toggleFavoris = async (produitId: string) => {
    if (!estConnecte) return;
    const estFavoris = favorisIds.has(produitId);
    // Optimistic update
    setFavorisIds((prev) => {
      const next = new Set(prev);
      if (estFavoris) next.delete(produitId);
      else next.add(produitId);
      return next;
    });
    try {
      if (estFavoris) {
        await apiService.removeFromFavoris(produitId);
        toast.success('Retiré des favoris');
      } else {
        await apiService.addToFavoris(produitId);
        toast.success('Ajouté aux favoris ❤️');
      }
    } catch {
      // Rollback
      setFavorisIds((prev) => {
        const next = new Set(prev);
        if (estFavoris) next.add(produitId);
        else next.delete(produitId);
        return next;
      });
      toast.error('Erreur lors de la mise à jour des favoris');
    }
  };

  return (
    <FavorisContext.Provider
      value={{ favorisIds, chargement, isFavoris, toggleFavoris, recharger }}
    >
      {children}
    </FavorisContext.Provider>
  );
};

export const useFavoris = () => {
  const ctx = useContext(FavorisContext);
  if (!ctx)
    throw new Error('useFavoris doit être utilisé dans un FavorisProvider');
  return ctx;
};
