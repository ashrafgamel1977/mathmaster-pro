
import React, { useState, useRef, useMemo } from 'react';
import { Year, VideoLesson, Student, VideoView, EducationalSource } from '../types';

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
}

const FilesView: React.FC<FilesViewProps> = ({ years, videoLessons, educationalSources, students, videoViews, onAddVideo, onDeleteVideo, onAddSource, onDeleteSource }) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'docs'>('videos');
  const [showAddVideo, setShowAddVideo] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [filterYearId, setFilterYearId] = useState<string>('all');
  
  const [newVideo, setNewVideo] = useState({ title: '', url: '', yearId: '', thumbnailUrl: '' });
  const [newDoc, setNewDoc] = useState({ name: '', yearId: '', data: '', mimeType: '' });
  
  const docInputRef = useRef<HTMLInputElement>(null);

  const filteredSources = useMemo(() => {
    if (filterYearId === 'all') return educationalSources;
    return educationalSources.filter(s => s.yearId === filterYearId);
  }, [educationalSources, filterYearId]);

  const handleAddVideoLocal = () => {
    if(!newVideo.title || !newVideo.url || !newVideo.yearId) return alert('يرجى إكمال البيانات');
    onAddVideo({
      id: '',
      title: newVideo.title,
      youtubeUrl: newVideo.url,
      yearId: newVideo.yearId,
      uploadDate: new Date().toLocaleDateString('ar-EG')
    });
    setShowAddVideo(false);
    setNewVideo({ title: '', url: '', yearId: '', thumbnailUrl: '' });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewDoc({ ...newDoc, data: ev.target?.result as string, mimeType: file.type });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddDocLocal = () => {
    if (!newDoc.name || !newDoc.yearId || !newDoc.data) return alert('يرجى إكمال البيانات ورفع الملف');
    onAddSource({
      id: 'src' + Date.now(),
      name: newDoc.name,
      data: newDoc.data,
      mimeType: newDoc.mimeType,
      yearId: newDoc.yearId,
      uploadDate: new Date().toLocaleDateString('ar-EG')
    });
    setShowAddDoc(false);
    setNewDoc({ name: '', yearId: '', data: '', mimeType: '' });
  };

  return (
    <div className="space-y-12 animate-slideUp pb-24 max-w-7xl mx-auto text-right font-['Cairo']" dir="rtl">
      {/* Header Panel */}
      <div className="bg-white p-10 md:p-14 rounded-[4rem] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="space-y-4 text-center md:text-right">
           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 rounded-full border border-blue-100">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">المستودع التعليمي</span>
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">مكتبة المصادر <span className="text-blue-600">الأكاديمية</span> 📁</h2>
           <p className="text-slate-400 font-medium text-sm md:text-lg max-w-xl">مستودع متكامل للمحاضرات المرئية، الكتب، والملازم الدراسية المنظمة.</p>
        </div>
        
        <div className="glass p-2 rounded-[2.5rem] border border-slate-200 shadow-xl flex gap-1">
           <button onClick={() => setActiveTab('videos')} className={`px-8 py-4 rounded-[2rem] font-black text-xs transition-all ${activeTab === 'videos' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>🎬 فيديوهات</button>
           <button onClick={() => setActiveTab('docs')} className={`px-8 py-4 rounded-[2rem] font-black text-xs transition-all ${activeTab === 'docs' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>📚 كتب وملازم</button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-6 px-6">
         <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-3xl border border-slate-100 shadow-sm">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">تصفية الصف:</span>
            <select className="bg-transparent font-black text-xs outline-none cursor-pointer text-slate-700" value={filterYearId} onChange={e => setFilterYearId(e.target.value)}>
               <option value="all">كل الصفوف</option>
               {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
         </div>
         <button 
           onClick={() => activeTab === 'videos' ? setShowAddVideo(true) : setShowAddDoc(true)}
           className="px-10 py-5 bg-blue-600 text-white rounded-3xl font-black text-xs shadow-2xl shadow-blue-500/20 hover:scale-105 transition-all"
         >إضافة محتوى جديد ＋</button>
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
         {activeTab === 'videos' ? (
           videoLessons.filter(v => filterYearId === 'all' || v.yearId === filterYearId).map(video => (
             <div key={video.id} className="bg-white rounded-[3.5rem] overflow-hidden shadow-xl border border-slate-100 group">
                <div className="aspect-video relative overflow-hidden bg-slate-100">
                   <img src={`https://img.youtube.com/vi/${video.youtubeUrl.split('v=')[1]?.split('&')[0]}/maxresdefault.jpg`} className="w-full h-full object-cover" alt="" />
                   <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">VIDEO</span>
                   </div>
                </div>
                <div className="p-8">
                   <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">{years.find(y=>y.id===video.yearId)?.name}</span>
                   <h3 className="text-lg font-black text-slate-800 mt-2 mb-6 leading-tight line-clamp-2">{video.title}</h3>
                   <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <span className="text-[10px] text-slate-400 font-bold">{video.uploadDate}</span>
                      <button onClick={() => onDeleteVideo(video.id)} className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                   </div>
                </div>
             </div>
           ))
         ) : (
           filteredSources.map(doc => (
             <div key={doc.id} className="pro-card p-8 rounded-[3rem] flex items-center gap-6 group bg-white border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-[1.5rem] flex items-center justify-center text-3xl shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                   📄
                </div>
                <div className="flex-1 overflow-hidden">
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{years.find(y=>y.id===doc.yearId)?.name}</p>
                   <h4 className="font-black text-slate-800 text-sm md:text-md truncate mt-1">{doc.name}</h4>
                </div>
                <button onClick={() => onDeleteSource(doc.id)} className="w-10 h-10 bg-rose-50 text-rose-400 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
             </div>
           ))
         )}
      </div>

      {/* Video Modal */}
      {showAddVideo && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-800">إضافة فيديو جديد</h3>
            <input type="text" placeholder="عنوان الفيديو" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-600" value={newVideo.title} onChange={e => setNewVideo({...newVideo, title: e.target.value})} />
            <input type="text" placeholder="رابط يوتيوب" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-600" value={newVideo.url} onChange={e => setNewVideo({...newVideo, url: e.target.value})} />
            <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-600" value={newVideo.yearId} onChange={e => setNewVideo({...newVideo, yearId: e.target.value})}>
               <option value="">اختر الصف</option>
               {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            <div className="flex gap-4">
              <button onClick={handleAddVideoLocal} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">حفظ</button>
              <button onClick={() => setShowAddVideo(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}

      {/* Document Modal (Fixed to solve unused variables) */}
      {showAddDoc && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-lg p-10 rounded-[3rem] shadow-2xl space-y-6">
            <h3 className="text-2xl font-black text-slate-800">إضافة ملف أو ملزمة</h3>
            <input type="text" placeholder="اسم الملف" className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-600" value={newDoc.name} onChange={e => setNewDoc({...newDoc, name: e.target.value})} />
            <select className="w-full px-6 py-4 bg-slate-50 rounded-2xl outline-none border focus:border-blue-600" value={newDoc.yearId} onChange={e => setNewDoc({...newDoc, yearId: e.target.value})}>
               <option value="">اختر الصف</option>
               {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
            </select>
            
            <div 
              className="border-2 border-dashed border-slate-200 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
              onClick={() => docInputRef.current?.click()}
            >
               {newDoc.data ? (
                 <p className="text-emerald-600 font-bold text-xs">تم اختيار الملف بنجاح ✓</p>
               ) : (
                 <p className="text-slate-400 font-bold text-xs">اضغط لرفع الملف (PDF / صور)</p>
               )}
               <input type="file" ref={docInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
            </div>

            <div className="flex gap-4">
              <button onClick={handleAddDocLocal} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">نشر الملف</button>
              <button onClick={() => setShowAddDoc(false)} className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black">إلغاء</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesView;
