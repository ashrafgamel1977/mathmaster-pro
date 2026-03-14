
import React, { useState, useEffect, useMemo } from 'react';
import { Question, Year, PlatformSettings } from '../types';
import { subscribeToQuestionBank, saveQuestionToBank, deleteQuestionFromBank } from '../services/questionBankService';
import { getTenantId } from '../services/tenantService';

interface QuestionBankProps {
  years: Year[];
  settings?: PlatformSettings;
}

const QuestionBank: React.FC<QuestionBankProps> = ({ years, settings }) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filterSubject, setFilterSubject] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
    type: 'mcq',
    question: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    points: 10,
    branch: ''
  });

  const tenantId = getTenantId();

  useEffect(() => {
    const unsubscribe = subscribeToQuestionBank(tenantId, (data) => {
      setQuestions(data);
    });
    return () => unsubscribe();
  }, [tenantId]);

  const filteredQuestions = useMemo(() => {
    if (filterSubject === 'all') return questions;
    return questions.filter(q => q.branch === filterSubject);
  }, [questions, filterSubject]);

  const subjects = useMemo(() => {
    const s = new Set<string>();
    questions.forEach(q => q.branch && s.add(q.branch));
    return Array.from(s);
  }, [questions]);

  const handleSave = async () => {
    if (!newQuestion.question || !newQuestion.branch) return alert('برجاء إكمال البيانات (السؤال والمادة)');
    await saveQuestionToBank(tenantId, newQuestion as Question);
    setShowAddModal(false);
    setNewQuestion({ type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 10, branch: '' });
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto p-4 md:p-8 text-right font-['Cairo']" dir="rtl">
      {/* Header */}
      <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-800">بنك الأسئلة المركزي 🧠</h2>
          <p className="text-slate-500 mt-2">قم بإنشاء مكتبة أسئلة احترافية لإعادة استخدامها في الاختبارات.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:scale-105 transition-all"
        >
          إضافة سؤال جديد ＋
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
        <button 
          onClick={() => setFilterSubject('all')}
          className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${filterSubject === 'all' ? 'bg-slate-800 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
        >
          الكل ({questions.length})
        </button>
        {subjects.map(s => (
          <button 
            key={s}
            onClick={() => setFilterSubject(s)}
            className={`px-6 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${filterSubject === s ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border border-slate-100'}`}
          >
            {s} ({questions.filter(q => q.branch === s).length})
          </button>
        ))}
      </div>

      {/* Question List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredQuestions.map(q => (
          <div key={q.id} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-md transition-all group relative">
            <div className="flex justify-between items-start mb-4">
              <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black">{q.branch}</span>
              <button 
                onClick={() => deleteQuestionFromBank(tenantId, q.id)}
                className="w-8 h-8 flex items-center justify-center bg-rose-50 text-rose-400 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500 hover:text-white"
              >
                🗑️
              </button>
            </div>
            <p className="font-black text-slate-800 mb-4 text-lg">{q.question}</p>
            {q.type === 'mcq' && q.options && (
              <div className="grid grid-cols-2 gap-2">
                {q.options.map((opt, i) => (
                  <div 
                    key={i} 
                    className={`p-3 rounded-xl text-xs font-bold ${Number(q.correctAnswer) === i ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-50 text-slate-500 border border-transparent'}`}
                  >
                    {opt}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400">القيمة: {q.points} نقطة</span>
              <span className="text-[10px] font-bold text-slate-400">{q.type === 'mcq' ? 'اختيار من متعدد' : 'سؤال مقالي'}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredQuestions.length === 0 && (
        <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-100">
          <p className="text-slate-400 font-bold">لا يوجد أسئلة حالياً. ابدأ بإضافة سؤالك الأول!</p>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] p-8 md:p-12 shadow-2xl relative max-h-[90vh] overflow-y-auto custom-scrollbar">
            <button onClick={() => setShowAddModal(false)} className="absolute top-8 left-8 text-slate-400 hover:text-rose-500 transition-all">✕</button>
            <h3 className="text-2xl font-black text-slate-800 mb-8">إضافة سؤال للبنك 🚀</h3>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 mr-2">نص السؤال</label>
                <textarea 
                  className="w-full p-5 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold min-h-[100px]"
                  placeholder="اكتب السؤال هنا..."
                  value={newQuestion.question}
                  onChange={e => setNewQuestion({...newQuestion, question: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">المادة / الفرع</label>
                  <input 
                    list="subjects-list"
                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    placeholder="مثل: جبر، هندسة..."
                    value={newQuestion.branch}
                    onChange={e => setNewQuestion({...newQuestion, branch: e.target.value})}
                  />
                  <datalist id="subjects-list">
                    {subjects.map(s => <option key={s} value={s} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 mr-2">النقاط</label>
                  <input 
                    type="number"
                    className="w-full p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    value={newQuestion.points}
                    onChange={e => setNewQuestion({...newQuestion, points: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 mr-2">الخيارات (للاختيار من متعدد)</label>
                {newQuestion.options?.map((opt, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input 
                      type="radio"
                      name="correct"
                      checked={Number(newQuestion.correctAnswer) === i}
                      onChange={() => setNewQuestion({...newQuestion, correctAnswer: i})}
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                    <input 
                      className={`flex-1 p-4 rounded-2xl outline-none font-bold transition-all ${Number(newQuestion.correctAnswer) === i ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50'}`}
                      placeholder={`الخيار ${i + 1}`}
                      value={opt}
                      onChange={e => {
                        const opts = [...(newQuestion.options || [])];
                        opts[i] = e.target.value;
                        setNewQuestion({...newQuestion, options: opts});
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={handleSave} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:scale-[1.02] transition-all">حفظ في البنك ✓</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-[2rem] font-black">إلغاء</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuestionBank;
