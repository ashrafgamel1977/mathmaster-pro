/**
 * auditService.ts — Audit Log مستوحى من audit_log table في منصة نور
 * يُسجّل كل الأحداث الحساسة في Firestore
 */
import { db } from '../firebaseConfig';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { getTenantId } from './tenantService';
import { genId } from '../hooks/useDataManager';

export type AuditAction =
    | 'login'
    | 'logout'
    | 'login_failed'
    | 'student_add'
    | 'student_delete'
    | 'student_reset_device'
    | 'quiz_publish'
    | 'quiz_delete'
    | 'assignment_add'
    | 'settings_change'
    | 'tenant_create'
    | 'tenant_suspend'
    | 'invite_code_create'
    | 'invite_code_use';

export interface AuditEntry {
    id?: string;
    tenantId: string;
    userId: string;
    userName: string;
    action: AuditAction;
    details?: string;
    ip?: string;
    createdAt: string;
}

// ─── Log Action ──────────────────────────────────────────
export const logAction = async (
    userId: string,
    userName: string,
    action: AuditAction,
    details?: string
): Promise<void> => {
    const entry: AuditEntry = {
        tenantId: getTenantId(),
        userId,
        userName,
        action,
        details,
        createdAt: new Date().toISOString(),
    };

    // Save to Firestore if online
    if (db) {
        try {
            await addDoc(collection(db, 'audit_log'), entry);
            return;
        } catch (e) {
            console.warn('Audit log write failed, saving locally', e);
        }
    }

    // Fallback: localStorage ring buffer (last 100 events)
    try {
        const existing: AuditEntry[] = JSON.parse(localStorage.getItem('mm_audit_log') || '[]');
        existing.unshift({ ...entry, id: genId('audit_') });
        if (existing.length > 100) existing.pop();
        localStorage.setItem('mm_audit_log', JSON.stringify(existing));
    } catch { /* ignore quota errors */ }
};

// ─── Get Audit Log (for admin view) ──────────────────────
export const getAuditLog = async (limitCount = 50): Promise<AuditEntry[]> => {
    if (db) {
        try {
            const q = query(
                collection(db, 'audit_log'),
                where('tenantId', '==', getTenantId()),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as AuditEntry));
        } catch (e) {
            console.warn('Audit log read failed', e);
        }
    }

    // Fallback: localStorage
    try {
        const local: AuditEntry[] = JSON.parse(localStorage.getItem('mm_audit_log') || '[]');
        return local.slice(0, limitCount);
    } catch {
        return [];
    }
};

// ─── Action Labels (for UI display) ──────────────────────
export const AUDIT_LABELS: Record<AuditAction, string> = {
    login: '🔐 دخول ناجح',
    logout: '🚪 خروج',
    login_failed: '❌ محاولة دخول فاشلة',
    student_add: '➕ إضافة طالب',
    student_delete: '🗑️ حذف طالب',
    student_reset_device: '📱 تصفير أجهزة طالب',
    quiz_publish: '📝 نشر اختبار',
    quiz_delete: '🗑️ حذف اختبار',
    assignment_add: '📋 إضافة واجب',
    settings_change: '⚙️ تعديل الإعدادات',
    tenant_create: '🏫 إنشاء منصة',
    tenant_suspend: '⛔ تعليق منصة',
    invite_code_create: '🎟️ إنشاء كود دعوة',
    invite_code_use: '✅ استخدام كود دعوة',
};
