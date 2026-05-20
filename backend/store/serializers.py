from rest_framework import serializers
from .models import Categorie, Produit, Utilisateur, Panier, Article, Commande, LigneCommande, Favoris
from django.contrib.auth.hashers import make_password
import re

class CategorieSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categorie
        fields = ['id', 'nom', 'slug', 'description', 'icone']

class ProduitSerializer(serializers.ModelSerializer):
    categorie_nom = serializers.CharField(source='categorie.nom', read_only=True)
    en_stock = serializers.BooleanField(read_only=True)
    pourcentage_reduction = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    
    class Meta:
        model = Produit
        fields = [
            'id', 'nom', 'description', 'prix', 'prix_original',
            'categorie', 'categorie_nom', 'image_principale', 'stock',
            'nouveau', 'en_promotion', 'tailles', 'couleurs',
            'en_stock', 'pourcentage_reduction', 'date_creation'
        ]
        read_only_fields = ['id', 'date_creation']

class UtilisateurSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'email', 'nom', 'prenom', 'nom_complet',
            'telephone', 'adresse', 'ville', 'code_postal', 'pays',
            'est_actif', 'date_inscription'
        ]
        read_only_fields = ['id', 'date_inscription']

class UtilisateurDetailSerializer(serializers.ModelSerializer):
    nom_complet = serializers.CharField(read_only=True)
    
    class Meta:
        model = Utilisateur
        fields = [
            'id', 'email', 'nom', 'prenom', 'nom_complet',
            'telephone', 'adresse', 'ville', 'code_postal', 'pays',
            'est_actif', 'est_admin', 'date_inscription', 'date_modification'
        ]
        read_only_fields = ['id', 'date_inscription', 'date_modification', 'est_admin']

class InscriptionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(min_length=6, write_only=True)
    nom = serializers.CharField(max_length=100)
    prenom = serializers.CharField(max_length=100)
    telephone = serializers.CharField(max_length=20, required=False, allow_blank=True)
    adresse = serializers.CharField(max_length=255, required=False, allow_blank=True)
    ville = serializers.CharField(max_length=100, required=False, allow_blank=True)
    code_postal = serializers.CharField(max_length=20, required=False, allow_blank=True)
    
    def validate_email(self, value):
        if Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Cet email est déjà utilisé.")
        return value
    
    def validate_mot_de_passe(self, value):
        # Validation simple en développement
        if len(value) < 6:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 6 caractères.")
        return value
    
    def create(self, validated_data):
        utilisateur = Utilisateur.objects.create(
            email=validated_data['email'],
            mot_de_passe=make_password(validated_data['mot_de_passe']),
            nom=validated_data['nom'],
            prenom=validated_data['prenom'],
            telephone=validated_data.get('telephone', ''),
            adresse=validated_data.get('adresse', ''),
            ville=validated_data.get('ville', ''),
            code_postal=validated_data.get('code_postal', ''),
        )
        # Créer un panier pour l'utilisateur
        Panier.objects.create(utilisateur=utilisateur)
        return utilisateur

class ConnexionSerializer(serializers.Serializer):
    email = serializers.EmailField()
    mot_de_passe = serializers.CharField(write_only=True)

class ArticleSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    prix_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Article
        fields = [
            'id', 'produit', 'produit_nom', 'quantite',
            'prix_unitaire', 'taille', 'couleur', 'prix_total'
        ]
        read_only_fields = ['id', 'prix_unitaire']

class PanierSerializer(serializers.ModelSerializer):
    articles = ArticleSerializer(many=True, read_only=True)
    total_articles = serializers.IntegerField(read_only=True)
    prix_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = Panier
        fields = ['id', 'utilisateur', 'articles', 'total_articles', 'prix_total', 'date_modification']

class LigneCommandeSerializer(serializers.ModelSerializer):
    produit_nom = serializers.CharField(source='produit.nom', read_only=True)
    prix_total = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    class Meta:
        model = LigneCommande
        fields = [
            'id', 'produit', 'produit_nom', 'quantite',
            'prix_unitaire', 'taille', 'couleur', 'prix_total'
        ]

class CommandeSerializer(serializers.ModelSerializer):
    lignes = LigneCommandeSerializer(many=True, read_only=True)
    utilisateur_email = serializers.CharField(source='utilisateur.email', read_only=True)
    utilisateur_nom = serializers.CharField(source='utilisateur.nom_complet', read_only=True)

    class Meta:
        model = Commande
        fields = [
            'id', 'numero', 'utilisateur', 'utilisateur_email', 'utilisateur_nom', 'statut',
            'prix_total', 'adresse_livraison', 'ville_livraison',
            'code_postal_livraison', 'pays_livraison', 'notes',
            'lignes', 'date_commande', 'date_modification'
        ]
        read_only_fields = ['id', 'numero', 'prix_total', 'date_commande', 'date_modification']

class CommandeCreationSerializer(serializers.Serializer):
    adresse_livraison = serializers.CharField(max_length=255)
    ville_livraison = serializers.CharField(max_length=100)
    code_postal_livraison = serializers.CharField(max_length=20)
    pays_livraison = serializers.CharField(max_length=100, default='France')
    notes = serializers.CharField(required=False, allow_blank=True)

class FavorisSerializer(serializers.ModelSerializer):
    produit = ProduitSerializer(read_only=True)
    produit_id = serializers.UUIDField(write_only=True)
    
    class Meta:
        model = Favoris
        fields = ['id', 'produit', 'produit_id', 'date_ajout']
        read_only_fields = ['id', 'date_ajout']

class MotDePasseOublieSerializer(serializers.Serializer):
    email = serializers.EmailField()
    
    def validate_email(self, value):
        if not Utilisateur.objects.filter(email=value).exists():
            raise serializers.ValidationError("Aucun utilisateur avec cet email.")
        return value

class ReinitialisationMotDePasseSerializer(serializers.Serializer):
    token = serializers.CharField(write_only=True)
    nouveau_mot_de_passe = serializers.CharField(min_length=8, write_only=True)
    
    def validate_nouveau_mot_de_passe(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Le mot de passe doit contenir au moins 8 caractères.")
        if not re.search(r'[A-Z]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins une majuscule.")
        if not re.search(r'[0-9]', value):
            raise serializers.ValidationError("Le mot de passe doit contenir au moins un chiffre.")
        return value
