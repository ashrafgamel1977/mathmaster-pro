
import React, { useState, useEffect } from 'react';
import { PlatformSettings, AppView, CustomSection, Assistant, MathNotation } from '../types';

interface SettingsProps {
  settings: PlatformSettings;
  assistants: Assistant[];
  onUpdate: (newSettings: PlatformSettings) => void;
  onUpdateAssistants: (assistants: Assistant[]) => void;
}

const DEFAULT_LABELS: Record<string, string> = {
  [AppView.DASHBOARD]: 'الرئيسية',
  [AppView.STUDENTS]: 'الطلاب',
  [AppView.ASSIGNMENTS]: 'الواجبات',
  [AppView.QUIZZES]: 'الاختبارات',
  [AppView.LIVE_CLASS]: 'البث المباشر',
  [AppView.FILES]: 'المكتبة',
  [AppView.MANAGEMENT]: 'المجموعات',
  [AppView.RESULTS]: 'النتائج',
  [AppView.CHAT]: 'نادي العباقرة',
  [AppView.AI_SOLVER]: 'المحلل الذكي',
  [AppView.NOTIFICATIONS]: 'الإشعارات',
  [AppView.LEADERBOARD]: 'لوحة الشرف',
  [AppView.FORMULAS]: 'القوانين',
  [AppView.CALL_CENTER]: 'خدمة العملاء',
  [AppView.TEST_CENTER]: 'مختبر الفحص'
};

