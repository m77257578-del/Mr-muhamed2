import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
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
  Bot,
  Video,
  Printer
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
  const [cImageFile, setCImageFile] = useState<File | null>(null);
  const [cImageUrl, setCImageUrl] = useState('');
  const [cImagePreview, setCImagePreview] = useState('');
  const [cLoading, setCLoading] = useState(false);
  const [cMsg, setCMsg] = useState<{ text: string; ok: boolean } | null>(null);

  // Platform Design & Colors Customizer
  const [primaryColor, setPrimaryColor] = useState(teacherData?.primaryColor || '#0284c7');
  const [headingColor, setHeadingColor] = useState(teacherData?.headingColor || '#ffffff');
  const [textColor, setTextColor] = useState(teacherData?.textColor || '#cbd5e1');
  const [panelBg, setPanelBg] = useState(teacherData?.panelBg || '#0d1728');
  const [cardBg, setCardBg] = useState(teacherData?.cardBg || '#111f36');
  const [accentGold, setAccentGold] = useState(teacherData?.accentGold || '#f59e0b');
  const [fontFamily, setFontFamily] = useState(teacherData?.fontFamily || "'Cairo', sans-serif");
  const [bgPattern, setBgPattern] = useState(teacherData?.bgPattern || 'gradient');
  const [subtitle, setSubtitle] = useState(teacherData?.subtitle || '');
  const [designMsg, setDesignMsg] = useState<{ text: string; ok: boolean } | null>(null);

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

  // Coupon generator
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountType, setCouponDiscountType] = useState<'percentage' | 'fixed' | 'free_course'>('percentage');
  const [couponDiscountValue, setCouponDiscountValue] = useState(20);
  const [couponCourseId, setCouponCourseId] = useState('');
  const [couponMaxUses, setCouponMaxUses] = useState(50);
  const [couponMsg, setCouponMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Content publisher
  const [contentFile, setContentFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<'video' | 'image' | 'note' | 'homework'>('note');
  const [contentTitle, setContentTitle] = useState('');
  const [contentLink, setContentLink] = useState('');
  const [contentCourseId, setContentCourseId] = useState('');
  const [contentGrade, setContentGrade] = useState<string>('كل الصفوف');
  const [contentIsFree, setContentIsFree] = useState(false);
  const [contentLecture, setContentLecture] = useState('');
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
    'overview' | 'financials' | 'content' | 'bundles' | 'students' | 'meet' | 'settings' | 'supervisors'
  >('overview');

  // Google Meet & Live Attendance State
  const [meetTitle, setMeetTitle] = useState('');
  const [meetUrl, setMeetUrl] = useState('');
  const [meetGrade, setMeetGrade] = useState<string>('كل الصفوف');
  const [meetScheduledAt, setMeetScheduledAt] = useState('');
  const [meetStatus, setMeetStatus] = useState<'scheduled' | 'active' | 'ended'>('active');
  const [meetNotes, setMeetNotes] = useState('');
  const [meetLoading, setMeetLoading] = useState(false);
  const [meetMsg, setMeetMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>('all');
  const [attendanceSearchQuery, setAttendanceSearchQuery] = useState('');
  const [manualStudentId, setManualStudentId] = useState('');
  const [manualSessionId, setManualSessionId] = useState('');
  const [onlinePayKey, setOnlinePayKey] = useState((teacherData as any)?.onlinePayKey || '');
  const [cashierKey, setCashierKey] = useState((teacherData as any)?.cashierKey || '');

  // Supervisor Login & Management State
  const [loginMode, setLoginMode] = useState<'admin' | 'supervisor'>('admin');
  const [supLoginPhone, setSupLoginPhone] = useState('');
  const [supLoginPassword, setSupLoginPassword] = useState('');

  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supPassword, setSupPassword] = useState('');
  const [supPermissions, setSupPermissions] = useState({
    courses: true,
    students: true,
    exams: true,
    coupons: true,
    financials: true,
    notices: true
  });
  const [supEditId, setSupEditId] = useState<string | null>(null);
  const [supMsg, setSupMsg] = useState<{ text: string; ok: boolean } | null>(null);

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
      const payload = loginMode === 'admin' ? { code } : { phone: supLoginPhone, password: supLoginPassword };
      const res = await apiRequest('public', '/api/teacher/login', payload);
      tokens.teacher = res.token;
      await onRefresh();
    } catch (err: any) {
      setAuthError(err.message || 'بيانات الدخول غير صحيحة');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSaveSupervisor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/supervisor', {
        id: supEditId || undefined,
        name: supName,
        phone: supPhone,
        password: supPassword,
        permissions: supPermissions
      });
      setSupMsg({ text: 'تم حفظ المشرف وصلاحياته بنجاح!', ok: true });
      setSupName('');
      setSupPhone('');
      setSupPassword('');
      setSupEditId(null);
      await onRefresh();
    } catch (err: any) {
      setSupMsg({ text: err.message || 'تعذر حفظ المشرف', ok: false });
    }
  };

  const handleDeleteSupervisor = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المشرف؟')) return;
    try {
      await apiRequest('teacher', `/api/teacher/supervisor?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر الحذف');
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
    setCLoading(true);
    try {
      let finalImageUrl = cImageUrl.trim();
      if (cImageFile) {
        try {
          const uRes = await uploadFile('/api/upload', cImageFile);
          finalImageUrl = (uRes as any).url || `/receipts/${uRes.fileId}`;
        } catch (err) {
          setCMsg({ text: 'فشل رفع صورة الكورس', ok: false });
          setCLoading(false);
          return;
        }
      }

      await apiRequest('teacher', '/api/teacher/course', {
        title: cTitle,
        grade: cGrade,
        price: cPrice,
        days: cDays,
        description: cDesc,
        isFree: cIsFree,
        imageUrl: finalImageUrl,
      });
      setCMsg({ text: 'تم نشر الكورس بنجاح مع الصورة المعتمدة!', ok: true });
      setCTitle('');
      setCDesc('');
      setCImageFile(null);
      setCImageUrl('');
      setCImagePreview('');
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setCMsg({ text: err.message || 'تعذر نشر الكورس', ok: false });
    } finally {
      setCLoading(false);
    }
  };

  const handleSaveDesign = async (e: React.FormEvent) => {
    e.preventDefault();
    setDesignMsg(null);
    try {
      await apiRequest('teacher', '/api/teacher/design-settings', {
        name: settingsName,
        subtitle,
        primaryColor,
        headingColor,
        textColor,
        panelBg,
        cardBg,
        accentGold,
        fontFamily,
        bgPattern,
        onlinePayKey,
        cashierKey,
      });
      setDesignMsg({ text: 'تم حفظ إعدادات الخطوط ومتغيرات CSS والتصميم بنجاح في قاعدة البيانات!', ok: true });
      await onRefresh();
      if (onUpdatePublic) await onUpdatePublic();
    } catch (err: any) {
      setDesignMsg({ text: err.message || 'تعذر حفظ تصميم المنصة', ok: false });
    }
  };

  const applyColorPreset = (preset: { primary: string; heading: string; text: string; pattern: string }) => {
    setPrimaryColor(preset.primary);
    setHeadingColor(preset.heading);
    setTextColor(preset.text);
    setBgPattern(preset.pattern);
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

  const handlePrintCodes = () => {
    if (generatedCodes.length === 0) return;
    const win = window.open('', '_blank');
    if (!win) return;
    const course = teacherData?.courses.find(c => c.id === codeCourseId);
    const title = course ? `أكواد كورس: ${course.title}` : 'أكواد تفعيل المنصة';
    
    win.document.write(`
      <html dir="rtl">
        <head>
          <title>طباعة الأكواد</title>
          <style>
            body { font-family: 'Cairo', sans-serif; padding: 20px; }
            h2 { text-align: center; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-align: center; }
            th { background-color: #f4f4f4; font-weight: bold; }
            .code { font-family: monospace; font-weight: bold; font-size: 1.2em; letter-spacing: 1px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p style="text-align: center; color: #666;">إجمالي الأكواد: ${generatedCodes.length} | الصلاحية: ${codeDays} يوم</p>
          <table>
            <thead>
              <tr>
                <th>م</th>
                <th>كود التفعيل</th>
                <th>توقيع الطالب</th>
              </tr>
            </thead>
            <tbody>
              ${generatedCodes.map((c, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td class="code">${c}</td>
                  <td>________________</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="no-print" style="margin-top: 30px; text-align: center;">
            <button onclick="window.print()" style="padding: 10px 20px; font-size: 16px; cursor: pointer; background: #0284c7; color: white; border: none; border-radius: 5px;">بدء الطباعة الآن</button>
          </div>
        </body>
      </html>
    `);
    win.document.close();
  };

  const handleDeleteCode = async (id: string) => {
    try {
      await apiRequest('teacher', `/api/teacher/code?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الكود');
    }
  };

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    setCouponLoading(true);
    try {
      await apiRequest('teacher', '/api/teacher/coupon', {
        code: couponCode.trim(),
        discountType: couponDiscountType,
        discountValue: couponDiscountValue,
        courseId: couponCourseId || undefined,
        maxUses: couponMaxUses
      });
      setCouponMsg({ text: 'تم إنشاء كوبون الخصم بنجاح!', ok: true });
      setCouponCode('');
      setCouponDiscountValue(20);
      await onRefresh();
    } catch (err: any) {
      setCouponMsg({ text: err.message || 'تعذر إنشاء الكوبون', ok: false });
    } finally {
      setCouponLoading(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الكوبون؟')) return;
    try {
      await apiRequest('teacher', `/api/teacher/coupon?id=${id}`, undefined, 'DELETE');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف الكوبون');
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
        lecture: contentLecture.trim(),
      });
      setContentMsg({ text: 'تم نشر المحتوى بنجاح!', ok: true });
      setContentTitle('');
      setContentLecture('');
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

  const handleCreateLiveSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetMsg(null);
    setMeetLoading(true);
    try {
      await apiRequest('teacher', '/api/teacher/live-session', {
        title: meetTitle,
        meetUrl,
        grade: meetGrade,
        scheduledAt: meetScheduledAt || new Date().toISOString(),
        status: meetStatus,
        notes: meetNotes,
      });
      setMeetMsg({ text: 'تم إنشاء ونشر البث المباشر (Google Meet) وتسجيله بنجاح!', ok: true });
      setMeetTitle('');
      setMeetUrl('');
      setMeetNotes('');
      await onRefresh();
    } catch (err: any) {
      setMeetMsg({ text: err.message || 'تعذر نشر حلقة البث المباشر', ok: false });
    } finally {
      setMeetLoading(false);
    }
  };

  const handleDeleteLiveSession = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف جلسة البث وسجلات حضورها؟')) return;
    try {
      await apiRequest('teacher', '/api/teacher/live-session/delete', { id });
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر حذف البث المباشر');
    }
  };

  const handleManualAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSessionId || !manualStudentId) {
      alert('اختر حلقة البث المباشر والطالب لتسجيل الحضور يدوياً');
      return;
    }
    try {
      await apiRequest('teacher', '/api/teacher/live-attendance/manual', {
        sessionId: manualSessionId,
        studentId: manualStudentId,
        status: 'حاضر يدوياً',
      });
      alert('تم تسجيل حضور الطالب يدوياً بنجاح!');
      setManualStudentId('');
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'تعذر تسجيل الحضور');
    }
  };

  const LETTERS = ['أ', 'ب', 'ج', 'د'];

  // Unauthenticated teacher screen
  if (!teacherData) {
    return (
      <div className="card p-6 sm:p-8 max-w-md mx-auto text-right bg-[#0f1b2d] border border-blue-500/20 shadow-2xl">
        <div className="flex items-center gap-2 mb-4 justify-center text-amber-400">
          <Shield className="w-8 h-8" />
          <h2 className="text-xl font-black text-white">لوحة تحكم المعلم والمشرفين</h2>
        </div>
        <p className="text-xs text-slate-300 mb-6 text-center leading-relaxed">
          سجل دخولك كمدير أو مشرف لإدارة الكورسات والطلاب والاختبارات.
        </p>

        <div className="flex gap-2 mb-4">
          <button
            type="button"
            onClick={() => setLoginMode('admin')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              loginMode === 'admin'
                ? 'bg-amber-600 text-white shadow-lg'
                : 'bg-[#111f36] text-slate-400 hover:text-white'
            }`}
          >
            دخول الأدمن (الرئيسي)
          </button>
          <button
            type="button"
            onClick={() => setLoginMode('supervisor')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              loginMode === 'supervisor'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-[#111f36] text-slate-400 hover:text-white'
            }`}
          >
            دخول مشرف (بالرقم والسر)
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {loginMode === 'admin' ? (
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
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  required
                  className="input-field text-center font-mono text-sm"
                  placeholder="010xxxxxxxx"
                  value={supLoginPhone}
                  onChange={(e) => setSupLoginPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة السر</label>
                <input
                  type="password"
                  required
                  className="input-field text-center font-mono text-sm"
                  placeholder="••••••••"
                  value={supLoginPassword}
                  onChange={(e) => setSupLoginPassword(e.target.value)}
                />
              </div>
            </>
          )}

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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-8 gap-2">
          {[
            { id: 'overview', label: '📊 نظرة عامة والإحصائيات', desc: 'المؤشرات والروابط والتنبيهات' },
            { id: 'financials', label: '💳 الماليات والشحن والطلبات', desc: 'طرق الدفع، الإيصالات، والحجوزات' },
            { id: 'content', label: '📚 المحتوى والكورسات والامتحانات', desc: 'الكورسات، الوسائط، والتصحيح' },
            { id: 'bundles', label: '📦 إدارة الباقات (Bundles)', desc: 'مجموعات الكورسات بخصم' },
            { id: 'students', label: '👥 إدارة الطلاب والاشتراكات', desc: 'الحسابات، الأكواد، والتقارير' },
            { id: 'meet', label: '🔴 البث المباشر وتسجيل الحضور (Meet)', desc: 'ربط Google Meet وتتبع الحضور آلياً' },
            { id: 'settings', label: '⚙️ مصمم المنصة والإعدادات', desc: 'الشعار، الألوان، والقنوات' },
            { id: 'supervisors', label: '🛡️ إدارة المشرفين والصلاحيات', desc: 'حسابات المشرفين وصلاحياتهم' },
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

      {/* TAB 2: BUNDLES MANAGEMENT */}
      {activeMainTab === 'bundles' && (
        <div className="space-y-6">
          <section className="panel border border-cyan-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <h3 className="font-extrabold text-lg text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-cyan-400" />
              إنشاء باقة كورسات جديدة
            </h3>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await apiRequest('teacher', '/api/teacher/bundles', {
                    title: (e.target as any).title.value,
                    courseIds: Array.from((e.target as any).courses.selectedOptions).map((o: any) => o.value),
                    discountedPrice: Number((e.target as any).price.value),
                  });
                  alert('تم إنشاء الباقة بنجاح!');
                  await onRefresh();
                } catch (e: any) {
                  alert(e.message || 'فشل إنشاء الباقة');
                }
              }}
              className="grid gap-3"
            >
              <input name="title" placeholder="اسم الباقة" className="input-field" required />
              <select name="courses" multiple className="input-field h-32" required>
                {teacherData.courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.title}</option>
                ))}
              </select>
              <input name="price" type="number" placeholder="السعر المخفض" className="input-field" required />
              <button type="submit" className="btn-primary py-2 cursor-pointer">إنشاء الباقة</button>
            </form>
          </section>
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <h3 className="font-extrabold text-lg text-white mb-4">الباقات الحالية</h3>
            <div className="grid gap-3">
              {(teacherData as any).bundles?.map((b: any) => (
                <div key={b.id} className="card bg-[#111f36] p-3 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-bold text-white">{b.title}</p>
                    <p className="text-slate-400">السعر: {b.discountedPrice} ج.م</p>
                  </div>
                  <button 
                    onClick={async () => {
                      if(!window.confirm('حذف الباقة؟')) return;
                      await apiRequest('teacher', `/api/teacher/bundles?id=${b.id}`, undefined, 'DELETE');
                      await onRefresh();
                    }}
                    className="btn-red btn-sm cursor-pointer"
                  >حذف</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* TAB 3: FINANCIALS */}
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
              <h3 className="font-extrabold text-lg text-white">نشر كورس جديد وإرفاق صورة الغلاف</h3>
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

              {/* Course Image Upload & Preview */}
              <div className="sm:col-span-2 p-3.5 rounded-xl bg-[#091222] border border-blue-500/20 space-y-2.5">
                <label className="block text-xs font-extrabold text-cyan-300">
                  صورة غلاف الكورس (اختيار ملف من جهازك أو رابط مباشر):
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">رفع ملف صورة من جهازك:</label>
                    <input
                      type="file"
                      accept="image/*"
                      className="input-field text-xs file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-2.5 file:py-1 file:cursor-pointer"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setCImageFile(f);
                          const reader = new FileReader();
                          reader.onload = () => setCImagePreview(String(reader.result));
                          reader.readAsDataURL(f);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">أو رابط صورة جاهز (URL):</label>
                    <input
                      type="url"
                      dir="ltr"
                      placeholder="https://..."
                      className="input-field text-xs"
                      value={cImageUrl}
                      onChange={(e) => {
                        setCImageUrl(e.target.value);
                        if (!cImageFile) setCImagePreview(e.target.value);
                      }}
                    />
                  </div>
                </div>

                {/* Live Preview */}
                {cImagePreview && (
                  <div className="flex items-center gap-3 pt-2">
                    <img src={cImagePreview} alt="معاينة" className="w-20 h-14 object-cover rounded-lg border border-cyan-400/50" />
                    <span className="text-[11px] text-emerald-400 font-bold">✅ تم تجهيز الصورة لنشرها مع الكورس</span>
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">وصف الكورس (اختياري)</label>
                <textarea
                  rows={2}
                  className="input-field text-xs"
                  placeholder="وصف مختصر للمحتوى والمقرر..."
                  value={cDesc}
                  onChange={(e) => setCDesc(e.target.value)}
                />
              </div>

              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="c-free"
                  checked={cIsFree}
                  onChange={(e) => setCIsFree(e.target.checked)}
                  className="w-4 h-4 cursor-pointer"
                />
                <label htmlFor="c-free" className="text-xs font-bold text-white cursor-pointer">
                  كورس مجاني متاح للجميع
                </label>
              </div>

              <button
                type="submit"
                disabled={cLoading}
                className="btn-gold sm:col-span-2 py-2.5 font-bold cursor-pointer"
              >
                {cLoading ? 'جاري رفع ونشر الكورس...' : 'نشر الكورس والصورة'}
              </button>

              {cMsg && (
                <p className={`sm:col-span-2 text-xs font-bold p-2 rounded-xl text-center ${cMsg.ok ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                  {cMsg.text}
                </p>
              )}
            </form>

            <div className="mt-5 border-t border-blue-500/15 pt-3 space-y-2">
              <h4 className="text-xs font-bold text-slate-300">الكورسات الحالية المنشورة:</h4>
              <div className="grid gap-2 sm:grid-cols-2 max-h-56 overflow-y-auto">
                {teacherData.courses.map((c) => (
                  <div key={c.id} className="card bg-[#111f36] p-2.5 text-xs flex justify-between items-center border border-blue-500/15">
                    <div className="flex items-center gap-2.5">
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt={c.title} className="w-12 h-9 object-cover rounded border border-blue-500/30" />
                      ) : (
                        <div className="w-12 h-9 rounded bg-blue-900/60 flex items-center justify-center font-bold text-white text-[11px]">
                          كورس
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-white">{c.title}</p>
                        <p className="text-slate-400">{c.grade} • {c.price} ج • {c.days} يوم</p>
                      </div>
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
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المحاضرة / الفصل (اختياري)</label>
                <input placeholder="مثال: المحاضرة الأولى" className="input-field" value={contentLecture} onChange={(e) => setContentLecture(e.target.value)} />
              </div>
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
          {/* Activation Codes for Specific Courses or General Subscriptions */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <Key className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg text-white">توليد أكواد شحن ودفع الكورسات</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              حدد الكورس المستهدف لربط الكود بكورس معين، أو اتركه كاشتراك عام لجميع الكورسات.
            </p>
            <form onSubmit={handleGenerateCodes} className="grid gap-3 sm:grid-cols-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">الكورس المستهدف</label>
                <select
                  className="input-field text-xs"
                  value={codeCourseId}
                  onChange={(e) => setCodeCourseId(e.target.value)}
                >
                  <option value="">اشتراك عام في المنصة (جميع الكورسات)</option>
                  {teacherData.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.grade}) - {c.price} ج.م
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عدد الأكواد</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="input-field text-xs"
                  value={codeCount}
                  onChange={(e) => setCodeCount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">المدة بالأيام</label>
                <input
                  type="number"
                  min="1"
                  className="input-field text-xs"
                  value={codeDays}
                  onChange={(e) => setCodeDays(Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-4 flex items-center justify-between gap-3 pt-2">
                <button type="submit" className="btn-gold py-2.5 px-6 font-bold text-xs cursor-pointer">
                  توليد الأكواد
                </button>
                {generatedCodes.length > 0 && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCopyCodes}
                      className="btn-cyan py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copyStatus ? 'تم النسخ!' : 'نسخ الأكواد'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handlePrintCodes}
                      className="btn-emerald py-2.5 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>طباعة الأكواد</span>
                    </button>
                  </div>
                )}
              </div>
            </form>

            {generatedCodes.length > 0 && (
              <div className="mt-4 p-3 bg-[#0a1322] rounded-xl border border-blue-500/20 text-xs">
                <p className="font-bold text-cyan-300 mb-2">{generatedMsg || 'الأكواد المولدة حديثاً:'}</p>
                <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto">
                  {generatedCodes.map((c, i) => (
                    <span key={i} className="font-mono bg-[#111f36] px-2.5 py-1 rounded border border-blue-500/30 text-white select-all">
                      {c}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Discount Coupons Generator */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-blue-500/15">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">توليد وإدارة كوبونات الخصم</h3>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              أنشئ كوبونات خصم (نسبة مئوية أو مبلغ ثابت) ليستخدمها الطلاب أثناء تفعيل الاشتراكات.
            </p>

            <form onSubmit={handleCreateCoupon} className="grid gap-3 sm:grid-cols-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كود الخصم (رمز الكوبون)</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: OFF50"
                  className="input-field text-xs uppercase font-mono"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">نوع الخصم</label>
                <select
                  className="input-field text-xs"
                  value={couponDiscountType}
                  onChange={(e) => setCouponDiscountType(e.target.value as any)}
                >
                  <option value="percentage">نسبة مئوية (%)</option>
                  <option value="fixed">مبلغ ثابت (ج.م)</option>
                  <option value="free_course">مجاني بالكامل (100%)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">قيمة الخصم</label>
                <input
                  type="number"
                  min="1"
                  required
                  className="input-field text-xs"
                  value={couponDiscountValue}
                  onChange={(e) => setCouponDiscountValue(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الحد الأقصى للاستخدام</label>
                <input
                  type="number"
                  min="1"
                  className="input-field text-xs"
                  value={couponMaxUses}
                  onChange={(e) => setCouponMaxUses(Number(e.target.value))}
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-slate-300 mb-1">الكورس المخصص (اختياري)</label>
                <select
                  className="input-field text-xs"
                  value={couponCourseId}
                  onChange={(e) => setCouponCourseId(e.target.value)}
                >
                  <option value="">جميع الكورسات والاشتراكات</option>
                  {teacherData.courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.grade})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={couponLoading}
                  className="btn-cyan w-full py-2.5 font-bold text-xs cursor-pointer shadow-lg"
                >
                  {couponLoading ? 'جاري الإنشاء...' : 'إنشاء الكوبون'}
                </button>
              </div>

              {couponMsg && (
                <p
                  className={`sm:col-span-4 text-xs font-bold p-2 rounded-xl text-center ${
                    couponMsg.ok ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'
                  }`}
                >
                  {couponMsg.text}
                </p>
              )}
            </form>

            <div className="mt-4 pt-3 border-t border-blue-500/15">
              <h4 className="text-xs font-bold text-slate-300 mb-2">الكوبونات النشطة حالياً:</h4>
              <div className="grid gap-2 sm:grid-cols-2 max-h-48 overflow-y-auto">
                {(!teacherData.coupons || teacherData.coupons.length === 0) ? (
                  <p className="text-xs text-slate-400 sm:col-span-2">لا توجد كوبونات خصم مضافة حالياً.</p>
                ) : (
                  teacherData.coupons.map((coup) => (
                    <div key={coup.id} className="p-2.5 rounded-xl bg-[#111f36] border border-blue-500/15 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-black text-amber-300 text-sm">{coup.code}</span>
                        <p className="text-slate-300 mt-0.5">
                          الخصم: {coup.discountType === 'percentage' ? `${coup.discountValue}%` : coup.discountType === 'fixed' ? `${coup.discountValue} ج.م` : 'مجاني'} • الاستخدام: {coup.usedCount || 0} / {coup.maxUses || '∞'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(coup.id)}
                        className="btn-red btn-sm text-[10px] cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
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
          {/* Live Customizer for Platform Design & Colors */}
          <section className="panel border border-cyan-500/30 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">🎨 تخصيص مظهر وتصميم المنصة والألوان الحية</h3>
            </div>

            {/* Quick Themes Palette Presets */}
            <div className="mb-4 p-3 rounded-xl bg-[#091222] border border-blue-500/20">
              <label className="block text-xs font-bold text-slate-300 mb-2">أنماط ألوان جاهزة بضغطة زر:</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                {[
                  { name: 'أزرق نيلي احترافي', primary: '#2563eb', heading: '#ffffff', text: '#cbd5e1', pattern: 'radial' },
                  { name: 'سماوي عصري', primary: '#0284c7', heading: '#38bdf8', text: '#f8fafc', pattern: 'gradient' },
                  { name: 'زمردي إسلامي', primary: '#059669', heading: '#34d399', text: '#d1fae5', pattern: 'emerald' },
                  { name: 'بنفسجي إبداعي', primary: '#7c3aed', heading: '#c084fc', text: '#ede9fe', pattern: 'purple' },
                  { name: 'عنبري وذهبي', primary: '#d97706', heading: '#fbbf24', text: '#fef3c7', pattern: 'amber' },
                  { name: 'فحمي داكن فخم', primary: '#3b82f6', heading: '#ffffff', text: '#94a3b8', pattern: 'dark' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyColorPreset(preset)}
                    className="p-2 rounded-lg border border-blue-500/25 bg-[#0e1d35] hover:border-cyan-400 text-slate-200 hover:text-white flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: preset.primary }}></span>
                    <span className="text-[11px] font-bold">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSaveDesign} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنصة</label>
                  <input
                    className="input-field"
                    value={settingsName}
                    onChange={(e) => setSettingsName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الوصف والشعار الفرعي</label>
                  <input
                    className="input-field"
                    placeholder="مثال: منصة تعليمية متكاملة للغة العربية"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اللون الأساسي للأزرار والروابط (`--primary-blue`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">لون العناوين والتمييز (`--heading-theme`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={headingColor}
                      onChange={(e) => setHeadingColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={headingColor}
                      onChange={(e) => setHeadingColor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">لون النصوص العامة (`--text-main`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">خلفية اللوحات والقوائم (`--bg-panel`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={panelBg}
                      onChange={(e) => setPanelBg(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={panelBg}
                      onChange={(e) => setPanelBg(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">خلفية البطاقات الكروت (`--bg-card`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={cardBg}
                      onChange={(e) => setCardBg(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={cardBg}
                      onChange={(e) => setCardBg(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اللون الذهبي للجوائز (`--accent-gold`)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      className="w-10 h-10 rounded-lg border border-blue-500/30 cursor-pointer bg-transparent"
                      value={accentGold}
                      onChange={(e) => setAccentGold(e.target.value)}
                    />
                    <input
                      type="text"
                      className="input-field text-xs font-mono"
                      value={accentGold}
                      onChange={(e) => setAccentGold(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">الخط العربي الرسمي للمنصة (Font Family)</label>
                  <select
                    className="input-field text-xs font-bold"
                    value={fontFamily}
                    onChange={(e) => setFontFamily(e.target.value)}
                  >
                    <option value="'Cairo', sans-serif">Cairo (كايرو - الافتراضي العصري)</option>
                    <option value="'Tajawal', sans-serif">Tajawal (تجوال - واضح وجذاب)</option>
                    <option value="'Almarai', sans-serif">Almarai (المراعي - تصميم نقي)</option>
                    <option value="'Readex Pro', sans-serif">Readex Pro (ريديكس برو - عصري فاخر)</option>
                    <option value="'IBM Plex Sans Arabic', sans-serif">IBM Plex Sans Arabic (تقني احترافي)</option>
                    <option value="'Amiri', serif">Amiri (أميري - كلاسيكي أصيل)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">نمط وتدرج خلفية المنصة العامة</label>
                  <select
                    className="input-field text-xs"
                    value={bgPattern}
                    onChange={(e) => setBgPattern(e.target.value)}
                  >
                    <option value="gradient">تدرج كحلي سماوي</option>
                    <option value="radial">كحلي عميق</option>
                    <option value="emerald">تدرج زمردي</option>
                    <option value="purple">تدرج بنفسجي</option>
                    <option value="amber">تدرج عنبري ذهبي</option>
                    <option value="rose">تدرج ياقوتي</option>
                    <option value="dark">رمادي فحمي داكن</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="btn-cyan w-full py-3 font-extrabold cursor-pointer shadow-lg mt-3"
              >
                تطبيق وحفظ جميع متغيرات CSS والخطوط في قاعدة البيانات
              </button>

              {designMsg && (
                <p className={`text-xs font-bold p-2 rounded-xl text-center ${designMsg.ok ? 'bg-emerald-950/60 text-emerald-300' : 'bg-red-950/60 text-red-300'}`}>
                  {designMsg.text}
                </p>
              )}
            </form>
          </section>

          {/* Platform Settings & Hero */}
          <section id="admin-settings" className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <Settings className="w-5 h-5 text-cyan-400" />
              <h3 className="font-extrabold text-lg text-white">إعدادات المنصة وصورة الغلاف</h3>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">اسم المنصة</label>
                  <input className="input-field" value={settingsName} onChange={(e) => setSettingsName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">كود الكاشير لتفعيل الدفع (Cashier Key)</label>
                  <input className="input-field font-mono text-cyan-300" placeholder="مثال: CASHIER-1234" value={cashierKey} onChange={(e) => setCashierKey(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط أو صورة المنصة الرسمية (المعروضة بالمنتصف)</label>
                <input ref={heroInputRef} type="file" accept="image/*" className="input-field text-xs cursor-pointer" />
              </div>

              <div className="flex items-center gap-3 bg-[#111f36] p-3 rounded-xl border border-blue-500/20">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiRequest('teacher', '/api/teacher/settings/toggle-pay');
                      await onRefresh();
                    } catch (e: any) {
                      alert(e.message);
                    }
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {teacherData?.onlinePay ? (
                    <ToggleRight className="w-8 h-8 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-slate-500" />
                  )}
                  <div className="text-right text-xs">
                    <p className="font-bold text-white">تفعيل نظام الدفع الإلكتروني (Online Pay)</p>
                    <p className="text-slate-400">إذا تم التعطيل، ستختفي خيارات الشحن عن جميع الطلاب تماماً.</p>
                  </div>
                </button>
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
              {previewReceiptUrl.startsWith('rec-') ? (
                <img src={previewReceiptUrl} alt="إيصال التحويل" className="max-w-full h-auto rounded-lg" />
              ) : (
                <div className="p-4 bg-white rounded-xl">
                  <QRCodeSVG value={previewReceiptUrl} size={250} />
                </div>
              )}
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
      {/* TAB 6: SUPERVISORS MANAGEMENT */}
      {activeMainTab === 'supervisors' && (
        <div className="space-y-6">
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-blue-500/15">
              <Shield className="w-5 h-5 text-amber-400" />
              <h3 className="font-extrabold text-lg text-white">إضافة وتعديل حسابات المشرفين وصلاحياتهم</h3>
            </div>
            <p className="text-xs text-slate-300 mb-4">
              يمكنك إضافة مشرفين جدد للمنصة وتحديد الصلاحيات المتاحة لكل مشرف بدقة. يستطيع المشرف تسجيل الدخول برقم هاتفه وكلمة السر المحددة له.
            </p>

            <form onSubmit={handleSaveSupervisor} className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">اسم المشرف</label>
                <input
                  type="text"
                  required
                  className="input-field text-xs"
                  placeholder="مثال: أحمد محمد"
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رقم الهاتف (للدخول)</label>
                <input
                  type="text"
                  required
                  className="input-field text-xs"
                  placeholder="010xxxxxxxx"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">كلمة السر</label>
                <input
                  type="password"
                  required={!supEditId}
                  className="input-field text-xs"
                  placeholder="••••••••"
                  value={supPassword}
                  onChange={(e) => setSupPassword(e.target.value)}
                />
              </div>

              <div className="sm:col-span-3 bg-[#111f36] p-4 rounded-xl border border-blue-500/15">
                <p className="text-xs font-bold text-white mb-3">تحديد الصلاحيات:</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  {[
                    { key: 'courses', label: 'إدارة الكورسات' },
                    { key: 'students', label: 'إدارة الطلاب' },
                    { key: 'exams', label: 'الامتحانات والتصحيح' },
                    { key: 'coupons', label: 'الكوبونات والأكواد' },
                    { key: 'financials', label: 'الماليات والمحفظة' },
                    { key: 'notices', label: 'الإعلانات' },
                  ].map((perm) => (
                    <label key={perm.key} className="flex items-center gap-2 cursor-pointer text-slate-200">
                      <input
                        type="checkbox"
                        checked={(supPermissions as any)[perm.key]}
                        onChange={(e) =>
                          setSupPermissions({ ...supPermissions, [perm.key]: e.target.checked })
                        }
                        className="w-4 h-4 rounded text-blue-600 focus:ring-0 bg-[#0c1626] border-blue-500/30 cursor-pointer"
                      />
                      <span>{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-3 flex items-center gap-3">
                <button type="submit" className="btn-primary py-2.5 px-6 font-bold text-xs cursor-pointer">
                  {supEditId ? 'حفظ التعديلات' : 'إضافة المشرف الجديد'}
                </button>
                {supEditId && (
                  <button
                    type="button"
                    onClick={() => {
                      setSupEditId(null);
                      setSupName('');
                      setSupPhone('');
                      setSupPassword('');
                    }}
                    className="btn-gray py-2.5 px-4 text-xs cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </div>

              {supMsg && (
                <p
                  className={`sm:col-span-3 text-xs font-bold p-2.5 rounded-xl text-center ${
                    supMsg.ok ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-500/30' : 'text-red-400 bg-red-950/40 border border-red-500/30'
                  }`}
                >
                  {supMsg.text}
                </p>
              )}
            </form>
          </section>

          {/* Supervisors List */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <h3 className="font-extrabold text-lg text-white mb-4">قائمة المشرفين المسجلين</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {(!teacherData.supervisors || teacherData.supervisors.length === 0) ? (
                <p className="text-xs text-slate-400 sm:col-span-2">لا توجد حسابات مشرفين مضافة حالياً.</p>
              ) : (
                (teacherData.supervisors || []).map((sv) => (
                  <div key={sv.id} className="card bg-[#111f36] border border-blue-500/20 p-4 text-xs space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-white text-sm">{sv.name}</span>
                      <span className="badge-pill bg-blue-950/60 text-blue-300 border-blue-500/30">
                        {sv.phone}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {Object.entries(sv.permissions || {}).map(([k, v]) => v ? (
                        <span key={k} className="px-2 py-0.5 rounded bg-emerald-950/50 text-emerald-300 border border-emerald-500/20 text-[10px]">
                          {k}
                        </span>
                      ) : null)}
                    </div>
                    <div className="flex justify-end gap-2 pt-2 border-t border-blue-500/10">
                      <button
                        type="button"
                        onClick={() => {
                          setSupEditId(sv.id);
                          setSupName(sv.name);
                          setSupPhone(sv.phone);
                          setSupPermissions(sv.permissions || supPermissions);
                        }}
                        className="btn-primary btn-sm text-[10px] cursor-pointer"
                      >
                        تعديل
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSupervisor(sv.id)}
                        className="btn-red btn-sm text-[10px] cursor-pointer"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}
      {/* TAB: GOOGLE MEET LIVE BROADCAST & AUTOMATED FIREBASE ATTENDANCE */}
      {activeMainTab === 'meet' && (
        <div className="space-y-6">
          {/* Header & Stats Banner */}
          <div className="panel border border-cyan-500/30 bg-gradient-to-br from-[#0c1a2e] to-[#081220] shadow-2xl p-6 rounded-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-cyan-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
                  <Video className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl text-white flex items-center gap-2">
                    <span>نظام البث المباشر وتسجيل الحضور الآلي (Google Meet)</span>
                    <span className="badge-pill bg-emerald-950/60 text-emerald-400 border-emerald-500/40 text-[11px]">
                      مربوط ببث Firebase الحقيقي
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    أنشئ حلقة البث المباشر، وتابع حضور طلابك لحظياً فور انضمامهم عبر رابط Google Meet.
                  </p>
                </div>
              </div>

              {/* KPI Badges */}
              <div className="flex items-center gap-2">
                <div className="bg-[#111f36] border border-blue-500/20 px-3 py-2 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400 font-bold">جلسات البث</p>
                  <p className="text-lg font-black text-cyan-300">{teacherData.liveSessions?.length || 0}</p>
                </div>
                <div className="bg-[#111f36] border border-blue-500/20 px-3 py-2 rounded-xl text-center">
                  <p className="text-[10px] text-slate-400 font-bold">إجمالي عمليات الحضور</p>
                  <p className="text-lg font-black text-emerald-400">{teacherData.liveAttendance?.length || 0}</p>
                </div>
              </div>
            </div>

            {/* Create Live Session Form */}
            <form onSubmit={handleCreateLiveSession} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">عنوان البث المباشر</label>
                <input
                  required
                  type="text"
                  placeholder="مثال: مراجعة ليلة الامتحان - نحو وبلاغة"
                  className="input-field text-xs"
                  value={meetTitle}
                  onChange={(e) => setMeetTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">رابط Google Meet</label>
                <input
                  required
                  type="url"
                  dir="ltr"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  className="input-field text-xs"
                  value={meetUrl}
                  onChange={(e) => setMeetUrl(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">الصف الدراسي المستهدف</label>
                <select
                  className="input-field text-xs"
                  value={meetGrade}
                  onChange={(e) => setMeetGrade(e.target.value)}
                >
                  {ALL_GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">تاريخ ووقت البث المباشر</label>
                <input
                  type="datetime-local"
                  className="input-field text-xs"
                  value={meetScheduledAt}
                  onChange={(e) => setMeetScheduledAt(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">حالة البث</label>
                <select
                  className="input-field text-xs"
                  value={meetStatus}
                  onChange={(e) => setMeetStatus(e.target.value as any)}
                >
                  <option value="active">🔴 جاري الآن (مفتوح للطلاب)</option>
                  <option value="scheduled">⏱️ مجدول (قريباً)</option>
                  <option value="ended">🛑 منتهي (مغلق)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">ملاحظات / تعليمات البث</label>
                <input
                  type="text"
                  placeholder="يرجى إحضار كشكول الملاحظات والدخول بالاسم الثلاثي..."
                  className="input-field text-xs"
                  value={meetNotes}
                  onChange={(e) => setMeetNotes(e.target.value)}
                />
              </div>

              <div className="lg:col-span-3 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={meetLoading}
                  className="btn-cyan py-2.5 px-6 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-cyan-500/20"
                >
                  <Video className="w-4 h-4" />
                  <span>{meetLoading ? 'جاري الحفظ والنشر...' : 'نشر وتفعيل البث المباشر'}</span>
                </button>

                {meetMsg && (
                  <span className={`text-xs font-bold ${meetMsg.ok ? 'text-emerald-400' : 'text-red-400'}`}>
                    {meetMsg.text}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* Active Google Meet Sessions List */}
          <section className="panel border border-blue-500/25 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl">
            <h4 className="font-extrabold text-base text-white mb-3 flex items-center gap-2">
              <span>حلقات البث المباشر المنشورة حالياً</span>
              <span className="text-xs font-normal text-slate-400">({teacherData.liveSessions?.length || 0} جلسة)</span>
            </h4>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(!teacherData.liveSessions || teacherData.liveSessions.length === 0) ? (
                <p className="text-xs text-slate-400 sm:col-span-3 text-center py-6">
                  لا توجد حلقات بث مباشر أنشئت بعد. قم بتعبئة النموذج أعلاه لنشر بث مباشر للطلاب.
                </p>
              ) : (
                teacherData.liveSessions.map((session: any) => {
                  const sessionAttendance = (teacherData.liveAttendance || []).filter((a: any) => a.sessionId === session.id);
                  const isSessionActive = session.status === 'active' || session.status === 'live';
                  const isSessionScheduled = session.status === 'scheduled' || session.status === 'upcoming';
                  return (
                    <div
                      key={session.id}
                      className="card bg-[#111f36] border border-cyan-500/20 p-4 rounded-xl space-y-2.5 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-black text-white text-sm truncate">{session.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isSessionActive
                            ? 'bg-red-950/80 text-red-300 border border-red-500/40 animate-pulse'
                            : isSessionScheduled
                            ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {isSessionActive ? '🔴 جاري الآن' : isSessionScheduled ? '⏱️ مجدول' : '🛑 انتهى'}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-300 space-y-1">
                        <p>🎯 الصف: <strong className="text-cyan-300">{session.grade}</strong></p>
                        <p className="truncate" dir="ltr">🔗 {session.meetUrl}</p>
                        <p>👥 الطلاب الحاضرون آلياً: <strong className="text-emerald-400">{sessionAttendance.length} طالب</strong></p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-blue-500/15">
                        <button
                          type="button"
                          onClick={() => setPreviewReceiptUrl(session.id)}
                          className="btn-emerald btn-sm text-[10px] inline-flex items-center gap-1 font-bold"
                        >
                          <span>QR</span>
                        </button>
                        <a
                          href={session.meetUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-cyan btn-sm text-[10px] inline-flex items-center gap-1 font-bold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>فتح Meet</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(session.meetUrl);
                            alert('تم نسخ رابط Google Meet بنجاح!');
                          }}
                          className="btn-gray btn-sm text-[10px] inline-flex items-center gap-1"
                        >
                          <Copy className="w-3 h-3" />
                          <span>نسخ الرابط</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteLiveSession(session.id)}
                          className="btn-red btn-sm text-[10px] mr-auto"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* Automated Firebase Student Attendance Tracker Table */}
          <section className="panel border border-emerald-500/30 bg-[#0f1b2d] shadow-xl p-5 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-emerald-500/20">
              <div>
                <h4 className="font-extrabold text-lg text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span>كشف حضور الطلاب الآلي والموثق للبث المباشر</span>
                </h4>
                <p className="text-xs text-slate-300 mt-0.5">
                  يتم توثيق اسم ورقم هاتف وتاريخ ووقت انضمام كل طالب آلياً بضغطة زر عند فتح رابط البث.
                </p>
              </div>

              {/* Attendance Quick Filters & Report Copy Button */}
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="بحث باسم الطالب أو رقم الهاتف..."
                  className="input-field text-xs py-1.5 px-3 w-48"
                  value={attendanceSearchQuery}
                  onChange={(e) => setAttendanceSearchQuery(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => {
                    const filtered = (teacherData.liveAttendance || []).filter((a: any) => {
                      const matchSearch = !attendanceSearchQuery || a.studentName?.includes(attendanceSearchQuery) || a.studentPhone?.includes(attendanceSearchQuery);
                      const matchSession = selectedSessionFilter === 'all' || a.sessionId === selectedSessionFilter;
                      return matchSearch && matchSession;
                    });
                    const reportText = `📊 *تقرير حضور البث المباشر عبر Google Meet*\nعدد الحضور: ${filtered.length} طالب\n---------------------\n` +
                      filtered.map((a: any, i: number) => `${i + 1}. ${a.studentName} (${a.grade}) - ${a.sessionTitle} - الموعد: ${new Date(a.joinedAt).toLocaleTimeString('ar-EG')}`).join('\n');
                    navigator.clipboard.writeText(reportText);
                    alert('تم نسخ تقرير الحضور كاملاً بصيغة منسقة للواتساب!');
                  }}
                  className="btn-emerald btn-sm inline-flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>نسخ تقرير الحضور</span>
                </button>
              </div>
            </div>

            {/* Manual Attendance Registration Box */}
            <form onSubmit={handleManualAttendance} className="p-3.5 rounded-xl bg-[#0a1220] border border-blue-500/20 flex flex-wrap items-center gap-3 text-xs">
              <span className="font-bold text-cyan-300 flex items-center gap-1">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                <span>تسجيل حضور طالب يدوياً (في حال حدوث مشكلة تقنية لديه):</span>
              </span>

              <select
                className="input-field text-xs py-1 w-48"
                value={manualSessionId}
                onChange={(e) => setManualSessionId(e.target.value)}
              >
                <option value="">-- اختر حلقة البث المباشر --</option>
                {(teacherData.liveSessions || []).map((s: any) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.grade})</option>
                ))}
              </select>

              <select
                className="input-field text-xs py-1 w-52"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
              >
                <option value="">-- اختر الطالب المسجل --</option>
                {teacherData.students.map((st: any) => (
                  <option key={st.id} value={st.id}>{st.name} - {st.phone} ({st.grade})</option>
                ))}
              </select>

              <button type="submit" className="btn-primary btn-sm font-bold text-xs py-1 cursor-pointer">
                تأكيد الحضور
              </button>
            </form>

            {/* Attendance Table */}
            <div className="overflow-x-auto rounded-xl border border-blue-500/20 bg-[#091222]">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#0e1d35] text-cyan-300 font-extrabold border-b border-blue-500/20">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">اسم الطالب</th>
                    <th className="p-3">رقم الهاتف</th>
                    <th className="p-3">الصف</th>
                    <th className="p-3">عنوان حلقة البث</th>
                    <th className="p-3">تاريخ ووقت الحضور</th>
                    <th className="p-3">حالة التوثيق</th>
                    <th className="p-3">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-500/10 text-slate-200">
                  {(!teacherData.liveAttendance || teacherData.liveAttendance.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400">
                        لا توجد عمليات حضور مسجلة بعد. عند انضمام أي طالب للبث المباشر، سيظهر اسمه ووقت حضوره آلياً هنا.
                      </td>
                    </tr>
                  ) : (
                    (teacherData.liveAttendance || [])
                      .filter((a: any) => {
                        const matchSearch = !attendanceSearchQuery ||
                          (a.studentName || '').includes(attendanceSearchQuery) ||
                          (a.studentPhone || '').includes(attendanceSearchQuery);
                        const matchSession = selectedSessionFilter === 'all' || a.sessionId === selectedSessionFilter;
                        return matchSearch && matchSession;
                      })
                      .map((log: any, idx: number) => (
                        <tr key={log.id || idx} className="hover:bg-blue-950/30 transition-colors">
                          <td className="p-3 font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-black text-white">{log.studentName || 'طالب'}</td>
                          <td className="p-3 font-mono text-cyan-300">{log.studentPhone || 'غير موضح'}</td>
                          <td className="p-3">{log.grade || 'عام'}</td>
                          <td className="p-3 font-medium text-slate-300">{log.sessionTitle || 'بث مباشر'}</td>
                          <td className="p-3 font-mono text-emerald-400">
                            {log.joinedAt ? new Date(log.joinedAt).toLocaleString('ar-EG') : 'الآن'}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.type === 'auto' || log.status === 'حاضر آلياً'
                                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                                : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                            }`}>
                              {log.status || 'حاضر آلياً'}
                            </span>
                          </td>
                          <td className="p-3">
                            {log.studentPhone && (
                              <a
                                href={`https://wa.me/2${log.studentPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`أهلاً بك يا ${log.studentName}، تم توثيق حضورك في البث المباشر (${log.sessionTitle}) بنجاح!`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-green btn-sm text-[10px] inline-flex items-center gap-1"
                              >
                                واتساب
                              </a>
                            )}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

    </div>
  );
};
