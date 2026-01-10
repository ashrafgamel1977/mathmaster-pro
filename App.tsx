
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppView, PlatformSettings, Student, AppNotification, 
  Year, QuizResult, AssignmentSubmission, Group, Assignment, MathFormula, Quiz, VideoLesson, ChatMessage, EducationalSource, ParentInquiry, CallLog, Assistant, ScheduleEntry,
  PlatformReward, RewardRedemption, CustomSection
} from './types';

import Dashboard from './views/Dashboard';
import Sidebar from './components/Sidebar';
import StudentList from './components/StudentList';
import StudentPortal from './views/StudentPortal';
import ParentPortal from './views/ParentPortal';
import AssignmentsView from './views/Assignments';
import LandingPage from './views/LandingPage';
import Registration from './views/Registration';
import AdminControlPanel from './views/AdminControlPanel';
import AISolver from './views/AISolver';
import FilesView from './views/Files';
import LiveClass from './views/LiveClass';
import ChatRoom from './views/ChatRoom';
import QuizGenerator from './views/QuizGenerator';
import Formulas from './views/Formulas';
import Sections from './views/Sections';
import BottomNav from './components/BottomNav';
import { ToastContainer } from './components/Toast';
import MathRenderer from './components/MathRenderer';
import InstallPWA from './components/InstallPWA'; // Import the new component

const initialSettings: PlatformSettings = {
  teacherName: 'أشرف جميل',
  platformName: 'منصة المحترف',
  adminCode: '0000', 
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
  integrityMode: false,
  maxDevicesPerStudent: 2,
  viewLabels: {
    [AppView.DASHBOARD]: 'الرئيسية',
    [AppView.STUDENTS]: 'الطلاب',
    [AppView.FILES]: 'المحتوى',
    [AppView.QUIZZES]: 'الاختبارات',
    [AppView.CHAT]: 'التفاعل',
    [AppView.CONTROL_PANEL]: 'لوحة التحكم',
    [AppView.ASSIGNMENTS]: 'الواجبات',
    [AppView.LIVE_CLASS]: 'البث المباشر'
  },
  enabledViews: [AppView.DASHBOARD, AppView.STUDENTS, AppView.FILES, AppView.QUIZZES, AppView.CHAT, AppView.CONTROL_PANEL, AppView.ASSIGNMENTS, AppView.LIVE_CLASS],
  customSections: [],
  branding: {
    primaryColor: '#2563eb', // Default Blue
    secondaryColor: '#f59e0b', // Default Amber
    logoUrl: '', // Default text icon
    heroImageUrl: '', // Default abstract
  },
  contentTexts: {
    landingTitle: 'بوابة الاحتراف في الرياضيات',
    landingSubtitle: 'حيث تلتقي التكنولوجيا بعبقرية الأرقام',
    studentWelcomeTitle: 'مرحباً بك يا بطل',
    studentWelcomeSubtitle: 'استعد لرحلة التفوق مع منصة المحترف',
    dashboardTitle: 'لوحة التحكم الشاملة'
  }
};

