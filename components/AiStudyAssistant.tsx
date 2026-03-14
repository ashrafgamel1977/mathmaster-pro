
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Paperclip, MessageSquare, Zap, FileText, Brain, HelpCircle, Loader2 } from 'lucide-react';
import { aiAssistantService, Flashcard } from '../services/aiAssistantService';

interface AiStudyAssistantProps {
  videoId: string;
  videoTitle: string;
  studentPoints: number;
  onClose: () => void;
  isDark?: boolean;
}

const AiStudyAssistant: React.FC<AiStudyAssistantProps> = ({
  videoId,
  videoTitle,
  studentPoints,
  onClose,
  isDark = true
}) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'menu' | 'chat' | 'flashcards' | 'result'>('menu');
  const [resultText, setResultText] = useState('');
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [showFlashcardBack, setShowFlashcardBack] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleAction = async (action: 'summary' | 'explain' | 'flashcards' | 'quiz') => {
    setIsLoading(true);
    setActiveTab('result');
    
    try {
      if (action === 'summary') {
        const res = await aiAssistantService.summarizeVideo(videoId, videoTitle);
        setResultText(res.text);
      } else if (action === 'explain') {
        const res = await aiAssistantService.explainSimply(videoId, 'المفهوم الأساسي في هذا الدرس');
        setResultText(res.text);
      } else if (action === 'flashcards') {
        const cards = await aiAssistantService.generateFlashcards(videoId);
        setFlashcards(cards);
        setActiveTab('flashcards');
        setCurrentFlashcardIdx(0);
        setShowFlashcardBack(false);
      } else if (action === 'quiz') {
        setResultText("جاري تحضير اختبار مخصص لك بناءً على هذا الفيديو... سيتم فتح نافذة الاختبار فور الانتهاء.");
        // In a real app, this would trigger the quiz view
      }
    } catch (error) {
      setResultText("عذراً، حدث خطأ أثناء الاتصال بالخادم الذكي.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setInput('');
    setIsLoading(true);
    setActiveTab('chat');
    
    try {
      const response = await aiAssistantService.askQuestion(userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', text: "عذراً، أواجه مشكلة في الرد حالياً." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-['Cairo'] animate-fadeIn" dir="rtl">
      <div className={`w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col relative animate-slideUp`}>
        {/* Header */}
        <div className="p-6 flex justify-between items-center border-b border-slate-100">
          <button onClick={onClose} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all">
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-2 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100">
             <span className="text-rose-600 font-black text-sm">{studentPoints}</span>
             <span className="text-xl">⭐</span>
          </div>
        </div>

        {/* Hero / Avatar */}
        <div className="px-6 py-8 text-center bg-gradient-to-b from-slate-50/50 to-transparent">
          <div className="relative inline-block mb-4">
             <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-20 animate-pulse"></div>
             <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center border-4 border-indigo-50 shadow-xl relative z-10">
                <span className="text-5xl animate-bounce-slow">🤖</span>
             </div>
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">مساعدك الذكي للمذاكرة</h2>
          <p className="text-slate-500 font-bold text-sm">اختار تحب أساعدك إزاي في الفيديو ده 👇</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[300px] max-h-[450px] no-scrollbar" ref={scrollRef}>
          {activeTab === 'menu' && (
            <div className="grid grid-cols-2 gap-4">
               {[
                 { id: 'summary', label: 'تلخيص الفيديو', icon: <FileText className="text-blue-500" />, desc: 'ملخص سريع لأهم الأفكار اللي اتقالت' },
                 { id: 'explain', label: 'إعادة شرح المحتوى', icon: <Zap className="text-amber-500" />, desc: 'لو في جزء مش واضح، هنشرحه بأسلوب أسهل' },
                 { id: 'flashcards', label: 'Flash cards', icon: <Brain className="text-rose-500" />, desc: 'كروت صغيرة فيها أهم النقاط في الدرس' },
                 { id: 'quiz', label: 'اختبار على الدرس', icon: <HelpCircle className="text-emerald-500" />, desc: 'هعملك اختبار من محتوى الفيديو عشان تتأكد إنك فاهم' }
               ].map(item => (
                 <button 
                  key={item.id}
                  onClick={() => handleAction(item.id as any)}
                  className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:shadow-xl hover:border-indigo-100 transition-all text-right group"
                 >
                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110">
                       {item.icon}
                    </div>
                    <h3 className="font-black text-slate-800 text-sm mb-1">{item.label}</h3>
                    <p className="text-[10px] text-slate-400 font-bold leading-relaxed">{item.desc}</p>
                 </button>
               ))}
            </div>
          )}

          {activeTab === 'result' && (
            <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100">
               {isLoading ? (
                 <div className="flex flex-col items-center justify-center py-10 gap-3">
                   <Loader2 className="animate-spin text-indigo-600" size={32} />
                   <p className="text-indigo-600 font-black text-sm animate-pulse">جاري الذكاء... ثواني يا بطل 🧠</p>
                 </div>
               ) : (
                 <div className="animate-fadeIn">
                   <div className="whitespace-pre-wrap text-slate-700 font-bold text-sm leading-loose">
                      {resultText}
                   </div>
                   <button onClick={() => setActiveTab('menu')} className="mt-6 w-full py-3 bg-white text-indigo-600 border border-indigo-100 rounded-xl font-black text-xs hover:bg-indigo-50 transition-all">الرجوع للقائمة الرئيسية</button>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'flashcards' && flashcards.length > 0 && (
            <div className="space-y-6 animate-fadeIn">
               <div 
                onClick={() => setShowFlashcardBack(!showFlashcardBack)}
                className={`relative h-64 perspective-1000 cursor-pointer`}
               >
                  <div className={`w-full h-full transition-all duration-500 preserve-3d relative ${showFlashcardBack ? 'rotate-y-180' : ''}`}>
                    {/* Front */}
                    <div className={`absolute inset-0 bg-white border-4 border-indigo-50 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden shadow-xl`}>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">Front</span>
                        <p className="text-xl font-black text-slate-800 leading-relaxed">{flashcards[currentFlashcardIdx].front}</p>
                        <p className="mt-8 text-[10px] text-slate-400 font-bold">اضغط للعرض...</p>
                    </div>
                    {/* Back */}
                    <div className={`absolute inset-0 bg-indigo-600 border-4 border-indigo-400 rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center backface-hidden rotate-y-180 shadow-xl`}>
                        <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Answer</span>
                        <p className="text-lg font-black text-white leading-relaxed">{flashcards[currentFlashcardIdx].back}</p>
                    </div>
                  </div>
               </div>
               
               <div className="flex justify-between items-center gap-4">
                  <button 
                    disabled={currentFlashcardIdx === 0}
                    onClick={() => { setCurrentFlashcardIdx(i => i-1); setShowFlashcardBack(false); }}
                    className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-xs disabled:opacity-30"
                  >السابق</button>
                  <span className="text-xs font-black text-slate-400">{currentFlashcardIdx + 1} / {flashcards.length}</span>
                  <button 
                    disabled={currentFlashcardIdx === flashcards.length - 1}
                    onClick={() => { setCurrentFlashcardIdx(i => i+1); setShowFlashcardBack(false); }}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-xs disabled:opacity-30"
                  >التالي</button>
               </div>
               <button onClick={() => setActiveTab('menu')} className="w-full py-3 text-slate-400 font-black text-xs">إغلاق الكروت</button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4 animate-fadeIn">
               {messages.map((m, i) => (
                 <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-bold shadow-sm ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-slate-100 text-slate-700 rounded-bl-none'}`}>
                        {m.text}
                    </div>
                 </div>
               ))}
               {isLoading && (
                 <div className="flex justify-start">
                    <div className="bg-slate-100 p-4 rounded-3xl rounded-bl-none">
                       <Loader2 className="animate-spin text-slate-400" size={16} />
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100">
           <div className="relative bg-white border-2 border-slate-100 rounded-[2rem] p-2 flex items-center transition-all focus-within:border-indigo-500 shadow-sm">
              <input 
                type="text" 
                placeholder="مش فاهم حاجة؟ اسألني.." 
                className="flex-1 bg-transparent border-none outline-none font-bold text-slate-700 px-4 h-10 placeholder:text-slate-400 text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
              />
              <div className="flex gap-2">
                 <button className="w-10 h-10 text-slate-400 hover:text-indigo-500 transition-colors">
                    <Paperclip size={20} />
                 </button>
                 <button 
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={`w-10 h-10 ${input.trim() ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'} rounded-2xl flex items-center justify-center transition-all disabled:opacity-50`}
                 >
                    <Send size={18} className="-mr-0.5" />
                 </button>
              </div>
           </div>
        </div>
      </div>
      
      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow { animation: bounce-slow 3s infinite ease-in-out; }
      `}</style>
    </div>
  );
};

export default AiStudyAssistant;
