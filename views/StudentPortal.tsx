
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz, AssignmentSubmission, ChatMessage, Year, AppNotification, Group, EducationalSource, ScheduleEntry, MathFormula, PlatformReward, RewardRedemption, AppView, QuestionAttempt } from '../types';
import LuckyWheel from '../components/LuckyWheel';
import MathRenderer from '../components/MathRenderer';
import ProtectedVideo from '../components/ProtectedVideo';
import { explainWrongAnswer } from '../services/geminiService';
import InteractiveBoard from '../components/InteractiveBoard';

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
}

const SUBJECTS = [
  { id: 'algebra', name: 'الجبر', icon: '🧮', color: '#3b82f6' },
  { id: 'geometry', name: 'هندسة', icon: '📐', color: '#10b981' },
  { id: 'calculus', name: 'التفاضل', icon: '📈', color: '#f59e0b' },
  { id: 'trig', name: 'المثلثات', icon: '🔺', color: '#8b5cf6' },
  { id: 'statics', name: 'الاستاتيكا', icon: '🏗️', color: '#6366f1' },
  { id: 'dynamics', name: 'الديناميكا', icon: '🚀', color: '#ec4899' },
];

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  onQuizSubmit, onAssignmentSubmit, onSendMessage, onRedeemReward, onSpinWin, onBack,
  educationalSources, rewards, onVideoProgress, onUpdateStudent, onSendNotification, years
}) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [libraryFilter, setLibraryFilter] = useState<'video' | 'doc'>('video');
  const [libraryTerm, setLibraryTerm] = useState<'all' | '1' | '2'>('all'); 
  
  const [showLuckyWheel, setShowLuckyWheel] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [showLiveStream, setShowLiveStream] = useState(false);
  
  // Board Solving State
  const [showBoard, setShowBoard] = useState(false);
  const [solvingAsg, setSolvingAsg] = useState<Assignment | null>(null);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<string, string>>({});
  const [cheatWarnings, setCheatWarnings] = useState(0);

  const [showScanner, setShowScanner] = useState(false);
  const [scannerImage, setScannerImage] = useState<string | null>(null);
  const [scannedAsgId, setScannedAsgId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [explainingQuestion, setExplainingQuestion] = useState<string | null>(null);
  const [explanationText, setExplanationText] = useState<string | null>(null);

  const [isFabOpen, setIsFabOpen] = useState(false);

  // --- Drag and Drop State ---
  const [orderedTabs, setOrderedTabs] = useState<any[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const isTeacherPreview = student?.id === 'teacher-view';

  const DEFAULT_TABS: { id: string; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'dashboard', label: 'الرئيسية', icon: '🏠' },
    { id: 'library', label: 'دروسي', icon: '📚' },
    { id: 'assignments', label: 'الواجبات', icon: '📝' },
    { id: 'quizzes', label: 'الاختبارات', icon: '⚡' },
    { id: 'results', label: 'نتائجي', icon: '📊' }
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

  // Sync state with settings, preserving order if IDs match
  useEffect(() => {
    if (orderedTabs.length === 0) {
        setOrderedTabs(initialTabs);
    } else {
        // If settings changed (e.g. enabled/disabled), update list but try to keep order
        const currentIds = new Set(initialTabs.map(t => t.id));
        const newOrdered = orderedTabs.filter(t => currentIds.has(t.id));
        
        // Add any new tabs that might have appeared
        initialTabs.forEach(t => {
            if (!newOrdered.find(ot => ot.id === t.id)) {
                newOrdered.push(t);
            }
        });
        
        // Update labels if changed in settings
        const finalTabs = newOrdered.map(t => {
            const freshData = initialTabs.find(it => it.id === t.id);
            return freshData || t;
        });

        setOrderedTabs(finalTabs);
    }
  }, [initialTabs]);

  // --- DnD Handlers ---
  const handleDragStart = (index: number) => {
    setDraggedItemIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // Necessary to allow dropping
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

  const jitsiAppUrl = useMemo(() => {
      if (!settings.liveSessionLink) return '';
      return settings.liveSessionLink.split('#')[0]; 
  }, [settings.liveSessionLink]);

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

  const submitBoardHomework = (dataUrl: string) => {
    if (!solvingAsg) return;
    submitAssignment(solvingAsg.id, dataUrl);
    setShowBoard(false);
    setSolvingAsg(null);
  };

  const submitAssignment = (asgId: string, fileUrl: string) => {
    const assignment = assignments.find(a => a.id === asgId);
    if (assignment && !isTeacherPreview && onSendNotification) {
       const dueDate = new Date(assignment.dueDate);
       dueDate.setHours(23, 59, 59, 999);
       const now = new Date();
       if (now > dueDate) {
          onSendNotification({
             title: '⚠️ تسليم واجب متأخر',
             message: `قام الطالب "${student!.name}" بتسليم واجب "${assignment.title}" بعد الموعد المحدد.`,
             type: 'urgent',
             targetStudentId: 'teacher' 
          });
       }
    }

    onAssignmentSubmit({
        assignmentId: asgId,
        studentId: student!.id,
        studentName: student!.name,
        fileUrl: fileUrl
    });
    alert('تم تسليم الواجب بنجاح! 🚀');
  };

  const handleStartQuiz = (quiz: Quiz) => {
      setActiveQuiz(quiz);
      setActiveQuizAnswers({});
      setCheatWarnings(0);
  };

  const submitQuiz = () => {
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
          score: finalPercentage,
          status: 'graded',
          date: new Date().toLocaleDateString('ar-EG'),
          cheatWarnings: cheatWarnings,
          isCheatSuspected: cheatWarnings > 2,
          attempts: attempts
      });

      if (onUpdateStudent) {
          onUpdateStudent({ points: (student!.points || 0) + (finalPercentage > 80 ? 20 : 5) });
      }

      setActiveQuiz(null);
      alert(`تم إنهاء الاختبار. نتيجتك: ${finalPercentage}%`);
  };

  if (!student) return null;

  const level = Math.floor(student.points / 1000) + 1;
  
  const filterBySubject = (items: any[]) => {
    if (selectedSubject === 'all') return items;
    const subjectName = SUBJECTS.find(s => s.id === selectedSubject)?.name || '';
    return items.filter(item => {
      const text = (item.title || item.name || item.description || '').toLowerCase();
      const itemSubject = item.subject || '';
      return text.includes(subjectName) || itemSubject.includes(subjectName);
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
    !s.isAiReference && (!libraryTerm || libraryTerm === 'all' || s.term === libraryTerm) &&
    (isTeacherPreview || s.yearId === student.yearId || s.yearId === 'all')
  );
  
  // Custom Sidebar Item Component
  const SidebarItem: React.FC<{ id: string; label: string; icon: string; active: boolean; index: number }> = ({ id, label, icon, active, index }) => (
    <button 
      onClick={() => setActiveTab(id as any)}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-r-4 select-none ${
        active 
          ? 'bg-white/10 border-amber-500 text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
          : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200'
      } ${draggedItemIndex === index ? 'opacity-50 border-dashed border-slate-500 scale-95' : ''}`}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(index)}
      style={{ cursor: 'grab' }}
    >
      <span className={`text-xl transition-transform ${active ? 'scale-110' : ''}`}>{icon}</span>
      <span className={`text-sm ${active ? 'font-black' : 'font-medium'}`}>{label}</span>
      <span className="mr-auto text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity text-xs">⋮⋮</span>
    </button>
  );

  const renderDashboard = () => (
    <div className="space-y-8 animate-fadeIn pb-24">
       {isTargetForLive && (
           <div className="bg-red-600 rounded-[2.5rem] p-6 text-white shadow-xl animate-pulse cursor-pointer flex items-center justify-between gap-4" onClick={() => setShowLiveStream(true)}>
               <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center animate-ping absolute"></div>
                   <div className="w-12 h-12 bg-white text-red-600 rounded-full flex items-center justify-center text-2xl font-black relative z-10">📹</div>
                   <div>
                       <h3 className="font-black text-lg">بث مباشر الآن</h3>
                       <p className="text-xs font-bold text-red-100">اضغط للانضمام فوراً</p>
                   </div>
               </div>
               <button className="bg-white text-red-600 px-6 py-3 rounded-2xl font-black text-xs shadow-lg whitespace-nowrap hover:scale-105 transition-transform">انضم الآن ▶</button>
           </div>
       )}

       <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-slate-900 to-indigo-950 p-8 border border-white/10 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 space-y-2 text-center md:text-right">
             <h2 className="text-2xl md:text-4xl font-black text-white">مرحباً، {student.name.split(' ')[0]} 👋</h2>
             <p className="text-slate-400 text-sm font-medium">لديك <span className="text-amber-400 font-bold border-b border-amber-500/50">{pendingAssignments.length} واجبات</span> جديدة بانتظارك اليوم.</p>
          </div>
          
          <div className="relative z-10 flex gap-6 items-center bg-white/5 backdrop-blur-md px-8 py-4 rounded-2xl border border-white/10 shadow-lg">
             <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المستوى</p>
                <p className="text-2xl font-black text-white">{level}</p>
             </div>
             <div className="w-px h-10 bg-white/10"></div>
             <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">النقاط</p>
                <p className="text-2xl font-black text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">{student.points}</p>
             </div>
          </div>
       </div>

       <div className="bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/5 p-6 min-h-[300px]">
          <h3 className="font-black text-white text-lg mb-4 flex items-center gap-2"><span>📌</span> المهام العاجلة</h3>
          {pendingAssignments.length > 0 ? (
             <div className="space-y-4">
                {pendingAssignments.slice(0, 4).map(asg => (
                   <div key={asg.id} className="p-4 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors rounded-xl flex items-center justify-between group">
                      <div>
                         <div className="flex gap-2 mb-1">
                            <span className="text-[9px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">عاجل</span>
                            <span className="text-[9px] font-bold text-slate-400 bg-white/5 px-2 py-0.5 rounded">{asg.dueDate}</span>
                         </div>
                         <h4 className="font-bold text-slate-200 text-sm">{asg.title}</h4>
                      </div>
                      <button 
                        onClick={() => setActiveTab('assignments')}
                        className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-black transition-all shadow-lg"
                      >
                        حل ⚡
                      </button>
                   </div>
                ))}
             </div>
          ) : (
             <div className="text-center py-12 opacity-60"><p className="text-slate-400 font-bold">لا توجد مهام جديدة</p></div>
          )}
       </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden selection:bg-amber-500/30 selection:text-amber-100" dir="rtl">
      
      <aside className="hidden lg:flex w-64 bg-[#0f172a] border-l border-white/5 h-screen sticky top-0 flex-col z-20 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
         <div className="p-8 border-b border-white/5 mb-2 bg-[#1e293b]/30">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">∑</div>
               <div>
                  <h1 className="font-black text-white text-lg leading-none tracking-tight">{settings.platformName}</h1>
               </div>
            </div>
         </div>
         <nav className="flex-1 py-4 space-y-2 px-2">
            {orderedTabs.map((tab, idx) => (
               <SidebarItem key={tab.id} id={tab.id} label={tab.label} icon={tab.icon} active={activeTab === tab.id} index={idx} />
            ))}
         </nav>
         <div className="p-4 border-t border-white/5 bg-[#1e293b]/50 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-4">
               <img src={student.avatar} className="w-10 h-10 rounded-full border-2 border-amber-500/50" alt="" />
               <div className="flex-1 overflow-hidden">
                  <p className="font-bold text-white text-xs truncate">{student.name}</p>
                  <p className="text-[10px] text-slate-400 truncate">{student.studentCode}</p>
               </div>
            </div>
            <button onClick={onBack} className="w-full py-2 bg-white/5 border border-white/10 text-rose-400 rounded-xl text-xs font-bold hover:bg-rose-500/10 hover:border-rose-500/30 transition-all">
               تسجيل الخروج
            </button>
         </div>
      </aside>

      <div className="flex-1 flex flex-col h-screen overflow-hidden relative">
         <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none"></div>
         <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] bg-amber-600/5 blur-[100px] rounded-full pointer-events-none"></div>

         <div className="lg:hidden bg-[#0f172a]/90 backdrop-blur-md p-4 flex justify-between items-center border-b border-white/10 sticky top-0 z-30 shadow-lg">
            <div className="flex items-center gap-3">
               <div className="w-8 h-8 bg-amber-500 text-white rounded-lg flex items-center justify-center text-lg font-black">∑</div>
               <span className="font-black text-white text-sm">{orderedTabs.find(t=>t.id===activeTab)?.label}</span>
            </div>
            <button onClick={onBack} className="text-slate-400 hover:text-rose-500 text-sm font-bold bg-white/5 px-3 py-1 rounded-lg">خروج</button>
         </div>

         <main className="flex-1 overflow-y-auto p-4 md:p-10 no-scrollbar relative z-10">
            <div className="max-w-6xl mx-auto w-full pb-24">
               {activeTab === 'dashboard' && renderDashboard()}
               {activeTab === 'library' && (
                   <div className="space-y-6 pb-24 animate-fadeIn">
                       <h2 className="text-2xl font-black text-white">مكتبتي التعليمية</h2>
                       <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                           <button onClick={() => setLibraryFilter('video')} className={`px-4 py-2 rounded-xl text-xs font-bold ${libraryFilter === 'video' ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400'}`}>فيديوهات 🎬</button>
                           <button onClick={() => setLibraryFilter('doc')} className={`px-4 py-2 rounded-xl text-xs font-bold ${libraryFilter === 'doc' ? 'bg-amber-500 text-white' : 'bg-white/10 text-slate-400'}`}>كتب وملازم 📚</button>
                       </div>
                       
                       {libraryFilter === 'video' ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                               {filteredVideos.map(vid => (
                                   <div key={vid.id} onClick={() => setSelectedVideo(vid)} className="bg-[#1e293b] rounded-[2rem] overflow-hidden border border-white/5 hover:border-indigo-500/50 transition-all cursor-pointer group shadow-lg">
                                       <div className="relative aspect-video bg-black/50">
                                           <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900 to-slate-900"><span className="text-4xl opacity-50">▶</span></div>
                                           <div className="absolute top-2 left-2"><span className="bg-black/50 text-white px-2 py-0.5 rounded text-[8px] font-bold">ترم {vid.term}</span></div>
                                       </div>
                                       <div className="p-5">
                                           <h3 className="text-white font-bold text-sm mb-1 line-clamp-2">{vid.title}</h3>
                                       </div>
                                   </div>
                               ))}
                           </div>
                       ) : (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {filteredDocs.map(doc => (
                                   <div key={doc.id} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                                       <div className="text-2xl">📄</div>
                                       <div className="flex-1">
                                           <h3 className="text-white font-bold text-sm truncate">{doc.name}</h3>
                                           <span className="text-slate-400 text-[9px]">{doc.uploadDate}</span>
                                       </div>
                                       <a href={doc.data} download={doc.name} className="bg-white/10 w-10 h-10 rounded-full flex items-center justify-center text-white">⬇</a>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>
               )}

               {activeTab === 'assignments' && (
                  <div className="space-y-6 pb-24 animate-fadeIn">
                     <h2 className="text-2xl font-black text-white border-b border-white/10 pb-4 mb-6">واجباتي المدرسية</h2>
                     <div className="flex flex-col gap-3">
                        {filteredAssignments.length > 0 ? filteredAssignments.map(asg => {
                           const isSubmitted = submissions.find(s => s.assignmentId === asg.id);
                           const isBoardAssignment = asg.fileUrl && !asg.externalLink; 
                           
                           return (
                              <div key={asg.id} className="bg-white/5 backdrop-blur-md p-5 rounded-2xl border border-white/5 hover:border-indigo-500/50 hover:bg-white/10 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
                                 <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl shrink-0 ${isSubmitted ? 'bg-emerald-500/20 text-emerald-400' : 'bg-indigo-500/20 text-indigo-400'}`}>{isSubmitted ? '✓' : '📝'}</div>
                                    <div>
                                       <h3 className="font-bold text-white text-base mb-1">{asg.title}</h3>
                                       <div className="flex flex-wrap gap-3 text-xs text-slate-400">
                                          <span className="bg-white/5 px-2 py-0.5 rounded border border-white/5">{SUBJECTS.find(s => asg.title.includes(s.name))?.name || 'عام'}</span>
                                          <span className={`${!isSubmitted && 'text-rose-400 font-bold'}`}>تسليم: {asg.dueDate}</span>
                                       </div>
                                    </div>
                                 </div>
                                 
                                 {!isSubmitted && (
                                     <div className="flex gap-2 w-full md:w-auto">
                                         {/* Board Solve Option */}
                                         {isBoardAssignment && (
                                             <button 
                                                onClick={() => { setSolvingAsg(asg); setShowBoard(true); }}
                                                className="flex-1 md:flex-none px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                                             >
                                                <span>حل على السبورة</span>
                                                <span>🎨</span>
                                             </button>
                                         )}
                                         
                                         {/* Default Upload Option */}
                                         <button 
                                            onClick={() => { setScannedAsgId(asg.id); setShowScanner(true); }} 
                                            className="flex-1 md:flex-none px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                                         >
                                            <span>رفع صورة الحل</span>
                                            <span>📸</span>
                                         </button>
                                     </div>
                                 )}
                                 
                                 {isSubmitted && (
                                     <button disabled className="px-8 py-3 bg-white/5 text-slate-500 rounded-xl font-bold text-xs cursor-default border border-white/5">
                                        تم التسليم
                                     </button>
                                 )}
                              </div>
                           );
                        }) : (
                            <div className="text-center py-20 opacity-50"><p className="text-slate-400">لا توجد واجبات حالياً</p></div>
                        )}
                     </div>
                  </div>
               )}

               {activeTab === 'quizzes' && (
                   <div className="space-y-6 pb-24 animate-fadeIn">
                       <h2 className="text-2xl font-black text-white border-b border-white/10 pb-4 mb-6">الاختبارات</h2>
                       <div className="grid grid-cols-1 gap-4">
                           {filteredQuizzes.map(quiz => (
                               <div key={quiz.id} className="bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/5 flex justify-between items-center">
                                   <div>
                                       <h3 className="font-bold text-white text-lg">{quiz.title}</h3>
                                       <p className="text-slate-400 text-xs mt-1 font-bold">{quiz.questions?.length || 0} أسئلة</p>
                                   </div>
                                   <button onClick={() => handleStartQuiz(quiz)} className="px-6 py-3 bg-amber-500 text-white rounded-xl font-black text-xs shadow-lg hover:bg-amber-600 transition-all">ابدأ ⚡</button>
                               </div>
                           ))}
                       </div>
                   </div>
               )}

               {activeTab === 'results' && (
                  <div className="space-y-6 pb-24 animate-fadeIn">
                     <h2 className="text-2xl font-black text-white border-b border-white/10 pb-4 mb-6">سجل الدرجات</h2>
                     {/* ... Results Table ... */}
                     <div className="bg-white/5 rounded-3xl border border-white/10 overflow-hidden shadow-2xl backdrop-blur-md">
                        <table className="w-full text-right text-slate-300">
                            <thead>
                                <tr className="bg-white/5 text-xs font-black"><th className="p-4">العنوان</th><th className="p-4">الدرجة</th></tr>
                            </thead>
                            <tbody>
                                {[...results, ...submissions.filter(s=>s.status==='graded')].map((r: any) => (
                                    <tr key={r.id} className="border-t border-white/5">
                                        <td className="p-4">{r.quizTitle || assignments.find(a=>a.id===r.assignmentId)?.title}</td>
                                        <td className="p-4 font-bold text-amber-400">{r.score || r.grade}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                     </div>
                  </div>
               )}
            </div>
         </main>

         <div className="lg:hidden fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-4">
            {isFabOpen && (
               <div className="flex flex-col gap-3 mb-2 animate-slideUp">
                  {orderedTabs.map((tab) => (
                     <button
                        key={tab.id}
                        onClick={() => { setActiveTab(tab.id); setIsFabOpen(false); }}
                        className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl transition-all border border-white/10 ${activeTab === tab.id ? 'bg-amber-500 text-white' : 'bg-[#1e293b]/90 text-slate-300'}`}
                     >
                        <span className="text-xl">{tab.icon}</span>
                        <span className="font-bold text-sm whitespace-nowrap">{tab.label}</span>
                     </button>
                  ))}
               </div>
            )}
            <button onClick={() => setIsFabOpen(!isFabOpen)} className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-3xl text-white transition-all border-4 border-[#0f172a] ${isFabOpen ? 'bg-rose-500 rotate-90' : 'bg-amber-500'}`}>
               {isFabOpen ? '✕' : '☰'}
            </button>
            {isFabOpen && <div className="fixed inset-0 bg-black/60 z-[-1] backdrop-blur-sm" onClick={() => setIsFabOpen(false)}></div>}
         </div>
      </div>

      {showLiveStream && isTargetForLive && jitsiEmbedUrl && (
          <div className="fixed inset-0 z-[3000] bg-black flex flex-col">
              <div className="bg-[#1D2228] p-4 flex justify-between items-center text-white shrink-0">
                  <h3 className="font-bold flex items-center gap-2"><span className="text-red-500 animate-pulse">● LIVE</span> {settings.liveSessionTitle}</h3>
                  <button onClick={() => setShowLiveStream(false)} className="px-4 py-2 bg-red-600 rounded-lg text-xs font-bold hover:bg-red-700">مغادرة ✕</button>
              </div>
              <iframe src={jitsiEmbedUrl} className="flex-1 w-full border-0" allowFullScreen />
          </div>
      )}

      {activeQuiz && (
          <div className="fixed inset-0 z-[2000] bg-slate-900 flex flex-col items-center justify-center p-4">
              <div className="w-full max-w-4xl bg-[#1e293b] rounded-[3rem] p-8 shadow-2xl border border-white/10 flex flex-col max-h-full">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/5">
                      <h3 className="text-xl font-black text-white">{activeQuiz.title}</h3>
                  </div>
                  <div className="flex-1 overflow-y-auto no-scrollbar space-y-8 pr-2">
                      {activeQuiz.questions?.map((q, idx) => (
                          <div key={q.id} className="space-y-4">
                              <p className="text-white font-bold text-lg"><span className="text-amber-500 ml-2">#{idx+1}</span> {q.question}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                  {q.options?.map((opt, i) => (
                                      <button key={i} onClick={() => setActiveQuizAnswers(prev => ({...prev, [q.id]: opt}))} className={`p-4 rounded-xl border text-right font-bold transition-all ${activeQuizAnswers[q.id] === opt ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-white/5 border-white/10 text-slate-300'}`}>
                                          {opt}
                                      </button>
                                  ))}
                              </div>
                          </div>
                      ))}
                  </div>
                  <button onClick={submitQuiz} className="mt-6 w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg shadow-xl">إنهاء وتسليم ✅</button>
              </div>
          </div>
      )}

      {showScanner && (
        <div className="fixed inset-0 z-[1000] bg-black/90 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] w-full max-w-lg rounded-[2rem] p-6 shadow-2xl border border-white/10 relative">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black text-white">📸 ماسح الواجب</h3>
                    <button onClick={() => setShowScanner(false)} className="text-slate-400">✕</button>
                </div>
                {!scannerImage ? (
                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-slate-600 rounded-2xl h-64 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500">
                        <span className="text-4xl mb-4">📤</span>
                        <p className="font-bold text-slate-300">التقاط أو رفع صورة</p>
                        <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleFileSelect} />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-700 bg-black h-64 flex items-center justify-center">
                            <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setScannerImage(null)} className="flex-1 py-3 bg-slate-700 text-white rounded-xl font-bold text-sm">إلغاء</button>
                            <button onClick={submitScannedHomework} className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm">تسليم ✓</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {showBoard && solvingAsg && (
        <div className="fixed inset-0 z-[1500] bg-indigo-950 p-2 md:p-6 flex flex-col animate-fadeIn">
           <div className="flex justify-between items-center mb-4 px-8 text-white">
              <h3 className="font-black text-xl">حل الواجب: {solvingAsg.title}</h3>
              <button onClick={() => setShowBoard(false)} className="w-10 h-10 bg-white/10 hover:bg-rose-600 rounded-xl flex items-center justify-center text-lg">✕</button>
           </div>
           <div className="flex-1 bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10">
              <InteractiveBoard 
                imageUrl={solvingAsg.fileUrl} 
                onSave={submitBoardHomework} 
                onCancel={() => setShowBoard(false)} 
                title={solvingAsg.title} 
                initialBackground="grid"
                notation={settings.mathNotation}
              />
           </div>
        </div>
      )}

      {showLuckyWheel && <LuckyWheel onWin={(p) => { if(onSpinWin) onSpinWin(p); setShowLuckyWheel(false); }} onClose={() => setShowLuckyWheel(false)} />}
      
      {selectedVideo && <div className="fixed inset-0 z-[1200] bg-black/95 backdrop-blur-xl flex flex-col p-4 animate-fadeIn"><div className="flex justify-between items-center mb-6 text-white max-w-5xl mx-auto w-full"><div><h3 className="font-bold text-lg md:text-xl text-slate-100">{selectedVideo.title}</h3></div><button onClick={() => setSelectedVideo(null)} className="w-10 h-10 bg-white/10 hover:bg-rose-600 rounded-full flex items-center justify-center text-xl transition-all border border-white/10">✕</button></div><div className="flex-1 flex items-center justify-center w-full"><div className="w-full max-w-5xl"><ProtectedVideo src={selectedVideo.youtubeUrl} title={selectedVideo.title} watermarkText={student.name + ' | ' + student.studentCode} enabled={settings.protectionEnabled} provider={selectedVideo.provider} onProgress={(p) => { if (onVideoProgress && selectedVideo) { onVideoProgress(selectedVideo.id, p); } }} /></div></div></div>}

    </div>
  );
};

export default StudentPortal;
