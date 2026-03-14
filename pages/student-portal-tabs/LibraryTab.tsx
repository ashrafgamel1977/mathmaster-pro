import React from 'react';
import { VideoLesson, EducationalSource, PlatformSettings } from '../../types';
import ProtectedVideo from '../../components/ProtectedVideo';
import { BookOpen, Video, File, Download, Play } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface LibraryTabProps {
    filteredVideos: VideoLesson[];
    filteredDocs: EducationalSource[];
    libraryFilter: 'video' | 'doc';
    setLibraryFilter: (f: 'video' | 'doc') => void;
    libraryTerm: 'all' | '1' | '2';
    setLibraryTerm: (t: 'all' | '1' | '2') => void;
    selectedVideo: VideoLesson | null;
    setSelectedVideo: (v: VideoLesson | null) => void;
    onVideoProgress?: (videoId: string, percent: number) => void;
    settings: PlatformSettings;
    studentPoints?: number;
    isDark?: boolean;
}

const LibraryTab: React.FC<LibraryTabProps> = ({
    filteredVideos, filteredDocs, libraryFilter, setLibraryFilter,
    libraryTerm, setLibraryTerm, selectedVideo, setSelectedVideo,
    onVideoProgress, settings, studentPoints = 0, isDark = true,
}) => {
    const { getCardThemeClasses, getButtonTextThemeClasses, getButtonBgThemeClasses } = usePortalTheme(settings.portalTheme, isDark);

    return (
        <div className="space-y-8 animate-fadeIn pb-24">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
                <h2 className={`text-3xl font-black text-white flex items-center gap-3`}><BookOpen className={getButtonTextThemeClasses()} /> مكتبتي</h2>
                <div className={`flex ${getCardThemeClasses()} p-1 rounded-xl border border-white/5`}>
                    <button onClick={() => setLibraryFilter('video')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${libraryFilter === 'video' ? 'bg-white text-slate-900 shadow' : 'text-slate-400'}`}><Video size={14} /> فيديوهات</button>
                    <button onClick={() => setLibraryFilter('doc')} className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${libraryFilter === 'doc' ? 'bg-white text-slate-900 shadow' : 'text-slate-400'}`}><File size={14} /> كتب</button>
                </div>
            </div>

            {/* Active Video Player */}
            {selectedVideo && (
                <div className={`${getCardThemeClasses()} rounded-[2rem] p-6 border border-white/10 space-y-4`}>
                    <div className="flex items-center justify-between">
                        <h3 className="text-white font-black text-lg">{selectedVideo.title}</h3>
                        <button onClick={() => setSelectedVideo(null)} className="text-slate-400 hover:text-white text-xs font-bold">✕ إغلاق</button>
                    </div>
                    <ProtectedVideo
                        lesson={selectedVideo}
                        watermarkText="MathMaster Pro"
                        onProgress={(pct) => onVideoProgress?.(selectedVideo.id, pct)}
                        studentPoints={studentPoints}
                    />
                </div>
            )}

            {libraryFilter === 'video' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredVideos.map(vid => (
                        <div key={vid.id} onClick={() => setSelectedVideo(vid)} className={`${getCardThemeClasses()} rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/20 transition-all cursor-pointer group shadow-lg flex flex-col h-full`}>
                            <div className="relative aspect-video bg-black/50 group-hover:opacity-80 transition-opacity">
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-black/20 to-black/60"><Play size={48} className="text-white drop-shadow-lg opacity-80 group-hover:scale-110 transition-transform" /></div>
                                <div className="absolute top-3 left-3"><span className="bg-black/60 backdrop-blur-sm text-white px-2 py-1 rounded-lg text-[9px] font-bold border border-white/10">ترم {vid.term}</span></div>
                            </div>
                            <div className="p-5 flex flex-col flex-1">
                                <h3 className="text-white font-bold text-sm mb-2 line-clamp-2 leading-relaxed flex-1">{vid.title}</h3>
                                <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/5">
                                    <span className={`text-[10px] ${getButtonTextThemeClasses()} font-bold`}>{vid.subject || 'عام'}</span>
                                    <span className="text-[10px] text-slate-500">{vid.uploadDate}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredVideos.length === 0 && (
                        <div className={`col-span-full ${getCardThemeClasses()} p-16 rounded-[3rem] border border-dashed border-slate-700 text-center`}>
                            <Video size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                            <p className="text-slate-400 font-bold">لا توجد فيديوهات.</p>
                        </div>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredDocs.map(doc => (
                        <div key={doc.id} className={`${getCardThemeClasses()} p-6 rounded-[2rem] border border-white/5 hover:border-white/20 transition-all flex items-center gap-5 group relative`}>
                            <div className={`w-14 h-14 ${getButtonBgThemeClasses()} ${getButtonTextThemeClasses()} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}><File size={24} /></div>
                            <div className="flex-1 overflow-hidden">
                                <h3 className="text-white font-bold text-sm truncate">{doc.name}</h3>
                                <span className="text-slate-500 text-[10px]">{doc.uploadDate}</span>
                            </div>
                            <a href={doc.data} download={doc.name} className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-full flex items-center justify-center text-white transition-all"><Download size={18} /></a>
                        </div>
                    ))}
                    {filteredDocs.length === 0 && (
                        <div className={`col-span-full ${getCardThemeClasses()} p-16 rounded-[3rem] border border-dashed border-slate-700 text-center`}>
                            <File size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                            <p className="text-slate-400 font-bold">لا توجد ملفات.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default LibraryTab;
