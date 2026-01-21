
import React, { useState } from 'react';
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
  AppView.MANAGEMENT, // Added here to show in Sidebar
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
  [AppView.CONTROL_PANEL]: 'الإعدادات'
};

const DEFAULT_ICONS: Record<string, string> = {
  [AppView.DASHBOARD]: '🏠',
  [AppView.MANAGEMENT]: '🏫',
  [AppView.STUDENT_PORTAL]: '🎓',
  [AppView.STUDENTS]: '👥',
  [AppView.ASSIGNMENTS]: '📝',
  [AppView.QUIZZES]: '⚡',
  [AppView.FILES]: '📚',
  [AppView.LIVE_CLASS]: '🎥',
  [AppView.CHAT]: '💬',
  [AppView.NOTIFICATIONS]: '🔔',
  [AppView.RESULTS]: '📊',
  [AppView.REWARDS]: '🎁',
  [AppView.SCHEDULE]: '📅',
  [AppView.AI_SOLVER]: '🧠',
  [AppView.FORMULAS]: '📐',
  [AppView.LEADERBOARD]: '🏆',
  [AppView.CALL_CENTER]: '📞',
  [AppView.TEST_CENTER]: '🧪',
  [AppView.LAUNCH_GUIDE]: '🚀',
  [AppView.CONTROL_PANEL]: '⚙️'
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

  const renderItem = (id: string, defaultIcon: string, defaultLabel: string, badge?: number, isCustom = false) => {
    if (!canAccess(id, isCustom)) return null;
    
    const isActive = currentView === id;
    const label = isCustom ? defaultLabel : (settings.viewLabels?.[id] || defaultLabel);
    const icon = isCustom ? defaultIcon : (settings.viewIcons?.[id] || defaultIcon);

    return (
      <div key={id} className="relative w-full group/item">
        <button
          onClick={() => setView(id)}
          className={`relative w-full aspect-square flex flex-col items-center justify-center rounded-[1.5rem] mb-3 transition-all duration-300 ${
            isActive 
              ? 'text-white shadow-lg scale-105' 
              : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
          }`}
          style={{ 
            backgroundColor: isActive ? primaryColor : 'transparent',
            boxShadow: isActive ? `0 8px 20px -6px ${primaryColor}66` : 'none'
          }}
          title={label}
        >
          <span className={`text-2xl mb-1 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
          <span className={`text-[9px] font-black ${isActive ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100 absolute -bottom-2 bg-slate-800 text-white px-2 py-1 rounded-lg z-50 whitespace-nowrap transition-opacity delay-75'}`}>
            {label}
          </span>
          
          {badge ? (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
          ) : null}
        </button>
      </div>
    );
  };

  return (
    <aside className="hidden lg:flex w-24 bg-white border-l border-slate-100 h-screen sticky top-0 flex-col items-center py-6 z-50 overflow-y-auto no-scrollbar shadow-sm">
      
      {/* Logo */}
      <div className="mb-8 cursor-pointer hover:scale-105 transition-transform" onClick={() => setView(AppView.DASHBOARD)}>
        {settings.branding?.logoUrl ? (
           <img src={settings.branding.logoUrl} className="w-12 h-12 object-contain rounded-xl" alt="Logo" />
        ) : (
           <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg" style={{ backgroundColor: primaryColor }}>∑</div>
        )}
        <div className={`mt-2 w-1.5 h-1.5 rounded-full mx-auto ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
      </div>

      <nav className="flex-1 w-full px-3 flex flex-col gap-1">
        {/* Always Dashboard first */}
        {renderItem(AppView.DASHBOARD, DEFAULT_ICONS[AppView.DASHBOARD], DEFAULT_LABELS[AppView.DASHBOARD])}
        
        <div className="w-8 h-px bg-slate-100 mx-auto my-2"></div>
        
        {/* Render all other system views based on enabled list */}
        {SYSTEM_VIEWS.filter(v => v !== AppView.DASHBOARD && v !== AppView.CONTROL_PANEL).map(viewId => {
            let badge = 0;
            if (viewId === AppView.ASSIGNMENTS) badge = pendingCount;
            if (viewId === AppView.CHAT) badge = unreadChatCount;
            return renderItem(viewId, DEFAULT_ICONS[viewId] || '🔹', DEFAULT_LABELS[viewId] || viewId, badge);
        })}

        {/* Custom Sections */}
        {settings.customSections && settings.customSections.length > 0 && (
            <div className="w-8 h-px bg-slate-100 mx-auto my-2"></div>
        )}
        {settings.customSections?.map(s => renderItem(s.id, s.icon, s.title, 0, true))}

        <div className="mt-auto">
           {/* Settings/Control Panel - Always available for Teacher */}
           {!isAssistant && renderItem(AppView.CONTROL_PANEL, DEFAULT_ICONS[AppView.CONTROL_PANEL], DEFAULT_LABELS[AppView.CONTROL_PANEL])}
        </div>
      </nav>
      
      {isAssistant && (
         <button onClick={() => window.location.reload()} className="mt-4 text-rose-300 hover:text-rose-500 transition-colors p-2" title="تسجيل خروج">
           <span className="text-xl">🚪</span>
         </button>
      )}
    </aside>
  );
};

export default Sidebar;
