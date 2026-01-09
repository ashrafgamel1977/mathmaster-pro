
import React, { useState, useEffect } from 'react';
import { 
  AppView, PlatformSettings, Student, AppNotification, 
  Year, QuizResult, AssignmentSubmission, Group, Assignment, MathFormula, Quiz, VideoLesson, ChatMessage, EducationalSource, ParentInquiry, CallLog, Assistant, ScheduleEntry,
  PlatformReward, RewardRedemption
} from './types';

// الواجهات
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
import MathRenderer from './components/MathRenderer';
import { ToastContainer } from './components/Toast';

const initialSettings: PlatformSettings = {
  teacherName: 'أشرف جميل',
  platformName: 'منصة المحترف',
  studentWelcomeMsg: 'أهلاً بك يا عبقري الرياضيات في رحلتك نحو التميز! استعد لخوض غمار التحدي وتحقيق الدرجات النهائية. 🎓',
  parentWelcomeMsg: 'نسعد بمشاركتكم رحلة نجاح أبنائكم. نحن هنا لنضمن لهم أفضل تجربة تعليمية وأعلى مستوى من المتابعة. 🤝',
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
    [AppView.LEADERBOARD]: 'لوحة الشرف',
    [AppView.CALL_CENTER]: 'خدمة العملاء',
    [AppView.REWARDS]: 'المكافآت',
    [AppView.TEST_CENTER]: 'مختبر الفحص'
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
  
  // PWA & Notification State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBanner(true);
    });

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

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setShowInstallBanner(false);
      }
    }
  };

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

  // نظام الحضور المحسن مع النقاط التلقائية
  const handleAttendanceChange = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        const newAttendance = !s.attendance;
        const pointsToAdd = newAttendance ? 5 : 0; // منح 5 نقاط عند الحضور
        if (newAttendance) addToast(`تم تسجيل حضور ${s.name.split(' ')[0]} (＋5 نقاط) 🎁`, 'success');
        return { ...s, attendance: newAttendance, points: s.points + pointsToAdd };
      }
      return s;
    }));
  };

  const handleSpinWin = (points: number) => {
    if (!loggedUser) return;
    const now = new Date().toISOString();
    setStudents(prev => prev.map(s => s.id === loggedUser.id ? { ...s, points: s.points + points, lastSpinDate: now } : s));
    setLoggedUser(prev => ({ ...prev, points: prev.points + points, lastSpinDate: now }));
    if (points > 0) {
      addToast(`مبروك! تمت إضافة ${points} نقطة لرصيدك 🎡✨`, 'success');
    }
  };

  const handleSendNotification = (n: Omit<AppNotification, 'id' | 'timestamp' | 'isRead'>, triggerPush = false) => {
    const id = 'n' + Date.now();
    setNotifications(prev => [{...n, id, timestamp: 'الآن', isRead: false}, ...prev]);
    if (triggerPush && "serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        registration.showNotification(n.title, {
          body: n.message.replace(/\$|\$/g, ''),
          icon: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
          vibrate: [200, 100, 200],
          badge: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png'
        } as any);
      });
    }
  };

  const handleStudentLogin = (code: string) => {
    const s = students.find(st => st.studentCode === code);
    if (!s) { addToast('الكود غير صحيح ❌', 'error'); return; }
    let deviceId = localStorage.getItem('math_device_id');
    if (!deviceId) {
      deviceId = 'dev_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('math_device_id', deviceId);
    }
    const currentDevices = s.deviceIds || [];
    if (currentDevices.includes(deviceId)) {
      setLoggedUser({ ...s, role: 'student' });
      addToast(`أهلاً بك يا ${s.name.split(' ')[0]} 🚀`, 'success');
    } else if (currentDevices.length < settings.maxDevicesPerStudent) {
      const updatedDevices = [...currentDevices, deviceId];
      setStudents(prev => prev.map(st => st.id === s.id ? { ...st, deviceIds: updatedDevices } : st));
      setLoggedUser({ ...s, role: 'student', deviceIds: updatedDevices });
      addToast('تم ربط الجهاز الجديد بنجاح ✅', 'success');
    } else {
      addToast(`تجاوزت حد الأجهزة المسموح (${settings.maxDevicesPerStudent})`, 'error');
    }
  };

  const handleRedeemReward = (rewardId: string) => {
    const reward = rewards.find(r => r.id === rewardId);
    if (!reward || !loggedUser) return;
    if (loggedUser.points < reward.cost) {
      addToast('نقاطك لا تكفي لاستبدال هذه الجائزة 😔', 'error');
      return;
    }
    // خصم النقاط من الطالب
    setStudents(prev => prev.map(s => s.id === loggedUser.id ? { ...s, points: s.points - reward.cost } : s));
    setLoggedUser(prev => ({ ...prev, points: prev.points - reward.cost }));
    // إضافة طلب الاستبدال
    const redemption: RewardRedemption = {
      id: 'rd' + Date.now(),
      studentId: loggedUser.id,
      studentName: loggedUser.name,
      rewardId: reward.id,
      rewardTitle: reward.title,
      status: 'pending',
      timestamp: 'الآن'
    };
    setRedemptions(prev => [redemption, ...prev]);
    addToast('تم إرسال طلبك للمعلم! استلم جائزتك في الحصة القادمة 🎁', 'success');
  };

  const renderTeacherView = () => {
    if (loggedUser?.role === 'assistant') {
      const hasPermission = (loggedUser as Assistant).permissions.includes(currentView as AppView);
      if (!hasPermission && currentView !== AppView.DASHBOARD && typeof currentView !== 'string') {
        return <div className="p-20 text-center font-black text-slate-800">لا تملك صلاحية الوصول لهذه الصفحة 🔒</div>;
      }
    }

    switch (currentView) {
      case AppView.DASHBOARD: return <Dashboard teacherName={settings.teacherName} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={setCurrentView} />;
      case AppView.STUDENTS: return <StudentList students={students} groups={groups} years={years} notifications={notifications} onAttendanceChange={handleAttendanceChange} onSendAlert={() => {}} onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))} onResetDevice={(id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, deviceIds: [] } : s))} onAddStudent={(s) => setStudents(prev => [...prev, s])} onUpdateStudent={(id, updates) => setStudents(prev => prev.map(s => s.id === id ? {...s, ...updates} : s))} teacherName={settings.teacherName} />;
      case AppView.SCHEDULE: return <Schedules groups={groups} schedules={schedules} onAdd={(e) => setSchedules(prev => [...prev, { ...e, id: 'sch'+Date.now() }])} onDelete={(id) => setSchedules(prev => prev.filter(s => s.id !== id))} />;
      case AppView.FORMULAS: return <Formulas years={years} formulas={formulas} onAdd={(f) => setFormulas(prev => [...prev, { ...f, id: 'f'+Date.now() }])} onDelete={(id) => setFormulas(prev => prev.filter(f => f.id !== id))} />;
      case AppView.MANAGEMENT: return <Management years={years} groups={groups} students={students} onAddYear={(n) => setYears(prev => [...prev, { id: 'y'+Date.now(), name: n }])} onAddGroup={(n, y, t, ty, g, c, p) => setGroups(prev => [...prev, { id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: (p || 'GRP') + Math.random().toString(36).substr(2,3).toUpperCase() }])} onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))} teacherName={settings.teacherName} platformName={settings.platformName} onBatchGenerateCodes={(gid) => { setStudents(prev => prev.map(s => s.groupId === gid && s.studentCode === 'PENDING' ? {...s, studentCode: (groups.find(g=>g.id===gid)?.codePrefix || 'M') + Math.floor(1000 + Math.random() * 9000), status: 'active'} : s)); addToast(`تم تفعيل الطلاب بنجاح! 🔑`, 'success'); }} />;
      case AppView.RESULTS: return <QuizResults results={results} students={students} notifications={notifications} onIssueCertificate={() => {}} notation={settings.mathNotation} onUpdateResult={(id, score, feedback) => {
        setResults(prev => prev.map(r => {
          if (r.id === id) {
            // نقاط تلقائية عند تصحيح المعلم لدرجة مرتفعة
            if (score >= 100) {
               setStudents(stPrev => stPrev.map(s => s.id === r.studentId ? { ...s, points: s.points + 20 } : s));
               addToast('تم رصد الدرجة ومنح الطالب 20 نقطة للدرجة النهائية! 🌟', 'success');
            } else if (score >= 90) {
               setStudents(stPrev => stPrev.map(s => s.id === r.studentId ? { ...s, points: s.points + 10 } : s));
               addToast('تم رصد الدرجة ومنح الطالب 10 نقاط للتميز! ✨', 'success');
            }
            return { ...r, score, feedback, status: 'graded' };
          }
          return r;
        }));
      }} />;
      case AppView.REWARDS: return <Rewards rewards={rewards} redemptions={redemptions} role="teacher" onAddReward={(r) => setRewards(prev => [...prev, {...r, id:'rw'+Date.now()}])} onDeleteReward={(id) => setRewards(prev => prev.filter(r => r.id !== id))} onRedeem={()=>{}} onMarkDelivered={(id) => setRedemptions(prev => prev.map(r => r.id === id ? {...r, status: 'delivered'} : r))} />;
      case AppView.ASSIGNMENTS: return <AssignmentsView assignments={assignments} submissions={submissions} students={students} years={years} teacherName={settings.teacherName} notation={settings.mathNotation} onAdd={(a) => { setAssignments(prev => [...prev, a]); handleSendNotification({ title: '📚 واجب جديد متاح!', message: `تم إضافة واجب بعنوان: ${a.title}. يرجى التسليم قبل الموعد المحدد.`, type: 'academic', targetYearId: a.yearId }); }} onDelete={(id) => setAssignments(prev => prev.filter(a => a.id !== id))} onGrade={(sid, g, f, img) => {
        setSubmissions(prev => prev.map(s => {
          if (s.id === sid) {
             // نقاط تلقائية للواجبات المتميزة
             if (g >= 90) {
                const bonus = g === 100 ? 15 : 10;
                setStudents(stPrev => stPrev.map(st => st.id === s.studentId ? { ...st, points: st.points + bonus } : st));
                addToast(`تم التصحيح ومنح الطالب ${bonus} نقطة لتميزه في الواجب! 📚`, 'success');
             }
             return {...s, grade: g, feedback: f, fileUrl: img || s.fileUrl, status: 'graded'};
          }
          return s;
        }));
      }} />;
      case AppView.AI_SOLVER: return <AISolver notation={settings.mathNotation} />;
      case AppView.LIVE_CLASS: return <LiveClass teacherName={settings.teacherName} settings={settings} onUpdateSettings={setSettings} onBroadcastToWhatsApp={() => {}} onPostSummary={(s) => setEducationalSources(prev => [...prev, s])} />;
      case AppView.QUIZZES: return <QuizGenerator years={years} sources={educationalSources} notation={settings.mathNotation} onPublish={(title, yId, qs) => { setQuizzes(prev => [...prev, {id: 'q'+Date.now(), title, yearId: yId, date: 'اليوم', type: 'native', questions: qs || []}]); handleSendNotification({ title: '📝 اختبار جديد بانتظارك!', message: `تم نشر اختبار بعنوان: ${title}. استعد وجرب حلك الآن!`, type: 'academic', targetYearId: yId }); }} />;
      case AppView.FILES: return <FilesView years={years} videoLessons={videoLessons} educationalSources={educationalSources} students={students} videoViews={[]} onAddVideo={(v) => setVideoLessons(prev => [...prev, {...v, id: 'v'+Date.now()}])} onDeleteVideo={(id) => setVideoLessons(prev => prev.filter(v => v.id !== id))} onAddSource={(s) => setEducationalSources(prev => [...prev, s])} onDeleteSource={(id) => setEducationalSources(prev => prev.filter(s => s.id !== id))} />;
      case AppView.SETTINGS: return <Settings settings={settings} assistants={assistants} onUpdate={setSettings} onUpdateAssistants={setAssistants} />;
      case AppView.CHAT: return <ChatRoom user={{role:'teacher', id:'t1', name: settings.teacherName}} messages={chatMessages} years={years} students={students} onSendMessage={(txt, ty, rec, audio) => setChatMessages(prev => [...prev, {id: 'm'+Date.now(), senderId: 't1', senderName: settings.teacherName, senderRole: 'teacher', text: txt, type: ty, recipientId: rec, audioData: audio, timestamp: 'الآن'}])} notation={settings.mathNotation} />;
      case AppView.CALL_CENTER: return <CallCenter inquiries={inquiries} callLogs={callLogs} students={students} onUpdateInquiry={(id, st) => setInquiries(prev => prev.map(inq => inq.id === id ? {...inq, status: st} : inq))} onAddCallLog={(log) => setCallLogs(prev => [...prev, { ...log, id: 'log'+Date.now() }])} teacherName={settings.teacherName} />;
      case AppView.TEST_CENTER: return <TestCenter students={students} years={years} groups={groups} quizzes={quizzes} assignments={assignments} settings={settings} onMockData={(d) => { setYears(d.years); setGroups(d.groups); setStudents(d.students); }} onEnterSimulation={(s) => setLoggedUser({...s, role:'student'})} addToast={addToast} />;
      case AppView.NOTIFICATIONS: return <Notifications notifications={notifications} years={years} groups={groups} role="teacher" onSend={handleSendNotification} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))} />;
      case AppView.LEADERBOARD: return <Leaderboard students={students} years={years} />;
      case AppView.REGISTRATION: return <Registration years={years} groups={groups} onRegister={(data) => { setStudents(prev => [...prev, {...data, id:'s'+Date.now(), points:0, score:0, scoreHistory:[], badges:[], streaks:0, deviceIds:[]}]); addToast('تم التسجيل بنجاح!', 'success'); setCurrentView(AppView.DASHBOARD); }} onBack={() => setCurrentView(AppView.DASHBOARD)} teacherName={settings.teacherName} />;
      default: return <Dashboard teacherName={settings.teacherName} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={setCurrentView} />;
    }
  };

  if (loggedUser?.role === 'student' || currentView === AppView.STUDENT_PORTAL) {
    const mockStudent: Student = students[0] || { id: 'preview', name: 'طالب تجريبي', studentCode: 'PREVIEW', yearId: years[0]?.id || '', groupId: '', attendance: true, score: 95, points: 100, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=preview', scoreHistory: [], status: 'active', badges: [], streaks: 0, deviceIds: [] };
    const activeStudent = loggedUser?.role === 'student' ? loggedUser : mockStudent;

    return (
      <StudentPortal 
        student={activeStudent} assignments={assignments} submissions={submissions} 
        quizzes={quizzes} results={results} settings={settings} 
        videoLessons={videoLessons} notifications={notifications} 
        groups={groups} educationalSources={educationalSources}
        schedules={schedules} formulas={formulas}
        rewards={rewards} redemptions={redemptions}
        onQuizSubmit={(r) => { 
          setResults(prev => [...prev, r]); 
          addToast('تم تسليم الاختبار! 🏆', 'success');
          
          // نقاط تلقائية للدرجة النهائية في الاختبارات الإلكترونية
          if (r.score === 100) {
            const bonus = 20;
            setStudents(prevSts => prevSts.map(s => s.id === r.studentId ? { ...s, points: s.points + bonus } : s));
            if (loggedUser && loggedUser.id === r.studentId) {
              setLoggedUser(prev => ({ ...prev, points: prev.points + bonus }));
            }
            addToast(`عبقري! حصلت على الدرجة النهائية وربحت ${bonus} نقطة إضافية 🌟`, 'success');
          }
        }} 
        onAssignmentSubmit={(s) => { setSubmissions(prev => [...prev, { ...s, id: 'sub' + Date.now(), status: 'pending' }]); addToast('تم تسليم الواجب ✓', 'success'); }}
        onLogin={handleStudentLogin}
        onSendMessage={(txt, ty, rec, audio) => setChatMessages(prev => [...prev, {id: 'm'+Date.now(), senderId: activeStudent.id, senderName: activeStudent.name, senderRole: 'student', text: txt, type: ty, recipientId: rec, audioData: audio, timestamp: 'الآن'}])}
        onMarkNotificationRead={(id) => { setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n)); setStudents(prev => prev.map(s => s.id === activeStudent.id ? {...s, lastReadNotificationId: id} : s)); }}
        onRedeemReward={handleRedeemReward}
        onSpinWin={handleSpinWin}
        messages={chatMessages} years={years} students={students}
        onBack={() => { setLoggedUser(loggedUser?.role === 'teacher' ? loggedUser : null); setCurrentView(AppView.DASHBOARD); }}
      />
    );
  }

  if (loggedUser?.role === 'parent' || loggedUser?.role === 'parent_login') {
    return <ParentPortal student={loggedUser?.role === 'parent' ? loggedUser : null} results={results} settings={settings} onLogin={(p) => { const s = students.find(st => st.parentPhone === p); if(s) setLoggedUser({...s, role:'parent'}); else addToast('رقم غير مسجل', 'error'); }} onSendInquiry={(inq) => setInquiries(prev => [inq, ...prev])} onBack={() => setLoggedUser(null)} />;
  }

  if (!loggedUser) {
    return <LandingPage teacherName={settings.teacherName} platformName={settings.platformName} onStudentEntry={() => setLoggedUser({id:'guest_login', role:'student'})} onTeacherEntry={() => setLoggedUser({id:'teacher', role:'teacher'})} onParentEntry={() => setLoggedUser({role:'parent_login'})} onAssistantEntry={() => setLoggedUser({role:'assistant_login'})} onStudentRegister={() => { setLoggedUser({role:'guest'}); setCurrentView(AppView.REGISTRATION); }} />;
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden font-['Cairo']" dir="rtl">
      <Sidebar currentView={currentView} setView={setCurrentView} settings={settings} loggedUser={loggedUser} onUpdateSettings={setSettings} addToast={addToast} />
      <main className="flex-1 overflow-y-auto bg-slate-50/30">
        <div className="p-4 lg:p-12 max-w-7xl mx-auto">{renderTeacherView()}</div>
      </main>
      <BottomNav currentView={currentView} setView={setCurrentView} settings={settings} />
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default App;
