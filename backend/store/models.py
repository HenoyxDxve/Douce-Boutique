from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator
import uuid
import secrets
from datetime import timedelta
from django.utils import timezone

class Categorie(models.Model):
    """Modèle pour les catégories de produits"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    icone = models.CharField(max_length=10, default='📦')
    date_creation = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Catégories"
        ordering = ('nom',)
    
    def __str__(self):
        return self.nom

class Produit(models.Model):
    """Modèle pour les produits"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nom = models.CharField(max_length=200)
    description = models.TextField()
    prix = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    prix_original = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)])
    categorie = models.ForeignKey(Categorie, on_delete=models.CASCADE, related_name='produits')
    image_principale = models.ImageField(upload_to='produits/%Y/%m/%d/', blank=True, null=True)
    stock = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    nouveau = models.BooleanField(default=False)
    en_promotion = models.BooleanField(default=False)
    tailles = models.JSONField(default=list, blank=True)  # ['S', 'M', 'L', 'XL']
    couleurs = models.JSONField(default=list, blank=True)  # ['Rouge', 'Bleu', 'Noir']
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ('-date_creation',)
        indexes = [
            models.Index(fields=['categorie', 'prix']),
            models.Index(fields=['en_promotion']),
            models.Index(fields=['nouveau']),
        ]
    
    def __str__(self):
        return self.nom
    
    @property
    def en_stock(self):
        return self.stock > 0
    
    @property
    def pourcentage_reduction(self):
        if self.prix_original and self.prix_original > 0:
            reduction = ((self.prix_original - self.prix) / self.prix_original) * 100
            return round(reduction, 0)
        return 0

class Utilisateur(models.Model):
    """Modèle pour les utilisateurs"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    mot_de_passe = models.CharField(max_length=255)
    nom = models.CharField(max_length=100)
    prenom = models.CharField(max_length=100)
    telephone = models.CharField(max_length=20, blank=True)
    adresse = models.CharField(max_length=255, blank=True)
    ville = models.CharField(max_length=100, blank=True)
    code_postal = models.CharField(max_length=20, blank=True)
    pays = models.CharField(max_length=100, default="Côte d'Ivoire")
    est_actif = models.BooleanField(default=True)
    est_admin = models.BooleanField(default=False)
    date_inscription = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    # Tokens de récupération mot de passe
    token_reset_password = models.CharField(max_length=255, blank=True, null=True)
    token_reset_expires = models.DateTimeField(blank=True, null=True)

    # Notifications push (Firebase Cloud Messaging)
    fcm_token = models.CharField(max_length=255, blank=True, null=True)

    # Connexion Google (Sign-In)
    google_id = models.CharField(max_length=255, blank=True, null=True, unique=True)

    class Meta:
        ordering = ('-date_inscription',)
        indexes = [
            models.Index(fields=['email']),
        ]
    
    def __str__(self):
        return f"{self.nom_complet} ({self.email})"
    
    @property
    def nom_complet(self):
        return f"{self.prenom} {self.nom}".strip()
    
    def generate_reset_token(self):
        """Génère un token unique pour réinitialiser le mot de passe"""
        self.token_reset_password = secrets.token_urlsafe(32)
        self.token_reset_expires = timezone.now() + timedelta(hours=24)
        self.save()
        return self.token_reset_password
    
    def is_reset_token_valid(self, token):
        """Vérifie si le token de réinitialisation est valide"""
        if not self.token_reset_password or not self.token_reset_expires:
            return False
        return (self.token_reset_password == token and 
                timezone.now() < self.token_reset_expires)

class Panier(models.Model):
    """Modèle pour les paniers"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.OneToOneField(Utilisateur, on_delete=models.CASCADE, related_name='panier')
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ('-date_modification',)
    
    def __str__(self):
        return f"Panier de {self.utilisateur.nom_complet}"
    
    @property
    def total_articles(self):
        return sum(article.quantite for article in self.articles.all())
    
    @property
    def prix_total(self):
        return sum(article.prix_unitaire * article.quantite for article in self.articles.all())

