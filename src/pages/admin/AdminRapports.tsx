import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { formaterPrix } from '@/data/produits';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, ShoppingBag } from 'lucide-react';

interface Stats {
  chiffre_affaires_total: number;
  nombre_commandes: number;
  par_statut: { statut: string; total: number }[];
  chiffre_affaires_30_jours: { jour: string; total: number }[];
  top_produits: { produit__nom: string; quantite_vendue: number }[];
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: 'Reçue',
  confirmee: 'Confirmée',
  en_preparation: 'En préparation',
  en_livraison: 'En livraison',
  livree: 'Livrée',
  annulee: 'Annulée',
};

const COULEURS = ['#d4a5a5', '#c9a15f', '#8fa998', '#7b9cc4', '#b98fc4', '#c47b7b'];

export default function AdminRapports() {
  const { estAdmin } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!estAdmin) return;
    apiService
      .getCommandeStats()
      .then((data: any) => setStats(data))
      .catch((e) => console.error(e))
      .finally(() => setChargement(false));
  }, [estAdmin]);

  if (!estAdmin) return <div className="p-8">Accès refusé</div>;

  if (chargement) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return <div className="text-center py-12 text-muted-foreground">Impossible de charger les statistiques.</div>;
  }

  const dataCA = stats.chiffre_affaires_30_jours.map((d) => ({
    jour: new Date(d.jour).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    total: Number(d.total),
  }));

  const dataStatuts = stats.par_statut.map((s) => ({
    name: STATUT_LABELS[s.statut] || s.statut,
    value: s.total,
  }));

  const dataTop = stats.top_produits.map((p) => ({
    nom: p.produit__nom,
    quantite: p.quantite_vendue,
  }));

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <BarChart3 className="text-primary" size={28} />
        <h1 className="text-3xl font-serif font-semibold gradient-text">Rapports</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="p-6 bg-gradient-to-br from-primary to-rose-medium rounded-2xl shadow-card text-white">
          <TrendingUp size={28} className="mb-3" />
          <p className="text-white/80 text-sm">Chiffre d'affaires total</p>
          <p className="text-3xl font-bold">{formaterPrix(Number(stats.chiffre_affaires_total))}</p>
        </div>
        <div className="p-6 bg-gradient-to-br from-gold to-gold-light rounded-2xl shadow-card text-white">
          <ShoppingBag size={28} className="mb-3" />
          <p className="text-white/80 text-sm">Commandes totales</p>
          <p className="text-3xl font-bold">{stats.nombre_commandes}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Chiffre d'affaires (30 derniers jours)</h2>
          {dataCA.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dataCA}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="jour" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => formaterPrix(v)} />
                <Line type="monotone" dataKey="total" stroke="#d4a5a5" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm py-12 text-center">Aucune donnée sur cette période.</p>
          )}
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Commandes par statut</h2>
          {dataStatuts.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={dataStatuts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {dataStatuts.map((_, i) => (
                    <Cell key={i} fill={COULEURS[i % COULEURS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm py-12 text-center">Aucune commande.</p>
          )}
        </div>

        <div className="lg:col-span-3 bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Top 5 des produits vendus</h2>
          {dataTop.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dataTop} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" fontSize={12} />
                <YAxis type="category" dataKey="nom" fontSize={12} width={160} />
                <Tooltip />
                <Bar dataKey="quantite" fill="#c9a15f" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm py-12 text-center">Aucune vente enregistrée.</p>
          )}
        </div>
      </div>
    </div>
  );
}
