# Configuration de l'application

## Frontend (.env)

```env
# URL de l'API Backend
VITE_API_URL=http://localhost:8000/api
```

## Backend (backend/.env)

```env
# Django Settings
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,*

# CORS (pour le frontend)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173

# Base de données (SQLite par défaut)
# Pour PostgreSQL, décommentez et configurez:
# DB_ENGINE=django.db.backends.postgresql
# DB_NAME=ecommerce
# DB_USER=postgres
# DB_PASSWORD=password
# DB_HOST=localhost
# DB_PORT=5432
```

## Production

### Frontend
```env
VITE_API_URL=https://api.votredomaine.com/api
```

### Backend
```env
SECRET_KEY=<generated-secret-key>
DEBUG=False
ALLOWED_HOSTS=votredomaine.com,www.votredomaine.com
CORS_ALLOWED_ORIGINS=https://votredomaine.com,https://www.votredomaine.com
```

## Générer une SECRET_KEY Django

```python
from django.core.management.utils import get_random_secret_key
print(get_random_secret_key())
```

Ou utiliser en ligne:
```bash
python -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'
```
