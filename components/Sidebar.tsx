
import React from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';

interface SidebarProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  loggedUser?: any;
  onUpdateSettings: (settings: PlatformSettings) => void;
  pendingCount?: number;
  unreadChatCount?: number;
  unreadNotifCount?: number;
  isConnected?: boolean;
}

// All possible system views to iterate over if not explicitly defined
const SYSTEM_VIEWS = [
  AppView.DASHBOARD,
  AppView.MANAGEMENT,
  AppView.STUDENTS,
  AppView.ASSIGNMENTS,
  AppView.QUIZZES,
  AppView.FILES,
  AppView.LIVE_CLASS,
  AppView.CHAT,
  AppView.NOTIFICATIONS,
  AppView.RESULTS,
  AppView.REWARDS,
  AppView.SCHEDULE,
  AppView.AI_SOLVER,
  AppView.FORMULAS,
  AppView.LEADERBOARD,
  AppView.CALL_CENTER,
  AppView.TEST_CENTER,
  AppView.LAUNCH_GUIDE,
  AppView.STUDENT_PORTAL
];

const DEFAULT_LABELS: Record<string, string> = {
  [AppView.DASHBOARD]: 'الرئيسية',
  [AppView.MANAGEMENT]: 'المجموعات',
  [AppView.STUDENT_PORTAL]: 'بوابة الطالب',
  [AppView.STUDENTS]: 'الطلاب',
  [AppView.ASSIGNMENTS]: 'الواجبات',
  [AppView.QUIZZES]: 'الاختبارات',
  [AppView.FILES]: 'المكتبة',
  [AppView.LIVE_CLASS]: 'بث مباشر',
  [AppView.CHAT]: 'المحادثات',
  [AppView.NOTIFICATIONS]: 'التنبيهات',
  [AppView.RESULTS]: 'النتائج',
  [AppView.REWARDS]: 'المتجر',
  [AppView.SCHEDULE]: 'الجدول',
  [AppView.AI_SOLVER]: 'المحلل',
  [AppView.FORMULAS]: 'القوانين',
  [AppView.LEADERBOARD]: 'المتصدرين',
  [AppView.CALL_CENTER]: 'اتصالات',
  [AppView.TEST_CENTER]: 'تقني',
  [AppView.LAUNCH_GUIDE]: 'دليل',
  [AppView.CONTROL_PANEL]: 'الإعدادات',
  [AppView.SECTIONS]: 'الأقسام'
};

