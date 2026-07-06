from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CategorieViewSet, ProduitViewSet, InscriptionView, ConnexionView,
    UtilisateurViewSet, PanierViewSet, CommandeViewSet, FavorisViewSet,
    MotDePasseOublieView, ReinitialisationMotDePasseView, AdminSessionView,
    MTNInitiatePayment, MTNWebhookView,
    CinetPayInitiateView, CinetPayNotifyView, CinetPayStatusView,
    NotificationViewSet, InscrireNewsletterView, NewsletterAdminView,
    EnvoyerCampagneNewsletterView, ExportNewsletterView, DesinscrireNewsletterView,
    ParametresLivraisonView, NumeroPaiementViewSet, GoogleAuthView
)

router = DefaultRouter()
router.register(r'categories', CategorieViewSet)
router.register(r'produits', ProduitViewSet)
router.register(r'utilisateurs', UtilisateurViewSet, basename='utilisateur')
router.register(r'panier', PanierViewSet, basename='panier')
router.register(r'commandes', CommandeViewSet, basename='commande')
router.register(r'favoris', FavorisViewSet, basename='favoris')
router.register(r'notifications', NotificationViewSet, basename='notification')
router.register(r'numeros-paiement', NumeroPaiementViewSet, basename='numero-paiement')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/admin_session/', AdminSessionView.as_view(), name='admin_session'),
    path('auth/inscription/', InscriptionView.as_view(), name='inscription'),
    path('auth/connexion/', ConnexionView.as_view(), name='connexion'),
    path('auth/google/', GoogleAuthView.as_view(), name='auth_google'),
    path('auth/mot-de-passe-oublie/', MotDePasseOublieView.as_view(), name='mot-de-passe-oublie'),
    path('auth/reinitialiser-mot-de-passe/', ReinitialisationMotDePasseView.as_view(), name='reinitialiser-mot-de-passe'),
    # MTN payment endpoints (legacy, mode simulation par défaut)
    path('paiements/mtn/initiate/', MTNInitiatePayment.as_view(), name='mtn_initiate'),
    path('paiements/mtn/webhook/', MTNWebhookView.as_view(), name='mtn_webhook'),
    # CinetPay payment endpoints (carte bancaire + Mobile Money : Orange, MTN, Wave)
    path('paiements/cinetpay/initiate/', CinetPayInitiateView.as_view(), name='cinetpay_initiate'),
    path('paiements/cinetpay/notify/', CinetPayNotifyView.as_view(), name='cinetpay_notify'),
    path('paiements/cinetpay/status/', CinetPayStatusView.as_view(), name='cinetpay_status'),
    # Newsletter
    path('newsletter/inscrire/', InscrireNewsletterView.as_view(), name='newsletter_inscrire'),
    path('newsletter/abonnes/', NewsletterAdminView.as_view(), name='newsletter_abonnes'),
    path('newsletter/envoyer_campagne/', EnvoyerCampagneNewsletterView.as_view(), name='newsletter_envoyer_campagne'),
    path('newsletter/export/', ExportNewsletterView.as_view(), name='newsletter_export'),
    path('newsletter/desinscrire/', DesinscrireNewsletterView.as_view(), name='newsletter_desinscrire'),
    # Paramètres boutique
    path('parametres/livraison/', ParametresLivraisonView.as_view(), name='parametres_livraison'),
]
