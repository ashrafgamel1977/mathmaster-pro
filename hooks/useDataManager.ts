import { useState, useEffect } from 'react';
import {
    Student, Year, Group, Quiz, Assignment, AssignmentSubmission, QuizResult,
    VideoLesson, EducationalSource, ChatMessage, AppNotification, Assistant,
    ScheduleEntry, MathFormula, VideoView, Folder, Course, ToastType, PlatformSettings, CurrentUser
} from '../types';
import {
    subscribeToCollection, saveData, updatePartialData, removeData
} from '../services/firebaseService';
import { INITIAL_SETTINGS } from '../constants';

type AddToast = (msg: string, type: ToastType) => void;

// --- Generic ID generator ---
export const genId = (prefix = '') =>
    prefix + (crypto.randomUUID?.() ?? Date.now() + Math.random().toString(36).slice(2, 7));

export const useDataManager = (isDemoMode: boolean, addToast: AddToast, currentUser: CurrentUser | null = null) => {
    // ─── Collections State ───
    const [students, setStudents] = useState<Student[]>([]);
    const [years, setYears] = useState<Year[]>([]);
    const [groups, setGroups] = useState<Group[]>([]);
    const [quizzes, setQuizzes] = useState<Quiz[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
    const [results, setResults] = useState<QuizResult[]>([]);
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [videoLessons, setVideoLessons] = useState<VideoLesson[]>([]);
    const [educationalSources, setEducationalSources] = useState<EducationalSource[]>([]);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [assistants, setAssistants] = useState<Assistant[]>([]);
    const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
    const [formulas, setFormulas] = useState<MathFormula[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [videoViews, setVideoViews] = useState<VideoView[]>([]);
    const [settings, setSettings] = useState<PlatformSettings>(INITIAL_SETTINGS);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const setterMap: Record<string, (v: any) => void> = {
        students: setStudents,
        years: setYears,
        groups: setGroups,
        quizzes: setQuizzes,
        assignments: setAssignments,
        submissions: setSubmissions,
        results: setResults,
        notifications: setNotifications,
        videoLessons: setVideoLessons,
        educationalSources: setEducationalSources,
        messages: setMessages,
        assistants: setAssistants,
        schedules: setSchedules,
        formulas: setFormulas,
        folders: setFolders,
        courses: setCourses,
        videoViews: setVideoViews,
    };

    // ─── Firebase Subscriptions ───
    useEffect(() => {
        if (isDemoMode) {
            // Seed demo data
            if (students.length === 0) {
                setStudents([
                    {
                        id: 's_demo_1', name: 'أحمد المتفوق', studentCode: 'M3-123',
                        studentPhone: '01000000000', parentPhone: '01100000000',
                        yearId: 'y1', groupId: 'g1', attendance: false, score: 950,
                        points: 1000, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ahmed',
                        scoreHistory: [80, 85, 90], status: 'active', badges: [], streaks: 15, deviceIds: []
                    },
                    {
                        id: 's_demo_2', name: 'سارة الدكتورة', studentCode: 'M3-124',
                        studentPhone: '01000000000', parentPhone: '01100000000',
                        yearId: 'y1', groupId: 'g1', attendance: false, score: 850,
                        points: 900, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sara',
                        scoreHistory: [70, 75, 80], status: 'active', badges: [], streaks: 10, deviceIds: []
                    },
                    {
                        id: 's_demo_3', name: 'ياسين العبقري', studentCode: 'M3-125',
                        studentPhone: '01000000000', parentPhone: '01100000000',
                        yearId: 'y1', groupId: 'g1', attendance: false, score: 750,
                        points: 800, avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Yassin',
                        scoreHistory: [60, 65, 70], status: 'active', badges: [], streaks: 8, deviceIds: []
                    }
                ]);
            }
            if (years.length === 0) setYears([{ id: 'y1', name: 'الصف الثالث الثانوي' }]);
            if (groups.length === 0) setGroups([{ id: 'g1', name: 'مجموعة التميز (أ)', yearId: 'y1', time: 'السبت 10 ص', joinCode: 'G1', type: 'center', gender: 'mixed' }]);
            if (videoLessons.length === 0) setVideoLessons([{
                id: 'v1', title: 'أساسيات الميكانيكا - الدرس الأول', youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
                yearId: 'y1', uploadDate: new Date().toISOString(), provider: 'youtube', subject: 'الفيزياء'
            }]);
            if (courses.length === 0) setCourses([{
                id: 'c1', title: 'كورس الفيزياء المتكامل', description: 'شرح وافي لمنهج الفيزياء',
                yearId: 'y1', createdAt: new Date().toISOString(),
                modules: [{ id: 'm1', title: 'الباب الأول', items: ['v1'] }]
            }]);
            return;
        }

        // Online: Settings subscription is always needed
        const unsubSettings = subscribeToCollection('settings', (data) => {
            if (data[0]) {
                setSettings(prev => ({
                    ...INITIAL_SETTINGS, ...data[0] as PlatformSettings,
                    branding: { ...INITIAL_SETTINGS.branding, ...(data[0].branding || {}) },
                    contentTexts: { ...INITIAL_SETTINGS.contentTexts, ...(data[0].contentTexts || {}) },
                    featureConfig: { ...INITIAL_SETTINGS.featureConfig, ...(data[0].featureConfig || {}) },
                }));
            } else setSettings(INITIAL_SETTINGS);
        });

        if (!currentUser) {
            // Unauthenticated: only need years and groups for registration/login
            const unsubs = ['groups', 'years'].map(col =>
                subscribeToCollection(col, (data) => {
                    const setter = setterMap[col];
                    if (setter) setter(data);
                })
            );
            return () => { unsubs.forEach(u => u?.()); unsubSettings?.(); };
        }

        const role = currentUser.role;
        const baseCollections = ['years', 'groups', 'courses', 'educationalSources', 'videoLessons', 'quizzes', 'assignments', 'schedules', 'formulas', 'folders'];
        const teacherCollections = ['students', 'submissions', 'results', 'notifications', 'messages', 'assistants', 'videoViews'];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const unsubs: any[] = [];

        // Base collections for everyone
        baseCollections.forEach(col => {
            unsubs.push(subscribeToCollection(col, (data) => {
                const setter = setterMap[col];
                if (setter) setter(data);
            }));
        });

        if (role === 'teacher' || role === 'assistant') {
            teacherCollections.forEach(col => {
                unsubs.push(subscribeToCollection(col, (data) => {
                    const setter = setterMap[col];
                    if (setter) setter(data);
                }));
            });
        } else if (role === 'student' || role === 'parent') {
            const studentId = currentUser.id;
            
            unsubs.push(subscribeToCollection('notifications', setNotifications));
            unsubs.push(subscribeToCollection('messages', setMessages));

            // Scaled collections: Submissions, Results, VideoViews only for this student
            unsubs.push(subscribeToCollection('submissions', setSubmissions, { field: 'studentId', value: studentId }));
            unsubs.push(subscribeToCollection('results', setResults, { field: 'studentId', value: studentId }));
            unsubs.push(subscribeToCollection('videoViews', setVideoViews, { field: 'studentId', value: studentId }));
            
            // Only load students from the same year for leaderboard (reduces load significantly)
            if (currentUser.yearId) {
                unsubs.push(subscribeToCollection('students', setStudents, { field: 'yearId', value: currentUser.yearId }));
            }
        }

        return () => {
            unsubs.forEach(u => u?.());
            unsubSettings?.();
        };
    }, [isDemoMode, currentUser]);

    // Save settings to localStorage in demo mode
    useEffect(() => {
        if (isDemoMode) {
            try { localStorage.setItem('math_settings', JSON.stringify(settings)); } catch { /* ignore quota */ }
        }
    }, [settings, isDemoMode]);

    // ─── Generic CRUD ───
    const persistData = async (
        collection: string,
        data: any,
        action: 'save' | 'update' | 'delete' = 'save'
    ) => {
        if (isDemoMode) {
            const setter = setterMap[collection];
            if (!setter) return;
            if (action === 'save') setter((prev: any[]) => [...prev, data]);
            if (action === 'update') setter((prev: any[]) => prev.map((item: any) => item.id === data.id ? { ...item, ...data } : item));
            if (action === 'delete') setter((prev: any[]) => prev.filter((item: any) => item.id !== data));
        } else {
            try {
                if (action === 'save') await saveData(collection, data);
                if (action === 'update') await updatePartialData(collection, data.id, data);
                if (action === 'delete') await removeData(collection, data);
            } catch {
                if (collection !== 'videoViews') addToast('حدث خطأ في حفظ البيانات', 'error');
            }
        }
    };

    // ─── Video Progress Tracker ───
    const handleVideoProgress = (videoId: string, percent: number, studentId: string) => {
        const existing = videoViews.find(v => v.studentId === studentId && v.videoId === videoId);
        if (existing) {
            if (percent > existing.watchedPercent) {
                const updated = { ...existing, watchedPercent: percent, lastWatched: new Date().toISOString() };
                persistData('videoViews', updated, 'update');
                setVideoViews(prev => prev.map(v => v.id === existing.id ? updated : v));
            }
        } else {
            const newView: VideoView = {
                id: genId('view_'), studentId, videoId,
                watchedPercent: percent, lastWatched: new Date().toISOString()
            };
            persistData('videoViews', newView, 'save');
            setVideoViews(prev => [...prev, newView]);
        }
    };

    return {
        // State
        students, years, groups, quizzes, assignments, submissions, results,
        notifications, videoLessons, educationalSources, messages, assistants,
        schedules, formulas, folders, courses, videoViews, settings,
        // Setters (for direct use when needed)
        setStudents, setYears, setGroups, setSettings,
        // Actions
        persistData,
        handleVideoProgress,
    };
};
