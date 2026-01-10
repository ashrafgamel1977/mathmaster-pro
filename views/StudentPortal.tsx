
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz, AssignmentSubmission, ChatMessage, Year, AppNotification, Group, EducationalSource, ScheduleEntry, MathFormula, PlatformReward, RewardRedemption } from '../types';
import ProtectedVideo from '../components/ProtectedVideo';
import Notifications from './Notifications';
import ChatRoom from './ChatRoom';
import AISolver from './AISolver';
import Rewards from './Rewards';
import LuckyWheel from '../components/LuckyWheel';

interface StudentPortalProps {
  student: Student | null;
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  quizzes: Quiz[];
  results: QuizResult[];
  settings: PlatformSettings;
  videoLessons: VideoLesson[];
  notifications: AppNotification[];
  groups: Group[];
  educationalSources: EducationalSource[];
  schedules: ScheduleEntry[];
  formulas: MathFormula[];
  rewards: PlatformReward[];
  redemptions: RewardRedemption[];
  onQuizSubmit: (result: QuizResult) => void;
  onAssignmentSubmit: (submission: Omit<AssignmentSubmission, 'id' | 'status'>) => void;
  onLogin: (code: string) => void;
  onSendMessage: (text: string, type: 'group' | 'private', recipientId?: string, audioData?: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onRedeemReward: (rewardId: string) => void;
  onSpinWin?: (points: number) => void;
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
  onBack: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  groups, educationalSources, schedules, formulas, rewards, redemptions,
  onQuizSubmit, onAssignmentSubmit, onLogin, onSendMessage, onMarkNotificationRead, onRedeemReward, onSpinWin, messages, years, students, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'quizzes' | 'rewards' | 'library' | 'schedule' | 'formulas' | 'chat' | 'notifications' | 'ai_solver' | string>(() => {
    return localStorage.getItem('math_student_activeTab') || 'home';
  });

  const [loginCode, setLoginCode] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [showWheel, setShowWheel] = useState(false);
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [integrityWarnings, setIntegrityWarnings] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const [notifPermission, setNotifPermission] = useState(Notification.permission);

  const primaryColor = settings.branding.primaryColor || '#2563eb';
  const secondaryColor = settings.branding.secondaryColor || '#f59e0b';

  useEffect(() => {
    localStorage.setItem('math_student_activeTab', activeTab);
  }, [activeTab]);

  const studentYear = useMemo(() => years.find(y => y.id === student?.yearId), [student, years]);
  const mySchedule = useMemo(() => schedules.filter(s => s.groupId === student?.groupId), [schedules, student]);
  const myFormulas = useMemo(() => formulas.filter(f => f.yearId === student?.yearId || f.yearId === ''), [formulas, student]);
  const unreadCount = notifications.filter(n => !n.isRead && (n.targetStudentId === student?.id || n.targetYearId === student?.yearId)).length;

  const canSpin = useMemo(() => {
    if (!student?.lastSpinDate) return true;
    const lastDate = new Date(student.lastSpinDate).getTime();
    const now = new Date().getTime();
    return (now - lastDate) >= (24 * 60 * 60 * 1000); 
  }, [student?.lastSpinDate]);

  const requestNotificationPermission = useCallback(async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setNotifPermission(permission);
    if (permission === 'granted') {
      // Test notification
      new Notification('تم تفعيل التنبيهات بنجاح! 🔔', {
        body: 'ستصلك الآن إشعارات بالواجبات والاختبارات الجديدة.',
        icon: settings.branding.logoUrl
      });
    }
  }, [settings.branding.logoUrl]);

