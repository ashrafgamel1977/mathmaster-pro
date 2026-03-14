/**
 * tenantService.ts — Multi-tenancy engine for MathMaster Pro
 * كل معلم = Tenant مستقل بـ subdomain خاص، بيانات معزولة، وخطة اشتراك
 */
import { db } from '../firebaseConfig';
import {
    collection, doc, getDoc, getDocs, setDoc,
    query, where, Timestamp, updateDoc
} from 'firebase/firestore';
import { genId } from '../hooks/useDataManager';

// ─── Types ────────────────────────────────────────────────

export type PlanType = 'free' | 'starter' | 'pro' | 'unlimited';

export interface TenantPlan {
    id: PlanType;
    label: string;
    maxStudents: number;    // 0 = unlimited
    maxAssistants: number;
    maxStorage: number;     // MB
    features: string[];
    priceMonthly: number;   // EGP
}

export interface Tenant {
    id: string;
    slug: string;           // الـ subdomain identifier
    name: string;           // اسم المنصة
    ownerName: string;
    ownerEmail: string;
    plan: PlanType;
    isActive: boolean;
    createdAt: string;
    expiresAt?: string;     // انتهاء الاشتراك
    logoUrl?: string;
    primaryColor?: string;
    whatsappNumber?: string;
    superAdminCode?: string; // لدخول لوحة التحكم العامة
}

export const PLANS: Record<PlanType, TenantPlan> = {
    free: {
        id: 'free',
        label: 'مجاني',
        maxStudents: 30,
        maxAssistants: 0,
        maxStorage: 100,
        features: ['طلاب غير محدودين حتى 30', 'واجبات واختبارات', 'بدون PWA'],
        priceMonthly: 0,
    },
    starter: {
        id: 'starter',
        label: 'أساسي',
        maxStudents: 100,
        maxAssistants: 1,
        maxStorage: 500,
        features: ['100 طالب', 'مساعد واحد', 'PWA', 'تقارير أساسية'],
        priceMonthly: 149,
    },
    pro: {
        id: 'pro',
        label: 'احترافي',
        maxStudents: 500,
        maxAssistants: 5,
        maxStorage: 5000,
        features: ['500 طالب', '5 مساعدين', 'بنك الأسئلة', 'تقارير متقدمة', 'إدارة الرسوم'],
        priceMonthly: 299,
    },
    unlimited: {
        id: 'unlimited',
        label: 'غير محدود',
        maxStudents: 0,
        maxAssistants: 20,
        maxStorage: 50000,
        features: ['طلاب غير محدودين', '20 مساعد', 'كل الميزات', 'دعم مخصص'],
        priceMonthly: 599,
    },
};

// ─── Local Tenant Cache ───────────────────────────────────
let _currentTenant: Tenant | null = null;
let _tenantId: string = 'default';

// ─── Slug Resolver ───────────────────────────────────────
/**
 * استخراج slug الخاص بالمعلم من:
 * 1. URL param ?tenant=slug
 * 2. Subdomain: slug.mathmaster.app
 * 3. localStorage (لآخر tenant تم الدخول له)
 * 4. 'default' كقيمة افتراضية
 */
export const resolveSlug = (): string => {
    // 1. URL search param (للتطوير)
    const urlParams = new URLSearchParams(window.location.search);
    const paramSlug = urlParams.get('tenant');
    if (paramSlug) {
        localStorage.setItem('mm_tenant_slug', paramSlug);
        return paramSlug.toLowerCase();
    }

    // 2. Subdomain
    const host = window.location.hostname;
    const parts = host.split('.');
    if (parts.length >= 3 && !['www', 'app', 'localhost'].includes(parts[0])) {
        return parts[0].toLowerCase();
    }

    // 3. localStorage
    const saved = localStorage.getItem('mm_tenant_slug');
    if (saved) return saved.toLowerCase();

    // 4. Default
    return 'default';
};

// ─── Tenant Loader ────────────────────────────────────────
export const loadTenant = async (slug: string): Promise<Tenant | null> => {
    if (!db) {
        // Offline mode: return a demo tenant
        return _buildDemoTenant(slug);
    }

    try {
        const q = query(
            collection(db, 'tenants'),
            where('slug', '==', slug),
            where('isActive', '==', true)
        );
        const snap = await getDocs(q);

        if (snap.empty) {
            // Fallback: demo tenant
            if (slug === 'default') return _buildDemoTenant(slug);
            return null;
        }

        const data = snap.docs[0].data() as Tenant;
        _currentTenant = { ...data, id: snap.docs[0].id };
        _tenantId = _currentTenant.id;

        // Check expiry
        if (_currentTenant.expiresAt) {
            const expiry = new Date(_currentTenant.expiresAt);
            if (expiry < new Date()) {
                console.warn('⚠️ Tenant subscription expired');
                _currentTenant.isActive = false;
                return null;
            }
        }

        localStorage.setItem('mm_tenant_slug', slug);
        return _currentTenant;
    } catch (err) {
        console.error('Tenant load error:', err);
        return _buildDemoTenant(slug);
    }
};

// ─── Getters ──────────────────────────────────────────────
export const getCurrentTenant = (): Tenant | null => _currentTenant;
export const getTenantId = (): string => _tenantId;

export const getCurrentPlan = (): TenantPlan => {
    const plan = _currentTenant?.plan ?? 'free';
    return PLANS[plan];
};

// ─── Limit Checks (مثل check_student_limit في Noor) ──────
export const checkStudentLimit = async (currentCount: number): Promise<{ ok: boolean; message: string }> => {
    const plan = getCurrentPlan();
    if (plan.maxStudents === 0) return { ok: true, message: '' };

    if (currentCount >= plan.maxStudents) {
        return {
            ok: false,
            message: `وصلت للحد الأقصى (${plan.maxStudents} طالب) في خطة ${plan.label}. يرجى ترقية الاشتراك.`
        };
    }
    return { ok: true, message: '' };
};

// ─── Tenant CRUD (Super Admin) ────────────────────────────
export const createTenant = async (data: Omit<Tenant, 'id' | 'createdAt'>): Promise<string> => {
    if (!db) throw new Error('Firebase غير متصل');

    const id = genId('tenant_');
    const tenant: Tenant = {
        ...data,
        id,
        createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'tenants', id), tenant);
    return id;
};

export const updateTenant = async (id: string, updates: Partial<Tenant>): Promise<void> => {
    if (!db) throw new Error('Firebase غير متصل');
    await updateDoc(doc(db, 'tenants', id), updates as any);
};

export const getAllTenants = async (): Promise<Tenant[]> => {
    if (!db) return [_buildDemoTenant('default')];
    const snap = await getDocs(collection(db, 'tenants'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Tenant));
};

// ─── Demo Tenant (بدل Firebase في الوضع غير المتصل) ───────
function _buildDemoTenant(slug: string): Tenant {
    return {
        id: 'demo',
        slug,
        name: 'MathMaster Pro',
        ownerName: 'أشرف جميل',
        ownerEmail: 'admin@mathmaster.app',
        plan: 'pro',
        isActive: true,
        createdAt: new Date().toISOString(),
        primaryColor: '#2563eb',
    };
}
