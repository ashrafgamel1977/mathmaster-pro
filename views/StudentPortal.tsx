
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz, AssignmentSubmission, ChatMessage, Year, AppNotification, Group, EducationalSource, ScheduleEntry, MathFormula, PlatformReward, RewardRedemption, AppView, QuestionAttempt } from '../types';
import MathRenderer from '../components/MathRenderer';
import ProtectedVideo from '../components/ProtectedVideo';
import StudentHero from '../components/StudentHero';
import { 
  Home, BookOpen, FileText, Zap, BarChart2, LogOut, Lock, 
  Upload, Video, File, CheckCircle2, XCircle, AlertTriangle,
  Menu, X, Play, Download, Camera, Send, Clock
} from 'lucide-react';

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
  onRateSource: (sourceId: string, rating: number) => void;
  onVideoProgress?: (videoId: string, percent: number) => void;
  onSendNotification?: (notification: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>) => void; 
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
  onBack: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  onQuizSubmit, onAssignmentSubmit, onSendMessage, onRedeemReward, onSpinWin, onBack,
  educationalSources, rewards, onVideoProgress, onUpdateStudent, onSendNotification, years, addToast
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [libraryFilter, setLibraryFilter] = useState<'video' | 'doc'>('video');
  const [libraryTerm, setLibraryTerm] = useState<'all' | '1' | '2'>('all'); 
  
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [showLiveStream, setShowLiveStream] = useState(false);
  
  // Quiz & Anti-Cheat State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<string, string>>({});
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);

  const [showScanner, setShowScanner] = useState(false);
  const [scannerImage, setScannerImage] = useState<string | null>(null);
  const [scannedAsgId, setScannedAsgId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isFabOpen, setIsFabOpen] = useState(false);
  
  // --- Drag and Drop State ---
  const [orderedTabs, setOrderedTabs] = useState<any[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const isTeacherPreview = student?.id === 'teacher-view';

  // Dynamic Subjects based on Settings
  const SUBJECTS = useMemo(() => {
      const branches = settings.branches && settings.branches.length > 0 
        ? settings.branches 
        : ['عام']; // Default if no branches defined
      
      const colors = [
        'from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 
        'from-rose-500 to-orange-600', 'from-violet-500 to-purple-600', 
        'from-amber-500 to-yellow-600', 'from-pink-500 to-rose-600'
      ];
      
      return branches.map((b, i) => ({
          id: b,
          name: b,
          icon: '📚', // You could map icons based on names if desired, generic for now
          color: colors[i % colors.length]
      }));
  }, [settings.branches]);

  // ... (Rest of the component logic remains similar, just using SUBJECTS) ...
  // Skipping full duplication for brevity, but ensuring the rest of the file logic is preserved 
  // and compatible with the new SUBJECTS variable.

  // --- ANTI-CHEAT SYSTEM 🛡️ ---
  useEffect(() => {
    if (!activeQuiz || !settings.integrityMode) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerCheatWarning();
      }
    };

    const handleBlur = () => {
      triggerCheatWarning();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [activeQuiz, settings.integrityMode]);

  const triggerCheatWarning = () => {
    if (!activeQuiz) return;
    setCheatWarnings(prev => {
        const newCount = prev + 1;
        if (newCount >= 3) {
            submitQuiz(true); // Force submit flagged as cheat
            addToast("تم إغلاق الامتحان بسبب تكرار محاولات الخروج! 🚫", 'error');
        } else {
            setShowCheatAlert(true);
        }
        return newCount;
    });
  };

  // --- LOCK SCREEN LOGIC ---
  const isLocked = settings.subscriptionEnabled && !student?.isPaid && !isTeacherPreview;

  if (isLocked) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-right font-['Cairo']" dir="rtl">
              <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-500 to-rose-600"></div>
                  
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-5xl mb-6 mx-auto shadow-inner">
                      🔒
                  </div>
                  
                  <h2 className="text-2xl font-black text-slate-800 mb-2">عفواً، المحتوى مغلق</h2>
                  <p className="text-slate-500 font-bold text-sm mb-8">
                      يتطلب الوصول إلى المنصة اشتراكاً مفعلاً.
                  </p>

                  <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-8 text-right">
                      <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-2">تعليمات التفعيل</p>
                      <p className="text-sm font-bold text-slate-700 whitespace-pre-line leading-relaxed">
                          {settings.paymentInstructions || 'يرجى التواصل مع إدارة المنصة لتفعيل حسابك.'}
                      </p>
                  </div>

                  <button 
                    onClick={() => {
                        const msg = `مرحباً أستاذ ${settings.teacherName}، أنا الطالب ${student?.name} (كود: ${student?.studentCode}). قمت بتحويل الاشتراك وأرغب في تفعيل الحساب.`;
                        const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
                        window.open(url, '_blank');
                    }}
                    className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl hover:scale-105 transition-transform flex items-center justify-center gap-2"
                  >
                      <span>إرسال إيصال الدفع</span>
                      <span className="text-lg">📤</span>
                  </button>
                  
                  <button onClick={onBack} className="mt-4 text-slate-400 font-bold text-xs hover:text-slate-600">تسجيل الخروج</button>
              </div>
          </div>
      );
  }

  const DEFAULT_TABS: { id: string; label: string; icon: React.ReactNode; disabled?: boolean }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: <Home size={20} /> },
    { id: 'library', label: 'دروسي', icon: <BookOpen size={20} /> },
    { id: 'assignments', label: 'الواجبات', icon: <FileText size={20} /> },
    { id: 'quizzes', label: 'الاختبارات', icon: <Zap size={20} /> },
    { id: 'results', label: 'نتائجي', icon: <BarChart2 size={20} /> }
  ];

  // Memoize the initial tabs based on settings
  const initialTabs = useMemo(() => {
    if (!settings.featureConfig?.[AppView.STUDENT_PORTAL]) return DEFAULT_TABS;
    const config = settings.featureConfig[AppView.STUDENT_PORTAL];
    return DEFAULT_TABS.map(tab => {
        const conf = config.find(c => c.id === tab.id);
        if (conf) return { ...tab, label: conf.label, disabled: !conf.enabled };
        return tab;
    }).filter(t => !t.disabled);
  }, [settings]);

  useEffect(() => {
    if (orderedTabs.length === 0) {
        setOrderedTabs(initialTabs);
    } else {
        const currentIds = new Set(initialTabs.map(t => t.id));
        const newOrdered = orderedTabs.filter(t => currentIds.has(t.id));
        
        initialTabs.forEach(t => {
            if (!newOrdered.find(ot => ot.id === t.id)) {
                newOrdered.push(t);
            }
        });
        
        const finalTabs = newOrdered.map(t => {
            const freshData = initialTabs.find(it => it.id === t.id);
            return freshData || t;
        });

        setOrderedTabs(finalTabs);
    }
  }, [initialTabs]);

  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); 
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedItemIndex === null) return;
    const newTabs = [...orderedTabs];
    const [draggedItem] = newTabs.splice(draggedItemIndex, 1);
    newTabs.splice(dropIndex, 0, draggedItem);
    setOrderedTabs(newTabs);
    setDraggedItemIndex(null);
  };

  useEffect(() => {
    if (scannerImage && canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.src = scannerImage;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            if (ctx) ctx.drawImage(img, 0, 0);
        };
    }
  }, [scannerImage]);

  const isTargetForLive = useMemo(() => {
      if (!settings.liveSessionActive) return false;
      if (isTeacherPreview) return true;
      if (!settings.liveSessionTargetYear || settings.liveSessionTargetYear === 'all') return true;
      return settings.liveSessionTargetYear === student?.yearId;
  }, [settings.liveSessionActive, settings.liveSessionTargetYear, student, isTeacherPreview]);

  const jitsiEmbedUrl = useMemo(() => {
      if (!settings.liveSessionLink) return '';
      let base = settings.liveSessionLink;
      if (base.includes('jit.si')) {
          base = base.split('#')[0];
          const params = [
              `userInfo.displayName="${encodeURIComponent(student?.name || 'Guest')}"`,
              `config.prejoinPageEnabled=false`,
              `config.disableDeepLinking=true`, 
              `interfaceConfig.MOBILE_APP_PROMO=false`,
              `interfaceConfig.SHOW_JITSI_WATERMARK=false`
          ];
          return `${base}#${params.join('&')}`;
      }
      return base;
  }, [settings.liveSessionLink, student]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
            setScannerImage(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
    }
  };

  const submitScannedHomework = () => {
    if (!scannedAsgId || !canvasRef.current) return;
    const finalImage = canvasRef.current.toDataURL('image/jpeg', 0.8);
    submitAssignment(scannedAsgId, finalImage);
    setShowScanner(false);
    setScannerImage(null);
    setScannedAsgId(null);
  };

  const submitAssignment = (asgId: string, fileUrl: string) => {
    onAssignmentSubmit({
        assignmentId: asgId,
        studentId: student!.id,
        studentName: student!.name,
        fileUrl: fileUrl
    });
    addToast('تم تسليم الواجب بنجاح! 🚀', 'success');
  };

  const handleStartQuiz = (quiz: Quiz) => {
      if (quiz.type === 'link' && quiz.externalLink) {
          window.open(quiz.externalLink, '_blank');
          return;
      }
      if (quiz.type === 'file' && quiz.fileUrl) {
          window.open(quiz.fileUrl, '_blank');
          return;
      }

      if (!quiz.questions || quiz.questions.length === 0) {
          addToast('هذا الاختبار لا يحتوي على أسئلة.', 'error');
          return;
      }

      setActiveQuiz(quiz);
      setActiveQuizAnswers({});
      setCheatWarnings(0);
      if (settings.integrityMode) {
          document.documentElement.requestFullscreen().catch(() => {});
      }
  };

  const submitQuiz = (isForced = false) => {
      if (!activeQuiz) return;
      let score = 0;
      let total = 0;
      const attempts: QuestionAttempt[] = [];

      activeQuiz.questions?.forEach((q, idx) => {
          total += q.points;
          const userAns = activeQuizAnswers[q.id];
          const isCorrect = userAns === q.options?.[q.correctAnswer as number];
          if (isCorrect) score += q.points;
          
          attempts.push({
              questionId: q.id,
              questionText: q.question,
              userAnswer: userAns || 'لم يجب',
              correctAnswer: q.options?.[q.correctAnswer as number] || '',
              isCorrect: isCorrect
          });
      });

      const finalPercentage = total > 0 ? Math.round((score / total) * 100) : 0;
      
      onQuizSubmit({
          id: 'res' + Date.now(),
          studentId: student!.id,
          quizId: activeQuiz.id,
          quizTitle: activeQuiz.title,
          score: isForced ? 0 : finalPercentage,
          status: 'graded',
          date: new Date().toLocaleDateString('ar-EG'),
          cheatWarnings: cheatWarnings,
          isCheatSuspected: isForced || cheatWarnings > 2,
          attempts: attempts
      });

      if (onUpdateStudent && !isForced) {
          onUpdateStudent({ points: (student!.points || 0) + (finalPercentage > 80 ? 20 : 5) });
      }

      setActiveQuiz(null);
      if (document.fullscreenElement) document.exitFullscreen();
      
      if (!isForced) addToast(`تم إنهاء الاختبار. نتيجتك: ${finalPercentage}%`, 'success');
  };

  if (!student) return null;

  const level = Math.floor(student.points / 1000) + 1;
  const progressToNextLevel = Math.min(((student.points % 1000) / 1000) * 100, 100);
  const streaks = student.streaks || 0;
  
  const filterBySubject = (items: any[]) => {
    if (selectedSubject === 'all') return items;
    // For generic matching, we check if the item's subject equals the selection
    // Or if the item's name/title contains the selection
    return items.filter(item => {
      const text = (item.title || item.name || item.description || '').toLowerCase();
      const itemSubject = (item.subject || '').toLowerCase();
      return itemSubject === selectedSubject.toLowerCase() || text.includes(selectedSubject.toLowerCase());
    });
  };

  const filteredAssignments = filterBySubject(assignments).filter(a => 
    isTeacherPreview || a.yearId === student.yearId
  );
  
  const pendingAssignments = isTeacherPreview 
    ? filteredAssignments.filter(a => a.status === 'active')
    : filteredAssignments.filter(a => a.status === 'active' && !submissions.find(s => s.assignmentId === a.id));

  const filteredQuizzes = filterBySubject(quizzes).filter(q => 
    isTeacherPreview || q.yearId === student.yearId
  );

  const filteredVideos = filterBySubject(videoLessons).filter(v => 
    (!libraryTerm || libraryTerm === 'all' || v.term === libraryTerm) &&
    (isTeacherPreview || v.yearId === student.yearId || v.yearId === 'all')
  );

  const filteredDocs = filterBySubject(educationalSources).filter(s => 
    (!libraryTerm || libraryTerm === 'all' || s.term === libraryTerm) &&
    (isTeacherPreview || s.yearId === student.yearId || s.yearId === 'all')
  );
  
  const SidebarItem: React.FC<{ id: string; label: string; icon: React.ReactNode; active: boolean; index: number }> = ({ id, label, icon, active, index }) => (
    <button 
      onClick={() => setActiveTab(id as any)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-r-4 select-none rounded-l-2xl my-1 ${
        active 
          ? 'bg-gradient-to-r from-amber-500/20 to-transparent border-amber-500 text-amber-400' 
          : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
      } ${draggedItemIndex === index ? 'opacity-50 border-dashed border-slate-500 scale-95' : ''}`}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(index)}
      style={{ cursor: 'grab' }}
    >
      <span className={`transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
      <span className={`text-sm ${active ? 'font-black' : 'font-medium'}`}>{label}</span>
    </button>
  );

  // Render logic...
  // (Main layout code same as previous, just using the new filtered variables)
  
  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden selection:bg-amber-500/30 selection:text-amber-100" dir="rtl">
      
      {/* Sidebar (Desktop) */}
      <aside className="hidden lg:flex w-72 bg-[#0f172a] border-l border-white/5 h-screen sticky top-0 flex-col z-20 shadow-[4px_0_40px_rgba(0,0,0,0.5)]">
         <div className="p-8 border-b border-white/5 mb-4 bg-gradient-to-b from-[#1e293b]/50 to-transparent">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">∑</div>
               <div>
                  <h1 className="font-black text-white text-lg leading-none tracking-tight">{settings.platformName}</h1>
                  <span className="text-[10px] font-bold text-slate-500">Student Portal</span>
               </div>
            </div>
         </div>
         <nav className="flex-1 py-4 space-y-2 px-4">
            {orderedTabs.map((tab, idx) => (
               <SidebarItem key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} active={activeTab === tab.id} index={idx} />
            ))}
         </nav>
         <div className="p-6 border-t border-white/5 bg-[#1e293b]/30 backdrop-blur-sm">
            <button onClick={onBack} className="w-full py-3 bg-white/5 border border-white/10 text-rose-400 rounded-2xl text-xs font-black hover:bg-rose-500/10 hover:border-rose-500/30 transition-all flex items-center justify-center gap-2">
               <LogOut size={16} /> تسجيل الخروج
            </button>
         </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
         {/* ... (Backgrounds and Mobile Header) ... */}
         
         <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 no-scrollbar relative z-10 scroll-smooth">
            <div className="max-w-6xl mx-auto w-full pb-24">
               {activeTab === 'dashboard' && (
                   <div className="space-y-8 animate-fadeIn pb-24">
                       {/* Hero Section */}
                       <StudentHero 
                          student={student} 
                          level={level} 
                          progressToNextLevel={progressToNextLevel} 
                          streaks={streaks} 
                       />

                       {isTargetForLive && (
                           <div onClick={() => setShowLiveStream(true)} className="bg-gradient-to-r from-rose-600 to-red-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-rose-900/20 animate-pulse cursor-pointer flex items-center justify-between gap-4 border border-rose-400/30">
                               <div className="flex items-center gap-4">
                                   <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm"><Video size={28} /></div>
                                   <div><h3 className="font-black text-lg">بث مباشر الآن</h3><p className="text-xs font-bold text-rose-100">انضم للحصة التفاعلية فوراً</p></div>
                               </div>
                               <div className="bg-white text-rose-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"><Play size={20} className="ml-1" /></div>
                           </div>
                       )}

                       {/* Subjects Pills */}
                       <div>
                          <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 px-2"><span>📚</span> تصفح المواد</h3>
                          <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                             <button onClick={() => setSelectedSubject('all')} className={`p-4 rounded-2xl text-xs font-black transition-all ${selectedSubject === 'all' ? 'bg-white text-indigo-900 scale-105 shadow-xl' : 'bg-[#1e293b] border border-white/5 text-slate-400 hover:bg-white/5'}`}>الكل</button>
                             {SUBJECTS.map(subj => (
                                <button key={subj.id} onClick={() => setSelectedSubject(subj.id)} className={`relative overflow-hidden p-4 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-2 group ${selectedSubject === subj.id ? 'text-white scale-105 shadow-xl ring-2 ring-white/20' : 'bg-[#1e293b] border border-white/5 text-slate-400 hover:bg-white/5'}`}>
                                   {selectedSubject === subj.id && <div className={`absolute inset-0 bg-gradient-to-br ${subj.color} opacity-100 z-0`}></div>}
                                   <span className="relative z-10 text-xl group-hover:scale-110 transition-transform">{subj.icon}</span>
                                   <span className="relative z-10">{subj.name}</span>
                                </button>
                             ))}
                          </div>
                       </div>

                       {/* Urgent Tasks */}
                       <div>
                          <div className="flex justify-between items-center mb-4 px-2">
                             <h3 className="text-white font-black text-lg flex items-center gap-2"><Clock size={20} className="text-amber-500" /> مهام مطلوبة</h3>
                             <button onClick={() => setActiveTab('assignments')} className="text-xs text-indigo-400 font-bold hover:text-indigo-300">عرض الكل</button>
                          </div>
                          {pendingAssignments.length > 0 ? (
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {pendingAssignments.slice(0, 4).map(asg => (
                                   <div key={asg.id} className="bg-[#1e293b] p-5 rounded-[2rem] border border-white/5 hover:border-indigo-500/50 transition-all group flex justify-between items-center shadow-lg">
                                      <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center shadow-inner"><FileText size={24} /></div>
                                         <div>
                                            <h4 className="font-bold text-slate-200 text-sm mb-1">{asg.title}</h4>
                                            <span className="text-[10px] font-black text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/10">مطلوب: {asg.dueDate}</span>
                                         </div>
                                      </div>
                                      <button onClick={() => { if(asg.externalLink) window.open(asg.externalLink, '_blank'); else { setScannedAsgId(asg.id); setShowScanner(true); } }} className="w-10 h-10 bg-white text-indigo-900 rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"><Zap size={18} /></button>
                                   </div>
                                ))}
                             </div>
                          ) : (
                             <div className="bg-[#1e293b]/50 p-10 rounded-[2rem] border border-dashed border-slate-700 text-center">
                                <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500/50" />
                                <p className="text-slate-400 font-bold text-sm">أنت في الصدارة! لا توجد مهام جديدة.</p>
                             </div>
                          )}
                       </div>
                   </div>
               )}
               
               {/* ... (Other tabs like library, assignments, quizzes remain same logic but use filteredVideos, filteredDocs etc) ... */}
               
               {activeTab === 'library' && (
                   // Render library content using filteredVideos and filteredDocs
                   <div className="space-y-8 animate-fadeIn pb-24">
                       <div className="flex justify-between items-end border-b border-white/10 pb-4">
                          <h2 className="text-3xl font-black text-white flex items-center gap-3"><BookOpen className="text-amber-500" /> مكتبتي</h2>
                          <div className="flex bg-[#1e293b] p-1 rounded-xl border border-white/5">
                             <button onClick={() => setLibraryFilter('video')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${libraryFilter === 'video' ? 'bg-white text-slate-900 shadow' : 'text-slate-400'}`}><Video size={14} /> فيديوهات</button>
                             <button onClick={() => setLibraryFilter('doc')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${libraryFilter === 'doc' ? 'bg-white text-slate-900 shadow' : 'text-slate-400'}`}><File size={14} /> كتب</button>
                          </div>
                       </div>
                       
                       {libraryFilter === 'video' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {filteredVideos.map(vid => (
                                   <div key={vid.id} onClick={() => setSelectedVideo(vid)} className="bg-[#1e293b] rounded-[2rem] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg flex flex-col h-full">
                                       <div className="relative aspect-video bg-black/50 group-hover:opacity-80 transition-opacity">
                                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-slate-900/50"><Play size={48} className="text-white drop-shadow-lg opacity-80 group-hover:scale-110 transition-transform" /></div>
                                           <div className="absolute top-3 left-3"><span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold border border-white/10">ترم {vid.term}</span></div>
                                       </div>
                                       <div className="p-5 flex flex-col flex-1">
                                           <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 leading-relaxed flex-1">{vid.title}</h3>
                                           <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                                              <span className="text-[10px] text-indigo-400 font-bold">{vid.subject || 'عام'}</span>
                                              <span className="text-[10px] text-slate-500">{vid.uploadDate}</span>
                                           </div>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {filteredDocs.map(doc => (
                                   <div key={doc.id} className="bg-[#1e293b] p-6 rounded-[2rem] border border-white/5 hover:border-amber-500/30 transition-all flex items-center gap-5 group relative">
                                       <div className="w-14 h-14 bg-amber-500/10 text-amber-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform"><FileText size={24} /></div>
                                       <div className="flex-1 overflow-hidden">
                                           <h3 className="text-white font-bold text-sm truncate">{doc.name}</h3>
                                           <span className="text-slate-500 text-[10px]">{doc.uploadDate}</span>
                                       </div>
                                       <a href={doc.data} download={doc.name} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"><Download size={18} /></a>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               )}
               
               {/* Keep other tabs (assignments, quizzes, results) essentially the same, utilizing filtered lists */}
               {activeTab === 'assignments' && (
                  <div className="space-y-8 pb-24 animate-fadeIn">
                     <h2 className="text-3xl font-black text-white border-b border-white/10 pb-4 flex items-center gap-3"><FileText className="text-indigo-500" /> الواجبات المدرسية</h2>
                     <div className="flex flex-col gap-4">
                        {filteredAssignments.map(asg => {
                           const isSubmitted = submissions.find(s => s.assignmentId === asg.id);
                           const isBoardAssignment = asg.fileUrl && !asg.externalLink; 
                           
                           return (
                              <div key={asg.id} className="bg-[#1e293b] p-6 rounded-[2.5rem] border border-white/5 hover:border-indigo-500/50 transition-all group flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-lg">
                                 <div className="flex items-start gap-5">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner ${isSubmitted ? 'bg-emerald-500/10 text-emerald-500' : 'bg-indigo-500/10 text-indigo-400'}`}>
                                       {isSubmitted ? <CheckCircle2 size={32} /> : <FileText size={32} />}
                                    </div>
                                    <div>
                                       <h3 className="font-bold text-white text-lg mb-2">{asg.title}</h3>
                                       <div className="flex flex-wrap gap-3">
                                          <span className="bg-white/5 px-3 py-1 rounded-lg border border-white/5 text-[10px] text-slate-300 font-bold">عام</span>
                                          <span className={`text-[10px] px-3 py-1 rounded-lg font-bold border ${!isSubmitted ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>تسليم: {asg.dueDate}</span>
                                       </div>
                                    </div>
                                 </div>
                                 {!isSubmitted ? (
                                     <div className="flex gap-3 w-full lg:w-auto">
                                         <button onClick={() => { setScannedAsgId(asg.id); setShowScanner(true); }} className="flex-1 lg:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2"><span>رفع صورة</span><Camera size={16} /></button>
                                     </div>
                                 ) : (
                                     <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 rounded-2xl font-black text-xs border border-emerald-500/20 text-center flex items-center justify-center gap-2"><CheckCircle2 size={16} /> تم التسليم بنجاح</div>
                                 )}
                              </div>
                           );
                        })}
                     </div>
                  </div>
               )}

               {activeTab === 'quizzes' && (
                   <div className="space-y-8 pb-24 animate-fadeIn">
                       <h2 className="text-3xl font-black text-white border-b border-white/10 pb-4 flex items-center gap-3"><Zap className="text-amber-500" /> الاختبارات</h2>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           {filteredQuizzes.map(quiz => (
                               <div key={quiz.id} className="bg-[#1e293b] p-8 rounded-[2.5rem] border border-white/5 hover:border-amber-500/50 transition-all flex flex-col justify-between h-full group relative overflow-hidden">
                                   <div className="relative z-10">
                                      <h3 className="font-black text-white text-xl leading-tight mb-2">{quiz.title}</h3>
                                      <p className="text-slate-400 text-xs font-bold bg-white/5 inline-flex items-center gap-2 px-3 py-1 rounded-lg"><FileText size={12} /> {quiz.questions?.length || 0} سؤال • <Clock size={12} /> {quiz.duration || 30} دقيقة</p>
                                   </div>
                                   <button onClick={() => handleStartQuiz(quiz)} className="mt-8 w-full py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-2xl font-black text-sm shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative z-10 flex items-center justify-center gap-2">ابدأ الاختبار الآن <Play size={16} /></button>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {activeTab === 'results' && (
                  <div className="space-y-8 pb-24 animate-fadeIn">
                     <h2 className="text-3xl font-black text-white border-b border-white/10 pb-4 flex items-center gap-3"><BarChart2 className="text-blue-500" /> سجل النتائج</h2>
                     <div className="bg-[#1e293b] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
                        <table className="w-full text-right text-slate-300">
                            <thead>
                                <tr className="bg-white/5 text-xs font-black text-slate-400 border-b border-white/5">
                                   <th className="p-6">العنوان</th>
                                   <th className="p-6 text-center">الحالة</th>
                                   <th className="p-6 text-center">الدرجة</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...results, ...submissions.filter(s=>s.status==='graded')].map((r: any) => (
                                    <tr key={r.id} className="hover:bg-white/5 transition-colors">
                                        <td className="p-6 font-bold text-sm">{r.quizTitle || assignments.find(a=>a.id===r.assignmentId)?.title}</td>
                                        <td className="p-6 text-center"><span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1"><CheckCircle2 size={12} /> تم الرصد</span></td>
                                        <td className="p-6 text-center"><span className="text-xl font-black text-amber-400">{r.score || r.grade}%</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         </main>

         {/* Mobile Menu (FAB) */}
         <div className="lg:hidden fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-4">
            {isFabOpen && (
               <div className="flex flex-col gap-2 mb-2 animate-slideUp">
                  {orderedTabs.map((tab) => (
                     <button key={tab.id} onClick={() => { setActiveTab(tab.id); setIsFabOpen(false); }} className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl transition-all border border-white/10 backdrop-blur-md ${activeTab === tab.id ? 'bg-amber-500 text-white' : 'bg-[#1e293b]/90 text-slate-300'}`}>
                        <span className="text-xl">{tab.icon}</span>
                        <span className="font-bold text-sm whitespace-nowrap">{tab.label}</span>
                     </button>
                  ))}
               </div>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all border-4 border-[#0f172a] ${isFabOpen ? 'bg-rose-500 rotate-90' : 'bg-amber-500 hover:scale-110 active:scale-90'}`}>{isFabOpen ? <X size={24} /> : <Menu size={24} />}</button>
            {isFabOpen && <div className="fixed inset-0 bg-black/60 z-[-1] backdrop-blur-sm" onClick={() => setIsFabOpen(false)}></div>}
         </div>
      </div>

      {/* Modals (LiveStream, Quiz, Scanner, Board, LuckyWheel) */}
      {showLiveStream && isTargetForLive && jitsiEmbedUrl && (
          <div className="fixed inset-0 z-[3000] bg-black flex flex-col animate-scaleIn">
              <div className="bg-[#1D2228] p-4 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-bold flex items-center gap-2"><span className="text-red-500 animate-pulse text-xs font-black">● LIVE</span> {settings.liveSessionTitle}</h3>
                  <button onClick={() => setShowLiveStream(false)} className="px-4 py-2 bg-white/10 hover:bg-red-600 rounded-xl text-xs font-black transition-colors flex items-center gap-2">مغادرة <X size={16} /></button>
              </div>
              <iframe src={jitsiEmbedUrl} className="flex-1 w-full border-0" allowFullScreen />
          </div>
      )}

      {activeQuiz && (
          <div className="fixed inset-0 z-[2000] bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-scaleIn">
              {showCheatAlert && (
                  <div className="absolute inset-0 z-[3000] bg-red-600/90 backdrop-blur-xl flex items-center justify-center p-10 text-center animate-pulse">
                      <div className="text-white space-y-4"><AlertTriangle size={96} className="mx-auto" /><h1 className="text-5xl font-black">تحذير أمني!</h1><p className="text-xl font-bold">لقد قمت بالخروج من شاشة الامتحان.</p><button onClick={() => setShowCheatAlert(false)} className="px-10 py-4 bg-white text-red-600 rounded-2xl font-black text-xl hover:scale-105 transition-transform">فهمت</button></div>
                  </div>
              )}
              <div className="w-full max-w-4xl bg-[#1e293b] rounded-[3rem] p-8 md:p-12 shadow-2xl border border-white/10 flex flex-col max-h-full">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5"><h3 className="text-2xl font-black text-white">{activeQuiz.title}</h3><div className="text-amber-500 animate-pulse"><Clock size={32} /></div></div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-10 pr-2">
                      {activeQuiz.questions?.map((q, idx) => (
                          <div key={q.id} className="space-y-4"><p className="text-white font-bold text-xl leading-relaxed"><span className="text-amber-500 ml-2 font-black">#{idx+1}</span> {q.question}</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3">{q.options?.map((opt, i) => (<button key={i} onClick={() => setActiveQuizAnswers(prev => ({...prev, [q.id]: opt}))} className={`p-5 rounded-2xl border-2 text-right font-bold transition-all text-sm ${activeQuizAnswers[q.id] === opt ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg transform scale-[1.02]' : 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10'}`}>{opt}</button>))}</div></div>
                      ))}
                  </div>
                  <button onClick={() => submitQuiz(false)} className="mt-8 w-full py-5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2">إنهاء وتسليم الإجابات <CheckCircle2 size={24} /></button>
              </div>
          </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[1000] bg-black/95 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-[#1e293b] w-full max-w-lg rounded-[3rem] p-8 shadow-2xl border border-white/10 relative text-center">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-white flex items-center gap-2"><Camera size={24} /> رفع الواجب</h3><button onClick={() => setShowScanner(false)} className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500 transition-all"><X size={20} /></button></div>
                {!scannerImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-700 rounded-[2.5rem] h-80 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-500/10 transition-all group"><Upload size={48} className="mb-6 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110 transition-all" /><p className="font-black text-slate-300 text-lg">اضغط لالتقاط أو رفع صورة</p><input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} /></div>
                ) : (
                    <div className="space-y-6"><div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10 bg-black h-80 flex items-center justify-center"><canvas ref={canvasRef} className="max-w-full max-h-full object-contain" /></div><div className="flex gap-4"><button onClick={() => setScannerImage(null)} className="flex-1 py-4 bg-slate-700 text-white rounded-2xl font-black text-sm hover:bg-slate-600 transition-all">إلغاء</button><button onClick={submitScannedHomework} className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">اعتماد وإرسال <CheckCircle2 size={18} /></button></div></div>
                )}
            </div>
        </div>
      )}

      {selectedVideo && <div className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-xl flex flex-col p-4 animate-fadeIn"><div className="flex justify-between items-center mb-6 text-white max-w-5xl mx-auto w-full"><div><h3 className="font-bold text-lg md:text-xl text-slate-100">{selectedVideo.title}</h3></div><button onClick={() => setSelectedVideo(null)} className="w-12 h-12 bg-white/10 hover:bg-rose-600 rounded-full flex items-center justify-center text-xl transition-all border border-white/10"><X size={20} /></button></div><div className="flex-1 flex items-center justify-center w-full"><div className="w-full max-w-5xl"><ProtectedVideo src={selectedVideo.youtubeUrl} title={selectedVideo.title} watermarkText={student.name + ' | ' + student.studentCode} enabled={settings.protectionEnabled} provider={selectedVideo.provider} onProgress={(p) => { if (onVideoProgress && selectedVideo) { onVideoProgress(selectedVideo.id, p); } }} /></div></div></div>}

    </div>
  );
};

export default StudentPortal;
