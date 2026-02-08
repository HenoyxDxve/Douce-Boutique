# Douce Boutique - E-commerce Platform

Une plateforme e-commerce moderne construite avec **React + TypeScript + Vite** (frontend) et **Django + Django REST Framework** (backend).

## 🌟 Caractéristiques

### Frontend
- ✨ Interface utilisateur élégante avec Tailwind CSS
- 🛒 Gestion complète du panier
- 🔐 Système d'authentification sécurisé (JWT)
- 👤 Gestion des comptes utilisateurs
- 📦 Catalogue de produits filtrable
- 💳 Processus de commande intégré
- 📱 Design responsive et mobile-friendly
- 🎨 Composants réutilisables avec Shadcn/ui

### Backend
- 🔒 API REST sécurisée avec JWT
- 👥 Gestion complète des utilisateurs et authentification
- 📦 Gestion des produits et catégories
- 🛍️ Système de panier persistant
- 📋 Gestion des commandes avec historique
- 👨‍💼 Interface d'administration Django
- 📊 Base de données relationnelle robuste
- 🚀 Prêt pour la production avec PostgreSQL

## 📋 Prérequis

### Frontend
- Node.js 16+ ou Bun
- npm, yarn, ou bun

### Backend
- Python 3.8+
- pip ou poetry

## 🚀 Installation et Démarrage

### 1. Frontend Setup

```bash
# Installation des dépendances
npm install
# ou avec yarn
yarn install
# ou avec bun
bun install

# Démarrer le serveur de développement
npm run dev
# Le frontend sera accessible à http://localhost:5173
```

### 2. Backend Setup

```bash
# Se placer dans le dossier backend
cd backend

# Créer un environnement virtuel
python -m venv venv

# Activer l'environnement virtuel
# Sur Windows:
venv\Scripts\activate
# Sur Linux/Mac:
source venv/bin/activate

# Installer les dépendances
pip install -r requirements.txt

# Copier le fichier d'environnement
cp .env.example .env

# Appliquer les migrations
python manage.py migrate

# Créer les données de base (catégories, produits, utilisateurs admin)
python init_db.py

# Démarrer le serveur Django
python manage.py runserver
# Le backend sera accessible à http://localhost:8000
```

## 👤 Comptes de Test

### Admin (Gestion complète du système)
- **Email**: `admin@douceboutique.fr`
- **Mot de passe**: `Admin@12345`
- **Accès**: http://localhost:8000/admin

### Utilisateur Test
- **Email**: `test@example.com`
- **Mot de passe**: `Test@12345`

## 🔑 Créer un Nouvel Utilisateur Admin

### Via Django Admin
1. Allez à http://localhost:8000/admin
2. Connectez-vous avec le compte admin
3. Allez dans la section "Utilisateurs"
4. Cliquez sur "Ajouter un utilisateur"
5. Remplissez les informations et cochez "est admin"

### Via Django Shell
```bash
python manage.py shell
```

```python
from store.models import Utilisateur
from django.contrib.auth.hashers import make_password

Utilisateur.objects.create(
    email='newadmin@example.com',
    mot_de_passe=make_password('SecurePassword@123'),
    nom='Admin',
    prenom='Nouveau',
    est_admin=True,
    est_actif=True
)
```

## 🏗️ Architecture du Projet

```
douce-boutique-en-ligne/
├── src/                           # Frontend React
│   ├── components/               # Composants React
│   │   ├── Header.tsx           # En-tête de navigation
│   │   ├── Footer.tsx           # Pied de page
│   │   ├── CarteProduit.tsx     # Carte produit
│   │   └── ui/                  # Composants Shadcn
│   ├── pages/                   # Pages principales
│   │   ├── Accueil.tsx          # Page d'accueil
│   │   ├── Catalogue.tsx        # Catalogue des produits
│   │   ├── Panier.tsx           # Page du panier
│   │   ├── Compte.tsx           # Gestion du compte
│   │   └── PageProduit.tsx      # Détails produit
│   ├── contexts/                # Context React
│   │   └── PanierContext.tsx    # Gestion du panier
│   ├── hooks/                   # Hooks personnalisés
│   └── lib/                     # Utilitaires
│
└── backend/                      # Django Backend
    ├── ecommerce/              # Configuration Django
    │   ├── settings.py         # Paramètres Django
    │   ├── urls.py            # Routes principales
    │   └── wsgi.py            # Configuration WSGI
    ├── store/                  # Application principale
    │   ├── models.py          # Modèles de données
    │   ├── views.py           # Vues API
    │   ├── serializers.py     # Serializers DRF
    │   ├── urls.py            # Routes API
    │   └── admin.py           # Configuration admin
    ├── manage.py              # Gestionnaire Django
    ├── init_db.py             # Script d'initialisation
    └── requirements.txt       # Dépendances Python
```

