import React from 'react';
import { CourseContentItem, StudentProfile } from '../types';
import { tokens } from '../services/api';
import { Download, ExternalLink, X } from 'lucide-react';

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
  try {
    const url = new URL(value);
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
    return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&playsinline=1&rel=0`;
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
      className="fixed inset-0 z-50 flex flex-col items-center gap-4 overflow-y-auto p-4 sm:p-6"
      style={{ background: 'rgba(16, 42, 67, 0.92)' }}
    >
      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          className="btn-gray flex items-center gap-2 bg-white text-[#102a43]"
          onClick={onClose}
          type="button"
        >
          <X className="w-4 h-4" />
          <span>إغلاق</span>
        </button>

        {canDownload && (
          <a
            className="btn-gold flex items-center gap-2"
            href={mediaUrl}
            download={content.fileName || 'file'}
          >
            <Download className="w-4 h-4" />
            <span>تنزيل الملف</span>
          </a>
        )}

        {external && role !== 'student' && original && (
          <a
            className="btn-gray flex items-center gap-2 bg-white"
            href={original}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="w-4 h-4" />
            <span>فتح الرابط الأصلي</span>
          </a>
        )}
      </div>

      <div className="relative my-auto flex max-h-[82vh] w-full max-w-5xl items-center justify-center overflow-hidden">
        {youtube ? (
          <div className="relative w-full">
            <iframe
              src={youtube}
              title={content.title || 'محتوى المنصة'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              referrerPolicy="origin"
              className="h-[65vh] max-h-[620px] w-full rounded-2xl bg-black border-0 shadow-2xl"
            />
            {role === 'student' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 'auto 16px 14px auto',
                  pointerEvents: 'none',
                  color: 'rgba(255,255,255,.8)',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textShadow: '0 2px 8px rgba(0,0,0,.7)',
                  background: 'rgba(0,0,0,.25)',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,.25)',
                }}
              >
                {profile?.name || 'الطالب'} • {profile?.phone || '***'}
              </div>
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
              onContextMenu={role === 'student' ? (e) => e.preventDefault() : undefined}
              className="max-h-[75vh] max-w-full rounded-2xl bg-black shadow-2xl"
            />
            {role === 'student' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 'auto 16px 14px auto',
                  pointerEvents: 'none',
                  color: 'rgba(255,255,255,.8)',
                  fontSize: '14px',
                  fontWeight: 800,
                  letterSpacing: '.06em',
                  textShadow: '0 2px 8px rgba(0,0,0,.7)',
                  background: 'rgba(0,0,0,.25)',
                  padding: '6px 12px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,.25)',
                }}
              >
                {profile?.name || 'الطالب'} • {profile?.phone || '***'}
              </div>
            )}
          </div>
        ) : directImage || mime.startsWith('image/') ? (
          <img
            src={mediaUrl}
            alt={content.title || 'صورة'}
            className="max-h-[80vh] max-w-full rounded-2xl object-contain shadow-2xl"
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
            className="h-[75vh] w-full rounded-2xl bg-black border-0 shadow-2xl"
          />
        ) : (
          <div className="panel p-8 text-center text-white bg-[#102a43]">
            <p className="font-bold">
              لا يمكن عرض هذا الملف مباشرة داخل المتصفح. استخدم زر التنزيل أعلاه.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
