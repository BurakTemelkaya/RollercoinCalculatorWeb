import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { CreatorStatRow, CreatorStats, getAdminCreatorStats, getMyCreatorStats } from '../../services/contentCreatorApi';
import { PLATFORM_LABELS } from './CreatorShared';
import { PlatformIcon } from './PlatformIcon';
import type { CreatorLinkKey } from '../../services/contentCreatorApi';

const RANGES = [7, 28, 90, 365] as const;

/**
 * Yayıncı panelindeki istatistikler: profil görüntülenmeleri, link tıklamaları, ülke / sayfa / platform / cihaz kırılımı.
 * admin: bir yayıncının (creatorId) ya da tüm yayıncıların verisi; tümünde yayıncı kırılımı da gösterilir.
 */
export default function CreatorStatsPanel({ token, admin = false, creatorId = null }: { token: string; admin?: boolean; creatorId?: string | null }) {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language } = useParams<{ lang: string }>();
    const [days, setDays] = useState<number>(28);
    const [stats, setStats] = useState<CreatorStats | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setError(false);
        setStats(null);
        (admin ? getAdminCreatorStats(token, days, creatorId) : getMyCreatorStats(token, days))
            .then(s => { if (!cancelled) setStats(s); })
            .catch(() => { if (!cancelled) setError(true); });
        return () => { cancelled = true; };
    }, [token, days, admin, creatorId]);

    const regionName = useMemo(() => {
        try { return new Intl.DisplayNames([lang], { type: 'region' }); } catch { return null; }
    }, [lang]);

    const pageLabel = (path: string) => {
        if (path === '/') return t('creators.statsPageHome', 'Ana sayfa (hesaplayıcı)');
        if (path === '/creators') return t('creators.statsPageCreators', 'Yayıncılar sayfası');
        if (path.startsWith('/creators/')) return admin ? 'Profil sayfası' : t('creators.statsPageProfile', 'Profil sayfan');
        const [, section, slug] = path.split('/');
        if (section === 'event' && slug) return `Progression · ${slug}`;
        if (section === 'puzzle' && slug) return `Puzzle · ${slug}`;
        return path;
    };
    const sourceLabel = (key: string) =>
        key === 'site' ? t('creators.statsSourceSite', 'Site içinden')
            : key === 'direct' ? t('creators.statsSourceDirect', 'Doğrudan / bilinmiyor')
                : key;
    const targetLabel = (key: string): ReactNode =>
        key in PLATFORM_LABELS
            ? <><PlatformIcon platform={key as CreatorLinkKey} size={15} /> {PLATFORM_LABELS[key as CreatorLinkKey]}</>
            : key === 'profile' ? t('creators.statsTargetProfile', 'Profil')
                : key === 'video' ? t('creators.statsTargetVideo', 'Video')
                    : key === 'live' ? t('creators.statsTargetLive', 'Canlı yayın')
                        : key;
    const countryLabel = (code: string): ReactNode =>
        code === 'XX'
            ? t('creators.statsUnknown', 'Bilinmiyor')
            : <><img src={`https://flagcdn.com/w20/${code.toLowerCase()}.png`} alt="" width={18} height={13} loading="lazy" /> {regionName?.of(code) ?? code}</>;

    const empty = stats && stats.current.views + stats.current.clicks === 0;

    return (
        <div className="creator-panel-block creator-stats">
            <div className="creator-stats-head">
                <h2>{admin ? (creatorId ? 'Yayıncı istatistikleri' : 'Tüm yayıncılar') : t('creators.statsTitle', 'İstatistikler')}</h2>
                <div className="creator-stats-range" role="group" aria-label={t('creators.statsRange', 'Dönem')}>
                    {RANGES.map(r => (
                        <button key={r} type="button" className={r === days ? 'active' : ''} aria-pressed={r === days} onClick={() => setDays(r)}>
                            {t('creators.statsDays', { defaultValue: '{{count}} gün', count: r })}
                        </button>
                    ))}
                </div>
            </div>

            {error && <div className="creator-alert creator-alert--error">{t('creators.statsError', 'İstatistikler yüklenemedi.')}</div>}
            {!stats && !error && <span className="spinner" />}
            {stats && (
                <>
                    <div className="creator-stats-kpis">
                        <Kpi label={t('creators.statsViews', 'Profil görüntülenme')} value={stats.current.views} previous={stats.previous.views} color="var(--accent-primary)" />
                        <Kpi label={t('creators.statsClicks', 'Link tıklaması')} value={stats.current.clicks} previous={stats.previous.clicks} color="#2dd4bf" />
                        <Kpi label={t('creators.statsVisitors', 'Tekil ziyaretçi')} value={stats.current.visitors} previous={stats.previous.visitors} />
                    </div>
                    <p className="creator-hint" style={{ margin: '4px 0 16px' }}>
                        {t('creators.statsCompare', { defaultValue: 'Değişim, önceki {{count}} günle karşılaştırılır.', count: stats.days })}
                        {admin && !creatorId && ' Tekil ziyaretçi her yayıncı için ayrı sayılır; toplam, yayıncıların toplamıdır.'}
                    </p>

                    {empty
                        ? <p className="creator-empty">{admin ? 'Bu dönemde görüntülenme ya da tıklama yok.' : t('creators.statsEmpty', 'Bu dönemde henüz görüntülenme ya da tıklama yok. Kartın sitede göründükçe veriler burada birikir.')}</p>
                        : (
                            <>
                                <DailyChart stats={stats} lang={lang} labels={{ views: t('creators.statsViews', 'Profil görüntülenme'), clicks: t('creators.statsClicks', 'Link tıklaması') }} />
                                <div className="creator-stats-grid">
                                    {stats.creators?.length > 0 && (
                                        <Breakdown title="Yayıncılar" rows={stats.creators} value={r => r.views + r.clicks} label={k => k} />
                                    )}
                                    <Breakdown title={t('creators.statsCountries', 'Ülkeler')} rows={stats.countries} value={r => r.views + r.clicks} label={countryLabel} />
                                    <Breakdown title={t('creators.statsTargets', 'Tıklanan linkler')} rows={stats.targets} value={r => r.clicks} label={targetLabel} />
                                    <Breakdown title={t('creators.statsPages', 'Tıklandığı sayfalar')} rows={stats.pages} value={r => r.clicks} label={pageLabel} />
                                    <Breakdown title={t('creators.statsSources', 'Profil trafiğinin kaynağı')} rows={stats.sources} value={r => r.views} label={sourceLabel} />
                                    <Breakdown title={t('creators.statsDevices', 'Cihaz')} rows={stats.devices} value={r => r.views + r.clicks}
                                        label={k => k === 'mobile' ? t('creators.statsMobile', 'Mobil') : t('creators.statsDesktop', 'Masaüstü')} />
                                </div>
                            </>
                        )}
                </>
            )}
        </div>
    );
}

