export interface CategorieAPI {
  id: string;
  nom: string;
  slug: string;
  description: string;
  icone: string;
}

export interface ProduitAPI {
  id: string;
  nom: string;
  description: string;
  prix: string | number;
  prix_original: string | number | null;
  categorie: string;
  categorie_nom: string;
  image_principale: string | null;
  stock: number;
  nouveau: boolean;
  en_promotion: boolean;
  tailles: string[];
  couleurs: string[];
  en_stock: boolean;
  pourcentage_reduction: string | number;
  date_creation: string;
}

export interface CategorieDisplay {
  id: string;
  nom: string;
  icone: string;
}
