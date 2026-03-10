import { PlatformSettings, AppView } from './types';

/**
 * القيم الافتراضية للإعدادات — مُصدَّرة هنا لتُستخدم في App.tsx و useDataManager
 */
export const INITIAL_SETTINGS: PlatformSettings = {
    teacherName: 'أشرف جميل',
    platformName: 'MathMaster Pro',
    teacherSpecialization: 'math',
    branches: ['عام'],
    adminCode: '1234',
    studentWelcomeMsg: 'أهلاً بك في منصة التفوق',
    parentWelcomeMsg: 'تابع مستوى ابنك لحظة بلحظة',
    protectionEnabled: true,
    watermarkEnabled: true,
    watermarkText: 'MathMaster Property',
    portalTheme: 'indigo',
    portalLayout: 'modern',
    liveSessionActive: false,
    liveSessionLink: '',
    liveSessionTitle: '',
    allowSelfRegistration: true,
    mathNotation: 'arabic',
    autoAttendanceEnabled: false,
    autoParentReportEnabled: false,
    enableChat: true,
    enableLeaderboard: true,
    examMode: false,
    integrityMode: false,
    maxDevicesPerStudent: 2,
    subscriptionEnabled: false,
    paymentInstructions: 'للاشتراك يرجى تحويل المبلغ عبر فودافون كاش على الرقم: 01000000000 ثم إرسال صورة التحويل هنا.',
    branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#f59e0b',
        fontFamily: 'Cairo',
        logoUrl: '',
        heroImageUrl: '',
        faviconUrl: ''
    },
    contentTexts: {
        landingTitle: 'بوابة الاحتراف في الرياضيات',
        landingSubtitle: 'المنصة التعليمية الأقوى للمرحلة الثانوية',
        studentWelcomeTitle: 'مرحباً يا بطل',
        studentWelcomeSubtitle: 'استعد لرحلة التفوق',
        dashboardTitle: 'لوحة التحكم'
    },
    dashboardWidgets: {
        showStats: true,
        showQuickActions: true,
        showLeaderboard: true,
        showTools: true
    },
    enabledViews: Object.values(AppView),
    featureConfig: {
        [AppView.STUDENT_PORTAL]: [
            { id: 'dashboard', label: 'الرئيسية', enabled: true },
            { id: 'courses', label: 'الكورسات', enabled: true },
            { id: 'library', label: 'دروسي', enabled: true },
            { id: 'assignments', label: 'واجباتي', enabled: true },
            { id: 'quizzes', label: 'امتحاناتي', enabled: true },
            { id: 'results', label: 'التقارير', enabled: true }
        ],
        [AppView.QUIZZES]: [
            { id: 'scanner', label: 'ماسح الورق', enabled: true },
            { id: 'editor', label: 'المحرر اليدوي', enabled: true },
            { id: 'external', label: 'روابط خارجية', enabled: true }
        ],
        [AppView.FILES]: [
            { id: 'videos', label: 'فيديوهات', enabled: true },
            { id: 'docs', label: 'كتب وملازم', enabled: true }
        ],
        [AppView.CHAT]: [
            { id: 'group', label: 'الساحة العامة', enabled: true },
            { id: 'private', label: 'مراسلة المعلم', enabled: true }
        ]
    }
};
