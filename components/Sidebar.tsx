
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

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, settings, loggedUser, pendingCount = 0, unreadChatCount = 0, unreadNotifCount = 0, isConnected = false }) => {
  const isAssistant = loggedUser?.role === 'assistant';
  const assistantPermissions = isAssistant ? (loggedUser as Assistant).permissions : null;
  const primaryColor = settings?.branding?.primaryColor || '#2563eb';

  // القائمة الجانبية الجديدة: بسيطة ومباشرة
  const BASE_ITEMS = [
    { id: AppView.DASHBOARD, label: 'الرئيسية', icon: '🏠' },
    { id: AppView.STUDENTS, label: 'الطلاب', icon: '👥' },
    { id: AppView.FILES, label: 'المحتوى', icon: '📚' },
    { id: AppView.ASSIGNMENTS, label: 'الواجبات', icon: '📝' },
    { id: AppView.QUIZZES, label: 'الاختبارات', icon: '⚡' },
    { id: AppView.LIVE_CLASS, label: 'بث مباشر', icon: '🎥' },
    { id: AppView.CHAT, label: 'التفاعل', icon: '💬', count: unreadChatCount },
    { id: AppView.CONTROL_PANEL, label: 'لوحة التحكم', icon: '⚙️' },
  ];

  let ENABLED_BASE_ITEMS = BASE_ITEMS.filter(item => {
    if (item.id === AppView.CONTROL_PANEL) return true;
    return (settings.enabledViews || Object.values(AppView)).includes(item.id as string);
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
  }

  return (
    <aside className="hidden lg:flex w-28 bg-[#0f172a] text-white h-screen sticky top-0 flex-col items-center py-8 shadow-2xl z-50 border-l border-white/5 overflow-y-auto no-scrollbar">
      <div className="mb-10 relative group cursor-pointer" onClick={() => setView(AppView.DASHBOARD)}>
        {settings.branding?.logoUrl ? (
           <img src={settings.branding.logoUrl} className="w-16 h-16 object-contain rounded-xl hover:scale-110 transition-transform" alt="Logo" />
        ) : (
           <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-white font-black text-3xl transform group-hover:rotate-12 transition-transform duration-500" style={{ backgroundColor: primaryColor }}>∑</div>
        )}
        {/* مؤشر حالة الاتصال */}
        <div className="absolute -bottom-2 right-1/2 translate-x-1/2 flex items-center justify-center">
           <div className={`w-3 h-3 rounded-full border-2 border-[#0f172a] ${isConnected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-rose-500 animate-pulse'}`} title={isConnected ? "متصل بقاعدة البيانات" : "غير متصل"}></div>
        </div>
      </div>

      <nav className="flex-1 w-full space-y-4 px-3 pb-10">
        {ALL_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full group relative flex flex-col items-center justify-center p-4 rounded-[2rem] transition-all duration-300 ${
                isActive 
                  ? 'text-white shadow-xl shadow-blue-900/40 scale-105' 
                  : 'text-slate-500 hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { backgroundColor: primaryColor } : {}}
            >
              <span className="text-2xl mb-1.5 group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-[7px] font-black uppercase tracking-[0.1em] text-center opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden max-w-full">
                {item.label}
              </span>

              {'count' in item && (item as any).count ? (
                <span className="absolute top-2 right-2 min-w-[20px] h-5 px-1 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[#0f172a] shadow-lg">
                  {(item as any).count > 9 ? '9+' : (item as any).count}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
      
      {isAssistant && (
         <button onClick={() => window.location.reload()} className="w-full p-4 mb-6 rounded-3xl text-rose-500 hover:bg-rose-500/10 transition-all flex flex-col items-center">
           <span className="text-2xl">🚪</span>
           <span className="text-[7px] font-black uppercase mt-1">خروج</span>
         </button>
      )}
    </aside>
  );
};

export default Sidebar;
