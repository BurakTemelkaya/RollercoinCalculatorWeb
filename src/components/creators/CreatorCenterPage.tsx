import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { CREATOR_LINK_KEYS, CreatorLinkKey, CreatorPricing, PublicCreator, getCreatorPricing, getLiveCreators, orderCreatorsForLanguage } from '../../services/contentCreatorApi';
import { CreatorCard, PLATFORM_LABELS, languageFlag, useCreatorLiveStatus } from './CreatorShared';
import { PlatformIcon } from './PlatformIcon';
import './Creators.css';

const BENEFITS = [
    { key: 'calculator', icon: '📊', title: 'Hesaplayıcının altında', text: 'Kanalın, sitenin en çok kullanılan sayfasında sponsor kartıyla görünür.' },
    { key: 'language', icon: '🌍', title: 'Doğru dilde öne çıkma', text: 'İçerik dilin, ziyaretçinin site diliyle eşleşince kartın önce gösterilir.' },
    { key: 'events', icon: '🎬', title: 'Etkinlik videoları', text: 'Progression ve Puzzle event sayfalarına videolarını ekle; site içinde izlensin.' },
    { key: 'live', icon: '🔴', title: 'Canlı yayın rozeti', text: 'YouTube, Twitch, Kick veya TikTok’ta yayındayken kartında CANLI rozeti çıkar.' },
    { key: 'profile', icon: '👤', title: 'Profil sayfası', text: 'Tüm hesapların, son YouTube videoların ve etkinlik videoların tek sayfada.' },
    { key: 'socials', icon: '🔗', title: '8 platform bağlantısı', text: 'YouTube, Twitch, Kick, X, TikTok, Instagram, Telegram ve Discord logolarıyla.' },
];

const STEPS = [
    { key: 'apply', title: 'Başvur', text: 'Kanal bilgilerini, logonu ve içerik dillerini gir.' },
    { key: 'approve', title: 'Onay ve deneme', text: 'Başvurun onaylanınca ilk {{days}} gün ücretsiz yayına girersin.' },
    { key: 'pay', title: 'Kripto ile devam et', text: 'Ödemeyi gönderip işlem hash’ini (TX) bildir; her ay 30 gün eklenir.' },
];

