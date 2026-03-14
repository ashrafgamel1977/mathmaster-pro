import React, { useMemo } from 'react';
import { Student, PlatformSettings } from '../../types';
import { Trophy, Medal, TrendingUp, Users } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface LeaderboardTabProps {
    student: Student;
    students: Student[];
    settings: PlatformSettings;
    isDark?: boolean;
}

const LeaderboardTab: React.FC<LeaderboardTabProps> = ({ student, students, settings, isDark = true }) => {
    const { getCardThemeClasses, getButtonTextThemeClasses } = usePortalTheme(settings.portalTheme, isDark);

    // فلترة نفس المجموعة وترتيب حسب الدرجة
    const ranked = useMemo(() => {
        return [...students]
            .filter(s => s.status === 'active' && s.groupId === student.groupId)
            .sort((a, b) => (b.score || 0) - (a.score || 0))
            .slice(0, 20);
    }, [students, student.groupId]);

    const myRank = ranked.findIndex(s => s.id === student.id) + 1;

    const medalFor = (rank: number) => {
        if (rank === 1) return { icon: '🥇', color: 'from-amber-400 to-yellow-600', text: 'text-amber-300' };
        if (rank === 2) return { icon: '🥈', color: 'from-slate-300 to-slate-500', text: 'text-slate-300' };
        if (rank === 3) return { icon: '🥉', color: 'from-amber-700 to-orange-800', text: 'text-orange-400' };
        return { icon: `#${rank}`, color: 'from-slate-700 to-slate-800', text: 'text-slate-400' };
    };

    return (
        <div className="space-y-6 animate-fadeIn pb-24">
            {/* Header */}
            <div className="text-center pt-4">
                <div className="text-5xl mb-3">🏆</div>
                <h2 className="text-2xl font-black text-white">لوحة الشرف</h2>
                <p className="text-slate-400 text-sm font-bold mt-1">ترتيب مجموعتك الأسبوعي</p>
            </div>

            {/* My Rank Card */}
            {myRank > 0 && (
                <div className={`${getCardThemeClasses()} rounded-[2rem] p-5 border border-white/10 flex items-center gap-4`}>
                    <div className="text-3xl">{medalFor(myRank).icon}</div>
                    <div className="flex-1">
                        <p className="text-slate-400 text-xs font-bold">ترتيبك الحالي</p>
                        <p className="text-white font-black text-xl">#{myRank} من {ranked.length}</p>
                    </div>
                    <div className="text-left">
                        <p className="text-slate-400 text-xs font-bold">درجتك</p>
                        <p className={`font-black text-xl ${getButtonTextThemeClasses()}`}>{student.score || 0}%</p>
                    </div>
                </div>
            )}

            {/* Top 3 Podium */}
            {ranked.length >= 3 && (
                <div className="flex items-end justify-center gap-3 pb-2">
                    {/* 2nd */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={ranked[1]?.avatar} className="w-14 h-14 rounded-2xl border-2 border-slate-400 object-cover" alt="" onError={e => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranked[1]?.name}`)} />
                        <p className="text-xs font-black text-slate-300 max-w-[70px] text-center truncate">{ranked[1]?.name?.split(' ')[0]}</p>
                        <div className="w-16 h-20 bg-gradient-to-t from-slate-600 to-slate-500 rounded-t-2xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥈</span>
                        </div>
                    </div>
                    {/* 1st */}
                    <div className="flex flex-col items-center gap-2">
                        <div className="relative">
                            <img src={ranked[0]?.avatar} className="w-18 h-18 rounded-2xl border-3 border-amber-400 object-cover w-20 h-20 shadow-lg shadow-amber-900/40" alt="" onError={e => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranked[0]?.name}`)} />
                            <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-2xl">👑</span>
                        </div>
                        <p className="text-xs font-black text-amber-300 max-w-[80px] text-center truncate">{ranked[0]?.name?.split(' ')[0]}</p>
                        <div className="w-18 h-28 w-20 bg-gradient-to-t from-amber-600 to-amber-500 rounded-t-2xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥇</span>
                        </div>
                    </div>
                    {/* 3rd */}
                    <div className="flex flex-col items-center gap-2">
                        <img src={ranked[2]?.avatar} className="w-14 h-14 rounded-2xl border-2 border-orange-700 object-cover" alt="" onError={e => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${ranked[2]?.name}`)} />
                        <p className="text-xs font-black text-orange-400 max-w-[70px] text-center truncate">{ranked[2]?.name?.split(' ')[0]}</p>
                        <div className="w-16 h-16 bg-gradient-to-t from-orange-800 to-orange-700 rounded-t-2xl flex items-end justify-center pb-2">
                            <span className="text-2xl">🥉</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Full Ranking List */}
            <div className={`${getCardThemeClasses()} rounded-[2.5rem] p-6 border border-white/5`}>
                <h3 className="text-white font-black text-base mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className={getButtonTextThemeClasses()} /> القائمة الكاملة
                </h3>
                <div className="space-y-2">
                    {ranked.map((s, i) => {
                        const rank = i + 1;
                        const medal = medalFor(rank);
                        const isMe = s.id === student.id;
                        return (
                            <div
                                key={s.id}
                                className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${isMe
                                        ? 'bg-gradient-to-r from-indigo-500/20 to-purple-500/10 border border-indigo-500/30'
                                        : 'bg-white/3 border border-white/5'
                                    }`}
                            >
                                {/* Rank */}
                                <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${medal.color} flex items-center justify-center text-xs font-black text-white flex-shrink-0`}>
                                    {rank <= 3 ? medal.icon : rank}
                                </div>
                                {/* Avatar */}
                                <img
                                    src={s.avatar}
                                    className="w-10 h-10 rounded-xl object-cover flex-shrink-0"
                                    alt={s.name}
                                    onError={e => (e.currentTarget.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`)}
                                />
                                {/* Name */}
                                <div className="flex-1 min-w-0">
                                    <p className={`font-black text-sm truncate ${isMe ? 'text-indigo-300' : 'text-white'}`}>
                                        {s.name} {isMe && <span className="text-[10px] text-indigo-400 font-bold">(أنت)</span>}
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold">{s.badges?.length || 0} وسام</p>
                                </div>
                                {/* Score */}
                                <div className="text-left flex-shrink-0">
                                    <span className={`font-black text-sm ${isMe ? 'text-indigo-300' : medal.text}`}>
                                        {s.score || 0}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                    {ranked.length === 0 && (
                        <div className="text-center py-12 space-y-3">
                            <Users size={48} className="text-slate-600 mx-auto" />
                            <p className="text-slate-400 font-bold text-sm">لا يوجد طلاب في مجموعتك بعد</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LeaderboardTab;
