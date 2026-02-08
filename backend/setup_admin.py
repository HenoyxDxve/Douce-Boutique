#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
django.setup()

from store.models import Utilisateur
from django.contrib.auth.hashers import make_password

# Créer/vérifier le compte admin dans le modèle Utilisateur
email_admin = 'admin@douceboutique.fr'
password_admin = 'Admin@12345'

try:
    utilisateur = Utilisateur.objects.get(email=email_admin)
    # Mettre à jour si existe
    utilisateur.mot_de_passe = make_password(password_admin)
    utilisateur.est_admin = True
    utilisateur.est_actif = True
    utilisateur.nom = 'Admin'
    utilisateur.prenom = 'Douce'
    utilisateur.save()
    print(f'✅ Admin mis à jour: {email_admin}')
except Utilisateur.DoesNotExist:
    # Créer nouveau
    utilisateur = Utilisateur.objects.create(
        email=email_admin,
        mot_de_passe=make_password(password_admin),
        nom='Admin',
        prenom='Douce',
        est_admin=True,
        est_actif=True,
        telephone='',
        adresse='',
        ville='',
        code_postal='',
        pays='France'
    )
    print(f'✅ Admin créé: {email_admin}')

print(f'\n📝 Identifiants admin (Utilisateur):')
print(f'Email: {email_admin}')
print(f'Mot de passe: {password_admin}')
print(f'\n🔗 URL frontend: http://localhost:8081')
print(f'1. Vá à /connexion')
print(f'2. Entre les identifiants ci-dessus')
print(f'3. Clique sur ⚙️ dans le header pour accéder au dashboard admin')
