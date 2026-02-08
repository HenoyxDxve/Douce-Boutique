import React from 'react';
import { Link, Outlet } from 'react-router-dom';

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="w-64 bg-sidebar p-6 text-sidebar-foreground border-r" style={{minHeight: '100vh'}}>
          <h2 className="text-xl font-semibold mb-6">Admin — BelleBoutique</h2>
          <nav className="flex flex-col space-y-2 text-sm">
            <Link to="/admin/dashboard" className="py-2 px-3 rounded hover:bg-sidebar-accent transition">Dashboard</Link>
            <Link to="/admin/produits" className="py-2 px-3 rounded hover:bg-sidebar-accent transition">Produits</Link>
            <Link to="/admin/categories" className="py-2 px-3 rounded hover:bg-sidebar-accent transition">Catégories</Link>
            <Link to="/admin/utilisateurs" className="py-2 px-3 rounded hover:bg-sidebar-accent transition">Utilisateurs</Link>
            <Link to="/admin/commandes" className="py-2 px-3 rounded hover:bg-sidebar-accent transition">Commandes</Link>
            <a href="/admin/" target="_blank" rel="noreferrer" className="py-2 px-3 rounded hover:bg-sidebar-accent transition mt-4 text-xs">Ouvrir Django Admin (avancé)</a>
          </nav>
        </aside>

        <main className="flex-1 p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
