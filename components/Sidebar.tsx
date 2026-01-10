
import React from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';

interface SidebarProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  loggedUser?: any;
  onUpdateSettings: (settings: PlatformSettings) => void;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
  pendingCount?: number;
  unreadChatCount?: number;
  unreadNotifCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, settings, loggedUser, pendingCount = 0, unreadChatCount = 0, unreadNotifCount = 0 }) => {
  const isAssistant = loggedUser?.role === 'assistant';
  const assistantPermissions = isAssistant ? (loggedUser as Assistant).permissions : null;

  const BASE_ITEMS = [
    { id: AppView.DASHBOARD, label: settings.viewLabels?.[AppView.DASHBOARD] || 'الرئيسية', icon: '🏠' },
    { id: AppView.STUDENTS, label: settings.viewLabels?.[AppView.STUDENTS] || 'الطلاب', icon: '👥' },
    { id: AppView.SCHEDULE, label: 'الجدول الدراسي', icon: '📅' },
    { id: AppView.FORMULAS, label: 'بنك القوانين', icon: '📐' },
    { id: AppView.CHAT, label: settings.viewLabels?.[AppView.CHAT] || 'الشات', icon: '💬', count: unreadChatCount },
    { id: AppView.LIVE_CLASS, label: settings.viewLabels?.[AppView.LIVE_CLASS] || 'البث المباشر', icon: '🎥' },
    { id: AppView.ASSIGNMENTS, label: settings.viewLabels?.[AppView.ASSIGNMENTS] || 'الواجبات', icon: '📚', count: pendingCount },
    { id: AppView.QUIZZES, label: settings.viewLabels?.[AppView.QUIZZES] || 'الاختبارات', icon: '📝' },
    { id: AppView.AI_SOLVER, label: settings.viewLabels?.[AppView.AI_SOLVER] || 'المحلل الذكي', icon: '🧠' },
    { id: AppView.FILES, label: settings.viewLabels?.[AppView.FILES] || 'المكتبة', icon: '📁' },
    { id: AppView.MANAGEMENT, label: settings.viewLabels?.[AppView.MANAGEMENT] || 'المجموعات', icon: '🏫' },
    { id: AppView.RESULTS, label: settings.viewLabels?.[AppView.RESULTS] || 'النتائج', icon: '📊' },
  ];

  let ENABLED_BASE_ITEMS = BASE_ITEMS.filter(item => {
    return (settings.enabledViews || Object.values(AppView)).includes(item.id as string) || item.id === AppView.SCHEDULE || item.id === AppView.FORMULAS;
  });

  if (isAssistant && assistantPermissions) {
    ENABLED_BASE_ITEMS = ENABLED_BASE_ITEMS.filter(item => assistantPermissions.includes(item.id as AppView));
  }

  const CUSTOM_ITEMS = (settings.customSections || []).map(s => ({
    id: s.id,
    label: s.title,
    icon: s.icon
  }));

  const ALL_ITEMS = [...ENABLED_BASE_ITEMS, ...CUSTOM_ITEMS];
  if (!isAssistant) {
    ALL_ITEMS.push({ id: AppView.STUDENT_PORTAL, label: 'بوابة الطالب', icon: '🎓' });
    ALL_ITEMS.push({ id: AppView.SETTINGS, label: 'الإعدادات', icon: '⚙️' });
  }

  return (
    <aside className="hidden lg:flex w-28 bg-[#0f172a] text-white h-screen sticky top-0 flex-col items-center py-10 shadow-2xl z-50 border-l border-white/5 overflow-y-auto no-scrollbar">
      <div className="mb-14 relative group cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
        <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black shadow-[0_0_20px_rgba(37,99,235,0.4)] text-2xl transform group-hover:rotate-12 transition-transform duration-500">∑</div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-4 border-[#0f172a] shadow-lg animate-pulse"></div>
      </div>

      <nav className="flex-1 w-full space-y-5 px-3 pb-10">
        {ALL_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full group relative flex flex-col items-center justify-center p-4 rounded-[1.5rem] transition-all duration-300 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 scale-105' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-[0.2em] text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden max-w-full">
                {item.label}
              </span>

              {'count' in item && item.count ? (
                <span className="absolute top-2 right-2 min-w-[18px] h-4.5 px-1 bg-rose-600 text-white rounded-full text-[8px] font-black flex items-center justify-center border-2 border-[#0f172a] shadow-lg animate-bounce">
                  {item.count > 9 ? '9+' : item.count}
                </span>
              ) : null}

              {isActive && (
                <div className="absolute right-0 top-1/4 bottom-1/4 w-1.5 bg-blue-400 rounded-l-full shadow-[0_0_15px_#60a5fa]"></div>
              )}
            </button>
          );
        })}
        {isAssistant && (
           <button onClick={() => window.location.reload()} className="w-full p-4 rounded-[1.5rem] text-rose-500 hover:bg-rose-500/10 transition-all flex flex-col items-center">
             <span className="text-xl">🚪</span>
             <span className="text-[7px] font-black uppercase mt-1">خروج</span>
           </button>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
