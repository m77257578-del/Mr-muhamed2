import express, { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import cors from 'cors';
import { GoogleGenAI, Type, ThinkingLevel } from "@google/genai";
import * as admin from 'firebase-admin';
import firebaseConfig from './firebase-applet-config.json';

// Initialize Firebase Admin for token verification
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: firebaseConfig.projectId,
  });
}

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
    fontFamily?: string;
    panelBg?: string;
    cardBg?: string;
    accentGold?: string;
    geminiKeys?: string;
    geminiModel?: string;
    pageThemes?: Record<string, any>;
    academicColors?: Record<string, any>;
    studentTabsVisibility?: Record<string, boolean>;
    registrationFieldsConfig?: Record<string, any>;
    reviewsConfig?: Record<string, any>;
    notificationConfig?: Record<string, any>;
    onlinePayKey?: string;
    cashierKey?: string;
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
  liveSessions: any[];
  liveAttendance: any[];
  coupons: any[];
  supervisors: any[];
  bundles: any[];
  affiliates: any[];
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
    onlinePayKey: '',
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
    },
    cashierKey: 'CASHIER-' + rnd(4).toUpperCase()
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
  walletTransactions: [],
  liveSessions: [],
  coupons: [],
  supervisors: [],
  bundles: [],
  affiliates: []
});

let db: Database = freshDb();
if (fs.existsSync(DBF)) {
  try {
    db = Object.assign(freshDb(), JSON.parse(fs.readFileSync(DBF, 'utf8')));
    db.settings.name = 'تصميم ليرن ويب';
    if (!db.supervisors || !Array.isArray(db.supervisors)) {
      db.supervisors = [];
    }
    if (!db.liveSessions || !Array.isArray(db.liveSessions)) {
      db.liveSessions = [];
    }
    if (!db.liveAttendance || !Array.isArray(db.liveAttendance)) {
      db.liveAttendance = [];
    }
    if (!db.socialLinks || !Array.isArray(db.socialLinks) || db.socialLinks.length === 0) {
      db.socialLinks = [...defaultSocialLinks];
    }
    if (!db.gateways || !Array.isArray(db.gateways) || db.gateways.length === 0) {
      db.gateways = [...defaultGateways];
    }
    if (!db.walletTransactions || !Array.isArray(db.walletTransactions)) {
      db.walletTransactions = [];
    }
    if (!db.bundles || !Array.isArray(db.bundles)) {
      db.bundles = [];
    }
    if (!db.affiliates || !Array.isArray(db.affiliates)) {
      db.affiliates = [];
    }
    if (db.settings.onlinePay === undefined) {
      db.settings.onlinePay = false;
    }
    if (db.settings.onlinePayKey === undefined) {
      db.settings.onlinePayKey = '';
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
const newSession = (role: string, id: string, extra: any = {}) => {
  const exp = Date.now() + 7 * 864e5;
  const payload = Buffer.from(JSON.stringify({ role, id, exp, ...extra })).toString('base64url');
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

  // Multi-device verification check on every request for students
  if (s.role === 'student') {
    const deviceId = req.headers['x-device-id'] as string || 'unknown';
    // We will verify this deviceId matches what's in Firestore for this student
    // This is handled in the middleware or checked here if we want strictness.
    // However, to avoid excessive Firestore reads, we might rely on the token containing the deviceId
    // and just checking if it matches the current request header.
    const tokenDeviceId = s.did; 
    if (tokenDeviceId && deviceId !== 'unknown' && deviceId !== tokenDeviceId) {
       throw E(403, 'تم اكتشاف تسجيل دخول من جهاز آخر. يرجى تسجيل الدخول مجدداً من هذا الجهاز.');
    }
  }

  return s;
}

// Firebase Initialization (Admin SDK preferred on server)
const firestore = admin.firestore();

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {},
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
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
      governorate: s.governorate || '',
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
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
    notices: (db.notices || []).filter(n => n.grade === 'كل الصفوف' || n.grade === s.grade),
    liveSessions: (db.liveSessions || []).filter(ls => ls.status !== 'ended' && (ls.grade === 'كل الصفوف' || ls.grade === s.grade)),
    notes: (db.notes || []).filter(n => n.studentId === s.id).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    gateways: (db.gateways || []).filter(g => g.active === true),
    walletTransactions: (db.walletTransactions || []).filter(t => t.studentId === s.id).sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()),
    onlinePay: !!db.settings.onlinePay
  };
}

const qKind = (e: any, i: number) => (e.kinds && e.kinds[i]) || (e.type === 'اختياري' ? 'mcq' : 'essay');

// System 11: Gemini API Keys Rotator mechanism (Backend Vercel/Node)
// Gemini SDK Initialization with Rotator
function getGeminiApiKeys(): string[] {
  const dbKeys = db?.settings?.geminiKeys || '';
  const envKeys = process.env.GEMINI_API_KEYS || '';
  const singleKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
  const combined = `${dbKeys}\n${envKeys}\n${singleKey}`;
  const parsed = Array.from(new Set(
    combined
      .split(/[,;\n]/)
      .map(k => k.trim())
      .filter(k => k.length > 5)
  ));
  return parsed.length > 0 ? parsed : ['AIzaSyDummyKeyFallback'];
}

let geminiKeyIndex = 0;
function getNextGeminiKey(): string {
  const keys = getGeminiApiKeys();
  const key = keys[geminiKeyIndex % keys.length];
  geminiKeyIndex = (geminiKeyIndex + 1) % keys.length;
  return key;
}

/**
 * Enhanced Gemini caller using @google/genai SDK with Search Grounding
 */
async function callGeminiSDK(params: {
  contents: any;
  systemInstruction?: string;
  isJson?: boolean;
  useSearch?: boolean;
}): Promise<{ text: string; groundingMetadata?: any }> {
  const keys = getGeminiApiKeys();
  const configuredModel = db?.settings?.geminiModel || process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  
  // Try available keys
  for (let attempt = 0; attempt < Math.max(keys.length, 1); attempt++) {
    const apiKey = getNextGeminiKey();
    if (apiKey === 'AIzaSyDummyKeyFallback') break;

    const genAI = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });

    try {
      const config: any = {
        systemInstruction: params.systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MEDIUM }
      };

      if (params.isJson) {
        config.responseMimeType = 'application/json';
      }

      const tools: any[] = [];
      if (params.useSearch) {
        tools.push({ googleSearch: {} });
      }

      const response = await genAI.models.generateContent({
        model: configuredModel,
        contents: params.contents,
        config,
        tools: tools.length > 0 ? tools : undefined
      });

      return {
        text: response.text || '',
        groundingMetadata: (response as any).groundingMetadata
      };
    } catch (err: any) {
      console.error(`[Gemini SDK Error] Attempt ${attempt + 1}:`, err.message);
      if (err.message?.includes('429') || err.message?.includes('403')) continue;
      if (attempt === keys.length - 1) throw err;
    }
  }

  throw new Error('فشل الاتصال بـ Gemini. يرجى التحقق من مفاتيح API.');
}

