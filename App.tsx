
import React, { useState, useEffect } from 'react';
import { 
  AppView, PlatformSettings, Student, Year, Group, Quiz, Assignment, 
  AssignmentSubmission, QuizResult, VideoLesson, EducationalSource, 
  ChatMessage, AppNotification, Assistant, ParentInquiry, CallLog, 
  ScheduleEntry, MathFormula, PlatformReward, RewardRedemption, VideoView, VideoNote, CustomSection, Folder
} from './types';

// Views
import LandingPage from './views/LandingPage';
import Dashboard from './views/Dashboard';
import StudentPortal from './views/StudentPortal';
import ParentPortal from './views/ParentPortal';
import StudentList from './components/StudentList';
import AssignmentsView from './views/Assignments';
import QuizGenerator from './views/QuizGenerator';
import LiveClass from './views/LiveClass';
import FilesView from './views/Files';
import Management from './views/Management';
import QuizResults from './views/QuizResults';
import Settings from './views/Settings';
import ChatRoom from './views/ChatRoom';
import TestCenter from './views/TestCenter';
import LaunchGuide from './views/LaunchGuide';
import Leaderboard from './views/Leaderboard';
import Notifications from './views/Notifications';
import Formulas from './views/Formulas';
import Registration from './views/Registration';
import AdminControlPanel from './views/AdminControlPanel';
import Schedules from './views/Schedules';
import Sections from './views/Sections';

// Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { ToastContainer, ToastProps } from './components/Toast';
import InstallPWA from './components/InstallPWA';

// Services & Config
import { subscribeToCollection, saveData, updatePartialData, removeData } from './services/firebaseService';
import { isUsingDefaultConfig } from './firebaseConfig';

const INITIAL_SETTINGS: PlatformSettings = {
  teacherName: 'أشرف جميل',
  platformName: 'MathMaster Pro',
  teacherSpecialization: 'math',
  branches: ['عام'],
  adminCode: '1234',
  studentWelcomeMsg: 'أهلاً بك في منصة التفوق',
  parentWelcomeMsg: 'تابع مستوى ابنك لحظة بلحظة',
  protectionEnabled: true,
  watermarkEnabled: true,
  watermarkText: 'MathMaster Property',
  portalTheme: 'indigo',
  portalLayout: 'modern',
  liveSessionActive: false,
  liveSessionLink: '',
  liveSessionTitle: '',
  allowSelfRegistration: true,
  mathNotation: 'arabic',
  autoAttendanceEnabled: false,
  autoParentReportEnabled: false,
  enableChat: true,
  enableLeaderboard: true,
  examMode: false,
  integrityMode: false,
  maxDevicesPerStudent: 2,
  
  subscriptionEnabled: false, // Default is OFF (Free)
  paymentInstructions: 'للاشتراك يرجى تحويل المبلغ عبر فودافون كاش على الرقم: 01000000000 ثم إرسال صورة التحويل هنا.',

  branding: {
    primaryColor: '#2563eb',
    secondaryColor: '#f59e0b',
    fontFamily: 'Cairo',
    logoUrl: '',
    heroImageUrl: '',
    faviconUrl: ''
  },
  contentTexts: {
    landingTitle: 'بوابة الاحتراف في الرياضيات',
    landingSubtitle: 'المنصة التعليمية الأقوى للمرحلة الثانوية',
    studentWelcomeTitle: 'مرحباً يا بطل',
    studentWelcomeSubtitle: 'استعد لرحلة التفوق',
    dashboardTitle: 'لوحة التحكم'
  },
  dashboardWidgets: {
    showStats: true,
    showQuickActions: true,
    showLeaderboard: true,
    showTools: true
  },
  enabledViews: Object.values(AppView), // Default to ALL views enabled
  featureConfig: {
    [AppView.STUDENT_PORTAL]: [
      { id: 'dashboard', label: 'الرئيسية', enabled: true },
      { id: 'library', label: 'دروسي', enabled: true },
      { id: 'assignments', label: 'واجباتي', enabled: true },
      { id: 'quizzes', label: 'امتحاناتي', enabled: true },
      { id: 'results', label: 'التقارير', enabled: true }
    ],
    [AppView.QUIZZES]: [
      { id: 'scanner', label: 'ماسح الورق', enabled: true },
      { id: 'editor', label: 'المحرر اليدوي', enabled: true },
      { id: 'external', label: 'روابط خارجية', enabled: true }
    ],
    [AppView.FILES]: [
      { id: 'videos', label: 'فيديوهات', enabled: true },
      { id: 'docs', label: 'كتب وملازم', enabled: true }
    ],
    [AppView.CHAT]: [
      { id: 'group', label: 'الساحة العامة', enabled: true },
      { id: 'private', label: 'مراسلة المعلم', enabled: true }
    ]
  }
};

