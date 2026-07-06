from django.contrib import admin
from .models import (
    Produit, Categorie, Utilisateur, Panier, Article, Commande, LigneCommande,
    Favoris, Paiement, Notification, AbonneNewsletter, ParametresBoutique,
    NumeroPaiement
)

# Customiser le site admin
admin.site.site_header = "Administration - Douce Boutique"
admin.site.site_title = "Douce Boutique Admin"

@admin.register(Categorie)
class CategorieAdmin(admin.ModelAdmin):
    list_display = ('nom', 'slug', 'icone')
    prepopulated_fields = {'slug': ('nom',)}
    search_fields = ('nom',)

@admin.register(Produit)
class ProduitAdmin(admin.ModelAdmin):
    list_display = ('nom', 'prix', 'categorie', 'stock', 'nouveau', 'en_promotion', 'date_creation')
    list_filter = ('categorie', 'nouveau', 'en_promotion', 'date_creation')
    search_fields = ('nom', 'description')
    readonly_fields = ('date_creation', 'date_modification')
    fieldsets = (
        ('Informations principales', {
            'fields': ('nom', 'description', 'categorie')
        }),
        ('Tarification', {
            'fields': ('prix', 'prix_original')
        }),
        ('Stock et promotion', {
            'fields': ('stock', 'nouveau', 'en_promotion')
        }),
        ('Images', {
            'fields': ('image_principale',)
        }),
        ('Variantes', {
            'fields': ('tailles', 'couleurs')
        }),
        ('Dates', {
            'fields': ('date_creation', 'date_modification'),
            'classes': ('collapse',)
        }),
    )

@admin.register(Utilisateur)
class UtilisateurAdmin(admin.ModelAdmin):
    list_display = ('email', 'nom_complet', 'telephone', 'date_inscription', 'est_actif')
    list_filter = ('date_inscription', 'est_actif')
    search_fields = ('email', 'nom', 'prenom')
    readonly_fields = ('date_inscription', 'date_modification')
    fieldsets = (
        ('Compte', {
            'fields': ('email', 'mot_de_passe')
        }),
        ('Informations personnelles', {
            'fields': ('nom', 'prenom', 'telephone')
        }),
        ('Adresse', {
            'fields': ('adresse', 'ville', 'code_postal', 'pays')
        }),
        ('Statut', {
            'fields': ('est_actif', 'est_admin', 'date_inscription', 'date_modification')
        }),
    )

@admin.register(Panier)
class PanierAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'total_articles', 'prix_total', 'date_creation')
    list_filter = ('date_creation', 'date_modification')
    search_fields = ('utilisateur__email',)
    readonly_fields = ('prix_total', 'date_creation', 'date_modification')

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('produit', 'panier', 'quantite', 'prix_unitaire')
    list_filter = ('panier',)
    search_fields = ('produit__nom',)

@admin.register(Commande)
class CommandeAdmin(admin.ModelAdmin):
    list_display = ('numero', 'utilisateur', 'statut', 'prix_total', 'date_commande')
    list_filter = ('statut', 'date_commande')
    search_fields = ('numero', 'utilisateur__email')
    readonly_fields = ('numero', 'prix_total', 'date_commande', 'date_modification')
    fieldsets = (
        ('Commande', {
            'fields': ('numero', 'utilisateur', 'statut')
        }),
        ('Adresse de livraison', {
            'fields': ('adresse_livraison', 'ville_livraison', 'code_postal_livraison', 'pays_livraison')
        }),
        ('Tarification', {
            'fields': ('prix_total',)
        }),
        ('Notes', {
            'fields': ('notes',)
        }),
        ('Dates', {
            'fields': ('date_commande', 'date_modification')
        }),
    )

@admin.register(LigneCommande)
class LigneCommandeAdmin(admin.ModelAdmin):
    list_display = ('commande', 'produit', 'quantite', 'prix_unitaire')
    list_filter = ('commande',)
    search_fields = ('commande__numero', 'produit__nom')

@admin.register(Favoris)
class FavorisAdmin(admin.ModelAdmin):
    list_display = ('utilisateur', 'produit', 'date_ajout')
    list_filter = ('date_ajout', 'utilisateur')
    search_fields = ('utilisateur__email', 'produit__nom')
    readonly_fields = ('date_ajout',)

@admin.register(Paiement)
class PaiementAdmin(admin.ModelAdmin):
    list_display = ('transaction_id', 'commande', 'mode', 'statut', 'montant', 'canal', 'date_creation')
    list_filter = ('mode', 'statut', 'date_creation')
    search_fields = ('transaction_id', 'commande__numero')
    readonly_fields = ('date_creation', 'date_modification')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('titre', 'utilisateur', 'type', 'lu', 'date_creation')
    list_filter = ('type', 'lu', 'date_creation')
    search_fields = ('titre', 'utilisateur__email')
    readonly_fields = ('date_creation',)

@admin.register(AbonneNewsletter)
class AbonneNewsletterAdmin(admin.ModelAdmin):
    list_display = ('email', 'actif', 'date_inscription')
    list_filter = ('actif', 'date_inscription')
    search_fields = ('email',)
    readonly_fields = ('date_inscription', 'token_desinscription')

@admin.register(ParametresBoutique)
class ParametresBoutiqueAdmin(admin.ModelAdmin):
    list_display = ('frais_livraison', 'date_modification')
    readonly_fields = ('date_modification',)

@admin.register(NumeroPaiement)
class NumeroPaiementAdmin(admin.ModelAdmin):
    list_display = ('operateur', 'numero', 'nom_beneficiaire', 'actif', 'date_creation')
    list_filter = ('operateur', 'actif')
    search_fields = ('numero', 'nom_beneficiaire')
    readonly_fields = ('date_creation',)
