from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.tokens import UntypedToken
from django.contrib.auth.hashers import check_password, make_password
from django.shortcuts import get_object_or_404
from django.db.models import Q
import logging
from django.contrib.auth import get_user_model, login
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

from .models import Categorie, Produit, Utilisateur, Panier, Article, Commande, LigneCommande, Favoris
from .serializers import (
    CategorieSerializer, ProduitSerializer, UtilisateurSerializer,
    UtilisateurDetailSerializer, InscriptionSerializer, ConnexionSerializer,
    ArticleSerializer, PanierSerializer, CommandeSerializer,
    CommandeCreationSerializer, FavorisSerializer, MotDePasseOublieSerializer,
    ReinitialisationMotDePasseSerializer
)
from django.conf import settings
from . import mtn as mtn_helper
import uuid

logger = logging.getLogger(__name__)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Allow read-only access to anyone, but write access only to admin users."""
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        # If view provides get_utilisateur_from_token, use it
        try:
            if hasattr(view, 'get_utilisateur_from_token'):
                utilisateur = view.get_utilisateur_from_token(request)
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

class CategorieViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet pour les catégories"""
    queryset = Categorie.objects.all()
    serializer_class = CategorieSerializer
    permission_classes = [permissions.AllowAny]

class ProduitViewSet(viewsets.ModelViewSet):
    """ViewSet pour les produits (lecture publique, écriture réservée aux admins)"""
    queryset = Produit.objects.all()
    serializer_class = ProduitSerializer
    permission_classes = [IsAdminOrReadOnly]

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

class InscriptionView(APIView):
    """Vue pour l'inscription"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = InscriptionSerializer(data=request.data)
        if serializer.is_valid():
            utilisateur = serializer.save()
            
            # Générer les tokens JWT
            refresh = RefreshToken()
            refresh['user_id'] = str(utilisateur.id)
            refresh['email'] = utilisateur.email
            
            return Response({
                'message': 'Inscription réussie',
                'utilisateur': UtilisateurDetailSerializer(utilisateur).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ConnexionView(APIView):
    """Vue pour la connexion"""
    permission_classes = [permissions.AllowAny]
    
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
                    
                    # Générer les tokens JWT
                    refresh = RefreshToken()
                    refresh['user_id'] = str(utilisateur.id)
                    refresh['email'] = utilisateur.email
                    refresh['est_admin'] = utilisateur.est_admin
                    
                    return Response({
                        'message': 'Connexion réussie',
                        'utilisateur': UtilisateurDetailSerializer(utilisateur).data,
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
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

class UtilisateurViewSet(viewsets.ViewSet):
    """ViewSet pour les utilisateurs"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        """Récupère l'utilisateur depuis le token JWT"""
        try:
            # Prefer request.user when authentication middleware set it
            if hasattr(request, 'user') and getattr(request.user, 'is_authenticated', False):
                try:
                    return Utilisateur.objects.get(email=getattr(request.user, 'email', None))
                except Utilisateur.DoesNotExist:
                    # continue to token-based lookup
                    pass
            # Django REST Framework avec JWT fournit user_id dans request.auth
            if hasattr(request.auth, 'get'):
                user_id = request.auth.get('user_id')
            else:
                # Fallback: chercher dans request.auth comme objet Token
                user_id = getattr(request.auth, 'user_id', None)
            
            if user_id:
                return Utilisateur.objects.get(id=user_id)
        except (AttributeError, Utilisateur.DoesNotExist):
            pass
        return None
    
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
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur or not getattr(utilisateur, 'est_admin', False):
            return Response({'erreur': 'Accès admin requis'}, status=status.HTTP_403_FORBIDDEN)
        utilisateurs = Utilisateur.objects.all().order_by('-date_inscription')
        serializer = UtilisateurDetailSerializer(utilisateurs, many=True)
        return Response(serializer.data)

class PanierViewSet(viewsets.ViewSet):
    """ViewSet pour les paniers"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        """Récupère l'utilisateur depuis le token JWT"""
        try:
            # Django REST Framework avec JWT fournit user_id dans request.auth
            if hasattr(request.auth, 'get'):
                user_id = request.auth.get('user_id')
            else:
                # Fallback: chercher dans request.auth comme objet Token
                user_id = getattr(request.auth, 'user_id', None)
            
            if user_id:
                return Utilisateur.objects.get(id=user_id)
        except (AttributeError, Utilisateur.DoesNotExist):
            pass
        return None
    
    @action(detail=False, methods=['get'])
    def current(self, request):
        """Récupère le panier de l'utilisateur connecté"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier, _ = Panier.objects.get_or_create(utilisateur=utilisateur)
        serializer = PanierSerializer(panier)
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
        
        serializer = PanierSerializer(panier)
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
        
        serializer = PanierSerializer(panier)
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
        
        serializer = PanierSerializer(panier)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['post'])
    def clear(self, request):
        """Vide le panier"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        panier = get_object_or_404(Panier, utilisateur=utilisateur)
        panier.articles.all().delete()
        
        serializer = PanierSerializer(panier)
        return Response(serializer.data, status=status.HTTP_200_OK)

