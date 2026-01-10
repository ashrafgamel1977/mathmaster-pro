
import React, { useState, useRef } from 'react';
import { createLiveSession } from '../services/geminiService';
import { PlatformSettings, EducationalSource } from '../types';
import InteractiveBoard from '../components/InteractiveBoard';

interface LiveClassProps {
  teacherName: string; // Kept in interface for compatibility, but removed from destructuring if unused, or we remove it entirely if not passed.
  settings: PlatformSettings;
  onUpdateSettings: (settings: PlatformSettings) => void;
  onBroadcastToWhatsApp: () => void;
  onPostSummary: (source: EducationalSource) => void;
}

const LiveClass: React.FC<LiveClassProps> = ({ settings, onUpdateSettings, onBroadcastToWhatsApp, onPostSummary }) => {
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiStatus, setAiStatus] = useState('المعلم الذكي جاهز للمساعدة');
  const [showBoard, setShowBoard] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  };

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
    return bytes;
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
    return buffer;
  };

  const handleStartAi = async () => {
    try {
      setAiStatus('جاري الاتصال...');
      setIsAiActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      
      const sessionPromise = createLiveSession({
        onopen: () => {
          setAiStatus('المساعد الذكي يستمع...');
          const source = inputCtx.createMediaStreamSource(stream);
          const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
          scriptProcessor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const int16 = new Int16Array(inputData.length);
            for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
            const pcmBase64 = encode(new Uint8Array(int16.buffer));
            sessionPromise.then((session: any) => {
              session.sendRealtimeInput({ media: { data: pcmBase64, mimeType: 'audio/pcm;rate=16000' } });
            });
          };
          source.connect(scriptProcessor);
          scriptProcessor.connect(inputCtx.destination);
        },
        onmessage: async (msg: any) => {
          const audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
          if (audio) {
            if (!audioContextRef.current) audioContextRef.current = new AudioContext({ sampleRate: 24000 });
            const ctx = audioContextRef.current;
            nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
            const buffer = await decodeAudioData(decode(audio), ctx, 24000, 1);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(ctx.destination);
            source.start(nextStartTimeRef.current);
            nextStartTimeRef.current += buffer.duration;
          }
        },
        onerror: () => { setIsAiActive(false); setAiStatus('خطأ في الاتصال'); },
        onclose: () => { setIsAiActive(false); }
      });
    } catch (e) {
      setIsAiActive(false);
    }
  };

  const toggleLiveSession = () => {
    if (!settings.liveSessionLink) return alert('يرجى إضافة رابط الاجتماع أولاً');
    onUpdateSettings({...settings, liveSessionActive: !settings.liveSessionActive});
  };

  const handleSaveBoardAsSummary = (dataUrl: string) => {
    const summary: EducationalSource = {
      id: 'src' + Date.now(),
      name: `ملخص حصة: ${settings.liveSessionTitle || 'مراجعة رياضيات'}`,
      data: dataUrl,
      mimeType: 'image/png',
      uploadDate: new Date().toLocaleDateString('ar-EG'),
      yearId: 'all' // سيظهر لجميع الطلاب أو يمكن تخصيصه
    };
    onPostSummary(summary);
    setShowBoard(false);
    alert('تم نشر ملخص السبورة في مكتبة الطلاب بنجاح! 🚀');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slideUp pb-20 text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">غرفة البث المباشر 🎥</h2>
          <p className="text-sm text-gray-400 font-bold mt-1">أدر حصتك المباشرة وشارك طلابك الشرح التفاعلي.</p>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={toggleLiveSession} className={`px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all ${settings.liveSessionActive ? 'bg-rose-600 text-white shadow-rose-100' : 'bg-emerald-600 text-white shadow-emerald-100'}`}>
            {settings.liveSessionActive ? '🔴 إنهاء الحصة' : '🟢 بدء البث المباشر'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">عنوان الحصة والوصف</label>
                <input type="text" placeholder="مثال: شرح التكامل بالتعويض" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500" value={settings.liveSessionTitle} onChange={e => onUpdateSettings({...settings, liveSessionTitle: e.target.value})} />
                <input type="text" placeholder="رابط Google Meet" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-blue-600 outline-none" value={settings.liveSessionLink} onChange={e => onUpdateSettings({...settings, liveSessionLink: e.target.value})} />
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                <button onClick={() => window.open('https://meet.google.com/new', '_blank')} className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-blue-100 transition-all">
                   <span className="text-3xl">🔗</span>
                   <span className="text-[10px] font-black text-blue-700">إنشاء رابط Meet</span>
                </button>
                <button onClick={() => setShowBoard(true)} className="p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-amber-100 transition-all">
                   <span className="text-3xl">🖋️</span>
                   <span className="text-[10px] font-black text-amber-700">فتح سبورة الشرح</span>
                </button>
             </div>

             <button onClick={onBroadcastToWhatsApp} className="w-full py-5 bg-indigo-50 text-indigo-600 rounded-[2rem] font-black text-sm border border-indigo-100 flex items-center justify-center gap-3">
                <span>📢</span> إرسال تنبيه عبر مجموعات الواتساب
             </button>
          </div>
        </div>

        <div className="space-y-6">
           <div className="bg-indigo-950 p-8 rounded-[3rem] shadow-xl text-white text-center relative overflow-hidden">
              <div className="w-20 h-20 bg-white/10 rounded-3xl mx-auto mb-6 flex items-center justify-center text-4xl shadow-inner backdrop-blur-md">🤖</div>
              <h3 className="font-black text-xl mb-2">المعلم المساعد</h3>
              <p className="text-[9px] text-indigo-300 font-bold mb-8 leading-relaxed uppercase tracking-widest">{aiStatus}</p>
              
              {!isAiActive ? (
                <button onClick={handleStartAi} className="w-full py-4 bg-yellow-400 text-indigo-950 font-black rounded-2xl shadow-lg hover:scale-105 transition-transform">تفعيل المساعد الصوتي 🎙️</button>
              ) : (
                <div className="flex flex-col items-center gap-4">
                   <div className="flex gap-1 h-8 items-end">
                      {[1,2,3,4,3,2,1].map((h, i) => <div key={i} className="w-1.5 bg-yellow-400 rounded-full animate-bounce" style={{height: `${h*25}%`, animationDelay: `${i*0.1}s`}}></div>)}
                   </div>
                   <button onClick={() => setIsAiActive(false)} className="text-rose-400 text-[10px] font-black underline">إيقاف الجلسة</button>
                </div>
              )}
           </div>
        </div>
      </div>

      {showBoard && (
        <div className="fixed inset-0 z-[500] bg-indigo-950 p-2 md:p-6 flex flex-col animate-fadeIn">
           <div className="flex justify-between items-center mb-4 px-8 text-white">
              <div>
                 <h3 className="font-black text-2xl">سبورة الشرح التفاعلية 🖋️</h3>
                 <p className="text-[9px] text-amber-200 font-bold uppercase">يمكنك رسم الدوال والمسائل ونشرها للطلاب فوراً</p>
              </div>
              <button onClick={() => setShowBoard(false)} className="w-12 h-12 bg-white/10 hover:bg-rose-600 rounded-2xl flex items-center justify-center text-2xl transition-all">✕</button>
           </div>
           <div className="flex-1 bg-white rounded-[4rem] overflow-hidden shadow-2xl">
              <InteractiveBoard 
                onSave={handleSaveBoardAsSummary} 
                onCancel={() => setShowBoard(false)} 
                title={`شرح مباشر: ${settings.liveSessionTitle}`} 
                initialBackground="grid" 
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default LiveClass;
