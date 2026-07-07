from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.exceptions import PermissionDenied
from rest_framework.throttling import ScopedRateThrottle
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth.hashers import check_password, make_password
from django.shortcuts import get_object_or_404
from django.db.models import Q
import logging
from django.contrib.auth import get_user_model, login
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .models import (
    Categorie, Produit, Utilisateur, Panier, Article, Commande, LigneCommande,
    Favoris, Paiement, Notification, AbonneNewsletter, ParametresBoutique,
    NumeroPaiement
)
from .serializers import (
    CategorieSerializer, ProduitSerializer, UtilisateurSerializer,
    UtilisateurDetailSerializer, InscriptionSerializer, ConnexionSerializer,
    ArticleSerializer, PanierSerializer, CommandeSerializer,
    CommandeCreationSerializer, FavorisSerializer, MotDePasseOublieSerializer,
    ReinitialisationMotDePasseSerializer, PaiementSerializer,
    NotificationSerializer, AbonneNewsletterSerializer,
    InscriptionNewsletterSerializer, CampagneNewsletterSerializer,
    ParametresBoutiqueSerializer, NumeroPaiementSerializer, GoogleAuthSerializer,
    valider_force_mot_de_passe, valider_telephone_ivoirien,
)
from rest_framework.exceptions import ValidationError as DRFValidationError
from django.conf import settings
from django.core.mail import send_mail
from django.db.models import Sum, Count
from django.db.models.functions import TruncDate
from django.utils import timezone
from datetime import timedelta
from . import mtn as mtn_helper
from . import brevo as brevo_helper
from . import cinetpay as cinetpay_helper
from .notifications import creer_notification, notifier_admins
import uuid
import secrets

logger = logging.getLogger(__name__)


def get_utilisateur_from_token(request):
    """Récupère l'Utilisateur (modèle métier) depuis le JWT de la requête.

    Réutilisé par toutes les vues authentifiées : le JWT contient user_id
    dans request.auth (voir store.authentication.JWTAuthentication).
    """
    try:
        if hasattr(request.auth, 'get'):
            user_id = request.auth.get('user_id')
        else:
            user_id = getattr(request.auth, 'user_id', None)

        if user_id:
            return Utilisateur.objects.get(id=user_id)
    except (AttributeError, Utilisateur.DoesNotExist):
        pass
    return None


def generer_tokens_jwt(utilisateur):
    """Génère la paire access/refresh JWT pour un Utilisateur (login classique ou Google)."""
    refresh = RefreshToken()
    refresh['user_id'] = str(utilisateur.id)
    refresh['email'] = utilisateur.email
    refresh['est_admin'] = utilisateur.est_admin
    return {'access': str(refresh.access_token), 'refresh': str(refresh)}


def require_admin(request):
    """Retourne l'Utilisateur admin authentifié, ou lève PermissionDenied (403).

    Point d'entrée unique pour protéger une action admin — évite les
    vérifications dupliquées (et le risque d'en oublier une) à travers le code.
    """
    utilisateur = get_utilisateur_from_token(request)
    if not utilisateur or not getattr(utilisateur, 'est_admin', False):
        raise PermissionDenied('Accès admin requis')
    return utilisateur


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read-only access to anyone, but write access only to admin users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        try:
            utilisateur = get_utilisateur_from_token(request)
            return utilisateur is not None and getattr(utilisateur, 'est_admin', False)
        except Exception:
            logger.exception('Erreur vérification admin')
        return False


