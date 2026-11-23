import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    CREATOR_LINK_KEYS, CreatorLinkKey, CreatorProfile, LivePlatform, VideoEventType, YouTubeFeedItem,
    creatorSlug, getCreatorProfile, getCreatorYouTubeFeed, parseUtc, resolveCreatorId, videoThumbnail, videoTitle,
} from '../../services/contentCreatorApi';
import { CreatorAvatar, LiveBadge, PLATFORM_LABELS, languageFlag, useCreatorLiveStatus } from './CreatorShared';
import { PlatformIcon } from './PlatformIcon';
import { VideoEmbed, VideoPlayerModal, videoEmbed } from './VideoPlayer';
import './Creators.css';

/** Linkten okunabilir kullanıcı adı: youtube.com/@ad → @ad, t.me/ad → @ad. */
function handleOf(url: string): string {
    try {
        const u = new URL(url);
        const seg = u.pathname.split('/').filter(Boolean);
        if (seg.length === 0) return u.hostname.replace(/^www\./, '');
        const last = seg[0] === 'channel' || seg[0] === 'c' || seg[0] === 'user' || seg[0] === 'invite' ? seg[1] ?? seg[0] : seg[0];
        return last.startsWith('@') ? last : `@${last}`;
    } catch {
        return url;
    }
}

