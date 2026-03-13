
import React, { useState } from 'react';
import { AppView, ToastType } from './types';

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
import CoursesView from './views/CoursesView';
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
import QuestionBank from './views/QuestionBankView';

// Components
import Sidebar from './components/Sidebar';
import BottomNav from './components/BottomNav';
import { ToastContainer, ToastProps } from './components/Toast';
import InstallPWA from './components/InstallPWA';

// Services & Config
import { isUsingDefaultConfig } from './firebaseConfig';

// Hooks
import { useDataManager, genId } from './hooks/useDataManager';
import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';

// ─────────────────────────────────────────────────────────────────────────────

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView | string>(AppView.DASHBOARD);
  const [adminPanelTab, setAdminPanelTab] = useState('groups');
  const [toasts, setToasts] = useState<Omit<ToastProps, 'onClose'>[]>([]);
  const [isDemoMode] = useState(isUsingDefaultConfig());

  // ─── Toast Helpers ───
  const addToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };
  const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

  // ─── Tenant Hook ───
  const { tenant, isLoading: isTenantLoading, isExpired, tenantSettings } = useTenant();

  // ─── Auth Hook ───
  const { currentUser, setCurrentUser, handleUnifiedLogin, handleLogout, loadPersistedUser } = useAuth({
    isDemoMode, addToast,
  });

  // Load persisted user on first render
  React.useEffect(() => { loadPersistedUser(); }, []);

  // ─── Data Hook ───
  const {
    students, years, groups, quizzes, assignments, submissions, results,
    notifications, videoLessons, educationalSources, messages, assistants,
    schedules, formulas, folders, courses, videoViews, settings: rawSettings,
    setStudents, setYears, setGroups, setSettings,
    persistData, handleVideoProgress,
  } = useDataManager(isDemoMode, addToast, currentUser);

  // دمج tenant branding مع الـ settings
  const settings = { ...rawSettings, ...tenantSettings };

  // Tenant expired or not found
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-['Cairo']" dir="rtl">
        <div className="text-center">
          <p className="text-4xl mb-4">⛔</p>
          <h2 className="text-2xl font-black mb-2">المنصة غير متاحة</h2>
          <p className="text-slate-400">انتهى الاشتراك أو المنصة غير موجودة. تواصل مع الدعم.</p>
        </div>
      </div>
    );
  }

  if (isTenantLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" dir="rtl">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const fontStyle = { fontFamily: settings.branding.fontFamily || 'Cairo' };

  // ─────────────── NO USER → Login / Registration ───────────────
  if (!currentUser) {
    if (currentView === AppView.REGISTRATION) {
      return (
        <div style={fontStyle}>
          <Registration
            years={years}
            groups={groups}
            onRegister={(data) => {
              const newStudent = {
                ...data, id: 's' + Date.now(), points: 0, score: 0,
                scoreHistory: [], badges: [], streaks: 0, deviceIds: [],
              };
              persistData('students', newStudent, 'save');
              addToast('تم إرسال طلب التسجيل بنجاح، يمكنك الدخول الآن', 'success');
              handleUnifiedLogin('student', newStudent.studentCode || 'PENDING', [...students, newStudent], settings);
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
          onUnifiedLogin={(r, c) => handleUnifiedLogin(r, c, students, settings)}
          onStudentRegister={() => setCurrentView(AppView.REGISTRATION)}
        />
        <InstallPWA />
      </div>
    );
  }

  // ─────────────── STUDENT PORTAL ───────────────
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
          courses={courses}
          onQuizSubmit={(res) => persistData('results', res, 'save')}
          onAssignmentSubmit={(sub) => persistData('submissions', { ...sub, id: 'sub' + Date.now(), status: 'pending' }, 'save')}
          onLogin={() => { }}
          onSendMessage={(text, type, recipientId, audioData) => {
            persistData('messages', {
              id: genId('msg_'), text, type, recipientId, audioData,
              senderId: currentUser.id, senderName: currentUser.name, senderRole: 'student',
              timestamp: new Date().toLocaleTimeString('ar-EG'), yearId: currentUser.yearId,
            }, 'save');
          }}
          onMarkNotificationRead={(id) => {
            const notif = notifications.find(n => n.id === id);
            if (notif && !notif.isRead) persistData('notifications', { ...notif, isRead: true }, 'update');
          }}
          onUpdateStudent={(updates) => {
            persistData('students', { id: currentUser.id, ...updates }, 'update');
            setCurrentUser({ ...currentUser, ...updates });
          }}
          onRateSource={(srcId, rating) => {
            const source = educationalSources.find(s => s.id === srcId);
            if (source) {
              const newRatings = [...(source.ratings || []).filter(r => r.studentId !== currentUser.id), { studentId: currentUser.id, value: rating }];
              persistData('educationalSources', { id: srcId, ratings: newRatings }, 'update');
            }
          }}
          onVideoProgress={(videoId, percent) => handleVideoProgress(videoId, percent, currentUser.id)}
          onBack={() => handleLogout(setCurrentView, AppView.DASHBOARD)}
          addToast={addToast}
          rewards={[]}
          redemptions={[]}
          onRedeemReward={() => { }}
        />
        <InstallPWA />
      </div>
    );
  }

  // ─────────────── PARENT PORTAL ───────────────
  if (currentUser.role === 'parent') {
    return (
      <div style={fontStyle}>
        <ParentPortal
          student={currentUser}
          results={results}
          onLogin={() => { }}
          settings={settings}
          onSendInquiry={() => { addToast('تم إرسال الطلب', 'success'); }}
          onBack={() => handleLogout(setCurrentView, AppView.DASHBOARD)}
        />
        <InstallPWA />
      </div>
    );
  }

  // ─────────────── TEACHER / ASSISTANT PANEL ───────────────
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

      case AppView.STUDENT_PORTAL: {
        const mockStudentForTeacher = {
          id: 'teacher-view', name: currentUser.name, studentCode: 'TEACHER',
          studentPhone: '0000000000', parentPhone: '0000000000',
          yearId: years[0]?.id || 'y1', groupId: groups[0]?.id || 'g1',
          attendance: true, score: 95, points: 4500,
          avatar: settings.branding.heroImageUrl || 'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=Teacher',
          scoreHistory: [80, 90, 95], status: 'active' as const, badges: [], streaks: 10, deviceIds: [], isPaid: true,
        };
        return (
          <StudentPortal
            student={mockStudentForTeacher}
            assignments={assignments} submissions={[]} quizzes={quizzes} results={[]}
            settings={settings} videoLessons={videoLessons} notifications={notifications}
            groups={groups} educationalSources={educationalSources} schedules={schedules}
            formulas={formulas} messages={[]} years={years} students={students} courses={courses}
            onQuizSubmit={() => { }} onAssignmentSubmit={() => { }} onLogin={() => { }}
            onSendMessage={() => { }} onMarkNotificationRead={() => { }}
            onUpdateStudent={() => { }} onRateSource={() => { }}
            onBack={() => setCurrentView(AppView.DASHBOARD)}
            addToast={addToast} rewards={[]} redemptions={[]} onRedeemReward={() => { }}
          />
        );
      }

      case AppView.STUDENTS:
        return (
          <StudentList
            students={students} groups={groups} years={years} notifications={notifications}
            submissions={submissions} results={results}
            teacherName={currentUser.name}
            onAttendanceChange={(id) => {
              const s = students.find(x => x.id === id);
              if (s) persistData('students', { id, attendance: !s.attendance }, 'update');
            }}
            onSendAlert={(s, m, c) => addToast(`تم إرسال تنبيه لـ ${s.name}`, 'info')}
            onDeleteStudent={(id) => { if (window.confirm('حذف الطالب؟')) persistData('students', id, 'delete'); }}
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
            onAdd={(a) => {
              persistData('assignments', a, 'save');
              persistData('notifications', {
                id: 'n' + Date.now(), title: 'واجب جديد 📝',
                message: `تم إضافة واجب جديد: ${a.title}. موعد التسليم: ${a.dueDate}`,
                type: 'academic', targetYearId: a.yearId,
                timestamp: new Date().toLocaleString('ar-EG'), isRead: false, isPush: true,
              }, 'save');
              addToast('تم إضافة الواجب', 'success');
            }}
            onUpdate={(a) => { persistData('assignments', a, 'update'); addToast('تم تحديث الواجب', 'success'); }}
            onDelete={(id) => { if (window.confirm('حذف الواجب؟')) persistData('assignments', id, 'delete'); }}
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
            settings={settings} quizzes={quizzes}
            onDelete={(id) => persistData('quizzes', id, 'delete')}
            onPublish={(title, yearId, qs, type, link, file) => {
              const newQuiz = {
                id: genId('qz_'), title, yearId,
                date: new Date().toLocaleDateString('ar-EG'),
                type, questions: qs || [], externalLink: link, fileUrl: file,
              };
              persistData('quizzes', newQuiz, 'save');
              persistData('notifications', {
                id: genId('n_'), title: 'اختبار جديد ⚡',
                message: `تم نشر اختبار جديد: ${title}. حظاً موفقاً!`,
                type: 'academic', targetYearId: yearId,
                timestamp: new Date().toLocaleString('ar-EG'), isRead: false, isPush: true,
              }, 'save');
              addToast('تم نشر الاختبار', 'success');
            }}
          />
        );

      case AppView.QUESTION_BANK:
        return (
          <QuestionBank 
            years={years}
            settings={settings}
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

      case AppView.COURSES:
        return (
          <CoursesView
            courses={courses} years={years} videoLessons={videoLessons} educationalSources={educationalSources}
            onAddCourse={(c) => { persistData('courses', c, 'save'); addToast('تم إضافة الكورس', 'success'); }}
            onUpdateCourse={(c) => { persistData('courses', c, 'update'); addToast('تم تحديث الكورس', 'success'); }}
            onDeleteCourse={(id) => { persistData('courses', id, 'delete'); addToast('تم حذف الكورس', 'success'); }}
          />
        );

      case AppView.FILES:
        return (
          <FilesView
            years={years} videoLessons={videoLessons} educationalSources={educationalSources}
            students={students} videoViews={videoViews} folders={folders}
            onAddVideo={(v) => { persistData('videoLessons', { ...v, id: genId('vid_') }, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteVideo={(id) => persistData('videoLessons', id, 'delete')}
            onAddSource={(s) => { persistData('educationalSources', s, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteSource={(id) => persistData('educationalSources', id, 'delete')}
            onAddFolder={(f) => { persistData('folders', { ...f, id: genId('fld_') }, 'save'); addToast('تم إنشاء المجلد', 'success'); }}
            onDeleteFolder={(id) => persistData('folders', id, 'delete')}
            settings={settings}
          />
        );

      case AppView.MANAGEMENT:
        return (
          <Management
            years={years} groups={groups} students={students}
            teacherName={currentUser.name} platformName={settings.platformName}
            onAddYear={(n) => { persistData('years', { id: genId('y_'), name: n }, 'save'); }}
            onAddGroup={(n, y, t, ty, g, c, p) => {
              persistData('groups', { id: genId('g_'), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: p + (Math.floor(Math.random() * 1000)) }, 'save');
            }}
            onDeleteGroup={(id) => persistData('groups', id, 'delete')}
          />
        );

      case AppView.RESULTS:
        return (
          <QuizResults
            results={results} students={students} notifications={notifications} notation={settings.mathNotation}
            settings={settings}
            onIssueCertificate={() => { }}
            onUpdateResult={(id, s, f) => { persistData('results', { id, score: s, feedback: f, status: 'graded' }, 'update'); addToast('تم الرصد', 'success'); }}
          />
        );

      case AppView.CHAT:
        return (
          <ChatRoom
            user={currentUser} messages={messages} years={years} students={students}
            notation={settings.mathNotation} educationalSources={educationalSources}
            onSendMessage={(text, type, recId, audio) => {
              persistData('messages', {
                id: genId('m_'), text, type, recipientId: recId, audioData: audio,
                senderId: currentUser.id, senderName: currentUser.name, senderRole: 'teacher',
                timestamp: new Date().toLocaleTimeString('ar-EG'), yearId: 'all',
              }, 'save');
            }}
          />
        );

      case AppView.SETTINGS:
        return (
          <Settings
            settings={settings} assistants={assistants} students={students}
            submissions={submissions} notifications={notifications}
            onUpdate={(s) => { setSettings(s); persistData('settings', s, 'update'); addToast('تم الحفظ', 'success'); }}
            onAddAssistant={(a) => { persistData('assistants', a, 'save'); addToast('تمت الإضافة', 'success'); }}
            onDeleteAssistant={(id) => persistData('assistants', id, 'delete')}
          />
        );

      case AppView.NOTIFICATIONS:
        return (
          <Notifications
            notifications={notifications} years={years} groups={groups} role="teacher"
            onSend={(n, push) => {
              persistData('notifications', { ...n, id: 'n' + Date.now(), timestamp: new Date().toLocaleString('ar-EG'), isRead: false, isPush: push }, 'save');
              addToast('تم الإرسال', 'success');
            }}
            onMarkRead={(id) => {
              const notif = notifications.find(n => n.id === id);
              if (notif && !notif.isRead) persistData('notifications', { ...notif, isRead: true }, 'update');
            }}
            onDelete={(id) => persistData('notifications', id, 'delete')}
          />
        );

      case AppView.LEADERBOARD:
        return <Leaderboard students={students} years={years} />;

      case AppView.SCHEDULE:
        return (
          <Schedules
            groups={groups} schedules={schedules}
            onAdd={(s) => persistData('schedules', { ...s, id: 'sch' + Date.now() }, 'save')}
            onDelete={(id) => persistData('schedules', id, 'delete')}
          />
        );

      case AppView.FORMULAS:
        return (
          <Formulas
            years={years} formulas={formulas}
            onAdd={(f) => persistData('formulas', { ...f, id: 'frm' + Date.now() }, 'save')}
            onDelete={(id) => persistData('formulas', id, 'delete')}
          />
        );

      case AppView.TEST_CENTER:
        return (
          <TestCenter
            students={students} years={years} groups={groups} quizzes={quizzes}
            assignments={assignments} settings={settings} addToast={addToast}
            onMockData={(d) => { setStudents(d.students); setYears(d.years); setGroups(d.groups); }}
            onEnterSimulation={(s) => setCurrentUser({ ...s, role: 'student' })}
          />
        );

      case AppView.LAUNCH_GUIDE:
        return <LaunchGuide groups={groups} years={years} teacherName={settings.teacherName} platformName={settings.platformName} addToast={addToast} />;

      case AppView.CONTROL_PANEL:
        return (
          <AdminControlPanel
            activeTab={adminPanelTab}
            onTabChange={setAdminPanelTab}
            years={years} groups={groups} students={students} notifications={notifications}
            results={results} settings={settings} assistants={assistants} schedules={schedules}
            quizzes={quizzes} assignments={assignments} submissions={submissions}
            onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }}
            onAddAssistant={(a) => persistData('assistants', a, 'save')}
            onDeleteAssistant={(id) => persistData('assistants', id, 'delete')}
            onAddYear={(n) => persistData('years', { id: 'y' + Date.now(), name: n }, 'save')}
            onAddGroup={(n, y, t, ty, g, c, p) => persistData('groups', { id: 'g' + Date.now(), name: n, yearId: y, time: t, type: ty, gender: g, capacity: c, codePrefix: p, joinCode: p + (Math.floor(Math.random() * 1000)) }, 'save')}
            onDeleteGroup={(id) => persistData('groups', id, 'delete')}
            onSendNotif={(n) => persistData('notifications', { ...n, id: 'n' + Date.now() }, 'save')}
            onDeleteNotif={(id) => persistData('notifications', id, 'delete')}
            onMarkNotifRead={() => { }}
            onUpdateResult={(id, s, f) => persistData('results', { id, score: s, feedback: f, status: 'graded' }, 'update')}
            onAddSchedule={(s) => persistData('schedules', { ...s, id: 'sch' + Date.now() }, 'save')}
            onDeleteSchedule={(id) => persistData('schedules', id, 'delete')}
            onMockData={() => { }}
            onEnterSimulation={(s) => setCurrentUser({ ...s, role: 'student' })}
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

      default: {
        const customSec = settings.customSections?.find(s => s.id === currentView);
        if (customSec) {
          return (
            <div className="max-w-4xl mx-auto p-8 bg-white rounded-[3rem] shadow-xl text-right animate-slideUp">
              <h2 className="text-3xl font-black mb-6">{customSec.title}</h2>
              <div className="prose prose-lg max-w-none">{customSec.content}</div>
            </div>
          );
        }
        return (
          <Dashboard
            teacherName={currentUser.name} platformName={settings.platformName}
            students={students} quizzes={quizzes} assignments={assignments}
            submissions={submissions} settings={settings}
            onNavigate={setCurrentView} loggedUser={currentUser}
          />
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex" style={fontStyle}>
      {/* Sidebar (Teacher) */}
      <Sidebar
        currentView={currentView as AppView}
        setView={setCurrentView}
        onLogout={() => handleLogout(setCurrentView, AppView.DASHBOARD)}
        settings={settings}
        loggedUser={currentUser}
        isConnected={!isDemoMode}
        onUpdateSettings={(s) => { setSettings(s); persistData('settings', s, 'update'); }}
      />

      {/* Page Content */}
      <main className="flex-1 lg:mr-72 min-h-screen pb-20 lg:pb-0">
        <div className="max-w-screen-2xl mx-auto p-4 md:p-6 lg:p-8">
          {renderTeacherContent()}
        </div>
      </main>

      {/* Bottom Nav (Mobile) */}
      <BottomNav
        currentView={currentView as AppView}
        setView={setCurrentView}
        settings={settings}
        loggedUser={currentUser}
        onLogout={() => handleLogout(setCurrentView, AppView.DASHBOARD)}
      />

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />

      <InstallPWA />
    </div>
  );
};

export default App;
