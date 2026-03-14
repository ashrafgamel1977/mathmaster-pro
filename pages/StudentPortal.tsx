/**
 * StudentPortal.tsx — ORCHESTRATOR (refactored)
 * كان 980 سطر، أصبح ~250 سطر
 * كل tab في ملف مستقل في views/student-portal/
 */
import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz,
  AssignmentSubmission, AppNotification, Group, EducationalSource,
  MathFormula, PlatformReward, RewardRedemption, AppView, QuestionAttempt,
  Course, Year, ChatMessage
} from '../types';
import { Home, BookOpen, FileText, Zap, BarChart2, LogOut, Folder, Moon, Sun, Trophy } from 'lucide-react';
import { usePortalTheme } from '../hooks/usePortalTheme';
import { calculateStreak, evaluateBadgesAfterQuiz, evaluateStreakBadges } from '../services/badgeService';

// Tabs
import DashboardTab from './student-portal-tabs/DashboardTab';
import LibraryTab from './student-portal-tabs/LibraryTab';
import AssignmentsTab from './student-portal-tabs/AssignmentsTab';
import QuizzesTab from './student-portal-tabs/QuizzesTab';
import ResultsTab from './student-portal-tabs/ResultsTab';
import CoursesTab from './student-portal-tabs/CoursesTab';
import LeaderboardTab from './student-portal-tabs/LeaderboardTab';

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
  schedules: any[];
  formulas: MathFormula[];
  rewards: PlatformReward[];
  redemptions: RewardRedemption[];
  courses: Course[];
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
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
  onBack: () => void;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  onQuizSubmit, onAssignmentSubmit, onBack, educationalSources, onVideoProgress,
  onUpdateStudent, years, addToast, courses, students,

}) => {
  // ─── Tab State ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [libraryFilter, setLibraryFilter] = useState<'video' | 'doc'>('video');
  const [libraryTerm, setLibraryTerm] = useState<'all' | '1' | '2'>('all');
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<any | null>(null);

  // ─── Scanner State ───────────────────────────────────────────────────────
  const [showScanner, setShowScanner] = useState(false);
  const [scannerImage, setScannerImage] = useState<string | null>(null);
  const [scannedAsgId, setScannedAsgId] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Quiz + Anti-Cheat State ──────────────────────────────────────────────
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeQuizAnswers, setActiveQuizAnswers] = useState<Record<string, string>>({});
  const [cheatWarnings, setCheatWarnings] = useState(0);
  const [showCheatAlert, setShowCheatAlert] = useState(false);

  // ─── Drag & Drop Tabs ────────────────────────────────────────────────────
  const [orderedTabs, setOrderedTabs] = useState<any[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const isTeacherPreview = student?.id === 'teacher-view';

  // ─── Dark / Light Mode ─────────────────────────────────────────────────────
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('portal-dark-mode');
    return saved !== null ? saved === 'true' : (settings.darkMode ?? true);
  });
  const toggleDark = () => setIsDark(prev => { localStorage.setItem('portal-dark-mode', String(!prev)); return !prev; });

  const { getThemeClasses, getSidebarThemeClasses, getCardThemeClasses, getButtonTextThemeClasses } = usePortalTheme(settings.portalTheme, isDark);

  // ─── Filtered Data ────────────────────────────────────────────────────────
  const filterBySubject = (items: any[]) => {
    if (selectedSubject === 'all') return items;
    return items.filter(item => {
      const itemSubject = (item.subject || '').toLowerCase();
      return itemSubject === selectedSubject.toLowerCase();
    });
  };

  const filteredAssignments = filterBySubject(assignments).filter(a =>
    isTeacherPreview || a.yearId === student?.yearId
  );
  const pendingAssignments = isTeacherPreview
    ? filteredAssignments.filter(a => a.status === 'active')
    : filteredAssignments.filter(a => a.status === 'active' && !submissions.find(s => s.assignmentId === a.id));

  const filteredQuizzes = filterBySubject(quizzes).filter(q =>
    isTeacherPreview || q.yearId === student?.yearId
  );
  const filteredVideos = filterBySubject(videoLessons).filter(v =>
    (!libraryTerm || libraryTerm === 'all' || v.term === libraryTerm) &&
    (isTeacherPreview || v.yearId === student?.yearId || v.yearId === 'all')
  );
  const filteredDocs = filterBySubject(educationalSources).filter(s =>
    (!libraryTerm || libraryTerm === 'all' || s.term === libraryTerm) &&
    (isTeacherPreview || s.yearId === student?.yearId || s.yearId === 'all')
  );

  // ─── Subjects ─────────────────────────────────────────────────────────────
  const SUBJECTS = useMemo(() => {
    const branches = settings.branches?.length ? settings.branches : ['عام'];
    const colors = ['from-blue-500 to-indigo-600', 'from-emerald-500 to-teal-600', 'from-rose-500 to-orange-600', 'from-violet-500 to-purple-600'];
    return branches.map((b, i) => ({ id: b, name: b, icon: '📚', color: colors[i % colors.length] }));
  }, [settings.branches]);

  // ─── Tabs Config ──────────────────────────────────────────────────────────
  const DEFAULT_TABS = useMemo(() => [
    { id: 'dashboard', label: 'الرئيسية', icon: <Home size={20} /> },
    { id: 'courses', label: 'الكورسات', icon: <Folder size={20} /> },
    { id: 'library', label: 'دروسي', icon: <BookOpen size={20} /> },
    { id: 'assignments', label: 'الواجبات', icon: <FileText size={20} /> },
    { id: 'quizzes', label: 'الاختبارات', icon: <Zap size={20} /> },
    { id: 'results', label: 'نتائجي', icon: <BarChart2 size={20} /> },
    { id: 'leaderboard', label: 'لوحة الشرف', icon: <Trophy size={20} /> },
  ], []);

  useEffect(() => {
    const tabs = DEFAULT_TABS.filter(t => {
      const conf = settings.featureConfig?.[AppView.STUDENT_PORTAL]?.find(c => c.id === t.id);
      return !conf || conf.enabled !== false;
    });
    setOrderedTabs(prev => {
      if (!prev.length) return tabs;
      const ids = new Set(tabs.map(t => t.id));
      return [...prev.filter(t => ids.has(t.id)), ...tabs.filter(t => !prev.find(p => p.id === t.id))];
    });
  }, [settings, DEFAULT_TABS]);

  // ─── Drag Handlers ────────────────────────────────────────────────────────
  const handleDragStart = (i: number) => setDraggedItemIndex(i);
  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (dropIdx: number) => {
    if (draggedItemIndex === null) return;
    const tabs = [...orderedTabs];
    const [item] = tabs.splice(draggedItemIndex, 1);
    tabs.splice(dropIdx, 0, item);
    setOrderedTabs(tabs);
    setDraggedItemIndex(null);
  };

  // ─── Anti-Cheat ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!activeQuiz || !settings.integrityMode) return;
    const warn = () => {
      setCheatWarnings(prev => {
        const n = prev + 1;
        if (n >= 3) { submitQuiz(true); addToast('تم إغلاق الامتحان بسبب الخروج المتكرر!', 'error'); }
        else setShowCheatAlert(true);
        return n;
      });
    };
    document.addEventListener('visibilitychange', () => { if (document.hidden) warn(); });
    window.addEventListener('blur', warn);
    return () => {
      document.removeEventListener('visibilitychange', warn);
      window.removeEventListener('blur', warn);
    };
  }, [activeQuiz, settings.integrityMode]);

  // ─── Quiz Logic ───────────────────────────────────────────────────────────
  const handleStartQuiz = (quiz: Quiz) => {
    if (quiz.type === 'link' && quiz.externalLink) { window.open(quiz.externalLink, '_blank'); return; }
    if (quiz.type === 'file' && quiz.fileUrl) { window.open(quiz.fileUrl, '_blank'); return; }
    if (!quiz.questions?.length) { addToast('هذا الاختبار لا يحتوي على أسئلة.', 'error'); return; }
    setActiveQuiz(quiz); setActiveQuizAnswers({}); setCheatWarnings(0);
    if (settings.integrityMode) document.documentElement.requestFullscreen().catch(() => { });
  };

  const submitQuiz = (isForced = false, timeUsed?: number) => {
    if (!activeQuiz) return;
    let score = 0, total = 0;
    const attempts: QuestionAttempt[] = [];
    activeQuiz.questions?.forEach(q => {
      total += q.points;
      const userAns = activeQuizAnswers[q.id];
      const correct = userAns === q.options?.[q.correctAnswer as number];
      if (correct) score += q.points;
      attempts.push({ questionId: q.id, questionText: q.question, userAnswer: userAns || 'لم يجب', correctAnswer: q.options?.[q.correctAnswer as number] || '', isCorrect: correct });
    });
    const pct = total > 0 ? Math.round((score / total) * 100) : 0;
    const newResult: QuizResult = { id: 'res' + Date.now(), studentId: student!.id, quizId: activeQuiz.id, quizTitle: activeQuiz.title, score: isForced ? 0 : pct, status: 'graded', date: new Date().toLocaleDateString('ar-EG'), cheatWarnings, isCheatSuspected: isForced || cheatWarnings > 2, attempts };
    onQuizSubmit(newResult);

    // ─── Badge Awarding ───────────────────────────────────────────────────
    if (!isForced && onUpdateStudent && student) {
      const newPoints = (student.points || 0) + (pct > 80 ? 20 : 5);
      const durationSec = (activeQuiz.duration || 0) * 60;
      const newBadges = evaluateBadgesAfterQuiz(student, results, newResult, durationSec, timeUsed);
      const updatedBadges = [...(student.badges || []), ...newBadges];
      onUpdateStudent({ points: newPoints, badges: updatedBadges });
      if (newBadges.length > 0) {
        setTimeout(() => newBadges.forEach(b => addToast(`🏅 وسام جديد: ${b.name}!`, 'success')), 1500);
      }
    }

    setActiveQuiz(null);
    if (document.fullscreenElement) document.exitFullscreen();
    if (!isForced) addToast(`تم إنهاء الاختبار. نتيجتك: ${pct}%`, 'success');
  };

  // ─── Misc ─────────────────────────────────────────────────────────────────
  const isTargetForLive = useMemo(() => {
    if (!settings.liveSessionActive) return false;
    if (isTeacherPreview || !settings.liveSessionTargetYear || settings.liveSessionTargetYear === 'all') return true;
    return settings.liveSessionTargetYear === student?.yearId;
  }, [settings, student, isTeacherPreview]);

  const level = Math.floor((student?.points || 0) / 1000) + 1;
  const progressToNextLevel = Math.min((((student?.points || 0) % 1000) / 1000) * 100, 100);
  const streaks = student?.streaks || 0;

  // ─── Streak on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!student || isTeacherPreview) return;
    const newStreak = calculateStreak(student);
    if (newStreak !== student.streaks && onUpdateStudent) {
      const streakBadges = evaluateStreakBadges(student, newStreak);
      const updatedBadges = [...(student.badges || []), ...streakBadges];
      onUpdateStudent({ streaks: newStreak, badges: updatedBadges });
      if (streakBadges.length > 0) {
        streakBadges.forEach(b => addToast(`🏅 وسام جديد: ${b.name}`, 'success'));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student?.id]);

  if (!student) return null;

  // Lock Screen
  if (settings.subscriptionEnabled && !student.isPaid && !isTeacherPreview) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-['Cairo']" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-[3rem] p-10 text-center shadow-2xl">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center text-5xl mb-6 mx-auto">🔒</div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">عفواً، المحتوى مغلق</h2>
          <p className="text-slate-500 font-bold text-sm mb-8">يتطلب الوصول إلى المنصة اشتراكاً مفعلاً.</p>
          <div className="bg-amber-50 p-6 rounded-3xl border border-amber-100 mb-8 text-right">
            <p className="text-sm font-bold text-slate-700 leading-relaxed">{settings.paymentInstructions || 'تواصل مع إدارة المنصة لتفعيل حسابك.'}</p>
          </div>
          <button onClick={() => { const msg = `مرحباً ${settings.teacherName}، الطالب ${student.name} يرغب في تفعيل حسابه.`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank'); }} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black mb-3">إرسال إيصال الدفع 📤</button>
          <button onClick={onBack} className="text-slate-400 font-bold text-xs hover:text-slate-600">تسجيل الخروج</button>
        </div>
      </div>
    );
  }

  // ─── Sidebar Item ─────────────────────────────────────────────────────────
  const SidebarItem = ({ id, label, icon, active, index }: { id: string; label: string; icon: React.ReactNode; active: boolean; index: number }) => (
    <button
      onClick={() => setActiveTab(id)}
      draggable
      onDragStart={() => handleDragStart(index)}
      onDragOver={handleDragOver}
      onDrop={() => handleDrop(index)}
      style={{ cursor: 'grab' }}
      className={`w-full flex items-center gap-4 px-6 py-4 transition-all duration-300 border-r-4 rounded-l-2xl my-1 select-none ${active ? 'bg-gradient-to-r from-white/10 to-transparent border-white text-white' : `border-transparent text-slate-400 hover:bg-white/5 hover:text-slate-200`} ${draggedItemIndex === index ? 'opacity-50 scale-95' : ''}`}
    >
      <span className={active ? 'scale-110' : ''}>{icon}</span>
      <span className={`text-sm ${active ? 'font-black' : 'font-medium'}`}>{label}</span>
    </button>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen flex flex-col lg:flex-row font-['Cairo'] text-right overflow-hidden ${getThemeClasses()}`} dir="rtl">

      {/* Sidebar */}
      <aside className={`hidden lg:flex w-72 border-l border-white/5 h-screen sticky top-0 flex-col z-20 shadow-[4px_0_40px_rgba(0,0,0,0.5)] ${getSidebarThemeClasses()}`}>
        <div className="p-8 border-b border-white/5 mb-4 bg-gradient-to-b from-white/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-xl flex items-center justify-center text-xl font-black shadow-[0_0_15px_rgba(245,158,11,0.3)]">∑</div>
            <div>
              <h1 className="font-black text-white text-lg leading-none">{settings.platformName}</h1>
              <span className="text-[10px] font-bold text-slate-500">Student Portal</span>
            </div>
          </div>
        </div>
        <nav className="flex-1 py-4 space-y-2 px-4">
          {orderedTabs.map((tab: any, idx: number) => (
            <React.Fragment key={String(tab.id)}>
              <SidebarItem id={String(tab.id)} label={String(tab.label)} icon={tab.icon} active={activeTab === tab.id} index={idx} />
            </React.Fragment>
          ))}
        </nav>
        <div className={`p-6 border-t border-white/5 space-y-3`}>
          {/* Dark/Light Toggle */}
          <button
            onClick={toggleDark}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'
              }`}
          >
            <div className="flex items-center gap-3">
              {isDark
                ? <Moon size={16} className="text-indigo-400" />
                : <Sun size={16} className="text-amber-500" />}
              <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {isDark ? 'الوضع الليلي' : 'الوضع النهاري'}
              </span>
            </div>
            <div className={`w-10 h-5 rounded-full transition-all relative ${isDark ? 'bg-indigo-600' : 'bg-amber-400'
              }`}>
              <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${isDark ? 'left-0.5' : 'left-5'
                }`} />
            </div>
          </button>
          <button onClick={onBack} className="w-full py-3 bg-white/5 border border-white/10 text-rose-400 rounded-2xl text-xs font-black hover:bg-rose-500/10 flex items-center justify-center gap-2">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b border-white/5 ${getSidebarThemeClasses()}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-600 text-white rounded-lg flex items-center justify-center font-black">∑</div>
            <h1 className="font-black text-white text-sm">{settings.platformName}</h1>
          </div>
          <button onClick={onBack} className="w-8 h-8 bg-white/5 text-rose-400 rounded-lg flex items-center justify-center"><LogOut size={16} /></button>
        </div>

        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 no-scrollbar scroll-smooth">
          <div className="max-w-6xl mx-auto w-full">
            {activeTab === 'dashboard' && (
              <DashboardTab
                student={student} level={level} progressToNextLevel={progressToNextLevel} streaks={streaks}
                pendingAssignments={pendingAssignments} subjects={SUBJECTS}
                selectedSubject={selectedSubject} setSelectedSubject={setSelectedSubject}
                setActiveTab={setActiveTab} setScannedAsgId={setScannedAsgId} setShowScanner={setShowScanner}
                isTargetForLive={isTargetForLive} setShowLiveStream={() => { }} settings={settings}
                results={results} isDark={isDark}
              />
            )}
            {activeTab === 'courses' && (
              <CoursesTab
                courses={courses} videoLessons={videoLessons} educationalSources={educationalSources}
                studentYearId={student.yearId} selectedCourse={selectedCourse} setSelectedCourse={setSelectedCourse}
                onVideoProgress={onVideoProgress} settings={settings} 
                studentPoints={student?.points} isDark={isDark}
              />
            )}
            {activeTab === 'library' && (
              <LibraryTab
                filteredVideos={filteredVideos} filteredDocs={filteredDocs}
                libraryFilter={libraryFilter} setLibraryFilter={setLibraryFilter}
                libraryTerm={libraryTerm} setLibraryTerm={setLibraryTerm}
                selectedVideo={selectedVideo} setSelectedVideo={setSelectedVideo}
                onVideoProgress={onVideoProgress} settings={settings} 
                studentPoints={student?.points} isDark={isDark}
              />
            )}
            {activeTab === 'assignments' && (
              <AssignmentsTab
                filteredAssignments={filteredAssignments} submissions={submissions}
                onAssignmentSubmit={onAssignmentSubmit}
                student={{ id: student.id, name: student.name }}
                setScannedAsgId={setScannedAsgId} setShowScanner={setShowScanner}
                addToast={addToast} settings={settings} isDark={isDark}
              />
            )}
            {activeTab === 'quizzes' && (
              <QuizzesTab
                filteredQuizzes={filteredQuizzes} results={results} studentId={student.id}
                activeQuiz={activeQuiz} activeQuizAnswers={activeQuizAnswers}
                cheatWarnings={cheatWarnings} showCheatAlert={showCheatAlert}
                setShowCheatAlert={setShowCheatAlert}
                setActiveQuizAnswers={setActiveQuizAnswers}
                onStartQuiz={handleStartQuiz} onSubmitQuiz={submitQuiz} settings={settings} isDark={isDark}
              />
            )}
            {activeTab === 'results' && (
              <ResultsTab results={results} studentId={student.id} settings={settings} isDark={isDark} />
            )}
            {activeTab === 'leaderboard' && (
              <LeaderboardTab student={student} students={students || []} settings={settings} isDark={isDark} />
            )}
          </div>
        </main>
      </div>

      {/* Assignment upload now handled inside AssignmentsTab component */}
    </div>
  );
};

export default StudentPortal;
