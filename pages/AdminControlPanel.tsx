
import React, { useMemo } from 'react';
import { 
  Year, Group, Student, AppNotification, QuizResult, 
  PlatformSettings, Assistant, ParentInquiry, CallLog, ScheduleEntry,
  PlatformReward, RewardRedemption, Quiz, Assignment, AppView, AssignmentSubmission
} from '../types';

import Management from './ManagementPage';
import QuizResults from './QuizResults';
import Notifications from './NotificationsPage';
import Leaderboard from './LeaderboardPage';
import Settings from './SettingsPage';
import TestCenter from './TestCenter';
import LaunchGuide from './LaunchGuide';
import Schedules from './SchedulesPage';
import Sections from './SectionsPage';
// The QuizGenerator component is available here
import QuizGenerator from './QuizGenerator'; 

interface AdminControlPanelProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  years: Year[];
  groups: Group[];
  students: Student[];
  notifications: AppNotification[];
  results: QuizResult[];
  settings: PlatformSettings;
  assistants: Assistant[];
  schedules: ScheduleEntry[];
  quizzes: Quiz[];
  assignments: Assignment[];
  submissions: AssignmentSubmission[];
  onUpdateSettings: (s: PlatformSettings) => void;
  onAddAssistant: (a: Assistant) => void;
  onDeleteAssistant: (id: string) => void;
  onAddYear: (n: string) => void;
  onAddGroup: (n: string, y: string, t: string, ty: 'center' | 'online', g: 'boys' | 'girls' | 'mixed', c: number, p: string) => void;
  onDeleteGroup: (id: string) => void;
  onSendNotif: (n: any, p: boolean) => void;
  onDeleteNotif: (id: string) => void;
  onMarkNotifRead: (id: string) => void;
  onUpdateResult: (id: string, s: number, f: string) => void;
  onAddSchedule: (s: any) => void;
  onDeleteSchedule: (id: string) => void;
  onMockData: (data: any) => void;
  onEnterSimulation: (s: Student) => void;
  addToast: (m: string, t: any) => void;
  loggedUser?: any;
}

