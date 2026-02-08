import base64
import uuid
import time
import logging
from typing import Optional
import requests
from django.conf import settings

logger = logging.getLogger(__name__)


def get_mtn_token() -> Optional[str]:
    """Obtenir un token d'accès auprès de l'API MTN (OAuth)."""
    consumer_key = getattr(settings, 'MTN_CONSUMER_KEY', None)
    consumer_secret = getattr(settings, 'MTN_CONSUMER_SECRET', None)
    token_url = getattr(settings, 'MTN_TOKEN_URL', None)

    if not consumer_key or not consumer_secret or not token_url:
        logger.error('MTN credentials ou token_url non configurés')
        return None

    try:
        # Basic auth header
        auth_str = f"{consumer_key}:{consumer_secret}"
        b64 = base64.b64encode(auth_str.encode()).decode()
        headers = {
            'Authorization': f'Basic {b64}',
            'Content-Type': 'application/json'
        }

        resp = requests.post(token_url, headers=headers, timeout=10)
        resp.raise_for_status()
        data = resp.json()
        return data.get('access_token')
    except Exception as e:
        logger.exception('Erreur get_mtn_token')
        return None


def initiate_request_to_pay(amount: float, currency: str, msisdn: str, external_id: str, callback_url: str) -> Optional[dict]:
    """Initie une requête de paiement (Request To Pay) vers MTN.

    Retourne le payload renvoyé par MTN si succès, sinon None.
    """
    api_base = getattr(settings, 'MTN_API_BASE', None)
    target_env = getattr(settings, 'MTN_ENV', 'sandbox')
    subscription_key = getattr(settings, 'MTN_SUBSCRIPTION_KEY', None)

    # If no API configured, operate in simulation mode for local testing
    if not api_base:
        logger.info('MTN_API_BASE non configuré — mode simulation activé')
        # Return a fake reference id to simulate a pending payment
        return {'reference_id': str(uuid.uuid4()), 'status_code': 202}

    token = get_mtn_token()
    if not token:
        logger.error('Impossible d obtenir le token MTN')
        return None

    url = f"{api_base.rstrip('/')}/collection/v1_0/requesttopay"
    reference_id = str(uuid.uuid4())
    headers = {
        'Authorization': f'Bearer {token}',
        'X-Reference-Id': reference_id,
        'X-Target-Environment': target_env,
        'Content-Type': 'application/json'
    }
    if subscription_key:
        headers['Ocp-Apim-Subscription-Key'] = subscription_key

    payload = {
        'amount': f"{int(amount)}",  # amount as integer string
        'currency': currency,
        'externalId': external_id,
        'payer': {
            'partyIdType': 'MSISDN',
            'partyId': msisdn
        },
        'payerMessage': f'Paiement commande {external_id}',
        'payeeNote': f'Paiement pour {external_id}',
        'callbackUrl': callback_url
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=15)
        # MTN may return 202 Accepted for async processing
        if resp.status_code in (200, 201, 202):
            return {'reference_id': reference_id, 'status_code': resp.status_code}
        else:
            logger.error('MTN requesttopay failed: %s %s', resp.status_code, resp.text)
            return None
    except Exception:
        logger.exception('Erreur lors de l appel MTN requesttopay')
        return None
