
import React, { useState, useEffect, useRef } from 'react';
import { PlatformSettings, AppView, Assistant, Student, AssignmentSubmission, ParentInquiry, AppNotification, AppFont, CustomSection, TabFeature } from '../types';
import { generateThemeConfig } from '../services/geminiService';

interface SettingsProps {
  settings: PlatformSettings;
  assistants: Assistant[];
  onUpdate: (newSettings: PlatformSettings) => void;
  onAddAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (id: string) => void;
  // Data for Dashboards
  students?: Student[];
  submissions?: AssignmentSubmission[];
  inquiries?: ParentInquiry[];
  notifications?: AppNotification[];
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, assistants, onUpdate, onAddAssistant, onDeleteAssistant,
  students = [], submissions = [], inquiries = [], notifications = []
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('views');
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  
  // Custom Section Modal State
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', icon: '📄', content: '' });

  // AI Theme State
  const [themePrompt, setThemePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

  // Assistant State
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantPermissions, setNewAssistantPermissions] = useState<AppView[]>([AppView.DASHBOARD]);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  const FONTS: {id: AppFont, label: string}[] = [
    { id: 'Cairo', label: 'Cairo (افتراضي)' },
    { id: 'Tajawal', label: 'Tajawal (عصري)' },
    { id: 'Almarai', label: 'Almarai (رسمي)' },
    { id: 'El Messiri', label: 'El Messiri (فني)' },
  ];

  // System Views Definition
  const SYSTEM_VIEWS = [
    { id: AppView.DASHBOARD, defaultLabel: 'الرئيسية', defaultIcon: '🏠' },
    { id: AppView.STUDENT_PORTAL, defaultLabel: 'بوابة الطالب (معاينة)', defaultIcon: '🎓' },
    { id: AppView.STUDENTS, defaultLabel: 'الطلاب', defaultIcon: '👥' },
    { id: AppView.ASSIGNMENTS, defaultLabel: 'الواجبات', defaultIcon: '📝' },
    { id: AppView.QUIZZES, defaultLabel: 'الاختبارات', defaultIcon: '⚡' },
    { id: AppView.FILES, defaultLabel: 'المحتوى', defaultIcon: '📚' },
    { id: AppView.LIVE_CLASS, defaultLabel: 'بث مباشر', defaultIcon: '🎥' },
    { id: AppView.CHAT, defaultLabel: 'المحادثات', defaultIcon: '💬' },
    { id: AppView.NOTIFICATIONS, defaultLabel: 'التنبيهات', defaultIcon: '🔔' },
    { id: AppView.RESULTS, defaultLabel: 'النتائج', defaultIcon: '📊' },
    { id: AppView.REWARDS, defaultLabel: 'المتجر', defaultIcon: '🎁' },
    { id: AppView.SCHEDULE, defaultLabel: 'الجدول', defaultIcon: '📅' },
    { id: AppView.AI_SOLVER, defaultLabel: 'المحلل الذكي', defaultIcon: '🧠' },
    { id: AppView.FORMULAS, defaultLabel: 'القوانين', defaultIcon: '📐' },
    { id: AppView.LEADERBOARD, defaultLabel: 'المتصدرين', defaultIcon: '🏆' },
    { id: AppView.CALL_CENTER, defaultLabel: 'الاتصالات', defaultIcon: '📞' },
  ];

  // Default Internal Tabs Configuration (For initial setup if empty)
  const DEFAULT_TABS_CONFIG: Record<string, TabFeature[]> = {
    [AppView.STUDENT_PORTAL]: [
      { id: 'dashboard', label: 'الرئيسية', enabled: true },
      { id: 'library', label: 'دروسي', enabled: true },
      { id: 'assignments', label: 'واجباتي', enabled: true },
      { id: 'quizzes', label: 'امتحاناتي', enabled: true },
      { id: 'results', label: 'التقارير', enabled: true }
    ],
    [AppView.QUIZZES]: [
        { id: 'ai', label: 'مولد الأسئلة (AI)', enabled: true },
        { id: 'scanner', label: 'ماسح الورق', enabled: true },
        { id: 'editor', label: 'المحرر اليدوي', enabled: true },
        { id: 'external', label: 'روابط خارجية', enabled: true }
    ],
    [AppView.FILES]: [
        { id: 'videos', label: 'فيديوهات', enabled: true },
        { id: 'docs', label: 'كتب وملازم', enabled: true }
    ],
    [AppView.CALL_CENTER]: [
        { id: 'inquiries', label: 'الطلبات الواردة', enabled: true },
        { id: 'logs', label: 'سجل المكالمات', enabled: true }
    ],
    [AppView.CHAT]: [
        { id: 'group', label: 'الساحة العامة', enabled: true },
        { id: 'private', label: 'مراسلة المعلم', enabled: true }
    ]
  };

