import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import BoutonGoogle from '@/components/BoutonGoogle';
import { validerNom, validerTelephoneIvoirien, validerForceMotDePasse } from '@/lib/validation';
import { toast } from 'sonner';

export default function Inscription() {
  const navigate = useNavigate();
  const location = useLocation();
  const { inscription } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    motDePasse: '',
    confirmMotDePasse: '',
    nom: '',
    prenom: '',
    telephone: '',
    adresse: '',
    ville: '',
    codePostal: '',
  });
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');

    // Validations
    if (!formData.email || !formData.motDePasse || !formData.nom || !formData.prenom) {
      setErreur('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      setErreur('Les mots de passe ne correspondent pas');
      return;
    }

    const erreurMotDePasse = validerForceMotDePasse(formData.motDePasse);
    if (erreurMotDePasse) {
      setErreur(erreurMotDePasse);
      return;
    }

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
      await inscription({
        email: formData.email,
        mot_de_passe: formData.motDePasse,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.telephone,
        adresse: formData.adresse,
        ville: formData.ville,
        code_postal: formData.codePostal,
      });

      toast.success('Inscription réussie! 🎉 Veuillez vous connecter.');
      // Rediriger vers la page de connexion pour que l'utilisateur se connecte
      setTimeout(() => navigate('/connexion', { state: location.state }), 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      setErreur(message);
      toast.error(message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-light to-cream flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-hover p-8">
        <h1 className="text-3xl font-serif font-semibold text-center mb-2 gradient-text">
          Inscription
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Créez votre compte Douce Boutique
        </p>

        {erreur && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erreur}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nom et Prénom */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prénom *
              </label>
              <Input
                type="text"
                name="prenom"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Aya"
                required
                disabled={chargement}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nom *
              </label>
              <Input
                type="text"
                name="nom"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Kouassi"
                required
                disabled={chargement}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="votre@email.com"
              required
              disabled={chargement}
            />
          </div>

          {/* Mots de passe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mot de passe *
              </label>
              <Input
                type="password"
                name="motDePasse"
                value={formData.motDePasse}
                onChange={handleChange}
                placeholder="Min 8 caractères"
                required
                disabled={chargement}
              />
              <p className="text-xs text-gray-500 mt-1">
                8+ car., 1 majuscule, 1 chiffre
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmer *
              </label>
              <Input
                type="password"
                name="confirmMotDePasse"
                value={formData.confirmMotDePasse}
                onChange={handleChange}
                placeholder="Confirmer"
                required
                disabled={chargement}
              />
            </div>
          </div>

          {/* Adresse (optionnel) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Adresse
            </label>
            <Input
              type="text"
              name="adresse"
              value={formData.adresse}
              onChange={handleChange}
              placeholder="Cocody, Rue des Jardins, Lot 12"
              disabled={chargement}
            />
          </div>

          {/* Ville et Boîte postale */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ville
              </label>
              <Input
                type="text"
                name="ville"
                value={formData.ville}
                onChange={handleChange}
                placeholder="Abidjan"
                disabled={chargement}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Boîte postale
              </label>
              <Input
                type="text"
                name="codePostal"
                value={formData.codePostal}
                onChange={handleChange}
                placeholder="01 BP 1234 Abidjan 01"
                disabled={chargement}
              />
            </div>
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Téléphone
            </label>
            <Input
              type="tel"
              name="telephone"
              value={formData.telephone}
              onChange={handleChange}
              placeholder="+225 07 08 11 22 33"
              disabled={chargement}
            />
          </div>

          <p className="text-xs text-gray-500 mt-2">
            * Champs obligatoires
          </p>

          <Button
            type="submit"
            disabled={chargement}
            className="w-full btn-primary py-6 text-base mt-4"
          >
            {chargement ? 'Inscription en cours...' : 'S\'inscrire'}
          </Button>
        </form>

        <BoutonGoogle />

        <p className="text-center text-sm text-muted-foreground mt-4">
          Vous avez déjà un compte?{' '}
          <button
            onClick={() => navigate('/connexion', { state: location.state })}
            className="text-primary hover:text-rose-dark font-semibold"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
