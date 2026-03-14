import { useState, useEffect } from 'react';
import {
    Tenant, resolveSlug, loadTenant, getCurrentTenant, getTenantId, getCurrentPlan, TenantPlan
} from '../services/tenantService';
import { INITIAL_SETTINGS } from '../constants';
import { PlatformSettings } from '../types';

interface UseTenantResult {
    tenant: Tenant | null;
    tenantId: string;
    isLoading: boolean;
    isExpired: boolean;
    plan: TenantPlan;
    /** الإعدادات مدمجة مع branding الـ tenant */
    tenantSettings: Partial<PlatformSettings>;
}

export const useTenant = (): UseTenantResult => {
    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        let mounted = true;
        const slug = resolveSlug();

        loadTenant(slug).then((result) => {
            if (!mounted) return;
            if (!result) {
                setIsExpired(true);
            } else {
                setTenant(result);
                // Apply tenant branding to document
                if (result.primaryColor) {
                    document.documentElement.style.setProperty('--tenant-primary', result.primaryColor);
                }
                if (result.name) {
                    document.title = result.name;
                }
            }
            setIsLoading(false);
        });

        return () => { mounted = false; };
    }, []);

    // Merge tenant branding with INITIAL_SETTINGS to create tenant-specific overrides
    const tenantSettings: Partial<PlatformSettings> = tenant ? {
        platformName: tenant.name,
        teacherName: tenant.ownerName,
        branding: {
            ...INITIAL_SETTINGS.branding,
            primaryColor: tenant.primaryColor ?? INITIAL_SETTINGS.branding.primaryColor,
            logoUrl: tenant.logoUrl ?? '',
            fontFamily: INITIAL_SETTINGS.branding.fontFamily,
            secondaryColor: INITIAL_SETTINGS.branding.secondaryColor,
            faviconUrl: INITIAL_SETTINGS.branding.faviconUrl,
            heroImageUrl: INITIAL_SETTINGS.branding.heroImageUrl,
        }
    } : {};

    return {
        tenant,
        tenantId: getTenantId(),
        isLoading,
        isExpired,
        plan: getCurrentPlan(),
        tenantSettings,
    };
};