  // Sync settings only if not in preview mode to avoid overwriting changes
  useEffect(() => {
    if (!isPreviewMode && !isDirty) {
      setLocalSettings(settings);
      setOriginalSettings(settings);
    }
  }, [settings, isPreviewMode, isDirty]);

  const handleChange = (key: keyof PlatformSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleBrandingChange = (key: keyof PlatformSettings['branding'], value: any) => {
    setLocalSettings(prev => ({ 
      ...prev, 
      branding: { ...prev.branding, [key]: value } 
    }));
    setIsDirty(true);
  };

  const handleDashboardWidgetChange = (key: keyof PlatformSettings['dashboardWidgets'], value: boolean) => {
    const currentWidgets = localSettings.dashboardWidgets || { showStats: true, showQuickActions: true, showLeaderboard: true, showTools: true };
    setLocalSettings(prev => ({ 
      ...prev, 
      dashboardWidgets: { ...currentWidgets, [key]: value } 
    }));
    setIsDirty(true);
  };

  const handleContentChange = (key: keyof PlatformSettings['contentTexts'], value: any) => {
    setLocalSettings(prev => ({ 
      ...prev, 
      contentTexts: { ...prev.contentTexts, [key]: value } 
    }));
    setIsDirty(true);
  };

  // View Management Handlers
  const toggleViewEnabled = (viewId: string) => {
    const currentEnabled = localSettings.enabledViews || Object.values(AppView);
    let newEnabled;
    if (currentEnabled.includes(viewId)) {
      newEnabled = currentEnabled.filter(v => v !== viewId);
    } else {
      newEnabled = [...currentEnabled, viewId];
    }
    handleChange('enabledViews', newEnabled);
  };

  const updateViewLabel = (viewId: string, label: string) => {
    const currentLabels = localSettings.viewLabels || {};
    const newLabels = { ...currentLabels, [viewId]: label };
    handleChange('viewLabels', newLabels);
  };

  const updateViewIcon = (viewId: string, icon: string) => {
    const currentIcons = localSettings.viewIcons || {};
    const newIcons = { ...currentIcons, [viewId]: icon };
    handleChange('viewIcons', newIcons);
  };

  // Tab Management Handlers
  const getTabsForView = (viewId: string) => {
    const currentConfig = localSettings.featureConfig || {};
    return currentConfig[viewId] || DEFAULT_TABS_CONFIG[viewId] || [];
  };

  const updateTabConfig = (viewId: string, tabId: string, updates: Partial<TabFeature>) => {
    const currentConfig = localSettings.featureConfig || {};
    const viewTabs = currentConfig[viewId] || DEFAULT_TABS_CONFIG[viewId] || [];
    
    // Check if viewConfig exists, if not initialize it with default
    const existingTabs = viewTabs.length > 0 ? viewTabs : (DEFAULT_TABS_CONFIG[viewId] || []);
    
    const newViewTabs = existingTabs.map(t => t.id === tabId ? { ...t, ...updates } : t);
    
    const newConfig = { ...currentConfig, [viewId]: newViewTabs };
    handleChange('featureConfig', newConfig);
  };

  // Custom Section Handlers
  const handleSaveSection = () => {
    if (!sectionForm.title) return;
    
    const currentSections = localSettings.customSections || [];
    let newSections;

    if (editingSection) {
      newSections = currentSections.map(s => s.id === editingSection.id ? { ...s, ...sectionForm } : s);
    } else {
      const newSec: CustomSection = {
        id: `custom_${Date.now()}`,
        ...sectionForm,
        isVisibleToStudents: true
      };
      newSections = [...currentSections, newSec];
    }

    handleChange('customSections', newSections);
    setShowSectionModal(false);
    setSectionForm({ title: '', icon: '📄', content: '' });
    setEditingSection(null);
  };

  const handleDeleteSection = (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا القسم؟')) return;
    const currentSections = localSettings.customSections || [];
    handleChange('customSections', currentSections.filter(s => s.id !== id));
  };

  const handleEditSection = (section: CustomSection) => {
    setEditingSection(section);
    setSectionForm({ title: section.title, icon: section.icon, content: section.content });
    setShowSectionModal(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'logoUrl' | 'heroImageUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        handleBrandingChange(key, ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setIsDirty(false);
    setIsPreviewMode(false);
    setOriginalSettings(localSettings);
  };

  const handleRevert = () => {
    setLocalSettings(originalSettings);
    setIsDirty(false);
    setIsPreviewMode(false);
  };

  const handleAiThemeGeneration = async (prompt?: string) => {
    const text = prompt || themePrompt;
    if (!text) return;

    setIsGeneratingTheme(true);
    try {
      const themeConfig = await generateThemeConfig(text);
      if (themeConfig) {
        setLocalSettings(prev => ({
          ...prev,
          branding: {
            ...prev.branding,
            primaryColor: themeConfig.primaryColor || prev.branding.primaryColor,
            secondaryColor: themeConfig.secondaryColor || prev.branding.secondaryColor,
            fontFamily: themeConfig.fontFamily || prev.branding.fontFamily,
          }
        }));
        setIsPreviewMode(true);
        setIsDirty(true);
      }
    } catch (e) {
      alert("عذراً، حدث خطأ أثناء توليد الثيم. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const handleAddAssistant = () => {
    if (!newAssistantName.trim()) return;
    const finalPermissions = Array.from(new Set([...newAssistantPermissions, AppView.DASHBOARD]));
    const assistant: Assistant = {
      id: 'asst_' + Date.now(),
      name: newAssistantName,
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      permissions: finalPermissions,
      addedAt: new Date().toLocaleDateString('ar-EG')
    };
    onAddAssistant(assistant);
    setNewAssistantName('');
    setNewAssistantPermissions([AppView.DASHBOARD]);
    alert('تم إضافة المساعد بنجاح! \n كود الدخول: ' + assistant.code);
  };

  const sections = [
    { id: 'views', label: 'القوائم والأقسام', icon: '🍱', desc: 'إضافة وحذف وتعديل القوائم الرئيسية' },
    { id: 'tabs', label: 'تخصيص التبويبات الداخلية', icon: '📑', desc: 'التحكم في الأزرار والتبويبات داخل كل شاشة' },
    { id: 'branding', label: 'المظهر والهوية', icon: '🎨', desc: 'تخصيص الألوان، الخطوط، والشعارات' },
    { id: 'dashboard_config', label: 'تخطيط لوحة التحكم', icon: '📐', desc: 'إظهار وإخفاء أدوات الشاشة الرئيسية' },
    { id: 'content', label: 'نصوص المحتوى', icon: '📝', desc: 'عناوين ورسائل الترحيب' },
    { id: 'system', label: 'إعدادات النظام والميزات', icon: '⚙️', desc: 'الخصائص، التلقائية، ونمط الرياضيات' },
    { id: 'security', label: 'الأمان وضبط الأجهزة', icon: '🛡️', desc: 'حماية المحتوى وإدارة الوصول' },
    { id: 'assistants', label: 'إدارة الطاقم', icon: '🛠️', desc: 'إضافة مساعدين وصلاحياتهم' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slideUp pb-40 text-right" dir="rtl">
      
      {/* Page Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-8">
         <h2 className="text-3xl font-black text-slate-800">لوحة التحكم والإعدادات ⚙️</h2>
         <p className="text-slate-400 font-bold mt-2">تحكم في كل تفاصيل منصتك من مكان واحد.</p>
      </div>

      {/* Floating Preview/Save Bar */}
      {(isPreviewMode || isDirty) && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce w-[90%] max-w-lg">
          <div className="bg-slate-900/90 backdrop-blur-md text-white p-4 rounded-[2.5rem] shadow-2xl flex items-center justify-between gap-4 border border-white/10">
             <div className="flex items-center gap-3 px-2">
                <span className="text-2xl">✨</span>
                <div>
                   <p className="font-black text-sm">تم تطبيق التغييرات</p>
                   <p className="text-[10px] text-slate-300 font-medium">هل تريد حفظ التعديلات؟</p>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handleRevert} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl font-bold text-xs transition-all">تراجع ↩</button>
                <button onClick={handleSave} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-2xl font-black text-xs shadow-lg transition-all">حفظ ✓</button>
             </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {sections.map(section => (
          <div key={section.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden transition-all duration-300">
             <button 
               onClick={() => setExpandedSection(expandedSection === section.id ? '' : section.id)}
               className={`w-full p-8 flex items-center justify-between transition-colors ${expandedSection === section.id ? 'bg-slate-50' : 'bg-white hover:bg-slate-50'}`}
             >
                <div className="flex items-center gap-6">
                   <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${expandedSection === section.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {section.icon}
                   </div>
                   <div className="text-right">
                      <h3 className="text-xl font-black text-slate-800">{section.label}</h3>
                      <p className="text-xs text-slate-400 font-bold mt-1">{section.desc}</p>
                   </div>
                </div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform duration-300 ${expandedSection === section.id ? 'bg-slate-200 rotate-180' : 'bg-slate-50'}`}>
                   ▼
                </div>
             </button>

             {expandedSection === section.id && (
               <div className="p-8 border-t border-slate-100 animate-fadeIn">
                  
                  {/* Views & Menu Editor Section */}
                  {section.id === 'views' && (
                    <div className="space-y-8">
                       <div className="flex justify-between items-center mb-4">
                          <h4 className="font-black text-slate-800 text-lg">هيكلة التطبيق والقوائم</h4>
                          <button 
                            onClick={() => { setEditingSection(null); setSectionForm({title: '', icon: '📄', content: ''}); setShowSectionModal(true); }}
                            className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg hover:scale-105 transition-all"
                          >
                            إضافة قسم جديد ＋
                          </button>
                       </div>

                       <div className="space-y-4">
                          {/* System Views List */}
                          {SYSTEM_VIEWS.map((view) => {
                            const isEnabled = (localSettings.enabledViews || Object.values(AppView)).includes(view.id);
                            const currentLabel = localSettings.viewLabels?.[view.id] || view.defaultLabel;
                            const currentIcon = localSettings.viewIcons?.[view.id] || view.defaultIcon;

                            return (
                              <div key={view.id} className={`p-4 rounded-[2rem] border transition-all flex flex-col md:flex-row items-center gap-4 ${isEnabled ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                                 <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                    {/* Icon Input */}
                                    <div className="relative group">
                                       <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center text-xl cursor-pointer">
                                          {currentIcon}
                                       </div>
                                       <input 
                                         type="text" 
                                         className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                         value={currentIcon}
                                         onChange={(e) => updateViewIcon(view.id, e.target.value)}
                                         disabled={!isEnabled}
                                         title="اكتب رمز تعبيري (Emoji) جديد"
                                       />
                                    </div>
                                    
                                    {/* Label Input */}
                                    <div className="flex-1">
                                       <input 
                                         type="text" 
                                         className={`font-bold text-sm bg-transparent outline-none w-full border-b border-transparent focus:border-indigo-500 pb-1 ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}
                                         value={currentLabel}
                                         onChange={(e) => updateViewLabel(view.id, e.target.value)}
                                         disabled={!isEnabled}
                                         placeholder={view.defaultLabel}
                                       />
                                       <p className="text-[9px] text-slate-400 font-bold mt-1">القسم الأساسي: {view.defaultLabel}</p>
                                    </div>
                                 </div>

                                 {/* Toggle Button */}
                                 <button 
                                   onClick={() => toggleViewEnabled(view.id)}
                                   className={`px-6 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 min-w-[120px] justify-center ${isEnabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-200 text-slate-500'}`}
                                 >
                                   <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                   {isEnabled ? 'مفعل' : 'معطل'}
                                 </button>
                              </div>
                            );
                          })}

                          {/* Custom Sections List */}
                          {(localSettings.customSections || []).map((section) => (
                             <div key={section.id} className="p-4 rounded-[2rem] border border-indigo-100 bg-indigo-50/30 flex flex-col md:flex-row items-center gap-4 relative group">
                                <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                                   <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-xl shadow-sm text-indigo-600">
                                      {section.icon}
                                   </div>
                                   <div className="flex-1">
                                      <h4 className="font-bold text-sm text-slate-800">{section.title}</h4>
                                      <p className="text-[9px] text-indigo-400 font-bold mt-1">قسم مخصص</p>
                                   </div>
                                </div>
                                
                                <div className="flex gap-2">
                                   <button 
                                     onClick={() => handleEditSection(section)}
                                     className="px-4 py-2 bg-white text-indigo-600 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-50 border border-indigo-100"
                                   >
                                     تعديل ✎
                                   </button>
                                   <button 
                                     onClick={() => handleDeleteSection(section.id)}
                                     className="px-4 py-2 bg-white text-rose-500 rounded-xl text-xs font-bold shadow-sm hover:bg-rose-50 border border-rose-100"
                                   >
                                     حذف 🗑️
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>
                  )}

                  {/* Tabs Control Section (New) */}
                  {section.id === 'tabs' && (
                    <div className="space-y-8">
                       <p className="text-slate-500 text-xs font-bold bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                          هنا يمكنك إعادة تسمية أو إخفاء التبويبات الداخلية لكل شاشة (مثل: تبويب "فيديوهات" داخل المكتبة، أو "واجباتي" داخل بوابة الطالب).
                       </p>
                       
                       {[
                         { vid: AppView.STUDENT_PORTAL, label: 'بوابة الطالب 🎓' },
                         { vid: AppView.QUIZZES, label: 'قسم الاختبارات ⚡' },
                         { vid: AppView.FILES, label: 'قسم المحتوى والمكتبة 📚' },
                         { vid: AppView.CALL_CENTER, label: 'قسم الاتصالات 📞' },
                         { vid: AppView.CHAT, label: 'قسم المحادثات 💬' }
                       ].map((sectionItem) => (
                         <div key={sectionItem.vid} className="space-y-4">
                            <h4 className="font-black text-slate-800 text-md px-2 border-r-4 border-indigo-600 mr-2">{sectionItem.label}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {getTabsForView(sectionItem.vid).map((tab) => (
                                 <div key={tab.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-200 transition-all">
                                    <div className="flex-1 space-y-1">
                                       <label className="text-[9px] font-black text-slate-400 block">اسم التبويب</label>
                                       <input 
                                         type="text" 
                                         className="w-full bg-transparent border-b border-slate-200 font-bold text-sm text-slate-800 outline-none focus:border-indigo-500 transition-all"
                                         value={tab.label}
                                         onChange={(e) => updateTabConfig(sectionItem.vid, tab.id, { label: e.target.value })}
                                       />
                                    </div>
                                    <button 
                                       onClick={() => updateTabConfig(sectionItem.vid, tab.id, { enabled: !tab.enabled })}
                                       className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${tab.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'}`}
                                    >
                                       {tab.enabled ? 'ظاهر' : 'مخفي'}
                                    </button>
                                 </div>
                               ))}
                            </div>
                         </div>
                       ))}
                    </div>
                  )}

                  {/* Branding Section */}
                  {section.id === 'branding' && (
                    <div className="space-y-12">
                        {/* AI Theme Designer */}
                        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-8 rounded-[3rem] text-white relative overflow-hidden">
                           {/* ... (Existing AI Theme UI) ... */}
                           <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                           <div className="relative z-10 space-y-6">
                              <h4 className="text-2xl font-black flex items-center gap-3">
                                 <span>✨</span> ستوديو التصميم الذكي
                              </h4>
                              <p className="text-slate-300 text-sm font-medium">
                                 صف المظهر الذي تتخيله (مثلاً: "غروب الشمس الدافئ"، "تكنولوجي أزرق") وسيقوم الذكاء الاصطناعي بتصميمه فوراً.
                              </p>
                              
                              <div className="flex gap-4">
                                 <input 
                                   type="text" 
                                   placeholder="اكتب وصف الثيم هنا..." 
                                   className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-slate-400 font-bold outline-none focus:bg-white/20 transition-all"
                                   value={themePrompt}
                                   onChange={e => setThemePrompt(e.target.value)}
                                   onKeyDown={e => e.key === 'Enter' && handleAiThemeGeneration()}
                                 />
                                 <button 
                                   onClick={() => handleAiThemeGeneration()}
                                   disabled={isGeneratingTheme || !themePrompt}
                                   className="px-8 py-4 bg-white text-indigo-900 rounded-2xl font-black text-sm shadow-xl hover:scale-105 transition-all disabled:opacity-50"
                                 >
                                   {isGeneratingTheme ? 'جاري التصميم...' : 'تنفيذ 🎨'}
                                 </button>
                              </div>
                           </div>
                        </div>

                        {/* Manual Controls */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                           <div className="space-y-6">
                              <h4 className="font-black text-slate-800 text-lg">التخصيص اليدوي</h4>
                              <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                                 <div className="flex gap-6 items-center">
                                    <div className="flex flex-col gap-2 items-center">
                                       <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" value={localSettings.branding.primaryColor} onChange={e => handleBrandingChange('primaryColor', e.target.value)} />
                                       <span className="text-[10px] font-black text-slate-500">اللون الرئيسي</span>
                                    </div>
                                    <div className="flex flex-col gap-2 items-center">
                                       <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" value={localSettings.branding.secondaryColor} onChange={e => handleBrandingChange('secondaryColor', e.target.value)} />
                                       <span className="text-[10px] font-black text-slate-500">اللون الثانوي</span>
                                    </div>
                                 </div>
                                 
                                 <div className="pt-4 border-t border-slate-200">
                                    <label className="text-[10px] font-black text-slate-500 block mb-2">نوع الخط</label>
                                    <select 
                                       className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm font-bold outline-none"
                                       value={localSettings.branding.fontFamily || 'Cairo'}
                                       onChange={(e) => handleBrandingChange('fontFamily', e.target.value)}
                                    >
                                       {FONTS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                 </div>
                              </div>
                           </div>

                           <div className="space-y-6">
                              <h4 className="font-black text-slate-800 text-lg">الصور والشعارات</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-4 bg-slate-50 rounded-3xl text-center border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => logoInputRef.current?.click()}>
                                    {localSettings.branding.logoUrl ? (
                                      <img src={localSettings.branding.logoUrl} className="w-20 h-20 mx-auto object-contain rounded-xl" alt="Logo" />
                                    ) : (
                                      <div className="w-20 h-20 bg-white rounded-xl mx-auto flex items-center justify-center text-2xl shadow-sm">🖼️</div>
                                    )}
                                    <p className="text-[9px] font-black text-slate-400 mt-2">شعار المنصة</p>
                                    <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logoUrl')} />
                                 </div>

                                 <div className="p-4 bg-slate-50 rounded-3xl text-center border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer group" onClick={() => heroInputRef.current?.click()}>
                                    {localSettings.branding.heroImageUrl ? (
                                      <img src={localSettings.branding.heroImageUrl} className="w-20 h-20 mx-auto object-cover rounded-xl" alt="Hero" />
                                    ) : (
                                      <div className="w-20 h-20 bg-white rounded-xl mx-auto flex items-center justify-center text-2xl shadow-sm">📸</div>
                                    )}
                                    <p className="text-[9px] font-black text-slate-400 mt-2">صورة المعلم</p>
                                    <input type="file" ref={heroInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'heroImageUrl')} />
                                 </div>
                              </div>
                           </div>
                       </div>
                    </div>
                  )}

                  {/* Dashboard Config Section */}
                  {section.id === 'dashboard_config' && (
                     <div className="space-y-6">
                        <h4 className="font-black text-slate-800 text-lg">تحكم في محتويات الصفحة الرئيسية</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => handleDashboardWidgetChange('showStats', !localSettings.dashboardWidgets?.showStats)}>
                              <span className="font-bold text-slate-700">بطاقات الإحصائيات العلوية</span>
                              <div className={`w-10 h-6 rounded-full relative transition-all ${localSettings.dashboardWidgets?.showStats ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.dashboardWidgets?.showStats ? 'left-1' : 'left-5'}`}></div>
                              </div>
                           </div>
                           {/* ... other widgets ... */}
                           <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer" onClick={() => handleDashboardWidgetChange('showQuickActions', !localSettings.dashboardWidgets?.showQuickActions)}>
                              <span className="font-bold text-slate-700">أزرار الوصول السريع</span>
                              <div className={`w-10 h-6 rounded-full relative transition-all ${localSettings.dashboardWidgets?.showQuickActions ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${localSettings.dashboardWidgets?.showQuickActions ? 'left-1' : 'left-5'}`}></div>
                              </div>
                           </div>
                           {/* Add Leaderboard/Tools toggle same pattern */}
                        </div>
                     </div>
                  )}

                  {/* Content Section */}
                  {section.id === 'content' && (
                    <div className="space-y-8">
                        <div className="space-y-4">
                           <h4 className="font-black text-slate-800 text-sm bg-blue-50 p-2 rounded-lg inline-block px-4">الصفحة الرئيسية (Landing Page)</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">العنوان الرئيسي</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={localSettings.contentTexts.landingTitle} onChange={e => handleContentChange('landingTitle', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">العنوان الفرعي</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" value={localSettings.contentTexts.landingSubtitle} onChange={e => handleContentChange('landingSubtitle', e.target.value)} />
                              </div>
                           </div>
                        </div>
                        {/* ... other content sections ... */}
                    </div>
                  )}

                  {/* System Settings */}
                  {section.id === 'system' && (
                    <div className="space-y-8">
                       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                             <h4 className="font-black text-slate-800 flex items-center gap-2">
                                <span>🧮</span>
                                <span>نمط الرياضيات</span>
                             </h4>
                             <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                                <button onClick={() => handleChange('mathNotation', 'arabic')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${localSettings.mathNotation === 'arabic' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>عربي (س، ص)</button>
                                <button onClick={() => handleChange('mathNotation', 'english')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${localSettings.mathNotation === 'english' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}>English (x, y)</button>
                             </div>
                          </div>
                          {/* ... other system settings ... */}
                       </div>
                    </div>
                  )}

                  {/* Security Section */}
                  {section.id === 'security' && (
                    <div className="space-y-8">
                        <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center gap-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">🔑</div>
                                <div>
                                  <h4 className="font-black text-lg">كود دخول المعلم</h4>
                                  <p className="text-[10px] text-slate-400 font-bold uppercase">المفتاح الرئيسي</p>
                               </div>
                            </div>
                            <input 
                              type="text" 
                              className="w-full md:w-64 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-black text-2xl text-center tracking-[0.5em] outline-none focus:border-blue-500 transition-all" 
                              value={localSettings.adminCode} 
                              onChange={e => handleChange('adminCode', e.target.value)} 
                            />
                        </div>
                        {/* ... other security settings ... */}
                    </div>
                  )}

                  {/* Assistants Section */}
                  {section.id === 'assistants' && (
                    <div className="space-y-10">
                        <div className="bg-indigo-50/50 border-2 border-indigo-100 p-8 rounded-[3rem] space-y-6">
                            <div className="space-y-4">
                              <label className="text-[10px] font-black text-indigo-400 uppercase px-2">إضافة مساعد جديد</label>
                              <div className="flex flex-col md:flex-row gap-4">
                                <input type="text" placeholder="اسم المساعد" className="flex-1 px-8 py-5 bg-white rounded-2xl font-black outline-none shadow-sm focus:ring-2 focus:ring-indigo-500 transition-all" value={newAssistantName} onChange={e => setNewAssistantName(e.target.value)} />
                                <button onClick={handleAddAssistant} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all">إضافة ＋</button>
                              </div>
                            </div>
                            {/* ... permissions UI ... */}
                        </div>
                        {/* ... assistants list ... */}
                    </div>
                  )}

               </div>
             )}
          </div>
        ))}
      </div>

      {/* Custom Section Editor Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[3.5rem] shadow-2xl relative animate-slideUp overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
              <h3 className="text-2xl font-black text-slate-800">
                {editingSection ? 'تعديل القسم' : 'إضافة قسم جديد'}
              </h3>
              <button onClick={() => setShowSectionModal(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">✕</button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-4 gap-6">
                <div className="col-span-1 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">الأيقونة</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-4 bg-slate-50 rounded-2xl text-center text-2xl outline-none focus:ring-2 focus:ring-indigo-600" 
                    value={sectionForm.icon} 
                    onChange={e => setSectionForm({...sectionForm, icon: e.target.value})} 
                    placeholder="📄"
                  />
                </div>
                <div className="col-span-3 space-y-2">
                  <label className="text-[10px] font-black text-slate-400 px-2 uppercase">عنوان القسم</label>
                  <input 
                    type="text" 
                    className="w-full px-6 py-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600" 
                    value={sectionForm.title} 
                    onChange={e => setSectionForm({...sectionForm, title: e.target.value})} 
                    placeholder="مثال: مراجعات ليلة الامتحان"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 px-2 uppercase">المحتوى (يدعم Markdown)</label>
                <textarea 
                  className="w-full p-6 bg-slate-50 rounded-[2rem] font-medium text-sm h-64 outline-none focus:ring-2 focus:ring-indigo-600 resize-none leading-relaxed"
                  value={sectionForm.content} 
                  onChange={e => setSectionForm({...sectionForm, content: e.target.value})} 
                  placeholder="اكتب المحتوى هنا..."
                />
              </div>

              <button 
                onClick={handleSaveSection}
                className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl hover:scale-[1.01] transition-transform"
              >
                حفظ التغييرات ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
