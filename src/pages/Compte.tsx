import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';


interface Commande {
  id: string;
  numero: string;
  date_commande: string;
  prix_total: number;
  statut: string;
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
  const [erreur, setErreur] = useState('');

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

  // Charger les commandes
  useEffect(() => {
    if (estConnecte && ongletActif === 'commandes') {
      chargerCommandes();
    }
  }, [estConnecte, ongletActif]);

  // Charger les favoris
  useEffect(() => {
    if (estConnecte && ongletActif === 'favoris') {
      chargerFavoris();
    }
  }, [estConnecte, ongletActif]);

  const chargerCommandes = async () => {
    setChargementCommandes(true);
    try {
      const data = await apiService.getCommandes();
      setCommandes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Erreur chargement commandes:', err);
      setErreur('Erreur lors du chargement des commandes');
    } finally {
      setChargementCommandes(false);
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
    setChargement(true);
    setErreur('');

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

  // Redirection si non connecté
  if (!estConnecte) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center py-12">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">👤 Mon Compte</h1>
          <p className="text-gray-600 mb-8">Connectez-vous pour accéder à votre espace personnel</p>
          <Button
            onClick={() => navigate('/connexion')}
            className="bg-pink-600 hover:bg-pink-700"
          >
            Se connecter
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 py-8">
      <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-bold mb-8 text-gray-900">👤 Mon Compte</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Menu latéral */}
            <div className="md:col-span-1">
              <div className="bg-white rounded-lg shadow p-6 sticky top-6">
                {/* Profil */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center mb-3">
                    <User size={24} className="text-pink-600" />
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
                        ? 'bg-pink-100 text-pink-600 font-semibold'
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
                        ? 'bg-pink-100 text-pink-600 font-semibold'
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
                        ? 'bg-pink-100 text-pink-600 font-semibold'
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
                        ? 'bg-pink-100 text-pink-600 font-semibold'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <Settings size={18} />
                    Paramètres
                  </button>
                  <button
                    onClick={handleDeconnexion}
                    className="w-full flex items-center gap-3 p-3 rounded-lg text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut size={18} />
                    Déconnexion
                  </button>
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
                        placeholder="123 Rue de la Paix"
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
                          placeholder="Paris"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="code_postal">Code postal</Label>
                        <Input
                          id="code_postal"
                          name="code_postal"
                          value={formData.code_postal}
                          onChange={handleInputChange}
                          disabled={chargement}
                          placeholder="75000"
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={chargement}
                      className="bg-pink-600 hover:bg-pink-700 text-white w-full"
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
                      <Loader2 size={32} className="animate-spin text-pink-600" />
                    </div>
                  ) : commandes.length === 0 ? (
                    <div className="text-center py-12">
                      <Package size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-6">Vous n'avez pas encore de commandes</p>
                      <Button
                        onClick={() => navigate('/')}
                        className="bg-pink-600 hover:bg-pink-700"
                      >
                        Continuer vos achats
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {commandes.map((commande) => (
                        <div
                          key={commande.id}
                          className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
                        >
                          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                              <p className="font-semibold text-gray-900">
                                Commande #{commande.numero}
                              </p>
                              <p className="text-sm text-gray-600">
                                {new Date(commande.date_commande).toLocaleDateString('fr-FR')}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-bold text-lg text-pink-600">
                                {parseFloat(commande.prix_total.toString()).toFixed(2)} €
                              </p>
                              <span className={`text-sm px-3 py-1 rounded-full ${
                                commande.statut === 'Livrée'
                                  ? 'bg-green-100 text-green-700'
                                  : commande.statut === 'Expédiée'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-yellow-100 text-yellow-700'
                              }`}>
                                {commande.statut}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
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
                      <Loader2 size={32} className="animate-spin text-pink-600" />
                    </div>
                  ) : favoris.length === 0 ? (
                    <div className="text-center py-12">
                      <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                      <p className="text-gray-600 mb-6">Vous n'avez pas encore d'articles en favoris</p>
                      <Button
                        onClick={() => navigate('/')}
                        className="bg-pink-600 hover:bg-pink-700"
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
                            <p className="text-lg text-pink-600 font-bold">
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
                        Protégez votre compte
                      </p>
                      <Button
                        onClick={() => navigate('/mot-de-passe-oublie')}
                        className="bg-gray-600 hover:bg-gray-700 text-white"
                      >
                        Changer mon mot de passe
                      </Button>
                    </div>

                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Données personnelles</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Gérez vos données
                      </p>
                      <Button variant="outline" className="border-gray-300">
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
