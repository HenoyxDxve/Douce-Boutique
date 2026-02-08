from django.test import TestCase
from django.contrib.auth.hashers import make_password
from store.models import Categorie, Produit, Utilisateur, Panier, Article, Commande, LigneCommande

class CategorieTestCase(TestCase):
    def setUp(self):
        Categorie.objects.create(
            nom='Robes',
            slug='robes',
            icone='👗'
        )

    def test_categorie_creation(self):
        categorie = Categorie.objects.get(slug='robes')
        self.assertEqual(categorie.nom, 'Robes')
        self.assertEqual(categorie.icone, '👗')

class ProduitTestCase(TestCase):
    def setUp(self):
        categorie = Categorie.objects.create(
            nom='Robes',
            slug='robes'
        )
        Produit.objects.create(
            nom='Robe de Soirée',
            description='Une belle robe',
            prix=100.00,
            categorie=categorie,
            stock=10
        )

    def test_produit_creation(self):
        produit = Produit.objects.get(nom='Robe de Soirée')
        self.assertEqual(produit.prix, 100.00)
        self.assertEqual(produit.stock, 10)
        self.assertTrue(produit.en_stock)

    def test_produit_en_stock(self):
        produit = Produit.objects.get(nom='Robe de Soirée')
        self.assertTrue(produit.en_stock)
        
        produit.stock = 0
        produit.save()
        self.assertFalse(produit.en_stock)

class UtilisateurTestCase(TestCase):
    def setUp(self):
        Utilisateur.objects.create(
            email='test@example.com',
            mot_de_passe=make_password('Test@12345'),
            nom='Dupont',
            prenom='Marie',
            telephone='06 12 34 56 78',
            adresse='123 Rue de la Paix',
            ville='Paris',
            code_postal='75001'
        )

    def test_utilisateur_creation(self):
        utilisateur = Utilisateur.objects.get(email='test@example.com')
        self.assertEqual(utilisateur.nom_complet, 'Marie Dupont')
        self.assertTrue(utilisateur.est_actif)

class PanierTestCase(TestCase):
    def setUp(self):
        utilisateur = Utilisateur.objects.create(
            email='test@example.com',
            mot_de_passe=make_password('Test@12345'),
            nom='Dupont',
            prenom='Marie'
        )
        
        categorie = Categorie.objects.create(
            nom='Robes',
            slug='robes'
        )
        
        produit = Produit.objects.create(
            nom='Robe de Soirée',
            description='Une belle robe',
            prix=100.00,
            categorie=categorie,
            stock=10
        )
        
        panier = Panier.objects.create(utilisateur=utilisateur)
        Article.objects.create(
            panier=panier,
            produit=produit,
            quantite=2,
            prix_unitaire=100.00
        )

    def test_panier_creation(self):
        utilisateur = Utilisateur.objects.get(email='test@example.com')
        panier = Panier.objects.get(utilisateur=utilisateur)
        
        self.assertEqual(panier.total_articles, 2)
        self.assertEqual(panier.prix_total, 200.00)

class CommandeTestCase(TestCase):
    def setUp(self):
        utilisateur = Utilisateur.objects.create(
            email='test@example.com',
            mot_de_passe=make_password('Test@12345'),
            nom='Dupont',
            prenom='Marie'
        )
        
        categorie = Categorie.objects.create(
            nom='Robes',
            slug='robes'
        )
        
        produit = Produit.objects.create(
            nom='Robe de Soirée',
            description='Une belle robe',
            prix=100.00,
            categorie=categorie,
            stock=10
        )
        
        commande = Commande.objects.create(
            utilisateur=utilisateur,
            prix_total=100.00,
            adresse_livraison='123 Rue de la Paix',
            ville_livraison='Paris',
            code_postal_livraison='75001'
        )
        
        LigneCommande.objects.create(
            commande=commande,
            produit=produit,
            quantite=1,
            prix_unitaire=100.00
        )

    def test_commande_creation(self):
        commande = Commande.objects.first()
        self.assertIsNotNone(commande.numero)
        self.assertEqual(commande.statut, 'en_attente')
        self.assertEqual(commande.lignes.count(), 1)
