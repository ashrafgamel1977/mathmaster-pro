
import React, { useState } from 'react';
import { AppView, PlatformSettings, Assistant } from '../types';

interface BottomNavProps {
  currentView: AppView | string;
  setView: (view: AppView | string) => void;
  settings: PlatformSettings;
  pendingCount?: number;
  unreadChatCount?: number;
  loggedUser?: any;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView, settings, pendingCount = 0, unreadChatCount = 0, loggedUser }) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const isAssistant = loggedUser?.role === 'assistant';
  const permissions = isAssistant ? (loggedUser as Assistant).permissions : Object.values(AppView);

  const mainItems = [
    { id: AppView.DASHBOARD, label: settings.viewLabels?.[AppView.DASHBOARD] || 'الرئيسية', icon: '🏠' },
    { id: AppView.STUDENTS, label: settings.viewLabels?.[AppView.STUDENTS] || 'الطلاب', icon: '👥' },
    { id: AppView.CHAT, label: settings.viewLabels?.[AppView.CHAT] || 'النقاش', icon: '💬', showChatDot: true },
    { id: AppView.QUIZZES, label: settings.viewLabels?.[AppView.QUIZZES] || 'المختبر', icon: '📝' },
  ].filter(item => isAssistant ? permissions.includes(item.id as AppView) : true);

  const moreItemsBase = [
    { id: AppView.RESULTS, label: settings.viewLabels?.[AppView.RESULTS] || 'النتائج', icon: '📊', showDot: true },
    { id: AppView.STUDENT_PORTAL, label: 'بوابة الطالب', icon: '🎓' },
    { id: AppView.ASSIGNMENTS, label: settings.viewLabels?.[AppView.ASSIGNMENTS] || 'الواجبات', icon: '📚', showDot: true },
    { id: AppView.MANAGEMENT, label: settings.viewLabels?.[AppView.MANAGEMENT] || 'المجموعات', icon: '🏫' },
    { id: AppView.LIVE_CLASS, label: settings.viewLabels?.[AppView.LIVE_CLASS] || 'البث', icon: '🎥' },
    { id: AppView.FILES, label: settings.viewLabels?.[AppView.FILES] || 'المكتبة', icon: '📁' },
    { id: AppView.AI_SOLVER, label: settings.viewLabels?.[AppView.AI_SOLVER] || 'المحلل', icon: '🧠' },
  ].filter(item => isAssistant ? permissions.includes(item.id as AppView) : true);

  const customItems = (settings.customSections || []).map(s => ({
    id: s.id,
    label: s.title,
    icon: s.icon,
    showDot: false
  }));

  const allMoreItems = [...moreItemsBase, ...customItems];
  if (!isAssistant) {
     allMoreItems.push({ id: AppView.SETTINGS, label: 'الإعدادات', icon: '⚙️', showDot: false });
  }

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] lg:hidden w-[92%] max-w-md">
        <nav className="bg-slate-900/80 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl border border-white/10 p-2 flex justify-around items-center h-20">
          {mainItems.map((item) => {
            const hasDot = (item.showChatDot && unreadChatCount > 0);
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id); setIsMoreOpen(false); }}
                className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all relative ${
                  isActive ? 'bg-blue-600 text-white scale-105 shadow-lg' : 'text-slate-400'
                }`}
              >
                <span className="text-xl mb-1">{item.icon}</span>
                <span className="text-[8px] font-black uppercase tracking-wider">{item.label}</span>
                {hasDot && (
                  <span className="absolute top-3 right-4 w-2 h-2 bg-rose-500 rounded-full border border-white shadow-sm animate-pulse"></span>
                )}
              </button>
            );
          })}
          
          <button
            onClick={() => setIsMoreOpen(!isMoreOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full rounded-2xl transition-all relative ${
              isMoreOpen ? 'bg-blue-600 text-white scale-105 shadow-lg' : 'text-slate-400'
            }`}
          >
            <span className="text-xl mb-1">{isMoreOpen ? '✕' : '☰'}</span>
            <span className="text-[8px] font-black uppercase tracking-wider">المزيد</span>
            {!isMoreOpen && (pendingCount > 0 || unreadChatCount > 0) && (
              <span className="absolute top-3 right-4 w-2 h-2 bg-amber-500 rounded-full border border-white shadow-sm animate-pulse"></span>
            )}
          </button>
        </nav>
      </div>

      {isMoreOpen && (
        <div className="fixed inset-0 z-[95] lg:hidden flex items-end animate-fadeIn">
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setIsMoreOpen(false)}></div>
          <div className="relative w-full bg-[#111827] rounded-t-[3.5rem] p-10 pb-32 animate-slideUp shadow-2xl max-h-[85vh] overflow-y-auto no-scrollbar border-t border-white/10">
            <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-10"></div>
            <div className="grid grid-cols-3 gap-4">
              {allMoreItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { setView(item.id); setIsMoreOpen(false); }}
                  className={`flex flex-col items-center gap-3 p-5 rounded-[2rem] transition-all relative ${
                    currentView === item.id ? 'bg-blue-600 text-white shadow-xl' : 'bg-white/5 text-slate-500 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{item.icon}</span>
                  <span className="text-[9px] font-black text-center leading-tight">{item.label}</span>
                  {(item.showDot && pendingCount > 0) && (
                    <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full border-2 border-slate-900 shadow-sm"></span>
                  )}
                </button>
              ))}
              {isAssistant && (
                <button
                  onClick={() => window.location.reload()}
                  className="flex flex-col items-center gap-3 p-5 rounded-[2rem] bg-rose-500/10 text-rose-500"
                >
                  <span className="text-2xl">🚪</span>
                  <span className="text-[9px] font-black text-center leading-tight">خروج</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BottomNav;
