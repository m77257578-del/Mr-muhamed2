import type { VercelRequest, VercelResponse } from '@vercel/node';
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';

// Read database or initialize in memory/tmp
const DIR = process.env.DATA_DIR || (process.env.VERCEL ? '/tmp' : path.join(process.cwd(), 'data'));
const DBF = path.join(process.cwd(), 'data', 'db.json');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper
let dbCache: any = null;
function getDb() {
  if (dbCache) return dbCache;
  try {
    if (fs.existsSync(DBF)) {
      dbCache = JSON.parse(fs.readFileSync(DBF, 'utf8'));
    } else {
      dbCache = { settings: {}, students: [], parents: [], courses: [], content: [], exams: [], results: [] };
    }
  } catch {
    dbCache = { settings: {}, students: [], parents: [], courses: [], content: [], exams: [], results: [] };
  }
  return dbCache;
}

app.get('/api/public', (req: Request, res: Response) => {
  const db = getDb();
  res.json({
    name: db.settings?.name || 'منصة الأستاذ محمد عبد المقصود',
    logoFile: db.settings?.logoFile || '',
    logoSize: db.settings?.logoSize || 36,
    subtitle: db.settings?.subtitle || 'المنصة التعليمية الشاملة للغة العربية',
    bgPattern: db.settings?.bgPattern || 'gradient',
    primaryColor: db.settings?.primaryColor || '#0284c7',
    headingColor: db.settings?.headingColor || '#ffffff',
    textColor: db.settings?.textColor || '#cbd5e1',
    panelBg: db.settings?.panelBg || '#0d1728',
    cardBg: db.settings?.cardBg || '#111f36',
    accentGold: db.settings?.accentGold || '#f59e0b',
    fontFamily: db.settings?.fontFamily || "'Cairo', sans-serif",
    courses: (db.courses || []).map((c: any) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      grade: c.grade,
      price: c.price,
      days: c.days,
      isFree: !!c.isFree,
      status: c.status,
      imageUrl: c.imageUrl || ''
    })),
    socialLinks: db.socialLinks || [],
    gateways: (db.gateways || []).filter((g: any) => g.active)
  });
});

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req as any, res as any);
}
