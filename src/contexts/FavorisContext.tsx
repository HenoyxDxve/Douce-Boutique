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

const STORAGE_KEY = 'favoris_invite';

const FavorisContext = createContext<FavorisContextType | undefined>(undefined);

function lireLocal(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function ecrireLocal(ids: Set<string>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(ids)));
}

export const FavorisProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { estConnecte } = useAuth();
  const [favorisIds, setFavorisIds] = useState<Set<string>>(new Set());
  const [chargement, setChargement] = useState(false);

  const chargerDepuisServeur = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (!estConnecte) {
      setFavorisIds(lireLocal());
      return;
    }

    const fusionnerEtCharger = async () => {
      const locaux = lireLocal();
      if (locaux.size > 0) {
        for (const produitId of locaux) {
          try {
            await apiService.addToFavoris(produitId);
          } catch {
            /* produit possiblement invalide, on continue */
          }
        }
        localStorage.removeItem(STORAGE_KEY);
      }
      await chargerDepuisServeur();
    };

    fusionnerEtCharger();
  }, [estConnecte, chargerDepuisServeur]);

  const isFavoris = (produitId: string) => favorisIds.has(produitId);

  const toggleFavoris = async (produitId: string) => {
    const estFavoris = favorisIds.has(produitId);

    if (!estConnecte) {
      setFavorisIds((prev) => {
        const next = new Set(prev);
        if (estFavoris) next.delete(produitId);
        else next.add(produitId);
        ecrireLocal(next);
        return next;
      });
      toast.success(estFavoris ? 'Retiré des favoris' : 'Ajouté aux favoris ❤️');
      return;
    }

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
      value={{ favorisIds, chargement, isFavoris, toggleFavoris, recharger: chargerDepuisServeur }}
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
