import { apiFetch, apiGet } from './apiClient';
import { buildApiUrl } from '../config/api';

export const CREATOR_LINK_KEYS = ['youTubeUrl', 'twitchUrl', 'kickUrl', 'xUrl', 'tikTokUrl', 'instagramUrl', 'telegramUrl', 'discordUrl'] as const;
export type CreatorLinkKey = typeof CREATOR_LINK_KEYS[number];
export type CreatorLinks = Partial<Record<CreatorLinkKey, string | null>>;

export interface PublicCreator extends CreatorLinks {
    id: string;
    displayName: string;
    description?: string | null;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    languages: string[];
}

// Backend enum'ları sayı olarak gelir
export const CreatorStatus = { Pending: 0, Approved: 1, Rejected: 2, Blocked: 3 } as const;
export const PaymentStatus = { Pending: 0, Approved: 1, Rejected: 2 } as const;
export const VideoEventType = { Progression: 0, Puzzle: 1 } as const;

export interface CreatorPayment {
    id: string;
    coin: string;
    network?: string | null;
    amount: string;
    txHash: string;
    status: number;
    months: number;
    adminNote?: string | null;
    createdDate: string;
}

export interface CreatorVideo {
    id: string;
    eventType: number;
    eventId: string;
    url: string;
    title: string;
    /** Dil kodu → başlık. */
    titles: Record<string, string>;
    thumbnailUrl?: string | null;
    createdDate: string;
}

/** Onaylı yayıncının admin onayı bekleyen profil değişikliği. languages virgülle ayrılmış metin. */
export interface CreatorProfileChanges extends CreatorLinks {
    displayName: string;
    description?: string | null;
    languages: string;
    avatarUrl?: string | null;
    coverUrl?: string | null;
    avatarUploaded: boolean;
    submittedAt: string;
}

export interface CreatorDetail extends PublicCreator {
    status: number;
    adminNote?: string | null;
    activeUntil?: string | null;
    trialUsed: boolean;
    isComplimentary: boolean;
    isLive: boolean;
    isDuplicate: boolean;
    pendingChanges?: CreatorProfileChanges | null;
    createdDate: string;
    payments: CreatorPayment[];
    videos: CreatorVideo[];
    userEmail?: string | null;
    duplicateOfName?: string | null;
    duplicateOfEmail?: string | null;
}

export interface EventCreatorVideo {
    id: string;
    url: string;
    title: string;
    titles: Record<string, string>;
    thumbnailUrl?: string | null;
    creator: PublicCreator;
}

export interface CreatorWallet { coin: string; network?: string | null; address: string }
export interface CreatorPricing { monthlyPriceUsd: number; trialDays: number; wallets: CreatorWallet[] }

export interface SaveCreatorInput extends CreatorLinks {
    displayName: string;
    description?: string;
    languages: string[];
    /** Yüklenen logoyu bırakıp kanal sayfasındaki resmi kullan. */
    useSocialAvatar?: boolean;
    /** Kapak görselini kaldır. */
    removeCover?: boolean;
}

const base = '/api/ContentCreators';

