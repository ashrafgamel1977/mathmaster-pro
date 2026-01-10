
import React, { useState, useEffect, useRef } from 'react';
import { PlatformSettings, AppView, Assistant } from '../types';

interface SettingsProps {
  settings: PlatformSettings;
  assistants: Assistant[];
  onUpdate: (newSettings: PlatformSettings) => void;
  onAddAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (id: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, assistants, onUpdate, onAddAssistant, onDeleteAssistant }) => {
  const [expandedSection, setExpandedSection] = useState<string>('branding');
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  
  // Assistant State
  const [newAssistantName, setNewAssistantName] = useState('');
  const [newAssistantPermissions, setNewAssistantPermissions] = useState<AppView[]>([AppView.DASHBOARD]);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const heroInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

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
  };

  // Assistant Logic
  const PERMISSION_OPTIONS = [
    { id: AppView.STUDENTS, label: 'إدارة الطلاب 👥' },
    { id: AppView.ASSIGNMENTS, label: 'الواجبات 📝' },
    { id: AppView.QUIZZES, label: 'الاختبارات ⚡' },
    { id: AppView.FILES, label: 'المحتوى 📚' },
    { id: AppView.CHAT, label: 'الرد على الرسائل 💬' },
    { id: AppView.RESULTS, label: 'رصد النتائج 📊' },
    { id: AppView.REWARDS, label: 'المتجر والنقاط 🎁' },
    { id: AppView.NOTIFICATIONS, label: 'إرسال التنبيهات 🔔' },
    { id: AppView.MANAGEMENT, label: 'إدارة المجموعات 🏫' },
  ];

  const MANAGED_VIEWS = [
    { id: AppView.DASHBOARD, defaultLabel: 'الرئيسية', icon: '🏠' },
    { id: AppView.STUDENTS, defaultLabel: 'الطلاب', icon: '👥' },
    { id: AppView.FILES, defaultLabel: 'المحتوى', icon: '📚' },
    { id: AppView.ASSIGNMENTS, defaultLabel: 'الواجبات', icon: '📝' },
    { id: AppView.QUIZZES, defaultLabel: 'الاختبارات', icon: '⚡' },
    { id: AppView.LIVE_CLASS, defaultLabel: 'بث مباشر', icon: '🎥' },
    { id: AppView.CHAT, defaultLabel: 'التفاعل', icon: '💬' },
    { id: AppView.AI_SOLVER, defaultLabel: 'المحلل الذكي', icon: '🧠' },
    { id: AppView.REWARDS, defaultLabel: 'المتجر', icon: '🎁' },
    { id: AppView.RESULTS, defaultLabel: 'النتائج', icon: '📊' },
  ];

  const togglePermission = (view: AppView) => {
    setNewAssistantPermissions(prev => 
      prev.includes(view) 
        ? prev.filter(p => p !== view)
        : [...prev, view]
    );
  };

  const handleAddAssistant = () => {
    if (!newAssistantName.trim()) return;
    
    // Ensure Dashboard is always included
    const finalPermissions = Array.from(new Set([...newAssistantPermissions, AppView.DASHBOARD]));

    const assistant: Assistant = {
      id: 'asst_' + Date.now(),
      name: newAssistantName,
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      permissions: finalPermissions,
      addedAt: new Date().toLocaleDateString('ar-EG')
    };
    
    onAddAssistant(assistant);
    
    // Reset Form
    setNewAssistantName('');
    setNewAssistantPermissions([AppView.DASHBOARD]);
    
    alert('تم إضافة المساعد بنجاح! \n كود الدخول: ' + assistant.code);
  };

  const sections = [
    { id: 'branding', label: 'المظهر والهوية', icon: '🎨', desc: 'تخصيص الألوان والشعارات' },
    { id: 'content', label: 'نصوص المحتوى', icon: '📝', desc: 'عناوين ورسائل الترحيب' },
    { id: 'system', label: 'إعدادات النظام والميزات', icon: '⚙️', desc: 'الخصائص، التلقائية، ونمط الرياضيات' },
    { id: 'security', label: 'الأمان وضبط الأجهزة', icon: '🛡️', desc: 'حماية المحتوى وإدارة الوصول' },
    { id: 'assistants', label: 'إدارة الطاقم', icon: '🛠️', desc: 'إضافة مساعدين وصلاحياتهم' },
    { id: 'views', label: 'الأقسام والقوائم', icon: '🍱', desc: 'تفعيل وتعطيل أقسام المنصة' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-slideUp pb-40 text-right font-['Cairo']" dir="rtl">
      
      {/* Page Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 mb-8">
         <h2 className="text-3xl font-black text-slate-800">لوحة التحكم والإعدادات ⚙️</h2>
         <p className="text-slate-400 font-bold mt-2">تحكم في كل تفاصيل منصتك من مكان واحد.</p>
      </div>

      {isDirty && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <button 
            onClick={handleSave}
            className="flex items-center gap-4 px-12 py-6 bg-emerald-600 text-white rounded-full font-black shadow-[0_20px_50px_rgba(16,185,129,0.4)] hover:bg-emerald-700 transition-all border-4 border-white"
          >
            <span>حفظ الإعدادات الجديدة</span>
            <span className="text-xl">💾</span>
          </button>
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
                  
                  {/* Branding Section */}
                  {section.id === 'branding' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                           <h4 className="font-black text-slate-800 text-lg">الألوان الأساسية</h4>
                           <div className="flex gap-6 items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
                              <div className="flex flex-col gap-2 items-center">
                                 <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" value={localSettings.branding.primaryColor} onChange={e => handleBrandingChange('primaryColor', e.target.value)} />
                                 <span className="text-[10px] font-black text-slate-500">اللون الرئيسي</span>
                              </div>
                              <div className="flex flex-col gap-2 items-center">
                                 <input type="color" className="w-16 h-16 rounded-2xl cursor-pointer border-4 border-white shadow-lg" value={localSettings.branding.secondaryColor} onChange={e => handleBrandingChange('secondaryColor', e.target.value)} />
                                 <span className="text-[10px] font-black text-slate-500">اللون الثانوي</span>
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

                        <div className="space-y-4">
                           <h4 className="font-black text-slate-800 text-sm bg-amber-50 p-2 rounded-lg inline-block px-4">بوابة الطالب (Student Portal)</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">عنوان الترحيب</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 outline-none" value={localSettings.contentTexts.studentWelcomeTitle} onChange={e => handleContentChange('studentWelcomeTitle', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">الرسالة الفرعية</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-amber-500 outline-none" value={localSettings.contentTexts.studentWelcomeSubtitle} onChange={e => handleContentChange('studentWelcomeSubtitle', e.target.value)} />
                              </div>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <h4 className="font-black text-slate-800 text-sm bg-emerald-50 p-2 rounded-lg inline-block px-4">عام</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">اسم المعلم</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none" value={localSettings.teacherName} onChange={e => handleChange('teacherName', e.target.value)} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black text-slate-400">اسم المنصة</label>
                                 <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-2 border-transparent focus:border-emerald-500 outline-none" value={localSettings.platformName} onChange={e => handleChange('platformName', e.target.value)} />
                              </div>
                           </div>
                        </div>
                    </div>
                  )}

                  {/* System Settings (New Section) */}
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

                          <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                             <h4 className="font-black text-slate-800 flex items-center gap-2">
                                <span>📝</span>
                                <span>التسجيل</span>
                             </h4>
                             <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200" onClick={() => handleChange('allowSelfRegistration', !localSettings.allowSelfRegistration)}>
                                <span className="text-xs font-bold text-slate-600">السماح للطلاب بالتسجيل الذاتي</span>
                                <div className={`w-12 h-7 rounded-full relative transition-all ${localSettings.allowSelfRegistration ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                   <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localSettings.allowSelfRegistration ? 'left-1' : 'left-6'}`}></div>
                                </div>
                             </div>
                          </div>
                       </div>

                       <div className="space-y-4">
                          <h4 className="font-black text-slate-800 text-sm bg-indigo-50 p-2 px-4 rounded-xl inline-block">الميزات والخصائص</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {[
                               { k: 'enableChat', l: 'نظام الدردشة والتفاعل', i: '💬' },
                               { k: 'enableLeaderboard', l: 'لوحة الشرف والمنافسة', i: '🏆' },
                               { k: 'enableAiSolver', l: 'المحلل الذكي (AI Solver)', i: '🧠' },
                               { k: 'examMode', l: 'وضع الامتحانات (تقييد)', i: '📝' },
                               { k: 'autoAttendanceEnabled', l: 'تحضير تلقائي عند الدخول', i: '📅' },
                               { k: 'autoParentReportEnabled', l: 'إرسال تقارير ولي الأمر آلياً', i: '👨‍👩‍👦' },
                             ].map((item) => (
                               <div key={item.k} className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => handleChange(item.k as keyof PlatformSettings, !(localSettings as any)[item.k])}>
                                  <div className="flex items-center gap-3">
                                     <span className="text-xl">{item.i}</span>
                                     <span className="text-xs font-black text-slate-700">{item.l}</span>
                                  </div>
                                  <div className={`w-10 h-6 rounded-full relative transition-all ${(localSettings as any)[item.k] ? 'bg-blue-600' : 'bg-slate-200'}`}>
                                     <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${(localSettings as any)[item.k] ? 'left-1' : 'left-5'}`}></div>
                                  </div>
                               </div>
                             ))}
                          </div>
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

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-slate-50 p-8 rounded-[3rem] border border-slate-100 space-y-6">
                               <div className="flex items-center gap-4 mb-2">
                                  <span className="text-3xl">📱</span>
                                  <div>
                                     <h4 className="font-black text-slate-800">حدود الأجهزة</h4>
                                     <p className="text-[10px] text-slate-400 font-bold">أقصى عدد أجهزة للطالب</p>
                                  </div>
                               </div>
                               <div className="flex items-center justify-between bg-white p-4 rounded-3xl shadow-sm">
                                  <button onClick={() => handleChange('maxDevicesPerStudent', Math.max(1, (localSettings.maxDevicesPerStudent || 2) - 1))} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-black">-</button>
                                  <span className="text-4xl font-black text-blue-600">{localSettings.maxDevicesPerStudent || 2}</span>
                                  <button onClick={() => handleChange('maxDevicesPerStudent', (localSettings.maxDevicesPerStudent || 2) + 1)} className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-xl font-black">+</button>
                               </div>
                            </div>

                            <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 space-y-6">
                               <div className="flex items-center gap-4 mb-2">
                                  <span className="text-3xl">🚫</span>
                                  <div>
                                     <h4 className="font-black text-slate-800">حماية المحتوى</h4>
                                     <p className="text-[10px] text-rose-400 font-bold">منع النسخ والتصوير</p>
                                  </div>
                               </div>
                               
                               <div className="space-y-4">
                                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => handleChange('watermarkEnabled', !localSettings.watermarkEnabled)}>
                                     <span className="text-xs font-black text-slate-600">العلامة المائية</span>
                                     <div className={`w-12 h-7 rounded-full relative transition-all ${localSettings.watermarkEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localSettings.watermarkEnabled ? 'left-1' : 'left-6'}`}></div>
                                     </div>
                                  </div>
                                  {localSettings.watermarkEnabled && (
                                    <input type="text" placeholder="نص العلامة المائية" className="w-full px-6 py-3 bg-white rounded-2xl font-bold text-xs outline-none border" value={localSettings.watermarkText} onChange={e => handleChange('watermarkText', e.target.value)} />
                                  )}
                                  <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm cursor-pointer" onClick={() => handleChange('integrityMode', !localSettings.integrityMode)}>
                                     <div>
                                        <p className="text-xs font-black text-slate-600">وضع النزاهة</p>
                                        <p className="text-[8px] text-slate-400 font-bold">كشف الخروج من الصفحة</p>
                                     </div>
                                     <div className={`w-12 h-7 rounded-full relative transition-all ${localSettings.integrityMode ? 'bg-rose-500' : 'bg-slate-300'}`}>
                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${localSettings.integrityMode ? 'left-1' : 'left-6'}`}></div>
                                     </div>
                                  </div>
                               </div>
                            </div>
                        </div>
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

                            <div className="space-y-4 pt-4 border-t border-indigo-100">
                               <label className="text-[10px] font-black text-indigo-400 uppercase px-2">الصلاحيات</label>
                               <div className="flex flex-wrap gap-3">
                                  {PERMISSION_OPTIONS.map(opt => (
                                    <button 
                                      key={opt.id}
                                      onClick={() => togglePermission(opt.id as AppView)}
                                      className={`px-4 py-2.5 rounded-xl text-[10px] font-black border transition-all flex items-center gap-2 ${
                                        newAssistantPermissions.includes(opt.id as AppView)
                                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                          : 'bg-white text-slate-500 border-slate-200 hover:border-indigo-300'
                                      }`}
                                    >
                                      <span>{newAssistantPermissions.includes(opt.id as AppView) ? '✓' : '+'}</span>
                                      {opt.label}
                                    </button>
                                  ))}
                               </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {assistants.map(asst => (
                            <div key={asst.id} className="p-8 bg-white border border-slate-100 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-6 shadow-sm hover:shadow-md transition-all">
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                  <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-2xl">🛠️</div>
                                  <div>
                                    <h4 className="font-black text-slate-800 text-lg">{asst.name}</h4>
                                    <span className="inline-block bg-slate-100 px-3 py-1 rounded-lg text-[10px] font-black text-slate-500 mt-1">Code: {asst.code}</span>
                                  </div>
                                </div>
                                <div className="flex flex-1 flex-wrap gap-2 justify-center md:justify-start px-4">
                                   {asst.permissions.filter(p => p !== AppView.DASHBOARD).map(p => (
                                     <span key={p} className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-bold border border-indigo-100">
                                       {PERMISSION_OPTIONS.find(opt => opt.id === p)?.label.split(' ')[0] || p}
                                     </span>
                                   ))}
                                </div>
                                <button onClick={() => onDeleteAssistant(asst.id)} className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                  🗑️
                                </button>
                            </div>
                          ))}
                          {assistants.length === 0 && (
                            <div className="py-8 text-center text-slate-400 font-bold opacity-50">لا يوجد مساعدين</div>
                          )}
                        </div>
                    </div>
                  )}

                  {/* Views Section */}
                  {section.id === 'views' && (
                    <div className="grid grid-cols-1 gap-6">
                        {MANAGED_VIEWS.map((view) => {
                          const isEnabled = (localSettings.enabledViews || Object.values(AppView)).includes(view.id as any);
                          const currentLabel = localSettings.viewLabels?.[view.id] || view.defaultLabel;

                          return (
                            <div key={view.id} className={`p-6 rounded-[2.5rem] border-2 transition-all flex flex-col md:flex-row justify-between items-center gap-6 ${isEnabled ? 'bg-white border-slate-100 shadow-sm' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                               <div className="flex items-center gap-4 w-full md:w-auto">
                                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl transition-all ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                                     {view.icon}
                                  </div>
                                  <div className="flex-1">
                                     <input 
                                       type="text" 
                                       className={`font-black text-lg bg-transparent outline-none w-full ${isEnabled ? 'text-slate-800' : 'text-slate-400'}`}
                                       value={currentLabel}
                                       onChange={(e) => updateViewLabel(view.id, e.target.value)}
                                       disabled={!isEnabled}
                                     />
                                     <p className="text-[10px] text-slate-400 font-bold">الاسم الأصلي: {view.defaultLabel}</p>
                                  </div>
                                </div>

                               <button 
                                 onClick={() => toggleViewEnabled(view.id)}
                                 className={`px-6 py-3 rounded-xl font-black text-xs transition-all flex items-center gap-2 ${isEnabled ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-200 text-slate-500 hover:bg-slate-300'}`}
                               >
                                 <div className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                 {isEnabled ? 'مفعل' : 'معطل'}
                               </button>
                            </div>
                          );
                        })}
                    </div>
                  )}

               </div>
             )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Settings;
