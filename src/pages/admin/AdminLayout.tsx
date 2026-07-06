import React, { useEffect, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, Package, Tag, Users, ShoppingCart, Percent, BarChart3,
  Moon, Sun, LogOut, KeyRound, Mail, Wallet,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import NotificationsBell from '@/components/NotificationsBell';
import ConfirmerDeconnexion from '@/components/ConfirmerDeconnexion';
import apiService from '@/lib/api';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/dashboard/produits', label: 'Produits', icon: Package },
  { to: '/admin/dashboard/promotions', label: 'Promotions', icon: Percent },
  { to: '/admin/dashboard/categories', label: 'Catégories', icon: Tag },
  { to: '/admin/dashboard/commandes', label: 'Commandes', icon: ShoppingCart },
  { to: '/admin/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/dashboard/parametres-paiement', label: 'Paramètres de paiement', icon: Wallet },
  { to: '/admin/dashboard/newsletter', label: 'Newsletter', icon: Mail },
  { to: '/admin/dashboard/rapports', label: 'Rapports', icon: BarChart3 },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { utilisateur, deconnexion } = useAuth();
  const { setTheme, resolvedTheme } = useTheme();
  const [monte, setMonte] = useState(false);
  const [dialogMotDePasseOuvert, setDialogMotDePasseOuvert] = useState(false);
  const [motDePasseForm, setMotDePasseForm] = useState({ ancien: '', nouveau: '', confirmation: '' });
  const [chargementMotDePasse, setChargementMotDePasse] = useState(false);

  useEffect(() => setMonte(true), []);

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to || location.pathname === to + '/';
    return location.pathname.startsWith(to);
  };

  const handleDeconnexion = () => {
    deconnexion();
    navigate('/connexion');
  };

  const handleChangerMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (motDePasseForm.nouveau !== motDePasseForm.confirmation) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (motDePasseForm.nouveau.length < 8) {
      toast.error('Le nouveau mot de passe doit contenir au moins 8 caractères');
      return;
    }
    setChargementMotDePasse(true);
    try {
      await apiService.changerMotDePasse(motDePasseForm.ancien, motDePasseForm.nouveau);
      toast.success('Mot de passe modifié avec succès ✅');
      setMotDePasseForm({ ancien: '', nouveau: '', confirmation: '' });
      setDialogMotDePasseOuvert(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du changement de mot de passe');
    } finally {
      setChargementMotDePasse(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="w-64 bg-sidebar p-6 text-sidebar-foreground border-r flex-shrink-0 flex flex-col" style={{ minHeight: '100vh' }}>
          <h2 className="text-xl font-semibold mb-8">
            <span className="text-primary">Belle</span>Boutique Admin
          </h2>
          <nav className="flex flex-col space-y-1 text-sm">
            {navItems.map(({ to, label, icon: Icon, exact }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 py-2.5 px-3 rounded-lg transition ${
                  isActive(to, exact)
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-sidebar-accent'
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t border-border space-y-1">
            {utilisateur && (
              <p className="px-3 pb-2 text-xs text-muted-foreground truncate">{utilisateur.email}</p>
            )}
            <button
              onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
              className="w-full flex items-center gap-2 text-sm py-2 px-3 rounded-lg hover:bg-sidebar-accent transition text-left"
            >
              {monte && resolvedTheme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              {monte && resolvedTheme === 'dark' ? 'Mode clair' : 'Mode sombre'}
            </button>
            <button
              onClick={() => setDialogMotDePasseOuvert(true)}
              className="w-full flex items-center gap-2 text-sm py-2 px-3 rounded-lg hover:bg-sidebar-accent transition text-left"
            >
              <KeyRound size={16} />
              Changer le mot de passe
            </button>
            <a
              href="http://localhost:8000/admin/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition py-2 px-3 rounded-lg hover:bg-sidebar-accent"
            >
              Ouvrir Django Admin (avancé)
            </a>
            <ConfirmerDeconnexion onConfirm={handleDeconnexion}>
              <button
                className="w-full flex items-center gap-2 text-sm py-2 px-3 rounded-lg text-destructive hover:bg-destructive/10 transition text-left"
              >
                <LogOut size={16} />
                Déconnexion
              </button>
            </ConfirmerDeconnexion>
          </div>
        </aside>

        <main className="flex-1">
          <div className="flex justify-end p-4 border-b border-border">
            <NotificationsBell />
          </div>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>

      <Dialog open={dialogMotDePasseOuvert} onOpenChange={setDialogMotDePasseOuvert}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Changer le mot de passe</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangerMotDePasse} className="space-y-4">
            <div>
              <Label htmlFor="admin-ancien-mdp">Mot de passe actuel</Label>
              <Input
                id="admin-ancien-mdp"
                type="password"
                value={motDePasseForm.ancien}
                onChange={(e) => setMotDePasseForm((p) => ({ ...p, ancien: e.target.value }))}
                disabled={chargementMotDePasse}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-nouveau-mdp">Nouveau mot de passe</Label>
              <Input
                id="admin-nouveau-mdp"
                type="password"
                value={motDePasseForm.nouveau}
                onChange={(e) => setMotDePasseForm((p) => ({ ...p, nouveau: e.target.value }))}
                placeholder="Minimum 8 caractères"
                disabled={chargementMotDePasse}
                required
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="admin-confirmation-mdp">Confirmer le nouveau mot de passe</Label>
              <Input
                id="admin-confirmation-mdp"
                type="password"
                value={motDePasseForm.confirmation}
                onChange={(e) => setMotDePasseForm((p) => ({ ...p, confirmation: e.target.value }))}
                disabled={chargementMotDePasse}
                required
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={chargementMotDePasse} className="w-full btn-primary">
              {chargementMotDePasse ? 'Modification...' : 'Changer le mot de passe'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
