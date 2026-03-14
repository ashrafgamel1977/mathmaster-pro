
import React, { useState, useMemo } from 'react';
import { Student, Quiz, Assignment, AssignmentSubmission, AppView, PlatformSettings, Group, QuizResult } from '../types';
import { analyzeStudentPerformance, getWeakPoints } from '../services/analyticsService';
import MathRenderer from '../components/MathRenderer';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, TrendingUp, BookOpen, Award, Clock, AlertTriangle, 
  Search, Activity, FileText, Bell, ShieldCheck, Video, BarChart2,
  ChevronLeft, Command
} from 'lucide-react';

interface DashboardProps {
  teacherName: string;
  platformName?: string;
  students: Student[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  groups?: Group[]; 
  settings?: PlatformSettings;
  results?: QuizResult[]; 
  onNavigate?: (view: AppView) => void;
  loggedUser?: any;
  isConnected?: boolean;
  onUpdateSettings?: (settings: PlatformSettings) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ 
  teacherName, 
  students, 
  assignments, 
  submissions, 
  groups = [],
  results = [], 
  onNavigate, 
  isConnected = false,
}) => {
  // --- Computed Data ---
  const pendingGrading = submissions.filter(s => s.status === 'pending');
  const activeAssignments = assignments.filter(a => a.status === 'active');
  const lowAttendanceStudents = students.filter(s => s.attendance === false && s.streaks < 2);
  const totalPoints = students.reduce((acc, s) => acc + (s.points || 0), 0);
  
  // --- States ---
  const [commandQuery, setCommandQuery] = useState('');
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [radarType, setRadarType] = useState<'late' | 'weak' | null>(null);

  // --- Helpers ---
  const greeting = useMemo(() => {
    const h = new Date().getHours();
    return h < 12 ? 'صباح الخير' : h < 18 ? 'مساء الخير' : 'أمسية سعيدة';
  }, []);

  const dailyStats = useMemo(() => {
      const totalStudents = students.length;
      const totalPresent = students.filter(s => s.attendance).length;
      const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;
      
      const groupBreakdown = groups.map(g => {
          const gStudents = students.filter(s => s.groupId === g.id);
          const gPresent = gStudents.filter(s => s.attendance).length;
          return { name: g.name, rate: gStudents.length > 0 ? Math.round((gPresent/gStudents.length)*100) : 0, total: gStudents.length };
      }).filter(g => g.total > 0);

      return { totalPresent, overallRate, groupBreakdown };
  }, [students, groups]);

  const academicStats = useMemo(() => {
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;
    const gradedSubs = submissions.filter(s => s.status === 'graded').length;
    const gradingProgress = submissions.length > 0 ? Math.round((gradedSubs / submissions.length) * 100) : 100;
    return { avgScore, gradingProgress };
  }, [results, submissions]);

  const lateStudents = useMemo(() => {
      const today = new Date(); today.setHours(0,0,0,0);
      const overdue = assignments.filter(a => a.dueDate && new Date(a.dueDate) < today);
      const list: any[] = [];
      overdue.forEach(asg => {
          students.filter(s => s.yearId === asg.yearId).forEach(s => {
              if (!submissions.some(sub => sub.assignmentId === asg.id && sub.studentId === s.id)) {
                  list.push({ student: s, assignmentTitle: asg.title });
              }
          });
      });
      return list;
  }, [assignments, submissions, students]);

  const weakStudents = useMemo(() => {
      return results.filter(r => r.score < 50).map(r => ({
          student: students.find(s => s.id === r.studentId)!,
          quizTitle: r.quizTitle,
          score: r.score
      })).filter(i => i.student);
  }, [results, students]);

  const weaknessAnalysis = useMemo(() => {
      return analyzeStudentPerformance(results);
  }, [results]);

  const topWeakPoints = useMemo(() => {
      return getWeakPoints(weaknessAnalysis).slice(0, 4);
  }, [weaknessAnalysis]);

  // --- Handlers ---
  const handleCommand = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
          const cmd = commandQuery.toLowerCase();
          if (cmd.includes('طالب') || cmd.includes('student')) onNavigate?.(AppView.STUDENTS);
          else if (cmd.includes('امتحان') || cmd.includes('quiz')) onNavigate?.(AppView.QUIZZES);
          else if (cmd.includes('واجب') || cmd.includes('assignment')) onNavigate?.(AppView.ASSIGNMENTS);
          else if (cmd.includes('بث') || cmd.includes('live')) onNavigate?.(AppView.LIVE_CLASS);
          else alert('عذراً، لم أفهم الأمر. جرب: "طالب"، "امتحان"، "واجب"');
          setCommandQuery('');
      }
  };

  return (
    <div className="space-y-8 animate-slideUp pb-32 text-right font-['Cairo'] max-w-7xl mx-auto" dir="rtl">
      
      {/* 1. Global Command Bar (New) */}
      <div className="sticky top-2 z-40 bg-white/80 backdrop-blur-xl p-2 rounded-[2rem] border border-indigo-100 shadow-lg flex items-center gap-3 transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:scale-[1.01]">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-black text-lg">
              <Command size={20} />
          </div>
          <input 
            type="text" 
            placeholder="اكتب أمراً للذهاب السريع (مثال: 'إنشاء امتحان' أو اسم طالب)..." 
            className="flex-1 bg-transparent border-none outline-none text-slate-700 font-bold placeholder:text-slate-400 h-10"
            value={commandQuery}
            onChange={e => setCommandQuery(e.target.value)}
            onKeyDown={handleCommand}
          />
          <div className="hidden md:flex gap-1">
             <span className="px-2 py-1 bg-slate-100 rounded-md text-[10px] text-slate-500 font-bold border border-slate-200">⌘ K</span>
          </div>
      </div>

      {/* 2. Mission Control Header */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Welcome & Status */}
         <div className="lg:col-span-2 bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[280px]">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_80%_20%,_rgba(79,70,229,0.3),transparent_50%)]"></div>
            
            <div className="relative z-10 flex justify-between items-start">
               <div>
                  <div className="flex items-center gap-2 mb-2">
                     <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-rose-500'}`}></span>
                     <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">النظام {isConnected ? 'متصل' : 'محلي'}</span>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-black leading-tight">
                     {greeting}، <br/> <span className="text-indigo-400">أ. {teacherName.split(' ')[0]}</span>
                  </h1>
               </div>
               <div className="text-center bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10">
                  <span className="block text-3xl font-black">{students.length}</span>
                  <span className="text-[10px] text-slate-300 uppercase font-bold">طالب نشط</span>
               </div>
            </div>

            <div className="relative z-10 mt-6 flex flex-wrap gap-4">
               <button onClick={() => setShowDailyReport(true)} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-xs shadow-lg transition-all flex items-center gap-2">
                  <BarChart2 size={16} />
                  <span>تقرير الإغلاق اليومي</span>
               </button>
               <button onClick={() => onNavigate?.(AppView.LIVE_CLASS)} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold text-xs border border-white/10 backdrop-blur-md transition-all flex items-center gap-2">
                  <Video size={16} className="text-rose-400" />
                  <span>بث مباشر</span>
               </button>
            </div>
         </div>

         {/* Quick KPI Cards */}
         <div className="space-y-4">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-emerald-200 transition-all">
               <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">الحضور اليوم</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black text-slate-800">{dailyStats.totalPresent}</h3>
                     <span className={`text-xs font-bold ${dailyStats.overallRate > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {dailyStats.overallRate}%
                     </span>
                  </div>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Users size={24} />
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-blue-200 transition-all">
               <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">المستوى العام</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black text-slate-800">{academicStats.avgScore}%</h3>
                     <span className="text-xs font-bold text-blue-500">
                        {academicStats.avgScore > 85 ? '↗ متصاعد' : '→ مستقر'}
                     </span>
                  </div>
               </div>
               <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <TrendingUp size={24} />
               </div>
            </div>

            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all cursor-pointer" onClick={() => onNavigate?.(AppView.ASSIGNMENTS)}>
               <div>
                  <p className="text-[10px] text-slate-400 font-black uppercase">تصحيح واجبات</p>
                  <div className="flex items-baseline gap-2">
                     <h3 className="text-3xl font-black text-slate-800">{pendingGrading.length}</h3>
                     <span className="text-xs font-bold text-indigo-500">معلق</span>
                  </div>
               </div>
               <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${pendingGrading.length > 0 ? 'bg-indigo-600 text-white animate-pulse' : 'bg-indigo-50 text-indigo-600'}`}>
                  <FileText size={24} />
               </div>
            </div>
         </div>
      </div>

      {/* 3. Visual Analytics (New) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <Activity size={20} className="text-indigo-600" />
                  <span>نسبة الحضور حسب المجموعة</span>
              </h3>
              <div className="h-64" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dailyStats.groupBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                          <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={30} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
          <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100">
              <h3 className="text-lg font-black text-slate-800 mb-6 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <span>حالة الاشتراكات (المدفوعات)</span>
              </h3>
              <div className="h-64 flex items-center justify-center" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={[
                                  { name: 'مدفوع', value: students.filter(s => s.isPaid).length, color: '#10b981' },
                                  { name: 'غير مدفوع', value: students.filter(s => !s.isPaid).length, color: '#f43f5e' }
                              ]}
                              cx="50%" cy="50%"
                              innerRadius={60} outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {
                                  [
                                      { name: 'مدفوع', value: students.filter(s => s.isPaid).length, color: '#10b981' },
                                      { name: 'غير مدفوع', value: students.filter(s => !s.isPaid).length, color: '#f43f5e' }
                                  ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))
                              }
                          </Pie>
                          <Tooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span><span className="text-xs font-bold text-slate-600">مدفوع ({students.filter(s => s.isPaid).length})</span></div>
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-500"></span><span className="text-xs font-bold text-slate-600">غير مدفوع ({students.filter(s => !s.isPaid).length})</span></div>
              </div>
          </div>
      </div>

      {/* 4. Elite Weakness Analysis (Inspired by VClasses) */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100">
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
               <AlertTriangle className="text-rose-500" /> تحليل الفجوات التعليمية 🧠
            </h3>
            <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-xl">بناءً على نتائج الاختبارات الأخيرة</span>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topWeakPoints.length > 0 ? topWeakPoints.map((item, idx) => (
               <div key={idx} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-1 h-full ${item.status === 'weak' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <h4 className="font-black text-slate-800 text-sm mb-2">{item.topic}</h4>
                  <div className="flex justify-between items-end">
                     <div>
                        <p className="text-[10px] font-bold text-slate-400 mb-1">نسبة الخطأ العامة</p>
                        <span className={`text-xl font-black ${item.status === 'weak' ? 'text-rose-600' : 'text-amber-600'}`}>
                           {100 - item.scorePercentage}%
                        </span>
                     </div>
                     <span className={`px-2 py-1 rounded-lg text-[8px] font-black ${item.status === 'weak' ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-600'}`}>
                        {item.status === 'weak' ? 'حرج' : 'متوسط'}
                     </span>
                  </div>
                  <div className="mt-4 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                     <div 
                        className={`h-full ${item.status === 'weak' ? 'bg-rose-500' : 'bg-amber-500'}`}
                        style={{ width: `${100 - item.scorePercentage}%` }}
                     ></div>
                  </div>
               </div>
            )) : (
               <div className="col-span-full py-10 text-center text-slate-400 font-bold border-2 border-dashed border-slate-100 rounded-[2rem]">
                  لا توجد فجوات تعليمية مكتشفة حتى الآن ✓
               </div>
            )}
         </div>
      </div>

      {/* 4. Intelligent Radar & Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* The Radar */}
         <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                    <Activity size={24} className="text-indigo-600" /> الرادار الأكاديمي
                </h3>
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[9px] font-black animate-pulse">Live Scan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div 
                  onClick={() => setRadarType('late')}
                  className="p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 hover:shadow-lg transition-all cursor-pointer group"
                >
                   <div className="flex justify-between items-start mb-2">
                      <Clock size={32} className="text-rose-400 group-hover:scale-110 transition-transform" />
                      <span className="text-2xl font-black text-rose-600">{lateStudents.length}</span>
                   </div>
                   <h4 className="font-bold text-slate-800">تأخير واجبات</h4>
                   <p className="text-[10px] text-rose-400 font-bold mt-1">طلاب تجاوزوا الموعد</p>
                </div>

                <div 
                  onClick={() => setRadarType('weak')}
                  className="p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 hover:shadow-lg transition-all cursor-pointer group"
                >
                   <div className="flex justify-between items-start mb-2">
                      <AlertTriangle size={32} className="text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className="text-2xl font-black text-amber-600">{weakStudents.length}</span>
                   </div>
                   <h4 className="font-bold text-slate-800">مستوى منخفض</h4>
                   <p className="text-[10px] text-amber-400 font-bold mt-1">درجات أقل من 50%</p>
                </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="mt-8 pt-6 border-t border-slate-50">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">أوامر سريعة</p>
               <div className="flex flex-wrap gap-3">
                  {[
                    { label: 'إضافة طالب', icon: <Users size={16} />, act: () => onNavigate?.(AppView.STUDENTS) },
                    { label: 'إنشاء اختبار', icon: <FileText size={16} />, act: () => onNavigate?.(AppView.QUIZZES) },
                    { label: 'إرسال تنبيه', icon: <Bell size={16} />, act: () => onNavigate?.(AppView.NOTIFICATIONS) },
                    { label: 'كارنيهات VIP', icon: <Award size={16} />, act: () => onNavigate?.(AppView.MANAGEMENT) },
                  ].map((btn, idx) => (
                    <button key={idx} onClick={btn.act} className="flex-1 min-w-[100px] py-3 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-all flex items-center justify-center gap-2 border border-slate-100">
                       <span className="text-indigo-500">{btn.icon}</span> <span>{btn.label}</span>
                    </button>
                  ))}
               </div>
            </div>
         </div>

         {/* Leaderboard */}
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-4">
                  <h4 className="font-black text-slate-800 text-sm flex items-center gap-2">
                      <Award size={18} className="text-amber-500" /> أوائل الطلاب
                  </h4>
                  <button onClick={() => onNavigate?.(AppView.LEADERBOARD)} className="text-[10px] font-bold text-blue-600">الكل</button>
               </div>
               <div className="space-y-3">
                  {[...students].sort((a,b) => b.points - a.points).slice(0,3).map((s, i) => (
                     <div key={s.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${i===0 ? 'bg-amber-400 text-white' : 'bg-slate-200 text-slate-600'}`}>{i+1}</span>
                        <img src={s.avatar} className="w-8 h-8 rounded-lg bg-slate-100" alt="" />
                        <div className="flex-1">
                           <p className="text-xs font-bold text-slate-800 truncate">{s.name}</p>
                           <p className="text-[9px] text-slate-400">{s.points} نقطة</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>

      {/* --- Modals (Daily Report & Radar Detail) --- */}
      {showDailyReport && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                          <BarChart2 className="text-indigo-600" /> تقرير الإغلاق
                      </h3>
                      <button onClick={() => setShowDailyReport(false)} className="w-10 h-10 bg-slate-100 rounded-full text-slate-500">✕</button>
                  </div>
                  {/* Report Content */}
                  <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-3 text-center mb-6">
                          <div className="p-4 bg-emerald-50 rounded-2xl"><span className="block text-2xl font-black text-emerald-600">{dailyStats.totalPresent}</span><span className="text-[10px] text-slate-500 font-bold">حضور</span></div>
                          <div className="p-4 bg-blue-50 rounded-2xl"><span className="block text-2xl font-black text-blue-600">{dailyStats.overallRate}%</span><span className="text-[10px] text-slate-500 font-bold">نسبة</span></div>
                          <div className="p-4 bg-rose-50 rounded-2xl"><span className="block text-2xl font-black text-rose-600">{students.length - dailyStats.totalPresent}</span><span className="text-[10px] text-slate-500 font-bold">غياب</span></div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {radarType && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                  <div className={`absolute top-0 left-0 w-full h-2 ${radarType === 'late' ? 'bg-rose-500' : 'bg-amber-500'}`}></div>
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
                          {radarType === 'late' ? <><Clock className="text-rose-500" /> المتأخرين عن الواجب</> : <><AlertTriangle className="text-amber-500" /> الطلاب المتعثرين</>}
                      </h3>
                      <button onClick={() => setRadarType(null)} className="w-10 h-10 bg-slate-100 rounded-full text-slate-500">✕</button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto space-y-3 p-1">
                      {(radarType === 'late' ? lateStudents : weakStudents).map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <span className="font-bold text-slate-400 text-xs">#{idx+1}</span>
                                  <div>
                                      <p className="font-black text-slate-800 text-sm">{item.student.name}</p>
                                      <p className="text-[10px] text-slate-500 font-bold">
                                          {radarType === 'late' ? `لم يسلم: ${item.assignmentTitle}` : `${item.quizTitle} (${item.score}%)`}
                                      </p>
                                  </div>
                              </div>
                              <button className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-[10px] font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1">
                                  <Bell size={12} /> تنبيه
                              </button>
                          </div>
                      ))}
                      {(radarType === 'late' ? lateStudents : weakStudents).length === 0 && <p className="text-center text-slate-400 font-bold py-8">القائمة فارغة، ممتاز!</p>}
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};

export default Dashboard;
