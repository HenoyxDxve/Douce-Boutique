import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePanier } from '@/contexts/PanierContext';
import { formaterPrix } from '@/data/produits';
import { toast } from 'sonner';
import apiService from '@/lib/api';
import PaymentModal from '@/components/PaymentModal';
import { useState } from 'react';

const Panier: React.FC = () => {
  const navigate = useNavigate();
  const { articles, retirerDuPanier, modifierQuantite, totalPanier, nombreArticles, viderPanier } = usePanier();
  const [modalOpen, setModalOpen] = useState(false);

  const fraisLivraison = totalPanier >= 50000 ? 0 : 2500;
  const totalCommande = totalPanier + fraisLivraison;

  if (articles.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="text-center animate-fade-in">
          <div className="w-24 h-24 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag size={40} className="text-muted-foreground" />
          </div>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-3">
            Votre panier est vide
          </h1>
          <p className="text-muted-foreground mb-8 max-w-md">
            Découvrez nos collections et ajoutez vos articles préférés à votre panier.
          </p>
          <Link to="/catalogue">
            <Button className="btn-primary">
              Découvrir la boutique
              <ArrowRight className="ml-2" size={18} />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ChevronLeft size={20} />
            Continuer mes achats
          </button>
          <h1 className="text-3xl md:text-4xl font-serif text-foreground">
            Mon Panier
            <span className="text-primary ml-2">({nombreArticles})</span>
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des articles */}
          <div className="lg:col-span-2 space-y-4">
            {articles.map((article) => (
              <div
                key={`${article.produit.id}-${article.taille}-${article.couleur}`}
                className="bg-card rounded-2xl p-4 md:p-6 shadow-soft flex gap-4 animate-fade-in"
              >
                {/* Image */}
                <Link
                  to={`/produit/${article.produit.id}`}
                  className="w-24 h-32 md:w-32 md:h-40 flex-shrink-0 bg-cream rounded-xl overflow-hidden"
                >
                  <img
                    src={article.produit.images[0]}
                    alt={article.produit.nom}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </Link>

                {/* Détails */}
                <div className="flex-1 flex flex-col">
                  <div className="flex-1">
                    <Link
                      to={`/produit/${article.produit.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors line-clamp-2"
                    >
                      {article.produit.nom}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">
                      {article.taille && `Taille: ${article.taille}`}
                      {article.taille && article.couleur && ' • '}
                      {article.couleur && `Couleur: ${article.couleur}`}
                    </p>
                    <p className="text-lg font-semibold text-primary mt-2">
                      {formaterPrix(article.produit.prix)}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between mt-4">
                    {/* Quantité */}
                    <div className="flex items-center border border-border rounded-full">
                      <button
                        onClick={() => modifierQuantite(article.produit.id, article.quantite - 1)}
                        className="p-2 hover:bg-secondary rounded-l-full transition-colors"
                        aria-label="Diminuer"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium">{article.quantite}</span>
                      <button
                        onClick={() => modifierQuantite(article.produit.id, article.quantite + 1)}
                        className="p-2 hover:bg-secondary rounded-r-full transition-colors"
                        aria-label="Augmenter"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    {/* Supprimer */}
                    <button
                      onClick={() => {
                        retirerDuPanier(article.produit.id);
                        toast.success('Article retiré du panier');
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                      aria-label="Supprimer"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Vider le panier */}
            <button
              onClick={() => {
                viderPanier();
                toast.success('Panier vidé');
              }}
              className="text-sm text-muted-foreground hover:text-destructive transition-colors"
            >
              Vider le panier
            </button>
          </div>

          {/* Récapitulatif */}
          <div className="lg:col-span-1">
            <div className="bg-card rounded-2xl p-6 shadow-card sticky top-28">
              <h2 className="text-xl font-semibold mb-6">Récapitulatif</h2>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span>{formaterPrix(totalPanier)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className={fraisLivraison === 0 ? 'text-green-600' : ''}>
                    {fraisLivraison === 0 ? 'Gratuite' : formaterPrix(fraisLivraison)}
                  </span>
                </div>
                {fraisLivraison > 0 && (
                  <p className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                    🎁 Plus que {formaterPrix(50000 - totalPanier)} pour la livraison gratuite !
                  </p>
                )}
                <div className="border-t border-border pt-4 flex justify-between">
                  <span className="font-semibold">Total</span>
                  <span className="text-xl font-bold text-primary">{formaterPrix(totalCommande)}</span>
                </div>
              </div>

              <Link to="/commande">
                <Button className="w-full btn-primary py-6 text-base mb-4">
                  Passer la commande
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>

              <Button className="w-full btn-secondary py-4 text-base mb-4" onClick={() => setModalOpen(true)}>
                Payer avec MTN
              </Button>

              <PaymentModal
                open={modalOpen}
                onOpenChange={setModalOpen}
                onConfirm={async ({ phone, adresse, ville, codePostal }) => {
                  try {
                    // Créer la commande d'abord
                    const createResp: any = await apiService.createCommande({
                      adresse_livraison: adresse || 'Adresse client',
                      ville_livraison: ville || 'Abidjan',
                      code_postal_livraison: codePostal || '00000',
                      pays_livraison: "Côte d'Ivoire",
                    });

                    const numero = createResp && createResp.numero;
                    if (!numero) {
                      toast.error('Impossible de créer la commande');
                      return;
                    }

                    toast.success('Commande créée, initiation du paiement MTN...');

                    const payResp: any = await apiService.initiateMTNPayment(numero, phone);
                    if (payResp && payResp.reference_id) {
                      toast.success('Paiement MTN initié — vérifiez votre téléphone');
                      navigate(`/commande?numero=${numero}`);
                    } else {
                      toast.error('Échec d initiation du paiement MTN');
                    }
                  } catch (err: any) {
                    toast.error(err?.message || 'Erreur lors du paiement');
                    console.error(err);
                  }
                }}
              />

              <p className="text-xs text-center text-muted-foreground">
                Paiement sécurisé via MTN, Orange, Moov, Wave ou carte bancaire
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Panier;
