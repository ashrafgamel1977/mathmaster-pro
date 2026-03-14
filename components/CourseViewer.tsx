import React, { useState } from 'react';
import { Course, VideoLesson, EducationalSource } from '../types';
import { Play, FileText, ChevronDown, ChevronUp, ArrowRight, BookOpen, X } from 'lucide-react';
import ProtectedVideo from './ProtectedVideo';

interface CourseViewerProps {
    course: Course;
    videoLessons: VideoLesson[];
    educationalSources: EducationalSource[];
    themeClass: string;
    buttonThemeClass: string;
    buttonTextClass: string;
    onClose: () => void;
    onVideoProgress?: (videoId: string, percent: number) => void;
    studentPoints?: number;
}

const CourseViewer: React.FC<CourseViewerProps> = ({
    course,
    videoLessons,
    educationalSources,
    themeClass,
    buttonThemeClass,
    buttonTextClass,
    onClose,
    onVideoProgress,
    studentPoints = 0,
}) => {
    const [openModules, setOpenModules] = useState<Set<string>>(new Set([course.modules[0]?.id]));
    const [activeVideo, setActiveVideo] = useState<VideoLesson | null>(null);

    const toggleModule = (moduleId: string) => {
        setOpenModules(prev => {
            const next = new Set(prev);
            if (next.has(moduleId)) next.delete(moduleId);
            else next.add(moduleId);
            return next;
        });
    };

    // Resolve an item ID to either a VideoLesson or EducationalSource
    const resolveItem = (itemId: string) => {
        const video = videoLessons.find(v => v.id === itemId);
        if (video) return { type: 'video' as const, data: video };
        const doc = educationalSources.find(d => d.id === itemId);
        if (doc) return { type: 'doc' as const, data: doc };
        return null;
    };

    const totalLessons = course.modules.reduce((acc, m) => acc + m.items.length, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" dir="rtl">
            <div className={`w-full max-w-4xl max-h-[90vh] ${themeClass} rounded-[2.5rem] border border-white/10 shadow-2xl overflow-hidden flex flex-col`}>

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 ${buttonThemeClass} rounded-2xl flex items-center justify-center`}>
                            <BookOpen size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white">{course.title}</h2>
                            <p className={`text-sm font-bold ${buttonTextClass}`}>{course.modules.length} وحدات · {totalLessons} درس</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all">
                        <X size={20} />
                    </button>
                </div>

                {/* Body: split — modules list + content viewer */}
                <div className="flex flex-1 overflow-hidden">

                    {/* Modules Sidebar */}
                    <aside className="w-80 border-l border-white/10 overflow-y-auto no-scrollbar">
                        <div className="p-4 space-y-2">
                            {course.modules.map((mod, modIdx) => (
                                <div key={mod.id} className="rounded-2xl overflow-hidden border border-white/5">
                                    {/* Module Header */}
                                    <button
                                        onClick={() => toggleModule(mod.id)}
                                        className="w-full flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-all"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className={`w-7 h-7 rounded-lg ${buttonThemeClass} text-white text-xs font-black flex items-center justify-center`}>
                                                {modIdx + 1}
                                            </span>
                                            <span className="text-white text-sm font-bold text-right">{mod.title}</span>
                                        </div>
                                        {openModules.has(mod.id)
                                            ? <ChevronUp size={16} className="text-slate-400" />
                                            : <ChevronDown size={16} className="text-slate-400" />
                                        }
                                    </button>

                                    {/* Module Items */}
                                    {openModules.has(mod.id) && (
                                        <div className="divide-y divide-white/5">
                                            {mod.items.map((itemId) => {
                                                const resolved = resolveItem(itemId);
                                                if (!resolved) return null;
                                                const isActiveVideo = resolved.type === 'video' && activeVideo?.id === resolved.data.id;

                                                return (
                                                    <button
                                                        key={itemId}
                                                        onClick={() => {
                                                            if (resolved.type === 'video') {
                                                                setActiveVideo(resolved.data as VideoLesson);
                                                            } else {
                                                                window.open((resolved.data as EducationalSource).data, '_blank');
                                                            }
                                                        }}
                                                        className={`w-full flex items-center gap-3 px-5 py-3 text-right transition-all ${isActiveVideo ? `${buttonThemeClass.replace('hover:', '')} text-white` : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                                                            }`}
                                                    >
                                                        {resolved.type === 'video'
                                                            ? <Play size={14} className="shrink-0" />
                                                            : <FileText size={14} className="shrink-0" />
                                                        }
                                                        <span className="text-xs font-bold truncate">
                                                            {resolved.type === 'video'
                                                                ? (resolved.data as VideoLesson).title
                                                                : (resolved.data as EducationalSource).name
                                                            }
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 overflow-y-auto no-scrollbar p-6">
                        {activeVideo ? (
                            <div className="space-y-4">
                                <h3 className="text-white font-black text-lg">{activeVideo.title}</h3>
                                <ProtectedVideo
                                    lesson={activeVideo}
                                    watermarkText="MathMaster Pro"
                                    onProgress={(pct) => onVideoProgress?.(activeVideo.id, pct)}
                                    studentPoints={studentPoints}
                                />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center gap-4">
                                <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center">
                                    <Play size={40} className={buttonTextClass} />
                                </div>
                                <h3 className="text-white font-black text-xl">اختر درساً للبدء</h3>
                                <p className="text-slate-500 font-bold text-sm">اختر وحدة من القائمة على اليمين لعرض محتواها</p>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default CourseViewer;