const Settings: React.FC<SettingsProps> = ({ settings, assistants, onUpdate, onUpdateAssistants }) => {
  const [activeCategory, setActiveCategory] = useState<'branding' | 'views' | 'custom' | 'assistants' | 'security' | 'ai'>('branding');
  const [localSettings, setLocalSettings] = useState<PlatformSettings>(settings);
  const [isDirty, setIsDirty] = useState(false);
  const [newAssistantName, setNewAssistantName] = useState('');
  
  const [newSection, setNewSection] = useState({ title: '', icon: '📄', content: '', isVisibleToStudents: true });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleChange = (key: keyof PlatformSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdate(localSettings);
    setIsDirty(false);
  };

  const handleToggleView = (view: string) => {
    const currentEnabled = localSettings.enabledViews || Object.values(AppView);
    const newEnabled = currentEnabled.includes(view) 
      ? currentEnabled.filter(v => v !== view)
      : [...currentEnabled, view];
    handleChange('enabledViews', newEnabled);
  };

  const handleLabelChange = (view: string, label: string) => {
    const newLabels = { ...(localSettings.viewLabels || {}), [view]: label };
    handleChange('viewLabels', newLabels);
  };

  const handleAddCustomSection = () => {
    if (!newSection.title.trim()) return;
    const section: CustomSection = {
      id: 'cs_' + Date.now(),
      ...newSection
    };
    const updatedSections = [...(localSettings.customSections || []), section];
    handleChange('customSections', updatedSections);
    setNewSection({ title: '', icon: '📄', content: '', isVisibleToStudents: true });
  };

  const handleDeleteCustomSection = (id: string) => {
    const updatedSections = (localSettings.customSections || []).filter(s => s.id !== id);
    handleChange('customSections', updatedSections);
  };

  const handleUpdateCustomSection = (id: string, updates: Partial<CustomSection>) => {
    const updatedSections = (localSettings.customSections || []).map(s => s.id === id ? { ...s, ...updates } : s);
    handleChange('customSections', updatedSections);
  };

  const handleAddAssistant = () => {
    if (!newAssistantName.trim()) return;
    const assistant: Assistant = {
      id: 'asst_' + Date.now(),
      name: newAssistantName,
      code: Math.floor(1000 + Math.random() * 9000).toString(),
      permissions: [AppView.DASHBOARD, AppView.STUDENTS, AppView.ASSIGNMENTS, AppView.CHAT],
      addedAt: new Date().toLocaleDateString('ar-EG')
    };
    onUpdateAssistants([...assistants, assistant]);
    setNewAssistantName('');
  };

  const categories = [
    { id: 'branding', label: 'الهوية والمظهر', icon: '🎨' },
    { id: 'views', label: 'الأقسام الأساسية', icon: '🍱' },
    { id: 'custom', label: 'أقسام مخصصة', icon: '✨' },
    { id: 'assistants', label: 'المساعدين', icon: '🛠️' },
    { id: 'security', label: 'الأمان والحماية', icon: '🛡️' },
    { id: 'ai', label: 'الذكاء الاصطناعي', icon: '🪄' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-slideUp pb-40 text-right font-['Cairo']" dir="rtl">
      
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

      {/* Navigation */}
      <div className="bg-white p-4 rounded-[3rem] shadow-xl border border-slate-100 flex flex-wrap justify-center gap-2">
        {categories.map(cat => (
          <button 
            key={cat.id} 
            onClick={() => setActiveCategory(cat.id as any)}
            className={`px-6 py-4 rounded-2xl font-black text-[10px] transition-all flex items-center gap-2 ${activeCategory === cat.id ? 'bg-indigo-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="space-y-10">
        {activeCategory === 'branding' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
             <div className="border-b border-slate-50 pb-6">
                <h3 className="text-3xl font-black text-slate-800">هوية المعلم والمنصة 🎨</h3>
                <p className="text-slate-400 font-bold text-sm mt-2">تحكم في المسمى الذي يظهر للطلاب وأولياء الأمور.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 px-6 uppercase tracking-widest">اسم المعلم بالكامل</label>
                  <input type="text" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none shadow-inner" value={localSettings.teacherName} onChange={e => handleChange('teacherName', e.target.value)} />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 px-6 uppercase tracking-widest">اسم المنصة التعليمية</label>
                  <input type="text" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none shadow-inner" value={localSettings.platformName} onChange={e => handleChange('platformName', e.target.value)} />
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'security' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
             <div className="border-b border-slate-50 pb-6">
                <h3 className="text-3xl font-black text-slate-800">الأمان وحماية المحتوى 🛡️</h3>
                <p className="text-slate-400 font-bold text-sm mt-2">تأمين المنصة ضد السرقة ومنع تداول الحسابات.</p>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-50 rounded-[3rem] flex justify-between items-center group hover:bg-white border-2 border-transparent hover:border-indigo-600 transition-all">
                   <div>
                      <h4 className="font-black text-slate-800">حماية الصفحة 🔒</h4>
                      <p className="text-[10px] text-slate-400 font-bold">منع النقر الأيمن، النسخ، وفتح أدوات المطور.</p>
                   </div>
                   <button onClick={() => handleChange('protectionEnabled', !localSettings.protectionEnabled)} className={`w-14 h-8 rounded-full transition-all relative ${localSettings.protectionEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${localSettings.protectionEnabled ? 'right-7' : 'right-1.5'}`}></div>
                   </button>
                </div>

                <div className="p-8 bg-slate-50 rounded-[3rem] flex justify-between items-center group hover:bg-white border-2 border-transparent hover:border-indigo-600 transition-all">
                   <div>
                      <h4 className="font-black text-slate-800">العلامة المائية الذكية 🎥</h4>
                      <p className="text-[10px] text-slate-400 font-bold">ظهور بيانات الطالب بشكل عشوائي فوق الفيديو.</p>
                   </div>
                   <button onClick={() => handleChange('watermarkEnabled', !localSettings.watermarkEnabled)} className={`w-14 h-8 rounded-full transition-all relative ${localSettings.watermarkEnabled ? 'bg-emerald-500 shadow-lg shadow-emerald-200' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${localSettings.watermarkEnabled ? 'right-7' : 'right-1.5'}`}></div>
                   </button>
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 px-6 uppercase">نص العلامة المائية</label>
                   <input type="text" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" value={localSettings.watermarkText} onChange={e => handleChange('watermarkText', e.target.value)} />
                </div>

                <div className="space-y-3">
                   <label className="text-[10px] font-black text-slate-400 px-6 uppercase">حد الأجهزة لكل طالب</label>
                   <input type="number" min="1" max="5" className="w-full px-8 py-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" value={localSettings.maxDevicesPerStudent} onChange={e => handleChange('maxDevicesPerStudent', parseInt(e.target.value))} />
                   <p className="text-[9px] text-rose-500 font-bold px-4">* سيتم قفل الحساب إذا حاول الطالب الدخول من جهاز إضافي.</p>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'ai' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
             <div className="border-b border-slate-50 pb-6">
                <h3 className="text-3xl font-black text-slate-800">الذكاء الاصطناعي (Gemini Pro) 🪄</h3>
                <p className="text-slate-400 font-bold text-sm mt-2">تخصيص تجربة التعلم الذكي لطلابك.</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 px-6 uppercase">نمط الرموز الرياضية</label>
                   <div className="flex bg-slate-50 p-2 rounded-3xl border-2 border-slate-100">
                      <button onClick={() => handleChange('mathNotation', 'arabic')} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${localSettings.mathNotation === 'arabic' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>عربي (س، ص، ع)</button>
                      <button onClick={() => handleChange('mathNotation', 'english')} className={`flex-1 py-4 rounded-2xl font-black text-xs transition-all ${localSettings.mathNotation === 'english' ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400'}`}>English (x, y, z)</button>
                   </div>
                </div>

                <div className="p-8 bg-indigo-950 rounded-[3rem] text-white flex justify-between items-center shadow-2xl">
                   <div>
                      <h4 className="font-black">وضع الامتحانات 📝</h4>
                      <p className="text-[10px] text-indigo-300 font-bold">تعطيل المحلل الذكي والشات أثناء فترة الاختبارات.</p>
                   </div>
                   <button onClick={() => handleChange('examMode', !localSettings.examMode)} className={`w-14 h-8 rounded-full transition-all relative ${localSettings.examMode ? 'bg-rose-500' : 'bg-indigo-800'}`}>
                      <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${localSettings.examMode ? 'right-7' : 'right-1.5'}`}></div>
                   </button>
                </div>

                <div className="p-8 bg-slate-50 rounded-[3rem] flex justify-between items-center border-2 border-transparent hover:border-blue-600 transition-all group">
                   <div>
                      <h4 className="font-black text-slate-800">تفعيل المحلل الذكي (Solver)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">السماح للطلاب بسؤال المعلم الآلي حول المسائل.</p>
                   </div>
                   <button onClick={() => handleChange('enableAiSolver', !localSettings.enableAiSolver)} className={`w-14 h-8 rounded-full transition-all relative ${localSettings.enableAiSolver ? 'bg-blue-600 shadow-lg' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${localSettings.enableAiSolver ? 'right-7' : 'right-1.5'}`}></div>
                   </button>
                </div>
                
                <div className="p-8 bg-slate-50 rounded-[3rem] flex justify-between items-center border-2 border-transparent hover:border-blue-600 transition-all group">
                   <div>
                      <h4 className="font-black text-slate-800">الترتيب التلقائي (Leaderboard)</h4>
                      <p className="text-[10px] text-slate-400 font-bold">تحديث لوحة الشرف آلياً بناءً على النقاط.</p>
                   </div>
                   <button onClick={() => handleChange('enableLeaderboard', !localSettings.enableLeaderboard)} className={`w-14 h-8 rounded-full transition-all relative ${localSettings.enableLeaderboard ? 'bg-blue-600 shadow-lg' : 'bg-slate-300'}`}>
                      <div className={`absolute top-1.5 w-5 h-5 bg-white rounded-full transition-all ${localSettings.enableLeaderboard ? 'right-7' : 'right-1.5'}`}></div>
                   </button>
                </div>
             </div>
          </div>
        )}

        {activeCategory === 'custom' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
             <div className="border-b border-slate-50 pb-6">
                <h3 className="text-3xl font-black text-slate-800">إضافة وإدارة أقسام مخصصة ✨</h3>
                <p className="text-slate-400 font-bold text-sm mt-2">يمكنك إنشاء صفحات جديدة تظهر في القائمة الجانبية (مثل: مذكرات المراجعة، قوانين هامة).</p>
             </div>

             <div className="bg-indigo-50 p-10 rounded-[3rem] space-y-8">
                <h4 className="font-black text-indigo-900">＋ قسم جديد</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <input type="text" placeholder="اسم القسم (مثلاً: قوانين المثلثات)" className="md:col-span-2 px-8 py-5 bg-white rounded-2xl font-black outline-none shadow-sm" value={newSection.title} onChange={e => setNewSection({...newSection, title: e.target.value})} />
                   <input type="text" placeholder="أيقونة (Emoji)" className="px-8 py-5 bg-white rounded-2xl font-black text-center text-2xl outline-none shadow-sm" value={newSection.icon} onChange={e => setNewSection({...newSection, icon: e.target.value})} />
                </div>
                <textarea 
                  placeholder="محتوى القسم (يدعم الرموز الرياضية $...$)" 
                  className="w-full p-8 bg-white rounded-3xl font-bold text-sm h-40 outline-none shadow-sm resize-none"
                  value={newSection.content}
                  onChange={e => setNewSection({...newSection, content: e.target.value})}
                />
                <div className="flex items-center justify-between">
                   <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={newSection.isVisibleToStudents} onChange={e => setNewSection({...newSection, isVisibleToStudents: e.target.checked})} className="w-6 h-6 rounded-lg" />
                      <span className="font-black text-indigo-900 text-xs">ظهور للطلاب فوراً</span>
                   </label>
                   <button onClick={handleAddCustomSection} className="px-12 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-all">إضافة القسم للقائمة 🚀</button>
                </div>
             </div>

             <div className="space-y-6">
                <h4 className="font-black text-slate-400 text-xs uppercase tracking-widest px-4">الأقسام المضافة حالياً:</h4>
                {(localSettings.customSections || []).map(section => (
                  <div key={section.id} className="p-8 bg-slate-50 border-2 border-slate-100 rounded-[3rem] space-y-6 group hover:border-indigo-100 transition-all">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                           <span className="text-4xl">{section.icon}</span>
                           <div>
                              <input type="text" className="bg-transparent font-black text-lg outline-none border-b border-transparent focus:border-indigo-200" value={section.title} onChange={e => handleUpdateCustomSection(section.id, {title: e.target.value})} />
                              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">ID: {section.id}</p>
                           </div>
                        </div>
                        <div className="flex gap-2">
                           <button onClick={() => handleUpdateCustomSection(section.id, {isVisibleToStudents: !section.isVisibleToStudents})} className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all ${section.isVisibleToStudents ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                              {section.isVisibleToStudents ? 'مرئي للطالب ✓' : 'مخفي عن الطالب'}
                           </button>
                           <button onClick={() => handleDeleteCustomSection(section.id)} className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">🗑️</button>
                        </div>
                     </div>
                     <textarea 
                        className="w-full p-6 bg-white border border-slate-200 rounded-2xl font-bold text-xs h-24 outline-none resize-none" 
                        value={section.content} 
                        onChange={e => handleUpdateCustomSection(section.id, {content: e.target.value})}
                     />
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeCategory === 'views' && (
          <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
             <div className="border-b border-slate-50 pb-6">
                <h3 className="text-3xl font-black text-slate-800">إدارة الأقسام الأساسية 🍱</h3>
                <p className="text-slate-400 font-bold text-sm mt-2">اختر الأقسام التي تريد ظهورها في القائمة الجانبية وخصص أسماءها.</p>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.values(AppView).filter(v => v !== AppView.SETTINGS && v !== AppView.REGISTRATION && v !== AppView.STUDENT_PORTAL).map(view => {
                  const isEnabled = (localSettings.enabledViews || Object.values(AppView)).includes(view);
                  return (
                    <div key={view} className={`p-6 rounded-[2.5rem] border-2 transition-all ${isEnabled ? 'bg-white border-indigo-100 shadow-lg' : 'bg-slate-50 border-transparent opacity-60'}`}>
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-2xl">{DEFAULT_LABELS[view]?.split(' ')[0] || '📁'}</span>
                          <button 
                            onClick={() => handleToggleView(view)}
                            className={`w-14 h-7 rounded-full transition-all relative ${isEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}
                          >
                             <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${isEnabled ? 'right-8' : 'right-1'}`}></div>
                          </button>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[8px] font-black text-slate-400 px-2 uppercase">المسمى المخصص</label>
                          <input 
                            type="text" 
                            className="w-full px-4 py-3 bg-slate-100 rounded-xl font-black text-xs outline-none focus:bg-white border border-transparent focus:border-indigo-100" 
                            value={localSettings.viewLabels?.[view] || DEFAULT_LABELS[view] || view} 
                            onChange={e => handleLabelChange(view, e.target.value)}
                          />
                       </div>
                    </div>
                  );
                })}
             </div>
          </div>
        )}

        {activeCategory === 'assistants' && (
           <div className="bg-white p-12 rounded-[4rem] shadow-xl border border-slate-100 space-y-10 animate-fadeIn">
              <div className="border-b border-slate-50 pb-6">
                  <h3 className="text-3xl font-black text-slate-800">إدارة المساعدين 🛠️</h3>
              </div>
              <div className="bg-indigo-50 p-8 rounded-[3rem] space-y-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <input type="text" placeholder="اسم المساعد الجديد" className="flex-1 px-8 py-5 bg-white rounded-2xl font-black outline-none shadow-sm" value={newAssistantName} onChange={e => setNewAssistantName(e.target.value)} />
                    <button onClick={handleAddAssistant} className="px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg">إضافة ＋</button>
                  </div>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {assistants.map(asst => (
                  <div key={asst.id} className="p-8 bg-white border-2 border-slate-50 rounded-[3.5rem] flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-3xl font-black">🛠️</div>
                        <div>
                          <h4 className="font-black text-slate-800 text-lg">{asst.name}</h4>
                          <span className="text-[10px] font-bold text-slate-400">تاريخ الإضافة: {asst.addedAt}</span>
                        </div>
                      </div>
                      <div className="flex gap-4 items-center">
                         <div className="bg-indigo-600 px-6 py-3 rounded-xl text-white font-black text-xl tracking-widest">{asst.code}</div>
                         <button onClick={() => onUpdateAssistants(assistants.filter(a => a.id !== asst.id))} className="text-rose-500 font-black text-xs">🗑️ حذف</button>
                      </div>
                  </div>
                ))}
              </div>
           </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
