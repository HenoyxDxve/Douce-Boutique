const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ||
  'http://localhost:8000/api';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

function extractErrorMessage(status: number, data: unknown): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>;
    if (typeof obj.erreur === 'string') return obj.erreur;
    if (typeof obj.detail === 'string') return obj.detail;
    if (typeof obj.message === 'string') return obj.message;
    // DRF validation errors: { field: ['message', ...] }
    const firstKey = Object.keys(obj)[0];
    if (firstKey) {
      const value = obj[firstKey];
      if (Array.isArray(value) && typeof value[0] === 'string') {
        return `${firstKey}: ${value[0]}`;
      }
      if (typeof value === 'string') return value;
    }
  }
  return `Erreur ${status}`;
}

class ApiService {
  private buildUrl(path: string): string {
    return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  }

  async request<T = unknown>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
    let payload: BodyInit | undefined;
    if (body !== undefined) {
      if (isFormData) {
        payload = body as FormData;
      } else {
        headers['Content-Type'] = 'application/json';
        payload = JSON.stringify(body);
      }
    }

    const response = await fetch(this.buildUrl(path), {
      method,
      headers,
      body: payload,
    });

    if (response.status === 401) {
      this.clearTokens();
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get('content-type') || '';
    const data = contentType.includes('application/json')
      ? await response.json().catch(() => undefined)
      : await response.text().catch(() => undefined);

    if (!response.ok) {
      throw new Error(extractErrorMessage(response.status, data));
    }

    return data as T;
  }

  // ---- Tokens ----
  setTokens(access: string, refresh: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }

  clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  getAccessToken() {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  // ---- Auth ----
  connexion(email: string, mot_de_passe: string) {
    return this.request<{ access: string; refresh: string; utilisateur: unknown }>(
      'POST',
      '/auth/connexion/',
      { email, mot_de_passe },
    );
  }

  inscription(data: {
    email: string;
    mot_de_passe: string;
    nom: string;
    prenom: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    code_postal?: string;
  }) {
    return this.request('POST', '/auth/inscription/', data);
  }

  getUserProfile() {
    return this.request('GET', '/utilisateurs/me/');
  }

  updateUserProfile(data: unknown) {
    return this.request('PUT', '/utilisateurs/update_profile/', data);
  }

  motDePasseOublie(email: string) {
    return this.request<{ message: string }>(
      'POST',
      '/auth/mot-de-passe-oublie/',
      { email },
    );
  }

  reinitialiserMotDePasse(token: string, nouveau_mot_de_passe: string) {
    return this.request('POST', '/auth/reinitialiser-mot-de-passe/', {
      token,
      nouveau_mot_de_passe,
    });
  }

  createAdminSession() {
    const token = this.getAccessToken();
    return fetch(this.buildUrl('/auth/admin_session/'), {
      method: 'POST',
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    }).then((res) => {
      if (!res.ok) throw new Error('Erreur création session admin');
      return res.json();
    });
  }

  // ---- Produits ----
  getProduits(params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : '';
    return this.request(`GET`, `/produits/${query}`);
  }

  getProduit(id: string) {
    return this.request('GET', `/produits/${id}/`);
  }

  getCategories() {
    return this.request('GET', '/categories/');
  }

  createProduit(data: Record<string, unknown>) {
    return this.request('POST', '/produits/', this.toProduitPayload(data));
  }

  updateProduit(id: string, data: Record<string, unknown>) {
    return this.request('PATCH', `/produits/${id}/`, this.toProduitPayload(data));
  }

  deleteProduit(id: string) {
    return this.request('DELETE', `/produits/${id}/`);
  }

  private toProduitPayload(data: Record<string, unknown>) {
    const hasFile = data.image_principale instanceof File;
    if (!hasFile) return data;
    const form = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      if (Array.isArray(value)) {
        form.append(key, JSON.stringify(value));
      } else if (value instanceof File) {
        form.append(key, value);
      } else {
        form.append(key, String(value));
      }
    });
    return form;
  }

  // ---- Catégories (admin) ----
  createCategorie(data: { nom: string; slug: string; description?: string; icone?: string }) {
    return this.request('POST', '/categories/', data);
  }

  updateCategorie(id: string, data: Partial<{ nom: string; slug: string; description: string; icone: string }>) {
    return this.request('PATCH', `/categories/${id}/`, data);
  }

  deleteCategorie(id: string) {
    return this.request('DELETE', `/categories/${id}/`);
  }

  // ---- Favoris ----
  getFavoris() {
    return this.request('GET', '/favoris/myfavoris/');
  }

  addToFavoris(produitId: string) {
    return this.request('POST', '/favoris/add/', { produit_id: produitId });
  }

  removeFromFavoris(produitId: string) {
    return this.request('DELETE', '/favoris/remove/', { produit_id: produitId });
  }

  // ---- Panier ----
  getPanier() {
    return this.request('GET', '/panier/current/');
  }

  addArticlePanier(data: { produit_id: string; quantite?: number; taille?: string; couleur?: string }) {
    return this.request('POST', '/panier/add_article/', data);
  }

  updateArticlePanier(articleId: string, quantite: number) {
    return this.request('PUT', '/panier/update_article/', { article_id: articleId, quantite });
  }

  removeArticlePanier(articleId: string) {
    return this.request('DELETE', `/panier/remove_article/?article_id=${articleId}`);
  }

  clearPanier() {
    return this.request('POST', '/panier/clear/');
  }

  // ---- Commandes ----
  getCommandes() {
    return this.request('GET', '/commandes/list_user_commandes/');
  }

  getAllCommandes() {
    return this.request('GET', '/commandes/list_all_commandes/');
  }

  getCommande(numero: string) {
    return this.request('GET', `/commandes/retrieve_commande/?numero=${encodeURIComponent(numero)}`);
  }

  updateCommandeStatut(id: string, statut: string) {
    return this.request('PATCH', `/commandes/update_status/?id=${id}`, { statut });
  }

  createCommandeFromItems(data: {
    items: Array<{
      produit_id: string;
      quantite: number;
      taille?: string;
      couleur?: string;
      prix_unitaire: number;
      nom: string;
    }>;
    telephone_livraison?: string;
    adresse_livraison: string;
    ville_livraison: string;
    code_postal_livraison?: string;
    pays_livraison?: string;
    latitude?: number | null;
    longitude?: number | null;
    notes?: string;
    mode_paiement?: string;
  }) {
    return this.request('POST', '/commandes/create_from_items/', data);
  }

  getCommandeStats() {
    return this.request('GET', '/commandes/stats/');
  }

  // ---- Utilisateurs (admin) ----
  listAllUtilisateurs() {
    return this.request('GET', '/utilisateurs/list_all/');
  }

  toggleAdmin(id: string, estAdmin: boolean) {
    return this.request('PATCH', `/utilisateurs/${id}/toggle_admin/`, {
      est_admin: estAdmin,
    });
  }

  toggleActif(id: string, estActif: boolean) {
    return this.request('PATCH', `/utilisateurs/${id}/toggle_actif/`, {
      est_actif: estActif,
    });
  }

  changerMotDePasse(ancienMotDePasse: string, nouveauMotDePasse: string) {
    return this.request<{ message: string }>('POST', '/utilisateurs/changer_mot_de_passe/', {
      ancien_mot_de_passe: ancienMotDePasse,
      nouveau_mot_de_passe: nouveauMotDePasse,
    });
  }

  // ---- Paiements ----
  initiateMTNPayment(numero: string, phone: string) {
    return this.request<{ reference_id: string; status: string }>(
      'POST',
      '/paiements/mtn/initiate/',
      { numero, phone },
    );
  }

  initierPaiementCinetpay(numero: string) {
    return this.request<{ payment_url: string; transaction_id: string }>(
      'POST',
      '/paiements/cinetpay/initiate/',
      { numero },
    );
  }

  getStatutPaiementCinetpay(transactionId: string) {
    return this.request<{ statut: string; canal?: string }>(
      'GET',
      `/paiements/cinetpay/status/?transaction_id=${transactionId}`,
    );
  }

  // ---- Notifications ----
  getNotifications() {
    return this.request('GET', '/notifications/mes_notifications/');
  }

  getNotificationsUnreadCount() {
    return this.request<{ count: number }>('GET', '/notifications/non_lues_count/');
  }

  markNotificationRead(id: string) {
    return this.request('PATCH', `/notifications/${id}/marquer_lu/`);
  }

  markAllNotificationsRead() {
    return this.request('POST', '/notifications/marquer_tout_lu/');
  }

  registerFcmToken(fcmToken: string) {
    return this.request('POST', '/utilisateurs/register_fcm_token/', { fcm_token: fcmToken });
  }

  exporterMesDonnees() {
    return this.request<Record<string, unknown>>('GET', '/utilisateurs/exporter_donnees/');
  }

  // ---- Newsletter ----
  inscrireNewsletter(email: string) {
    return this.request('POST', '/newsletter/inscrire/', { email });
  }

  getAbonnesNewsletter() {
    return this.request('GET', '/newsletter/abonnes/');
  }

  envoyerCampagneNewsletter(sujet: string, message: string) {
    return this.request<{ message: string; total: number }>(
      'POST',
      '/newsletter/envoyer_campagne/',
      { sujet, message },
    );
  }

  rechercherAbonnesNewsletter(recherche: string) {
    const query = recherche ? `?q=${encodeURIComponent(recherche)}` : '';
    return this.request(`GET`, `/newsletter/abonnes/${query}`);
  }

  exporterAbonnesNewsletter() {
    return this.request<string>('GET', '/newsletter/export/');
  }

  desinscrireNewsletter(token: string) {
    return this.request<{ message: string }>('POST', '/newsletter/desinscrire/', { token });
  }

  // ---- Google Sign-In ----
  connexionGoogle(idToken: string) {
    return this.request<{
      access?: string;
      refresh?: string;
      utilisateur?: unknown;
      compte_cree?: boolean;
      message?: string;
    }>(
      'POST',
      '/auth/google/',
      { id_token: idToken },
    );
  }

  // ---- Paramètres boutique ----
  getFraisLivraison() {
    return this.request<{ frais_livraison: string; date_modification: string }>(
      'GET',
      '/parametres/livraison/',
    );
  }

  updateFraisLivraison(fraisLivraison: number) {
    return this.request('PATCH', '/parametres/livraison/', { frais_livraison: fraisLivraison });
  }

  // ---- Numéros Mobile Money ----
  getNumerosPaiement() {
    return this.request('GET', '/numeros-paiement/');
  }

  createNumeroPaiement(data: { operateur: string; numero: string; nom_beneficiaire: string; actif?: boolean }) {
    return this.request('POST', '/numeros-paiement/', data);
  }

  updateNumeroPaiement(id: string, data: Partial<{ operateur: string; numero: string; nom_beneficiaire: string; actif: boolean }>) {
    return this.request('PATCH', `/numeros-paiement/${id}/`, data);
  }

  deleteNumeroPaiement(id: string) {
    return this.request('DELETE', `/numeros-paiement/${id}/`);
  }
}

const apiService = new ApiService();
export default apiService;
