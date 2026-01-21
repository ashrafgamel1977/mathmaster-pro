
import React, { useMemo, useState } from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';

interface BottomNavProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  pendingCount?: number;
  unreadChatCount?: number;
  loggedUser?: any;
}

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
  [AppView.QUIZZES]: 'المختبر',
  [AppView.FILES]: 'المكتبة',
  [AppView.LIVE_CLASS]: 'البث',
  [AppView.CHAT]: 'النقاش',
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
  [AppView.ASSIGNMENTS]: '📚',
  [AppView.QUIZZES]: '📝',
  [AppView.FILES]: '📁',
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

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, settings, pendingCount = 0, unreadChatCount = 0, loggedUser }) => {
  const [isFabOpen, setIsFabOpen] = useState(false);
  const isAssistant = loggedUser?.role === 'assistant';
  const permissions = isAssistant ? (loggedUser as Assistant).permissions : null;
  const primaryColor = settings.branding?.primaryColor || '#3b82f6';

  // Collect all valid items
  const allValidItems = useMemo(() => {
    const items = [];

    // System Views
    SYSTEM_VIEWS.forEach(viewId => {
       const isEnabled = (settings.enabledViews || Object.values(AppView)).includes(viewId);
       
       let hasAccess = isEnabled;
       if (isAssistant && permissions && !permissions.includes(viewId)) {
          hasAccess = (viewId === AppView.DASHBOARD);
       }

       if (hasAccess) {
          items.push({
             id: viewId,
             label: settings.viewLabels?.[viewId] || DEFAULT_LABELS[viewId] || viewId,
             icon: settings.viewIcons?.[viewId] || DEFAULT_ICONS[viewId] || '🔹',
             badge: (viewId === AppView.ASSIGNMENTS ? pendingCount : (viewId === AppView.CHAT ? unreadChatCount : 0))
          });
       }
    });

    // Custom Sections
    if (settings.customSections) {
       settings.customSections.forEach(sec => {
          items.push({
             id: sec.id,
             label: sec.title,
             icon: sec.icon,
             badge: 0
          });
       });
    }

    // Add Settings at end for Teacher
    if (!isAssistant) {
       items.push({
          id: AppView.CONTROL_PANEL,
          label: settings.viewLabels?.[AppView.CONTROL_PANEL] || DEFAULT_LABELS[AppView.CONTROL_PANEL],
          icon: settings.viewIcons?.[AppView.CONTROL_PANEL] || DEFAULT_ICONS[AppView.CONTROL_PANEL],
          badge: 0
       });
    }

    return items.sort((a, b) => {
       if (a.id === AppView.DASHBOARD) return -1;
       if (b.id === AppView.DASHBOARD) return 1;
       return 0;
    });
  }, [settings, isAssistant, permissions, pendingCount, unreadChatCount]);

  return (
    <>
      {/* Smart Fab Container */}
      <div className="lg:hidden fixed bottom-6 left-6 z-[100] flex flex-col items-start gap-4">
         
         {/* Menu List */}
         {isFabOpen && (
            <div className="flex flex-col gap-2 mb-2 animate-slideUp max-h-[60vh] overflow-y-auto no-scrollbar p-2 glass-strong rounded-[2rem]">
               {allValidItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => { setView(item.id); setIsFabOpen(false); }}
                     className={`flex items-center gap-3 px-5 py-3 rounded-2xl transition-all ${
                        currentView === item.id 
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg' 
                        : 'hover:bg-white/50 text-slate-700'
                     }`}
                  >
                     <span className="text-xl">{item.icon}</span>
                     <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                     {item.badge > 0 && (
                        <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black shadow-sm">{item.badge}</span>
                     )}
                  </button>
               ))}
            </div>
         )}

         {/* Main Fab Button */}
         <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-16 h-16 rounded-[1.5rem] shadow-[0_8px_30px_rgba(0,0,0,0.15)] flex items-center justify-center text-3xl text-white transition-all backdrop-blur-md border border-white/20 ${
               isFabOpen ? 'bg-rose-500/90 rotate-90' : 'bg-blue-600/90 hover:scale-110 active:scale-95'
            }`}
            style={{ backgroundColor: isFabOpen ? undefined : (primaryColor + 'E6') }} // Hex with opacity
         >
            {isFabOpen ? '✕' : '☰'}
            {(!isFabOpen && (pendingCount > 0 || unreadChatCount > 0)) && (
               <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
         </button>

         {/* Backdrop */}
         {isFabOpen && (
            <div 
               className="fixed inset-0 bg-slate-900/40 z-[-1] backdrop-blur-sm transition-all"
               onClick={() => setIsFabOpen(false)}
            ></div>
         )}
      </div>
    </>
  );
};

export default BottomNav;
