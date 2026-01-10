
import React, { useState, useEffect } from 'react';
import { 
  AppView, PlatformSettings, Student, AppNotification, 
  Year, QuizResult, AssignmentSubmission, Group, Assignment, MathFormula, Quiz, VideoLesson, ChatMessage, EducationalSource, ParentInquiry, CallLog, Assistant, ScheduleEntry,
  PlatformReward, RewardRedemption
} from './types';

// الاستيرادات بدون امتدادات (المعيار الصحيح لـ Vite)
import Dashboard from './views/Dashboard';
import Sidebar from './components/Sidebar';
import StudentList from './components/StudentList';
import StudentPortal from './views/StudentPortal';
import ParentPortal from './views/ParentPortal';
import QuizResults from './views/QuizResults';
import AssignmentsView from './views/Assignments';
import LandingPage from './views/LandingPage';
import Registration from './views/Registration';
import Management from './views/Management';
import AISolver from './views/AISolver';
import FilesView from './views/Files';
import LiveClass from './views/LiveClass';
import ChatRoom from './views/ChatRoom';
import Notifications from './views/Notifications';
import Leaderboard from './views/Leaderboard';
import TestCenter from './views/TestCenter';
import Settings from './views/Settings';
import CallCenter from './views/CallCenter';
import Schedules from './views/Schedules';
import Formulas from './views/Formulas';
import Rewards from './views/Rewards';
import BottomNav from './components/BottomNav';
import QuizGenerator from './views/QuizGenerator';
import { ToastContainer } from './components/Toast';

