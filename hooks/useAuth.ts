import { useState } from 'react';
import { Student, Assistant, Year, PlatformSettings, CurrentUser, ToastType } from '../types';
import { saveData, updatePartialData, queryByField } from '../services/firebaseService';
import { logAction } from '../services/auditService';

type AddToast = (message: string, type: ToastType) => void;

interface UseAuthOptions {
    isDemoMode: boolean;
    addToast: AddToast;
}

export const useAuth = ({
    isDemoMode, addToast
}: UseAuthOptions) => {
    const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

    // --- Helper: Safe LocalStorage ---
    const safeSetItem = (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (e) {
            console.warn(`Failed to save ${key} to localStorage`, e);
        }
    };

    // --- Helper: Device Fingerprint ---
    const getDeviceId = (): string => {
        let id = localStorage.getItem('mm_device_id');
        if (!id) {
            id = 'dev_' + Date.now() + Math.random().toString(36).slice(2, 11);
            localStorage.setItem('mm_device_id', id);
        }
        return id;
    };

    // --- Load persisted user from localStorage ---
    const loadPersistedUser = () => {
        try {
            const saved = localStorage.getItem('math_user');
            if (saved) {
                const parsed = JSON.parse(saved) as CurrentUser;
                setCurrentUser(parsed);
                return parsed;
            }
        } catch (e) {
            console.error('Error loading persisted user', e);
        }
        return null;
    };

    // --- Unified Login ---
    const handleUnifiedLogin = async (
        role: 'student' | 'teacher' | 'parent', 
        code: string,
        studentsData: Student[] = [],
        globalSettings: any = {}
    ): Promise<boolean> => {
        const cleanCode = code.trim();

        const adminCode = globalSettings.adminCode || 'admin123';
        const teacherName = globalSettings.teacherName || 'المعلم';
        const maxDevicesPerStudent = globalSettings.maxDevicesPerStudent || 2;

        // ─── Teacher / Assistant ───
        if (role === 'teacher') {
            if (cleanCode === adminCode) {
                const user: CurrentUser = { id: 'teacher', name: teacherName, role: 'teacher' };
                setCurrentUser(user);
                safeSetItem('math_user', { id: user.id, name: user.name, role: user.role });
                addToast('تم تسجيل دخول المعلم بنجاح', 'success');
                logAction('teacher', teacherName, 'login', 'دخول معلم');
                if (!isDemoMode) saveData('settings', { id: 'global_settings' });
                return true;
            } else {
                const results = await queryByField('assistants', 'code', cleanCode);
                const assistant = results[0];
                if (assistant) {
                    const user: CurrentUser = { ...assistant, role: 'assistant' };
                    setCurrentUser(user);
                    safeSetItem('math_user', { id: user.id, name: user.name, role: user.role, permissions: user.permissions });
                    addToast(`مرحباً ${assistant.name}`, 'success');
                    logAction(assistant.id, assistant.name, 'login', 'دخول مساعد');
                    return true;
                } else {
                    addToast('كود المعلم غير صحيح', 'error');
                    logAction('unknown', 'unknown', 'login_failed', `كود خاطئ: ${cleanCode}`);
                    return false;
                }
            }
        }

        // ─── Guest Student ───
        if (role === 'student' && (cleanCode === 'guest' || cleanCode === 'guest_login')) {
            const guest: CurrentUser = { id: 'guest', name: 'زائر', role: 'student', yearId: 'y1' };
            setCurrentUser(guest);
            return true;
        }

        // ─── Student ───
        if (role === 'student') {
            const student = studentsData.find(s => s.studentCode === cleanCode);
            if (!student) {
                addToast(`كود الطالب "${cleanCode}" غير موجود`, 'error');
                return false;
            }

            if (student.status === 'pending') {
                addToast('حسابك قيد المراجعة من قبل الإدارة', 'info');
                return false;
            }

            // Device Lock
            const deviceId = getDeviceId();
            const existing = student.deviceIds || [];

            if (!existing.includes(deviceId) && existing.length >= maxDevicesPerStudent) {
                addToast(`⛔ تم تجاوز الحد المسموح للأجهزة (${existing.length}/${maxDevicesPerStudent}). تواصل مع الإدارة.`, 'error');
                return false;
            }

            const updatedDeviceIds = existing.includes(deviceId) ? existing : [...existing, deviceId];
            if (!existing.includes(deviceId)) {
                if (isDemoMode) {
                   // local update simulation not strictly needed since it's demo, but we can do it if needed
                } else {
                   await updatePartialData('students', student.id, { deviceIds: updatedDeviceIds });
                }
            }

            const user: CurrentUser = { ...student, role: 'student', deviceIds: updatedDeviceIds };
            setCurrentUser(user);
            // Only store minimal info in localStorage
            safeSetItem('math_user', {
                id: student.id, name: student.name, role: 'student',
                yearId: student.yearId, groupId: student.groupId, studentCode: student.studentCode,
                isPaid: student.isPaid
            });
            addToast('تم تسجيل الدخول بنجاح', 'success');
            logAction(student.id, student.name, 'login', `كود: ${student.studentCode}`);
            return true;
        }

        // ─── Parent ───
        if (role === 'parent') {
            const student = studentsData.find(s => s.parentPhone === cleanCode);
            if (student) {
                const user: CurrentUser = { ...student, role: 'parent' };
                setCurrentUser(user);
                safeSetItem('math_user', { id: student.id, name: student.name, role: 'parent', yearId: student.yearId });
                addToast('تم تسجيل دخول ولي الأمر', 'success');
                return true;
            } else {
                addToast('رقم الهاتف غير مسجل في النظام', 'error');
                return false;
            }
        }

        return false;
    };

    // --- Logout ---
    const handleLogout = (setCurrentView: (v: any) => void, defaultView: any) => {
        if (currentUser) {
            logAction(currentUser.id, currentUser.name || 'مستخدم', 'logout', `خروج ${currentUser.role}`);
        }
        setCurrentUser(null);
        localStorage.removeItem('math_user');
        setCurrentView(defaultView);
    };

    return {
        currentUser,
        setCurrentUser,
        handleUnifiedLogin,
        handleLogout,
        loadPersistedUser,
    };
};
