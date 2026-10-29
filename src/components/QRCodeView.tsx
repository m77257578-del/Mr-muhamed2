import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface QRCodeViewProps {
  value: string;
  size?: number;
  title?: string;
  subtitle?: string;
}

export const QRCodeView: React.FC<QRCodeViewProps> = ({
  value,
  size = 180,
  title,
  subtitle,
}) => {
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size * 2,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        setQrImageUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });
  }, [value, size]);

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-white rounded-2xl shadow-xl border border-slate-200 text-center max-w-xs mx-auto">
      {title && <h5 className="font-black text-slate-900 text-sm mb-1">{title}</h5>}
      {subtitle && <p className="text-[11px] text-slate-500 mb-3">{subtitle}</p>}
      <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 shadow-inner">
        {qrImageUrl ? (
          <img
            src={qrImageUrl}
            alt="QR Code"
            className="rounded-lg object-contain"
            style={{ width: `${size}px`, height: `${size}px` }}
          />
        ) : (
          <div
            className="flex items-center justify-center text-xs text-slate-400 font-bold"
            style={{ width: `${size}px`, height: `${size}px` }}
          >
            جاري التوليد...
          </div>
        )}
      </div>
      <span className="mt-2.5 font-mono text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200 select-all" dir="ltr">
        {value}
      </span>
    </div>
  );
};
