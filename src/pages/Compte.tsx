import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, Loader2, ChevronDown, ChevronRight, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api.ts';
import { formaterPrix } from '@/data/produits';
import { resolveImageUrl } from '@/lib/images';
import { validerNom, validerTelephoneIvoirien } from '@/lib/validation';
import ConfirmerDeconnexion from '@/components/ConfirmerDeconnexion';

const MODE_PAIEMENT_LABELS: Record<string, string> = {
  livraison: 'À la livraison',
  mobile_money_direct: 'Mobile Money direct',
  cinetpay: 'CinetPay (carte/MoMo)',
};

const STATUT_PAIEMENT_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  paye: 'Payé',
  echoue: 'Échoué',
};

const STATUT_LABEL: Record<string, string> = {
  en_attente: 'Reçue',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const STATUT_COULEUR: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  confirmee: 'bg-blue-100 text-blue-700',
  en_preparation: 'bg-purple-100 text-purple-700',
  en_livraison: 'bg-indigo-100 text-indigo-700',
  livree: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
};


interface LigneCommande {
  id: string;
  produit_nom: string;
  produit_image: string | null;
  quantite: number;
  prix_unitaire: number;
  taille?: string;
  couleur?: string;
}

interface Commande {
  id: string;
  numero: string;
  date_commande: string;
  prix_total: number;
  montant_produits?: number;
  frais_livraison?: number;
  statut: string;
  mode_paiement?: string;
  statut_paiement?: string;
  telephone_livraison?: string;
  adresse_livraison?: string;
  ville_livraison?: string;
  code_postal_livraison?: string;
  pays_livraison?: string;
  lignes?: LigneCommande[];
  articles_count?: number;
}

interface Favoris {
  id: string;
  produit: {
    id: string;
    nom: string;
    prix: number;
  };
  date_ajout: string;
}

