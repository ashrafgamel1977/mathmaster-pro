
import React, { useState, useRef } from 'react';
import { Quiz, Year, EducationalSource, MathNotation, PlatformSettings, Question } from '../types';
import QuestionBankModal from '../components/QuestionBankModal';


interface QuizQuestion {
    id: string;
    type: 'mcq' | 'fill_blanks' | 'short_answer';
    question: string; // Will hold text or image URL
    options?: string[];
    correctAnswer: string | number;
    points: number;
}

interface QuizGeneratorProps {
    years: Year[];
    sources: EducationalSource[];
    notation: MathNotation;
    quizzes?: Quiz[];
    onPublish: (title: string, yearId: string, questions: any[] | null, type: string, externalLink?: string, fileUrl?: string) => void;
    onDelete?: (id: string) => void;
    settings?: PlatformSettings;
}

const QuizGenerator: React.FC<QuizGeneratorProps> = ({ years, onPublish, quizzes = [], onDelete, settings }) => {
    const [viewMode, setViewMode] = useState<'list' | 'create'>('list');
    const [quizTitle, setQuizTitle] = useState('');
    const [targetYearId, setTargetYearId] = useState('');
    const [quizType, setQuizType] = useState<'native' | 'link' | 'file'>('native');
    const [externalLink, setExternalLink] = useState('');
    const [fileUrl, setFileUrl] = useState('');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [showBankModal, setShowBankModal] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const addQuestion = () => {
        setQuestions([...questions, {
            id: Math.random().toString(36).slice(2, 11),
            type: 'mcq',
            question: '',
            options: ['أ', 'ب', 'ج', 'د'],
            correctAnswer: 0,
            points: 1
        }]);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, qIndex: number) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                const newQs = [...questions];
                // Store image as markdown-like syntax for renderer to handle or just raw url
                newQs[qIndex].question = `![img](${ev.target?.result})`;
                setQuestions(newQs);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMainFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                setFileUrl(ev.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
        const newQs = [...questions];
        newQs[index] = { ...newQs[index], [field]: value };
        setQuestions(newQs);
    };

    const handlePublish = () => {
        if (!quizTitle || !targetYearId) return alert('يرجى إكمال البيانات الأساسية');

        if (quizType === 'native' && questions.length === 0) return alert('يرجى إضافة سؤال واحد على الأقل');
        if (quizType === 'link' && !externalLink) return alert('يرجى إضافة الرابط');
        if (quizType === 'file' && !fileUrl) return alert('يرجى رفع الملف');

        onPublish(quizTitle, targetYearId, quizType === 'native' ? questions : null, quizType, externalLink, fileUrl);

        setQuizTitle('');
        setQuestions([]);
        setExternalLink('');
        setFileUrl('');
        setQuizType('native');
        setViewMode('list');
    };

    if (viewMode === 'list') {
        return (
            <div className="max-w-7xl mx-auto space-y-10 animate-slideUp pb-24 text-right px-4 md:px-0" dir="rtl">
                <div className="bg-indigo-900 p-10 md:p-14 rounded-[4rem] text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
                    <div className="relative z-10 space-y-2">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tight">إدارة الاختبارات ⚡</h2>
                        <p className="text-indigo-200 font-bold text-sm md:text-lg">نظام الامتحانات الشامل (أسئلة، روابط، ملفات).</p>
                    </div>
                    <button
                        onClick={() => setViewMode('create')}
                        className="relative z-10 px-10 py-5 bg-white text-indigo-900 rounded-[2.5rem] font-black text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2"
                    >
                        <span>اختبار جديد</span>
                        <span className="text-xl">＋</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quizzes.map((quiz) => (
                        <div key={quiz.id} className="bg-white p-8 rounded-[3rem] shadow-lg border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex justify-between items-start mb-4">
                                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black">
                                    {years.find(y => y.id === quiz.yearId)?.name || 'عام'}
                                </span>
                                <button
                                    onClick={() => { if (confirm('حذف الاختبار نهائياً؟')) onDelete?.(quiz.id); }}
                                    className="w-8 h-8 rounded-full bg-slate-50 text-rose-400 hover:bg-rose-500 hover:text-white flex items-center justify-center transition-all"
                                >
                                    🗑️
                                </button>
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">{quiz.title}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mt-4">
                                <span className="flex items-center gap-1">📅 {quiz.date}</span>
                                {quiz.type === 'native' && <span className="flex items-center gap-1">📝 {quiz.questions?.length || 0} أسئلة</span>}
                                {quiz.type === 'link' && <span className="flex items-center gap-1">🔗 رابط خارجي</span>}
                                {quiz.type === 'file' && <span className="flex items-center gap-1">📁 ملف مرفق</span>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-slideUp pb-24 text-right" dir="rtl">
            <div className="flex justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
                <button onClick={() => setViewMode('list')} className="text-slate-400 font-bold hover:text-slate-600">إلغاء</button>
                <h3 className="text-xl font-black text-slate-800">إنشاء اختبار جديد</h3>
                <button onClick={handlePublish} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs hover:bg-indigo-700 shadow-lg">نشر الاختبار ✓</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <input type="text" placeholder="عنوان الاختبار (مثال: امتحان الشهر الأول)" className="w-full p-5 bg-white rounded-2xl font-bold border border-slate-200 outline-none focus:border-indigo-600" value={quizTitle} onChange={e => setQuizTitle(e.target.value)} />
                <select className="w-full p-5 bg-white rounded-2xl font-bold border border-slate-200 outline-none" value={targetYearId} onChange={e => setTargetYearId(e.target.value)}>
                    <option value="">اختر الصف الدراسي...</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>
            </div>

            {/* Type Selection */}
            <div className="flex bg-white p-2 rounded-[2rem] border border-slate-100 shadow-sm">
                <button onClick={() => setQuizType('native')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${quizType === 'native' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>أسئلة تفاعلية 📝</button>
                <button onClick={() => setQuizType('link')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${quizType === 'link' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>رابط خارجي 🔗</button>
                <button onClick={() => setQuizType('file')} className={`flex-1 py-3 rounded-2xl font-black text-xs transition-all ${quizType === 'file' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>ملف / صورة 📁</button>
            </div>

            {/* Native Questions Editor */}
            {quizType === 'native' && (
                <>
                    <div className="flex gap-4">
                        <button onClick={addQuestion} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:scale-[1.01] transition-transform">إضافة سؤال (صورة/نص) ➕</button>
                        <button onClick={() => setShowBankModal(true)} className="px-6 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 flex items-center gap-2 transition-all">
                            🏦 من البنك
                        </button>
                    </div>

                    {showBankModal && (
                        <QuestionBankModal
                            onClose={() => setShowBankModal(false)}
                            onInsertQuestions={(qs: Question[]) => {
                                setQuestions(prev => [...prev, ...qs.map(q => ({ ...q, id: q.id + '_' + Date.now() }))]);
                            }}
                            branches={settings?.branches}
                        />
                    )}

                    <div className="space-y-6">
                        {questions.map((q, idx) => (
                            <div key={idx} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg relative group">
                                <button onClick={() => { const n = [...questions]; n.splice(idx, 1); setQuestions(n); }} className="absolute top-6 left-6 text-rose-400 hover:text-rose-600 font-bold text-xs bg-rose-50 px-3 py-1 rounded-lg">حذف السؤال</button>

                                <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                                    <span className="bg-indigo-100 text-indigo-600 w-8 h-8 flex items-center justify-center rounded-lg">{idx + 1}</span>
                                    سؤال جديد
                                </h4>

                                <div className="flex flex-col gap-4">
                                    {q.question.startsWith('![img]') ? (
                                        <div className="relative">
                                            <img src={q.question.slice(7, -1)} className="max-h-60 rounded-2xl border border-slate-200" alt="Question" />
                                            <button onClick={() => updateQuestion(idx, 'question', '')} className="text-rose-500 text-xs font-bold mt-2">إزالة الصورة</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="نص السؤال (أو الصق صورة هنا)"
                                                className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none"
                                                value={q.question}
                                                onChange={e => updateQuestion(idx, 'question', e.target.value)}
                                            />
                                            <label className="p-4 bg-blue-50 text-blue-600 rounded-2xl cursor-pointer hover:bg-blue-100">
                                                📷
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, idx)} />
                                            </label>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4 mt-2">
                                        {q.options?.map((opt, optIdx) => (
                                            <div key={optIdx} onClick={() => updateQuestion(idx, 'correctAnswer', optIdx)} className={`p-4 rounded-2xl border-2 cursor-pointer flex items-center gap-3 transition-all ${q.correctAnswer === optIdx ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 bg-white'}`}>
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${q.correctAnswer === optIdx ? 'border-emerald-500' : 'border-slate-300'}`}>
                                                    {q.correctAnswer === optIdx && <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>}
                                                </div>
                                                <input
                                                    type="text"
                                                    className="bg-transparent outline-none font-bold text-sm w-full"
                                                    value={opt}
                                                    onChange={(e) => {
                                                        const newOpts = [...(q.options || [])];
                                                        newOpts[optIdx] = e.target.value;
                                                        updateQuestion(idx, 'options', newOpts);
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* Link Editor */}
            {quizType === 'link' && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-4 animate-fadeIn">
                    <h4 className="font-black text-slate-800">رابط الاختبار الخارجي</h4>
                    <p className="text-slate-400 text-xs font-bold">يمكنك وضع رابط Google Form أو Microsoft Quiz أو أي منصة أخرى.</p>
                    <input
                        type="url"
                        placeholder="https://docs.google.com/forms/..."
                        className="w-full p-5 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-200 focus:border-indigo-600 ltr"
                        value={externalLink}
                        onChange={e => setExternalLink(e.target.value)}
                    />
                </div>
            )}

            {/* File Editor */}
            {quizType === 'file' && (
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-lg space-y-4 animate-fadeIn text-center">
                    <h4 className="font-black text-slate-800">رفع ملف الاختبار</h4>
                    <p className="text-slate-400 text-xs font-bold">ارفع ملف PDF أو صورة للاختبار ليقوم الطالب بحله.</p>

                    {fileUrl ? (
                        <div className="relative inline-block">
                            <img src={fileUrl} className="max-h-80 rounded-2xl border-4 border-slate-100 shadow-xl" alt="Quiz File" />
                            <button onClick={() => setFileUrl('')} className="absolute -top-3 -right-3 w-8 h-8 bg-rose-500 text-white rounded-full shadow-lg flex items-center justify-center">✕</button>
                        </div>
                    ) : (
                        <div onClick={() => fileInputRef.current?.click()} className="border-4 border-dashed border-slate-200 rounded-[2rem] p-10 cursor-pointer hover:bg-slate-50 transition-all">
                            <span className="text-4xl block mb-2">📂</span>
                            <span className="font-black text-indigo-600">اضغط لرفع الملف</span>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleMainFileUpload} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default QuizGenerator;
