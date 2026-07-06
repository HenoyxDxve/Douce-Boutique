import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';
import {
  Package, Users, ShoppingCart, BarChart3, Clock, Wrench, Truck, CheckCircle2, Bell,
} from 'lucide-react';

interface Stats {
  chiffre_affaires_total: number;
  nombre_commandes: number;
  nombre_clients: number;
  commandes_en_attente: number;
  commandes_en_preparation: number;
  commandes_en_livraison: number;
  commandes_livrees: number;
  top_produits: { produit__nom: string; quantite_vendue: number }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [nombreProduits, setNombreProduits] = useState(0);
  const [notificationsNonLues, setNotificationsNonLues] = useState(0);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    const charger = async () => {
      try {
        const [statsRes, produitsRes, notifRes] = await Promise.allSettled([
          apiService.getCommandeStats(),
          apiService.getProduits(),
          apiService.getNotificationsUnreadCount(),
        ]);
        if (statsRes.status === 'fulfilled') setStats(statsRes.value as Stats);
        if (produitsRes.status === 'fulfilled' && Array.isArray(produitsRes.value)) {
          setNombreProduits(produitsRes.value.length);
        }
        if (notifRes.status === 'fulfilled') setNotificationsNonLues((notifRes.value as any).count);
      } catch (e) {
        console.error(e);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const cartesStatuts = [
    { statut: 'en_attente', label: 'Reçues', icon: Clock, count: stats?.commandes_en_attente ?? 0, color: 'from-yellow-400 to-yellow-500' },
    { statut: 'en_preparation', label: 'En préparation', icon: Wrench, count: stats?.commandes_en_preparation ?? 0, color: 'from-purple-400 to-purple-500' },
    { statut: 'en_livraison', label: 'En livraison', icon: Truck, count: stats?.commandes_en_livraison ?? 0, color: 'from-indigo-400 to-indigo-500' },
    { statut: 'livree', label: 'Livrées', icon: CheckCircle2, count: stats?.commandes_livrees ?? 0, color: 'from-emerald-400 to-emerald-500' },
  ];

  const cartesGlobales = [
    { href: '/admin/dashboard/produits', label: 'Produits', icon: Package, count: nombreProduits, color: 'from-rose-light to-rose-medium' },
    { href: '/admin/dashboard/utilisateurs', label: 'Clients', icon: Users, count: stats?.nombre_clients ?? 0, color: 'from-gold to-gold-light' },
    { href: '/admin/dashboard/commandes', label: 'Commandes totales', icon: ShoppingCart, count: stats?.nombre_commandes ?? 0, color: 'from-primary to-rose-medium' },
  ];

  if (chargement) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-4xl font-serif font-semibold mb-2 gradient-text">Tableau de bord administrateur</h1>
      <p className="text-muted-foreground mb-4">Bienvenue dans le centre de gestion</p>

      {notificationsNonLues > 0 && (
        <Link
          to="/admin/dashboard/commandes"
          className="flex items-center gap-3 mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl hover:bg-primary/15 transition"
        >
          <Bell className="text-primary flex-shrink-0" size={20} />
          <p className="text-sm font-medium">
            {notificationsNonLues} nouvelle{notificationsNonLues > 1 ? 's' : ''} notification{notificationsNonLues > 1 ? 's' : ''} — de nouvelles commandes attendent votre attention.
          </p>
        </Link>
      )}

      <Link
        to="/admin/dashboard/rapports"
        className="flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all mb-8 w-fit"
      >
        <BarChart3 size={18} />
        Voir les rapports détaillés
      </Link>

      {/* Compteurs de commandes par statut */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {cartesStatuts.map((c) => {
          const Icon = c.icon;
          return (
            <Link key={c.statut} to={`/admin/dashboard/commandes?statut=${c.statut}`}>
              <div className={`p-5 bg-gradient-to-br ${c.color} rounded-2xl shadow-card hover:shadow-hover transition-all cursor-pointer text-white`}>
                <Icon size={24} className="mb-2" />
                <p className="text-2xl font-bold">{c.count}</p>
                <p className="text-white/90 text-xs">{c.label}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Chiffre d'affaires + compteurs globaux */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-primary to-rose-dark rounded-2xl shadow-card text-white">
          <p className="text-white/80 text-sm mb-1">Chiffre d'affaires</p>
          <p className="text-2xl font-bold">{formaterPrix(stats?.chiffre_affaires_total ?? 0)}</p>
        </div>
        {cartesGlobales.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} to={card.href}>
              <div className={`p-6 bg-gradient-to-br ${card.color} rounded-2xl shadow-card hover:shadow-hover transition-all cursor-pointer text-white`}>
                <div className="flex items-start justify-between">
                  <div>
                    <Icon size={28} className="mb-2" />
                    <h3 className="text-sm font-semibold mb-1">{card.label}</h3>
                  </div>
                  <div className="text-2xl font-bold">{card.count}</div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top produits */}
      {stats && stats.top_produits.length > 0 && (
        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Produits les plus vendus</h2>
          <div className="space-y-2">
            {stats.top_produits.map((p, i) => (
              <div key={p.produit__nom} className="flex items-center justify-between text-sm py-1.5 border-b border-border last:border-0">
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-secondary text-xs flex items-center justify-center font-semibold">{i + 1}</span>
                  {p.produit__nom}
                </span>
                <span className="text-muted-foreground">{p.quantite_vendue} vendus</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