const Compte: React.FC = () => {
  const navigate = useNavigate();
  const { utilisateur, estConnecte, deconnexion, mettreAJourProfil } = useAuth();
  const [ongletActif, setOngletActif] = useState('informations');
  const [chargement, setChargement] = useState(false);
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [favoris, setFavoris] = useState<Favoris[]>([]);
  const [chargementCommandes, setChargementCommandes] = useState(false);
  const [chargementFavoris, setChargementFavoris] = useState(false);
  const [chargementExport, setChargementExport] = useState(false);
  const [commandeOuverte, setCommandeOuverte] = useState<string | null>(null);
  const [erreur, setErreur] = useState('');

  const [motDePasseForm, setMotDePasseForm] = useState({
    ancien: '',
    nouveau: '',
    confirmation: '',
  });
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);

  const [formData, setFormData] = useState({
    prenom: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    code_postal: '',
  });

  // Charger les données utilisateur
  useEffect(() => {
    if (utilisateur) {
      setFormData({
        prenom: utilisateur.prenom || '',
        nom: utilisateur.nom || '',
        email: utilisateur.email || '',
        telephone: utilisateur.telephone || '',
        adresse: utilisateur.adresse || '',
        ville: utilisateur.ville || '',
        code_postal: utilisateur.code_postal || '',
      });
    }
  }, [utilisateur]);

  // Charger les commandes, puis rafraîchir en tâche de fond pour refléter
  // en quasi temps réel les changements de statut faits par l'admin.
  useEffect(() => {
    if (!estConnecte || ongletActif !== 'commandes') return;
    chargerCommandes();
    const interval = setInterval(() => chargerCommandes(true), 10000);
    return () => clearInterval(interval);
  }, [estConnecte, ongletActif]);

  // Charger les favoris
  useEffect(() => {
    if (estConnecte && ongletActif === 'favoris') {
      chargerFavoris();
    }
  }, [estConnecte, ongletActif]);

  const chargerCommandes = async (silencieux = false) => {
    if (!silencieux) setChargementCommandes(true);
    try {
      const data = await apiService.getCommandes();
      setCommandes(Array.isArray(data) ? data : []);
    } catch (err) {
      if (!silencieux) {
        console.error('Erreur chargement commandes:', err);
        setErreur('Erreur lors du chargement des commandes');
      }
    } finally {
      if (!silencieux) setChargementCommandes(false);
    }
  };

  const chargerFavoris = async () => {
    setChargementFavoris(true);
    try {
      const data = await apiService.getFavoris();
      setFavoris(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement favoris:', err);
      setErreur('Erreur lors du chargement des favoris');
    } finally {
      setChargementFavoris(false);
    }
  };

  // Écouter les changements de favoris pour rafraîchir la liste immédiatement
  useEffect(() => {
    const handler = (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail;
        if (!detail) return;
        // Si l'onglet favoris est actif, recharger
        if (ongletActif === 'favoris') {
          chargerFavoris();
        }
      } catch (err) {
        console.error('Erreur event favorisChanged:', err);
      }
    };

    window.addEventListener('favorisChanged', handler as EventListener);
    return () => window.removeEventListener('favorisChanged', handler as EventListener);
  }, [ongletActif]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    const erreurNom = validerNom(formData.nom) || validerNom(formData.prenom);
    if (erreurNom) {
      setErreur('Le nom et le prénom ne doivent contenir que des lettres');
      return;
    }
    if (formData.telephone) {
      const erreurTelephone = validerTelephoneIvoirien(formData.telephone);
      if (erreurTelephone) {
        setErreur(erreurTelephone);
        return;
      }
    }

    setChargement(true);

    try {
      await mettreAJourProfil({
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: formData.code_postal,
      });

      toast.success('Profil mis à jour ! ✅');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour';
      setErreur(message);
      toast.error(message);
    } finally {
      setChargement(false);
    }
  };

  const handleChangerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motDePasseForm.nouveau !== motDePasseForm.confirmation) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (motDePasseForm.nouveau.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setChargementMotDePasse(true);
    try {
      await apiService.changerMotDePasse(motDePasseForm.ancien, motDePasseForm.nouveau);
      toast.success('Mot de passe modifié avec succès ✅');
      setMotDePasseForm({ ancien: '', nouveau: '', confirmation: '' });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setChargementMotDePasse(false);
    }
  };

  const handleDeconnexion = () => {
    deconnexion();
    toast.success('Déconnexion réussie 👋');
    navigate('/');
  };

  const handleRemoveFavoris = async (produitId: string) => {
    try {
      await apiService.removeFromFavoris(produitId);
      setFavoris(favoris.filter((f) => f.produit.id !== produitId));
      toast.success('Retiré des favoris');
    } catch (err) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleExporterDonnees = async () => {
    setChargementExport(true);
    try {
      const donnees = await apiService.exporterMesDonnees();
      const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const lien = document.createElement('a');
      lien.href = url;
      lien.download = `mes-donnees-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(lien);
      lien.click();
      lien.remove();
      URL.revokeObjectURL(url);
      toast.success('Téléchargement lancé ✅');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'export');
    } finally {
      setChargementExport(false);
    }
  };

  // Redirection si non connecté
  if (!estConnecte) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-light to-cream flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">👤 Mon Compte</h1>
          <p className="text-gray-600 mb-8">Connectez-vous pour accéder à votre espace personnel</p>
          <Button
            onClick={() => navigate('/connexion')}
            className="bg-primary hover:bg-rose-dark"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-light to-cream py-8">
      <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">👤 Mon Compte</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Menu latéral */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                {/* Profil */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="w-12 h-12 bg-rose-light rounded-full flex items-center justify-center mb-3">
                    <User size={24} className="text-primary" />
                  </div>
                  <p className="font-semibold text-gray-900">
                    {utilisateur?.prenom} {utilisateur?.nom}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{utilisateur?.email}</p>
                </div>

                {/* Navigation */}
                <nav className="space-y-2">
                  <button
                    onClick={() => setOngletActif('informations')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      ongletActif === 'informations'
                        ? 'bg-rose-light text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <User size={18} />
                    Mes informations
                  </button>
                  <button
                    onClick={() => setOngletActif('commandes')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      ongletActif === 'commandes'
                        ? 'bg-rose-light text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Package size={18} />
                    Mes commandes
                  </button>
                  <button
                    onClick={() => setOngletActif('favoris')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      ongletActif === 'favoris'
                        ? 'bg-rose-light text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Heart size={18} />
                    Mes favoris
                  </button>
                  <button
                    onClick={() => setOngletActif('parametres')}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition ${
                      ongletActif === 'parametres'
                        ? 'bg-rose-light text-primary font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Settings size={18} />
                    Paramètres
                  </button>
                  <ConfirmerDeconnexion onConfirm={handleDeconnexion}>
                    <button
                      className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                    >
                      <LogOut size={18} />
                      Déconnexion
                    </button>
                  </ConfirmerDeconnexion>
                </nav>
              </div>
            </div>

            {/* Contenu principal */}
            <div className="md:col-span-3">
              {/* Mes informations */}
              {ongletActif === 'informations' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Mes informations</h2>

                  {erreur && (
                    <Alert className="mb-4 bg-red-50 border-red-200">
                      <AlertDescription className="text-red-800">{erreur}</AlertDescription>
                    </Alert>
                  )}

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input
                          id="prenom"
                          name="prenom"
                          value={formData.prenom}
                          onChange={handleInputChange}
                          disabled={chargement}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nom">Nom</Label>
                        <Input
                          id="nom"
                          name="nom"
                          value={formData.nom}
                          onChange={handleInputChange}
                          disabled={chargement}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        disabled
                        className="mt-1 bg-gray-100"
                      />
                      <p className="text-xs text-gray-500 mt-1">L'email ne peut pas être modifié</p>
                    </div>

                    <div>
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input
                        id="telephone"
                        name="telephone"
                        value={formData.telephone}
                        onChange={handleInputChange}
                        disabled={chargement}
                        placeholder="+225 07 00 00 00 00"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="adresse">Adresse de livraison</Label>
                      <Input
                        id="adresse"
                        name="adresse"
                        value={formData.adresse}
                        onChange={handleInputChange}
                        disabled={chargement}
                        placeholder="Cocody, Rue des Jardins, Lot 12"
                        className="mt-1"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="ville">Ville</Label>
                        <Input
                          id="ville"
                          name="ville"
                          value={formData.ville}
                          onChange={handleInputChange}
                          disabled={chargement}
                          placeholder="Abidjan"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="code_postal">Boîte postale</Label>
                        <Input
                          id="code_postal"
                          name="code_postal"
                          value={formData.code_postal}
                          onChange={handleInputChange}
                          disabled={chargement}
                          placeholder="01 BP 1234 Abidjan 01"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={chargement}
                      className="bg-primary hover:bg-rose-dark text-white w-full"
                    >
                      {chargement ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Enregistrement...
                        </>
                      ) : (
                        'Enregistrer les modifications'
                      )}
                    </Button>
                  </form>
                </div>
              )}

              {/* Mes commandes */}
              {ongletActif === 'commandes' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Mes commandes</h2>

                  {chargementCommandes ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                  ) : commandes.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-6">Vous n'avez pas encore de commandes</p>
                      <Button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-rose-dark"
                      >
                        Continuer vos achats
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commandes.map((commande) => {
                        const ouverte = commandeOuverte === commande.id;
                        return (
                          <div
                            key={commande.id}
                            className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
                          >
                            <button
                              type="button"
                              onClick={() => setCommandeOuverte(ouverte ? null : commande.id)}
                              className="w-full text-left p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                            >
                              <div className="flex items-center gap-2">
                                {ouverte ? <ChevronDown size={16} className="text-gray-400 shrink-0" /> : <ChevronRight size={16} className="text-gray-400 shrink-0" />}
                                <div>
                                  <p className="font-semibold text-gray-900">
                                    Commande #{commande.numero}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-lg text-primary">
                                  {formaterPrix(parseFloat(commande.prix_total.toString()))}
                                </p>
                                <span className={`text-sm px-3 py-1 rounded-full ${STATUT_COULEUR[commande.statut] || 'bg-yellow-100 text-yellow-700'}`}>
                                  {STATUT_LABEL[commande.statut] || commande.statut}
                                </span>
                              </div>
                            </button>

                            {ouverte && (
                              <div className="border-t border-gray-200 bg-gray-50 p-4 space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <p className="font-semibold text-gray-900 mb-1">Livraison</p>
                                    <p className="text-gray-600">
                                      {commande.telephone_livraison && <>📞 {commande.telephone_livraison}<br /></>}
                                      {commande.adresse_livraison}, {commande.ville_livraison}
                                      {commande.code_postal_livraison ? ` — ${commande.code_postal_livraison}` : ''}
                                    </p>
                                    <p className="text-gray-600 mt-1">
                                      {MODE_PAIEMENT_LABELS[commande.mode_paiement || ''] || commande.mode_paiement}
                                      {' · '}
                                      {STATUT_PAIEMENT_LABELS[commande.statut_paiement || ''] || commande.statut_paiement}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 mb-1">Montants</p>
                                    <div className="text-gray-600 space-y-0.5">
                                      {commande.montant_produits != null && (
                                        <div className="flex justify-between max-w-[220px]">
                                          <span>Sous-total produits</span>
                                          <span>{formaterPrix(parseFloat(commande.montant_produits.toString()))}</span>
                                        </div>
                                      )}
                                      {commande.frais_livraison != null && (
                                        <div className="flex justify-between max-w-[220px]">
                                          <span>Livraison</span>
                                          <span>{formaterPrix(parseFloat(commande.frais_livraison.toString()))}</span>
                                        </div>
                                      )}
                                      <div className="flex justify-between max-w-[220px] font-semibold text-gray-900">
                                        <span>Total</span>
                                        <span>{formaterPrix(parseFloat(commande.prix_total.toString()))}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {commande.lignes && commande.lignes.length > 0 && (
                                  <div>
                                    <p className="font-semibold text-gray-900 text-sm mb-2">Articles</p>
                                    <div className="space-y-2">
                                      {commande.lignes.map((ligne) => (
                                        <div key={ligne.id} className="flex items-center gap-3 text-sm bg-white rounded-lg p-2">
                                          <img
                                            src={resolveImageUrl(ligne.produit_image)}
                                            alt={ligne.produit_nom}
                                            className="w-10 h-12 object-cover rounded shrink-0"
                                          />
                                          <div className="flex-1">
                                            <p className="font-medium text-gray-900">{ligne.produit_nom}</p>
                                            <p className="text-gray-500 text-xs">
                                              Qté {ligne.quantite} × {formaterPrix(parseFloat(ligne.prix_unitaire.toString()))}
                                              {ligne.taille ? ` · ${ligne.taille}` : ''}
                                              {ligne.couleur ? ` · ${ligne.couleur}` : ''}
                                            </p>
                                          </div>
                                          <span className="font-semibold text-gray-900">
                                            {formaterPrix(parseFloat(ligne.prix_unitaire.toString()) * ligne.quantite)}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Mes favoris */}
              {ongletActif === 'favoris' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">Mes favoris</h2>

                  {chargementFavoris ? (
                    <div className="flex justify-center py-12">
                      <Loader2 size={32} className="animate-spin text-primary" />
                    </div>
                  ) : favoris.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-6">Vous n'avez pas encore d'articles en favoris</p>
                      <Button
                        onClick={() => navigate('/')}
                        className="bg-primary hover:bg-rose-dark"
                      >
                        Découvrir nos produits
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {favoris.map((fav) => (
                        <div
                          key={fav.id}
                          className="border border-gray-200 rounded-lg p-4 flex justify-between items-center"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{fav.produit.nom}</p>
                            <p className="text-lg text-primary font-bold">
                              {parseFloat(fav.produit.prix.toString()).toFixed(2)} €
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveFavoris(fav.produit.id)}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                          >
                            <Heart size={20} fill="currentColor" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Paramètres */}
              {ongletActif === 'parametres' && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h2 className="text-2xl font-bold mb-6 text-gray-900">⚙️ Paramètres</h2>

                  <div className="space-y-6">
                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Notifications par email</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Gérez vos préférences de notification
                      </p>
                      <div className="space-y-2">
                        <label className="flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="mr-3" />
                          <span className="text-gray-700">Commandes et expédition</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked className="mr-3" />
                          <span className="text-gray-700">Promotions et offres spéciales</span>
                        </label>
                        <label className="flex items-center cursor-pointer">
                          <input type="checkbox" className="mr-3" />
                          <span className="text-gray-700">Newsletter</span>
                        </label>
                      </div>
                    </div>

                    <div className="pb-6 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2">Sécurité</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Modifiez votre mot de passe
                      </p>
                      <form onSubmit={handleChangerMotDePasse} className="space-y-3 max-w-sm">
                        <div>
                          <Label htmlFor="ancien_mdp">Mot de passe actuel</Label>
                          <Input
                            id="ancien_mdp"
                            type="password"
                            value={motDePasseForm.ancien}
                            onChange={(e) => setMotDePasseForm((p) => ({ ...p, ancien: e.target.value }))}
                            disabled={chargementMotDePasse}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="nouveau_mdp">Nouveau mot de passe</Label>
                          <Input
                            id="nouveau_mdp"
                            type="password"
                            value={motDePasseForm.nouveau}
                            onChange={(e) => setMotDePasseForm((p) => ({ ...p, nouveau: e.target.value }))}
                            placeholder="Minimum 8 caractères"
                            disabled={chargementMotDePasse}
                            required
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmation_mdp">Confirmer le nouveau mot de passe</Label>
                          <Input
                            id="confirmation_mdp"
                            type="password"
                            value={motDePasseForm.confirmation}
                            onChange={(e) => setMotDePasseForm((p) => ({ ...p, confirmation: e.target.value }))}
                            disabled={chargementMotDePasse}
                            required
                            className="mt-1"
                          />
                        </div>
                        <Button
                          type="submit"
                          disabled={chargementMotDePasse}
                          className="bg-primary hover:bg-rose-dark text-white"
                        >
                          {chargementMotDePasse ? 'Modification...' : 'Changer mon mot de passe'}
                        </Button>
                      </form>
                      <button
                        onClick={() => navigate('/mot-de-passe-oublie')}
                        className="text-xs text-muted-foreground hover:text-primary mt-3 underline"
                      >
                        Mot de passe oublié ?
                      </button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Données personnelles</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Gérez vos données
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        className="border-gray-300"
                        onClick={handleExporterDonnees}
                        disabled={chargementExport}
                      >
                        {chargementExport ? (
                          <Loader2 size={16} className="mr-2 animate-spin" />
                        ) : (
                          <Download size={16} className="mr-2" />
                        )}
                        Télécharger mes données
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

export default Compte;
