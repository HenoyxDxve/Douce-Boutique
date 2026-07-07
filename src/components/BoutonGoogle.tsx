import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, CompteCreeError } from '@/contexts/AuthContext';
import { toast } from 'sonner';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

// .trim() : une variable d'environnement collée avec un espace ou un retour
// à la ligne parasite (copier-coller depuis Render, un éditeur...) produirait
// un client_id techniquement différent, que Google refuse avec "invalid_client".
const CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined)?.trim() || undefined;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function chargerScriptGoogle(): Promise<void> {
  if (window.google?.accounts?.id) return Promise.resolve();
  const existant = document.querySelector(`script[src="${SCRIPT_SRC}"]`);
  if (existant) {
    return new Promise((resolve) => existant.addEventListener('load', () => resolve()));
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Impossible de charger Google Sign-In'));
    document.head.appendChild(script);
  });
}

const BoutonGoogle: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { connexionGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!CLIENT_ID || !ref.current) return;

    let annule = false;

    chargerScriptGoogle()
      .then(() => {
        if (annule || !window.google || !ref.current) return;

        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (response: { credential: string }) => {
            try {
              const utilisateur = await connexionGoogle(response.credential);
              toast.success('Connexion réussie ! 🎉');
              if (utilisateur.est_admin) {
                navigate('/admin/dashboard');
              } else {
                const from = (location.state as any)?.from?.pathname || '/';
                navigate(from);
              }
            } catch (err) {
              if (err instanceof CompteCreeError) {
                toast.success('Compte créé ! Cliquez à nouveau sur "Se connecter avec Google" pour vous authentifier.');
              } else {
                toast.error(err instanceof Error ? err.message : 'Erreur lors de la connexion Google');
              }
            }
          },
        });
        window.google.accounts.id.renderButton(ref.current, {
          theme: 'outline',
          size: 'large',
          width: '100%',
        });
      })
      .catch(() => {/* silencieux : le bouton reste simplement absent */});

    return () => {
      annule = true;
    };
  }, [connexionGoogle, navigate, location]);

  if (!CLIENT_ID) return null;

  return (
    <div className="my-4">
      <div className="relative flex items-center py-2">
        <div className="flex-1 border-t border-border" />
        <span className="px-3 text-xs text-muted-foreground">ou</span>
        <div className="flex-1 border-t border-border" />
      </div>
      <div ref={ref} className="flex justify-center" />
    </div>
  );
};

export default BoutonGoogle;
