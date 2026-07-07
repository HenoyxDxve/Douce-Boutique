import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import apiService from '@/lib/api.ts';

export default function MotDePasseOublie() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [demandeEnvoyee, setDemandeEnvoyee] = useState(false);
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
      await apiService.motDePasseOublie(email);
      setDemandeEnvoyee(true);
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
      await apiService.reinitialiserMotDePasse(token!, nouveauMotDePasse);
      setMessage('Mot de passe réinitialisé avec succès! Redirection...');
      setTimeout(() => navigate('/connexion'), 2000);
    } catch (err) {
      setErreur(err instanceof Error ? err.message : 'Erreur lors de la réinitialisation');
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-light to-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-hover p-8">
        <h1 className="text-3xl font-serif font-semibold text-center mb-2 gradient-text">
          Réinitialiser
        </h1>
        <p className="text-center text-muted-foreground mb-6">
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

        {token ? (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
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
              <p className="text-xs text-muted-foreground mt-1">
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
              className="w-full btn-primary py-6 text-base"
            >
              {chargement ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>
        ) : demandeEnvoyee ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground">
              Si un compte existe avec l'adresse <strong>{email}</strong>, un email contenant un lien de
              réinitialisation vient de vous être envoyé. Pensez à vérifier vos spams.
            </p>
          </div>
        ) : (
          <form onSubmit={handleDemandReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
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
              className="w-full btn-primary py-6 text-base"
            >
              {chargement ? 'Envoi en cours...' : 'Envoyer le lien'}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground mt-4">
          Vous vous souvenez de votre mot de passe?{' '}
          <button
            onClick={() => navigate('/connexion')}
            className="text-primary hover:text-rose-dark font-semibold"
          >
            Se connecter
          </button>
        </p>
      </div>
    </div>
  );
}