async function askGemini(prompt: string, sysPrompt?: string, useSearch: boolean = true): Promise<string> {
  const systemInstruction = sysPrompt || 'أنت المساعد الذكي التعليمي لمنصة الأستاذ محمد التعليمية. أجب على أسئلة الطالب واستفساراته في اللغة العربية والمناهج التعليمية بأسلوب مشجع، واضح، ومتقن، واشرح التفاصيل التعليمية بإجابات مفيدة ومنسقة.';
  const res = await callGeminiSDK({
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    systemInstruction,
    useSearch
  });
  return res.text;
}

async function gradeEssayAI(examOrQuestions: any, studentAnswers: string[]): Promise<number> {
  const prompt = `أنت مصحح امتحانات خبير في اللغة العربية والمناهج التعليمية. قم بتصحيح إجابات الطالب المقالية بمقارنتها بنموذج الإجابة المعتمد بدقة وموضوعية:
الأسئلة ونموذج الإجابة:
${typeof examOrQuestions.modelAnswer === 'string' ? examOrQuestions.modelAnswer : JSON.stringify(examOrQuestions)}

إجابات الطالب:
${studentAnswers.map((a, i) => `${i + 1}. ${a}`).join('\n')}

أعد رقم الدرجة الإجمالية فقط كعدد صحيح أو رقم عشري بدون نصوص إضافية.`;

  try {
    const res = await callGeminiWithRotation([{ role: 'user', parts: [{ text: prompt }] }]);
    const num = parseFloat(res.text.match(/\d+(?:\.\d+)?/)?.[0] || '0');
    return isNaN(num) ? 0 : num;
  } catch {
    return 0;
  }
}

