
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Year, VideoLesson, Student, VideoView, EducationalSource, PlatformSettings, AppView } from '../types';
import { extractTextFromMedia } from '../services/geminiService';
import ProtectedVideo from '../components/ProtectedVideo';

interface FilesViewProps {
  years: Year[];
  videoLessons: VideoLesson[];
  educationalSources: EducationalSource[];
  students: Student[];
  videoViews: VideoView[];
  onAddVideo: (video: VideoLesson) => void;
  onDeleteVideo: (id: string) => void;
  onAddSource: (source: EducationalSource) => void;
  onDeleteSource: (id: string) => void;
  settings?: PlatformSettings;
}

const FilesView: React.FC<FilesViewProps> = ({ years, videoLessons, educationalSources, students, videoViews, onAddVideo, onDeleteVideo, onAddSource, onDeleteSource, settings }) => {
  const [activeTab, setActiveTab] = useState<string>('videos');
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showAddRef, setShowAddRef] = useState(false);
  
  // Filters
  const [filterYearId, setFilterYearId] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  
  // Preview State
  const [previewVideo, setPreviewVideo] = useState<VideoLesson | null>(null);
  
  // Extraction State
  const [isExtracting, setIsExtracting] = useState(false);
  const refFileInputRef = useRef<HTMLInputElement>(null);

  // Video State
  const [newVideo, setNewVideo] = useState<{
    title: string, url: string, yearId: string, provider: 'youtube' | 'bunny' | 'native', term: '1' | '2', subject: string
  }>({ 
    title: '', url: '', yearId: '', provider: 'youtube', term: '1', subject: ''
  });
  
  // Doc State
  const [docMode, setDocMode] = useState<'upload' | 'link'>('upload');
  const [newDoc, setNewDoc] = useState<{
    name: string, yearId: string, data: string, mimeType: string, linkUrl: string, term: '1' | '2', subject: string
  }>({ name: '', yearId: '', data: '', mimeType: '', linkUrl: '', term: '1', subject: '' });
  
  // Reference State
  const [newRef, setNewRef] = useState({ name: '', yearId: '', textContent: '' });

  const docInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_TABS: { id: string; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'videos', label: '🎬 فيديوهات', icon: '🎬' },
    { id: 'docs', label: '📚 كتب وملازم', icon: '📚' },
    { id: 'refs', label: '🧠 المراجع المعتمدة (AI)', icon: '🧠' }
  ];

  const tabs = React.useMemo(() => {
    if (!settings?.featureConfig?.[AppView.FILES]) return DEFAULT_TABS;
    const config = settings.featureConfig[AppView.FILES];
    return DEFAULT_TABS.map(t => {
        const conf = config.find(c => c.id === t.id);
        if (conf) {
            return { ...t, label: conf.label, disabled: !conf.enabled };
        }
        return t;
    }).filter(t => !t.disabled);
  }, [settings]);

  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(t => t.id === activeTab)) {
        setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  // Helper to get subjects based on year name logic
  const getSubjectsForYear = (yearId: string) => {
    const yearName = years.find(y => y.id === yearId)?.name || '';
    
    if (yearName.includes('إعدادي')) {
        return ['جبر', 'هندسة'];
    } else if (yearName.includes('الأول') || yearName.includes('أولى')) {
        return ['جبر', 'حساب مثلثات', 'هندسة'];
    } else if (yearName.includes('الثاني') || yearName.includes('تانية') || yearName.includes('الثالث') || yearName.includes('ثالثة')) {
        return ['رياضيات بحتة', 'رياضيات تطبيقية'];
    }
    return ['عام']; // Default
  };

  const filteredSources = useMemo(() => {
    let sources = educationalSources;
    if (activeTab === 'docs') sources = sources.filter(s => !s.isAiReference);
    if (activeTab === 'refs') sources = sources.filter(s => s.isAiReference);

    if (filterYearId !== 'all') sources = sources.filter(s => s.yearId === filterYearId);
    if (filterTerm !== 'all') sources = sources.filter(s => s.term === filterTerm);
    if (filterSubject !== 'all') sources = sources.filter(s => s.subject === filterSubject);

    return sources;
  }, [educationalSources, filterYearId, filterTerm, filterSubject, activeTab]);

  const filteredVideos = useMemo(() => {
    let videos = videoLessons;
    if (filterYearId !== 'all') videos = videos.filter(v => v.yearId === filterYearId);
    if (filterTerm !== 'all') videos = videos.filter(v => v.term === filterTerm);
    if (filterSubject !== 'all') videos = videos.filter(v => v.subject === filterSubject);
    return videos;
  }, [videoLessons, filterYearId, filterTerm, filterSubject]);

  const handleAddVideoLocal = () => {
    if(!newVideo.title || !newVideo.url || !newVideo.yearId) return alert('يرجى إكمال البيانات');
    
    let provider = newVideo.provider;
    if (newVideo.url.includes('youtu')) provider = 'youtube';
    if (newVideo.url.includes('bunny') || newVideo.url.includes('mediadelivery')) provider = 'bunny';

    onAddVideo({
      id: '',
      title: newVideo.title,
      youtubeUrl: newVideo.url,
      provider: provider, 
      yearId: newVideo.yearId,
      uploadDate: new Date().toLocaleDateString('ar-EG'),
      term: newVideo.term,
      subject: newVideo.subject || 'عام'
    });
    setShowAddVideo(false);
    setNewVideo({ title: '', url: '', yearId: '', provider: 'youtube', term: '1', subject: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) { 
          alert("تنبيه: حجم الملف أكبر من 1 ميجابايت. قد لا يتم حفظه في النسخة المجانية.");
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewDoc({ ...newDoc, data: ev.target?.result as string, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocLocal = () => {
    if (!newDoc.name || !newDoc.yearId) return alert('يرجى إكمال البيانات');
    
    if (docMode === 'upload' && !newDoc.data) return alert('يرجى رفع الملف');
    if (docMode === 'link' && !newDoc.linkUrl) return alert('يرجى وضع الرابط');

    onAddSource({
      id: 'src' + Date.now(),
      name: newDoc.name,
      data: docMode === 'link' ? newDoc.linkUrl : newDoc.data,
      mimeType: docMode === 'link' ? 'application/external-link' : newDoc.mimeType,
      yearId: newDoc.yearId,
      uploadDate: new Date().toLocaleDateString('ar-EG'),
      isAiReference: false,
      term: newDoc.term,
      subject: newDoc.subject || 'عام'
    });
    setShowAddDoc(false);
    setNewDoc({ name: '', yearId: '', data: '', mimeType: '', linkUrl: '', term: '1', subject: '' });
  };

  // ... (Existing Reference Logic) ...
  const handleAddReference = () => {
    if (!newRef.name || !newRef.yearId || !newRef.textContent) return alert('يرجى إدخال اسم المرجع والنص المحتوي.');
    onAddSource({
      id: 'ref' + Date.now(),
      name: newRef.name,
      data: '', 
      mimeType: 'text/plain',
      yearId: newRef.yearId,
      uploadDate: new Date().toLocaleDateString('ar-EG'),
      isAiReference: true,
      textContent: newRef.textContent,
      subject: 'reference'
    });
    setShowAddRef(false);
    setNewRef({ name: '', yearId: '', textContent: '' });
    alert("تم إضافة المرجع بنجاح.");
  };

  const handleRefFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setIsExtracting(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
            const base64 = ev.target?.result as string;
            try {
                const text = await extractTextFromMedia({ data: base64, mimeType: file.type });
                setNewRef(prev => ({ 
                    ...prev, 
                    textContent: (prev.textContent ? prev.textContent + "\n\n" : "") + text,
                    name: prev.name || file.name.split('.')[0]
                }));
                alert("تم استخراج النص من الملف بنجاح!");
            } catch (error) {
                alert("فشل استخراج النص.");
            } finally {
                setIsExtracting(false);
            }
        };
        reader.readAsDataURL(file);
    }
  };

  // Extract unique subjects for filter dropdown
  const availableSubjects = useMemo(() => {
      const allSubjects = new Set<string>();
      if(activeTab === 'videos') videoLessons.forEach(v => v.subject && allSubjects.add(v.subject));
      else educationalSources.forEach(s => s.subject && allSubjects.add(s.subject));
      return Array.from(allSubjects);
  }, [videoLessons, educationalSources, activeTab]);

  return (
    <div className="space-y-12 animate-slideUp pb-24 max-w-7xl mx-auto text-right font-['Cairo']" dir="rtl">
      {/* Header Panel */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="space-y-4 text-center md:text-right">
           <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">مكتبة المصادر <span className="text-blue-600">الأكاديمية</span> 📁</h2>
           <p className="text-slate-400 font-medium text-sm md:text-lg max-w-xl">مستودع متكامل للمحاضرات، الكتب، والمراجع مقسمة حسب الفصول الدراسية.</p>
        </div>
        
        <div className="glass p-2 rounded-[2.5rem] border border-slate-200 shadow-xl flex gap-1 flex-wrap justify-center">
           {tabs.map(tab => (
             <button 
               key={tab.id}
               onClick={() => setActiveTab(tab.id)} 
               className={`px-8 py-4 rounded-[2rem] font-black text-xs transition-all ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
             >
               {tab.label}
             </button>
           ))}
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-6">
         <div className="flex flex-wrap items-center gap-2 bg-white px-6 py-4 rounded-[2rem] border border-slate-100 shadow-sm w-full md:w-auto">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden md:inline">تصفية:</span>
            
            <select className="bg-slate-50 px-3 py-2 rounded-xl font-bold text-xs outline-none cursor-pointer text-slate-700 border border-transparent hover:border-slate-200 transition-all" value={filterYearId} onChange={e => setFilterYearId(e.target.value)}>
               <option value="all">كل الصفوف</option>
               {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>

            <select className="bg-slate-50 px-3 py-2 rounded-xl font-bold text-xs outline-none cursor-pointer text-slate-700 border border-transparent hover:border-slate-200 transition-all" value={filterTerm} onChange={e => setFilterTerm(e.target.value)}>
               <option value="all">كل الفصول</option>
               <option value="1">الترم الأول</option>
               <option value="2">الترم الثاني</option>
            </select>

            <select className="bg-slate-50 px-3 py-2 rounded-xl font-bold text-xs outline-none cursor-pointer text-slate-700 border border-transparent hover:border-slate-200 transition-all" value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
               <option value="all">كل المواد</option>
               {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
         </div>

         <div className="flex gap-3 w-full md:w-auto overflow-x-auto no-scrollbar">
            {activeTab === 'videos' && (
                <button onClick={() => setShowAddVideo(true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-2xl hover:scale-105 transition-all whitespace-nowrap">إضافة فيديو ＋</button>
            )}
            {activeTab === 'docs' && (
                <button onClick={() => setShowAddDoc(true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-2xl hover:scale-105 transition-all whitespace-nowrap">إضافة كتاب/ملزمة ＋</button>
            )}
            {activeTab === 'refs' && (
                <button onClick={() => setShowAddRef(true)} className="px-10 py-5 bg-amber-600 text-white rounded-[2rem] font-black text-xs shadow-2xl hover:scale-105 transition-all whitespace-nowrap">إضافة مرجع منهج (Grounding) ＋</button>
            )}
         </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
         {activeTab === 'videos' && (
           filteredVideos.map(video => (
             <div key={video.id} className="bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-slate-100 group flex flex-col justify-between">
                <div className="p-8">
                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-2">
                          <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[9px] font-black">
                            {video.provider === 'bunny' ? 'محمي (Bunny)' : 'يوتيوب'}
                          </span>
                          {video.term && (
                              <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[9px] font-bold">
                                ترم {video.term}
                              </span>
                          )}
                      </div>
                      <button onClick={() => onDeleteVideo(video.id)} className="w-8 h-8 bg-rose-50 text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                   </div>
                   
                   <h3 className="text-lg font-black text-slate-800 mb-1 leading-tight">{video.title}</h3>
                   {video.subject && <p className="text-xs font-bold text-blue-600 mb-2">{video.subject}</p>}
                   <p className="text-[10px] text-slate-400 font-bold mb-4">{video.uploadDate}</p>
                   
                   <button 
                     onClick={() => setPreviewVideo(video)} 
                     className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
                   >
                     <span>معاينة التشغيل</span>
                     <span>👁️</span>
                   </button>
                </div>
                <div className="h-2 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
             </div>
           ))
         )}
         
         {(activeTab === 'docs' || activeTab === 'refs') && (
           filteredSources.map(doc => (
             <div key={doc.id} className={`p-8 rounded-[3rem] flex flex-col gap-6 group border shadow-sm hover:shadow-xl transition-all ${doc.isAiReference ? 'bg-amber-50 border-amber-100' : 'bg-white border-slate-100'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-110 transition-transform ${doc.isAiReference ? 'bg-amber-100 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                     {doc.isAiReference ? '🧠' : '📄'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">{years.find(y=>y.id===doc.yearId)?.name}</span>
                        {doc.term && <span className="text-[8px] font-bold text-white bg-slate-400 px-2 py-0.5 rounded-md">ترم {doc.term}</span>}
                     </div>
                     <h4 className="font-black text-slate-800 text-sm md:text-md truncate">{doc.name}</h4>
                     {doc.subject && <p className="text-[10px] font-bold text-indigo-500 mt-1">{doc.subject}</p>}
                     {doc.isAiReference && <span className="text-[8px] bg-amber-200 px-2 py-0.5 rounded text-amber-800 font-bold block w-fit mt-1">مصدر ذكاء اصطناعي</span>}
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-black/5">
                   {doc.mimeType === 'application/external-link' ? (
                      <a href={doc.data} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline">
                         <span>🔗</span> فتح الرابط
                      </a>
                   ) : !doc.isAiReference && (
                      <a href={doc.data} download={doc.name} className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:underline">
                         <span>⬇</span> تحميل
                      </a>
                   )}
                   <button onClick={() => onDeleteSource(doc.id)} className="w-8 h-8 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                </div>
             </div>
           ))
         )}
         
         {filteredSources.length === 0 && filteredVideos.length === 0 && (
            <div className="col-span-full py-32 text-center opacity-30 bg-white rounded-[4rem] border-4 border-dashed border-slate-100">
               <span className="text-6xl block mb-4">📭</span>
               <p className="font-black text-lg">لا توجد عناصر في هذا القسم</p>
            </div>
         )}
      </div>

      {/* Add Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-black text-slate-800">إضافة فيديو جديد 🎬</h3>
              
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 text-center">
                 <p className="text-[10px] font-bold text-blue-700 leading-relaxed mb-2">اختر مزود الفيديو</p>
                 <div className="flex gap-2">
                    <button 
                        onClick={() => setNewVideo({...newVideo, provider: 'youtube'})} 
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newVideo.provider === 'youtube' ? 'bg-red-600 text-white' : 'bg-white text-slate-500 border'}`}
                    >YouTube</button>
                    <button 
                        onClick={() => setNewVideo({...newVideo, provider: 'bunny'})} 
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newVideo.provider === 'bunny' ? 'bg-indigo-600 text-white' : 'bg-white text-slate-500 border'}`}
                    >Bunny.net</button>
                 </div>
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 px-2 uppercase">عنوان الفيديو</label>
                 <input type="text" placeholder="مثال: شرح الدرس الأول - تفاضل" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
              </div>

              <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 px-2 uppercase">{newVideo.provider === 'bunny' ? 'رابط Embed أو ID الفيديو' : 'رابط الفيديو (YouTube)'}</label>
                 <input 
                    type="text" 
                    placeholder={newVideo.provider === 'bunny' ? "https://iframe.mediadelivery.net/..." : "https://youtu.be/..."} 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-blue-600" 
                    value={newVideo.url} 
                    onChange={e => setNewVideo({...newVideo, url: e.target.value})} 
                 />
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 px-2 uppercase">الصف الدراسي</label>
                     <select 
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none cursor-pointer" 
                        value={newVideo.yearId} 
                        onChange={e => setNewVideo({...newVideo, yearId: e.target.value, subject: ''})}
                     >
                        <option value="">اختر الصف...</option>
                        {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 px-2 uppercase">الترم الدراسي</label>
                     <div className="flex bg-slate-50 p-1 rounded-2xl">
                        <button onClick={() => setNewVideo({...newVideo, term: '1'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newVideo.term === '1' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>أول</button>
                        <button onClick={() => setNewVideo({...newVideo, term: '2'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newVideo.term === '2' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>ثاني</button>
                     </div>
                  </div>
              </div>

              {/* Dynamic Subject Selection */}
              {newVideo.yearId && (
                  <div className="space-y-2 animate-fadeIn">
                     <label className="text-[10px] font-black text-slate-400 px-2 uppercase">المادة (التصنيف)</label>
                     <select 
                        className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none cursor-pointer" 
                        value={newVideo.subject} 
                        onChange={e => setNewVideo({...newVideo, subject: e.target.value})}
                     >
                        <option value="">اختر المادة...</option>
                        {getSubjectsForYear(newVideo.yearId).map(subj => (
                            <option key={subj} value={subj}>{subj}</option>
                        ))}
                     </select>
                  </div>
              )}

              <div className="flex gap-2 pt-4">
                 <button onClick={handleAddVideoLocal} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all">حفظ وإضافة ✓</button>
                 <button onClick={() => setShowAddVideo(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Document Modal */}
      {showAddDoc && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]">
              <h3 className="text-xl font-black">إضافة كتاب أو ملزمة</h3>
              
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                 <button onClick={() => setDocMode('upload')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${docMode === 'upload' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500'}`}>رفع ملف</button>
                 <button onClick={() => setDocMode('link')} className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${docMode === 'link' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500'}`}>رابط خارجي 🔗</button>
              </div>

              <input type="text" placeholder="اسم الملف/الكتاب" className="w-full p-4 bg-slate-50 rounded-2xl" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
              
              <div className="grid grid-cols-2 gap-4">
                  <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" value={newDoc.yearId} onChange={e => setNewDoc({...newDoc, yearId: e.target.value, subject: ''})}>
                     <option value="">الصف</option>
                     {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                  </select>
                  <div className="flex bg-slate-50 p-1 rounded-2xl">
                        <button onClick={() => setNewDoc({...newDoc, term: '1'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newDoc.term === '1' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>أول</button>
                        <button onClick={() => setNewDoc({...newDoc, term: '2'})} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${newDoc.term === '2' ? 'bg-white shadow text-indigo-600' : 'text-slate-400'}`}>ثاني</button>
                  </div>
              </div>

              {newDoc.yearId && (
                  <select 
                    className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs" 
                    value={newDoc.subject} 
                    onChange={e => setNewDoc({...newDoc, subject: e.target.value})}
                  >
                    <option value="">المادة (اختياري)</option>
                    {getSubjectsForYear(newDoc.yearId).map(subj => (
                        <option key={subj} value={subj}>{subj}</option>
                    ))}
                  </select>
              )}

              {docMode === 'upload' ? (
                <>
                    <input type="file" ref={docInputRef} className="hidden" onChange={handleFileUpload} accept="application/pdf,image/*" />
                    <button onClick={() => docInputRef.current?.click()} className="w-full p-4 bg-slate-100 rounded-2xl text-slate-500 font-bold border-2 border-dashed hover:bg-slate-200 transition-all">{newDoc.data ? 'تم اختيار الملف ✓' : 'اضغط لاختيار ملف من جهازك'}</button>
                    <p className="text-[9px] text-amber-600 font-bold text-center">تنبيه: الحد الأقصى 1 ميجا. للملفات الكبيرة استخدم "رابط خارجي".</p>
                </>
              ) : (
                <input 
                    type="url" 
                    placeholder="ضع رابط Google Drive أو Mediafire هنا..." 
                    className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-indigo-100 focus:border-indigo-500 outline-none" 
                    value={newDoc.linkUrl} 
                    onChange={e => setNewDoc({...newDoc, linkUrl: e.target.value})} 
                />
              )}

              <div className="flex gap-2 pt-4">
                 <button onClick={handleAddDocLocal} className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black">حفظ</button>
                 <button onClick={() => setShowAddDoc(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}

      {/* Add Reference Modal */}
      {showAddRef && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl space-y-6 relative overflow-y-auto max-h-[90vh]">
             <button onClick={() => setShowAddRef(false)} className="absolute top-8 left-8 w-10 h-10 bg-slate-100 rounded-full text-slate-500">✕</button>
             <div>
                <h3 className="text-2xl font-black text-slate-800">إضافة مرجع منهجي (Grounding)</h3>
                <p className="text-slate-500 text-xs font-bold mt-2">سيتم إجبار الذكاء الاصطناعي على استخدام النص الذي تدخله هنا فقط عند الشرح أو وضع الأسئلة لهذا الصف.</p>
             </div>

             <div className="space-y-4">
                <div className="flex gap-4">
                   <input type="text" placeholder="اسم المرجع (مثال: كتاب الوزارة - جبر)" className="flex-1 px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-amber-500" value={newRef.name} onChange={e => setNewRef({...newRef, name: e.target.value})} />
                   <select className="px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-amber-500" value={newRef.yearId} onChange={e => setNewRef({...newRef, yearId: e.target.value})}>
                      <option value="">الصف الدراسي</option>
                      {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                   </select>
                </div>

                <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 space-y-3">
                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">خيار سريع: استخراج النص من ملف (PDF / صورة)</p>
                    <button 
                        onClick={() => refFileInputRef.current?.click()} 
                        disabled={isExtracting}
                        className="w-full py-4 bg-white border border-amber-200 text-amber-600 rounded-xl font-bold text-sm shadow-sm hover:bg-amber-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isExtracting ? (
                            <>
                                <span className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></span>
                                <span>جاري قراءة الملف...</span>
                            </>
                        ) : (
                            <>
                                <span>رفع ملف لاستخراج النص</span>
                                <span className="text-lg">📤</span>
                            </>
                        )}
                    </button>
                    <input type="file" ref={refFileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleRefFileUpload} />
                </div>
                
                <div className="relative">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block px-2">النص المعتمد (المنهج)</label>
                   <textarea 
                     placeholder="انسخ والصق نص المنهج هنا، أو استخدم زر الرفع أعلاه لاستخراجه تلقائياً..."
                     className="w-full p-6 bg-slate-50 rounded-2xl font-medium text-sm h-64 outline-none border-2 border-dashed border-slate-200 focus:border-amber-500 resize-none"
                     value={newRef.textContent}
                     onChange={e => setNewRef({...newRef, textContent: e.target.value})}
                   />
                </div>

                <button onClick={handleAddReference} className="w-full py-5 bg-amber-600 text-white rounded-2xl font-black shadow-xl hover:scale-[1.01] transition-all">حفظ المرجع واعتماده ✓</button>
             </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewVideo && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-fadeIn">
              <div className="w-full max-w-4xl bg-black rounded-[3rem] overflow-hidden shadow-2xl relative">
                  <button onClick={() => setPreviewVideo(null)} className="absolute top-4 left-4 z-50 w-10 h-10 bg-white/10 hover:bg-rose-600 rounded-full flex items-center justify-center text-white transition-all">✕</button>
                  <div className="p-4 bg-slate-900 border-b border-white/10 flex justify-between items-center">
                      <h3 className="text-white font-bold">{previewVideo.title} (وضع المعاينة)</h3>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">محمي بواسطة MathMaster Shield</span>
                  </div>
                  <div className="aspect-video w-full bg-black relative">
                      <ProtectedVideo 
                          src={previewVideo.youtubeUrl} 
                          title={previewVideo.title} 
                          watermarkText="معاينة المعلم | 000000" 
                          enabled={settings?.protectionEnabled ?? true} 
                          provider={previewVideo.provider}
                      />
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default FilesView;
