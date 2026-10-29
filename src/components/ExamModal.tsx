import React, { useState } from 'react';
import { Exam } from '../types';
import { apiRequest } from '../services/api';
import { X, CheckCircle, AlertCircle, Send } from 'lucide-react';

interface ExamModalProps {
  exam: Exam;
  onClose: () => void;
  onSuccess: (score: number | null, total: number) => void;
}

const LETTERS = ['أ', 'ب', 'ج', 'د'];

export const ExamModal: React.FC<ExamModalProps> = ({ exam, onClose, onSuccess }) => {
  const [answers, setAnswers] = useState<string[]>(
    new Array(exam.questions.length).fill('')
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const getQuestionKind = (index: number) => {
    if (exam.kinds && exam.kinds[index]) return exam.kinds[index];
    return exam.type === 'اختياري' ? 'mcq' : 'essay';
  };

  const handleAnswerChange = (index: number, val: string) => {
    const next = [...answers];
    next[index] = val;
    setAnswers(next);
  };

  const [notebookImage, setNotebookImage] = useState<string | null>(null);
  const [aiReport, setAiReport] = useState<any>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNotebookImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!notebookImage) {
      const emptyIndex = answers.findIndex(a => !a || !a.trim());
      if (emptyIndex !== -1) {
        setError(`من فضلك أجب عن السؤال رقم ${emptyIndex + 1} أو ارفع صورة كراسة الواجب والحل.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      // Use AI Auto-Grader with Gemini Keys Rotator (System 12 & 13)
      const res = await apiRequest('student', '/api/student/exam/ai-grade', {
        examId: exam.id,
        answers,
        notebookImageBase64: notebookImage,
      });

      if (res.result) {
        setAiReport(res.result);
      }
      setTimeout(() => {
        onSuccess(res.result?.score ?? null, res.result?.total ?? exam.questions.length);
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء تصحيح الامتحان');
      setSubmitting(false);
    }
  };

  if (aiReport) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6 bg-black/80 backdrop-blur-md" dir="rtl">
        <div className="w-full max-w-2xl bg-[#0c1626] border border-cyan-400 rounded-3xl p-6 sm:p-8 text-white shadow-2xl text-center animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto mb-4 border border-cyan-400/40">
            <CheckCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-cyan-300">تم التصحيح الفوري بالذكاء الاصطناعي بنجاح!</h2>
          <p className="text-sm text-slate-300 mt-1">امتحان: {exam.title}</p>

          <div className="my-6 p-4 rounded-2xl bg-[#13233c] border border-slate-700 inline-block">
            <span className="text-xs text-slate-400 block mb-1">الدرجة المحتسبة</span>
            <span className="text-4xl font-black text-amber-400">{aiReport.score}</span>
            <span className="text-lg text-slate-400"> / {aiReport.total}</span>
            <span className="mr-2 text-sm font-bold text-cyan-300">({aiReport.label})</span>
          </div>

          <div className="bg-[#0f1b2d] border border-slate-800 rounded-2xl p-4 text-right mb-6 text-xs sm:text-sm text-slate-200 leading-relaxed max-h-48 overflow-y-auto">
            <h4 className="font-extrabold text-cyan-400 mb-2 flex items-center gap-1.5">
              <span>📋 التقرير التوجيهي لتصحيح إجاباتك:</span>
            </h4>
            <p className="whitespace-pre-wrap">{aiReport.feedback}</p>
          </div>

          <p className="text-xs text-emerald-400 mb-4">
            📲 تم إرسال نتيجة هذا التقرير تلقائياً عبر الواتساب لولي الأمر والطالب وتصديرها لصفحة النتائج.
          </p>

          <button
            onClick={() => onSuccess(aiReport.score, aiReport.total)}
            className="btn-primary w-full py-3 text-sm font-black"
          >
            إغلاق وعرض النتيجة في لوحة التحكم
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 sm:p-6"
      style={{ background: 'rgba(12, 22, 38, 0.92)' }}
      dir="rtl"
    >
      <div className="panel my-auto w-full max-w-3xl overflow-hidden shadow-2xl bg-[#0c1626] border border-blue-500/30 text-white">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-cyan-300 sm:text-2xl">
              {exam.title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {exam.type} • {exam.questions.length} سؤال • مدعوم بالتصحيح التلقائي الفوري
            </p>
          </div>
          <button
            className="btn-gray btn-sm flex items-center gap-1 text-xs"
            type="button"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
            <span>إغلاق</span>
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-red-950/60 border border-red-500/40 p-3 text-xs sm:text-sm font-bold text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Notebook / Homework Image Option */}
        <div className="mt-4 p-3 rounded-2xl bg-[#111f36] border border-cyan-500/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h4 className="text-xs font-bold text-cyan-300">📸 هل قمت بحل الامتحان في كراستك أو دفتر الواجب؟</h4>
            <p className="text-[11px] text-slate-400">يمكنك رفع صورة كراسة الحل مباشرة وسيقوم الذكاء الاصطناعي بتصحيحها فوراً ومقارنتها بنموذج الإجابة.</p>
          </div>
          <label className="btn-secondary btn-sm flex items-center gap-2 cursor-pointer text-xs shrink-0">
            <span>{notebookImage ? 'تغيير صورة الكراسة ✓' : 'رفع صورة الحل'}</span>
            <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          </label>
        </div>

        {notebookImage && (
          <div className="mt-2 p-2 bg-[#0a1220] rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold">✓ تم إرفاق صورة الحل بنجاح</span>
            <button onClick={() => setNotebookImage(null)} className="text-xs text-red-400 hover:underline">إلغاء الصورة</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[60vh] overflow-y-auto px-1">
          {exam.questions.map((q, i) => {
            const qText = typeof q === 'string' ? q : q.text || '';
            const kind = getQuestionKind(i);
            const opts = exam.options?.[i] || [];

            return (
              <div key={i} className="card bg-[#111f36] border border-slate-700/60">
                <p className="font-bold text-white text-sm">
                  {i + 1}. {qText}
                </p>

                {kind === 'mcq' ? (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    {LETTERS.map((letter, optIndex) => {
                      const optLabel = opts[optIndex] || '';
                      const isSelected = answers[i] === letter;
                      return (
                        <label
                          key={letter}
                          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-colors text-xs sm:text-sm ${
                            isSelected
                              ? 'border-cyan-400 bg-cyan-950/40 font-bold text-cyan-300'
                              : 'border-slate-700 hover:bg-slate-800/60 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`q_${i}`}
                            value={letter}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(i, letter)}
                            className="text-cyan-400 focus:ring-cyan-400"
                          />
                          <span>
                            {letter}) {optLabel}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                ) : (
                  <textarea
                    rows={3}
                    className="input-field mt-3 bg-[#0a1220] border-slate-700 text-white text-xs sm:text-sm"
                    placeholder="اكتب إجابتك هنا بالتفصيل (أو ارفع صورة كراسة الحل بالأعلى)..."
                    value={answers[i]}
                    onChange={(e) => handleAnswerChange(i, e.target.value)}
                  />
                )}
              </div>
            );
          })}

          <div className="pt-2 sticky bottom-0 bg-[#0c1626] pb-1">
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3.5 text-base font-black shadow-xl"
            >
              <Send className="w-5 h-5 rotate-180" />
              <span>{submitting ? 'جاري التصحيح الفوري بواسطة الذكاء الاصطناعي...' : 'تسليم الامتحان والتصحيح التلقائي الفوري ⚡'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
