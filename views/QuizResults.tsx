
import React, { useState, useMemo } from 'react';
import { QuizResult, Student, AppNotification } from '../types';
import { analyzeStudentWork, generateParentReport } from '../services/geminiService';
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
  const [activeTab, setActiveTab] = useState<'list' | 'analytics'>('list');
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

  const handleSendQuickReport = async (studentName: string, parentPhone: string, quizTitle: string, score: number) => {
    const message = `أهلاً بحضرتك ولي أمر الطالب ${studentName}،\nيسرنا إبلاغك بنتيجة اختبار "${quizTitle}" حيث حصل على ${score}%.\n${score >= 90 ? 'مستوى ممتاز، نشكركم على الاهتمام.' : score >= 70 ? 'مستوى جيد، يرجى الاستمرار.' : 'نرجو المزيد من المتابعة لرفع المستوى.'}\n\nأ. أشرف جميل`;
    
    const phone = parentPhone.startsWith('0') ? `2${parentPhone}` : parentPhone;
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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

  // --- Analytics Calculation ---
  const chartData = useMemo(() => {
    // 1. Group scores by Quiz Title to create the Line Chart data
    const quizGroups = results.reduce((acc, curr) => {
      if (!acc[curr.quizTitle]) acc[curr.quizTitle] = { total: 0, count: 0, date: curr.date };
      acc[curr.quizTitle].total += curr.score;
      acc[curr.quizTitle].count += 1;
      return acc;
    }, {} as Record<string, { total: number, count: number, date: string }>);

    const trendData = Object.entries(quizGroups).map(([title, data]) => {
      // Explicitly cast data to handle unknown type inference in map
      const groupData = data as { total: number, count: number, date: string };
      return {
        title,
        avg: Math.round(groupData.total / groupData.count),
        date: groupData.date
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Basic sorting, might need improvement based on date format

    // 2. Score Distribution (Pie/Bar)
    let distribution = { excellent: 0, good: 0, average: 0, weak: 0 };
    results.forEach(r => {
      if (r.score >= 85) distribution.excellent++;
      else if (r.score >= 70) distribution.good++;
      else if (r.score >= 50) distribution.average++;
      else distribution.weak++;
    });

    return { trendData, distribution };
  }, [results]);

  return (
    <div className="space-y-8 animate-slideUp text-right pb-24" dir="rtl">
      <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight">مكتب النتائج والتقييم الذكي 📊</h2>
          <p className="text-sm text-slate-400 font-bold mt-1">يمكنك استخدام المصحح الآلي وتصدير الكشوفات النهائية.</p>
        </div>
        <div className="flex gap-3">
           <div className="flex bg-slate-100 p-1 rounded-2xl">
              <button 
                onClick={() => setActiveTab('list')}
                className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'list' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500'}`}
              >
                سجل الدرجات 📝
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 rounded-xl font-black text-xs transition-all ${activeTab === 'analytics' ? 'bg-white text-indigo-600 shadow-md' : 'text-slate-500'}`}
              >
                تحليلات بيانية 📈
              </button>
           </div>
           <button 
             onClick={exportToCSV}
             className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-xl shadow-emerald-100 hover:scale-105 transition-all flex items-center gap-2"
           >
             <span>تصدير</span>
             <span className="text-lg">📥</span>
           </button>
        </div>
      </div>

      {activeTab === 'list' ? (
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
                      <div className="flex gap-2">
                        <button onClick={() => setGradingResult(result)} className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black shadow-lg">
                           رصد الدرجة {result.handwrittenUrl && '🖋️'}
                        </button>
                        {result.status === 'graded' && student && (
                           <button 
                             onClick={() => handleSendQuickReport(student.name, student.parentPhone, result.quizTitle, result.score)}
                             className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                             title="إرسال النتيجة واتساب"
                           >
                             📱
                           </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
           {/* Performance Trend Chart (SVG) */}
           <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100">
              <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                 <span>📉</span> منحنى الأداء العام
              </h3>
              <div className="h-64 flex items-end gap-2 relative mt-4 border-b border-l border-slate-100 p-4">
                 {/* SVG Line */}
                 <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible" preserveAspectRatio="none">
                    <polyline 
                       points={chartData.trendData.map((d, i) => `${(i / (chartData.trendData.length - 1 || 1)) * 100}%,${100 - d.avg}%`).join(' ')}
                       fill="none" 
                       stroke="#4f46e5" 
                       strokeWidth="3"
                       strokeLinecap="round"
                    />
                 </svg>
                 {chartData.trendData.map((d, i) => (
                    <div key={i} className="flex-1 flex flex-col justify-end items-center group relative z-10">
                       <div 
                         className="w-4 h-4 bg-white border-4 border-indigo-600 rounded-full hover:scale-125 transition-transform cursor-pointer shadow-sm relative"
                         style={{ marginBottom: `${d.avg}%` }}
                       >
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                             {d.avg}%
                          </div>
                       </div>
                       <span className="text-[9px] font-bold text-slate-400 mt-2 rotate-45 origin-left truncate w-10">{d.title}</span>
                    </div>
                 ))}
              </div>
           </div>

           {/* Score Distribution (Simple Bars) */}
           <div className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100">
              <h3 className="font-black text-slate-800 text-lg mb-6 flex items-center gap-2">
                 <span>📊</span> توزيع المستويات
              </h3>
              <div className="space-y-6">
                 {[
                   { l: 'ممتاز (85-100%)', c: chartData.distribution.excellent, color: 'bg-emerald-500' },
                   { l: 'جيد جداً (70-84%)', c: chartData.distribution.good, color: 'bg-blue-500' },
                   { l: 'متوسط (50-69%)', c: chartData.distribution.average, color: 'bg-amber-500' },
                   { l: 'ضعيف (<50%)', c: chartData.distribution.weak, color: 'bg-rose-500' }
                 ].map((stat, idx) => (
                   <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-black text-slate-600">
                         <span>{stat.l}</span>
                         <span>{stat.c} طالب</span>
                      </div>
                      <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${stat.color} transition-all duration-1000 ease-out`} 
                           style={{ width: `${(stat.c / (results.length || 1)) * 100}%` }}
                         ></div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      )}

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