const initialSettings: PlatformSettings = {
  teacherName: 'أشرف جميل',
  platformName: 'منصة المحترف',
  studentWelcomeMsg: 'أهلاً بك يا عبقري الرياضيات! استعد للتفوق. 🎓',
  parentWelcomeMsg: 'نسعد بمتابعتكم لرحلة نجاح أبنائكم. 🤝',
  protectionEnabled: true,
  watermarkEnabled: true,
  watermarkText: 'Al-Mohtaref Math',
  portalTheme: 'indigo',
  portalLayout: 'default',
  liveSessionActive: false,
  liveSessionLink: '',
  liveSessionTitle: '',
  allowSelfRegistration: true,
  mathNotation: 'arabic',
  autoAttendanceEnabled: true,
  autoParentReportEnabled: true,
  enableChat: true,
  enableLeaderboard: true,
  enableAiSolver: true,
  examMode: false,
  maxDevicesPerStudent: 2,
  viewLabels: {
    [AppView.DASHBOARD]: 'الرئيسية',
    [AppView.STUDENTS]: 'الطلاب',
    [AppView.ASSIGNMENTS]: 'الواجبات',
    [AppView.QUIZZES]: 'الاختبارات',
    [AppView.CHAT]: 'الشات',
    [AppView.AI_SOLVER]: 'المحلل الذكي',
    [AppView.FILES]: 'المكتبة',
    [AppView.LIVE_CLASS]: 'البث المباشر',
    [AppView.MANAGEMENT]: 'المجموعات',
    [AppView.RESULTS]: 'النتائج',
    [AppView.REWARDS]: 'المكافآت'
  },
  enabledViews: Object.values(AppView).filter(v => v !== AppView.REGISTRATION),
  customSections: []
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView | string>(AppView.DASHBOARD);
  const [settings, setSettings] = useState<PlatformSettings>(initialSettings);
  const [years, setYears] = useState<Year[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [educationalSources, setEducationalSources] = useState<EducationalSource[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inquiries, setInquiries] = useState<ParentInquiry[]>([]);
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [formulas, setFormulas] = useState<MathFormula[]>([]);
  const [rewards, setRewards] = useState<PlatformReward[]>([]);
  const [redemptions, setRedemptions] = useState<RewardRedemption[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);
  const [loggedUser, setLoggedUser] = useState<any>(null);

  useEffect(() => {
    const keys = ['years', 'groups', 'students', 'assistants', 'results', 'assignments', 'submissions', 'notifications', 'settings', 'quizzes', 'videoLessons', 'chatMessages', 'educationalSources', 'inquiries', 'callLogs', 'schedules', 'formulas', 'rewards', 'redemptions'];
    keys.forEach((key) => {
      const saved = localStorage.getItem(`math_${key}`);
      if (saved) {
         const data = JSON.parse(saved);
         if (key === 'settings') setSettings({...initialSettings, ...data});
         else if (key === 'years') setYears(data);
         else if (key === 'groups') setGroups(data);
         else if (key === 'students') setStudents(data);
         else if (key === 'assistants') setAssistants(data);
         else if (key === 'results') setResults(data);
         else if (key === 'assignments') setAssignments(data);
         else if (key === 'submissions') setSubmissions(data);
         else if (key === 'notifications') setNotifications(data);
         else if (key === 'quizzes') setQuizzes(data);
         else if (key === 'videoLessons') setVideoLessons(data);
         else if (key === 'chatMessages') setChatMessages(data);
         else if (key === 'educationalSources') setEducationalSources(data);
         else if (key === 'inquiries') setInquiries(data);
         else if (key === 'callLogs') setCallLogs(data);
         else if (key === 'schedules') setSchedules(data);
         else if (key === 'formulas') setFormulas(data);
         else if (key === 'rewards') setRewards(data);
         else if (key === 'redemptions') setRedemptions(data);
      }
    });
  }, []);

  useEffect(() => {
    const data = { years, groups, students, assistants, results, assignments, submissions, notifications, settings, quizzes, videoLessons, chatMessages, educationalSources, inquiries, callLogs, schedules, formulas, rewards, redemptions };
    Object.entries(data).forEach(([key, val]) => {
      localStorage.setItem(`math_${key}`, JSON.stringify(val));
    });
  }, [years, groups, students, assistants, results, assignments, submissions, notifications, settings, quizzes, videoLessons, chatMessages, educationalSources, inquiries, callLogs, schedules, formulas, rewards, redemptions]);

  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const handleAttendanceChange = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const newAttendance = !s.attendance;
        const pointsToAdd = newAttendance ? 5 : 0;
        return { ...s, attendance: newAttendance, points: (s.points || 0) + pointsToAdd };
      }
      return s;
    }));
  };

  const handleStudentLogin = (code: string) => {
    const s = students.find(st => st.studentCode === code);
    if (!s) { addToast('الكود غير صحيح ❌', 'error'); return; }
    setLoggedUser({ ...s, role: 'student' });
  };

  const renderTeacherView = () => {
    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard teacherName={settings.teacherName} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={(v) => setCurrentView(v)} />;
      case AppView.STUDENTS: return <StudentList students={students} groups={groups} years={years} notifications={notifications} onAttendanceChange={handleAttendanceChange} onSendAlert={() => {}} onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))} onResetDevice={(id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, deviceIds: [] } : s))} onAddStudent={(s) => setStudents(prev => [...prev, s])} teacherName={settings.teacherName} />;
      case AppView.QUIZZES: return <QuizGenerator years={years} sources={educationalSources} notation={settings.mathNotation} onPublish={(title, yId, qs) => { setQuizzes(prev => [...prev, {id: 'q'+Date.now(), title, yearId: yId, date: 'اليوم', type: 'native', questions: qs || []}]); }} />;
      case AppView.MANAGEMENT: return <Management years={years} groups={groups} students={students} onAddYear={(n) => setYears(prev => [...prev, { id: 'y'+Date.now(), name: n }])} onAddGroup={(n, y, t, ty, g, c, p) => setGroups(prev => [...prev, { id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: (p || 'GRP') + Math.random().toString(36).substr(2,3).toUpperCase() }])} onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))} teacherName={settings.teacherName} platformName={settings.platformName} />;
      case AppView.SETTINGS: return <Settings settings={settings} assistants={assistants} onUpdate={setSettings} onUpdateAssistants={setAssistants} />;
      default: return <Dashboard teacherName={settings.teacherName} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={(v) => setCurrentView(v)} />;
    }
  };

  if (loggedUser?.role === 'student') {
    return <StudentPortal student={loggedUser} assignments={assignments} submissions={submissions} quizzes={quizzes} results={results} settings={settings} videoLessons={videoLessons} notifications={notifications} groups={groups} educationalSources={educationalSources} schedules={schedules} formulas={formulas} rewards={rewards} redemptions={redemptions} onQuizSubmit={(r) => setResults(prev => [...prev, r])} onAssignmentSubmit={(s) => setSubmissions(prev => [...prev, { ...s, id: 'sub' + Date.now(), status: 'pending' }])} onLogin={handleStudentLogin} onSendMessage={() => {}} onMarkNotificationRead={() => {}} onRedeemReward={() => {}} messages={chatMessages} years={years} students={students} onBack={() => setLoggedUser(null)} />;
  }

  if (!loggedUser) {
    return <LandingPage teacherName={settings.teacherName} platformName={settings.platformName} onStudentEntry={() => setLoggedUser({id:'guest', role:'student'})} onTeacherEntry={() => setLoggedUser({id:'teacher', role:'teacher'})} onParentEntry={() => {}} onAssistantEntry={() => {}} onStudentRegister={() => setCurrentView(AppView.REGISTRATION)} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden font-['Cairo']" dir="rtl">
      <Sidebar currentView={currentView} setView={(v) => setCurrentView(v)} settings={settings} loggedUser={loggedUser} onUpdateSettings={setSettings} addToast={addToast} />
      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-4 lg:p-12 max-w-7xl mx-auto">{renderTeacherView()}</div>
      </main>
      <BottomNav currentView={currentView} setView={(v) => setCurrentView(v)} settings={settings} />
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default App;