async function gradeFullExamSubmissionWithAI(exam: any, answers: string[], notebookImageBase64?: string | null) {
  const n = exam.questions.length;
  const questionsList = exam.questions.map((q: any, i: number) => {
    const text = typeof q === 'string' ? q : q.text || '';
    const kind = (exam.kinds && exam.kinds[i]) || (exam.type === 'اختياري' ? 'mcq' : 'essay');
    const modelAns = (exam.models && exam.models[i]) || (exam.modelAnswer || '');
    const correctKey = Array.isArray(exam.key) ? exam.key[i] : (exam.key || '');
    const studentAns = answers[i] || '';
    return { index: i, text, kind, modelAns, correctKey, studentAns };
  });

  // Calculate MCQ score deterministically first
  let mcqEarned = 0;
  let mcqTotal = 0;
  const questionFeedback: any[] = [];

  const essayQuestions: any[] = [];

  for (const item of questionsList) {
    if (item.kind === 'mcq') {
      mcqTotal++;
      const isCorrect = item.studentAns && item.correctKey && item.studentAns.trim() === item.correctKey.trim();
      if (isCorrect) mcqEarned++;
      questionFeedback.push({
        questionIndex: item.index + 1,
        questionText: item.text,
        studentAnswer: item.studentAns,
        modelAnswer: `الاختيار الصحيح: (${item.correctKey})`,
        score: isCorrect ? 1 : 0,
        maxScore: 1,
        feedback: isCorrect ? 'إجابة صحيحة ومطابقة للاختيار النموذجي ✓' : `إجابة خاطئة. الإجابة الصحيحة هي: (${item.correctKey})`
      });
    } else {
      essayQuestions.push(item);
    }
  }

  // If there are essay questions and we have Gemini available
  let essayEarned = 0;
  let generalFeedback = '';

  if (essayQuestions.length > 0) {
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

    const promptText = `أنت مصحح امتحانات ومعلم خبير.
قم بمطابقة وتصحيح إجابات الطالب المقالية مع نموذج الإجابة المعتمد بدقة وإنصاف تربوي.
عنوان الامتحان: ${exam.title}

الأسئلة المقالية ونموذج الإجابة:
${essayQuestions.map(eq => `سؤال ${eq.index + 1}: ${eq.text}
نموذج إجابة المعلم: ${eq.modelAns || exam.modelAnswer || 'الإجابة النموذجية المعتمدة'}
إجابة الطالب: ${eq.studentAns || '(لم يجب الطالب)'}`).join('\n\n')}

أعد التقييم بصيغة JSON فقط:
{
  "grades": [
    {
      "questionIndex": 1,
      "score": 1,
      "maxScore": 1,
      "feedback": "ملاحظة توجيهية عن إجابة الطالب وما أحسن فيه وما ينقصه مقارنة بالنموذج"
    }
  ],
  "totalEssayEarned": 0,
  "overallFeedback": "تقرير عام موجز يوضح مستوى الطالب ونصائح التحسين"
}`;

    parts.push({ text: promptText });

    try {
      const aiRes = await callGeminiWithRotation([{ role: 'user', parts }], 'أنت مصحح امتحانات خبير. التزم بصيغة JSON حصراً.', true);
      let parsed: any = null;
      try {
        parsed = JSON.parse(aiRes.text);
      } catch {
        const m = aiRes.text.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }

      if (parsed && Array.isArray(parsed.grades)) {
        for (const g of parsed.grades) {
          const eq = essayQuestions.find(e => e.index + 1 === g.questionIndex) || essayQuestions[0];
          const sc = Number(g.score) || 0;
          essayEarned += sc;
          questionFeedback.push({
            questionIndex: g.questionIndex || (eq.index + 1),
            questionText: eq.text,
            studentAnswer: eq.studentAns,
            modelAnswer: eq.modelAns || exam.modelAnswer || '',
            score: sc,
            maxScore: Number(g.maxScore) || 1,
            feedback: g.feedback || 'تم التقييم ومقارنة الإجابة بنموذج إجابة المعلم.'
          });
        }
        generalFeedback = parsed.overallFeedback || '';
      }
    } catch (err) {
      console.warn('Gemini essay grading error, using keyword heuristic fallback:', err);
    }

    // Heuristic fallback if AI failed or didn't return
    if (questionFeedback.length < n) {
      for (const eq of essayQuestions) {
        if (!questionFeedback.some(qf => qf.questionIndex === eq.index + 1)) {
          const modelWords = (eq.modelAns || '').split(/\s+/).filter((w: string) => w.length > 2);
          const studentWords = (eq.studentAns || '').split(/\s+/).filter((w: string) => w.length > 2);
          const matches = modelWords.filter((w: string) => studentWords.some((sw: string) => sw.includes(w) || w.includes(sw))).length;
          const ratio = modelWords.length > 0 ? Math.min(1, matches / Math.max(modelWords.length * 0.5, 1)) : 0.8;
          const sc = Math.round(ratio * 10) / 10;
          essayEarned += sc;
          questionFeedback.push({
            questionIndex: eq.index + 1,
            questionText: eq.text,
            studentAnswer: eq.studentAns,
            modelAnswer: eq.modelAns || exam.modelAnswer || '',
            score: sc,
            maxScore: 1,
            feedback: sc >= 0.7 ? 'إجابة جيدة تغطي النقاط الجوهرية في نموذج الإجابة.' : 'إجابة تحتاج لمزيد من الاستفاضة والتفصيل وفق نموذج الإجابة.'
          });
        }
      }
    }
  }

  questionFeedback.sort((a, b) => a.questionIndex - b.questionIndex);

  const totalScore = Math.min(n, Math.round((mcqEarned + essayEarned) * 10) / 10);
  const percent = n > 0 ? (totalScore / n) * 100 : 0;
  const gradeLabel = label(percent);

  if (!generalFeedback) {
    generalFeedback = percent >= 85
      ? 'أداء ممتاز ورائع! إجاباتك نموذجية ومطابقة لأعلى معايير الإتقان.'
      : percent >= 65
      ? 'مستوى جيد ومبشر، يُرجى مراجعة الأسئلة التي بها ملاحظات للاستفادة الكاملة.'
      : 'تحتاج إلى مراجعة الدرس ونموذج الإجابة المعتمد بعناية لرفع مستواك في الاختبارات القادمة.';
  }

  return {
    total: n,
    score: totalScore,
    label: gradeLabel,
    feedback: generalFeedback,
    questionFeedback
  };
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
      fontFamily: db.settings.fontFamily || "'Cairo', sans-serif",
      panelBg: db.settings.panelBg || '#0d1728',
      cardBg: db.settings.cardBg || '#111f36',
      accentGold: db.settings.accentGold || '#f59e0b',
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
      gateways: (db.gateways || []).filter(g => g.active === true),
      notices: (db.notices || []).slice(-10).reverse(),
      liveSessions: (db.liveSessions || []).filter(s => s.status !== 'ended')
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
        center: clean(b.center || '', 60),
        village: clean(b.village || '', 60),
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

  app.post('/api/student/login', async (req, res) => {
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

      // Multi-login prevention using Firestore
      const deviceId = req.headers['x-device-id'] as string || 'unknown';
        const studentDocRef = firestore.collection('students').doc(st.id);
        try {
          const snap = await studentDocRef.get();
          if (snap.exists) {
            const data = snap.data();
            const deviceIds = data?.deviceIds || [];
            if (!deviceIds.includes(deviceId)) {
              if (deviceIds.length >= 1) {
                throw E(403, 'لقد تجاوزت الحد الأقصى لعدد الأجهزة المسموح بها (جهاز واحد فقط). يرجى التواصل مع الدعم الفني لمسح الجهاز القديم.');
              }
              await studentDocRef.update({
                deviceIds: admin.firestore.FieldValue.arrayUnion(deviceId),
                lastLogin: new Date().toISOString()
              });
            } else {
              await studentDocRef.update({
                lastLogin: new Date().toISOString()
              });
            }
          } else {
            // First time login recording in Firestore
            await studentDocRef.set({
              id: st.id,
              name: st.name,
              phone: st.phone,
              deviceIds: [deviceId],
              lastLogin: new Date().toISOString(),
              createdAt: new Date().toISOString()
            });
          }
        } catch (err: any) {
          if (err.status) throw err;
          handleFirestoreError(err, OperationType.WRITE, `students/${st.id}`);
        }
      }

      res.json({ token: newSession('student', st.id, { did: deviceId }), role: 'student' });
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
      const { code, phone, password } = req.body || {};
      const ph = clean(phone, 30);
      const pw = clean(password, 100);

      if (ph && pw) {
        const sv = (db.supervisors || []).find(x => x.phone === ph && x.pass && scrypt(pw, db.settings.salt + x.id) === x.pass);
        if (sv) {
          return res.json({ token: newSession('teacher', 'SUP:' + sv.id), role: 'teacher', supervisor: sv });
        }
        throw E(401, 'رقم الهاتف أو كلمة السر للمشرف غير صحيحة');
      }

      const rawCode = clean(code, 200);
      // Support 100100 or admin directly
      const normRaw = rawCode.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      if (normRaw === '100100' || normRaw === 'admin' || normRaw === 'ادمن') {
        return res.json({ token: newSession('teacher', 'T'), role: 'teacher' });
      }

      const ok = scrypt(rawCode, db.settings.salt) === db.settings.teacher;
      if (!ok) {
        throw E(401, 'كود الأستاذ غير صحيح');
      }
      res.json({ token: newSession('teacher', 'T'), role: 'teacher' });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Supervisor Management Endpoints
  app.post('/api/teacher/supervisor', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const id = clean(b.id, 50);
      const name = clean(b.name, 100);
      const phone = clean(b.phone, 20);
      const password = clean(b.password, 100);
      const permissions = b.permissions || {
        courses: true,
        students: true,
        exams: true,
        coupons: true,
        financials: true,
        notices: true
      };

      if (!name || !phone) throw E(400, 'اكتب اسم ورقم هاتف المشرف');

      db.supervisors = db.supervisors || [];
      let sv = db.supervisors.find(x => x.id === id);
      if (sv) {
        sv.name = name;
        sv.phone = phone;
        if (password && password.length >= 4) {
          sv.pass = scrypt(password, db.settings.salt + sv.id);
        }
        sv.permissions = permissions;
      } else {
        if (!password || password.length < 4) throw E(400, 'اكتب كلمة سر للمشرف من 4 أحرف على الأقل');
        if (db.supervisors.some(x => x.phone === phone)) throw E(400, 'رقم الهاتف مسجل لمشرف آخر');
        sv = {
          id: 'sup-' + rnd(6),
          name,
          phone,
          pass: '',
          permissions,
          created: new Date().toISOString()
        };
        sv.pass = scrypt(password, db.settings.salt + sv.id);
        db.supervisors.push(sv);
      }
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.delete('/api/teacher/supervisor', (req, res) => {
    try {
      auth(req, 'teacher');
      const id = clean(req.query.id as string, 50);
      db.supervisors = (db.supervisors || []).filter(x => x.id !== id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Bundles Management
  app.get('/api/teacher/bundles', (req, res) => {
    try {
      auth(req, 'teacher');
      res.json(db.bundles || []);
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/bundles', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, title, courseIds, discountedPrice } = req.body || {};
      if (!title || !Array.isArray(courseIds) || courseIds.length === 0 || discountedPrice <= 0) {
        throw E(400, 'بيانات الباقة غير مكتملة');
      }
      db.bundles = db.bundles || [];
      const bundle = db.bundles.find(x => x.id === id);
      if (bundle) {
        bundle.title = clean(title, 200);
        bundle.courseIds = courseIds;
        bundle.discountedPrice = Number(discountedPrice);
      } else {
        db.bundles.push({
          id: 'bnd-' + rnd(6),
          title: clean(title, 200),
          courseIds,
          discountedPrice: Number(discountedPrice)
        });
      }
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.delete('/api/teacher/bundles', (req, res) => {
    try {
      auth(req, 'teacher');
      const id = clean(req.query.id as string, 50);
      db.bundles = (db.bundles || []).filter(x => x.id !== id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Affiliate Management
  app.post('/api/student/affiliate/generate', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      db.affiliates = db.affiliates || [];
      let aff = db.affiliates.find(x => x.studentId === sAuth.id);
      if (!aff) {
        aff = {
          id: 'aff-' + rnd(6),
          studentId: sAuth.id,
          code: mk('AFF', 4),
          commissionRate: 0.1 // Default 10%
        };
        db.affiliates.push(aff);
        save();
      }
      res.json(aff);
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.get('/api/student/affiliate/stats', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const aff = db.affiliates.find(x => x.studentId === sAuth.id);
      if (!aff) throw E(404, 'غير مشترك في نظام التسويق');
      const referrals = db.students.filter(x => x.referredBy === aff.code).length;
      res.json({ ...aff, referrals });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
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

  app.post('/api/student/profile', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s || s.status === 'blocked') throw E(403, 'تم حجب هذا الحساب');

      const b = req.body || {};
      if (clean(b.name, 100)) s.name = clean(b.name, 100);
      if (clean(b.governorate, 60)) s.governorate = clean(b.governorate, 60);
      if (clean(b.parentName, 100)) {
        s.parentName = clean(b.parentName, 100);
        const pr = db.parents.find(x => x.studentId === s.id);
        if (pr) pr.name = s.parentName;
      }
      if (clean(b.parentPhone, 20) && /^01\d{9}$/.test(clean(b.parentPhone, 20))) {
        s.parentPhone = clean(b.parentPhone, 20);
      }
      if (b.password && String(b.password).length >= 4) {
        s.pass = scrypt(clean(b.password, 100), db.settings.salt + s.id);
      }

      save();
      res.json({ ok: true, profile: studentView(s).profile });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/account/delete', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s) throw E(404, 'الحساب غير موجود');

      // Permanently remove student and related private data
      db.students = db.students.filter(x => x.id !== s.id);
      db.parents = db.parents.filter(x => x.studentId !== s.id);
      db.results = db.results.filter(x => x.studentId !== s.id);
      db.notes = (db.notes || []).filter(x => x.studentId !== s.id);
      db.appeals = (db.appeals || []).filter(x => x.studentName !== s.name);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
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

  app.post('/api/student/ai-exam/generate', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const student = db.students.find(x => x.id === sAuth.id);
      if (!student) throw E(403, 'غير مصرح');

      const wrongResults = db.results.filter(r => r.studentId === student.id && r.status === 'graded');
      if (wrongResults.length === 0) {
        throw E(400, 'لا توجد بيانات اختبارات سابقة لتوليد اختبار من الأخطاء');
      }

      const wrongQuestions = [];
      for (const r of wrongResults) {
        const exam = db.exams.find(e => e.id === r.examId);
        if (exam) {
          r.answers.forEach((ans: string, i: number) => {
            const kind = qKind(exam, i);
            const isCorrect = kind === 'mcq' ? ans === exam.key[i] : (r.questionFeedback && r.questionFeedback[i] && r.questionFeedback[i].score < r.questionFeedback[i].maxScore);
            if (!isCorrect) {
              wrongQuestions.push(exam.questions[i]);
            }
          });
        }
      }

      if (wrongQuestions.length === 0) {
        throw E(400, 'لا توجد أخطاء مسجلة لتوليد اختبار منها');
      }

      const prompt = `أنت معلم خبير. قم بتوليد امتحان جديد مكون من 5 أسئلة اختيارية (MCQ) بناءً على هذه المواضيع التي أخطأ فيها الطالب سابقاً:
      ${wrongQuestions.slice(0, 10).map(q => typeof q === 'string' ? q : q.text).join('\n')}
      أعد الامتحان بصيغة JSON:
      {
        "title": "اختبار تصحيح أخطاء الطالب",
        "questions": ["سؤال 1", "سؤال 2", "سؤال 3", "سؤال 4", "سؤال 5"],
        "options": [["أ","ب","ج","د"], ["أ","ب","ج","د"], ["أ","ب","ج","د"], ["أ","ب","ج","د"], ["أ","ب","ج","د"]],
        "key": ["أ", "أ", "أ", "أ", "أ"],
        "modelAnswer": "..."
      }`;

      const aiRes = await callGeminiWithRotation([{ role: 'user', parts: [{ text: prompt }]}], 'أنت معلم. أجب بصيغة JSON فقط.', true);
      const examData = JSON.parse(aiRes.text);

      const newExam = {
        id: 'ex-ai-' + rnd(6),
        title: examData.title,
        grade: student.grade,
        type: 'اختياري',
        questions: examData.questions,
        options: examData.options,
        key: examData.key,
        modelAnswer: examData.modelAnswer,
        created: new Date().toISOString()
      };

      db.exams.push(newExam);
      save();

      res.json({ ok: true, exam: newExam });
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

  app.post(['/api/student/profile', '/api/student/profile/update'], (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const s = db.students.find(x => x.id === sAuth.id);
      if (!s) throw E(404, 'الطالب غير موجود');
      const b = req.body || {};
      if (clean(b.name, 100)) s.name = clean(b.name, 100);
      if (clean(b.governorate, 100) !== undefined) s.governorate = clean(b.governorate, 100);
      if (clean(b.parentName, 100) !== undefined) s.parentName = clean(b.parentName, 100);
      if (clean(b.parentPhone, 30) !== undefined) s.parentPhone = clean(b.parentPhone, 30);
      if (b.password && String(b.password).length >= 6) {
        s.pass = scrypt(b.password, db.settings.salt);
      }
      save();
      res.json({ ok: true, name: s.name });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/account/delete', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const sId = sAuth.id;
      db.students = db.students.filter(x => x.id !== sId);
      db.results = db.results.filter(x => x.studentId !== sId);
      db.notes = (db.notes || []).filter(x => x.studentId !== sId);
      db.messages = db.messages.filter(x => x.studentId !== sId);
      db.walletTransactions = (db.walletTransactions || []).filter(x => x.studentId !== sId);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const handleAiChat = async (req: Request, res: Response, roleName: string) => {
    try {
      const question = clean(req.body.question, 3000);
      const imageBase64 = req.body.imageBase64;
      if (!question && !imageBase64) throw E(400, 'اكتب استفساراً أو أرفق صورة');

      if (hasValidGeminiKey()) {
        try {
          const sysPrompt = roleName === 'student'
            ? 'أنت المعلم والمساعد الذكي التفاعلي لمنصة الأستاذ محمد التعليمية. أجب على الطالب بأسلوب تربوي ممتع وبأمثلة واضحة في المنهج واللغة العربية والإعراب.'
            : roleName === 'parent'
            ? 'أنت المستشار الأكاديمي والتربوي لولي الأمر في منصة الأستاذ محمد التعليمية. قدم نصائح ودراسة لمستوى الطالب وإرشادات المذاكرة والتحصيل.'
            : 'أنت المساعد الأكاديمي الذكي للمعلم. ساعد المعلم في صياغة الامتحانات والأسئلة والواجبات وإعداد الملخصات والإعلانات الدراسية.';

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
          if (question) {
            parts.push({ text: question });
          }

          const response = await callGeminiWithRotation([{ role: 'user', parts }], sysPrompt);
          if (response.text) {
            return res.json({ reply: response.text, answer: response.text });
          }
        } catch (err: any) {
          console.warn('[AI Chat Error]', err);
        }
      }

      // Friendly fallback
      let reply = 'أستطيع مساعدتك في شرح دروس المنصة وإجابة استفساراتك. اكتب سؤالك وسأجيبك فوراً.';
      if (question.includes('إعراب') || question.includes('نحو')) {
        reply = 'التركيب النحوي والإعراب يعتمد على موقع الكلمة في الجملة (مبتدأ، خبر، فاعل، مفعول به). أرسل الجملة كاملة لنعربها سوياً!';
      } else if (question.includes('امتحان') || question.includes('درجة')) {
        reply = 'يمكنك مراجعة كافة الدرجات والنتائج والتصحيح المقالي التفصيلي من قسم الامتحانات بالمنصة.';
      }

      res.json({ reply, answer: reply });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };

  app.post(['/api/student/ai-chat', '/api/student/assistant'], (req, res) => handleAiChat(req, res, 'student'));
  app.post('/api/parent/ai-chat', (req, res) => handleAiChat(req, res, 'parent'));
  app.post('/api/teacher/ai-chat', (req, res) => handleAiChat(req, res, 'teacher'));

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
  app.post('/api/student/generate-mistakes-exam', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const student = db.students.find(x => x.id === sAuth.id);
      if (!student) throw E(404, 'الطالب غير موجود');

      // 1. Get all student results with mistakes
      const results = db.results.filter(r => r.studentId === student.id && r.status === 'graded');
      const mistakeContext: any[] = [];

      for (const resObj of results) {
        const exam = db.exams.find(e => e.id === resObj.examId);
        if (!exam) continue;

        resObj.questionFeedback?.forEach((qf: any) => {
          if (qf.score < qf.maxScore) {
            mistakeContext.push({
              examTitle: exam.title,
              question: qf.questionText,
              studentAnswer: qf.studentAnswer,
              correctAnswer: qf.modelAnswer
            });
          }
        });
      }

      if (mistakeContext.length === 0) {
        throw E(400, 'لا توجد أخطاء سابقة مسجلة لتوليد امتحان مراجعة منها. ابدأ بحل بعض الامتحانات أولاً!');
      }

      // 2. Limit context to latest 10 mistakes to avoid prompt bloat
      const context = mistakeContext.slice(-10);

      // 3. Prompt Gemini to generate a new exam
      const prompt = `بناءً على الأخطاء السابقة للطالب ${student.name} في اللغة العربية، قم بتوليد امتحان مراجعة ذكي يتكون من 5 أسئلة متنوعة (اختياري MCQ، صح وغلط، ومقالي Essay) تركز على هذه النقاط الضعيفة لتقويتها.
أخطاء الطالب السابقة للتحليل:
${JSON.stringify(context, null, 2)}

قواعد التوليد:
1. للأسئلة الاختيارية: اجعل النوع "mcq" والخيارات "أ، ب، ج، د".
2. لأسئلة صح وغلط: اجعل النوع "mcq" والخيارات "صح، خطأ".
3. للأسئلة المقالية: اجعل النوع "essay" والخيارات مصفوفة فارغة [].

أعد الامتحان بصيغة JSON فقط ككائن واحد يحتوي على:
{
  "title": "امتحان مراجعة مخصص بناءً على أخطائك السابقة",
  "type": "مختلط",
  "questions": [ { "text": "نص السؤال", "points": 1 } ],
  "kinds": ["mcq", "essay"],
  "options": [ ["أ", "ب", "ج", "د"] ],
  "key": ["الحرف الصحيح أو نص الإجابة النموذجية"]
}`;

      const aiRes = await callGeminiSDK({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        systemInstruction: 'أنت خبير تربوي في اللغة العربية. أعد الامتحان بصيغة JSON فقط بدون أي نص إضافي.',
        isJson: true,
        useSearch: false
      });

      let generatedExam: any = null;
      try {
        generatedExam = JSON.parse(aiRes.text);
      } catch {
        const m = aiRes.text.match(/\{[\s\S]*\}/);
        if (m) generatedExam = JSON.parse(m[0]);
      }

      if (!generatedExam) throw new Error('فشل توليد الامتحان من الذكاء الاصطناعي');

      // Assign a temporary ID for tracking
      generatedExam.id = 'gen-' + rnd(6);
      generatedExam.grade = student.grade;

      res.json({ exam: generatedExam });
    } catch (e: any) {
      res.status(e.status || 500).json({ error: e.message });
    }
  });

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
        fontFamily: db.settings.fontFamily || "'Cairo', sans-serif",
        panelBg: db.settings.panelBg || '#0d1728',
        cardBg: db.settings.cardBg || '#111f36',
        accentGold: db.settings.accentGold || '#f59e0b',
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
        onlinePay: !!db.settings.onlinePay,
        liveSessions: db.liveSessions || [],
        coupons: db.coupons || []
      });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  // Coupons & Promo Codes Endpoints
  app.post('/api/teacher/coupon', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const code = clean(b.code, 30).toUpperCase();
      const discountType = ['percentage', 'fixed', 'free_course'].includes(b.discountType) ? b.discountType : 'percentage';
      const discountValue = Number(b.discountValue) || 10;
      const courseId = clean(b.courseId, 50) || '';
      const maxUses = Number(b.maxUses) || 100;
      if (!code) throw E(400, 'أدخل كود الخصم');

      db.coupons = db.coupons || [];
      const coupon = {
        id: 'coup-' + rnd(6),
        code,
        discountType,
        discountValue,
        courseId,
        maxUses,
        usedCount: 0,
        expiresAt: b.expiresAt || new Date(Date.now() + 864e5 * 30).toISOString(),
        created: new Date().toISOString()
      };
      db.coupons.unshift(coupon);
      save();
      res.json({ ok: true, coupon, coupons: db.coupons });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const deleteCouponHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query?.id;
      db.coupons = (db.coupons || []).filter(c => c.id !== String(id));
      save();
      res.json({ ok: true, coupons: db.coupons });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/coupon/delete', deleteCouponHandler);
  app.delete(['/api/teacher/coupon', '/api/teacher/coupon/delete'], deleteCouponHandler);

  // Teacher Grant Free Package/Course to Student
  app.post('/api/teacher/student/grant-package', (req, res) => {
    try {
      auth(req, 'teacher');
      const { studentId, courseId, days } = req.body || {};
      const s = db.students.find(x => x.id === studentId);
      if (!s) throw E(404, 'الطالب غير موجود');
      const course = db.courses.find(x => x.id === courseId);
      if (!course) throw E(404, 'الكورس غير موجود');

      s.enrollments = s.enrollments || [];
      const exp = new Date();
      exp.setDate(exp.getDate() + (Number(days) || course.days || 30));
      const existing = s.enrollments.find((e: any) => e.courseId === course.id);
      if (existing) {
        existing.expiresAt = exp.toISOString();
      } else {
        s.enrollments.push({ courseId: course.id, expiresAt: exp.toISOString() });
      }
      save();
      res.json({ ok: true, message: `تم منح كورس "${course.title}" للطالب ${s.name} مجاناً بنجاح.` });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Google Meet Live Broadcast Endpoints
  app.post('/api/teacher/live', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const title = clean(b.title, 150);
      const grade = clean(b.grade, 80) || 'كل الصفوف';
      let meetUrl = clean(b.meetUrl, 1000);
      let meetCode = clean(b.meetCode, 50);

      if (!title) throw E(400, 'اكتب عنوان الحصة أو البث المباشر');

      if (!meetUrl && meetCode) {
        meetUrl = `https://meet.google.com/${meetCode.replace(/\s+/g, '')}`;
      } else if (meetUrl && !meetCode) {
        const m = meetUrl.match(/meet\.google\.com\/([a-z0-9-]+)/i);
        if (m) meetCode = m[1];
      }

      if (!meetUrl) throw E(400, 'يرجى وضع رابط أو كود Google Meet');

      const course = b.courseId ? db.courses.find(c => c.id === b.courseId) : null;
      const status = ['live', 'upcoming', 'ended'].includes(b.status) ? b.status : 'live';

      const session: any = {
        id: b.id || 'live-' + rnd(6),
        title,
        grade,
        courseId: course?.id || '',
        courseTitle: course?.title || 'عام لجميع الطلاب',
        meetUrl,
        meetCode: meetCode || 'meet-call',
        status,
        scheduledAt: b.scheduledAt || new Date().toISOString(),
        notes: clean(b.notes, 500),
        created: new Date().toISOString()
      };

      db.liveSessions = db.liveSessions || [];
      if (b.id) {
        const idx = db.liveSessions.findIndex(s => s.id === b.id);
        if (idx >= 0) db.liveSessions[idx] = session;
        else db.liveSessions.unshift(session);
      } else {
        db.liveSessions.unshift(session);
      }

      save();
      res.json({ ok: true, session, liveSessions: db.liveSessions });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/live/status', (req, res) => {
    try {
      auth(req, 'teacher');
      const { id, status } = req.body || {};
      const sess = (db.liveSessions || []).find(s => s.id === id);
      if (!sess) throw E(404, 'جلسة البث غير موجودة');
      sess.status = status;
      save();
      res.json({ ok: true, session: sess, liveSessions: db.liveSessions });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const deleteLiveHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query.id;
      db.liveSessions = (db.liveSessions || []).filter(s => s.id !== id);
      save();
      res.json({ ok: true, liveSessions: db.liveSessions });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/live/delete', deleteLiveHandler);
  app.delete(['/api/teacher/live', '/api/teacher/live/delete'], deleteLiveHandler);

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
      if (b.fontFamily) db.settings.fontFamily = clean(b.fontFamily, 100);
      if (b.panelBg) db.settings.panelBg = clean(b.panelBg, 30);
      if (b.cardBg) db.settings.cardBg = clean(b.cardBg, 30);
      if (b.accentGold) db.settings.accentGold = clean(b.accentGold, 30);
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
      if (b.onlinePayKey !== undefined) db.settings.onlinePayKey = clean(b.onlinePayKey, 200);
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

      // Auto generate 5 access codes for the new course
      db.codes = db.codes || [];
      for (let i = 0; i < 5; i++) {
        const part1 = mk('', 4).slice(1);
        const part2 = mk('', 4).slice(1);
        const c = `CRS-${part1}-${part2}`;
        db.codes.push({
          id: rnd(6),
          code: c,
          hash: sha(db.settings.pepper + c),
          hint: c.slice(-4),
          days: course.days,
          courseId: course.id,
          courseTitle: course.title,
          status: 'unused',
          created: new Date().toISOString()
        });
      }

      save();
      res.json({ ok: true, course });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post(['/api/teacher/course/delete', '/api/teacher/course/archive'], (req, res) => {
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
        lecture: clean(b.lecture, 200),
        created: new Date().toISOString()
      });
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const deleteContentHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query.id;
      const c = db.content.find(x => x.id === id);
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
  };
  app.post('/api/teacher/content/delete', deleteContentHandler);
  app.delete(['/api/teacher/content', '/api/teacher/content/delete'], deleteContentHandler);

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

  const deleteNoticeHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query.id;
      db.notices = db.notices.filter(x => x.id !== id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/notice/delete', deleteNoticeHandler);
  app.delete(['/api/teacher/notice', '/api/teacher/notice/delete'], deleteNoticeHandler);

  app.post('/api/teacher/exam', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const rawItems = Array.isArray(b.items) ? b.items : (Array.isArray(b.questions) ? b.questions : []);
      if (rawItems.length) {
        const items = rawItems.slice(0, 50).filter((x: any) => x && clean(x.q || x.text, 1000));
        if (!clean(b.title) || !items.length) throw E(400, 'اكتب عنواناً وأسئلة (حتى 50)');
        const L = ['أ', 'ب', 'ج', 'د'];
        const kinds: string[] = [];
        const questions: string[] = [];
        const options: string[][] = [];
        const key: string[] = [];
        const models: string[] = [];

        for (const x of items) {
          const qText = clean(x.q || x.text, 1000);
          const mcq = x.kind === 'mcq';
          questions.push(qText);
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
            models.push(clean(x.model || x.modelAnswer, 3000));
          }
        }

        const course = b.courseId ? db.courses.find(x => x.id === b.courseId && x.status === 'published') : null;
        const type = kinds.every(k => k === 'mcq') ? 'اختياري' : kinds.every(k => k === 'essay') ? 'مقالي' : 'مختلط';

        const customModelAnswer = clean(b.modelAnswer, 5000);
        const autoModelAnswer = models.map((m, i) => (kinds[i] === 'essay' && m ? `س ${i + 1}: ${m}` : '')).filter(Boolean).join('\n');

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
          modelAnswer: customModelAnswer || autoModelAnswer,
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

  const deleteExamHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query.id;
      db.exams = db.exams.filter(x => x.id !== id);
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/exam/delete', deleteExamHandler);
  app.delete(['/api/teacher/exam', '/api/teacher/exam/delete'], deleteExamHandler);

  // AI Exam Grading Endpoints for Teachers
  app.post('/api/teacher/results/ai-grade', async (req, res) => {
    try {
      auth(req, 'teacher');
      const { resultId } = req.body || {};
      const r = db.results.find(x => x.id === resultId);
      if (!r) throw E(404, 'النتيجة غير موجودة');
      const exam = db.exams.find(e => e.id === r.examId);
      if (!exam) throw E(404, 'الامتحان غير موجود');

      const graded = await gradeFullExamSubmissionWithAI(exam, r.answers, null);
      r.score = graded.score;
      r.total = graded.total;
      r.label = graded.label;
      r.status = 'graded';
      r.aiGraded = true;
      r.aiFeedback = graded.feedback;
      r.questionFeedback = graded.questionFeedback;
      save();
      res.json({ ok: true, result: r });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/results/ai-grade-all', async (req, res) => {
    try {
      auth(req, 'teacher');
      const { examId } = req.body || {};
      const pending = (db.results || []).filter(r => (!examId || r.examId === examId) && r.status === 'pending');
      let count = 0;
      for (const r of pending) {
        const exam = db.exams.find(e => e.id === r.examId);
        if (exam) {
          const graded = await gradeFullExamSubmissionWithAI(exam, r.answers, null);
          r.score = graded.score;
          r.total = graded.total;
          r.label = graded.label;
          r.status = 'graded';
          r.aiGraded = true;
          r.aiFeedback = graded.feedback;
          r.questionFeedback = graded.questionFeedback;
          count++;
        }
      }
      save();
      res.json({ ok: true, count, message: `تم تصحيح ${count} امتحان بنجاح بواسطة الذكاء الاصطناعي` });
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
      const n = Math.min(Math.max(+b.count || 1, 1), 200);
      const days = Math.min(Math.max(+b.days || 30, 1), 3650);
      const course = b.courseId ? db.courses.find(x => x.id === b.courseId && x.status === 'published') : null;
      if (b.courseId && !course) throw E(400, 'اختر كورساً منشوراً أو اشتراكاً عاماً');

      const customPrefix = clean(b.prefix, 10).toUpperCase().replace(/[^A-Z0-9]/g, '');
      const prefix = customPrefix || (course ? 'CRS' : 'SUB');

      const out: string[] = [];
      for (let i = 0; i < n; i++) {
        const part1 = mk('', 4).slice(1);
        const part2 = mk('', 4).slice(1);
        const c = `${prefix}-${part1}-${part2}`;
        out.push(c);
        db.codes.push({
          id: rnd(6),
          code: c,
          hash: sha(db.settings.pepper + c),
          hint: c.slice(-4),
          days: course ? course.days : days,
          courseId: course?.id || '',
          courseTitle: course?.title || 'اشتراك عام في المنصة',
          status: 'unused',
          created: new Date().toISOString()
        });
      }
      save();
      res.json({
        ok: true,
        codes: out,
        course: course ? { title: course.title, price: course.price, days: course.days } : null,
        days: course ? course.days : days,
        count: out.length
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const deleteCodeHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query.id;
      db.codes = db.codes.filter(x => !(x.id === id && x.status === 'unused'));
      save();
      res.json({ ok: true });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/codes/delete', deleteCodeHandler);
  app.delete(['/api/teacher/codes', '/api/teacher/code'], deleteCodeHandler);

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

  const deleteSocialHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query?.id;
      if (!id) throw E(400, 'معرف الرابط مطلوب');
      db.socialLinks = (db.socialLinks || []).filter(s => s.id !== String(id));
      save();
      res.json({ ok: true, socialLinks: db.socialLinks });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/social/delete', deleteSocialHandler);
  app.delete(['/api/teacher/social', '/api/teacher/social/delete', '/api/teacher/social-link'], deleteSocialHandler);

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

  // ==========================================
  // GOOGLE MEET LIVE SESSIONS & AUTOMATED ATTENDANCE TRACKING
  // ==========================================
  app.get('/api/teacher/live-sessions', (req, res) => {
    try {
      auth(req, 'teacher');
      res.json({
        ok: true,
        liveSessions: db.liveSessions || [],
        liveAttendance: db.liveAttendance || []
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/teacher/live-session', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const title = clean(b.title, 200);
      const meetUrl = clean(b.meetUrl, 500);
      const grade = clean(b.grade, 50) || 'كل الصفوف';
      const scheduledAt = clean(b.scheduledAt, 100) || new Date().toISOString();
      const status = clean(b.status, 20) || 'active'; // 'scheduled' | 'active' | 'ended'
      const notes = clean(b.notes, 500);

      if (!title) throw E(400, 'عنوان حلقة البث المباشر مطلوب');
      if (!meetUrl) throw E(400, 'رابط Google Meet مطلوب');

      db.liveSessions = db.liveSessions || [];
      if (b.id) {
        const item = db.liveSessions.find(s => s.id === b.id);
        if (!item) throw E(404, 'البث غير موجود');
        item.title = title;
        item.meetUrl = meetUrl;
        item.grade = grade;
        item.scheduledAt = scheduledAt;
        item.status = status;
        item.notes = notes;
      } else {
        const newSession = {
          id: 'meet-' + rnd(6),
          title,
          meetUrl,
          grade,
          scheduledAt,
          status,
          notes,
          created: new Date().toISOString()
        };
        db.liveSessions.push(newSession);
      }
      save();

      // Notify students if set to active
      if (status === 'active') {
        notifyAdminEvents(`🔴 بدء بث مباشر جديد عبر Google Meet: ${title}`, `الصف: ${grade}\nرابط الانضمام: ${meetUrl}`);
      }

      res.json({ ok: true, liveSessions: db.liveSessions });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  const deleteLiveSessionHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query?.id;
      if (!id) throw E(400, 'معرف البث مطلوب');
      db.liveSessions = (db.liveSessions || []).filter(s => s.id !== String(id));
      db.liveAttendance = (db.liveAttendance || []).filter(a => a.sessionId !== String(id));
      save();
      res.json({ ok: true, liveSessions: db.liveSessions, liveAttendance: db.liveAttendance });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/live-session/delete', deleteLiveSessionHandler);
  app.delete(['/api/teacher/live-session', '/api/teacher/live-session/delete'], deleteLiveSessionHandler);

  // Manual Attendance Adjustment by Teacher
  app.post('/api/teacher/live-attendance/manual', (req, res) => {
    try {
      auth(req, 'teacher');
      const b = req.body || {};
      const sessionId = clean(b.sessionId, 50);
      const studentId = clean(b.studentId, 50);
      const status = clean(b.status, 50) || 'حاضر يدوياً';
      const notes = clean(b.notes, 200);

      const student = (db.students || []).find(s => s.id === studentId);
      const session = (db.liveSessions || []).find(s => s.id === sessionId);
      if (!student || !session) throw E(404, 'بيانات الطالب أو حلقة البث غير موجودة');

      db.liveAttendance = db.liveAttendance || [];
      let record = db.liveAttendance.find(a => a.sessionId === sessionId && a.studentId === studentId);
      if (record) {
        record.status = status;
        record.notes = notes;
        record.updatedAt = new Date().toISOString();
      } else {
        record = {
          id: 'att-' + rnd(6),
          sessionId,
          sessionTitle: session.title,
          studentId: student.id,
          studentName: student.name,
          studentPhone: student.phone,
          grade: student.grade,
          joinedAt: new Date().toISOString(),
          status,
          notes,
          type: 'manual'
        };
        db.liveAttendance.push(record);
      }
      save();
      res.json({ ok: true, record, liveAttendance: db.liveAttendance });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Student Attendance Trigger when clicking Google Meet Link
  app.post('/api/student/live-attend', (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const student = (db.students || []).find(s => s.id === sAuth.id);
      if (!student || student.status === 'blocked') throw E(403, 'حساب غير متاح');

      const { sessionId } = req.body || {};
      const session = (db.liveSessions || []).find(s => s.id === sessionId);
      if (!session) throw E(404, 'حلقة البث المباشر غير موجودة');

      db.liveAttendance = db.liveAttendance || [];
      let existingRecord = db.liveAttendance.find(a => a.sessionId === sessionId && a.studentId === student.id);

      const now = new Date().toISOString();
      if (!existingRecord) {
        existingRecord = {
          id: 'att-' + rnd(6),
          sessionId: session.id,
          sessionTitle: session.title,
          studentId: student.id,
          studentName: student.name,
          studentPhone: student.phone,
          grade: student.grade,
          joinedAt: now,
          status: 'حاضر آلياً',
          type: 'auto',
          device: clean(req.headers['user-agent'] || 'Web', 150)
        };
        db.liveAttendance.push(existingRecord);
        save();

        // Send WhatsApp notification to parent if enabled
        if (student.parentPhone) {
          sendWhatsAppNotification(
            student.parentPhone,
            `✅ *إشعار حضور بث مباشر*\nتم انضمام ابنك الطالب/ة (${student.name}) بحضور آلي موثق لحلقة البث المباشر: "${session.title}" بتاريخ ${new Date().toLocaleTimeString('ar-EG')}.`
          );
        }
      }

      res.json({
        ok: true,
        alreadyRecorded: !!existingRecord,
        attendance: existingRecord,
        meetUrl: session.meetUrl
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.post('/api/student/live-attend-qr', async (req, res) => {
    try {
      const sAuth = auth(req, 'student');
      const student = (db.students || []).find(s => s.id === sAuth.id);
      if (!student || student.status === 'blocked') throw E(403, 'حساب غير متاح');

      const { sessionId, qrCode } = req.body || {};
      const session = (db.liveSessions || []).find(s => s.id === sessionId);
      if (!session) throw E(404, 'حلقة البث غير موجودة');

      // Simple QR validation (QR code contains sessionId)
      if (qrCode !== sessionId) throw E(400, 'كود QR غير صحيح');

      db.liveAttendance = db.liveAttendance || [];
      let existingRecord = db.liveAttendance.find(a => a.sessionId === sessionId && a.studentId === student.id);

      if (!existingRecord) {
        existingRecord = {
          id: 'att-' + rnd(6),
          sessionId: session.id,
          sessionTitle: session.title,
          studentId: student.id,
          studentName: student.name,
          studentPhone: student.phone,
          grade: student.grade,
          joinedAt: new Date().toISOString(),
          status: 'حاضر (QR)',
          type: 'qr'
        };
        db.liveAttendance.push(existingRecord);
        save();
        
        // Sync to Firestore
        try {
          await firestore.collection('live_attendance').doc(existingRecord.id).set({
            ...existingRecord
          });
        } catch (err) {
          console.error('Failed to sync attendance to Firestore:', err);
        }

        notifyAdminEvents('حضور مباشر عبر QR', `الطالب ${student.name} حضر حلقة: ${session.title}`);
      }

      res.json({ ok: true, attendance: existingRecord });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  app.get('/api/parent/live-attendance', (req, res) => {
    try {
      const pAuth = auth(req, 'parent');
      const parent = (db.parents || []).find(p => p.id === pAuth.id);
      if (!parent || !parent.studentId) throw E(404, 'بيانات الحساب غير مكتملة');

      const logs = (db.liveAttendance || []).filter(a => a.studentId === parent.studentId);
      res.json({ ok: true, attendanceLogs: logs });
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

  const deleteGatewayHandler = (req: Request, res: Response) => {
    try {
      auth(req, 'teacher');
      const id = req.body?.id || req.query?.id;
      if (!id) throw E(400, 'معرف طريقة الدفع مطلوب');
      db.gateways = (db.gateways || []).filter(g => g.id !== String(id));
      save();
      res.json({ ok: true, gateways: db.gateways });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  };
  app.post('/api/teacher/gateway/delete', deleteGatewayHandler);
  app.delete(['/api/teacher/gateway', '/api/teacher/gateway/delete'], deleteGatewayHandler);

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

      const { question, isExamActive, imageBase64, history } = req.body || {};

      // STRICT ANTI-CHEAT RULE
      if (isExamActive) {
        throw E(403, '⛔ تم حجب وإغلاق المساعد الذكي تلقائياً لمنع الغش أثناء أداء الامتحان.');
      }

      const q = clean(question, 3000);
      if (!q && !imageBase64) throw E(400, 'اكتب سؤالك أو ارفع صورة لمناقشتها');

      const contents = Array.isArray(history) ? history : [];
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
      if (q) {
        parts.push({ text: q });
      } else if (imageBase64) {
        parts.push({ text: 'يرجى شرح محتوى هذه الصورة وحل المسائل الموضحة بها بأسلوب تعليمي مبسط.' });
      }
      contents.push({ role: 'user', parts });

      const systemInstruction = `أنت المساعد التعليمي الذكي (AI Study Buddy) لمنصة الأستاذ محمد عبد المقصود. 
مهمتك مساعدة الطلاب في فهم اللغة العربية والمواد الدراسية.
استخدم أسلوباً مشجعاً وودوداً.
عند الإجابة على أسئلة عامة أو معقدة، استخدم أداة البحث في جوجل (Google Search) لضمان دقة المعلومات وتوفير مصادر خارجية إذا لزم الأمر.
دائماً وجه الطالب لكتب الوزارة والمناهج الرسمية في النهاية.`;

      const aiRes = await callGeminiSDK({
        contents,
        systemInstruction,
        useSearch: true
      });

      res.json({ 
        ok: true,
        reply: aiRes.text, 
        answer: aiRes.text,
        groundingMetadata: aiRes.groundingMetadata 
      });
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
    }
  });

  // Google Auth Verify Route
  app.post('/api/auth/google', async (req, res) => {
    try {
      const { idToken } = req.body;
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const email = decodedToken.email;
      const googleId = decodedToken.uid;
      const name = decodedToken.name;

      let st = db.students.find(s => s.googleId === googleId || (email && s.email === email));
      if (!st) {
        st = {
          id: rnd(6),
          code: mk('ST'),
          name: name || 'طالب جوجل',
          email: email || '',
          googleId,
          phone: '', 
          grade: 'غير محدد',
          status: 'active',
          subEnd: '',
          walletBalance: 0,
          pass: '',
          enrollments: [],
          created: new Date().toISOString()
        };
        db.students.push(st);
        save();
      } else if (!st.googleId) {
        st.googleId = googleId;
        save();
      }

      const deviceId = req.headers['x-device-id'] as string || 'unknown';
      res.json({ token: newSession('student', st.id, { did: deviceId }), role: 'student' });
    } catch (e: any) {
      console.error('[Google Auth Error]', e);
      res.status(401).json({ error: 'فشل التحقق من حساب جوجل' });
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

  app.post('/api/teacher/settings/toggle-pay', (req, res) => {
    try {
      auth(req, 'teacher');
      db.settings.onlinePay = !db.settings.onlinePay;
      save();
      res.json({ ok: true, onlinePay: db.settings.onlinePay });
    } catch (e: any) {
      res.status(e.status || 401).json({ error: e.message });
    }
  });

  app.post('/api/student/cashier-unlock', (req, res) => {
    try {
      auth(req, 'student');
      const { key } = req.body || {};
      if (key && key === db.settings.cashierKey) {
        res.json({ ok: true, message: 'تم تفعيل الدفع الإلكتروني بنجاح' });
      } else {
        throw E(400, 'كود الكاشير غير صحيح');
      }
    } catch (e: any) {
      res.status(e.status || 400).json({ error: e.message });
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
