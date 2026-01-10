
import React, { useState, useEffect } from 'react';
import { Student, Quiz, Assignment, AssignmentSubmission, AppView, PlatformSettings, Assistant } from '../types';

interface DashboardProps {
  teacherName: string;
  platformName?: string;
  students: Student[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  settings?: PlatformSettings;
  onNavigate?: (view: AppView) => void;
  loggedUser?: any;
  isConnected?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ teacherName, platformName = "MathMaster Pro", students, quizzes, assignments, submissions, settings, onNavigate, loggedUser, isConnected = false }) => {
  const [isProMode, setIsProMode] = useState(false);
  const isAssistant = loggedUser?.role === 'assistant';
  const permissions = isAssistant ? (loggedUser as Assistant).permissions : Object.values(AppView);

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setIsProMode(hasKey);
      }
    };
    checkKey();
  }, []);

  const pendingGrading = submissions.filter(s => s.status === 'pending').length;
  
  const stats = [
    { label: 'إجمالي الطلاب', value: students.length, icon: '👥', color: 'from-blue-600 to-indigo-700', shadow: 'shadow-blue-200' },
    { label: 'بانتظار التصحيح', value: pendingGrading, icon: '✍️', color: 'from-rose-500 to-red-700', shadow: 'shadow-rose-200' },
    { label: 'المهمات الدراسية', value: assignments.length, icon: '📚', color: 'from-emerald-500 to-teal-700', shadow: 'shadow-emerald-200' },
    { label: 'النقاط الموزعة', value: students.reduce((acc, s) => acc + (s.points || 0), 0), icon: '✨', color: 'from-amber-400 to-orange-600', shadow: 'shadow-amber-200' },
  ];

  const quickActions = [
    { label: 'رصد النتائج', view: AppView.RESULTS, icon: '📊', bg: 'bg-blue-50', text: 'text-blue-600' },
    { label: 'متجر الهدايا', view: AppView.REWARDS, icon: '🎁', bg: 'bg-amber-50', text: 'text-amber-600' },
    { label: 'إرسال تنبيه', view: AppView.NOTIFICATIONS, icon: '📢', bg: 'bg-rose-50', text: 'text-rose-600' },
    { label: 'ضبط الأمان', view: AppView.SETTINGS, icon: '🛡️', bg: 'bg-slate-100', text: 'text-slate-600' },
  ].filter(action => isAssistant ? permissions.includes(action.view) : true);

  return (
    <div className="space-y-10 animate-fadeIn pb-24 text-right" dir="rtl">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 p-12 md:p-20 text-white shadow-2xl border border-white/5 group">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.15),transparent_60%)]"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
          <div className="flex-1 space-y-8 text-center lg:text-right">
            <div className="flex flex-wrap justify-center lg:justify-start gap-3">
               {/* Cloud Sync Indicator */}
               <div className={`inline-flex items-center gap-3 px-6 py-2 backdrop-blur-2xl rounded-full border transition-colors ${isConnected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                  </span>
                  <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isConnected ? 'text-emerald-200' : 'text-rose-200'}`}>
                      {isConnected ? 'تم الحفظ سحابياً (آمن)' : 'غير متصل (بيانات مؤقتة)'}
                  </span>
               </div>
               
               {isProMode && (
                 <div className="inline-flex items-center gap-3 px-6 py-2 bg-blue-500/10 backdrop-blur-2xl rounded-full border border-blue-500/20">
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200">AI Premium</span>
                 </div>
               )}
               
               {settings?.integrityMode && (
                 <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500/10 backdrop-blur-2xl rounded-full border border-rose-500/20">
                    <span className="text-[9px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                       <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                       درع النزاهة نشط 🛡️
                    </span>
                 </div>
               )}
            </div>
            
            <h2 className="text-5xl md:text-8xl font-black leading-[1] tracking-tighter">
              أهلاً بك، <br/>
              أستاذ <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">{teacherName.split(' ')[0]}</span> ✨
            </h2>
            
            <p className="text-slate-400 text-lg md:text-xl font-medium max-w-xl mx-auto lg:mx-0 leading-relaxed">
              منصتك الآن في أبهى صورها. ذكاء اصطناعي، أتمتة كاملة، وحفظ تلقائي لكل البيانات في السحابة.
            </p>

            <div className="pt-6 flex flex-wrap gap-5 justify-center lg:justify-start">
              {(!isAssistant || permissions.includes(AppView.CONTROL_PANEL)) && (
                <button 
                  onClick={() => onNavigate?.(AppView.CONTROL_PANEL)}
                  className="px-12 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-[2rem] font-black shadow-2xl shadow-blue-900/40 transition-all hover:scale-105 flex items-center gap-3"
                >
                  <span>⚙️</span> <span>لوحة التحكم</span>
                </button>
              )}
              {(!isAssistant || permissions.includes(AppView.CHAT)) && (
                <button 
                  onClick={() => onNavigate?.(AppView.CHAT)}
                  className="px-12 py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-[2rem] font-black transition-all backdrop-blur-md flex items-center gap-3"
                >
                  <span>💬</span> <span>الرد على الطلاب</span>
                </button>
              )}
            </div>
          </div>

          <div className="lg:w-96 w-full">
             <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/10 shadow-2xl space-y-8">
                <div className="flex justify-between items-center border-b border-white/10 pb-6">
                   <h4 className="font-black text-sm uppercase tracking-widest text-blue-400">حالة المنصة</h4>
                   <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full">LIVE</span>
                </div>
                <div className="space-y-6">
                   <div className="flex justify-between items-center">
                      <span className="text-slate-400 text-xs font-bold">نشاط الطلاب</span>
                      <span className="text-white font-black">94%</span>
                   </div>
                   <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 w-[94%] shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Quick Access Grid - New Triggers */}
      {quickActions.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
           {quickActions.map((action, i) => (
             <button 
               key={i} 
               onClick={() => onNavigate?.(action.view)}
               className={`p-6 rounded-[2.5rem] ${action.bg} border border-white shadow-sm hover:shadow-xl hover:translate-y-[-5px] transition-all flex flex-col items-center gap-3 group`}
             >
                <span className="text-3xl group-hover:scale-110 transition-transform">{action.icon}</span>
                <span className={`text-[10px] font-black uppercase tracking-widest ${action.text}`}>{action.label}</span>
             </button>
           ))}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white p-10 rounded-[3.5rem] shadow-xl ${stat.shadow} border border-slate-50 transition-all hover:translate-y-[-10px] cursor-pointer group`}>
            <div className={`w-16 h-16 rounded-[1.8rem] bg-gradient-to-br ${stat.color} flex items-center justify-center text-3xl text-white mb-8 shadow-lg group-hover:rotate-6 transition-transform`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{stat.label}</p>
              <p className="text-4xl font-black text-slate-900">{stat.value.toLocaleString()}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Tools Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-8">
             {(!isAssistant || permissions.includes(AppView.AI_SOLVER)) && (
               <div onClick={() => onNavigate?.(AppView.AI_SOLVER)} className="p-12 bg-white rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-right group cursor-pointer relative overflow-hidden">
                  <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-4xl mb-10 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">🧠</div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">المحلل الذكي Pro</h3>
                  <p className="text-sm text-slate-400 font-bold leading-relaxed">استخدم قوة Gemini 3 Pro في حل وشرح أصعب المسائل الرياضية بالخطوات.</p>
               </div>
             )}
             
             {(!isAssistant || permissions.includes(AppView.QUIZZES)) && (
               <div onClick={() => onNavigate?.(AppView.QUIZZES)} className="p-12 bg-white rounded-[4rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all text-right group cursor-pointer relative overflow-hidden">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-4xl mb-10 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">🪄</div>
                  <h3 className="text-2xl font-black text-slate-800 mb-3">مولد الاختبارات</h3>
                  <p className="text-sm text-slate-400 font-bold leading-relaxed">حول أي صورة أو نص إلى اختبار تفاعلي كامل لطلابك.</p>
               </div>
             )}
          </div>

          {(!isAssistant || permissions.includes(AppView.RESULTS)) && (
            <div className="xl:col-span-1 bg-gradient-to-br from-indigo-900 to-slate-950 rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between group">
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-3">
                     <span className="text-2xl">🏆</span>
                     <h4 className="text-xl font-black">لوحة الشرف</h4>
                  </div>
                  <p className="text-sm text-indigo-200 font-medium leading-relaxed">كرم طلابك المتفوقين الآن بإصدار شهادات تقدير آلية.</p>
                  <div className="pt-4 flex -space-x-3 rtl:space-x-reverse">
                     {students.slice(0, 5).map((s, i) => (
                       <img key={i} src={s.avatar} className="w-10 h-10 rounded-full border-2 border-slate-900 shadow-lg" alt="" />
                     ))}
                  </div>
               </div>
               <button onClick={() => onNavigate?.(AppView.RESULTS)} className="mt-12 py-5 bg-white text-indigo-900 rounded-[2rem] font-black text-xs hover:bg-blue-400 hover:text-white transition-all shadow-xl">عرض النتائج والتكريم</button>
            </div>
          )}
      </div>
    </div>
  );
};

export default Dashboard;