class Article(models.Model):
    """Modèle pour les articles dans le panier"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    panier = models.ForeignKey(Panier, on_delete=models.CASCADE, related_name='articles')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='articles_panier')
    quantite = models.IntegerField(default=1, validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    taille = models.CharField(max_length=50, blank=True)
    couleur = models.CharField(max_length=50, blank=True)
    date_ajout = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ('-date_ajout',)
        unique_together = ('panier', 'produit', 'taille', 'couleur')
    
    def __str__(self):
        return f"{self.quantite}x {self.produit.nom}"
    
    @property
    def prix_total(self):
        return self.prix_unitaire * self.quantite

class Commande(models.Model):
    """Modèle pour les commandes"""
    STATUTS = [
        ('en_attente', 'Reçue'),
        ('confirmee', 'Confirmée'),
        ('en_preparation', 'En préparation'),
        ('en_livraison', 'En livraison'),
        ('livree', 'Livrée'),
        ('annulee', 'Annulée'),
    ]

    MODES_PAIEMENT = [
        ('livraison', 'Paiement à la livraison'),
        ('mobile_money_direct', 'Mobile Money direct'),
        ('cinetpay', 'CinetPay (carte + Mobile Money)'),
    ]

    STATUTS_PAIEMENT = [
        ('en_attente', 'En attente'),
        ('paye', 'Payé'),
        ('echoue', 'Échoué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.CharField(max_length=50, unique=True, editable=False)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='commandes')
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    prix_total = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    mode_paiement = models.CharField(max_length=30, choices=MODES_PAIEMENT, default='livraison')
    statut_paiement = models.CharField(max_length=20, choices=STATUTS_PAIEMENT, default='en_attente')

    # Adresse de livraison
    telephone_livraison = models.CharField(max_length=20, blank=True, default='')
    adresse_livraison = models.CharField(max_length=255)
    ville_livraison = models.CharField(max_length=100)
    code_postal_livraison = models.CharField(max_length=20, blank=True, default='')
    pays_livraison = models.CharField(max_length=100, default="Côte d'Ivoire")
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    notes = models.TextField(blank=True)
    date_commande = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ('-date_commande',)
        indexes = [
            models.Index(fields=['utilisateur', 'date_commande']),
            models.Index(fields=['statut']),
        ]
    
    def __str__(self):
        return f"Commande {self.numero}"

    @property
    def montant_produits(self):
        """Sous-total des produits, hors frais de livraison."""
        return self.prix_total - self.frais_livraison

    def save(self, *args, **kwargs):
        if not self.numero:
            from datetime import datetime
            timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
            self.numero = f"CMD-{timestamp}-{uuid.uuid4().hex[:6].upper()}"
        super().save(*args, **kwargs)

class LigneCommande(models.Model):
    """Modèle pour les lignes de commande"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='lignes')
    produit = models.ForeignKey(Produit, on_delete=models.PROTECT, related_name='lignes_commande')
    quantite = models.IntegerField(validators=[MinValueValidator(1)])
    prix_unitaire = models.DecimalField(max_digits=10, decimal_places=2)
    taille = models.CharField(max_length=50, blank=True)
    couleur = models.CharField(max_length=50, blank=True)
    
    class Meta:
        ordering = ('commande',)
    
    def __str__(self):
        return f"{self.quantite}x {self.produit.nom} (Commande {self.commande.numero})"
    
    @property
    def prix_total(self):
        return self.prix_unitaire * self.quantite

