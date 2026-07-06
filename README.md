# Douce Boutique — E-commerce Platform

Plateforme e-commerce **React + TypeScript + Vite** (frontend) et **Django + Django REST Framework** (backend), avec panier et favoris persistants (visiteurs et membres), mode sombre, dashboard admin complet (produits, promotions, catégories, commandes, utilisateurs, newsletter, rapports), notifications in-app (+ push Firebase optionnel), campagnes email newsletter, canal WhatsApp, et paiement en ligne (carte bancaire + Mobile Money local) via CinetPay.

Le visiteur peut naviguer, ajouter au panier et aux favoris sans compte ; la connexion/inscription n'est demandée qu'au moment de finaliser le paiement (le panier et les favoris sont automatiquement transférés vers le compte après connexion).

## Prérequis

- Node.js 18+ et npm
- Python 3.10+ et pip

## Installation et démarrage

### Frontend

```bash
npm install
npm run dev
# http://localhost:5173
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux/Mac
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py seed_produits   # peuple catégories + produits de démo
python manage.py runserver
# http://localhost:8000
```

## Comptes de test

- **Admin** : `admin@douceboutique.fr` / `Admin@12345` (créé via `setup_admin.py` ou Django Admin)
- **Utilisateur** : à créer via `/inscription`

## Architecture

```
src/                        Frontend React
├── components/             Composants (Header, Footer, CarteProduit, ui/...)
├── pages/                  Pages publiques (Accueil, Catalogue, Panier, Commande, Compte...)
├── pages/admin/             Dashboard admin (Produits, Promotions, Catégories, Commandes, Utilisateurs, Rapports)
├── contexts/                AuthContext, PanierContext, FavorisContext
├── hooks/                    Hooks React Query (produits, catégories)
└── lib/api.ts                Client API (JWT, requêtes JSON/multipart)

backend/                    Backend Django
├── ecommerce/                Configuration (settings, urls)
└── store/
    ├── models.py              Categorie, Produit, Utilisateur, Panier, Article, Commande, LigneCommande, Favoris, Paiement
    ├── views.py                Vues API (DRF viewsets + APIView)
    ├── serializers.py
    ├── urls.py
    ├── mtn.py                  Intégration MTN Mobile Money (legacy, mode simulation par défaut)
    ├── cinetpay.py             Intégration CinetPay (carte + Mobile Money, mode simulation par défaut)
    ├── firebase_messaging.py   Notifications push FCM (mode simulation tant que non configuré)
    ├── notifications.py        Création de notifications in-app (+ tentative push)
    └── management/commands/seed_produits.py
```

## API — endpoints principaux

### Authentification
- `POST /api/auth/inscription/`
- `POST /api/auth/connexion/`
- `POST /api/auth/mot-de-passe-oublie/`
- `POST /api/auth/reinitialiser-mot-de-passe/`
- `POST /api/auth/admin_session/` — crée une session Django Admin depuis un JWT (dev only)

### Produits & catégories
- `GET/POST /api/produits/` · `GET/PATCH/DELETE /api/produits/{id}/` (écriture réservée admin ; filtres `?categorie=`, `?nouveau=true`, `?promotion=true`, `?search=`)
- `GET/POST /api/categories/` · `GET/PATCH/DELETE /api/categories/{id}/` (écriture réservée admin)

### Compte
- `GET /api/utilisateurs/me/`
- `PUT /api/utilisateurs/update_profile/`
- `POST /api/utilisateurs/changer_mot_de_passe/` — modifier son mot de passe (connecté, ancien mot de passe requis)
- `POST /api/utilisateurs/register_fcm_token/` — enregistrer le token push Firebase de l'utilisateur
- `GET /api/utilisateurs/list_all/` (admin)
- `PATCH /api/utilisateurs/{id}/toggle_admin/` (admin)
- `PATCH /api/utilisateurs/{id}/toggle_actif/` (admin)

### Panier
- `GET /api/panier/current/`
- `POST /api/panier/add_article/` · `PUT /api/panier/update_article/` · `DELETE /api/panier/remove_article/?article_id=` · `POST /api/panier/clear/`

### Favoris
- `GET /api/favoris/myfavoris/` · `POST /api/favoris/add/` · `DELETE /api/favoris/remove/` · `GET /api/favoris/check/`

