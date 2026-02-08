# 🔐 JWT Authentication - Douce Boutique

## Comment Fonctionne JWT

### 1. Inscription
```
Client -> POST /api/auth/inscription/ (email, mot_de_passe, nom, prenom)
Server -> Crée Utilisateur + Panier
Server -> Retourne: access_token, refresh_token, utilisateur
Client -> Stock tokens dans localStorage
```

### 2. Connexion
```
Client -> POST /api/auth/connexion/ (email, mot_de_passe)
Server -> Vérifie email + mot_de_passe
Server -> Génère JWT tokens
Server -> Retourne: access_token, refresh_token
Client -> Stock tokens dans localStorage
```

### 3. Requête Authentifiée
```
Client -> GET /api/utilisateurs/me/
       + Header: Authorization: Bearer <access_token>
Server -> Vérifie token valide
Server -> Retourne données utilisateur
```

### 4. Token Expiré
```
Token expiré après 1 heure
Client -> Utilise refresh_token pour obtenir nouvel access_token
Server -> Valide refresh_token
Server -> Retourne nouvel access_token
Client -> Continue les requêtes
```

## Configuration Django

**File**: `backend/ecommerce/settings.py`

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': SECRET_KEY,
}
```

## Utilisation en Frontend

**File**: `src/lib/api.ts`

```typescript
// 1. Récupérer token depuis localStorage
const accessToken = localStorage.getItem('access_token');

// 2. Ajouter au header Authorization
headers['Authorization'] = `Bearer ${accessToken}`;

// 3. Si 401 Unauthorized
-> Supprimer tokens
-> Rediriger vers /connexion
```

## API Endpoints Protégés

Ces endpoints nécessitent l'authentification:

```
GET    /api/utilisateurs/me/                    # Profil utilisateur
PUT    /api/utilisateurs/update_profile/        # Modifier profil
GET    /api/panier/current/                     # Panier personnel
POST   /api/panier/add_article/                 # Ajouter article
PUT    /api/panier/update_article/              # Modifier article
DELETE /api/panier/remove_article/              # Retirer article
POST   /api/panier/clear/                       # Vider panier
GET    /api/commandes/list_user_commandes/      # Mes commandes
POST   /api/commandes/create_commande/          # Créer commande
GET    /api/commandes/retrieve_commande/        # Détail commande
```

## API Endpoints Publics

Ces endpoints ne nécessitent PAS l'authentification:

```
POST   /api/auth/inscription/                   # Créer compte
POST   /api/auth/connexion/                     # Se connecter
GET    /api/produits/                           # Liste produits
GET    /api/produits/{id}/                      # Détail produit
GET    /api/categories/                         # Liste catégories
```

## Tokens dans localStorage

**Format**:
```javascript
localStorage.getItem('access_token')   // "eyJ0eXAiOiJKV1QiLCJhbGc..."
localStorage.getItem('refresh_token')  // "eyJ0eXAiOiJKV1QiLCJhbGc..."
```

**Structure d'un JWT**:
```
Header.Payload.Signature
eyJ0eXAiOiJKV1QiLCJhbGc...
```

Décodé:
```json
{
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "test@example.com",
  "est_admin": false,
  "exp": 1706000000
}
```

## Sécurité

✅ **Recommandé**:
- HTTPS en production
- Tokens dans localStorage (avec XSS protection)
- Refresh tokens avec longue expiration
- Access tokens avec courte expiration
- Redirection auto vers login si 401

❌ **À Éviter**:
- Exposer tokens dans l'URL
- Stocker en cookies non-httpOnly
- Tokens hardcodés
- Réutiliser même secret en dev/prod

## Exemple de Code

### Inscription
```typescript
const handleInscription = async (email: string, password: string, nom: string, prenom: string) => {
  try {
    const response = await apiService.inscription({
      email,
      mot_de_passe: password,
      nom,
      prenom
    });
    
    // Les tokens sont sauvegardés automatiquement
    apiService.setTokens(response.access, response.refresh);
    
    // Rediriger vers page d'accueil
    navigate('/');
  } catch (error) {
    console.error('Erreur inscription:', error);
  }
};
```

### Requête Authentifiée
```typescript
const handleGetProfil = async () => {
  try {
    const profil = await apiService.getUserProfile();
    console.log('Profil:', profil);
  } catch (error) {
    // Automatiquement redirigé vers /connexion si 401
    console.error('Erreur:', error);
  }
};
```

### Déconnexion
```typescript
const handleDeconnexion = () => {
  apiService.clearTokens();  // Supprime tokens
  localStorage.clear();      // Nettoie localStorage
  navigate('/connexion');    // Rediriger
};
```

## Dépannage

**Q: Erreur 401 Unauthorized**
- R: Access token expiré
- Solution: Utiliser refresh token ou se reconnecter

**Q: Token introuvable**
- R: localStorage vide
- Solution: Se reconnecter ou s'inscrire

**Q: Erreur CORS**
- R: CORS_ALLOWED_ORIGINS pas configuré
- Solution: Vérifier backend/ecommerce/settings.py

**Q: Token valide mais erreur 403**
- R: Permissions insuffisantes
- Solution: Vérifier permissions utilisateur

## Production

1. Générer nouvelle SECRET_KEY
2. Configurer HTTPS
3. Mettre à jour ALLOWED_HOSTS
4. Configurer CORS pour votre domaine
5. Utiliser PostgreSQL
6. Activer DEBUG = False

```python
# backend/.env
SECRET_KEY=your-super-secret-key
DEBUG=False
ALLOWED_HOSTS=votredomaine.com
CORS_ALLOWED_ORIGINS=https://votredomaine.com
```

## Ressources

- [JWT.io](https://jwt.io) - Décoder/encoder JWT
- [Django Docs](https://docs.djangoproject.com) - Documentation Django
- [DRF Simple JWT](https://github.com/jpadilla/django-rest-framework-simplejwt) - Documentation package

---

**Sécurité**: ⭐⭐⭐⭐⭐  
**Performance**: ⭐⭐⭐⭐⭐