class Favoris(models.Model):
    """Modèle pour les produits favoris"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='favoris')
    produit = models.ForeignKey(Produit, on_delete=models.CASCADE, related_name='favoris_de')
    date_ajout = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-date_ajout',)
        unique_together = ('utilisateur', 'produit')
        verbose_name_plural = "Favoris"

    def __str__(self):
        return f"{self.utilisateur.nom_complet} ❤ {self.produit.nom}"

class Paiement(models.Model):
    """Modèle pour les paiements en ligne (CinetPay)"""
    MODES = [
        ('cinetpay', 'CinetPay'),
    ]
    STATUTS = [
        ('en_attente', 'En attente'),
        ('reussi', 'Réussi'),
        ('echoue', 'Échoué'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    commande = models.ForeignKey(Commande, on_delete=models.CASCADE, related_name='paiements')
    mode = models.CharField(max_length=20, choices=MODES, default='cinetpay')
    statut = models.CharField(max_length=20, choices=STATUTS, default='en_attente')
    transaction_id = models.CharField(max_length=100, unique=True)
    montant = models.DecimalField(max_digits=10, decimal_places=2)
    canal = models.CharField(max_length=50, blank=True)  # ex: MOBILE_MONEY, CREDIT_CARD, WALLET
    donnees_brutes = models.JSONField(default=dict, blank=True)
    date_creation = models.DateTimeField(auto_now_add=True)
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ('-date_creation',)

    def __str__(self):
        return f"Paiement {self.transaction_id} ({self.statut})"

class Notification(models.Model):
    """Notification in-app pour un utilisateur (client ou admin)."""
    TYPES = [
        ('commande', 'Commande'),
        ('promotion', 'Promotion'),
        ('info', 'Information'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    utilisateur = models.ForeignKey(Utilisateur, on_delete=models.CASCADE, related_name='notifications')
    titre = models.CharField(max_length=200)
    message = models.TextField(blank=True)
    type = models.CharField(max_length=20, choices=TYPES, default='info')
    lien = models.CharField(max_length=255, blank=True)
    lu = models.BooleanField(default=False)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-date_creation',)
        indexes = [
            models.Index(fields=['utilisateur', 'lu']),
        ]

    def __str__(self):
        return f"{self.titre} → {self.utilisateur.email}"

class AbonneNewsletter(models.Model):
    """Abonné à la newsletter (offres et réductions)."""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    actif = models.BooleanField(default=True)
    token_desinscription = models.CharField(max_length=64, unique=True, editable=False, default='')
    date_inscription = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-date_inscription',)
        verbose_name = "Abonné newsletter"
        verbose_name_plural = "Abonnés newsletter"

    def __str__(self):
        return self.email

    def save(self, *args, **kwargs):
        if not self.token_desinscription:
            self.token_desinscription = secrets.token_urlsafe(32)
        super().save(*args, **kwargs)


class ParametresBoutique(models.Model):
    """Réglages globaux de la boutique (singleton : une seule ligne)."""
    frais_livraison = models.DecimalField(max_digits=10, decimal_places=2, default=1500, validators=[MinValueValidator(0)])
    date_modification = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Paramètres boutique"
        verbose_name_plural = "Paramètres boutique"

    def __str__(self):
        return "Paramètres de la boutique"

    @classmethod
    def get_solo(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj


class NumeroPaiement(models.Model):
    """Numéro Mobile Money géré par l'admin pour le paiement direct."""
    OPERATEURS = [
        ('orange', 'Orange Money'),
        ('mtn', 'MTN Money'),
        ('wave', 'Wave'),
        ('moov', 'Moov Money'),
        ('autre', 'Autre'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    operateur = models.CharField(max_length=20, choices=OPERATEURS, default='orange')
    numero = models.CharField(max_length=20)
    nom_beneficiaire = models.CharField(max_length=150)
    actif = models.BooleanField(default=True)
    date_creation = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-actif', 'operateur')
        verbose_name = "Numéro de paiement"
        verbose_name_plural = "Numéros de paiement"

    def __str__(self):
        return f"{self.get_operateur_display()} — {self.numero} ({self.nom_beneficiaire})"
