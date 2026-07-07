import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api';

interface NotificationAPI {
  id: string;
  titre: string;
  message: string;
  type: string;
  lien: string;
  lu: boolean;
  date_creation: string;
}

const NotificationsBell: React.FC<{ className?: string }> = ({ className }) => {
  const { estConnecte } = useAuth();
  const navigate = useNavigate();
  const [ouvert, setOuvert] = useState(false);
  const [notifications, setNotifications] = useState<NotificationAPI[]>([]);
  const [nonLues, setNonLues] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const chargerCompteur = async () => {
    try {
      const data = await apiService.getNotificationsUnreadCount();
      setNonLues(data.count);
    } catch {
      /* silencieux */
    }
  };

  const chargerListe = async () => {
    try {
      const data = (await apiService.getNotifications()) as NotificationAPI[];
      setNotifications(data);
    } catch {
      /* silencieux */
    }
  };

  useEffect(() => {
    if (!estConnecte) return;
    chargerCompteur();
    const interval = setInterval(chargerCompteur, 30000);
    return () => clearInterval(interval);
  }, [estConnecte]);

  useEffect(() => {
    const clicExterieur = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOuvert(false);
    };
    document.addEventListener('mousedown', clicExterieur);
    return () => document.removeEventListener('mousedown', clicExterieur);
  }, []);

  if (!estConnecte) return null;

  const basculerOuverture = () => {
    if (!ouvert) chargerListe();
    setOuvert((v) => !v);
  };

  const gererClicNotification = async (n: NotificationAPI) => {
    if (!n.lu) {
      await apiService.markNotificationRead(n.id);
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, lu: true } : x)));
      setNonLues((c) => Math.max(0, c - 1));
    }
    if (n.lien) {
      navigate(n.lien);
      setOuvert(false);
    }
  };

  const toutMarquerLu = async () => {
    await apiService.markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, lu: true })));
    setNonLues(0);
  };

  return (
    <div className={`relative ${className ?? ''}`} ref={ref}>
      <button
        onClick={basculerOuverture}
        className="relative p-2 hover:bg-secondary rounded-full transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {nonLues > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-medium">
            {nonLues > 9 ? '9+' : nonLues}
          </span>
        )}
      </button>

      {ouvert && (
        <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-card rounded-2xl shadow-hover border border-border z-50 animate-fade-in">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            {nonLues > 0 && (
              <button
                onClick={toutMarquerLu}
                className="text-xs text-primary hover:underline flex items-center gap-1"
              >
                <Check size={12} />
                Tout marquer lu
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">Aucune notification</p>
          ) : (
            <div className="divide-y divide-border">
              {notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => gererClicNotification(n)}
                  className={`w-full text-left p-4 hover:bg-secondary/50 transition-colors ${!n.lu ? 'bg-primary/5' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    {!n.lu && <span className="w-2 h-2 rounded-full bg-primary mt-1.5 flex-shrink-0" />}
                    <div className={n.lu ? 'ml-4' : ''}>
                      <p className="text-sm font-medium">{n.titre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                      <p className="text-xs text-muted-foreground/70 mt-1">
                        {new Date(n.date_creation).toLocaleDateString('fr-FR', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationsBell;
