"""
Django settings for ecommerce project.
"""

from pathlib import Path
from datetime import timedelta
import os
from decouple import config

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = config('SECRET_KEY', default='django-insecure-changeme-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = config('DEBUG', default=True, cast=bool)

ALLOWED_HOSTS = config('ALLOWED_HOSTS', default='localhost,127.0.0.1,*', cast=lambda v: [s.strip() for s in v.split(',')])


# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'rest_framework',
    'corsheaders',
    'store',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'ecommerce.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'ecommerce.wsgi.application'


# Database

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# Pour utiliser PostgreSQL en production:
# DATABASES = {
#     'default': {
#         'ENGINE': 'django.db.backends.postgresql',
#         'NAME': config('DB_NAME', default='ecommerce'),
#         'USER': config('DB_USER', default='postgres'),
#         'PASSWORD': config('DB_PASSWORD', default='password'),
#         'HOST': config('DB_HOST', default='localhost'),
#         'PORT': config('DB_PORT', default='5432'),
#     }
# }


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]


# Internationalization

LANGUAGE_CODE = 'fr-fr'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)

STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_DIRS = [BASE_DIR / 'static']

MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'media'


# Default primary key field type

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'


# REST Framework Configuration

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'store.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    # Limite les tentatives sur les endpoints sensibles (connexion, inscription,
    # mot de passe oublié) pour freiner le brute-force ; voir throttle_scope='auth'.
    'DEFAULT_THROTTLE_RATES': {
        'auth': '10/minute',
    },
}

# JWT Configuration

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}

# CORS Configuration - Permissif pour développement
# En dev, Vite peut démarrer sur n'importe quel port si les défauts sont occupés
# (5173, 8080, 8081...) : on autorise donc tout port localhost/127.0.0.1 via regex
# plutôt que de maintenir une liste figée.

CORS_ALLOWED_ORIGIN_REGEXES = [
    r'^http://localhost:\d+$',
    r'^http://127\.0\.0\.1:\d+$',
] if DEBUG else []

CORS_ALLOWED_ORIGINS = [] if DEBUG else [
    # Renseigner ici les domaines de production réels.
]

CORS_ALLOW_CREDENTIALS = True

# Options CORS supplémentaires pour les preflight requests
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

CORS_ALLOW_HEADERS = [
    'accept',
    'accept-encoding',
    'authorization',
    'content-type',
    'dnt',
    'origin',
    'user-agent',
    'x-csrftoken',
    'x-requested-with',
]

# Logging Configuration

LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
}

# MTN Mobile Money configuration (utilisez les variables d'environnement en production)
MTN_CONSUMER_KEY = config('MTN_CONSUMER_KEY', default='tepwzCCkDc3RjEq9D5A0A2HWkw4fNK0P')
MTN_CONSUMER_SECRET = config('MTN_CONSUMER_SECRET', default='')
MTN_SUBSCRIPTION_KEY = config('MTN_SUBSCRIPTION_KEY', default='')
# Base API URL (ex: sandbox: https://sandbox.momodeveloper.mtn.com)
MTN_API_BASE = config('MTN_API_BASE', default='')
# Token URL (parfois distinct selon l'implémentation)
MTN_TOKEN_URL = config('MTN_TOKEN_URL', default='')
MTN_ENV = config('MTN_ENV', default='sandbox')
MTN_CALLBACK_URL = config('MTN_CALLBACK_URL', default='http://localhost:8000/api/paiements/mtn/webhook/')

# CinetPay configuration (carte bancaire + Mobile Money : Orange, MTN, Wave, Moov)
# Tant que CINETPAY_API_KEY/CINETPAY_SITE_ID sont vides, le module fonctionne en mode simulation.
CINETPAY_API_KEY = config('CINETPAY_API_KEY', default='')
CINETPAY_SITE_ID = config('CINETPAY_SITE_ID', default='')
CINETPAY_NOTIFY_URL = config('CINETPAY_NOTIFY_URL', default='http://localhost:8000/api/paiements/cinetpay/notify/')
FRONTEND_URL = config('FRONTEND_URL', default='http://localhost:5173')

# Firebase Cloud Messaging (notifications push, gratuit).
# Tant que FIREBASE_CREDENTIALS_PATH est vide, l'envoi push est simulé (les
# notifications in-app restent actives dans tous les cas).
FIREBASE_CREDENTIALS_PATH = config('FIREBASE_CREDENTIALS_PATH', default='')

# Email (newsletter). Par défaut : mode simulation, les emails sont affichés
# dans la console du serveur au lieu d'être réellement envoyés. Configurer un
# compte SMTP réel (ex: Gmail + mot de passe d'application) en production.
EMAIL_BACKEND = config(
    'EMAIL_BACKEND',
    default='django.core.mail.backends.console.EmailBackend',
)
EMAIL_HOST = config('EMAIL_HOST', default='smtp.gmail.com')
EMAIL_PORT = config('EMAIL_PORT', default=587, cast=int)
EMAIL_USE_TLS = config('EMAIL_USE_TLS', default=True, cast=bool)
EMAIL_HOST_USER = config('EMAIL_HOST_USER', default='')
EMAIL_HOST_PASSWORD = config('EMAIL_HOST_PASSWORD', default='')
DEFAULT_FROM_EMAIL = config('DEFAULT_FROM_EMAIL', default='BelleBoutique <noreply@belleboutique.ci>')

# Brevo (ex-Sendinblue) — email + SMS transactionnels, pensé pour la production.
# BREVO_SMTP_LOGIN/BREVO_SMTP_KEY renseignés → tous les emails (mot de passe
# oublié, campagnes newsletter) passent automatiquement par le relais SMTP
# Brevo, sans autre configuration. BREVO_API_KEY renseignée → les SMS (commande
# reçue, changement de statut) sont réellement envoyés ; sinon ils sont simulés
# (journalisés côté serveur) comme les autres intégrations du projet.
BREVO_API_KEY = config('BREVO_API_KEY', default='')
BREVO_SMTP_LOGIN = config('BREVO_SMTP_LOGIN', default='')
BREVO_SMTP_KEY = config('BREVO_SMTP_KEY', default='')
BREVO_SMS_SENDER = config('BREVO_SMS_SENDER', default='DouceBoutik')

if BREVO_SMTP_LOGIN and BREVO_SMTP_KEY:
    EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
    EMAIL_HOST = 'smtp-relay.brevo.com'
    EMAIL_PORT = 587
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = BREVO_SMTP_LOGIN
    EMAIL_HOST_PASSWORD = BREVO_SMTP_KEY

# Connexion Google (Sign-In). Tant que GOOGLE_CLIENT_ID est vide, le bouton
# Google reste inactif côté frontend et l'endpoint renvoie une erreur claire.
GOOGLE_CLIENT_ID = config('GOOGLE_CLIENT_ID', default='')

