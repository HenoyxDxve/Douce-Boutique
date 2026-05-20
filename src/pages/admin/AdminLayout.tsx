import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Package, Tag, Users, ShoppingCart } from 'lucide-react';

const navItems = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/dashboard/produits', label: 'Produits', icon: Package },
  { to: '/admin/dashboard/categories', label: 'Catégories', icon: Tag },
  { to: '/admin/dashboard/utilisateurs', label: 'Utilisateurs', icon: Users },
  { to: '/admin/dashboard/commandes', label: 'Commandes', icon: ShoppingCart },
];

export default function AdminLayout() {
  const location = useLocation();

  const isActive = (to: string, exact?: boolean) => {
    if (exact) return location.pathname === to || location.pathname === to + '/';
    return location.pathname.startsWith(to);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="w-64 bg-sidebar p-6 text-sidebar-foreground border-r flex-shrink-0" style={{ minHeight: '100vh' }}>
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
          <div className="mt-8 pt-6 border-t border-border">
            <a
              href="http://localhost:8000/admin/"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition py-2 px-3 rounded-lg hover:bg-sidebar-accent"
            >
              Ouvrir Django Admin (avancé)
            </a>
          </div>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
