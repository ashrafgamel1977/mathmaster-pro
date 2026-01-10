
import React, { useState, useRef } from 'react';
import { Quiz, Year, EducationalSource, MathNotation } from '../types';
import { generateQuizFromContent } from '../services/geminiService';
import MathRenderer from '../components/MathRenderer';
import InteractiveBoard from '../components/InteractiveBoard';

interface Question {
  id: string;
  type: 'mcq' | 'fill_blanks' | 'short_answer';
  question: string;
  options?: string[];
  correctAnswer: string | number;
  points: number;
}

interface QuizGeneratorProps {
  years: Year[];
  sources: EducationalSource[];
  notation: MathNotation;
  onPublish: (title: string, yearId: string, questions: any[] | null, type: string, externalLink?: string, fileUrl?: string) => void;
}

const MATH_BRANCHES = [
  { id: 'algebra', name: 'جبر', icon: '🧮', color: 'from-blue-500 to-indigo-600' },
  { id: 'geometry', name: 'هندسة', icon: '📐', color: 'from-emerald-500 to-teal-600' },
  { id: 'calculus', name: 'تفاضل وتكامل', icon: '📈', color: 'from-rose-500 to-orange-600' },
  { id: 'stats', name: 'إحصاء', icon: '📊', color: 'from-amber-500 to-yellow-600' },
];

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ years, notation, onPublish }) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'scanner' | 'editor' | 'external'>('ai');
  const [quizTitle, setQuizTitle] = useState('');
  const [targetYearId, setTargetYearId] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [qCount, setQCount] = useState(5);
  
  const [aiTopic, setAiTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [manualQuestions, setManualQuestions] = useState<Question[]>([]);
  const [showBoardModal, setShowBoardModal] = useState(false);
  
  const [scanPreview, setScanPreview] = useState<string | null>(null);
  const scannerInputRef = useRef<HTMLInputElement>(null);

  const handleAiGenerate = async (topicOverride?: string) => {
    const finalTopic = topicOverride || aiTopic;
    if (!finalTopic || !targetYearId) return alert('يرجى اختيار الصف الدراسي وتحديد الموضوع.');
    
    setIsGenerating(true);
    try {
      const generated = await generateQuizFromContent(finalTopic, scanPreview ? { data: scanPreview, mimeType: 'image/jpeg' } : undefined, notation, difficulty, qCount);
      const formatted = generated.map((q: any) => ({
        ...q,
        id: Math.random().toString(36).substr(2, 9),
        points: 1,
        type: 'mcq'
      }));
      setManualQuestions(formatted);
      setActiveTab('editor');
      if (!quizTitle) setQuizTitle(`اختبار ${finalTopic}`);
    } catch (e) {
      alert('حدث خطأ أثناء المعالجة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileScan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setScanPreview(ev.target?.result as string);
        setActiveTab('ai'); // الانتقال لقسم الذكاء الاصطناعي لبدء التحليل
      };
      reader.readAsDataURL(file);
    }
  };

  const addManualQuestion = () => {
    const newQ: Question = { 
      id: Math.random().toString(36).substr(2, 9), 
      type: 'mcq', 
      question: '', 
      options: ['', '', '', ''], 
      correctAnswer: 0, 
      points: 1 
    };
    setManualQuestions([...manualQuestions, newQ]);
    setActiveTab('editor');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 animate-slideUp pb-24 text-right px-4 md:px-0" dir="rtl">
      {/* Dynamic Lab Header */}
      <div className="relative overflow-hidden rounded-[4rem] bg-slate-900 p-10 md:p-16 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_10%_20%,_rgba(59,130,246,0.1),transparent_50%)]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
          <div className="space-y-6 text-center lg:text-right">
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">مُختبر <span className="text-blue-400">الرياضيات</span> الذكي 🧬</h2>
            <p className="text-slate-400 text-sm md:text-xl max-w-2xl font-medium">أستاذ أشرف، ابدأ بصناعة اختبارك الآن بأي طريقة تفضلها.</p>
          </div>
          
          <div className="flex bg-white/5 backdrop-blur-2xl p-2 rounded-[2.5rem] border border-white/10 shadow-2xl overflow-x-auto no-scrollbar max-w-full">
            {[
              { id: 'ai', n: 'مولد الأسئلة', i: '🪄' },
              { id: 'scanner', n: 'ماسح الورق', i: '📸' },
              { id: 'editor', n: 'المحرر اليدوي', i: '✏️' },
              { id: 'external', n: 'روابط خارجية', i: '🔗' },
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-none px-8 py-4 rounded-[2rem] font-black text-xs transition-all flex items-center gap-3 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
              >
                <span>{tab.i}</span> <span>{tab.n}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        {/* Advanced Config Sidebar */}
        <div className="lg:col-span-1 space-y-8">
           <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 sticky top-12">
              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">إعدادات الاختبار</label>
                 <input type="text" placeholder="عنوان الاختبار..." className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                 <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-black text-xs outline-none cursor-pointer" value={targetYearId} onChange={e => setTargetYearId(e.target.value)}>
                    <option value="">اختر الصف الدراسي...</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                 </select>
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-50">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">مستوى الصعوبة</label>
                 <div className="flex bg-slate-50 p-1.5 rounded-2xl">
                    {['easy', 'medium', 'hard'].map(lv => (
                       <button key={lv} onClick={() => setDifficulty(lv)} className={`flex-1 py-2 rounded-xl text-[9px] font-black transition-all ${difficulty === lv ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}>
                          {lv === 'easy' ? 'أساسي' : lv === 'medium' ? 'متوسط' : 'متفوقين'}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">عدد الأسئلة: {qCount}</label>
                 <input type="range" min="3" max="20" className="w-full accent-blue-600" value={qCount} onChange={e => setQCount(parseInt(e.target.value))} />
              </div>
           </div>
        </div>

        {/* Main Interface Content */}
        <div className="lg:col-span-3">
           {activeTab === 'ai' && (
             <div className="space-y-8 animate-fadeIn">
                {/* Topic Templates */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   {MATH_BRANCHES.map(branch => (
                     <button 
                       key={branch.id} 
                       onClick={() => handleAiGenerate(branch.name)}
                       className={`p-6 rounded-[2.5rem] bg-gradient-to-br ${branch.color} text-white text-center space-y-3 shadow-lg hover:scale-105 transition-all group`}
                     >
                        <span className="text-4xl block group-hover:rotate-12 transition-transform">{branch.icon}</span>
                        <span className="font-black text-xs">توليد {branch.name}</span>
                     </button>
                   ))}
                </div>

                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl text-center space-y-10 relative overflow-hidden">
                   {scanPreview && (
                     <div className="absolute top-4 left-4 flex items-center gap-3 p-2 bg-blue-50 rounded-2xl border border-blue-100">
                        <img src={scanPreview} className="w-12 h-12 rounded-lg object-cover" alt="Scan" />
                        <div className="text-right">
                           <p className="text-[9px] font-black text-blue-600 uppercase">تم التقاط الملف ✓</p>
                           <button onClick={() => setScanPreview(null)} className="text-[8px] text-rose-500 font-bold">إلغاء المسح</button>
                        </div>
                     </div>
                   )}

                   <div className="max-w-xl mx-auto space-y-8">
                      <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl">🪄</div>
                      <h3 className="text-3xl font-black text-slate-800">صناعة فورية بالذكاء الاصطناعي</h3>
                      <input 
                        type="text" 
                        placeholder="اكتب موضوع الدرس (مثال: بحث إشارة الدالة)" 
                        className="w-full px-10 py-7 bg-slate-50 rounded-[2.5rem] border-4 border-transparent focus:border-blue-500 focus:bg-white text-center font-black text-lg outline-none transition-all shadow-inner"
                        value={aiTopic}
                        onChange={e => setAiTopic(e.target.value)}
                      />
                      <button 
                        onClick={() => handleAiGenerate()}
                        disabled={isGenerating || !aiTopic}
                        className="w-full py-7 bg-slate-900 text-white font-black rounded-[2.5rem] text-xl shadow-2xl hover:scale-[1.01] transition-all disabled:opacity-50"
                      >
                        {isGenerating ? 'جاري التحليل والابتكار...' : 'توليد الاختبار الآن ✨'}
                      </button>
                   </div>
                </div>
             </div>
           )}

           {activeTab === 'scanner' && (
             <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl text-center space-y-10 animate-fadeIn">
                <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl">📸</div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-800">ماسح الأوراق الذكي</h3>
                   <p className="text-slate-400 font-medium">حول ملزمتك الورقية أو امتحان قديم إلى اختبار رقمي في ثوانٍ.</p>
                </div>
                <div className="max-w-md mx-auto p-10 border-4 border-dashed border-slate-100 rounded-[3rem] space-y-6 hover:border-emerald-500 transition-all cursor-pointer" onClick={() => scannerInputRef.current?.click()}>
                   <span className="text-6xl block mb-4">📄</span>
                   <p className="font-black text-slate-400">اضغط هنا لرفع صورة أو تصوير ورقة</p>
                   <input type="file" ref={scannerInputRef} className="hidden" accept="image/*" onChange={handleFileScan} />
                </div>
             </div>
           )}

           {activeTab === 'editor' && (
             <div className="space-y-8 animate-fadeIn">
                <div className="flex gap-4">
                   <button onClick={addManualQuestion} className="flex-1 p-8 bg-white border border-slate-100 rounded-[3rem] shadow-lg flex items-center justify-center gap-4 hover:border-blue-600 transition-all group">
                      <span className="text-3xl group-hover:rotate-12 transition-transform">➕</span>
                      <span className="font-black text-slate-800">سؤال نصي</span>
                   </button>
                   <button onClick={() => setShowBoardModal(true)} className="flex-1 p-8 bg-white border border-slate-100 rounded-[3rem] shadow-lg flex items-center justify-center gap-4 hover:border-amber-600 transition-all group">
                      <span className="text-3xl group-hover:rotate-12 transition-transform">🖋️</span>
                      <span className="font-black text-slate-800">سؤال من السبورة</span>
                   </button>
                </div>

                {manualQuestions.map((q, idx) => (
                  <div key={q.id} className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-50 space-y-8 relative group">
                     <div className="flex justify-between items-center border-b border-slate-50 pb-6">
                        <div className="flex items-center gap-4">
                           <span className="w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black">#{idx + 1}</span>
                           <h4 className="font-black text-slate-800">سؤال الاختبار</h4>
                        </div>
                        <button onClick={() => setManualQuestions(prev => prev.filter(x => x.id !== q.id))} className="text-rose-400 hover:text-rose-600">حذف</button>
                     </div>

                     <div className="space-y-6">
                        {q.question.includes('![السبورة]') ? (
                          <div className="flex flex-col items-center">
                             <img src={q.question.match(/\((.*?)\)/)?.[1]} className="max-h-64 rounded-3xl border shadow-lg" alt="" />
                             <span className="text-[10px] font-black text-blue-600 mt-4 uppercase">تم الالتقاط من السبورة ✓</span>
                          </div>
                        ) : (
                          <textarea 
                            className="w-full p-8 bg-slate-50 rounded-3xl font-bold text-lg outline-none focus:ring-4 focus:ring-blue-600/5 h-40" 
                            placeholder="اكتب نص المسألة هنا.. استخدم $ $ للرموز الرياضية."
                            value={q.question}
                            onChange={e => setManualQuestions(prev => prev.map(x => x.id === q.id ? {...x, question: e.target.value} : x))}
                          />
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           {q.options?.map((opt, oi) => (
                             <div key={oi} className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${q.correctAnswer === oi ? 'bg-emerald-50 border-emerald-500' : 'bg-white border-slate-100'}`}>
                                <input type="radio" checked={q.correctAnswer === oi} onChange={() => setManualQuestions(prev => prev.map(x => x.id === q.id ? {...x, correctAnswer: oi} : x))} />
                                <input 
                                  type="text" 
                                  className="bg-transparent font-bold text-sm w-full outline-none" 
                                  value={opt} 
                                  onChange={e => {
                                    const newOpts = [...(q.options || [])];
                                    newOpts[oi] = e.target.value;
                                    setManualQuestions(prev => prev.map(x => x.id === q.id ? {...x, options: newOpts} : x));
                                  }}
                                  placeholder={`خيار ${oi + 1}`}
                                />
                             </div>
                           ))}
                        </div>
                     </div>
                  </div>
                ))}

                {manualQuestions.length > 0 && (
                   <div className="pt-10 flex justify-center">
                      <button 
                        onClick={() => onPublish(quizTitle, targetYearId, manualQuestions, 'native')}
                        disabled={!quizTitle || !targetYearId}
                        className="px-20 py-7 bg-blue-600 text-white rounded-[2.5rem] font-black shadow-2xl hover:scale-105 transition-all disabled:opacity-50 text-xl"
                      >نشر الاختبار النهائي لطلابك ✓</button>
                   </div>
                )}
             </div>
           )}

           {activeTab === 'external' && (
             <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-xl text-center space-y-10 animate-fadeIn">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] mx-auto flex items-center justify-center text-5xl">🔗</div>
                <div className="space-y-4">
                   <h3 className="text-3xl font-black text-slate-800">روابط خارجية (Google Forms)</h3>
                   <p className="text-slate-400 font-medium">أضف رابط أي اختبار خارجي وسيقوم النظام بدمجه داخل حساب الطالب.</p>
                </div>
                <div className="max-w-xl mx-auto space-y-6">
                   <input type="text" placeholder="https://docs.google.com/forms/..." className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-bold text-sm text-left" dir="ltr" />
                   <button className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">نشر الرابط الخارجي</button>
                </div>
             </div>
           )}
        </div>
      </div>

      {showBoardModal && (
        <div className="fixed inset-0 z-[600] bg-slate-950/90 backdrop-blur-xl p-6 flex flex-col animate-fadeIn">
           <div className="flex justify-between items-center mb-6 px-4 text-white">
              <h3 className="text-2xl font-black">السبورة الذكية لإضافة المسائل</h3>
              <button onClick={() => setShowBoardModal(false)} className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">✕</button>
           </div>
           <div className="flex-1 bg-white rounded-[4rem] overflow-hidden shadow-2xl">
              <InteractiveBoard 
                onSave={(dataUrl) => {
                  const newQ: Question = { id: 'mq'+Date.now(), type: 'short_answer', question: `![السبورة](${dataUrl})`, correctAnswer: '', points: 5 };
                  setManualQuestions([...manualQuestions, newQ]);
                  setShowBoardModal(false);
                  setActiveTab('editor');
                }}
                onCancel={() => setShowBoardModal(false)}
                notation={notation}
              />
           </div>
        </div>
      )}
    </div>
  );
};

export default QuizGenerator;
