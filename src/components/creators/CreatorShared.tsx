import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../MainLayout';
import {
    CREATOR_LINK_KEYS, CreatorLinkKey, EventCreatorVideo, LivePlatform, PublicCreator,
    getCreatorLiveStatus, getEventCreatorVideos, getLiveCreators, orderCreatorsForLanguage, videoThumbnail, videoTitle,
} from '../../services/contentCreatorApi';
import { VideoEmbed, VideoPlayerModal, videoEmbed } from './VideoPlayer';
import { PlatformIcon } from './PlatformIcon';
import './Creators.css';

export const PLATFORM_LABELS: Record<CreatorLinkKey, string> = {
    youTubeUrl: 'YouTube', twitchUrl: 'Twitch', kickUrl: 'Kick', xUrl: 'X',
    tikTokUrl: 'TikTok', instagramUrl: 'Instagram', telegramUrl: 'Telegram', discordUrl: 'Discord',
};

export function languageFlag(code: string) {
    return SUPPORTED_LANGUAGES.find(l => l.value === code);
}

export function CreatorAvatar({ creator, size = 56 }: { creator: PublicCreator; size?: number }) {
    const [broken, setBroken] = useState(false);
    if (creator.avatarUrl && !broken) {
        return <img className="creator-avatar" src={creator.avatarUrl} alt="" width={size} height={size} loading="lazy" onError={() => setBroken(true)} />;
    }
    return <span className="creator-avatar creator-avatar--empty" style={{ width: size, height: size }} aria-hidden="true">{creator.displayName.charAt(0).toUpperCase()}</span>;
}

const LIVE_PLATFORM_KEYS: Record<LivePlatform['platform'], CreatorLinkKey> = {
    YouTube: 'youTubeUrl', Twitch: 'twitchUrl', Kick: 'kickUrl', TikTok: 'tikTokUrl',
};

/** Yayıncıların şu an canlı oldukları platformlar (id → platformlar). */
export function useCreatorLiveStatus() {
    const [live, setLive] = useState<Record<string, LivePlatform[]>>({});
    useEffect(() => {
        let cancelled = false;
        getCreatorLiveStatus().then(map => { if (!cancelled) setLive(map); });
        return () => { cancelled = true; };
    }, []);
    return live;
}

/** "CANLI" rozeti; tıklanınca gömülebilen yayın site içinde, diğerleri platformda açılır. */
export function LiveBadge({ live, title }: { live: LivePlatform[]; title: string }) {
    const { t } = useTranslation();
    const [playing, setPlaying] = useState<{ embed: VideoEmbed; url: string } | null>(null);
    if (live.length === 0) return null;
    return (
        <span className="creator-live">
            <span className="creator-live-dot" aria-hidden="true" />
            {t('creators.liveNow', 'CANLI')}
            {live.map(p => {
                const embed = videoEmbed(p.url);
                return (
                    <a key={p.platform} href={p.url} target="_blank" rel="noopener noreferrer nofollow" className="creator-live-platform"
                        title={t('creators.liveOn', { defaultValue: '{{platform}} üzerinde canlı', platform: p.platform })}
                        onClick={embed ? e => {
                            if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                            e.preventDefault();
                            setPlaying({ embed, url: p.url });
                        } : undefined}>
                        <PlatformIcon platform={LIVE_PLATFORM_KEYS[p.platform]} size={14} />
                    </a>
                );
            })}
            {playing && <VideoPlayerModal embed={playing.embed} url={playing.url} title={title} onClose={() => setPlaying(null)} />}
        </span>
    );
}

export function CreatorCard({ creator, live = [] }: { creator: PublicCreator; live?: LivePlatform[] }) {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language } = useParams<{ lang: string }>();
    const [coverBroken, setCoverBroken] = useState(false);
    // Önizleme kartının (yayıncı panelinde) profil sayfası yok
    const profileUrl = creator.id === 'preview' ? null : `/${lang}/creators/${creator.id}`;
    const links = CREATOR_LINK_KEYS.filter(key => creator[key]);
    const name = <h3 className="creator-name">{creator.displayName}</h3>;
    return (
        <article className={`creator-card${live.length ? ' creator-card--live' : ''}`}>
            <div className="creator-card-cover">
                {creator.coverUrl && !coverBroken && <img src={creator.coverUrl} alt="" loading="lazy" onError={() => setCoverBroken(true)} />}
                <div className="creator-card-cover-badges">
                    <LiveBadge live={live} title={creator.displayName} />
                </div>
            </div>
            <div className="creator-card-content">
                <div className="creator-card-avatar">
                    {profileUrl ? <Link to={profileUrl} tabIndex={-1} aria-hidden="true"><CreatorAvatar creator={creator} size={80} /></Link> : <CreatorAvatar creator={creator} size={80} />}
                </div>
                {profileUrl ? <Link to={profileUrl} className="creator-name-link">{name}</Link> : name}
                <div className="creator-langs">
                    {creator.languages.map(code => {
                        const flag = languageFlag(code);
                        return flag?.icon
                            ? <img key={code} src={flag.icon} alt={flag.label} title={flag.label} width={18} height={13} />
                            : <span key={code}>{code.toUpperCase()}</span>;
                    })}
                </div>
                {creator.description && <p className="creator-desc">{creator.description}</p>}
                <div className="creator-pills">
                    {links.map(key => (
                        <a key={key} href={creator[key]!} target="_blank" rel="noopener noreferrer nofollow" className="creator-pill"
                            aria-label={`${creator.displayName} ${PLATFORM_LABELS[key]}`}>
                            <PlatformIcon platform={key} size={15} />
                            <span>{PLATFORM_LABELS[key]}</span>
                        </a>
                    ))}
                </div>
                {profileUrl && (
                    <Link to={profileUrl} className="creator-card-visit">
                        {t('creators.viewProfile', 'Profili gör')} <span aria-hidden="true">→</span>
                    </Link>
                )}
            </div>
        </article>
    );
}

