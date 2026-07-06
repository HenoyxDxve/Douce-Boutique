from rest_framework_simplejwt.authentication import JWTAuthentication as BaseJWTAuthentication


class _AuthenticatedTokenUser:
    """Utilisateur "authentifié" minimal.

    L'application utilise un modèle Utilisateur métier (store.models.Utilisateur),
    pas AUTH_USER_MODEL. Les vues résolvent le véritable utilisateur via
    request.auth (voir get_utilisateur_from_token dans views.py) ; ce stub évite
    que get_user() interroge django.contrib.auth.User avec un id UUID.
    """
    is_authenticated = True
    is_anonymous = False


class JWTAuthentication(BaseJWTAuthentication):
    def get_user(self, validated_token):
        return _AuthenticatedTokenUser()
