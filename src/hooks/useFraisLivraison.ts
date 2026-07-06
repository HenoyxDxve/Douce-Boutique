import { useQuery } from '@tanstack/react-query';
import apiService from '@/lib/api';

export function useFraisLivraison() {
  const { data, ...rest } = useQuery({
    queryKey: ['frais-livraison'],
    queryFn: () => apiService.getFraisLivraison(),
    staleTime: 5 * 60 * 1000,
  });

  return { fraisLivraison: data ? Number(data.frais_livraison) : 0, ...rest };
}
