import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { MapPin, LocateFixed, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Correctif classique Leaflet + bundlers : les chemins d'icônes par défaut
// pointent vers des fichiers absents du build, on les remplace explicitement.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const ABIDJAN: [number, number] = [5.359951, -4.008256];

interface Position {
  latitude: number;
  longitude: number;
}

export interface AdresseGeocodee {
  texte?: string;
  ville?: string;
}

interface Props {
  position: Position | null;
  onPositionChange: (position: Position, adresse?: AdresseGeocodee) => void;
}

async function reverseGeocode(lat: number, lon: number): Promise<AdresseGeocodee | undefined> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&addressdetails=1`,
    );
    if (!res.ok) return undefined;
    const data = await res.json();
    const addr = data?.address || {};
    return {
      texte: data?.display_name as string | undefined,
      ville: addr.city || addr.town || addr.county || addr.state,
    };
  } catch {
    return undefined;
  }
}

function GestionClicCarte({ onClic }: { onClic: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClic(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

const SelecteurPositionCarte: React.FC<Props> = ({ position, onPositionChange }) => {
  const [afficherCarte, setAfficherCarte] = useState(false);
  const [chargementPosition, setChargementPosition] = useState(false);

  const appliquerPosition = async (lat: number, lng: number) => {
    onPositionChange({ latitude: lat, longitude: lng });
    const adresse = await reverseGeocode(lat, lng);
    if (adresse) {
      onPositionChange({ latitude: lat, longitude: lng }, adresse);
    }
  };

  const utiliserMaPosition = () => {
    if (!navigator.geolocation) {
      toast.error('La géolocalisation n\'est pas disponible sur cet appareil');
      return;
    }
    setChargementPosition(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        await appliquerPosition(pos.coords.latitude, pos.coords.longitude);
        setAfficherCarte(true);
        setChargementPosition(false);
      },
      () => {
        toast.error('Impossible de récupérer votre position. Autorisez la géolocalisation ou choisissez sur la carte.');
        setChargementPosition(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const centre: [number, number] = position
    ? [position.latitude, position.longitude]
    : ABIDJAN;

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={utiliserMaPosition}
          disabled={chargementPosition}
        >
          {chargementPosition ? (
            <Loader2 size={16} className="mr-2 animate-spin" />
          ) : (
            <LocateFixed size={16} className="mr-2" />
          )}
          Utiliser ma position
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setAfficherCarte((v) => !v)}
        >
          <MapPin size={16} className="mr-2" />
          {afficherCarte ? 'Masquer la carte' : 'Choisir sur la carte'}
        </Button>
      </div>

      {afficherCarte && (
        <div className="rounded-xl overflow-hidden border border-border h-64 relative z-0">
          <MapContainer center={centre} zoom={13} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <GestionClicCarte onClic={appliquerPosition} />
            {position && (
              <Marker
                position={[position.latitude, position.longitude]}
                draggable
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target as L.Marker;
                    const { lat, lng } = marker.getLatLng();
                    appliquerPosition(lat, lng);
                  },
                }}
              />
            )}
          </MapContainer>
        </div>
      )}

      {position && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <MapPin size={12} />
          Position enregistrée ({position.latitude.toFixed(5)}, {position.longitude.toFixed(5)})
        </p>
      )}
    </div>
  );
};

export default SelecteurPositionCarte;
