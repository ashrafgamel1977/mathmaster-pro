
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
      // Fix: Compliance with Group interface
      { id: 'mock-g1', name: 'مجموعة أ - الثالث الثانوي (بنين)', yearId: 'y3-sec', time: 'السبت 04:00 م', joinCode: 'SEC3B', type: 'center', gender: 'boys' },
      // Fix: Compliance with Group interface
      { id: 'mock-g2', name: 'مجموعة ب - الثالث الثانوي (بنات)', yearId: 'y3-sec', time: 'الأحد 06:00 م', joinCode: 'SEC3G', type: 'center', gender: 'girls' }
    ];

    const mathAvatars = [
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Omar',
      'https://api.dicebear.com/7.x/avataaars/svg?seed=Mona'
    ];

    // Fix: Added missing badges, streaks, and deviceIds properties to comply with Student interface requirements
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
    // Fix: Compliance with Assignment interface
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
      <div className="bg-slate-900 p-6 md:p-12 rounded-[2rem] md:rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl md:text-4xl font-black tracking-tight">مختبر الفحص الذكي 🧪</h2>
          <p className="mt-2 text-slate-400 font-medium text-sm md:text-lg italic">بيئة التجارب الآمنة للمنصة.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
         <div className="lg:col-span-1 space-y-6 md:space-y-8">
            <div className="bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[3.5rem] border border-gray-100 shadow-sm">
               <h3 className="text-lg md:text-xl font-black text-gray-800 mb-6">حالة المنصة</h3>
               <div className="space-y-3 md:space-y-4">
                  <div className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                     <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">الصفوف المتاحة</span>
                     <span className="text-xs md:text-sm font-black text-gray-800">{years.length}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 md:p-4 bg-gray-50 rounded-xl md:rounded-2xl border border-gray-100">
                     <span className="text-[8px] md:text-[10px] font-black text-gray-400 uppercase">API Key</span>
                     <span className="text-xs md:text-sm font-black text-emerald-500">متصل ✓</span>
                  </div>
               </div>
            </div>
         </div>

         <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
               <button onClick={generateMockData} className="p-6 md:p-10 bg-indigo-600 text-white rounded-[2rem] md:rounded-[3.5rem] text-center space-y-2 md:space-y-4 shadow-xl shadow-indigo-100 hover:scale-[1.02] transition-all group">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-3xl md:text-4xl">🤖</div>
                  <h4 className="text-md md:text-xl font-black">تجهيز بيانات المحاكاة</h4>
                  <p className="text-[8px] md:text-[10px] font-medium opacity-70">توليد كافة الصفوف والطلاب فورياً.</p>
               </button>

               <button onClick={() => setShowBoardTest(true)} className="p-6 md:p-10 bg-amber-50 text-white rounded-[2rem] md:rounded-[3.5rem] text-center space-y-2 md:space-y-4 shadow-xl shadow-amber-100 hover:scale-[1.02] transition-all group border-4 border-white">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-3xl md:text-4xl">🖋️</div>
                  <h4 className="text-md md:text-xl font-black">فحص أدوات الرسم</h4>
                  <p className="text-[8px] md:text-[10px] font-medium opacity-70">تجربة رسم الدوال الهندسية.</p>
               </button>

               <button onClick={testAICapability} disabled={isAITesting} className="p-6 md:p-10 bg-emerald-600 text-white rounded-[2rem] md:rounded-[3.5rem] text-center space-y-2 md:space-y-4 shadow-xl shadow-emerald-100 hover:scale-[1.02] transition-all group disabled:opacity-50">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-white/10 rounded-2xl md:rounded-3xl mx-auto flex items-center justify-center text-3xl md:text-4xl">✨</div>
                  <h4 className="text-md md:text-xl font-black">فحص الذكاء الاصطناعي</h4>
                  <p className="text-[8px] md:text-[10px] font-medium opacity-70">التأكد من توليد الأسئلة.</p>
               </button>
            </div>

            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] md:rounded-[4rem] border border-gray-100 shadow-sm">
               <h3 className="text-lg md:text-xl font-black text-gray-800 mb-6 flex justify-between items-center">
                 <span>طلاب المحاكاة (Sandbox)</span>
                 <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[9px] md:text-[10px] font-black">العدد: {students.length}</span>
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                  {students.slice(0, 6).map(s => (
                    <div key={s.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-600 transition-all cursor-pointer group" onClick={() => onEnterSimulation(s)}>
                       <div className="flex items-center gap-3 text-right">
                          <img src={s.avatar} className="w-10 h-10 rounded-xl border-2 border-white shadow-sm" alt="" />
                          <p className="text-xs md:text-sm font-black text-gray-800">{s.name}</p>
                       </div>
                       <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center text-[10px] shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">←</div>
                    </div>
                  ))}
               </div>
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