const App: React.FC = () => {
  // --- State Management ---
  const [currentView, setCurrentView] = useState<AppView | string>(AppView.DASHBOARD);
  const [currentUser, setCurrentUser] = useState<any>(null); // { role, id, name, ... }
  const [settings, setSettings] = useState<PlatformSettings>(INITIAL_SETTINGS);
  
  // Admin Panel State
  const [adminPanelTab, setAdminPanelTab] = useState('groups');

  // Data Collections
  const [students, setStudents] = useState<Student[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
  const [educationalSources, setEducationalSources] = useState<EducationalSource[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [formulas, setFormulas] = useState<MathFormula[]>([]);
  const [videoViews, setVideoViews] = useState<VideoView[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);

  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(isUsingDefaultConfig());

  // --- Helper for Safe Storage ---
  const safeSetItem = (key: string, value: any) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to save ${key} to localStorage (Circular structure or quota exceeded)`, e);
    }
  };

  // --- Helper for Device Fingerprinting ---
  const getDeviceId = () => {
    let id = localStorage.getItem('mm_device_id');
    if (!id) {
      id = 'dev_' + Date.now() + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('mm_device_id', id);
    }
    return id;
  };

  // --- Effects ---
  useEffect(() => {
    // Load local settings/user if available
    try {
      const savedUser = localStorage.getItem('math_user');
      if (savedUser) setCurrentUser(JSON.parse(savedUser));

      const savedSettings = localStorage.getItem('math_settings');
      if (savedSettings) setSettings(JSON.parse(savedSettings));
    } catch (e) {
      console.error("Error loading local storage data", e);
    }

    // Data Loading (Firebase or LocalStorage for Demo)
    if (!isDemoMode) {
      // Subscribe to Firebase collections
      const unsubs = [
        subscribeToCollection('students', setStudents),
        subscribeToCollection('years', setYears),
        subscribeToCollection('groups', setGroups),
        subscribeToCollection('quizzes', setQuizzes),
        subscribeToCollection('assignments', setAssignments),
        subscribeToCollection('submissions', setSubmissions),
        subscribeToCollection('results', setResults),
        subscribeToCollection('notifications', setNotifications),
        subscribeToCollection('videoLessons', setVideoLessons),
        subscribeToCollection('educationalSources', setEducationalSources),
        subscribeToCollection('messages', setMessages),
        subscribeToCollection('assistants', setAssistants),
        subscribeToCollection('schedules', setSchedules),
        subscribeToCollection('formulas', setFormulas),
        subscribeToCollection('folders', setFolders),
        subscribeToCollection('settings', (data) => { 
          if(data[0]) {
             setSettings(prev => ({
               ...INITIAL_SETTINGS,
               ...data[0] as PlatformSettings,
               branding: { ...INITIAL_SETTINGS.branding, ...(data[0].branding || {}) },
               contentTexts: { ...INITIAL_SETTINGS.contentTexts, ...(data[0].contentTexts || {}) },
               featureConfig: { ...INITIAL_SETTINGS.featureConfig, ...(data[0].featureConfig || {}) }
             }));
          } else {
             setSettings(INITIAL_SETTINGS);
          }
        })
      ];
      return () => unsubs.forEach(unsub => unsub());
    } else {
      // Initialize Mock Data
      if (students.length === 0) {
        const mockStudent: Student = {
          id: 's_demo_1',
          name: 'طالب تجريبي',
          studentCode: 'M3-123',
          studentPhone: '01000000000',
          parentPhone: '01100000000',
          yearId: 'y1',
          groupId: 'g1',
          attendance: false,
          score: 85,
          points: 150,
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
          scoreHistory: [80, 85, 90],
          status: 'active',
          badges: [],
          streaks: 5,
          deviceIds: []
        };
        setStudents([mockStudent]);
      }
      
      if (years.length === 0) setYears([{ id: 'y1', name: 'الصف الثالث الثانوي' }]);
      if (groups.length === 0) setGroups([{ id: 'g1', name: 'مجموعة التميز (أ)', yearId: 'y1', time: 'السبت 10 ص', joinCode: 'G1', type: 'center', gender: 'mixed' }]);
    }
  }, [isDemoMode]);

  useEffect(() => {
    if (isDemoMode) {
      safeSetItem('math_settings', settings);
    }
    // In non-demo mode, settings are saved explicitly by UI handlers via persistData -> saveData.
    // We do NOT want to auto-save here as it causes a loop with the subscription.
  }, [settings, isDemoMode]);

  // --- Handlers ---
  const addToast = (message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const handleUnifiedLogin = (role: 'student' | 'teacher' | 'parent', code: string) => {
    const cleanCode = code.trim();
    if (role === 'teacher') {
      if (cleanCode === settings.adminCode) {
        const teacherUser = { id: 'teacher', name: settings.teacherName, role: 'teacher' };
        setCurrentUser(teacherUser);
        safeSetItem('math_user', teacherUser);
        addToast('تم تسجيل دخول المعلم بنجاح', 'success');
        if (!isDemoMode) saveData('settings', { ...INITIAL_SETTINGS, id: 'global_settings' });
      } else {
        const assistant = assistants.find(a => a.code === cleanCode);
        if (assistant) {
          const asstUser = { ...assistant, role: 'assistant' };
          setCurrentUser(asstUser);
          safeSetItem('math_user', asstUser);
          addToast(`مرحباً ${assistant.name}`, 'success');
        } else {
          addToast('كود المعلم غير صحيح', 'error');
        }
      }
    } else if (role === 'student') {
      if (cleanCode === 'guest' || cleanCode === 'guest_login') {
        const guestUser = { id: 'guest', name: 'زائر', role: 'student', yearId: years[0]?.id || 'y1' };
        setCurrentUser(guestUser);
        return;
      }
      
      const student = students.find(s => s.studentCode === cleanCode);
      if (student) {
        if (student.status === 'pending') {
            addToast('حسابك قيد المراجعة من قبل الإدارة', 'info');
            return;
        }

        // --- Device Lock Logic ---
        const currentDeviceId = getDeviceId();
        const existingDevices = student.deviceIds || [];
        const maxDevices = settings.maxDevicesPerStudent || 2;

        let isAllowed = false;
        let updatedDeviceIds = existingDevices;

        // 1. Check if device is already registered
        if (existingDevices.includes(currentDeviceId)) {
            isAllowed = true;
        } 
        // 2. If not registered, check if we have space
        else if (existingDevices.length < maxDevices) {
            updatedDeviceIds = [...existingDevices, currentDeviceId];
            // Save new device list
            persistData('students', { id: student.id, deviceIds: updatedDeviceIds }, 'update');
            isAllowed = true;
        }

        if (isAllowed) {
            const studentUser = { ...student, role: 'student', deviceIds: updatedDeviceIds };
            setCurrentUser(studentUser);
            safeSetItem('math_user', studentUser);
            addToast('تم تسجيل الدخول بنجاح', 'success');
        } else {
            addToast(`⛔ تم تجاوز الحد المسموح للأجهزة (${existingDevices.length}/${maxDevices}). يرجى التواصل مع الإدارة لتصفير الأجهزة.`, 'error');
        }

      } else {
        addToast(`كود الطالب "${cleanCode}" غير موجود`, 'error');
      }
    } else if (role === 'parent') {
      const student = students.find(s => s.parentPhone === cleanCode);
      if (student) {
        const parentUser = { ...student, role: 'parent' };
        setCurrentUser(parentUser);
        safeSetItem('math_user', parentUser);
        addToast('تم تسجيل دخول ولي الأمر', 'success');
      } else {
        addToast('رقم الهاتف غير مسجل في النظام', 'error');
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('math_user');
    setCurrentView(AppView.DASHBOARD);
  };

  const persistData = async (collection: string, data: any, action: 'save' | 'update' | 'delete' = 'save') => {
    if (isDemoMode) {
      switch(collection) {
        case 'students': 
          if(action==='save') setStudents(prev => [...prev, data]); 
          if(action==='update') setStudents(prev => prev.map(s => s.id === data.id ? {...s, ...data} : s));
          if(action==='delete') setStudents(prev => prev.filter(s => s.id !== data));
          break;
        case 'assignments':
          if(action==='save') setAssignments(prev => [...prev, data]);
          if(action==='update') setAssignments(prev => prev.map(a => a.id === data.id ? {...a, ...data} : a));
          if(action==='delete') setAssignments(prev => prev.filter(a => a.id !== data));
          break;
        case 'quizzes':
          if(action==='save') setQuizzes(prev => [...prev, data]);
          if(action==='delete') setQuizzes(prev => prev.filter(q => q.id !== data));
          break;
        case 'videoViews':
          if(action==='save') setVideoViews(prev => [...prev, data]);
          if(action==='update') setVideoViews(prev => prev.map(v => v.id === data.id ? {...v, ...data} : v));
          break;
      }
    } else {
      try {
        if (action === 'save') await saveData(collection, data);
        if (action === 'update') await updatePartialData(collection, data.id, data);
        if (action === 'delete') await removeData(collection, data);
      } catch (e) {
        if (collection !== 'videoViews') addToast('حدث خطأ في حفظ البيانات', 'error');
      }
    }
  };

  const handleVideoProgress = (videoId: string, percent: number) => {
    if (!currentUser || currentUser.role !== 'student') return;
    const existingView = videoViews.find(v => v.studentId === currentUser.id && v.videoId === videoId);
    if (existingView) {
      if (percent > existingView.watchedPercent) {
        const updatedView = { ...existingView, watchedPercent: percent, lastWatched: new Date().toISOString() };
        persistData('videoViews', updatedView, 'update');
        setVideoViews(prev => prev.map(v => v.id === existingView.id ? updatedView : v));
      }
    } else {
      const newView: VideoView = {
        id: 'view_' + Date.now(),
        studentId: currentUser.id,
        videoId: videoId,
        watchedPercent: percent,
        lastWatched: new Date().toISOString()
      };
      persistData('videoViews', newView, 'save');
      setVideoViews(prev => [...prev, newView]);
    }
  };

  const fontStyle = { fontFamily: settings.branding.fontFamily || 'Cairo' };

  if (!currentUser) {
    if (currentView === AppView.REGISTRATION) {
      return (
        <div style={fontStyle}>
          <Registration 
            years={years} 
            groups={groups} 
            onRegister={(data) => {
              const newStudent = { ...data, id: 's' + Date.now(), points: 0, score: 0, scoreHistory: [], badges: [], streaks: 0, deviceIds: [] };
              persistData('students', newStudent, 'save');
              addToast('تم إرسال طلب التسجيل بنجاح، يمكنك الدخول الآن', 'success');
              handleUnifiedLogin('student', newStudent.studentCode || 'PENDING');
            }}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            teacherName={settings.teacherName}
          />
          <InstallPWA />
        </div>
      );
    }
    return (
      <div style={fontStyle}>
        <LandingPage 
          teacherName={settings.teacherName} 
          platformName={settings.platformName}
          settings={settings}
          onUnifiedLogin={handleUnifiedLogin} 
          onStudentRegister={() => setCurrentView(AppView.REGISTRATION)} 
        />
        <InstallPWA />
      </div>
    );
  }

  if (currentUser.role === 'student') {
    return (
      <div style={fontStyle}>
        <StudentPortal 
          student={currentUser}
          assignments={assignments}
          submissions={submissions}
          quizzes={quizzes}
          results={results}
          settings={settings}
          videoLessons={videoLessons}
          notifications={notifications}
          groups={groups}
          educationalSources={educationalSources}
          schedules={schedules}
          formulas={formulas}
          messages={messages}
          years={years}
          students={students}
          onQuizSubmit={(res) => persistData('results', res, 'save')}
          onAssignmentSubmit={(sub) => persistData('submissions', { ...sub, id: 'sub' + Date.now(), status: 'pending' }, 'save')}
          onLogin={() => {}} 
          onSendMessage={(text, type, recipientId, audioData) => {
            const msg = { 
              id: 'msg' + Date.now(), 
              text, type, recipientId, audioData, 
              senderId: currentUser.id, 
              senderName: currentUser.name, 
              senderRole: 'student', 
              timestamp: new Date().toLocaleTimeString('ar-EG'),
              yearId: currentUser.yearId 
            };
            persistData('messages', msg, 'save');
          }}
          onMarkNotificationRead={(id) => { }}
          onUpdateStudent={(updates) => {
            persistData('students', { id: currentUser.id, ...updates }, 'update');
            setCurrentUser({ ...currentUser, ...updates });
          }}
          onRateSource={(srcId, rating) => {
            const source = educationalSources.find(s => s.id === srcId);
            if(source) {
              const newRatings = [...(source.ratings || []).filter(r => r.studentId !== currentUser.id), { studentId: currentUser.id, value: rating }];
              persistData('educationalSources', { id: srcId, ratings: newRatings }, 'update');
            }
          }}
          onVideoProgress={handleVideoProgress}
          onBack={handleLogout}
          addToast={addToast}
        />
        <InstallPWA />
      </div>
    );
  }

  if (currentUser.role === 'parent') {
    return (
      <div style={fontStyle}>
        <ParentPortal 
          student={currentUser} 
          results={results} 
          onLogin={() => {}} 
          settings={settings}
          onSendInquiry={(inq) => { addToast('تم إرسال الطلب', 'success'); }}
          onBack={handleLogout}
        />
        <InstallPWA />
      </div>
    );
  }

  const renderTeacherContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return (
          <Dashboard 
            teacherName={currentUser.name} 
            platformName={settings.platformName}
            students={students}
            quizzes={quizzes}
            assignments={assignments}
            submissions={submissions}
            settings={settings}
            onNavigate={setCurrentView}
            loggedUser={currentUser}
            isConnected={!isDemoMode}
            onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }}
          />
        );
      case AppView.STUDENT_PORTAL:
        const mockStudentForTeacher: Student = {
           id: 'teacher-view',
           name: currentUser.name,
           studentCode: 'TEACHER',
           studentPhone: '0000000000',
           parentPhone: '0000000000',
           yearId: years[0]?.id || 'y1',
           groupId: groups[0]?.id || 'g1',
           attendance: true,
           score: 95,
           points: 4500,
           avatar: settings.branding.heroImageUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Teacher',
           scoreHistory: [80, 90, 95],
           status: 'active',
           badges: [],
           streaks: 10,
           deviceIds: [],
           isPaid: true
        };
        return (
          <StudentPortal 
            student={mockStudentForTeacher}
            assignments={assignments}
            submissions={[]}
            quizzes={quizzes}
            results={[]}
            settings={settings}
            videoLessons={videoLessons}
            notifications={notifications}
            groups={groups}
            educationalSources={educationalSources}
            schedules={schedules}
            formulas={formulas}
            messages={[]}
            years={years}
            students={students}
            onQuizSubmit={()=>{}}
            onAssignmentSubmit={()=>{}}
            onLogin={()=>{}}
            onSendMessage={()=>{}}
            onMarkNotificationRead={()=>{}}
            onUpdateStudent={()=>{}}
            onRateSource={()=>{}}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            addToast={addToast}
          />
        );
      case AppView.STUDENTS:
        return (
          <StudentList 
            students={students} groups={groups} years={years} notifications={notifications}
            submissions={submissions} results={results} // Pass these props
            teacherName={currentUser.name}
            onAttendanceChange={(id) => {
              const s = students.find(x => x.id === id);
              if (s) persistData('students', { id, attendance: !s.attendance }, 'update');
            }}
            onSendAlert={(s, m, c) => addToast(`تم إرسال تنبيه لـ ${s.name}`, 'info')}
            onDeleteStudent={(id) => { if(window.confirm('حذف الطالب؟')) persistData('students', id, 'delete'); }}
            onResetDevice={(id) => persistData('students', { id, deviceIds: [] }, 'update')}
            onAddStudent={(s) => { persistData('students', s, 'save'); addToast('تمت الإضافة', 'success'); }}
            onUpdateStudent={(id, updates) => persistData('students', { id, ...updates }, 'update')}
          />
        );
      case AppView.ASSIGNMENTS:
        return (
          <AssignmentsView 
            assignments={assignments} submissions={submissions} students={students} years={years}
            teacherName={currentUser.name} notation={settings.mathNotation}
            onAdd={(a) => { persistData('assignments', a, 'save'); addToast('تم إضافة الواجب', 'success'); }}
            onUpdate={(a) => { persistData('assignments', a, 'update'); addToast('تم تحديث الواجب', 'success'); }}
            onDelete={(id) => { if(window.confirm('حذف الواجب؟')) persistData('assignments', id, 'delete'); }}
            onGrade={(subId, grade, feedback, img) => {
              persistData('submissions', { id: subId, grade, feedback, status: 'graded', fileUrl: img }, 'update');
              addToast('تم رصد الدرجة', 'success');
            }}
          />
        );
      case AppView.QUIZZES:
        return (
          <QuizGenerator 
            years={years} sources={educationalSources} notation={settings.mathNotation}
            settings={settings}
            quizzes={quizzes}
            onDelete={(id) => persistData('quizzes', id, 'delete')}
            onPublish={(title, yearId, qs, type, link, file) => {
              const newQuiz: Quiz = { 
                id: 'qz'+Date.now(), 
                title, 
                yearId, 
                date: new Date().toLocaleDateString('ar-EG'), 
                type, 
                questions: qs || [],
                externalLink: link,
                fileUrl: file
              };
              persistData('quizzes', newQuiz, 'save');
              addToast('تم نشر الاختبار', 'success');
            }}
          />
        );
      case AppView.LIVE_CLASS:
        return (
           <LiveClass 
            teacherName={settings.teacherName} settings={settings} 
            educationalSources={educationalSources} years={years}
            onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }} 
            onBroadcastToWhatsApp={() => addToast('تم التنبيه', 'info')} 
            onPostSummary={(src) => { persistData('educationalSources', src, 'save'); addToast('تم النشر', 'success'); }} 
          />
        );
      case AppView.FILES:
        return (
          <FilesView 
            years={years} videoLessons={videoLessons} educationalSources={educationalSources} students={students} videoViews={videoViews} folders={folders}
            onAddVideo={(v) => { persistData('videoLessons', { ...v, id: 'vid'+Date.now() }, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteVideo={(id) => persistData('videoLessons', id, 'delete')}
            onAddSource={(s) => { persistData('educationalSources', s, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteSource={(id) => persistData('educationalSources', id, 'delete')}
            onAddFolder={(f) => { persistData('folders', { ...f, id: 'fld'+Date.now() }, 'save'); addToast('تم إنشاء المجلد', 'success'); }}
            onDeleteFolder={(id) => persistData('folders', id, 'delete')}
            settings={settings}
          />
        );
      case AppView.MANAGEMENT:
        return (
          <Management 
            years={years} groups={groups} students={students}
            teacherName={currentUser.name} platformName={settings.platformName}
            onAddYear={(n) => { persistData('years', { id: 'y'+Date.now(), name: n }, 'save'); }}
            onAddGroup={(n, y, t, ty, g, c, p) => { persistData('groups', { id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: p+(Math.floor(Math.random()*1000)) }, 'save'); }}
            onDeleteGroup={(id) => persistData('groups', id, 'delete')}
          />
        );
      case AppView.RESULTS:
        return (
          <QuizResults 
            results={results} students={students} notifications={notifications} notation={settings.mathNotation}
            onIssueCertificate={() => {}} 
            onUpdateResult={(id, s, f) => { persistData('results', { id, score: s, feedback: f, status: 'graded' }, 'update'); addToast('تم الرصد', 'success'); }}
          />
        );
      case AppView.CHAT:
        return (
          <ChatRoom 
            user={currentUser} messages={messages} years={years} students={students} notation={settings.mathNotation}
            educationalSources={educationalSources} 
            onSendMessage={(text, type, recId, audio) => {
              persistData('messages', { 
                id: 'm'+Date.now(), text, type, recipientId: recId, audioData: audio, 
                senderId: currentUser.id, senderName: currentUser.name, senderRole: 'teacher', timestamp: new Date().toLocaleTimeString('ar-EG'), yearId: 'all' 
              }, 'save');
            }}
          />
        );
      case AppView.SETTINGS:
        return (
          <Settings 
            settings={settings} assistants={assistants}
            students={students} submissions={submissions} notifications={notifications}
            onUpdate={(s) => { setSettings(s); persistData('settings', s, 'update'); addToast('تم الحفظ', 'success'); }}
            onAddAssistant={(a) => { persistData('assistants', a, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteAssistant={(id) => persistData('assistants', id, 'delete')}
          />
        );
      case AppView.NOTIFICATIONS:
        return (
          <Notifications 
            notifications={notifications} years={years} groups={groups} role="teacher"
            onSend={(n, push) => { persistData('notifications', { ...n, id: 'n'+Date.now(), timestamp: new Date().toLocaleString('ar-EG'), isRead: false }, 'save'); addToast('تم الإرسال', 'success'); }}
            onMarkRead={() => {}}
            onDelete={(id) => persistData('notifications', id, 'delete')}
          />
        );
      case AppView.LEADERBOARD:
        return <Leaderboard students={students} years={years} />;
      case AppView.SCHEDULE:
        return (
          <Schedules 
            groups={groups} schedules={schedules}
            onAdd={(s) => persistData('schedules', { ...s, id: 'sch'+Date.now() }, 'save')}
            onDelete={(id) => persistData('schedules', id, 'delete')}
          />
        );
      case AppView.FORMULAS:
        return (
          <Formulas 
            years={years} formulas={formulas}
            onAdd={(f) => persistData('formulas', { ...f, id: 'frm'+Date.now() }, 'save')}
            onDelete={(id) => persistData('formulas', id, 'delete')}
          />
        );
      case AppView.TEST_CENTER:
        return (
          <TestCenter 
            students={students} years={years} groups={groups} quizzes={quizzes} assignments={assignments} settings={settings} addToast={addToast}
            onMockData={(d) => { setStudents(d.students); setYears(d.years); setGroups(d.groups); }}
            onEnterSimulation={(s) => setCurrentUser({...s, role: 'student'})}
          />
        );
      case AppView.LAUNCH_GUIDE:
        return <LaunchGuide groups={groups} years={years} teacherName={settings.teacherName} platformName={settings.platformName} addToast={addToast} />;
      case AppView.CONTROL_PANEL:
        return (
          <AdminControlPanel 
            activeTab={adminPanelTab}
            onTabChange={setAdminPanelTab}
            years={years} groups={groups} students={students} notifications={notifications} results={results} settings={settings}
            assistants={assistants} schedules={schedules}
            quizzes={quizzes} assignments={assignments} submissions={submissions}
            onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }}
            onAddAssistant={(a) => persistData('assistants', a, 'save')}
            onDeleteAssistant={(id) => persistData('assistants', id, 'delete')}
            onAddYear={(n) => persistData('years', { id: 'y'+Date.now(), name: n }, 'save')}
            onAddGroup={(n, y, t, ty, g, c, p) => persistData('groups', { id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: p+(Math.floor(Math.random()*1000)) }, 'save')}
            onDeleteGroup={(id) => persistData('groups', id, 'delete')}
            onSendNotif={(n) => persistData('notifications', { ...n, id: 'n'+Date.now() }, 'save')}
            onDeleteNotif={(id) => persistData('notifications', id, 'delete')}
            onMarkNotifRead={() => {}}
            onUpdateResult={(id, s, f) => persistData('results', { id, score: s, feedback: f, status: 'graded' }, 'update')}
            onAddSchedule={(s) => persistData('schedules', { ...s, id: 'sch'+Date.now() }, 'save')}
            onDeleteSchedule={(id) => persistData('schedules', id, 'delete')}
            onMockData={() => {}}
            onEnterSimulation={(s) => setCurrentUser({...s, role: 'student'})}
            addToast={addToast}
            loggedUser={currentUser}
          />
        );
      case AppView.SECTIONS:
        return (
          <Sections 
            sections={settings.customSections || []} 
            onUpdateSections={(secs) => {
              const newSettings = { ...settings, customSections: secs };
              setSettings(newSettings);
              persistData('settings', newSettings, 'update');
            }} 
          />
        );
      
      // Render custom sections
      default:
        const customSec = settings.customSections?.find(s => s.id === currentView);
        if (customSec) {
          return (
            <div className="max-w-4xl mx-auto p-8 bg-white rounded-[3rem] shadow-xl text-right animate-slideUp">
               <h2 className="text-3xl font-black mb-6">{customSec.title}</h2>
               <div className="prose prose-lg max-w-none">
                  {customSec.content}
               </div>
            </div>
          );
        }
        return <Dashboard 
          teacherName={currentUser.name} 
          platformName={settings.platformName}
          students={students}
          quizzes={quizzes}
          assignments={assignments}
          submissions={submissions}
          settings={settings}
          onNavigate={setCurrentView}
          loggedUser={currentUser}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={fontStyle}>
      {/* Teacher Sidebar */}
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        settings={settings} 
        loggedUser={currentUser}
        onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }}
        pendingCount={submissions.filter(s => s.status === 'pending').length}
        unreadChatCount={messages.filter(m => m.senderRole === 'student' && !m.readBy?.includes('teacher')).length}
        isConnected={!isDemoMode}
        onLogout={handleLogout}
      />

      <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen no-scrollbar relative pb-32">
        {renderTeacherContent()}
        <BottomNav 
          currentView={currentView} 
          setView={setCurrentView} 
          settings={settings} 
          loggedUser={currentUser} 
          onLogout={handleLogout}
        />
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
      <InstallPWA />
    </div>
  );
};

export default App;
