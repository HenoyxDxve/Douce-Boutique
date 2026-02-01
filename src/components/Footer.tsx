import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Instagram, Facebook, Twitter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');

  const gererInscriptionNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success('Merci pour votre inscription ! 💕', {
        description: 'Vous recevrez bientôt nos offres exclusives.',
      });
      setEmail('');
    }
  };

  return (
    <footer className="bg-foreground text-background mt-auto">
      {/* Newsletter */}
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4 text-center">
          <h3 className="text-2xl md:text-3xl font-serif text-primary-foreground mb-3">
            Rejoignez notre communauté
          </h3>
          <p className="text-primary-foreground/90 mb-6 max-w-md mx-auto">
            Inscrivez-vous pour recevoir nos offres exclusives et les dernières tendances.
          </p>
          <form onSubmit={gererInscriptionNewsletter} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Votre adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-background/90 border-0 text-foreground placeholder:text-muted-foreground"
              required
            />
            <Button type="submit" className="bg-foreground text-background hover:bg-foreground/90 rounded-full px-8">
              S'inscrire
            </Button>
          </form>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h4 className="text-xl font-serif mb-4">
              <span className="text-primary">Belle</span>Boutique
            </h4>
            <p className="text-background/70 text-sm leading-relaxed mb-4">
              Votre destination mode pour des pièces élégantes et intemporelles.
              Qualité premium et style unique pour sublimer votre féminité.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="p-2 bg-background/10 rounded-full hover:bg-primary transition-colors" aria-label="Instagram">
                <Instagram size={18} />
              </a>
              <a href="#" className="p-2 bg-background/10 rounded-full hover:bg-primary transition-colors" aria-label="Facebook">
                <Facebook size={18} />
              </a>
              <a href="#" className="p-2 bg-background/10 rounded-full hover:bg-primary transition-colors" aria-label="Twitter">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-semibold mb-4">Boutique</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/catalogue" className="hover:text-primary transition-colors">Tous les produits</Link></li>
              <li><Link to="/nouveautes" className="hover:text-primary transition-colors">Nouveautés</Link></li>
              <li><Link to="/promotions" className="hover:text-primary transition-colors">Promotions</Link></li>
              <li><Link to="/catalogue?categorie=robes" className="hover:text-primary transition-colors">Robes</Link></li>
              <li><Link to="/catalogue?categorie=accessoires" className="hover:text-primary transition-colors">Accessoires</Link></li>
            </ul>
          </div>

          {/* Informations */}
          <div>
            <h4 className="font-semibold mb-4">Informations</h4>
            <ul className="space-y-2 text-sm text-background/70">
              <li><Link to="/a-propos" className="hover:text-primary transition-colors">À propos</Link></li>
              <li><Link to="/livraison" className="hover:text-primary transition-colors">Livraison</Link></li>
              <li><Link to="/retours" className="hover:text-primary transition-colors">Retours & Échanges</Link></li>
              <li><Link to="/cgv" className="hover:text-primary transition-colors">Conditions générales</Link></li>
              <li><Link to="/confidentialite" className="hover:text-primary transition-colors">Politique de confidentialité</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-background/70">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-primary flex-shrink-0" />
                <span>Abidjan, Côte d'Ivoire</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-primary flex-shrink-0" />
                <span>+225 07 00 00 00 00</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-primary flex-shrink-0" />
                <span>contact@belleboutique.ci</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-background/20">
              <p className="text-xs text-background/50">
                Paiements sécurisés via MTN, Orange, Moov, Wave et carte bancaire
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="border-t border-background/10 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-background/50">
          <p>© 2026 BelleBoutique. Tous droits réservés.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
