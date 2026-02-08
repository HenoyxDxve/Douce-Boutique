# Installation Log - Douce Boutique

## 📋 Checklist d'Installation

### Avant de Démarrer
- [ ] Python 3.8+ installé
- [ ] Node.js 16+ installé
- [ ] Git installé (optionnel)
- [ ] 500 MB d'espace disque disponible

### Installation Backend
- [ ] Créer l'environnement virtuel: `python -m venv venv`
- [ ] Activer l'environnement: `source venv/bin/activate`
- [ ] Installer dépendances: `pip install -r requirements.txt`
- [ ] Copier .env: `cp .env.example .env`
- [ ] Créer migrations: `python manage.py makemigrations store`
- [ ] Appliquer migrations: `python manage.py migrate`
- [ ] Initialiser données: `python init_db.py`
- [ ] Tester le serveur: `python manage.py runserver`

### Installation Frontend
- [ ] Installer dépendances: `npm install`
- [ ] Vérifier .env existe
- [ ] Lancer le serveur: `npm run dev`
- [ ] Tester http://localhost:5173

### Vérifications
- [ ] Admin accessible: http://localhost:8000/admin
- [ ] API accessible: http://localhost:8000/api/produits/
- [ ] Frontend accessible: http://localhost:5173
- [ ] Utilisateur admin crée
- [ ] Produits d'exemple visibles

### Dépannage
**Si les migrations échouent**:
```bash
python manage.py flush
python manage.py makemigrations
python manage.py migrate
python init_db.py
```

**Si le frontend ne se connecte pas**:
- Vérifier que Django est en cours d'exécution
- Vérifier .env contient VITE_API_URL correcte
- Vérifier CORS dans backend/ecommerce/settings.py

**Si les dépendances manquent**:
```bash
pip install --upgrade pip
pip install -r requirements.txt --force-reinstall
```

## 📝 Notes

- Première installation: ~5-10 minutes
- Base de données: SQLite (dev), PostgreSQL (prod)
- Frontend port: 5173
- Backend port: 8000
- Admin: http://localhost:8000/admin

## 🔐 Sécurité

Après l'installation, changez:
- [ ] SECRET_KEY dans backend/.env
- [ ] Mot de passe admin
- [ ] CORS_ALLOWED_ORIGINS en production

## ✅ Installation Terminée?

Consultez:
1. README.md - Documentation complète
2. QUICKSTART.md - Guide de démarrage
3. ADMIN_GUIDE.md - Guide d'administration
