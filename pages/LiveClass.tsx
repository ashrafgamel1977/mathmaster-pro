
import React, { useState } from 'react';
import { PlatformSettings, EducationalSource, Year } from '../types';

interface LiveClassProps {
  teacherName: string; 
  settings: PlatformSettings;
  educationalSources: EducationalSource[];
  onUpdateSettings: (settings: PlatformSettings) => void;
  onBroadcastToWhatsApp: () => void;
  onPostSummary: (source: EducationalSource) => void;
  years?: Year[];
}

const LiveClass: React.FC<LiveClassProps> = ({ settings, onUpdateSettings, onBroadcastToWhatsApp, years = [] }) => {
  const [targetYearId, setTargetYearId] = useState<string>(settings.liveSessionTargetYear || 'all');
  
  const toggleLiveSession = () => {
        if (!settings.liveSessionLink) return alert('يرجى إضافة رابط الاجتماع أولاً (Zoom / Meet)');
        onUpdateSettings({
            ...settings, 
            liveSessionActive: !settings.liveSessionActive,
            liveSessionTargetYear: targetYearId
        });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-slideUp pb-20 text-right" dir="rtl">
      
      <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="relative z-10 space-y-4">
            <h2 className="text-3xl font-black">غرفة البث المباشر 🔴</h2>
            <p className="text-slate-400 font-bold text-sm">ابدأ الحصة وتواصل مع طلابك عبر Zoom أو Google Meet.</p>
            
            <div className="flex gap-2">
                <span className={`px-4 py-2 rounded-xl text-xs font-black ${settings.liveSessionActive ? 'bg-emerald-500 text-white animate-pulse' : 'bg-white/10 text-slate-400'}`}>
                    {settings.liveSessionActive ? 'البث جاري الآن (Live) 📡' : 'البث متوقف 💤'}
                </span>
            </div>
         </div>
         <div className="relative z-10">
             <button 
                onClick={toggleLiveSession}
                className={`w-40 h-40 rounded-full border-8 border-white/10 flex flex-col items-center justify-center transition-all hover:scale-105 shadow-2xl ${settings.liveSessionActive ? 'bg-rose-600 shadow-rose-900/50' : 'bg-emerald-600 shadow-emerald-900/50'}`}
             >
                <span className="text-4xl mb-2">{settings.liveSessionActive ? '■' : '▶'}</span>
                <span className="font-black text-sm">{settings.liveSessionActive ? 'إنهاء' : 'بدء'}</span>
             </button>
         </div>
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
         <h3 className="font-black text-slate-800 text-lg">إعدادات الرابط</h3>
         
         <div className="space-y-4">
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">عنوان الحصة</label>
               <input type="text" placeholder="مثال: مراجعة ليلة الامتحان - تفاضل" className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" value={settings.liveSessionTitle} onChange={e => onUpdateSettings({...settings, liveSessionTitle: e.target.value})} />
            </div>
            
            <div>
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">رابط الاجتماع (Zoom / Meet)</label>
               <input type="text" placeholder="https://zoom.us/j/..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 text-left" dir="ltr" value={settings.liveSessionLink} onChange={e => onUpdateSettings({...settings, liveSessionLink: e.target.value})} />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الصف المستهدف</label>
                  <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={targetYearId} onChange={e => setTargetYearId(e.target.value)}>
                     <option value="all">كل الطلاب</option>
                     {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
               </div>
               <div className="flex items-end">
                  <button onClick={onBroadcastToWhatsApp} className="w-full py-4 bg-emerald-50 text-emerald-600 font-black rounded-2xl hover:bg-emerald-100 transition-all text-xs">📢 إرسال تنبيه واتساب</button>
               </div>
            </div>
         </div>
      </div>

      <div className="flex gap-4 opacity-60 pointer-events-none grayscale">
         {/* Disabled features placeholders just to fill space */}
         <div className="flex-1 bg-slate-100 p-6 rounded-3xl text-center">
            <span className="text-3xl block mb-2">📹</span>
            <p className="font-bold text-slate-400 text-xs">تسجيل الحصة (قريباً)</p>
         </div>
         <div className="flex-1 bg-slate-100 p-6 rounded-3xl text-center">
            <span className="text-3xl block mb-2">📊</span>
            <p className="font-bold text-slate-400 text-xs">تقرير الحضور (قريباً)</p>
         </div>
      </div>

    </div>
  );
};

export default LiveClass;
