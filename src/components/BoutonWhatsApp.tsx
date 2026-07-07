import React from 'react';
import WhatsAppIcon from '@/components/WhatsAppIcon';

const WHATSAPP_NUMERO = '22551877745';
const MESSAGE_DEFAUT = encodeURIComponent(
  "Bonjour BelleBoutique, j'ai une question sur vos produits.",
);

const BoutonWhatsApp: React.FC = () => (
  <a
    href={`https://wa.me/${WHATSAPP_NUMERO}?text=${MESSAGE_DEFAUT}`}
    target="_blank"
    rel="noreferrer"
    aria-label="Discuter sur WhatsApp"
    className="fixed bottom-5 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] text-white shadow-hover hover:scale-105 transition-transform"
  >
    <WhatsAppIcon size={28} />
  </a>
);

export default BoutonWhatsApp;
