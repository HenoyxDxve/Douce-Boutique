export interface Produit {
  id: string;
  nom: string;
  description: string;
  prix: number;
  prixOriginal?: number;
  categorie: string;
  images: string[];
  enPromotion: boolean;
  nouveau: boolean;
  stock: number;
  tailles?: string[];
  couleurs?: string[];
}

export const formaterPrix = (prix: number): string => {
  return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
};

export const calculerReduction = (prixOriginal: number, prixActuel: number): number => {
  return Math.round(((prixOriginal - prixActuel) / prixOriginal) * 100);
};
