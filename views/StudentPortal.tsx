
import React, { useState, useMemo, useEffect } from 'react';
import { Student, QuizResult, Assignment, PlatformSettings, VideoLesson, Quiz, AssignmentSubmission, ChatMessage, Year, AppNotification, Group, EducationalSource, CustomSection, ScheduleEntry, MathFormula, PlatformReward, RewardRedemption } from '../types';
import MathRenderer from '../components/MathRenderer';
import ProtectedVideo from '../components/ProtectedVideo';
import Notifications from './Notifications';
import ChatRoom from './ChatRoom';
import AISolver from './AISolver';
import Rewards from './Rewards';
import LuckyWheel from '../components/LuckyWheel';

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
  onSendMessage: (text: string, type: 'group' | 'private', recipientId?: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onRedeemReward: (rewardId: string) => void;
  onSpinWin?: (points: number) => void;
  messages: ChatMessage[];
  years: Year[];
  students: Student[];
  onBack: () => void;
}

const StudentPortal: React.FC<StudentPortalProps> = ({ 
  student, assignments, submissions, quizzes, results, settings, videoLessons, notifications,
  groups, educationalSources, schedules, formulas, rewards, redemptions,
  onQuizSubmit, onAssignmentSubmit, onLogin, onSendMessage, onMarkNotificationRead, onRedeemReward, onSpinWin, messages, years, students, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'lessons' | 'quizzes' | 'rewards' | 'library' | 'schedule' | 'formulas' | 'chat' | 'notifications' | 'ai_solver' | string>('home');
  const [loginCode, setLoginCode] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoLesson | null>(null);
  const [showWheel, setShowWheel] = useState(false);

  const studentYear = useMemo(() => years.find(y => y.id === student?.yearId), [student, years]);
  const mySchedule = useMemo(() => schedules.filter(s => s.groupId === student?.groupId), [schedules, student]);
  const myFormulas = useMemo(() => formulas.filter(f => f.yearId === student?.yearId || f.yearId === ''), [formulas, student]);
  const unreadCount = notifications.filter(n => !n.isRead && (n.targetStudentId === student?.id || n.targetYearId === student?.yearId)).length;

  const canSpin = useMemo(() => {
    if (!student?.lastSpinDate) return true;
    const lastDate = new Date(student.lastSpinDate).getTime();
    const now = new Date().getTime();
    return (now - lastDate) >= (24 * 60 * 60 * 1000); // 24 ساعة
  }, [student?.lastSpinDate]);

  if (!student || student.id === 'guest_login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0f1e] p-6 font-['Cairo'] relative overflow-hidden text-right" dir="rtl">
        <div className="max-w-md w-full bg-white p-10 md:p-14 rounded-[3.5rem] shadow-2xl text-center space-y-10 animate-slideUp relative z-10 border border-slate-100">
           <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] mx-auto flex items-center justify-center text-white text-5xl font-black shadow-2xl rotate-3">∑</div>
           <div className="space-y-3">
             <h2 className="text-3xl font-black text-slate-800 tracking-tight">بوابة الطلاب</h2>
             <p className="text-slate-400 font-bold text-sm">أدخل كود الاشتراك الخاص بك للبدء</p>
           </div>
           <div className="space-y-4">
              <input 
                type="text" 
                placeholder="الكود الخاص بك" 
                className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-2xl font-black text-center text-xl outline-none transition-all shadow-inner" 
                value={loginCode} 
                onChange={e => setLoginCode(e.target.value.toUpperCase())} 
              />
              <button onClick={() => onLogin(loginCode)} className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-xl shadow-blue-200 transition-all transform active:scale-95">دخول للمنصة 🚀</button>
           </div>
           <button onClick={onBack} className="text-slate-400 font-bold text-xs hover:text-blue-600 transition-colors">الرجوع للرئيسية</button>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
           <div className="space-y-10 animate-fadeIn">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-10 md:p-14 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full"></div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                  <div className="space-y-6 text-center md:text-right">
                    <h2 className="text-3xl md:text-5xl font-black leading-tight">أهلاً بك يا بطل 🎓</h2>
                    <p className="text-indigo-200 font-medium opacity-90 max-w-lg leading-relaxed">{settings.studentWelcomeMsg}</p>
                  </div>
                  
                  {/* Lucky Wheel Entrance */}
                  <div 
                    onClick={() => canSpin ? setShowWheel(true) : alert('لقد استهلكت فرصتك اليوم، عد غداً! ⏳')}
                    className={`relative p-8 rounded-3xl border-2 transition-all cursor-pointer group ${canSpin ? 'bg-amber-500/10 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)] animate-pulse hover:scale-105' : 'bg-white/5 border-white/10 grayscale opacity-50'}`}
                  >
                     <div className="text-center space-y-2">
                        <span className="text-4xl block group-hover:rotate-12 transition-transform">🎡</span>
                        <p className="text-[10px] font-black text-white uppercase tracking-widest">تحدي الحظ اليومي</p>
                        <p className="text-[9px] font-bold text-amber-200">{canSpin ? 'اضغط للمحاولة!' : 'متاح غداً'}</p>
                     </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                 <div onClick={() => setActiveTab('schedule')} className="bg-white p-6 rounded-[2.5rem] shadow-lg text-center border border-indigo-50 cursor-pointer hover:scale-105 transition-all">
                    <span className="text-2xl">📅</span>
                    <p className="text-xs font-black text-slate-800 mt-2">مواعيد الحصص</p>
                    <p className="text-[8px] font-black text-slate-400 uppercase">الجدول الدراسي</p>
                 </div>
                 <div onClick={() => setActiveTab('rewards')} className="bg-white p-6 rounded-[2.5rem] shadow-lg text-center border border-amber-100 cursor-pointer hover:scale-105 transition-all group">
                    <span className="text-2xl group-hover:rotate-12 transition-transform">🎁</span>
                    <p className="text-xs font-black text-slate-800 mt-2">متجر الهدايا</p>
                    <p className="text-[8px] font-black text-amber-500 uppercase">رصيدك: {student.points}</p>
                 </div>
                 <div className="bg-white p-6 rounded-[2.5rem] shadow-lg text-center border border-indigo-50">
                    <span className="text-2xl">✨</span>
                    <p className="text-2xl font-black text-slate-800 mt-2">{student.points}</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">نقاط التميز</p>
                 </div>
                 <div className="bg-white p-6 rounded-[2.5rem] shadow-lg text-center border border-indigo-50">
                    <span className="text-2xl">📈</span>
                    <p className="text-2xl font-black text-slate-800 mt-2">{student.score}%</p>
                    <p className="text-[9px] font-black text-slate-400 uppercase">المستوى العام</p>
                 </div>
              </div>
           </div>
        );
      case 'rewards':
        return <Rewards rewards={rewards} redemptions={redemptions} student={student} role="student" onAddReward={()=>{}} onDeleteReward={()=>{}} onRedeem={onRedeemReward} onMarkDelivered={()=>{}} />;
      case 'schedule':
        return (
           <div className="space-y-10 animate-fadeIn">
              <h2 className="text-3xl font-black text-slate-800">جدول مواعيدك 📅</h2>
              <div className="space-y-4">
                 {mySchedule.length > 0 ? mySchedule.map(entry => (
                   <div key={entry.id} className="p-8 bg-white rounded-[3rem] border border-slate-100 shadow-xl flex justify-between items-center">
                      <div className="flex gap-6 items-center">
                         <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-3xl font-black">{entry.day[0]}</div>
                         <div>
                            <h4 className="text-xl font-black text-slate-800">{entry.topic || 'حصة أساسية'}</h4>
                            <p className="text-slate-400 font-bold text-sm">{entry.day} • الساعة {entry.time}</p>
                         </div>
                      </div>
                      <span className="px-5 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">{entry.type === 'online' ? 'بث أونلاين' : 'حضور في السنتر'}</span>
                   </div>
                 )) : <div className="py-20 text-center opacity-30">لا توجد مواعيد حالياً</div>}
              </div>
           </div>
        );
      case 'formulas':
        return (
           <div className="space-y-10 animate-fadeIn">
              <h2 className="text-3xl font-black text-slate-800">بنك القوانين 📐</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 {myFormulas.map(f => (
                   <div key={f.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-xl">
                      <h3 className="text-xl font-black text-indigo-600 mb-6 flex items-center gap-3">
                         <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                         {f.title}
                      </h3>
                      <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100"><MathRenderer content={f.content} /></div>
                   </div>
                 ))}
              </div>
           </div>
        );
      case 'notifications':
        return <Notifications notifications={notifications} years={years} groups={groups} role="student" currentStudentId={student.id} currentYearId={student.yearId} onMarkRead={onMarkNotificationRead} onSend={()=>{}} />;
      case 'ai_solver':
        return <AISolver notation={settings.mathNotation} />;
      default: return <div>جاري التحميل...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-40 font-['Cairo'] text-right" dir="rtl">
      <nav className="glass-nav sticky top-0 z-[100] px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
             <img src={student.avatar} className="w-12 h-12 rounded-2xl border-2 border-white shadow-md object-cover" alt="" />
             <div>
                <h3 className="font-black text-slate-800 text-sm">{student.name}</h3>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{studentYear?.name}</span>
             </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setActiveTab('notifications')} className="relative w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center hover:bg-white shadow-sm">
               <span className="text-xl">🔔</span>
               {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white">{unreadCount}</span>}
            </button>
            <button onClick={onBack} className="px-5 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">خروج</button>
          </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
         {selectedVideo ? (
            <div className="space-y-8 animate-fadeIn">
               <button onClick={() => setSelectedVideo(null)} className="px-6 py-2 bg-slate-900 text-white rounded-xl text-xs font-black">← العودة</button>
               <ProtectedVideo src={selectedVideo.youtubeUrl} title={selectedVideo.title} watermarkText={`${student.name} | ${student.studentCode}`} enabled={settings.watermarkEnabled} />
            </div>
         ) : renderContent()}
      </main>

      {showWheel && (
        <LuckyWheel 
          onWin={(p) => { onSpinWin?.(p); setShowWheel(false); }}
          onClose={() => setShowWheel(false)}
        />
      )}

      {/* Floating Bottom Navigation */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[150] w-[96%] max-w-5xl">
         <nav className="bg-[#0f172a]/95 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white/10 p-2 flex justify-around items-center h-22 overflow-x-auto no-scrollbar">
            {[
              { id: 'home', i: '🏠', l: 'الرئيسية' },
              { id: 'lessons', i: '🎬', l: 'الدروس' },
              { id: 'rewards', i: '🎁', l: 'الهدايا' },
              { id: 'quizzes', i: '📝', l: 'الاختبارات' },
              { id: 'ai_solver', i: '🧠', l: 'المساعد' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 flex flex-col items-center justify-center rounded-[2.5rem] h-full min-w-[70px] transition-all duration-300 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-xl' : 'text-slate-500'}`}>
                <span className="text-xl mb-1">{tab.i}</span>
                <span className="text-[8px] font-black uppercase">{tab.l}</span>
              </button>
            ))}
         </nav>
      </div>
    </div>
  );
};

export default StudentPortal;
