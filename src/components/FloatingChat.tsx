import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Phone,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { apiRequest, tokens } from '../services/api';
import { StudentProfile, ParentData } from '../types';

interface FloatingChatProps {
  studentProfile?: StudentProfile;
  parentData?: ParentData | null;
  onRefreshParent?: () => Promise<void>;
}

interface ChatMessage {
  id: string;
  name?: string;
  senderName?: string;
  senderRole?: string;
  text: string;
  reply?: string;
  created: string;
}

export const FloatingChat: React.FC<FloatingChatProps> = ({
  studentProfile,
  parentData,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Form states for guest / initial user
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'طالب' | 'ولي أمر'>('طالب');
  const [text, setText] = useState('');
  const [sendSuccess, setSendSuccess] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-fill if student or parent is logged in
  useEffect(() => {
    if (studentProfile) {
      setName(studentProfile.name || '');
      setPhone(studentProfile.phone || '');
      setRole('طالب');
    } else if (parentData) {
      setName(parentData.name || '');
      setRole('ولي أمر');
    } else {
      try {
        const savedName = localStorage.getItem('chat_sender_name');
        const savedPhone = localStorage.getItem('chat_sender_phone');
        if (savedName) setName(savedName);
        if (savedPhone) setPhone(savedPhone);
      } catch {}
    }
  }, [studentProfile, parentData]);

  // Load conversation messages
  const loadMessages = async () => {
    try {
      setLoading(true);
      const currentPhone = phone || studentProfile?.phone || '';
      const params = new URLSearchParams();
      if (currentPhone) params.append('phone', currentPhone);
      if (studentProfile?.code) params.append('studentId', studentProfile.code);

      const res = await apiRequest<{ messages: ChatMessage[] }>(
        'public',
        `/api/support/messages?${params.toString()}`
      );
      if (res && Array.isArray(res.messages)) {
        setMessages(res.messages);
      }
    } catch (e) {
      // ignore silently
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 8000);
      return () => clearInterval(interval);
    }
  }, [isOpen, phone, studentProfile]);

  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setSending(true);
    try {
      // Save sender contact for future visits
      if (!studentProfile && !parentData) {
        try {
          if (name) localStorage.setItem('chat_sender_name', name);
          if (phone) localStorage.setItem('chat_sender_phone', phone);
        } catch {}
      }

      await apiRequest('public', '/api/support/message', {
        name: name || (studentProfile?.name || 'طالب'),
        phone: phone || (studentProfile?.phone || ''),
        role: studentProfile ? 'طالب' : parentData ? 'ولي أمر' : role,
        text: text.trim(),
      });

      setText('');
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      await loadMessages();
    } catch (err: any) {
      alert(err.message || 'تعذر إرسال الرسالة، يرجى المحاولة لاحقاً');
    } finally {
      setSending(false);
    }
  };

  const hasReplies = messages.some((m) => m.reply && m.reply.trim().length > 0);

  return (
    <>
      {/* Floating Action Trigger Button */}
      <div className="fixed bottom-5 left-5 z-50">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="مراسلة المعلم والإدارة"
          className="relative group flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 via-cyan-600 to-cyan-400 text-white shadow-2xl shadow-cyan-500/40 hover:shadow-cyan-400/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 cursor-pointer"
        >
          {isOpen ? (
            <X className="w-6 h-6 transition-transform duration-200" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6 animate-pulse" />
              {/* Notification dot if there's a reply */}
              {hasReplies && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-[#091222]"></span>
                </span>
              )}
            </>
          )}

          {/* Tooltip hint on hover */}
          {!isOpen && (
            <span className="absolute left-16 top-1/2 -translate-y-1/2 whitespace-nowrap px-3 py-1.5 rounded-xl bg-[#091222]/95 border border-cyan-500/30 text-cyan-200 text-xs font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              رسالة للمعلم فى لوحة الأدمن 💬
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer / Modal */}
      {isOpen && (
        <div
          dir="rtl"
          className="fixed bottom-22 left-5 z-50 w-[92vw] sm:w-[390px] max-h-[82vh] h-[540px] rounded-2xl flex flex-col bg-[#0b1628] border border-blue-500/30 shadow-2xl overflow-hidden backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 duration-200"
          style={{
            boxShadow: '0 25px 60px -15px rgba(2, 6, 23, 0.9), 0 0 25px rgba(6, 182, 212, 0.15)',
          }}
        >
          {/* Header */}
          <div className="px-4 py-3.5 bg-gradient-to-r from-[#0f213d] to-[#0a1526] border-b border-blue-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  <span>مراسلة المعلم / لوحة الأدمن</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                </h3>
                <p className="text-[11px] text-cyan-300/80 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>تصل رسالتك مباشرة إلى لوحة تحكم المعلم</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 bg-[#08101e]/60 text-xs">
            {/* Intro Welcome Card */}
            <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-500/20 text-slate-300 text-[11px] leading-relaxed">
              <span className="font-bold text-cyan-300">أهلاً بك!</span> أرسل استفسارك، طلب كود التفعيل،
              أو أي ملاحظة للمعلم. ستصل رسالتك فوراً داخل لوحة الأدمن وسيقوم المعلم بالرد عليك هنا.
            </div>

            {/* Conversation History */}
            {messages.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                {loading ? 'جاري تحميل الرسائل...' : 'لا توجد رسائل سابقة حتى الآن. ابدأ بكتابة رسالتك أدناه!'}
              </div>
            ) : (
              messages.map((m) => (
                <div key={m.id} className="space-y-2">
                  {/* Outgoing Message from Student/Parent */}
                  <div className="flex flex-col items-start">
                    <div className="max-w-[88%] rounded-2xl rounded-tr-sm bg-[#12243d] border border-blue-500/25 p-2.5 text-slate-200">
                      <div className="flex items-center gap-1.5 text-[10px] text-cyan-300 font-bold mb-1">
                        <User className="w-3 h-3" />
                        <span>{m.senderName || m.name || 'أنت'}</span>
                        <span className="text-slate-400 font-normal">
                          {new Date(m.created).toLocaleTimeString('ar-EG', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    </div>
                  </div>

                  {/* Teacher Reply */}
                  {m.reply && m.reply.trim().length > 0 && (
                    <div className="flex flex-col items-end">
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gradient-to-r from-emerald-950/70 to-[#0e2729] border border-emerald-500/35 p-2.5 text-emerald-100 shadow-md">
                        <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 font-bold mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رد المعلم (الأدمن):</span>
                        </div>
                        <p className="text-xs leading-relaxed whitespace-pre-wrap">{m.reply}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Success Banner */}
          {sendSuccess && (
            <div className="px-3 py-1.5 bg-emerald-950/80 border-t border-emerald-500/40 text-emerald-300 text-[11px] font-bold text-center">
              ✓ تم إرسال رسالتك للمعلم بنجاح!
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-[#0a1424] border-t border-blue-500/20 space-y-2"
          >
            {/* Show Sender Info Inputs only if not authenticated */}
            {!studentProfile && !parentData && (
              <div className="grid grid-cols-2 gap-2 pb-1">
                <input
                  type="text"
                  required
                  placeholder="اسمك بالكامل"
                  className="input-field text-xs py-1.5 px-2.5 bg-[#070e1a] border-blue-500/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  type="text"
                  dir="ltr"
                  required
                  placeholder="رقم الهاتف للتواصل"
                  className="input-field text-xs py-1.5 px-2.5 bg-[#070e1a] border-blue-500/20"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            )}

            <div className="flex items-end gap-2">
              <textarea
                required
                rows={2}
                placeholder="اكتب رسالتك أو استفسارك هنا..."
                className="input-field flex-1 text-xs py-2 px-2.5 bg-[#070e1a] border-blue-500/30 resize-none"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="btn-primary py-2.5 px-3.5 rounded-xl flex items-center justify-center disabled:opacity-50 cursor-pointer h-[52px]"
                title="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
};