### Commandes
- `GET /api/commandes/list_user_commandes/`
- `POST /api/commandes/create_from_items/`
- `GET /api/commandes/list_all_commandes/` (admin) · `PATCH /api/commandes/update_status/?id=` (admin) · `GET /api/commandes/stats/` (admin, rapports)

### Paiements
- `POST /api/paiements/cinetpay/initiate/` — crée le paiement et renvoie l'URL de la page CinetPay (carte bancaire, Orange Money, MTN, Wave)
- `POST /api/paiements/cinetpay/notify/` — webhook serveur-à-serveur CinetPay
- `GET /api/paiements/cinetpay/status/?transaction_id=` — statut du paiement pour la page de confirmation
- `POST /api/paiements/mtn/initiate/`, `POST /api/paiements/mtn/webhook/` — intégration MTN directe (legacy)

### Notifications
- `GET /api/notifications/mes_notifications/` · `GET /api/notifications/non_lues_count/`
- `PATCH /api/notifications/{id}/marquer_lu/` · `POST /api/notifications/marquer_tout_lu/`
- Créées automatiquement : nouvelle commande (→ admins), changement de statut (→ client)

### Newsletter
- `POST /api/newsletter/inscrire/` (public) — inscription depuis le footer
- `GET /api/newsletter/abonnes/` (admin) · `POST /api/newsletter/envoyer_campagne/` (admin, `{sujet, message}`)

## Authentification JWT

```
Authorization: Bearer <access_token>
```

## Configuration paiement (CinetPay)

Dans `backend/.env` :
```
CINETPAY_API_KEY=
CINETPAY_SITE_ID=
CINETPAY_NOTIFY_URL=http://localhost:8000/api/paiements/cinetpay/notify/
FRONTEND_URL=http://localhost:5173
```
Tant que `CINETPAY_API_KEY`/`CINETPAY_SITE_ID` sont vides, l'intégration fonctionne en **mode simulation** (aucun compte marchand requis) : le paiement est automatiquement marqué comme réussi pour permettre de tester le flux de bout en bout. Renseigner les clés d'un compte CinetPay (sandbox ou production) pour un paiement réel.

## Notifications push (Firebase, optionnel)

Le système de notifications **in-app fonctionne sans aucune configuration** (cloche dans le header et le dashboard admin). Pour ajouter un canal push réel via Firebase Cloud Messaging (gratuit) :
```
FIREBASE_CREDENTIALS_PATH=/chemin/vers/service-account.json
```
Sans ce fichier, l'envoi push est simulé (journalisé côté serveur) — aucune erreur, juste pas d'envoi réel.

## Email newsletter

Par défaut, les emails de campagne s'affichent dans la console du serveur Django (aucun compte SMTP requis pour tester). Pour un envoi réel, par exemple avec Gmail (mot de passe d'application requis) :
```
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST_USER=votre-adresse@gmail.com
EMAIL_HOST_PASSWORD=mot-de-passe-application
DEFAULT_FROM_EMAIL=BelleBoutique <votre-adresse@gmail.com>
```

## Déploiement en production

1. `.env` : `DEBUG=False`, `SECRET_KEY`, `ALLOWED_HOSTS`, `CORS_ALLOWED_ORIGINS`, clés CinetPay réelles.
2. Passer à PostgreSQL dans `backend/ecommerce/settings.py`.
3. `gunicorn ecommerce.wsgi:application --bind 0.0.0.0:8000`
4. `npm run build` → sert le contenu de `dist/`.

## Dépannage

- **Le frontend ne peut pas se connecter au backend** : vérifier que Django tourne sur le port 8000 et `VITE_API_URL` côté frontend. En développement, le CORS accepte automatiquement n'importe quel port `localhost`/`127.0.0.1` (utile quand Vite change de port parce que 5173/8080/8081 sont déjà pris).
- **Migrations manquantes** : `cd backend && python manage.py migrate`.
- **Base vide** : `python manage.py seed_produits`.

## Technologies

- **Frontend** : React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, React Query, React Router, Recharts.
- **Backend** : Django, Django REST Framework, djangorestframework-simplejwt, django-cors-headers, SQLite (dev) / PostgreSQL (prod).
