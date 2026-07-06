import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '@/lib/api.ts';

export interface Utilisateur {
  id: string;
  email: string;
  nom: string;
  prenom: string;
  nom_complet: string;
  telephone: string;
  adresse: string;
  ville: string;
  code_postal: string;
  pays: string;
  est_actif: boolean;
  est_admin?: boolean;
  date_inscription: string;
}

interface ContexteAuthType {
  utilisateur: Utilisateur | null;
  estConnecte: boolean;
  estAdmin: boolean;
  chargement: boolean;
  erreur: string | null;
  inscription: (data: unknown) => Promise<any>;
  connexion: (email: string, motDePasse: string) => Promise<Utilisateur>;
  connexionGoogle: (idToken: string) => Promise<Utilisateur>;
  deconnexion: () => void;
  mettreAJourProfil: (data: unknown) => Promise<void>;
}

const ContexteAuth = createContext<ContexteAuthType | undefined>(undefined);

export const ProviderAuth: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [utilisateur, setUtilisateur] = useState<Utilisateur | null>(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);

  // Charger l'utilisateur au montage du composant
  useEffect(() => {
    const chargerUtilisateur = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const response = await apiService.getUserProfile();
          if (response) {
            setUtilisateur(response as Utilisateur);
          }
        }
      } catch (err) {
        console.error('Erreur lors du chargement de l\'utilisateur:', err);
        apiService.clearTokens();
      } finally {
        setChargement(false);
      }
    };

    chargerUtilisateur();
  }, []);

  const inscription = async (data: unknown) => {
    try {
      setErreur(null);
      // Create account but do NOT auto-login: require explicit connexion
      const response = await apiService.inscription(data as Parameters<typeof apiService.inscription>[0]);
      // Do not store tokens here; user must log in via /connexion
      return response;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'inscription';
      setErreur(message);
      throw err;
    }
  };

  const connexion = async (email: string, motDePasse: string) => {
    try {
      setErreur(null);
      const response = await apiService.connexion(email, motDePasse);
      if (response.access && response.refresh && response.utilisateur) {
        apiService.setTokens(response.access, response.refresh);
        setUtilisateur(response.utilisateur as Utilisateur);
        return response.utilisateur as Utilisateur;
      }
      throw new Error('Réponse de connexion invalide');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion';
      setErreur(message);
      throw err;
    }
  };

  const connexionGoogle = async (idToken: string) => {
    try {
      setErreur(null);
      const response = await apiService.connexionGoogle(idToken);
      if (response.access && response.refresh && response.utilisateur) {
        apiService.setTokens(response.access, response.refresh);
        setUtilisateur(response.utilisateur as Utilisateur);
        return response.utilisateur as Utilisateur;
      }
      throw new Error('Réponse de connexion Google invalide');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la connexion Google';
      setErreur(message);
      throw err;
    }
  };

  const deconnexion = () => {
    setUtilisateur(null);
    apiService.clearTokens();
    setErreur(null);
  };

  const mettreAJourProfil = async (data: unknown) => {
    try {
      setErreur(null);
      const response = await apiService.updateUserProfile(data as Parameters<typeof apiService.updateUserProfile>[0]);
      if (response) {
        setUtilisateur(response as Utilisateur);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du profil';
      setErreur(message);
      throw err;
    }
  };

  const estAdmin = utilisateur?.est_admin ?? false;

  const value: ContexteAuthType = {
    utilisateur,
    estConnecte: utilisateur !== null,
    estAdmin,
    chargement,
    erreur,
    inscription,
    connexion,
    connexionGoogle,
    deconnexion,
    mettreAJourProfil,
  };

  return (
    <ContexteAuth.Provider value={value}>
      {children}
    </ContexteAuth.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(ContexteAuth);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans un ProviderAuth');
  }
  return context;
};
