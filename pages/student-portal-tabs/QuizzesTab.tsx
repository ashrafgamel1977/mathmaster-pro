import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Quiz, QuizResult, PlatformSettings, Question } from '../../types';
import {
    Zap, Play, AlertTriangle, CheckCircle2, XCircle, Trophy, Target,
    Clock, ChevronRight, Lock, RotateCcw, BarChart2, TrendingUp
} from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface QuizzesTabProps {
    filteredQuizzes: Quiz[];
    results: QuizResult[];
    studentId: string;
    activeQuiz: Quiz | null;
    activeQuizAnswers: Record<string, string>;
    cheatWarnings: number;
    showCheatAlert: boolean;
    setShowCheatAlert: (v: boolean) => void;
    setActiveQuizAnswers: (fn: (prev: Record<string, string>) => Record<string, string>) => void;
    onStartQuiz: (quiz: Quiz) => void;
    onSubmitQuiz: (forced: boolean) => void;
    settings: PlatformSettings;
    isDark?: boolean;
}

// ─── Question Card ─────────────────────────────────────────────────────────────
const QuestionCard: React.FC<{
    q: Question;
    idx: number;
    answer: string | undefined;
    revealed: boolean;
    onAnswer: (qId: string, val: string) => void;
    buttonTheme: string;
    cardTheme: string;
    textTheme: string;
}> = ({ q, idx, answer, revealed, onAnswer, buttonTheme, cardTheme, textTheme }) => {
    const correctOpt = q.options?.[q.correctAnswer as number];

    return (
        <div className={`${cardTheme} p-6 rounded-[2rem] border border-white/5 transition-all`}>
            <p className="text-white font-bold text-sm mb-5 leading-relaxed">
                <span className={`${textTheme} font-black ml-2`}>{idx + 1}.</span> {q.question}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {q.options?.map((opt, optIdx) => {
                    const isSelected = answer === opt;
                    const isCorrect = opt === correctOpt;
                    let cls = 'text-right px-5 py-3 rounded-xl text-sm font-bold transition-all border ';
                    if (revealed) {
                        if (isCorrect) cls += 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 scale-[1.01]';
                        else if (isSelected && !isCorrect) cls += 'bg-rose-500/20 border-rose-500/50 text-rose-300 line-through';
                        else cls += 'bg-white/3 border-white/3 text-slate-500';
                    } else {
                        if (isSelected) cls += `${buttonTheme} text-white border-transparent shadow-lg scale-[1.02]`;
                        else cls += 'bg-white/5 border-white/5 text-slate-300 hover:bg-white/10 hover:border-white/20';
                    }
                    return (
                        <button
                            key={optIdx}
                            disabled={revealed}
                            onClick={() => onAnswer(q.id, opt)}
                            className={cls}
                        >
                            {revealed && isSelected && !isCorrect && <XCircle size={14} className="inline ml-2 text-rose-400" />}
                            {revealed && isCorrect && <CheckCircle2 size={14} className="inline ml-2 text-emerald-400" />}
                            {opt}
                        </button>
                    );
                })}
            </div>
            {revealed && (
                <div className={`mt-4 text-[11px] font-bold px-3 py-2 rounded-xl ${answer === correctOpt ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {answer === correctOpt ? '✅ إجابة صحيحة!' : `❌ الإجابة الصحيحة: ${correctOpt}`}
                </div>
            )}
        </div>
    );
};

// ─── Result Screen ────────────────────────────────────────────────────────────
const ResultScreen: React.FC<{
    quiz: Quiz;
    answers: Record<string, string>;
    score: number;
    onDone: () => void;
    cardTheme: string;
    buttonTheme: string;
    textTheme: string;
    bgTheme: string;
}> = ({ quiz, answers, score, onDone, cardTheme, buttonTheme, textTheme, bgTheme }) => {
    const questions = quiz.questions || [];
    const correctCount = questions.filter(q => answers[q.id] === q.options?.[q.correctAnswer as number]).length;
    const wrongCount = questions.length - correctCount;
    const isPassed = score >= 70;

    return (
        <div className="space-y-8 pb-24 animate-fadeIn">
            {/* Score Hero */}
            <div className={`${cardTheme} rounded-[3rem] p-10 text-center border border-white/10 relative overflow-hidden`}>
                <div className={`absolute inset-0 ${isPassed ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/5' : 'bg-gradient-to-br from-rose-500/10 to-orange-500/5'}`} />
                <div className="relative z-10 space-y-4">
                    <div className="text-6xl mb-2">{isPassed ? '🏆' : '📚'}</div>
                    <h2 className="text-white font-black text-2xl">{quiz.title}</h2>
                    <div className={`inline-flex items-center justify-center w-36 h-36 rounded-full border-8 mx-auto ${isPassed ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-rose-500/50 bg-rose-500/10'}`}>
                        <div className="text-center">
                            <p className={`text-5xl font-black ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>{score}%</p>
                        </div>
                    </div>
                    <p className={`font-black text-xl ${isPassed ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPassed ? '🎉 ممتاز! اجتزت الاختبار' : '💪 حاول مرة أخرى مع المعلم'}
                    </p>
                </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
                <div className={`${cardTheme} rounded-[2rem] p-5 text-center border border-white/5`}>
                    <p className="text-3xl font-black text-emerald-400 mb-1">{correctCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold">صح ✅</p>
                </div>
                <div className={`${cardTheme} rounded-[2rem] p-5 text-center border border-white/5`}>
                    <p className="text-3xl font-black text-rose-400 mb-1">{wrongCount}</p>
                    <p className="text-[10px] text-slate-400 font-bold">غلط ❌</p>
                </div>
                <div className={`${cardTheme} rounded-[2rem] p-5 text-center border border-white/5`}>
                    <p className="text-3xl font-black text-amber-400 mb-1">{questions.length}</p>
                    <p className="text-[10px] text-slate-400 font-bold">إجمالي</p>
                </div>
            </div>

            {/* Detailed Review */}
            <div>
                <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                    <Target size={20} className={textTheme} /> مراجعة مفصلة
                </h3>
                <div className="space-y-4">
                    {questions.map((q, idx) => {
                        const correctOpt = q.options?.[q.correctAnswer as number];
                        const userAns = answers[q.id];
                        const isCorrect = userAns === correctOpt;
                        return (
                            <div key={q.id} className={`${cardTheme} p-5 rounded-[1.5rem] border ${isCorrect ? 'border-emerald-500/20' : 'border-rose-500/20'}`}>
                                <div className="flex items-start gap-3 mb-3">
                                    <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center mt-0.5 ${isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                                        {isCorrect ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                                    </div>
                                    <p className="text-white text-sm font-bold leading-relaxed">
                                        <span className={`${textTheme} font-black ml-1`}>{idx + 1}.</span> {q.question}
                                    </p>
                                </div>
                                {!isCorrect && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mr-9">
                                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl px-3 py-2">
                                            <p className="text-[10px] text-rose-400 font-black mb-1">إجابتك ❌</p>
                                            <p className="text-rose-300 text-xs font-bold">{userAns || 'لم تجب'}</p>
                                        </div>
                                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2">
                                            <p className="text-[10px] text-emerald-400 font-black mb-1">الصحيحة ✅</p>
                                            <p className="text-emerald-300 text-xs font-bold">{correctOpt}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <button onClick={onDone} className={`w-full py-4 ${buttonTheme} text-white rounded-2xl font-black text-lg shadow-xl hover:scale-[1.02] transition-all`}>
                العودة للاختبارات 🏠
            </button>
        </div>
    );
};

// ─── Countdown Timer ──────────────────────────────────────────────────────────
const CountdownTimer: React.FC<{ durationMins: number; onExpire: () => void; textTheme: string }> = ({ durationMins, onExpire, textTheme }) => {
    const [secs, setSecs] = useState(durationMins * 60);
    const calledRef = useRef(false);

    useEffect(() => {
        const t = setInterval(() => {
            setSecs(prev => {
                if (prev <= 1) {
                    clearInterval(t);
                    if (!calledRef.current) { calledRef.current = true; onExpire(); }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(t);
    }, [onExpire]);

    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    const isLow = secs < 60;
    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-black text-sm ${isLow ? 'bg-rose-500/20 text-rose-400 animate-pulse' : 'bg-black/20 text-white'}`}>
            <Clock size={14} /> {m}:{s}
        </div>
    );
};

// ─── QuizzesTab ────────────────────────────────────────────────────────────────
const QuizzesTab: React.FC<QuizzesTabProps> = ({
    filteredQuizzes, results, studentId,
    activeQuiz, activeQuizAnswers, cheatWarnings, showCheatAlert,
    setShowCheatAlert, setActiveQuizAnswers,
    onStartQuiz, onSubmitQuiz, settings, isDark = true,
}) => {
    const { getCardThemeClasses, getButtonThemeClasses, getButtonTextThemeClasses, getButtonBgThemeClasses } = usePortalTheme(settings.portalTheme, isDark);
    const [resultData, setResultData] = useState<{ quiz: Quiz; answers: Record<string, string>; score: number } | null>(null);

    // ─── Submit quiz and compute result immediately ───────────────────────────
    const handleSubmit = useCallback((forced = false) => {
        if (!activeQuiz) return;
        const questions = activeQuiz.questions || [];
        let score = 0, totalPoints = 0;
        questions.forEach(q => {
            totalPoints += q.points;
            if (activeQuizAnswers[q.id] === q.options?.[q.correctAnswer as number]) score += q.points;
        });
        const pct = totalPoints > 0 ? Math.round((score / totalPoints) * 100) : 0;
        const finalScore = forced ? 0 : pct;

        // Show result screen BEFORE calling parent submit
        if (!forced) {
            setResultData({ quiz: activeQuiz, answers: { ...activeQuizAnswers }, score: finalScore });
        }
        onSubmitQuiz(forced);
    }, [activeQuiz, activeQuizAnswers, onSubmitQuiz]);

    // ─── Quiz List ─────────────────────────────────────────────────────────────
    if (!activeQuiz && !resultData) {
        return (
            <div className="space-y-8 pb-24 animate-fadeIn">
                <h2 className={`text-3xl font-black border-b border-white/10 pb-4 flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                    <Zap className={getButtonTextThemeClasses()} /> الاختبارات
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {filteredQuizzes.map(quiz => {
                        const myResult = results.find(r => r.quizId === quiz.id && r.studentId === studentId);
                        const isDone = !!myResult;
                        const questions = quiz.questions || [];
                        return (
                            <div key={quiz.id} className={`${getCardThemeClasses()} rounded-[2.5rem] border border-white/5 hover:border-white/20 transition-all shadow-lg overflow-hidden group`}>
                                {/* Top color bar */}
                                <div className={`h-2 bg-gradient-to-r ${isDone ? 'from-emerald-500 to-teal-500' : 'from-amber-500 to-orange-500'}`} />
                                <div className="p-6 flex flex-col gap-4">
                                    {/* Header */}
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1">
                                            <h3 className={`font-bold text-lg mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>{quiz.title}</h3>
                                            <div className="flex flex-wrap gap-2">
                                                <span className={`text-[10px] font-bold ${getButtonBgThemeClasses()} ${getButtonTextThemeClasses()} px-2 py-0.5 rounded-lg`}>
                                                    {questions.length} سؤال
                                                </span>
                                                {quiz.duration && (
                                                    <span className="text-[10px] font-bold bg-black/20 text-slate-400 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                                        <Clock size={10} /> {quiz.duration} د
                                                    </span>
                                                )}
                                                <span className="text-[10px] font-bold text-slate-500">{quiz.date}</span>
                                            </div>
                                        </div>
                                        {/* Score Badge */}
                                        {isDone ? (
                                            <div className={`text-center shrink-0 px-4 py-2 rounded-2xl border ${(myResult.score || 0) >= 70 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
                                                <p className={`text-2xl font-black ${(myResult.score || 0) >= 70 ? 'text-emerald-400' : 'text-rose-400'}`}>{myResult.score}%</p>
                                                <p className={`text-[9px] font-bold ${(myResult.score || 0) >= 70 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {(myResult.score || 0) >= 70 ? '✅ ناجح' : '❌ راسب'}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="text-center bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-2 shrink-0">
                                                <Zap size={20} className="mx-auto text-amber-400 mb-1" />
                                                <p className="text-[9px] text-amber-600 font-bold">جديد</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action */}
                                    {isDone ? (
                                        <div className="flex items-center gap-2 py-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl px-4">
                                            <Lock size={14} className="text-emerald-500/60" />
                                            <span className="text-xs font-bold text-emerald-600/80">تم تسليم هذا الاختبار — لا يمكن إعادته</span>
                                        </div>
                                    ) : questions.length === 0 && (quiz.type === 'link' || quiz.externalLink) ? (
                                        <button onClick={() => onStartQuiz(quiz)} className={`w-full py-3 ${getButtonThemeClasses()} text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2`}>
                                            <ChevronRight size={16} /> فتح الرابط الخارجي
                                        </button>
                                    ) : (
                                        <button onClick={() => onStartQuiz(quiz)} className={`w-full py-3 ${getButtonThemeClasses()} text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-all`}>
                                            <Play size={16} /> ابدأ الاختبار
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    {filteredQuizzes.length === 0 && (
                        <div className={`col-span-full ${getCardThemeClasses()} p-16 rounded-[3rem] border border-dashed border-slate-700 text-center`}>
                            <Zap size={48} className="mx-auto mb-4 text-amber-500/30" />
                            <p className="text-slate-400 font-bold">لا توجد اختبارات متاحة لصفك الدراسي حالياً.</p>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ─── Result Screen (shown after submit) ────────────────────────────────────
    if (resultData && !activeQuiz) {
        return (
            <ResultScreen
                quiz={resultData.quiz}
                answers={resultData.answers}
                score={resultData.score}
                onDone={() => setResultData(null)}
                cardTheme={getCardThemeClasses()}
                buttonTheme={getButtonThemeClasses()}
                textTheme={getButtonTextThemeClasses()}
                bgTheme={getButtonBgThemeClasses()}
            />
        );
    }

    // ─── Active Quiz ──────────────────────────────────────────────────────────
    if (!activeQuiz) return null;
    const questions = activeQuiz.questions || [];
    const answeredCount = Object.keys(activeQuizAnswers).length;
    const progressPct = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

    return (
        <div className="space-y-6 pb-24 animate-fadeIn">
            {/* Anti-Cheat Alert */}
            {showCheatAlert && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
                    <div className="bg-red-900 border border-red-500 rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
                        <AlertTriangle size={48} className="mx-auto text-red-400 mb-4" />
                        <h3 className="text-xl font-black text-white mb-2">تحذير ⚠️</h3>
                        <p className="text-red-200 text-sm font-bold mb-6">تم رصد محاولة مغادرة الاختبار ({cheatWarnings}/3).</p>
                        <button onClick={() => setShowCheatAlert(false)} className="w-full py-3 bg-red-600 text-white rounded-xl font-black">فهمت، أعود للاختبار</button>
                    </div>
                </div>
            )}

            {/* Quiz Header */}
            <div className={`${getCardThemeClasses()} p-5 rounded-[2rem] border border-white/5 flex items-center justify-between gap-4`}>
                <div>
                    <h2 className={`font-black text-lg ${isDark ? 'text-white' : 'text-slate-800'}`}>{activeQuiz.title}</h2>
                    <p className={`text-xs font-bold ${getButtonTextThemeClasses()}`}>
                        {answeredCount}/{questions.length} سؤال تم الإجابة عليه
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {cheatWarnings > 0 && (
                        <span className="bg-red-500/20 text-red-400 border border-red-500/30 px-3 py-1 rounded-lg text-xs font-bold">
                            ⚠️ تحذير {cheatWarnings}/3
                        </span>
                    )}
                    {activeQuiz.duration && (
                        <CountdownTimer
                            durationMins={activeQuiz.duration}
                            onExpire={() => handleSubmit(false)}
                            textTheme={getButtonTextThemeClasses()}
                        />
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${getButtonThemeClasses().split(' ')[0]}`}
                    style={{ width: `${progressPct}%` }}
                />
            </div>

            {/* Questions */}
            <div className="space-y-5">
                {questions.map((q, idx) => (
                    <QuestionCard
                        key={q.id}
                        q={q}
                        idx={idx}
                        answer={activeQuizAnswers[q.id]}
                        revealed={false}
                        onAnswer={(qId, val) => setActiveQuizAnswers(prev => ({ ...prev, [qId]: val }))}
                        buttonTheme={getButtonThemeClasses()}
                        cardTheme={getCardThemeClasses()}
                        textTheme={getButtonTextThemeClasses()}
                    />
                ))}
            </div>

            {/* Submit Button */}
            <div className={`${getCardThemeClasses()} p-5 rounded-[2rem] border border-white/5`}>
                <div className="flex items-center justify-between mb-4">
                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-700'}`}>
                        أجبت على <span className={`${getButtonTextThemeClasses()} font-black`}>{answeredCount}</span> من {questions.length} سؤال
                    </span>
                    {answeredCount < questions.length && (
                        <span className="text-xs text-amber-400 font-bold bg-amber-500/10 px-3 py-1 rounded-lg">
                            {questions.length - answeredCount} سؤال متبقي
                        </span>
                    )}
                </div>
                <button
                    onClick={() => handleSubmit(false)}
                    disabled={answeredCount === 0}
                    className={`w-full py-4 rounded-2xl font-black text-lg shadow-xl transition-all ${answeredCount > 0 ? `${getButtonThemeClasses()} text-white hover:scale-[1.02]` : 'bg-white/5 text-slate-500 cursor-not-allowed'}`}
                >
                    {answeredCount === questions.length ? 'تسليم الاختبار 🚀' : `تسليم (${answeredCount}/${questions.length} مجاب)`}
                </button>
            </div>
        </div>
    );
};

export default QuizzesTab;
