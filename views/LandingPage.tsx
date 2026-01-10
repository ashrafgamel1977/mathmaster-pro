
import React, { useState } from 'react';
import { PlatformSettings } from '../types';

interface LandingPageProps {
  teacherName: string;
  platformName: string;
  settings?: PlatformSettings;
  onStudentEntry: () => void;
  onStudentRegister: () => void;
  onTeacherEntry: (code: string) => void;
  onParentEntry: () => void;
  onAssistantEntry: (code: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ teacherName, platformName, settings, onStudentEntry, onStudentRegister, onTeacherEntry, onParentEntry }) => {
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminCode, setAdminCode] = useState('');

  const primaryColor = settings?.branding?.primaryColor || '#2563eb';
  const secondaryColor = settings?.branding?.secondaryColor || '#f59e0b';
  
  const landingTitle = settings?.contentTexts?.landingTitle || `بوابة الاحتراف في الرياضيات`;
  const landingSubtitle = settings?.contentTexts?.landingSubtitle || `مرحباً بك في المنصة الخاصة بالأستاذ ${teacherName}`;

  const handleAdminSubmit = () => {
    if (!adminCode) return;
    onTeacherEntry(adminCode);
    setAdminCode('');
  };

  return (
    <div className="min-h-screen bg-slate-950 font-['Cairo'] overflow-hidden relative text-right" dir="rtl">
      {/* Background Math Patterns */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
         <div className="absolute top-10 left-10 text-[15rem] font-black" style={{color: primaryColor}}>∑</div>
         <div className="absolute bottom-10 right-10 text-[15rem] font-black" style={{color: secondaryColor}}>∫</div>
         <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:40px_40px]"></div>
      </div>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <header className="flex flex-col items-center text-center space-y-8 mb-20 animate-fadeIn">
          {settings?.branding?.heroImageUrl ? (
             <img 
               src={settings.branding.heroImageUrl} 
               className="w-40 h-40 md:w-56 md:h-56 rounded-full object-cover border-8 border-white/5 shadow-[0_0_50px_rgba(255,255,255,0.1)]"
               alt="Teacher"
             />
          ) : (
            <div className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center text-white text-5xl font-black shadow-[0_0_50px_rgba(37,99,235,0.3)] rotate-3" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}>
              ∑
            </div>
          )}
          
          <div className="space-y-4">
             {settings?.branding?.logoUrl && (
               <img src={settings.branding.logoUrl} className="h-16 mx-auto mb-4 object-contain" alt="Logo" />
             )}
             
             <h1 className="text-5xl md:text-7xl font-black text-white leading-tight tracking-tighter max-w-4xl mx-auto">
                {landingTitle}
             </h1>
             <p className="text-slate-400 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                {landingSubtitle}
             </p>
          </div>
        </header>

        {/* Entrance Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
           {/* Student Card */}
           <div 
             onClick={onStudentEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 blur-3xl rounded-full transition-all" style={{ backgroundColor: `${primaryColor}30` }}></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-6xl">🎓</div>
                 <h3 className="text-3xl font-black text-white">بوابة الطالب</h3>
                 <p className="text-slate-400 font-bold text-sm leading-relaxed">ادخل لمتابعة دروسك، اختباراتك اليومية، والتواصل مع المعلم.</p>
                 <button className="w-full py-5 text-white rounded-[2rem] font-black shadow-xl transition-colors" style={{ backgroundColor: primaryColor }}>دخول المنصة ⭠</button>
                 <button onClick={(e) => { e.stopPropagation(); onStudentRegister(); }} className="w-full text-xs font-black hover:text-white transition-colors" style={{ color: primaryColor }}>تسجيل حساب جديد</button>
              </div>
           </div>

           {/* Parent Card */}
           <div 
             onClick={onParentEntry}
             className="group relative bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 blur-3xl rounded-full transition-all" style={{ backgroundColor: `${secondaryColor}30` }}></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-6xl">👨‍👩‍👦</div>
                 <h3 className="text-3xl font-black text-white">ولي الأمر</h3>
                 <p className="text-slate-400 font-bold text-sm leading-relaxed">تابع نتائج ابنك ومستواه الأكاديمي، واطلع على تقارير الحضور.</p>
                 <button className="w-full py-5 text-white rounded-[2rem] font-black shadow-xl transition-colors" style={{ backgroundColor: secondaryColor }}>عرض التقرير ⭠</button>
              </div>
           </div>

           {/* Unified Admin Card */}
           <div 
             onClick={() => setShowAdminLogin(true)}
             className="group relative bg-white/5 backdrop-blur-xl p-10 rounded-[4rem] border border-white/10 shadow-2xl transition-all hover:scale-105 hover:bg-white/10 cursor-pointer overflow-hidden border-dashed"
           >
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-slate-500/10 blur-3xl rounded-full transition-all"></div>
              <div className="relative z-10 space-y-6">
                 <div className="text-6xl">🛠️</div>
                 <h3 className="text-3xl font-black text-white">الإدارة والطاقم</h3>
                 <p className="text-slate-400 font-bold text-sm leading-relaxed">المنطقة المخصصة للمعلم وفريق المساعدين لإدارة شؤون المنصة.</p>
                 <button className="w-full py-5 bg-white/10 text-white border border-white/10 rounded-[2rem] font-black backdrop-blur-md transition-all">تسجيل الدخول</button>
              </div>
           </div>
        </div>
      </main>

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-md animate-fadeIn" onClick={() => setShowAdminLogin(false)}></div>
           <div className="bg-white w-full max-w-md p-10 rounded-[4rem] relative z-10 animate-slideUp text-center space-y-8 shadow-2xl">
              <div className="w-20 h-20 text-white rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl" style={{ backgroundColor: primaryColor }}>⚙️</div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-black text-slate-800">بوابة الطاقم</h3>
                 <p className="text-slate-400 font-bold text-sm">يرجى إدخال كود الدخول الخاص بك</p>
              </div>
              <input 
                type="password" 
                placeholder="أدخل الكود هنا" 
                className="w-full px-8 py-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-black text-center text-2xl outline-none transition-all shadow-inner"
                value={adminCode}
                onChange={e => setAdminCode(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdminSubmit()}
              />
              <div className="flex gap-4">
                 <button onClick={handleAdminSubmit} className="flex-1 py-5 text-white rounded-2xl font-black shadow-lg" style={{ backgroundColor: primaryColor }}>دخول</button>
                 <button onClick={() => setShowAdminLogin(false)} className="px-8 py-5 bg-slate-100 text-slate-400 rounded-2xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      <footer className="absolute bottom-10 left-0 right-0 text-center z-10">
         <p className="text-slate-500 text-[10px] font-black tracking-widest uppercase">
            Designed for Excellence &copy; {new Date().getFullYear()} {platformName}
         </p>
      </footer>
    </div>
  );
};

export default LandingPage;
