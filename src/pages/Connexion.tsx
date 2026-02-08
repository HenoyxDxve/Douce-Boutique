import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
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
    // Rediriger les admins vers le dashboard
    if (estAdmin) {
      setTimeout(() => {
        window.location.href = 'http://localhost:8000/admin';
      }, 500);
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-lg">Redirection vers le tableau de bord admin...</p>
          </div>
        </div>
      );
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
      await connexion(email, motDePasse);
      toast.success('Connexion réussie! 🎉');
      
      // Petite pause avant redirection
      setTimeout(() => {
        const from = location.state?.from?.pathname || '/';
        navigate(from);
      }, 500);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setErreur(message);
      toast.error(message);
    } finally {
      setChargement(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
          👤 Connexion
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Accédez à votre compte Douce Boutique
        </p>

        {erreur && (
          <Alert className="mb-4 bg-red-50 border-red-200">
            <AlertDescription className="text-red-800">{erreur}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mot de passe
            </label>
            <Input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              required
              disabled={chargement}
            />
          </div>

          <Button
            type="submit"
            disabled={chargement || !email || !motDePasse}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold py-2 rounded-lg transition"
          >
            {chargement ? 'Connexion en cours...' : 'Se connecter'}
          </Button>
        </form>

        <div className="mt-6 space-y-3 text-sm">
          <p className="text-center text-gray-600">
            Vous n'avez pas de compte?{' '}
            <button
              onClick={() => navigate('/inscription')}
              className="text-pink-600 hover:text-pink-700 font-semibold"
            >
              S'inscrire
            </button>
          </p>
          <p className="text-center">
            <button
              onClick={() => navigate('/mot-de-passe-oublie')}
              className="text-purple-600 hover:text-purple-700 font-semibold"
            >
              Mot de passe oublié?
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