## 📚 API Endpoints

### Authentification
- `POST /api/auth/inscription/` - Créer un compte
- `POST /api/auth/connexion/` - Se connecter

### Produits
- `GET /api/produits/` - Liste tous les produits
- `GET /api/produits/{id}/` - Détails d'un produit
- `GET /api/categories/` - Liste les catégories

### Utilisateur
- `GET /api/utilisateurs/me/` - Profil utilisateur connecté
- `PUT /api/utilisateurs/update_profile/` - Mettre à jour le profil

### Panier
- `GET /api/panier/current/` - Récupérer le panier
- `POST /api/panier/add_article/` - Ajouter un article
- `PUT /api/panier/update_article/` - Mettre à jour un article
- `DELETE /api/panier/remove_article/` - Retirer un article
- `POST /api/panier/clear/` - Vider le panier

### Commandes
- `GET /api/commandes/list_user_commandes/` - Historique des commandes
- `POST /api/commandes/create_commande/` - Créer une commande
- `GET /api/commandes/retrieve_commande/` - Détails d'une commande

## 🔐 Authentification JWT

Les requêtes authentifiées doivent inclure le token dans l'en-tête:

```
Authorization: Bearer <access_token>
```

## 💾 Base de Données

### Modèles
- **Utilisateur** - Gestion des comptes
- **Categorie** - Catégories de produits
- **Produit** - Produits avec prix, stock, images
- **Panier** - Panier par utilisateur
- **Article** - Articles dans le panier
- **Commande** - Historique des commandes
- **LigneCommande** - Détails des produits commandés

## 🛠️ Configuration pour la Production

### 1. Variables d'environnement (.env)
```
DEBUG=False
SECRET_KEY=<generated-secret-key>
ALLOWED_HOSTS=your-domain.com
CORS_ALLOWED_ORIGINS=https://your-domain.com
```

### 2. Base de données PostgreSQL
Modifier `backend/ecommerce/settings.py` pour utiliser PostgreSQL:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ecommerce',
        'USER': 'postgres',
        'PASSWORD': 'password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

### 3. Déployer avec Gunicorn
```bash
pip install gunicorn
gunicorn ecommerce.wsgi:application --bind 0.0.0.0:8000
```

### 4. Build du Frontend
```bash
npm run build
# Les fichiers seront dans le dossier dist/
```

## 📊 Gestion Admin

L'interface d'administration Django permet:

- ✅ Gestion complète des produits
- ✅ Gestion des catégories
- ✅ Gestion des utilisateurs
- ✅ Suivi des commandes
- ✅ Gestion des paniers
- ✅ Création d'administrateurs supplémentaires

Accès: http://localhost:8000/admin

## 🐛 Dépannage

### Le frontend ne peut pas se connecter au backend
- Vérifier que Django s'exécute sur le port 8000
- Vérifier les paramètres CORS dans `backend/ecommerce/settings.py`
- Vérifier que le frontend utilise l'URL correcte pour l'API

### Migrations non appliquées
```bash
cd backend
python manage.py migrate
```

### Réinitialiser la base de données
```bash
cd backend
python manage.py flush  # Attention: supprime toutes les données
python init_db.py       # Réinitialise avec les données de base
```

## 📝 Technologies Utilisées

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Shadcn/ui
- React Query
- React Router

### Backend
- Django 4.2
- Django REST Framework
- djangorestframework-simplejwt
- django-cors-headers
- PostgreSQL (production)
- SQLite (développement)

## 📄 License

Ce projet est fourni à titre d'exemple éducatif.

## 👥 Support

Pour toute question ou problème:
1. Consultez la documentation Django: https://docs.djangoproject.com
2. Consultez la documentation React: https://react.dev
3. Consultez le code des exemples fournis

---

**Version**: 1.0.0  
**Dernière mise à jour**: Février 2026
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/REPLACE_WITH_PROJECT_ID) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
