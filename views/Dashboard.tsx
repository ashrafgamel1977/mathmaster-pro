
import React, { useState, useMemo } from 'react';
import { Student, Quiz, Assignment, AssignmentSubmission, AppView, PlatformSettings, Group, QuizResult } from '../types';
import { generateDailySummary, generateRemedialPlan } from '../services/geminiService';
import MathRenderer from '../components/MathRenderer';

interface DashboardProps {
  teacherName: string;
  platformName?: string;
  students: Student[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  groups?: Group[]; 
  settings?: PlatformSettings;
  results?: QuizResult[]; // Added results prop
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
  results = [], // Default empty
  onNavigate, 
  isConnected = false,
}) => {
  // --- Computed Data ---
  const pendingGrading = submissions.filter(s => s.status === 'pending');
  const activeAssignments = assignments.filter(a => a.status === 'active');
  const lowAttendanceStudents = students.filter(s => {
     return s.attendance === false && s.streaks < 2; 
  });
  
  const totalPoints = students.reduce((acc, s) => acc + (s.points || 0), 0);
  const topStudents = [...students].sort((a, b) => (b.score + b.points) - (a.score + a.points)).slice(0, 4);

  // --- Daily Report State ---
  const [showDailyReport, setShowDailyReport] = useState(false);
  const [dailySummaryText, setDailySummaryText] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  // --- Smart Radar State ---
  const [radarType, setRadarType] = useState<'late' | 'weak' | null>(null);
  const [aiRemedialPlan, setAiRemedialPlan] = useState<string | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  // --- Daily Report Calculation ---
  const dailyStats = useMemo(() => {
      const today = new Date().toLocaleDateString('ar-EG');
      const totalStudents = students.length;
      const totalPresent = students.filter(s => s.attendance).length;
      const totalAbsent = totalStudents - totalPresent;
      const overallRate = totalStudents > 0 ? Math.round((totalPresent / totalStudents) * 100) : 0;

      // Group Breakdown
      const groupBreakdown = groups.map(g => {
          const groupStudents = students.filter(s => s.groupId === g.id);
          const gTotal = groupStudents.length;
          const gPresent = groupStudents.filter(s => s.attendance).length;
          const gAbsent = gTotal - gPresent;
          const gRate = gTotal > 0 ? Math.round((gPresent / gTotal) * 100) : 0;
          return {
              id: g.id,
              name: g.name,
              time: g.time,
              total: gTotal,
              present: gPresent,
              absent: gAbsent,
              rate: gRate
          };
      }).filter(g => g.total > 0); 

      return { totalPresent, totalAbsent, overallRate, groupBreakdown, date: today };
  }, [students, groups]);

  // --- Performance Stats Calculation (New) ---
  const academicStats = useMemo(() => {
    // Average Quiz Score
    const totalScore = results.reduce((acc, curr) => acc + curr.score, 0);
    const avgScore = results.length > 0 ? Math.round(totalScore / results.length) : 0;

    // Grading Progress
    const totalSubs = submissions.length;
    const gradedSubs = submissions.filter(s => s.status === 'graded').length;
    const gradingProgress = totalSubs > 0 ? Math.round((gradedSubs / totalSubs) * 100) : 0;

    return { avgScore, gradingProgress, gradedCount: gradedSubs };
  }, [results, submissions]);

  // --- Radar Calculations ---
  const lateStudents = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const overdueAssignments = assignments.filter(a => {
          if (!a.dueDate) return false;
          const due = new Date(a.dueDate);
          return due < today; // Due date passed
      });

      const list: {student: Student, assignmentTitle: string}[] = [];
      
      overdueAssignments.forEach(asg => {
          // Get students in the assignment's year group
          const targetStudents = students.filter(s => s.yearId === asg.yearId);
          
          targetStudents.forEach(s => {
              const hasSubmitted = submissions.some(sub => sub.assignmentId === asg.id && sub.studentId === s.id);
              if (!hasSubmitted) {
                  list.push({ student: s, assignmentTitle: asg.title });
              }
          });
      });
      return list;
  }, [assignments, submissions, students]);

  const weakStudents = useMemo(() => {
      // Logic: Students who got < 50% in any recent quiz
      const list: {student: Student, quizTitle: string, score: number}[] = [];
      results.forEach(r => {
          if (r.score < 50) {
              const s = students.find(st => st.id === r.studentId);
              if (s) {
                  list.push({ student: s, quizTitle: r.quizTitle, score: r.score });
              }
          }
      });
      return list;
  }, [results, students]);

  // --- Handlers ---
  const handleGenerateSummary = async () => {
      setIsGeneratingSummary(true);
      try {
          const text = await generateDailySummary(dailyStats.groupBreakdown, teacherName);
          setDailySummaryText(text);
      } catch (error) {
          setDailySummaryText("تعذر توليد الملخص الذكي حالياً.");
      } finally {
          setIsGeneratingSummary(false);
      }
  };

  const handleGenerateRemedial = async () => {
      setIsAiThinking(true);
      try {
          const data = weakStudents.map(w => ({ name: w.student.name, quiz: w.quizTitle, score: w.score }));
          const plan = await generateRemedialPlan(data, teacherName);
          setAiRemedialPlan(plan);
      } catch (e) {
          alert('تعذر الاتصال بالمعلم الذكي');
      } finally {
          setIsAiThinking(false);
      }
  };

  const sendLateWarning = (phone: string, studentName: string, asgTitle: string) => {
      const msg = `تنبيه من إدارة أ. ${teacherName}:\nالطالب/ ${studentName} لم يقم بتسليم الواجب المطلوب "${asgTitle}".\nيرجى المتابعة والاهتمام للحفاظ على المستوى الأكاديمي.`;
      const url = `https://wa.me/${phone.startsWith('0')?'2'+phone:phone}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
  };

  return (
    <div className="space-y-8 animate-slideUp pb-32 text-right font-['Cairo'] max-w-7xl mx-auto" dir="rtl">
      
      {/* 1. Hero / Welcome Section */}
      <div className="relative overflow-hidden rounded-[3.5rem] bg-slate-900 p-10 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-8">
         <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,_rgba(59,130,246,0.15),transparent_60%)]"></div>
         
         <div className="relative z-10 space-y-2 text-center md:text-right">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
               <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></span>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isConnected ? 'نظام متصل' : 'غير متصل'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight">
               مرحباً، أ. {teacherName.split(' ')[0]} 👋
            </h1>
            <p className="text-slate-400 text-sm md:text-base font-medium max-w-lg">
               لديك <span className="text-white border-b border-blue-500 font-bold">{pendingGrading.length} واجبات</span> تحتاج التصحيح و <span className="text-white border-b border-amber-500 font-bold">{activeAssignments.length} مهام نشطة</span> اليوم.
            </p>
         </div>

         <div className="relative z-10 flex flex-col gap-3 w-full md:w-auto">
            <div className="flex gap-3">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center min-w-[120px]">
                <span className="block text-3xl font-black text-blue-400">{students.length}</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase">إجمالي الطلاب</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-3xl border border-white/10 text-center min-w-[120px]">
                <span className="block text-3xl font-black text-amber-400">{(totalPoints/1000).toFixed(1)}k</span>
                <span className="text-[10px] text-slate-300 font-bold uppercase">نقاط مكتسبة</span>
                </div>
            </div>
            {/* NEW: Manager Report Button */}
            <button 
                onClick={() => setShowDailyReport(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs shadow-lg flex items-center justify-center gap-2 transition-all"
            >
                <span>تقرير إغلاق اليوم</span>
                <span>📊</span>
            </button>
         </div>
      </div>

      {/* --- NEW: Smart Academic Radar --- */}
      <div className="bg-white p-8 rounded-[3.5rem] shadow-xl border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                  <span>📡</span> رادار المتابعة الأكاديمية
              </h3>
              <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full text-[10px] font-black animate-pulse">نظام الكشف النشط</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
              {/* Late Homework Card */}
              <div 
                onClick={() => setRadarType('late')}
                className="group cursor-pointer p-6 bg-rose-50 rounded-[2.5rem] border border-rose-100 hover:shadow-lg transition-all"
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl text-rose-500 shadow-sm group-hover:scale-110 transition-transform">⏰</div>
                      <span className="text-3xl font-black text-rose-600">{lateStudents.length}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-lg">متأخرين عن الواجب</h4>
                  <p className="text-xs text-rose-400 font-bold mt-1">طلاب لم يسلموا واجبات مستحقة</p>
              </div>

              {/* Weak Scores Card */}
              <div 
                onClick={() => setRadarType('weak')}
                className="group cursor-pointer p-6 bg-amber-50 rounded-[2.5rem] border border-amber-100 hover:shadow-lg transition-all"
              >
                  <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl text-amber-500 shadow-sm group-hover:scale-110 transition-transform">📉</div>
                      <span className="text-3xl font-black text-amber-600">{weakStudents.length}</span>
                  </div>
                  <h4 className="font-black text-slate-800 text-lg">مستوى يحتاج تحسين</h4>
                  <p className="text-xs text-amber-400 font-bold mt-1">درجات أقل من 50% في الاختبارات الأخيرة</p>
              </div>
          </div>
      </div>

      {/* 2. New Features Shortcuts (The "Where is it?" Answer) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => onNavigate?.(AppView.MANAGEMENT)}
            className="group cursor-pointer bg-gradient-to-br from-slate-800 to-black p-1 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-all"
          >
             <div className="bg-[#0f172a] h-full rounded-[2.3rem] p-6 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center text-2xl mb-3">🪪</div>
                   <h3 className="text-white font-black text-lg">طباعة الكارنيهات (VIP)</h3>
                   <p className="text-slate-400 text-xs mt-1">تصميم الفيزا الجديد للطلاب</p>
                </div>
                <div className="text-6xl opacity-10 grayscale group-hover:grayscale-0 transition-all">💳</div>
             </div>
          </div>

          <div 
            onClick={() => onNavigate?.(AppView.STUDENT_PORTAL)}
            className="group cursor-pointer bg-gradient-to-br from-indigo-500 to-blue-600 p-1 rounded-[2.5rem] shadow-xl hover:scale-[1.02] transition-all"
          >
             <div className="bg-white/10 backdrop-blur-md h-full rounded-[2.3rem] p-6 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                   <div className="w-12 h-12 bg-white/20 text-white rounded-2xl flex items-center justify-center text-2xl mb-3">🎓</div>
                   <h3 className="text-white font-black text-lg">معاينة بوابة الطالب</h3>
                   <p className="text-indigo-100 text-xs mt-1">شاهد شكل الدروس والواجبات</p>
                </div>
                <div className="text-6xl opacity-20">📱</div>
             </div>
          </div>
      </div>

      {/* --- NEW SECTION: Quick Stats Overview --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">المستوى العام</p>
                <h4 className="text-3xl font-black text-indigo-600 mt-1">{academicStats.avgScore}%</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1">متوسط درجات الامتحانات</p>
             </div>
             <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">🎓</div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">إنجاز التصحيح</p>
                <h4 className="text-3xl font-black text-emerald-600 mt-1">{academicStats.gradingProgress}%</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1">تم تصحيح {academicStats.gradedCount} واجب</p>
             </div>
             <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">✅</div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-md transition-all">
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">نسبة الحضور</p>
                <h4 className="text-3xl font-black text-amber-500 mt-1">{dailyStats.overallRate}%</h4>
                <p className="text-[9px] font-bold text-slate-400 mt-1">حضور اليوم ({dailyStats.totalPresent} طالب)</p>
             </div>
             <div className="w-14 h-14 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center text-2xl">📅</div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         
         {/* 3. Urgent Tasks (Action Center) */}
         <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
               <span>⚡</span> المهام العاجلة
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Pending Grading Card */}
               <div 
                 onClick={() => onNavigate?.(AppView.ASSIGNMENTS)}
                 className={`p-6 rounded-[2.5rem] border transition-all cursor-pointer group ${pendingGrading.length > 0 ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-slate-100 hover:border-slate-200'}`}
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${pendingGrading.length > 0 ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'}`}>📝</div>
                     {pendingGrading.length > 0 && <span className="px-3 py-1 bg-rose-500 text-white text-[10px] font-black rounded-full animate-bounce">عاجل</span>}
                  </div>
                  <h4 className={`text-lg font-black ${pendingGrading.length > 0 ? 'text-white' : 'text-slate-800'}`}>
                     {pendingGrading.length > 0 ? `${pendingGrading.length} واجب بانتظار التصحيح` : 'لا توجد واجبات معلقة'}
                  </h4>
                  <p className={`text-xs mt-1 ${pendingGrading.length > 0 ? 'text-indigo-200' : 'text-slate-400'}`}>
                     اضغط للبدء في رصد الدرجات الآن
                  </p>
               </div>

               {/* Attendance Alert Card */}
               <div 
                 onClick={() => onNavigate?.(AppView.STUDENTS)}
                 className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all cursor-pointer group"
               >
                  <div className="flex justify-between items-start mb-4">
                     <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center text-2xl">⚠️</div>
                  </div>
                  <h4 className="text-lg font-black text-slate-800">
                     {lowAttendanceStudents.length} طلاب غياب متكرر
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-bold group-hover:text-rose-500 transition-colors">
                     اضغط لإرسال تنبيهات لأولياء الأمور
                  </p>
               </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-4 items-center justify-around">
               {[
                 { label: 'إنشاء اختبار', icon: '⚡', action: () => onNavigate?.(AppView.QUIZZES), color: 'bg-indigo-50 text-indigo-600' },
                 { label: 'إضافة طالب', icon: '👤', action: () => onNavigate?.(AppView.STUDENTS), color: 'bg-emerald-50 text-emerald-600' },
                 { label: 'إرسال تنبيه', icon: '📢', action: () => onNavigate?.(AppView.NOTIFICATIONS), color: 'bg-amber-50 text-amber-600' },
                 { label: 'بث مباشر', icon: '🎥', action: () => onNavigate?.(AppView.LIVE_CLASS), color: 'bg-rose-50 text-rose-600' },
               ].map((btn, idx) => (
                 <button key={idx} onClick={btn.action} className="flex flex-col items-center gap-2 group">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-transform group-hover:scale-110 ${btn.color}`}>
                       {btn.icon}
                    </div>
                    <span className="text-[10px] font-bold text-slate-600">{btn.label}</span>
                 </button>
               ))}
            </div>
         </div>

         {/* 4. Leaderboard & Insights */}
         <div className="space-y-6">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="font-black text-slate-800 text-lg">🌟 المتصدرين</h3>
                  <button onClick={() => onNavigate?.(AppView.LEADERBOARD)} className="text-[10px] font-bold text-blue-600 hover:underline">عرض الكل</button>
               </div>
               <div className="space-y-4">
                  {topStudents.map((student, index) => (
                    <div key={student.id} className="flex items-center gap-3">
                       <span className={`w-6 h-6 flex items-center justify-center rounded-full text-[10px] font-black ${index === 0 ? 'bg-amber-400 text-white shadow-lg shadow-amber-200' : 'bg-slate-100 text-slate-500'}`}>{index + 1}</span>
                       <img src={student.avatar} className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100" alt="" />
                       <div className="flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{student.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold">{student.points} نقطة</p>
                       </div>
                    </div>
                  ))}
                  {topStudents.length === 0 && <p className="text-center text-xs text-slate-400 py-4">لا توجد بيانات كافية</p>}
               </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-8 rounded-[3rem] shadow-lg text-white relative overflow-hidden group cursor-pointer" onClick={() => onNavigate?.(AppView.AI_SOLVER)}>
               <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500"></div>
               <h4 className="text-lg font-black mb-2 relative z-10">المساعد الذكي 🧠</h4>
               <p className="text-xs text-indigo-100 font-medium relative z-10 leading-relaxed">
                  هل تحتاج للمساعدة في تحضير درس أو حل مسألة معقدة؟ Gemini جاهز للمساعدة.
               </p>
               <button className="mt-4 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black hover:bg-white hover:text-indigo-600 transition-all">فتح المحلل</button>
            </div>
         </div>

      </div>

      {/* --- Daily Report Modal --- */}
      {showDailyReport && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn overflow-y-auto">
              <div className="bg-white w-full max-w-3xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                  {/* Header */}
                  <div className="p-8 bg-[#0f172a] text-white flex justify-between items-center shrink-0">
                      <div>
                          <h3 className="text-2xl font-black flex items-center gap-2">
                              <span>📊</span> تقرير العمل اليومي
                          </h3>
                          <p className="text-slate-400 text-xs font-bold mt-1">{dailyStats.date}</p>
                      </div>
                      <button onClick={() => setShowDailyReport(false)} className="w-10 h-10 bg-white/10 hover:bg-rose-500 rounded-full flex items-center justify-center transition-colors">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-4">
                          <div className="p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
                              <span className="block text-2xl font-black text-emerald-600">{dailyStats.totalPresent}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">حضور</span>
                          </div>
                          <div className="p-4 bg-rose-50 rounded-3xl border border-rose-100 text-center">
                              <span className="block text-2xl font-black text-rose-600">{dailyStats.totalAbsent}</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">غياب</span>
                          </div>
                          <div className="p-4 bg-blue-50 rounded-3xl border border-blue-100 text-center">
                              <span className="block text-2xl font-black text-blue-600">{dailyStats.overallRate}%</span>
                              <span className="text-[10px] font-bold text-slate-500 uppercase">نسبة الحضور</span>
                          </div>
                      </div>

                      {/* Group Breakdown Table */}
                      <div className="border rounded-[2rem] overflow-hidden border-slate-100">
                          <table className="w-full text-right text-sm">
                              <thead className="bg-slate-50 text-slate-500">
                                  <tr>
                                      <th className="p-4 font-black">المجموعة</th>
                                      <th className="p-4 text-center font-black">الإجمالي</th>
                                      <th className="p-4 text-center font-black">حضور</th>
                                      <th className="p-4 text-center font-black">غياب</th>
                                      <th className="p-4 text-center font-black">النسبة</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                  {dailyStats.groupBreakdown.map(g => (
                                      <tr key={g.id} className="hover:bg-slate-50/50 transition-colors">
                                          <td className="p-4 font-bold text-slate-800">
                                              {g.name}
                                              <span className="block text-[9px] text-slate-400 font-normal">{g.time}</span>
                                          </td>
                                          <td className="p-4 text-center font-bold">{g.total}</td>
                                          <td className="p-4 text-center font-bold text-emerald-600">{g.present}</td>
                                          <td className="p-4 text-center font-bold text-rose-500">{g.absent}</td>
                                          <td className="p-4 text-center">
                                              <span className={`px-2 py-1 rounded-lg text-[10px] font-black ${g.rate >= 80 ? 'bg-emerald-100 text-emerald-700' : g.rate >= 60 ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
                                                  {g.rate}%
                                              </span>
                                          </td>
                                      </tr>
                                  ))}
                                  {dailyStats.groupBreakdown.length === 0 && (
                                      <tr><td colSpan={5} className="p-8 text-center text-slate-400 font-bold">لا توجد بيانات مجموعات اليوم</td></tr>
                                  )}
                              </tbody>
                          </table>
                      </div>

                      {/* AI Summary Section */}
                      <div className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-200">
                          <div className="flex justify-between items-center mb-4">
                              <h4 className="font-black text-slate-800 flex items-center gap-2">
                                  <span>🤖</span> تحليل المساعد الذكي
                              </h4>
                              {!dailySummaryText && !isGeneratingSummary && (
                                  <button 
                                      onClick={handleGenerateSummary}
                                      className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg hover:scale-105 transition-transform"
                                  >
                                      توليد ملخص للمدير ✨
                                  </button>
                              )}
                          </div>
                          
                          {isGeneratingSummary ? (
                              <div className="text-center py-8">
                                  <div className="w-8 h-8 border-4 border-slate-300 border-t-slate-900 rounded-full animate-spin mx-auto mb-2"></div>
                                  <p className="text-xs font-bold text-slate-500">جاري تحليل الأرقام وكتابة التقرير...</p>
                              </div>
                          ) : dailySummaryText ? (
                              <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed font-medium">
                                  <MathRenderer content={dailySummaryText} />
                              </div>
                          ) : (
                              <p className="text-xs text-slate-400 text-center py-4">اضغط الزر أعلاه للحصول على تحليل ذكي لأداء السنتر اليوم.</p>
                          )}
                      </div>
                  </div>

                  <div className="p-6 bg-slate-100 flex justify-end gap-3 shrink-0">
                      <button onClick={() => window.print()} className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs shadow-sm hover:bg-slate-50">طباعة 🖨️</button>
                      <button onClick={() => setShowDailyReport(false)} className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black text-xs shadow-lg">إغلاق</button>
                  </div>
              </div>
          </div>
      )}

      {/* --- Radar Detail Modal --- */}
      {radarType && (
          <div className="fixed inset-0 z-[3000] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[85vh]">
                  <div className={`p-8 text-white flex justify-between items-center ${radarType === 'late' ? 'bg-rose-600' : 'bg-amber-500'}`}>
                      <div>
                          <h3 className="text-xl font-black flex items-center gap-2">
                              {radarType === 'late' ? '⏰ كشف المتأخرين عن الواجب' : '📉 الطلاب المتعثرين (أقل من 50%)'}
                          </h3>
                      </div>
                      <button onClick={() => setRadarType(null)} className="w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center text-white font-bold">✕</button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {radarType === 'late' ? (
                          lateStudents.length > 0 ? (
                              lateStudents.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                      <div className="flex items-center gap-3">
                                          <span className="text-rose-500 font-black text-sm">#{idx+1}</span>
                                          <div>
                                              <p className="font-bold text-slate-800 text-sm">{item.student.name}</p>
                                              <p className="text-[10px] text-slate-500">لم يسلم: {item.assignmentTitle}</p>
                                          </div>
                                      </div>
                                      <button 
                                        onClick={() => sendLateWarning(item.student.parentPhone, item.student.name, item.assignmentTitle)}
                                        className="px-4 py-2 bg-white border border-rose-200 text-rose-600 rounded-xl text-[10px] font-black hover:bg-rose-50 flex items-center gap-1"
                                      >
                                          <span>واتساب</span> 📤
                                      </button>
                                  </div>
                              ))
                          ) : <p className="text-center py-10 text-slate-400 font-bold">رائع! جميع الطلاب سلموا الواجبات.</p>
                      ) : (
                          <>
                              {weakStudents.length > 0 ? (
                                weakStudents.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <span className="text-amber-500 font-black text-sm">#{idx+1}</span>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.student.name}</p>
                                                <p className="text-[10px] text-slate-500">{item.quizTitle} ({item.score}%)</p>
                                            </div>
                                        </div>
                                    </div>
                                ))
                              ) : <p className="text-center py-10 text-slate-400 font-bold">ممتاز! لا يوجد درجات ضعيفة حالياً.</p>}
                              
                              {weakStudents.length > 0 && (
                                  <div className="mt-6 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                      <div className="flex justify-between items-center mb-2">
                                          <h4 className="font-black text-indigo-800 text-sm">🧠 المستشار الذكي</h4>
                                          {!aiRemedialPlan && !isAiThinking && (
                                              <button onClick={handleGenerateRemedial} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black">اقترح خطة علاجية</button>
                                          )}
                                      </div>
                                      {isAiThinking && <p className="text-xs text-indigo-500 animate-pulse">جاري تحليل نقاط الضعف...</p>}
                                      {aiRemedialPlan && (
                                          <div className="prose prose-sm max-w-none text-slate-700 text-xs font-medium bg-white p-4 rounded-xl border border-indigo-100">
                                              <MathRenderer content={aiRemedialPlan} />
                                          </div>
                                      )}
                                  </div>
                              )}
                          </>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
