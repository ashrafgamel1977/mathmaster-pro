/**
 * usePortalTheme — Shared theme helper for StudentPortal tabs
 * يدعم الوضع الليلي والنهاري عبر isDark parameter
 */
export const usePortalTheme = (portalTheme?: string, isDark: boolean = true) => {
    const theme = portalTheme || 'indigo';

    // ─── Dark Mode Classes ─────────────────────────────────────────────────────
    const darkClasses = {
        getThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-950 selection:bg-emerald-500/30 selection:text-emerald-100';
                case 'rose': return 'bg-rose-950 selection:bg-rose-500/30 selection:text-rose-100';
                case 'amber': return 'bg-amber-950 selection:bg-amber-500/30 selection:text-amber-100';
                case 'slate': return 'bg-slate-900 selection:bg-slate-500/30 selection:text-slate-100';
                case 'violet': return 'bg-violet-950 selection:bg-violet-500/30 selection:text-violet-100';
                default: return 'bg-[#0f172a] selection:bg-amber-500/30 selection:text-amber-100';
            }
        },
        getSidebarThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-950';
                case 'rose': return 'bg-rose-950';
                case 'amber': return 'bg-amber-950';
                case 'slate': return 'bg-slate-900';
                case 'violet': return 'bg-violet-950';
                default: return 'bg-[#0f172a]';
            }
        },
        getCardThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-900/50';
                case 'rose': return 'bg-rose-900/50';
                case 'amber': return 'bg-amber-900/50';
                case 'slate': return 'bg-slate-800/50';
                case 'violet': return 'bg-violet-900/50';
                default: return 'bg-[#1e293b]';
            }
        },
        getButtonThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500';
                case 'rose': return 'bg-rose-600 hover:bg-rose-500';
                case 'amber': return 'bg-amber-600 hover:bg-amber-500';
                case 'slate': return 'bg-slate-600 hover:bg-slate-500';
                case 'violet': return 'bg-violet-600 hover:bg-violet-500';
                default: return 'bg-indigo-600 hover:bg-indigo-500';
            }
        },
        getButtonTextThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'text-emerald-400';
                case 'rose': return 'text-rose-400';
                case 'amber': return 'text-amber-400';
                case 'slate': return 'text-slate-400';
                case 'violet': return 'text-violet-400';
                default: return 'text-indigo-400';
            }
        },
        getButtonBgThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-500/10';
                case 'rose': return 'bg-rose-500/10';
                case 'amber': return 'bg-amber-500/10';
                case 'slate': return 'bg-slate-500/10';
                case 'violet': return 'bg-violet-500/10';
                default: return 'bg-indigo-500/10';
            }
        },
    };

    // ─── Light Mode Classes ────────────────────────────────────────────────────
    const lightClasses = {
        getThemeClasses: () => 'bg-slate-50 selection:bg-indigo-500/20 selection:text-indigo-900',
        getSidebarThemeClasses: () => 'bg-white border-l border-slate-200 shadow-xl',
        getCardThemeClasses: () => 'bg-white shadow-sm border border-slate-100',
        getButtonThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-600 hover:bg-emerald-500';
                case 'rose': return 'bg-rose-600 hover:bg-rose-500';
                case 'amber': return 'bg-amber-500 hover:bg-amber-400';
                case 'violet': return 'bg-violet-600 hover:bg-violet-500';
                default: return 'bg-indigo-600 hover:bg-indigo-500';
            }
        },
        getButtonTextThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'text-emerald-600';
                case 'rose': return 'text-rose-600';
                case 'amber': return 'text-amber-600';
                case 'violet': return 'text-violet-600';
                default: return 'text-indigo-600';
            }
        },
        getButtonBgThemeClasses: () => {
            switch (theme) {
                case 'emerald': return 'bg-emerald-50';
                case 'rose': return 'bg-rose-50';
                case 'amber': return 'bg-amber-50';
                case 'violet': return 'bg-violet-50';
                default: return 'bg-indigo-50';
            }
        },
    };

    const c = isDark ? darkClasses : lightClasses;

    return {
        isDark,
        getThemeClasses: c.getThemeClasses,
        getSidebarThemeClasses: c.getSidebarThemeClasses,
        getCardThemeClasses: c.getCardThemeClasses,
        getButtonThemeClasses: c.getButtonThemeClasses,
        getButtonTextThemeClasses: c.getButtonTextThemeClasses,
        getButtonBgThemeClasses: c.getButtonBgThemeClasses,
    };
};
