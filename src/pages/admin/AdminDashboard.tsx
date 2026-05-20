import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/lib/api.ts';
import { Package, Users, ShoppingCart } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState<{produits: number, utilisateurs: number, commandes: number}>({produits: 0, utilisateurs: 0, commandes: 0});
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [produits, utilisateurs, commandes]: any[] = await Promise.allSettled([
          apiService.getProduits(),
          apiService.request('GET', '/utilisateurs/list_all/'),
          apiService.getAllCommandes(),
        ]);
        setStats({
          produits: produits.status === 'fulfilled' && Array.isArray(produits.value) ? produits.value.length : 0,
          utilisateurs: utilisateurs.status === 'fulfilled' && Array.isArray(utilisateurs.value) ? utilisateurs.value.length : 0,
          commandes: commandes.status === 'fulfilled' && Array.isArray(commandes.value) ? commandes.value.length : 0,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const cards = [
    { href: '/admin/dashboard/produits', label: 'Produits', icon: Package, count: stats.produits, color: 'from-rose-light to-rose-medium' },
    { href: '/admin/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users, count: stats.utilisateurs, color: 'from-gold to-gold-light' },
    { href: '/admin/dashboard/commandes', label: 'Commandes', icon: ShoppingCart, count: stats.commandes, color: 'from-primary to-rose-medium' },
  ];

  return (
    <div>
      <h1 className="text-4xl font-serif font-semibold mb-2 gradient-text">Tableau de bord administrateur</h1>
      <p className="text-muted-foreground mb-8">Bienvenue dans le centre de gestion</p>
      
      {chargement ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} to={card.href}>
                <div className={`p-6 bg-gradient-to-br ${card.color} rounded-2xl shadow-card hover:shadow-hover transition-all cursor-pointer text-white`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <Icon size={32} className="mb-3" />
                      <h3 className="text-lg font-semibold mb-1">{card.label}</h3>
                      <p className="text-white/80 text-sm">Gérer</p>
                    </div>
                    <div className="text-3xl font-bold opacity-20">{card.count}</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
