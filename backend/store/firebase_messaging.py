import logging
from django.conf import settings

logger = logging.getLogger(__name__)

try:
    import firebase_admin
    from firebase_admin import credentials, messaging
except ImportError:
    firebase_admin = None
    messaging = None

_app = None


def _get_app():
    """Initialise l'app Firebase une seule fois, si un compte de service est configuré."""
    global _app
    if _app is not None:
        return _app
    if firebase_admin is None:
        return None

    chemin = getattr(settings, 'FIREBASE_CREDENTIALS_PATH', '')
    if not chemin:
        return None

    try:
        cred = credentials.Certificate(chemin)
        _app = firebase_admin.initialize_app(cred)
        return _app
    except Exception:
        logger.exception('Impossible d initialiser Firebase')
        return None


def is_configured() -> bool:
    return _get_app() is not None


def send_push(fcm_token: str, titre: str, corps: str) -> bool:
    """Envoie une notification push via Firebase Cloud Messaging.

    Mode simulation (aucune clé Firebase configurée) : la notification est
    simplement journalisée — le système de notifications in-app reste actif
    dans tous les cas, ce canal est un bonus lorsque configuré.
    """
    if not fcm_token:
        return False

    app = _get_app()
    if not app:
        logger.info('Firebase non configuré — simulation d envoi push: %s / %s', titre, corps)
        return True

    try:
        message = messaging.Message(
            notification=messaging.Notification(title=titre, body=corps),
            token=fcm_token,
        )
        messaging.send(message, app=app)
        return True
    except Exception:
        logger.exception('Erreur lors de l envoi de la notification push')
        return False