class CommandeViewSet(viewsets.ViewSet):
    """ViewSet pour les commandes"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        """Récupère l'utilisateur depuis le token JWT"""
        try:
            # Django REST Framework avec JWT fournit user_id dans request.auth
            if hasattr(request.auth, 'get'):
                user_id = request.auth.get('user_id')
            else:
                # Fallback: chercher dans request.auth comme objet Token
                user_id = getattr(request.auth, 'user_id', None)
            
            if user_id:
                return Utilisateur.objects.get(id=user_id)
        except (AttributeError, Utilisateur.DoesNotExist):
            pass
        return None
    
    @action(detail=False, methods=['get'])
    def list_user_commandes(self, request):
        """Liste les commandes de l'utilisateur"""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)
        
        commandes = Commande.objects.filter(utilisateur=utilisateur).order_by('-date_commande')
        serializer = CommandeSerializer(commandes, many=True)
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
        
        response_serializer = CommandeSerializer(commande)
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
        serializer = CommandeSerializer(commande)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_from_items(self, request):
        """Crée une commande depuis les articles du panier frontend (IDs locaux ou UUID)."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur:
            return Response({'erreur': 'Utilisateur non trouvé'}, status=status.HTTP_404_NOT_FOUND)

        items = request.data.get('items', [])
        adresse_livraison = request.data.get('adresse_livraison', '').strip()
        ville_livraison = request.data.get('ville_livraison', '').strip()
        code_postal_livraison = request.data.get('code_postal_livraison', '00000').strip()
        pays_livraison = request.data.get('pays_livraison', "Côte d'Ivoire")
        notes = request.data.get('notes', '')
        mode_paiement = request.data.get('mode_paiement', 'livraison')

        if not items:
            return Response({'erreur': 'Aucun article fourni'}, status=status.HTTP_400_BAD_REQUEST)
        if not adresse_livraison or not ville_livraison:
            return Response({'erreur': 'Adresse et ville de livraison requises'}, status=status.HTTP_400_BAD_REQUEST)

        from .slug_mapping import get_product_by_slug_or_id

        # Calculer le total depuis les prix envoyés par le frontend
        total = sum(
            float(item.get('prix_unitaire', 0)) * int(item.get('quantite', 1))
            for item in items
        )

        commande = Commande.objects.create(
            utilisateur=utilisateur,
            prix_total=total,
            adresse_livraison=adresse_livraison,
            ville_livraison=ville_livraison,
            code_postal_livraison=code_postal_livraison,
            pays_livraison=pays_livraison,
            notes=f"[{mode_paiement}] {notes}".strip(),
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

        serializer = CommandeSerializer(commande)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def list_all_commandes(self, request):
        """Liste toutes les commandes (admin seulement)."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur or not getattr(utilisateur, 'est_admin', False):
            return Response({'erreur': 'Accès admin requis'}, status=status.HTTP_403_FORBIDDEN)
        commandes = Commande.objects.all().order_by('-date_commande')
        serializer = CommandeSerializer(commandes, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['patch'])
    def update_status(self, request):
        """Met à jour le statut d'une commande (admin seulement)."""
        utilisateur = self.get_utilisateur_from_token(request)
        if not utilisateur or not getattr(utilisateur, 'est_admin', False):
            return Response({'erreur': 'Accès admin requis'}, status=status.HTTP_403_FORBIDDEN)

        commande_id = request.query_params.get('id')
        new_statut = request.data.get('statut')

        statuts_valides = ['en_attente', 'confirmee', 'expedie', 'livree', 'annulee']
        if new_statut not in statuts_valides:
            return Response({'erreur': f'Statut invalide. Valeurs: {statuts_valides}'}, status=status.HTTP_400_BAD_REQUEST)

        commande = get_object_or_404(Commande, id=commande_id)
        commande.statut = new_statut
        commande.save()
        serializer = CommandeSerializer(commande)
        return Response(serializer.data)

class MotDePasseOublieView(APIView):
    """Vue pour demander une réinitialisation de mot de passe"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = MotDePasseOublieSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            utilisateur = Utilisateur.objects.get(email=email)
            
            # Générer le token
            token = utilisateur.generate_reset_token()
            
            # TODO: Envoyer l'email avec le lien de réinitialisation
            # from django.core.mail import send_mail
            # send_mail(
            #     'Réinitialiser votre mot de passe',
            #     f'Cliquez sur ce lien pour réinitialiser: http://localhost:5173/reset-password?token={token}',
            #     'noreply@douceboutique.fr',
            #     [email]
            # )
            
            return Response({
                'message': 'Un email de réinitialisation a été envoyé',
                'token': token  # En développement seulement
            }, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ReinitialisationMotDePasseView(APIView):
    """Vue pour réinitialiser le mot de passe"""
    permission_classes = [permissions.AllowAny]
    
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

class FavorisViewSet(viewsets.ViewSet):
    """ViewSet pour les favoris"""
    permission_classes = [permissions.IsAuthenticated]
    
    def get_utilisateur_from_token(self, request):
        """Récupère l'utilisateur depuis le token JWT"""
        try:
            # Django REST Framework avec JWT fournit user_id dans request.auth
            if hasattr(request.auth, 'get'):
                user_id = request.auth.get('user_id')
            else:
                # Fallback: chercher dans request.auth comme objet Token
                user_id = getattr(request.auth, 'user_id', None)
            
            if user_id:
                return Utilisateur.objects.get(id=user_id)
        except (AttributeError, Utilisateur.DoesNotExist):
            pass
        return None
    
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
        serializer = FavorisSerializer(favoris, many=True)
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
                serializer = FavorisSerializer(favoris)
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