@method_decorator(csrf_exempt, name='dispatch')
class AdminSessionView(APIView):
    """Crée une session Django admin à partir d'un JWT valide (dev only)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth_header.startswith('Bearer '):
            return Response({'erreur': 'Token manquant'}, status=status.HTTP_401_UNAUTHORIZED)

        token = auth_header.split()[1]
        try:
            payload = UntypedToken(token)
        except Exception as e:
            logger.exception('Token invalide pour admin_session')
            return Response({'erreur': 'Token invalide'}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = payload.get('user_id')
        if not user_id:
            return Response({'erreur': 'Utilisateur non identifié dans le token'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            utilisateur = Utilisateur.objects.get(id=user_id)
        except Utilisateur.DoesNotExist:
            return Response({'erreur': 'Utilisateur introuvable'}, status=status.HTTP_404_NOT_FOUND)

        if not getattr(utilisateur, 'est_admin', False):
            return Response({'erreur': 'Accès admin requis'}, status=status.HTTP_403_FORBIDDEN)

        # Lier ou créer un Django User correspondant
        User = get_user_model()
        django_user, created = User.objects.get_or_create(
            username=utilisateur.email,
            defaults={'email': utilisateur.email, 'is_staff': True, 'is_superuser': True}
        )
        if not created:
            django_user.is_staff = True
            django_user.is_superuser = True
            django_user.save()

        # Créer la session
        try:
            login(request, django_user)
        except Exception:
            logger.exception('Impossible de créer la session admin')
            return Response({'erreur': 'Erreur serveur'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({'ok': True})

class CategorieViewSet(viewsets.ModelViewSet):
    """ViewSet pour les catégories (lecture publique, écriture réservée aux admins)"""
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

class ProduitViewSet(viewsets.ModelViewSet):
    """ViewSet pour les produits (lecture publique, écriture réservée aux admins)"""
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        queryset = Produit.objects.all()
        
        # Filtrer par catégorie
        categorie = self.request.query_params.get('categorie')
        if categorie:
            queryset = queryset.filter(categorie__slug=categorie)
        
        # Filtrer les nouveautés
        nouveau = self.request.query_params.get('nouveau')
        if nouveau == 'true':
            queryset = queryset.filter(nouveau=True)
        
        # Filtrer les promotions
        promotion = self.request.query_params.get('promotion')
        if promotion == 'true':
            queryset = queryset.filter(en_promotion=True)
        
        # Recherche
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(nom__icontains=search) | Q(description__icontains=search)
            )
        
        # Tri
        ordering = self.request.query_params.get('ordering', '-date_creation')
        queryset = queryset.order_by(ordering)

        return queryset


class ParametresLivraisonView(APIView):
    """Frais de livraison de la boutique : lecture publique (nécessaire au checkout), écriture admin."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        parametres = ParametresBoutique.get_solo()
        return Response(ParametresBoutiqueSerializer(parametres).data)

    def patch(self, request):
        require_admin(request)
        parametres = ParametresBoutique.get_solo()
        serializer = ParametresBoutiqueSerializer(parametres, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class NumeroPaiementViewSet(viewsets.ModelViewSet):
    """Numéros Mobile Money : lecture publique filtrée sur les numéros actifs, écriture admin."""
    serializer_class = NumeroPaiementSerializer
    permission_classes = [IsAdminOrReadOnly]
    pagination_class = None

    def get_queryset(self):
        utilisateur = get_utilisateur_from_token(self.request)
        if utilisateur and getattr(utilisateur, 'est_admin', False):
            return NumeroPaiement.objects.all()
        return NumeroPaiement.objects.filter(actif=True)


class InscriptionView(APIView):
    """Vue pour l'inscription"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()

            return Response({
                'message': 'Inscription réussie',
                'utilisateur': UtilisateurDetailSerializer(utilisateur).data,
                **generer_tokens_jwt(utilisateur),
            }, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConnexionView(APIView):
    """Vue pour la connexion"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ConnexionSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            mot_de_passe = serializer.validated_data['mot_de_passe']
            
            try:
                utilisateur = Utilisateur.objects.get(email=email)
                if check_password(mot_de_passe, utilisateur.mot_de_passe):
                    if not utilisateur.est_actif:
                        return Response(
                            {'erreur': 'Compte désactivé'},
                            status=status.HTTP_403_FORBIDDEN
                        )

                    return Response({
                        'message': 'Connexion réussie',
                        'utilisateur': UtilisateurDetailSerializer(utilisateur).data,
                        **generer_tokens_jwt(utilisateur),
                    }, status=status.HTTP_200_OK)
                else:
                    return Response(
                        {'erreur': 'Email ou mot de passe incorrect'},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
            except Utilisateur.DoesNotExist:
                return Response(
                    {'erreur': 'Email ou mot de passe incorrect'},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@method_decorator(csrf_exempt, name='dispatch')
class GoogleAuthView(APIView):
    """Connexion / inscription via Google Sign-In.

    Vérifie le id_token auprès de Google (aucune confiance dans un email non
    vérifié côté serveur), puis connecte le compte existant ou en crée un.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        client_id = getattr(settings, 'GOOGLE_CLIENT_ID', '')
        if not client_id:
            return Response({'erreur': 'Connexion Google non configurée'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        serializer = GoogleAuthSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            from google.oauth2 import id_token as google_id_token
            from google.auth.transport import requests as google_requests

            payload = google_id_token.verify_oauth2_token(
                serializer.validated_data['id_token'],
                google_requests.Request(),
                client_id,
            )
        except Exception:
            logger.exception('Échec de vérification du id_token Google')
            return Response({'erreur': 'Jeton Google invalide'}, status=status.HTTP_401_UNAUTHORIZED)

        if not payload.get('email_verified', False):
            return Response({'erreur': 'Email Google non vérifié'}, status=status.HTTP_401_UNAUTHORIZED)

        email = payload['email']
        google_id = payload['sub']

        compte_cree = False
        utilisateur = Utilisateur.objects.filter(google_id=google_id).first()
        if not utilisateur:
            # L'email est vérifié par Google : lier en toute sécurité à un compte existant.
            utilisateur = Utilisateur.objects.filter(email=email).first()
            if utilisateur:
                utilisateur.google_id = google_id
                utilisateur.save()
            else:
                utilisateur = Utilisateur.objects.create(
                    email=email,
                    mot_de_passe=make_password(secrets.token_urlsafe(32)),
                    nom=payload.get('family_name', ''),
                    prenom=payload.get('given_name', payload.get('name', 'Client')),
                    google_id=google_id,
                )
                Panier.objects.create(utilisateur=utilisateur)
                compte_cree = True

        if not utilisateur.est_actif:
            return Response({'erreur': 'Compte désactivé'}, status=status.HTTP_403_FORBIDDEN)

        # Comme pour l'inscription classique : la création d'un compte ne
        # connecte pas automatiquement — l'utilisateur doit ensuite
        # s'authentifier explicitement (même geste : recliquer sur le bouton
        # Google, qui reconnaîtra alors le compte existant).
        if compte_cree:
            return Response(
                {
                    'message': 'Compte créé avec succès. Veuillez vous authentifier pour continuer.',
                    'compte_cree': True,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response({
            'message': 'Connexion réussie',
            'utilisateur': UtilisateurDetailSerializer(utilisateur).data,
            **generer_tokens_jwt(utilisateur),
        })

class UtilisateurViewSet(viewsets.ViewSet):
    """ViewSet pour les utilisateurs"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        return get_utilisateur_from_token(request)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Récupère les infos de l'utilisateur connecté"""
        utilisateur = self.get_utilisateur_from_token(request)
        if utilisateur:
            return Response(UtilisateurDetailSerializer(utilisateur).data)
        return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        """Met à jour le profil de l'utilisateur"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        serializer = UtilisateurDetailSerializer(utilisateur, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def list_all(self, request):
        """Liste tous les utilisateurs (admin seulement)."""
        require_admin(request)
        utilisateurs = Utilisateur.objects.all().order_by('-date_inscription')
        serializer = UtilisateurDetailSerializer(utilisateurs, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['patch'])
    def toggle_admin(self, request, pk=None):
        """Promeut/rétrograde un utilisateur admin (admin seulement)."""
        require_admin(request)
        cible = get_object_or_404(Utilisateur, id=pk)
        cible.est_admin = bool(request.data.get('est_admin', not cible.est_admin))
        cible.save()
        return Response(UtilisateurDetailSerializer(cible).data)

    @action(detail=True, methods=['patch'])
    def toggle_actif(self, request, pk=None):
        """Active/désactive un compte utilisateur (admin seulement)."""
        require_admin(request)
        cible = get_object_or_404(Utilisateur, id=pk)
        cible.est_actif = bool(request.data.get('est_actif', not cible.est_actif))
        cible.save()
        return Response(UtilisateurDetailSerializer(cible).data)

    @action(detail=False, methods=['post'])
    def changer_mot_de_passe(self, request):
        """Change le mot de passe de l'utilisateur connecté (nécessite l'ancien mot de passe)."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        ancien = request.data.get('ancien_mot_de_passe', '')
        nouveau = request.data.get('nouveau_mot_de_passe', '')

        if not check_password(ancien, utilisateur.mot_de_passe):
            return Response({'erreur': 'Ancien mot de passe incorrect'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            valider_force_mot_de_passe(nouveau)
        except DRFValidationError as e:
            return Response({'erreur': e.detail[0] if isinstance(e.detail, list) else str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)

        utilisateur.mot_de_passe = make_password(nouveau)
        utilisateur.save()
        return Response({'message': 'Mot de passe modifié avec succès'})

    @action(detail=False, methods=['post'])
    def register_fcm_token(self, request):
        """Enregistre le token Firebase Cloud Messaging de l'utilisateur pour les notifications push."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        utilisateur.fcm_token = request.data.get('fcm_token', '')
        utilisateur.save()
        return Response({'ok': True})

    @action(detail=False, methods=['get'])
    def exporter_donnees(self, request):
        """Exporte toutes les données personnelles de l'utilisateur connecté (portabilité)."""
        import json
        from django.http import HttpResponse

        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        commandes = Commande.objects.filter(utilisateur=utilisateur).order_by('-date_commande')
        favoris = Favoris.objects.filter(utilisateur=utilisateur).select_related('produit')
        abonne = AbonneNewsletter.objects.filter(email=utilisateur.email).first()

        donnees = {
            'profil': UtilisateurDetailSerializer(utilisateur).data,
            'commandes': CommandeSerializer(commandes, many=True, context={'request': request}).data,
            'favoris': FavorisSerializer(favoris, many=True).data,
            'abonne_newsletter': bool(abonne and abonne.actif),
            'date_export': timezone.now().isoformat(),
        }

        contenu = json.dumps(donnees, indent=2, ensure_ascii=False, default=str)
        response = HttpResponse(contenu, content_type='application/json; charset=utf-8')
        response['Content-Disposition'] = f'attachment; filename="mes-donnees-{utilisateur.id}.json"'
        return response

class PanierViewSet(viewsets.ViewSet):
    """ViewSet pour les paniers"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        return get_utilisateur_from_token(request)
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Récupère le panier de l'utilisateur connecté"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier, _ = Panier.objects.get_or_create(utilisateur=utilisateur)
        serializer = PanierSerializer(panier, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_article(self, request):
        """Ajoute un article au panier"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier, _ = Panier.objects.get_or_create(utilisateur=utilisateur)
        
        produit_id = request.data.get('produit_id')
        quantite = int(request.data.get('quantite', 1))
        taille = request.data.get('taille', '')
        couleur = request.data.get('couleur', '')
        
        try:
            produit = Produit.objects.get(id=produit_id)
        except Produit.DoesNotExist:
            return Response({'erreur': 'Produit non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        if produit.stock < quantite:
            return Response(
                {'erreur': 'Stock insuffisant'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        article, created = Article.objects.get_or_create(
            panier=panier,
            produit=produit,
            taille=taille,
            couleur=couleur,
            defaults={'quantite': quantite, 'prix_unitaire': produit.prix}
        )
        
        if not created:
            article.quantite += quantite
            article.save()
        
        serializer = PanierSerializer(panier, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['put'])
    def update_article(self, request):
        """Met à jour la quantité d'un article"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier = get_object_or_404(Panier, utilisateur=utilisateur)
        article_id = request.data.get('article_id')
        quantite = int(request.data.get('quantite', 1))
        
        article = get_object_or_404(Article, id=article_id, panier=panier)
        
        if quantite <= 0:
            article.delete()
        else:
            article.quantite = quantite
            article.save()
        
        serializer = PanierSerializer(panier, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['delete'])
    def remove_article(self, request):
        """Retire un article du panier"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier = get_object_or_404(Panier, utilisateur=utilisateur)
        article_id = request.query_params.get('article_id')
        
        article = get_object_or_404(Article, id=article_id, panier=panier)
        article.delete()
        
        serializer = PanierSerializer(panier, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Vide le panier"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier = get_object_or_404(Panier, utilisateur=utilisateur)
        panier.articles.all().delete()
        
        serializer = PanierSerializer(panier, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class CommandeViewSet(viewsets.ViewSet):
    """ViewSet pour les commandes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        return get_utilisateur_from_token(request)
    
    @action(detail=False, methods=['get'])
    def list_user_commandes(self, request):
        """Liste les commandes de l'utilisateur"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        commandes = Commande.objects.filter(utilisateur=utilisateur).order_by('-date_commande')
        serializer = CommandeSerializer(commandes, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_commande(self, request):
        """Crée une nouvelle commande"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        serializer = CommandeCreationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer le panier
        try:
            panier = Panier.objects.get(utilisateur=utilisateur)
        except Panier.DoesNotExist:
            return Response(
                {'erreur': 'Panier non trouvé'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if panier.articles.count() == 0:
            return Response(
                {'erreur': 'Le panier est vide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Créer la commande
        commande = Commande.objects.create(
            utilisateur=utilisateur,
            prix_total=panier.prix_total,
            adresse_livraison=serializer.validated_data['adresse_livraison'],
            ville_livraison=serializer.validated_data['ville_livraison'],
            code_postal_livraison=serializer.validated_data['code_postal_livraison'],
            pays_livraison=serializer.validated_data.get('pays_livraison', 'France'),
            notes=serializer.validated_data.get('notes', ''),
        )
        
        # Créer les lignes de commande
        for article in panier.articles.all():
            LigneCommande.objects.create(
                commande=commande,
                produit=article.produit,
                quantite=article.quantite,
                prix_unitaire=article.prix_unitaire,
                taille=article.taille,
                couleur=article.couleur,
            )
            
            # Mettre à jour le stock
            article.produit.stock -= article.quantite
            article.produit.save()
        
        # Vider le panier
        panier.articles.all().delete()
        
        response_serializer = CommandeSerializer(commande, context={'request': request})
        return Response(response_serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['get'])
    def retrieve_commande(self, request):
        """Récupère une commande spécifique"""
        numero = request.query_params.get('numero')
        utilisateur = self.get_utilisateur_from_token(request)

        if not utilisateur or not numero:
            return Response(
                {'erreur': 'Paramètres manquants'},
                status=status.HTTP_400_BAD_REQUEST
            )

        commande = get_object_or_404(Commande, numero=numero, utilisateur=utilisateur)
        serializer = CommandeSerializer(commande, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_from_items(self, request):
        """Crée une commande depuis les articles du panier frontend (IDs locaux ou UUID)."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        items = request.data.get('items', [])
        telephone_livraison = request.data.get('telephone_livraison', '').strip()
        adresse_livraison = request.data.get('adresse_livraison', '').strip()
        ville_livraison = request.data.get('ville_livraison', '').strip()
        code_postal_livraison = request.data.get('code_postal_livraison', '').strip()
        pays_livraison = request.data.get('pays_livraison', "Côte d'Ivoire")
        latitude = request.data.get('latitude') or None
        longitude = request.data.get('longitude') or None
        notes = request.data.get('notes', '')
        mode_paiement = request.data.get('mode_paiement', 'livraison')

        if mode_paiement not in dict(Commande.MODES_PAIEMENT):
            mode_paiement = 'livraison'

        if not items:
            return Response({'erreur': 'Aucun article fourni'}, status=status.HTTP_400_BAD_REQUEST)
        if not adresse_livraison or not ville_livraison:
            return Response({'erreur': 'Adresse et ville de livraison requises'}, status=status.HTTP_400_BAD_REQUEST)
        if not telephone_livraison:
            return Response({'erreur': 'Téléphone de livraison requis'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            valider_telephone_ivoirien(telephone_livraison)
        except DRFValidationError as e:
            return Response({'erreur': e.detail[0] if isinstance(e.detail, list) else str(e.detail)}, status=status.HTTP_400_BAD_REQUEST)

        from .slug_mapping import get_product_by_slug_or_id

        # Calculer le sous-total produits depuis les prix envoyés par le frontend
        sous_total_produits = sum(
            float(item.get('prix_unitaire', 0)) * int(item.get('quantite', 1))
            for item in items
        )
        frais_livraison = float(ParametresBoutique.get_solo().frais_livraison)

        commande = Commande.objects.create(
            utilisateur=utilisateur,
            prix_total=sous_total_produits + frais_livraison,
            frais_livraison=frais_livraison,
            mode_paiement=mode_paiement,
            telephone_livraison=telephone_livraison,
            adresse_livraison=adresse_livraison,
            ville_livraison=ville_livraison,
            code_postal_livraison=code_postal_livraison,
            pays_livraison=pays_livraison,
            latitude=latitude,
            longitude=longitude,
            notes=notes,
        )

        for item in items:
            produit_id = str(item.get('produit_id', ''))
            quantite = max(1, int(item.get('quantite', 1)))
            prix_unitaire = float(item.get('prix_unitaire', 0))
            taille = item.get('taille', '') or ''
            couleur = item.get('couleur', '') or ''
            nom = item.get('nom', produit_id)

            produit = get_product_by_slug_or_id(produit_id)

            if produit is None:
                # Créer un produit générique pour ne pas bloquer la commande
                try:
                    categorie, _ = Categorie.objects.get_or_create(
                        slug='divers',
                        defaults={'nom': 'Divers', 'icone': '📦'}
                    )
                    import uuid as _uuid
                    dummy_id = str(_uuid.uuid5(_uuid.NAMESPACE_DNS, produit_id))
                    produit, _ = Produit.objects.get_or_create(
                        id=dummy_id,
                        defaults={
                            'nom': nom,
                            'description': nom,
                            'prix': prix_unitaire,
                            'categorie': categorie,
                            'stock': 0,
                        }
                    )
                except Exception as e:
                    logger.error(f'Impossible de créer produit générique pour {produit_id}: {e}')
                    continue

            LigneCommande.objects.create(
                commande=commande,
                produit=produit,
                quantite=quantite,
                prix_unitaire=prix_unitaire,
                taille=taille,
                couleur=couleur,
            )

            # Décrémenter le stock si disponible
            if produit.stock >= quantite:
                produit.stock -= quantite
                produit.save()

        notifier_admins(
            titre='Nouvelle commande',
            message=f"Commande {commande.numero} de {utilisateur.nom_complet} — {commande.prix_total} FCFA",
            type='commande',
            lien=f'/admin/dashboard/commandes',
        )
        brevo_helper.envoyer_sms(
            commande.telephone_livraison,
            f"Douce Boutique : commande {commande.numero} bien reçue, total {commande.prix_total} FCFA. Merci !",
        )

        serializer = CommandeSerializer(commande, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def list_all_commandes(self, request):
        """Liste toutes les commandes (admin seulement)."""
        require_admin(request)
        commandes = Commande.objects.all().order_by('-date_commande')
        serializer = CommandeSerializer(commandes, many=True, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_status(self, request):
        """Met à jour le statut d'une commande (admin seulement)."""
        require_admin(request)

        commande_id = request.query_params.get('id')
        new_statut = request.data.get('statut')

        statuts_valides = [choix[0] for choix in Commande.STATUTS]
        if new_statut not in statuts_valides:
            return Response({'erreur': f'Statut invalide. Valeurs: {statuts_valides}'}, status=status.HTTP_400_BAD_REQUEST)

        commande = get_object_or_404(Commande, id=commande_id)
        commande.statut = new_statut
        if new_statut == 'livree' and commande.mode_paiement != 'cinetpay':
            commande.statut_paiement = 'paye'
        elif new_statut == 'annulee':
            commande.statut_paiement = 'echoue'
        commande.save()

        statut_labels = dict(Commande.STATUTS)
        libelle_statut = statut_labels.get(new_statut, new_statut).lower()
        creer_notification(
            commande.utilisateur,
            titre='Mise à jour de votre commande',
            message=f"Votre commande {commande.numero} est maintenant {libelle_statut}.",
            type='commande',
            lien=f'/confirmation?numero={commande.numero}',
        )
        brevo_helper.envoyer_sms(
            commande.telephone_livraison,
            f"Douce Boutique : votre commande {commande.numero} est maintenant {libelle_statut}.",
        )

        serializer = CommandeSerializer(commande, context={'request': request})
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Statistiques pour le dashboard admin (admin seulement)."""
        require_admin(request)

        commandes = Commande.objects.all()
        chiffre_affaires_total = commandes.exclude(statut='annulee').aggregate(
            total=Sum('prix_total')
        )['total'] or 0

        par_statut = list(
            commandes.values('statut').annotate(total=Count('id')).order_by('statut')
        )
        compteurs_statut = {ligne['statut']: ligne['total'] for ligne in par_statut}

        depuis = timezone.now() - timedelta(days=30)
        ca_par_jour = list(
            commandes.filter(date_commande__gte=depuis)
            .exclude(statut='annulee')
            .annotate(jour=TruncDate('date_commande'))
            .values('jour')
            .annotate(total=Sum('prix_total'))
            .order_by('jour')
        )

        top_produits = list(
            LigneCommande.objects.values('produit__nom')
            .annotate(quantite_vendue=Sum('quantite'))
            .order_by('-quantite_vendue')[:5]
        )

        return Response({
            'chiffre_affaires_total': chiffre_affaires_total,
            'nombre_commandes': commandes.count(),
            'nombre_clients': Utilisateur.objects.filter(est_admin=False).count(),
            'par_statut': par_statut,
            'commandes_en_attente': compteurs_statut.get('en_attente', 0),
            'commandes_en_preparation': compteurs_statut.get('en_preparation', 0),
            'commandes_en_livraison': compteurs_statut.get('en_livraison', 0),
            'commandes_livrees': compteurs_statut.get('livree', 0),
            'chiffre_affaires_30_jours': ca_par_jour,
            'top_produits': top_produits,
        })

class MotDePasseOublieView(APIView):
    """Vue pour demander une réinitialisation de mot de passe.

    Renvoie toujours le même message de succès, que le compte existe ou non,
    et n'expose jamais le token dans la réponse HTTP (envoyé uniquement par
    email) — évite l'énumération de comptes et le détournement du lien.
    """
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    MESSAGE_GENERIQUE = {
        'message': "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."
    }

    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        try:
            utilisateur = Utilisateur.objects.get(email=email)
        except Utilisateur.DoesNotExist:
            return Response(self.MESSAGE_GENERIQUE, status=status.HTTP_200_OK)

        token = utilisateur.generate_reset_token()
        lien = f"{getattr(settings, 'FRONTEND_URL', '')}/reinitialiser-mot-de-passe?token={token}"
        try:
            send_mail(
                subject='Réinitialisation de votre mot de passe — Douce Boutique',
                message=(
                    f"Bonjour {utilisateur.prenom},\n\n"
                    "Cliquez sur ce lien pour réinitialiser votre mot de passe (valide 24h) :\n"
                    f"{lien}\n\n"
                    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email."
                ),
                from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                recipient_list=[email],
                fail_silently=False,
            )
        except Exception:
            logger.exception('Erreur envoi email de réinitialisation à %s', email)

        return Response(self.MESSAGE_GENERIQUE, status=status.HTTP_200_OK)

class ReinitialisationMotDePasseView(APIView):
    """Vue pour réinitialiser le mot de passe"""
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = ReinitialisationMotDePasseSerializer(data=request.data)
        if serializer.is_valid():
            token = serializer.validated_data['token']
            nouveau_mot_de_passe = serializer.validated_data['nouveau_mot_de_passe']
            
            try:
                utilisateur = Utilisateur.objects.get(token_reset_password=token)
                
                if not utilisateur.is_reset_token_valid(token):
                    return Response(
                        {'erreur': 'Le token a expiré'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Mettre à jour le mot de passe
                utilisateur.mot_de_passe = make_password(nouveau_mot_de_passe)
                utilisateur.token_reset_password = None
                utilisateur.token_reset_expires = None
                utilisateur.save()
                
                return Response({
                    'message': 'Mot de passe réinitialisé avec succès'
                }, status=status.HTTP_200_OK)
            
            except Utilisateur.DoesNotExist:
                return Response(
                    {'erreur': 'Token invalide'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MTNInitiatePayment(APIView):
    """Initie un paiement MTN pour une commande existante."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        numero = request.data.get('numero')
        phone = request.data.get('phone')

        # Récupérer l'utilisateur depuis le token JWT
        utilisateur = None
        try:
            if hasattr(request.auth, 'get'):
                user_id = request.auth.get('user_id')
            else:
                user_id = getattr(request.auth, 'user_id', None)

            if user_id:
                utilisateur = Utilisateur.objects.get(id=user_id)
        except Exception:
            pass

        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        if not numero or not phone:
            return Response({'erreur': 'Paramètres manquants (numero, phone)'}, status=status.HTTP_400_BAD_REQUEST)

        commande = get_object_or_404(Commande, numero=numero, utilisateur=utilisateur)

        if commande.statut != 'en_attente':
            return Response({'erreur': 'La commande n est pas en attente'}, status=status.HTTP_400_BAD_REQUEST)

        # Initiate MTN request-to-pay
        amount = float(commande.prix_total)
        callback_url = getattr(settings, 'MTN_CALLBACK_URL', '')
        result = mtn_helper.initiate_request_to_pay(amount=amount, currency='XOF', msisdn=phone, external_id=commande.numero, callback_url=callback_url)

        if not result:
            return Response({'erreur': 'Impossible d initier le paiement MTN'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # Store reference in notes for trace
        commande.notes = (commande.notes or '') + f"\nMTN_REF:{result.get('reference_id')}"
        commande.save()

        return Response({'reference_id': result.get('reference_id'), 'status': 'pending'})


@method_decorator(csrf_exempt, name='dispatch')
class MTNWebhookView(APIView):
    """Webhook pour recevoir les callbacks MTN."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        try:
            data = request.data
        except Exception:
            return Response({}, status=status.HTTP_400_BAD_REQUEST)

        # MTN payloads varient; chercher externalId ou reference
        external_id = None
        status_str = None
        # Tentatives de détection
        if isinstance(data, dict):
            external_id = data.get('externalId') or data.get('external_id') or data.get('resource', {}).get('externalId')
            # status peut être dans data['status'] ou data['resource']['status']
            status_str = data.get('status') or (data.get('resource') or {}).get('status')

        if not external_id:
            # Rien à faire
            return Response({'ok': False, 'detail': 'externalId manquant'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            commande = Commande.objects.get(numero=external_id)
        except Commande.DoesNotExist:
            return Response({'ok': False, 'detail': 'Commande introuvable'}, status=status.HTTP_404_NOT_FOUND)

        # Interpréter le statut
        if status_str and isinstance(status_str, str) and status_str.lower() in ('successful', 'success', 'completed'):
            commande.statut = 'confirmee'
            commande.save()
            return Response({'ok': True})

        # D'autres statuts possibles: failed, cancelled
        if status_str and status_str.lower() in ('failed', 'cancelled', 'rejected'):
            commande.statut = 'annulee'
            commande.save()
            return Response({'ok': True})

        # Sinon on répond 202 pour indiquer la réception
        return Response({'ok': True})


class CinetPayInitiateView(APIView):
    """Initie un paiement CinetPay (carte bancaire + Mobile Money) pour une commande existante."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        numero = request.data.get('numero')
        if not numero:
            return Response({'erreur': 'Paramètre manquant (numero)'}, status=status.HTTP_400_BAD_REQUEST)

        utilisateur = None
        try:
            user_id = request.auth.get('user_id') if hasattr(request.auth, 'get') else getattr(request.auth, 'user_id', None)
            if user_id:
                utilisateur = Utilisateur.objects.get(id=user_id)
        except Exception:
            pass

        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        commande = get_object_or_404(Commande, numero=numero, utilisateur=utilisateur)
        if commande.statut != 'en_attente':
            return Response({'erreur': 'La commande n est pas en attente'}, status=status.HTTP_400_BAD_REQUEST)

        transaction_id = f"{commande.numero}-{uuid.uuid4().hex[:8]}"
        amount = float(commande.prix_total)

        result = cinetpay_helper.init_payment(
            transaction_id=transaction_id,
            commande_numero=commande.numero,
            amount=amount,
            description=f"Commande {commande.numero}",
            customer_name=utilisateur.nom_complet,
        )

        if not result:
            return Response({'erreur': 'Impossible d initier le paiement CinetPay'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        Paiement.objects.create(
            commande=commande,
            mode='cinetpay',
            statut='en_attente',
            transaction_id=transaction_id,
            montant=amount,
        )

        return Response({'payment_url': result['payment_url'], 'transaction_id': transaction_id})


@method_decorator(csrf_exempt, name='dispatch')
class CinetPayNotifyView(APIView):
    """Webhook serveur-à-serveur CinetPay : vérifie le statut réel avant de mettre à jour la commande."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        transaction_id = request.data.get('cpm_trans_id') or request.data.get('transaction_id')
        if not transaction_id:
            return Response({'ok': False, 'detail': 'transaction_id manquant'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            paiement = Paiement.objects.get(transaction_id=transaction_id)
        except Paiement.DoesNotExist:
            return Response({'ok': False, 'detail': 'Paiement introuvable'}, status=status.HTTP_404_NOT_FOUND)

        result = cinetpay_helper.check_status(transaction_id)
        if not result:
            return Response({'ok': False}, status=status.HTTP_502_BAD_GATEWAY)

        paiement.statut = result['statut']
        paiement.canal = result.get('canal', '')
        paiement.donnees_brutes = result.get('brut', {})
        paiement.save()

        if result['statut'] == 'reussi':
            paiement.commande.statut = 'confirmee'
            paiement.commande.save()
        elif result['statut'] == 'echoue':
            paiement.commande.statut = 'annulee'
            paiement.commande.save()

        return Response({'ok': True})


class CinetPayStatusView(APIView):
    """Statut d'un paiement CinetPay, pour la page de confirmation frontend."""
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        transaction_id = request.query_params.get('transaction_id')
        if not transaction_id:
            return Response({'erreur': 'Paramètre manquant (transaction_id)'}, status=status.HTTP_400_BAD_REQUEST)

        paiement = get_object_or_404(Paiement, transaction_id=transaction_id)

        if paiement.statut == 'en_attente':
            result = cinetpay_helper.check_status(transaction_id)
            if result:
                paiement.statut = result['statut']
                paiement.canal = result.get('canal', '')
                paiement.donnees_brutes = result.get('brut', {})
                paiement.save()
                if result['statut'] == 'reussi':
                    paiement.commande.statut = 'confirmee'
                    paiement.commande.save()
                elif result['statut'] == 'echoue':
                    paiement.commande.statut = 'annulee'
                    paiement.commande.save()

        return Response(PaiementSerializer(paiement).data)


class FavorisViewSet(viewsets.ViewSet):
    """ViewSet pour les favoris"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        return get_utilisateur_from_token(request)
    
    def get_produit(self, produit_id: str):
        """Récupère un produit par UUID ou slug"""
        try:
            # Essayer d'abord comme UUID
            return Produit.objects.get(id=produit_id)
        except Produit.DoesNotExist:
            pass
        except ValueError:
            # Pas un UUID valide
            pass
        
        # Fallback: produit_id est peut-être un slug (pour la compatibilité frontend)
        # Créer un produit de démonstration si le produit_id match un slug connu
        known_slugs = {
            'robe-fleurie-1': 'Robe Florale Élégante',
            'blouse-soie-1': 'Blouse en Soie Satinée',
            'pantalon-tailleur-1': 'Pantalon Tailleur Chic',
            'sac-cuir-1': 'Sac à Main Cuir Premium',
            'escarpins-1': 'Escarpins Élégants',
            'collier-or-1': 'Collier en Or',
            'robe-cocktail-1': 'Robe Cocktail Chic',
            'sandales-dorees-1': 'Sandales Dorées',
        }
        
        if produit_id in known_slugs:
            # Créer/récupérer un produit dummy avec ce slug
            # Utiliser un UUID stable basé sur le slug pour la démo
            dummy_id = str(__import__('uuid').uuid5(__import__('uuid').NAMESPACE_DNS, produit_id))
            try:
                return Produit.objects.get(id=dummy_id)
            except Produit.DoesNotExist:
                # Créer un produit temporaire pour cette démo
                try:
                    categorie, _ = Categorie.objects.get_or_create(
                        slug='autres',
                        defaults={'nom': 'Autres'}
                    )
                    produit = Produit.objects.create(
                        id=dummy_id,
                        nom=known_slugs[produit_id],
                        description=f'Produit: {known_slugs[produit_id]}',
                        prix=50000,
                        categorie=categorie,
                        stock=10
                    )
                    return produit
                except Exception as e:
                    logger.error(f'Erreur création produit dummy: {e}')
                    return None
        
        return None
    
    @action(detail=False, methods=['get'])
    def myfavoris(self, request):
        """Récupère les favoris de l'utilisateur connecté"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        favoris = Favoris.objects.filter(utilisateur=utilisateur)
        serializer = FavorisSerializer(favoris, many=True, context={'request': request})
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add(self, request):
        """Ajoute un produit aux favoris"""
        logger.debug(f'Favoris.add called with data={request.data} user={getattr(request, "user", None)} auth={getattr(request, "auth", None)}')
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        produit_id = request.data.get('produit_id')
        try:
            produit = self.get_produit(produit_id)
            if not produit:
                return Response({'erreur': 'Produit non trouvé'}, status=status.HTTP_404_NOT_FOUND)

            favoris, created = Favoris.objects.get_or_create(
                utilisateur=utilisateur,
                produit=produit
            )

            if created:
                serializer = FavorisSerializer(favoris, context={'request': request})
                return Response({
                    'message': 'Produit ajouté aux favoris',
                    'favoris': serializer.data
                }, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'message': 'Produit déjà dans les favoris'
                }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.exception(f'Erreur lors de l\'ajout aux favoris pour produit_id={produit_id}: {e}')
            return Response({'erreur': 'Erreur serveur lors de l\'ajout aux favoris'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['delete'])
    def remove(self, request):
        """Retire un produit des favoris"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        produit_id = request.data.get('produit_id')
        
        produit = self.get_produit(produit_id)
        if not produit:
            return Response({'erreur': 'Produit non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        try:
            favoris = Favoris.objects.get(
                utilisateur=utilisateur,
                produit=produit
            )
            favoris.delete()
            return Response({
                'message': 'Produit retiré des favoris'
            }, status=status.HTTP_200_OK)
        except Favoris.DoesNotExist:
            return Response({'erreur': 'Produit non trouvé dans les favoris'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['get'])
    def check(self, request):
        """Vérifie si un produit est dans les favoris"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        produit_id = request.query_params.get('produit_id')
        
        produit = self.get_produit(produit_id)
        if not produit:
            return Response({'is_favoris': False}, status=status.HTTP_200_OK)
        
        is_favoris = Favoris.objects.filter(
            utilisateur=utilisateur,
            produit=produit
        ).exists()

        return Response({'is_favoris': is_favoris}, status=status.HTTP_200_OK)


class NotificationViewSet(viewsets.ViewSet):
    """ViewSet pour les notifications in-app (clients et admin)."""
    permission_classes = [permissions.IsAuthenticated]

    def get_utilisateur_from_token(self, request):
        return get_utilisateur_from_token(request)

    @action(detail=False, methods=['get'])
    def mes_notifications(self, request):
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        notifications = Notification.objects.filter(utilisateur=utilisateur)[:50]
        return Response(NotificationSerializer(notifications, many=True).data)

    @action(detail=False, methods=['get'])
    def non_lues_count(self, request):
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        count = Notification.objects.filter(utilisateur=utilisateur, lu=False).count()
        return Response({'count': count})

    @action(detail=True, methods=['patch'])
    def marquer_lu(self, request, pk=None):
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        notification = get_object_or_404(Notification, id=pk, utilisateur=utilisateur)
        notification.lu = True
        notification.save()
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'])
    def marquer_tout_lu(self, request):
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        Notification.objects.filter(utilisateur=utilisateur, lu=False).update(lu=True)
        return Response({'ok': True})


class InscrireNewsletterView(APIView):
    """Inscription publique à la newsletter."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = InscriptionNewsletterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        email = serializer.validated_data['email']
        abonne, created = AbonneNewsletter.objects.get_or_create(
            email=email, defaults={'actif': True}
        )
        if not created and not abonne.actif:
            abonne.actif = True
            abonne.save()

        return Response({'message': 'Inscription à la newsletter réussie'}, status=status.HTTP_201_CREATED)


class NewsletterAdminView(APIView):
    """Liste (et recherche) des abonnés à la newsletter (admin seulement)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        abonnes = AbonneNewsletter.objects.filter(actif=True)
        recherche = request.query_params.get('q', '').strip()
        if recherche:
            abonnes = abonnes.filter(email__icontains=recherche)
        return Response(AbonneNewsletterSerializer(abonnes, many=True).data)


class ExportNewsletterView(APIView):
    """Exporte la liste des abonnés actifs en CSV (admin seulement)."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        require_admin(request)
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="abonnes_newsletter.csv"'
        writer = csv.writer(response)
        writer.writerow(['Email', "Date d'inscription"])
        for abonne in AbonneNewsletter.objects.filter(actif=True):
            writer.writerow([abonne.email, abonne.date_inscription.strftime('%Y-%m-%d %H:%M')])
        return response


@method_decorator(csrf_exempt, name='dispatch')
class EnvoyerCampagneNewsletterView(APIView):
    """Envoie une campagne email personnalisée à tous les abonnés actifs (admin seulement)."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        require_admin(request)

        serializer = CampagneNewsletterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        sujet = serializer.validated_data['sujet']
        message = serializer.validated_data['message']
        abonnes = list(AbonneNewsletter.objects.filter(actif=True))
        frontend_url = getattr(settings, 'FRONTEND_URL', '')

        envoyes = 0
        for abonne in abonnes:
            lien_desinscription = f"{frontend_url}/newsletter/desinscription?token={abonne.token_desinscription}"
            corps = f"{message}\n\n---\nPour ne plus recevoir nos emails : {lien_desinscription}"
            try:
                send_mail(
                    subject=sujet,
                    message=corps,
                    from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', None),
                    recipient_list=[abonne.email],
                    fail_silently=False,
                )
                envoyes += 1
            except Exception:
                logger.exception('Erreur envoi newsletter à %s', abonne.email)

        return Response({'message': f'Campagne envoyée à {envoyes} abonné(s)', 'total': len(abonnes)})


class DesinscrireNewsletterView(APIView):
    """Désinscription publique via lien sécurisé (token à usage unique)."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        token = request.data.get('token', '')
        abonne = get_object_or_404(AbonneNewsletter, token_desinscription=token)
        abonne.actif = False
        abonne.save()
        return Response({'message': 'Désinscription réussie'})
