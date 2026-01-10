
import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Student, Year, MathNotation } from '../types';
import MathRenderer from '../components/MathRenderer';
import { solveMathProblem } from '../services/geminiService';

interface ChatRoomProps {
  user: { id: string; name: string; role: 'teacher' | 'student'; yearId?: string };
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
  onSendMessage: (text: string, type: 'group' | 'private', recipientId?: string, audioData?: string) => void;
  onMarkRead?: (studentId?: string) => void;
  onMarkGroupRead?: () => void;
  notation?: MathNotation;
}

const QUICK_REPLIES = [
  "أحسنت يا بطل! استمر 🌟",
  "راجع خطوات الحل مرة أخرى 🧐",
  "إجابة نموذجية ومنظمة جداً ✓",
  "فكرة المسألة ممتازة، مين يحلها؟ 🧠",
  "لا تنسَ كتابة الوحدات في النهاية 📏"
];

const ChatRoom: React.FC<ChatRoomProps> = ({ user, messages, years, students, onSendMessage, onMarkRead, onMarkGroupRead, notation = 'arabic' }) => {
  const [activeTab, setActiveTab] = useState<'group' | 'private'>('group');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    if (activeTab === 'group') onMarkGroupRead?.();
    else if (activeTab === 'private' && selectedStudentId) onMarkRead?.(selectedStudentId);
  }, [messages.length, activeTab, selectedStudentId]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64 = reader.result as string;
          setAudioBase64(base64);
          handleSend("", base64);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      alert("يرجى تفعيل صلاحية الميكروفون للتسجيل الصوتي.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleSend = async (overrideText?: string, audioData?: string) => {
    const textToSend = overrideText !== undefined ? overrideText : inputText;
    if (!textToSend.trim() && !audioData) return;
    
    onSendMessage(textToSend, activeTab, activeTab === 'private' ? (user.role === 'teacher' ? selectedStudentId! : 'teacher') : undefined, audioData);
    setInputText('');
    setAudioBase64(null);

    if (activeTab === 'group' && textToSend.includes('@ذكاء')) {
      setIsAiLoading(true);
      try {
        const question = textToSend.replace('@ذكاء', '').trim();
        const aiResponse = await solveMathProblem(question, undefined, notation as MathNotation);
        onSendMessage(`🤖 **المعلم المساعد الذكي:** \n\n ${aiResponse}`, 'group', undefined);
      } catch (e) {
        onSendMessage("⚠️ عذراً، واجهت مشكلة في التفكير، حاول مرة أخرى!", 'group', undefined);
      } finally {
        setIsAiLoading(false);
      }
    }
  };

  const filteredMessages = messages.filter(m => {
    if (activeTab === 'group') {
      const targetYearId = user.role === 'teacher' ? (years[0]?.id) : user.yearId;
      return (m.type === 'group' || m.type === 'system') && (m.yearId === 'all' || m.yearId === targetYearId);
    } else {
      return m.type === 'private' && (user.role === 'teacher' ? (m.senderId === selectedStudentId || m.recipientId === selectedStudentId) : (m.senderId === user.id || m.recipientId === user.id));
    }
  });

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] md:h-[calc(100vh-180px)] max-w-6xl mx-auto bg-white rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden animate-slideUp text-right" dir="rtl">
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between bg-slate-50/50 gap-4">
        <div className="flex items-center gap-4">
           <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg shadow-blue-200">💬</div>
           <div>
              <h3 className="font-black text-slate-800 text-lg">نادي العباقرة 📐</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">تواصل مباشر وآمن مع أ. أشرف جميل</p>
           </div>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
           <button onClick={() => setActiveTab('group')} className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'group' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>🌍 الساحة العامة</button>
           <button onClick={() => setActiveTab('private')} className={`px-6 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === 'private' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>🔒 مراسلة المعلم</button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'private' && user.role === 'teacher' && (
          <div className="w-64 border-l border-slate-100 bg-slate-50/30 overflow-y-auto no-scrollbar">
             <div className="p-4 space-y-2">
                <p className="text-[10px] font-black text-slate-400 px-2 mb-4 uppercase tracking-widest">الطلاب (الخاص)</p>
                {students.map(s => (
                  <button key={s.id} onClick={() => setSelectedStudentId(s.id)} className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all ${selectedStudentId === s.id ? 'bg-white shadow-lg border-r-4 border-blue-600 scale-105' : 'hover:bg-white/50'}`}>
                    <img src={s.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                    <span className="text-xs font-black text-slate-700 truncate">{s.name.split(' ')[0]}</span>
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-6 no-scrollbar bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] bg-[size:30px_30px]">
            {filteredMessages.map((msg) => {
              const isMe = msg.senderId === user.id;
              const isTeacher = msg.senderRole === 'teacher';
              const isAi = msg.text.includes('🤖');

              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-start' : 'justify-end'} animate-fadeIn`}>
                  <div className={`max-w-[85%] flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 mb-1 px-2">
                      {!isMe && <span className={`text-[9px] font-black ${isTeacher ? 'text-blue-600' : 'text-slate-500'}`}>{msg.senderName} {isTeacher && '⭐'}</span>}
                      <span className="text-[8px] text-slate-300 font-bold">{msg.timestamp}</span>
                    </div>
                    
                    <div className={`relative px-6 py-4 rounded-[2rem] text-sm md:text-md font-bold shadow-sm border ${
                      isMe ? 'bg-blue-600 text-white border-blue-500 rounded-tr-none' : 
                      isAi ? 'bg-slate-900 text-blue-200 border-slate-800 rounded-tl-none' :
                      isTeacher ? 'bg-white border-blue-100 text-slate-800 rounded-tl-none ring-4 ring-blue-50' : 
                      'bg-white text-slate-800 border-slate-100 rounded-tl-none'
                    }`}>
                      {msg.audioData ? (
                        <div className="flex items-center gap-3 py-1">
                           <span className="text-xl">🎙️</span>
                           <audio src={msg.audioData} controls className="h-8 max-w-[150px] md:max-w-[200px]" />
                        </div>
                      ) : (
                        <MathRenderer content={msg.text} inline />
                      )}
                      
                      {isTeacher && !isMe && (
                        <div className="absolute -top-2 -left-2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] shadow-lg">∑</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            {isAiLoading && (
              <div className="flex justify-center py-4 animate-pulse">
                 <div className="bg-slate-900 px-6 py-3 rounded-full text-blue-400 text-[10px] font-black shadow-xl">
                    🤖 المساعد الذكي يستعرض عبقريته الآن...
                 </div>
              </div>
            )}
          </div>

          {user.role === 'teacher' && activeTab === 'private' && selectedStudentId && (
            <div className="px-6 py-3 bg-slate-50/80 backdrop-blur-md border-t border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
               {QUICK_REPLIES.map((reply, i) => (
                 <button key={i} onClick={() => handleSend(reply)} className="whitespace-nowrap px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black text-slate-600 hover:border-blue-600 hover:text-blue-600 transition-all shadow-sm">
                   {reply}
                 </button>
               ))}
            </div>
          )}

          <div className="p-6 bg-white border-t border-slate-100">
            <div className="flex gap-3 bg-slate-50 p-3 rounded-[2rem] border-2 border-transparent focus-within:border-blue-600 focus-within:bg-white transition-all shadow-inner">
              <button 
                onMouseDown={startRecording} 
                onMouseUp={stopRecording} 
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm transition-all ${isRecording ? 'bg-rose-600 text-white animate-pulse scale-110' : 'bg-white text-slate-400 hover:text-blue-600'}`}
                title="اضغط مطولاً للتسجيل"
              >🎙️</button>
              
              <input 
                type="text" 
                placeholder={isRecording ? "جاري التسجيل..." : (activeTab === 'group' ? "سؤال للمساعد؟ اكتب @ذكاء قبل المسألة" : "اكتب رسالة خاصة للمدرس...")}
                className="flex-1 px-4 outline-none font-bold text-sm bg-transparent" 
                value={inputText} 
                onChange={e => setInputText(e.target.value)} 
                onKeyDown={e => e.key === 'Enter' && handleSend()} 
                disabled={isRecording}
              />
              <button onClick={() => handleSend()} className="w-14 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl active:scale-95 transition-all">
                <span className="text-xl rotate-180">🚀</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
