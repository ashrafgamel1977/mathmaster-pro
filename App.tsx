
import React, { useState, useEffect, useCallback } from 'react';
import { 
  AppView, PlatformSettings, Student, AppNotification, 
  Year, QuizResult, AssignmentSubmission, Group, Assignment, MathFormula, Quiz, VideoLesson, ChatMessage, EducationalSource, ParentInquiry, CallLog, Assistant, ScheduleEntry,
  PlatformReward, RewardRedemption, CustomSection
} from './types';

// Services
import { subscribeToCollection, saveData, removeData, updatePartialData } from './services/firebaseService';
import { saveConfig, isUsingDefaultConfig, resetConfig } from './firebaseConfig';

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
import InstallPWA from './components/InstallPWA';

// --- CONFIG SCREEN COMPONENT ---
const ConfigScreen = ({ onSave, initialError }: { onSave: (config: any) => void, initialError?: string | null }) => {
  const [inputStr, setInputStr] = useState('');
  const [manualConfig, setManualConfig] = useState(() => {
    // Try to pre-fill with existing config from local storage if available
    try {
        const stored = localStorage.getItem('math_firebase_config');
        if (stored) {
            const parsed = JSON.parse(stored);
            return {
                apiKey: parsed.apiKey || '',
                projectId: parsed.projectId || '',
                authDomain: parsed.authDomain || '',
                storageBucket: parsed.storageBucket || '',
                messagingSenderId: parsed.messagingSenderId || '',
                appId: parsed.appId || ''
            };
        }
    } catch(e) {}
    return { apiKey: '', projectId: '', authDomain: '', storageBucket: '', messagingSenderId: '', appId: '' };
  });
  const [mode, setMode] = useState<'code' | 'manual'>('code');
  const [error, setError] = useState(initialError || '');
  const [showHelp, setShowHelp] = useState(true);

  const handleSave = () => {
    try {
      let config: any = {};
      
      if (mode === 'code') {
        const extract = (key: string) => {
          // Looks for: key followed by optional spaces/colons, then quotes, then captures content, then closing quote
          const regex = new RegExp(`${key}\\s*[:=]?\\s*["']([^"']+)["']`, 'i');
          const match = inputStr.match(regex);
          return match ? match[1] : '';
        };

        config = {
          apiKey: extract('apiKey'),
          authDomain: extract('authDomain'),
          projectId: extract('projectId'),
          storageBucket: extract('storageBucket'),
          messagingSenderId: extract('messagingSenderId'),
          appId: extract('appId')
        };

        // Fallback: If regex fails, maybe they pasted raw JSON?
        if (!config.apiKey && (inputStr.trim().startsWith('{') || inputStr.includes('apiKey'))) {
           try { 
             // Try to make it valid JSON if keys aren't quoted
             const jsonStr = inputStr.replace(/(\w+):/g, '"$1":').replace(/'/g, '"').replace(/,(\s*})/g, '$1'); 
             const parsed = JSON.parse(jsonStr);
             config = { ...config, ...parsed };
           } catch(e) {}
        }

      } else {
        config = manualConfig;
      }
      
      if (!config.apiKey || !config.projectId) {
        throw new Error('لم نستطع استخراج البيانات. تأكد من نسخ الكود كاملاً (الذي يبدأ بـ const firebaseConfig).');
      }
      
      onSave(config);
    } catch (e: any) {
      setError(e.message || 'تنسيق البيانات غير صحيح. حاول النسخ مرة أخرى.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-right" dir="rtl">
      <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-8 md:p-10 shadow-2xl space-y-6 animate-slideUp max-h-[90vh] overflow-y-auto no-scrollbar">
        <div className="text-center">
           <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-4xl shadow-xl mb-6 text-white">⚙️</div>
           <h2 className="text-2xl font-black text-slate-800">إعداد الاتصال بقاعدة البيانات</h2>
           <p className="text-slate-500 text-sm font-bold mt-2">المنصة جاهزة، فقط نحتاج لربطها بمشروعك على Firebase.</p>
        </div>

        {error && (
          <div className="bg-rose-50 border-r-4 border-rose-500 p-4 rounded-xl">
             <p className="text-rose-600 text-xs font-black flex items-center gap-2">
               <span>⚠️</span> {error}
             </p>
          </div>
        )}
        
        <button 
          onClick={() => setShowHelp(!showHelp)}
          className="w-full py-3 bg-indigo-50 text-indigo-600 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
        >
          <span>{showHelp ? 'إخفاء التعليمات' : 'أين أجد الكود؟'}</span>
          <span>💡</span>
        </button>

        {showHelp && (
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-sm space-y-4 animate-fadeIn">
             <ol className="list-decimal pr-4 space-y-3 text-slate-600 font-bold text-xs leading-relaxed">
               <li>اذهب إلى إعدادات مشروعك في Firebase (Project Settings).</li>
               <li>انزل للأسفل لقسم <strong>Your apps</strong>.</li>
               <li>انسخ الكود الموجود داخل المربع الرمادي بالكامل.</li>
               <li>
                 الكود يبدو هكذا تقريباً:
                 <div className="mt-2 bg-slate-200 p-2 rounded-lg font-mono text-[9px] text-left" dir="ltr">
                   const firebaseConfig = &#123;<br/>
                   &nbsp;&nbsp;apiKey: "AIzaSy...",<br/>
                   &nbsp;&nbsp;authDomain: "...",<br/>
                   &nbsp;&nbsp;...<br/>
                   &#125;;
                 </div>
               </li>
             </ol>
          </div>
        )}

        <div className="flex bg-slate-100 p-1 rounded-xl">
           <button onClick={() => setMode('code')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${mode === 'code' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>لصق الكود (تلقائي)</button>
           <button onClick={() => setMode('manual')} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all ${mode === 'manual' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}>إدخال يدوي</button>
        </div>

        {mode === 'code' ? (
          <div className="space-y-2">
             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firebase Config Code</label>
             <textarea 
               className="w-full h-40 bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 font-mono text-[10px] outline-none focus:border-blue-600 text-left text-slate-600" 
               dir="ltr"
               placeholder="الصق الكود هنا..."
               value={inputStr}
               onChange={e => setInputStr(e.target.value)}
             />
          </div>
        ) : (
          <div className="space-y-3">
             <input placeholder="API Key (يبدأ بـ AIza)" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-left outline-none border focus:border-blue-600" dir="ltr" value={manualConfig.apiKey} onChange={e => setManualConfig({...manualConfig, apiKey: e.target.value})} />
             <input placeholder="Project ID" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-left outline-none border focus:border-blue-600" dir="ltr" value={manualConfig.projectId} onChange={e => setManualConfig({...manualConfig, projectId: e.target.value})} />
             <input placeholder="Auth Domain" className="w-full p-3 bg-slate-50 rounded-xl text-xs font-bold text-left outline-none border focus:border-blue-600" dir="ltr" value={manualConfig.authDomain} onChange={e => setManualConfig({...manualConfig, authDomain: e.target.value})} />
          </div>
        )}

        <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:scale-[1.02] transition-transform">حفظ والاتصال 🚀</button>
        
        {/* Safe reset in case of loops */}
        <button onClick={() => { localStorage.clear(); window.location.reload(); }} className="w-full py-2 text-rose-400 text-[10px] font-bold hover:text-rose-600">
           إعادة تعيين كاملة (اضغط فقط إذا استمرت المشكلة)
        </button>
      </div>
    </div>
  );
};

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
  const [showConfigScreen, setShowConfigScreen] = useState(isUsingDefaultConfig());
  const [configError, setConfigError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView | string>(() => {
    return (localStorage.getItem('math_currentView') as AppView) || AppView.DASHBOARD;
  });
  
  const [activeControlTab, setActiveControlTab] = useState<string>(() => {
    return localStorage.getItem('math_activeControlTab') || 'groups';
  });

  const [loggedUser, setLoggedUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('math_loggedUser');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      console.error("Failed to parse logged user", e);
      return null;
    }
  });

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
  const [redemptions, setRewardRedemptions] = useState<RewardRedemption[]>([]);
  
  const [toasts, setToasts] = useState<any[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [connectionTakingLong, setConnectionTakingLong] = useState(false);

  // Connection timeout checker
  useEffect(() => {
    if (!isDataLoaded && !showConfigScreen) {
      const timer = setTimeout(() => {
        setConnectionTakingLong(true);
      }, 7000); // 7 seconds timeout
      return () => clearTimeout(timer);
    }
  }, [isDataLoaded, showConfigScreen]);

  useEffect(() => {
    if (showConfigScreen) return; 

    const unsubscribes: (() => void)[] = [];

    // Try to connect to settings first
    const settingsUnsub = subscribeToCollection('settings', (data) => {
      if (data.length > 0) {
        const remoteSettings = data.find(d => d.id === 'main_settings') || data[0];
        setSettings(prev => ({
          ...initialSettings,
          ...remoteSettings,
          branding: { ...initialSettings.branding, ...(remoteSettings.branding || {}) },
          contentTexts: { ...initialSettings.contentTexts, ...(remoteSettings.contentTexts || {}) }
        }));
      } else {
        // If connected but empty, initialize settings
        saveData('settings', { ...initialSettings, id: 'main_settings' }).catch(err => {
           // If save fails here, it's likely permission issue or bad config
           console.error("Failed to init settings", err);
        });
      }
      setIsDataLoaded(true);
    }, (error) => {
      console.error("Firebase Connection Error:", error);
      
      // Handle known errors - DO NOT reset config automatically on transient errors
      if (error.code === 'permission-denied') {
         setConfigError("اتصال مرفوض. تأكد من تفعيل Firestore في مشروعك.");
         setShowConfigScreen(true);
      } else if (error.code === 'unavailable' || (error.message && error.message.includes('project-id'))) {
         setConfigError("خطأ في الاتصال أو إعدادات المشروع (ID/Network).");
         // Do not resetConfig() here to avoid loop if it's just network
         setShowConfigScreen(true);
      } else if (error.code === 'unimplemented' || error.message.includes('Firestore')) {
         setConfigError("لم يتم تفعيل قاعدة البيانات (Firestore) في المشروع.");
         setShowConfigScreen(true);
      } else {
         // Generic connection error, maybe offline
         if (!isDataLoaded) setConnectionTakingLong(true);
      }
    });

    unsubscribes.push(settingsUnsub);

    if (!showConfigScreen) {
        // Only try other collections if settings connected (or attempting to)
        unsubscribes.push(subscribeToCollection('years', setYears));
        unsubscribes.push(subscribeToCollection('groups', setGroups));
        unsubscribes.push(subscribeToCollection('students', setStudents));
        unsubscribes.push(subscribeToCollection('assistants', setAssistants));
        unsubscribes.push(subscribeToCollection('results', setResults));
        unsubscribes.push(subscribeToCollection('assignments', setAssignments));
        unsubscribes.push(subscribeToCollection('submissions', setSubmissions));
        unsubscribes.push(subscribeToCollection('notifications', setNotifications));
        unsubscribes.push(subscribeToCollection('quizzes', setQuizzes));
        unsubscribes.push(subscribeToCollection('videoLessons', setVideoLessons));
        unsubscribes.push(subscribeToCollection('chatMessages', (data) => setChatMessages(data.sort((a,b) => parseInt(a.id.substr(1)) - parseInt(b.id.substr(1))))));
        unsubscribes.push(subscribeToCollection('educationalSources', setEducationalSources));
        unsubscribes.push(subscribeToCollection('inquiries', setInquiries));
        unsubscribes.push(subscribeToCollection('callLogs', setCallLogs));
        unsubscribes.push(subscribeToCollection('schedules', setSchedules));
        unsubscribes.push(subscribeToCollection('formulas', setFormulas));
        unsubscribes.push(subscribeToCollection('rewards', setRewards));
        unsubscribes.push(subscribeToCollection('redemptions', setRewardRedemptions));
    }

    return () => {
      unsubscribes.forEach(unsub => unsub());
    };
  }, [showConfigScreen]);

  useEffect(() => {
    localStorage.setItem('math_currentView', currentView);
    localStorage.setItem('math_activeControlTab', activeControlTab);
    
    try {
      localStorage.setItem('math_loggedUser', JSON.stringify(loggedUser));
    } catch (e) {
      console.error("Failed to save loggedUser to localStorage", e);
      // Attempt to save minimal info to avoid crash
      if (loggedUser && loggedUser.id) {
         try {
           localStorage.setItem('math_loggedUser', JSON.stringify({ id: loggedUser.id, role: loggedUser.role, name: loggedUser.name }));
         } catch (e2) {}
      }
    }
  }, [currentView, activeControlTab, loggedUser]);

  const addToast = useCallback((message: string, type: 'success' | 'error' | 'info') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);

  const handleUpdateSettings = (newSettings: PlatformSettings) => {
    saveData('settings', { ...newSettings, id: 'main_settings' });
  };

  const sendPushNotification = useCallback(async (title: string, body: string) => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'granted' && navigator.serviceWorker) {
      try {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification(title, {
          body: body,
          icon: settings.branding.logoUrl || 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png',
          dir: 'rtl',
          lang: 'ar'
        } as any);
      } catch (e) { console.error(e); }
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
      addToast(`مرحباً بك يا ${assistant.name.split(' ')[0]}! 🛠️`, 'success');
      return;
    }
    addToast('الكود غير صحيح', 'error');
  };

  const handleLogout = () => {
    setLoggedUser(null);
    setCurrentView(AppView.DASHBOARD);
    localStorage.removeItem('math_loggedUser');
  };

  const handleNavigate = (view: AppView | string) => {
    const isAssistant = loggedUser?.role === 'assistant';
    const permissions = isAssistant ? (loggedUser as Assistant).permissions : Object.values(AppView);
    if (isAssistant && !permissions.includes(view as AppView) && view !== AppView.DASHBOARD) {
      addToast('عذراً، لا تمتلك صلاحية الوصول لهذا القسم.', 'error');
      return;
    }
    const controlTabMapping: Record<string, string> = {
      [AppView.RESULTS]: 'results', [AppView.MANAGEMENT]: 'groups', [AppView.REWARDS]: 'store',
      [AppView.SETTINGS]: 'settings', [AppView.TEST_CENTER]: 'tech', [AppView.NOTIFICATIONS]: 'comms',
      [AppView.CALL_CENTER]: 'comms', [AppView.SCHEDULE]: 'groups', [AppView.LEADERBOARD]: 'comms', [AppView.SECTIONS]: 'sections'
    };
    if (controlTabMapping[view]) {
      setActiveControlTab(controlTabMapping[view]);
      setCurrentView(AppView.CONTROL_PANEL);
    } else {
      setCurrentView(view);
    }
  };

  const handleAttendanceChange = (id: string) => {
    const student = students.find(s => s.id === id);
    if (student) {
      const newAttendance = !student.attendance;
      updatePartialData('students', id, { 
        attendance: newAttendance,
        points: (student.points || 0) + (newAttendance ? 5 : 0)
      });
    }
  };

  const handleSelfRegistration = (newStudent: any) => {
    const studentData: Student = {
      ...newStudent,
      id: 's' + Date.now(),
      points: 0, score: 0, scoreHistory: [], badges: [], streaks: 0, deviceIds: [], isPaid: false
    };
    saveData('students', studentData);
    addToast('تم إرسال طلب تسجيلك بنجاح!', 'success');
    setCurrentView(AppView.DASHBOARD);
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
        return <Dashboard teacherName={settings.teacherName} settings={settings} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={handleNavigate} loggedUser={loggedUser} isConnected={isDataLoaded} />;
      
      case AppView.STUDENTS: 
        return <StudentList 
          students={students} groups={groups} years={years} notifications={notifications} 
          onAttendanceChange={handleAttendanceChange} onSendAlert={() => {}} 
          onDeleteStudent={(id) => removeData('students', id)} 
          onResetDevice={(id) => updatePartialData('students', id, { deviceIds: [] })} 
          onAddStudent={(s) => { saveData('students', s); addToast('تم الإضافة بنجاح', 'success'); }} 
          onUpdateStudent={(id, u) => updatePartialData('students', id, u)}
          teacherName={settings.teacherName} 
        />;

      case AppView.FILES:
        return (
          <div className="space-y-12">
            <FilesView 
              years={years} videoLessons={videoLessons} educationalSources={educationalSources} students={students} videoViews={[]} 
              onAddVideo={(v) => saveData('videoLessons', {...v, id: 'vid'+Date.now()})} 
              onDeleteVideo={(id) => removeData('videoLessons', id)} 
              onAddSource={(s) => saveData('educationalSources', s)} 
              onDeleteSource={(id) => removeData('educationalSources', id)} 
            />
            <div className="border-t border-slate-100 pt-12">
               <Formulas years={years} formulas={formulas} onAdd={(f) => saveData('formulas', {...f, id: 'frm'+Date.now()})} onDelete={(id) => removeData('formulas', id)} />
            </div>
          </div>
        );

      case AppView.ASSIGNMENTS:
        return (
          <AssignmentsView 
            assignments={assignments} submissions={submissions} students={students} years={years} teacherName={settings.teacherName} notation={settings.mathNotation} 
            onAdd={(a) => {
              saveData('assignments', a);
              if (a.status === 'active') sendPushNotification('واجب جديد', a.title);
            }} 
            onUpdate={(a) => { saveData('assignments', a); addToast('تم التحديث', 'success'); }}
            onDelete={(id) => removeData('assignments', id)} 
            onGrade={(sid, grade, feedback, correctedImg) => { 
              updatePartialData('submissions', sid, { grade, feedback, fileUrl: correctedImg || undefined, status: 'graded' });
              addToast('تم التصحيح', 'success'); 
            }} 
          />
        );

      case AppView.QUIZZES:
        return (
          <QuizGenerator 
            years={years} sources={educationalSources} notation={settings.mathNotation} 
            onPublish={(title, yId, qs) => { 
              saveData('quizzes', {id: 'q'+Date.now(), title, yearId: yId, date: new Date().toLocaleDateString('ar-EG'), type: 'native', questions: qs});
              sendPushNotification('اختبار جديد', title);
              addToast('تم النشر', 'success'); 
            }} 
          />
        );

      case AppView.LIVE_CLASS:
        return (
           <LiveClass 
            teacherName={settings.teacherName} settings={settings} 
            onUpdateSettings={handleUpdateSettings} onBroadcastToWhatsApp={() => addToast('تم التنبيه', 'info')} 
            onPostSummary={(src) => saveData('educationalSources', src)} 
          />
        );

      case AppView.CHAT:
        return (
          <div className="space-y-12">
            <ChatRoom 
              user={{id: loggedUser?.id || 'admin', name: loggedUser?.name || 'Admin', role: loggedUser?.role || 'teacher'}} 
              messages={chatMessages} years={years} students={students} 
              onSendMessage={(text, type, rid, audio) => saveData('chatMessages', {id: 'm'+Date.now(), senderId: loggedUser?.id || 'admin', senderName: loggedUser?.name || 'Admin', senderRole: loggedUser?.role || 'teacher', text, timestamp: new Date().toLocaleTimeString('ar-EG'), type, recipientId: rid, audioData: audio, yearId: 'all'})} 
              notation={settings.mathNotation} 
            />
            <div className="border-t border-slate-100 pt-12">
               <AISolver notation={settings.mathNotation} />
            </div>
          </div>
        );

      case AppView.SECTIONS:
        return <Sections sections={settings.customSections || []} onUpdateSections={(secs) => handleUpdateSettings({...settings, customSections: secs})} />;

      case AppView.STUDENT_PORTAL:
        const mockStudent: Student = {
          id: 'preview', studentCode: 'PREVIEW', name: 'معاينة المعلم', studentPhone: '', parentPhone: '', yearId: years[0]?.id, groupId: groups[0]?.id,
          attendance: true, score: 100, points: 500, avatar: settings.branding.heroImageUrl || '', scoreHistory: [], status: 'active', badges: [], streaks: 5, deviceIds: []
        };
        return (
          <div className="relative">
            <div className="fixed bottom-4 left-4 z-[1000]">
               <button onClick={() => setCurrentView(AppView.DASHBOARD)} className="bg-rose-600 text-white px-6 py-3 rounded-full font-black shadow-xl">إنهاء المعاينة</button>
            </div>
            <StudentPortal 
              student={mockStudent} assignments={assignments} submissions={submissions} quizzes={quizzes} results={results} settings={settings} videoLessons={videoLessons} notifications={notifications} groups={groups} educationalSources={educationalSources} schedules={schedules} formulas={formulas} rewards={rewards} redemptions={redemptions} 
              onQuizSubmit={()=>{}} onAssignmentSubmit={()=>{}} onSendMessage={()=>{}} 
              onMarkNotificationRead={(id) => {}} 
              onRedeemReward={()=>{}} onSpinWin={()=>{}} messages={chatMessages} years={years} students={students} onBack={() => setCurrentView(AppView.DASHBOARD)} onLogin={()=>{}}
              onUpdateStudent={()=>{}}
            />
          </div>
        );

      case AppView.CONTROL_PANEL:
        return (
          <AdminControlPanel 
            activeTab={activeControlTab} onTabChange={setActiveControlTab}
            years={years} groups={groups} students={students} notifications={notifications} results={results} settings={settings} assistants={assistants} inquiries={inquiries} callLogs={callLogs} schedules={schedules} rewards={rewards} redemptions={redemptions} quizzes={quizzes} assignments={assignments}
            onUpdateSettings={handleUpdateSettings} 
            onAddAssistant={(a) => saveData('assistants', a)}
            onDeleteAssistant={(id) => removeData('assistants', id)}
            onAddYear={(n) => saveData('years', {id: 'y'+Date.now(), name: n})}
            onAddGroup={(n, y, t, ty, g, c, p) => saveData('groups', {id: 'g'+Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: (p||'GRP')+Math.random().toString(36).substr(2,3).toUpperCase()})}
            onDeleteGroup={(id) => removeData('groups', id)}
            onUpdateInquiry={(id, status) => updatePartialData('inquiries', id, { status })}
            onAddCallLog={(log) => saveData('callLogs', {...log, id: 'log'+Date.now()})}
            onSendNotif={(n, p) => { saveData('notifications', {...n, id: 'nt'+Date.now(), timestamp: new Date().toLocaleTimeString('ar-EG'), isRead: false}); if(p) sendPushNotification(n.title, n.message); }}
            onDeleteNotif={(id) => removeData('notifications', id)}
            onMarkNotifRead={(id) => updatePartialData('notifications', id, { isRead: true })}
            onUpdateResult={(id, score) => updatePartialData('results', id, { score, status: 'graded' })}
            onAddReward={(r) => saveData('rewards', {...r, id: 'r'+Date.now()})}
            onDeleteReward={(id) => removeData('rewards', id)}
            onMarkRewardDelivered={(id) => updatePartialData('redemptions', id, { status: 'delivered' })}
            onAddSchedule={(s) => saveData('schedules', {...s, id: 'sch'+Date.now()})}
            onDeleteSchedule={(id) => removeData('schedules', id)}
            onMockData={(data) => {
               data.years.forEach(y => saveData('years', y));
               data.groups.forEach(g => saveData('groups', g));
               data.students.forEach(s => saveData('students', s));
               data.quizzes.forEach(q => saveData('quizzes', q));
               data.assignments.forEach(a => saveData('assignments', a));
            }}
            onEnterSimulation={(s) => setLoggedUser({...s, role: 'student'})}
            addToast={addToast} loggedUser={loggedUser}
          />
        );
      
      default: return <Dashboard teacherName={settings.teacherName} settings={settings} students={students} quizzes={quizzes} assignments={assignments} submissions={submissions} onNavigate={handleNavigate} />;
    }
  };

  if (showConfigScreen) return <ConfigScreen onSave={saveConfig} initialError={configError} />;

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center text-white font-['Cairo']">
         <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mb-6"></div>
         <h2 className="text-xl font-black mb-2 animate-pulse">جاري الاتصال بقاعدة البيانات...</h2>
         {connectionTakingLong && (
           <div className="mt-8 animate-fadeIn max-w-sm space-y-4">
              <p className="text-slate-400 text-sm font-medium">يبدو أن هناك مشكلة في الاتصال أو الإعدادات.</p>
              <button 
                onClick={() => { resetConfig(); setShowConfigScreen(true); }}
                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-all"
              >
                إعادة ضبط الإعدادات ⚙️
              </button>
           </div>
         )}
      </div>
    );
  }

  if (!loggedUser) {
    if (currentView === AppView.REGISTRATION) {
      return <Registration years={years} groups={groups} onRegister={handleSelfRegistration} onBack={() => setCurrentView(AppView.DASHBOARD)} teacherName={settings.teacherName} />;
    }
    return (
      <>
        <InstallPWA />
        <LandingPage teacherName={settings.teacherName} platformName={settings.platformName} settings={settings} onStudentEntry={() => setLoggedUser({id:'guest', role:'student'})} onTeacherEntry={handleAdminLogin} onParentEntry={() => setLoggedUser({id:'parent_guest', role:'parent'})} onAssistantEntry={handleAdminLogin} onStudentRegister={() => setCurrentView(AppView.REGISTRATION)} />
      </>
    );
  }

  if (loggedUser.role === 'student' && loggedUser.id !== 'guest') {
    return (
      <>
        <InstallPWA />
        <StudentPortal 
          student={students.find(s => s.id === loggedUser.id) || loggedUser} 
          assignments={assignments} submissions={submissions} quizzes={quizzes} results={results} settings={settings} videoLessons={videoLessons} notifications={notifications} groups={groups} educationalSources={educationalSources} schedules={schedules} formulas={formulas} rewards={rewards} redemptions={redemptions} 
          onQuizSubmit={(r) => saveData('results', r)} 
          onAssignmentSubmit={(s) => saveData('submissions', { ...s, id: 'sub' + Date.now(), status: 'pending' })} 
          onSendMessage={(t, ty, rid, audio) => saveData('chatMessages', {id: 'm'+Date.now(), senderId: loggedUser.id, senderName: loggedUser.name, senderRole: 'student', text: t, timestamp: new Date().toLocaleTimeString('ar-EG'), type: ty, recipientId: rid, audioData: audio, yearId: loggedUser.yearId})} 
          onMarkNotificationRead={(id) => { 
             if (loggedUser.id) {
               updatePartialData('students', loggedUser.id, { lastReadNotificationId: id });
             }
          }} 
          onRedeemReward={(rid) => {
             const reward = rewards.find(r => r.id === rid);
             const currentPoints = students.find(s => s.id === loggedUser.id)?.points || 0;
             if (reward && currentPoints >= reward.cost) {
                saveData('redemptions', {id: 'red'+Date.now(), studentId: loggedUser.id, studentName: loggedUser.name, rewardId: rid, rewardTitle: reward.title, status: 'pending', timestamp: new Date().toLocaleDateString('ar-EG')});
                updatePartialData('students', loggedUser.id, { points: currentPoints - reward.cost });
                addToast('تم استبدال الجائزة!', 'success');
             }
          }} 
          onSpinWin={(p) => {
             const s = students.find(x => x.id === loggedUser.id);
             if(s) updatePartialData('students', s.id, { points: (s.points || 0) + p, lastSpinDate: new Date().toISOString() });
          }}
          onUpdateStudent={(updates) => updatePartialData('students', loggedUser.id, updates)}
          messages={chatMessages} years={years} students={students} onBack={handleLogout} 
          onLogin={(code) => {
            const student = students.find(st => st.studentCode === code);
            if (!student) { addToast('الكود غير صحيح', 'error'); return; }
            
            let deviceId = localStorage.getItem('math_device_id');
            if (!deviceId) { deviceId = 'dev_' + Date.now(); localStorage.setItem('math_device_id', deviceId); }
            
            const registered = student.deviceIds || [];
            if (registered.includes(deviceId) || registered.length < settings.maxDevicesPerStudent) {
               if(!registered.includes(deviceId)) updatePartialData('students', student.id, { deviceIds: [...registered, deviceId] });
               setLoggedUser({...student, role: 'student'});
            } else {
               addToast('تجاوزت عدد الأجهزة المسموح به', 'error');
            }
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
               else addToast('رقم غير مسجل', 'error');
            }}
            onSendInquiry={(inq) => { saveData('inquiries', inq); addToast('تم الإرسال', 'success'); }}
         />
       </>
     );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex overflow-hidden font-['Cairo']" dir="rtl">
      <InstallPWA />
      <Sidebar 
        currentView={currentView} setView={handleNavigate} settings={settings} loggedUser={loggedUser} onUpdateSettings={handleUpdateSettings} 
        unreadNotifCount={notifications.filter(n => !n.isRead).length}
        pendingCount={submissions.filter(s => s.status === 'pending').length}
        isConnected={isDataLoaded}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50/30 no-scrollbar">
        <div className="p-4 lg:p-12 max-w-7xl mx-auto">{renderTeacherView()}</div>
      </main>
      <BottomNav currentView={currentView} setView={handleNavigate} settings={settings} pendingCount={submissions.filter(s => s.status === 'pending').length} loggedUser={loggedUser} />
      <ToastContainer toasts={toasts} onClose={(id) => setToasts(prev => prev.filter(t => t.id !== id))} />
    </div>
  );
};

export default App;
