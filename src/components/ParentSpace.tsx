import React, { useState } from 'react';
import { ParentData } from '../types';
import { apiRequest, tokens } from '../services/api';
import {
  User,
  CheckCircle,
  Video,
  FileText,
  ClipboardList,
  TrendingUp,
  Clock,
  LogOut,
  AlertCircle,
  Award,
  QrCode,
  Wallet,
  Printer,
  Home,
} from 'lucide-react';

interface ParentSpaceProps {
  parentData: ParentData | null;
  onRefresh: () => Promise<void>;
  onLogout: () => void;
}

const daysLeft = (d?: string) => {
  if (!d) return 0;
  return Math.max(0, Math.ceil((new Date(d).getTime() - Date.now()) / 864e5));
};

export const ParentSpace: React.FC<ParentSpaceProps> = ({
  parentData,
  onRefresh,
  onLogout,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'attendance' | 'meetAttendance'>('overview');
  const [liveLogs, setLiveLogs] = useState<any[]>([]);
  const [liveLoading, setLiveLoading] = useState(false);

  const fetchLiveLogs = async () => {
    setLiveLoading(true);
    try {
      const res = await apiRequest<any>('parent', '/api/parent/live-attendance');
      setLiveLogs(res.attendanceLogs || []);
    } catch {
      setLiveLogs([]);
    } finally {
      setLiveLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await apiRequest('parent', '/api/parent/login', { phone, password });
      tokens.parent = res.token;
      await onRefresh();
    } catch (err: any) {
      setError(err.message || 'رقم الهاتف أو كلمة السر غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  // NOT LOGGED IN
  if (!parentData) {
    return (
      <div className="rounded-b-[1.5rem] bg-[#0c1626] border border-t-0 border-blue-500/20 p-5 sm:p-8 shadow-2xl text-right">
        <section className="panel mx-auto max-w-xl border border-blue-500/20 bg-[#0f1b2d]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-blue-500/15">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-extrabold text-white">متابعة مستوى الطالب (ولي الأمر)</h2>
            </div>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            ادخل برقم هاتف ابنك (الطالب) وكلمة السر المسجل بها للاطلاع على حضوره ونتائجه ومستواه.
          </p>

          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-950/40 border border-red-500/30 p-3 text-sm font-bold text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رقم هاتف الطالب (ابنك)
              </label>
              <input
                type="tel"
                inputMode="tel"
                dir="ltr"
                required
                placeholder="01xxxxxxxxx"
                className="input-field text-xs"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">كلمة السر</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field text-xs"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-gold w-full py-2.5 font-extrabold text-sm shadow"
            >
              {loading ? 'جاري الفتح...' : 'فتح مساحة المتابعة'}
            </button>
          </form>
        </section>
      </div>
    );
  }

  // LOGGED IN DASHBOARD
  const p = parentData.progress;

  return (
    <div className="rounded-b-[1.5rem] bg-[#0c1626] border border-t-0 border-blue-500/20 p-5 sm:p-8 space-y-6 shadow-2xl text-right">
      {/* Student Profile Overview */}
      <section className="panel border border-blue-500/20 bg-[#0f1b2d]">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <span className="badge-pill bg-cyan-950/40 text-cyan-300 border-cyan-400/30 mb-2">
              بوابة متابعة ولي الأمر
            </span>
            <h2 className="text-xl font-extrabold text-white mt-1">بيانات الطالب والمتابعة</h2>
          </div>
          <button
            onClick={onLogout}
            className="btn-gray btn-sm flex items-center gap-1.5 font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>تسجيل الخروج</span>
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <h3 className="text-xs font-bold text-slate-400">اسم الطالب</h3>
            <p className="text-base font-extrabold text-white mt-1">{parentData.name}</p>
          </div>
          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <h3 className="text-xs font-bold text-slate-400">الصف الدراسي</h3>
            <p className="text-base font-extrabold text-cyan-400 mt-1">{parentData.grade}</p>
          </div>
          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <h3 className="text-xs font-bold text-slate-400">حالة الحساب</h3>
            <p className="text-base font-extrabold mt-1 text-emerald-400">
              {parentData.status}
            </p>
          </div>
          <div className="card bg-[#111f36] border border-blue-500/20 p-3">
            <h3 className="text-xs font-bold text-slate-400">حالة الاشتراك</h3>
            <p className="text-base font-extrabold mt-1 text-cyan-300">
              {parentData.sub
                ? `مفعّل (${daysLeft(parentData.subEnd)} يوم)`
                : 'غير مفعّل'}
            </p>
          </div>
        </div>
      </section>

      {/* Parent Tab Bar */}
      <div className="bg-[#0f1b2d] p-1.5 rounded-2xl border border-blue-500/20 shadow-xl overflow-x-auto">
        <div className="flex gap-2">
          {[
            { id: 'overview', label: '📊 ملخص تقرير الطالب والنشاط', icon: Home },
            { id: 'results', label: '🏆 النتائج والشهادات التفصيلية', icon: Award },
            { id: 'attendance', label: '🏫 كود الحضور وبار كود السنتر', icon: QrCode },
            { id: 'meetAttendance', label: '🔴 سجل حضور البث المباشر (Google Meet)', icon: Video },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id as any);
                  if (tab.id === 'meetAttendance') fetchLiveLogs();
                }}
                className={`py-2.5 px-4 rounded-xl font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow border border-cyan-400/40'
                    : 'bg-[#111f36] text-slate-300 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-cyan-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <section className="panel bg-[#0f1b2d] border border-blue-500/20 space-y-4">
          <h2 className="text-lg font-extrabold text-white mb-2">مستوى التقدم والنشاط المباشر</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Video className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold">فيديوهات شاهدها</h3>
              </div>
              <p className="text-lg font-extrabold text-white">
                {p.videosWatched} من {p.videosTotal}
              </p>
            </div>

            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FileText className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold">ملفات ومذكرات فتحها</h3>
              </div>
              <p className="text-lg font-extrabold text-white">
                {p.filesOpened} من {p.filesTotal}
              </p>
            </div>

            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <ClipboardList className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold">امتحانات حلّها</h3>
              </div>
              <p className="text-lg font-extrabold text-white">
                {p.examsDone} من {p.examsTotal}
              </p>
            </div>

            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <FileText className="w-4 h-4 text-purple-400" />
                <h3 className="text-xs font-bold">ملاحظات دراسية دوّنها</h3>
              </div>
              <p className="text-lg font-extrabold text-white">{p.notes}</p>
            </div>

            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-bold">متوسط درجات الامتحانات</h3>
              </div>
              <p className="text-lg font-extrabold text-emerald-400">
                {p.average === null ? '—' : `${p.average}%`}
              </p>
            </div>

            <div className="card bg-[#111f36] p-3 border border-blue-500/15">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <CheckCircle className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-bold">التقدير العام</h3>
              </div>
              <p className="text-lg font-extrabold text-cyan-300">{p.label || '—'}</p>
            </div>
          </div>

          {p.lastActive && (
            <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>آخر نشاط للطالب على المنصة: {new Date(p.lastActive).toLocaleString('ar-EG')}</span>
            </p>
          )}
        </section>
      )}

      {/* TAB 2: RESULTS */}
      {activeTab === 'results' && (
        <section className="panel bg-[#0f1b2d] border border-blue-500/20 space-y-4">
          <h2 className="text-lg font-extrabold text-white mb-3">سجل نتائج الامتحانات والتصحيح</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {parentData.results.length ? (
              parentData.results.map((r) => (
                <div key={r.id} className="card bg-[#111f36] border border-blue-500/15 p-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{r.examTitle}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {new Date(r.created).toLocaleDateString('ar-EG')}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-extrabold text-cyan-300">
                      {r.score !== null ? `${r.score} / ${r.total}` : 'بانتظار التصحيح'}
                    </p>
                    {r.label && (
                      <span className="text-[11px] font-bold text-emerald-400 block mt-0.5">{r.label}</span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400">لا توجد نتائج امتحانات مرسلة حتى الآن.</p>
            )}
          </div>
        </section>
      )}

      {/* TAB 3: ATTENDANCE QR CODE */}
      {activeTab === 'attendance' && (
        <section className="panel bg-[#0f1b2d] border border-blue-500/20 space-y-4 text-center">
          <h2 className="text-lg font-extrabold text-white">كود وسجل حضور السنتر المباشر</h2>
          <p className="text-xs text-slate-300 max-w-md mx-auto">
            يمكن لطفلك إبراز كود الحضور أو الـ QR Code عند دخول السنتر لتسجيل الحضور آلياً.
          </p>

          <div className="bg-[#111f36] border border-cyan-400/40 rounded-xl p-4 inline-block mx-auto">
            <span className="font-mono text-2xl font-black text-cyan-300 tracking-wider">
              {parentData.name} (الصف: {parentData.grade})
            </span>
          </div>

          <div className="flex justify-center my-3">
            <div className="bg-white p-3 rounded-2xl shadow-xl border-2 border-slate-700 inline-block">
              <div className="w-32 h-32 bg-slate-900 grid grid-cols-6 gap-1 p-2 rounded">
                {Array.from({ length: 36 }).map((_, i) => (
                  <div
                    key={i}
                    className={`${
                      (i * 7 + 3) % 2 === 0 || i % 5 === 0 || i < 6 || i > 30 ? 'bg-white' : 'bg-black'
                    } rounded-[2px]`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-slate-800 font-bold mt-1 text-center">كود الطالب المسجل</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="btn-primary btn-sm mx-auto inline-flex items-center gap-1.5 font-bold"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة بطاقة الحضور</span>
          </button>
        </section>
      )}

      {/* TAB 4: GOOGLE MEET LIVE ATTENDANCE LOGS */}
      {activeTab === 'meetAttendance' && (
        <section className="panel bg-[#0f1b2d] border border-cyan-500/30 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-cyan-500/20">
            <div>
              <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
                <span>سجل حضور الطالب في جلسات البث المباشر (Google Meet)</span>
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                موثق آلياً من الخادم فور ضغط ابنك على رابط البث المباشر المتاح على المنصة.
              </p>
            </div>
            <button
              onClick={fetchLiveLogs}
              className="btn-cyan btn-sm text-xs font-bold"
            >
              {liveLoading ? 'جاري التحميل...' : 'تحديث السجل'}
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {liveLogs.length ? (
              liveLogs.map((log) => (
                <div key={log.id} className="card bg-[#111f36] border border-cyan-500/20 p-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="font-extrabold text-sm text-white">{log.sessionTitle || 'بث مباشر'}</h3>
                    <p className="text-xs text-slate-400 mt-1 font-mono">
                      📅 الموعد: {new Date(log.joinedAt).toLocaleString('ar-EG')}
                    </p>
                  </div>
                  <div className="text-left">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                      {log.status || 'حاضر آلياً'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 col-span-2 py-4">
                لا توجد سجلات حضور للبث المباشر مسجلة حتى الآن لابنك. عند مشاركة ابنك في أي حلقة بث مباشر عبر المنصة، سيظهر السجل والتاريخ هنا فوراً.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
};
