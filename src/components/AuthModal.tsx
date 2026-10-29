import React, { useState } from 'react';
import {
  X,
  LogIn,
  UserPlus,
  Shield,
  User,
  Phone,
  Lock,
  GraduationCap,
  MapPin,
  HeartHandshake,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { GRADES } from '../types';
import { apiRequest, tokens } from '../services/api';
import { auth } from '../services/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (role: 'student' | 'parent' | 'teacher') => void;
  initialTab?: 'student-login' | 'student-register' | 'parent-login' | 'teacher-login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  initialTab = 'student-login',
}) => {
  const [tab, setTab] = useState<'student-login' | 'student-register' | 'parent-login' | 'teacher-login'>(
    initialTab
  );

  // Student Login State
  const [stuPhone, setStuPhone] = useState('');
  const [stuPassword, setStuPassword] = useState('');

  // Register State (بدون المركز)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regGrade, setRegGrade] = useState(GRADES[0]);
  const [regGov, setRegGov] = useState('');
  const [regParentName, setRegParentName] = useState('');
  const [regParentPhone, setRegParentPhone] = useState('');

  // Parent Login State
  const [parentPhone, setParentPhone] = useState('');
  const [parentPassword, setParentPassword] = useState('');
  const [parentCode, setParentCode] = useState('');
  const [parentMode, setParentMode] = useState<'phone' | 'code'>('phone');

  // Teacher Login State
  const [teacherCode, setTeacherCode] = useState('');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen) return null;

  const resetMessages = () => {
    setError('');
    setSuccess('');
  };

  // 1. Student Login
  const handleStudentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const pClean = stuPhone.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const pwClean = stuPassword.replace(/[أإآ]/g, 'ا').trim().toLowerCase();
      const isAdminAttempt =
        (pClean === 'ادمن' || pClean === 'admin' || pClean === '100100') &&
        (pwClean === '100100' || pwClean === 'admin' || pwClean === 'ادمن');

      const res = await apiRequest('student', '/api/student/login', {
        phone: stuPhone.trim(),
        password: stuPassword,
      });

      if (res.role === 'teacher' || isAdminAttempt) {
        tokens.teacher = res.token;
        onLoginSuccess('teacher');
        onClose();
        return;
      }

      tokens.student = res.token;
      onLoginSuccess('student');
      onClose();
    } catch (err: any) {
      setError(err.message || 'رقم الهاتف أو كلمة السر غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  // 2. Student Register (بدون المركز)
  const handleStudentRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      await apiRequest('public', '/api/register', {
        name: regName.trim(),
        phone: regPhone.trim(),
        password: regPassword,
        grade: regGrade,
        governorate: regGov.trim(),
        parentName: regParentName.trim(),
        parentPhone: regParentPhone.trim(),
      });

      setSuccess('تم تسجيل حسابك بنجاح! يمكنك الآن تسجيل الدخول برقم هاتفك وكلمة السر.');
      setStuPhone(regPhone.trim());
      setStuPassword('');
      setTimeout(() => {
        setTab('student-login');
        setError('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  // 3. Parent Login
  const handleParentLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const payload =
        parentMode === 'phone'
          ? { phone: parentPhone.trim(), password: parentPassword }
          : { code: parentCode.trim().toUpperCase() };

      const res = await apiRequest('parent', '/api/parent/login', payload);
      tokens.parent = res.token;
      onLoginSuccess('parent');
      onClose();
    } catch (err: any) {
      setError(err.message || 'بيانات ولي الأمر غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  // 4. Teacher Login
  const handleTeacherLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    resetMessages();
    setLoading(true);
    try {
      const res = await apiRequest('teacher', '/api/teacher/login', {
        code: teacherCode.trim(),
      });
      tokens.teacher = res.token;
      onLoginSuccess('teacher');
      onClose();
    } catch (err: any) {
      setError(err.message || 'كود الأستاذ غير صحيح');
    } finally {
      setLoading(false);
    }
  };

  // 5. Google Login
  const handleGoogleLogin = async () => {
    resetMessages();
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();

      const res = await apiRequest('student', '/api/auth/google', {
        idToken,
      });

      tokens.student = res.token;
      onLoginSuccess('student');
      onClose();
    } catch (err: any) {
      console.error('Google Auth error:', err);
      setError(err.message || 'فشل تسجيل الدخول بواسطة جوجل');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg my-8 rounded-3xl bg-gradient-to-b from-[#0f1c32] to-[#0a1222] border border-blue-500/30 p-6 sm:p-8 shadow-2xl text-right">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="إغلاق النافذة"
          className="absolute top-5 left-5 p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="mb-6 pr-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30 text-cyan-300 text-xs font-bold mb-2">
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>بوابة تسجيل الدخول الآمنة</span>
          </div>
          <h2 className="text-2xl font-black text-white">تسجيل الدخول للمنصة</h2>
          <p className="text-xs text-slate-300 mt-1">
            اختر نوع الحساب وأدخل بياناتك للمتابعة والوصول للمحتوى.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#070e1c] border border-blue-500/20 mb-6 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => {
              setTab('student-login');
              resetMessages();
            }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              tab === 'student-login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>دخول طالب</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('student-register');
              resetMessages();
            }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              tab === 'student-register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>حساب جديد</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTab('parent-login');
              resetMessages();
            }}
            className={`py-2 px-1 rounded-xl transition-all cursor-pointer flex flex-col items-center gap-1 ${
              tab === 'parent-login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <HeartHandshake className="w-4 h-4" />
            <span>ولي الأمر</span>
          </button>
        </div>

        {/* Feedback Alerts */}
        {error && (
          <div className="mb-4 rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs font-bold text-red-200 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 p-3 text-xs font-bold text-emerald-200 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* 1. STUDENT LOGIN FORM */}
        {tab === 'student-login' && (
          <form onSubmit={handleStudentLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>رقم هاتف الطالب (أو كود الأدمن)</span>
              </label>
              <input
                type="text"
                required
                dir="ltr"
                placeholder="01xxxxxxxxx"
                autoComplete="username"
                className="input-field text-sm"
                value={stuPhone}
                onChange={(e) => setStuPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>كلمة السر</span>
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                autoComplete="current-password"
                className="input-field text-sm"
                value={stuPassword}
                onChange={(e) => setStuPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</span>
            </button>

            <div className="pt-3 border-t border-blue-500/15 text-center space-y-3">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 rounded-xl border border-slate-700 bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                <span>{loading ? 'جاري التحقق...' : 'الدخول بواسطة جوجل'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('student-register');
                  resetMessages();
                }}
                className="text-xs font-bold text-cyan-400 hover:text-cyan-300 underline"
              >
                طالب جديد؟ اضغط هنا لإنشاء حساب في ثوانٍ
              </button>
            </div>
          </form>
        )}

        {/* 2. STUDENT REGISTER FORM (بدون المركز تماماً) */}
        {tab === 'student-register' && (
          <form onSubmit={handleStudentRegister} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                <span>اسم الطالب بالكامل</span>
              </label>
              <input
                type="text"
                required
                placeholder="الاسم ثلاثي أو رباعي"
                className="input-field text-xs py-2"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
              />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>رقم هاتف الطالب</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  className="input-field text-xs py-2"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>كلمة السر (4 أحرف فأكثر)</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={4}
                  placeholder="••••••••"
                  className="input-field text-xs py-2"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>الصف الدراسي</span>
                </label>
                <select
                  className="input-field text-xs py-2"
                  value={regGrade}
                  onChange={(e) => setRegGrade(e.target.value as any)}
                >
                  {GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                  <span>المحافظة</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: القاهرة / الإسكندرية / الجيزة"
                  className="input-field text-xs py-2"
                  value={regGov}
                  onChange={(e) => setRegGov(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <HeartHandshake className="w-3.5 h-3.5 text-cyan-400" />
                  <span>اسم ولي الأمر</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="اسم والد / والدة الطالب"
                  className="input-field text-xs py-2"
                  value={regParentName}
                  onChange={(e) => setRegParentName(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>رقم هاتف ولي الأمر</span>
                </label>
                <input
                  type="tel"
                  required
                  dir="ltr"
                  placeholder="01xxxxxxxxx"
                  className="input-field text-xs py-2"
                  value={regParentPhone}
                  onChange={(e) => setRegParentPhone(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>{loading ? 'جاري إنشاء الحساب...' : 'إنشاء حساب جديد'}</span>
            </button>
          </form>
        )}

        {/* 3. PARENT LOGIN FORM */}
        {tab === 'parent-login' && (
          <form onSubmit={handleParentLogin} className="space-y-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setParentMode('phone')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  parentMode === 'phone'
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                برقم الهاتف وكلمة السر
              </button>
              <button
                type="button"
                onClick={() => setParentMode('code')}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                  parentMode === 'code'
                    ? 'bg-cyan-950/60 text-cyan-300 border-cyan-400/50'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700'
                }`}
              >
                بكود المتابعة (PR)
              </button>
            </div>

            {parentMode === 'phone' ? (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    رقم هاتف الطالب المرتبط بحسابك
                  </label>
                  <input
                    type="tel"
                    required
                    dir="ltr"
                    placeholder="01xxxxxxxxx"
                    className="input-field text-sm"
                    value={parentPhone}
                    onChange={(e) => setParentPhone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    كلمة سر حساب الطالب
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="input-field text-sm"
                    value={parentPassword}
                    onChange={(e) => setParentPassword(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  كود متابعة ولي الأمر (يبدأ بـ PR)
                </label>
                <input
                  type="text"
                  required
                  dir="ltr"
                  placeholder="PR-XXXXXX"
                  className="input-field text-sm font-mono uppercase"
                  value={parentCode}
                  onChange={(e) => setParentCode(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <HeartHandshake className="w-4 h-4" />
              <span>{loading ? 'جاري الدخول...' : 'دخول مساحة ولي الأمر'}</span>
            </button>
          </form>
        )}

        {/* 4. TEACHER LOGIN FORM */}
        {tab === 'teacher-login' && (
          <form onSubmit={handleTeacherLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                <span>كود أو كلمة سر المعلم / الأدمن</span>
              </label>
              <input
                type="password"
                required
                placeholder="أدخل كود المعلم أو 100100"
                className="input-field text-sm"
                value={teacherCode}
                onChange={(e) => setTeacherCode(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Shield className="w-4 h-4" />
              <span>{loading ? 'جاري التحقق...' : 'دخول لوحة التحكم'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
