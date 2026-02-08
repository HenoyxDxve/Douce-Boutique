# Guide de Démarrage Rapide - Douce Boutique

## 🚀 Démarrage en 5 minutes

### Windows
1. **Double-cliquez sur** `setup.bat` à la racine du projet
2. Attendez la fin de l'installation
3. **Démarrer le backend** (ouvrir un nouveau terminal):
   ```bash
   cd backend
   venv\Scripts\activate.bat
   python manage.py runserver
   ```
4. **Démarrer le frontend** (ouvrir un autre terminal):
   ```bash
   npm run dev
   ```

### Linux / Mac
1. **Exécutez** `setup.sh`:
   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```
2. **Démarrer le backend** (ouvrir un nouveau terminal):
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py runserver
   ```
3. **Démarrer le frontend** (ouvrir un autre terminal):
   ```bash
   npm run dev
   ```

## 🌐 Accès aux Interfaces

| Interface | URL | Description |
|-----------|-----|-------------|
| Frontend | http://localhost:5173 | Boutique en ligne |
| Backend API | http://localhost:8000/api | API REST |
| Admin Panel | http://localhost:8000/admin | Gestion du système |

## 👤 Comptes de Test

### Admin (accès complet)
```
Email: admin@douceboutique.fr
Mot de passe: Admin@12345
Accès: http://localhost:8000/admin
```

### Client (test d'achat)
```
Email: test@example.com
Mot de passe: Test@12345
```

## ✨ Fonctionnalités Principales

### Pour les Clients
- ✅ Parcourir le catalogue
- ✅ Filtrer par catégorie
- ✅ Ajouter au panier
- ✅ Gérer son compte
- ✅ Passer des commandes
- ✅ Consulter l'historique

### Pour les Administrateurs
- ✅ Gérer les produits
- ✅ Gérer les catégories
- ✅ Gérer les utilisateurs
- ✅ Suivre les commandes
- ✅ Gérer les promotions
- ✅ Créer d'autres admins

## 🗂️ Structure du Projet

```
douce-boutique-en-ligne/
├── src/                    # Frontend React
├── backend/               # Backend Django
│   ├── ecommerce/        # Configuration
│   ├── store/            # Application principale
│   └── manage.py         # Gestionnaire Django
├── README.md             # Documentation complète
├── ADMIN_GUIDE.md        # Guide d'administration
└── QUICKSTART.md         # Ce fichier
```

## 🔧 Commandes Utiles

### Frontend
```bash
npm run dev       # Démarrer le serveur de développement
npm run build     # Build pour la production
npm run lint      # Vérifier les erreurs
npm run test      # Lancer les tests
```

### Backend
```bash
python manage.py migrate        # Appliquer les migrations
python manage.py makemigrations # Créer les migrations
python manage.py createsuperuser # Créer un nouvel admin
python manage.py collectstatic  # Collecter les fichiers statiques
python manage.py shell          # Ouvrir une console Python
```

## 🔑 Réinitialiser les Données

```bash
cd backend

# Option 1: Vider complètement la base
python manage.py flush

# Option 2: Réinitialiser avec les données de base
python init_db.py
```

## 🐛 Dépannage Rapide

### Le frontend ne peut pas se connecter
- ✓ Vérifiez que Django s'exécute (http://localhost:8000)
- ✓ Vérifiez le fichier `.env` à la racine du projet
- ✓ Vérifiez la console du navigateur pour les erreurs

### Erreurs de migration
```bash
cd backend
python manage.py migrate --run-syncdb
```

### Permissions refusées sur setup.sh
```bash
chmod +x setup.sh
./setup.sh
```

## 📝 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `.env` | Configuration frontend (API URL) |
| `backend/.env` | Configuration backend |
| `README.md` | Documentation complète |
| `ADMIN_GUIDE.md` | Guide d'administration |
| `backend/init_db.py` | Initialisation des données |

## 💡 Astuces

1. **Développement frontend uniquement**: Il suffit de `npm run dev`
2. **Développement backend uniquement**: Utilisez Django avec SQLite
3. **Variables d'environnement**: Modifiez `.env` et `backend/.env`
4. **Hot reload**: Le frontend se recharge automatiquement
5. **API docs**: Consultez le README.md pour les endpoints

## 📚 Documentation Complète

Pour plus de détails:
- 📖 [README.md](./README.md) - Documentation complète du projet
- 👨‍💼 [ADMIN_GUIDE.md](./ADMIN_GUIDE.md) - Guide d'administration

## 🎯 Prochaines Étapes

1. Explorez le catalogue de produits
2. Créez un compte utilisateur
3. Testez le processus d'achat
4. Accédez à l'admin pour gérer les produits
5. Consultez la documentation pour les personnalisations

Bon shopping! 🛍️
