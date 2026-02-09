import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiService from '@/lib/api.ts';

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'reset'>('email');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [message, setMessage] = useState('');
  const [erreur, setErreur] = useState('');

  const handleDemandReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    setMessage('');

    try {
      const response = await apiService.motDePasseOublie(email);
      setToken(response.token);
      setMessage('Un email avec un lien de réinitialisation a été envoyé');
      setStep('reset');
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la demande');
    } finally {
      setChargement(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');
    setMessage('');

    // Validations
    if (nouveauMotDePasse.length < 8) {
      setErreur('Le mot de passe doit contenir au moins 8 caractères');
      setChargement(false);
      return;
    }
    if (!/[A-Z]/.test(nouveauMotDePasse)) {
      setErreur('Le mot de passe doit contenir au moins une majuscule');
      setChargement(false);
      return;
    }
    if (!/[0-9]/.test(nouveauMotDePasse)) {
      setErreur('Le mot de passe doit contenir au moins un chiffre');
      setChargement(false);
      return;
    }

    try {
      await apiService.reinitialiserMotDePasse(token, nouveauMotDePasse);
      setMessage('Mot de passe réinitialisé avec succès! Redirection...');
      setTimeout(() => navigate('/connexion'), 2000);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          🔐 Réinitialiser
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Récupérez l'accès à votre compte
        </p>

        {message && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        )}

        {erreur && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erreur}</AlertDescription>
          </Alert>
        )}

        {step === 'email' ? (
          <form onSubmit={handleDemandReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
                disabled={chargement}
              />
            </div>

            <Button
              type="submit"
              disabled={chargement || !email}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition"
            >
              {chargement ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nouveau mot de passe
              </label>
              <Input
                type="password"
                value={nouveauMotDePasse}
                onChange={(e) => setNouveauMotDePasse(e.target.value)}
                placeholder="Minimum 8 caractères"
                required
                disabled={chargement}
              />
              <p className="text-xs text-gray-500 mt-1">
                ✓ Au moins 8 caractères
                <br />
                ✓ Au moins une majuscule
                <br />
                ✓ Au moins un chiffre
              </p>
            </div>

            <Button
              type="submit"
              disabled={chargement || !nouveauMotDePasse}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition"
            >
              {chargement ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-gray-600 mt-4">
          Vous vous souvenez de votre mot de passe?{' '}
          <button
            onClick={() => navigate('/connexion')}
            className="text-pink-600 hover:text-pink-700 font-semibold"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
