# Guide de Déploiement - Douce Boutique

## Déploiement sur un Serveur

### 1. Préparation du Serveur

```bash
# Mettre à jour le système
sudo apt update
sudo apt upgrade -y

# Installer les dépendances
sudo apt install -y python3 python3-pip python3-venv
sudo apt install -y nodejs npm
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y nginx
```

### 2. Configuration de PostgreSQL

```bash
# Accéder à PostgreSQL
sudo -u postgres psql

# Créer la base de données
CREATE DATABASE ecommerce;
CREATE USER ecommerce_user WITH PASSWORD 'strong_password_here';
ALTER ROLE ecommerce_user SET client_encoding TO 'utf8';
ALTER ROLE ecommerce_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE ecommerce_user SET default_transaction_deferrable TO on;
ALTER ROLE ecommerce_user SET default_transaction_isolation TO 'read committed';
GRANT ALL PRIVILEGES ON DATABASE ecommerce TO ecommerce_user;
\q
```

### 3. Cloner et Configurer le Projet

```bash
# Cloner le projet
git clone <votre-repo> /var/www/douce-boutique
cd /var/www/douce-boutique

# Configurer le frontend
npm install
npm run build

# Configurer le backend
cd backend
python3 -m venv venv
source venv/bin/activate

pip install -r requirements.txt

# Créer le fichier .env
cp .env.example .env
# Éditer .env avec vos paramètres de production
nano .env
```

### 4. Configuration du Backend

Éditer `backend/.env`:
```env
DEBUG=False
SECRET_KEY=<your-generated-key>
ALLOWED_HOSTS=votredomaine.com,www.votredomaine.com
CORS_ALLOWED_ORIGINS=https://votredomaine.com,https://www.votredomaine.com

# PostgreSQL
DB_ENGINE=django.db.backends.postgresql
DB_NAME=ecommerce
DB_USER=ecommerce_user
DB_PASSWORD=strong_password_here
DB_HOST=localhost
DB_PORT=5432
```

### 5. Migrations Django

```bash
cd /var/www/douce-boutique/backend

# Appliquer les migrations
python manage.py migrate

# Créer les données de base
python init_db.py

# Collecter les fichiers statiques
python manage.py collectstatic --noinput
```

### 6. Configuration de Gunicorn

```bash
# Installer Gunicorn
pip install gunicorn

# Créer un fichier de service systemd
sudo nano /etc/systemd/system/gunicorn.service
```

Contenu du fichier:
```ini
[Unit]
Description=Gunicorn WSGI Server
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/douce-boutique/backend
Environment="PATH=/var/www/douce-boutique/backend/venv/bin"
ExecStart=/var/www/douce-boutique/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind unix:/var/www/douce-boutique/gunicorn.sock \
    ecommerce.wsgi:application

[Install]
WantedBy=multi-user.target
```

Démarrer le service:
```bash
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

### 7. Configuration de Nginx

```bash
sudo nano /etc/nginx/sites-available/douce-boutique
```

Contenu:
```nginx
upstream gunicorn {
    server unix:/var/www/douce-boutique/gunicorn.sock;
}

server {
    listen 80;
    server_name votredomaine.com www.votredomaine.com;
    client_max_body_size 10M;

    # Frontend - fichiers statiques
    location / {
        root /var/www/douce-boutique/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Admin Django
    location /admin/ {
        proxy_pass http://gunicorn;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques Django
    location /static/ {
        alias /var/www/douce-boutique/backend/staticfiles/;
    }

    # Fichiers médias
    location /media/ {
        alias /var/www/douce-boutique/backend/media/;
    }
}
```

Activer le site:
```bash
sudo ln -s /etc/nginx/sites-available/douce-boutique /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 8. SSL avec Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d votredomaine.com -d www.votredomaine.com
```

### 9. Vérification

```bash
# Vérifier Gunicorn
sudo systemctl status gunicorn

# Vérifier Nginx
sudo systemctl status nginx

# Vérifier PostgreSQL
sudo systemctl status postgresql

# Voir les logs
tail -f /var/log/nginx/error.log
journalctl -u gunicorn
```

## Sauvegarde et Maintenance

### Sauvegarde de la Base de Données

```bash
# Sauvegarde manuelle
sudo -u postgres pg_dump ecommerce > /backups/ecommerce_$(date +%Y%m%d).sql

# Script de sauvegarde automatique (cron)
0 2 * * * sudo -u postgres pg_dump ecommerce > /backups/ecommerce_$(date +\%Y\%m\%d).sql
```

### Mise à Jour de l'Application

```bash
cd /var/www/douce-boutique

# Pull les derniers changements
git pull origin main

# Mettre à jour le frontend
npm install
npm run build

# Mettre à jour le backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Redémarrer les services
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

## Surveillance

### Monitoring du Serveur

```bash
# Installer les outils de monitoring
sudo apt install htop glances iotop

# Vérifier l'utilisation des ressources
htop

# Vérifier les logs
tail -f /var/log/syslog
```

### Monitoring de l'Application

```bash
# Créer un monitoring script
nano /usr/local/bin/check_douce_boutique.sh
```

```bash
#!/bin/bash

# Vérifier Gunicorn
if ! pgrep -f gunicorn > /dev/null; then
    sudo systemctl restart gunicorn
    echo "Gunicorn redémarré" | mail -s "Gunicorn down" admin@example.com
fi

# Vérifier Nginx
if ! pgrep -f nginx > /dev/null; then
    sudo systemctl restart nginx
    echo "Nginx redémarré" | mail -s "Nginx down" admin@example.com
fi
```

Ajouter au cron:
```bash
*/5 * * * * /usr/local/bin/check_douce_boutique.sh
```

## Optimisations

### Caching
Ajouter à `backend/ecommerce/settings.py`:
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}
```

### CDN
- Utiliser CloudFlare pour les fichiers statiques
- Configurer un CDN pour les images de produits

### Compression
Dans Nginx:
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## Troubleshooting

### Erreur 502 Bad Gateway
```bash
# Vérifier Gunicorn
sudo systemctl restart gunicorn
journalctl -u gunicorn -n 50
```

### Erreur de Permission
```bash
# Corriger les permissions
sudo chown -R www-data:www-data /var/www/douce-boutique
sudo chmod -R 755 /var/www/douce-boutique
```

### Erreur de Base de Données
```bash
# Vérifier PostgreSQL
sudo -u postgres psql -c "SELECT version();"

# Redémarrer PostgreSQL
sudo systemctl restart postgresql
```

## Support

Pour plus de détails, consultez:
- Documentation Django: https://docs.djangoproject.com/deploy/
- Documentation Gunicorn: https://gunicorn.org/
- Documentation Nginx: https://nginx.org/
