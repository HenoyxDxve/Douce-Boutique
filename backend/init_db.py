"""
Script pour initialiser la base de données avec des données d'exemple
"""
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
django.setup()

from store.models import Categorie, Produit, Utilisateur
from django.contrib.auth.hashers import make_password

# Créer les catégories
categories_data = [
    {'nom': 'Robes', 'slug': 'robes', 'icone': '👗'},
    {'nom': 'Tops & Blouses', 'slug': 'tops', 'icone': '👚'},
    {'nom': 'Pantalons', 'slug': 'pantalons', 'icone': '👖'},
    {'nom': 'Accessoires', 'slug': 'accessoires', 'icone': '👜'},
    {'nom': 'Chaussures', 'slug': 'chaussures', 'icone': '👠'},
    {'nom': 'Bijoux', 'slug': 'bijoux', 'icone': '💎'},
]

print("Création des catégories...")
for cat_data in categories_data:
    Categorie.objects.get_or_create(
        slug=cat_data['slug'],
        defaults={'nom': cat_data['nom'], 'icone': cat_data['icone']}
    )

# Créer les produits
robes = Categorie.objects.get(slug='robes')
tops = Categorie.objects.get(slug='tops')
pantalons = Categorie.objects.get(slug='pantalons')
accessoires = Categorie.objects.get(slug='accessoires')
chaussures = Categorie.objects.get(slug='chaussures')
bijoux = Categorie.objects.get(slug='bijoux')

produits_data = [
    {
        'nom': 'Robe Florale Élégante',
        'description': 'Une magnifique robe fleurie parfaite pour les beaux jours. Tissu léger et confortable, coupe fluide qui sublime la silhouette.',
        'prix': 45.00,
        'prix_original': 65.00,
        'categorie': robes,
        'stock': 15,
        'nouveau': False,
        'en_promotion': True,
        'tailles': ['S', 'M', 'L', 'XL'],
        'couleurs': ['Rose', 'Bleu ciel', 'Blanc'],
    },
    {
        'nom': 'Blouse en Soie Satinée',
        'description': 'Blouse élégante en soie satinée, parfaite pour une occasion spéciale ou une journée au bureau.',
        'prix': 35.00,
        'categorie': tops,
        'stock': 20,
        'nouveau': True,
        'en_promotion': False,
        'tailles': ['XS', 'S', 'M', 'L'],
        'couleurs': ['Champagne', 'Noir', 'Bordeaux'],
    },
    {
        'nom': 'Pantalon Tailleur Chic',
        'description': 'Pantalon tailleur coupe droite, idéal pour un look professionnel et sophistiqué.',
        'prix': 38.00,
        'prix_original': 48.00,
        'categorie': pantalons,
        'stock': 12,
        'nouveau': False,
        'en_promotion': True,
        'tailles': ['36', '38', '40', '42', '44'],
        'couleurs': ['Noir', 'Beige', 'Marine'],
    },
    {
        'nom': 'Sac à Main Cuir Premium',
        'description': 'Sac à main en cuir véritable, design intemporel et finitions soignées.',
        'prix': 75.00,
        'categorie': accessoires,
        'stock': 8,
        'nouveau': True,
        'en_promotion': False,
        'couleurs': ['Camel', 'Noir', 'Bordeaux'],
    },
    {
        'nom': 'Escarpins Nude Classiques',
        'description': 'Escarpins élégants couleur nude, talon 8cm, confortables pour toute la journée.',
        'prix': 42.00,
        'categorie': chaussures,
        'stock': 25,
        'nouveau': False,
        'en_promotion': False,
        'tailles': ['36', '37', '38', '39', '40', '41'],
        'couleurs': ['Nude', 'Noir', 'Rouge'],
    },
    {
        'nom': 'Collier Or Délicat',
        'description': 'Collier en or 18 carats avec pendentif en cristal. Léger et élégant.',
        'prix': 89.00,
        'categorie': bijoux,
        'stock': 10,
        'nouveau': True,
        'en_promotion': False,
        'couleurs': ['Or'],
    },
]

print("Création des produits...")
for prod_data in produits_data:
    Produit.objects.get_or_create(
        nom=prod_data['nom'],
        defaults=prod_data
    )

# Créer un utilisateur admin
print("Création de l'utilisateur admin...")
admin_email = 'admin@douceboutique.fr'
if not Utilisateur.objects.filter(email=admin_email).exists():
    Utilisateur.objects.create(
        email=admin_email,
        mot_de_passe=make_password('Admin@12345'),
        nom='Boutique',
        prenom='Admin',
        est_admin=True,
        est_actif=True,
    )
    print(f"Admin créé: {admin_email} | Mot de passe: Admin@12345")

# Créer un utilisateur de test
print("Création d'un utilisateur de test...")
test_email = 'test@example.com'
if not Utilisateur.objects.filter(email=test_email).exists():
    Utilisateur.objects.create(
        email=test_email,
        mot_de_passe=make_password('Test@12345'),
        nom='Dupont',
        prenom='Marie',
        telephone='06 12 34 56 78',
        adresse='123 Rue de la Paix',
        ville='Paris',
        code_postal='75001',
    )
    print(f"Utilisateur test créé: {test_email} | Mot de passe: Test@12345")

print("Initialisation complète!")
