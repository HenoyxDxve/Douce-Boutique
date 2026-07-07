import { useQuery } from '@tanstack/react-query';
import apiService from '@/lib/api';
import { adaptProduit } from '@/lib/adaptProduit';
import { Produit } from '@/data/produits';
import { CategorieAPI, CategorieDisplay } from '@/types/produit';

export function useCategoriesAPI() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiService.getCategories() as Promise<CategorieAPI[]>,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategories() {
  const { data, ...rest } = useCategoriesAPI();
  const categories: CategorieDisplay[] = (data ?? []).map((c) => ({
    id: c.slug,
    nom: c.nom,
    icone: c.icone,
  }));
  return { ...rest, data: categories };
}

export function useProduits() {
  const categoriesQuery = useCategoriesAPI();

  return useQuery({
    queryKey: ['produits', categoriesQuery.dataUpdatedAt],
    enabled: !!categoriesQuery.data,
    queryFn: async () => {
      const [produits, categories] = await Promise.all([
        apiService.getProduits() as Promise<import('@/types/produit').ProduitAPI[]>,
        Promise.resolve(categoriesQuery.data!),
      ]);
      const categoriesById = new Map(categories.map((c) => [c.id, c]));
      return produits.map((p) => adaptProduit(p, categoriesById)) as Produit[];
    },
  });
}
