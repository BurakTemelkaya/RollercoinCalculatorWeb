import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, UserProfile } from '../services/userProfileApi';
import { getNotificationPreferences, updateNotificationPreferences } from '../services/notificationApi';
import { SUPPORTED_LANGUAGES } from './MainLayout';
import './auth/AuthPages.css';

const PROMPT_DISMISSED_KEY = 'rollercoin_profile_prompt_dismissed';

interface FormProps {
    initial: UserProfile;
    showLanguage?: boolean;
    /** Popup'ta: güç düşüşü e-posta uyarısını buradan açabilme */
    showEnergyAlert?: boolean;
    onSaved?: (profile: UserProfile) => void;
    secondaryAction?: React.ReactNode;
}

/** Rollercoin kullanıcı adı, sıralama onayı ve (isteğe bağlı) bildirim dili formu. */
export function RollercoinProfileForm({ initial, showLanguage = false, showEnergyAlert = false, onSaved, secondaryAction }: FormProps) {
    const { t, i18n } = useTranslation();
    const { getValidToken } = useAuth();
    const [userName, setUserName] = useState(initial.rollercoinUserName ?? '');
    const [showInLeaderboard, setShowInLeaderboard] = useState(initial.showInLeaderboard);
    const [language, setLanguage] = useState(initial.preferredLanguage ?? i18n.language);
    const [energyAlert, setEnergyAlert] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = await getValidToken();
        if (!token) return;
        setIsSaving(true);
        setError(null);
        setSaved(false);
        try {
            const result = await updateUserProfile(token, {
                rollercoinUserName: userName.trim() || null,
                preferredLanguage: language,
                showInLeaderboard: !!userName.trim() && showInLeaderboard,
            });
            if (showEnergyAlert && energyAlert && result.rollercoinUserName) {
                // Diğer tercihleri koruyarak yalnızca enerji uyarısının e-postasını aç
                const prefs = (await getNotificationPreferences(token)).map(p => ({
                    notificationType: p.notificationType,
                    isWebPushEnabled: p.isWebPushEnabled,
                    isEmailEnabled: p.notificationType === 'EnergyRenewal' ? true : p.isEmailEnabled,
                }));
                if (!prefs.some(p => p.notificationType === 'EnergyRenewal')) {
                    prefs.push({ notificationType: 'EnergyRenewal', isWebPushEnabled: false, isEmailEnabled: true });
                }
                await updateNotificationPreferences(token, prefs);
            }
            setSaved(true);
            onSaved?.(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : t('profile.saveError', 'Failed to save.'));
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error" role="alert">{error}</div>}
            {saved && !onSaved && <div className="auth-success">{t('settings.saveSuccess', 'Preferences saved successfully!')}</div>}

            <div className="auth-field">
                <label htmlFor="rc-username">{t('profile.rollercoinUserName', 'Rollercoin username')}</label>
                <div className="auth-input-wrapper">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" className="auth-input-icon" aria-hidden="true">
                        <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
                    </svg>
                    <input
                        id="rc-username"
                        value={userName}
                        onChange={e => setUserName(e.target.value)}
                        placeholder={t('profile.rollercoinUserNamePlaceholder', 'your-name')}
                        autoComplete="off"
                        maxLength={64}
                        disabled={isSaving}
                    />
                </div>
                <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    {t('profile.rollercoinUserNameHint', 'The name in your Rollercoin profile link (rollercoin.com/p/...). Optional.')}
                </span>
            </div>

            <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: userName.trim() ? 'pointer' : 'not-allowed', color: '#e2e8f0', opacity: userName.trim() ? 1 : 0.5 }}>
                <input
                    type="checkbox"
                    checked={showInLeaderboard && !!userName.trim()}
                    disabled={isSaving || !userName.trim()}
                    onChange={e => setShowInLeaderboard(e.target.checked)}
                    style={{ marginTop: 3 }}
                />
                <span>
                    {t('profile.showInLeaderboard', 'Show my Rollercoin account in the site leaderboard')}
                    <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {t('profile.showInLeaderboardDesc', 'Your Rollercoin username and power will be publicly visible. Your email is never shown.')}
                    </span>
                </span>
            </label>

            {showEnergyAlert && (
                <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: userName.trim() ? 'pointer' : 'not-allowed', color: '#e2e8f0', opacity: userName.trim() ? 1 : 0.5 }}>
                    <input
                        type="checkbox"
                        checked={energyAlert && !!userName.trim()}
                        disabled={isSaving || !userName.trim()}
                        onChange={e => setEnergyAlert(e.target.checked)}
                        style={{ marginTop: 3 }}
                    />
                    <span>
                        {t('profile.energyAlert', 'Email me when my power starts decreasing')}
                        <span style={{ display: 'block', fontSize: '0.8rem', color: '#94a3b8' }}>
                            {t('profile.energyAlertDesc', 'At most once a day, for up to 3 days, if your energy is not renewed. You can change this in notification settings.')}
                        </span>
                    </span>
                </label>
            )}

            {showLanguage && (
                <div className="auth-field">
                    <label htmlFor="rc-language">{t('profile.emailLanguage', 'Language of automatic emails')}</label>
                    <select
                        id="rc-language"
                        value={language}
                        onChange={e => setLanguage(e.target.value)}
                        disabled={isSaving}
                        style={{ padding: '12px 14px', background: 'rgba(15, 15, 30, 0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#f1f5f9', fontSize: '0.95rem' }}
                    >
                        {SUPPORTED_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                    </select>
                </div>
            )}

            <button type="submit" className="auth-submit-btn" disabled={isSaving}>
                {isSaving ? <span className="spinner" style={{ width: 16, height: 16 }} /> : t('profile.save', 'Save')}
            </button>
            {secondaryAction}
        </form>
    );
}

