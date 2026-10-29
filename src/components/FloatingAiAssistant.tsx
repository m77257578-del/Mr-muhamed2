import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { apiRequest } from '../services/api';

interface FloatingAiAssistantProps {
  role: 'student' | 'parent' | 'teacher';
  isExamActive?: boolean;
  studentName?: string;
}

interface Message {
  role: 'user' | 'model';
  parts: { text: string; inlineData?: any }[];
  groundingMetadata?: any;
  timestamp: string;
}

export const FloatingAiAssistant: React.FC<FloatingAiAssistantProps> = ({
  role,
  isExamActive = false,
  studentName = ''
}) => {
  if (role === 'student' && isExamActive) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages.length > 0) scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    if (messages.length === 0) {
      const greeting = role === 'student' 
        ? `أهلاً بك ${studentName || 'يا بطل'}! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك اليوم؟`
        : role === 'parent'
        ? `مرحباً بك. أنا هنا لمساعدتك في متابعة مستوى ابنك الدراسي.`
        : `مرحباً يا أستاذ. أنا مساعدك الأكاديمي لتجهيز المحتوى والأسئلة.`;
      
      setMessages([{
        role: 'model',
        parts: [{ text: greeting }],
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  }, [role, studentName]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => setSelectedImage(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && !selectedImage) || loading) return;

    const currentText = input.trim();
    const currentImg = selectedImage;
    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const userParts: any[] = [];
    if (currentImg) {
      userParts.push({ 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: currentImg.split(',')[1] 
        } 
      });
    }
    if (currentText) {
      userParts.push({ text: currentText });
    }

    const newMessage: Message = {
      role: 'user',
      parts: userParts,
      timestamp
    };

    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setSelectedImage(null);
    setLoading(true);

    try {
      const endpoint = role === 'student' ? '/api/student/ai-chat' : `/api/${role}/ai-chat`;
      const history = messages.map(m => ({
        role: m.role,
        parts: m.parts.map(p => ({ text: p.text }))
      }));

      const res = await apiRequest<any>(role, endpoint, {
        question: currentText,
        imageBase64: currentImg,
        history,
        isExamActive
      });

      const modelMessage: Message = {
        role: 'model',
        parts: [{ text: res.reply }],
        groundingMetadata: res.groundingMetadata,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, modelMessage]);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        role: 'model',
        parts: [{ text: `عذراً، حدث خطأ: ${err.message}` }],
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-white border border-[#E2E8F0] rounded-full shadow-lg hover:shadow-xl transition-all group"
      >
        <MessageSquare className="w-6 h-6 text-[#0284C7] group-hover:scale-110 transition-transform" />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ease-in-out flex flex-col bg-white border border-[#E2E8F0] shadow-2xl rounded-2xl overflow-hidden
        ${isMinimized 
          ? 'bottom-6 right-6 w-72 h-14' 
          : 'bottom-6 right-6 w-[400px] h-[600px] max-w-[calc(100vw-3rem)] max-h-[calc(100vh-6rem)]'
        }`}
      dir="rtl"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
            <Bot className="w-4 h-4 text-[#0284C7]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#0F172A] leading-tight">AI Study Buddy</h3>
            {!isMinimized && <p className="text-[10px] text-[#64748B]">مساعدك الذكي • متصل بالبحث</p>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1.5 hover:bg-[#F8FAFC] rounded-lg text-[#64748B] transition-colors"
          >
            {isMinimized ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1.5 hover:bg-[#F8FAFC] rounded-lg text-[#64748B] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FFFFFF] scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-start' : 'items-end'}`}>
                <div 
                  className={`max-w-[90%] p-3.5 rounded-xl text-sm leading-relaxed shadow-sm
                    ${m.role === 'user' 
                      ? 'bg-[#0284C7] text-white rounded-tr-none' 
                      : 'bg-[#F8FAFC] text-[#1E293B] border border-[#E2E8F0] rounded-tl-none'
                    }`}
                >
                  {m.parts.map((p, pi) => (
                    <div key={pi}>
                      {p.inlineData && (
                        <img 
                          src={`data:${p.inlineData.mimeType};base64,${p.inlineData.data}`} 
                          className="rounded-lg mb-2 max-w-full" 
                          alt="مرفق" 
                        />
                      )}
                      {p.text && <p className="whitespace-pre-wrap">{p.text}</p>}
                    </div>
                  ))}

                  {/* Grounding Citations */}
                  {m.groundingMetadata?.searchEntryPoint && (
                    <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-2">
                      <div className="flex items-center gap-1 text-[10px] text-[#64748B] font-bold">
                        <Search className="w-3 h-3" />
                        <span>المصادر والبحث:</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {m.groundingMetadata.groundingChunks?.map((chunk: any, ci: number) => (
                          chunk.web?.uri && (
                            <a 
                              key={ci}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#E2E8F0] rounded text-[10px] text-[#0284C7] hover:bg-[#F8FAFC] transition-colors"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              <span className="max-w-[120px] truncate">{chunk.web.title || 'مصدر خارجي'}</span>
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  <span className="block text-[9px] mt-2 opacity-50 text-left">{m.timestamp}</span>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl w-fit">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0284C7]" />
                <span className="text-[11px] text-[#64748B]">جاري التفكير والبحث...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          <div className="px-4 py-2 border-t border-[#E2E8F0] flex gap-2 overflow-x-auto bg-white scrollbar-none">
            {role === 'student' && [
              'اشرح لي قاعدة النحو',
              'كيف أنظم وقتي؟',
              'أريد أسئلة تدريبية'
            ].map(s => (
              <button 
                key={s} 
                onClick={() => setInput(s)}
                className="px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-full text-[10px] text-[#64748B] hover:text-[#0284C7] whitespace-nowrap transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-3 border-t border-[#E2E8F0] bg-white">
            {selectedImage && (
              <div className="relative inline-block mb-2 ml-2">
                <img src={selectedImage} className="w-12 h-12 object-cover rounded border border-[#E2E8F0]" alt="Preview" />
                <button 
                  onClick={() => setSelectedImage(null)}
                  className="absolute -top-1 -right-1 bg-white border border-[#E2E8F0] rounded-full p-0.5 shadow-sm"
                >
                  <X className="w-3 h-3 text-[#EF4444]" />
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
                className="p-2.5 text-[#64748B] hover:text-[#0284C7] hover:bg-[#F8FAFC] rounded-xl transition-all"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اسألني أي شيء..."
                className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-4 py-2.5 text-xs text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#0284C7] transition-all"
              />
              <button 
                type="submit"
                disabled={loading || (!input.trim() && !selectedImage)}
                className="p-2.5 bg-[#0284C7] text-white rounded-xl hover:bg-[#0369A1] disabled:opacity-30 disabled:grayscale transition-all shadow-md active:scale-95"
              >
                <Send className="w-5 h-5 rotate-180" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};
