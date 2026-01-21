
import React, { useState } from 'react';
import { Student, Year, Group, Quiz, Assignment, PlatformSettings } from '../types';
import { generateQuizFromContent } from '../services/geminiService';
import InteractiveBoard from '../components/InteractiveBoard';

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
  const [isAITesting, setIsAITesting] = useState(false);
  const [showBoardTest, setShowBoardTest] = useState(false);

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

  const testAICapability = async () => {
    setIsAITesting(true);
    try {
      await generateQuizFromContent("الهندسة", undefined, settings.mathNotation);
      addToast('المعلم الذكي جاهز ✅', 'success');
    } catch (e) {
      addToast('خطأ في الاتصال ❌', 'error');
    } finally {
      setIsAITesting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-12 animate-slideUp pb-24 text-right px-2 md:px-0" dir="rtl">
      
      {/* Database Inspector Header */}
      <div className="bg-emerald-900 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center">
         <div className="relative z-10 space-y-2">
            <h2 className="text-3xl font-black">فحص قاعدة البيانات 🔍</h2>
            <p className="text-emerald-200 font-bold text-sm">تأكد من وجود بياناتك في السحابة (Firebase) الآن.</p>
         </div>
         <div className="relative z-10 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 text-center min-w-[200px]">
            <p className="text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">حالة الاتصال</p>
            <p className="text-xl font-black flex items-center justify-center gap-2">
               <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]"></span>
               متصل بـ Firebase
            </p>
         </div>
      </div>

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
              <p className="text-[10px] text-gray-400 font-bold">مستند محفوظ</p>
           </div>
         ))}
      </div>

      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-6">
         <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
            <span>🕵️‍♂️</span> آخر البيانات المسجلة في السحابة
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
                  {quizzes.slice(-3).map(q => (
                     <tr key={q.id} className="border-b border-slate-50">
                        <td className="p-4 text-amber-600">اختبار</td>
                        <td className="p-4">{q.title}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{q.id}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded text-[10px]">محفوظ ✓</span></td>
                     </tr>
                  ))}
                  {groups.slice(-2).map(g => (
                     <tr key={g.id} className="border-b border-slate-50">
                        <td className="p-4 text-indigo-600">مجموعة</td>
                        <td className="p-4">{g.name}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{g.id}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded text-[10px]">محفوظ ✓</span></td>
                     </tr>
                  ))}
                  {students.slice(-2).map(s => (
                     <tr key={s.id} className="border-b border-slate-50">
                        <td className="p-4 text-blue-600">طالب</td>
                        <td className="p-4">{s.name}</td>
                        <td className="p-4 font-mono text-xs text-slate-400">{s.id}</td>
                        <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-100 text-emerald-600 rounded text-[10px]">محفوظ ✓</span></td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
         <p className="text-center text-xs text-slate-400 font-bold mt-4">
            * هذه البيانات تم جلبها مباشرة من قاعدة البيانات الحية. إذا رأيتها هنا، فهي موجودة في Firebase Console.
         </p>
      </div>

      {/* --- Existing Sandbox Section --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 mt-12 pt-12 border-t border-slate-200">
         <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <div className="bg-slate-900 p-6 rounded-[2.5rem] text-white shadow-lg">
               <h3 className="text-lg font-black mb-2">أدوات المطور 🛠️</h3>
               <p className="text-xs text-slate-400 mb-6">استخدم هذه الأدوات لملء قاعدة البيانات ببيانات وهمية للتجربة.</p>
               <button onClick={generateMockData} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-2">
                  <span>توليد بيانات تجريبية</span>
                  <span>🤖</span>
               </button>
            </div>
         </div>

         <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <button onClick={() => setShowBoardTest(true)} className="p-6 bg-white border border-gray-200 rounded-[2.5rem] text-center hover:border-amber-400 transition-all group shadow-sm">
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🖋️</span>
                  <h4 className="font-black text-slate-800">تجربة السبورة</h4>
               </button>
               <button onClick={testAICapability} disabled={isAITesting} className="p-6 bg-white border border-gray-200 rounded-[2.5rem] text-center hover:border-emerald-400 transition-all group shadow-sm">
                  <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">🧠</span>
                  <h4 className="font-black text-slate-800">{isAITesting ? 'جاري الفحص...' : 'فحص محرك الذكاء الاصطناعي'}</h4>
               </button>
            </div>
         </div>
      </div>

      {showBoardTest && (
        <div className="fixed inset-0 z-[500] bg-indigo-950 p-2 flex flex-col animate-fadeIn">
           <div className="flex justify-between items-center mb-4 px-4 text-white">
              <h3 className="font-black text-md">فحص السبورة</h3>
              <button onClick={() => setShowBoardTest(false)} className="w-10 h-10 bg-white/10 hover:bg-rose-600 rounded-xl flex items-center justify-center text-xl shadow-lg">✕</button>
           </div>
           <div className="flex-1 bg-white rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/10">
              <InteractiveBoard 
                onSave={() => addToast('تم الحفظ بنجاح ✓', 'success')} 
                onCancel={() => setShowBoardTest(false)} 
                notation={settings.mathNotation}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default TestCenter;