const ViewIcon = ({ viewId, className = "w-6 h-6", customIcon }: { viewId: string; className?: string; customIcon?: string }) => {
  // If it's a custom section with an emoji/text icon provided
  if (customIcon) {
    return <span className="text-xl leading-none">{customIcon}</span>;
  }

  const props = {
    className,
    strokeWidth: 2,
    stroke: "currentColor",
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    viewBox: "0 0 24 24",
    xmlns: "http://www.w3.org/2000/svg"
  };

  switch (viewId) {
    case AppView.DASHBOARD:
      return (
        <svg {...props}>
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      );
    case AppView.MANAGEMENT:
      return (
        <svg {...props}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case AppView.STUDENTS:
      return (
        <svg {...props}>
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    case AppView.STUDENT_PORTAL:
      return (
        <svg {...props}>
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      );
    case AppView.ASSIGNMENTS:
      return (
        <svg {...props}>
          <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
          <polyline points="14 2 14 8 20 8" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      );
    case AppView.QUIZZES:
      return (
        <svg {...props}>
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      );
    case AppView.FILES:
      return (
        <svg {...props}>
          <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
        </svg>
      );
    case AppView.LIVE_CLASS:
      return (
        <svg {...props}>
          <polygon points="23 7 16 12 23 17 23 7" />
          <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
        </svg>
      );
    case AppView.CHAT:
      return (
        <svg {...props}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      );
    case AppView.NOTIFICATIONS:
      return (
        <svg {...props}>
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      );
    case AppView.RESULTS:
      return (
        <svg {...props}>
          <path d="M3 3v18h18" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      );
    case AppView.REWARDS:
      return (
        <svg {...props}>
          <polyline points="20 12 20 22 4 22 4 12" />
          <rect x="2" y="7" width="20" height="5" />
          <line x1="12" y1="22" x2="12" y2="7" />
          <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
          <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
        </svg>
      );
    case AppView.SCHEDULE:
      return (
        <svg {...props}>
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case AppView.AI_SOLVER:
      return (
        <svg {...props}>
          <path d="M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>
      );
    case AppView.FORMULAS:
      return (
        <svg {...props}>
          <path d="m19 19-7.43-6.7c-.52-.45-1.72-.45-2.13 0L2 19" />
          <path d="M2 5h19" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      );
    case AppView.LEADERBOARD:
      return (
        <svg {...props}>
          <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
          <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
          <path d="M4 22h16" />
          <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
          <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
          <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
      );
    case AppView.CALL_CENTER:
      return (
        <svg {...props}>
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      );
    case AppView.TEST_CENTER:
      return (
        <svg {...props}>
          <path d="M2 22h20" />
          <path d="M12 2v2" />
          <path d="M7.18 6.78c-1.63 1.63-2.18 4.2-1.18 6.78 1 2.58 3.5 4.18 5.95 3.18" />
          <path d="M16.82 6.78c1.63 1.63 2.18 4.2 1.18 6.78-1 2.58-3.5 4.18-5.95 3.18" />
          <path d="M12 22v-9" />
        </svg>
      );
    case AppView.LAUNCH_GUIDE:
      return (
        <svg {...props}>
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
          <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
          <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
        </svg>
      );
    case AppView.CONTROL_PANEL:
      return (
        <svg {...props}>
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.47a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case AppView.SECTIONS:
      return (
        <svg {...props}>
          <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
          <line x1="12" y1="22.08" x2="12" y2="12" />
        </svg>
      );
    default:
      return (
        <svg {...props}>
          <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
        </svg>
      );
  }
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, settings, loggedUser, pendingCount = 0, unreadChatCount = 0, isConnected = false }) => {
  const isAssistant = loggedUser?.role === 'assistant';
  const assistantPermissions = isAssistant ? (loggedUser as Assistant).permissions : null;
  const primaryColor = settings?.branding?.primaryColor || '#2563eb';

  // Helper to check permission and visibility
  const canAccess = (viewId: string, isCustom: boolean) => {
    // 1. Assistant Permission Check
    if (isAssistant && assistantPermissions) {
        if (viewId === AppView.CONTROL_PANEL) return false; // Assistants can't access settings usually
        if (isCustom) return true; // Assuming assistants can view custom sections if they exist
        if (!assistantPermissions.includes(viewId as AppView) && viewId !== AppView.DASHBOARD) return false;
    }

    // 2. Settings Visibility Check (For system views)
    if (!isCustom) {
        const enabled = settings.enabledViews || Object.values(AppView);
        if (!enabled.includes(viewId as AppView) && viewId !== AppView.CONTROL_PANEL) return false;
    }

    return true;
  };

  const renderItem = (id: string, defaultLabel: string, badge?: number, isCustom = false, customIcon?: string) => {
    if (!canAccess(id, isCustom)) return null;
    
    const isActive = currentView === id;
    const label = isCustom ? defaultLabel : (settings.viewLabels?.[id] || defaultLabel);
    
    return (
      <div key={id} className="relative w-full px-4 mb-2 group/item">
        <button
          onClick={() => setView(id)}
          className={`relative w-full flex items-center gap-4 px-4 py-3.5 rounded-[1rem] transition-all duration-300 group-hover/item:translate-x-[-4px] overflow-hidden ${
            isActive 
              ? 'text-white shadow-lg shadow-indigo-500/20' 
              : 'text-slate-500 hover:bg-white/60 hover:text-indigo-600'
          }`}
          style={{ 
            backgroundColor: isActive ? primaryColor : 'transparent',
          }}
          title={label}
        >
          {/* Active indicator line (optional design choice) */}
          {isActive && (
             <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/30 rounded-l-full"></div>
          )}

          <ViewIcon 
            viewId={id} 
            className={`w-6 h-6 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover/item:scale-110'}`} 
            customIcon={isCustom ? customIcon : undefined}
          />
          
          <span className={`text-sm font-bold truncate transition-colors ${isActive ? 'text-white' : 'text-slate-600 group-hover/item:text-indigo-700'}`}>
            {label}
          </span>
          
          {badge ? (
            <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <span className={`flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black shadow-sm ${isActive ? 'bg-white text-rose-500' : 'bg-rose-500 text-white'}`}>
                    {badge > 99 ? '99+' : badge}
                </span>
            </div>
          ) : null}
        </button>
      </div>
    );
  };

  return (
    <aside className="hidden lg:flex w-72 h-screen sticky top-0 flex-col py-6 z-50 overflow-y-auto no-scrollbar glass-strong border-l border-white/20 shadow-[4px_0_30px_rgba(0,0,0,0.03)]">
      
      {/* Brand Header */}
      <div className="px-8 mb-8 flex items-center gap-4 cursor-pointer group" onClick={() => setView(AppView.DASHBOARD)}>
        <div className="relative">
            {settings.branding?.logoUrl ? (
                <img src={settings.branding.logoUrl} className="w-12 h-12 object-contain rounded-xl bg-white border border-slate-100 shadow-sm" alt="Logo" />
            ) : (
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg transition-transform group-hover:scale-105 group-hover:rotate-3" style={{ backgroundColor: primaryColor }}>
                    ∑
                </div>
            )}
            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`} title={isConnected ? "متصل" : "غير متصل"}>
                {isConnected && <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping opacity-75"></div>}
            </div>
        </div>
        <div className="flex flex-col">
            <h1 className="font-black text-slate-800 text-lg leading-tight tracking-tight">{settings.teacherName.split(' ')[0] || 'المعلم'}</h1>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PRO ADMIN</span>
        </div>
      </div>

      <nav className="flex-1 w-full flex flex-col gap-1 pb-4">
        {/* Dashboard Group */}
        <div className="px-6 mb-2 mt-2">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الرئيسية</p>
        </div>
        {renderItem(AppView.DASHBOARD, DEFAULT_LABELS[AppView.DASHBOARD])}
        
        {/* Educational Group */}
        <div className="px-6 mb-2 mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">التعليمي</p>
        </div>
        {[AppView.MANAGEMENT, AppView.STUDENTS, AppView.ASSIGNMENTS, AppView.QUIZZES, AppView.FILES, AppView.SCHEDULE, AppView.FORMULAS, AppView.LIVE_CLASS].map(viewId => {
            let badge = 0;
            if (viewId === AppView.ASSIGNMENTS) badge = pendingCount;
            return renderItem(viewId, DEFAULT_LABELS[viewId], badge);
        })}

        {/* Communication Group */}
        <div className="px-6 mb-2 mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">التواصل</p>
        </div>
        {[AppView.CHAT, AppView.NOTIFICATIONS, AppView.CALL_CENTER].map(viewId => {
            let badge = 0;
            if (viewId === AppView.CHAT) badge = unreadChatCount;
            return renderItem(viewId, DEFAULT_LABELS[viewId], badge);
        })}

        {/* Analytics & Tools Group */}
        <div className="px-6 mb-2 mt-6">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">الأدوات</p>
        </div>
        {[AppView.RESULTS, AppView.AI_SOLVER, AppView.LEADERBOARD, AppView.REWARDS, AppView.STUDENT_PORTAL].map(viewId => 
            renderItem(viewId, DEFAULT_LABELS[viewId])
        )}

        {/* Custom Sections */}
        {settings.customSections && settings.customSections.length > 0 && (
            <>
                <div className="px-6 mb-2 mt-6">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">مخصص</p>
                </div>
                {settings.customSections.map(s => renderItem(s.id, s.title, 0, true, s.icon))}
            </>
        )}

        <div className="mt-auto pt-6">
           {/* Settings/Control Panel - Always available for Teacher */}
           {!isAssistant && (
               <>
                <div className="h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent mx-8 mb-4"></div>
                {renderItem(AppView.CONTROL_PANEL, DEFAULT_LABELS[AppView.CONTROL_PANEL])}
               </>
           )}
        </div>
      </nav>
      
      {isAssistant && (
         <div className="px-4 mt-2">
             <button onClick={() => window.location.reload()} className="w-full py-3 bg-rose-50 text-rose-500 rounded-2xl font-black text-xs hover:bg-rose-100 transition-colors flex items-center justify-center gap-2">
                <span>تسجيل خروج</span>
                <span>🚪</span>
             </button>
         </div>
      )}
    </aside>
  );
};

export default Sidebar;
