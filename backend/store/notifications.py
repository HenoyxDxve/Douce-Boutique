from .models import Notification, Utilisateur
from . import firebase_messaging


def creer_notification(utilisateur: Utilisateur, titre: str, message: str = '', type: str = 'info', lien: str = ''):
    """Crée une notification in-app et tente, en best-effort, un envoi push FCM."""
    notification = Notification.objects.create(
        utilisateur=utilisateur,
        titre=titre,
        message=message,
        type=type,
        lien=lien,
    )
    if utilisateur.fcm_token:
        firebase_messaging.send_push(utilisateur.fcm_token, titre, message)
    return notification


def notifier_admins(titre: str, message: str = '', type: str = 'info', lien: str = ''):
    """Notifie tous les administrateurs actifs."""
    for admin in Utilisateur.objects.filter(est_admin=True, est_actif=True):
        creer_notification(admin, titre, message, type, lien)
