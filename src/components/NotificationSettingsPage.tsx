import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import DashboardLayout from './DashboardLayout';
import {
    getNotificationPreferences,
    updateNotificationPreferences,
    createPushSubscription,
    getGeneralNotificationPreference,
    updateGeneralMailNotificationStatus,
    CreateNotificationPreferenceDto
} from '../services/notificationApi';
import './auth/AuthPages.css';

// Utility to convert VAPID key
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/\-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

export default function NotificationSettingsPage() {
    const { t } = useTranslation();
    const { getValidToken } = useAuth();

    const [preferences, setPreferences] = useState<CreateNotificationPreferenceDto[]>([
        { notificationType: 'ProgressionEvent', isWebPushEnabled: false, isEmailEnabled: false }
    ]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [browserPermission, setBrowserPermission] = useState<string>('Notification' in window ? Notification.permission : 'denied');
    const [generalMailEnabled, setGeneralMailEnabled] = useState(true);

    useEffect(() => {
        const loadPreferences = async () => {
            const token = await getValidToken();
            if (!token) {
                setError(t('auth.sessionExpired', 'Session expired. Please log in again.'));
                setIsLoading(false);
                return;
            }

            try {
                const data = await getNotificationPreferences(token);
                if (data && data.length > 0) {
                    setPreferences(data.map(d => ({
                        notificationType: d.notificationType,
                        isWebPushEnabled: d.isWebPushEnabled,
                        isEmailEnabled: d.isEmailEnabled
                    })));
                }

                const isGeneralEnabled = await getGeneralNotificationPreference(token);
                setGeneralMailEnabled(isGeneralEnabled);
            } catch (err) {
                console.error('Failed to load preferences:', err);
                setError(t('settings.loadError', 'Failed to load settings.'));
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [getValidToken, t]);

    const handleToggle = async (index: number, field: 'isWebPushEnabled' | 'isEmailEnabled') => {
        if (field === 'isEmailEnabled' && !generalMailEnabled) {
            return; // Cannot toggle individual emails if general mail is disabled
        }
        
        if (field === 'isWebPushEnabled' && !preferences[index].isWebPushEnabled) {
            // User is enabling Web Push, request permission immediately triggered by their click
            if (!('Notification' in window)) {
                setError(t('settings.pushNotSupported', 'Push notifications are not supported by your browser.'));
                return;
            }
            if (Notification.permission !== 'granted') {
                try {
                    const permission = await Notification.requestPermission();
                    setBrowserPermission(permission);
                    if (permission !== 'granted') {
                        setError(t('settings.pushPermissionDenied', 'Permission for push notifications was denied.'));
                        return; // Stop toggle if denied
                    }
                } catch (err) {
                    setError(t('settings.pushPermissionDenied', 'Permission for push notifications was denied.'));
                    return;
                }
            }
        }

        setPreferences(prev => {
            const newPrefs = [...prev];
            newPrefs[index] = {
                ...newPrefs[index],
                [field]: !newPrefs[index][field]
            };
            return newPrefs;
        });
    };

    const subscribeToWebPush = async (token: string) => {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            throw new Error(t('settings.pushNotSupported', 'Push notifications are not supported by your browser.'));
        }

        if (Notification.permission !== 'granted') {
            throw new Error(t('settings.pushPermissionDenied', 'Permission for push notifications was denied.'));
        }

        // SW zaten vite-plugin-pwa tarafından kayıtlı, sadece ready olmasını bekle
        const registration = await navigator.serviceWorker.ready;

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        if (!vapidPublicKey) {
            console.error('VAPID public key is not set in environment.');
            return;
        }

        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: convertedVapidKey
        });

        // Convert keys to base64
        const p256dhBuffer = subscription.getKey('p256dh');
        const authBuffer = subscription.getKey('auth');

        if (!p256dhBuffer || !authBuffer) {
            throw new Error('Failed to get subscription keys.');
        }

        const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(p256dhBuffer))));
        const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(authBuffer))));

        await createPushSubscription(token, {
            endpoint: subscription.endpoint,
            p256dh,
            auth
        });
    };

    const handleEnableBrowserPush = async () => {
        if (!('Notification' in window)) {
            setError(t('settings.pushNotSupported', 'Push notifications are not supported by your browser.'));
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            setBrowserPermission(permission);
            if (permission === 'granted') {
                const token = await getValidToken();
                if (token) {
                    await subscribeToWebPush(token);
                    setSuccessMessage(t('settings.pushEnabledBrowser', 'Tarayıcı bildirimleri başarıyla açıldı! (Browser push enabled)'));
                }
            } else {
                setError(t('settings.pushPermissionDenied', 'Permission for push notifications was denied.'));
            }
        } catch (err) {
            setError(t('settings.pushPermissionDenied', 'Permission for push notifications was denied.'));
        }
    };

    const handleToggleGeneralMail = async () => {
        const token = await getValidToken();
        if (!token) return;
        setIsLoading(true);
        try {
            await updateGeneralMailNotificationStatus(token);
            const isGeneralEnabled = await getGeneralNotificationPreference(token);
            setGeneralMailEnabled(isGeneralEnabled);
            
            // Re-fetch preferences to make sure they match DB
            const data = await getNotificationPreferences(token);
            if (data && data.length > 0) {
                setPreferences(data.map(d => ({
                    notificationType: d.notificationType,
                    isWebPushEnabled: d.isWebPushEnabled,
                    isEmailEnabled: d.isEmailEnabled
                })));
            }

            setSuccessMessage(!generalMailEnabled 
                ? t('settings.generalMailEnabledMsg', 'Email notifications re-enabled.') 
                : t('settings.generalMailDisabledMsg', 'All email notifications disabled.')
            );
        } catch (err) {
            setError(t('settings.generalMailUpdateError', 'Failed to update email settings.'));
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async () => {
        const token = await getValidToken();
        if (!token) return;

        setIsSaving(true);
        setError(null);
        setSuccessMessage(null);

        try {
            await updateNotificationPreferences(token, preferences);

            // Check if any preference has web push enabled
            const webPushEnabled = preferences.some(p => p.isWebPushEnabled);
            if (webPushEnabled) {
                try {
                    await subscribeToWebPush(token);
                } catch (pushErr: any) {
                    console.error('Push subscription failed:', pushErr);
                    // Don't fail the whole save if just push subscription fails, but notify the user
                    setError(pushErr.message || t('settings.pushSetupError', 'Preferences saved, but push notification setup failed.'));
                }
            }

            if (!error) {
                setSuccessMessage(t('settings.saveSuccess', 'Preferences saved successfully!'));
            }
        } catch (err: any) {
            console.error('Save preferences failed:', err);
            setError(err.message || t('settings.saveError', 'Failed to save preferences.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <DashboardLayout title={t('nav.notificationSettings', 'Notification Settings')} isAdmin={false}>
            <div className="auth-container" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <div className="auth-card">
                    <div className="auth-header">
                        <h2>{t('nav.notificationSettings', 'Notification Settings')}</h2>
                        <p>{t('settings.notificationDesc', 'Manage how you receive updates and alerts.')}</p>
                    </div>

                    {isLoading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="spinner"></span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {error && <div className="auth-error" style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#f87171', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}
                            {successMessage && <div className="auth-success" style={{ padding: '12px', background: 'rgba(52, 211, 153, 0.1)', color: '#34d399', borderRadius: '8px', border: '1px solid rgba(52, 211, 153, 0.2)' }}>{successMessage}</div>}

                            <div style={{
                                background: 'rgba(15, 15, 30, 0.4)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '12px',
                                padding: '20px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '16px'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                    {t('settings.generalEmailSettings', 'General Email Settings')}
                                </h3>
                                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{t('settings.receiveAllEmails', 'Receive Emails')}</span>
                                        <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
                                            {t('settings.receiveAllEmailsDesc', 'Enable or disable all email notifications globally.')}
                                        </span>
                                    </div>
                                    <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}>
                                        <input
                                            type="checkbox"
                                            checked={generalMailEnabled}
                                            onChange={handleToggleGeneralMail}
                                            style={{ opacity: 0, width: 0, height: 0 }}
                                        />
                                        <span style={{
                                            position: 'absolute',
                                            top: 0, left: 0, right: 0, bottom: 0,
                                            background: generalMailEnabled ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                            borderRadius: '24px',
                                            transition: '0.3s',
                                            boxShadow: generalMailEnabled ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none'
                                        }}></span>
                                        <span style={{
                                            position: 'absolute',
                                            height: '18px', width: '18px',
                                            left: generalMailEnabled ? '22px' : '3px',
                                            bottom: '3px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            transition: '0.3s'
                                        }}></span>
                                    </div>
                                </label>
                                {!generalMailEnabled && (
                                    <div style={{ color: '#f87171', fontSize: '0.9rem', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                        {t('settings.allEmailsDisabledWarning', 'You have completely unsubscribed from all emails. To change your individual email settings, you need to turn email notifications back on.')}
                                    </div>
                                )}
                            </div>

                            {preferences.map((pref, index) => (
                                <div key={pref.notificationType || index} style={{
                                    background: 'rgba(15, 15, 30, 0.4)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '20px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                                        {pref.notificationType === 'ProgressionEvent' ? 'Progression Event' : pref.notificationType}
                                    </h3>

                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{t('settings.emailNotifications', 'Email Notifications')}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t('settings.emailDesc', 'Receive updates directly in your inbox.')}</span>
                                        </div>
                                        <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0, opacity: !generalMailEnabled ? 0.5 : 1 }}>
                                            <input
                                                type="checkbox"
                                                disabled={!generalMailEnabled}
                                                checked={pref.isEmailEnabled && generalMailEnabled}
                                                onChange={() => handleToggle(index, 'isEmailEnabled')}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: (pref.isEmailEnabled && generalMailEnabled) ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                                borderRadius: '24px',
                                                transition: '0.3s',
                                                boxShadow: (pref.isEmailEnabled && generalMailEnabled) ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none'
                                            }}></span>
                                            <span style={{
                                                position: 'absolute',
                                                height: '18px', width: '18px',
                                                left: (pref.isEmailEnabled && generalMailEnabled) ? '22px' : '3px',
                                                bottom: '3px',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                transition: '0.3s'
                                            }}></span>
                                        </div>
                                    </label>

                                    <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <span style={{ fontWeight: 500, color: '#e2e8f0' }}>{t('settings.pushNotifications', 'Web Push Notifications')}</span>
                                            <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t('settings.pushDesc', 'Receive notifications in your browser.')}</span>
                                        </div>
                                        <div style={{ position: 'relative', width: '44px', height: '24px', flexShrink: 0 }}>
                                            <input
                                                type="checkbox"
                                                checked={pref.isWebPushEnabled}
                                                onChange={() => handleToggle(index, 'isWebPushEnabled')}
                                                style={{ opacity: 0, width: 0, height: 0 }}
                                            />
                                            <span style={{
                                                position: 'absolute',
                                                top: 0, left: 0, right: 0, bottom: 0,
                                                background: pref.isWebPushEnabled ? '#8b5cf6' : 'rgba(255,255,255,0.1)',
                                                borderRadius: '24px',
                                                transition: '0.3s',
                                                boxShadow: pref.isWebPushEnabled ? '0 0 12px rgba(139, 92, 246, 0.4)' : 'none'
                                            }}></span>
                                            <span style={{
                                                position: 'absolute',
                                                height: '18px', width: '18px',
                                                left: pref.isWebPushEnabled ? '22px' : '3px',
                                                bottom: '3px',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                transition: '0.3s'
                                            }}></span>
                                        </div>
                                    </label>
                                </div>
                            ))}

                            {preferences.some(p => p.isWebPushEnabled) && browserPermission !== 'granted' && (
                                <div style={{
                                    marginTop: '8px',
                                    padding: '16px',
                                    background: 'rgba(245, 158, 11, 0.1)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div style={{ color: '#fbbf24', fontSize: '0.9rem' }}>
                                        {t('settings.browserPushWarning', 'Web Push ayarı açık fakat tarayıcı izin vermediği için bildirim alamıyorsunuz. Lütfen tarayıcıdan izin verin.')}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleEnableBrowserPush}
                                        style={{
                                            background: '#fbbf24',
                                            color: '#000',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '8px',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            width: 'fit-content'
                                        }}
                                    >
                                        {t('settings.enableInBrowser', 'Tarayıcıda Aç')}
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="auth-submit-btn"
                                style={{ marginTop: '12px' }}
                            >
                                {isSaving ? <span className="spinner"></span> : t('common.save', 'Save Changes')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
