import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Package, Heart, Settings, LogOut, Mail, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

const Compte: React.FC = () => {
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [nom, setNom] = useState('');
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('');
  const [estConnecte, setEstConnecte] = useState(false);

  const gererConnexion = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && motDePasse) {
      toast.success('Connexion réussie ! 🎉', {
        description: 'Bienvenue sur BelleBoutique',
      });
      setEstConnecte(true);
    } else {
      toast.error('Veuillez remplir tous les champs');
    }
  };

  const gererInscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (nom && email && motDePasse && confirmMotDePasse) {
      if (motDePasse !== confirmMotDePasse) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
      toast.success('Compte créé avec succès ! 🎉', {
        description: 'Vous pouvez maintenant vous connecter',
      });
    } else {
      toast.error('Veuillez remplir tous les champs');
    }
  };

  if (estConnecte) {
    return (
      <div className="min-h-screen py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-8">Mon Compte</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Menu */}
            <div className="bg-card rounded-2xl p-6 shadow-soft h-fit">
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                  <User size={28} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold">Cliente</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-secondary text-foreground font-medium">
                  <User size={20} />
                  Mes informations
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                  <Package size={20} />
                  Mes commandes
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                  <Heart size={20} />
                  Mes favoris
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary text-muted-foreground transition-colors">
                  <Settings size={20} />
                  Paramètres
                </button>
                <button
                  onClick={() => {
                    setEstConnecte(false);
                    toast.success('Déconnexion réussie');
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut size={20} />
                  Déconnexion
                </button>
              </nav>
            </div>

            {/* Contenu */}
            <div className="md:col-span-2 bg-card rounded-2xl p-6 shadow-soft">
              <h2 className="text-xl font-semibold mb-6">Mes informations</h2>
              <form className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="prenom">Prénom</Label>
                    <Input id="prenom" className="input-elegant mt-1" placeholder="Votre prénom" />
                  </div>
                  <div>
                    <Label htmlFor="nomCompte">Nom</Label>
                    <Input id="nomCompte" className="input-elegant mt-1" placeholder="Votre nom" />
                  </div>
                </div>
                <div>
                  <Label htmlFor="emailCompte">Email</Label>
                  <Input
                    id="emailCompte"
                    type="email"
                    className="input-elegant mt-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" className="input-elegant mt-1" placeholder="+225 07 00 00 00 00" />
                </div>
                <div>
                  <Label htmlFor="adresse">Adresse de livraison</Label>
                  <Input id="adresse" className="input-elegant mt-1" placeholder="Votre adresse complète" />
                </div>
                <Button type="submit" className="btn-primary w-full sm:w-auto">
                  Enregistrer les modifications
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 md:py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-serif text-foreground mb-2">Mon Compte</h1>
            <p className="text-muted-foreground">Connectez-vous ou créez votre compte</p>
          </div>

          <div className="bg-card rounded-3xl p-6 md:p-8 shadow-card">
            <Tabs defaultValue="connexion" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="connexion" className="rounded-full">Connexion</TabsTrigger>
                <TabsTrigger value="inscription" className="rounded-full">Inscription</TabsTrigger>
              </TabsList>

              <TabsContent value="connexion">
                <form onSubmit={gererConnexion} className="space-y-4">
                  <div>
                    <Label htmlFor="emailConnexion">Adresse email</Label>
                    <div className="relative mt-1">
                      <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="emailConnexion"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input-elegant pl-12"
                        placeholder="vous@exemple.com"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="mdpConnexion">Mot de passe</Label>
                    <div className="relative mt-1">
                      <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="mdpConnexion"
                        type="password"
                        value={motDePasse}
                        onChange={(e) => setMotDePasse(e.target.value)}
                        className="input-elegant pl-12"
                        placeholder="••••••••"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Link to="/mot-de-passe-oublie" className="text-sm text-primary hover:underline">
                      Mot de passe oublié ?
                    </Link>
                  </div>
                  <Button type="submit" className="w-full btn-primary py-6">
                    Se connecter
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="inscription">
                <form onSubmit={gererInscription} className="space-y-4">
                  <div>
                    <Label htmlFor="nomInscription">Nom complet</Label>
                    <Input
                      id="nomInscription"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      className="input-elegant mt-1"
                      placeholder="Votre nom"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="emailInscription">Adresse email</Label>
                    <Input
                      id="emailInscription"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-elegant mt-1"
                      placeholder="vous@exemple.com"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="mdpInscription">Mot de passe</Label>
                    <Input
                      id="mdpInscription"
                      type="password"
                      value={motDePasse}
                      onChange={(e) => setMotDePasse(e.target.value)}
                      className="input-elegant mt-1"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmMdp">Confirmer le mot de passe</Label>
                    <Input
                      id="confirmMdp"
                      type="password"
                      value={confirmMotDePasse}
                      onChange={(e) => setConfirmMotDePasse(e.target.value)}
                      className="input-elegant mt-1"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    En créant un compte, vous acceptez nos{' '}
                    <Link to="/cgv" className="text-primary hover:underline">conditions générales</Link> et notre{' '}
                    <Link to="/confidentialite" className="text-primary hover:underline">politique de confidentialité</Link>.
                  </p>
                  <Button type="submit" className="w-full btn-primary py-6">
                    Créer mon compte
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Compte;
