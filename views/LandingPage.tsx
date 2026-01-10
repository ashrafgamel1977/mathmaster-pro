
import React from 'react';

interface LandingPageProps {
  teacherName: string;
  platformName: string;
  onStudentEntry: () => void;
  onStudentRegister: () => void;
  onTeacherEntry: () => void;
  onParentEntry: () => void;
  onAssistantEntry: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ teacherName, platformName, onStudentEntry, onStudentRegister, onTeacherEntry, onParentEntry, onAssistantEntry }) => {
  return (
    <div className="min-h-screen bg-slate-950 font-['Cairo'] overflow-hidden relative text-right" dir="rtl">
      {/* Background Math Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
         <div className="absolute top-10 left-10 text-[15rem] font-black">∑</div>
         <div className="absolute bottom-10 right-10 text-[15rem] font-black">∫</div>
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[30rem] font-black">π</div>
         <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <header className="flex flex-col items-center text-center space-y-8 mb-20 animate-fadeIn">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-[0_0_50px_rgba(37,99,235,0.3)] rotate-3">
            ∑
          </div>
          <div className="space-y-4">
             <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">نظام التعليم الذكي Pro 2025</span>
             </div>
             <h1 className="text-6xl md:text-8xl font-black text-white leading-tight tracking-tighter">
                بوابة <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-blue-200 bg-clip-text text-transparent">الاحتراف</span> في الرياضيات
             </h1>
             <p className="text-slate-400 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                مرحباً بك في المنصة الخاصة بالأستاذ <span className="text-white font-black">{teacherName}</span>. حيث تلتقي التكنولوجيا بعبقرية الأرقام.
             </p>
          </div>
        </header>

        {/* Entrance Options */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {/* Student Card */}
           <div 
             onClick={onStudentEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full group-hover:bg-blue-600/40 transition-all"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-5xl">🎓</div>
                 <h3 className="text-2xl font-black text-white">بوابة الطالب</h3>
                 <p className="text-slate-400 font-bold text-[10px] leading-relaxed">ادخل لمتابعة دروسك واختباراتك اليومية.</p>
                 <button className="w-full py-4 bg-blue-600 text-white rounded-[1.5rem] font-black shadow-xl group-hover:bg-blue-500 transition-colors">دخول ⭠</button>
                 <button onClick={(e) => { e.stopPropagation(); onStudentRegister(); }} className="w-full text-blue-400 text-[10px] font-black hover:text-white transition-colors">تسجيل جديد</button>
              </div>
           </div>

           {/* Parent Card */}
           <div 
             onClick={onParentEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-amber-500/10 blur-3xl rounded-full group-hover:bg-amber-500/30 transition-all"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-5xl">👨‍👩‍👦</div>
                 <h3 className="text-2xl font-black text-white">ولي الأمر</h3>
                 <p className="text-slate-400 font-bold text-[10px] leading-relaxed">تابع نتائج ابنك ومستواه الأكاديمي أولاً بأول.</p>
                 <button className="w-full py-4 bg-amber-500 text-white rounded-[1.5rem] font-black shadow-xl group-hover:bg-amber-400 transition-colors">تقرير ⭠</button>
              </div>
           </div>

           {/* Assistant Card */}
           <div 
             onClick={onAssistantEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-indigo-500/10 blur-3xl rounded-full group-hover:bg-indigo-500/30 transition-all"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-5xl">🛠️</div>
                 <h3 className="text-2xl font-black text-white">المساعدون</h3>
                 <p className="text-slate-400 font-bold text-[10px] leading-relaxed">بوابة فريق العمل والسكرتارية لمتابعة المهام.</p>
                 <button className="w-full py-4 bg-indigo-600 text-white rounded-[1.5rem] font-black shadow-xl group-hover:bg-indigo-500 transition-colors">دخول العمل ⭠</button>
              </div>
           </div>

           {/* Teacher Card */}
           <div 
             onClick={onTeacherEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-8 rounded-[3.5rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden border-dashed"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-slate-500/10 blur-3xl rounded-full group-hover:bg-slate-500/30 transition-all"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-5xl">⚙️</div>
                 <h3 className="text-2xl font-black text-white">لوحة الإدارة</h3>
                 <p className="text-slate-400 font-bold text-[10px] leading-relaxed">تحكم كامل في محتوى المنصة والطلاب.</p>
                 <button className="w-full py-4 bg-white/10 text-white border border-white/10 rounded-[1.5rem] font-black backdrop-blur-md group-hover:bg-white/20 transition-all">المسؤول</button>
              </div>
           </div>
        </div>
      </main>

      <footer className="absolute bottom-10 left-0 right-0 text-center z-10">
         <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
            Designed for Math Excellence &copy; {new Date().getFullYear()} {platformName}
         </p>
      </footer>
    </div>
  );
};

export default LandingPage;