  // --- Integrity Mode Implementation ---
  useEffect(() => {
    if (settings.integrityMode && student && student.id !== 'guest_login') {
      const handleVisibilityChange = () => {
        if (document.hidden) {
          setIsBlurred(true);
          // Only warn if in a quiz or critical section
          if (activeQuizId) {
             setIntegrityWarnings(prev => {
                const next = prev + 1;
                return next;
             });
          }
        } else {
          // Keep blurred until user interacts or simple timeout to discourage switching
          setTimeout(() => setIsBlurred(false), 200);
        }
      };

      const handleBlur = () => {
        setIsBlurred(true);
      };

      const handleFocus = () => {
        setIsBlurred(false);
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        // Block PrintScreen, Ctrl+C, Ctrl+V, Ctrl+Shift+I (DevTools)
        if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault();
          alert('🚫 تم تعطيل هذه الوظيفة للحفاظ على نزاهة المنصة.');
        }
      };

      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault();
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', handleContextMenu);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', handleContextMenu);
      };
    }
  }, [settings.integrityMode, activeQuizId, student]);

  useEffect(() => {
    if (integrityWarnings > 0 && activeQuizId) {
        if (integrityWarnings >= 3) {
            alert("⚠️ تم اكتشاف محاولة غش متكررة. سيتم سحب ورقة الاختبار فوراً.");
            forceSubmitQuiz();
        } else {
            alert(`⚠️ تحذير نزاهة: لقد غادرت الصفحة. (تحذير رقم ${integrityWarnings}/3)`);
        }
    }
  }, [integrityWarnings]);

  const forceSubmitQuiz = useCallback(() => {
    if (!activeQuizId || !student) return;
    onQuizSubmit({
      id: 'qr' + Date.now(),
      studentId: student.id,
      quizId: activeQuizId,
      quizTitle: quizzes.find(q => q.id === activeQuizId)?.title || 'اختبار مجهول',
      score: 0,
      status: 'graded',
      date: new Date().toLocaleDateString('ar-EG'),
      feedback: "تم سحب الورقة تلقائياً بسبب محاولة الغش (نظام النزاهة)",
      isCheatSuspected: true
    });
    setActiveQuizId(null);
    setIntegrityWarnings(0);
    setActiveTab('home');
  }, [activeQuizId, student, quizzes, onQuizSubmit]);

  if (!student || student.id === 'guest_login' || student.id === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] p-6 font-['Cairo'] relative overflow-hidden text-right" dir="rtl">
        <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
           <div className="absolute top-[-10%] right-[-10%] text-[40rem] font-black" style={{color: primaryColor}}>∑</div>
        </div>
        <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[4rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] text-center space-y-10 animate-slideUp relative z-10 border border-white/10">
           {settings.branding.logoUrl ? (
             <img src={settings.branding.logoUrl} className="h-24 mx-auto object-contain" alt="Logo" />
           ) : (
             <div className="w-24 h-24 rounded-[2.5rem] mx-auto flex items-center justify-center text-white text-5xl font-black rotate-3" style={{ background: primaryColor }}>∑</div>
           )}
           <div className="space-y-3">
             <h2 className="text-4xl font-black text-slate-800 tracking-tighter">بوابة المتميزين</h2>
             <p className="text-slate-400 font-bold text-sm leading-relaxed">أهلاً بك يا بطل، أدخل كود اشتراكك للوصول لمحتواك التعليمي.</p>
           </div>
           <div className="space-y-4">
              <input 
                type="text" 
                placeholder="الكود الشخصي (مثلاً: M3-123)" 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[2rem] font-black text-center text-2xl outline-none transition-all shadow-inner uppercase tracking-widest" 
                value={loginCode} 
                onChange={e => setLoginCode(e.target.value.toUpperCase())} 
              />
              <button onClick={() => onLogin(loginCode)} className="w-full py-6 text-white rounded-[2rem] font-black text-lg shadow-xl transition-all transform active:scale-95" style={{ backgroundColor: primaryColor }}>بدء رحلة التفوق 🚀</button>
           </div>
           <button onClick={onBack} className="text-slate-400 font-bold text-xs hover:text-blue-600 transition-colors py-2">← العودة للرئيسية</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
           <div className="space-y-10 animate-fadeIn">
              {/* Premium Hero - Redesigned */}
              <div className="rounded-[4rem] p-10 md:p-16 text-white relative overflow-hidden shadow-2xl border border-white/5" style={{ backgroundColor: '#0f172a' }}>
                <div className="absolute top-0 right-0 w-full h-full opacity-60" style={{ background: `radial-gradient(circle at 15% 25%, ${primaryColor}20, transparent 65%)` }}></div>
                
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-12">
                  <div className="space-y-6 text-center md:text-right flex-1">
                    <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 backdrop-blur-2xl rounded-full border border-white/10">
                       <span className="w-2 h-2 rounded-full animate-pulse shadow-[0_0_10px_#34d399]" style={{ backgroundColor: '#10b981' }}></span>
                       <span className="text-[10px] font-black text-blue-200 uppercase tracking-[0.3em]">حساب الطالب مفعل</span>
                    </div>
                    <h2 className="text-5xl md:text-7xl font-black leading-tight tracking-tighter">
                      {settings.contentTexts.studentWelcomeTitle || 'مرحباً يا بطل'} <br/>
                      <span className="bg-clip-text text-transparent" style={{ backgroundImage: `linear-gradient(to right, #60a5fa, #818cf8, #c084fc)` }}>{student.name.split(' ')[0]} 👋</span>
                    </h2>
                    <p className="text-slate-400 font-medium text-base md:text-xl max-w-xl leading-relaxed">
                      {settings.contentTexts.studentWelcomeSubtitle || settings.studentWelcomeMsg}
                    </p>
                  </div>
                  
                  <div className="relative">
                    <button 
                      onClick={() => canSpin ? setShowWheel(true) : alert('لقد استهلكت فرصتك اليوم، عد غداً! ⏳')}
                      className={`relative w-56 h-56 rounded-[3.5rem] border-4 transition-all duration-700 group flex flex-col items-center justify-center gap-4 overflow-hidden ${canSpin ? 'hover:scale-105 hover:rotate-2' : 'grayscale opacity-40'}`}
                      style={{ backgroundColor: canSpin ? secondaryColor : 'rgba(255,255,255,0.05)', borderColor: canSpin ? '#fbbf24' : 'rgba(255,255,255,0.1)' }}
                    >
                       <span className="text-7xl group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">🎡</span>
                       <div className="text-center px-4">
                          <p className="text-[11px] font-black text-white uppercase tracking-widest">عجلة الحظ</p>
                          <p className="text-[8px] font-bold text-amber-100 uppercase mt-1 opacity-80">اربح نقاطاً مجانية</p>
                       </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 {[
                   { label: 'رصيد النقاط', val: student.points, icon: '✨', color: secondaryColor },
                   { label: 'نسبة الإنجاز', val: `${student.score}%`, icon: '📈', color: primaryColor },
                   { label: 'واجبات مسلمة', val: submissions.length, icon: '📚', color: '#6366f1' },
                   { label: 'محاضرات منجزة', val: videoLessons.length, icon: '🎬', color: '#10b981' },
                 ].map((stat, i) => (
                   <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col items-center gap-3 group hover:shadow-xl hover:translate-y-[-5px] transition-all">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform" style={{ color: stat.color, backgroundColor: `${stat.color}15` }}>{stat.icon}</div>
                      <div className="text-center">
                        <p className={`text-3xl font-black text-slate-800`}>{stat.val}</p>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                   </div>
                 ))}
              </div>

              {/* Quick Actions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                 <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8 relative overflow-hidden">
                       <div className="flex justify-between items-center">
                          <div>
                            <h3 className="text-2xl font-black text-slate-800 tracking-tight">آخر المحاضرات المرفوعة 🎬</h3>
                            <p className="text-sm text-slate-400 font-bold mt-1">تابع دروسك أولاً بأول لتضمن التفوق.</p>
                          </div>
                          <button onClick={() => setActiveTab('lessons')} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all">عرض الكل</button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {videoLessons.slice(0, 2).map(v => (
                            <div key={v.id} onClick={() => setSelectedVideo(v)} className="group cursor-pointer relative rounded-[2.5rem] overflow-hidden bg-slate-100 aspect-video border-2 border-transparent transition-all shadow-md" style={{ borderColor: 'transparent' }}>
                               <img src={`https://img.youtube.com/vi/${v.youtubeUrl.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                               <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl shadow-2xl" style={{ backgroundColor: primaryColor }}>▶</div>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
                 {/* Notifications Sidebar */}
                 <div className="lg:col-span-1 space-y-8">
                    <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-8 flex flex-col h-full">
                       <div className="flex justify-between items-center">
                          <h3 className="text-2xl font-black text-slate-800 tracking-tight">التنبيهات 🔔</h3>
                       </div>
                       <button onClick={() => setActiveTab('notifications')} className="w-full py-4 bg-slate-50 text-slate-400 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all border border-transparent"
                         onMouseEnter={(e) => e.currentTarget.style.backgroundColor = primaryColor}
                         onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                       >عرض كافة التنبيهات</button>
                    </div>
                 </div>
              </div>
           </div>
        );
      
      case 'lessons':
        return (
          <div className="space-y-10 animate-fadeIn">
            <header className="px-6">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-tight">مكتبة الفيديو 🎬</h2>
            </header>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {videoLessons.filter(v => v.yearId === student.yearId || v.yearId === 'all').map(video => (
                <div key={video.id} onClick={() => setSelectedVideo(video)} className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-slate-100 group cursor-pointer hover:shadow-2xl transition-all duration-500">
                  <div className="aspect-video relative overflow-hidden bg-slate-900">
                     <img src={`https://img.youtube.com/vi/${video.youtubeUrl.split('v=')[1]?.split('&')[0]}/hqdefault.jpg`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                     <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-20 h-20 rounded-full flex items-center justify-center text-white text-3xl shadow-2xl scale-75 group-hover:scale-100 transition-all duration-500" style={{ backgroundColor: primaryColor }}>▶</div>
                     </div>
                  </div>
                  <div className="p-8 space-y-4">
                    <h4 className="font-black text-slate-800 text-xl leading-snug group-hover:text-blue-600 transition-colors">{video.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'chat': return <ChatRoom user={{...student, role: 'student'}} messages={messages} years={years} students={students} onSendMessage={onSendMessage} notation={settings.mathNotation} />;
      case 'rewards': return <Rewards rewards={rewards} redemptions={redemptions} student={student} role="student" onAddReward={()=>{}} onDeleteReward={()=>{}} onRedeem={onRedeemReward} onMarkDelivered={()=>{}} />;
      case 'notifications': return <Notifications notifications={notifications} years={years} groups={groups} role="student" currentStudentId={student.id} currentYearId={student.yearId} onMarkRead={onMarkNotificationRead} onSend={()=>{}} />;
      case 'ai_solver': return <AISolver notation={settings.mathNotation} />;
      
      default: return (
         <div className="py-32 text-center font-black text-slate-300 text-xl animate-pulse">جاري تحميل القسم...</div>
      );
    }
  };

  return (
    <div className={`min-h-screen bg-[#f8fafc] pb-44 font-['Cairo'] text-right relative ${settings.integrityMode ? 'select-none' : ''}`} dir="rtl">
      
      {/* Integrity Mode Blur Overlay */}
      {isBlurred && settings.integrityMode && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
           <div className="w-24 h-24 bg-rose-600 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-2xl animate-bounce">🛡️</div>
           <h2 className="text-4xl font-black text-white mb-4">وضع النزاهة نشط</h2>
           <p className="text-slate-400 text-lg font-bold max-w-md leading-relaxed">
             تم إخفاء المحتوى لأنك غادرت الصفحة أو فقدت التركيز. يرجى العودة للتطبيق لمتابعة العمل.
           </p>
           {activeQuizId && (
             <p className="mt-8 text-rose-400 font-black text-sm bg-rose-500/10 px-6 py-3 rounded-2xl border border-rose-500/20">
               ⚠️ تحذير: محاولة الغش المتكررة ستؤدي لإنهاء الاختبار تلقائياً.
             </p>
           )}
        </div>
      )}

      {/* Navbar */}
      <nav className="sticky top-0 z-[200] px-6 py-5 bg-white/80 backdrop-blur-2xl border-b border-slate-100 flex justify-between items-center shadow-sm">
          <div className="flex items-center gap-5">
             <div className="relative group cursor-pointer">
                <img src={student.avatar} className="w-14 h-14 rounded-[1.8rem] border-4 border-white shadow-xl object-cover" alt="" />
             </div>
             <div>
                <h3 className="font-black text-slate-900 text-base leading-none mb-1.5">{student.name}</h3>
                <span className="text-[10px] font-black text-white px-3 py-1 rounded-lg shadow-sm uppercase tracking-widest" style={{ backgroundColor: primaryColor }}>{student.points} Points</span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            {notifPermission !== 'granted' && (
              <button 
                onClick={requestNotificationPermission}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-xl border border-indigo-100 hover:bg-indigo-100 transition-all"
                title="تفعيل الإشعارات"
              >
                <span className="text-xl">🔔</span>
                <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">تفعيل التنبيهات</span>
              </button>
            )}

            {settings.integrityMode && (
               <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">محمي</span>
               </div>
            )}
            <button 
              onClick={() => setActiveTab('notifications')} 
              className={`relative w-12 h-12 rounded-[1.2rem] flex items-center justify-center transition-all duration-300 ${activeTab === 'notifications' ? 'text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-white'}`}
              style={activeTab === 'notifications' ? { backgroundColor: primaryColor } : {}}
            >
               <span className="text-2xl">🔔</span>
               {unreadCount > 0 && <span className="absolute -top-1.5 -right-1.5 min-w-[24px] h-6 px-1.5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-4 border-white shadow-xl animate-bounce">{unreadCount}</span>}
            </button>
            <button onClick={onBack} className="px-8 py-3.5 bg-slate-950 text-white rounded-2xl text-[11px] font-black hover:bg-black transition-all">خروج</button>
          </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 md:p-12 min-h-[60vh]">
         {selectedVideo ? (
            <div className="space-y-10 animate-fadeIn max-w-5xl mx-auto">
               <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl gap-6">
                  <div>
                    <h4 className="font-black text-2xl text-slate-900 leading-tight">{selectedVideo.title}</h4>
                  </div>
                  <button onClick={() => setSelectedVideo(null)} className="px-10 py-4 bg-slate-950 text-white rounded-2xl font-black text-[11px] hover:bg-black transition-all"><span>←</span> القائمة الرئيسية</button>
               </div>
               <div className="w-full">
                  <ProtectedVideo src={selectedVideo.youtubeUrl} title={selectedVideo.title} watermarkText={`${student.name} | ${student.studentCode}`} enabled={settings.watermarkEnabled} />
               </div>
            </div>
         ) : renderContent()}
      </main>

      {showWheel && (
        <LuckyWheel 
          onWin={(p) => { onSpinWin?.(p); setShowWheel(false); }}
          onClose={() => setShowWheel(false)}
        />
      )}

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[250] w-[95%] max-w-4xl">
         <nav className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 p-2.5 flex justify-around items-center h-24 overflow-x-auto no-scrollbar">
            {[
              { id: 'home', i: '🏠', l: 'الرئيسية' },
              { id: 'lessons', i: '🎬', l: 'المحاضرات' },
              { id: 'library', i: '📁', l: 'الملازم' },
              { id: 'quizzes', i: '📝', l: 'الاختبارات' },
              { id: 'chat', i: '💬', l: 'النقاش' },
            ].map(tab => (
              <button 
                key={tab.id} 
                onClick={() => { setActiveTab(tab.id); setSelectedVideo(null); }} 
                className={`flex-1 flex flex-col items-center justify-center rounded-[2.5rem] h-full min-w-[70px] transition-all duration-500 relative ${activeTab === tab.id ? 'text-white scale-110 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                style={activeTab === tab.id ? { backgroundColor: primaryColor } : {}}
              >
                <span className="text-2xl mb-1.5 drop-shadow-md">{tab.i}</span>
                <span className="text-[8px] font-black uppercase tracking-tighter">{tab.l}</span>
              </button>
            ))}
         </nav>
      </div>
    </div>
  );
};

export default StudentPortal;
