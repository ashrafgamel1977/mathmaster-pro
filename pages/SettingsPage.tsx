
import React, { useState, useEffect, useRef } from 'react';
import { PlatformSettings, AppView, Assistant, Student, AssignmentSubmission, ParentInquiry, AppNotification, AppFont, CustomSection, TabFeature, TeacherSpecialization, PortalTheme } from '../types';

interface SettingsProps {
  settings: PlatformSettings;
  assistants: Assistant[];
  onUpdate: (newSettings: PlatformSettings) => void;
  onAddAssistant: (assistant: Assistant) => void;
  onDeleteAssistant: (id: string) => void;
  students?: Student[];
  submissions?: AssignmentSubmission[];
  inquiries?: ParentInquiry[];
  notifications?: AppNotification[];
}

const Settings: React.FC<SettingsProps> = ({ 
  settings, assistants, onUpdate, onAddAssistant, onDeleteAssistant
}) => {
  const [expandedSection, setExpandedSection] = useState<string>('system');
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);
  const [originalSettings, setOriginalSettings] = useState<PlatformSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Custom Section Modal
  const [showSectionModal, setShowSectionModal] = useState(false);
  const [editingSection, setEditingSection] = useState<CustomSection | null>(null);
  const [sectionForm, setSectionForm] = useState({ title: '', icon: '📄', content: '' });

  // Branches
  const [newBranch, setNewBranch] = useState('');

  // Assistant
  const [newAssistantName, setNewAssistantName] = useState('');

  const SPECIALIZATIONS: {id: TeacherSpecialization, label: string, icon: string}[] = [
    { id: 'math', label: 'الرياضيات', icon: '📐' },
    { id: 'physics', label: 'الفيزياء', icon: '⚛️' },
    { id: 'chemistry', label: 'الكيمياء', icon: '🧪' },
    { id: 'biology', label: 'الأحياء', icon: '🧬' },
    { id: 'english', label: 'اللغة الإنجليزية', icon: '🇬🇧' },
    { id: 'arabic', label: 'اللغة العربية', icon: '🕌' },
    { id: 'history', label: 'التاريخ', icon: '📜' },
    { id: 'geography', label: 'الجغرافيا', icon: '🌍' },
    { id: 'general', label: 'عام / أخرى', icon: '🎓' },
  ];

  const FONTS: {id: AppFont, label: string}[] = [
    { id: 'Cairo', label: 'Cairo (افتراضي - عربي)' },
    { id: 'Tajawal', label: 'Tajawal (عصري)' },
    { id: 'Almarai', label: 'Almarai (رسمي)' },
    { id: 'El Messiri', label: 'El Messiri (فني)' },
  ];

  const THEMES: {id: PortalTheme, label: string, colors: string}[] = [
    { id: 'indigo', label: 'نيلي (افتراضي)', colors: 'bg-indigo-600' },
    { id: 'emerald', label: 'زمردي', colors: 'bg-emerald-600' },
    { id: 'rose', label: 'وردي', colors: 'bg-rose-600' },
    { id: 'amber', label: 'كهرماني', colors: 'bg-amber-600' },
    { id: 'slate', label: 'رمادي داكن', colors: 'bg-slate-800' },
    { id: 'violet', label: 'بنفسجي', colors: 'bg-violet-600' },
  ];

  // Grouped Views
  const VIEW_GROUPS = [
    {
      id: 'academic',
      title: 'الإدارة الأكاديمية',
      items: [
        { id: AppView.STUDENTS, defaultLabel: 'سجل الطلاب', defaultIcon: '👨‍🎓' },
        { id: AppView.MANAGEMENT, defaultLabel: 'المجموعات', defaultIcon: '🏫' },
        { id: AppView.SCHEDULE, defaultLabel: 'الجدول الدراسي', defaultIcon: '📅' },
      ]
    },
    {
      id: 'content',
      title: 'المحتوى والاختبارات',
      items: [
        { id: AppView.ASSIGNMENTS, defaultLabel: 'الواجبات', defaultIcon: '📝' },
        { id: AppView.QUIZZES, defaultLabel: 'بنك الاختبارات', defaultIcon: '⚡' },
        { id: AppView.FILES, defaultLabel: 'المكتبة الرقمية', defaultIcon: '📚' },
        { id: AppView.FORMULAS, defaultLabel: 'المفاهيم والملخصات', defaultIcon: '🔖' },
      ]
    },
    {
      id: 'tools',
      title: 'الأدوات التفاعلية',
      items: [
        { id: AppView.LIVE_CLASS, defaultLabel: 'البث المباشر', defaultIcon: '🎥' },
        { id: AppView.RESULTS, defaultLabel: 'النتائج والتحليل', defaultIcon: '📊' },
      ]
    },
    {
      id: 'communication',
      title: 'التواصل والمتابعة',
      items: [
        { id: AppView.CHAT, defaultLabel: 'غرف النقاش', defaultIcon: '💬' },
        { id: AppView.NOTIFICATIONS, defaultLabel: 'التنبيهات', defaultIcon: '🔔' },
        { id: AppView.LEADERBOARD, defaultLabel: 'لوحة الشرف', defaultIcon: '🏆' },
      ]
    },
    {
        id: 'student_portal',
        title: 'واجهة الطالب',
        items: [
            { id: AppView.STUDENT_PORTAL, defaultLabel: 'بوابة الطالب (زر المعاينة)', defaultIcon: '🎓' },
        ]
    }
  ];

  const DEFAULT_TABS_CONFIG: Record<string, TabFeature[]> = {
    [AppView.STUDENT_PORTAL]: [
      { id: 'dashboard', label: 'الرئيسية', enabled: true },
      { id: 'library', label: 'دروسي', enabled: true },
      { id: 'assignments', label: 'واجباتي', enabled: true },
      { id: 'quizzes', label: 'امتحاناتي', enabled: true },
      { id: 'results', label: 'التقارير', enabled: true }
    ],
  };

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
    setLocalSettings(prev => ({ ...prev, branding: { ...prev.branding, [key]: value } }));
    setIsDirty(true);
  };

  const handleContentChange = (key: keyof PlatformSettings['contentTexts'], value: any) => {
    setLocalSettings(prev => ({ ...prev, contentTexts: { ...prev.contentTexts, [key]: value } }));
    setIsDirty(true);
  };

  const toggleViewEnabled = (viewId: string) => {
    const currentEnabled = localSettings.enabledViews || Object.values(AppView);
    const newEnabled = currentEnabled.includes(viewId) 
      ? currentEnabled.filter(v => v !== viewId) 
      : [...currentEnabled, viewId];
    handleChange('enabledViews', newEnabled);
  };

  const updateViewLabel = (viewId: string, label: string) => {
    handleChange('viewLabels', { ...localSettings.viewLabels, [viewId]: label });
  };

  const handleAddBranch = () => {
    if(!newBranch.trim()) return;
    const currentBranches = localSettings.branches || [];
    if(!currentBranches.includes(newBranch)) {
        handleChange('branches', [...currentBranches, newBranch]);
    }
    setNewBranch('');
  };

  const removeBranch = (branch: string) => {
    const currentBranches = localSettings.branches || [];
    handleChange('branches', currentBranches.filter(b => b !== branch));
  };

  const handleSaveSection = () => {
    if (!sectionForm.title) return;
    const currentSections = localSettings.customSections || [];
    let newSections;
    if (editingSection) {
      newSections = currentSections.map(s => s.id === editingSection.id ? { ...s, ...sectionForm } : s);
    } else {
      newSections = [...currentSections, { id: `custom_${Date.now()}`, ...sectionForm, isVisibleToStudents: true }];
    }
    handleChange('customSections', newSections);
    setShowSectionModal(false);
    setSectionForm({ title: '', icon: '📄', content: '' });
    setEditingSection(null);
  };

  const handleDeleteSection = (id: string) => {
    if (window.confirm('حذف هذا القسم؟')) {
        handleChange('customSections', (localSettings.customSections || []).filter(s => s.id !== id));
    }
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setIsDirty(false);
    setIsPreviewMode(false);
    setOriginalSettings(localSettings);
  };

  const handleAddAssistant = () => {
      if (!newAssistantName) return;
      onAddAssistant({
          id: 'asst_'+Date.now(),
          name: newAssistantName,
          code: Math.floor(1000 + Math.random() * 9000).toString(),
          permissions: [AppView.DASHBOARD],
          addedAt: new Date().toLocaleDateString('ar-EG')
      });
      setNewAssistantName('');
  };

  const SECTIONS = [
    { id: 'system', label: 'التخصص والنظام', icon: '⚙️', desc: 'تحديد مادة المعلم والفروع' },
    { id: 'views', label: 'القوائم والأقسام', icon: '🏗️', desc: 'تفعيل وإخفاء أدوات المنصة' },
    { id: 'branding', label: 'الهوية والمظهر', icon: '🎨', desc: 'الألوان، الشعار، والخطوط' },
    { id: 'content', label: 'نصوص الواجهة', icon: '✍️', desc: 'رسائل الترحيب والعناوين' },
    { id: 'security', label: 'الأمان والمساعدين', icon: '🛡️', desc: 'كلمات المرور وإدارة الطاقم' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slideUp pb-40 text-right font-['Cairo']" dir="rtl">
      
      {/* Header */}
      <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-6">
         <div>
            <h2 className="text-3xl font-black text-slate-800">إعدادات المنصة 🛠️</h2>
            <p className="text-slate-400 font-bold mt-2">تحكم كامل في خصائص ومظهر تطبيقك التعليمي.</p>
         </div>
         {(isDirty || isPreviewMode) && (
             <div className="flex gap-3 animate-bounce">
                 <button onClick={() => { setLocalSettings(originalSettings); setIsDirty(false); setIsPreviewMode(false); }} className="px-6 py-3 bg-slate-100 text-slate-500 rounded-2xl font-bold text-xs">تراجع ↩</button>
                 <button onClick={handleSave} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs shadow-lg">حفظ التغييرات ✓</button>
             </div>
         )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1 space-y-3">
              {SECTIONS.map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => setExpandedSection(sec.id)}
                    className={`w-full p-4 rounded-2xl flex items-center gap-4 transition-all text-right ${expandedSection === sec.id ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-500 hover:bg-slate-50'}`}
                  >
                      <span className="text-2xl">{sec.icon}</span>
                      <div>
                          <p className="font-black text-xs">{sec.label}</p>
                          <p className={`text-[9px] mt-0.5 ${expandedSection === sec.id ? 'text-indigo-200' : 'text-slate-400'}`}>{sec.desc}</p>
                      </div>
                  </button>
              ))}
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
              {expandedSection === 'system' && (
                  <div className="space-y-8 animate-fadeIn">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                          <h4 className="font-black text-slate-800 text-sm border-b border-slate-50 pb-2">تخصص المعلم</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                             {SPECIALIZATIONS.map(spec => (
                                <button
                                   key={spec.id}
                                   onClick={() => handleChange('teacherSpecialization', spec.id)}
                                   className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${localSettings.teacherSpecialization === spec.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700' : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'}`}
                                >
                                   <span className="text-2xl">{spec.icon}</span>
                                   <span className="font-bold text-xs">{spec.label}</span>
                                </button>
                             ))}
                          </div>
                          
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 mt-4">
                             <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-3">فروع المادة (أقسام المكتبة والامتحانات)</label>
                             <div className="flex gap-2 mb-4">
                                <input 
                                  type="text" 
                                  placeholder="أضف فرعاً (مثال: النحو، الكهربية، الحديثة...)" 
                                  className="flex-1 p-3 rounded-xl border border-slate-200 text-sm font-bold outline-none focus:border-indigo-500"
                                  value={newBranch}
                                  onChange={e => setNewBranch(e.target.value)}
                                  onKeyDown={e => e.key === 'Enter' && handleAddBranch()}
                                />
                                <button onClick={handleAddBranch} className="px-6 bg-indigo-600 text-white rounded-xl font-black text-xl">＋</button>
                             </div>
                             <div className="flex flex-wrap gap-2">
                                {localSettings.branches?.map(branch => (
                                   <div key={branch} className="px-4 py-2 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-bold text-slate-700 animate-fadeIn">
                                      {branch}
                                      <button onClick={() => removeBranch(branch)} className="text-rose-400 hover:text-rose-600 text-lg leading-none">×</button>
                                   </div>
                                ))}
                                {(!localSettings.branches || localSettings.branches.length === 0) && <p className="text-xs text-slate-400 font-medium">لم يتم إضافة فروع بعد.</p>}
                             </div>
                          </div>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                              <div>
                                  <h4 className="font-black text-slate-800 text-sm">نظام الاشتراكات والدفع</h4>
                                  <p className="text-[10px] text-slate-500 mt-1">عند التفعيل، سيتم إغلاق المحتوى أمام الطلاب غير المسددين.</p>
                              </div>
                              <button 
                                  onClick={() => handleChange('subscriptionEnabled', !localSettings.subscriptionEnabled)}
                                  className={`w-14 h-8 rounded-full relative transition-all ${localSettings.subscriptionEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                              >
                                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${localSettings.subscriptionEnabled ? 'left-1' : 'left-7'}`}></div>
                              </button>
                          </div>

                          {localSettings.subscriptionEnabled && (
                              <div className="animate-fadeIn">
                                  <label className="text-[10px] font-black text-slate-400 block mb-2">تعليمات الدفع (تظهر في شاشة القفل)</label>
                                  <textarea 
                                      className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold outline-none focus:border-indigo-500 min-h-[100px]"
                                      value={localSettings.paymentInstructions}
                                      onChange={e => handleChange('paymentInstructions', e.target.value)}
                                      placeholder="مثال: يرجى تحويل مبلغ الاشتراك على فودافون كاش..."
                                  />
                              </div>
                          )}
                          
                          <div className="p-4 bg-slate-50 rounded-2xl">
                              <h4 className="font-black text-slate-800 text-sm mb-2">عدد الأجهزة المسموح به</h4>
                              <p className="text-[10px] text-slate-500 mb-3">الحد الأقصى للأجهزة التي يمكن للطالب استخدامها في نفس الوقت.</p>
                              <div className="flex items-center gap-4">
                                <input 
                                  type="number" 
                                  min="1" 
                                  max="5"
                                  className="w-20 p-3 bg-white border border-slate-200 rounded-xl text-center font-black"
                                  value={localSettings.maxDevicesPerStudent || 2}
                                  onChange={e => handleChange('maxDevicesPerStudent', parseInt(e.target.value))}
                                />
                                <span className="text-xs font-bold text-slate-600">أجهزة لكل طالب</span>
                              </div>
                          </div>
                      </div>

                      {localSettings.teacherSpecialization === 'math' && (
                          <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                              <h4 className="font-black text-slate-800 mb-4">نمط الرموز الرياضية</h4>
                              <div className="flex bg-slate-50 p-1 rounded-2xl">
                                  <button 
                                      onClick={() => handleChange('mathNotation', 'arabic')}
                                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${localSettings.mathNotation === 'arabic' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                                  >
                                      عربي (س، ص، جا، جتا)
                                  </button>
                                  <button 
                                      onClick={() => handleChange('mathNotation', 'english')}
                                      className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${localSettings.mathNotation === 'english' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}
                                  >
                                      English (x, y, sin, cos)
                                  </button>
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {expandedSection === 'views' && (
                  <div className="space-y-8 animate-fadeIn">
                      <div className="flex justify-between items-center">
                          <h3 className="text-xl font-black text-slate-800">هيكلة القوائم</h3>
                          <button onClick={() => { setEditingSection(null); setSectionForm({title:'', icon:'📄', content:''}); setShowSectionModal(true); }} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold border border-indigo-100">قسم مخصص ＋</button>
                      </div>

                      {/* Render View Groups */}
                      {VIEW_GROUPS.map(group => (
                          <div key={group.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
                              <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest mb-4 border-b border-slate-50 pb-2">{group.title}</h4>
                              <div className="space-y-3">
                                  {group.items.map(view => {
                                      const isEnabled = (localSettings.enabledViews || Object.values(AppView)).includes(view.id);
                                      const label = localSettings.viewLabels?.[view.id] || view.defaultLabel;
                                      
                                      return (
                                          <div key={view.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${isEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                  {view.defaultIcon}
                                              </div>
                                              <div className="flex-1">
                                                  <input 
                                                      type="text" 
                                                      className={`bg-transparent font-bold text-sm w-full outline-none ${isEnabled ? 'text-slate-800' : 'text-slate-400 line-through'}`}
                                                      value={label}
                                                      onChange={e => updateViewLabel(view.id, e.target.value)}
                                                      disabled={!isEnabled}
                                                  />
                                              </div>
                                              <button 
                                                  onClick={() => toggleViewEnabled(view.id)}
                                                  className={`w-12 h-6 rounded-full relative transition-all ${isEnabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                              >
                                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isEnabled ? 'left-1' : 'left-7'}`}></div>
                                              </button>
                                          </div>
                                      );
                                  })}
                              </div>
                          </div>
                      ))}

                      {/* Custom Sections */}
                      {localSettings.customSections && localSettings.customSections.length > 0 && (
                          <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-100 shadow-sm">
                              <h4 className="font-black text-indigo-400 text-xs uppercase tracking-widest mb-4">الأقسام المضافة يدوياً</h4>
                              {localSettings.customSections.map(sec => (
                                  <div key={sec.id} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0">
                                      <div className="flex items-center gap-3">
                                          <span className="text-xl">{sec.icon}</span>
                                          <span className="font-bold text-sm text-slate-800">{sec.title}</span>
                                      </div>
                                      <div className="flex gap-2">
                                          <button onClick={() => { setEditingSection(sec); setSectionForm({title:sec.title, icon:sec.icon, content:sec.content}); setShowSectionModal(true); }} className="text-xs text-indigo-600 font-bold px-2">تعديل</button>
                                          <button onClick={() => handleDeleteSection(sec.id)} className="text-xs text-rose-500 font-bold px-2">حذف</button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                  </div>
              )}

              {expandedSection === 'branding' && (
                  <div className="space-y-8 animate-fadeIn">
                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                          <h4 className="font-black text-slate-800">التخصيص اليدوي</h4>
                          <div className="grid grid-cols-2 gap-6">
                              <div>
                                  <label className="text-[10px] font-black text-slate-400 block mb-2">اللون الأساسي</label>
                                  <div className="flex items-center gap-3">
                                      <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-0" value={localSettings.branding.primaryColor} onChange={e => handleBrandingChange('primaryColor', e.target.value)} />
                                      <span className="text-xs font-mono font-bold text-slate-600">{localSettings.branding.primaryColor}</span>
                                  </div>
                              </div>
                              <div>
                                  <label className="text-[10px] font-black text-slate-400 block mb-2">اللون الثانوي</label>
                                  <div className="flex items-center gap-3">
                                      <input type="color" className="w-12 h-12 rounded-xl cursor-pointer border-0" value={localSettings.branding.secondaryColor} onChange={e => handleBrandingChange('secondaryColor', e.target.value)} />
                                      <span className="text-xs font-mono font-bold text-slate-600">{localSettings.branding.secondaryColor}</span>
                                  </div>
                              </div>
                          </div>
                          
                          <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-2">نوع الخط</label>
                              <div className="grid grid-cols-2 gap-2">
                                  {FONTS.map(f => (
                                      <button 
                                          key={f.id}
                                          onClick={() => handleBrandingChange('fontFamily', f.id)}
                                          className={`py-3 rounded-xl text-xs border transition-all ${localSettings.branding.fontFamily === f.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-50 text-slate-600 border-slate-100'}`}
                                          style={{ fontFamily: f.id }}
                                      >
                                          {f.label}
                                      </button>
                                  ))}
                              </div>
                          </div>

                          <div>
                              <label className="text-[10px] font-black text-slate-400 block mb-2">ثيم المنصة (بوابة الطالب)</label>
                              <div className="grid grid-cols-3 gap-2">
                                  {THEMES.map(t => (
                                      <button 
                                          key={t.id}
                                          onClick={() => handleChange('portalTheme', t.id)}
                                          className={`py-3 rounded-xl text-xs border transition-all flex flex-col items-center gap-2 ${localSettings.portalTheme === t.id ? 'bg-slate-50 border-slate-300 shadow-inner' : 'bg-white border-slate-100 hover:bg-slate-50'}`}
                                      >
                                          <div className={`w-6 h-6 rounded-full ${t.colors} shadow-sm`}></div>
                                          <span className={`font-bold ${localSettings.portalTheme === t.id ? 'text-slate-800' : 'text-slate-500'}`}>{t.label}</span>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      </div>
                  </div>
              )}

              {expandedSection === 'content' && (
                  <div className="space-y-8 animate-fadeIn bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 block mb-2">عنوان الصفحة الرئيسية</label>
                          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={localSettings.contentTexts.landingTitle} onChange={e => handleContentChange('landingTitle', e.target.value)} />
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 block mb-2">الوصف الفرعي</label>
                          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={localSettings.contentTexts.landingSubtitle} onChange={e => handleContentChange('landingSubtitle', e.target.value)} />
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 block mb-2">رسالة ترحيب الطالب</label>
                          <input type="text" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none" value={localSettings.studentWelcomeMsg} onChange={e => handleChange('studentWelcomeMsg', e.target.value)} />
                      </div>
                  </div>
              )}

              {expandedSection === 'security' && (
                  <div className="space-y-8 animate-fadeIn">
                      <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                          <h4 className="font-black text-lg mb-4">🔐 كود المعلم (المفتاح الرئيسي)</h4>
                          <input 
                              type="text" 
                              className="w-full p-4 bg-white/10 rounded-2xl font-black text-center text-2xl tracking-widest outline-none border border-white/20 focus:border-white/50"
                              value={localSettings.adminCode}
                              onChange={e => handleChange('adminCode', e.target.value)}
                          />
                          <p className="text-[10px] text-slate-400 mt-2 text-center">يستخدم للدخول إلى لوحة التحكم هذه.</p>
                      </div>

                      <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                          <h4 className="font-black text-slate-800 mb-6">المساعدين (Assistants)</h4>
                          <div className="flex gap-4 mb-6">
                              <input type="text" placeholder="اسم المساعد" className="flex-1 p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none" value={newAssistantName} onChange={e => setNewAssistantName(e.target.value)} />
                              <button onClick={handleAddAssistant} className="px-6 bg-indigo-600 text-white rounded-2xl font-black text-xs shadow-lg">إضافة</button>
                          </div>
                          
                          <div className="space-y-3">
                              {assistants.map(asst => (
                                  <div key={asst.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                      <div>
                                          <p className="font-black text-slate-800 text-xs">{asst.name}</p>
                                          <p className="text-[10px] font-mono text-indigo-500">Code: {asst.code}</p>
                                      </div>
                                      <button onClick={() => onDeleteAssistant(asst.id)} className="text-rose-500 font-bold text-xs px-2">حذف</button>
                                  </div>
                              ))}
                              {assistants.length === 0 && <p className="text-center text-slate-400 text-xs">لا يوجد مساعدين حالياً.</p>}
                          </div>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {/* Modal for Custom Sections */}
      {showSectionModal && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[3.5rem] shadow-2xl relative animate-slideUp overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl font-black text-slate-800 mb-6">إضافة قسم مخصص</h3>
            <div className="space-y-4">
                <input type="text" placeholder="عنوان القسم" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={sectionForm.title} onChange={e => setSectionForm({...sectionForm, title: e.target.value})} />
                <div className="flex gap-4">
                    <input type="text" placeholder="الأيقونة (Emoji)" className="w-24 p-4 bg-slate-50 rounded-2xl text-center text-xl" value={sectionForm.icon} onChange={e => setSectionForm({...sectionForm, icon: e.target.value})} />
                    <p className="text-xs text-slate-400 self-center">اختر رمزاً تعبيرياً ليميز القسم في القائمة.</p>
                </div>
                <textarea placeholder="المحتوى (نص، روابط، تعليمات...)" className="w-full p-4 bg-slate-50 rounded-2xl font-medium h-40 outline-none" value={sectionForm.content} onChange={e => setSectionForm({...sectionForm, content: e.target.value})} />
                
                <div className="flex gap-3 pt-4">
                    <button onClick={handleSaveSection} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black">حفظ</button>
                    <button onClick={() => setShowSectionModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
                </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