const AdminControlPanel: React.FC<AdminControlPanelProps> = (props) => {
  const isAssistant = props.loggedUser?.role === 'assistant';
  const permissions = isAssistant ? (props.loggedUser as Assistant).permissions : Object.values(AppView);

  const ALL_TABS = useMemo(() => [
    { id: 'groups', label: 'المجموعات', icon: '🏫', permission: AppView.MANAGEMENT },
    { id: 'results', label: 'النتائج', icon: '📊', permission: AppView.RESULTS },
    { id: 'sections', label: 'الأقسام', icon: '🧩', permission: AppView.SECTIONS },
    { id: 'settings', label: 'الإعدادات', icon: '⚙️', permission: AppView.SETTINGS },
    { id: 'tech', label: 'التقني', icon: '🧪', permission: AppView.TEST_CENTER },
  ], []);

  const allowedTabs = useMemo(() => {
    return ALL_TABS.filter(tab => {
        if (permissions.includes(tab.permission)) return true;
        if (tab.id === 'comms' && (permissions.includes(AppView.NOTIFICATIONS) || permissions.includes(AppView.LEADERBOARD))) return true;
        if (tab.id === 'groups' && permissions.includes(AppView.SCHEDULE)) return true;
        return false;
    });
  }, [permissions, ALL_TABS]);

  const toggleFastSetting = (key: keyof PlatformSettings) => {
    if (isAssistant) return props.addToast('ليس لديك صلاحية تعديل إعدادات النظام.', 'error');
    const newVal = !props.settings[key];
    props.onUpdateSettings({ ...props.settings, [key]: newVal });
    props.addToast(`تم ${newVal ? 'تفعيل' : 'تعطيل'} الإعداد بنجاح ✓`, 'info');
  };

  const renderActiveContent = () => {
    switch (props.activeTab) {
      case 'groups':
        return (
          <div className="space-y-12 animate-fadeIn">
            <Management 
              years={props.years} groups={props.groups} students={props.students} 
              onAddYear={props.onAddYear} onAddGroup={props.onAddGroup} onDeleteGroup={props.onDeleteGroup}
              teacherName={props.settings.teacherName} platformName={props.settings.platformName}
            />
            <div className="border-t border-slate-100 pt-12">
               <Schedules groups={props.groups} schedules={props.schedules} onAdd={props.onAddSchedule} onDelete={props.onDeleteSchedule} />
            </div>
          </div>
        );
      case 'results':
        return (
          <div className="animate-fadeIn">
            <QuizResults 
              results={props.results} students={props.students} notifications={props.notifications}
              onIssueCertificate={() => {}} onUpdateResult={props.onUpdateResult} notation={props.settings.mathNotation}
            />
          </div>
        );
      case 'sections':
        return (
          <div className="animate-fadeIn">
            <Sections 
              sections={props.settings.customSections || []} 
              onUpdateSections={(secs) => props.onUpdateSettings({...props.settings, customSections: secs})} 
            />
          </div>
        );
      case 'settings':
        return (
          <div className="animate-fadeIn">
            <Settings 
              settings={props.settings} 
              assistants={props.assistants} 
              onUpdate={props.onUpdateSettings} 
              onAddAssistant={props.onAddAssistant} 
              onDeleteAssistant={props.onDeleteAssistant}
              students={props.students}
              submissions={props.submissions}
              inquiries={props.inquiries}
              notifications={props.notifications}
            />
          </div>
        );
      case 'tech':
        return (
          <div className="space-y-12 animate-fadeIn">
            <TestCenter 
              students={props.students} years={props.years} groups={props.groups} quizzes={props.quizzes} assignments={props.assignments} settings={props.settings}
              onMockData={props.onMockData} onEnterSimulation={props.onEnterSimulation} addToast={props.addToast}
            />
            <div className="border-t border-slate-100 pt-12">
               <LaunchGuide groups={props.groups} years={props.years} teacherName={props.settings.teacherName} platformName={props.settings.platformName} addToast={props.addToast} />
            </div>
          </div>
        );
      default: 
        return <Management years={props.years} groups={props.groups} students={props.students} onAddYear={props.onAddYear} onAddGroup={props.onAddGroup} onDeleteGroup={props.onDeleteGroup} teacherName={props.settings.teacherName} platformName={props.settings.platformName} />;
    }
  };

  return (
    <div className="min-h-screen space-y-10 animate-fadeIn text-right font-['Cairo'] pb-48" dir="rtl">
      {/* Central Header with Quick Toggles */}
      <div className="relative overflow-hidden rounded-[4rem] bg-[#0f172a] p-12 md:p-16 text-white shadow-2xl border border-white/5">
        <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,_rgba(59,130,246,0.15),transparent_60%)]"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-10">
           <div className="text-center md:text-right">
              <h1 className="text-4xl md:text-6xl font-black tracking-tighter leading-tight">لوحة التحكم <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">الشاملة</span> ⚙️</h1>
              <p className="text-slate-400 text-lg font-medium mt-2">إدارة كافة جوانب المنصة من مكان واحد.</p>
           </div>
           
           {!isAssistant && (
             <div className="flex flex-wrap gap-4 justify-center">
                <button 
                  onClick={() => toggleFastSetting('integrityMode')}
                  className={`px-6 py-3 rounded-2xl font-black text-[10px] flex items-center gap-3 transition-all border ${props.settings.integrityMode ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${props.settings.integrityMode ? 'bg-rose-500 animate-pulse' : 'bg-slate-600'}`}></span>
                  <span>وضع النزاهة {props.settings.integrityMode ? 'نشط' : 'متوقف'}</span>
                </button>
                
                <button 
                  onClick={() => toggleFastSetting('examMode')}
                  className={`px-6 py-3 rounded-2xl font-black text-[10px] flex items-center gap-3 transition-all border ${props.settings.examMode ? 'bg-amber-500/20 border-amber-500/50 text-amber-400' : 'bg-white/5 border-white/10 text-slate-400'}`}
                >
                  <span className={`w-2 h-2 rounded-full ${props.settings.examMode ? 'bg-amber-500 animate-pulse' : 'bg-slate-600'}`}></span>
                  <span>وضع الامتحانات {props.settings.examMode ? 'نشط' : 'متوقف'}</span>
                </button>
             </div>
           )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="sticky top-4 z-[100] px-4">
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-wrap justify-center md:justify-around gap-2 max-w-5xl mx-auto">
          {allowedTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => props.onTabChange(tab.id)}
              className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-xs transition-all duration-300 ${
                props.activeTab === tab.id 
                ? 'bg-blue-600 text-white shadow-xl shadow-blue-200 scale-105' 
                : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Content Area */}
      <div className="max-w-7xl mx-auto px-4 min-h-[60vh]">
         {renderActiveContent()}
      </div>
    </div>
  );
};

export default AdminControlPanel;
