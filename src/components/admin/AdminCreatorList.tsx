import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import DashboardLayout from '../DashboardLayout';
import {
    CREATOR_LINK_KEYS, CreatorDetail, CreatorPricing, CreatorStatus, PaymentStatus, VideoEventType,
    adminReviewCreatorChanges, adminReviewPayment, adminSaveCreatorSettings, adminUpdateCreator, deleteCreatorVideo, getAdminCreators, getCreatorPricing,
    parseUtc,
} from '../../services/contentCreatorApi';
import { PLATFORM_LABELS } from '../creators/CreatorShared';
import { PlatformIcon } from '../creators/PlatformIcon';
import { CoinNetworkSelect, TxLink } from '../creators/CryptoPayment';
import '../creators/Creators.css';

const STATUS_LABELS: Record<number, string> = { 0: 'Bekliyor', 1: 'Onaylı', 2: 'Reddedildi', 3: 'Engelli' };
const formatDate = (value?: string | null) => (value ? parseUtc(value).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' }) : '-');
const errorText = (err: unknown) => (err instanceof Error ? err.message : String(err));

type Draft = { status: number; isComplimentary: boolean; addDays: number; adminNote: string };

export default function AdminCreatorList() {
    const { t } = useTranslation();
    const { accessToken } = useAuth();
    const [creators, setCreators] = useState<CreatorDetail[]>([]);
    const [settings, setSettings] = useState<CreatorPricing>({ monthlyPriceUsd: 25, trialDays: 7, wallets: [] });
    const [drafts, setDrafts] = useState<Record<string, Draft>>({});
    const [months, setMonths] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
    const [filter, setFilter] = useState<'attention' | 'all'>('attention');

    const load = async () => {
        const list = await getAdminCreators(accessToken!);
        setCreators(list);
        setDrafts(Object.fromEntries(list.map(c => [c.id, { status: c.status, isComplimentary: c.isComplimentary, addDays: 0, adminNote: c.adminNote ?? '' }])));
    };

    useEffect(() => {
        if (!accessToken) return;
        Promise.all([load(), getCreatorPricing().then(setSettings)])
            .catch(err => setMessage({ type: 'error', text: errorText(err) }))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessToken]);

    const run = async (action: () => Promise<unknown>, success: string) => {
        setBusy(true);
        setMessage(null);
        try {
            await action();
            await load();
            setMessage({ type: 'ok', text: success });
        } catch (err) {
            setMessage({ type: 'error', text: errorText(err) });
        } finally {
            setBusy(false);
        }
    };

    const setDraft = (id: string, patch: Partial<Draft>) => setDrafts(d => ({ ...d, [id]: { ...d[id], ...patch } }));
    const setWallet = (index: number, patch: Partial<CreatorPricing['wallets'][number]>) =>
        setSettings(s => ({ ...s, wallets: s.wallets.map((w, i) => (i === index ? { ...w, ...patch } : w)) }));

    const needsAttention = (c: CreatorDetail) =>
        c.status === CreatorStatus.Pending || c.isDuplicate || !!c.pendingChanges || c.payments.some(p => p.status === PaymentStatus.Pending);
    const visible = filter === 'all' ? creators : creators.filter(needsAttention);

    return (
        <DashboardLayout title={t('admin.manageCreators', 'Yayıncılar')} isAdmin={true}>
            <div className="admin-content-card">
                <h1 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>{t('admin.manageCreators', 'Yayıncılar')}</h1>
                {message && <div className={`creator-alert creator-alert--${message.type}`} role="status">{message.text}</div>}

                <form className="creator-panel-block" onSubmit={e => { e.preventDefault(); run(() => adminSaveCreatorSettings(accessToken!, settings), 'Ayarlar kaydedildi.'); }}>
                    <h2>Program ayarları</h2>
                    <div className="creator-form">
                        <label className="creator-field">Ücretsiz deneme (gün)
                            <input type="number" min={0} max={365} required value={settings.trialDays} onChange={e => setSettings({ ...settings, trialDays: Number(e.target.value) })} />
                        </label>
                        <label className="creator-field">Aylık ücret ($)
                            <input type="number" min={0} step="0.01" required value={settings.monthlyPriceUsd} onChange={e => setSettings({ ...settings, monthlyPriceUsd: Number(e.target.value) })} />
                        </label>
                    </div>
                    <h3 style={{ fontSize: '0.95rem', margin: '16px 0 8px' }}>Ödeme cüzdanları</h3>
                    {settings.wallets.map((w, i) => (
                        <div className="creator-wallet-row" key={i}>
                            <CoinNetworkSelect required value={w} onChange={v => setWallet(i, v)} />
                            <label className="creator-field">Adres<input required minLength={10} maxLength={200} value={w.address} onChange={e => setWallet(i, { address: e.target.value })} /></label>
                            <div><button type="button" className="creator-btn creator-btn--danger" onClick={() => setSettings(s => ({ ...s, wallets: s.wallets.filter((_, j) => j !== i) }))}>Kaldır</button></div>
                        </div>
                    ))}
                    <div className="creator-row-actions" style={{ marginTop: 12 }}>
                        <button type="button" className="creator-btn creator-btn--ghost" onClick={() => setSettings(s => ({ ...s, wallets: [...s.wallets, { coin: '', network: '', address: '' }] }))}>+ Cüzdan ekle</button>
                        <button className="creator-btn" disabled={busy}>Ayarları kaydet</button>
                    </div>
                </form>

                <div className="creator-row-actions" style={{ marginBottom: 16 }}>
                    <button type="button" className={`creator-lang-pick${filter === 'attention' ? ' active' : ''}`} onClick={() => setFilter('attention')}>
                        İşlem bekleyenler ({creators.filter(needsAttention).length})
                    </button>
                    <button type="button" className={`creator-lang-pick${filter === 'all' ? ' active' : ''}`} onClick={() => setFilter('all')}>Tümü ({creators.length})</button>
                </div>

                {loading ? <span className="spinner" /> : visible.length === 0 ? <p className="creator-empty">Kayıt yok.</p> : visible.map(c => {
                    const draft = drafts[c.id];
                    return (
                        <div className="creator-panel-block" key={c.id}>
                            <div className="creator-row-actions" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                    {c.avatarUrl && <img className="creator-avatar" src={c.avatarUrl} alt="" width={32} height={32} />}
                                    {c.displayName} <span className={`creator-badge creator-badge--${c.status}`}>{STATUS_LABELS[c.status]}</span> {c.isLive && <span className="creator-badge creator-badge--1">Yayında</span>}</h2>
                                <span className="creator-empty" style={{ fontSize: '0.8rem' }}>{c.userEmail} · Başvuru: {formatDate(c.createdDate)}</span>
                            </div>

                            {c.isDuplicate && (
                                <div className="creator-alert creator-alert--error">
                                    ⚠ Tekrar ücretsiz deneme girişimi: bu kanal daha önce <strong>{c.duplicateOfName ?? 'başka bir kayıt'}</strong>{c.duplicateOfEmail ? ` (${c.duplicateOfEmail})` : ''} hesabıyla kaydolmuş. Başvuru otomatik engellendi; onaylarsan deneme verilmez.
                                </div>
                            )}

                            {c.pendingChanges && <PendingChangesReview creator={c} busy={busy} onReview={(approve, note) =>
                                run(() => adminReviewCreatorChanges(accessToken!, c.id, { approve, adminNote: note }), approve ? 'Değişiklikler yayına alındı.' : 'Değişiklikler reddedildi.')} />}

                            {c.description && <p className="creator-desc">{c.description}</p>}
                            <div className="creator-links" style={{ margin: '8px 0' }}>
                                {CREATOR_LINK_KEYS.filter(k => c[k]).map(k => <a key={k} href={c[k]!} target="_blank" rel="noopener noreferrer" className="creator-pill"><PlatformIcon platform={k} size={14} />{PLATFORM_LABELS[k]}</a>)}
                                <span className="creator-empty" style={{ fontSize: '0.8rem' }}>Diller: {c.languages.join(', ')}</span>
                            </div>
                            <p className="creator-empty" style={{ fontSize: '0.85rem' }}>
                                Bitiş: {c.isComplimentary ? 'Ücretsiz (süresiz)' : formatDate(c.activeUntil)} · Deneme kullanıldı: {c.trialUsed ? 'Evet' : 'Hayır'}
                            </p>

                            <div className="creator-form" style={{ alignItems: 'end' }}>
                                <label className="creator-field">Durum
                                    <select value={draft.status} onChange={e => setDraft(c.id, { status: Number(e.target.value) })}>
                                        {Object.entries(STATUS_LABELS).map(([v, label]) => <option key={v} value={v}>{label}</option>)}
                                    </select>
                                </label>
                                <label className="creator-field">Elle gün ekle
                                    <input type="number" min={0} max={3650} value={draft.addDays} onChange={e => setDraft(c.id, { addDays: Number(e.target.value) })} />
                                </label>
                                <label className="creator-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                    <input type="checkbox" checked={draft.isComplimentary} onChange={e => setDraft(c.id, { isComplimentary: e.target.checked })} />
                                    Ücretsiz kullansın (süresiz)
                                </label>
                                <label className="creator-field creator-field--wide">Not (yayıncı görür)
                                    <input maxLength={500} value={draft.adminNote} onChange={e => setDraft(c.id, { adminNote: e.target.value })} />
                                </label>
                                <div>
                                    <button className="creator-btn" disabled={busy} onClick={() => run(() => adminUpdateCreator(accessToken!, c.id, draft), `${c.displayName} güncellendi.`)}>Kaydet</button>
                                </div>
                            </div>
                            {c.status !== CreatorStatus.Approved && draft.status === CreatorStatus.Approved && !c.trialUsed && !c.isDuplicate && (
                                <p className="creator-alert creator-alert--info" style={{ marginTop: 12 }}>Onaylayınca {settings.trialDays} gün ücretsiz deneme başlar.</p>
                            )}

                            {c.payments.length > 0 && (
                                <div style={{ overflowX: 'auto', marginTop: 16 }}>
                                    <table className="creator-table">
                                        <thead><tr><th>Tarih</th><th>Tutar</th><th>TX</th><th>Durum</th></tr></thead>
                                        <tbody>
                                            {c.payments.map(p => (
                                                <tr key={p.id}>
                                                    <td>{formatDate(p.createdDate)}</td>
                                                    <td>{p.amount} {p.coin} {p.network}</td>
                                                    <td><TxLink coin={p.coin} network={p.network} txHash={p.txHash} /></td>
                                                    <td>
                                                        {p.status === PaymentStatus.Pending ? (
                                                            <div className="creator-row-actions">
                                                                <input type="number" min={1} max={24} className="creator-input-sm" aria-label="Ay" value={months[p.id] ?? 1} onChange={e => setMonths(m => ({ ...m, [p.id]: Number(e.target.value) }))} /> ay
                                                                <button type="button" className="creator-btn creator-btn--ok" disabled={busy} onClick={() => run(() => adminReviewPayment(accessToken!, p.id, { approve: true, months: months[p.id] ?? 1 }), 'Ödeme onaylandı.')}>Onayla</button>
                                                                <button type="button" className="creator-btn creator-btn--danger" disabled={busy} onClick={() => {
                                                                    const note = window.prompt('Red sebebi (yayıncı görür):');
                                                                    if (note === null) return;
                                                                    run(() => adminReviewPayment(accessToken!, p.id, { approve: false, months: 0, adminNote: note }), 'Ödeme reddedildi.');
                                                                }}>Reddet</button>
                                                            </div>
                                                        ) : (
                                                            <span className={`creator-badge creator-badge--${p.status}`}>{p.status === PaymentStatus.Approved ? `Onaylı (+${p.months} ay)` : 'Reddedildi'}</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {c.videos.length > 0 && (
                                <div style={{ overflowX: 'auto', marginTop: 16 }}>
                                    <table className="creator-table">
                                        <tbody>
                                            {c.videos.map(v => (
                                                <tr key={v.id}>
                                                    <td>{v.eventType === VideoEventType.Puzzle ? 'Puzzle' : 'Progression'} · {v.eventId}</td>
                                                    <td><a href={v.url} target="_blank" rel="noopener noreferrer">{v.title}</a>{Object.keys(v.titles ?? {}).length > 1 && <span className="creator-hint"> · {Object.keys(v.titles).map(l => l.toUpperCase()).join(', ')}</span>}</td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button type="button" className="creator-btn creator-btn--danger" disabled={busy} onClick={() => window.confirm('Video silinsin mi?') && run(() => deleteCreatorVideo(accessToken!, v.id), 'Video silindi.')}>Sil</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </DashboardLayout>
    );
}

/** Onaylı yayıncının bekleyen değişikliği: yalnızca değişen alanlar, yayındaki ile yan yana. */
function PendingChangesReview({ creator, busy, onReview }: { creator: CreatorDetail; busy: boolean; onReview: (approve: boolean, note?: string) => void }) {
    const p = creator.pendingChanges!;
    const rows: [string, string | null | undefined, string | null | undefined][] = [
        ['İsim', creator.displayName, p.displayName],
        ['Açıklama', creator.description, p.description],
        ['Diller', creator.languages.join(','), p.languages],
        ...CREATOR_LINK_KEYS.map(k => [PLATFORM_LABELS[k], creator[k], p[k]] as [string, string | null | undefined, string | null | undefined]),
    ];
    const changed = rows.filter(([, before, after]) => (before ?? '') !== (after ?? ''));
    const logoChanged = (creator.avatarUrl ?? '') !== (p.avatarUrl ?? '');
    const coverChanged = (creator.coverUrl ?? '') !== (p.coverUrl ?? '');

    return (
        <div className="creator-alert creator-alert--warn" style={{ color: 'var(--text-secondary)' }}>
            <strong style={{ color: '#fbbf24' }}>Bekleyen profil değişikliği</strong> · {formatDate(p.submittedAt)}
            <div style={{ overflowX: 'auto', marginTop: 8 }}>
                <table className="creator-table">
                    <thead><tr><th>Alan</th><th>Yayındaki</th><th>Yeni</th></tr></thead>
                    <tbody>
                        {logoChanged && (
                            <tr>
                                <td>Logo</td>
                                <td>{creator.avatarUrl ? <img className="creator-avatar" src={creator.avatarUrl} alt="" width={40} height={40} /> : '-'}</td>
                                <td>{p.avatarUrl ? <img className="creator-avatar" src={p.avatarUrl} alt="" width={40} height={40} /> : '-'}</td>
                            </tr>
                        )}
                        {coverChanged && (
                            <tr>
                                <td>Kapak</td>
                                <td>{creator.coverUrl ? <img src={creator.coverUrl} alt="" style={{ width: 160, height: 54, objectFit: 'cover', borderRadius: 6 }} /> : '-'}</td>
                                <td>{p.coverUrl ? <img src={p.coverUrl} alt="" style={{ width: 160, height: 54, objectFit: 'cover', borderRadius: 6 }} /> : 'Kaldırıldı'}</td>
                            </tr>
                        )}
                        {changed.map(([label, before, after]) => (
                            <tr key={label}><td>{label}</td><td style={{ overflowWrap: 'anywhere' }}>{before || '-'}</td><td style={{ overflowWrap: 'anywhere', color: 'var(--text-primary)' }}>{after || '-'}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="creator-row-actions" style={{ marginTop: 10 }}>
                <button type="button" className="creator-btn creator-btn--ok" disabled={busy} onClick={() => onReview(true)}>Değişiklikleri onayla</button>
                <button type="button" className="creator-btn creator-btn--danger" disabled={busy} onClick={() => {
                    const note = window.prompt('Red sebebi (yayıncı görür):');
                    if (note !== null) onReview(false, note);
                }}>Reddet</button>
            </div>
        </div>
    );
}
