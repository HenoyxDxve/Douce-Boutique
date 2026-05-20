import React, { useEffect, useState } from 'react';
import apiService from '@/lib/api.ts';
import { Shield, ShieldOff } from 'lucide-react';

export default function AdminUtilisateurs() {
  const [utilisateurs, setUtilisateurs] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [confirming, setConfirming] = useState<string | null>(null);

  useEffect(() => {
    const charger = async () => {
      try {
        setChargement(true);
        const u: any = await apiService.request('GET', '/utilisateurs/list_all/');
        setUtilisateurs(Array.isArray(u) ? u : []);
      } catch (e) {
        console.error(e);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const filtres = utilisateurs.filter(u => 
    u.email.toLowerCase().includes(recherche.toLowerCase()) || 
    (u.nom_complet && u.nom_complet.toLowerCase().includes(recherche.toLowerCase()))
  );

  const toggleAdmin = async (id: string, current: boolean) => {
    setConfirming(null);
    try {
      await apiService.request('PUT', `/utilisateurs/${id}/`, { est_admin: !current });
      setUtilisateurs(utilisateurs.map(u => u.id === id ? { ...u, est_admin: !current } : u));
    } catch (e) {
      console.error(e);
      alert('Erreur mise à jour');
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-serif font-semibold mb-6 gradient-text">Gestion des Utilisateurs</h1>
      
      <div className="mb-4">
        <input 
          value={recherche} 
          onChange={(e) => setRecherche(e.target.value)} 
          placeholder="Rechercher par email ou nom..." 
          className="w-full p-2 border rounded-lg input-elegant"
        />
      </div>

      {chargement ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
        </div>
      ) : filtres.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Aucun utilisateur trouvé</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-secondary">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Email</th>
                <th className="px-4 py-3 text-left font-semibold">Nom</th>
                <th className="px-4 py-3 text-left font-semibold">Admin</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtres.map(u => (
                <tr key={u.id} className="border-t hover:bg-secondary/30 transition">
                  <td className="px-4 py-3 text-sm">{u.email}</td>
                  <td className="px-4 py-3">{u.nom_complet ?? `${u.prenom} ${u.nom}`}</td>
                  <td className="px-4 py-3">
                    {u.est_admin ? <span className="inline-flex items-center gap-1 bg-rose-light text-rose-dark px-2 py-1 rounded-full text-xs font-semibold"><Shield size={14} /> Admin</span> : 
                                  <span className="inline-flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">Utilisateur</span>}
                  </td>
                  <td className="px-4 py-3">
                    {confirming === u.id ? (
                      <div className="flex gap-2 text-xs">
                        <button 
                          onClick={() => toggleAdmin(u.id, u.est_admin)}
                          className="px-2 py-1 bg-destructive text-destructive-foreground rounded hover:opacity-90"
                        >
                          Confirmer
                        </button>
                        <button 
                          onClick={() => setConfirming(null)}
                          className="px-2 py-1 bg-muted rounded hover:bg-muted/80"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setConfirming(u.id)}
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium transition ${u.est_admin ? 'text-rose-dark hover:bg-rose-light/50' : 'text-blue-600 hover:bg-blue-50'}`}
                      >
                        {u.est_admin ? <><ShieldOff size={14} /> Retirer</> : <><Shield size={14} /> Promouvoir</>}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
