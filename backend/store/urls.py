from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategorieViewSet, ProduitViewSet, InscriptionView, ConnexionView,
    UtilisateurViewSet, PanierViewSet, CommandeViewSet, FavorisViewSet,
    MotDePasseOublieView, ReinitialisationMotDePasseView, AdminSessionView,
    MTNInitiatePayment, MTNWebhookView
)

router = DefaultRouter()
router.register(r'categories', CategorieViewSet)
router.register(r'produits', ProduitViewSet)
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'panier', PanierViewSet, basename='panier')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'favoris', FavorisViewSet, basename='favoris')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/admin_session/', AdminSessionView.as_view(), name='admin_session'),
    path('auth/inscription/', InscriptionView.as_view(), name='inscription'),
    path('auth/connexion/', ConnexionView.as_view(), name='connexion'),
    path('auth/mot-de-passe-oublie/', MotDePasseOublieView.as_view(), name='mot-de-passe-oublie'),
    path('auth/reinitialiser-mot-de-passe/', ReinitialisationMotDePasseView.as_view(), name='reinitialiser-mot-de-passe'),
    # MTN payment endpoints
    path('paiements/mtn/initiate/', MTNInitiatePayment.as_view(), name='mtn_initiate'),
    path('paiements/mtn/webhook/', MTNWebhookView.as_view(), name='mtn_webhook'),
]