/** Herkese açık sponsor merkezi: yayıncı vitrini + başvuru/fiyat bilgisi. */
export default function CreatorCenterPage() {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language } = useParams<{ lang: string }>();
    const { isAuthenticated } = useAuth();
    const [creators, setCreators] = useState<PublicCreator[]>([]);
    const [pricing, setPricing] = useState<CreatorPricing | null>(null);
    const [langFilter, setLangFilter] = useState<string>('all');
    const [platformFilter, setPlatformFilter] = useState<CreatorLinkKey | 'all' | 'live'>('all');
    const [search, setSearch] = useState('');
    const live = useCreatorLiveStatus();

    useEffect(() => {
        getLiveCreators().then(setCreators).catch(() => setCreators([]));
        getCreatorPricing().then(setPricing).catch(() => setPricing(null));
    }, []);

    const ordered = useMemo(() => {
        const byLang = orderCreatorsForLanguage(creators, lang);
        return [...byLang.filter(c => live[c.id]), ...byLang.filter(c => !live[c.id])];
    }, [creators, lang, live]);
    const languages = useMemo(() => [...new Set(creators.flatMap(c => c.languages))], [creators]);
    // Yalnızca en az bir yayıncının kullandığı platformlar filtrede çıkar
    const platforms = useMemo(() => CREATOR_LINK_KEYS.filter(key => creators.some(c => c[key])), [creators]);
    const query = search.trim().toLocaleLowerCase(lang);
    const visible = ordered.filter(c =>
        (langFilter === 'all' || c.languages.includes(langFilter))
        && (platformFilter === 'all' || (platformFilter === 'live' ? !!live[c.id] : !!c[platformFilter]))
        && (!query || c.displayName.toLocaleLowerCase(lang).includes(query) || (c.description ?? '').toLocaleLowerCase(lang).includes(query)));
    const anyLive = creators.some(c => live[c.id]);
    const applyTo = isAuthenticated ? `/${lang}/my-creator` : `/${lang}/login`;

    return (
        <div className="app">
            <title>{`${t('creators.centerTitle', 'Sponsor Merkezi')} | Rollercoin Calculator`}</title>

            <section className="creator-directory-head">
                <div>
                    <span className="creator-eyebrow">{t('creators.directoryEyebrow', 'Topluluğun sesleri')}</span>
                    <h1>{t('creators.centerTitle', 'Yayıncılar')}</h1>
                    <p>{t('creators.centerSubtitle', 'Rollercoin içerik üreticilerini keşfet, kanallarını takip et.')}</p>
                </div>
                <a href="#apply" className="creator-btn creator-btn--gold">{t('creators.becomeCreator', 'Yayıncı ol')} ↗</a>
            </section>

            <div className="creator-toolbar">
                <label className="creator-field creator-toolbar-search">
                    {t('creators.searchCreator', 'Yayıncı ara')}
                    <input type="search" placeholder={t('creators.searchCreatorPlaceholder', 'Kanal veya yayıncı adı')} value={search} onChange={e => setSearch(e.target.value)} />
                </label>
                <div className="creator-toolbar-filters">
                    <div className="creator-filter-group" role="group" aria-label={t('creators.platformFilter', 'Platform')}>
                        <button type="button" aria-pressed={platformFilter === 'all'} onClick={() => setPlatformFilter('all')}>{t('creators.allLanguages', 'Tümü')}</button>
                        {anyLive && <button type="button" aria-pressed={platformFilter === 'live'} onClick={() => setPlatformFilter('live')}><span className="creator-live-dot" aria-hidden="true" /> {t('creators.liveNow', 'CANLI')}</button>}
                        {platforms.map(key => (
                            <button type="button" key={key} aria-pressed={platformFilter === key} onClick={() => setPlatformFilter(key)}>
                                <PlatformIcon platform={key} size={14} /> {PLATFORM_LABELS[key]}
                            </button>
                        ))}
                    </div>
                    {languages.length > 1 && (
                        <div className="creator-filter-group" role="group" aria-label={t('creators.languages', 'İçerik dilleri')}>
                            <button type="button" aria-pressed={langFilter === 'all'} onClick={() => setLangFilter('all')}>{t('creators.allLanguagesShort', 'Tüm diller')}</button>
                            {languages.map(code => {
                                const flag = languageFlag(code);
                                return (
                                    <button type="button" key={code} aria-pressed={langFilter === code} onClick={() => setLangFilter(code)} title={flag?.label ?? code}>
                                        {flag?.icon ? <img src={flag.icon} alt="" width={18} height={13} /> : code.toUpperCase()}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {visible.length > 0
                ? <div className="creator-directory-grid">{visible.map(c => <CreatorCard key={c.id} creator={c} live={live[c.id]} />)}</div>
                : <p className="creator-directory-empty">{creators.length ? t('creators.noMatch', 'Aramana uyan yayıncı yok.') : t('creators.noCreatorsYet', 'Henüz yayında yayıncı yok. İlk sen ol!')}</p>}

            <section className="creator-section creator-apply" id="apply" aria-labelledby="creator-apply-title">
                <div className="creator-apply-head">
                    <div>
                        <span className="creator-eyebrow">{t('creators.forCreators', 'İçerik üreticileri için')}</span>
                        <h2 id="creator-apply-title">{t('creators.applyTitle', 'Kanalını binlerce Rollercoin oyuncusuna göster')}</h2>
                        <p className="creator-empty">{t('creators.applySubtitle', 'Rollercoin hakkında içerik üretiyorsan kanalını, videolarını ve canlı yayınlarını doğru kitleye ulaştır.')}</p>
                    </div>
                </div>

                <div className="creator-benefit-grid">
                    {BENEFITS.map(b => (
                        <article key={b.key} className="creator-benefit">
                            <span className="creator-benefit-icon" aria-hidden="true">{b.icon}</span>
                            <h3>{t(`creators.benefit.${b.key}.title`, b.title)}</h3>
                            <p>{t(`creators.benefit.${b.key}.text`, b.text)}</p>
                        </article>
                    ))}
                </div>

                <div className="creator-plan">
                    <div className="creator-plan-price">
                        <span className="creator-eyebrow">{t('creators.planName', 'Yayıncı paketi')}</span>
                        {pricing && (
                            <>
                                <div className="creator-plan-amount"><strong>${pricing.monthlyPriceUsd}</strong><span>/ {t('creators.perMonth', 'ay')}</span></div>
                                {pricing.trialDays > 0 && <span className="creator-plan-trial">{t('creators.trialBadge', { defaultValue: 'İlk {{days}} gün ücretsiz', days: pricing.trialDays })}</span>}
                            </>
                        )}
                        <span className="creator-hint">{t('creators.planCrypto', 'Kripto ile ödenir · USDT, BTC, ETH ve daha fazlası')}</span>
                        <Link to={applyTo} className="creator-btn creator-plan-cta">{t('creators.applyNow', 'Başvur')} →</Link>
                    </div>
                    <ol className="creator-steps">
                        {STEPS.map((step, i) => (
                            <li key={step.key}>
                                <span className="creator-step-no">{i + 1}</span>
                                <div>
                                    <strong>{t(`creators.step.${step.key}.title`, step.title)}</strong>
                                    <p>{t(`creators.step.${step.key}.text`, { defaultValue: step.text, days: pricing?.trialDays ?? 7 })}</p>
                                </div>
                            </li>
                        ))}
                    </ol>
                </div>
            </section>
        </div>
    );
}
