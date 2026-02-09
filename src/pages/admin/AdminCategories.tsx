import React, { useEffect, useState } from 'react';
import apiService from '@/lib/api.ts';

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [chargement, setChargement] = useState(true);
  const [nom, setNom] = useState('');

  useEffect(() => {
    const charger = async () => {
      try {
        setChargement(true);
        const c: any = await apiService.getCategories();
        setCategories(Array.isArray(c) ? c : []);
      } catch (e) {
        console.error(e);
      } finally {
        setChargement(false);
      }
    };
    charger();
  }, []);

  const handleCreate = async () => {
    if (!nom) return alert('Nom requis');
    try {
      // backend categories endpoint does not yet support create — use produit admin for now
      alert('Création de catégorie non implémentée côté API; utilisez Django Admin pour l’instant.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-4">Catégories</h1>
      {chargement ? <div>Chargement...</div> : (
        <div>
          <div className="mb-4">
            <input value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Nom catégorie" className="p-2 border rounded mr-2" />
            <button onClick={handleCreate} className="px-3 py-1 bg-primary text-primary-foreground rounded">Créer</button>
          </div>

          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="py-2">Nom</th>
                <th className="py-2">Slug</th>
              </tr>
            </thead>
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{c.nom}</td>
                  <td className="py-2">{c.slug}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
