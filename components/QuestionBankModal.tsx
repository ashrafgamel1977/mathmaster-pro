/**
 * QuestionBankModal.tsx
 * بنك الأسئلة — المعلم يضيف أسئلة للبنك ويسحب منها عند بناء الاختبارات
 */
import React, { useState, useEffect, useMemo } from 'react';
import { Question } from '../types';
import { Search, Plus, Trash2, BookOpen, CheckCircle2, Copy } from 'lucide-react';
import { subscribeToQuestionBank, saveQuestionToBank, deleteQuestionFromBank } from '../services/questionBankService';
import { getTenantId } from '../services/tenantService';

interface QuestionBankModalProps {
    onClose: () => void;
    onInsertQuestions: (questions: Question[]) => void;
    branches?: string[];
}

const QuestionBankModal: React.FC<QuestionBankModalProps> = ({ onClose, onInsertQuestions, branches = ['عام'] }) => {
    const [bankQuestions, setBankQuestions] = useState<Question[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [filterBranch, setFilterBranch] = useState('all');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newQ, setNewQ] = useState<Omit<Question, 'id'>>({
        type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 5, branch: branches[0],
    });

    const tenantId = getTenantId();

    // تحميل عبر الخدمة الموحدة
    useEffect(() => {
        const unsubscribe = subscribeToQuestionBank(tenantId, (data) => {
            setBankQuestions(data);
        });
        return () => unsubscribe();
    }, [tenantId]);

    const filtered = useMemo(() => {
        return bankQuestions.filter(q => {
            const matchSearch = q.question.toLowerCase().includes(searchQuery.toLowerCase());
            const matchBranch = filterBranch === 'all' || q.branch === filterBranch;
            return matchSearch && matchBranch;
        });
    }, [bankQuestions, searchQuery, filterBranch]);

    const toggleSelect = (id: string) => {
        setSelected(prev => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    };

    const handleAddQuestion = async () => {
        if (!newQ.question.trim()) return;
        await saveQuestionToBank(tenantId, newQ as Question);
        setNewQ({ type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: 0, points: 5, branch: branches[0] });
        setShowAddForm(false);
    };

    const handleDelete = async (id: string) => {
        await deleteQuestionFromBank(tenantId, id);
        setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
    };

    const handleInsert = () => {
        const toInsert = filtered.filter(q => selected.has(q.id));
        onInsertQuestions(toInsert);
        onClose();
    };

    const typeLabel = (t: string) => t === 'mcq' ? 'MCQ' : t === 'fill_blanks' ? 'فراغات' : 'مقالي';
    const typeColor = (t: string) => t === 'mcq' ? 'bg-indigo-100 text-indigo-600' : t === 'fill_blanks' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700';

    return (
        <div className="fixed inset-0 z-[4000] bg-slate-900/90 backdrop-blur-lg flex items-center justify-center p-4 animate-fadeIn" dir="rtl">
            <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <BookOpen size={24} />
                        <div>
                            <h2 className="text-xl font-black">بنك الأسئلة</h2>
                            <p className="text-indigo-200 text-xs font-bold">{bankQuestions.length} سؤال محفوظ</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAddForm(v => !v)}
                            className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl font-black text-xs flex items-center gap-2 transition-all"
                        >
                            <Plus size={16} /> إضافة سؤال
                        </button>
                        <button onClick={onClose} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center font-black">✕</button>
                    </div>
                </div>

                {/* Add Form */}
                {showAddForm && (
                    <div className="bg-indigo-50 border-b border-indigo-100 p-6 space-y-3 flex-shrink-0">
                        <h3 className="font-black text-slate-800 text-sm">إضافة سؤال جديد للبنك</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <select value={newQ.type} onChange={e => setNewQ({ ...newQ, type: e.target.value as any })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none">
                                <option value="mcq">اختيار من متعدد</option>
                                <option value="fill_blanks">ملء الفراغات</option>
                                <option value="short_answer">إجابة قصيرة</option>
                            </select>
                            <select value={newQ.branch} onChange={e => setNewQ({ ...newQ, branch: e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none">
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                            <input type="number" min={1} max={20} value={newQ.points} onChange={e => setNewQ({ ...newQ, points: +e.target.value })} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" placeholder="الدرجة" />
                        </div>
                        <textarea
                            value={newQ.question}
                            onChange={e => setNewQ({ ...newQ, question: e.target.value })}
                            placeholder="نص السؤال..."
                            className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none resize-none"
                            rows={2}
                        />
                        {newQ.type === 'mcq' && (
                            <div className="grid grid-cols-2 gap-2">
                                {(newQ.options || []).map((opt, i) => (
                                    <div key={i} className="flex gap-2 items-center">
                                        <input
                                            type="radio" name="correct" checked={newQ.correctAnswer === i}
                                            onChange={() => setNewQ({ ...newQ, correctAnswer: i })}
                                            className="accent-indigo-600"
                                        />
                                        <input
                                            type="text" value={opt}
                                            onChange={e => {
                                                const opts = [...(newQ.options || [])];
                                                opts[i] = e.target.value;
                                                setNewQ({ ...newQ, options: opts });
                                            }}
                                            placeholder={`خيار ${i + 1}`}
                                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}
                        {newQ.type !== 'mcq' && (
                            <input type="text" placeholder="الإجابة الصحيحة" value={newQ.correctAnswer as string} onChange={e => setNewQ({ ...newQ, correctAnswer: e.target.value })} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none" />
                        )}
                        <div className="flex gap-2 justify-end">
                            <button onClick={() => setShowAddForm(false)} className="px-5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-500">إلغاء</button>
                            <button onClick={handleAddQuestion} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg hover:bg-indigo-700">حفظ في البنك</button>
                        </div>
                    </div>
                )}

                {/* Search & Filter */}
                <div className="p-4 border-b border-slate-100 flex gap-3 flex-shrink-0">
                    <div className="flex-1 flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
                        <Search size={16} className="text-slate-400" />
                        <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="ابحث في الأسئلة..." className="flex-1 bg-transparent text-sm font-bold outline-none" />
                    </div>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
                        <option value="all">كل الأبواب</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>

                {/* Questions List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {filtered.length === 0 && (
                        <div className="text-center py-16 space-y-3">
                            <BookOpen size={48} className="text-slate-300 mx-auto" />
                            <p className="text-slate-400 font-bold text-sm">لا توجد أسئلة في البنك بعد.</p>
                            <p className="text-slate-300 text-xs">اضغط "إضافة سؤال" لتبدأ في بناء البنك</p>
                        </div>
                    )}
                    {filtered.map(q => (
                        <div
                            key={q.id}
                            onClick={() => toggleSelect(q.id)}
                            className={`p-4 rounded-2xl border cursor-pointer transition-all flex gap-3 items-start ${selected.has(q.id)
                                    ? 'bg-indigo-50 border-indigo-300 shadow-sm'
                                    : 'bg-white border-slate-200 hover:border-slate-300'
                                }`}
                        >
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${selected.has(q.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
                                }`}>
                                {selected.has(q.id) && <CheckCircle2 size={14} className="text-white" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${typeColor(q.type)}`}>{typeLabel(q.type)}</span>
                                    {q.branch && <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[9px] font-black">{q.branch}</span>}
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-md text-[9px] font-black">{q.points} درجة</span>
                                </div>
                                <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.question}</p>
                                {q.type === 'mcq' && q.options && (
                                    <div className="grid grid-cols-2 gap-1 mt-2">
                                        {q.options.map((opt, i) => (
                                            <span key={i} className={`text-[10px] font-bold px-2 py-1 rounded-lg ${i === q.correctAnswer ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {i === q.correctAnswer ? '✓ ' : ''}{opt}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={e => { e.stopPropagation(); handleDelete(q.id); }}
                                className="w-8 h-8 bg-white border border-rose-200 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-50 flex-shrink-0 transition-all"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                {/* Footer Actions */}
                {selected.size > 0 && (
                    <div className="p-4 border-t border-slate-100 bg-indigo-50 flex justify-between items-center flex-shrink-0">
                        <p className="text-sm font-black text-indigo-700 flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-indigo-600" />
                            تم اختيار {selected.size} سؤال
                        </p>
                        <button
                            onClick={handleInsert}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all"
                        >
                            <Copy size={18} /> إضافة للاختبار
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default QuestionBankModal;