/** Hesaplayıcının altındaki sponsor yayıncı şeridi. Yayıncı yoksa yalnızca "yayıncı ol" çağrısı görünür. */
export function CreatorSponsors() {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language } = useParams<{ lang: string }>();
    const [creators, setCreators] = useState<PublicCreator[] | null>(null);
    const live = useCreatorLiveStatus();

    useEffect(() => {
        getLiveCreators().then(setCreators).catch(() => setCreators([]));
    }, []);

    // Canlı olanlar en önde, sonra dil eşleşmesi
    const ordered = useMemo(() => {
        const byLang = orderCreatorsForLanguage(creators ?? [], lang);
        return [...byLang.filter(c => live[c.id]), ...byLang.filter(c => !live[c.id])].slice(0, 6);
    }, [creators, lang, live]);
    if (creators === null) return null;

    return (
        <section className="creator-section" aria-labelledby="creator-sponsors-title">
            <div className="creator-section-head">
                <div>
                    <span className="creator-eyebrow">{t('creators.sponsoredEyebrow', 'Sponsor yayıncılar')}</span>
                    <h2 id="creator-sponsors-title">{t('creators.sponsorsTitle', 'Topluluğun içerik üreticileri')}</h2>
                </div>
                <div className="creator-section-actions">
                    {creators.length > 0 && <Link to={`/${lang}/creators`} className="creator-btn creator-btn--ghost">{t('creators.viewAll', 'Tümünü gör')}</Link>}
                    <Link to={`/${lang}/creators#apply`} className="creator-btn">{t('creators.becomeCreator', 'Yayıncı ol')}</Link>
                </div>
            </div>
            {ordered.length > 0
                ? <div className="creator-grid">{ordered.map(c => <CreatorCard key={c.id} creator={c} live={live[c.id]} />)}</div>
                : <p className="creator-empty">{t('creators.emptySponsors', 'Kanalını burada tanıtmak ister misin? Rollercoin içeriği üretiyorsan başvur.')}</p>}
        </section>
    );
}

/** Progression / puzzle sayfalarında o etkinlikle ilgili yayıncı videoları. */
export function EventCreatorVideos({ eventType, eventId, showEmpty = false }: { eventType: number; eventId?: string | null; showEmpty?: boolean }) {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language } = useParams<{ lang: string }>();
    const [videos, setVideos] = useState<EventCreatorVideo[] | null>(null);

    useEffect(() => {
        if (!eventId) return;
        let cancelled = false;
        getEventCreatorVideos(eventType, eventId)
            .then(list => { if (!cancelled) setVideos(list); })
            .catch(() => { if (!cancelled) setVideos([]); });
        return () => { cancelled = true; };
    }, [eventType, eventId]);

    const ordered = useMemo(() => orderCreatorsForLanguage(videos ?? [], lang), [videos, lang]);
    const [playing, setPlaying] = useState<{ video: EventCreatorVideo; embed: VideoEmbed } | null>(null);
    if (!videos || (videos.length === 0 && !showEmpty)) return null;

    return (
        <section className="creator-section" aria-labelledby="creator-videos-title">
            <div className="creator-section-head">
                <div>
                    <span className="creator-eyebrow">{t('creators.sponsoredEyebrow', 'Sponsor yayıncılar')}</span>
                    <h2 id="creator-videos-title">{t('creators.eventVideosTitle', 'Bu etkinlik hakkında videolar')}</h2>
                </div>
                <Link to={`/${lang}/my-creator`} className="creator-btn creator-btn--ghost">{t('creators.addYourVideo', 'Videonu ekle')}</Link>
            </div>
            {ordered.length === 0
                ? <p className="creator-empty">{t('creators.noEventVideos', 'Bu etkinlik için henüz video yok. Yayıncıysan videonu panelinden ekleyebilirsin.')}</p>
                : (
                    <div className="creator-video-grid">
                        {ordered.map(video => {
                            const thumb = videoThumbnail(video);
                            const embed = videoEmbed(video.url);
                            return (
                                <a key={video.id} href={video.url} target="_blank" rel="noopener noreferrer nofollow" className="creator-video"
                                    onClick={embed ? e => {
                                        // Yeni sekme isteyen (ctrl/orta tık) kullanıcıya dokunma; normal tıkta site içinde oynat
                                        if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
                                        e.preventDefault();
                                        setPlaying({ video, embed });
                                    } : undefined}>
                                    <div className="creator-video-thumb">
                                        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
                                        {embed && <span className="creator-video-play" aria-hidden="true">▶</span>}
                                    </div>
                                    <div className="creator-video-body">
                                        <strong>{videoTitle(video, lang)}</strong>
                                        <span className="creator-video-author">
                                            <CreatorAvatar creator={video.creator} size={22} />
                                            {video.creator.displayName}
                                        </span>
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                )}
            {playing && <VideoPlayerModal embed={playing.embed} url={playing.video.url} title={videoTitle(playing.video, lang)} onClose={() => setPlaying(null)} />}
        </section>
    );
}
