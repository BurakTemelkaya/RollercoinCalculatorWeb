import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../DashboardLayout';
import { SUPPORTED_LANGUAGES } from '../MainLayout';
import {
    CREATOR_LINK_KEYS, CreatorDetail, CreatorPricing, CreatorStatus, PaymentStatus, SaveCreatorInput,
    uploadCreatorLogo, uploadCreatorCover, previewSocialLogo, getCreatorPricing, getMyCreator, saveMyCreator, submitCreatorPayment,
    parseUtc,
} from '../../services/contentCreatorApi';
import { CreatorCard, PLATFORM_LABELS } from './CreatorShared';
import { CoinNetworkSelect, TxLink } from './CryptoPayment';
import CreatorVideoManager from './CreatorVideoManager';
import './Creators.css';

const emptyForm: SaveCreatorInput = { displayName: '', description: '', languages: [] };

const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));
const formatDate = (value?: string | null) => (value ? parseUtc(value).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

export default function MyCreatorPage() {
    const { t } = useTranslation();
    const { accessToken } = useAuth();
    const [creator, setCreator] = useState<CreatorDetail | null>(null);
    const [pricing, setPricing] = useState<CreatorPricing | null>(null);
    const [form, setForm] = useState<SaveCreatorInput>(emptyForm);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

    // Logo kaydetmeden önce seçilir: dosya ya da kanal sayfasındaki resim; kayıtla birlikte sunucuya gider
    const [logo, setLogo] = useState<{ mode: 'keep' | 'upload' | 'social'; file?: File; preview?: string; source?: string }>({ mode: 'keep' });
    useEffect(() => () => { if (logo.mode === 'upload' && logo.preview) URL.revokeObjectURL(logo.preview); }, [logo]);
    // Kapak: yeni dosya, kaldırma ya da dokunma; kayıtla birlikte gider
    const [cover, setCover] = useState<{ mode: 'keep' | 'upload' | 'remove'; file?: File; preview?: string }>({ mode: 'keep' });
    useEffect(() => () => { if (cover.preview) URL.revokeObjectURL(cover.preview); }, [cover]);

    const [payment, setPayment] = useState({ coin: '', network: '', amount: '', txHash: '' });

    const applyCreator = (data: CreatorDetail | null) => {
        setCreator(data);
        if (data) {
            // Onay bekleyen değişiklik varsa yayıncı onu düzenlemeye devam eder
            const source = data.pendingChanges ?? data;
            const links = Object.fromEntries(CREATOR_LINK_KEYS.map(key => [key, source[key] ?? '']));
            const languages = data.pendingChanges ? data.pendingChanges.languages.split(',').filter(Boolean) : data.languages;
            setForm({ displayName: source.displayName, description: source.description ?? '', languages, ...links });
        }
    };

    useEffect(() => {
        if (!accessToken) return;
        Promise.all([getMyCreator(accessToken), getCreatorPricing().catch(() => null)])
            .then(([mine, price]) => { applyCreator(mine); setPricing(price); })
            .catch(err => setMessage({ type: 'error', text: errorText(err) }))
            .finally(() => setLoading(false));
    }, [accessToken]);

    const run = async (action: () => Promise<void>, success: string | (() => string)) => {
        setBusy(true);
        setMessage(null);
        try {
            await action();
            setMessage({ type: 'ok', text: typeof success === 'function' ? success() : success });
        } catch (err) {
            setMessage({ type: 'error', text: errorText(err) });
        } finally {
            setBusy(false);
        }
    };

    const reload = async () => applyCreator(await getMyCreator(accessToken!));

    const onSave = (e: FormEvent) => {
        e.preventDefault();
        let sentForReview = false;
        run(async () => {
            const saved = await saveMyCreator(accessToken!, { ...form, useSocialAvatar: logo.mode === 'social', removeCover: cover.mode === 'remove' });
            applyCreator(saved);
            // Kayıt alındı ama engellendi: başarı yerine uyarı göster
            if (saved.isDuplicate && saved.status === CreatorStatus.Blocked)
                throw new Error(t('creators.duplicateBlocked', 'Bu kanal daha önce başka bir hesapla kayıt olmuş. Ücretsiz deneme verilmez; başvurun engellendi ve yöneticiye bildirildi.'));
            // Yeni başvuruda kayıt önce oluşur, logo ardından yüklenir
            if (logo.mode === 'upload' && logo.file) await uploadCreatorLogo(accessToken!, logo.file);
            if (cover.mode === 'upload' && cover.file) await uploadCreatorCover(accessToken!, cover.file);
            if (logo.mode === 'upload' || cover.mode === 'upload') await reload();
            setLogo({ mode: 'keep' });
            setCover({ mode: 'keep' });
            sentForReview = !!(await getMyCreator(accessToken!))?.pendingChanges;
        }, () => sentForReview
            ? t('creators.changesSent', 'Değişikliklerin onaya gönderildi. Onaylanana kadar sitede eski bilgilerin görünür.')
            : creator ? t('creators.saved', 'Profilin kaydedildi.') : t('creators.applied', 'Başvurun alındı. Admin onayından sonra yayına alınacak.'));
    };

    const onLogo = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > 1024 * 1024) {
            setMessage({ type: 'error', text: t('creators.logoTooBig', 'Logo en fazla 1 MB olabilir.') });
            return;
        }
        setMessage(null);
        setLogo({ mode: 'upload', file, preview: URL.createObjectURL(file) });
    };

    const onSocialLogo = async () => {
        setBusy(true);
        setMessage(null);
        try {
            const links = Object.fromEntries(CREATOR_LINK_KEYS.map(key => [key, form[key] || null]));
            const preview = await previewSocialLogo(accessToken!, links);
            if (preview) setLogo({ mode: 'social', preview: preview.imageDataUrl, source: preview.pageUrl });
            else setMessage({ type: 'error', text: t('creators.socialLogoNotFound', 'Kanal sayfalarında profil resmi bulunamadı. Logonu dosya olarak yükleyebilirsin.') });
        } catch (err) {
            setMessage({ type: 'error', text: errorText(err) });
        } finally {
            setBusy(false);
        }
    };

    const previewCreator = useMemo(() => ({
        ...form,
        id: 'preview',
        displayName: form.displayName || t('creators.displayName', 'Kanal / yayıncı adı'),
        avatarUrl: logo.preview ?? creator?.pendingChanges?.avatarUrl ?? creator?.avatarUrl ?? null,
        coverUrl: cover.mode === 'remove' ? null : cover.preview ?? (creator?.pendingChanges ? creator.pendingChanges.coverUrl : creator?.coverUrl) ?? null,
    }), [form, logo.preview, cover, creator?.pendingChanges, creator?.avatarUrl, creator?.coverUrl, t]);

    const onCover = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setMessage({ type: 'error', text: t('creators.coverTooBig', 'Kapak görseli en fazla 2 MB olabilir.') });
            return;
        }
        setMessage(null);
        setCover({ mode: 'upload', file, preview: URL.createObjectURL(file) });
    };
    const hasSocialLink = CREATOR_LINK_KEYS.some(key => key !== 'discordUrl' && form[key]);

    const onPayment = (e: FormEvent) => {
        e.preventDefault();
        run(async () => {
            await submitCreatorPayment(accessToken!, payment);
            setPayment({ coin: '', network: '', amount: '', txHash: '' });
            await reload();
        }, t('creators.paymentSent', 'Ödeme bildirimin alındı. Admin kontrol edip onaylayınca süren uzayacak.'));
    };

    const toggleLanguage = (code: string) =>
        setForm(f => ({ ...f, languages: f.languages.includes(code) ? f.languages.filter(l => l !== code) : [...f.languages, code] }));

    const isDuplicateBlocked = creator?.status === CreatorStatus.Blocked && creator.isDuplicate;
    const canPay = creator && creator.status !== CreatorStatus.Rejected && (creator.status !== CreatorStatus.Blocked || isDuplicateBlocked);

    const statusBanner = () => {
        if (!creator) return <div className="creator-alert creator-alert--info">{t('creators.notApplied', 'Henüz başvurmadın. Formu doldurup gönder; onaylandıktan sonra kanalın sitede sponsor olarak görünür.')}</div>;
        switch (creator.status) {
            case CreatorStatus.Pending:
                return <div className="creator-alert creator-alert--warn">{t('creators.statusPending', 'Başvurun admin onayı bekliyor.')}</div>;
            case CreatorStatus.Rejected:
                return <div className="creator-alert creator-alert--error">{t('creators.statusRejected', 'Başvurun reddedildi. Profilini düzeltip tekrar kaydedersen yeniden incelenir.')}{creator.adminNote && <><br />{creator.adminNote}</>}</div>;
            case CreatorStatus.Blocked:
                return isDuplicateBlocked
                    ? <div className="creator-alert creator-alert--error">{t('creators.statusDuplicate', 'Bu kanal daha önce başka bir hesapla kayıt oldu ve ücretsiz deneme hakkını kullandı. Tekrar ücretsiz deneme verilmez; yayına alınmak için ödeme yapman gerekir.')}</div>
                    : <div className="creator-alert creator-alert--error">{t('creators.statusBlocked', 'Yayıncı profilin engellendi. Site yöneticisiyle iletişime geç.')}{creator.adminNote && <><br />{creator.adminNote}</>}</div>;
            default:
                if (creator.isComplimentary) return <div className="creator-alert creator-alert--ok">{t('creators.statusComplimentary', 'Profilin yayında (ücretsiz).')}</div>;
                return creator.isLive
                    ? <div className="creator-alert creator-alert--ok">{t('creators.statusLive', { defaultValue: 'Profilin yayında. Bitiş: {{date}}', date: formatDate(creator.activeUntil) })}</div>
                    : <div className="creator-alert creator-alert--warn">{t('creators.statusExpired', 'Süren doldu; profilin şu an görünmüyor. Ödeme yapıp bildirerek yeniden yayına alabilirsin.')}</div>;
        }
    };

    return (
        <DashboardLayout title={t('creators.myCreator', 'Yayıncı Paneli')}>
            <div className="admin-content-card">
                <h1 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>{t('creators.myCreator', 'Yayıncı Paneli')}</h1>
                {loading ? <span className="spinner" /> : (
                    <>
                        {statusBanner()}
                        {creator?.pendingChanges && (
                            <div className="creator-alert creator-alert--warn">{t('creators.changesPending', 'Profil değişikliklerin admin onayı bekliyor. Onaylanana kadar sitede eski bilgilerin görünür; bu sırada düzenlemeye devam edebilirsin.')}</div>
                        )}
                        {creator?.status === CreatorStatus.Approved && creator.adminNote && (
                            <div className="creator-alert creator-alert--info">{t('creators.adminNote', 'Yönetici notu')}: {creator.adminNote}</div>
                        )}
                        {creator?.status === CreatorStatus.Approved && !creator.pendingChanges && (
                            <div className="creator-alert creator-alert--info">{t('creators.editNeedsReview', 'Profilinde yaptığın değişiklikler (isim, logo, linkler, açıklama, diller) yayına girmeden önce admin onayından geçer.')}</div>
                        )}
                        {message && <div className={`creator-alert creator-alert--${message.type}`} role="status">{message.text}</div>}

                        <form className="creator-panel-block" onSubmit={onSave}>
                            <h2>{creator ? t('creators.profile', 'Profil') : t('creators.application', 'Başvuru')}</h2>
                            <div className="creator-form">
                                <label className="creator-field">
                                    {t('creators.displayName', 'Kanal / yayıncı adı')} *
                                    <input required minLength={2} maxLength={50} value={form.displayName} onChange={e => setForm({ ...form, displayName: e.target.value })} />
                                </label>
                                <div className="creator-field">
                                    {t('creators.logo', 'Logo / profil resmi')}
                                    <div className="creator-logo-row">
                                        {previewCreator.avatarUrl
                                            ? <img className="creator-avatar" src={previewCreator.avatarUrl} alt="" width={48} height={48} />
                                            : <span className="creator-avatar creator-avatar--empty" style={{ width: 48, height: 48 }} aria-hidden="true">{(form.displayName || '?').charAt(0).toUpperCase()}</span>}
                                        {creator?.status !== CreatorStatus.Blocked && (
                                            <div className="creator-row-actions">
                                                <label className="creator-btn creator-btn--ghost" style={{ cursor: busy ? 'not-allowed' : 'pointer' }}>
                                                    {t('creators.uploadLogo', 'Logo yükle')}
                                                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden disabled={busy} onChange={onLogo} />
                                                </label>
                                                <button type="button" className="creator-btn creator-btn--ghost" disabled={busy || !hasSocialLink} onClick={onSocialLogo}
                                                    title={hasSocialLink ? undefined : t('creators.socialLogoNeedsLink', 'Önce bir kanal linki gir.')}>
                                                    {t('creators.socialLogo', 'Sosyal medyadan al')}
                                                </button>
                                                {logo.mode !== 'keep' && (
                                                    <button type="button" className="creator-btn creator-btn--ghost" onClick={() => setLogo({ mode: 'keep' })}>{t('creators.cancel', 'Vazgeç')}</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="creator-hint">
                                        {logo.mode === 'upload'
                                            ? t('creators.logoPendingUpload', 'Bu dosya kaydettiğinde yüklenecek.')
                                            : logo.mode === 'social'
                                                ? t('creators.logoPendingSocial', { defaultValue: 'Bu resim {{source}} sayfandan alındı; kaydettiğinde sunucumuza kaydedilecek.', source: logo.source })
                                                : t('creators.logoHint', 'PNG, JPG, WEBP veya GIF, en fazla 1 MB. Logo seçmezsen kanal sayfandaki profil resmi otomatik alınır.')}
                                    </span>
                                </div>
                                <div className="creator-field creator-field--wide">
                                    {t('creators.cover', 'Kapak (arka plan) görseli')}
                                    <div className="creator-cover-pick" style={previewCreator.coverUrl ? { backgroundImage: `url("${previewCreator.coverUrl}")` } : undefined}>
                                        {creator?.status !== CreatorStatus.Blocked && (
                                            <div className="creator-row-actions">
                                                <label className="creator-btn creator-btn--ghost" style={{ cursor: busy ? 'not-allowed' : 'pointer' }}>
                                                    {previewCreator.coverUrl ? t('creators.changeCover', 'Kapağı değiştir') : t('creators.uploadCover', 'Kapak yükle')}
                                                    <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden disabled={busy} onChange={onCover} />
                                                </label>
                                                {previewCreator.coverUrl && (
                                                    <button type="button" className="creator-btn creator-btn--ghost" onClick={() => setCover({ mode: 'remove' })}>{t('creators.removeCover', 'Kaldır')}</button>
                                                )}
                                                {cover.mode !== 'keep' && (
                                                    <button type="button" className="creator-btn creator-btn--ghost" onClick={() => setCover({ mode: 'keep' })}>{t('creators.cancel', 'Vazgeç')}</button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <span className="creator-hint">{cover.mode === 'upload'
                                        ? t('creators.coverPending', 'Bu görsel kaydettiğinde yüklenecek.')
                                        : t('creators.coverHint', 'İsteğe bağlı. Yatay görsel önerilir (ör. 1200×400), en fazla 2 MB. Yüklemezsen kartında sitenin renklerinde bir degrade görünür.')}</span>
                                </div>
                                <label className="creator-field creator-field--wide">
                                    {t('creators.description', 'Kısa açıklama')}
                                    <textarea maxLength={300} rows={2} value={form.description ?? ''} onChange={e => setForm({ ...form, description: e.target.value })} />
                                </label>
                                {CREATOR_LINK_KEYS.map(key => (
                                    <label className="creator-field" key={key}>
                                        {PLATFORM_LABELS[key]}
                                        <input type="url" placeholder="https://" value={form[key] ?? ''} onChange={e => setForm({ ...form, [key]: e.target.value })} />
                                    </label>
                                ))}
                                <div className="creator-field creator-field--wide">
                                    {t('creators.contentLanguages', 'İçerik ürettiğin diller')} *
                                    <div className="creator-lang-picks">
                                        {SUPPORTED_LANGUAGES.map(l => (
                                            <label key={l.value} className={`creator-lang-pick${form.languages.includes(l.value) ? ' active' : ''}`}>
                                                <input type="checkbox" checked={form.languages.includes(l.value)} onChange={() => toggleLanguage(l.value)} />
                                                {l.icon && <img src={l.icon} alt="" width={18} height={13} />}
                                                {l.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="creator-preview">
                                <span className="creator-eyebrow">{t('creators.cardPreview', 'Sitede böyle görünecek')}</span>
                                <CreatorCard key={previewCreator.avatarUrl ?? 'none'} creator={previewCreator} />
                            </div>
                            <p className="creator-empty" style={{ fontSize: '0.8rem', margin: '12px 0' }}>{t('creators.linksHint', 'En az bir kanal linki gerekli. Aynı kanalla ikinci bir hesaptan başvurulursa ücretsiz deneme verilmez ve başvuru engellenir.')}</p>
                            <button className="creator-btn" disabled={busy || form.languages.length === 0}>{creator ? t('creators.save', 'Kaydet') : t('creators.submitApplication', 'Başvuruyu gönder')}</button>
                        </form>

                        {canPay && pricing && (
                            <div className="creator-panel-block">
                                <h2>{t('creators.payment', 'Ödeme')}</h2>
                                <p style={{ color: 'var(--text-secondary)', marginTop: 0 }}>
                                    {t('creators.paymentHelp', { defaultValue: 'Aylık ücret {{price}}$. Aşağıdaki adreslerden birine bu tutarda kripto gönder, ardından işlem hash\'ini (TX) bildir. Admin kontrol edince her ay için 30 gün eklenir.', price: pricing.monthlyPriceUsd })}
                                </p>
                                {pricing.wallets.length === 0
                                    ? <div className="creator-alert creator-alert--warn">{t('creators.noWallets', 'Ödeme adresi henüz tanımlanmadı. Site yöneticisiyle iletişime geç.')}</div>
                                    : pricing.wallets.map(w => (
                                        <div className="creator-wallet" key={`${w.coin}-${w.network}-${w.address}`}>
                                            <strong>{w.coin}{w.network ? ` (${w.network})` : ''}</strong>
                                            <code>{w.address}</code>
                                            <button type="button" className="creator-btn creator-btn--ghost" onClick={() => navigator.clipboard?.writeText(w.address)}>{t('creators.copy', 'Kopyala')}</button>
                                        </div>
                                    ))}
                                <form className="creator-form" onSubmit={onPayment} style={{ marginTop: 16 }}>
                                    <CoinNetworkSelect
                                        required
                                        value={payment}
                                        onChange={v => setPayment(p => ({ ...p, coin: v.coin, network: v.network ?? '' }))}
                                        options={pricing.wallets.map(w => ({ coin: w.coin, network: w.network, hint: `${w.address.slice(0, 6)}…${w.address.slice(-4)}` }))}
                                    />
                                    <label className="creator-field">{t('creators.amount', 'Gönderilen tutar')} *<input required maxLength={50} placeholder="25 USDT" value={payment.amount} onChange={e => setPayment({ ...payment, amount: e.target.value })} /></label>
                                    <label className="creator-field creator-field--wide">{t('creators.txHash', 'İşlem hash (TX ID)')} *<input required minLength={8} maxLength={200} value={payment.txHash} onChange={e => setPayment({ ...payment, txHash: e.target.value })} /></label>
                                    <details className="creator-help creator-field--wide">
                                        <summary>{t('creators.txHelpTitle', 'TX (işlem hash) nedir, nereden bulurum?')}</summary>
                                        <p>{t('creators.txHelpWhat', 'TX ya da TXID, gönderdiğin kripto transferinin blok zincirindeki benzersiz kimliğidir. Bununla ödemenin gerçekten bizim adresimize, doğru tutarda geldiğini kontrol ederiz.')}</p>
                                        <ul>
                                            <li>{t('creators.txHelpExchange', 'Borsadan gönderdiysen (Binance, OKX, Bybit vb.): Cüzdan → İşlem/Çekim geçmişi → ilgili çekim → "TxID" satırını kopyala.')}</li>
                                            <li>{t('creators.txHelpWallet', 'Cüzdan uygulamasından gönderdiysen (Trust Wallet, MetaMask vb.): işleme dokun → "İşlem hash" / "Transaction ID" değerini ya da gezgin (explorer) linkindeki uzun kodu kopyala.')}</li>
                                            <li>{t('creators.txHelpInternal', 'Borsa içi transfer (ör. Binance Pay, "dahili transfer") zincire yazılmaz ve TX vermez; ödemeyi mutlaka yukarıda seçtiğin ağ üzerinden çekim olarak gönder.')}</li>
                                        </ul>
                                        <p>{t('creators.txHelpExample', 'Örnek görünüm: 64 karakterlik harf ve rakamlardan oluşur, bazı ağlarda başında 0x vardır (0x3f9a…c21e). İşlem birkaç dakika içinde oluşmazsa biraz bekleyip tekrar bak.')}</p>
                                    </details>
                                    <div><button className="creator-btn" disabled={busy}>{t('creators.notifyPayment', 'Ödemeyi bildir')}</button></div>
                                </form>
                                {creator!.payments.length > 0 && (
                                    <div style={{ overflowX: 'auto', marginTop: 16 }}>
                                        <table className="creator-table">
                                            <thead><tr><th>{t('creators.date', 'Tarih')}</th><th>{t('creators.amount', 'Tutar')}</th><th>TX</th><th>{t('creators.status', 'Durum')}</th></tr></thead>
                                            <tbody>
                                                {creator!.payments.map(p => (
                                                    <tr key={p.id}>
                                                        <td>{formatDate(p.createdDate)}</td>
                                                        <td>{p.amount} {p.coin} {p.network}</td>
                                                        <td><TxLink coin={p.coin} network={p.network} txHash={p.txHash} /></td>
                                                        <td>
                                                            <span className={`creator-badge creator-badge--${p.status}`}>
                                                                {p.status === PaymentStatus.Pending ? t('creators.pending', 'Bekliyor') : p.status === PaymentStatus.Approved ? t('creators.paymentApproved', { defaultValue: 'Onaylandı (+{{months}} ay)', months: p.months }) : t('creators.rejected', 'Reddedildi')}
                                                            </span>
                                                            {p.adminNote && <div className="creator-empty">{p.adminNote}</div>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}

                        {creator?.status === CreatorStatus.Approved && (
                            <CreatorVideoManager creator={creator} token={accessToken!} busy={busy} run={run} reload={reload} />
                        )}
                    </>
                )}
            </div>
        </DashboardLayout>
    );
}
