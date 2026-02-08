#!/usr/bin/env python
import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ecommerce.settings')
django.setup()

from store.models import Utilisateur, Commande
from django.contrib.auth.hashers import make_password

email = 'client_test@example.com'
try:
    user = Utilisateur.objects.get(email=email)
    print('Utilisateur existant:', email)
except Utilisateur.DoesNotExist:
    user = Utilisateur.objects.create(
        email=email,
        mot_de_passe=make_password('Password123'),
        nom='Client',
        prenom='Test',
        est_actif=True,
    )
    print('Utilisateur créé:', email)

commande = Commande.objects.create(
    utilisateur=user,
    prix_total=12345,
    adresse_livraison='Adresse Test',
    ville_livraison='Abidjan',
    code_postal_livraison='00000',
    pays_livraison='Côte d\'Ivoire'
)
print('Commande créée:', commande.numero)
print('Statut:', commande.statut)
