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
}

export function ProtectionConnexion({
  open,
  onOpenChange,
  action,
}: ProtectionConnexionProps) {
  const navigate = useNavigate();

  const handleInscription = () => {
    navigate('/compte');
    onOpenChange(false);
  };

  const handleConnexion = () => {
    navigate('/connexion');
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
              className="flex-1 bg-pink-600 hover:bg-pink-700"
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
