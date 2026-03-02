import React, { useState } from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';
import { 
  Home, GraduationCap, BookOpen, PenTool, MessageSquare, 
  Settings, LogOut, ChevronDown, ChevronUp, Circle, CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  loggedUser?: any;
  onUpdateSettings: (settings: PlatformSettings) => void;
  pendingCount?: number;
  unreadChatCount?: number;
  pendingStudentCount?: number;
  isConnected?: boolean;
  onLogout?: () => void;
}

const MENU_GROUPS = [
  { 
    id: 'main', 
    label: 'الرئيسية', 
    icon: <Home size={18} />,
    items: [AppView.DASHBOARD] 
  },
  { 
    id: 'academic', 
    label: 'الإدارة الأكاديمية', 
    icon: <GraduationCap size={18} />,
    items: [AppView.STUDENTS, AppView.MANAGEMENT, AppView.SCHEDULE] 
  },
  { 
    id: 'content', 
    label: 'المحتوى والاختبارات', 
    icon: <BookOpen size={18} />,
    items: [AppView.ASSIGNMENTS, AppView.QUIZZES, AppView.FILES, AppView.FORMULAS] 
  },
  { 
    id: 'tools', 
    label: 'أدوات الرياضيات', 
    icon: <PenTool size={18} />,
    items: [AppView.LIVE_CLASS, AppView.RESULTS] 
  },
  { 
    id: 'communication', 
    label: 'التواصل والمتابعة', 
    icon: <MessageSquare size={18} />,
    items: [AppView.CHAT, AppView.NOTIFICATIONS, AppView.LEADERBOARD] 
  },
  { 
    id: 'admin', 
    label: 'النظام والمتجر', 
    icon: <Settings size={18} />,
    items: [AppView.CONTROL_PANEL, AppView.TEST_CENTER, AppView.LAUNCH_GUIDE] 
  }
];

