
import React, { useState, useRef, useMemo, useEffect } from 'react';
import { Year, VideoLesson, Student, VideoView, EducationalSource, PlatformSettings, AppView, Folder } from '../types';
import { getSecureFileUrl } from '../services/firebaseService';
import ProtectedVideo from '../components/ProtectedVideo';

interface FilesViewProps {
  years: Year[];
  videoLessons: VideoLesson[];
  educationalSources: EducationalSource[];
  students: Student[];
  videoViews: VideoView[];
  folders: Folder[];
  onAddVideo: (video: VideoLesson) => void;
  onDeleteVideo: (id: string) => void;
  onAddSource: (source: EducationalSource) => void;
  onDeleteSource: (id: string) => void;
  onAddFolder: (folder: Folder) => void;
  onDeleteFolder: (id: string) => void;
  settings?: PlatformSettings;
}

const FilesView: React.FC<FilesViewProps> = ({ years, videoLessons, educationalSources, students, videoViews, folders, onAddVideo, onDeleteVideo, onAddSource, onDeleteSource, onAddFolder, onDeleteFolder, settings }) => {
  const activeTabState = useState<string>('videos');
  const activeTab = activeTabState[0];
  const setActiveTab = activeTabState[1];

  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showAddFolder, setShowAddFolder] = useState(false);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  
  // Filters
  const [filterYearId, setFilterYearId] = useState<string>('all');
  const [filterTerm, setFilterTerm] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  
  // Preview State
  const [previewVideo, setPreviewVideo] = useState<VideoLesson | null>(null);
  
  // Folder State
  const [newFolder, setNewFolder] = useState<{ name: string, yearId: string, color: string }>({ name: '', yearId: '', color: 'blue' });

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
  
  const docInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_TABS: { id: string; label: string; icon: string; disabled?: boolean }[] = [
    { id: 'videos', label: '🎬 فيديوهات', icon: '🎬' },
    { id: 'docs', label: '📚 كتب وملازم', icon: '📚' }
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

    if (filterYearId !== 'all') sources = sources.filter(s => s.yearId === filterYearId);
    if (filterTerm !== 'all') sources = sources.filter(s => s.term === filterTerm);
    if (filterSubject !== 'all') sources = sources.filter(s => s.subject === filterSubject);

    if (activeFolderId) {
        sources = sources.filter(s => s.folderId === activeFolderId);
    } else {
        sources = sources.filter(s => !s.folderId);
    }

    return sources;
  }, [educationalSources, filterYearId, filterTerm, filterSubject, activeTab, activeFolderId]);

  const filteredVideos = useMemo(() => {
    let videos = videoLessons;
    if (filterYearId !== 'all') videos = videos.filter(v => v.yearId === filterYearId);
    if (filterTerm !== 'all') videos = videos.filter(v => v.term === filterTerm);
    if (filterSubject !== 'all') videos = videos.filter(v => v.subject === filterSubject);
    
    if (activeFolderId) {
        videos = videos.filter(v => v.folderId === activeFolderId);
    } else {
        videos = videos.filter(v => !v.folderId);
    }

    return videos;
  }, [videoLessons, filterYearId, filterTerm, filterSubject, activeFolderId]);

  const currentFolders = useMemo(() => {
      if (activeFolderId) return []; // No nested folders for now
      let f = folders.filter(f => f.type === (activeTab === 'videos' ? 'video' : 'doc'));
      if (filterYearId !== 'all') f = f.filter(x => x.yearId === filterYearId);
      return f;
  }, [folders, activeTab, filterYearId, activeFolderId]);

  const handleAddFolder = () => {
    if (!newFolder.name || !newFolder.yearId) return alert('يرجى إكمال البيانات');
    
    onAddFolder({
      id: '',
      name: newFolder.name,
      type: activeTab === 'videos' ? 'video' : 'doc',
      yearId: newFolder.yearId,
      color: newFolder.color,
      createdAt: new Date().toISOString()
    });
    setShowAddFolder(false);
    setNewFolder({ name: '', yearId: '', color: 'blue' });
  };

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
      subject: newVideo.subject || 'عام',
      folderId: activeFolderId || undefined
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
      subject: newDoc.subject || 'عام',
      folderId: activeFolderId || undefined
    });
    setShowAddDoc(false);
    setNewDoc({ name: '', yearId: '', data: '', mimeType: '', linkUrl: '', term: '1', subject: '' });
  };

  const handleDownload = async (doc: EducationalSource) => {
    const url = await getSecureFileUrl(doc.data, settings?.protectionEnabled || false);
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            {activeFolderId && (
                <button onClick={() => setActiveFolderId(null)} className="px-6 py-5 bg-slate-100 text-slate-600 rounded-[2rem] font-black text-xs hover:bg-slate-200 transition-all">🔙 العودة</button>
            )}
            {!activeFolderId && (activeTab === 'videos' || activeTab === 'docs') && (
                <button onClick={() => setShowAddFolder(true)} className="px-6 py-5 bg-amber-100 text-amber-700 rounded-[2rem] font-black text-xs hover:bg-amber-200 transition-all whitespace-nowrap">📁 مجلد جديد</button>
            )}
            {activeTab === 'videos' && (
                <button onClick={() => setShowAddVideo(true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-2xl hover:scale-105 transition-all whitespace-nowrap">إضافة فيديو ＋</button>
            )}
            {activeTab === 'docs' && (
                <button onClick={() => setShowAddDoc(true)} className="px-10 py-5 bg-blue-600 text-white rounded-[2rem] font-black text-xs shadow-2xl hover:scale-105 transition-all whitespace-nowrap">إضافة كتاب/ملزمة ＋</button>
            )}
         </div>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
         {/* Folders */}
         {currentFolders.map(folder => (
            <div key={folder.id} onClick={() => setActiveFolderId(folder.id)} className="bg-amber-50 rounded-[3rem] p-8 border-2 border-amber-100 cursor-pointer hover:shadow-xl hover:scale-[1.02] transition-all group">
                <div className="flex justify-between items-start mb-4">
                    <span className="text-4xl">📁</span>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteFolder(folder.id); }} className="w-8 h-8 bg-white text-rose-400 rounded-full flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all opacity-0 group-hover:opacity-100">🗑️</button>
                </div>
                <h3 className="text-lg font-black text-slate-800 mb-1">{folder.name}</h3>
                <p className="text-xs font-bold text-amber-600">{years.find(y => y.id === folder.yearId)?.name}</p>
            </div>
         ))}

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
         
         {(activeTab === 'docs') && (
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
                  </div>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-black/5">
                   {doc.mimeType === 'application/external-link' ? (
                      <a href={doc.data} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 flex items-center gap-2 hover:underline">
                         <span>🔗</span> فتح الرابط
                      </a>
                   ) : (
                       <button 
                         onClick={() => handleDownload(doc)}
                         className="text-xs font-bold text-indigo-600 flex items-center gap-2 hover:underline bg-transparent border-none p-0 cursor-pointer"
                       >
                          <span>⬇</span> تحميل
                       </button>
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

      {/* Add Folder Modal */}
      {showAddFolder && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white p-10 rounded-[3rem] w-full max-w-lg space-y-4 shadow-2xl">
              <h3 className="text-xl font-black text-slate-800">إنشاء مجلد جديد 📁</h3>
              <input type="text" placeholder="اسم المجلد" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-amber-500" value={newFolder.name} onChange={e => setNewFolder({...newFolder, name: e.target.value})} />
              
              <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-xs outline-none cursor-pointer" value={newFolder.yearId} onChange={e => setNewFolder({...newFolder, yearId: e.target.value})}>
                 <option value="">الصف الدراسي</option>
                 {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
              </select>

              <div className="flex gap-2 pt-4">
                 <button onClick={handleAddFolder} className="flex-1 py-4 bg-amber-500 text-white rounded-2xl font-black shadow-xl hover:scale-[1.02] transition-all">إنشاء ✓</button>
                 <button onClick={() => setShowAddFolder(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
              </div>
           </div>
        </div>
      )}

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
