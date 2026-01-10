
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz, AssignmentSubmission, ChatMessage, Year, AppNotification, Group, EducationalSource, ScheduleEntry, MathFormula, PlatformReward, RewardRedemption } from '../types';
import ProtectedVideo from '../components/ProtectedVideo';
import Notifications from './Notifications';
import ChatRoom from './ChatRoom';
import AISolver from './AISolver';
import Rewards from './Rewards';
import LuckyWheel from '../components/LuckyWheel';
import MathRenderer from '../components/MathRenderer';

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
  onUpdateStudent?: (updates: Partial<Student>) => void;
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
  onBack: () => void;
}

const DEFAULT_ICONS = {
  home: '🏠',
  lessons: '🎬',
  library: '📁',
  quizzes: '📝',
  chat: '💬'
};

const ICON_OPTIONS = [
  '🏠', '🏰', '🎪', '🚀', '🛸', '⛺', '🏝️',
  '🎬', '🎥', '📺', '📽️', '📹', '💻', '📱',
  '📁', '📚', '📖', '📒', '📜', '💾', '💿',
  '📝', '✏️', '✒️', '✍️', '🧠', '🎯', '⚡',
  '💬', '💭', '🗣️', '📢', '📞', '📟', '📧',
  '🌟', '🔥', '💎', '🌈', '🎨', '🧩', '🎮'
];

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  groups, educationalSources, schedules, formulas, rewards, redemptions,
  onQuizSubmit, onAssignmentSubmit, onLogin, onSendMessage, onMarkNotificationRead, onRedeemReward, onSpinWin, onUpdateStudent, messages, years, students, onBack 
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
  
  // Customization State
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [activeIconTab, setActiveIconTab] = useState<string>('home');

  // Assignment Submission State
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submissionFile, setSubmissionFile] = useState<string>('');
  
  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [takingQuiz, setTakingQuiz] = useState<Quiz | null>(null);

  const primaryColor = settings.branding.primaryColor || '#2563eb';
  const secondaryColor = settings.branding.secondaryColor || '#f59e0b';

  const userIcons = useMemo(() => ({
    ...DEFAULT_ICONS,
    ...(student?.preferences?.customIcons || {})
  }), [student?.preferences?.customIcons]);

  useEffect(() => {
    localStorage.setItem('math_student_activeTab', activeTab);
  }, [activeTab]);

  const studentYear = useMemo(() => years.find(y => y.id === student?.yearId), [student, years]);
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
          if (activeQuizId || takingQuiz) {
             setIntegrityWarnings(prev => prev + 1);
          }
        } else {
          setTimeout(() => setIsBlurred(false), 200);
        }
      };

      const handleBlur = () => setIsBlurred(true);
      const handleFocus = () => setIsBlurred(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x'))) {
          e.preventDefault();
          alert('🚫 تم تعطيل هذه الوظيفة للحفاظ على نزاهة المنصة.');
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('contextmenu', (e) => e.preventDefault());

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('contextmenu', (e) => e.preventDefault());
      };
    }
  }, [settings.integrityMode, activeQuizId, takingQuiz, student]);

  useEffect(() => {
    if (integrityWarnings > 0 && (activeQuizId || takingQuiz)) {
        if (integrityWarnings >= 3) {
            alert("⚠️ تم اكتشاف محاولة غش متكررة. سيتم سحب ورقة الاختبار فوراً.");
            forceSubmitQuiz();
        } else {
            alert(`⚠️ تحذير نزاهة: لقد غادرت الصفحة. (تحذير رقم ${integrityWarnings}/3)`);
        }
    }
  }, [integrityWarnings]);

  const forceSubmitQuiz = useCallback(() => {
    if ((!activeQuizId && !takingQuiz) || !student) return;
    const q = takingQuiz || quizzes.find(qx => qx.id === activeQuizId);
    
    onQuizSubmit({
      id: 'qr' + Date.now(),
      studentId: student.id,
      quizId: q?.id || 'unknown',
      quizTitle: q?.title || 'اختبار مجهول',
      score: 0,
      status: 'graded',
      date: new Date().toLocaleDateString('ar-EG'),
      feedback: "تم سحب الورقة تلقائياً بسبب محاولة الغش (نظام النزاهة)",
      isCheatSuspected: true
    });
    setTakingQuiz(null);
    setActiveQuizId(null);
    setIntegrityWarnings(0);
    setActiveTab('home');
  }, [activeQuizId, takingQuiz, student, quizzes, onQuizSubmit]);

  const handleAssignmentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setSubmissionFile(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const submitAssignment = () => {
    if (!submissionFile || !selectedAssignment || !student) return alert('يرجى رفع ملف الحل أولاً');
    onAssignmentSubmit({
      assignmentId: selectedAssignment.id,
      studentId: student.id,
      studentName: student.name,
      fileUrl: submissionFile,
    });
    alert('تم تسليم الواجب بنجاح! 🚀');
    setSelectedAssignment(null);
    setSubmissionFile('');
  };

  const finishQuiz = () => {
    if (!takingQuiz || !student) return;
    
    // Calculate Score (Simple Mock Logic - In real app, compare with correct answers)
    // Here we just count answered questions as a mock score for demo
    const answeredCount = Object.keys(quizAnswers).length;
    const totalQuestions = takingQuiz.questions?.length || 1;
    const score = Math.round((answeredCount / totalQuestions) * 100);

    onQuizSubmit({
      id: 'qr' + Date.now(),
      studentId: student.id,
      quizId: takingQuiz.id,
      quizTitle: takingQuiz.title,
      score: score,
      status: 'pending', // Pending teacher review
      date: new Date().toLocaleDateString('ar-EG'),
    });

    setTakingQuiz(null);
    setQuizAnswers({});
    setIntegrityWarnings(0);
    alert(`تم إنهاء الاختبار! نتيجتك المبدئية: ${score}% (سيتم مراجعتها من قبل المعلم)`);
  };

  const updateIcon = (tabId: string, icon: string) => {
    if (!onUpdateStudent || !student) return;
    const newIcons = { ...student.preferences?.customIcons, [tabId]: icon };
    onUpdateStudent({ preferences: { ...student.preferences, customIcons: newIcons } });
  };

  if (!student || student.id === 'guest_login' || student.id === 'guest') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] p-6 font-['Cairo'] relative overflow-hidden text-right antialiased" dir="rtl">
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
             <p className="text-slate-500 font-medium text-lg leading-relaxed">أهلاً بك يا بطل، أدخل كود اشتراكك للوصول لمحتواك التعليمي.</p>
           </div>
           <div className="space-y-4">
              <input 
                type="text" 
                placeholder="الكود الشخصي (مثلاً: M3-123)" 
                className="w-full px-8 py-6 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[2rem] font-bold text-center text-2xl outline-none transition-all shadow-inner uppercase tracking-widest text-slate-800" 
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
              {/* Premium Hero */}
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
                    <p className="text-slate-400 font-medium text-lg md:text-xl max-w-xl leading-relaxed">
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
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                      </div>
                   </div>
                 ))}
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
                    <h4 className="font-bold text-slate-800 text-xl leading-snug group-hover:text-blue-600 transition-colors">{video.title}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'library':
        return (
          <div className="space-y-10 animate-fadeIn">
             <header className="px-6">
                <h2 className="text-4xl font-black text-slate-800 tracking-tighter leading-tight">المكتبة الرقمية 📁</h2>
                <p className="text-slate-400 font-medium mt-2">المذكرات، المراجعات، والملفات التعليمية.</p>
             </header>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {educationalSources.filter(src => src.yearId === student.yearId || src.yearId === 'all').map(src => (
                  <div key={src.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex items-center gap-6 group hover:shadow-lg transition-all">
                     <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">📄</div>
                     <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-slate-800 text-base truncate">{src.name}</h4>
                        <p className="text-xs text-slate-500 font-medium mt-1">{src.uploadDate}</p>
                     </div>
                     <a href={src.data} download={src.name} className="w-10 h-10 bg-slate-50 text-slate-400 rounded-xl flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all">⬇</a>
                  </div>
                ))}
                {educationalSources.filter(src => src.yearId === student.yearId || src.yearId === 'all').length === 0 && (
                   <div className="col-span-full py-20 text-center opacity-30">
                      <span className="text-6xl block mb-4">📂</span>
                      <p className="font-black text-slate-400">لا توجد ملفات حالياً</p>
                   </div>
                )}
             </div>
          </div>
        );

      case 'quizzes':
        return (
          <div className="space-y-12 animate-fadeIn">
             {/* Assignments Section */}
             <section>
               <header className="px-6 mb-6 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <span>📝</span> الواجبات المدرسية
                  </h3>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {assignments.filter(a => a.status === 'active' && a.yearId === student.yearId).map(asg => {
                    const isSubmitted = submissions.some(s => s.assignmentId === asg.id && s.studentId === student.id);
                    return (
                      <div key={asg.id} className={`p-8 rounded-[3rem] border-2 transition-all ${isSubmitted ? 'bg-emerald-50 border-emerald-100' : 'bg-white border-slate-100 shadow-sm'}`}>
                         <div className="flex justify-between items-start mb-4">
                            <div>
                               <h4 className="font-bold text-xl text-slate-800 mb-1">{asg.title}</h4>
                               <p className="text-xs text-slate-500 font-medium">آخر موعد: {asg.dueDate}</p>
                            </div>
                            {isSubmitted ? (
                              <span className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-lg text-[9px] font-black">تم التسليم ✓</span>
                            ) : (
                              <span className="px-3 py-1 bg-amber-100 text-amber-600 rounded-lg text-[9px] font-black">مطلوب</span>
                            )}
                         </div>
                         {!isSubmitted && (
                           <button onClick={() => setSelectedAssignment(asg)} className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:scale-[1.02] transition-all">
                             عرض التفاصيل والتسليم 📤
                           </button>
                         )}
                      </div>
                    );
                  })}
                  {assignments.filter(a => a.status === 'active' && a.yearId === student.yearId).length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-[2rem]">لا توجد واجبات نشطة حالياً ✨</div>
                  )}
               </div>
             </section>

             {/* Quizzes Section */}
             <section>
               <header className="px-6 mb-6 flex justify-between items-center">
                  <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
                    <span>⚡</span> الاختبارات الإلكترونية
                  </h3>
               </header>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {quizzes.filter(q => q.yearId === student.yearId).map(quiz => {
                    const result = results.find(r => r.quizId === quiz.id && r.studentId === student.id);
                    return (
                      <div key={quiz.id} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 relative overflow-hidden group">
                         <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600"></div>
                         <h4 className="font-bold text-xl text-slate-800 mb-2">{quiz.title}</h4>
                         <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-500 font-medium">{quiz.date}</span>
                            {result ? (
                              <span className="font-black text-emerald-600 text-sm">الدرجة: {result.score}%</span>
                            ) : (
                              <button onClick={() => { setTakingQuiz(quiz); setActiveQuizId(quiz.id); }} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg">
                                 بدء الاختبار الآن ⚡
                              </button>
                            )}
                         </div>
                      </div>
                    );
                  })}
                  {quizzes.filter(q => q.yearId === student.yearId).length === 0 && (
                    <div className="col-span-full py-10 text-center text-slate-400 font-bold text-sm bg-slate-50 rounded-[2rem]">لا توجد اختبارات متاحة حالياً ✨</div>
                  )}
               </div>
             </section>
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
    <div className={`min-h-screen bg-[#f8fafc] pb-44 font-['Cairo'] text-right relative antialiased ${settings.integrityMode ? 'select-none' : ''}`} dir="rtl">
      
      {/* Integrity Mode Blur Overlay */}
      {isBlurred && settings.integrityMode && (
        <div className="fixed inset-0 z-[9999] bg-slate-900/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 animate-fadeIn">
           <div className="w-24 h-24 bg-rose-600 rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-2xl animate-bounce">🛡️</div>
           <h2 className="text-4xl font-black text-white mb-4">وضع النزاهة نشط</h2>
           <p className="text-slate-400 text-lg font-bold max-w-md leading-relaxed">
             تم إخفاء المحتوى لأنك غادرت الصفحة أو فقدت التركيز. يرجى العودة للتطبيق لمتابعة العمل.
           </p>
           {(activeQuizId || takingQuiz) && (
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

            <button 
              onClick={() => setShowIconPicker(true)} 
              className="w-12 h-12 bg-slate-50 text-slate-400 rounded-[1.2rem] flex items-center justify-center hover:bg-blue-50 hover:text-blue-600 transition-all"
              title="تخصيص الأيقونات"
            >
               <span className="text-xl">🎨</span>
            </button>

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

      {/* Assignment Submission Modal */}
      {selectedAssignment && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
           <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedAssignment(null)}></div>
           <div className="bg-white w-full max-w-2xl p-10 rounded-[3.5rem] relative z-10 animate-slideUp shadow-2xl overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-2xl font-black text-slate-800">تسليم الواجب</h3>
                 <button onClick={() => setSelectedAssignment(null)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">✕</button>
              </div>
              <div className="space-y-6">
                 <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                    <h4 className="font-bold text-xl text-slate-900 mb-4">{selectedAssignment.title}</h4>
                    <div className="text-base font-medium text-slate-700 leading-loose">
                       <MathRenderer content={selectedAssignment.description} />
                    </div>
                    {selectedAssignment.fileUrl && (
                       <img src={selectedAssignment.fileUrl} className="w-full rounded-xl border border-slate-200 mt-4" alt="Assignment" />
                    )}
                    {selectedAssignment.externalLink && (
                       <a href={selectedAssignment.externalLink} target="_blank" rel="noreferrer" className="block mt-4 text-center py-3 bg-blue-50 text-blue-600 rounded-xl font-black text-xs hover:bg-blue-100 transition-all">🔗 فتح الرابط الخارجي</a>
                    )}
                 </div>

                 <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase px-2">إجابتك (رفع صورة)</label>
                    <input type="file" accept="image/*" onChange={handleAssignmentUpload} className="w-full p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:border-blue-500 transition-all" />
                    {submissionFile && (
                       <div className="relative mt-2">
                          <img src={submissionFile} className="h-32 rounded-xl border border-slate-200" alt="Preview" />
                          <p className="text-[10px] text-emerald-600 font-bold mt-1">تم رفع الملف بنجاح ✓</p>
                       </div>
                    )}
                 </div>

                 <button onClick={submitAssignment} className="w-full py-5 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg shadow-xl hover:scale-[1.02] transition-all">تأكيد التسليم 📤</button>
              </div>
           </div>
        </div>
      )}

      {/* Quiz Taking Modal */}
      {takingQuiz && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-xl">
           <div className="bg-white w-full max-w-4xl h-[90vh] rounded-[3.5rem] relative flex flex-col overflow-hidden shadow-2xl animate-slideUp">
              <div className="p-8 bg-indigo-900 text-white flex justify-between items-center">
                 <div>
                    <h3 className="text-2xl font-black">{takingQuiz.title}</h3>
                    <p className="text-sm font-medium text-indigo-200 opacity-90 mt-1">يرجى الإجابة بدقة، الوقت محسوب.</p>
                 </div>
                 <div className="px-4 py-2 bg-white/10 rounded-xl font-mono font-black text-lg">{Object.keys(quizAnswers).length} / {takingQuiz.questions?.length || 0}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-10 no-scrollbar bg-slate-50">
                 {takingQuiz.questions?.map((q: any, idx: number) => (
                    <div key={q.id || idx} className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
                       <div className="flex gap-6 mb-6">
                          <span className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-black text-lg">{idx + 1}</span>
                          <div className="flex-1 font-bold text-slate-800 text-xl leading-loose">
                             <MathRenderer content={q.question} />
                          </div>
                       </div>
                       
                       {q.type === 'mcq' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-14">
                             {q.options?.map((opt: string, oid: number) => (
                               <label key={oid} className={`flex items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all ${quizAnswers[q.id] === opt ? 'border-indigo-600 bg-indigo-50' : 'border-slate-100 hover:border-slate-200'}`}>
                                  <input 
                                    type="radio" 
                                    name={`q-${q.id}`} 
                                    className="accent-indigo-600 w-6 h-6"
                                    checked={quizAnswers[q.id] === opt}
                                    onChange={() => setQuizAnswers({...quizAnswers, [q.id]: opt})}
                                  />
                                  <span className="font-medium text-slate-800 text-lg leading-relaxed"><MathRenderer content={opt} inline /></span>
                               </label>
                             ))}
                          </div>
                       )}
                       
                       {q.type !== 'mcq' && (
                          <textarea 
                            className="w-full p-6 mr-14 bg-slate-50 border-2 border-slate-200 rounded-3xl font-medium text-lg outline-none focus:border-indigo-600 leading-relaxed text-slate-800" 
                            placeholder="اكتب إجابتك هنا..."
                            value={quizAnswers[q.id] || ''}
                            onChange={(e) => setQuizAnswers({...quizAnswers, [q.id]: e.target.value})}
                          />
                       )}
                    </div>
                 ))}
                 {(!takingQuiz.questions || takingQuiz.questions.length === 0) && (
                    <div className="text-center py-20 text-slate-400 font-bold">لا توجد أسئلة في هذا الاختبار.</div>
                 )}
              </div>

              <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center">
                 <button onClick={() => { setTakingQuiz(null); setQuizAnswers({}); setActiveQuizId(null); }} className="px-8 py-4 text-slate-400 font-black hover:text-rose-500 transition-all">إلغاء وخروج</button>
                 <button onClick={finishQuiz} className="px-12 py-4 bg-emerald-600 text-white rounded-[2rem] font-black text-lg shadow-xl hover:scale-105 transition-all">إنهاء الاختبار ✅</button>
              </div>
           </div>
        </div>
      )}

      {showWheel && (
        <LuckyWheel 
          onWin={(p) => { onSpinWin?.(p); setShowWheel(false); }}
          onClose={() => setShowWheel(false)}
        />
      )}

      {/* Icon Picker Modal */}
      {showIconPicker && (
        <div className="fixed inset-0 z-[800] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-6 animate-fadeIn">
           <div className="bg-white w-full max-w-lg rounded-[3rem] p-8 shadow-2xl relative animate-slideUp">
              <div className="flex justify-between items-center mb-6">
                 <div>
                    <h3 className="text-2xl font-black text-slate-800">تخصيص الواجهة 🎨</h3>
                    <p className="text-slate-400 font-bold text-xs mt-1">اختر الأيقونات المفضلة لكل قسم</p>
                 </div>
                 <button onClick={() => setShowIconPicker(false)} className="w-10 h-10 bg-slate-50 rounded-xl text-slate-400 hover:text-rose-500 transition-all">✕</button>
              </div>

              <div className="flex bg-slate-50 p-1.5 rounded-2xl mb-6 overflow-x-auto no-scrollbar">
                 {Object.keys(DEFAULT_ICONS).map(key => (
                   <button 
                     key={key} 
                     onClick={() => setActiveIconTab(key)}
                     className={`flex-1 py-3 px-4 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeIconTab === key ? 'bg-white shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     {userIcons[key as keyof typeof userIcons]} {key === 'home' ? 'الرئيسية' : key === 'lessons' ? 'الدروس' : key === 'library' ? 'المكتبة' : key === 'quizzes' ? 'المهام' : 'النقاش'}
                   </button>
                 ))}
              </div>

              <div className="grid grid-cols-6 gap-3 max-h-60 overflow-y-auto no-scrollbar p-2">
                 {ICON_OPTIONS.map(icon => (
                   <button 
                     key={icon}
                     onClick={() => updateIcon(activeIconTab, icon)}
                     className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl transition-all ${userIcons[activeIconTab as keyof typeof userIcons] === icon ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-slate-50 hover:bg-slate-100'}`}
                   >
                     {icon}
                   </button>
                 ))}
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 flex justify-end">
                 <button onClick={() => setShowIconPicker(false)} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-black transition-all">تم الحفظ ✓</button>
              </div>
           </div>
        </div>
      )}

      {/* Floating Bottom Nav */}
      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[250] w-[95%] max-w-4xl">
         <nav className="bg-[#0f172a]/95 backdrop-blur-3xl rounded-[3.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] border border-white/10 p-2.5 flex justify-around items-center h-24 overflow-x-auto no-scrollbar">
            {[
              { id: 'home', i: userIcons.home, l: 'الرئيسية' },
              { id: 'lessons', i: userIcons.lessons, l: 'المحاضرات' },
              { id: 'library', i: userIcons.library, l: 'المكتبة' },
              { id: 'quizzes', i: userIcons.quizzes, l: 'المهام' },
              { id: 'chat', i: userIcons.chat, l: 'النقاش' },
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