/** Backend UTC tarihleri veritabanından saat dilimi eki olmadan döner; Z yoksa UTC kabul edilir. */
export const parseUtc = (value: string) => new Date(/[zZ]|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`);

async function send<T>(path: string, token: string, method: string, body?: unknown): Promise<T> {
    const response = await apiFetch(buildApiUrl(base + path), {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return (response.status === 204 ? null : await response.json()) as T;
}

export const getLiveCreators = () => apiGet<PublicCreator[]>(buildApiUrl(base));

export interface LivePlatform { platform: 'YouTube' | 'Twitch' | 'Kick' | 'TikTok'; url: string }
export interface CreatorProfileVideo extends CreatorVideo { eventName?: string | null; eventSlug?: string | null }
export interface CreatorProfile { creator: PublicCreator; videos: CreatorProfileVideo[] }
export interface YouTubeFeedItem { videoId: string; title: string; published: string | null }

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Profil linkindeki isim: "Sinan Can Emirzeoğlu" → "sinan-can-emirzeoglu"; harf kalmazsa kimlik. */
export function creatorSlug(creator: { id: string; displayName: string }): string {
    const slug = creator.displayName.toLocaleLowerCase('tr').replace(/ı/g, 'i')
        .normalize('NFKD').replace(/\p{M}/gu, '')
        .replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '');
    return slug || creator.id;
}

/** Linkteki isim ya da (eski linklerde) kimlik → yayıncı kimliği; bulunamazsa null.
 *  shortcut: aynı isimli iki yayıncıda ilki açılır; çakışma olursa linke kısa kimlik eklenmeli. */
export async function resolveCreatorId(slugOrId: string): Promise<string | null> {
    if (GUID.test(slugOrId)) return slugOrId;
    const wanted = slugOrId.toLocaleLowerCase('tr');
    return (await getLiveCreators()).find(c => creatorSlug(c) === wanted)?.id ?? null;
}

export const getCreatorProfile = (id: string) => apiGet<CreatorProfile>(buildApiUrl(`${base}/${encodeURIComponent(id)}`));
export const getCreatorYouTubeFeed = (id: string) => apiGet<YouTubeFeedItem[]>(buildApiUrl(`${base}/${encodeURIComponent(id)}/youtube`));

// Canlı durumu sayfa başına bir kez istenir; sunucu 2 dk önbellekler
let liveStatusRequest: Promise<Record<string, LivePlatform[]>> | null = null;
let liveStatusAt = 0;
export function getCreatorLiveStatus(): Promise<Record<string, LivePlatform[]>> {
    if (!liveStatusRequest || Date.now() - liveStatusAt > 120_000) {
        liveStatusAt = Date.now();
        liveStatusRequest = apiGet<Record<string, LivePlatform[]>>(buildApiUrl(`${base}/live-status`)).catch(() => ({}));
    }
    return liveStatusRequest;
}
export const getCreatorPricing = () => apiGet<CreatorPricing>(buildApiUrl(`${base}/pricing`));
export const getEventCreatorVideos = (eventType: number, eventId: string) =>
    apiGet<EventCreatorVideo[]>(buildApiUrl(`${base}/videos?eventType=${eventType}&eventId=${encodeURIComponent(eventId)}`));

export const getMyCreator = (token: string) => send<CreatorDetail | null>('/me', token, 'GET');
export const saveMyCreator = (token: string, input: SaveCreatorInput) => send<CreatorDetail>('/me', token, 'POST', input);
/** Kanal linklerinden alınacak logoyu kaydetmeden döndürür (data URL); bulunamazsa null. */
export const previewSocialLogo = (token: string, links: CreatorLinks) =>
    send<{ imageDataUrl: string; pageUrl: string } | null>('/logo-preview', token, 'POST', links);

export async function uploadCreatorCover(token: string, file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file);
    const response = await apiFetch(buildApiUrl(`${base}/me/cover`), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    return response.text();
}

export async function uploadCreatorLogo(token: string, file: File): Promise<string> {
    const body = new FormData();
    body.append('file', file);
    const response = await apiFetch(buildApiUrl(`${base}/me/logo`), { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body });
    return response.text(); // ASP.NET string dönüşünü text/plain gönderir
}
export const submitCreatorPayment = (token: string, input: { coin: string; network?: string; amount: string; txHash: string }) =>
    send<CreatorPayment>('/me/payments', token, 'POST', input);
export const addCreatorVideo = (token: string, input: { eventType: number; eventId: string; url: string; titles: Record<string, string> }) =>
    send<CreatorVideo>('/me/videos', token, 'POST', input);
/** Platformdan başlık (istenen dillerde) ve kapak görseli; kaydetmez. */
export const getVideoMeta = (token: string, url: string, languages: string[]) =>
    send<{ titles: Record<string, string>; thumbnailUrl?: string | null }>('/video-meta', token, 'POST', { url, languages });

/** Sitenin dilindeki başlık, yoksa varsayılan başlık. */
export const videoTitle = (v: { title: string; titles?: Record<string, string> }, lang: string) => v.titles?.[lang] || v.title;
/** YouTube (shorts dahil) kapağı ya da platformun kapak görseli. */
export const videoThumbnail = (v: { url: string; thumbnailUrl?: string | null }) => youTubeThumbnail(v.url) ?? v.thumbnailUrl ?? null;
export const deleteCreatorVideo = (token: string, videoId: string) => send<boolean>(`/videos/${videoId}`, token, 'DELETE');

export const getAdminCreators = (token: string) => send<CreatorDetail[]>('/admin', token, 'GET');
export const adminUpdateCreator = (token: string, id: string, input: { status: number; isComplimentary: boolean; addDays: number; adminNote?: string | null }) =>
    send<boolean>(`/admin/${id}`, token, 'PUT', input);
export const adminReviewCreatorChanges = (token: string, id: string, input: { approve: boolean; adminNote?: string }) =>
    send<boolean>(`/admin/${id}/changes`, token, 'PUT', input);
export const adminReviewPayment = (token: string, paymentId: string, input: { approve: boolean; months: number; adminNote?: string }) =>
    send<boolean>(`/admin/payments/${paymentId}`, token, 'PUT', input);
export const adminSaveCreatorSettings = (token: string, input: CreatorPricing) => send<boolean>('/admin/settings', token, 'PUT', input);

/** İçerik dili sitenin diliyle eşleşenler önce; her grup kendi içinde karışık (adil gösterim). */
export function orderCreatorsForLanguage<T extends { creator?: PublicCreator; languages?: string[] }>(items: T[], lang: string): T[] {
    const langsOf = (item: T) => item.languages ?? item.creator?.languages ?? [];
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return [...shuffled.filter(i => langsOf(i).includes(lang)), ...shuffled.filter(i => !langsOf(i).includes(lang))];
}

/** YouTube linkinden kapak görseli; başka platformsa null. */
export function youTubeThumbnail(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|live\/|embed\/)|youtu\.be\/)([\w-]{11})/);
    return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}