const DEFAULT_LABELS: Record<string, string> = {
  [AppView.DASHBOARD]: 'غرفة العمليات',
  [AppView.MANAGEMENT]: 'المجموعات',
  [AppView.STUDENT_PORTAL]: 'بوابة الطالب',
  [AppView.STUDENTS]: 'سجل الطلاب',
  [AppView.ASSIGNMENTS]: 'الواجبات',
  [AppView.QUIZZES]: 'بنك الاختبارات',
  [AppView.FILES]: 'المكتبة الرقمية',
  [AppView.LIVE_CLASS]: 'البث المباشر',
  [AppView.CHAT]: 'غرف النقاش',
  [AppView.NOTIFICATIONS]: 'التنبيهات',
  [AppView.RESULTS]: 'النتائج والتحليل',
  [AppView.REWARDS]: 'متجر الجوائز',
  [AppView.SCHEDULE]: 'الجدول الدراسي',
  [AppView.FORMULAS]: 'القوانين',
  [AppView.LEADERBOARD]: 'لوحة الشرف',
  [AppView.CALL_CENTER]: 'مركز الاتصال',
  [AppView.TEST_CENTER]: 'فحص النظام',
  [AppView.LAUNCH_GUIDE]: 'دليل البدء',
  [AppView.CONTROL_PANEL]: 'الإعدادات العامة',
  [AppView.BATTLE_ARENA]: 'ساحة المعركة ⚔️'
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, settings, loggedUser, pendingCount = 0, unreadChatCount = 0, pendingStudentCount = 0, isConnected = false, onLogout }) => {
  const [openGroups, setOpenGroups] = useState<string[]>(['main', 'academic', 'content', 'tools']); // Default open groups
  const isAssistant = loggedUser?.role === 'assistant';
  const assistantPermissions = isAssistant ? (loggedUser as Assistant).permissions : null;
  const primaryColor = settings?.branding?.primaryColor || '#2563eb';

  const toggleGroup = (groupId: string) => {
    setOpenGroups(prev => prev.includes(groupId) ? prev.filter(id => id !== groupId) : [...prev, groupId]);
  };

  const canAccess = (viewId: string, isCustom: boolean) => {
    if (isAssistant && assistantPermissions) {
        if (viewId === AppView.CONTROL_PANEL) return false; 
        if (isCustom) return true; 
        if (!assistantPermissions.includes(viewId as AppView) && viewId !== AppView.DASHBOARD) return false;
    }
    if (!isCustom) {
        const enabled = settings.enabledViews || Object.values(AppView);
        if (!enabled.includes(viewId as AppView) && viewId !== AppView.CONTROL_PANEL) return false;
    }
    return true;
  };

  const renderItem = (id: string, labelOverride?: string) => {
    if (!canAccess(id, false)) return null;
    
    const isActive = currentView === id;
    const label = settings.viewLabels?.[id] || labelOverride || DEFAULT_LABELS[id] || id;
    
    let badge = 0;
    if (id === AppView.ASSIGNMENTS) badge = pendingCount;
    if (id === AppView.CHAT) badge = unreadChatCount;
    if (id === AppView.STUDENTS) badge = pendingStudentCount;

    return (
      <button
        key={id}
        onClick={() => setView(id)}
        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mb-1 relative group ${
          isActive 
            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md' 
            : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
        }`}
      >
        <span className={`transition-transform ${isActive ? 'scale-110' : ''}`}>
           {isActive ? <CheckCircle2 size={16} /> : <Circle size={16} />}
        </span>
        <span className={`text-xs font-bold ${isActive ? 'opacity-100' : 'opacity-80'}`}>{label}</span>
        
        {badge > 0 && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-sm">
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex w-72 bg-white border-l border-slate-100 h-screen sticky top-0 flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)] overflow-hidden font-['Cairo']">
      
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-50 flex items-center gap-3 cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
        {settings.branding?.logoUrl ? (
           <img src={settings.branding.logoUrl} className="w-10 h-10 object-contain rounded-xl" alt="Logo" />
        ) : (
           <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-200" style={{ backgroundColor: primaryColor }}>∑</div>
        )}
        <div>
            <h1 className="font-black text-slate-800 text-sm leading-tight">{settings.platformName}</h1>
            <div className="flex items-center gap-1.5 mt-1">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                <span className="text-[9px] font-bold text-slate-400">{isConnected ? 'متصل بالشبكة' : 'وضع محلي'}</span>
            </div>
        </div>
      </div>

      {/* Scrollable Menu */}
      <nav className="flex-1 overflow-y-auto p-4 no-scrollbar space-y-2">
        {MENU_GROUPS.map(group => {
            // Filter items based on permissions first to see if group should render
            const visibleItems = group.items.filter(id => canAccess(id, false));
            if (visibleItems.length === 0) return null;

            const isOpen = openGroups.includes(group.id);

            return (
                <div key={group.id} className="mb-2">
                    <button 
                        onClick={() => toggleGroup(group.id)}
                        className="w-full flex items-center justify-between px-2 py-2 text-slate-400 hover:text-slate-600 transition-colors group"
                    >
                        <div className="flex items-center gap-2">
                            <span className="opacity-70 group-hover:opacity-100 transition-opacity text-indigo-500">{group.icon}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider">{group.label}</span>
                        </div>
                        <span className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                            <ChevronDown size={14} />
                        </span>
                    </button>
                    
                    <div className={`space-y-0.5 overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-[500px] opacity-100 pt-1' : 'max-h-0 opacity-0'}`}>
                        {visibleItems.map(viewId => renderItem(viewId))}
                    </div>
                </div>
            );
        })}

        {/* Custom Sections */}
        {settings.customSections && settings.customSections.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-50">
                <p className="px-2 text-[9px] font-black text-slate-400 mb-2 uppercase tracking-widest">أقسام مخصصة</p>
                {settings.customSections.map(s => (
                    <button
                        key={s.id}
                        onClick={() => setView(s.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 mb-1 ${
                            currentView === s.id ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-slate-500 hover:bg-slate-50'
                        }`}
                    >
                        <span className="text-lg">{s.icon}</span>
                        <span className="text-xs">{s.title}</span>
                    </button>
                ))}
            </div>
        )}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-50 bg-slate-50/50">
         {onLogout && (
            <button 
              onClick={onLogout} 
              className="w-full flex items-center justify-center gap-2 py-3 border border-slate-200 rounded-xl text-slate-500 text-xs font-bold hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200 transition-all" 
            >
              <span>تسجيل الخروج</span>
              <LogOut size={16} />
            </button>
         )}
      </div>
    </aside>
  );
};

export default Sidebar;