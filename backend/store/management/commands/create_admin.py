import os

from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand

from store.models import Panier, Utilisateur


class Command(BaseCommand):
    help = (
        "Crée (ou promeut) un compte administrateur à partir des variables "
        "d'environnement ADMIN_EMAIL/ADMIN_PASSWORD. Ne fait rien si elles "
        "sont absentes — sûr à exécuter à chaque déploiement."
    )

    def handle(self, *args, **options):
        email = os.environ.get('ADMIN_EMAIL')
        mot_de_passe = os.environ.get('ADMIN_PASSWORD')

        if not email or not mot_de_passe:
            self.stdout.write('ADMIN_EMAIL/ADMIN_PASSWORD non définis — aucun compte admin créé.')
            return

        utilisateur, created = Utilisateur.objects.get_or_create(
            email=email,
            defaults={
                'mot_de_passe': make_password(mot_de_passe),
                'nom': 'Boutique',
                'prenom': 'Admin',
                'est_admin': True,
                'est_actif': True,
            },
        )

        if created:
            Panier.objects.get_or_create(utilisateur=utilisateur)
            self.stdout.write(self.style.SUCCESS(f"Compte admin créé : {email}"))
        elif not utilisateur.est_admin:
            utilisateur.est_admin = True
            utilisateur.save()
            self.stdout.write(self.style.SUCCESS(f"{email} promu admin."))
        else:
            self.stdout.write(f"{email} existe déjà et est déjà admin.")
