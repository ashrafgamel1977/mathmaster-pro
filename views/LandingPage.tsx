
import React, { useState } from 'react';
import { PlatformSettings, Student } from '../types';

interface LandingPageProps {
  teacherName: string;
  platformName: string;
  settings?: PlatformSettings;
  students?: Student[];
  onUnifiedLogin: (role: 'student' | 'teacher' | 'parent', code: string) => void;
  onStudentRegister: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ teacherName, platformName, settings, students = [], onUnifiedLogin, onStudentRegister }) => {
  const [activeRole, setActiveRole] = useState<'student' | 'parent' | 'teacher'>('student');
  const [credential, setCredential] = useState('');
  
  // Retrieve Code State
  const [showRetrieveModal, setShowRetrieveModal] = useState(false);
  const [retrievePhone, setRetrievePhone] = useState('');
  const [retrievedStudent, setRetrievedStudent] = useState<Student | null>(null);
  const [retrieveError, setRetrieveError] = useState('');

  const landingTitle = settings?.contentTexts?.landingTitle || `بوابة الاحتراف في الرياضيات`;
  const landingSubtitle = settings?.contentTexts?.landingSubtitle || `مرحباً بك في المنصة الخاصة بالأستاذ ${teacherName}`;

  const handleSubmit = () => {
    if (!credential) return;
    onUnifiedLogin(activeRole, credential);
  };

  const handleRetrieveCode = () => {
      const student = students.find(s => s.studentPhone === retrievePhone || s.parentPhone === retrievePhone);
      if (student) {
          setRetrievedStudent(student);
          setRetrieveError('');
      } else {
          setRetrievedStudent(null);
          setRetrieveError('رقم الهاتف غير مسجل في النظام. يرجى التأكد أو إنشاء حساب جديد.');
      }
  };

  const triggerInstall = () => {
    window.dispatchEvent(new Event('open-install-prompt'));
  };

  const getPlaceholder = () => {
    switch(activeRole) {
      case 'student': return 'كود الطالب (أو "guest" للمعاينة)';
      case 'parent': return 'رقم هاتف ولي الأمر';
      case 'teacher': return 'كود المعلم أو المساعد';
      default: return '';
    }
  };

  return (
    <div className="min-h-screen font-['Cairo'] overflow-hidden relative text-right flex flex-col bg-[#0f172a]" dir="rtl">
      
      {/* Royal Background Effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
         <div className="absolute -top-[10%] -right-[10%] w-[50vw] h-[50vw] bg-amber-500/10 blur-[120px] rounded-full mix-blend-screen animate-pulse"></div>
         <div className="absolute -bottom-[10%] -left-[10%] w-[40vw] h-[40vw] bg-orange-600/10 blur-[100px] rounded-full mix-blend-screen"></div>
         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03]"></div>
      </div>

      {/* Manual Install Button - Enhanced for higher visibility */}
      <div className="absolute top-6 left-6 z-50 flex flex-col items-start gap-2">
          <button 
            onClick={triggerInstall}
            className="bg-gradient-to-r from-indigo-600 to-blue-700 hover:from-indigo-500 hover:to-blue-600 text-white px-5 py-3 rounded-2xl backdrop-blur-md border border-white/20 font-black text-xs flex items-center gap-3 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95"
          >
            <span className="flex flex-col items-start leading-none">
                <span className="text-[10px] opacity-80 mb-1 font-bold">للحصول على التنبيهات</span>
                <span>تثبيت التطبيق 📲</span>
            </span>
          </button>
      </div>

      <main className="relative z-10 w-full max-w-7xl mx-auto px-4 min-h-screen flex flex-col md:flex-row items-center justify-center gap-12 lg:gap-20 py-10">
        
        {/* Right Side: Welcome Text & Branding */}
        <div className="flex-1 text-center md:text-right space-y-8 animate-slideUp order-2 md:order-1">
          <div className="relative inline-block group">
             <div className="absolute -inset-1 bg-gradient-to-r from-amber-300 via-orange-500 to-amber-300 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
             {settings?.branding?.heroImageUrl ? (
                <img 
                  src={settings.branding.heroImageUrl} 
                  className="relative w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-[#0f172a] shadow-2xl"
                  alt="Teacher"
                />
             ) : (
               <div className="relative w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center bg-[#0f172a] border-4 border-amber-500/50 shadow-2xl">
                 <span className="text-5xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-br from-amber-200 to-orange-500 font-black">∑</span>
               </div>
             )}
          </div>
          
          <div className="space-y-4 relative">
             <h1 className="text-4xl md:text-6xl font-black text-white leading-tight tracking-tight drop-shadow-lg">
                {landingTitle} <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300">
                  {platformName}
                </span>
             </h1>
             <p className="text-slate-400 text-lg md:text-xl font-medium leading-relaxed max-w-2xl mx-auto md:mx-0 border-r-4 border-orange-500 pr-4">
                {landingSubtitle}
             </p>
          </div>

          <div className="hidden md:flex gap-4 opacity-70">
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <span className="text-amber-400">★</span>
                <span className="text-slate-300 text-xs font-bold">تميز أكاديمي</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <span className="text-amber-400">🛡️</span>
                <span className="text-slate-300 text-xs font-bold">محتوى محمي</span>
             </div>
             <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
                <span className="text-amber-400">🤖</span>
                <span className="text-slate-300 text-xs font-bold">ذكاء اصطناعي</span>
             </div>
          </div>
        </div>

        {/* Left Side: Login Card (Royal Style) */}
        <div className="w-full max-w-md animate-fadeIn delay-100 order-1 md:order-2">
           <div className="bg-[#1e293b]/80 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl border border-white/10 relative overflow-hidden group">
              
              {/* Card Glow Effect */}
              <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-50"></div>
              
              <div className="space-y-8 relative z-10">
                 <div className="text-center">
                    <h3 className="text-2xl font-black text-white mb-2">تسجيل الدخول</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">اختر نوع الحساب للمتابعة</p>
                 </div>

                 {/* Role Selection - Premium Buttons */}
                 <div className="grid grid-cols-3 gap-2 bg-[#0f172a] p-1.5 rounded-2xl border border-white/5">
                    {[
                      { id: 'student', label: 'طالب', icon: '🎓' },
                      { id: 'parent', label: 'ولي أمر', icon: '👨‍👩‍👦' },
                      { id: 'teacher', label: 'معلم', icon: '👑' }
                    ].map((role) => (
                      <button 
                        key={role.id}
                        onClick={() => setActiveRole(role.id as any)} 
                        className={`flex flex-col items-center justify-center py-3 rounded-xl transition-all duration-300 ${
                          activeRole === role.id 
                            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-orange-900/20 scale-100' 
                            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <span className="text-lg mb-1">{role.icon}</span>
                        <span className="text-[10px] font-black">{role.label}</span>
                      </button>
                    ))}
                 </div>

                 {/* Input Area */}
                 <div className="space-y-5">
                    <div className="relative group">
                       <input 
                         type={activeRole === 'parent' ? 'tel' : 'text'}
                         placeholder={getPlaceholder()}
                         className="w-full px-6 py-5 bg-[#0f172a] border border-slate-700/50 focus:border-amber-500/50 rounded-2xl font-bold text-lg text-center outline-none transition-all text-white placeholder:text-slate-600 focus:shadow-[0_0_20px_rgba(245,158,11,0.1)]"
                         value={credential}
                         onChange={e => setCredential(e.target.value)}
                         onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                       />
                       <div className="absolute inset-0 rounded-2xl ring-1 ring-white/5 pointer-events-none"></div>
                    </div>

                    <button 
                      onClick={handleSubmit}
                      className="w-full py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-600/20 hover:shadow-orange-600/40 hover:scale-[1.02] active:scale-95 transition-all relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 transition-transform group-hover:scale-105"></div>
                      <span className="relative text-white flex items-center justify-center gap-2">
                        تسجيل الدخول
                        <span className="text-xl">➔</span>
                      </span>
                    </button>
                 </div>

                 {activeRole === 'student' && (
                    <div className="pt-6 border-t border-white/5 text-center flex justify-between items-center px-2">
                       <button 
                         onClick={() => setShowRetrieveModal(true)}
                         className="text-xs font-bold text-slate-400 hover:text-white transition-colors"
                       >
                          نسيت الكود؟
                       </button>
                       <button 
                         onClick={onStudentRegister}
                         className="text-sm font-black text-amber-400 hover:text-amber-300 transition-colors border-b border-dashed border-amber-400/30 hover:border-amber-400 pb-0.5"
                       >
                          إنشاء حساب جديد
                       </button>
                    </div>
                 )}
              </div>
           </div>
        </div>

      </main>

      {/* Retrieve Code Modal */}
      {showRetrieveModal && (
          <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowRetrieveModal(false)}></div>
              <div className="bg-white w-full max-w-md rounded-[3rem] p-8 relative z-10 animate-slideUp text-center">
                  <h3 className="text-2xl font-black text-slate-800 mb-2">استعلام عن الكود 🔑</h3>
                  <p className="text-slate-500 text-sm font-bold mb-6">أدخل رقم الهاتف المسجل لدينا (الطالب أو ولي الأمر)</p>
                  
                  <div className="space-y-4">
                      <input 
                        type="tel" 
                        placeholder="رقم الهاتف" 
                        className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-center text-lg outline-none border-2 border-transparent focus:border-indigo-600"
                        value={retrievePhone}
                        onChange={e => setRetrievePhone(e.target.value)}
                      />
                      <button 
                        onClick={handleRetrieveCode}
                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg"
                      >
                        بحث
                      </button>
                  </div>

                  {retrievedStudent && (
                      <div className="mt-6 p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 animate-fadeIn">
                          <p className="text-xs font-bold text-emerald-600 mb-1">تم العثور على الحساب:</p>
                          <h4 className="text-lg font-black text-slate-800">{retrievedStudent.name}</h4>
                          <div className="my-3 py-3 bg-white rounded-xl border border-emerald-200">
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">كود الدخول</p>
                              <p className="text-3xl font-black text-emerald-600 font-mono tracking-wider">{retrievedStudent.studentCode}</p>
                          </div>
                          <button 
                            onClick={() => { setCredential(retrievedStudent.studentCode); setShowRetrieveModal(false); }}
                            className="text-xs font-bold text-emerald-700 underline"
                          >
                              استخدام الكود للدخول
                          </button>
                      </div>
                  )}

                  {retrieveError && (
                      <div className="mt-6 p-4 bg-rose-50 text-rose-600 text-xs font-bold rounded-2xl">
                          {retrieveError}
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
};

export default LandingPage;
