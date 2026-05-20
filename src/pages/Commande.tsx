import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft,
  Truck,
  CreditCard,
  Smartphone,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePanier } from '@/contexts/PanierContext';
import { useAuth } from '@/contexts/AuthContext';
import { formaterPrix } from '@/data/produits';
import apiService from '@/lib/api';
import { toast } from 'sonner';

type ModePaiement = 'livraison' | 'mtn' | 'orange' | 'wave';

const Commande: React.FC = () => {
  const navigate = useNavigate();
  const { articles, totalPanier, viderPanier, nombreArticles } = usePanier();
  const { utilisateur, estConnecte } = useAuth();

  const fraisLivraison = totalPanier >= 50000 ? 0 : 2500;
  const totalCommande = totalPanier + fraisLivraison;

  const [modePaiement, setModePaiement] = useState<ModePaiement>('livraison');
  const [telephonePaiement, setTelephonePaiement] = useState(
    utilisateur?.telephone || '',
  );
  const [chargement, setChargement] = useState(false);

  const [adresse, setAdresse] = useState({
    adresse_livraison: utilisateur?.adresse || '',
    ville_livraison: utilisateur?.ville || '',
    code_postal_livraison: utilisateur?.code_postal || '',
    pays_livraison: "Côte d'Ivoire",
    notes: '',
  });

  if (!estConnecte) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-4">Connexion requise</h1>
          <p className="text-muted-foreground mb-6">
            Veuillez vous connecter pour passer une commande.
          </p>
          <Link to="/connexion">
            <Button className="btn-primary">Se connecter</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-serif mb-4">Votre panier est vide</h1>
          <Link to="/catalogue">
            <Button className="btn-primary">Découvrir la boutique</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adresse.adresse_livraison || !adresse.ville_livraison) {
      toast.error('Veuillez renseigner votre adresse de livraison');
      return;
    }
    if (
      (modePaiement === 'mtn' ||
        modePaiement === 'orange' ||
        modePaiement === 'wave') &&
      !telephonePaiement
    ) {
      toast.error('Veuillez saisir votre numéro de téléphone');
      return;
    }

    setChargement(true);
    try {
      const items = articles.map((a) => ({
        produit_id: a.produit.id,
        quantite: a.quantite,
        taille: a.taille,
        couleur: a.couleur,
        prix_unitaire: a.produit.prix,
        nom: a.produit.nom,
      }));

      const commande: any = await apiService.createCommandeFromItems({
        items,
        ...adresse,
        mode_paiement: modePaiement,
      });

      if (!commande?.numero) {
        toast.error('Erreur lors de la création de la commande');
        return;
      }

      toast.success('Commande créée !');

      if (
        modePaiement === 'mtn' ||
        modePaiement === 'orange' ||
        modePaiement === 'wave'
      ) {
        try {
          const paiement: any = await apiService.initiateMTNPayment(
            commande.numero,
            telephonePaiement,
          );
          if (paiement?.reference_id) {
            toast.success('Paiement initié — vérifiez votre téléphone 📱');
          }
        } catch {
          toast.error(
            'Commande créée mais paiement mobile non initié. Contactez-nous.',
          );
        }
      }

      viderPanier();
      navigate(`/confirmation?numero=${commande.numero}`);
    } catch (err: any) {
      toast.error(err?.message || 'Erreur lors de la commande');
    } finally {
      setChargement(false);
    }
  };

  const modesDisponibles: {
    id: ModePaiement;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: 'livraison',
      label: 'Paiement à la livraison',
      description: 'Payez en espèces à la réception',
      icon: <Truck size={22} />,
    },
    {
      id: 'mtn',
      label: 'MTN Mobile Money',
      description: 'Paiement via MTN MoMo',
      icon: <Smartphone size={22} className="text-yellow-500" />,
    },
    {
      id: 'orange',
      label: 'Orange Money',
      description: 'Paiement via Orange Money',
      icon: <Smartphone size={22} className="text-orange-500" />,
    },
    {
      id: 'wave',
      label: 'Wave',
      description: 'Paiement via Wave',
      icon: <CreditCard size={22} className="text-blue-500" />,
    },
  ];

  const necessitePhone =
    modePaiement === 'mtn' ||
    modePaiement === 'orange' ||
    modePaiement === 'wave';

  return (
    <div className="min-h-screen py-8 bg-secondary/30">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* En-tête */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/panier')}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft size={20} />
            Retour au panier
          </button>
          <h1 className="text-3xl font-serif">Finaliser la commande</h1>
          <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
            <Lock size={14} />
            <span>Paiement sécurisé</span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Formulaire gauche */}
            <div className="lg:col-span-3 space-y-6">
              {/* Adresse de livraison */}
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                  <Truck size={20} className="text-primary" />
                  Adresse de livraison
                </h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input
                      id="adresse"
                      value={adresse.adresse_livraison}
                      onChange={(e) =>
                        setAdresse((p) => ({
                          ...p,
                          adresse_livraison: e.target.value,
                        }))
                      }
                      placeholder="123 Rue de la Paix"
                      required
                      className="mt-1"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ville">Ville</Label>
                      <Input
                        id="ville"
                        value={adresse.ville_livraison}
                        onChange={(e) =>
                          setAdresse((p) => ({
                            ...p,
                            ville_livraison: e.target.value,
                          }))
                        }
                        placeholder="Abidjan"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="cp">Code postal</Label>
                      <Input
                        id="cp"
                        value={adresse.code_postal_livraison}
                        onChange={(e) =>
                          setAdresse((p) => ({
                            ...p,
                            code_postal_livraison: e.target.value,
                          }))
                        }
                        placeholder="00000"
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pays">Pays</Label>
                    <Input
                      id="pays"
                      value={adresse.pays_livraison}
                      onChange={(e) =>
                        setAdresse((p) => ({
                          ...p,
                          pays_livraison: e.target.value,
                        }))
                      }
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes (optionnel)</Label>
                    <Input
                      id="notes"
                      value={adresse.notes}
                      onChange={(e) =>
                        setAdresse((p) => ({ ...p, notes: e.target.value }))
                      }
                      placeholder="Instructions spéciales pour la livraison..."
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>

              {/* Mode de paiement */}
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-primary" />
                  Mode de paiement
                </h2>
                <div className="space-y-3">
                  {modesDisponibles.map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setModePaiement(mode.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                        modePaiement === mode.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          modePaiement === mode.id
                            ? 'border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {modePaiement === mode.id && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                        )}
                      </div>
                      <div className="flex-shrink-0 text-primary">
                        {mode.icon}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{mode.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {mode.description}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Numéro de téléphone mobile money */}
                {necessitePhone && (
                  <div className="mt-4 p-4 bg-secondary/50 rounded-xl">
                    <Label htmlFor="telephone">
                      Numéro{' '}
                      {modePaiement === 'mtn'
                        ? 'MTN'
                        : modePaiement === 'orange'
                          ? 'Orange'
                          : 'Wave'}
                    </Label>
                    <Input
                      id="telephone"
                      type="tel"
                      value={telephonePaiement}
                      onChange={(e) => setTelephonePaiement(e.target.value)}
                      placeholder="+225 07 00 00 00 00"
                      required
                      className="mt-1"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Vous recevrez une demande de confirmation sur ce numéro.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Récapitulatif droite */}
            <div className="lg:col-span-2">
              <div className="bg-card rounded-2xl p-6 shadow-card sticky top-28">
                <h2 className="text-lg font-semibold mb-5">
                  Récapitulatif ({nombreArticles} article
                  {nombreArticles > 1 ? 's' : ''})
                </h2>

                {/* Articles */}
                <div className="space-y-3 mb-5 max-h-64 overflow-y-auto pr-1">
                  {articles.map((a) => (
                    <div
                      key={`${a.produit.id}-${a.taille}-${a.couleur}`}
                      className="flex gap-3"
                    >
                      <div className="w-12 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-cream">
                        <img
                          src={a.produit.images[0]}
                          alt={a.produit.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">
                          {a.produit.nom}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Qté {a.quantite}
                          {a.taille ? ` · ${a.taille}` : ''}
                          {a.couleur ? ` · ${a.couleur}` : ''}
                        </p>
                        <p className="text-sm font-semibold text-primary">
                          {formaterPrix(a.produit.prix * a.quantite)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totaux */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span>{formaterPrix(totalPanier)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span
                      className={fraisLivraison === 0 ? 'text-green-600' : ''}
                    >
                      {fraisLivraison === 0
                        ? 'Gratuite'
                        : formaterPrix(fraisLivraison)}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">
                      {formaterPrix(totalCommande)}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={chargement}
                  className="w-full btn-primary py-6 text-base mt-6"
                >
                  {chargement ? (
                    <>
                      <Loader2 size={18} className="mr-2 animate-spin" />
                      Traitement...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={18} className="mr-2" />
                      Confirmer la commande
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                  <Lock size={12} />
                  Paiement sécurisé et données protégées
                </p>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Commande;