/** Bildirim ayarları sayfasındaki Rollercoin hesabı + mail dili kartı. */
export function RollercoinProfileCard() {
    const { t } = useTranslation();
    const { getValidToken } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
        getValidToken()
            .then(token => (token ? getUserProfile(token) : Promise.reject()))
            .then(setProfile)
            .catch(() => setFailed(true));
    }, [getValidToken]);

    return (
        <div style={{ background: 'rgba(15, 15, 30, 0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#f8fafc', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
                {t('profile.cardTitle', 'Rollercoin Account & Email Language')}
            </h3>
            {failed && <div className="auth-error">{t('settings.loadError', 'Failed to load settings.')}</div>}
            {!profile && !failed && <span className="spinner" />}
            {profile && <RollercoinProfileForm initial={profile} showLanguage />}
        </div>
    );
}

const SUGGEST_NEVER_KEY = 'rollercoin_profile_suggest_never';
const SUGGEST_DECLINED_KEY = 'rollercoin_profile_suggest_declined';

function readStorage(key: string): string | null {
    try { return localStorage.getItem(key); } catch { return null; }
}
function writeStorage(key: string, value: string) {
    try { localStorage.setItem(key, value); } catch { /* storage blocked */ }
}
function declinedNames(): string[] {
    try { return JSON.parse(readStorage(SUGGEST_DECLINED_KEY) ?? '[]'); } catch { return []; }
}

/**
 * Rollercoin kullanıcı adı kayıtlı olmayan giriş yapmış kullanıcılara:
 * - bir kez genel davet popup'ı,
 * - hesaplayıcıda bir kullanıcı adı kullandıklarında "hesabınıza kaydedelim mi?" önerisi
 *   (aynı ad reddedilirse tekrar sorulmaz, "Bir daha gösterme" ile tamamen kapanır).
 * Zorunlu değildir.
 */
export function RollercoinProfilePrompt() {
    const { t, i18n } = useTranslation();
    const { isAuthenticated, getValidToken } = useAuth();
    const [loaded, setLoaded] = useState<UserProfile | null>(null);
    const [shown, setShown] = useState<{ profile: UserProfile; suggestedName?: string } | null>(null);

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        (async () => {
            const token = await getValidToken();
            if (!token) return;
            try {
                const data = await getUserProfile(token);
                if (cancelled) return;
                setLoaded(data);
                if (!data.rollercoinUserName && readStorage(PROMPT_DISMISSED_KEY) !== '1') {
                    setShown({ profile: data });
                } else if (!data.preferredLanguage) {
                    // Eski kullanıcılar: otomatik mailler için mevcut site dilini kaydet
                    await updateUserProfile(token, { ...data, preferredLanguage: i18n.language });
                }
            } catch {
                // Profil alınamazsa popup gösterilmez
            }
        })();
        return () => { cancelled = true; };
    }, [isAuthenticated, getValidToken, i18n]);

    // Hesaplayıcı bir kullanıcı adını başarıyla çektiğinde (App.tsx) kaydetmeyi öner
    useEffect(() => {
        const onUsernameUsed = (event: Event) => {
            const name = (event as CustomEvent<string>).detail?.trim();
            if (!name || !loaded || loaded.rollercoinUserName || shown) return;
            if (readStorage(SUGGEST_NEVER_KEY) === '1' || declinedNames().includes(name.toLowerCase())) return;
            setShown({ profile: loaded, suggestedName: name });
        };
        window.addEventListener('rollercoin-username-used', onUsernameUsed);
        return () => window.removeEventListener('rollercoin-username-used', onUsernameUsed);
    }, [loaded, shown]);

    if (!shown) return null;
    const { profile, suggestedName } = shown;

    // Kapatınca dil burada kaydedilmez: hemen ardından yapılacak bir kayıt rate limit'e (10 sn) takılmasın.
    // Dil kayıtlı değilse bir sonraki sayfa yüklemesinde yukarıdaki efekt kaydeder.
    const close = () => {
        if (suggestedName) {
            writeStorage(SUGGEST_DECLINED_KEY, JSON.stringify([...declinedNames(), suggestedName.toLowerCase()]));
        } else {
            writeStorage(PROMPT_DISMISSED_KEY, '1');
        }
        setShown(null);
    };

    const neverAsk = () => {
        writeStorage(SUGGEST_NEVER_KEY, '1');
        writeStorage(PROMPT_DISMISSED_KEY, '1');
        setShown(null);
    };

    const linkButtonStyle = { background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 } as const;

    return (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="rc-profile-title" onClick={e => { if (e.target === e.currentTarget) close(); }}>
            <div className="modal-content" style={{ maxWidth: 460 }}>
                <div className="modal-header">
                    <h2 id="rc-profile-title" className="modal-title">
                        {suggestedName
                            ? t('profile.suggestTitle', 'Use this username in your account?')
                            : t('profile.promptTitle', 'Add your Rollercoin username')}
                    </h2>
                    <button className="close-btn" onClick={close} aria-label={t('profile.later', 'Later')}>✕</button>
                </div>
                <div style={{ padding: 20, overflowY: 'auto', maxHeight: 'calc(90vh - 80px)' }}>
                    <p style={{ color: '#94a3b8', margin: '0 0 16px', lineHeight: 1.5 }}>
                        {suggestedName
                            ? t('profile.suggestDesc', 'You used {{name}} in the calculator. Save it to your account to appear in the leaderboard and get notified when your power starts decreasing.', { name: suggestedName })
                            : t('profile.promptDesc', 'Link your Rollercoin account to appear in the leaderboard and to get notified when your power starts decreasing.')}
                    </p>
                    <RollercoinProfileForm
                        key={suggestedName ?? ''}
                        showEnergyAlert
                        initial={{ ...profile, rollercoinUserName: suggestedName ?? profile.rollercoinUserName, preferredLanguage: profile.preferredLanguage ?? i18n.language }}
                        onSaved={saved => { writeStorage(PROMPT_DISMISSED_KEY, '1'); setLoaded(saved); setShown(null); }}
                        secondaryAction={
                            <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
                                <button type="button" onClick={close} style={linkButtonStyle}>
                                    {suggestedName ? t('profile.no', 'No') : t('profile.later', 'Later')}
                                </button>
                                {suggestedName && (
                                    <button type="button" onClick={neverAsk} style={linkButtonStyle}>
                                        {t('profile.neverAsk', "Don't ask again")}
                                    </button>
                                )}
                            </div>
                        }
                    />
                </div>
            </div>
        </div>
    );
}
