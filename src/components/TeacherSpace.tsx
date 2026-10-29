import React, { useState, useRef } from 'react';
import {
  TeacherData,
  GRADES,
  Grade,
} from '../types';
import { apiRequest, tokens, uploadFile } from '../services/api';
import {
  Shield,
  Users,
  UserCheck,
  CheckCircle2,
  MessageSquare,
  Settings,
  PlusCircle,
  Bell,
  Key,
  Upload,
  FileQuestion,
  GraduationCap,
  Trash2,
  Copy,
  ExternalLink,
  Search,
  Lock,
  Unlock,
  LogOut,
  ArrowRight,
  AlertCircle,
  CreditCard,
  Wallet,
  Check,
  X,
  Eye,
  EyeOff,
  Smartphone,
  Edit,
  ToggleLeft,
  ToggleRight,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

interface TeacherSpaceProps {
  teacherData: TeacherData | null;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
  onBackToStudent: () => void;
  onUpdatePublic?: () => Promise<void>;
}

const ALL_GRADES: (Grade | 'كل الصفوف')[] = ['كل الصفوف', ...GRADES];

export const TeacherSpace: React.FC<TeacherSpaceProps> = ({
  teacherData,
  onRefresh,
  onLogout,
  onBackToStudent,
  onUpdatePublic,
}) => {
  // Auth state
  const [code, setCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Search in accounts
  const [searchQuery, setSearchQuery] = useState('');

  // Settings form
  const [settingsName, setSettingsName] = useState(teacherData?.name || '');
  const [settingsPw, setSettingsPw] = useState('');
  const [settingsPayments, setSettingsPayments] = useState('');
  const [settingsMsg, setSettingsMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // New Course form
  const [cTitle, setCTitle] = useState('');
  const [cGrade, setCGrade] = useState<string>('كل الصفوف');
  const [cPrice, setCPrice] = useState<number>(100);
  const [cDays, setCDays] = useState<number>(30);
  const [cDesc, setCDesc] = useState('');
  const [cIsFree, setCIsFree] = useState(false);
  const [cMsg, setCMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Notice form
  const [nKind, setNKind] = useState<'announcement' | 'schedule'>('announcement');
  const [nText, setNText] = useState('');
  const [nGrade, setNGrade] = useState<string>('كل الصفوف');
  const [nMsg, setNMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Codes generator
  const [codeCourseId, setCodeCourseId] = useState('');
  const [codeCount, setCodeCount] = useState(1);
  const [codeDays, setCodeDays] = useState(30);
  const [generatedCodes, setGeneratedCodes] = useState<string[]>([]);
  const [generatedMsg, setGeneratedMsg] = useState('');
  const [copyStatus, setCopyStatus] = useState(false);

  // Content publisher
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'video' | 'image' | 'note' | 'homework'>('note');
  const [contentTitle, setContentTitle] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [contentCourseId, setContentCourseId] = useState('');
  const [contentGrade, setContentGrade] = useState<string>('كل الصفوف');
  const [contentIsFree, setContentIsFree] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [contentMsg, setContentMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Dynamic Exam Builder
  interface QuestionItem {
    kind: 'mcq' | 'essay';
    q: string;
    options: string[];
    answer: string;
    model: string;
  }
  const [examTitle, setExamTitle] = useState('');
  const [examCourseId, setExamCourseId] = useState('');
  const [examGrade, setExamGrade] = useState<string>('كل الصفوف');
  const [examItems, setExamItems] = useState<QuestionItem[]>([
    {
      kind: 'mcq',
      q: '',
      options: ['', '', '', ''],
      answer: 'أ',
      model: '',
    },
  ]);
  const [examMsg, setExamMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Grading form
  const [gradingScores, setGradingScores] = useState<Record<string, number | string>>({});

  // Message replies
  const [messageReplies, setMessageReplies] = useState<Record<string, string>>({});

  // Appeal scores
  const [appealScores, setAppealScores] = useState<Record<string, string>>({});

  // Primary Admin Tab System State
  const [activeMainTab, setActiveMainTab] = useState<
    'overview' | 'financials' | 'content' | 'students' | 'settings'
  >('overview');

  // SYSTEM 1: Manual Gateway State
  const [gwId, setGwId] = useState('');
  const [gwTitle, setGwTitle] = useState('');
  const [gwProvider, setGwProvider] = useState('vodafone');
  const [gwAccountNumber, setGwAccountNumber] = useState('');
  const [gwAccountHolder, setGwAccountHolder] = useState('');
  const [gwInstructions, setGwInstructions] = useState('');
  const [gwActive, setGwActive] = useState(true);
  const [gwMsg, setGwMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [gwLoading, setGwLoading] = useState(false);

  // Social Media Links Form State
  const [socialPlatform, setSocialPlatform] = useState('whatsapp');
  const [socialTitle, setSocialTitle] = useState('واتساب الإدارة');
  const [socialUrl, setSocialUrl] = useState('');
  const [socialMsg, setSocialMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [socialLoading, setSocialLoading] = useState(false);

  // SYSTEM 5: Recharge Request Review & Zoom Modal
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [rejectionModalTxId, setRejectionModalTxId] = useState<string | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [rechargesFilter, setRechargesFilter] = useState<'pending' | 'all' | 'approved' | 'rejected'>('pending');

  // SYSTEM 3: Adjust Student Balance State
  const [adjustModalStudent, setAdjustModalStudent] = useState<any | null>(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustLoading, setAdjustLoading] = useState(false);

  // Report and Export Modal State
  const [reportStudent, setReportStudent] = useState<any | null>(null);

  // File input refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  // Handlers
  const handleSaveGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gwTitle.trim() || !gwAccountNumber.trim()) {
      setGwMsg({ text: 'يرجى كتابة اسم الطريقة ورقم الحساب/المحفظة', ok: false });
      return;
    }
    setGwLoading(true);
    setGwMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/gateway', {
        id: gwId || undefined,
        title: gwTitle.trim(),
        provider: gwProvider,
        accountNumber: gwAccountNumber.trim(),
        accountHolder: gwAccountHolder.trim(),
        instructions: gwInstructions.trim(),
        active: gwActive,
      });
      setGwMsg({ text: 'تم حفظ بوابة الدفع بنجاح!', ok: true });
      setGwId('');
      setGwTitle('');
      setGwAccountNumber('');
      setGwAccountHolder('');
      setGwInstructions('');
      setGwActive(true);
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setGwMsg({ text: err.message || 'تعذر حفظ بوابة الدفع', ok: false });
    } finally {
      setGwLoading(false);
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (!window.confirm('هل أنت تأكد من حذف طريقة الدفع هذه؟')) return;
    try {
      await apiRequest('teacher', `/api/teacher/gateway?id=${id}`, undefined, 'DELETE');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      alert(err.message || 'تعذر الحذف');
    }
  };

  const handleToggleGateway = async (id: string) => {
    try {
      await apiRequest('teacher', '/api/teacher/gateway/toggle', { id });
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير الحالة');
    }
  };

  // Social Links Handlers
  const handleSaveSocial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!socialUrl.trim()) {
      setSocialMsg({ text: 'يرجى كتابة الرابط المباشر', ok: false });
      return;
    }
    setSocialLoading(true);
    setSocialMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/social-link', {
        platform: socialPlatform,
        title: socialTitle.trim() || socialPlatform,
        url: socialUrl.trim(),
        active: true,
      });
      setSocialMsg({ text: 'تم إضافة زر التواصل بنجاح!', ok: true });
      setSocialUrl('');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setSocialMsg({ text: err.message || 'تعذر إضافة زر التواصل', ok: false });
    } finally {
      setSocialLoading(false);
    }
  };

  const handleDeleteSocial = async (id: string) => {
    if (!window.confirm('هل أنت مقتنع بحذف زر التواصل هذا؟')) return;
    try {
      await apiRequest('teacher', `/api/teacher/social-link?id=${id}`, undefined, 'DELETE');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      alert(err.message || 'تعذر الحذف');
    }
  };

  const handleToggleSocial = async (id: string) => {
    try {
      await apiRequest('teacher', '/api/teacher/social-link/toggle', { id });
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير الحالة');
    }
  };

  // Review Wallet Recharge Requests
  const handleReviewRecharge = async (txId: string, action: 'approve' | 'reject', reason?: string) => {
    setReviewLoading(true);
    try {
      await apiRequest('teacher', '/api/teacher/wallet-review', {
        transactionId: txId,
        action,
        rejectionReason: reason || undefined,
      });
      setRejectionModalTxId(null);
      setRejectionReasonInput('');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر إتمام المراجعة');
    } finally {
      setReviewLoading(false);
    }
  };

  // Review Offline Package Orders
  const handleReviewPackageOrder = async (orderId: string, action: 'approve' | 'reject', reason?: string) => {
    setReviewLoading(true);
    try {
      await apiRequest('teacher', '/api/teacher/package-order-review', {
        orderId,
        action,
        rejectionReason: reason || undefined,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر إتمام المراجعة');
    } finally {
      setReviewLoading(false);
    }
  };

  // Adjust Student Balance
  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalStudent || !adjustAmount) return;
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum) || amountNum === 0) {
      alert('يرجى كتابة مبلغ صحيح أكبر أو أصغر من الصفر');
      return;
    }
    setAdjustLoading(true);
    try {
      await apiRequest('teacher', '/api/teacher/student/adjust-balance', {
        studentId: adjustModalStudent.id,
        amount: amountNum,
        reason: adjustReason.trim() || 'تعديل يدوية من الإدارة',
      });
      alert('تم تعديل رصيد الطالب بنجاح!');
      setAdjustModalStudent(null);
      setAdjustAmount('');
      setAdjustReason('');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تعديل الرصيد');
    } finally {
      setAdjustLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await apiRequest('public', '/api/teacher/login', { code });
      tokens.teacher = res.token;
      await onRefresh();
    } catch (err: any) {
      setAuthError(err.message || 'كود المعلم غير صحيح');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSettingsMsg(null);

    let heroUrl: string | undefined;
    const heroFile = heroInputRef.current?.files?.[0];
    if (heroFile) {
      try {
        const uRes = await uploadFile('/api/upload', heroFile);
        heroUrl = (uRes as any).url || `/uploads/${uRes.fileId}`;
      } catch (err) {
        setSettingsMsg({ text: 'فشل رفع صورة المنصة', ok: false });
        return;
      }
    }

    try {
      await apiRequest('teacher', '/api/teacher/settings', {
        name: settingsName,
        password: settingsPw || undefined,
        payments: settingsPayments,
        heroBannerUrl: heroUrl,
      });
      setSettingsMsg({ text: 'تم حفظ إعدادات وصورة المنصة بنجاح!', ok: true });
      setSettingsPw('');
      if (heroInputRef.current) heroInputRef.current.value = '';
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setSettingsMsg({ text: err.message || 'حدث خطأ في حفظ الإعدادات', ok: false });
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setCMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/course', {
        title: cTitle,
        grade: cGrade,
        price: cPrice,
        days: cDays,
        description: cDesc,
        isFree: cIsFree,
      });
      setCMsg({ text: 'تم نشر الكورس بنجاح!', ok: true });
      setCTitle('');
      setCDesc('');
      await onRefresh();
    } catch (err: any) {
      setCMsg({ text: err.message || 'تعذر نشر الكورس', ok: false });
    }
  };

  const handleArchiveCourse = async (id: string) => {
    try {
      await apiRequest('teacher', '/api/teacher/course/archive', { id });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر أرشفة الكورس');
    }
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    setNMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/notice', {
        kind: nKind,
        text: nText,
        grade: nGrade,
      });
      setNMsg({ text: 'تم نشر الإعلان بنجاح!', ok: true });
      setNText('');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setNMsg({ text: err.message || 'تعذر نشر الإعلان', ok: false });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await apiRequest('teacher', `/api/teacher/notice?id=${id}`, undefined, 'DELETE');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الإعلان');
    }
  };

  const handleGenerateCodes = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiRequest('teacher', '/api/teacher/codes', {
        courseId: codeCourseId || null,
        count: codeCount,
        days: codeDays,
      });
      setGeneratedCodes(res.codes || []);
      setGeneratedMsg(res.messageText || '');
      setCopyStatus(false);
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر توليد الأكواد');
    }
  };

  const handleCopyCodes = () => {
    if (generatedCodes.length === 0) return;
    navigator.clipboard.writeText(generatedCodes.join('\n'));
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 3000);
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await apiRequest('teacher', `/api/teacher/code?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الكود');
    }
  };

  const handlePublishContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setContentMsg(null);

    let fileUrl = contentLink;

    if (contentFile) {
      try {
        setUploadProgress(0);
        const res = await uploadFile('/api/upload', contentFile, (p: number) => setUploadProgress(Math.round(p * 100)));
        fileUrl = (res as any).url || `/uploads/${res.fileId}`;
      } catch (err) {
        setContentMsg({ text: 'فشل رفع الملف', ok: false });
        setUploadProgress(null);
        return;
      } finally {
        setUploadProgress(null);
      }
    }

    if (!fileUrl) {
      setContentMsg({ text: 'يرجى اختيار ملف أو وضع رابط محتوى', ok: false });
      return;
    }

    try {
      await apiRequest('teacher', '/api/teacher/content', {
        type: contentType,
        title: contentTitle,
        url: fileUrl,
        courseId: contentCourseId || null,
        grade: contentGrade,
        isFree: contentIsFree,
      });
      setContentMsg({ text: 'تم نشر المحتوى بنجاح!', ok: true });
      setContentTitle('');
      setContentLink('');
      setContentFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await onRefresh();
    } catch (err: any) {
      setContentMsg({ text: err.message || 'تعذر نشر المحتوى', ok: false });
    }
  };

  const handleDeleteContent = async (id: string) => {
    try {
      await apiRequest('teacher', `/api/teacher/content?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف المحتوى');
    }
  };

  const handleAddQuestion = () => {
    setExamItems([
      ...examItems,
      {
        kind: 'mcq',
        q: '',
        options: ['', '', '', ''],
        answer: 'أ',
        model: '',
      },
    ]);
  };

  const handleUpdateQuestion = (index: number, updated: Partial<QuestionItem>) => {
    const next = [...examItems];
    next[index] = { ...next[index], ...updated };
    setExamItems(next);
  };

  const handleRemoveQuestion = (index: number) => {
    if (examItems.length <= 1) return;
    setExamItems(examItems.filter((_, i) => i !== index));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/exam', {
        title: examTitle,
        courseId: examCourseId || null,
        grade: examGrade,
        questions: examItems,
      });
      setExamMsg({ text: 'تم إنشاء الامتحان بنجاح!', ok: true });
      setExamTitle('');
      setExamItems([
        {
          kind: 'mcq',
          q: '',
          options: ['', '', '', ''],
          answer: 'أ',
          model: '',
        },
      ]);
      await onRefresh();
    } catch (err: any) {
      setExamMsg({ text: err.message || 'تعذر إنشاء الامتحان', ok: false });
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await apiRequest('teacher', `/api/teacher/exam?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الامتحان');
    }
  };

  const handleGradeExam = async (resultId: string, total: number) => {
    const scoreVal = gradingScores[resultId];
    if (scoreVal === undefined || scoreVal === '') return;
    const scoreNum = Number(scoreVal);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > total) {
      alert(`الدرجة يجب أن تكون بين 0 و ${total}`);
      return;
    }
    try {
      await apiRequest('teacher', '/api/teacher/grade', {
        resultId,
        score: scoreNum,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حفظ الدرجة');
    }
  };

  const handleReplyMessage = async (messageId: string) => {
    const replyText = messageReplies[messageId];
    if (!replyText || !replyText.trim()) return;
    try {
      await apiRequest('teacher', '/api/teacher/message/reply', {
        messageId,
        reply: replyText.trim(),
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال الرد');
    }
  };

  const handleReviewAppeal = async (appealId: string) => {
    const scoreVal = appealScores[appealId];
    try {
      await apiRequest('teacher', '/api/teacher/appeal/review', {
        appealId,
        score: scoreVal !== undefined && scoreVal !== '' ? Number(scoreVal) : undefined,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر إنهاء مراجعة التظلم');
    }
  };

  const handleStudentAction = async (id: string, action: string) => {
    let password;
    if (action === 'setpass') {
      password = prompt('أدخل كلمة السر الجديدة للطالب:');
      if (!password) return;
    } else if (action === 'delete') {
      if (!window.confirm('هل أنت متأكد من حذف حساب هذا الطالب كاملاً؟')) return;
    }
    try {
      await apiRequest('teacher', '/api/teacher/student', {
        id,
        action,
        days: 30,
        password,
      });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'حدث خطأ');
    }
  };

  const handleParentBlock = async (id: string) => {
    try {
      await apiRequest('teacher', '/api/teacher/parent', { id });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تغيير حالة ولي الأمر');
    }
  };

  const LETTERS = ['أ', 'ب', 'ج', 'د'];

  // Unauthenticated teacher screen
  if (!teacherData) {
    return (
      <div className="card p-6 sm:p-8 max-w-md mx-auto text-right bg-[#0f1b2d] border border-blue-500/20 shadow-2xl">
        <div className="flex items-center gap-2 mb-4 justify-center text-amber-400">
          <Shield className="w-8 h-8" />
          <h2 className="text-xl font-black text-white">لوحة تحكم المعلم والإدارة</h2>
        </div>
        <p className="text-xs text-slate-300 mb-6 text-center leading-relaxed">
          أدخل كود المعلم السري للوصول المباشر إلى إدارة الكورسات، الامتحانات، الطلاب، وطرق السداد.
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">كود دخول الأدمن</label>
            <input
              type="password"
              required
              className="input-field text-center font-mono text-lg"
              placeholder="••••••••"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="btn-gold w-full py-3 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{authLoading ? 'جاري التحقق...' : 'دخول لوحة التحكّم'}</span>
            <ArrowRight className="w-4 h-4 rotate-180" />
          </button>

          {authError && (
            <p className="text-xs font-bold text-red-400 bg-red-950/60 p-2.5 rounded-xl text-center border border-red-500/30">
              {authError}
            </p>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-blue-500/15 text-center">
          <button
            onClick={onBackToStudent}
            className="text-xs text-slate-400 hover:text-cyan-300 font-bold transition-colors cursor-pointer"
          >
            العودة لواجهة الطالب الرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Filter students
  const filteredStudents = teacherData.students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.phone.includes(q) ||
      s.code.toLowerCase().includes(q) ||
      s.parentName?.toLowerCase().includes(q) ||
      s.parentPhone?.includes(q)
    );
  });

  const filteredParents = teacherData.parents.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q);
  });

  const pendingGradingCount = teacherData.results.filter((r) => r.status !== 'graded').length;
  const pendingRechargesCount = (teacherData.walletRechargeRequests || []).filter((r) => r.status === 'pending').length;
  const pendingPackageOrdersCount = (teacherData.packageOrders || []).filter((o) => o.status === 'pending').length;

  return (
    <div className="rounded-b-[1.5rem] bg-[#0c1626] border border-t-0 border-blue-500/20 p-5 sm:p-8 space-y-6 shadow-2xl text-right">
      {/* Top Banner */}
      <section
        className="panel border border-blue-500/25 p-6 shadow-2xl relative overflow-hidden rounded-2xl"
        style={{
          background: 'linear-gradient(145deg, #0f1c34 0%, #0a1324 100%)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-blue-500/15">
          <div className="flex flex-wrap items-center gap-2">
            <span className="badge-pill bg-amber-950/40 text-amber-400 border-amber-500/30">
              <Shield className="w-3.5 h-3.5" />
              <span>المدير العام للمنظومة (Super Admin)</span>
            </span>
            <span className="badge-pill bg-blue-950/40 text-blue-300 border-blue-500/30">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span>23 أقسام مسموحة</span>
            </span>
            <span className="badge-pill bg-emerald-950/40 text-emerald-400 border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>متصل بالخادم السحابي</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToStudent}
              className="btn-gray btn-sm text-xs cursor-pointer"
            >
              <span>مساحة الطالب</span>
            </button>
            <button
              onClick={onLogout}
              className="btn-red btn-sm flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
          </div>
        </div>

        <div className="mt-2">
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span>إدارة المنظومة التعليمية ونظام المحتوى الشامل</span>
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed max-w-3xl">
            تحكم كامل في نشر وحجب الكورسات، الفيديوهات، الامتحانات التفاعلية، إدارة الطلاب وأولياء الأمور،
            توليد الأكواد وتتبع طلبات التعديل والاشتراكات.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Users className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold">الطلاب المسجلون</h3>
            </div>
            <p className="text-2xl font-black text-white">{teacherData.students.length}</p>
          </div>

          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <UserCheck className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold">أولياء الأمور</h3>
            </div>
            <p className="text-2xl font-black text-white">{teacherData.parents.length}</p>
          </div>

          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <Wallet className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold">طلبات شحن المحفظة</h3>
            </div>
            <p className="text-2xl font-black text-emerald-400">{pendingRechargesCount} معلقة</p>
          </div>

          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <div className="flex items-center gap-2 text-slate-400 mb-1">
              <CreditCard className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold">طلبات باقات الأوف لاين</h3>
            </div>
            <p className="text-2xl font-black text-purple-400">{pendingPackageOrdersCount} معلقة</p>
          </div>
        </div>
      </section>

      {/* Main Tabs Navigation */}
      <div className="border-b border-blue-500/20 pb-2">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            { id: 'overview', label: '📊 نظرة عامة والإحصائيات', desc: 'المؤشرات والروابط والتنبيهات' },
            { id: 'financials', label: '💳 الماليات والشحن والطلبات', desc: 'طرق الدفع، الإيصالات، والحجوزات' },
            { id: 'content', label: '📚 المحتوى والكورسات والامتحانات', desc: 'الكورسات، الوسائط، والتصحيح' },
            { id: 'students', label: '👥 إدارة الطلاب والاشتراكات', desc: 'الحسابات، الأكواد، والتقارير' },
            { id: 'settings', label: '⚙️ مصمم المنصة والإعدادات', desc: 'الشعار، الألوان، والقنوات' },
          ].map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`py-3 px-4 rounded-xl text-right transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg border border-cyan-400/40'
                    : 'bg-[#111f36] text-slate-300 hover:text-white hover:bg-[#162744] border border-blue-500/15'
                }`}
              >
                <p className="font-black text-xs sm:text-sm">{tab.label}</p>
                <p className={`text-[10px] mt-0.5 ${isActive ? 'text-cyan-200' : 'text-slate-400'}`}>
                  {tab.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW & STATS */}
      {activeMainTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Notices & Announcements Form & List */}
            <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
                <Bell className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-lg text-white">نشر إعلان أو موعد درس</h3>
              </div>
              <form onSubmit={handleCreateNotice} className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">النوع</label>
                  <select
                    className="input-field"
                    value={nKind}
                    onChange={(e) => setNKind(e.target.value as any)}
                  >
                    <option value="announcement">إعلان عام</option>
                    <option value="schedule">موعد درس</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الصف المستهدف</label>
                  <select
                    className="input-field"
                    value={nGrade}
                    onChange={(e) => setNGrade(e.target.value)}
                  >
                    {ALL_GRADES.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-300 mb-1">نص الإعلان</label>
                  <textarea
                    rows={2}
                    required
                    className="input-field text-xs"
                    value={nText}
                    onChange={(e) => setNText(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-primary sm:col-span-2 py-2 font-bold text-xs cursor-pointer">
                  نشر الإعلان
                </button>
                {nMsg && (
                  <p
                    className={`sm:col-span-2 text-xs font-bold ${
                      nMsg.ok ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {nMsg.text}
                  </p>
                )}
              </form>

              <div className="mt-4 grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {teacherData.notices.map((n) => (
                  <div key={n.id} className="card bg-[#111f36] p-2.5 flex justify-between items-center text-xs border border-blue-500/15">
                    <div>
                      <span className="font-bold text-cyan-300">
                        [{n.kind === 'schedule' ? 'موعد درس' : 'إعلان'}] - {n.grade}:
                      </span>
                      <p className="mt-1 text-slate-200">{n.text}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteNotice(n.id)}
                      className="btn-red btn-sm text-[10px] cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Platform Overview Info */}
            <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-lg text-white">حالة المنظومة والمهام المعلقة</h3>
              </div>
              <div className="space-y-3 text-xs text-slate-300">
                <div className="p-3 bg-[#111f36] rounded-xl border border-blue-500/15 flex justify-between items-center">
                  <span>إجابات الطلاب بانتظار التصحيح</span>
                  <span className="font-extrabold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-500/30">
                    {pendingGradingCount} إجابة
                  </span>
                </div>
                <div className="p-3 bg-[#111f36] rounded-xl border border-blue-500/15 flex justify-between items-center">
                  <span>طلبات شحن رصيد المحفظة المعلقة</span>
                  <span className="font-extrabold text-emerald-400 bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    {pendingRechargesCount} طلب
                  </span>
                </div>
                <div className="p-3 bg-[#111f36] rounded-xl border border-blue-500/15 flex justify-between items-center">
                  <span>طلبات اشتراكات باقات الأوف لاين</span>
                  <span className="font-extrabold text-purple-400 bg-purple-950/60 px-2.5 py-1 rounded-lg border border-purple-500/30">
                    {pendingPackageOrdersCount} طلب
                  </span>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCIALS */}
      {activeMainTab === 'financials' && (
        <div className="space-y-6">
          {/* Wallet Recharge Requests Review */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-blue-500/15">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-extrabold text-lg text-white">طلبات مراجعة شحن المحفظة ({pendingRechargesCount})</h3>
              </div>
              <div className="flex items-center gap-1 text-xs">
                {(['pending', 'all', 'approved', 'rejected'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRechargesFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer ${
                      rechargesFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-[#111f36] text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter === 'pending'
                      ? 'المعلقة'
                      : filter === 'all'
                      ? 'الكل'
                      : filter === 'approved'
                      ? 'المقبولة'
                      : 'المرفوضة'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {(teacherData.walletRechargeRequests || []).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد طلبات شحن محفظة حالياً.</p>
              ) : (
                (teacherData.walletRechargeRequests || [])
                  .filter((req) => {
                    if (rechargesFilter === 'pending') return req.status === 'pending';
                    if (rechargesFilter === 'approved') return req.status === 'approved';
                    if (rechargesFilter === 'rejected') return req.status === 'rejected';
                    return true;
                  })
                  .map((req) => (
                    <div
                      key={req.id}
                      className="card bg-[#111f36] border border-blue-500/20 p-3 text-xs flex flex-wrap justify-between items-center gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{req.studentName}</span>
                          <span
                            className={`badge-pill text-[10px] ${
                              req.status === 'approved'
                                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                                : req.status === 'rejected'
                                ? 'bg-red-950/60 text-red-300 border-red-500/30'
                                : 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            }`}
                          >
                            {req.status === 'approved'
                              ? 'تم القبول والتمويل'
                              : req.status === 'rejected'
                              ? 'مرفوض'
                              : 'قيد المراجعة'}
                          </span>
                        </div>
                        <p className="text-slate-400 mt-1">
                          المبلغ المطلوب: <b className="text-emerald-400">{req.amount} ج.م</b> •{' '}
                          {new Date(req.created).toLocaleDateString('ar-EG')}
                        </p>
                        {req.notes && <p className="text-slate-300 mt-0.5">ملاحظات الطالب: {req.notes}</p>}
                      </div>

                      <div className="flex items-center gap-2">
                        {req.receiptUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(req.receiptUrl!)}
                            className="btn-gray btn-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>معاينة الإيصال</span>
                          </button>
                        )}

                        {req.status === 'pending' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleReviewRecharge(req.id, 'approve')}
                              disabled={reviewLoading}
                              className="btn-green btn-sm font-bold cursor-pointer"
                            >
                              تأكيد وشحن {req.amount} ج.م
                            </button>
                            <button
                              type="button"
                              onClick={() => setRejectionModalTxId(req.id)}
                              disabled={reviewLoading}
                              className="btn-red btn-sm font-bold cursor-pointer"
                            >
                              رفض الطلب
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </section>

          {/* Offline Package Orders Review */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <CreditCard className="w-5 h-5 text-purple-400" />
              <h3 className="font-extrabold text-lg text-white">طلبات باقات الأوف لاين والمستحقات ({pendingPackageOrdersCount})</h3>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {(teacherData.packageOrders || []).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد طلبات باقات حالياً.</p>
              ) : (
                (teacherData.packageOrders || []).map((ord) => (
                  <div
                    key={ord.id}
                    className="card bg-[#111f36] border border-blue-500/20 p-3 text-xs flex flex-wrap justify-between items-center gap-3"
                  >
                    <div>
                      <span className="font-bold text-white">{ord.studentName}</span>
                      <span className="text-purple-300 font-bold mr-2">[{ord.packageTitle}]</span>
                      <p className="text-slate-400 mt-1">
                        طريقة السداد: <b>{ord.paymentMethod === 'wallet' ? 'محفظة' : ord.paymentMethod === 'debt' ? 'مديونية' : 'إيصال تحويل'}</b> • السعر: {ord.price} ج.م
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {ord.receiptUrl && (
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptUrl(ord.receiptUrl!)}
                          className="btn-gray btn-sm text-[10px] cursor-pointer"
                        >
                          الإيصال
                        </button>
                      )}
                      {ord.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleReviewPackageOrder(ord.id, 'approve')}
                            className="btn-green btn-sm text-[10px] cursor-pointer"
                          >
                            موافقة وتفعيل
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewPackageOrder(ord.id, 'reject')}
                            className="btn-red btn-sm text-[10px] cursor-pointer"
                          >
                            رفض
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Payment Gateways Manager */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <h3 className="font-extrabold text-lg text-white">طرق الدفع بوسياسات التحويل المباشر</h3>
              </div>
            </div>

            <form onSubmit={handleSaveGateway} className="space-y-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم الطريقة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محفظة فودافون كاش الرسمية"
                    className="input-field text-xs"
                    value={gwTitle}
                    onChange={(e) => setGwTitle(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">رقم الحساب / المحفظة</label>
                  <input
                    type="text"
                    required
                    dir="ltr"
                    placeholder="01000000000"
                    className="input-field text-xs"
                    value={gwAccountNumber}
                    onChange={(e) => setGwAccountNumber(e.target.value)}
                  />
                </div>
              </div>

              <button type="submit" disabled={gwLoading} className="btn-cyan w-full py-2.5 font-bold cursor-pointer">
                {gwLoading ? 'جاري الحفظ...' : 'حفظ طريقة الدفع'}
              </button>

              {gwMsg && (
                <p className={`text-xs font-bold p-2 rounded-xl text-center ${gwMsg.ok ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                  {gwMsg.text}
                </p>
              )}
            </form>

            <div className="mt-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">الطرق المتاحة للطالب:</h4>
              {(teacherData.paymentGateways || []).map((gw) => (
                <div key={gw.id} className="p-2.5 rounded-xl bg-[#111f36] border border-blue-500/15 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-white">{gw.title}</span> - <span dir="ltr" className="font-mono text-cyan-300">{gw.accountNumber}</span>
                  </div>
                  <button onClick={() => handleDeleteGateway(gw.id)} className="btn-red btn-sm text-[10px] cursor-pointer">حذف</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: CONTENT & EXAMS */}
      {activeMainTab === 'content' && (
        <div className="space-y-6">
          {/* Publish Course */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <PlusCircle className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">نشر كورس جديد</h3>
            </div>
            <form onSubmit={handleCreateCourse} className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم الكورس</label>
                <input required className="input-field" value={cTitle} onChange={(e) => setCTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الصف الدراسي</label>
                <select className="input-field" value={cGrade} onChange={(e) => setCGrade(e.target.value)}>
                  {ALL_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">السعر بالجنيه</label>
                <input type="number" min="0" required className="input-field" value={cPrice} onChange={(e) => setCPrice(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المدة بالأيام</label>
                <input type="number" min="1" required className="input-field" value={cDays} onChange={(e) => setCDays(Number(e.target.value))} />
              </div>
              <button type="submit" className="btn-gold sm:col-span-2 py-2.5 font-bold cursor-pointer">نشر الكورس</button>
            </form>

            <div className="mt-4 border-t border-blue-500/15 pt-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">الكورسات الحالية:</h4>
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {teacherData.courses.map((c) => (
                  <div key={c.id} className="card bg-[#111f36] p-2.5 text-xs flex justify-between items-center border border-blue-500/15">
                    <div>
                      <p className="font-bold text-white">{c.title}</p>
                      <p className="text-slate-400">{c.grade} • {c.price} ج • {c.days} يوم</p>
                    </div>
                    {c.status === 'published' && (
                      <button onClick={() => handleArchiveCourse(c.id)} className="btn-red btn-sm text-[10px] cursor-pointer">إيقاف</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Upload Video / Note / Homework */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <Upload className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg text-white">نشر فيديو أو مذكرة أو واجب</h3>
            </div>
            <form onSubmit={handlePublishContent} className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان المحتوى</label>
                <input required className="input-field" value={contentTitle} onChange={(e) => setContentTitle(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نوع المحتوى</label>
                <select className="input-field" value={contentType} onChange={(e) => setContentType(e.target.value as any)}>
                  <option value="video">فيديو</option>
                  <option value="note">مذكرة / ملف</option>
                  <option value="homework">واجب</option>
                  <option value="image">صورة</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط خارجي (YouTube أو مباشر)</label>
                <input type="url" dir="ltr" className="input-field" value={contentLink} onChange={(e) => setContentLink(e.target.value)} />
              </div>
              <button type="submit" className="btn-primary md:col-span-2 py-2.5 font-bold cursor-pointer">نشر المحتوى</button>
            </form>
          </section>

          {/* Electronic Exam Builder */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <GraduationCap className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">إنشاء امتحان إلكتروني</h3>
            </div>
            <form onSubmit={handleCreateExam} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">عنوان الامتحان</label>
                  <input required className="input-field" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الصف المستهدف</label>
                  <select className="input-field" value={examGrade} onChange={(e) => setExamGrade(e.target.value)}>
                    {ALL_GRADES.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="btn-gold w-full py-2.5 font-bold cursor-pointer">نشر الامتحان</button>
            </form>
          </section>
        </div>
      )}

      {/* TAB 4: STUDENTS & REPORTS */}
      {activeMainTab === 'students' && (
        <div className="space-y-6">
          {/* Activation Codes */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-blue-500/15">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg text-white">أكواد التفعيل (الدفع والاشتراكات)</h3>
            </div>
            <form onSubmit={handleGenerateCodes} className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عدد الأكواد</label>
                <input type="number" min="1" max="100" className="input-field" value={codeCount} onChange={(e) => setCodeCount(Number(e.target.value))} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المدة بالأيام</label>
                <input type="number" min="1" className="input-field" value={codeDays} onChange={(e) => setCodeDays(Number(e.target.value))} />
              </div>
              <button type="submit" className="btn-gold self-end py-2.5 font-bold cursor-pointer">توليد الأكواد</button>
            </form>
          </section>

          {/* Students & Parents Accounts */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-blue-500/15">
              <h3 className="font-extrabold text-lg text-white">إدارة الطلاب وأولياء الأمور</h3>
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <input className="input-field pr-9 text-xs" placeholder="بحث بالاسم أو الكود أو رقم الهاتف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 max-h-[500px] overflow-y-auto">
              {filteredStudents.map((s) => (
                <div key={s.id} className="card bg-[#111f36] border border-blue-500/20 p-3 text-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{s.name}</h4>
                      <p className="text-slate-400 mt-0.5">{s.grade} • كود: <span dir="ltr">{s.code}</span></p>
                    </div>
                    <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${s.status === 'blocked' ? 'bg-red-950 text-red-300' : 'bg-emerald-950 text-emerald-300'}`}>
                      {s.status === 'blocked' ? 'محجوب' : 'نشط'}
                    </span>
                  </div>

                  <div className="mt-2 text-slate-300 bg-[#0a1322] p-2 rounded border border-blue-500/10 space-y-0.5">
                    <p>هاتف الطالب: <span dir="ltr">{s.phone}</span></p>
                    <p>ولي الأمر: {s.parentName || 'غير مسجل'}</p>
                    <p>الرصيد بالمحفظة: <b className="text-emerald-400">{s.walletBalance || 0} ج.م</b></p>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    <button type="button" onClick={() => setReportStudent(s)} className="btn-gold btn-sm text-[10px] font-bold cursor-pointer">📊 تقرير الطالب</button>
                    <button type="button" onClick={() => setAdjustModalStudent(s)} className="btn-cyan btn-sm text-[10px] font-bold cursor-pointer">💳 شحن/تعديل الرصيد</button>
                    <button type="button" onClick={() => handleStudentAction(s.id, 'block')} className={`btn-sm text-[10px] cursor-pointer ${s.status === 'blocked' ? 'btn-green' : 'btn-red'}`}>
                      {s.status === 'blocked' ? 'فك الحجب' : 'حجب'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 5: SETTINGS & DESIGN */}
      {activeMainTab === 'settings' && (
        <div className="space-y-6">
          {/* Settings Form */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">إعدادات المنصة وصورة الغلاف</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنصة</label>
                <input className="input-field" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">صورة المنصة الرسمية (المعروضة بالمنتصف)</label>
                <input ref={heroInputRef} type="file" accept="image/*" className="input-field text-xs cursor-pointer" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة مرور الأدمن الجديدة</label>
                <input type="password" className="input-field" placeholder="اتركها فارغة إن لم ترغب في التغيير" value={settingsPw} onChange={(e) => setSettingsPw(e.target.value)} />
              </div>

              <button type="submit" className="btn-gold w-full py-2.5 font-bold cursor-pointer">حفظ الإعدادات وصورة المنصة</button>

              {settingsMsg && (
                <p className={`text-xs font-bold p-2 rounded-xl text-center ${settingsMsg.ok ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                  {settingsMsg.text}
                </p>
              )}
            </form>
          </section>

          {/* Social Links Manager */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center justify-between gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
                <h3 className="font-extrabold text-lg text-white">أزرار وصفحات التواصل الاجتماعي</h3>
              </div>
              <span className="badge-pill bg-blue-950/40 text-blue-300 border-blue-500/30 text-[11px]">
                تظهر بأسفل الصفحة
              </span>
            </div>

            <form onSubmit={handleSaveSocial} className="space-y-2.5 p-3 rounded-xl bg-[#0a1322] border border-blue-500/20 mb-4">
              <h4 className="text-xs font-extrabold text-cyan-300">إضافة زر تواصل جديد</h4>
              <div className="grid gap-2 sm:grid-cols-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">المنصة</label>
                  <select
                    className="input-field text-xs py-1.5"
                    value={socialPlatform}
                    onChange={(e) => {
                      setSocialPlatform(e.target.value);
                      if (!socialTitle) setSocialTitle(e.target.value);
                    }}
                  >
                    <option value="whatsapp">واتساب (WhatsApp)</option>
                    <option value="facebook">فيسبوك (Facebook)</option>
                    <option value="instagram">انستجرام (Instagram)</option>
                    <option value="telegram">تيليجرام (Telegram)</option>
                    <option value="youtube">يوتيوب (YouTube)</option>
                    <option value="tiktok">تيك توك (TikTok)</option>
                    <option value="x">إكس / تويتر (X / Twitter)</option>
                    <option value="linkedin">لينكد إن (LinkedIn)</option>
                    <option value="custom">موقع أو رابط آخر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">الاسم أو العنوان</label>
                  <input
                    type="text"
                    placeholder="مثال: قناة التيليجرام"
                    className="input-field text-xs py-1.5"
                    value={socialTitle}
                    onChange={(e) => setSocialTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 mb-1">الرابط المباشر (URL)</label>
                <input
                  type="url"
                  required
                  dir="ltr"
                  placeholder="https://..."
                  className="input-field text-xs py-1.5"
                  value={socialUrl}
                  onChange={(e) => setSocialUrl(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={socialLoading || !socialUrl.trim()}
                className="btn-cyan w-full py-2 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{socialLoading ? 'جاري الحفظ...' : 'إضافة زر التواصل'}</span>
              </button>

              {socialMsg && (
                <p className={`text-[11px] font-bold p-1.5 rounded-lg text-center ${socialMsg.ok ? 'text-emerald-300 bg-emerald-950/50' : 'text-red-300 bg-red-950/50'}`}>
                  {socialMsg.text}
                </p>
              )}
            </form>

            <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
              <h4 className="text-xs font-extrabold text-slate-300">الأزرار الحالية ({teacherData.socialLinks?.length || 0}):</h4>
              {(teacherData.socialLinks || []).length === 0 ? (
                <p className="text-xs text-slate-400">لا توجد أزرار تواصل مضافة حالياً.</p>
              ) : (
                (teacherData.socialLinks || []).map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0a1424] border border-blue-500/20 text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                      <div className="truncate">
                        <p className="font-bold text-white truncate">{s.title || s.platform}</p>
                        <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-cyan-400 hover:underline truncate block">
                          {s.url}
                        </a>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleSocial(s.id)}
                        className={`text-[10px] px-2 py-1 rounded-lg font-bold border transition-colors ${
                          s.active !== false ? 'bg-emerald-950/50 text-emerald-300 border-emerald-500/30' : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {s.active !== false ? 'مفعل' : 'معطل'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSocial(s.id)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {/* RECEIPT PREVIEW MODAL */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f1b2d] border border-blue-500/30 rounded-2xl p-4 max-w-2xl w-full space-y-3 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <h3 className="font-black text-sm text-white">معاينة إيصال التحويل</h3>
              <button onClick={() => setPreviewReceiptUrl(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>
            <div className="max-h-[70vh] overflow-auto flex justify-center bg-[#0a1322] p-2 rounded-xl border border-blue-500/10">
              <img src={previewReceiptUrl} alt="إيصال التحويل" className="max-w-full h-auto rounded-lg" />
            </div>
            <div className="text-left">
              <button onClick={() => setPreviewReceiptUrl(null)} className="btn-gray btn-sm font-bold">إغلاق</button>
            </div>
          </div>
        </div>
      )}

      {/* ADJUST BALANCE MODAL */}
      {adjustModalStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f1b2d] border border-blue-500/30 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <h3 className="font-black text-base text-white">تعديل رصيد محفظة: {adjustModalStudent.name}</h3>
              <button onClick={() => setAdjustModalStudent(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <p className="text-xs text-slate-300">
              الرصيد الحالي: <b className="text-emerald-400">{adjustModalStudent.walletBalance || 0} ج.م</b>
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المبلغ (اكتب + للزيادة أو - للخصم)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="مثال: 150 أو -50"
                  className="input-field text-xs"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">السبب / الملاحظة</label>
                <input
                  type="text"
                  placeholder="مثال: مكافأة تفوق أو شحن نقدي بالسنتر"
                  className="input-field text-xs"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={adjustLoading} className="btn-emerald flex-1 py-2 font-bold text-xs cursor-pointer">
                  {adjustLoading ? 'جاري الحفظ...' : 'تأكيد التعديل'}
                </button>
                <button type="button" onClick={() => setAdjustModalStudent(null)} className="btn-gray font-bold text-xs px-4">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPORT & EXPORT MODAL */}
      {reportStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#0f1b2d] border border-blue-500/30 rounded-2xl p-6 max-w-xl w-full space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <h3 className="font-black text-lg text-white">تقرير متابعة الطالب: {reportStudent.name}</h3>
              <button
                onClick={() => setReportStudent(null)}
                className="text-slate-400 hover:text-white font-bold text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300 bg-[#111f36] p-4 rounded-xl border border-blue-500/15">
              <p><b>الصف الدراسي:</b> {reportStudent.grade}</p>
              <p><b>رقم هاتف الطالب:</b> <span dir="ltr">{reportStudent.phone}</span></p>
              <p><b>اسم ولي الأمر:</b> {reportStudent.parentName || 'غير مسجل'}</p>
              <p><b>هاتف ولي الأمر:</b> <span dir="ltr">{reportStudent.parentPhone || 'غير مسجل'}</span></p>
              <p><b>رصيد المحفظة:</b> <b className="text-emerald-400">{reportStudent.walletBalance || 0} ج.م</b></p>
              <p><b>حالة الاشتراك:</b> {reportStudent.subEnd && new Date(reportStudent.subEnd) > new Date() ? 'مفعّل' : 'غير مفعّل'}</p>
            </div>

            {!reportStudent.parentPhone || !reportStudent.parentPhone.trim() ? (
              <div className="rounded-xl bg-amber-950/60 border border-amber-500/50 p-3.5 text-xs font-bold text-amber-300 leading-relaxed">
                ⚠️ لا يوجد رقم ولي أمر مسجل عبر بوابة المتابعة لهذا الطالب، استخدم الواتساب أو الـ PDF.
              </div>
            ) : null}

            <div className="pt-2 flex flex-wrap gap-2.5 justify-end">
              <button
                type="button"
                onClick={() => {
                  const phone = reportStudent.parentPhone || reportStudent.phone;
                  const text = `تقرير متابعة الطالب: ${reportStudent.name}\nالصف: ${reportStudent.grade}\nالاشتراك: ${reportStudent.subEnd && new Date(reportStudent.subEnd) > new Date() ? 'مفعّل' : 'غير مفعّل'}\nالمنصة التعليمية الشاملة`;
                  window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="btn-primary btn-sm flex items-center gap-1.5 font-bold py-2.5 px-4 text-xs cursor-pointer"
              >
                <span>إرسال نص واتساب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="btn-gold btn-sm flex items-center gap-1.5 font-bold py-2.5 px-4 text-xs cursor-pointer"
              >
                <span>توليد PDF للتقرير</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const text = `تقرير متابعة الطالب: ${reportStudent.name} (${reportStudent.grade})`;
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="btn-cyan btn-sm flex items-center gap-1.5 font-bold py-2.5 px-4 text-xs cursor-pointer"
              >
                <span>إرسال عبر تليجرام</span>
              </button>

              <button
                type="button"
                onClick={() => setReportStudent(null)}
                className="btn-gray btn-sm font-bold py-2.5 px-4 text-xs cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
