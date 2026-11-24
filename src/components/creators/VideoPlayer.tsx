import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';

/** post: yüksekliği içeriğe göre değişen X postu (oynatıcı X'in bildirdiği yüksekliği alır). */
export interface VideoEmbed { src: string; vertical: boolean; post?: boolean }

/**
 * Site içinde oynatılabilen platformlar için gömme adresi; desteklenmiyorsa null (link yeni sekmede açılır).
 * Kick'in kayıtlı videoları güvenilir bir iframe oynatıcısı sunmadığından dahil değil (Kick canlı kanal oynatıcısı var).
 */
export function videoEmbed(url: string, hostname = window.location.hostname): VideoEmbed | null {
    let u: URL;
    try { u = new URL(url); } catch { return null; }
    const host = u.hostname.replace(/^(www\.|m\.|mobile\.)/, '');
    const path = u.pathname;

    // YouTube: watch, youtu.be, shorts, live, embed
    const yt = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    if (yt) {
        const start = u.searchParams.get('t')?.replace(/s$/, '');
        return {
            src: `https://www.youtube-nocookie.com/embed/${yt[1]}?autoplay=1&rel=0${start && /^\d+$/.test(start) ? `&start=${start}` : ''}`,
            vertical: path.startsWith('/shorts/'),
        };
    }

    // TikTok: /@kullanici/video/{id}
    const tiktok = host.endsWith('tiktok.com') && path.match(/\/video\/(\d+)/);
    if (tiktok) return { src: `https://www.tiktok.com/player/v1/${tiktok[1]}?autoplay=1&rel=0`, vertical: true };

    // Twitch: klip, kayıtlı video ya da kanal (canlı yayın); parent zorunlu
    const parent = `parent=${encodeURIComponent(hostname)}`;
    if (host === 'clips.twitch.tv') {
        const slug = path.split('/').filter(Boolean)[0];
        if (slug) return { src: `https://clips.twitch.tv/embed?clip=${encodeURIComponent(slug)}&${parent}&autoplay=true`, vertical: false };
    }
    if (host === 'twitch.tv') {
        const clip = path.match(/\/clip\/([\w-]+)/);
        if (clip) return { src: `https://clips.twitch.tv/embed?clip=${clip[1]}&${parent}&autoplay=true`, vertical: false };
        const vod = path.match(/^\/videos\/(\d+)/);
        if (vod) return { src: `https://player.twitch.tv/?video=v${vod[1]}&${parent}&autoplay=true`, vertical: false };
        const channel = path.split('/').filter(Boolean);
        if (channel.length === 1) return { src: `https://player.twitch.tv/?channel=${encodeURIComponent(channel[0])}&${parent}&autoplay=true`, vertical: false };
    }

    // Kick: kanal (canlı yayın)
    if (host === 'kick.com') {
        const channel = path.split('/').filter(Boolean);
        if (channel.length === 1) return { src: `https://player.kick.com/${encodeURIComponent(channel[0])}?autoplay=true`, vertical: false };
    }

    // Instagram: gönderi ve reels
    const ig = host === 'instagram.com' && path.match(/^\/(p|reel|reels|tv)\/([\w-]+)/);
    if (ig) return { src: `https://www.instagram.com/${ig[1] === 'reels' ? 'reel' : ig[1]}/${ig[2]}/embed`, vertical: true };

    // X (Twitter): post, içindeki video/görsellerle birlikte X'in kendi gömme sayfasında
    const tweet = (host === 'x.com' || host === 'twitter.com') && path.match(/^\/[\w]+\/status(?:es)?\/(\d+)/);
    if (tweet) return { src: `https://platform.twitter.com/embed/Tweet.html?id=${tweet[1]}&theme=dark&dnt=true`, vertical: true, post: true };

    return null;
}

/** Ortada açılan oynatıcı; Esc ya da arka plana tıklama kapatır. */
export function VideoPlayerModal({ embed, title, url, onClose }: { embed: VideoEmbed; title: string; url: string; onClose: () => void }) {
    const { t } = useTranslation();
    const [postHeight, setPostHeight] = useState<number | null>(null);

    // X gömme sayfası yüksekliğini postMessage ile bildirir (twttr.private.resize)
    useEffect(() => {
        if (!embed.post) return;
        const onMessage = (e: MessageEvent) => {
            if (e.origin !== 'https://platform.twitter.com') return;
            try {
                const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
                const height = data?.['twttr.embed']?.method === 'twttr.private.resize' ? Number(data['twttr.embed'].params?.[0]?.height) : NaN;
                if (height > 0) setPostHeight(Math.ceil(height));
            } catch { /* X'ten gelmeyen ya da farklı biçimli mesaj */ }
        };
        window.addEventListener('message', onMessage);
        return () => window.removeEventListener('message', onMessage);
    }, [embed.post]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', onKey);
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; };
    }, [onClose]);

    return createPortal(
        <div className="creator-player-backdrop" role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
            <div className={`creator-player${embed.post ? ' creator-player--post' : embed.vertical ? ' creator-player--vertical' : ''}`} onClick={e => e.stopPropagation()}>
                <div className="creator-player-head">
                    <strong>{title}</strong>
                    <div className="creator-row-actions">
                        <a href={url} target="_blank" rel="noopener noreferrer nofollow" className="creator-btn creator-btn--ghost">{t('creators.openOnPlatform', 'Platformda aç')} ↗</a>
                        <button type="button" className="creator-btn creator-btn--ghost" onClick={onClose} aria-label={t('creators.close', 'Kapat')} autoFocus>✕</button>
                    </div>
                </div>
                <div className="creator-player-frame">
                    <iframe
                        src={embed.src}
                        style={embed.post ? { height: postHeight ?? 420 } : undefined}
                        title={title}
                        allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                    />
                </div>
            </div>
        </div>,
        document.body
    );
}
