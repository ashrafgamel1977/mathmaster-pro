
import React, { useState } from 'react';
import { QuizResult, Student, AppNotification } from '../types';
import { analyzeStudentWork } from '../services/geminiService';
import InteractiveBoard from '../components/InteractiveBoard';

interface QuizResultsProps {
  results: QuizResult[];
  students: Student[];
  notifications: AppNotification[];
  onIssueCertificate: (result: QuizResult) => void;
  onUpdateResult?: (id: string, score: number, feedback: string) => void;
  notation: any;
}

const QuizResults: React.FC<QuizResultsProps> = ({ results, students, notifications, onIssueCertificate, onUpdateResult, notation }) => {
  const [gradingResult, setGradingResult] = useState<QuizResult | null>(null);
  const [manualScore, setManualScore] = useState<string>('');
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  const handleAiGrade = async () => {
    if (!gradingResult?.handwrittenUrl) return;
    setIsAiAnalyzing(true);
    try {
      const analysis = await analyzeStudentWork({ data: gradingResult.handwrittenUrl, mimeType: 'image/jpeg' }, notation);
      setManualScore(analysis.suggestedGrade.toString());
      alert(`اقترح المساعد الذكي درجة ${analysis.suggestedGrade} مع تعليق: ${analysis.feedback}`);
    } catch (e) {
      alert("عذراً، لم أستطع قراءة الصورة بوضوح.");
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const exportToCSV = () => {
    if (results.length === 0) return alert('لا توجد نتائج لتصديرها');
    
    const headers = ['اسم الطالب', 'الاختبار', 'الدرجة', 'الحالة', 'التاريخ'];
    const rows = results.map(r => {
      const student = students.find(s => s.id === r.studentId);
      return [
        student?.name || 'غير معروف',
        r.quizTitle,
        r.score + '%',
        r.status === 'graded' ? 'تم التصحيح' : 'قيد الانتظار',
        r.date
      ];
    });

    const csvContent = "\ufeff" + [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `نتائج_طلاب_الرياضيات_${new Date().toLocaleDateString('ar-EG')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 animate-slideUp text-right pb-24" dir="rtl">
      <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">مكتب النتائج والتقييم الذكي 📊</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">يمكنك استخدام المصحح الآلي وتصدير الكشوفات النهائية.</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center gap-3"
        >
          <span>تصدير كشف النتائج (Excel)</span>
          <span className="text-xl">📥</span>
        </button>
      </div>

      <div className="bg-white rounded-[3.5rem] shadow-2xl overflow-hidden border border-slate-100">
        <table className="w-full text-right border-collapse">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase">الطالب</th>
              <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase">الاختبار</th>
              <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase text-center">الدرجة</th>
              <th className="px-8 py-6 font-black text-slate-400 text-[10px] uppercase">الإجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {results.map((result) => {
              const student = students.find(s => s.id === result.studentId);
              return (
                <tr key={result.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={student?.avatar} className="w-10 h-10 rounded-xl object-cover" alt="" />
                      <span className="font-black text-slate-800 text-sm">{student?.name}</span>
                    </div>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-700 text-sm">{result.quizTitle}</td>
                  <td className="px-8 py-6 text-center">
                    <span className="text-xl font-black text-blue-600">{result.status === 'graded' ? `${result.score}%` : '---'}</span>
                  </td>
                  <td className="px-8 py-6">
                    <button onClick={() => setGradingResult(result)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg">
                       رصد الدرجة {result.handwrittenUrl && '🖋️'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {gradingResult && (
        <div className="fixed inset-0 z-[600] bg-slate-950/80 backdrop-blur-xl flex flex-col lg:flex-row animate-fadeIn">
           <div className="w-full lg:w-96 bg-white shadow-2xl z-10 flex flex-col border-l border-slate-100 text-right" dir="rtl">
              <div className="p-10 bg-blue-600 text-white flex flex-col gap-4">
                 <button onClick={() => setGradingResult(null)} className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">✕</button>
                 <h3 className="text-2xl font-black">رصد الدرجة</h3>
                 {gradingResult.handwrittenUrl && (
                   <button 
                     onClick={handleAiGrade}
                     disabled={isAiAnalyzing}
                     className="py-3 bg-amber-400 text-indigo-950 rounded-xl font-black text-xs shadow-lg hover:scale-105 transition-all"
                   >
                     {isAiAnalyzing ? 'جاري التحليل الذكي...' : '🪄 تصحيح آلي بالذكاء الاصطناعي'}
                   </button>
                 )}
              </div>

              <div className="p-10 flex-1 space-y-6">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">الدرجة النهائية</label>
                 <input 
                   type="number" 
                   className="w-full py-8 bg-slate-50 rounded-2xl font-black text-6xl text-center text-blue-600 outline-none" 
                   value={manualScore} 
                   onChange={e => setManualScore(e.target.value)} 
                 />
                 <button 
                   onClick={() => { onUpdateResult?.(gradingResult.id, parseInt(manualScore), ""); setGradingResult(null); }}
                   className="w-full py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl"
                 >اعتماد الدرجة وإرسال تقرير لولي الأمر ✓</button>
              </div>
           </div>

           <div className="flex-1 bg-slate-100 relative p-4 lg:p-14 flex items-center justify-center">
              {gradingResult.handwrittenUrl ? (
                <div className="w-full h-full bg-white rounded-[4rem] overflow-hidden shadow-2xl border-8 border-white">
                  <InteractiveBoard imageUrl={gradingResult.handwrittenUrl} onSave={() => {}} onCancel={() => setGradingResult(null)} title="ورقة إجابة الطالب" />
                </div>
              ) : (
                <div className="text-center text-slate-400 font-bold">هذا الاختبار لا يتضمن أوراقاً مرفوعة.</div>
              )}
           </div>
        </div>
      )}
    </div>
  );
};

export default QuizResults;
