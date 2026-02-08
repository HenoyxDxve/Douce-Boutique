# Guide d'Administration - Douce Boutique

## 📊 Accès à l'Admin

URL: `http://localhost:8000/admin`

Compte par défaut:
- **Email**: admin@douceboutique.fr
- **Mot de passe**: Admin@12345

## 👥 Gestion des Utilisateurs

### Créer un nouvel utilisateur
1. Allez dans la section "Utilisateurs" du panneau admin
2. Cliquez sur "Ajouter un utilisateur"
3. Remplissez les informations requises
4. Pour en faire un admin, cochez "est admin"

### Modifier un utilisateur
1. Cliquez sur l'utilisateur dans la liste
2. Modifiez les informations
3. Cliquez sur "Enregistrer"

### Désactiver un compte
1. Sélectionnez l'utilisateur
2. Décochez "est actif"
3. Enregistrez

## 📦 Gestion des Produits

### Ajouter un produit
1. Allez dans "Produits"
2. Cliquez sur "Ajouter un produit"
3. Remplissez:
   - Nom, description
   - Prix (et prix original si promotion)
   - Catégorie
   - Stock initial
   - Variantes (tailles et couleurs)
4. Cochez "Nouveau" ou "En promotion" selon les besoins
5. Enregistrez

### Modifier les stocks
1. Allez dans "Produits"
2. Cliquez sur le produit
3. Modifiez le champ "Stock"
4. Enregistrez

### Gérer les promotions
1. Sélectionnez le produit
2. Remplissez "Prix original"
3. Cochez "En promotion"
4. Le pourcentage de réduction s'affiche automatiquement

## 🏷️ Gestion des Catégories

### Ajouter une catégorie
1. Allez dans "Catégories"
2. Cliquez sur "Ajouter une catégorie"
3. Remplissez:
   - Nom
   - Slug (pour l'URL)
   - Icône (emoji)
4. Enregistrez

Les catégories existantes:
- 👗 Robes (slug: robes)
- 👚 Tops & Blouses (slug: tops)
- 👖 Pantalons (slug: pantalons)
- 👜 Accessoires (slug: accessoires)
- 👠 Chaussures (slug: chaussures)
- 💎 Bijoux (slug: bijoux)

## 🛒 Suivi des Commandes

### Consulter une commande
1. Allez dans "Commandes"
2. Cliquez sur le numéro de commande
3. Consultez:
   - Les produits commandés
   - L'adresse de livraison
   - Le statut

### Mettre à jour le statut
1. Ouvrez la commande
2. Changez le "Statut":
   - **En attente**: Commande reçue
   - **Confirmée**: Paiement confirmé
   - **Expédiée**: En route vers le client
   - **Livrée**: Livrée au client
   - **Annulée**: Commande annulée
3. Enregistrez

## 🔑 Créer un Nouvel Admin via Django Shell

```bash
cd backend
source venv/bin/activate  # ou venv\Scripts\activate.bat sur Windows
python manage.py shell
```

Puis exécutez:
```python
from store.models import Utilisateur
from django.contrib.auth.hashers import make_password

Utilisateur.objects.create(
    email='newadmin@example.com',
    mot_de_passe=make_password('SecurePassword@123'),
    nom='Dupont',
    prenom='Jean',
    est_admin=True,
    est_actif=True
)
```

## 📊 Statistiques Utiles

Pour obtenir des informations sur votre boutique:

```bash
python manage.py shell
```

### Nombre total de produits
```python
from store.models import Produit
Produit.objects.count()
```

### Nombre de commandes
```python
from store.models import Commande
Commande.objects.count()
```

### Revenus totaux
```python
from store.models import Commande
from django.db.models import Sum
Commande.objects.aggregate(Sum('prix_total'))
```

### Produits à faible stock
```python
Produit.objects.filter(stock__lt=5)
```

## 🔐 Sécurité

- Changez le mot de passe de l'admin par défaut immédiatement
- Utilisez des mots de passe forts (min 8 caractères avec majuscules et chiffres)
- Gérez les droits d'admin avec prudence
- Sauvegardez régulièrement votre base de données

## 🛠️ Maintenance

### Sauvegarder la base de données
```bash
cd backend
python manage.py dumpdata > backup.json
```

### Restaurer une sauvegarde
```bash
cd backend
python manage.py loaddata backup.json
```

### Nettoyer les paniers inactifs
```bash
cd backend
python manage.py shell
```

```python
from store.models import Panier
# Supprimer les paniers vides
Panier.objects.filter(articles__isnull=True).delete()
```

## 📞 Support

Pour toute question:
1. Consultez la documentation Django Admin: https://docs.djangoproject.com/admin/
2. Vérifiez les logs Django dans la console
3. Consultez le fichier README.md du projet
