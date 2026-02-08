import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: { phone: string; adresse: string; ville: string; codePostal: string }) => void;
  initial?: { adresse?: string; ville?: string; codePostal?: string };
}

const PaymentModal: React.FC<PaymentModalProps> = ({ open, onOpenChange, onConfirm, initial }) => {
  const [phone, setPhone] = useState('');
  const [adresse, setAdresse] = useState(initial?.adresse || '');
  const [ville, setVille] = useState(initial?.ville || '');
  const [codePostal, setCodePostal] = useState(initial?.codePostal || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      // reset fields when closing
      setPhone('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (!phone) return;
    setLoading(true);
    try {
      onConfirm({ phone, adresse, ville, codePostal });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Paiement par MTN</DialogTitle>
          <DialogDescription>Entrez votre numéro MTN et vos informations de livraison.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-4">
          <label className="text-sm text-muted-foreground">Numéro MTN</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+22507xxxxxxxx" />

          <label className="text-sm text-muted-foreground">Adresse de livraison</label>
          <Input value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Adresse" />

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-sm text-muted-foreground">Ville</label>
              <Input value={ville} onChange={(e) => setVille(e.target.value)} placeholder="Ville" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground">Code postal</label>
              <Input value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="00000" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Annuler</Button>
          </DialogClose>
          <Button onClick={handleConfirm} disabled={!phone || loading}>{loading ? 'En cours...' : 'Payer avec MTN'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
