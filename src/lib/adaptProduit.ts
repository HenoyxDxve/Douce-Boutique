import { Produit } from '@/data/produits';
import { CategorieAPI, ProduitAPI } from '@/types/produit';
import { resolveImageUrl } from '@/lib/images';

export function adaptProduit(
  p: ProduitAPI,
  categoriesById: Map<string, CategorieAPI>,
): Produit {
  const categorie = categoriesById.get(p.categorie);
  return {
    id: p.id,
    nom: p.nom,
    description: p.description,
    prix: Number(p.prix),
    prixOriginal: p.prix_original ? Number(p.prix_original) : undefined,
    categorie: categorie?.slug ?? p.categorie_nom ?? '',
    images: [resolveImageUrl(p.image_principale)],
    enPromotion: p.en_promotion,
    nouveau: p.nouveau,
    stock: p.stock,
    tailles: p.tailles,
    couleurs: p.couleurs,
  };
}
