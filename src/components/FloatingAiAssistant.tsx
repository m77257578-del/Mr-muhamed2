import React, { useState, useRef } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Upload,
  Image as ImageIcon,
  Paperclip,
  RotateCcw,
  ShieldAlert,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface FloatingAiAssistantProps {
  role: 'student' | 'parent' | 'teacher';
  isExamActive?: boolean; // Strictly hides and disables assistant during student exam
  studentName?: string;
}

interface Message {
  sender: 'user' | 'assistant';
  text: string;
  image?: string;
  timestamp: string;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  role,
  isExamActive = false,
  studentName = ''
}) => {
  // Anti-cheat rule: If student is taking an exam, completely hide and close the assistant
  if (role === 'student' && isExamActive) {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitialGreeting = () => {
    if (role === 'student') {
      return `مرحباً ${studentName || 'يا بطل'}! 🌟 أنا مساعدك الذكي في منصة ليرن ويب. يمكنك سؤالي عن أي درس أو قاعدة نحوية، أو التقاط صورة لواجبك وسؤالك لمساعدتك في حله خطوة بخطوة.`;
    }
    if (role === 'parent') {
      return `أهلاً بحضرتك يا فندم! 🤝 أنا المستشار الأكاديمي الذكي لأولياء الأمور. أستطيع مساعدتك في تحليل درجات ابنك، معرفة مستواه الدراسي ونقاط القوة والضعف، واقتراح جدول مذاكرة منزلي مناسب.`;
    }
    return `مرحباً يا أستاذنا العزيز! 👨‍🏫 أنا مساعدك الذكي في إدارة المنصة والمحتوى. يمكنك أن تطلب مني توليد أسئلة امتحانات مقالية أو اختيارية بنماذج إجاباتها، أو صياغة إعلانات وتلخيصات دراسية.`;
  };

  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'assistant',
      text: getInitialGreeting(),
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const currentText = input.trim();
    const currentImg = selectedImage;

    const newMsg: Message = {
      sender: 'user',
      text: currentText,
      image: currentImg || undefined,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const endpoint =
        role === 'student'
          ? '/api/student/ai-chat'
          : role === 'parent'
          ? '/api/parent/ai-chat'
          : '/api/teacher/ai-chat';

      const res = await apiRequest<any>(role, endpoint, {
        question: currentText,
        imageBase64: currentImg,
        isExamActive: role === 'student' ? isExamActive : false
      });

      const replyMsg: Message = {
        sender: 'assistant',
        text: res.reply || 'تمت معالجة استفسارك بنجاح.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, replyMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'assistant',
          text: err.message || 'حدث خطأ مؤقت في التواصل مع المساعد الذكي، تم تدوير المفتاح وتكرار المحاولة.',
          timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const titleText =
    role === 'student'
      ? 'المساعد الذكي للطلاب'
      : role === 'parent'
      ? 'المستشار الذكي لولي الأمر'
      : 'المساعد الأكاديمي للمعلم';

  const badgeColor =
    role === 'student'
      ? 'from-cyan-500 to-blue-600'
      : role === 'parent'
      ? 'from-emerald-500 to-teal-600'
      : 'from-amber-500 to-indigo-600';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        type="button"
        title={titleText}
        className={`fixed bottom-24 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-full shadow-2xl bg-gradient-to-r ${badgeColor} text-white font-black text-sm tracking-wide hover:scale-105 active:scale-95 transition-all border border-white/20`}
        style={{ boxShadow: '0 8px 30px rgba(6, 182, 212, 0.4)' }}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
        </span>
        <Bot className="w-5 h-5 animate-pulse" />
        <span className="hidden sm:inline">{titleText}</span>
      </button>

      {/* Assistant Modal / Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-end p-2 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            className="w-full sm:w-[440px] max-h-[90vh] h-[650px] bg-[#0c1626] border border-cyan-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-right"
            dir="rtl"
          >
            {/* Header */}
            <div className={`p-4 bg-gradient-to-r ${badgeColor} text-white flex items-center justify-between shadow-md`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base leading-tight flex items-center gap-1.5">
                    {titleText}
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </h3>
                  <p className="text-[11px] text-white/80 font-medium">
                    مدعوم بنظام تدوير مفاتيح Gemini 1.5 Flash الفورية
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center transition-colors text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Strict Anti-Cheat notice in Student mode */}
            {role === 'student' && (
              <div className="bg-amber-950/40 border-b border-amber-500/30 px-3 py-1.5 flex items-center gap-2 text-amber-300 text-[11px]">
                <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                <span>حماية الامتحانات مفعلة: يتم حجب المساعد تلقائياً فور دخولك أي امتحان.</span>
              </div>
            )}

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-700">
              {messages.map((m, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${m.sender === 'user' ? 'items-start' : 'items-end'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-cyan-600 text-white rounded-tr-none'
                        : 'bg-[#13233c] text-slate-100 border border-slate-700/60 rounded-tl-none shadow-md'
                    }`}
                  >
                    {m.image && (
                      <img
                        src={m.image}
                        alt="مرفق"
                        className="rounded-xl mb-2 max-h-48 w-full object-cover border border-white/20"
                      />
                    )}
                    <p className="whitespace-pre-wrap">{m.text}</p>
                    <span className="block text-[10px] mt-1.5 opacity-60 text-left">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-cyan-400 text-xs bg-[#13233c] p-3 rounded-2xl w-fit">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>جاري التحليل وتوليد الإجابة النموذجية...</span>
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div className="px-3 py-2 bg-[#0a1220] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto text-[11px] whitespace-nowrap scrollbar-none">
              {role === 'student' && (
                <>
                  <button
                    onClick={() => setInput('اشرح لي أسلوب الشرط وأركانه بإيجاز مع أمثلة.')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                  >
                    💡 شرح أسلوب الشرط
                  </button>
                  <button
                    onClick={() => setInput('كيف أفرق بين همزة الوصل وهمزة القطع بسهولة؟')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                  >
                    ❓ همزة الوصل والقطع
                  </button>
                </>
              )}
              {role === 'parent' && (
                <>
                  <button
                    onClick={() => setInput('كيف أساعد ابني في تحسين درجاته وتنظيم وقت المذاكرة؟')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                  >
                    📊 نصائح رفع الدرجات
                  </button>
                  <button
                    onClick={() => setInput('ما هي أفضل طريقة لمراجعة ليلة الامتحان؟')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-emerald-300 transition-colors"
                  >
                    ⏱️ جدول ليلة الامتحان
                  </button>
                </>
              )}
              {role === 'teacher' && (
                <>
                  <button
                    onClick={() => setInput('اقترح 5 أسئلة اختيارية مع نموذج الإجابة لدرس النحو للصف الثالث الثانوي.')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                  >
                    📝 توليد أسئلة امتحان
                  </button>
                  <button
                    onClick={() => setInput('صغ إعلاناً تشجيعياً للطلاب بمناسبة بداية الدورة التدريبية الجديدة.')}
                    className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 transition-colors"
                  >
                    📢 صياغة إعلان كورس
                  </button>
                </>
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-[#0f1b2d] border-t border-slate-800">
              {selectedImage && (
                <div className="relative mb-2 inline-block">
                  <img
                    src={selectedImage}
                    alt="معاينة"
                    className="h-16 w-16 object-cover rounded-xl border border-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImage(null)}
                    className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="رفع صورة لسؤال أو كراسة واجب لمناقشتها"
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 transition-colors"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="اكتب سؤالك أو ارفع صورة لمناقشتها..."
                  className="flex-1 bg-[#0a1220] border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                />

                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !selectedImage)}
                  className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black transition-colors disabled:opacity-40"
                >
                  <Send className="w-5 h-5 rotate-180" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
