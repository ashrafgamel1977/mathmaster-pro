import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Student, Assignment, PlatformSettings, QuizResult } from '../../types';
import { analyzeStudentPerformance, getWeakPoints } from '../../services/analyticsService';
import StudentHero from '../../components/StudentHero';
import { FileText, CheckCircle2, Clock, Play, Pause, RotateCcw, Zap, Video, Bell, Trophy, Flame, AlertTriangle } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';
import { ALL_BADGES } from '../../services/badgeService';


interface DashboardTabProps {
    student: Student;
    level: number;
    progressToNextLevel: number;
    streaks: number;
    pendingAssignments: Assignment[];
    subjects: { id: string; name: string; icon: string; color: string }[];
    selectedSubject: string;
    setSelectedSubject: (s: string) => void;
    setActiveTab: (t: string) => void;
    setScannedAsgId: (id: string) => void;
    setShowScanner: (v: boolean) => void;
    isTargetForLive: boolean;
    setShowLiveStream: (v: boolean) => void;
    settings: PlatformSettings;
    results: QuizResult[];
    isDark?: boolean;
}

// ─── Weakness Analysis Component ──────────────────────────────────────────────
const WeaknessAnalysis: React.FC<{ results: QuizResult[], cardClass: string }> = ({ results, cardClass }) => {
    const analysis = analyzeStudentPerformance(results);
    const weakPoints = getWeakPoints(analysis).slice(0, 3);

    if (weakPoints.length === 0) return null;

    return (
        <div className={`${cardClass} rounded-[2.5rem] p-6 border border-white/5 shadow-lg`}>
            <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-rose-500" /> موضوعات تحتاج مراجعة 🧠
            </h3>
            <div className="space-y-4">
                {weakPoints.map((p, idx) => (
                    <div key={idx} className="bg-white/5 p-4 rounded-2xl border-r-4 border-rose-500">
                        <div className="flex justify-between items-center mb-1">
                            <span className="font-black text-slate-200 text-xs">{p.topic}</span>
                            <span className="text-[10px] font-bold text-rose-400">{100 - p.scorePercentage}% أخطاء</span>
                        </div>
                        <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-rose-500" style={{ width: `${100 - p.scorePercentage}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[10px] text-slate-500 font-bold mt-4 text-center italic">أنصحك بمراجعة فيديوهات شرح هذه الدروس مجدداً.</p>
        </div>
    );
};

// ─── Study Timer Component ────────────────────────────────────────────────────
const DURATIONS = [
    { label: '25 دقيقة', value: 25 * 60 },
    { label: '45 دقيقة', value: 45 * 60 },
    { label: '60 دقيقة', value: 60 * 60 },
];

const StudyTimer: React.FC<{ cardClass: string; buttonClass: string; textClass: string }> = ({ cardClass, buttonClass, textClass }) => {
    const [duration, setDuration] = useState(DURATIONS[0].value);
    const [timeLeft, setTimeLeft] = useState(DURATIONS[0].value);
    const [isRunning, setIsRunning] = useState(false);
    const [completed, setCompleted] = useState(false);
    const intervalRef = useRef<any>(null);

    const percent = Math.round(((duration - timeLeft) / duration) * 100);
    const mins = Math.floor(timeLeft / 60).toString().padStart(2, '0');
    const secs = (timeLeft % 60).toString().padStart(2, '0');

    const reset = useCallback(() => {
        clearInterval(intervalRef.current);
        setIsRunning(false);
        setCompleted(false);
        setTimeLeft(duration);
    }, [duration]);

    useEffect(() => {
        reset();
    }, [duration, reset]);

    useEffect(() => {
        if (!isRunning) return;
        intervalRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(intervalRef.current);
                    setIsRunning(false);
                    setCompleted(true);
                    // Browser notification
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification('⏰ انتهى وقت المذاكرة!', { body: 'أحسنت! خذ استراحة قصيرة.', dir: 'rtl' });
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(intervalRef.current);
    }, [isRunning]);

    const circumference = 2 * Math.PI * 54;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    return (
        <div className={`${cardClass} rounded-[2.5rem] p-6 border border-white/5 shadow-lg`}>
            <h3 className="text-white font-black text-lg mb-5 flex items-center gap-2">
                <Bell size={20} className="text-amber-400" /> موقت المذاكرة
            </h3>

            {/* Duration Selector */}
            {!isRunning && !completed && (
                <div className="flex gap-2 mb-5">
                    {DURATIONS.map(d => (
                        <button
                            key={d.value}
                            onClick={() => setDuration(d.value)}
                            className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${duration === d.value ? 'bg-white text-slate-900 shadow' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
                        >
                            {d.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Circular Timer */}
            <div className="flex flex-col items-center gap-5">
                <div className="relative w-36 h-36">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                        <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                        <circle
                            cx="60" cy="60" r="54" fill="none"
                            stroke={completed ? '#10b981' : isRunning ? '#f59e0b' : '#6366f1'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        {completed ? (
                            <span className="text-3xl">🎉</span>
                        ) : (
                            <>
                                <span className="text-3xl font-black text-white font-mono">{mins}:{secs}</span>
                                <span className="text-[10px] text-slate-500 font-bold">{isRunning ? 'جارٍ...' : 'جاهز'}</span>
                            </>
                        )}
                    </div>
                </div>

                {completed ? (
                    <div className="text-center space-y-3">
                        <p className="text-emerald-400 font-black text-sm">أحسنت! أكملت جلسة المذاكرة 🎉</p>
                        <button onClick={reset} className={`px-6 py-2 ${buttonClass} text-white rounded-full text-xs font-black flex items-center gap-2 mx-auto`}>
                            <RotateCcw size={14} /> جلسة جديدة
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-3">
                        <button
                            onClick={() => setIsRunning(v => !v)}
                            className={`flex items-center gap-2 px-6 py-3 ${buttonClass} text-white rounded-full font-black text-sm shadow-lg transition-all hover:scale-105`}
                        >
                            {isRunning ? <><Pause size={16} /> إيقاف مؤقت</> : <><Play size={16} /> ابدأ المذاكرة</>}
                        </button>
                        {(isRunning || timeLeft !== duration) && (
                            <button onClick={reset} className="w-12 h-12 bg-white/5 text-slate-400 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                                <RotateCcw size={16} />
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Badges Showcase ────────────────────────────────────────────────────────
const BadgesShowcase: React.FC<{ student: Student; cardClass: string }> = ({ student, cardClass }) => {
    const [showAll, setShowAll] = useState(false);
    const earned = new Set((student.badges || []).map(b => b.id));
    const displayed = showAll ? ALL_BADGES : ALL_BADGES.slice(0, 6);

    return (
        <div className={`${cardClass} rounded-[2.5rem] p-6 border border-white/5 shadow-lg`}>
            <div className="flex justify-between items-center mb-5">
                <h3 className="text-white font-black text-lg flex items-center gap-2">
                    <Trophy size={20} className="text-amber-400" /> أوسمتي
                    {student.badges?.length > 0 && (
                        <span className="bg-amber-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                            {student.badges.length}
                        </span>
                    )}
                </h3>
                <button onClick={() => setShowAll(v => !v)} className="text-xs text-slate-400 hover:text-white font-bold">
                    {showAll ? 'إخفاء' : 'الكل'}
                </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
                {displayed.map(badge => {
                    const isEarned = earned.has(badge.id);
                    const earnedBadge = student.badges?.find(b => b.id === badge.id);
                    return (
                        <div
                            key={badge.id}
                            title={badge.description}
                            className={`relative flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${isEarned
                                    ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/10 border-amber-500/30 shadow-lg shadow-amber-900/20'
                                    : 'bg-white/3 border-white/5 opacity-40'
                                }`}
                        >
                            <span className={`text-3xl ${isEarned ? '' : 'grayscale'}`}>{badge.icon}</span>
                            <p className={`text-[10px] font-black text-center leading-tight ${isEarned ? 'text-amber-300' : 'text-slate-500'
                                }`}>{badge.name}</p>
                            {isEarned && earnedBadge?.awardedAt && (
                                <span className="text-[8px] text-slate-500 font-bold">
                                    {new Date(earnedBadge.awardedAt).toLocaleDateString('ar-EG')}
                                </span>
                            )}
                            {!isEarned && (
                                <span className="absolute top-1 right-1 text-[8px]">🔒</span>
                            )}
                        </div>
                    );
                })}
            </div>
            {student.badges?.length === 0 && (
                <p className="text-slate-500 text-xs text-center mt-2 font-bold">حل اختبارك الأول لتحصل على أول وسام! 🎯</p>
            )}
        </div>
    );
};

// ─── Streak Widget ────────────────────────────────────────────────────────────
const StreakWidget: React.FC<{ streaks: number; cardClass: string }> = ({ streaks, cardClass }) => {
    const days = Math.min(streaks, 7);
    const dotsFull = Array.from({ length: 7 }, (_, i) => i < days);
    const label = streaks === 0 ? 'ابدأ اليوم!' : streaks === 1 ? 'يوم واحد ✅' : `${streaks} يوم متتالي`;
    const color = streaks >= 7 ? 'text-amber-400' : streaks >= 3 ? 'text-orange-400' : 'text-rose-400';

    return (
        <div className={`${cardClass} rounded-[2.5rem] p-6 border border-white/5 shadow-lg flex flex-col gap-4`}>
            <h3 className="text-white font-black text-lg flex items-center gap-2">
                <Flame size={20} className="text-orange-400" /> تتابع الدراسة
            </h3>
            <div className="flex flex-col items-center gap-3">
                <div className={`text-5xl font-black ${color} font-mono`}>{streaks}</div>
                <p className={`text-sm font-black ${color}`}>{label}</p>
                <div className="flex gap-2 mt-1">
                    {dotsFull.map((filled, i) => (
                        <div
                            key={i}
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${filled
                                    ? 'bg-gradient-to-br from-orange-400 to-amber-500 shadow-lg shadow-orange-900/30'
                                    : 'bg-white/5 border border-white/10'
                                }`}
                        >
                            {filled ? '🔥' : ''}
                        </div>
                    ))}
                </div>
                <p className="text-[10px] text-slate-500 font-bold text-center">
                    {streaks >= 7 ? '🏆 أسبوع كامل — أنت بطل!' : `ادخل ${7 - days} أيام أخرى لتحصل على وسام الأسبوع`}
                </p>
            </div>
        </div>
    );
};

// ─── DashboardTab ──────────────────────────────────────────────────────────────
const DashboardTab: React.FC<DashboardTabProps> = ({
    student, level, progressToNextLevel, streaks,
    pendingAssignments, subjects, selectedSubject, setSelectedSubject,
    setActiveTab, setScannedAsgId, setShowScanner,
    isTargetForLive, setShowLiveStream, settings, results, isDark = true,
}) => {
    const { getCardThemeClasses, getButtonTextThemeClasses, getButtonBgThemeClasses, getButtonThemeClasses } = usePortalTheme(settings.portalTheme, isDark);

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            {/* Hero Section */}
            <StudentHero
                student={student}
                level={level}
                progressToNextLevel={progressToNextLevel}
                streaks={streaks}
                cardThemeClass={getCardThemeClasses()}
                buttonTextThemeClass={getButtonTextThemeClasses()}
            />

            {/* Live Banner */}
            {isTargetForLive && (
                <div onClick={() => setShowLiveStream(true)} className="bg-gradient-to-r from-rose-600 to-red-600 rounded-[2.5rem] p-6 text-white shadow-xl shadow-rose-900/20 animate-pulse cursor-pointer flex items-center justify-between gap-4 border border-rose-400/30">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white backdrop-blur-sm"><Video size={28} /></div>
                        <div><h3 className="font-black text-lg">بث مباشر الآن</h3><p className="text-xs font-bold text-rose-100">انضم للحصة التفاعلية فوراً</p></div>
                    </div>
                    <div className="bg-white text-rose-600 w-10 h-10 rounded-full flex items-center justify-center shadow-lg"><Play size={20} className="ml-1" /></div>
                </div>
            )}

            {/* Streak + Badges Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <StreakWidget streaks={student.streaks || 0} cardClass={getCardThemeClasses()} />
                <WeaknessAnalysis results={results} cardClass={getCardThemeClasses()} />
                <BadgesShowcase student={student} cardClass={getCardThemeClasses()} />
            </div>

            {/* Study Timer + Urgent Tasks Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Timer */}
                <StudyTimer
                    cardClass={getCardThemeClasses()}
                    buttonClass={getButtonThemeClasses()}
                    textClass={getButtonTextThemeClasses()}
                />

                {/* Urgent Tasks */}
                <div className={`${getCardThemeClasses()} rounded-[2.5rem] p-6 border border-white/5 shadow-lg`}>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-white font-black text-lg flex items-center gap-2"><Clock size={20} className="text-amber-500" /> مهام مطلوبة</h3>
                        <button onClick={() => setActiveTab('assignments')} className={`text-xs ${getButtonTextThemeClasses()} font-bold hover:text-white`}>عرض الكل</button>
                    </div>
                    {pendingAssignments.length > 0 ? (
                        <div className="flex flex-col gap-3">
                            {pendingAssignments.slice(0, 3).map(asg => (
                                <div key={asg.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl ${getButtonBgThemeClasses()} ${getButtonTextThemeClasses()} flex items-center justify-center`}><FileText size={18} /></div>
                                        <div>
                                            <p className="font-bold text-slate-200 text-xs mb-1 line-clamp-1">{asg.title}</p>
                                            <span className="text-[10px] font-black text-rose-400">{asg.dueDate}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => { if (asg.externalLink) window.open(asg.externalLink, '_blank'); else { setScannedAsgId(asg.id); setShowScanner(true); } }} className={`w-9 h-9 bg-white ${getButtonTextThemeClasses()} rounded-full flex items-center justify-center hover:scale-110 transition-transform`}><Zap size={16} /></button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-36 gap-3">
                            <CheckCircle2 size={40} className="text-emerald-500/50" />
                            <p className="text-slate-400 font-bold text-sm">لا توجد مهام جديدة 🎉</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Subjects Pills */}
            <div>
                <h3 className="text-white font-black text-lg mb-4 flex items-center gap-2 px-2"><span>📚</span> تصفح المواد</h3>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    <button onClick={() => setSelectedSubject('all')} className={`p-4 rounded-2xl text-xs font-black transition-all ${selectedSubject === 'all' ? 'bg-white text-slate-900 scale-105 shadow-xl' : `${getCardThemeClasses()} border border-white/5 text-slate-400 hover:bg-white/5`}`}>الكل</button>
                    {subjects.map(subj => (
                        <button key={subj.id} onClick={() => setSelectedSubject(subj.id)} className={`relative overflow-hidden p-4 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-2 group ${selectedSubject === subj.id ? 'text-white scale-105 shadow-xl ring-2 ring-white/20' : `${getCardThemeClasses()} border border-white/5 text-slate-400 hover:bg-white/5`}`}>
                            {selectedSubject === subj.id && <div className={`absolute inset-0 bg-gradient-to-br ${subj.color} opacity-100 z-0`}></div>}
                            <span className="relative z-10 text-xl group-hover:scale-110 transition-transform">{subj.icon}</span>
                            <span className="relative z-10">{subj.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DashboardTab;