const App: React.FC = () => {
  // تهيئة الحالة من LocalStorage إذا وجدت، وإلا استخدام الافتراضي
  const [currentView, setCurrentView] = useState<AppView | string>(() => {
    return (localStorage.getItem('math_currentView') as AppView) || AppView.DASHBOARD;
  });
  
  const [activeControlTab, setActiveControlTab] = useState<string>(() => {
    return localStorage.getItem('math_activeControlTab') || 'groups';
  });

  const [loggedUser, setLoggedUser] = useState<any>(() => {
    const saved = localStorage.getItem('math_loggedUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Ensure deep merge for new settings structure when loading from local storage
  const [settings, setSettings] = useState<PlatformSettings>(() => {
    const saved = localStorage.getItem('math_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        ...initialSettings,
        ...parsed,
        branding: { ...initialSettings.branding, ...(parsed.branding || {}) },
        contentTexts: { ...initialSettings.contentTexts, ...(parsed.contentTexts || {}) }
      };
    }
    return initialSettings;
  });

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
  const [redemptions, setRewardRedemptions] = useState<RewardRedemption[]>([]);
  const [toasts, setToasts] = useState<any[]>([]);

  // Load Main Data
  useEffect(() => {
    const keys = ['years', 'groups', 'students', 'assistants', 'results', 'assignments', 'submissions', 'notifications', 'quizzes', 'videoLessons', 'chatMessages', 'educationalSources', 'inquiries', 'callLogs', 'schedules', 'formulas', 'rewards', 'redemptions'];
    keys.forEach((key) => {
      const saved = localStorage.getItem(`math_${key}`);
      if (saved) {
         const data = JSON.parse(saved);
         if (key === 'years') setYears(data);
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
         else if (key === 'redemptions') setRewardRedemptions(data);
      }
    });
  }, []);

  // Save Data & UI States
  useEffect(() => {
    const data = { years, groups, students, assistants, results, assignments, submissions, notifications, settings, quizzes, videoLessons, chatMessages, educationalSources, inquiries, callLogs, schedules, formulas, rewards, redemptions };
    Object.entries(data).forEach(([key, val]) => {
      localStorage.setItem(`math_${key}`, JSON.stringify(val));
    });
    
    // حفظ حالات الواجهة بشكل منفصل
    localStorage.setItem('math_currentView', currentView);
    localStorage.setItem('math_activeControlTab', activeControlTab);
    localStorage.setItem('math_loggedUser', JSON.stringify(loggedUser));
  }, [years, groups, students, assistants, results, assignments, submissions, notifications, settings, quizzes, videoLessons, chatMessages, educationalSources, inquiries, callLogs, schedules, formulas, rewards, redemptions, currentView, activeControlTab, loggedUser]);

  // Request Notification Permission on Load
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      // Don't auto request, let user click the button in StudentPortal to avoid blocking
    }
  }, []);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  // Helper function to send push notifications
  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        if (navigator.serviceWorker) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification(title, {
            body: body,
            icon: settings.branding.logoUrl || 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
            vibrate: [200, 100, 200],
            dir: 'rtl',
            lang: 'ar'
          } as any);
        } else {
          new Notification(title, { body });
        }
      } catch (e) {
        console.error("Push notification failed", e);
      }
    }
  }, [settings.branding.logoUrl]);

  const handleAdminLogin = (code: string) => {
    if (code === settings.adminCode) {
      setLoggedUser({ id: 'teacher', name: settings.teacherName, role: 'teacher' });
      addToast(`مرحباً بك يا أستاذ ${settings.teacherName.split(' ')[0]}! ✨`, 'success');
      return;
    }

    const assistant = assistants.find(a => a.code === code);
    if (assistant) {
      setLoggedUser({ ...assistant, role: 'assistant' });
      addToast(`مرحباً بك يا ${assistant.name.split(' ')[0]} في طاقم العمل! 🛠️`, 'success');
      return;
    }

    addToast('الكود غير صحيح، يرجى المحاولة مرة أخرى.', 'error');
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setCurrentView(AppView.DASHBOARD);
    localStorage.removeItem('math_loggedUser');
    localStorage.removeItem('math_currentView');
    localStorage.removeItem('math_activeControlTab');
    localStorage.removeItem('math_student_activeTab'); // مسح تبويب الطالب أيضاً
  };

  const handleNavigate = (view: AppView | string) => {
    const isAssistant = loggedUser?.role === 'assistant';
    const permissions = isAssistant ? (loggedUser as Assistant).permissions : Object.values(AppView);

    if (isAssistant && !permissions.includes(view as AppView) && view !== AppView.DASHBOARD) {
      addToast('عذراً، لا تمتلك صلاحية الوصول لهذا القسم.', 'error');
      return;
    }

    const controlTabMapping: Record<string, string> = {
      [AppView.RESULTS]: 'results',
      [AppView.MANAGEMENT]: 'groups',
      [AppView.REWARDS]: 'store',
      [AppView.SETTINGS]: 'settings',
      [AppView.TEST_CENTER]: 'tech',
      [AppView.NOTIFICATIONS]: 'comms',
      [AppView.CALL_CENTER]: 'comms',
      [AppView.SCHEDULE]: 'groups',
      [AppView.LEADERBOARD]: 'comms',
      [AppView.SECTIONS]: 'sections'
    };

    if (controlTabMapping[view]) {
      setActiveControlTab(controlTabMapping[view]);
      setCurrentView(AppView.CONTROL_PANEL);
    } else {
      setCurrentView(view);
    }
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

  const handleSelfRegistration = (newStudent: any) => {
    const student: Student = {
      ...newStudent,
      id: 's' + Date.now(),
      points: 0,
      score: 0,
      scoreHistory: [],
      badges: [],
      streaks: 0,
      deviceIds: [],
      isPaid: false
    };
    setStudents(prev => [...prev, student]);
    addToast('تم إرسال طلب تسجيلك بنجاح! سيقوم المعلم بتفعيله قريباً.', 'success');
    setCurrentView(AppView.DASHBOARD); // Return to landing
  };

  const renderTeacherView = () => {
    const customSection = settings.customSections?.find(s => s.id === currentView);
    if (customSection) {
      return (
        <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 animate-fadeIn text-right" dir="rtl">
          <h2 className="text-3xl font-black text-slate-800 mb-8 flex items-center gap-4">
            <span className="text-4xl">{customSection.icon}</span>
            {customSection.title}
          </h2>
          <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
             <MathRenderer content={customSection.content} />
          </div>
        </div>
      );
    }

    switch (currentView) {
      case AppView.DASHBOARD: 
        return <Dashboard teacherName={settings.teacherName} settings={settings} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={handleNavigate} />;
      
      case AppView.STUDENTS: 
        return <StudentList 
          students={students} groups={groups} years={years} notifications={notifications} 
          onAttendanceChange={handleAttendanceChange} onSendAlert={() => {}} 
          onDeleteStudent={(id) => setStudents(prev => prev.filter(s => s.id !== id))} 
          onResetDevice={(id) => setStudents(prev => prev.map(s => s.id === id ? { ...s, deviceIds: [] } : s))} 
          onAddStudent={(s) => { setStudents(prev => [...prev, s]); addToast('تم إضافة الطالب يدوياً بنجاح ✅', 'success'); }} 
          onUpdateStudent={(id, u) => setStudents(prev => prev.map(s => s.id === id ? {...s, ...u} : s))}
          teacherName={settings.teacherName} 
        />;

      case AppView.FILES:
        return (
          <div className="space-y-12">
            <FilesView 
              years={years} videoLessons={videoLessons} educationalSources={educationalSources} 
              students={students} videoViews={[]} 
              onAddVideo={(v) => setVideoLessons(prev => [...prev, {...v, id: 'vid'+Date.now()}])} 
              onDeleteVideo={(id) => setVideoLessons(prev => prev.filter(v => v.id !== id))} 
              onAddSource={(s) => setEducationalSources(prev => [...prev, s])} 
              onDeleteSource={(id) => setEducationalSources(prev => prev.filter(s => s.id !== id))} 
            />
            <div className="border-t border-slate-100 pt-12">
               <Formulas years={years} formulas={formulas} onAdd={(f) => setFormulas(prev => [...prev, {...f, id: 'frm'+Date.now()}])} onDelete={(id) => setFormulas(prev => prev.filter(f => f.id !== id))} />
            </div>
          </div>
        );

      case AppView.ASSIGNMENTS:
        return (
          <AssignmentsView 
            assignments={assignments} submissions={submissions} students={students} years={years} 
            teacherName={settings.teacherName} notation={settings.mathNotation} 
            onAdd={(a) => {
              setAssignments(prev => [...prev, a]);
              if (a.status === 'active') {
                sendPushNotification('واجب جديد 📚', `تم إضافة واجب جديد: ${a.title}`);
              }
            }} 
            onUpdate={(updatedAsg) => {
              setAssignments(prev => prev.map(a => a.id === updatedAsg.id ? updatedAsg : a));
              addToast('تم تحديث الواجب بنجاح ✓', 'success');
            }}
            onDelete={(id) => setAssignments(prev => prev.filter(a => a.id !== id))} 
            onGrade={(sid, grade, feedback, correctedImg) => { 
              setSubmissions(prev => prev.map(sub => sub.id === sid ? {...sub, grade, feedback, fileUrl: correctedImg || sub.fileUrl, status: 'graded'} : sub)); 
              addToast('تم تصحيح الواجب بنجاح ✓', 'success'); 
            }} 
          />
        );

      case AppView.QUIZZES:
        return (
          <QuizGenerator 
            years={years} sources={educationalSources} notation={settings.mathNotation} 
            onPublish={(title, yId, qs) => { 
              setQuizzes(prev => [...prev, {id: 'q'+Date.now(), title, yearId: yId, date: 'اليوم', type: 'native', questions: qs || []}]); 
              sendPushNotification('اختبار جديد 📝', `تم نشر اختبار جديد: ${title}`);
              addToast('تم نشر الاختبار بنجاح! 🪄', 'success'); 
            }} 
          />
        );

      case AppView.LIVE_CLASS:
        return (
           <LiveClass 
            teacherName={settings.teacherName} settings={settings} 
            onUpdateSettings={setSettings} onBroadcastToWhatsApp={() => addToast('تم إرسال تنبيه للطلاب!', 'info')} 
            onPostSummary={(src) => setEducationalSources(prev => [...prev, src])} 
          />
        );

      case AppView.CHAT:
        return (
          <div className="space-y-12">
            <ChatRoom 
              user={{id: loggedUser?.id || 'admin', name: loggedUser?.name || 'Admin', role: loggedUser?.role || 'teacher'}} 
              messages={chatMessages} years={years} students={students} 
              onSendMessage={(text, type, rid, audio) => setChatMessages(prev => [...prev, {id: 'm'+Date.now(), senderId: loggedUser?.id || 'admin', senderName: loggedUser?.name || 'Admin', senderRole: loggedUser?.role || 'teacher', text, timestamp: 'الآن', type, recipientId: rid, audioData: audio, yearId: 'all'}])} 
              notation={settings.mathNotation} 
            />
            <div className="border-t border-slate-100 pt-12">
               <AISolver notation={settings.mathNotation} />
            </div>
          </div>
        );

      case AppView.SECTIONS:
        return (
          <Sections 
            sections={settings.customSections || []} 
            onUpdateSections={(secs) => setSettings({...settings, customSections: secs})} 
          />
        );

      case AppView.STUDENT_PORTAL:
        // Teacher preview of student portal (simulation mode)
        const mockStudent: Student = {
          id: 'teacher-preview',
          studentCode: 'PREVIEW',
          name: settings.teacherName + ' (معاينة)',
          studentPhone: '000',
          parentPhone: '000',
          yearId: years[0]?.id || '',
          groupId: groups[0]?.id || '',
          attendance: true,
          score: 100,
          points: 500,
          avatar: settings.branding.heroImageUrl || 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
          scoreHistory: [],
          status: 'active',
          badges: [],
          streaks: 5,
          deviceIds: []
        };
        return (
          <div className="relative">
            <div className="fixed bottom-4 left-4 z-[1000]">
               <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="bg-rose-600 text-white px-6 py-3 rounded-full font-black shadow-xl">إنهاء المعاينة ✕</button>
            </div>
            <StudentPortal 
              student={mockStudent} assignments={assignments} submissions={submissions} quizzes={quizzes} 
              results={results} settings={settings} videoLessons={videoLessons} notifications={notifications} 
              groups={groups} educationalSources={educationalSources} schedules={schedules} formulas={formulas} 
              rewards={rewards} redemptions={redemptions} 
              onQuizSubmit={() => addToast('هذه مجرد معاينة', 'info')} 
              onAssignmentSubmit={() => addToast('هذه مجرد معاينة', 'info')} 
              onSendMessage={() => addToast('هذه مجرد معاينة', 'info')} 
              onMarkNotificationRead={() => {}} 
              onRedeemReward={() => addToast('هذه مجرد معاينة', 'info')} 
              onSpinWin={() => {}}
              messages={chatMessages} years={years} students={students} onBack={() => setCurrentView(AppView.DASHBOARD)} 
              onLogin={() => {}}
            />
          </div>
        );

      case AppView.CONTROL_PANEL:
        return (
          <AdminControlPanel 
            activeTab={activeControlTab}
            onTabChange={setActiveControlTab}
            years={years} groups={groups} students={students} notifications={notifications} results={results} settings={settings}
            assistants={assistants} inquiries={inquiries} callLogs={callLogs} schedules={schedules} rewards={rewards}
            redemptions={redemptions} quizzes={quizzes} assignments={assignments}
            onUpdateSettings={setSettings} 
            onUpdateAssistants={(newAssistants) => {
              setAssistants(newAssistants);
              addToast('تم تحديث قائمة المساعدين بنجاح ✅', 'success');
            }} 
            onAddYear={(n) => setYears(prev => [...prev, {id: 'y'+Date.now(), name: n}])}
            onAddGroup={(n, y, t, ty, g, c, p) => setGroups(prev => [...prev, {id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: (p||'GRP')+Math.random().toString(36).substr(2,3).toUpperCase()}])}
            onDeleteGroup={(id) => setGroups(prev => prev.filter(g => g.id !== id))}
            onUpdateInquiry={(id, status) => setInquiries(prev => prev.map(i => i.id === id ? {...i, status} : i))}
            onAddCallLog={(log) => setCallLogs(prev => [...prev, {...log, id: 'log'+Date.now()}])}
            onSendNotif={(n, p) => {
              setNotifications(prev => [{...n, id: 'nt'+Date.now(), timestamp: 'الآن', isRead: false}, ...prev]);
              if (p) {
                sendPushNotification(n.title, n.message);
              }
            }}
            onDeleteNotif={(id) => setNotifications(prev => prev.filter(n => n.id !== id))}
            onMarkNotifRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))}
            onUpdateResult={(id, score) => setResults(prev => prev.map(r => r.id === id ? {...r, score, status: 'graded'} : r))}
            onAddReward={(r) => setRewards(prev => [...prev, {...r, id: 'r'+Date.now()}])}
            onDeleteReward={(id) => setRewards(prev => prev.filter(r => r.id !== id))}
            onMarkRewardDelivered={(id) => setRewardRedemptions(prev => prev.map(red => red.id === id ? {...red, status: 'delivered'} : red))}
            onAddSchedule={(s) => setSchedules(prev => [...prev, {...s, id: 'sch'+Date.now()}])}
            onDeleteSchedule={(id) => setSchedules(prev => prev.filter(s => s.id !== id))}
            onMockData={(data) => { setYears(data.years); setGroups(data.groups); setStudents(data.students); setQuizzes(data.quizzes); setAssignments(data.assignments); }}
            onEnterSimulation={(s) => setLoggedUser({...s, role: 'student'})}
            addToast={addToast}
            loggedUser={loggedUser}
          />
        );
      
      default: 
        return <Dashboard teacherName={settings.teacherName} settings={settings} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={handleNavigate} />;
    }
  };

  if (!loggedUser) {
    if (currentView === AppView.REGISTRATION) {
      return (
        <Registration 
          years={years} 
          groups={groups} 
          onRegister={handleSelfRegistration}
          onBack={() => setCurrentView(AppView.DASHBOARD)}
          teacherName={settings.teacherName}
        />
      );
    }

    return (
      <>
        <InstallPWA />
        <LandingPage 
          teacherName={settings.teacherName} platformName={settings.platformName} 
          settings={settings} // Pass settings for dynamic styling
          onStudentEntry={() => setLoggedUser({id:'guest', role:'student'})} 
          onTeacherEntry={handleAdminLogin}
          onParentEntry={() => setLoggedUser({id:'parent_guest', role:'parent'})} 
          onAssistantEntry={handleAdminLogin}
          onStudentRegister={() => setCurrentView(AppView.REGISTRATION)} 
        />
      </>
    );
  }

  if (loggedUser.role === 'student' && loggedUser.id !== 'guest') {
    return (
      <>
        <InstallPWA />
        <StudentPortal 
          student={loggedUser} assignments={assignments} submissions={submissions} quizzes={quizzes} 
          results={results} settings={settings} videoLessons={videoLessons} notifications={notifications} 
          groups={groups} educationalSources={educationalSources} schedules={schedules} formulas={formulas} 
          rewards={rewards} redemptions={redemptions} 
          onQuizSubmit={(r) => setResults(prev => [...prev, r])} 
          onAssignmentSubmit={(s) => setSubmissions(prev => [...prev, { ...s, id: 'sub' + Date.now(), status: 'pending' }])} 
          onSendMessage={(t, ty, rid, audio) => setChatMessages(prev => [...prev, {id: 'm'+Date.now(), senderId: loggedUser.id, senderName: loggedUser.name, senderRole: 'student', text: t, timestamp: 'الآن', type: ty, recipientId: rid, audioData: audio, yearId: loggedUser.yearId}])} 
          onMarkNotificationRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? {...n, isRead: true} : n))} 
          onRedeemReward={(rid) => {
             const reward = rewards.find(r => r.id === rid);
             if (reward && (loggedUser.points || 0) >= reward.cost) {
                setRewardRedemptions(prev => [...prev, {id: 'red'+Date.now(), studentId: loggedUser.id, studentName: loggedUser.name, rewardId: rid, rewardTitle: reward.title, status: 'pending', timestamp: 'الآن'}]);
                setStudents(prev => prev.map(s => s.id === loggedUser.id ? {...s, points: (s.points || 0) - reward.cost} : s));
                setLoggedUser({...loggedUser, points: (loggedUser.points || 0) - reward.cost});
                addToast('تم إرسال طلب استبدال الجائزة بنجاح! ✨', 'success');
             }
          }} 
          onSpinWin={(p) => {
             setStudents(prev => prev.map(s => s.id === loggedUser.id ? {...s, points: (s.points || 0) + p, lastSpinDate: new Date().toISOString()} : s));
             setLoggedUser({...loggedUser, points: (loggedUser.points || 0) + p, lastSpinDate: new Date().toISOString()});
          }}
          messages={chatMessages} years={years} students={students} onBack={handleLogout} 
          onLogin={(code) => {
            const student = students.find(st => st.studentCode === code);
            
            if (!student) {
              addToast('الكود غير صحيح', 'error');
              return;
            }

            // --- Logic for Device Fingerprinting & Limits ---
            let deviceId = localStorage.getItem('math_device_id');
            if (!deviceId) {
              deviceId = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
              localStorage.setItem('math_device_id', deviceId);
            }

            const registeredDevices = student.deviceIds || [];
            const isDeviceRegistered = registeredDevices.includes(deviceId);

            if (isDeviceRegistered) {
               // الجهاز مسجل مسبقاً، السماح بالدخول
               setLoggedUser({...student, role: 'student'});
            } else {
               // جهاز جديد
               if (registeredDevices.length < settings.maxDevicesPerStudent) {
                  // إضافة الجهاز الجديد للقائمة
                  const updatedDevices = [...registeredDevices, deviceId];
                  setStudents(prev => prev.map(s => s.id === student.id ? { ...s, deviceIds: updatedDevices } : s));
                  setLoggedUser({...student, deviceIds: updatedDevices, role: 'student'});
                  addToast('تم تسجيل هذا الجهاز في حسابك بنجاح ✅', 'success');
               } else {
                  // تجاوز الحد المسموح
                  addToast(`عذراً، لقد تجاوزت الحد المسموح من الأجهزة (${settings.maxDevicesPerStudent}). يرجى التواصل مع الدعم الفني. 🚫`, 'error');
               }
            }
            // ------------------------------------------------
          }}
        />
      </>
    );
  }

  if (loggedUser.role === 'parent' || (loggedUser.id === 'parent_guest' && loggedUser.role === 'parent')) {
     return (
       <>
         <InstallPWA />
         <ParentPortal 
            student={students.find(s => s.studentPhone === loggedUser.id) || null} 
            results={results} settings={settings} onBack={handleLogout}
            onLogin={(phone) => {
               const s = students.find(st => st.parentPhone === phone || st.studentPhone === phone);
               if (s) setLoggedUser({id: s.studentPhone, role: 'parent'});
               else addToast('لم يتم العثور على طالب مرتبط بهذا الرقم', 'error');
            }}
            onSendInquiry={(inq) => { setInquiries(prev => [inq, ...prev]); addToast('تم إرسال طلبك للمعلم بنجاح ✓', 'success'); }}
         />
       </>
     );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden font-['Cairo']" dir="rtl">
      <InstallPWA />
      <Sidebar 
        currentView={currentView} 
        setView={handleNavigate} 
        settings={settings} 
        loggedUser={loggedUser} 
        onUpdateSettings={setSettings} 
        // removed addToast from props interface as it was unused
        unreadNotifCount={notifications.filter(n => !n.isRead).length}
        pendingCount={submissions.filter(s => s.status === 'pending').length}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50/30 no-scrollbar">
        <div className="p-4 lg:p-12 max-w-7xl mx-auto">{renderTeacherView()}</div>
      </main>
      <BottomNav 
        currentView={currentView} 
        setView={handleNavigate} 
        settings={settings} 
        pendingCount={submissions.filter(s => s.status === 'pending').length} 
        loggedUser={loggedUser}
      />
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default App;
