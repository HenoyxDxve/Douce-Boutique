from pathlib import Path

from django.core.files import File
from django.core.management.base import BaseCommand
from store.models import Categorie, Produit

ASSETS_DIR = Path(__file__).resolve().parents[4] / 'src' / 'assets' / 'products'

CATEGORIES = [
    {'nom': 'Robes', 'slug': 'robes', 'icone': '👗'},
    {'nom': 'Tops & Blouses', 'slug': 'tops', 'icone': '👚'},
    {'nom': 'Pantalons', 'slug': 'pantalons', 'icone': '👖'},
    {'nom': 'Accessoires', 'slug': 'accessoires', 'icone': '👜'},
    {'nom': 'Chaussures', 'slug': 'chaussures', 'icone': '👠'},
    {'nom': 'Bijoux', 'slug': 'bijoux', 'icone': '💎'},
]

PRODUITS = [
    {
        'nom': 'Robe Florale Élégante',
        'description': "Une magnifique robe fleurie parfaite pour les beaux jours. Tissu léger et confortable, coupe fluide qui sublime la silhouette.",
        'prix': 45000, 'prix_original': 65000, 'categorie': 'robes',
        'stock': 15, 'nouveau': False, 'en_promotion': True,
        'tailles': ['S', 'M', 'L', 'XL'], 'couleurs': ['Rose', 'Bleu ciel', 'Blanc'],
        'image': 'robe-fleurie.jpg',
    },
    {
        'nom': 'Blouse en Soie Satinée',
        'description': "Blouse élégante en soie satinée, parfaite pour une occasion spéciale ou une journée au bureau.",
        'prix': 35000, 'prix_original': None, 'categorie': 'tops',
        'stock': 20, 'nouveau': True, 'en_promotion': False,
        'tailles': ['XS', 'S', 'M', 'L'], 'couleurs': ['Champagne', 'Noir', 'Bordeaux'],
        'image': 'blouse-soie.jpg',
    },
    {
        'nom': 'Pantalon Tailleur Chic',
        'description': "Pantalon tailleur coupe droite, idéal pour un look professionnel et sophistiqué.",
        'prix': 38000, 'prix_original': 48000, 'categorie': 'pantalons',
        'stock': 12, 'nouveau': False, 'en_promotion': True,
        'tailles': ['36', '38', '40', '42', '44'], 'couleurs': ['Noir', 'Beige', 'Marine'],
        'image': 'pantalon-tailleur.jpg',
    },
    {
        'nom': 'Sac à Main Cuir Premium',
        'description': "Sac à main en cuir véritable, design intemporel et finitions soignées.",
        'prix': 75000, 'prix_original': None, 'categorie': 'accessoires',
        'stock': 8, 'nouveau': True, 'en_promotion': False,
        'tailles': [], 'couleurs': ['Camel', 'Noir', 'Bordeaux'],
        'image': 'sac-cuir.jpg',
    },
    {
        'nom': 'Escarpins Nude Classiques',
        'description': "Escarpins élégants couleur nude, talon 8cm, confortables pour toute la journée.",
        'prix': 42000, 'prix_original': None, 'categorie': 'chaussures',
        'stock': 25, 'nouveau': False, 'en_promotion': False,
        'tailles': ['36', '37', '38', '39', '40', '41'], 'couleurs': ['Nude', 'Noir', 'Rouge'],
        'image': 'escarpins.jpg',
    },
    {
        'nom': 'Collier Pendentif Doré',
        'description': "Collier fin avec pendentif délicat, plaqué or 18 carats.",
        'prix': 18000, 'prix_original': 25000, 'categorie': 'bijoux',
        'stock': 30, 'nouveau': False, 'en_promotion': True,
        'tailles': [], 'couleurs': [],
        'image': 'collier-or.jpg',
    },
    {
        'nom': 'Robe Cocktail Noire',
        'description': "La petite robe noire indispensable, coupe ajustée et élégante.",
        'prix': 55000, 'prix_original': None, 'categorie': 'robes',
        'stock': 10, 'nouveau': True, 'en_promotion': False,
        'tailles': ['S', 'M', 'L'], 'couleurs': ['Noir'],
        'image': 'robe-cocktail.jpg',
    },
    {
        'nom': 'Sandales à Talons Dorées',
        'description': "Sandales à talons avec finition dorée, parfaites pour les soirées.",
        'prix': 48000, 'prix_original': 60000, 'categorie': 'chaussures',
        'stock': 18, 'nouveau': False, 'en_promotion': True,
        'tailles': ['36', '37', '38', '39', '40'], 'couleurs': ['Or', 'Argent'],
        'image': 'sandales-dorees.jpg',
    },
]


class Command(BaseCommand):
    help = "Peuple la base avec les catégories et produits de démonstration de la vitrine."

    def handle(self, *args, **options):
        categories_par_slug = {}
        for cat in CATEGORIES:
            categorie, created = Categorie.objects.get_or_create(
                slug=cat['slug'],
                defaults={'nom': cat['nom'], 'icone': cat['icone']},
            )
            categories_par_slug[cat['slug']] = categorie
            self.stdout.write(f"{'Créée' if created else 'Existe déjà'} : catégorie {categorie.nom}")

        for prod in PRODUITS:
            categorie = categories_par_slug[prod['categorie']]
            produit, created = Produit.objects.get_or_create(
                nom=prod['nom'],
                defaults={
                    'description': prod['description'],
                    'prix': prod['prix'],
                    'prix_original': prod['prix_original'],
                    'categorie': categorie,
                    'stock': prod['stock'],
                    'nouveau': prod['nouveau'],
                    'en_promotion': prod['en_promotion'],
                    'tailles': prod['tailles'],
                    'couleurs': prod['couleurs'],
                },
            )
            self.stdout.write(f"{'Créé' if created else 'Existe déjà'} : produit {produit.nom}")

            # Toujours (re)pousser l'image, même sur un produit déjà existant :
            # le champ en base ne garantit pas que le fichier existe encore
            # dans le stockage actif (utile lors du passage au stockage R2).
            image_path = ASSETS_DIR / prod['image']
            if image_path.exists():
                with open(image_path, 'rb') as f:
                        produit.image_principale.save(prod['image'], File(f), save=True)

        self.stdout.write(self.style.SUCCESS('Seed terminé.'))
