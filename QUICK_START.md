# 🚀 DÉMARRAGE RAPIDE - Interface Utilisateur

## ⚡ Lancer les Serveurs

### Terminal 1 - Frontend Vite
```bash
cd C:\PROJECT\douce-boutique-en-ligne
npm run dev
```
**Résultat:** `Local: http://localhost:5173` (ou 8081)

### Terminal 2 - Backend Django
```bash
cd C:\PROJECT\douce-boutique-en-ligne\backend
python manage.py runserver
```
**Résultat:** `http://localhost:8000/api`

---

## 🧪 Test Ultra-Rapide (5 minutes)

### 1️⃣ Test Visiteur Non Inscrit (1 min)
```
1. Allez à http://localhost:5173
2. Cliquez sur un produit
3. Cliquez "Ajouter au panier" → Modale apparaît ✅
4. Cliquez cœur → Modale apparaît ✅
5. Cliquez "S'inscrire" dans la modale
```

### 2️⃣ Test Inscription (2 min)
```
Formulaire:
  Prénom: Jean
  Nom: Dupont
  Email: jean.dupont@test.fr
  Mot de passe: JeanTest123!
  Confirmer: JeanTest123!
  Téléphone: +225 07 12 34 56 78
  Adresse: 123 Rue de la Paix
  Ville: Abidjan
  Code postal: 01

Clic "S'inscrire" →
  ✅ Toast vert: "Inscription réussie! 🎉"
  ✅ Redirection vers accueil
  ✅ Header mise à jour: 👤 visible, ❤️ visible
```

### 3️⃣ Test Mon Compte (2 min)
```
1. Cliquez sur 👤 (en haut à droite)
   → Allez à /compte

2. Vérifiez "Mes informations":
   ✅ Prénom/Nom pré-remplis
   ✅ Email non modifiable
   ✅ Autres champs vides
   Clic "Enregistrer" → Toast succès ✅

3. Cliquez "Mes commandes":
   ✅ Message "Pas de commandes" (normal, premier accès)

4. Cliquez "Mes favoris":
   ✅ Message "Pas de favoris"

5. Cliquez "Paramètres":
   ✅ Checkboxes notifications visibles
   ✅ Bouton "Changer mot de passe" visible

6. Cliquez "Déconnexion":
   ✅ Toast: "Déconnexion réussie 👋"
   ✅ Redirection /
   ✅ 👤 disparaît, ❤️ disparaît du header
```

---

## 📝 Comptes de Test

### Inscription Rapide
```
Email: test@example.fr
Mot de passe: Test@12345
```

### Admin (Pré-créé)
```
Email: admin@douceboutique.fr
Mot de passe: Admin@12345

→ Redirection automatique: http://localhost:8000/admin
```

### Client (Pré-créé)
```
Email: test@example.com
Mot de passe: Test@12345

→ Accès normal à /compte
```

---

## 🎯 Points Clés à Vérifier

### ✅ Authentification
- [ ] Inscription crée un compte
- [ ] Connexion charge l'utilisateur
- [ ] Admin redirigé vers /admin
- [ ] Client va sur /compte
- [ ] Déconnexion supprime tokens

### ✅ Profil
- [ ] Données pré-remplies
- [ ] Édition sauvegarde en base
- [ ] Email non modifiable
- [ ] Toast de succès

### ✅ Commandes
- [ ] Onglet charge les commandes API
- [ ] Affichage formaté (numéro, date, montant, statut)
- [ ] Message vide si pas de commandes

### ✅ Favoris
- [ ] Cœur gris → Ajoute (rouge)
- [ ] Cœur rouge → Retire (gris)
- [ ] Toast de confirmation
- [ ] Onglet favoris affiche la liste
- [ ] Bouton retirer fonctionne

### ✅ Paramètres
- [ ] Checkboxes modifiables
- [ ] Bouton "Changer mot de passe" → /mot-de-passe-oublie
- [ ] Section données présente

### ✅ Sécurité
- [ ] Tokens sauvegardés localStorage
- [ ] Déconnexion supprime tokens
- [ ] Session expire → Redirection /connexion
- [ ] Email vérifié unique à l'inscription

---

## 🔗 URLs Clés

