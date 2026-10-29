import React from 'react';
import { CourseContentItem, StudentProfile } from '../types';
import { tokens } from '../services/api';
import { Download, X } from 'lucide-react';

interface MediaViewerProps {
  content: CourseContentItem;
  role: 'student' | 'teacher';
  profile?: StudentProfile | null;
  onClose: () => void;
}

function safeHttpUrl(value?: string): string {
  if (!value) return '';
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
  } catch (e) {
    return '';
  }
}

function youtubeEmbedUrl(value?: string): string {
  if (!value) return '';
  let str = value.trim();

  // If teacher pasted full <iframe> embed code snippet, extract src URL
  if (str.includes('<iframe') && str.includes('src=')) {
    const match = str.match(/src=["']([^"']+)["']/i);
    if (match && match[1]) {
      str = match[1];
    }
  }

  try {
    const url = new URL(str, typeof window !== 'undefined' ? window.location.origin : 'https://localhost');
    const host = url.hostname.toLowerCase().replace(/^www\./, '');
    let id = '';
    if (host === 'youtu.be') {
      id = url.pathname.split('/').filter(Boolean)[0] || '';
    } else if (['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      id =
        url.searchParams.get('v') ||
        url.pathname.match(/^\/(?:embed|live|shorts)\/([^/?]+)/)?.[1] ||
        '';
    }
    if (!/^[\w-]{11}$/.test(id)) return '';

    const origin = typeof window !== 'undefined' ? encodeURIComponent(window.location.origin) : '';
    // Strict no-branding, no-sharing, domain-locked embed parameters
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0&modestbranding=1&controls=1&iv_load_policy=3&enablejsapi=1${origin ? `&origin=${origin}&widget_referrer=${origin}` : ''}`;
  } catch (e) {
    return '';
  }
}

export const MediaViewer: React.FC<MediaViewerProps> = ({
  content,
  role,
  profile,
  onClose,
}) => {
  // Dynamic floating watermark position
  const [watermarkPos, setWatermarkPos] = React.useState({
    top: 35,
    left: 45,
    rotate: -8,
  });

  // Periodically move watermark smoothly across the view
  React.useEffect(() => {
    if (role !== 'student') return;
    const interval = setInterval(() => {
      const top = Math.floor(Math.random() * 65) + 18; // 18% to 83%
      const left = Math.floor(Math.random() * 65) + 18; // 18% to 83%
      const rotate = Math.floor(Math.random() * 20) - 10; // -10deg to +10deg
      setWatermarkPos({ top, left, rotate });
    }, 4200);

    // Anti-Piracy Keyboard & Screenshot Deterrence Guards
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block F12, Ctrl+Shift+I, Ctrl+U, Ctrl+S, PrintScreen
      if (
        e.key === 'F12' ||
        (e.ctrlKey && (e.key === 'u' || e.key === 's' || e.key === 'p')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
        e.key === 'PrintScreen'
      ) {
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [role]);

  const external = !!content.link;
  const original = external ? safeHttpUrl(content.link) : '';
  const youtube = external ? youtubeEmbedUrl(original) : '';
  const directVideo = external && /\.(?:mp4|webm|ogg|m3u8)(?:$|[?#])/i.test(original);
  const directImage = external && /\.(?:png|jpe?g|gif|webp)(?:$|[?#])/i.test(original);
  const directPdf = external && /\.pdf(?:$|[?#])/i.test(original);

  const token = role === 'student' ? tokens.student : tokens.teacher;
  const fileUrl = content.fileId
    ? `/files/${encodeURIComponent(content.fileId)}?t=${encodeURIComponent(token)}`
    : '';
  const mediaUrl = external ? youtube || original : fileUrl;
  const mime = content.mime || '';

  const canDownload =
    !external &&
    !(role === 'student' && mime.startsWith('video/')) &&
    content.fileId;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onContextMenu={(e) => {
        if (role === 'student') e.preventDefault();
      }}
      onBlur={(e) => {
        if (role === 'student') {
          e.currentTarget.style.filter = 'blur(20px)';
        }
      }}
      onFocus={(e) => {
        if (role === 'student') {
          e.currentTarget.style.filter = 'none';
        }
      }}
      className="fixed inset-0 z-50 flex flex-col items-center gap-4 overflow-y-auto p-4 sm:p-6 select-none"
      style={{ background: 'rgba(7, 13, 25, 0.95)', backdropFilter: 'blur(8px)', transition: 'filter 0.3s' }}
    >
      {/* Top Bar: Close button & Download (if permitted), NO sharing or external YouTube buttons */}
      <div className="flex flex-wrap items-center justify-between w-full max-w-5xl px-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-white truncate max-w-md">
            {content.title || 'عرض المحتوى'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {canDownload && (
            <a
              className="btn-gold btn-sm flex items-center gap-1.5"
              href={mediaUrl}
              download={content.fileName || 'file'}
            >
              <Download className="w-4 h-4" />
              <span>تنزيل الملف</span>
            </a>
          )}

          <button
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-all cursor-pointer flex items-center gap-1.5 text-xs"
            onClick={onClose}
            type="button"
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        </div>
      </div>

      {/* Main Player Display */}
      <div className="relative my-auto flex max-h-[82vh] w-full max-w-5xl items-center justify-center overflow-hidden">
        {youtube ? (
          <div className="relative w-full aspect-video max-h-[640px]">
            <iframe
              src={youtube}
              title={content.title || 'فيديو المنصة'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              className="w-full h-full rounded-2xl bg-black border border-blue-500/25 shadow-2xl"
            />
            {/* Top Transparent Click Interceptor: prevents clicking YouTube video title / watch on YouTube link */}
            {role === 'student' && (
              <div 
                className="absolute top-0 right-0 left-0 h-16 z-20 bg-transparent cursor-default"
                title="محتوى محمي مخصص للعرض داخل المنصة فقط"
                onClick={(e) => e.stopPropagation()}
              />
            )}
            {/* Enhanced Dynamic Anti-Piracy Watermark & Protection System */}
            {role === 'student' && (
              <>
                {/* 1. Repeating Semi-transparent Watermark Grid */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-around opacity-20">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex justify-around transform -rotate-12 whitespace-nowrap text-xs font-black text-white/70">
                      <span>{profile?.name || 'طالب المنصة'} • {profile?.phone || ''} • كود: {profile?.code || ''}</span>
                      <span className="hidden sm:inline">{profile?.name || 'طالب المنصة'} • {profile?.phone || ''}</span>
                      <span>{profile?.phone || ''} • {profile?.code || ''}</span>
                    </div>
                  ))}
                </div>

                {/* 2. Dynamic Wandering Watermark - drifts smoothly across viewport */}
                <div
                  className="absolute pointer-events-none select-none z-30 transition-all duration-1000 ease-in-out font-black text-xs px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2"
                  style={{
                    top: `${watermarkPos.top}%`,
                    left: `${watermarkPos.left}%`,
                    transform: `translate(-50%, -50%) rotate(${watermarkPos.rotate}deg)`,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{profile?.name || 'الطالب'}</span>
                  <span className="text-cyan-300">|</span>
                  <span dir="ltr">{profile?.phone || '***'}</span>
                  <span className="text-cyan-300">|</span>
                  <span className="text-amber-300" dir="ltr">{profile?.code || 'ID'}</span>
                </div>
              </>
            )}
          </div>
        ) : directVideo || mime.startsWith('video/') ? (
          <div className="relative inline-block max-w-full">
            <video
              src={mediaUrl}
              controls
              autoPlay
              playsInline
              controlsList={role === 'student' ? 'nodownload noplaybackrate' : undefined}
              disablePictureInPicture={role === 'student'}
              onContextMenu={(e) => e.preventDefault()}
              className="max-h-[75vh] max-w-full rounded-2xl bg-black shadow-2xl border border-blue-500/20 select-none"
            />
            {/* Enhanced Dynamic Anti-Piracy Watermark & Protection System */}
            {role === 'student' && (
              <>
                {/* 1. Repeating Watermark Grid */}
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden z-20 flex flex-col justify-around opacity-20">
                  {[0, 1, 2].map((row) => (
                    <div key={row} className="flex justify-around transform -rotate-12 whitespace-nowrap text-xs font-black text-white/70">
                      <span>{profile?.name || 'طالب المنصة'} • {profile?.phone || ''} • كود: {profile?.code || ''}</span>
                      <span className="hidden sm:inline">{profile?.name || 'طالب المنصة'} • {profile?.phone || ''}</span>
                    </div>
                  ))}
                </div>

                {/* 2. Dynamic Wandering Watermark */}
                <div
                  className="absolute pointer-events-none select-none z-30 transition-all duration-1000 ease-in-out font-black text-xs px-3 py-1.5 rounded-full shadow-2xl flex items-center gap-2"
                  style={{
                    top: `${watermarkPos.top}%`,
                    left: `${watermarkPos.left}%`,
                    transform: `translate(-50%, -50%) rotate(${watermarkPos.rotate}deg)`,
                    backgroundColor: 'rgba(15, 23, 42, 0.65)',
                    color: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(4px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    textShadow: '0 2px 4px rgba(0,0,0,0.8)'
                  }}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{profile?.name || 'الطالب'}</span>
                  <span className="text-cyan-300">|</span>
                  <span dir="ltr">{profile?.phone || '***'}</span>
                  <span className="text-cyan-300">|</span>
                  <span className="text-amber-300" dir="ltr">{profile?.code || 'ID'}</span>
                </div>
              </>
            )}
          </div>
        ) : directImage || mime.startsWith('image/') ? (
          <img
            src={mediaUrl}
            alt={content.title || 'صورة'}
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl border border-blue-500/20"
          />
        ) : directPdf || mime === 'application/pdf' ? (
          <iframe
            src={mediaUrl}
            title={content.title || 'ملف PDF'}
            referrerPolicy="origin"
            className="h-[80vh] w-full rounded-2xl bg-white border-0 shadow-2xl"
          />
        ) : external ? (
          <iframe
            src={mediaUrl}
            title={content.title || 'محتوى المنصة'}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            referrerPolicy="origin"
            className="h-[75vh] w-full rounded-2xl bg-black border border-blue-500/20 shadow-2xl"
          />
        ) : (
          <div className="panel p-8 text-center text-white bg-[#0f1b2d] rounded-2xl border border-blue-500/20">
            <p className="font-bold">
              لا يمكن عرض هذا الملف مباشرة داخل المتصفح. استخدم زر التنزيل أعلاه.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
