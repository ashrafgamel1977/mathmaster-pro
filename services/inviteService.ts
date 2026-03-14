/**
 * inviteService.ts — نظام كودات الدعوة
 * مستوحى من InviteSystem class في Noor's security.py
 *
 * كل طالب يحتاج كود دعوة فريد للتسجيل.
 * الكود يُستخدم مرة واحدة فقط ومرتبط بمجموعة/فترة محددة.
 */
import { db } from '../firebaseConfig';
import {
    collection, addDoc, getDocs, query, where,
    updateDoc, doc, Timestamp
} from 'firebase/firestore';
import { getTenantId } from './tenantService';
import { genId } from '../hooks/useDataManager';
import { logAction } from './auditService';

export interface InviteCode {
    id?: string;
    tenantId: string;
    code: string;           // مثل: MM-A3F7-K2X9
    groupId: string;        // المجموعة المرتبطة به
    groupName: string;      // للعرض
    createdBy: string;      // userId للمعلم
    expiresAt?: string;     // ISO date
    isUsed: boolean;
    usedBy?: string;        // studentId
    usedAt?: string;
    createdAt: string;
}

// ─── Generate Codes ───────────────────────────────────────
/**
 * ينشئ عدداً من كودات الدعوة لمجموعة معينة
 */
export const generateInviteCodes = async (
    groupId: string,
    groupName: string,
    createdBy: string,
    count: number = 10,
    expiresInDays: number = 30
): Promise<InviteCode[]> => {
    const tenantId = getTenantId();
    const codes: InviteCode[] = [];
    const expiresAt = expiresInDays > 0
        ? new Date(Date.now() + expiresInDays * 86400_000).toISOString()
        : undefined;

    for (let i = 0; i < count; i++) {
        const raw = Math.random().toString(36).slice(2, 10).toUpperCase();
        const code: InviteCode = {
            tenantId,
            code: `MM-${raw.slice(0, 4)}-${raw.slice(4, 8)}`,
            groupId,
            groupName,
            createdBy,
            expiresAt,
            isUsed: false,
            createdAt: new Date().toISOString(),
        };
        codes.push(code);
    }

    // Save to Firestore
    if (db) {
        try {
            const saved = await Promise.all(
                codes.map(c => addDoc(collection(db, 'inviteCodes'), c))
            );
            saved.forEach((ref, i) => { codes[i].id = ref.id; });
        } catch (e) {
            console.warn('Invite codes save failed (offline mode)', e);
            // Fallback: localStorage
            const local = _getLocalCodes();
            codes.forEach(c => { c.id = genId('inv_'); local.push(c); });
            _saveLocalCodes(local);
        }
    } else {
        const local = _getLocalCodes();
        codes.forEach(c => { c.id = genId('inv_'); local.push(c); });
        _saveLocalCodes(local);
    }

    await logAction(createdBy, 'Admin', 'invite_code_create', `${count} كودات لمجموعة ${groupName}`);
    return codes;
};

// ─── Verify + Redeem Code ────────────────────────────────
export interface VerifyResult {
    valid: boolean;
    reason?: string;
    groupId?: string;
    groupName?: string;
    inviteId?: string;
}

export const redeemInviteCode = async (
    inputCode: string,
    studentId: string,
    studentName: string
): Promise<VerifyResult> => {
    const tenantId = getTenantId();
    const code = inputCode.trim().toUpperCase();

    // Search Firestore
    if (db) {
        try {
            const q = query(
                collection(db, 'inviteCodes'),
                where('tenantId', '==', tenantId),
                where('code', '==', code)
            );
            const snap = await getDocs(q);

            if (snap.empty) return { valid: false, reason: 'الكود غير موجود أو غير صحيح' };

            const ref = snap.docs[0];
            const data = ref.data() as InviteCode;

            if (data.isUsed) return { valid: false, reason: 'هذا الكود استُخدم مسبقاً — كل كود لطالب واحد فقط' };
            if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
                return { valid: false, reason: 'انتهت صلاحية الكود — تواصل مع المعلم للحصول على كود جديد' };
            }

            // Mark as used
            await updateDoc(doc(db, 'inviteCodes', ref.id), {
                isUsed: true,
                usedBy: studentId,
                usedAt: new Date().toISOString(),
            });

            await logAction(studentId, studentName, 'invite_code_use', `كود: ${code}`);
            return { valid: true, groupId: data.groupId, groupName: data.groupName, inviteId: ref.id };
        } catch (e) {
            console.warn('Invite code verify failed', e);
        }
    }

    // Fallback: localStorage
    return _redeemLocal(code, studentId, studentName);
};

// ─── Get Codes for Admin View ────────────────────────────
export const getInviteCodes = async (groupId?: string): Promise<InviteCode[]> => {
    const tenantId = getTenantId();
    if (db) {
        try {
            const conditions = [where('tenantId', '==', tenantId)];
            if (groupId) conditions.push(where('groupId', '==', groupId));
            const snap = await getDocs(query(collection(db, 'inviteCodes'), ...conditions));
            return snap.docs.map(d => ({ ...d.data(), id: d.id } as InviteCode));
        } catch { /**/ }
    }
    const local = _getLocalCodes();
    return groupId ? local.filter(c => c.groupId === groupId) : local;
};

// ─── Local Storage helpers ────────────────────────────────
const _getLocalCodes = (): InviteCode[] => {
    try { return JSON.parse(localStorage.getItem('mm_invite_codes') || '[]'); }
    catch { return []; }
};
const _saveLocalCodes = (codes: InviteCode[]) => {
    try { localStorage.setItem('mm_invite_codes', JSON.stringify(codes)); } catch { /**/ }
};
const _redeemLocal = async (code: string, studentId: string, studentName: string): Promise<VerifyResult> => {
    const local = _getLocalCodes();
    const idx = local.findIndex(c => c.code === code);
    if (idx < 0) return { valid: false, reason: 'الكود غير موجود' };
    const entry = local[idx];
    if (entry.isUsed) return { valid: false, reason: 'هذا الكود استُخدم مسبقاً' };
    if (entry.expiresAt && new Date(entry.expiresAt) < new Date()) return { valid: false, reason: 'انتهت صلاحية الكود' };
    local[idx] = { ...entry, isUsed: true, usedBy: studentId, usedAt: new Date().toISOString() };
    _saveLocalCodes(local);
    await logAction(studentId, studentName, 'invite_code_use', `كود: ${code}`);
    return { valid: true, groupId: entry.groupId, groupName: entry.groupName };
};