function Kpi({ label, value, previous, color }: { label: string; value: number; previous: number; color?: string }) {
    const { t } = useTranslation();
    const change = previous > 0 ? Math.round(((value - previous) / previous) * 100) : null;
    return (
        <div className="creator-stats-kpi">
            <span className="creator-stats-kpi-label">{color && <i style={{ background: color }} aria-hidden="true" />}{label}</span>
            <strong>{value.toLocaleString()}</strong>
            {change !== null
                ? <span className={`creator-stats-delta ${change > 0 ? 'up' : change < 0 ? 'down' : ''}`}>{change > 0 ? '▲' : change < 0 ? '▼' : '•'} {Math.abs(change)}%</span>
                : value > 0 && <span className="creator-stats-delta up">{t('creators.statsNew', 'yeni')}</span>}
        </div>
    );
}

/** Günlük görüntülenme (mor) ve tıklama (turkuaz) çubukları. */
function DailyChart({ stats, lang, labels }: { stats: CreatorStats; lang: string; labels: { views: string; clicks: string } }) {
    const n = stats.daily.length;
    const max = Math.max(1, ...stats.daily.map(d => Math.max(d.views, d.clicks)));
    const fmt = (iso: string) => new Date(iso).toLocaleDateString(lang, { day: 'numeric', month: 'short', timeZone: 'UTC' });
    const slot = 10, h = 120;
    return (
        <figure className="creator-stats-chart">
            <figcaption className="creator-stats-legend">
                <span><i style={{ background: 'var(--accent-primary)' }} />{labels.views}</span>
                <span><i style={{ background: '#2dd4bf' }} />{labels.clicks}</span>
                <span className="creator-stats-max">max {max}</span>
            </figcaption>
            <svg viewBox={`0 0 ${n * slot} ${h}`} preserveAspectRatio="none" role="img" aria-label={`${labels.views} / ${labels.clicks}`}>
                {stats.daily.map((d, i) => {
                    const vh = (d.views / max) * (h - 2), ch = (d.clicks / max) * (h - 2);
                    return (
                        <g key={d.date}>
                            <title>{`${fmt(d.date)}: ${d.views} ${labels.views}, ${d.clicks} ${labels.clicks}`}</title>
                            <rect x={i * slot} y={0} width={slot} height={h} fill="transparent" />
                            <rect x={i * slot + 1} y={h - vh} width={slot / 2 - 1.5} height={vh} rx={1} fill="var(--accent-primary)" />
                            <rect x={i * slot + slot / 2 + 0.5} y={h - ch} width={slot / 2 - 1.5} height={ch} rx={1} fill="#2dd4bf" />
                        </g>
                    );
                })}
            </svg>
            <div className="creator-stats-axis">
                <span>{fmt(stats.daily[0].date)}</span>
                {n > 2 && <span>{fmt(stats.daily[Math.floor(n / 2)].date)}</span>}
                <span>{fmt(stats.daily[n - 1].date)}</span>
            </div>
        </figure>
    );
}

function Breakdown({ title, rows, value, label }: { title: string; rows: CreatorStatRow[]; value: (r: CreatorStatRow) => number; label: (key: string) => ReactNode }) {
    const { t } = useTranslation();
    const list = rows.map(r => ({ key: r.key, n: value(r) })).filter(r => r.n > 0).sort((a, b) => b.n - a.n).slice(0, 8);
    const total = list.reduce((s, r) => s + r.n, 0);
    return (
        <section className="creator-stats-card">
            <h3>{title}</h3>
            {list.length === 0
                ? <p className="creator-empty">{t('creators.statsNoData', 'Veri yok')}</p>
                : (
                    <ul>
                        {list.map(r => {
                            const pct = Math.round((r.n / total) * 100);
                            return (
                                <li key={r.key}>
                                    <span className="creator-stats-row-label">{label(r.key)}</span>
                                    <span className="creator-stats-row-value">{r.n.toLocaleString()} <small>{pct}%</small></span>
                                    <span className="creator-stats-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
                                </li>
                            );
                        })}
                    </ul>
                )}
        </section>
    );
}
