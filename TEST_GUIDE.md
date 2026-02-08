# 🧪 GUIDE DE TEST - SYSTÈME JUMIA

## ⚡ Avant de commencer

Les serveurs doivent être en cours d'exécution:
- ✅ Frontend: `http://localhost:8081`
- ✅ Backend: `http://localhost:8000`
- ✅ Admin: `http://localhost:8000/admin`

---

## 🎯 TEST 1: Visiteur Non Inscrit

### Scénario: Protection du panier

**Étapes:**
1. Ouvrez `http://localhost:8081` (en privé/incognito si possible)
2. Allez à `/catalogue`
3. Trouvez un produit
4. Passez la souris sur la carte du produit
5. Cliquez sur le bouton **"Ajouter"**

**Résultat attendu:**
- ✅ Une modale s'affiche avec titre "🔐 Connexion requise"
- ✅ Message: "Vous devez être connecté pour effectuer cette action"
- ✅ Deux boutons: "Se connecter" et "S'inscrire"

**Problème?** 
- Vérifiez que le token JWT n'est pas en localStorage

---

## ❤️ TEST 2: Favoris Non Connecté

### Scénario: Protection des favoris

**Étapes:**
1. Sur le même produit, cliquez sur le bouton **"❤️"** (cœur)
2. La modale doit réapparaître

**Résultat attendu:**
- ✅ Modale de connexion
- ❌ Le cœur ne devient PAS rouge
- ❌ Le produit n'est PAS ajouté aux favoris

**Problème?**
- Vérifiez l'état du cœur dans le composant CarteProduit

---

## 📝 TEST 3: Inscription Nouvelle

### Scénario: Créer un nouveau compte

**Étapes:**
1. Cliquez sur "S'inscrire" dans la modale
2. Vous êtes redirigé vers `/inscription`
3. Remplissez le formulaire:
   - Prénom: `Marie`
   - Nom: `Martin`
   - Email: `marie.martin@test.fr`
   - Mot de passe: `SecurePass123`
   - Confirmer: `SecurePass123`
   - Adresse: `10 Rue de la Paix`
   - Ville: `Lyon`
   - Code postal: `69000`
   - Téléphone: `06 12 34 56 78`
4. Cliquez **"S'inscrire"**

**Résultat attendu:**
- ✅ Message de succès "Inscription réussie! 🎉"
- ✅ Redirection vers accueil après 1 sec
- ✅ Utilisateur connecté automatiquement
- ✅ Header affiche "❤️ Favoris" et l'icône compte

**Validations à tester:**
- [ ] Mot de passe < 8 caractères → Erreur
- [ ] Mot de passe sans majuscule → Erreur  
- [ ] Mot de passe sans chiffre → Erreur
- [ ] Email déjà utilisé → Erreur
- [ ] Mots de passe différents → Erreur

---

## ❌ TEST 4: Connexion Avec Mauvaises Credentials

### Scénario: Authentification échouée

**Étapes:**
1. Aller à `/connexion`
2. Entrez:
   - Email: `nonexistant@test.fr`
   - Mot de passe: `AnythingPassword123`
3. Cliquez **"Se connecter"**

**Résultat attendu:**
- ✅ Message d'erreur: "Email ou mot de passe incorrect"
- ❌ Utilisateur PAS connecté
- ✅ Reste sur `/connexion`

**À tester:**
- [ ] Email inexistant
- [ ] Mauvais mot de passe
- [ ] Email vide → Ne soumet pas (validation HTML)

---

## ✅ TEST 5: Connexion Réussie (Client)

### Scénario: Authentification client normale

**Étapes:**
1. Aller à `/connexion`
2. Entrez les credentials de test:
   - Email: `test@example.com`
   - Mot de passe: `Test@12345`
3. Cliquez **"Se connecter"**

**Résultat attendu:**
- ✅ Message: "Connexion réussie! 🎉"
- ✅ Redirection vers accueil
- ✅ Header montre: ❤️ Favoris, 👤 Compte, 🛍️ Panier
- ✅ Pas de bouton Connexion

---

## ⚙️ TEST 6: Connexion Admin

### Scénario: Admin redirigé automatiquement

**Étapes:**
1. Aller à `/connexion`
2. Entrez les credentials admin:
   - Email: `admin@douceboutique.fr`
   - Mot de passe: `Admin@12345`
