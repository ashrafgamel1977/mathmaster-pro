
import React, { useMemo, useState } from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';
import { 
  Home, Users, BookOpen, FileText, Folder, Video, MessageSquare, 
  Bell, BarChart2, Calendar, PenTool, Trophy, Settings, LogOut, Menu, X, ShieldCheck, Activity
} from 'lucide-react';

interface BottomNavProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  pendingCount?: number;
  unreadChatCount?: number;
  loggedUser?: any;
  onLogout?: () => void;
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
  AppView.SCHEDULE,
  AppView.FORMULAS,
  AppView.LEADERBOARD,
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
  [AppView.SCHEDULE]: 'الجدول',
  [AppView.FORMULAS]: 'القوانين',
  [AppView.LEADERBOARD]: 'المتصدرين',
  [AppView.TEST_CENTER]: 'تقني',
  [AppView.LAUNCH_GUIDE]: 'دليل',
  [AppView.CONTROL_PANEL]: 'الإعدادات'
};

const DEFAULT_ICONS: Record<string, React.ReactNode> = {
  [AppView.DASHBOARD]: <Home size={20} />,
  [AppView.MANAGEMENT]: <ShieldCheck size={20} />,
  [AppView.STUDENT_PORTAL]: <Users size={20} />,
  [AppView.STUDENTS]: <Users size={20} />,
  [AppView.ASSIGNMENTS]: <BookOpen size={20} />,
  [AppView.QUIZZES]: <FileText size={20} />,
  [AppView.FILES]: <Folder size={20} />,
  [AppView.LIVE_CLASS]: <Video size={20} />,
  [AppView.CHAT]: <MessageSquare size={20} />,
  [AppView.NOTIFICATIONS]: <Bell size={20} />,
  [AppView.RESULTS]: <BarChart2 size={20} />,
  [AppView.SCHEDULE]: <Calendar size={20} />,
  [AppView.FORMULAS]: <PenTool size={20} />,
  [AppView.LEADERBOARD]: <Trophy size={20} />,
  [AppView.TEST_CENTER]: <Activity size={20} />,
  [AppView.LAUNCH_GUIDE]: <Activity size={20} />,
  [AppView.CONTROL_PANEL]: <Settings size={20} />
};

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, settings, pendingCount = 0, unreadChatCount = 0, loggedUser, onLogout }) => {
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
      <div className="lg:hidden fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-[max(1.5rem,env(safe-area-inset-left))] z-[100] flex flex-col items-start gap-4">
         
         {/* Menu List */}
         {isFabOpen && (
            <div className="flex flex-col gap-2 mb-2 animate-slideUp max-h-[70vh] overflow-y-auto no-scrollbar pr-2">
               {allValidItems.map((item) => (
                  <button
                     key={item.id}
                     onClick={() => { setView(item.id); setIsFabOpen(false); }}
                     className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg transition-all border border-slate-100 ${
                        currentView === item.id 
                        ? 'bg-blue-600 text-white translate-x-2' 
                        : 'bg-white text-slate-600 hover:bg-slate-50'
                     }`}
                  >
                     <span className="text-xl">{item.icon}</span>
                     <span className="font-bold text-sm whitespace-nowrap">{item.label}</span>
                     {item.badge > 0 && (
                        <span className="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-black">{item.badge}</span>
                     )}
                  </button>
               ))}

               {/* Logout Button */}
               {onLogout && (
                  <button
                     onClick={() => { onLogout(); setIsFabOpen(false); }}
                     className="flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lg transition-all border border-rose-200 bg-rose-50 text-rose-500 hover:bg-rose-100 mt-2"
                  >
                     <span className="text-xl"><LogOut size={20} /></span>
                     <span className="font-bold text-sm whitespace-nowrap">تسجيل خروج</span>
                  </button>
               )}
            </div>
         )}

         {/* Main Fab Button */}
         <button
            onClick={() => setIsFabOpen(!isFabOpen)}
            className={`w-16 h-16 rounded-full shadow-2xl flex items-center justify-center text-white transition-all border-4 border-white ${
               isFabOpen ? 'bg-rose-500 rotate-90' : 'bg-blue-600 hover:scale-110 active:scale-95'
            }`}
            style={{ backgroundColor: isFabOpen ? undefined : primaryColor }}
         >
            {isFabOpen ? <X size={24} /> : <Menu size={24} />}
            {(!isFabOpen && (pendingCount > 0 || unreadChatCount > 0)) && (
               <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
         </button>

         {/* Backdrop */}
         {isFabOpen && (
            <div 
               className="fixed inset-0 bg-slate-900/60 z-[-1] backdrop-blur-sm"
               onClick={() => setIsFabOpen(false)}
            ></div>
         )}
      </div>
    </>
  );
};

export default BottomNav;