/** Yayıncı profili: sosyal medya hesapları, canlı yayın, son YouTube videoları ve etkinlik videoları. */
export default function CreatorProfilePage() {
    const { t, i18n } = useTranslation();
    const { lang = i18n.language, creatorId: slugOrId = '' } = useParams<{ lang: string; creatorId: string }>();
    const [creatorId, setCreatorId] = useState('');
    const [profile, setProfile] = useState<CreatorProfile | null>(null);
    const [notFound, setNotFound] = useState(false);
    const [feed, setFeed] = useState<YouTubeFeedItem[]>([]);
    const [playing, setPlaying] = useState<{ embed: VideoEmbed; url: string; title: string } | null>(null);
    const liveStatus = useCreatorLiveStatus();
    const live: LivePlatform[] = liveStatus[creatorId] ?? [];

    useEffect(() => {
        let cancelled = false;
        setProfile(null);
        setNotFound(false);
        setFeed([]);
        resolveCreatorId(slugOrId).then(id => {
            if (cancelled) return;
            if (!id) { setNotFound(true); return; }
            setCreatorId(id);
            getCreatorProfile(id).then(p => {
                if (cancelled) return;
                setProfile(p);
                // Eski (kimlikli) linkler isimli adrese taşınır; router'a gitmeden, sayfa yeniden yüklenmesin diye
                const slug = creatorSlug(p.creator);
                if (slug !== slugOrId) window.history.replaceState(window.history.state, '', `/${lang}/creators/${encodeURIComponent(slug)}`);
            }).catch(() => { if (!cancelled) setNotFound(true); });
            getCreatorYouTubeFeed(id).then(f => { if (!cancelled) setFeed(f); }).catch(() => {});
        }).catch(() => { if (!cancelled) setNotFound(true); });
        return () => { cancelled = true; };
        // lang değişince yeniden yüklemeye gerek yok
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [slugOrId]);

    // Sayfada canlı yayın doğrudan oynatılır: gömülebilen ilk platform (YouTube, Twitch, Kick)
    const liveEmbed = useMemo(() => {
        for (const p of live) {
            const embed = videoEmbed(p.url);
            if (embed) return { platform: p, embed: { ...embed, src: embed.src.replace(/autoplay=(1|true)/, 'autoplay=false') } };
        }
        return null;
    }, [live]);

    const play = (url: string, title: string) => {
        const embed = videoEmbed(url);
        if (!embed) return false;
        setPlaying({ embed, url, title });
        return true;
    };

    if (notFound) {
        return (
            <div className="app">
                <section className="creator-section">
                    <h1 style={{ marginTop: 0 }}>{t('creators.profileNotFound', 'Yayıncı bulunamadı')}</h1>
                    <p className="creator-empty">{t('creators.profileNotFoundText', 'Bu yayıncının profili şu an yayında değil.')}</p>
                    <Link to={`/${lang}/creators`} className="creator-btn">{t('creators.allCreators', 'Tüm yayıncılar')}</Link>
                </section>
            </div>
        );
    }
    if (!profile) return <div className="app"><div className="tab-loading-placeholder"><span className="spinner" /></div></div>;

    const { creator, videos } = profile;
    const links = CREATOR_LINK_KEYS.filter(key => creator[key]) as CreatorLinkKey[];
    const formatDate = (value: string) => parseUtc(value).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric' });

    return (
        <div className="app">
            <title>{`${creator.displayName} | Rollercoin Calculator`}</title>

            <section className="creator-section creator-profile-head">
                <div className="creator-profile-cover">
                    {creator.coverUrl && <img src={creator.coverUrl} alt="" />}
                    <Link to={`/${lang}/creators`} className="creator-back">← {t('creators.allCreators', 'Tüm yayıncılar')}</Link>
                </div>
                <div className="creator-profile-main">
                    <CreatorAvatar creator={creator} size={104} />
                    <div style={{ minWidth: 0 }}>
                        <h1 className="creator-profile-name">{creator.displayName}</h1>
                        <LiveBadge live={live} title={creator.displayName} />
                        {creator.description && <p className="creator-desc" style={{ marginTop: 10 }}>{creator.description}</p>}
                        <div className="creator-langs" style={{ marginTop: 10 }}>
                            {creator.languages.map(code => {
                                const l = languageFlag(code);
                                return <span key={code} className="creator-lang-chip">{l?.icon && <img src={l.icon} alt="" width={18} height={13} />}{l?.label ?? code}</span>;
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {liveEmbed && (
                <section className="creator-section">
                    <div className="creator-section-head">
                        <div>
                            <span className="creator-eyebrow creator-eyebrow--live">● {t('creators.liveNow', 'CANLI')}</span>
                            <h2>{t('creators.liveOn', { defaultValue: '{{platform}} üzerinde canlı', platform: liveEmbed.platform.platform })}</h2>
                        </div>
                        <a href={liveEmbed.platform.url} target="_blank" rel="noopener noreferrer nofollow" className="creator-btn creator-btn--ghost">{t('creators.openOnPlatform', 'Platformda aç')} ↗</a>
                    </div>
                    <div className="creator-player-frame" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                        <iframe src={liveEmbed.embed.src} title={creator.displayName} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen />
                    </div>
                </section>
            )}

            <section className="creator-section">
                <div className="creator-section-head"><h2>{t('creators.socialAccounts', 'Sosyal medya hesapları')}</h2></div>
                <div className="creator-account-grid">
                    {links.map(key => {
                        const isLive = live.some(p => (p.platform === 'YouTube' && key === 'youTubeUrl') || (p.platform === 'Twitch' && key === 'twitchUrl') || (p.platform === 'Kick' && key === 'kickUrl') || (p.platform === 'TikTok' && key === 'tikTokUrl'));
                        return (
                            <a key={key} href={creator[key]!} target="_blank" rel="noopener noreferrer nofollow" className="creator-account">
                                <span className="creator-account-icon"><PlatformIcon platform={key} size={26} /></span>
                                <span className="creator-account-body">
                                    <strong>{PLATFORM_LABELS[key]}{isLive && <span className="creator-account-live">● {t('creators.liveNow', 'CANLI')}</span>}</strong>
                                    <span>{handleOf(creator[key]!)}</span>
                                </span>
                                <span className="creator-account-go" aria-hidden="true">↗</span>
                            </a>
                        );
                    })}
                </div>
            </section>

            {feed.length > 0 && (
                <section className="creator-section">
                    <div className="creator-section-head">
                        <div>
                            <span className="creator-eyebrow">YouTube</span>
                            <h2>{t('creators.latestVideos', 'Son videolar')}</h2>
                        </div>
                        {creator.youTubeUrl && <a href={creator.youTubeUrl} target="_blank" rel="noopener noreferrer nofollow" className="creator-btn creator-btn--ghost">{t('creators.openChannel', 'Kanala git')} ↗</a>}
                    </div>
                    <div className="creator-video-grid">
                        {feed.map(item => {
                            const url = `https://www.youtube.com/watch?v=${item.videoId}`;
                            return (
                                <a key={item.videoId} href={url} target="_blank" rel="noopener noreferrer nofollow" className="creator-video"
                                    onClick={e => { if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) && play(url, item.title)) e.preventDefault(); }}>
                                    <div className="creator-video-thumb">
                                        <img src={`https://i.ytimg.com/vi/${item.videoId}/hqdefault.jpg`} alt="" loading="lazy" />
                                        <span className="creator-video-play" aria-hidden="true">▶</span>
                                    </div>
                                    <div className="creator-video-body">
                                        <strong>{item.title}</strong>
                                        {item.published && <span className="creator-video-author">{formatDate(item.published)}</span>}
                                    </div>
                                </a>
                            );
                        })}
                    </div>
                </section>
            )}

            {videos.length > 0 && (
                <section className="creator-section">
                    <div className="creator-section-head"><h2>{t('creators.eventVideosTitleProfile', 'Etkinlik videoları')}</h2></div>
                    <div className="creator-video-grid">
                        {videos.map(v => {
                            const thumb = videoThumbnail(v);
                            const title = videoTitle(v, lang);
                            const eventPath = v.eventSlug ? `/${lang}/${v.eventType === VideoEventType.Puzzle ? 'puzzle' : 'event'}/${v.eventSlug}` : null;
                            return (
                                <div key={v.id} className="creator-video">
                                    <a href={v.url} target="_blank" rel="noopener noreferrer nofollow" className="creator-video-thumb"
                                        onClick={e => { if (!(e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) && play(v.url, title)) e.preventDefault(); }}>
                                        {thumb ? <img src={thumb} alt="" loading="lazy" /> : <span aria-hidden="true">▶</span>}
                                        {videoEmbed(v.url) && <span className="creator-video-play" aria-hidden="true">▶</span>}
                                    </a>
                                    <div className="creator-video-body">
                                        <strong>{title}</strong>
                                        {eventPath
                                            ? <Link to={eventPath} className="creator-video-event">{v.eventType === VideoEventType.Puzzle ? 'Puzzle' : 'Progression'} · {v.eventName}</Link>
                                            : <span className="creator-video-author">{v.eventName}</span>}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {playing && <VideoPlayerModal embed={playing.embed} url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
        </div>
    );
}
