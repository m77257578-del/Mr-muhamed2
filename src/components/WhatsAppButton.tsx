import React from 'react';
import { MessageSquare } from 'lucide-react';

const WA_PHONE = '201003694398';

export const WhatsAppButton: React.FC = () => {
  const url = `https://wa.me/${WA_PHONE}?text=${encodeURIComponent(
    'السلام عليكم يا أستاذ محمد، عندي استفسار عن منصة تصميم ليرن ويب.'
  )}`;

  return (
    <div className="fixed bottom-5 left-5 z-40 flex items-center gap-2">
      <a
        id="wa"
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل عبر واتساب"
        title="تواصل معنا عبر واتساب"
        className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all border border-cyan-300/40"
      >
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#070d19]"></span>
        </span>
        <MessageSquare className="w-7 h-7" />
      </a>
    </div>
  );
};
