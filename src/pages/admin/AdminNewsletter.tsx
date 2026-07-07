import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';
import { Mail, Send, Users, Search, Download } from 'lucide-react';

interface Abonne {
  id: string;
  email: string;
  actif: boolean;
  date_inscription: string;
}

export default function AdminNewsletter() {
  const { estAdmin } = useAuth();
  const [abonnes, setAbonnes] = useState<Abonne[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState('');
  const [sujet, setSujet] = useState('');
  const [message, setMessage] = useState('');
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState('');
  const [export_, setExport] = useState(false);

  const charger = async () => {
    try {
      setChargement(true);
      const data = (await apiService.getAbonnesNewsletter()) as Abonne[];
      setAbonnes(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setChargement(false);
    }
  };

  useEffect(() => {
    if (!estAdmin) return;
    charger();
  }, [estAdmin]);

  const abonnesFiltres = useMemo(
    () => abonnes.filter((a) => a.email.toLowerCase().includes(recherche.toLowerCase())),
    [abonnes, recherche],
  );

  if (!estAdmin) return <div className="p-8">Accès refusé</div>;

  const handleEnvoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sujet || !message) return;
    if (!confirm(`Envoyer cette campagne à ${abonnes.length} abonné(s) ?`)) return;

    setEnvoi(true);
    setResultat('');
    try {
      const res = await apiService.envoyerCampagneNewsletter(sujet, message);
      setResultat(res.message);
      setSujet('');
      setMessage('');
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de l\'envoi');
    } finally {
      setEnvoi(false);
    }
  };

  const handleExporter = async () => {
    setExport(true);
    try {
      const csv = await apiService.exporterAbonnesNewsletter();
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'abonnes_newsletter.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.message || 'Erreur lors de l\'export');
    } finally {
      setExport(false);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <Mail className="text-primary" size={28} />
        <div>
          <h1 className="text-3xl font-serif font-semibold gradient-text">Newsletter</h1>
          <p className="text-muted-foreground text-sm">Envoyez des offres et réductions personnalisées à vos abonnés.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card rounded-2xl p-6 shadow-soft">
          <h2 className="font-semibold mb-4">Composer une campagne</h2>
          <form onSubmit={handleEnvoyer} className="space-y-4">
            <input
              value={sujet}
              onChange={(e) => setSujet(e.target.value)}
              placeholder="Sujet (ex: -20% ce week-end !)"
              required
              className="w-full p-2 border rounded-lg input-elegant"
            />
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Votre message personnalisé..."
              rows={8}
              required
              className="w-full p-2 border rounded-lg input-elegant"
            />
            <button
              type="submit"
              disabled={envoi || abonnes.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:shadow-hover transition disabled:opacity-50"
            >
              <Send size={16} />
              {envoi ? 'Envoi...' : `Envoyer à ${abonnes.length} abonné(s)`}
            </button>
            {resultat && <p className="text-sm text-green-600">{resultat}</p>}
          </form>
        </div>

        <div className="bg-card rounded-2xl p-6 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <h2 className="font-semibold">Abonnés ({abonnes.length})</h2>
            </div>
            <button
              onClick={handleExporter}
              disabled={export_ || abonnes.length === 0}
              title="Exporter en CSV"
              className="p-1.5 text-muted-foreground hover:text-primary hover:bg-secondary rounded transition disabled:opacity-50"
            >
              <Download size={16} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un abonné..."
              className="w-full pl-9 p-2 border rounded-lg input-elegant text-sm"
            />
          </div>

          {chargement ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary" />
            </div>
          ) : abonnesFiltres.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {recherche ? 'Aucun abonné ne correspond à cette recherche.' : 'Aucun abonné pour le moment.'}
            </p>
          ) : (
            <ul className="space-y-2 max-h-96 overflow-y-auto text-sm">
              {abonnesFiltres.map((a) => (
                <li key={a.id} className="flex justify-between border-b border-border pb-2">
                  <span className="truncate">{a.email}</span>
                  <span className="text-muted-foreground text-xs whitespace-nowrap ml-2">
                    {new Date(a.date_inscription).toLocaleDateString('fr-FR')}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