```
Frontend:
  http://localhost:5173        → Accueil
  http://localhost:5173/compte → Mon Compte
  http://localhost:5173/connexion → Connexion
  http://localhost:5173/inscription → Inscription
  http://localhost:5173/favoris → Mes Favoris
  http://localhost:5173/panier → Panier
  http://localhost:5173/mot-de-passe-oublie → Reset Pwd

Backend API:
  http://localhost:8000/api/utilisateurs/me/ → Profil
  http://localhost:8000/api/commandes/list_user_commandes/ → Commandes
  http://localhost:8000/api/favoris/myfavoris/ → Favoris
  http://localhost:8000/api/auth/connexion/ → Login
  http://localhost:8000/api/auth/inscription/ → Register

Admin:
  http://localhost:8000/admin → Django Admin
```

---

## 🛠️ Troubleshooting Rapide

### "Mon Compte s'affiche vide"
```
Solution: Vérifiez que vous êtes connecté
→ Allez sur /connexion
→ Connectez-vous
→ Retournez à /compte
```

### "Les commandes ne s'affichent pas"
```
Solution: Normal! Créez une commande en passant par le panier
Ou attendez que le backend génère une commande test
```

### "Les favoris ne se sauvegardent pas"
```
Vérifiez:
1. Vous êtes connecté ✓
2. Backend s'exécute ✓
3. Console: Pas d'erreur 404 ✓
4. localStorage contient les tokens ✓
```

### "Impossible de se déconnecter"
```
Essayez:
1. Clic "Déconnexion" dans /compte
2. Sinon: Videz localStorage manuellement
   F12 → Application → localStorage → delete
3. Rechargez la page
```

### "Admin redirigé à /"
```
Vérifiez: est_admin = true en base de données
Commande Django shell:
  from store.models import Utilisateur
  u = Utilisateur.objects.get(email='admin@douceboutique.fr')
  print(u.est_admin)  → Doit être True
```

---

## 📱 Test sur Mobile

```
Desktop First:
  http://localhost:5173

Via Mobile/Tablet:
  http://<votre-ip>:5173
  
Exemple:
  http://192.168.1.100:5173

À tester:
  ✅ Menu hamburger ☰ fonctionne
  ✅ Formulaires responsive
  ✅ Panier visible
  ✅ Déconnexion dans menu mobile
```

---

## 🎨 Design Vérifié

```
Colors:
  Rose primaire: #ec4899 (Rose-600)
  Rose foncé: #be185d (Rose-700)
  Gris: #6b7280
  Backgrounds: Gradient rose-50 → purple-50

Elements:
  ✅ Boutons rose avec hover
  ✅ Onglets actifs grisés
  ✅ Icônes Lucide bien intégrées
  ✅ Spinners animés
  ✅ Toasts colorés (succès vert, erreur rouge)
```

---

## 🔐 Endpoints API Utilisés

| Fonction | Méthode | Endpoint |
|----------|---------|----------|
| Profil utilisateur | GET | `/utilisateurs/me/` |
| Mise à jour profil | PUT | `/utilisateurs/update_profile/` |
| Mes commandes | GET | `/commandes/list_user_commandes/` |
| Mes favoris | GET | `/favoris/myfavoris/` |
| Ajouter favoris | POST | `/favoris/add/` |
| Retirer favoris | DELETE | `/favoris/remove/` |
| Vérifier favoris | GET | `/favoris/check/` |

**Tous les appels incluent:** `Authorization: Bearer {token}`

---

## ✨ Nouvelle Interface (Après Refonte)

### Avant (Ancienne)
```
❌ Formulaire inscription/connexion en même page
❌ Données mockées
❌ Onglets non fonctionnels
❌ Pas d'intégration API
❌ Édition profil inutile
```

### Après (Nouvelle)
```
✅ Routes séparées: /connexion, /inscription
✅ Données réelles depuis API
✅ 4 onglets pleinement fonctionnels
✅ API intégrée et testée
✅ Édition profil sauvegarde en base
✅ Listes dynamiques (commandes, favoris)
✅ Gestion d'erreurs robuste
✅ Design amélioré et cohérent
```

---

## 📊 Timeline Test Complète

```
0:00 - 1:00    Visiteur non inscrit
1:00 - 3:00    Inscription
3:00 - 5:00    Visite /compte
5:00 - 6:00    Test favoris
6:00 - 7:00    Test déconnexion
7:00 - 8:00    Reconnexion + Vérifications
8:00 - Final   Nettoyage + Documentation
```

---

## 🎉 Résumé

```
✅ Page /compte entièrement refactorisée
✅ 4 onglets opérationnels
✅ API intégrée et testée
✅ Design modernisé
✅ Responsive complet
✅ Prêt pour production
✅ Documentation complète
✅ Tous les flows testé
```

**Vous pouvez démarrer les serveurs et tester immédiatement! 🚀**

---

*Mise à jour: Février 2026*  
*Statut: ✅ LIVE*
