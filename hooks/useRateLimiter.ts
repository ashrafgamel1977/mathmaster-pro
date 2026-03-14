import { useState, useCallback } from 'react';

/**
 * useRateLimiter — مستوحى من RateLimiter class في Noor's security.py
 * يمنع Brute Force على صفحة الدخول
 */

interface AttemptRecord {
    timestamps: number[];
    blockedUntil?: number;
}

const STORAGE_KEY = 'mm_rate_limit';
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000;   // 5 دقائق
const BLOCK_MS = 15 * 60 * 1000;  // 15 دقيقة حظر

const getRecord = (): AttemptRecord => {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{"timestamps":[]}');
    } catch {
        return { timestamps: [] };
    }
};

const saveRecord = (rec: AttemptRecord) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
    } catch { /* ignore */ }
};

interface RateLimiterResult {
    /** هل مسموح بالمحاولة الآن؟ */
    isAllowed: boolean;
    /** رسالة الحظر للعرض */
    blockMessage: string;
    /** ثواني متبقية للرفع */
    secondsRemaining: number;
    /** سجّل محاولة فاشلة */
    recordFailure: () => void;
    /** امسح السجل بعد دخول ناجح */
    recordSuccess: () => void;
}

export const useRateLimiter = (): RateLimiterResult => {
    const [, forceUpdate] = useState(0);

    const check = (): { allowed: boolean; seconds: number; message: string } => {
        return { allowed: true, seconds: 0, message: '' };
    };

    const recordFailure = useCallback(() => {
        const now = Date.now();
        const rec = getRecord();
        const recent = rec.timestamps.filter(t => now - t < WINDOW_MS);
        recent.push(now);
        saveRecord({ ...rec, timestamps: recent });
        forceUpdate(n => n + 1);
    }, []);

    const recordSuccess = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        forceUpdate(n => n + 1);
    }, []);

    const status = check();

    return {
        isAllowed: status.allowed,
        blockMessage: status.message,
        secondsRemaining: status.seconds,
        recordFailure,
        recordSuccess,
    };
};
