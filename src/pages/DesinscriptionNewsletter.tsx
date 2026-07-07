import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiService from '@/lib/api';

export default function DesinscriptionNewsletter() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [statut, setStatut] = useState<'chargement' | 'succes' | 'erreur'>('chargement');

  useEffect(() => {
    if (!token) {
      setStatut('erreur');
      return;
    }
    apiService
      .desinscrireNewsletter(token)
      .then(() => setStatut('succes'))
      .catch(() => setStatut('erreur'));
  }, [token]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center animate-fade-in max-w-md">
        {statut === 'chargement' && (
          <Loader2 size={40} className="animate-spin text-primary mx-auto mb-4" />
        )}
        {statut === 'succes' && (
          <>
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={40} className="text-green-600" />
            </div>
            <h1 className="text-2xl font-serif mb-3">Désinscription réussie</h1>
            <p className="text-muted-foreground mb-6">
              Vous ne recevrez plus nos emails de newsletter. Vous pouvez vous réinscrire à tout moment depuis notre site.
            </p>
          </>
        )}
        {statut === 'erreur' && (
          <>
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle size={40} className="text-red-400" />
            </div>
            <h1 className="text-2xl font-serif mb-3">Lien invalide</h1>
            <p className="text-muted-foreground mb-6">
              Ce lien de désinscription est invalide ou a déjà été utilisé.
            </p>
          </>
        )}
        <Link to="/">
          <Button className="btn-primary">Retour à la boutique</Button>
        </Link>
      </div>
    </div>
  );
}
