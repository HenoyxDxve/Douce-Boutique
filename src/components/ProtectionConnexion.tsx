import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProtectionConnexionProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: string;
  from?: string;
}

export function ProtectionConnexion({
  open,
  onOpenChange,
  action,
  from,
}: ProtectionConnexionProps) {
  const navigate = useNavigate();
  const state = from ? { from: { pathname: from } } : undefined;

  const handleInscription = () => {
    navigate('/inscription', { state });
    onOpenChange(false);
  };

  const handleConnexion = () => {
    navigate('/connexion', { state });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl">🔐 Connexion requise</DialogTitle>
          <DialogDescription>
            Vous devez être connecté pour {action}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-700">
            Créez un compte ou connectez-vous pour continuer vos achats.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleConnexion}
              className="flex-1 bg-primary hover:bg-rose-dark"
            >
              Se connecter
            </Button>
            <Button
              onClick={handleInscription}
              variant="outline"
              className="flex-1"
            >
              S'inscrire
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
