import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { SocialLink } from '../types';

interface FooterProps {
  socialLinks?: SocialLink[];
}

const LEARN_WEB_URL = 'https://lern-web7-h2qx.vercel.app/';

export const Footer: React.FC<FooterProps> = ({ socialLinks = [] }) => {
  // Render brand icon matching the user screenshot
  const renderIcon = (platform: string) => {
    const p = platform.toLowerCase();
    switch (p) {
      case 'linkedin':
        return (
          <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
          </svg>
        );
      case 'x':
      case 'twitter':
        return (
          <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'tiktok':
        return (
          <svg className="w-5 h-5 text-[#00f2fe]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .57.04.84.12V9.38a6.34 6.34 0 0 0-.84-.06A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.49 6.34 6.34 0 0 0 1.86-4.49V8.52a8.27 8.27 0 0 0 4.91 1.61V6.69z"/>
          </svg>
        );
      case 'youtube':
        return (
          <svg className="w-5 h-5 text-[#FF0000]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
          </svg>
        );
      case 'telegram':
        return (
          <svg className="w-5 h-5 text-[#229ED9]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.75-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .38z"/>
          </svg>
        );
      case 'instagram':
        return (
          <svg className="w-5 h-5 text-[#E4405F]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
          </svg>
        );
      case 'facebook':
        return (
          <svg className="w-5 h-5 text-[#1877F2]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
        );
      case 'whatsapp':
        return (
          <svg className="w-5 h-5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2M12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.15 12.04 20.15C10.56 20.15 9.11 19.76 7.85 19L7.55 18.83L4.43 19.65L5.26 16.61L5.06 16.29C4.24 14.99 3.8 13.47 3.8 11.91C3.81 7.37 7.5 3.67 12.05 3.67M9.04 7.42C8.87 7.42 8.6 7.48 8.36 7.74C8.13 8 7.48 8.61 7.48 9.85C7.48 11.09 8.38 12.28 8.51 12.45C8.64 12.62 10.28 15.15 12.79 16.23C13.39 16.49 13.85 16.64 14.22 16.76C14.82 16.95 15.37 16.92 15.8 16.86C16.29 16.79 17.3 16.25 17.51 15.65C17.72 15.06 17.72 14.55 17.66 14.45C17.6 14.35 17.43 14.29 17.18 14.16C16.93 14.04 15.7 13.43 15.47 13.35C15.25 13.27 15.08 13.23 14.92 13.48C14.75 13.73 14.28 14.29 14.13 14.45C13.99 14.62 13.84 14.64 13.59 14.52C13.34 14.39 12.54 14.13 11.59 13.28C10.85 12.62 10.35 11.8 10.21 11.55C10.07 11.3 10.2 11.17 10.32 11.04C10.43 10.93 10.57 10.75 10.7 10.6C10.82 10.45 10.87 10.35 10.95 10.18C11.03 10.01 10.99 9.87 10.93 9.75C10.87 9.62 10.37 8.41 10.17 7.91C9.97 7.43 9.76 7.5 9.6 7.49C9.45 7.48 9.27 7.42 9.04 7.42Z"/>
          </svg>
        );
      default:
        return <Globe className="w-5 h-5 text-cyan-400" />;
    }
  };

  const activeLinks = socialLinks.filter((s) => s.active !== false);

  return (
    <footer className="mt-auto pt-8 pb-12 border-t border-blue-500/15 bg-gradient-to-b from-transparent via-[#08101e]/90 to-[#040810] text-center text-slate-300">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 flex flex-col items-center">
        {/* Social Media Buttons Bar - exactly matching the attached screenshot style */}
        <div className="w-full mb-6">
          <p className="text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-3.5">
            صفحات وقنوات التواصل الرسمية
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {activeLinks.map((item) => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                title={item.title}
                aria-label={item.title}
                className="w-12 h-12 rounded-2xl bg-[#0f1b2f]/90 hover:bg-[#152744] border border-blue-500/25 hover:border-cyan-400/60 shadow-md hover:shadow-cyan-500/20 flex items-center justify-center transition-all duration-200 hover:scale-110 group cursor-pointer"
              >
                <div className="transition-transform duration-200 group-hover:scale-110">
                  {renderIcon(item.platform)}
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Divider accent */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent my-2" />

        {/* "برمج من ليرن ويب" and Enter Platform Button */}
        <div className="mt-4 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>برمج من</span>
            <span className="text-cyan-300 font-extrabold tracking-wide">ليرن ويب</span>
            <span className="text-slate-400 text-[11px]">| المنظومة التعليمية المتكاملة</span>
          </div>

          {/* زر دخول الموقع الرئيسي */}
          <a
            href={LEARN_WEB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/45 hover:scale-[1.02] border border-cyan-300/40 transition-all duration-200"
          >
            <Globe className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform duration-300" />
            <span>دخول موقع ليرن ويب الرسمي</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-200 group-hover:translate-x-[-3px] transition-transform duration-300" />
          </a>
        </div>

        <p className="mt-5 text-[11px] text-slate-400">
          جميع الحقوق محفوظة © {new Date().getFullYear()} • تصميم وبرمجة ليرن ويب
        </p>
      </div>
    </footer>
  );
};
