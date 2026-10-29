import React from 'react';
import {
  Moon,
  Sun,
  Download,
  ExternalLink,
  Globe,
  Sparkles,
  LogIn,
  User,
  Image as ImageIcon,
  Camera,
  Settings,
} from 'lucide-react';
import { PublicData } from '../types';

interface HeaderProps {
  publicData: PublicData | null;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  onInstall: () => void;
  onLoginClick: () => void;
  userRole?: 'student' | 'parent' | 'teacher' | null;
  userName?: string;
  onLogout?: () => void;
  onNavigateToAdminSettings?: () => void;
}

const LEARN_WEB_URL = 'https://lern-web7-h2qx.vercel.app/';

export const Header: React.FC<HeaderProps> = ({
  publicData,
  theme,
  toggleTheme,
  onInstall,
  onLoginClick,
  userRole,
  userName,
  onLogout,
  onNavigateToAdminSettings,
}) => {
  const isDark = theme === 'dark';

  const heroSrc =
    publicData?.hero
      ? publicData.hero.startsWith('http') || publicData.hero.startsWith('/')
        ? publicData.hero
        : `/${publicData.hero}`
      : 'https://images.pexels.com/photos/159711/books-bookstore-book-reading-159711.jpeg?auto=compress&cs=tinysrgb&w=1280';

  return (
    <header className="px-4 pt-5 sm:px-8">
      <div
        className="mx-auto max-w-6xl rounded-[2rem] px-6 py-7 shadow-2xl sm:px-10 border border-blue-500/20"
        style={{
          background: 'linear-gradient(145deg, #0f1c32 0%, #0a1324 100%)',
          boxShadow: '0 20px 50px rgba(3, 7, 18, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
        }}
      >
        {/* Top Controls Bar: "تسجيل الدخول فوق خالص وبجانبه الوضع الفاتح والداكن فى صورة ايقونه صغيره وكمان جنبهم زر تثبيت التطبيق" */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-blue-500/15">
          {/* Platform Identity */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-pill bg-blue-950/40 text-blue-300 border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>المنصة التعليمية الشاملة</span>
            </span>
          </div>

          {/* Top Actions: Login button + Small Theme Icon button + Install App button */}
          <div className="flex items-center gap-2">
            {/* تسجيل الدخول */}
            {userRole ? (
              <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-500/30 py-1.5 px-3 rounded-xl text-xs font-bold text-white shadow-sm">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {userName || (userRole === 'teacher' ? 'الأدمن' : 'المستخدم')}
                </span>
                {onLogout && (
                  <button
                    type="button"
                    onClick={onLogout}
                    className="mr-1 text-[11px] text-red-400 hover:text-red-300 underline font-semibold"
                    title="تسجيل الخروج"
                  >
                    خروج
                  </button>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={onLoginClick}
                className="btn-primary btn-sm inline-flex items-center gap-1.5 py-1.5 px-3.5 text-xs font-bold rounded-xl shadow-md"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>تسجيل الدخول</span>
              </button>
            )}

            {/* الوضع الفاتح والداكن فى صورة ايقونه صغيره */}
            <button
              id="theme-toggle"
              type="button"
              onClick={toggleTheme}
              aria-pressed={isDark}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-blue-500/30 text-slate-300 transition-colors shadow-sm flex items-center justify-center cursor-pointer"
              title={isDark ? 'الوضع الفاتح' : 'الوضع الداكن'}
              aria-label="التبديل بين الوضع الفاتح والداكن"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            {/* زر تثبيت التطبيق */}
            <button
              id="install-app"
              type="button"
              onClick={onInstall}
              className="btn-gold btn-sm inline-flex items-center gap-1.5 py-1.5 px-3 text-xs font-bold rounded-xl shadow-sm cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>تثبيت التطبيق</span>
            </button>
          </div>
        </div>

        {/* Hero Title & Platform Image (اللوحة التى فى المنتصف يجب ان تكون صورة المنصة وتتعدل من لوحة الأدمن) */}
        <div className="grid items-center gap-8 lg:grid-cols-[1.2fr_1fr]">
          {/* Information Section */}
          <section>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-blue-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{publicData?.subtitle || 'منصة إدارة المحتوى والكورسات والامتحانات الذكية'}</span>
            </div>

            <h1 className="mb-3 text-3xl sm:text-5xl font-black text-white tracking-tight flex items-center gap-3">
              {publicData?.logoFile ? (
                <img
                  src={publicData.logoFile.startsWith('http') ? publicData.logoFile : publicData.logoFile}
                  alt="شعار المنصة"
                  style={{ height: `${publicData.logoSize || 36}px`, width: 'auto' }}
                  className="object-contain rounded"
                />
              ) : null}
              <span>{publicData?.name || 'تصميم ليرن ويب'}</span>
            </h1>

            <p className="max-w-2xl leading-relaxed text-slate-300 text-sm sm:text-base">
              {publicData?.subtitle || 'إدارة منصة ليرن ويب ونظام المحتوى الشامل — تحكم كامل في نشر الفيديوهات، المذكرات، الواجبات، الامتحانات التفاعلية، وإدارة الطلاب وأولياء الأمور.'}
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a
                href={LEARN_WEB_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-cyan inline-flex items-center gap-2 text-xs sm:text-sm shadow-cyan-500/20"
              >
                <Globe className="w-4 h-4" />
                <span>زيارة ليرن ويب</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              {userRole === 'teacher' && onNavigateToAdminSettings && (
                <button
                  type="button"
                  onClick={onNavigateToAdminSettings}
                  className="btn-primary inline-flex items-center gap-2 text-xs sm:text-sm"
                >
                  <Settings className="w-4 h-4" />
                  <span>تعديل صورة وإعدادات المنصة</span>
                </button>
              )}
            </div>
          </section>

          {/* اللوحة التى هى فى المنتصف: صورة المنصة (تتعدل من لوحة الأدمن) */}
          <div className="relative rounded-2xl p-3.5 sm:p-4 border border-blue-500/30 bg-gradient-to-br from-[#0e1d35] to-[#091222] shadow-2xl overflow-hidden group">
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-blue-500/20 text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5 text-cyan-300">
                <ImageIcon className="w-4 h-4 text-cyan-400" />
                <span>صورة المنصة الرسمية</span>
              </span>

              {userRole === 'teacher' && onNavigateToAdminSettings ? (
                <button
                  type="button"
                  onClick={onNavigateToAdminSettings}
                  className="badge-pill bg-amber-950/50 text-amber-300 border-amber-500/40 hover:bg-amber-900/60 hover:text-white transition-all text-[11px] flex items-center gap-1 cursor-pointer"
                >
                  <Camera className="w-3 h-3" />
                  <span>تعديل الصورة</span>
                </button>
              ) : null}
            </div>

            {/* Display the platform's image */}
            <div className="relative overflow-hidden rounded-xl border border-blue-500/25 bg-black/40 aspect-[16/10] flex items-center justify-center">
              <img
                id="hero"
                src={heroSrc}
                alt="صورة منصة تصميم ليرن ويب"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#070d19]/85 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-2.5 right-3 left-3 flex items-center justify-between text-[11px] text-slate-200 pointer-events-none">
                <span className="font-extrabold text-white drop-shadow">تصميم ليرن ويب</span>
                <span className="bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-cyan-300 font-mono border border-cyan-400/20">
                  الصورة المعتمدة
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
