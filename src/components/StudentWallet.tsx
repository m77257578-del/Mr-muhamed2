import React, { useState } from 'react';
import { StudentProfile, WalletTransaction, ManualGateway } from '../types';
import { apiRequest } from '../services/api';
import {
  Wallet,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Upload,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Eye,
  X,
  CreditCard,
  Copy,
  Check,
} from 'lucide-react';

interface StudentWalletProps {
  profile: StudentProfile;
  transactions?: WalletTransaction[];
  gateways?: ManualGateway[];
  onRefresh: () => Promise<void>;
}

export const StudentWallet: React.FC<StudentWalletProps> = ({
  profile,
  transactions = [],
  gateways = [],
  onRefresh,
}) => {
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState<number>(100);
  const [depositNotes, setDepositNotes] = useState('');
  const [depositReceiptFile, setDepositReceiptFile] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositStatus, setDepositStatus] = useState<{ msg: string; ok: boolean } | null>(null);

  const [filterType, setFilterType] = useState<'all' | 'deposit' | 'purchase' | 'adjustment'>('all');
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState<string | null>(null);
  const [copiedAccount, setCopiedAccount] = useState<string | null>(null);

  // Hidden Cashier Mode state
  const [isCashierUnlocked, setIsCashierUnlocked] = useState(() => {
    try {
      return localStorage.getItem('cashier_unlocked') === 'true';
    } catch {
      return false;
    }
  });
  const [cashierKeyInput, setCashierKeyInput] = useState('');
  const [cashierStatus, setCashierStatus] = useState<string | null>(null);
  const [showCashierInput, setShowCashierInput] = useState(false);
  const [clickCount, setClickCount] = useState(0);

  const handleCashierUnlock = async () => {
    try {
      const res = await apiRequest('student', '/api/student/cashier-unlock', { key: cashierKeyInput });
      if (res.ok) {
        setIsCashierUnlocked(true);
        localStorage.setItem('cashier_unlocked', 'true');
        setCashierStatus(null);
        setShowCashierInput(false);
      }
    } catch (err: any) {
      setCashierStatus(err.message || 'الكود غير صحيح');
    }
  };

  const handleTitleClick = () => {
    const next = clickCount + 1;
    setClickCount(next);
    if (next >= 5) {
      setShowCashierInput(true);
      setClickCount(0);
    }
  };

  const balance = profile.walletBalance || 0;

  const handleCopyAccount = (acc: string) => {
    navigator.clipboard.writeText(acc);
    setCopiedAccount(acc);
    setTimeout(() => setCopiedAccount(null), 2000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await fetch('/api/upload', {
        method: 'PUT',
        body: file,
      });
      if (!res.ok) throw new Error('فشل رفع صورة الإيصال');
      const data = await res.json();
      setDepositReceiptFile(data.fileId);
      alert('تم مرفق صورة الإيصال بنجاح!');
    } catch (err: any) {
      alert(err.message || 'خطأ في رفع الملف');
    }
  };

  const handleDepositSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositAmount || depositAmount <= 0) {
      setDepositStatus({ msg: 'يرجى إدخال مبلغ صحيح لشحن الرصيد', ok: false });
      return;
    }
    setDepositLoading(true);
    setDepositStatus(null);
    try {
      await apiRequest('student', '/api/student/wallet-deposit', {
        amount: depositAmount,
        notes: depositNotes,
        receiptFile: depositReceiptFile,
      });
      setDepositStatus({ msg: 'تم إرسال طلب الشحن بنجاح! سيتم المراجعة وإضافة الرصيد فوراً.', ok: true });
      setDepositNotes('');
      setDepositReceiptFile('');
      setShowDepositModal(false);
      await onRefresh();
    } catch (err: any) {
      setDepositStatus({ msg: err.message || 'فشل إرسال طلب الشحن', ok: false });
    } finally {
      setDepositLoading(false);
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (filterType === 'all') return true;
    return tx.type === filterType;
  });

  return (
    <div className="space-y-6">
      {/* Wallet Balance Header Banner */}
      <div className="card bg-gradient-to-br from-[#0c2340] via-[#0f1b2d] to-[#112a46] border border-cyan-500/30 p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-500" />
        <div className="flex flex-wrap items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span 
                className="badge-pill bg-cyan-950/60 text-cyan-300 border-cyan-400/30 cursor-pointer select-none"
                onClick={handleTitleClick}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>محفظتي الإلكترونية</span>
              </span>
              {isCashierUnlocked && (
                <span className="badge-pill bg-emerald-950/60 text-emerald-300 border-emerald-500/30">
                  آمن ومباشر
                </span>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">رصيد حسابك الحالي</h2>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-black text-cyan-300 tracking-tight">
                {balance.toLocaleString('ar-EG')}
              </span>
              <span className="text-lg font-bold text-slate-300">جنيه مصري</span>
            </div>
            <p className="text-xs text-slate-400">
              يمكنك استخدام رصيد المحفظة لشراء وتفعيل الكورسات والباقات دون الحاجة لإدخال بيانات كل مرة.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            {isCashierUnlocked && (
              <button
                type="button"
                onClick={() => setShowDepositModal(true)}
                className="btn-gold py-3.5 px-6 font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-105 transition-transform"
              >
                <PlusCircle className="w-5 h-5" />
                <span>شحن رصيد المحفظة الآن</span>
              </button>
            )}
            {showCashierInput && (
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder="كود التفعيل"
                  className="input-field text-xs w-32"
                  value={cashierKeyInput}
                  onChange={(e) => setCashierKeyInput(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleCashierUnlock}
                  className="btn-cyan btn-sm text-[11px]"
                >
                  تفعيل
                </button>
              </div>
            )}
            {cashierStatus && <p className="text-[10px] text-red-400">{cashierStatus}</p>}
            <button
              type="button"
              onClick={() => onRefresh()}
              className="btn-gray py-3.5 px-4 font-bold text-xs flex items-center justify-center gap-2"
              title="تحديث الرصيد والسجل"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>تحديث البيانات</span>
            </button>
          </div>
        </div>
      </div>

      {/* Payment Gateways Guidelines Section */}
      {isCashierUnlocked && gateways.length > 0 && (
        <div className="panel bg-[#0f1b2d] border border-blue-500/20 space-y-4">
          <div className="flex items-center gap-2 border-b border-blue-500/15 pb-2">
            <CreditCard className="w-5 h-5 text-amber-400" />
            <h3 className="font-extrabold text-lg text-white">بيانات وطرق التحويل المتاحة لشحن المحفظة</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {gateways.map((gw) => (
              <div key={gw.id} className="card bg-[#111f36] border border-blue-500/20 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-cyan-300 text-sm">{gw.title}</h4>
                  <span className="text-[11px] font-mono bg-blue-950/60 text-cyan-300 px-2 py-0.5 rounded border border-blue-500/30">
                    {gw.provider}
                  </span>
                </div>
                <div className="bg-[#0a1322] p-2.5 rounded-lg flex items-center justify-between border border-blue-500/15">
                  <span dir="ltr" className="font-mono text-base font-black text-white">
                    {gw.accountNumber}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopyAccount(gw.accountNumber)}
                    className="text-xs font-bold text-cyan-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedAccount === gw.accountNumber ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الرقم</span>
                      </>
                    )}
                  </button>
                </div>
                {gw.accountHolder && (
                  <p className="text-xs text-slate-300">
                    باسم: <b>{gw.accountHolder}</b>
                  </p>
                )}
                {gw.instructions && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{gw.instructions}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History Table */}
      <div className="panel bg-[#0f1b2d] border border-blue-500/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-500/15 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-lg text-white">جدول العمليات والحركات السابقة</h3>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {[
              ['all', 'جميع العمليات'],
              ['deposit', 'إيداع وشحن'],
              ['purchase', 'خصم وشراء'],
              ['adjustment', 'تعديل وتسويه'],
            ].map(([k, label]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilterType(k as any)}
                className={`btn-sm text-xs font-bold ${
                  filterType === k ? 'btn-primary' : 'btn-gray'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs text-slate-200">
              <thead className="bg-[#111f36] text-cyan-300 font-extrabold border-b border-blue-500/20">
                <tr>
                  <th className="p-3">رقم العملية</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3">المبلغ</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">التاريخ والوقت</th>
                  <th className="p-3">ملاحظات والتفاصيل</th>
                  <th className="p-3 text-center">الإيصال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-blue-500/10">
                {filteredTransactions.map((tx) => {
                  const isDeposit = tx.type === 'deposit';
                  const isPurchase = tx.type === 'purchase';

                  return (
                    <tr key={tx.id} className="hover:bg-[#111f36]/60 transition-colors">
                      <td className="p-3 font-mono text-cyan-300 font-bold">{tx.id}</td>
                      <td className="p-3">
                        <span className="flex items-center gap-1.5 font-bold">
                          {isDeposit ? (
                            <>
                              <ArrowDownLeft className="w-4 h-4 text-emerald-400" />
                              <span className="text-emerald-400">إيداع رصيد</span>
                            </>
                          ) : isPurchase ? (
                            <>
                              <ArrowUpRight className="w-4 h-4 text-amber-400" />
                              <span className="text-amber-400">شراء وتفعيل</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4 text-cyan-400" />
                              <span className="text-cyan-400">تعديل إدارة</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3 font-extrabold text-sm">
                        <span className={isDeposit ? 'text-emerald-400' : 'text-amber-400'}>
                          {isDeposit ? '+' : '-'}{tx.amount} جنيه
                        </span>
                      </td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            tx.status === 'approved'
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-500/30'
                              : tx.status === 'rejected'
                              ? 'bg-red-950/70 text-red-300 border border-red-500/30'
                              : 'bg-amber-950/70 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {tx.status === 'approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                          {tx.status === 'rejected' && <XCircle className="w-3.5 h-3.5" />}
                          {tx.status === 'pending' && <AlertCircle className="w-3.5 h-3.5" />}
                          <span>
                            {tx.status === 'approved'
                              ? 'مقبول ومضاف'
                              : tx.status === 'rejected'
                              ? 'مرفوض'
                              : 'قيد المراجعة'}
                          </span>
                        </span>
                      </td>
                      <td className="p-3 text-slate-400">
                        {new Date(tx.created).toLocaleDateString('ar-EG', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="p-3 text-slate-300 max-w-xs truncate">
                        {tx.courseTitle ? `شراء: ${tx.courseTitle}` : tx.notes || tx.rejectionReason || '—'}
                      </td>
                      <td className="p-3 text-center">
                        {tx.receiptFile ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceiptUrl(`/receipts/${tx.receiptFile}`)}
                            className="btn-cyan btn-sm text-[11px] inline-flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>عرض</span>
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[11px]">بدون إيصال</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card bg-[#111f36] text-center p-8 space-y-2 border border-blue-500/15">
            <FileText className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-sm font-bold text-slate-300">لا توجد عمليات سابقة في هذا التصنيف.</p>
            <p className="text-xs text-slate-400">
              اضغط على زر "شحن رصيد المحفظة الآن" لبدء عملية شحن جديدة.
            </p>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0f1b2d] border border-cyan-500/40 rounded-2xl p-6 max-w-lg w-full space-y-5 shadow-2xl text-right relative">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-3">
              <div className="flex items-center gap-2">
                <PlusCircle className="w-6 h-6 text-cyan-400" />
                <h3 className="font-black text-lg text-white">طلب شحن رصيد المحفظة</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDepositModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  المبلغ المطلوب شحنه (بالجنيه المصري)
                </label>
                <input
                  type="number"
                  min="10"
                  step="5"
                  required
                  className="input-field text-base font-bold text-cyan-300"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  ملاحظات أو تفاصيل التحويل (اختياري)
                </label>
                <textarea
                  rows={2}
                  className="input-field text-xs"
                  placeholder="مثال: تم التحويل من رقم فودافون كاش 010xxxxx..."
                  value={depositNotes}
                  onChange={(e) => setDepositNotes(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1">
                  صورة إيصال التحويل (إجباري لتأكيد الشحن)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  className="input-field text-xs cursor-pointer file:bg-blue-600 file:text-white file:border-0 file:rounded-lg file:px-3 file:py-1 file:cursor-pointer"
                  onChange={handleFileUpload}
                />
                {depositReceiptFile && (
                  <p className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>تم مرفق صورة الإيصال بنجاح.</span>
                  </p>
                )}
              </div>

              <div className="bg-[#111f36] p-3 rounded-xl border border-blue-500/20 text-xs text-slate-300 space-y-1">
                <p className="font-bold text-cyan-300">💡 تنبيه:</p>
                <p>سيقوم فريق الدعم بمراجعة الإيصال وتأكيد إضافة الرصيد لحسابك خلال دقائق معدودة.</p>
              </div>

              {depositStatus && (
                <p
                  className={`text-xs font-bold p-3 rounded-xl ${
                    depositStatus.ok
                      ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                      : 'bg-red-950/60 text-red-300 border border-red-500/30'
                  }`}
                >
                  {depositStatus.msg}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="btn-gray py-2.5 px-4 text-xs font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={depositLoading || !depositReceiptFile}
                  className="btn-gold py-2.5 px-6 text-xs font-black flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>{depositLoading ? 'جاري الإرسال...' : 'إرسال طلب الشحن'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Preview Modal */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#0f1b2d] border border-blue-500/30 rounded-2xl p-4 max-w-xl w-full space-y-3 relative text-right">
            <div className="flex items-center justify-between border-b border-blue-500/20 pb-2">
              <h4 className="font-extrabold text-sm text-white">معاينة صورة إيصال التحويل</h4>
              <button
                type="button"
                onClick={() => setPreviewReceiptUrl(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-hidden rounded-xl bg-black flex items-center justify-center max-h-[70vh]">
              <img
                src={previewReceiptUrl}
                alt="إيصال التحويل"
                className="max-h-[70vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
