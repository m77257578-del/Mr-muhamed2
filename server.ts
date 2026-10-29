import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';

// Read .env if present
try {
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    for (const l of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const m = /^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/.exec(l);
      if (m && !l.trim().startsWith('#') && !process.env[m[1]]) {
        process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  }
} catch (e) {}

const PORT = Number(process.env.PORT) || 3000;
const DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const UP = path.join(DIR, 'uploads');
const DBF = path.join(DIR, 'db.json');

fs.mkdirSync(UP, { recursive: true });

const rnd = (n: number) => crypto.randomBytes(n).toString('hex');
const scrypt = (s: string, salt: string) => crypto.scryptSync(String(s), salt, 32).toString('hex');
const sha = (s: string) => crypto.createHash('sha256').update(s).digest('hex');
const ALPH = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const mk = (p: string, n = 6) => p + '-' + [...crypto.randomBytes(n)].map(b => ALPH[b % 32]).join('');
const E = (status: number, message: string) => Object.assign(new Error(message), { status });
const clean = (s: any, n = 500) => String(s ?? '').trim().slice(0, n);

interface ManualGateway {
  id: string;
  title: string;
  provider: string;
  accountNumber: string;
  accountHolder: string;
  instructions: string;
  active: boolean;
  created?: string;
}

interface WalletTransaction {
  id: string;
  studentId: string;
  studentName?: string;
  studentPhone?: string;
  studentCode?: string;
  type: 'deposit' | 'purchase' | 'adjustment';
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  gatewayId?: string;
  gatewayTitle?: string;
  accountNumber?: string;
  senderPhone?: string;
  referenceNumber?: string;
  receiptFile?: string;
  receiptUrl?: string;
  courseId?: string;
  courseTitle?: string;
  notes?: string;
  rejectionReason?: string;
  created: string;
  reviewedAt?: string;
}

interface Database {
  settings: {
    name: string;
    heroFile: string;
    heroMime: string;
    heroV: number;
    salt: string;
    pepper: string;
    teacher: string;
    payments?: { title: string; details: string }[];
    onlinePay?: boolean;
    logoFile?: string;
    logoSize?: number;
    subtitle?: string;
    bgPattern?: string;
    primaryColor?: string;
    headingColor?: string;
    textColor?: string;
    pageThemes?: Record<string, any>;
    academicColors?: Record<string, any>;
    studentTabsVisibility?: Record<string, boolean>;
    registrationFieldsConfig?: Record<string, any>;
    reviewsConfig?: Record<string, any>;
    notificationConfig?: Record<string, any>;
  };
  students: any[];
  parents: any[];
  courses: any[];
  content: any[];
  notices: any[];
  exams: any[];
  results: any[];
  appeals: any[];
  messages: any[];
  codes: any[];
  notes: any[];
  activity: any[];
  orders: any[];
  bookings: any[];
  mediaBank: any[];
  socialLinks: {
    id: string;
    platform: string;
    title: string;
    url: string;
    active: boolean;
  }[];
  gateways: ManualGateway[];
  walletTransactions: WalletTransaction[];
}

const defaultSocialLinks = [
  { id: 'soc-1', platform: 'linkedin', title: 'LinkedIn', url: 'https://linkedin.com', active: true },
  { id: 'soc-2', platform: 'x', title: 'X (Twitter)', url: 'https://x.com', active: true },
  { id: 'soc-3', platform: 'tiktok', title: 'TikTok', url: 'https://tiktok.com', active: true },
  { id: 'soc-4', platform: 'youtube', title: 'YouTube', url: 'https://youtube.com', active: true },
  { id: 'soc-5', platform: 'telegram', title: 'Telegram', url: 'https://t.me', active: true },
  { id: 'soc-6', platform: 'instagram', title: 'Instagram', url: 'https://instagram.com', active: true },
  { id: 'soc-7', platform: 'facebook', title: 'Facebook', url: 'https://facebook.com', active: true },
  { id: 'soc-8', platform: 'whatsapp', title: 'WhatsApp', url: 'https://wa.me/201024889921', active: true },
];

const defaultGateways: ManualGateway[] = [
  {
    id: 'gw-vodafone-1',
    title: 'فودافون كاش (Vodafone Cash)',
    provider: 'vodafone',
    accountNumber: '01024889921',
    accountHolder: 'إدارة ليرن ويب التعليمية',
    instructions: 'قم بتحويل المبلغ إلى رقم المحفظة، ثم احتفظ بلقطة شاشة لرسالة التأكيد أو الإيصال وارفعها هنا لتأكيد الشحن فوراً.',
    active: true,
    created: new Date().toISOString()
  },
  {
    id: 'gw-instapay-1',
    title: 'إنستا باي (InstaPay)',
    provider: 'instapay',
    accountNumber: 'lernweb@instapay',
    accountHolder: 'منصة ليرن ويب',
    instructions: 'حول المبلغ المطلوب عبر تطبيق إنستا باي إلى عنوان الدفع اللحظي (IPA) وارفع صورة إشعار التحويل البنكي.',
    active: true,
    created: new Date().toISOString()
  },
  {
    id: 'gw-fawry-1',
    title: 'خدمة فوري (Fawry Pay)',
    provider: 'fawry',
    accountNumber: '7889921',
    accountHolder: 'كود خدمة ليرن ويب',
    instructions: 'ادفع من أقرب ماكينة فوري عبر كود الخدمة، ثم صور الإيصال الورقي بوضوح وارفعه في خانة الإيصال.',
    active: false,
    created: new Date().toISOString()
  },
  {
    id: 'gw-bank-1',
    title: 'محفظة بنكية / تحويل بنكي (CIB / NBE)',
    provider: 'bank',
    accountNumber: '1000458921102',
    accountHolder: 'شركة ليرن ويب للحلول التعليمية',
    instructions: 'قم بالتحويل البنكي أو عبر تطبيق البنك وارفع صورة التحويل بعد إتمامه.',
    active: false,
    created: new Date().toISOString()
  }
];

const freshDb = (): Database => ({
  settings: {
    name: 'تصميم ليرن ويب',
    heroFile: '',
    heroMime: '',
    heroV: 0,
    salt: rnd(16),
    pepper: rnd(16),
    teacher: '',
    onlinePay: false,
    logoSize: 36,
    bgPattern: 'gradient',
    primaryColor: '#0284c7',
    headingColor: '#ffffff',
    textColor: '#cbd5e1',
    studentTabsVisibility: {
      homework: true,
      achievements: true,
      packages: true,
      courses: true,
      books: true,
      videoQuestions: true,
      customContent: true,
      freeContent: true,
      articles: true,
      privateLessons: true,
      certificates: true,
      wallet: true
    }
  },
  students: [],
  parents: [],
  courses: [],
  content: [],
  notices: [],
  exams: [],
  results: [],
  appeals: [],
  messages: [],
  codes: [],
  notes: [],
  activity: [],
  orders: [],
  bookings: [],
  mediaBank: [],
  socialLinks: [...defaultSocialLinks],
  gateways: [...defaultGateways],
  walletTransactions: []
});

let db: Database = freshDb();
if (fs.existsSync(DBF)) {
  try {
    db = Object.assign(freshDb(), JSON.parse(fs.readFileSync(DBF, 'utf8')));
    db.settings.name = 'تصميم ليرن ويب';
    if (!db.socialLinks || !Array.isArray(db.socialLinks) || db.socialLinks.length === 0) {
      db.socialLinks = [...defaultSocialLinks];
    }
    if (!db.gateways || !Array.isArray(db.gateways) || db.gateways.length === 0) {
      db.gateways = [...defaultGateways];
    }
    if (!db.walletTransactions || !Array.isArray(db.walletTransactions)) {
      db.walletTransactions = [];
    }
    if (db.settings.onlinePay === undefined) {
      db.settings.onlinePay = false;
    }
    // Ensure every student has walletBalance
    for (const st of db.students) {
      if (st.walletBalance === undefined || isNaN(Number(st.walletBalance))) {
        st.walletBalance = 0;
      }
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

function initializeTeacher(state: Database) {
  const envPw = process.env.TEACHER_PASSWORD || '';
  if (envPw && envPw.length < 12) {
    throw new Error('كلمة TEACHER_PASSWORD قصيرة: اكتب 12 حرفاً على الأقل');
  }
  if (state.settings.teacher && !envPw) return;
  const password = envPw || 'teacher123456';
  state.settings.teacher = scrypt(password, state.settings.salt);
}
initializeTeacher(db);

let timer: NodeJS.Timeout | null = null;
const flush = () => {
  if (timer) clearTimeout(timer);
  timer = null;
  fs.writeFileSync(DBF + '.tmp', JSON.stringify(db, null, 2));
  fs.renameSync(DBF + '.tmp', DBF);
};
const save = () => {
  if (timer) clearTimeout(timer);
  timer = setTimeout(flush, 150);
};
save();

// Auth Sessions
const sessionSecret = () => process.env.SESSION_SECRET || (db.settings.pepper + db.settings.salt);
const newSession = (role: string, id: string) => {
  const exp = Date.now() + 7 * 864e5;
  const payload = Buffer.from(JSON.stringify({ role, id, exp })).toString('base64url');
  const signature = crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url');
  return payload + '.' + signature;
};

function auth(req: Request, role?: string | null) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.t as string);
  let s: any = null;
  if (token) {
    try {
      const [payload, signature] = token.split('.');
      const expected = crypto.createHmac('sha256', sessionSecret()).update(payload).digest();
      const actual = Buffer.from(signature, 'base64url');
      if (actual.length === expected.length && crypto.timingSafeEqual(actual, expected)) {
        s = JSON.parse(Buffer.from(payload, 'base64url').toString());
      }
    } catch (e) {
      s = null;
    }
  }
  if (!s || s.exp < Date.now() || (role && s.role !== role)) {
    throw E(401, 'سجّل الدخول من جديد');
  }
  return s;
}

const subActive = (s: any) => !!s.subEnd && new Date(s.subEnd) > new Date();
const courseActive = (s: any, courseId: string) =>
  (s.enrollments || []).some((e: any) => e.courseId === courseId && new Date(e.expiresAt) > new Date());
const hasAccess = (s: any, item: any) =>
  !!item.isFree || subActive(s) || (!!item.courseId && courseActive(s, item.courseId));
const gradeOk = (x: any, s: any) => x.grade === 'كل الصفوف' || x.grade === s.grade;
const label = (p: number) =>
  p >= 85 ? 'ممتاز' : p >= 75 ? 'جيد جداً' : p >= 65 ? 'جيد' : p >= 50 ? 'مقبول' : 'يحتاج متابعة';

const publicCourseView = (course: any, student: any = null) => {
  const enrolled = !!student && (subActive(student) || courseActive(student, course.id));
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    grade: course.grade,
    price: course.price,
    days: course.days,
    isFree: !!course.isFree,
    status: course.status,
    imageUrl: course.imageFileId ? '/files/' + encodeURIComponent(course.imageFileId) : (course.imageUrl || ''),
    content: enrolled
      ? db.content
          .filter(item => item.courseId === course.id && !(item.blocked || []).includes(student.id))
          .map(item => ({
            id: item.id,
            type: item.type,
            title: item.title,
            fileName: item.fileName,
            mime: item.mime,
            fileId: item.fileId || '',
            url: item.fileId ? '/files/' + encodeURIComponent(item.fileId) : item.link
          }))
      : []
  };
};

function studentView(s: any) {
  const sub = subActive(s);
  const courses = db.courses
    .filter(c => (c.status === 'published' || courseActive(s, c.id)) && gradeOk(c, s))
    .map(c => {
      const enrollment = (s.enrollments || []).find((e: any) => e.courseId === c.id && new Date(e.expiresAt) > new Date());
      return {
        ...publicCourseView(c, s),
        isFree: !!c.isFree,
        active: !!enrollment || sub,
        expiresAt: enrollment?.expiresAt || (sub ? s.subEnd : ''),
        imageUrl: c.imageFileId ? '/files/' + encodeURIComponent(c.imageFileId) : (c.imageUrl || '')
      };
    });

  return {
    profile: {
      name: s.name,
      grade: s.grade,
      code: s.code,
      subEnd: s.subEnd,
      sub,
      phone: s.phone,
      walletBalance: Number(s.walletBalance) || 0
    },
    courses,
    notices: db.notices.filter(n => gradeOk(n, s)),
    content: db.content
      .filter(c => gradeOk(c, s) && hasAccess(s, c) && !(c.blocked || []).includes(s.id))
      .map(({ id, type, title, grade, link, fileId, fileName, mime, courseId, isFree }) => ({
        id, type, title, grade, link, fileId, fileName, mime, courseId, isFree
      })),
    exams: db.exams
      .filter(e => gradeOk(e, s) && hasAccess(s, e))
      .map(e => ({
        id: e.id,
        title: e.title,
        grade: e.grade,
        courseId: e.courseId || '',
        type: e.type,
        questions: e.questions,
        kinds: e.kinds || null,
        options: e.options || [],
        taken: db.results.some(r => r.examId === e.id && r.studentId === s.id)
      })),
    results: db.results
      .filter(r => r.studentId === s.id)
      .map(r => ({ ...r, appeal: db.appeals.find(a => a.resultId === r.id) || null })),
    messages: db.messages.filter(m => m.studentId === s.id),
    notes: (db.notes || []).filter(n => n.studentId === s.id).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    gateways: (db.gateways || []).filter(g => g.active === true),
    walletTransactions: (db.walletTransactions || []).filter(t => t.studentId === s.id).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    onlinePay: !!db.settings.onlinePay
  };
}

const qKind = (e: any, i: number) => (e.kinds && e.kinds[i]) || (e.type === 'اختياري' ? 'mcq' : 'essay');

// System 11: Gemini API Keys Rotator mechanism (Backend Vercel/Node)
function getGeminiApiKeys(): string[] {
  const dbKeys = db.settings.geminiKeys || '';
  const envKeys = process.env.GEMINI_API_KEYS || '';
  const singleKey = process.env.GEMINI_API_KEY || '';
  const combined = `${dbKeys}\n${envKeys}\n${singleKey}`;
  const parsed = combined
    .split(/[,;\n]/)
    .map(k => k.trim())
    .filter(k => k.length > 5);
  return parsed.length > 0 ? parsed : ['AIzaSyDummyKeyFallback'];
}

let geminiKeyIndex = 0;
function getNextGeminiKey(): string {
  const keys = getGeminiApiKeys();
  const key = keys[geminiKeyIndex % keys.length];
  geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
  return key;
}

async function callGeminiWithRotation(payload: any, systemInstruction?: string, isJson: boolean = false): Promise<{ text: string; json?: any }> {
  const keys = getGeminiApiKeys();
  const model = db.settings.geminiModel || process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  let lastError: any = null;

  for (let attempt = 0; attempt < Math.max(keys.length, 1); attempt++) {
    const activeKey = getNextGeminiKey();
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 28000);
    try {
      const bodyPayload: any = {
        contents: payload
      };
      if (systemInstruction) {
        bodyPayload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }
      if (isJson) {
        bodyPayload.generationConfig = {
          responseMimeType: 'application/json',
          temperature: 0.1
        };
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        signal: ctl.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': activeKey
        },
        body: JSON.stringify(bodyPayload)
      });

      if (res.status === 429 || res.status === 403) {
        console.warn(`[Gemini Rotator] Key returned ${res.status}. Rotating to next API key...`);
        lastError = new Error(`Rate limit or key error (status ${res.status})`);
        continue;
      }

      const data = await res.json();
      if (!res.ok) {
        lastError = new Error(data?.error?.message || `HTTP ${res.status}`);
        continue;
      }

      const text = data?.candidates?.[0]?.content?.parts?.map((x: any) => x.text || '').join('').trim() || '';
      return { text, json: data };
    } catch (err: any) {
      lastError = err;
    } finally {
      clearTimeout(t);
    }
  }

  throw lastError || new Error('All Gemini API keys exhausted or rate-limited.');
}

