"""Envoi de SMS transactionnels via Brevo (ex-Sendinblue).

Tant que BREVO_API_KEY n'est pas configurée, les SMS sont simplement
journalisés (mode simulation) — jamais d'erreur bloquante pour une action
métier (commande, changement de statut) à cause d'un SMS qui échoue.

L'envoi d'email transactionnel (mot de passe oublié, newsletter) passe lui
par le relais SMTP de Brevo, configuré directement dans settings.py — aucun
code supplémentaire n'est nécessaire ici pour les emails.
"""
import logging
import requests
from django.conf import settings

logger = logging.getLogger(__name__)

BREVO_SMS_URL = 'https://api.brevo.com/v3/transactionalSMS/sms'


def normaliser_numero_ci(numero: str):
    """Convertit un numéro ivoirien local (0X XX XX XX XX, +225, 00225...)
    au format international sans symboles attendu par Brevo (225XXXXXXXXX)."""
    chiffres = ''.join(c for c in numero if c.isdigit())
    for prefixe in ('00225', '225'):
        if chiffres.startswith(prefixe):
            chiffres = chiffres[len(prefixe):]
            break
    if chiffres.startswith('0'):
        chiffres = chiffres[1:]
    if len(chiffres) != 9:
        return None
    return f'225{chiffres}'


def envoyer_sms(numero: str, message: str) -> bool:
    """Envoie un SMS transactionnel. Retourne True si envoyé (ou simulé)."""
    if not numero:
        return False

    api_key = getattr(settings, 'BREVO_API_KEY', '')
    if not api_key:
        logger.info('[SMS simulé] à %s : %s', numero, message)
        return True

    destinataire = normaliser_numero_ci(numero)
    if not destinataire:
        logger.warning('Numéro invalide pour SMS Brevo: %s', numero)
        return False

    try:
        resp = requests.post(
            BREVO_SMS_URL,
            headers={'api-key': api_key, 'Content-Type': 'application/json'},
            json={
                'sender': getattr(settings, 'BREVO_SMS_SENDER', 'DouceBoutik')[:11],
                'recipient': destinataire,
                'content': message[:160],
                'type': 'transactional',
            },
            timeout=10,
        )
        resp.raise_for_status()
        return True
    except Exception:
        logger.exception('Erreur envoi SMS Brevo à %s', numero)
        return False
