import { Badge, Student, QuizResult } from '../types';

// ──────────────────────────────────────────────────────────────
// BADGE DEFINITIONS — كل وسام له شرط تلقائي
// ──────────────────────────────────────────────────────────────
export const ALL_BADGES: Omit<Badge, 'awardedAt'>[] = [
    { id: 'first_quiz', name: 'أول خطوة', icon: '🎯', description: 'حللت اختبارك الأول' },
    { id: 'perfect_score', name: 'قاهر الرياضيات', icon: '💯', description: 'حصلت على 100% في اختبار' },
    { id: 'three_perfect', name: 'نجم المنصة', icon: '⭐', description: '100% في 3 اختبارات متتالية' },
    { id: 'speed_demon', name: 'سريع البديهة', icon: '⚡', description: 'أنهيت اختباراً في أقل من نصف الوقت' },
    { id: 'streak_3', name: 'ملتزم', icon: '🔥', description: '3 أيام متتالية في المنصة' },
    { id: 'streak_7', name: 'أسبوع التفوق', icon: '🏆', description: '7 أيام متتالية في المنصة' },
    { id: 'streak_30', name: 'بطل الشهر', icon: '👑', description: '30 يوماً متتالياً في المنصة' },
    { id: 'high_score_80', name: 'متفوق', icon: '📈', description: 'درجة فوق 80% في اختبار' },
    { id: 'comeback', name: 'العودة القوية', icon: '💪', description: 'تحسُّن درجة بعد رسوب سابق' },
];

// ──────────────────────────────────────────────────────────────
// STREAK LOGIC
// ──────────────────────────────────────────────────────────────
export function calculateStreak(student: Student): number {
    const lastLogin = localStorage.getItem(`streak-last-login-${student.id}`);
    const today = new Date().toDateString();
    const currentStreak = student.streaks || 0;

    if (!lastLogin) {
        localStorage.setItem(`streak-last-login-${student.id}`, today);
        return 1;
    }
    if (lastLogin === today) return currentStreak; // نفس اليوم — لا تغيير

    const lastDate = new Date(lastLogin);
    const diff = Math.floor((new Date().getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    localStorage.setItem(`streak-last-login-${student.id}`, today);

    if (diff === 1) return currentStreak + 1; // يوم متتالي ✅
    return 1; // انقطع
}

// ──────────────────────────────────────────────────────────────
// BADGE AWARD ENGINE — يُشغَّل بعد كل اختبار
// ──────────────────────────────────────────────────────────────
export function evaluateBadgesAfterQuiz(
    student: Student,
    allResults: QuizResult[],
    newResult: QuizResult,
    quizDuration?: number,
    timeUsed?: number
): Badge[] {
    const existing = new Set((student.badges || []).map(b => b.id));
    const toAward: Badge[] = [];
    const now = new Date().toISOString();

    const award = (id: string) => {
        if (existing.has(id)) return;
        const def = ALL_BADGES.find(b => b.id === id);
        if (def) toAward.push({ ...def, awardedAt: now });
    };

    // أول اختبار
    const studentResults = allResults.filter(r => r.studentId === student.id);
    if (studentResults.length === 0) award('first_quiz');

    // 100%
    const total = newResult.score;
    const maxScore = 100; // بالنسبة المئوية
    if (total >= 100) award('perfect_score');

    // 3 متتالية 100%
    const recentPerfect = [...studentResults.slice(-2), newResult].filter(r => r.score >= 100);
    if (recentPerfect.length >= 3) award('three_perfect');

    // فوق 80%
    if (total >= 80) award('high_score_80');

    // سريع البديهة — أنهى في أقل من 50% من الوقت
    if (quizDuration && timeUsed && (timeUsed / quizDuration) < 0.5) award('speed_demon');

    // Comeback — سبق أن رسب وهذه المرة نجح
    const prevResults = studentResults.slice(0, -1);
    const lastFailed = prevResults.some(r => r.score < 50);
    if (lastFailed && newResult.score >= 70) award('comeback');

    return toAward;
}

// ──────────────────────────────────────────────────────────────
// STREAK BADGES
// ──────────────────────────────────────────────────────────────
export function evaluateStreakBadges(student: Student, newStreak: number): Badge[] {
    const existing = new Set((student.badges || []).map(b => b.id));
    const toAward: Badge[] = [];
    const now = new Date().toISOString();

    const award = (id: string) => {
        if (existing.has(id)) return;
        const def = ALL_BADGES.find(b => b.id === id);
        if (def) toAward.push({ ...def, awardedAt: now });
    };

    if (newStreak >= 3) award('streak_3');
    if (newStreak >= 7) award('streak_7');
    if (newStreak >= 30) award('streak_30');

    return toAward;
}
