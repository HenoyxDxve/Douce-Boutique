import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import BoutonGoogle from '@/components/BoutonGoogle';
import { toast } from 'sonner';

export default function Connexion() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connexion, estConnecte, estAdmin } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState('');

  if (estConnecte) {
    // Rediriger les admins vers le dashboard admin de l'application
    if (estAdmin) {
      navigate('/admin/dashboard');
      return null;
    }

    // Rediriger les clients normaux
    const from = location.state?.from?.pathname || '/';
    navigate(from);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChargement(true);
    setErreur('');

    try {
      const utilisateurConnecte = await connexion(email, motDePasse);
      toast.success('Connexion réussie! 🎉');

      if (utilisateurConnecte.est_admin) {
        navigate('/admin/dashboard');
      } else {
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setErreur(message);
      toast.error(message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-light to-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-card rounded-2xl shadow-hover p-8">
        <h1 className="text-3xl font-serif font-semibold text-center mb-2 gradient-text">
          Connexion
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Accédez à votre compte Douce Boutique
        </p>

        {erreur && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erreur}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              className="input-elegant"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Mot de passe
            </label>
            <Input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              disabled={chargement}
              className="input-elegant"
            />
          </div>

          <Button
            type="submit"
            disabled={chargement || !email || !motDePasse}
            className="w-full btn-primary py-6 text-base"
          >
            {chargement ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <BoutonGoogle />

        <div className="mt-6 space-y-3 text-sm">
          <p className="text-center text-muted-foreground">
            Vous n'avez pas de compte?{' '}
            <button
              onClick={() => navigate('/inscription')}
              className="text-primary hover:text-rose-dark font-semibold"
            >
              S'inscrire
            </button>
          </p>
          <p className="text-center">
            <button
              onClick={() => navigate('/mot-de-passe-oublie')}
              className="text-accent hover:opacity-80 font-semibold"
            >
              Mot de passe oublié?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