3. Cliquez **"Se connecter"**

**Résultat attendu:**
- ✅ Message: "Connexion réussie! 🎉"
- ✅ **Redirection automatique vers** `http://localhost:8000/admin`
- ✅ Voir le Django Admin Panel
- ✅ Accès aux sections: Utilisateurs, Produits, Commandes, Favoris

**Vérifications dans Admin:**
- [ ] Utilisateurs: Voir admin et test
- [ ] Produits: Voir tous les produits
- [ ] Favoris: Section présente
- [ ] Commandes: Section présente

---

## 🛒 TEST 7: Ajouter au Panier (Connecté)

### Scénario: Panier fonctionnel pour client

**Étapes:**
1. Connecté en tant que `test@example.com`
2. Allez à `/catalogue`
3. Trouvez un produit
4. Cliquez **"Ajouter"**

**Résultat attendu:**
- ✅ Pas de modale
- ✅ Toast: "Article ajouté au panier! 🛍️"
- ✅ Badge panier dans header: **nombre augmente**
- ✅ Allez à `/panier` et voyez l'article

---

## ❤️ TEST 8: Système de Favoris (Complet)

### Scénario A: Ajouter aux favoris

**Étapes:**
1. Connecté en tant que `test@example.com`
2. Allez à `/catalogue`
3. Trouvez un produit
4. Cliquez sur le bouton **"❤️"** (cœur gris)

**Résultat attendu:**
- ✅ Toast: "Ajouté aux favoris! ❤️"
- ✅ Le cœur devient **ROUGE** 🔴
- ✅ L'article est sauvegardé en base de données

**Scénario B: Retirer des favoris**

**Étapes:**
1. Sur le même produit, cliquez le cœur **rouge**

**Résultat attendu:**
- ✅ Toast: "Retiré des favoris"
- ✅ Le cœur redevient **gris** ⚫
- ✅ L'article est supprimé de la base

### Scénario C: Page Favoris

**Étapes:**
1. Ajouter 3-4 produits aux favoris
2. Cliquez sur **"❤️ Favoris"** dans le header
3. Aller à `/favoris`

**Résultat attendu:**
- ✅ Page affiche: "❤️ Mes Favoris"
- ✅ Nombre de favoris: "X produit(s) en favori"
- ✅ Grille avec tous les favoris
- ✅ Chaque carte a un bouton "Retirer"

**Scénario D: Retirer d'une carte favori**

**Étapes:**
1. Sur la page `/favoris`, cliquez **"Retirer"** sur une carte
2. Retournez au catalogue

**Résultat attendu:**
- ✅ Article retiré de la page favoris
- ✅ Cœur est à nouveau gris dans le catalogue
- ✅ Nombre de favoris diminue

---

## 🔐 TEST 9: Mot de Passe Oublié

### Scénario A: Demander réinitialisation

**Étapes:**
1. Aller à `/connexion`
2. Cliquez sur **"Mot de passe oublié?"**
3. Entrez un email valide: `test@example.com`
4. Cliquez **"Envoyer le lien"**

**Résultat attendu:**
- ✅ Message: "Un email avec un lien a été envoyé"
- ✅ Token affiche en développement (en prod, serait par email)
- ✅ La page change à l'étape "Réinitialisation"

### Scénario B: Changer le mot de passe

**Étapes:**
1. Copiez le **token** affichée
2. Entrez nouveau mot de passe:
   - Champ: `NewPassword2024`
3. Cliquez **"Réinitialiser le mot de passe"**

**Résultat attendu:**
- ✅ Message: "Mot de passe réinitialisé avec succès!"
- ✅ Redirection vers `/connexion` après 2 sec
- ✅ Ancien mot de passe NE fonctionne PLUS

**Étape C: Tester nouveau mot de passe**

**Étapes:**
1. À `/connexion`, entrez:
   - Email: `test@example.com`
   - Mot de passe: `NewPassword2024`
2. Cliquez **"Se connecter"**

**Résultat attendu:**
- ✅ Connexion réussie
- ✅ Vous êtes connecté

**À tester - Validations:**
- [ ] Mot de passe < 8 caractères → Erreur
- [ ] Pas de majuscule → Erreur
- [ ] Pas de chiffre → Erreur
- [ ] Token expiré (>24h) → Erreur
- [ ] Email inexistant → Erreur

---

## 👤 TEST 10: Déconnexion

