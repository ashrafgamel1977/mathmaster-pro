
import React, { useState } from 'react';
import { Student, Year, Group, Quiz, Assignment, PlatformSettings } from '../types';
import { getFirebaseInitError, db, isUsingDefaultConfig } from '../firebaseConfig';
import { collection, getDocs, addDoc } from 'firebase/firestore';

interface TestCenterProps {
  students: Student[];
  years: Year[];
  groups: Group[];
  quizzes: Quiz[];
  assignments: Assignment[];
  settings: PlatformSettings;
  onMockData: (data: { years: Year[], groups: Group[], students: Student[], quizzes: Quiz[], assignments: Assignment[] }) => void;
  onEnterSimulation: (student: Student) => void;
  addToast: (msg: string, type: any) => void;
}

const TestCenter: React.FC<TestCenterProps> = ({ students, years, groups, quizzes, assignments, settings, onMockData, onEnterSimulation, addToast }) => {
  const [diagnosticResult, setDiagnosticResult] = useState<{status: 'idle' | 'loading' | 'success' | 'warning' | 'error', message: string}>({ status: 'idle', message: '' });

  const generateMockData = () => {
    const mockYears: Year[] = [
      { id: 'y1-prep', name: 'الصف الأول الإعدادي' },
      { id: 'y2-prep', name: 'الصف الثاني الإعدادي' },
      { id: 'y3-prep', name: 'الصف الثالث الإعدادي' },
      { id: 'y1-sec', name: 'الصف الأول الثانوي' },
      { id: 'y2-sec', name: 'الصف الثاني الثانوي' },
      { id: 'y3-sec', name: 'الصف الثالث الثانوي' },
    ];

    const mockGroups: Group[] = [
      { id: 'mock-g1', name: 'مجموعة أ - الثالث الثانوي (بنين)', yearId: 'y3-sec', time: 'السبت 04:00 م', joinCode: 'SEC3B', type: 'center', gender: 'boys' },
      { id: 'mock-g2', name: 'مجموعة ب - الثالث الثانوي (بنات)', yearId: 'y3-sec', time: 'الأحد 06:00 م', joinCode: 'SEC3G', type: 'center', gender: 'girls' }
    ];

    const mathAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Mona'
    ];

    const mockStudents: Student[] = Array.from({ length: 12 }).map((_, i) => ({
      id: `mock-s${i}`,
      studentCode: `MATH${200 + i}`,
      name: i % 2 === 0 ? `أحمد محمد ${i + 1}` : `سارة علي ${i + 1}`,
      studentPhone: `0101234567${i % 10}`,
      parentPhone: `0111234567${i % 10}`,
      yearId: i < 6 ? 'y3-sec' : 'y1-sec',
      groupId: i < 6 ? 'mock-g1' : 'mock-g2',
      attendance: true,
      score: 85,
      points: 150 + (i * 10),
      avatar: mathAvatars[i % 4],
      scoreHistory: [85],
      status: 'active',
      registrationDate: new Date().toLocaleDateString('ar-EG'),
      badges: [],
      streaks: 0,
      deviceIds: []
    }));

    const mockQuizzes: Quiz[] = [{ id: 'mock-q1', title: 'مراجعة الجبر العامة', yearId: 'y3-sec', date: new Date().toLocaleDateString('ar-EG'), type: 'native' }];
    const mockAssignments: Assignment[] = [{ 
      id: 'mock-a1', 
      title: 'واجب: الهندسة الفراغية', 
      description: 'أوجد معادلة الكرة...', 
      dueDate: 'غداً', 
      yearId: 'y3-sec', 
      type: 'board',
      status: 'active',
      submissions: 0,
      attachments: []
    }];

    onMockData({ years: mockYears, groups: mockGroups, students: mockStudents, quizzes: mockQuizzes, assignments: mockAssignments });
    addToast('تم تجهيز المجموعات بنظام البنين والبنات الجديد! 🧪✨', 'success');
  };

  // --- New Diagnostic Function ---
  const runDiagnostics = async () => {
      setDiagnosticResult({ status: 'loading', message: 'جاري فحص الاتصال...' });
      
      const initErr = getFirebaseInitError();
      if (initErr) {
          setDiagnosticResult({ 
              status: 'error', 
              message: `فشل التهيئة الأولية (Init Error):\n${initErr}\n\nتأكد من صحة مفاتيح API في الكود.` 
          });
          return;
      }

      if (!db) {
          setDiagnosticResult({ status: 'warning', message: 'كائن قاعدة البيانات غير متصل (null)، جاري العمل محلياً.' });
          return;
      }

      // Try Real Connection
      try {
          // Attempt to read from a collection
          await getDocs(collection(db, '_diagnostics_check_'));
          setDiagnosticResult({ 
              status: 'success', 
              message: 'الاتصال ناجح! ✅\nالتطبيق متصل بسيرفرات Firebase Firestore بشكل سليم.' 
          });
      } catch (error: any) {
          let errorMsg = error.message;
          let tip = "";

          if (error.code === 'permission-denied') {
              errorMsg = "تم الاتصال ولكن تم رفض الصلاحية (Permission Denied).";
              tip = "تأكد من إعدادات Firestore Rules في الكونسول (اجعلها Test Mode مؤقتاً).";
          } else if (error.code === 'unavailable') {
              errorMsg = "الخدمة غير متاحة (Offline).";
              tip = "تأكد من اتصال الإنترنت.";
          } else if (error.message.includes("Service firestore is not available")) {
              errorMsg = "خدمة قاعدة البيانات غير مفعلة.";
              tip = "⚠️ هام: يجب عليك الذهاب إلى Firebase Console -> Build -> Firestore Database والضغط على Create Database.";
          }

          setDiagnosticResult({ 
              status: 'error', 
              message: `فشل الاتصال المباشر:\nCode: ${error.code}\nMessage: ${errorMsg}\n\nنصيحة: ${tip}` 
          });
      }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-12 animate-slideUp pb-24 text-right px-2 md:px-0" dir="rtl">
      
      {/* Database Inspector Header */}
      <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
         <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black text-white">فحص النظام 🔧</h2>
            <p className="text-slate-400 font-bold text-sm">أدوات للمطورين للتأكد من سلامة الاتصال والبيانات.</p>
         </div>
         
         <div className="relative z-10 flex gap-3">
             <button 
                onClick={runDiagnostics}
                className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-2xl font-black text-xs transition-all border border-white/20 flex items-center gap-2"
             >
                {diagnosticResult.status === 'loading' ? <span className="animate-spin">↻</span> : <span>📡</span>}
                <span>تشخيص الاتصال</span>
             </button>
         </div>
      </div>

      {/* Diagnostic Result Panel */}
      {diagnosticResult.status !== 'idle' && (
          <div className={`p-6 rounded-[2.5rem] border-2 animate-fadeIn ${
              diagnosticResult.status === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
              diagnosticResult.status === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 
              diagnosticResult.status === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
              <h4 className="font-black text-lg mb-2 flex items-center gap-2">
                  {diagnosticResult.status === 'success' ? '✅ الحالة: متصل / نشط' : 
                   diagnosticResult.status === 'error' ? '❌ الحالة: خطأ' : '⏳ جاري الفحص...'}
              </h4>
              <pre className="text-xs font-mono font-bold whitespace-pre-wrap bg-white/50 p-4 rounded-xl border border-black/5" dir="ltr">
                  {diagnosticResult.message}
              </pre>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
         {[
           { label: 'الاختبارات (quizzes)', count: quizzes.length, icon: '⚡', color: 'text-amber-500', bg: 'bg-amber-50' },
           { label: 'الطلاب (students)', count: students.length, icon: '👥', color: 'text-blue-500', bg: 'bg-blue-50' },
           { label: 'المجموعات (groups)', count: groups.length, icon: '🏫', color: 'text-indigo-500', bg: 'bg-indigo-50' },
           { label: 'الواجبات (assignments)', count: assignments.length, icon: '📝', color: 'text-rose-500', bg: 'bg-rose-50' },
         ].map((stat, i) => (
           <div key={i} className={`p-6 rounded-[2.5rem] border border-gray-100 shadow-sm ${stat.bg} flex flex-col items-center justify-center gap-2`}>
              <span className="text-4xl mb-2">{stat.icon}</span>
              <h4 className="font-black text-gray-800 text-sm">{stat.label}</h4>
              <p className={`text-3xl font-black ${stat.color}`}>{stat.count}</p>
              <p className="text-[10px] text-gray-400 font-bold">مستند محلي/سحابي</p>
           </div>
         ))}
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
         <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🕵️‍♂️</span> عينة من البيانات الحالية
         </h3>
         <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
               <thead className="bg-slate-50 text-slate-500">
                  <tr>
                     <th className="p-4 rounded-r-xl">النوع</th>
                     <th className="p-4">العنوان / الاسم</th>
                     <th className="p-4">المعرف (ID)</th>
                     <th className="p-4 rounded-l-xl text-center">الحالة</th>
                  </tr>
               </thead>
               <tbody className="font-bold text-slate-700">
                  {quizzes.slice(-2).map(q => (
                     <tr key={q.id} className="border-b border-slate-50">
                        <td className="p-4 text-amber-600">اختبار</td>
                        <td className="p-4">{q.title}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{q.id}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px]">متاح</span></td>
                     </tr>
                  ))}
                  {groups.slice(-2).map(g => (
                     <tr key={g.id} className="border-b border-slate-50">
                        <td className="p-4 text-indigo-600">مجموعة</td>
                        <td className="p-4">{g.name}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{g.id}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px]">متاح</span></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>

      {/* --- Sandbox Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-12 pt-12 border-t border-slate-200">
         <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-lg">
               <h3 className="text-lg font-black mb-2">أدوات التوليد الوهمي 🛠️</h3>
               <p className="text-xs text-slate-400 mb-6">توليد بيانات وهمية للتجربة فقط (تعمل محلياً).</p>
               <button onClick={generateMockData} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  <span>توليد بيانات تجريبية</span>
                  <span>🤖</span>
               </button>
            </div>
         </div>

         <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {/* Board test removed */}
            </div>
         </div>
      </div>
    </div>
  );
};

export default TestCenter;
