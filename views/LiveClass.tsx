
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createLiveSession } from '../services/geminiService';
import { PlatformSettings, EducationalSource, VideoNote, Year } from '../types';
import InteractiveBoard from '../components/InteractiveBoard';

interface LiveClassProps {
  teacherName: string; 
  settings: PlatformSettings;
  educationalSources: EducationalSource[];
  onUpdateSettings: (settings: PlatformSettings) => void;
  onBroadcastToWhatsApp: () => void;
  onPostSummary: (source: EducationalSource) => void;
  years?: Year[];
}

const LiveClass: React.FC<LiveClassProps> = ({ settings, educationalSources, onUpdateSettings, onBroadcastToWhatsApp, onPostSummary, years = [] }) => {
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiStatus, setAiStatus] = useState('المعلم الذكي جاهز للمساعدة');
  const [showBoard, setShowBoard] = useState(false);
  
  // Platform Selection
  const [platformType, setPlatformType] = useState<'meet' | 'zoom' | 'fcc' | 'teams' | 'jitsi'>('meet');
  const [jitsiRoomName] = useState(() => settings.liveSessionLink.includes('jit.si') ? settings.liveSessionLink.split('/').pop() : `MathMaster_${Math.floor(Math.random() * 100000)}`);
  
  // Settings Controls
  const [targetYearId, setTargetYearId] = useState<string>(settings.liveSessionTargetYear || 'all');
  const [videoQuality, setVideoQuality] = useState<'720' | '480' | '360'>('720'); // HD by default

  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef(0);

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Playback & Notes State
  const [selectedRecording, setSelectedRecording] = useState<EducationalSource | null>(null);
  const [videoNotes, setVideoNotes] = useState<VideoNote[]>([]);
  const [currentNoteText, setCurrentNoteText] = useState('');
  const [videoDuration, setVideoDuration] = useState(0);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);

  // Detect platform
  useEffect(() => {
    if (settings.liveSessionLink) {
      if (settings.liveSessionLink.includes('meet.google')) setPlatformType('meet');
      else if (settings.liveSessionLink.includes('zoom.us')) setPlatformType('zoom');
      else if (settings.liveSessionLink.includes('freeconferencecall')) setPlatformType('fcc');
      else if (settings.liveSessionLink.includes('teams')) setPlatformType('teams');
      else if (settings.liveSessionLink.includes('jit.si')) {
          setPlatformType('jitsi');
      }
    }
  }, [settings.liveSessionLink]);

  // Update target year
  useEffect(() => {
      if (targetYearId !== settings.liveSessionTargetYear) {
          onUpdateSettings({...settings, liveSessionTargetYear: targetYearId});
      }
  }, [targetYearId]);

  // Construct Advanced Jitsi URL (Embedded Version)
  const jitsiEmbedUrl = useMemo(() => {
      const room = jitsiRoomName;
      const base = `https://meet.jit.si/${room}`;
      
      // Configuration for Jitsi
      const params = [
          `userInfo.displayName="${encodeURIComponent(settings.teacherName)}"`,
          `config.prejoinPageEnabled=true`, 
          `config.disableDeepLinking=true`, // Forces Web Mode (Inside App)
          `config.resolution=${videoQuality}`,
          `interfaceConfig.MOBILE_APP_PROMO=false`,
          `interfaceConfig.NATIVE_APP_NAME="MathMaster"`,
          `interfaceConfig.SHOW_JITSI_WATERMARK=false`
      ];
      return `${base}#${params.join('&')}`;
  }, [jitsiRoomName, settings.teacherName, videoQuality]);

  // Construct App URL (External Version)
  const jitsiAppUrl = useMemo(() => {
      return `https://meet.jit.si/${jitsiRoomName}`;
  }, [jitsiRoomName]);

  // ... helper functions (encode, decode, decodeAudioData) ...
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

  // Notes Logic
  useEffect(() => {
    if (selectedRecording) {
      try {
        const savedNotes = localStorage.getItem(`notes_teacher_${selectedRecording.id}`);
        if (savedNotes) setVideoNotes(JSON.parse(savedNotes));
        else setVideoNotes([]);
      } catch (e) {
        setVideoNotes([]);
      }
    }
  }, [selectedRecording]);

  const saveNote = () => {
    if (!currentNoteText.trim() || !videoPlayerRef.current || !selectedRecording) return;
    const timestamp = videoPlayerRef.current.currentTime;
    const newNote: VideoNote = {
      id: Date.now().toString(),
      videoId: selectedRecording.id,
      timestamp,
      text: currentNoteText,
      createdAt: new Date().toLocaleDateString('ar-EG')
    };
    const updatedNotes = [...videoNotes, newNote].sort((a, b) => a.timestamp - b.timestamp);
    setVideoNotes(updatedNotes);
    try { localStorage.setItem(`notes_teacher_${selectedRecording.id}`, JSON.stringify(updatedNotes)); } catch (e) {}
    setCurrentNoteText('');
  };

  const deleteNote = (noteId: string) => {
    if (!selectedRecording) return;
    const updatedNotes = videoNotes.filter(n => n.id !== noteId);
    setVideoNotes(updatedNotes);
    try { localStorage.setItem(`notes_teacher_${selectedRecording.id}`, JSON.stringify(updatedNotes)); } catch (e) {}
  };

  const seekTo = (seconds: number) => {
    if (videoPlayerRef.current) videoPlayerRef.current.currentTime = seconds;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
    if (platformType === 'jitsi' && !settings.liveSessionLink) {
        const link = `https://meet.jit.si/${jitsiRoomName}`;
        onUpdateSettings({
            ...settings, 
            liveSessionLink: link, 
            liveSessionActive: !settings.liveSessionActive,
            liveSessionTargetYear: targetYearId 
        });
    } else {
        if (!settings.liveSessionLink) return alert('يرجى إضافة رابط الاجتماع أولاً');
        onUpdateSettings({
            ...settings, 
            liveSessionActive: !settings.liveSessionActive,
            liveSessionTargetYear: targetYearId
        });
    }
  };

  const handleSaveBoardAsSummary = (dataUrl: string) => {
    const summary: EducationalSource = {
      id: 'src' + Date.now(),
      name: `ملخص حصة: ${settings.liveSessionTitle || 'مراجعة رياضيات'}`,
      data: dataUrl,
      mimeType: 'image/png',
      uploadDate: new Date().toLocaleDateString('ar-EG'),
      yearId: targetYearId === 'all' ? 'all' : targetYearId
    };
    onPostSummary(summary);
    setShowBoard(false);
    alert('تم نشر ملخص السبورة في مكتبة الطلاب بنجاح! 🚀');
  };

  const startRecording = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      if (screenStream.getAudioTracks().length > 0) {
        const screenSource = audioContext.createMediaStreamSource(screenStream);
        screenSource.connect(destination);
      }
      const micSource = audioContext.createMediaStreamSource(micStream);
      micSource.connect(destination);

      const combinedStream = new MediaStream([...screenStream.getVideoTracks(), ...destination.stream.getAudioTracks()]);
      const mediaRecorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          const base64data = reader.result as string;
          const source: EducationalSource = {
            id: 'rec-' + Date.now(),
            name: `تسجيل حصة: ${settings.liveSessionTitle || 'بدون عنوان'} (${new Date().toLocaleTimeString('ar-EG')})`,
            data: base64data,
            mimeType: 'video/webm',
            uploadDate: new Date().toLocaleDateString('ar-EG'),
            yearId: targetYearId === 'all' ? 'all' : targetYearId
          };
          onPostSummary(source);
          alert('تم حفظ تسجيل الحصة في مكتبة الطلاب بنجاح! 📹');
        };
        screenStream.getTracks().forEach(track => track.stop());
        micStream.getTracks().forEach(track => track.stop());
        combinedStream.getTracks().forEach(track => track.stop());
        audioContext.close();
      };

      mediaRecorder.start();
      setIsRecording(true);
      screenStream.getVideoTracks()[0].onended = () => {
          if (mediaRecorder.state !== 'inactive') stopRecording();
      };
    } catch (err) {
      alert("تعذر بدء التسجيل. يرجى التأكد من منح أذونات الشاشة والميكروفون.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const getPlatformStyle = () => {
    switch(platformType) {
        case 'meet': return { color: 'bg-blue-600', icon: '📹', name: 'Google Meet' };
        case 'zoom': return { color: 'bg-blue-500', icon: '🎥', name: 'Zoom' };
        case 'fcc': return { color: 'bg-orange-600', icon: '📞', name: 'FreeConfCall' };
        case 'teams': return { color: 'bg-indigo-600', icon: '📅', name: 'MS Teams' };
        case 'jitsi': return { color: 'bg-[#1D2228]', icon: '⚡', name: 'مدمج (Jitsi)' };
        default: return { color: 'bg-emerald-600', icon: '🟢', name: 'Live' };
    }
  };

  const platformStyle = getPlatformStyle();
  const recordings = educationalSources.filter(s => s.mimeType.startsWith('video/'));

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slideUp pb-20 text-right" dir="rtl">
      
      {/* Active Embedded Session View (Jitsi) */}
      {settings.liveSessionActive && platformType === 'jitsi' && (
          <div className="fixed inset-0 z-[100] bg-black flex flex-col">
              <div className="bg-[#1D2228] p-4 flex justify-between items-center text-white">
                  <h3 className="font-bold flex items-center gap-2">
                      <span className="text-red-500 text-xs font-black animate-pulse">● LIVE</span>
                      {settings.liveSessionTitle || 'بث مباشر'}
                  </h3>
                  <div className="flex gap-2">
                      <button 
                          onClick={() => window.open(jitsiAppUrl, '_blank')}
                          className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold hover:bg-blue-700"
                      >
                          فتح في التطبيق الخارجي ↗
                      </button>
                      <button 
                          onClick={toggleLiveSession}
                          className="px-4 py-2 bg-red-600 rounded-lg text-xs font-bold hover:bg-red-700"
                      >
                          إنهاء البث ✕
                      </button>
                  </div>
              </div>
              <iframe 
                  allow="camera *; microphone *; fullscreen *; display-capture *; autoplay *"
                  src={jitsiEmbedUrl}
                  className="flex-1 w-full border-0"
                  title="Jitsi Meeting"
                  allowFullScreen
              />
          </div>
      )}

      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-gray-800">غرفة البث المباشر 🎥</h2>
          <p className="text-sm text-gray-400 font-bold mt-1">أدر حصتك المباشرة وشارك طلابك الشرح التفاعلي.</p>
        </div>
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button 
              onClick={startRecording} 
              className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              <span>تسجيل الحصة</span>
              <span className="text-red-500 text-xl">●</span>
            </button>
          ) : (
            <button 
              onClick={stopRecording} 
              className="px-6 py-4 bg-red-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2 animate-pulse"
            >
              <span>إيقاف التسجيل</span>
              <span className="text-white text-xl">■</span>
            </button>
          )}

          <button onClick={toggleLiveSession} className={`px-10 py-4 rounded-2xl font-black text-sm shadow-xl transition-all ${settings.liveSessionActive ? 'bg-rose-600 text-white shadow-rose-100' : platformStyle.color + ' text-white'}`}>
            {settings.liveSessionActive ? '🔴 إنهاء الحصة' : `🟢 بدء البث (${platformStyle.name})`}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
             <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">إعدادات البث والمستهدفين</label>
                
                {/* Platform Selector */}
                <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl border border-gray-200 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'jitsi', name: 'بث مدمج (Jitsi)', icon: '⚡' },
                        { id: 'meet', name: 'Google Meet', icon: '📹' },
                        { id: 'zoom', name: 'Zoom', icon: '🎥' },
                        { id: 'fcc', name: 'FreeConfCall', icon: '📞' },
                        { id: 'teams', name: 'MS Teams', icon: '📅' }
                    ].map(p => (
                        <button 
                            key={p.id}
                            onClick={() => setPlatformType(p.id as any)}
                            className={`flex-1 min-w-[80px] py-3 rounded-xl text-[10px] font-black transition-all flex flex-col items-center gap-1 ${platformType === p.id ? 'bg-slate-800 text-white shadow-md ring-2 ring-indigo-200' : 'text-gray-400 hover:bg-gray-100'}`}
                        >
                            <span className="text-lg">{p.icon}</span>
                            <span>{p.name}</span>
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input type="text" placeholder="عنوان الحصة (مثال: شرح التفاضل)" className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-black text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500" value={settings.liveSessionTitle} onChange={e => onUpdateSettings({...settings, liveSessionTitle: e.target.value})} />
                    
                    <select 
                        className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-2xl font-black text-xs outline-none cursor-pointer hover:bg-indigo-100 transition-colors"
                        value={targetYearId}
                        onChange={(e) => setTargetYearId(e.target.value)}
                    >
                        <option value="all">كل الطلاب (عام)</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                    </select>
                </div>

                {platformType === 'jitsi' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-500">جودة البث</label>
                            <div className="flex bg-white p-1 rounded-xl shadow-sm">
                                <button onClick={() => setVideoQuality('720')} className={`px-3 py-1 rounded-lg text-[9px] font-bold ${videoQuality === '720' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>HD</button>
                                <button onClick={() => setVideoQuality('480')} className={`px-3 py-1 rounded-lg text-[9px] font-bold ${videoQuality === '480' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>SD</button>
                                <button onClick={() => setVideoQuality('360')} className={`px-3 py-1 rounded-lg text-[9px] font-bold ${videoQuality === '360' ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>Low</button>
                            </div>
                        </div>
                        <div className="p-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[9px] font-bold border border-emerald-100 flex items-center gap-2">
                            <span>✅</span>
                            <span>تم تفعيل صفحة الاستعداد: يمكنك اختيار الكاميرا والخلفية قبل الظهور للطلاب.</span>
                        </div>
                    </div>
                )}
                
                {/* Link Input - Auto generated for Jitsi */}
                {platformType !== 'jitsi' && (
                    <input type="text" placeholder={`رابط ${platformStyle.name}...`} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-blue-600 outline-none" value={settings.liveSessionLink} onChange={e => onUpdateSettings({...settings, liveSessionLink: e.target.value})} />
                )}
             </div>
             
             <div className="grid grid-cols-2 gap-4">
                {platformType !== 'jitsi' && (
                    <button onClick={() => window.open(platformType === 'fcc' ? 'https://www.freeconferencecall.com/profile' : platformType === 'zoom' ? 'https://zoom.us/meeting' : 'https://meet.google.com/new', '_blank')} className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-blue-100 transition-all">
                    <span className="text-3xl">🔗</span>
                    <span className="text-[10px] font-black text-blue-700">إنشاء رابط خارجي</span>
                    </button>
                )}
                <button onClick={() => setShowBoard(true)} className={`p-6 bg-amber-50 border border-amber-100 rounded-3xl flex flex-col items-center gap-2 hover:bg-amber-100 transition-all ${platformType === 'jitsi' ? 'col-span-2' : ''}`}>
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
              <p key={aiStatus} className="text-[9px] text-indigo-300 font-bold mb-8 leading-relaxed uppercase tracking-widest animate-fadeIn">{aiStatus}</p>
              
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

      {/* Playback Section */}
      <div className="space-y-6">
         <h3 className="text-xl font-black text-slate-800 px-2 flex items-center gap-2">
            <span>📹</span> تسجيلات الحصص السابقة
         </h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recordings.map(rec => (
               <div 
                 key={rec.id} 
                 onClick={() => setSelectedRecording(rec)}
                 className={`p-6 rounded-[2.5rem] border-2 cursor-pointer transition-all ${selectedRecording?.id === rec.id ? 'bg-indigo-50 border-indigo-500 shadow-md' : 'bg-white border-slate-100 hover:border-slate-300'}`}
               >
                  <h4 className="font-bold text-slate-800 text-sm truncate">{rec.name}</h4>
                  <p className="text-[10px] text-slate-400 font-black mt-1">{rec.uploadDate}</p>
               </div>
            ))}
            {recordings.length === 0 && <p className="text-slate-400 font-bold text-sm px-4">لا توجد تسجيلات محفوظة.</p>}
         </div>

         {selectedRecording && (
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl space-y-8 animate-fadeIn">
               <div className="flex justify-between items-center">
                  <h4 className="text-xl font-black text-slate-800">{selectedRecording.name}</h4>
                  <button onClick={() => setSelectedRecording(null)} className="text-rose-500 font-bold text-xs">إغلاق ✕</button>
               </div>
               
               <div className="rounded-[2.5rem] overflow-hidden bg-black shadow-lg border-4 border-white/50">
                  <video 
                    ref={videoPlayerRef}
                    src={selectedRecording.data} 
                    controls 
                    className="w-full aspect-video"
                    onLoadedMetadata={(e) => setVideoDuration(e.currentTarget.duration)}
                  />
               </div>

               {/* Timeline & Notes */}
               <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="text-lg">📌</span>
                     <h5 className="font-black text-slate-700">الملاحظات الزمنية</h5>
                  </div>

                  <div className="relative h-4 bg-slate-100 rounded-full w-full mb-8">
                     {videoNotes.map(note => (
                        <div 
                          key={note.id}
                          onClick={() => seekTo(note.timestamp)}
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform group z-10"
                          style={{ left: `${(note.timestamp / (videoDuration || 1)) * 100}%` }}
                          title={note.text}
                        >
                           <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              {note.text} ({formatTime(note.timestamp)})
                           </div>
                        </div>
                     ))}
                  </div>

                  <div className="flex gap-3">
                     <input 
                       type="text" 
                       placeholder="اكتب ملاحظة في هذه الدقيقة..." 
                       className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-blue-600 transition-all"
                       value={currentNoteText}
                       onChange={e => setCurrentNoteText(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && saveNote()}
                     />
                     <button onClick={saveNote} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-all">
                        حفظ الملاحظة
                     </button>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar">
                     {videoNotes.map(note => (
                        <div key={note.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-blue-50 transition-colors group cursor-pointer" onClick={() => seekTo(note.timestamp)}>
                           <div className="flex items-center gap-4">
                              <span className="text-blue-600 font-mono font-black text-xs bg-white px-3 py-1 rounded-xl border border-blue-100">{formatTime(note.timestamp)}</span>
                              <p className="text-xs font-bold text-slate-700">{note.text}</p>
                           </div>
                           <button onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }} className="text-rose-400 hover:text-rose-600 px-2 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </div>
                     ))}
                     {videoNotes.length === 0 && <p className="text-center text-slate-400 text-[10px] font-bold py-4">لا توجد ملاحظات مسجلة على هذا الفيديو.</p>}
                  </div>
               </div>
            </div>
         )}
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