### Scénario: Déconnexion fonctionnelle

**Étapes:**
1. Connecté comme `test@example.com`
2. Ouvrez le menu mobile (📱) ou menu utilisateur
3. Cliquez **"Déconnexion"**

**Résultat attendu:**
- ✅ Tokens supprimés du localStorage
- ✅ Redirection vers accueil
- ✅ Header affiche "👤" pour connexion
- ✅ Pas d'accès à `/favoris` (redirect `/connexion`)
- ✅ Panier vide

---

## 🔍 TEST 11: Favoris en Base de Données

### Scénario: Vérification base de données

**Étapes:**
1. Connecté comme admin
2. Allez à `http://localhost:8000/admin`
3. Cliquez sur **"Favoris"**

**Résultat attendu:**
- ✅ Voir les favoris ajoutés
- ✅ Colonne: Utilisateur, Produit, Date ajout
- ✅ Chaque ligne = un favori
- ✅ Impossible de dupliquer (unique constraint)

**Pour supprimer un favori:**
1. Cliquez sur un favori
2. En bas: **"Supprimer"**
3. Confirmez

**Résultat attendu:**
- ✅ Favori supprimé en base
- ✅ Cœur redevient gris au prochain refresh

---

## 🚨 TESTS DE VALIDATION

### Mots de passe

| Input | Attendu | ✓ |
|-------|---------|---|
| `short` | Erreur (< 8) | [ ] |
| `nouppercase123` | Erreur (pas maj) | [ ] |
| `NoNumbers` | Erreur (pas chiffre) | [ ] |
| `ValidPass123` | ✅ Accepté | [ ] |

### Emails

| Input | Attendu | ✓ |
|-------|---------|---|
| `invalid` | Erreur (format) | [ ] |
| `test@example.com` (exists) | Erreur (existe) | [ ] |
| `new@test.fr` | ✅ Accepté | [ ] |

### Formulaires

| Champ | Vide | Attendu | ✓ |
|-------|------|---------|---|
| Email | ✓ | Validation | [ ] |
| Mot de passe | ✓ | Validation | [ ] |
| Nom | ✓ | Validation | [ ] |

---

## 📊 CHECKLIST FINALE

### Fonctionnalité

- [ ] Visiteur ne peut pas ajouter panier
- [ ] Visiteur ne peut pas ajouter favoris
- [ ] Modale s'affiche au clic
- [ ] Inscription crée compte
- [ ] Connexion valide email/pwd
- [ ] Admin redirige à `/admin`
- [ ] Favoris sauvegardent en base
- [ ] Cœur change de couleur
- [ ] Page `/favoris` affiche tous les favoris
- [ ] Mot de passe oublié fonctionne
- [ ] Token expire après 24h
- [ ] Déconnexion efface session

### Performance

- [ ] Pas de console errors
- [ ] Requêtes API rapides (< 1sec)
- [ ] Images chargent correctement
- [ ] Transitions fluides

### Design

- [ ] Responsive mobile/tablette
- [ ] Gradients cohérents
- [ ] Messages clairs
- [ ] Boutons accessibles

---

## 🆘 EN CAS DE PROBLÈME

### Modale ne s'affiche pas

**Vérifications:**
1. Vérifiez que `estConnecte === false`
2. Vérifiez localStorage: `localStorage.getItem('access_token')` = `null`
3. Rechargez la page

### Favoris ne sauvegardent pas

**Vérifications:**
1. Vérifiez les logs API: `console.log(data)`
2. Vérifiez en admin panel: Favoris apparaît?
3. Vérifiez le token JWT est valide

### Admin ne redirige pas

**Vérifications:**
1. Vérifiez `estAdmin === true` après connexion
2. Vérifiez URL cible: `http://localhost:8000/admin`
3. Vérifiez cookies/sessions

### Mot de passe oublié ne fonctionne pas

**Vérifications:**
1. Email existe-t-il en base?
2. Token est-il valide (< 24h)?
3. Vérifiez console pour erreurs

---

## 💬 RAPPORT DE TEST

Après avoir testé, créez un rapport:

```
✅ Visiteur non inscrit: PASS
✅ Système favoris: PASS
✅ Mot de passe oublié: PASS
❌ Admin redirect: FAIL (voir logs)

Bugs trouvés:
1. ...

Suggestions:
1. ...
```

---

**Bon testing! 🚀**
