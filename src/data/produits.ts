// Images publiques
const robeFleurie = '/assets/products/robe-fleurie.jpg';
const blouseSoie = '/assets/products/blouse-soie.jpg';
const pantalonTailleur = '/assets/products/pantalon-tailleur.jpg';
const sacCuir = '/assets/products/sac-cuir.jpg';
const escarpins = '/assets/products/escarpins.jpg';
const collierOr = '/assets/products/collier-or.jpg';
const robeCocktail = '/assets/products/robe-cocktail.jpg';
const sandalesDorees = '/assets/products/sandales-dorees.jpg';

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

export const categories = [
  { id: 'robes', nom: 'Robes', icone: '👗' },
  { id: 'tops', nom: 'Tops & Blouses', icone: '👚' },
  { id: 'pantalons', nom: 'Pantalons', icone: '👖' },
  { id: 'accessoires', nom: 'Accessoires', icone: '👜' },
  { id: 'chaussures', nom: 'Chaussures', icone: '👠' },
  { id: 'bijoux', nom: 'Bijoux', icone: '💎' },
];

export const produits: Produit[] = [
  {
    id: 'robe-fleurie-1',
    nom: 'Robe Florale Élégante',
    description: 'Une magnifique robe fleurie parfaite pour les beaux jours. Tissu léger et confortable, coupe fluide qui sublime la silhouette.',
    prix: 45000,
    prixOriginal: 65000,
    categorie: 'robes',
    images: [robeFleurie],
    enPromotion: true,
    nouveau: false,
    stock: 15,
    tailles: ['S', 'M', 'L', 'XL'],
    couleurs: ['Rose', 'Bleu ciel', 'Blanc'],
  },
  {
    id: 'blouse-soie-1',
    nom: 'Blouse en Soie Satinée',
    description: 'Blouse élégante en soie satinée, parfaite pour une occasion spéciale ou une journée au bureau.',
    prix: 35000,
    categorie: 'tops',
    images: [blouseSoie],
    enPromotion: false,
    nouveau: true,
    stock: 20,
    tailles: ['XS', 'S', 'M', 'L'],
    couleurs: ['Champagne', 'Noir', 'Bordeaux'],
  },
  {
    id: 'pantalon-tailleur-1',
    nom: 'Pantalon Tailleur Chic',
    description: 'Pantalon tailleur coupe droite, idéal pour un look professionnel et sophistiqué.',
    prix: 38000,
    prixOriginal: 48000,
    categorie: 'pantalons',
    images: [pantalonTailleur],
    enPromotion: true,
    nouveau: false,
    stock: 12,
    tailles: ['36', '38', '40', '42', '44'],
    couleurs: ['Noir', 'Beige', 'Marine'],
  },
  {
    id: 'sac-cuir-1',
    nom: 'Sac à Main Cuir Premium',
    description: 'Sac à main en cuir véritable, design intemporel et finitions soignées.',
    prix: 75000,
    categorie: 'accessoires',
    images: [sacCuir],
    enPromotion: false,
    nouveau: true,
    stock: 8,
    couleurs: ['Camel', 'Noir', 'Bordeaux'],
  },
  {
    id: 'escarpins-1',
    nom: 'Escarpins Nude Classiques',
    description: 'Escarpins élégants couleur nude, talon 8cm, confortables pour toute la journée.',
    prix: 42000,
    categorie: 'chaussures',
    images: [escarpins],
    enPromotion: false,
    nouveau: false,
    stock: 25,
    tailles: ['36', '37', '38', '39', '40', '41'],
    couleurs: ['Nude', 'Noir', 'Rouge'],
  },
  {
    id: 'collier-or-1',
    nom: 'Collier Pendentif Doré',
    description: 'Collier fin avec pendentif délicat, plaqué or 18 carats.',
    prix: 18000,
    prixOriginal: 25000,
    categorie: 'bijoux',
    images: [collierOr],
    enPromotion: true,
    nouveau: false,
    stock: 30,
  },
  {
    id: 'robe-cocktail-1',
    nom: 'Robe Cocktail Noire',
    description: 'La petite robe noire indispensable, coupe ajustée et élégante.',
    prix: 55000,
    categorie: 'robes',
    images: [robeCocktail],
    enPromotion: false,
    nouveau: true,
    stock: 10,
    tailles: ['S', 'M', 'L'],
    couleurs: ['Noir'],
  },
  {
    id: 'sandales-1',
    nom: 'Sandales à Talons Dorées',
    description: 'Sandales à talons avec finition dorée, parfaites pour les soirées.',
    prix: 48000,
    prixOriginal: 60000,
    categorie: 'chaussures',
    images: [sandalesDorees],
    enPromotion: true,
    nouveau: false,
    stock: 18,
    tailles: ['36', '37', '38', '39', '40'],
    couleurs: ['Or', 'Argent'],
  },
];

export const formaterPrix = (prix: number): string => {
  return new Intl.NumberFormat('fr-FR').format(prix) + ' FCFA';
};

export const calculerReduction = (prixOriginal: number, prixActuel: number): number => {
  return Math.round(((prixOriginal - prixActuel) / prixOriginal) * 100);
};