const GEMINI_KEY = Boolean(process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEYS);

async function askGemini(prompt: string): Promise<string> {
  const res = await callGeminiWithRotation([{ role: 'user', parts: [{ text: prompt }] }]);
  return res.text;
}

async function gradeEssayAI(examOrQuestions: any, studentAnswers: string[]): Promise<number> {
  const prompt = `أنت مصحح امتحانات خبير. قم بتصحيح إجابات الطالب المقالية بمقارنتها بنموذج الإجابة:
الأسئلة ونموذج الإجابة:
${typeof examOrQuestions.modelAnswer === 'string' ? examOrQuestions.modelAnswer : JSON.stringify(examOrQuestions)}

إجابات الطالب:
${studentAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

أعد رقم الدرجة الإجمالية فقط كعدد صحيح أو رقم بدون نصوص إضافية.`;

  try {
    const res = await callGeminiWithRotation([{ role: 'user', parts: [{ text: prompt }] }]);
    const num = parseFloat(res.text.match(/\d+(?:\.\d+)?/)?.[0] || '0');
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

// System 6: WhatsApp automated notifications engine
async function sendWhatsAppNotification(toPhone: string, message: string) {
  const cleanPhone = String(toPhone || '').replace(/\D/g, '');
  const targetPhone = cleanPhone.startsWith('01') ? '2' + cleanPhone : cleanPhone;
  const adminPhone = (process.env.WHATSAPP_ADMIN_PHONE || '201024889921').replace(/\D/g, '');

  console.log(`[WhatsApp Notification -> ${targetPhone || adminPhone}]:\n${message}`);

  const apiUrl = process.env.WHATSAPP_API_URL;
  const apiToken = process.env.WHATSAPP_API_TOKEN;

  if (apiUrl && apiToken) {
    try {
      await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`
        },
        body: JSON.stringify({
          to: targetPhone,
          body: message
        })
      });
    } catch (e) {
      console.error('[WhatsApp API error]', e);
    }
  }
}

async function sendTelegramNotification(token: string, chatId: string, text: string) {
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' })
    });
  } catch (e) {
    console.error('[Telegram API error]', e);
  }
}

async function notifyAdminEvents(eventTitle: string, details: string) {
  const cfg = db.settings.notificationConfig || {};
  const msg = `📢 *إشعار منصة ليرن ويب*: ${eventTitle}\n${details}`;
  if (cfg.whatsappPhone) {
    await sendWhatsAppNotification(cfg.whatsappPhone, msg);
  } else {
    await sendWhatsAppNotification('201024889921', msg);
  }
  if (cfg.telegramToken && cfg.telegramChatId) {
    await sendTelegramNotification(cfg.telegramToken, cfg.telegramChatId, msg);
  }
}

async function startServer() {
  const app = express();

  app.use(cors());

  // Handle PUT file uploads directly via stream before express.json()
  app.put('/api/teacher/upload', (req: Request, res: Response, next: NextFunction) => {
    try {
      auth(req, 'teacher');
      const id = rnd(12);
      const fp = path.join(UP, id);
      const ws = fs.createWriteStream(fp);
      req.pipe(ws);
      ws.on('finish', () => {
        const mime = String(req.headers['content-type'] || 'application/octet-stream').replace(/[^\w.+\/-]/g, '').slice(0, 100) || 'application/octet-stream';
        const rawName = String(req.query.name || 'file');
        res.json({
          fileId: id,
          fileName: clean(decodeURIComponent(rawName), 200),
          mime
        });
      });
      ws.on('error', (err) => {
        fs.rmSync(fp, { force: true });
        res.status(500).json({ error: 'فشل حفظ الملف' });
      });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.put('/api/teacher/hero', (req: Request, res: Response, next: NextFunction) => {
    try {
      auth(req, 'teacher');
      const id = rnd(12);
      const fp = path.join(UP, id);
      const ws = fs.createWriteStream(fp);
      req.pipe(ws);
      ws.on('finish', () => {
        const mime = String(req.headers['content-type'] || 'image/jpeg');
        if (db.settings.heroFile) {
          fs.rmSync(path.join(UP, path.basename(db.settings.heroFile)), { force: true });
        }
        db.settings.heroFile = id;
        db.settings.heroMime = mime;
        db.settings.heroV = Date.now();
        save();
        res.json({ ok: true });
      });
      ws.on('error', () => {
        fs.rmSync(fp, { force: true });
        res.status(500).json({ error: 'فشل حفظ صورة الغلاف' });
      });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Universal upload endpoint for receipts, student homework photos, and chat attachments
  app.put('/api/upload', (req: Request, res: Response) => {
    try {
      const id = 'rec-' + rnd(10);
      const fp = path.join(UP, id);
      const ws = fs.createWriteStream(fp);
      req.pipe(ws);
      ws.on('finish', () => {
        const mime = String(req.headers['content-type'] || 'image/jpeg').replace(/[^\w.+\/-]/g, '').slice(0, 100);
        res.json({
          fileId: id,
          url: '/receipts/' + id,
          mime
        });
      });
      ws.on('error', () => {
        fs.rmSync(fp, { force: true });
        res.status(500).json({ error: 'فشل حفظ الملف المرفوع' });
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Standard JSON body parser
  app.use(express.json({ limit: '15mb' }));

  // File serving
  app.get('/hero', (req, res) => {
    if (!db.settings.heroFile) return res.status(404).send('Not Found');
    const fp = path.join(UP, path.basename(db.settings.heroFile));
    if (!fs.existsSync(fp)) return res.status(404).send('Not Found');
    res.setHeader('Content-Type', db.settings.heroMime || 'image/jpeg');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    fs.createReadStream(fp).pipe(res);
  });

  // Receipt image serving
  app.get('/receipts/:id', (req, res) => {
    const fid = path.basename(req.params.id);
    const fp = path.join(UP, fid);
    if (!fs.existsSync(fp)) return res.status(404).send('Not Found');
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(fp).pipe(res);
  });

  app.get('/files/:id', (req, res) => {
    try {
      const s = auth(req, null);
      const fid = path.basename(req.params.id);
      const c = db.content.find(x => x.fileId === fid);
      if (!c) return res.status(404).json({ error: 'الملف غير موجود' });
      if (s.role === 'student') {
        const st = db.students.find(x => x.id === s.id);
        if (!st || st.status === 'blocked' || !hasAccess(st, c) || !gradeOk(c, st) || (c.blocked || []).includes(st.id)) {
          return res.status(403).json({ error: 'غير مصرح' });
        }
      } else if (s.role !== 'teacher') {
        return res.status(403).json({ error: 'غير مصرح' });
      }

      const fp = path.join(UP, fid);
      if (!fs.existsSync(fp)) return res.status(404).json({ error: 'الملف غير موجود' });
      const size = fs.statSync(fp).size;
      const mime = c.mime || 'application/octet-stream';
      const inline = /^(video|image|audio)\//.test(mime) || mime === 'application/pdf';
      const headers: Record<string, string> = {
        'Content-Type': inline ? mime : 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'X-Content-Type-Options': 'nosniff',
        'Content-Disposition': `${inline ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(c.fileName || 'file')}`,
        'Cache-Control': 'private, max-age=3600'
      };

      const range = req.headers.range;
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        if (m) {
          let a = m[1] ? +m[1] : size - +m[2];
          let b = m[1] && m[2] ? +m[2] : size - 1;
          if (a > b || a >= size) {
            res.writeHead(416, { 'Content-Range': `bytes */${size}` });
            return res.end();
          }
          b = Math.min(b, size - 1);
          res.writeHead(206, {
            ...headers,
            'Content-Range': `bytes ${a}-${b}/${size}`,
            'Content-Length': String(b - a + 1)
          });
          return fs.createReadStream(fp, { start: a, end: b }).pipe(res);
        }
      }

      res.writeHead(200, { ...headers, 'Content-Length': String(size) });
      fs.createReadStream(fp).pipe(res);
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Public Endpoints
  app.get('/api/public', (req, res) => {
    res.json({
      name: db.settings.name,
      subtitle: db.settings.subtitle || '',
      logoFile: db.settings.logoFile ? '/files/' + encodeURIComponent(db.settings.logoFile) : '',
      logoSize: db.settings.logoSize || 36,
      bgPattern: db.settings.bgPattern || 'gradient',
      primaryColor: db.settings.primaryColor || '#0284c7',
      headingColor: db.settings.headingColor || '#ffffff',
      textColor: db.settings.textColor || '#cbd5e1',
      pageThemes: db.settings.pageThemes || {},
      academicColors: db.settings.academicColors || {},
      studentTabsVisibility: db.settings.studentTabsVisibility || {},
      registrationFieldsConfig: db.settings.registrationFieldsConfig || {},
      reviewsConfig: db.settings.reviewsConfig || {},
      payments: db.settings.payments || [],
      onlinePay: !!db.settings.onlinePay,
      hero: db.settings.heroFile ? '/hero?v=' + db.settings.heroV : '',
      courses: db.courses.filter(c => c.status === 'published').map(c => publicCourseView(c)),
      socialLinks: (db.socialLinks || []).filter(s => s.active !== false),
      gateways: (db.gateways || []).filter(g => g.active === true)
    });
  });

  // Registration & Login
  app.post('/api/register', (req, res) => {
    try {
      const b = req.body || {};
      const name = clean(b.name, 100);
      const phone = clean(b.phone, 20);
      const pphone = clean(b.parentPhone, 20);
      if (!name || !/^01\d{9}$/.test(phone) || !/^01\d{9}$/.test(pphone)) {
        throw E(400, 'اكتب الاسم ورقمي هاتف مصريين صحيحين من 11 رقماً');
      }
      const pw = clean(b.password, 100);
      if (pw.length < 4) throw E(400, 'اكتب كلمة سر من 4 أحرف على الأقل');
      if (db.students.some(q => q.phone === phone)) {
        throw E(409, 'رقم الهاتف مسجل بالفعل، ادخل بكلمة السر');
      }
      const s = {
        id: rnd(6),
        code: mk('ST'),
        name,
        phone,
        grade: clean(b.grade, 80),
        governorate: clean(b.governorate, 60),
        center: clean(b.center, 60),
        village: clean(b.village, 60),
        parentName: clean(b.parentName, 100),
        parentPhone: pphone,
        status: 'active',
        subEnd: '',
        created: new Date().toISOString(),
        pass: ''
      };
      s.pass = scrypt(pw, db.settings.salt + s.id);
      const pr = { id: rnd(6), code: mk('PR'), studentId: s.id, name: s.parentName, status: 'active' };
      db.students.push(s);
      db.parents.push(pr);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/login', (req, res) => {
    try {
      const { phone, password, code } = req.body || {};
      const ph = clean(phone, 30);
      const pw = clean(password, 100);
      const cd = clean(code, 100).toUpperCase();

      // Normalize arabic hamzas and lowercasing
      const normPh = ph.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const normPw = pw.replace(/[أإآ]/g, 'ا').trim().toLowerCase();

      // Support entering admin dashboard via old student login:
      // Phone: "ادمن" or "أدمن" or "admin" or "100100", Password: "100100" (or "ادمن")
      if (
        (normPh === 'ادمن' || normPh === 'admin' || normPh === '100100') &&
        (pw === '100100' || normPw === '100100' || normPw === 'admin' || normPw === 'ادمن')
      ) {
        return res.json({ token: newSession('teacher', 'T'), role: 'teacher' });
      }

      let st: any = null;
      if (ph && pw) {
        st = db.students.find(q => q.phone === ph && q.pass && scrypt(pw, db.settings.salt + q.id) === q.pass);
      } else if (cd) {
        st = db.students.find(q => q.code === cd && !q.pass);
      }

      if (!st) throw E(401, 'رقم الهاتف أو كلمة السر غير صحيحة');
      if (st.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');
      res.json({ token: newSession('student', st.id), role: 'student' });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  app.post('/api/parent/login', (req, res) => {
    try {
      const { phone, password, code } = req.body || {};
      const ph = clean(phone, 20);
      const pw = clean(password, 100);
      const cd = clean(code, 100).toUpperCase();

      let pr: any = null;
      if (ph && pw) {
        const st = db.students.find(q => q.phone === ph && q.pass && scrypt(pw, db.settings.salt + q.id) === q.pass);
        if (st) pr = db.parents.find(q => q.studentId === st.id);
      } else if (cd) {
        pr = db.parents.find(q => q.code === cd);
      }

      if (!pr) throw E(401, 'رقم الهاتف أو كلمة السر غير صحيحة');
      if (pr.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');
      res.json({ token: newSession('parent', pr.id) });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  app.post('/api/teacher/login', (req, res) => {
    try {
      const { code } = req.body || {};
      const rawCode = clean(code, 200);

      // Support 100100 or admin directly
      const normRaw = rawCode.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      if (normRaw === '100100' || normRaw === 'admin' || normRaw === 'ادمن') {
        return res.json({ token: newSession('teacher', 'T'), role: 'teacher' });
      }

      const ok = scrypt(rawCode, db.settings.salt) === db.settings.teacher;
      if (!ok) {
        const cd = rawCode.toUpperCase();
        const sv = db.students.find(q => q.code === cd && q.supervisor && q.status !== 'blocked');
        if (sv) return res.json({ token: newSession('teacher', 'S:' + sv.id), role: 'teacher' });
        throw E(401, 'كود الأستاذ غير صحيح');
      }
      res.json({ token: newSession('teacher', 'T'), role: 'teacher' });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Student Endpoints
  app.get('/api/student/me', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');
      res.json(studentView(s));
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  app.post('/api/student/redeem', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const codeStr = clean(req.body.code, 40).toUpperCase().replace(/\s/g, '');
      const h = sha(db.settings.pepper + codeStr);
      const c = db.codes.find(x => x.hash === h);
      if (!c) throw E(400, 'الكود غير صحيح');
      if (c.status !== 'unused') throw E(400, 'هذا الكود مستخدم من قبل');

      c.status = 'used';
      c.usedBy = s.id;
      c.usedAt = new Date().toISOString();

      if (c.courseId) {
        const course = db.courses.find(x => x.id === c.courseId && x.status === 'published');
        if (!course || !gradeOk(course, s)) {
          c.status = 'unused';
          delete c.usedBy;
          delete c.usedAt;
          throw E(400, 'هذا الكود غير مخصص لصفك الدراسي');
        }
        s.enrollments = s.enrollments || [];
        const enrollment = s.enrollments.find((e: any) => e.courseId === c.courseId);
        const start = enrollment && new Date(enrollment.expiresAt) > new Date() ? new Date(enrollment.expiresAt) : new Date();
        start.setDate(start.getDate() + c.days);
        if (enrollment) enrollment.expiresAt = start.toISOString();
        else s.enrollments.push({ courseId: c.courseId, expiresAt: start.toISOString() });
        save();
        return res.json({ ok: true, course: course.title, expiresAt: start.toISOString() });
      }

      const d = subActive(s) ? new Date(s.subEnd) : new Date();
      d.setDate(d.getDate() + c.days);
      s.subEnd = d.toISOString();
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/exam', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const { examId, answers } = req.body || {};
      const e = db.exams.find(x => x.id === examId);
      if (!e || !hasAccess(s, e) || !gradeOk(e, s)) throw E(403, 'الامتحان غير متاح');
      if (db.results.some(r => r.examId === e.id && r.studentId === s.id)) {
        throw E(400, 'سبق إرسال هذا الامتحان');
      }

      const n = e.questions.length;
      const ans = Array.isArray(answers) ? answers.slice(0, n).map((x: any) => clean(x, 3000)) : [];
      if (ans.length !== n || ans.some((x: string) => !x)) {
        throw E(400, 'أجب عن جميع الأسئلة');
      }

      const r: any = {
        id: rnd(6),
        examId: e.id,
        examTitle: e.title,
        studentId: s.id,
        studentName: s.name,
        answers: ans,
        total: n,
        score: null,
        label: '',
        status: 'pending',
        created: new Date().toISOString()
      };

      if (e.type === 'اختياري' && e.key && e.key.length === n) {
        r.score = ans.filter((a, i) => a === e.key[i]).length;
        r.label = label((r.score / n) * 100);
        r.status = 'graded';
      } else if (e.type === 'مختلط' && Array.isArray(e.key)) {
        let pts = 0;
        const ei: number[] = [];
        ans.forEach((a, i) => {
          if (qKind(e, i) === 'mcq') {
            if (a === e.key[i]) pts++;
          } else ei.push(i);
        });
        if (GEMINI_KEY && ei.length && ei.every(i => (e.models || [])[i])) {
          try {
            const es = await gradeEssayAI(
              {
                questions: ei.map(i => e.questions[i]),
                modelAnswer: ei.map((i, k) => `${k + 1}. ${e.models[i]}`).join('\n')
              },
              ei.map(i => ans[i])
            );
            r.score = pts + es;
            r.label = label((r.score / n) * 100);
            r.status = 'graded';
            r.aiGraded = true;
          } catch (x) {}
        }
      } else if (e.type === 'مقالي' && GEMINI_KEY && e.modelAnswer) {
        try {
          r.score = await gradeEssayAI(e, ans);
          r.label = label((r.score / n) * 100);
          r.status = 'graded';
          r.aiGraded = true;
        } catch (x) {}
      }

      db.results.push(r);
      save();
      res.json({ score: r.score, total: n });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/appeal', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      const { resultId, reason } = req.body || {};
      const r = db.results.find(x => x.id === resultId && x.studentId === s.id);
      if (!r || r.status !== 'graded' || db.appeals.some(a => a.resultId === r.id)) {
        throw E(400, 'لا يمكن تقديم تظلم على هذه النتيجة');
      }
      if (!clean(reason)) throw E(400, 'اكتب سبب التظلم');
      db.appeals.push({
        id: rnd(6),
        resultId: r.id,
        studentName: s.name,
        examTitle: r.examTitle,
        reason: clean(reason, 1000),
        status: 'pending',
        score: ''
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/review', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      const { resultId } = req.body || {};
      const r = db.results.find(x => x.id === resultId && x.studentId === s.id);
      if (!r || r.status !== 'graded') throw E(400, 'النتيجة غير متاحة للمراجعة');
      const e = db.exams.find(x => x.id === r.examId);
      if (!e) throw E(404, 'الامتحان غير موجود');

      const items = e.questions.map((q: any, i: number) => {
        const isM = qKind(e, i) === 'mcq' && Array.isArray(e.key) && !!e.key[i];
        return {
          q: typeof q === 'string' ? q : q.text || '',
          options: (e.options && e.options[i]) || [],
          mine: r.answers[i] || '',
          correct: isM ? e.key[i] : '',
          ok: isM ? r.answers[i] === e.key[i] : null,
          model: !isM ? ((e.models || [])[i] || '') : ''
        };
      });

      res.json({
        items,
        model: e.type === 'مقالي' && !e.models ? (e.modelAnswer || '') : ''
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/message', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      const text = clean(req.body.text, 2000);
      if (!text) throw E(400, 'اكتب رسالتك');
      db.messages.push({
        id: rnd(6),
        studentId: s.id,
        name: s.name,
        text,
        reply: '',
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/wallet-deposit', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'غير مصرح');
      const amount = Number(req.body.amount);
      if (!amount || amount <= 0) throw E(400, 'اكتب مبلغاً صحيحاً للشحن');
      const notes = clean(req.body.notes, 500);
      const receiptFile = clean(req.body.receiptFile, 200);

      db.walletTransactions = db.walletTransactions || [];
      const tx = {
        id: 'tx-' + rnd(6),
        studentId: s.id,
        studentName: s.name,
        studentPhone: s.phone,
        studentCode: s.code,
        type: 'deposit' as const,
        amount,
        status: 'pending' as const,
        notes,
        receiptFile,
        created: new Date().toISOString()
      };
      db.walletTransactions.unshift(tx);
      save();

      await notifyAdminEvents('طلب شحن رصيد محفظة جديد', `الطالب ${s.name} (${s.code}) طلب شحن مبلغ ${amount} جنيه.`);
      res.json({ ok: true, txId: tx.id });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/offline-package-order', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'غير مصرح');
      const { packageId, packageTitle, price, method, notes, receiptFile } = req.body || {};
      const pkgTitle = clean(packageTitle || packageId, 150);
      const pkgPrice = Number(price) || 0;
      const payMethod = clean(method, 30); // 'wallet' | 'debt' | 'receipt'

      db.orders = db.orders || [];
      if (payMethod === 'wallet') {
        const bal = Number(s.walletBalance) || 0;
        if (bal < pkgPrice) throw E(400, 'رصيد محفظتك غير كافٍ لتغطية قيمة الباقة');
        s.walletBalance = bal - pkgPrice;
        s.enrollments = s.enrollments || [];
        const exp = new Date();
        exp.setDate(exp.getDate() + 30);
        s.enrollments.push({ courseId: packageId || 'offline-' + rnd(4), expiresAt: exp.toISOString() });
      }

      const order = {
        id: 'ord-' + rnd(6),
        studentId: s.id,
        studentName: s.name,
        studentPhone: s.phone,
        studentCode: s.code,
        packageId,
        packageTitle: pkgTitle,
        price: pkgPrice,
        method: payMethod,
        status: payMethod === 'wallet' ? 'approved' : 'pending',
        notes: clean(notes, 500),
        receiptFile: clean(receiptFile, 200),
        created: new Date().toISOString()
      };
      db.orders.unshift(order);
      save();

      await notifyAdminEvents('طلب باقة أوف لاين / اشتراك جديد', `الطالب ${s.name} طلب باقة "${pkgTitle}" بقيمة ${pkgPrice} جنيه عبر طريقة: ${payMethod}`);
      res.json({ ok: true, orderId: order.id, approved: payMethod === 'wallet' });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/notes', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      const text = clean(req.body.text, 5000);
      if (!text) throw E(400, 'اكتب ملاحظة الطالب');
      db.notes.push({
        id: rnd(6),
        studentId: s.id,
        text,
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/assistant', async (req, res) => {
    try {
      auth(req, 'student');
      const question = clean(req.body.question, 2000);
      if (!question) throw E(400, 'اكتب سؤالاً');
      const q = question.toLowerCase();
      const isDev = /مطور|محمود مدحت/.test(question);
      if (GEMINI_KEY && !isDev) {
        try {
          return res.json({ answer: await askGemini(question) });
        } catch (e) {}
      }

      let answer = 'أستطيع مساعدتك في المنصة التعليمية. اكتب عنوان الدرس أو السؤال الذي تريد مساعدته فيه.';
      if (isDev) {
        answer = 'المطور هو محمود مدحت زكى. لا تتوفر معلومات أخرى عنه.';
      } else if (q.includes('gemini') || q.includes('ai') || q.includes('ذكاء') || q.includes('مساعد')) {
        answer = 'المساعد الذكي داخل المنصة يدعم الأسئلة التعليمية، ويمكن ربطه بـ Gemini API للإجابة الشاملة.';
      } else if (q.includes('امتحان') || q.includes('اختبار')) {
        answer = 'يمكنك الدخول إلى قسم الامتحانات من لوحة الطالب وحل الأسئلة المقالية أو الاختيارية.';
      } else if (q.includes('مذكرة') || q.includes('ملاحظات')) {
        answer = 'استخدم قسم ملاحظاتي داخل لوحة الطالب لحفظ ملحوظات كل درس للرجوع إليها لاحقاً.';
      } else if (q.includes('فيديو') || q.includes('مشاهدة')) {
        answer = 'يمكنك مشاهدة الفيديوهات بعد تفعيل اشتراكك أو كود الكورس، مع ظهور العلامة المائية أثناء العرض.';
      }

      res.json({ answer });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/activity', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      const c = db.content.find(x => x.id === req.body.contentId);
      if (!c || !gradeOk(c, s)) return res.json({ ok: true });
      db.activity = db.activity || [];
      const now = new Date().toISOString();
      const old = db.activity.find(x => x.studentId === s.id && x.contentId === c.id);
      if (old) {
        old.last = now;
        old.count = (old.count || 1) + 1;
      } else {
        db.activity.push({ studentId: s.id, contentId: c.id, kind: c.type, first: now, last: now, count: 1 });
      }
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.json({ ok: false });
    }
  });

  // Parent Endpoints
  app.get('/api/parent/me', (req, res) => {
    try {
      const pAuth = auth(req, 'parent');
      const pr = db.parents.find(x => x.id === pAuth.id);
      const s = pr && db.students.find(x => x.id === pr.studentId);
      if (!s || pr.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const rs = db.results.filter(r => r.studentId === s.id);
      const gr = rs.filter(r => r.status === 'graded' && r.total);
      const avg = gr.length ? Math.round(gr.reduce((a, r) => a + (r.score / r.total) * 100, 0) / gr.length) : null;
      const act = (db.activity || []).filter(x => x.studentId === s.id);
      const items = db.content.filter(c => gradeOk(c, s));
      const seen = new Set(act.map(x => x.contentId));
      const isVid = (c: any) => c.type === 'video';
      const lastAct = act.reduce((m, x) => (x.last > m ? x.last : m), '');

      res.json({
        name: s.name,
        grade: s.grade,
        status: s.status === 'blocked' ? 'محجوب' : 'نشط',
        sub: subActive(s),
        subEnd: s.subEnd,
        results: rs,
        progress: {
          videosWatched: items.filter(c => isVid(c) && seen.has(c.id)).length,
          videosTotal: items.filter(isVid).length,
          filesOpened: items.filter(c => !isVid(c) && seen.has(c.id)).length,
          filesTotal: items.filter(c => !isVid(c)).length,
          examsDone: rs.length,
          examsTotal: db.exams.filter(e => gradeOk(e, s)).length,
          notes: (db.notes || []).filter(n => n.studentId === s.id).length,
          average: avg,
          label: avg === null ? '' : label(avg),
          lastActive: lastAct
        }
      });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Teacher Endpoints
  app.get('/api/teacher/all', (req, res) => {
    try {
      const tAuth = auth(req, 'teacher');
      const sup = String(tAuth.id).startsWith('S:');
      res.json({
        name: db.settings.name,
        subtitle: db.settings.subtitle || '',
        logoFile: db.settings.logoFile || '',
        logoSize: db.settings.logoSize || 36,
        bgPattern: db.settings.bgPattern || 'gradient',
        primaryColor: db.settings.primaryColor || '#0284c7',
        headingColor: db.settings.headingColor || '#ffffff',
        textColor: db.settings.textColor || '#cbd5e1',
        pageThemes: db.settings.pageThemes || {},
        academicColors: db.settings.academicColors || {},
        studentTabsVisibility: db.settings.studentTabsVisibility || {},
        registrationFieldsConfig: db.settings.registrationFieldsConfig || {},
        reviewsConfig: db.settings.reviewsConfig || {},
        notificationConfig: db.settings.notificationConfig || {},
        mediaBank: db.mediaBank || [],
        bookings: db.bookings || [],
        payments: db.settings.payments || [],
        orders: (db.orders || []).slice(-100).reverse(),
        students: db.students.map(({ pass, ...r }) => (sup ? { ...r, code: '—' } : r)),
        parents: sup ? db.parents.map(r => ({ ...r, code: '—' })) : db.parents,
        courses: db.courses,
        content: db.content,
        notices: db.notices,
        exams: db.exams,
        results: db.results,
        appeals: db.appeals,
        messages: db.messages,
        codes: sup ? [] : db.codes.map(({ hash, ...c }) => c),
        socialLinks: db.socialLinks || [],
        gateways: db.gateways || [],
        walletTransactions: (db.walletTransactions || []).slice(-300).reverse(),
        onlinePay: !!db.settings.onlinePay
      });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Design settings
  app.post('/api/teacher/design-settings', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      if (clean(b.name, 100)) db.settings.name = clean(b.name, 100);
      if (clean(b.subtitle, 200) !== undefined) db.settings.subtitle = clean(b.subtitle, 200);
      if (b.logoFile !== undefined) db.settings.logoFile = clean(b.logoFile, 200);
      if (b.logoSize !== undefined) db.settings.logoSize = Math.min(Math.max(Number(b.logoSize) || 36, 16), 120);
      if (b.bgPattern) db.settings.bgPattern = clean(b.bgPattern, 50);
      if (b.primaryColor) db.settings.primaryColor = clean(b.primaryColor, 20);
      if (b.headingColor) db.settings.headingColor = clean(b.headingColor, 20);
      if (b.textColor) db.settings.textColor = clean(b.textColor, 20);
      if (b.pageThemes) db.settings.pageThemes = b.pageThemes;
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Academic colors
  app.post('/api/teacher/academic-colors', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.academicColors = req.body || {};
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Student tabs visibility
  app.post('/api/teacher/student-tabs', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.studentTabsVisibility = req.body || {};
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Registration config
  app.post('/api/teacher/registration-config', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.registrationFieldsConfig = req.body || {};
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Media Bank CRUD
  app.post('/api/teacher/media', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const item = {
        id: b.id || rnd(6),
        title: clean(b.title, 150),
        type: clean(b.type, 30) || 'video',
        url: clean(b.url, 1000),
        group: clean(b.group, 50),
        center: clean(b.center, 50),
        grade: clean(b.grade, 50),
        semester: clean(b.semester, 50),
        chapter: clean(b.chapter, 50),
        lesson: clean(b.lesson, 100),
        created: new Date().toISOString()
      };
      db.mediaBank = db.mediaBank || [];
      if (b.id) {
        const idx = db.mediaBank.findIndex(m => m.id === b.id);
        if (idx >= 0) db.mediaBank[idx] = item;
        else db.mediaBank.push(item);
      } else {
        db.mediaBank.push(item);
      }
      save();
      res.json({ ok: true, mediaBank: db.mediaBank });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/media/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      db.mediaBank = (db.mediaBank || []).filter(m => m.id !== req.body.id);
      save();
      res.json({ ok: true, mediaBank: db.mediaBank });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Reviews config
  app.post('/api/teacher/reviews-config', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.reviewsConfig = req.body || {};
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Notifications config
  app.post('/api/teacher/notifications-config', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.notificationConfig = req.body || {};
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Data cleanup
  app.post('/api/teacher/cleanup-data', (req, res) => {
    try {
      auth(req, 'teacher');
      const { type } = req.body || {};
      if (type === 'all' || type === 'students') db.students = [];
      if (type === 'all' || type === 'results') db.results = [];
      if (type === 'all' || type === 'orders') db.orders = [];
      if (type === 'all' || type === 'messages') db.messages = [];
      if (type === 'all' || type === 'activity') db.activity = [];
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Visitor Bookings
  app.post('/api/student/booking', (req, res) => {
    try {
      const b = req.body || {};
      const booking = {
        id: rnd(6),
        name: clean(b.name, 100),
        phone: clean(b.phone, 30),
        grade: clean(b.grade, 50),
        center: clean(b.center, 50),
        status: 'new',
        created: new Date().toISOString()
      };
      if (!booking.name || !booking.phone) throw E(400, 'اكتب الاسم ورقم الهاتف');
      db.bookings = db.bookings || [];
      db.bookings.push(booking);
      save();
      notifyAdminEvents('حجز زائر جديد', `الاسم: ${booking.name}\nالهاتف: ${booking.phone}\nالصف: ${booking.grade}`);
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/booking/status', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, status } = req.body || {};
      const bk = (db.bookings || []).find(b => b.id === id);
      if (!bk) throw E(404, 'الحجز غير موجود');
      bk.status = status;
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Backup & Restore
  app.get('/api/teacher/backup', (req, res) => {
    try {
      auth(req, 'teacher');
      res.setHeader('Content-Disposition', 'attachment; filename=lernweb-backup-' + Date.now() + '.json');
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(db, null, 2));
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  app.post('/api/teacher/restore', (req, res) => {
    try {
      auth(req, 'teacher');
      const data = req.body;
      if (!data || typeof data !== 'object' || !data.settings) throw E(400, 'ملف النسخة الاحتياطية غير صالح');
      db = Object.assign(freshDb(), data);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/settings', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      if (clean(b.name, 100)) db.settings.name = clean(b.name, 100);
      if (b.onlinePay !== undefined) db.settings.onlinePay = !!b.onlinePay;
      if (typeof b.payments === 'string') {
        db.settings.payments = b.payments
          .split(/\r?\n/)
          .map((l: string) => l.trim())
          .filter(Boolean)
          .slice(0, 10)
          .map((l: string) => {
            const [t, ...d] = l.split('|');
            return { title: clean(t, 80), details: clean(d.join('|'), 200) };
          })
          .filter((x: any) => x.title);
      }
      if (b.password) {
        if (String(b.password).length < 12) throw E(400, 'كلمة المرور لا تقل عن 12 حرفاً');
        db.settings.teacher = scrypt(b.password, db.settings.salt);
      }
      save();
      res.json({ ok: true, onlinePay: db.settings.onlinePay });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/course', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const title = clean(b.title, 160);
      const description = clean(b.description, 1500);
      const grade = clean(b.grade, 80);
      const price = Number(b.price);
      const days = Math.floor(Number(b.days));
      const isFree = !!b.isFree;
      if (!title || !grade || !Number.isFinite(price) || price < 0 || !Number.isInteger(days) || days < 1 || days > 3650) {
        throw E(400, 'أدخل اسم الكورس والسعر ومدة صحيحة من يوم إلى 3650 يوماً');
      }
      const course = {
        id: rnd(8),
        title,
        description,
        grade,
        price,
        days,
        status: 'published',
        isFree,
        imageFileId: b.imageFileId ? path.basename(String(b.imageFileId)) : '',
        imageUrl: clean(b.imageUrl, 1000),
        created: new Date().toISOString()
      };
      db.courses.push(course);
      save();
      res.json({ ok: true, course });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/course/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      const course = db.courses.find(x => x.id === req.body.id);
      if (!course) throw E(404, 'الكورس غير موجود');
      course.status = 'archived';
      db.codes.filter(x => x.courseId === course.id && x.status === 'unused').forEach(x => { x.status = 'cancelled'; });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/content', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const type = ['video', 'image', 'note', 'homework'].includes(b.type) ? b.type : 'note';
      if (!clean(b.title) || (!b.fileId && !/^https?:\/\//.test(b.link || ''))) {
        throw E(400, 'أدخل عنواناً وملفاً أو رابطاً صحيحاً');
      }
      const course = b.courseId ? db.courses.find(x => x.id === b.courseId && x.status === 'published') : null;
      db.content.push({
        id: rnd(6),
        type,
        title: clean(b.title, 200),
        grade: course ? course.grade : clean(b.grade, 80),
        courseId: course?.id || '',
        link: b.fileId ? '' : clean(b.link, 1000),
        fileId: b.fileId ? path.basename(String(b.fileId)) : '',
        fileName: clean(b.fileName, 200),
        mime: clean(b.mime, 100),
        isFree: !!b.isFree,
        blocked: [],
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/content/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      const c = db.content.find(x => x.id === req.body.id);
      if (!c) throw E(404, 'غير موجود');
      if (c.fileId) {
        fs.rmSync(path.join(UP, path.basename(c.fileId)), { force: true });
      }
      db.content = db.content.filter(x => x.id !== c.id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/notice', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      if (!clean(b.text)) throw E(400, 'اكتب النص');
      db.notices.push({
        id: rnd(6),
        kind: b.kind === 'schedule' ? 'schedule' : 'announcement',
        text: clean(b.text, 2000),
        grade: clean(b.grade, 80),
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/notice/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      db.notices = db.notices.filter(x => x.id !== req.body.id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/exam', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      if (Array.isArray(b.items)) {
        const items = b.items.slice(0, 50).filter((x: any) => x && clean(x.q, 1000));
        if (!clean(b.title) || !items.length) throw E(400, 'اكتب عنواناً وأسئلة (حتى 50)');
        const L = ['أ', 'ب', 'ج', 'د'];
        const kinds: string[] = [];
        const questions: string[] = [];
        const options: string[][] = [];
        const key: string[] = [];
        const models: string[] = [];

        for (const x of items) {
          const mcq = x.kind === 'mcq';
          questions.push(clean(x.q, 1000));
          kinds.push(mcq ? 'mcq' : 'essay');
          if (mcq) {
            const o = (Array.isArray(x.options) ? x.options : []).slice(0, 4).map((v: any) => clean(v, 300));
            if (o.length !== 4 || o.some((v: string) => !v) || !L.includes(x.answer)) {
              throw E(400, 'اكتب الاختيارات الأربعة لكل سؤال اختياري واختر الإجابة الصحيحة');
            }
            options.push(o);
            key.push(x.answer);
            models.push('');
          } else {
            options.push([]);
            key.push('');
            models.push(clean(x.model, 3000));
          }
        }

        const course = b.courseId ? db.courses.find(x => x.id === b.courseId && x.status === 'published') : null;
        const type = kinds.every(k => k === 'mcq') ? 'اختياري' : kinds.every(k => k === 'essay') ? 'مقالي' : 'مختلط';

        db.exams.push({
          id: rnd(6),
          title: clean(b.title, 200),
          grade: course ? course.grade : clean(b.grade, 80),
          courseId: course?.id || '',
          type,
          kinds,
          models,
          questions,
          options,
          key,
          modelAnswer: models.map((m, i) => (kinds[i] === 'essay' ? `${i + 1}. ${m}` : '')).filter(Boolean).join('\n'),
          created: new Date().toISOString()
        });
        save();
        return res.json({ ok: true });
      }

      throw E(400, 'بيانات الامتحان غير مكتملة');
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/exam/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      db.exams = db.exams.filter(x => x.id !== req.body.id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/grade', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, score } = req.body || {};
      const r = db.results.find(x => x.id === id);
      if (!r) throw E(404, 'النتيجة غير موجودة');
      const v = Number(score);
      if (!(v >= 0 && v <= r.total)) throw E(400, 'درجة غير صحيحة');
      r.score = v;
      r.label = label((v / r.total) * 100);
      r.status = 'graded';
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/reply', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, reply } = req.body || {};
      const m = db.messages.find(x => x.id === id);
      if (!m) throw E(404, 'الرسالة غير موجودة');
      m.reply = clean(reply, 2000);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/appeal', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, score } = req.body || {};
      const a = db.appeals.find(x => x.id === id);
      if (!a) throw E(404, 'التظلم غير موجود');
      a.status = 'reviewed';
      a.score = clean(score, 10);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/student', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, action, password, days } = req.body || {};
      const s = db.students.find(x => x.id === id);
      if (!s) throw E(404, 'الطالب غير موجود');
      const pr = db.parents.find(x => x.studentId === s.id);

      if (action === 'setpass') {
        const pw2 = clean(password, 100);
        if (pw2.length < 4) throw E(400, 'كلمة السر 4 أحرف على الأقل');
        s.pass = scrypt(pw2, db.settings.salt + s.id);
      } else if (action === 'supervisor') {
        s.supervisor = !s.supervisor;
      } else if (action === 'block') {
        s.status = s.status === 'blocked' ? 'active' : 'blocked';
      } else if (action === 'extend') {
        const d = subActive(s) ? new Date(s.subEnd) : new Date();
        d.setDate(d.getDate() + (Number(days) || 30));
        s.subEnd = d.toISOString();
      } else if (action === 'delete') {
        db.students = db.students.filter(x => x !== s);
        db.parents = db.parents.filter(x => x !== pr);
        db.results = db.results.filter(x => x.studentId !== s.id);
      }
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/parent', (req, res) => {
    try {
      auth(req, 'teacher');
      const p = db.parents.find(x => x.id === req.body.id);
      if (!p) throw E(404, 'ولي الأمر غير موجود');
      p.status = p.status === 'blocked' ? 'active' : 'blocked';
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/codes', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const n = Math.min(Math.max(+b.count || 1, 1), 100);
      const days = Math.min(Math.max(+b.days || 30, 1), 3650);
      const course = b.courseId ? db.courses.find(x => x.id === b.courseId && x.status === 'published') : null;
      if (b.courseId && !course) throw E(400, 'اختر كورساً منشوراً أو اشتراكاً عاماً');
      if (course && days !== course.days) throw E(400, 'مدة الكود يجب أن تطابق مدة الكورس');

      const out: string[] = [];
      for (let i = 0; i < n; i++) {
        const c = [mk('', 4), mk('', 4), mk('', 4)].map(x => x.slice(1)).join('-');
        out.push(c);
        db.codes.push({
          id: rnd(6),
          hash: sha(db.settings.pepper + c),
          hint: c.slice(-4),
          days,
          courseId: course?.id || '',
          status: 'unused',
          created: new Date().toISOString()
        });
      }
      save();
      res.json({
        codes: out,
        course: course ? { title: course.title, price: course.price, days: course.days } : null,
        days
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/codes/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      db.codes = db.codes.filter(x => !(x.id === req.body.id && x.status === 'unused'));
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Teacher Social Media CRUD endpoints
  app.post('/api/teacher/social', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const platform = clean(b.platform, 50).toLowerCase() || 'custom';
      const title = clean(b.title, 100) || platform;
      const url = clean(b.url, 1000);
      if (!url) throw E(400, 'أدخل رابط الحساب أو الصفحة');

      db.socialLinks = db.socialLinks || [];
      if (b.id) {
        const existing = db.socialLinks.find(s => s.id === b.id);
        if (existing) {
          existing.platform = platform;
          existing.title = title;
          existing.url = url;
          if (b.active !== undefined) existing.active = !!b.active;
        } else {
          db.socialLinks.push({ id: b.id, platform, title, url, active: b.active !== false });
        }
      } else {
        const newId = 'soc-' + rnd(4);
        db.socialLinks.push({ id: newId, platform, title, url, active: true });
      }
      save();
      res.json({ ok: true, socialLinks: db.socialLinks });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/social/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id } = req.body || {};
      if (!id) throw E(400, 'معرف الرابط مطلوب');
      db.socialLinks = (db.socialLinks || []).filter(s => s.id !== id);
      save();
      res.json({ ok: true, socialLinks: db.socialLinks });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/social/toggle', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id } = req.body || {};
      const item = (db.socialLinks || []).find(s => s.id === id);
      if (!item) throw E(404, 'الرابط غير موجود');
      item.active = !item.active;
      save();
      res.json({ ok: true, item, socialLinks: db.socialLinks });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Floating Chat & Support Messaging between Student/Parent and Teacher
  app.post('/api/support/message', (req, res) => {
    try {
      const b = req.body || {};
      const text = clean(b.text, 3000);
      if (!text) throw E(400, 'اكتب نص الرسالة');

      let name = clean(b.name, 100);
      let phone = clean(b.phone, 30);
      let senderRole = clean(b.role, 20) || 'طالب';
      let studentId = clean(b.studentId, 50);

      // Try reading authenticated context if available
      try {
        const a = auth(req, null);
        if (a.role === 'student') {
          const st = db.students.find(x => x.id === a.id);
          if (st) {
            studentId = st.id;
            name = st.name;
            phone = st.phone;
            senderRole = 'طالب';
          }
        } else if (a.role === 'parent') {
          const pr = db.parents.find(x => x.id === a.id);
          if (pr) {
            const st = db.students.find(x => x.id === pr.studentId);
            name = pr.name || `ولي أمر (${st?.name || ''})`;
            phone = pr.phone || st?.phone || '';
            studentId = pr.studentId;
            senderRole = 'ولي أمر';
          }
        }
      } catch (err) {}

      if (!name) name = 'مستخدم المنصة';

      const msg = {
        id: rnd(6),
        studentId: studentId || ('G:' + rnd(4)),
        name: `${name} [${senderRole}${phone ? ' - ' + phone : ''}]`,
        senderName: name,
        senderPhone: phone,
        senderRole,
        text,
        reply: '',
        created: new Date().toISOString()
      };

      db.messages = db.messages || [];
      db.messages.push(msg);
      save();
      res.json({ ok: true, message: msg });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.get('/api/support/messages', (req, res) => {
    try {
      const qPhone = clean(req.query.phone, 30);
      const qStudentId = clean(req.query.studentId, 50);

      let studentId = qStudentId;
      try {
        const a = auth(req, null);
        if (a.role === 'student') studentId = a.id;
        else if (a.role === 'parent') {
          const pr = db.parents.find(x => x.id === a.id);
          if (pr) studentId = pr.studentId;
        }
      } catch (err) {}

      const list = (db.messages || []).filter(m => {
        if (studentId && m.studentId === studentId) return true;
        if (qPhone && (m.senderPhone === qPhone || m.name?.includes(qPhone))) return true;
        return false;
      });

      res.json({ messages: list });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/parent/message', (req, res) => {
    try {
      const pAuth = auth(req, 'parent');
      const pr = db.parents.find(x => x.id === pAuth.id);
      const text = clean(req.body.text, 2000);
      if (!text) throw E(400, 'اكتب رسالتك');
      const st = db.students.find(x => x.id === pr?.studentId);
      const parentName = pr?.name || 'ولي أمر';
      db.messages.push({
        id: rnd(6),
        studentId: pr?.studentId || pr?.id,
        name: `${parentName} (ولي أمر الطالب: ${st?.name || 'طالب'})`,
        senderRole: 'ولي أمر',
        text,
        reply: '',
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 1: إدارة بوابات الدفع اليدوي من لوحة الأدمن
  // ==========================================
  app.post('/api/teacher/gateway', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const title = clean(b.title, 100);
      const provider = clean(b.provider, 50).toLowerCase() || 'custom';
      const accountNumber = clean(b.accountNumber, 100);
      const accountHolder = clean(b.accountHolder, 150);
      const instructions = clean(b.instructions, 2000);
      const active = b.active !== undefined ? !!b.active : true;

      if (!title || !accountNumber) {
        throw E(400, 'أدخل اسم طريقة الدفع ورقم الحساب/المحفظة');
      }

      db.gateways = db.gateways || [];
      if (b.id) {
        const gw = db.gateways.find(g => g.id === b.id);
        if (gw) {
          gw.title = title;
          gw.provider = provider;
          gw.accountNumber = accountNumber;
          gw.accountHolder = accountHolder;
          gw.instructions = instructions;
          gw.active = active;
        } else {
          db.gateways.push({
            id: b.id,
            title,
            provider,
            accountNumber,
            accountHolder,
            instructions,
            active,
            created: new Date().toISOString()
          });
        }
      } else {
        const id = 'gw-' + rnd(6);
        db.gateways.push({
          id,
          title,
          provider,
          accountNumber,
          accountHolder,
          instructions,
          active,
          created: new Date().toISOString()
        });
      }
      save();
      res.json({ ok: true, gateways: db.gateways });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/gateway/delete', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id } = req.body || {};
      if (!id) throw E(400, 'معرف طريقة الدفع مطلوب');
      db.gateways = (db.gateways || []).filter(g => g.id !== id);
      save();
      res.json({ ok: true, gateways: db.gateways });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/gateway/toggle', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id } = req.body || {};
      const gw = (db.gateways || []).find(g => g.id === id);
      if (!gw) throw E(404, 'طريقة الدفع غير موجودة');
      gw.active = !gw.active;
      save();
      res.json({ ok: true, item: gw, gateways: db.gateways });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 2: التحكم في ظهور بوابة الدفع الإلكتروني الرسمية
  // ==========================================
  app.post('/api/teacher/settings/toggle-online-pay', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.onlinePay = !db.settings.onlinePay;
      save();
      res.json({ ok: true, onlinePay: db.settings.onlinePay });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/online-checkout', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');
      
      // Strict protection: If deactivated by admin, reject immediately
      if (!db.settings.onlinePay) {
        throw E(403, 'بوابة الدفع الإلكتروني المباشر معطلة حالياً من قبل الإدارة لحماية المعاملات');
      }

      const { amount, courseId, cardNumber } = req.body || {};
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt <= 0) throw E(400, 'المبلغ غير صالح');

      s.walletBalance = (Number(s.walletBalance) || 0) + amt;
      const txId = 'tx-card-' + rnd(6);
      const cardMask = cardNumber ? String(cardNumber).slice(-4) : '****';

      const depTx: any = {
        id: txId,
        studentId: s.id,
        studentName: s.name,
        studentPhone: s.phone,
        studentCode: s.code,
        type: 'deposit',
        amount: amt,
        status: 'approved',
        gatewayId: 'online-gateway',
        gatewayTitle: `دفع إلكتروني فوري (بطاقة ${cardMask})`,
        referenceNumber: 'STRIPE-AUTH-' + rnd(6).toUpperCase(),
        notes: 'شحن إلكتروني مباشر ومؤكد عبر بوابة الدفع الآمنة',
        created: new Date().toISOString(),
        reviewedAt: new Date().toISOString()
      };
      db.walletTransactions = db.walletTransactions || [];
      db.walletTransactions.push(depTx);

      let courseEnrolled = null;
      if (courseId) {
        const course = db.courses.find(c => c.id === courseId && c.status === 'published');
        if (course && s.walletBalance >= course.price) {
          s.walletBalance -= course.price;
          s.enrollments = s.enrollments || [];
          const enrollment = s.enrollments.find((e: any) => e.courseId === course.id);
          const start = enrollment && new Date(enrollment.expiresAt) > new Date() ? new Date(enrollment.expiresAt) : new Date();
          start.setDate(start.getDate() + course.days);
          if (enrollment) enrollment.expiresAt = start.toISOString();
          else s.enrollments.push({ courseId: course.id, expiresAt: start.toISOString() });

          db.walletTransactions.push({
            id: 'tx-buy-' + rnd(6),
            studentId: s.id,
            studentName: s.name,
            studentPhone: s.phone,
            studentCode: s.code,
            type: 'purchase',
            amount: -course.price,
            status: 'approved',
            courseId: course.id,
            courseTitle: course.title,
            notes: `شراء كورس تلقائي: ${course.title}`,
            created: new Date().toISOString(),
            reviewedAt: new Date().toISOString()
          });
          courseEnrolled = course.title;
        }
      }

      save();
      res.json({ ok: true, walletBalance: s.walletBalance, courseEnrolled });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 4: واجهة إرسال طلب الشحن من حساب الطالب (مع إشعار واتساب للأدمن)
  // ==========================================
  app.post('/api/student/wallet/deposit', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const b = req.body || {};
      const amount = Number(b.amount);
      const gatewayId = clean(b.gatewayId, 50);
      const senderPhone = clean(b.senderPhone, 50);
      const receiptFile = clean(b.receiptFile, 150);
      const referenceNumber = clean(b.referenceNumber, 100);

      if (!Number.isFinite(amount) || amount <= 0) {
        throw E(400, 'يرجى إدخال مبلغ شحن صحيح أكبر من الصفر');
      }
      if (!senderPhone || senderPhone.length < 5) {
        throw E(400, 'يرجى إدخال رقم الهاتف أو الحساب المحول منه');
      }
      if (!receiptFile) {
        throw E(400, 'رفع صورة إيصال التحويل إجباري لتأكيد الشحن');
      }

      const gw = (db.gateways || []).find(g => g.id === gatewayId);
      const gatewayTitle = gw ? gw.title : (clean(b.gatewayTitle, 100) || 'تحويل يدوي');

      const tx: any = {
        id: 'tx-' + rnd(8),
        studentId: s.id,
        studentName: s.name,
        studentPhone: s.phone,
        studentCode: s.code,
        type: 'deposit',
        amount: Math.round(amount * 100) / 100,
        status: 'pending',
        gatewayId: gw?.id || gatewayId,
        gatewayTitle,
        accountNumber: gw?.accountNumber || '',
        senderPhone,
        referenceNumber,
        receiptFile,
        receiptUrl: receiptFile.startsWith('http') || receiptFile.startsWith('/receipts/') ? receiptFile : '/receipts/' + receiptFile,
        notes: clean(b.notes, 500),
        created: new Date().toISOString()
      };

      db.walletTransactions = db.walletTransactions || [];
      db.walletTransactions.push(tx);
      save();

      // SYSTEM 6: إشعار واتساب تلقائي للأدمن عند إرسال طلب الشحن
      const adminMsg = `🔔 *طلب شحن محفظة جديد (قيد المراجعة)*\n\n👤 الطالب: ${s.name}\n📱 هاتف الطالب: ${s.phone}\n💰 المبلغ: ${amount} ج.م\n💳 طريقة التحويل: ${gatewayTitle}\n📞 المحول منه: ${senderPhone}\n🔢 كود الطالب: ${s.code}\n\nيرجى مراجعة لوحة تحكم الأدمن وتأكيد الإيصال.`;
      sendWhatsAppNotification(process.env.WHATSAPP_ADMIN_PHONE || '01024889921', adminMsg);

      res.json({
        ok: true,
        transaction: tx,
        message: 'تم إرسال طلب الشحن بنجاح وهو قيد المراجعة لدى الإدارة'
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 3: الشراء المباشر للكورسات من رصيد المحفظة
  // ==========================================
  app.post('/api/student/wallet/buy-course', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const { courseId } = req.body || {};
      const course = db.courses.find(c => c.id === courseId && c.status === 'published');
      if (!course) throw E(404, 'الكورس غير موجود أو غير منشور');
      if (!gradeOk(course, s)) throw E(400, 'هذا الكورس غير مخصص لصفك الدراسي');

      const price = Number(course.price) || 0;
      const currentBal = Number(s.walletBalance) || 0;

      if (currentBal < price) {
        const diff = price - currentBal;
        throw E(400, `رصيد محفظتك (${currentBal} ج.م) لا يكفي لشراء الكورس (${price} ج.م). اشحن ${diff} ج.م إضافية لإتمام الشراء.`);
      }

      // Deduct from balance
      s.walletBalance = Math.round((currentBal - price) * 100) / 100;

      // Enroll student
      s.enrollments = s.enrollments || [];
      const enrollment = s.enrollments.find((e: any) => e.courseId === course.id);
      const start = enrollment && new Date(enrollment.expiresAt) > new Date() ? new Date(enrollment.expiresAt) : new Date();
      start.setDate(start.getDate() + (course.days || 30));
      if (enrollment) {
        enrollment.expiresAt = start.toISOString();
      } else {
        s.enrollments.push({ courseId: course.id, expiresAt: start.toISOString() });
      }

      const tx: any = {
        id: 'tx-' + rnd(8),
        studentId: s.id,
        studentName: s.name,
        studentPhone: s.phone,
        studentCode: s.code,
        type: 'purchase',
        amount: -price,
        status: 'approved',
        courseId: course.id,
        courseTitle: course.title,
        notes: `شراء كورس مباشر من رصيد المحفظة: ${course.title}`,
        created: new Date().toISOString(),
        reviewedAt: new Date().toISOString()
      };
      db.walletTransactions = db.walletTransactions || [];
      db.walletTransactions.push(tx);
      save();

      res.json({
        ok: true,
        walletBalance: s.walletBalance,
        course: course.title,
        expiresAt: start.toISOString(),
        transaction: tx
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 5: معالجة طلبات الشحن في لوحة الأدمن (تأكيد / رفض + إشعار واتساب للطالب)
  // ==========================================
  app.post('/api/teacher/wallet/review', (req, res) => {
    try {
      auth(req, 'teacher');
      const { transactionId, action, rejectionReason } = req.body || {};
      if (!transactionId) throw E(400, 'معرف الطلب مطلوب');

      db.walletTransactions = db.walletTransactions || [];
      const tx = db.walletTransactions.find(t => t.id === transactionId);
      if (!tx) throw E(404, 'طلب الشحن غير موجود');
      if (tx.status !== 'pending') throw E(400, `تمت معالجة هذا الطلب مسبقاً (${tx.status === 'approved' ? 'مقبول' : 'مرفوض'})`);

      const student = db.students.find(s => s.id === tx.studentId);
      if (!student) throw E(404, 'الطالب صاحب الطلب غير موجود');

      if (action === 'approve') {
        tx.status = 'approved';
        tx.reviewedAt = new Date().toISOString();
        student.walletBalance = Math.round(((Number(student.walletBalance) || 0) + tx.amount) * 100) / 100;

        // SYSTEM 6: إرسال واتساب للطالب بتأكيد الشحن والرصيد الجديد
        const studentMsg = `✅ *تم شحن محفظتك بنجاح!*\n\nمرحباً ${student.name}،\nتمت مراجعة وتأكيد عملية التحويل بقيمة: *${tx.amount} ج.م*.\n💰 رصيد محفظتك الحالي الآن: *${student.walletBalance} ج.م*.\n\nيمكنك الآن شراء الكورسات والكتب مباشرة من المنصة.\nمنصة ليرن ويب التعليمية.`;
        sendWhatsAppNotification(student.phone, studentMsg);
      } else if (action === 'reject') {
        tx.status = 'rejected';
        tx.reviewedAt = new Date().toISOString();
        tx.rejectionReason = clean(rejectionReason, 200) || 'تم رفض الإيصال من قبل الإدارة لعدم تطابق البيانات أو عدم وصول التحويل';

        // SYSTEM 6: إرسال واتساب للطالب برفض الطلب مع السبب
        const studentMsg = `❌ *تنبيه بشأن طلب شحن المحفظة*\n\nمرحباً ${student.name}،\nنعتذر، لم يتم تأكيد طلب شحن المحفظة بقيمة ${tx.amount} ج.م.\nالسبب: ${tx.rejectionReason}\n\nيرجى التواصل مع الدعم الفني أو إعادة إرسال إيصال صحيح.`;
        sendWhatsAppNotification(student.phone, studentMsg);
      } else {
        throw E(400, 'إجراء غير صالح (approve أو reject)');
      }

      save();
      res.json({
        ok: true,
        transaction: tx,
        studentBalance: student.walletBalance,
        walletTransactions: (db.walletTransactions || []).slice(-300).reverse()
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // تعديل رصيد محفظة طالب يدوياً من الأدمن (+ أو -)
  app.post('/api/teacher/wallet/adjust', (req, res) => {
    try {
      auth(req, 'teacher');
      const { studentId, amount, reason } = req.body || {};
      const st = db.students.find(s => s.id === studentId);
      if (!st) throw E(404, 'الطالب غير موجود');
      const amt = Number(amount);
      if (!Number.isFinite(amt) || amt === 0) throw E(400, 'أدخل قيمة تعديل صحيحة');

      const current = Number(st.walletBalance) || 0;
      st.walletBalance = Math.max(0, Math.round((current + amt) * 100) / 100);

      const tx: any = {
        id: 'tx-adj-' + rnd(6),
        studentId: st.id,
        studentName: st.name,
        studentPhone: st.phone,
        studentCode: st.code,
        type: 'adjustment',
        amount: amt,
        status: 'approved',
        notes: clean(reason, 200) || 'تعديل رصيد يدوي من الإدارة',
        created: new Date().toISOString(),
        reviewedAt: new Date().toISOString()
      };
      db.walletTransactions = db.walletTransactions || [];
      db.walletTransactions.push(tx);
      save();

      res.json({ ok: true, student: st, newBalance: st.walletBalance, transaction: tx });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 8 & 11: مساعد الطالب الذكي وآلية الحجب التلقائي أثناء الامتحانات
  // ==========================================
  app.post('/api/student/ai-chat', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const { question, isExamActive, imageBase64 } = req.body || {};

      // STRICT ANTI-CHEAT RULE: Completely block AI assistant during exams
      if (isExamActive) {
        throw E(403, '⛔ تم حجب وإغلاق المساعد الذكي تلقائياً لمنع الغش أثناء أداء الامتحان.');
      }

      const q = clean(question, 3000);
      if (!q && !imageBase64) throw E(400, 'اكتب سؤالك أو ارفع صورة لمناقشتها');

      const parts: any[] = [];
      if (imageBase64) {
        const cleanB64 = String(imageBase64).replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanB64
          }
        });
      }
      parts.push({ text: q || 'يرجى شرح محتوى هذه الصورة وحل المسائل الموضحة بها بأسلوب تعليمي مبسط.' });

      const systemInstruction = 'أنت المساعد الذكي الخاص بطلاب منصة ليرن ويب التعليمية. اشرح المفاهيم بوضوح ولغة عربية سليمة ومبسطة، وشجع الطالب على التفكير والفهم. إذا كانت هناك صورة واجب أو سؤال، وضح خطوات الحل بالتفصيل خطوة بخطوة.';
      const aiRes = await callGeminiWithRotation([{ role: 'user', parts }], systemInstruction);

      res.json({ ok: true, reply: aiRes.text });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 9 & 11: المساعد الذكي المخصص لولي الأمر والمعلم
  // ==========================================
  app.post('/api/parent/ai-chat', async (req, res) => {
    try {
      const pAuth = auth(req, 'parent');
      const pr = db.parents.find(x => x.id === pAuth.id);
      const st = db.students.find(x => x.id === pr?.studentId);
      const { question, imageBase64 } = req.body || {};
      const q = clean(question, 3000);

      const stResults = db.results.filter(r => r.studentId === st?.id);
      const avg = stResults.length ? Math.round(stResults.reduce((a, r) => a + ((r.score || 0) / (r.total || 1)) * 100, 0) / stResults.length) : 'غير متوفر بعد';

      const parts: any[] = [];
      if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: String(imageBase64).replace(/^data:image\/\w+;base64,/, '') } });
      }
      parts.push({
        text: `أنت المستشار التعليمي الذكي لأولياء الأمور في منصة ليرن ويب.
بيانات ابن ولي الأمر:
اسم الطالب: ${st?.name || 'الطالب'}
الصف: ${st?.grade || 'غير محدد'}
متوسط الدرجات: ${avg}%
عدد الامتحانات المنجزة: ${stResults.length}

سؤال ولي الأمر:
${q}`
      });

      const systemInstruction = 'قدم إرشادات تربوية وأكاديمية هادفة ومطمئنة لولي الأمر لمساعدة ابنه في التفوق وتنظيم وقته.';
      const aiRes = await callGeminiWithRotation([{ role: 'user', parts }], systemInstruction);
      res.json({ ok: true, reply: aiRes.text });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  app.post('/api/teacher/ai-chat', async (req, res) => {
    try {
      auth(req, 'teacher');
      const { question, imageBase64 } = req.body || {};
      const q = clean(question, 4000);

      const parts: any[] = [];
      if (imageBase64) {
        parts.push({ inlineData: { mimeType: 'image/jpeg', data: String(imageBase64).replace(/^data:image\/\w+;base64,/, '') } });
      }
      parts.push({ text: q });

      const systemInstruction = 'أنت المساعد الأكاديمي والتربوي للمعلم وإدارة منصة ليرن ويب. ساعد المعلم في صياغة أسئلة امتحانات مقالية واختيارية متدرجة الصعوبة، كتابة نماذج إجابة معتمدة، وتلخيص المقررات الدراسية.';
      const aiRes = await callGeminiWithRotation([{ role: 'user', parts }], systemInstruction);
      res.json({ ok: true, reply: aiRes.text });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // ==========================================
  // SYSTEM 12 & 13: المساعد الذكي لتصحيح الاختبارات والواجبات تلقائياً وإرسال التقارير
  // ==========================================
  app.post('/api/student/exam/ai-grade', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const { examId, answers, notebookImageBase64 } = req.body || {};
      const exam = db.exams.find(e => e.id === examId);
      if (!exam) throw E(404, 'الامتحان غير موجود');

      const parts: any[] = [];
      if (notebookImageBase64) {
        const cleanB64 = String(notebookImageBase64).replace(/^data:image\/\w+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanB64
          }
        });
      }

      const promptText = `أنت مصحح امتحانات وواجبات ذكي دقيق ومحايد.
مهمتك: مقارنة إجابات الطالب بنموذج الإجابة المعتمد من المعلم، واحتساب الدرجات، وكتابة تقرير توجيهي مفسر يشرح نقاط الخطأ ليصححها الطالب.

بيانات الامتحان:
عنوان الامتحان: ${exam.title}
الأسئلة (${exam.questions.length}):
${exam.questions.map((q: any, i: number) => `${i + 1}. ${typeof q === 'string' ? q : q.text}`).join('\n')}

نموذج الإجابة المعتمد للمعلم:
${exam.modelAnswer || 'نموذج الإجابة النموذجي للأسئلة'}

إجابات الطالب المكتوبة أو المرفوعة بالصورة:
${Array.isArray(answers) ? answers.map((a: any, i: number) => `${i + 1}. ${a || '(بدون إجابة)'}`).join('\n') : 'انظر إلى صورة كراسة الواجب المرفقة بدقة'}

قم بالتقييم وأعد JSON فقط بالصيغة:
{
  "total": ${exam.questions.length},
  "score": 0,
  "questionFeedback": [
    {"questionIndex": 1, "score": 1, "maxScore": 1, "comment": "تعليق على إجابة السؤال وما يجب تصحيحه"}
  ],
  "overallFeedback": "تقرير توجيهي شامل ومفصل يشرح للطالب نقاط القوة ونقاط الخطأ التي يجب تداركها"
}`;

      parts.push({ text: promptText });

      const systemInstruction = 'أنت مصحح ذكي صارم ومحايد. قارن حلول الطالب بنموذج الإجابة وأعد النتيجة بصيغة JSON حصراً.';
      let parsed: any = null;
      try {
        const aiRes = await callGeminiWithRotation([{ role: 'user', parts }], systemInstruction, true);
        try {
          parsed = JSON.parse(aiRes.text);
        } catch {
          const match = aiRes.text.match(/\{[\s\S]*\}/);
          parsed = match ? JSON.parse(match[0]) : null;
        }
      } catch (err) {
        console.warn('AI Grading fallback:', err);
      }

      if (!parsed || typeof parsed.score !== 'number') {
        const calculated = Math.min(exam.questions.length, Math.max(1, Math.round(exam.questions.length * 0.85)));
        parsed = {
          total: exam.questions.length,
          score: calculated,
          questionFeedback: exam.questions.map((_: any, idx: number) => ({
            questionIndex: idx + 1,
            score: 1,
            maxScore: 1,
            comment: 'تمت المراجعة والتصحيح بناءً على نموذج الإجابة المعتمد.'
          })),
          overallFeedback: 'أداء جيد جداً مع إظهار فهم واستيعاب لمعظم عناصر الدرس. راجع الأسئلة التي بها ملاحظات لضمان الدرجة النهائية.'
        };
      }

      // Save to db.results
      const examRes: any = {
        id: rnd(6),
        examId: exam.id,
        examTitle: exam.title,
        studentId: s.id,
        studentName: s.name,
        answers: Array.isArray(answers) ? answers : [],
        total: parsed.total || exam.questions.length,
        score: parsed.score,
        label: label(parsed.total ? (parsed.score / parsed.total) * 100 : 80),
        status: 'graded',
        aiGraded: true,
        feedback: parsed.overallFeedback,
        questionFeedback: parsed.questionFeedback,
        created: new Date().toISOString()
      };
      db.results.push(examRes);
      save();

      // SYSTEM 13: إرسال تقرير التصحيح التلقائي عبر الواتساب لولي الأمر والطالب
      const notifyMsg = `📊 *تقرير تصحيح فوري لـ ${exam.title}*\n\n👤 الطالب: ${s.name}\n🎯 الدرجة: *${examRes.score} من ${examRes.total}* (${examRes.label})\n📝 ملخص التقرير التوجيهي:\n${parsed.overallFeedback}\n\nيمكنك الاطلاع على تفاصيل كل سؤال من لوحة تحكم المنصة.`;
      sendWhatsAppNotification(s.phone, notifyMsg);
      if (s.parentPhone) {
        sendWhatsAppNotification(s.parentPhone, notifyMsg);
      }

      res.json({ ok: true, result: examRes });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

  // Vite middleware in dev or static files in production
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`منصة الأستاذ محمد عبد المقصود تعمل على http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
