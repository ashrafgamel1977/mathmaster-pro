import React, { useState } from 'react';
import { QuizResult, PlatformSettings } from '../../types';
import { BarChart2, ChevronDown, ChevronUp, Trophy, Target, TrendingUp, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface ResultsTabProps {
    results: QuizResult[];
    studentId: string;
    settings: PlatformSettings;
    isDark?: boolean;
}

const ResultsTab: React.FC<ResultsTabProps> = ({ results, studentId, settings, isDark = true }) => {
    const { getCardThemeClasses, getButtonTextThemeClasses, getButtonBgThemeClasses } = usePortalTheme(settings.portalTheme, isDark);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const myResults = results.filter(r => r.studentId === studentId).sort((a, b) => b.date.localeCompare(a.date));

    // ─── Statistics ───────────────────────────────────────────────────────────
    const totalQuizzes = myResults.length;
    const avgScore = totalQuizzes > 0 ? Math.round(myResults.reduce((sum, r) => sum + (r.score || 0), 0) / totalQuizzes) : 0;
    const bestScore = totalQuizzes > 0 ? Math.max(...myResults.map(r => r.score || 0)) : 0;
    const passedCount = myResults.filter(r => (r.score || 0) >= 70).length;
    const passRate = totalQuizzes > 0 ? Math.round((passedCount / totalQuizzes) * 100) : 0;

    // Ranking among all students
    const allStudentAvgs = Object.entries(
        results.reduce((acc, r) => {
            if (!acc[r.studentId]) acc[r.studentId] = [];
            acc[r.studentId].push(r.score || 0);
            return acc;
        }, {} as Record<string, number[]>)
    ).map(([sid, scores]) => ({
        studentId: sid,
        avg: Math.round((scores as number[]).reduce((a: number, b: number) => a + b, 0) / (scores as number[]).length)

    })).sort((a, b) => b.avg - a.avg);
    const myRank = allStudentAvgs.findIndex(s => s.studentId === studentId) + 1;
    const totalStudents = allStudentAvgs.length;

    const statCards = [
        { label: 'إجمالي الاختبارات', value: totalQuizzes, icon: '📋', color: 'from-indigo-500 to-blue-600' },
        { label: 'متوسط الدرجات', value: `${avgScore}%`, icon: '📊', color: 'from-amber-500 to-orange-500' },
        { label: 'أعلى درجة', value: `${bestScore}%`, icon: '🏆', color: 'from-emerald-500 to-teal-500' },
        { label: 'ترتيبك بين الطلاب', value: myRank > 0 ? `#${myRank}` : 'N/A', icon: '🥇', color: 'from-rose-500 to-pink-500' },
    ];

    return (
        <div className="space-y-8 pb-24 animate-fadeIn">
            <h2 className={`text-3xl font-black text-white border-b border-white/10 pb-4 flex items-center gap-3`}>
                <BarChart2 className={getButtonTextThemeClasses()} /> نتائجي
            </h2>

            {/* Stats Cards */}
            {totalQuizzes > 0 && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((card, i) => (
                        <div key={i} className={`${getCardThemeClasses()} rounded-[2rem] p-5 border border-white/5 flex flex-col items-center text-center gap-2 relative overflow-hidden`}>
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-10`} />
                            <span className="text-3xl relative z-10">{card.icon}</span>
                            <p className="text-2xl font-black text-white relative z-10">{card.value}</p>
                            <p className="text-[10px] text-slate-400 font-bold relative z-10">{card.label}</p>
                        </div>
                    ))}
                </div>
            )}

            {/* Pass Rate Bar */}
            {totalQuizzes > 0 && (
                <div className={`${getCardThemeClasses()} rounded-[2rem] p-6 border border-white/5`}>
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-white font-bold text-sm flex items-center gap-2"><Target size={16} className={getButtonTextThemeClasses()} /> نسبة النجاح</span>
                        <span className={`font-black text-lg ${passRate >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{passRate}%</span>
                    </div>
                    <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${passRate >= 70 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-rose-500 to-orange-400'}`} style={{ width: `${passRate}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 font-bold">{passedCount} من {totalQuizzes} اختبارات ناجحة (70% فأعلى)</p>
                </div>
            )}

            {/* Results List */}
            <div className="space-y-4">
                {myResults.length === 0 ? (
                    <div className={`${getCardThemeClasses()} p-16 rounded-[3rem] border border-dashed border-slate-700 text-center`}>
                        <BarChart2 size={48} className="mx-auto mb-4 text-slate-600" />
                        <p className="text-slate-400 font-bold">لا توجد نتائج بعد. حل اختبارات لتظهر هنا.</p>
                    </div>
                ) : myResults.map(res => {
                    const score = typeof res.score === 'number' ? res.score : 0;
                    const isGood = score >= 70;
                    const isExpanded = expandedId === res.id;

                    // Weak points analysis
                    const wrongAnswers = (res.attempts || []).filter(a => !a.isCorrect);
                    const correctAnswers = (res.attempts || []).filter(a => a.isCorrect);
                    const hasAttempts = (res.attempts || []).length > 0;

                    return (
                        <div key={res.id} className={`${getCardThemeClasses()} rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all shadow-lg overflow-hidden`}>
                            {/* Result Header */}
                            <div className="p-6 flex flex-col md:flex-row md:items-center gap-5">
                                <div className={`w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-2xl font-black shrink-0 ${isGood ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                                    {score}%
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="font-bold text-white text-base">{res.quizTitle}</h3>
                                        <div className="flex items-center gap-2">
                                            {res.isCheatSuspected && <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/20 px-2 py-0.5 rounded-lg font-bold ml-2 shrink-0">⚠️ مشبوه</span>}
                                            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${isGood ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                                                {isGood ? '✅ ناجح' : '❌ راسب'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 mb-3">
                                        <span className="text-[10px] text-slate-500 font-bold">{res.date}</span>
                                        {hasAttempts && (
                                            <span className="text-[10px] text-slate-500 font-bold">
                                                {correctAnswers.length} صح / {wrongAnswers.length} غلط
                                            </span>
                                        )}
                                    </div>
                                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full transition-all ${isGood ? 'bg-emerald-500' : 'bg-rose-500'}`} style={{ width: `${score}%` }} />
                                    </div>
                                </div>
                                {hasAttempts && (
                                    <button
                                        onClick={() => setExpandedId(isExpanded ? null : res.id)}
                                        className={`shrink-0 w-10 h-10 ${getButtonBgThemeClasses()} ${getButtonTextThemeClasses()} rounded-full flex items-center justify-center transition-all hover:scale-110`}
                                    >
                                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>
                                )}
                            </div>

                            {/* Weak Points Analysis (Expandable) */}
                            {isExpanded && hasAttempts && (
                                <div className="border-t border-white/5 p-6 space-y-6 animate-fadeIn">
                                    {/* Summary Cards */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
                                            <CheckCircle2 size={20} className="mx-auto text-emerald-400 mb-1" />
                                            <p className="text-2xl font-black text-emerald-400">{correctAnswers.length}</p>
                                            <p className="text-[10px] text-emerald-600 font-bold">إجابات صحيحة</p>
                                        </div>
                                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                                            <XCircle size={20} className="mx-auto text-rose-400 mb-1" />
                                            <p className="text-2xl font-black text-rose-400">{wrongAnswers.length}</p>
                                            <p className="text-[10px] text-rose-600 font-bold">إجابات خاطئة</p>
                                        </div>
                                        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                                            <TrendingUp size={20} className="mx-auto text-amber-400 mb-1" />
                                            <p className="text-2xl font-black text-amber-400">{score}%</p>
                                            <p className="text-[10px] text-amber-600 font-bold">النتيجة</p>
                                        </div>
                                    </div>

                                    {/* Wrong Answers — Topics to Review */}
                                    {wrongAnswers.length > 0 && (
                                        <div>
                                            <h4 className="text-white font-black mb-3 flex items-center gap-2 text-sm">
                                                <AlertTriangle size={16} className="text-amber-400" /> المواضيع التي تحتاج مراجعة
                                            </h4>
                                            <div className="space-y-3">
                                                {wrongAnswers.map((attempt, idx) => (
                                                    <div key={idx} className="bg-rose-500/5 border border-rose-500/10 rounded-2xl p-4">
                                                        <p className="text-slate-200 text-sm font-bold mb-3 leading-relaxed">{attempt.questionText}</p>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                                            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                                                                <p className="text-[10px] text-rose-400 font-black mb-1">إجابتك ❌</p>
                                                                <p className="text-rose-300 text-xs font-bold">{attempt.userAnswer}</p>
                                                            </div>
                                                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                                                <p className="text-[10px] text-emerald-400 font-black mb-1">الإجابة الصحيحة ✅</p>
                                                                <p className="text-emerald-300 text-xs font-bold">{attempt.correctAnswer}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* All Correct! */}
                                    {wrongAnswers.length === 0 && (
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6 text-center">
                                            <Trophy size={32} className="mx-auto text-emerald-400 mb-2" />
                                            <p className="text-emerald-400 font-black">ممتاز! أجبت على كل الأسئلة صح 🎉</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default ResultsTab;
