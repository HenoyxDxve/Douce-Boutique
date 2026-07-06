import logging
from typing import Optional

import requests
from django.conf import settings

logger = logging.getLogger(__name__)

CHECKOUT_URL = 'https://api-checkout.cinetpay.com/v2/payment'
CHECK_URL = 'https://api-checkout.cinetpay.com/v2/payment/check'


def is_configured() -> bool:
    return bool(getattr(settings, 'CINETPAY_API_KEY', '') and getattr(settings, 'CINETPAY_SITE_ID', ''))


def init_payment(transaction_id: str, commande_numero: str, amount: float, description: str, customer_name: str = '') -> Optional[dict]:
    """Initie un paiement CinetPay (carte bancaire + Mobile Money : Orange, MTN, Wave, Moov).

    Retourne {'payment_url': ..., 'transaction_id': ...} si succès, sinon None.
    En mode simulation (clés non configurées), renvoie directement une URL de confirmation
    locale pour permettre de tester le flux de bout en bout sans compte marchand réel.
    """
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:5173')
    return_url = f"{frontend_url}/confirmation?numero={commande_numero}&transaction_id={transaction_id}"

    if not is_configured():
        logger.info('CinetPay non configuré — mode simulation activé')
        return {
            'payment_url': f"{return_url}&simulation=1",
            'transaction_id': transaction_id,
        }

    payload = {
        'apikey': settings.CINETPAY_API_KEY,
        'site_id': settings.CINETPAY_SITE_ID,
        'transaction_id': transaction_id,
        'amount': int(amount),
        'currency': 'XOF',
        'description': description[:255],
        'notify_url': getattr(settings, 'CINETPAY_NOTIFY_URL', ''),
        'return_url': return_url,
        'channels': 'ALL',
        'customer_name': customer_name or 'Client',
    }

    try:
        resp = requests.post(CHECKOUT_URL, json=payload, timeout=15)
        data = resp.json()
        if data.get('code') == '201' and data.get('data', {}).get('payment_url'):
            return {
                'payment_url': data['data']['payment_url'],
                'transaction_id': transaction_id,
            }
        logger.error('CinetPay init_payment échec: %s', data)
        return None
    except Exception:
        logger.exception('Erreur lors de l appel CinetPay init_payment')
        return None


def check_status(transaction_id: str) -> Optional[dict]:
    """Vérifie le statut réel d'une transaction auprès de CinetPay.

    Retourne {'statut': 'reussi'|'echoue'|'en_attente', 'canal': ..., 'brut': {...}}.
    En mode simulation, considère toujours le paiement comme réussi.
    """
    if not is_configured():
        return {'statut': 'reussi', 'canal': 'SIMULATION', 'brut': {'simulation': True}}

    payload = {
        'apikey': settings.CINETPAY_API_KEY,
        'site_id': settings.CINETPAY_SITE_ID,
        'transaction_id': transaction_id,
    }

    try:
        resp = requests.post(CHECK_URL, json=payload, timeout=15)
        data = resp.json()
        cinetpay_status = (data.get('data') or {}).get('status')
        canal = (data.get('data') or {}).get('payment_method', '')

        if cinetpay_status == 'ACCEPTED':
            statut = 'reussi'
        elif cinetpay_status in ('REFUSED', 'CANCELLED'):
            statut = 'echoue'
        else:
            statut = 'en_attente'

        return {'statut': statut, 'canal': canal, 'brut': data}
    except Exception:
        logger.exception('Erreur lors de l appel CinetPay check_status')
        return None
