import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  CheckCircle,
  Package,
  Truck,
  ArrowRight,
  Loader2,
  MapPin,
  Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';

const statutLabel: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  expedie: 'Expédiée',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const statutCouleur: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  confirmee: 'bg-green-100 text-green-700',
  expedie: 'bg-blue-100 text-blue-700',
  livree: 'bg-emerald-100 text-emerald-700',
  annulee: 'bg-red-100 text-red-700',
};

const Confirmation: React.FC = () => {
  const [searchParams] = useSearchParams();
  const numero = searchParams.get('numero');
  const [commande, setCommande] = useState<any>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!numero) {
      setChargement(false);
      return;
    }
    apiService
      .getCommande(numero)
      .then((data) => setCommande(data))
      .catch(() => {/* silencieux */})
      .finally(() => setChargement(false));
  }, [numero]);

  if (chargement) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Succès */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={44} className="text-green-600" />
          </div>
          <h1 className="text-3xl font-serif font-semibold mb-2">
            Commande confirmée !
          </h1>
          <p className="text-muted-foreground">
            Merci pour votre achat. Nous préparons votre commande.
          </p>
          {commande?.numero && (
            <p className="mt-2 text-sm font-mono bg-secondary inline-block px-3 py-1 rounded-full">
              #{commande.numero}
            </p>
          )}
        </div>

        {commande ? (
          <div className="bg-card rounded-2xl shadow-soft overflow-hidden mb-6">
            {/* Statut */}
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar size={16} />
                {new Date(commande.date_commande).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
              <span
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  statutCouleur[commande.statut] || 'bg-gray-100 text-gray-700'
                }`}
              >
                {statutLabel[commande.statut] || commande.statut}
              </span>
            </div>

            {/* Articles */}
            {commande.lignes?.length > 0 && (
              <div className="p-6 border-b border-border">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <Package size={18} className="text-primary" />
                  Articles commandés
                </h3>
                <div className="space-y-3">
                  {commande.lignes.map((ligne: any) => (
                    <div
                      key={ligne.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <p className="font-medium">{ligne.produit_nom || ligne.produit?.nom}</p>
                        <p className="text-muted-foreground text-xs">
                          Qté {ligne.quantite}
                          {ligne.taille ? ` · ${ligne.taille}` : ''}
                          {ligne.couleur ? ` · ${ligne.couleur}` : ''}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
                        {formaterPrix(
                          parseFloat(ligne.prix_unitaire) * ligne.quantite,
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Livraison */}
            {commande.adresse_livraison && (
              <div className="p-6 border-b border-border">
                <h3 className="font-medium mb-3 flex items-center gap-2">
                  <MapPin size={18} className="text-primary" />
                  Adresse de livraison
                </h3>
                <p className="text-sm text-muted-foreground">
                  {commande.adresse_livraison}, {commande.ville_livraison}
                  {commande.code_postal_livraison
                    ? ` ${commande.code_postal_livraison}`
                    : ''}
                  {commande.pays_livraison
                    ? ` — ${commande.pays_livraison}`
                    : ''}
                </p>
              </div>
            )}

            {/* Total */}
            <div className="p-6 flex justify-between items-center">
              <span className="font-semibold">Total payé</span>
              <span className="text-xl font-bold text-primary">
                {formaterPrix(parseFloat(commande.prix_total))}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl p-6 shadow-soft mb-6 text-center text-muted-foreground">
            <Truck size={40} className="mx-auto mb-3 text-primary" />
            <p>Votre commande est enregistrée et en cours de traitement.</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link to="/compte" className="flex-1">
            <Button variant="outline" className="w-full">
              Voir mes commandes
            </Button>
          </Link>
          <Link to="/catalogue" className="flex-1">
            <Button className="w-full btn-primary">
              Continuer mes achats
              <ArrowRight size={18} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Confirmation;
