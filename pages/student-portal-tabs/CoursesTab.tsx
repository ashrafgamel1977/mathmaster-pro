import React from 'react';
import { Course, VideoLesson, EducationalSource, PlatformSettings } from '../../types';
import CourseViewer from '../../components/CourseViewer';
import { Folder, Video } from 'lucide-react';
import { usePortalTheme } from '../../hooks/usePortalTheme';

interface CoursesTabProps {
    courses: Course[];
    videoLessons: VideoLesson[];
    educationalSources: EducationalSource[];
    studentYearId?: string;
    selectedCourse: Course | null;
    setSelectedCourse: (c: Course | null) => void;
    onVideoProgress?: (videoId: string, percent: number) => void;
    settings: PlatformSettings;
    studentPoints?: number;
    isDark?: boolean;
}

const CoursesTab: React.FC<CoursesTabProps> = ({
    courses, videoLessons, educationalSources, studentYearId,
    selectedCourse, setSelectedCourse, onVideoProgress, settings, studentPoints = 0, isDark = true,
}) => {
    const {
        getCardThemeClasses, getButtonThemeClasses,
        getButtonTextThemeClasses,
    } = usePortalTheme(settings.portalTheme, isDark);

    const myCourses = courses.filter(c => c.yearId === studentYearId || c.yearId === 'all');

    const buttonThemeForViewer =
        settings.portalTheme === 'emerald' ? 'bg-emerald-600 hover:bg-emerald-700' :
            settings.portalTheme === 'rose' ? 'bg-rose-600 hover:bg-rose-700' :
                settings.portalTheme === 'amber' ? 'bg-amber-600 hover:bg-amber-700' :
                    settings.portalTheme === 'violet' ? 'bg-violet-600 hover:bg-violet-700' :
                        'bg-indigo-600 hover:bg-indigo-700';

    return (
        <>
            <div className="space-y-8 animate-fadeIn pb-24">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                    <h2 className={`text-3xl font-black text-white flex items-center gap-3`}><Folder className={getButtonTextThemeClasses()} /> الكورسات</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myCourses.map(course => {
                        const totalItems = course.modules.reduce((acc, mod) => acc + mod.items.length, 0);
                        return (
                            <div key={course.id} className={`${getCardThemeClasses()} rounded-[2rem] border border-white/5 overflow-hidden group hover:border-white/20 transition-all shadow-lg`}>
                                <div className="h-40 bg-slate-800 relative">
                                    {course.thumbnailUrl ? (
                                        <img src={course.thumbnailUrl} alt={course.title} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" referrerPolicy="no-referrer" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <Folder size={48} className="text-white/30" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-6">
                                    <h3 className="text-xl font-black text-white mb-2">{course.title}</h3>
                                    <p className="text-sm text-slate-400 font-bold mb-4 line-clamp-2">{course.description}</p>
                                    <div className="flex items-center justify-between text-sm font-bold text-slate-500 mb-4">
                                        <span className="flex items-center gap-1"><Folder size={16} /> {course.modules.length} وحدات</span>
                                        <span className="flex items-center gap-1"><Video size={16} /> {totalItems} دروس</span>
                                    </div>
                                    <button onClick={() => setSelectedCourse(course)} className={`w-full py-3 ${getButtonThemeClasses()} text-white rounded-xl font-bold transition-all`}>
                                        تصفح الكورس
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                    {myCourses.length === 0 && (
                        <div className={`col-span-full text-center py-20 ${getCardThemeClasses()} rounded-[3rem] border border-white/5`}>
                            <Folder size={48} className="mx-auto text-slate-500 mb-4 opacity-50" />
                            <h3 className="text-xl font-black text-white mb-2">لا توجد كورسات متاحة</h3>
                            <p className="text-slate-400 font-bold">لم يتم إضافة أي كورسات لصفك الدراسي بعد.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Course Viewer Modal */}
            {selectedCourse && (
                <CourseViewer
                    course={selectedCourse}
                    videoLessons={videoLessons}
                    educationalSources={educationalSources}
                    themeClass="bg-slate-900"
                    buttonThemeClass={buttonThemeForViewer}
                    buttonTextClass={getButtonTextThemeClasses()}
                    onClose={() => setSelectedCourse(null)}
                    onVideoProgress={onVideoProgress}
                    studentPoints={studentPoints}
                />
            )}
        </>
    );
};

export default CoursesTab;
