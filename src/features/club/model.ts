export interface ClubProfile {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string | null;
    joinedAt: string;
    bio: string;
    level: number;
    xp: number;
    badges: { id: string; name: string }[];
    visibility: 'public' | 'private';
    version: string;
}
// No identity, role, XP, level or badge fields may be submitted by the client.
export type ClubProfileUpdate = Pick<ClubProfile, 'username' | 'displayName' | 'avatarUrl' | 'bio' | 'visibility' | 'version'>;
export const CLUB_MODULES = [
    { id: 'council', title: 'Üye Konseyi', icon: '♜', description: 'Topluluk fikirleri ve ortak kararlar için buluşma alanı.', stage: 3 },
    { id: 'identity', title: 'Dijital Kimlik ve Koleksiyon Kartları', icon: '◈', description: 'Üyeliğine bağlı dijital kimlik ve koleksiyon alanı.', stage: 2 },
    { id: 'arena', title: 'Haftalık Bilgi Arenası', icon: '✧', description: 'Bilgini toplulukla paylaşacağın haftalık arena.', stage: 4 },
    { id: 'pass', title: 'ANGARALI PASS', icon: '♛', description: 'Üyelik deneyimini zenginleştirecek ayrıcalık alanı.', stage: 5 },
    { id: 'guilds', title: 'ANGARALI Loncaları', icon: '⚑', description: 'Ortak ilgi alanları etrafında bir araya gelen topluluklar.', stage: 6 },
] as const;
export function profileErrors(value: ClubProfileUpdate): string[] {
    const errors: string[] = [];
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(value.username)) errors.push('Kullanıcı adı 3–24 harf, rakam veya alt çizgi içermeli.');
    if (!value.displayName.trim() || value.displayName.length > 60) errors.push('Takma ad 1–60 karakter olmalı.');
    if (value.bio.length > 500) errors.push('Profil açıklaması en fazla 500 karakter olabilir.');
    if (!['public', 'private'].includes(value.visibility)) errors.push('Görünürlük tercihi geçersiz.');
    if (value.avatarUrl) { try { const url = new URL(value.avatarUrl); if (url.protocol !== 'https:' || url.username || url.password || value.avatarUrl.length > 2048) throw new Error(); } catch { errors.push('Avatar için geçerli bir HTTPS görsel adresi gir.'); } }
    return errors;
}
export function editableProfile(profile: ClubProfileUpdate): ClubProfileUpdate {
    return { username: profile.username.trim().toLowerCase(), displayName: profile.displayName.trim(), avatarUrl: profile.avatarUrl, bio: profile.bio, visibility: profile.visibility, version: profile.version };
}
export function clubAuthReturn(search: string, lang: string): string {
    // Strict allow-list prevents external/open redirects through auth links.
    const path = new URLSearchParams(search).get('returnTo');
    return path === `/${lang}/v2/club` ? path : `/${lang}`;
}
export function parseClubProfile(value: unknown): ClubProfile {
    if (!value || typeof value !== 'object') throw new Error('Profil servisi geçersiz veri döndürdü.');
    const p = value as ClubProfile;
    if (typeof p.userId !== 'string' || !p.userId || typeof p.username !== 'string' || typeof p.displayName !== 'string' || typeof p.bio !== 'string' || typeof p.version !== 'string' || !p.version || !(p.avatarUrl === null || typeof p.avatarUrl === 'string') || typeof p.joinedAt !== 'string' || !Number.isFinite(Date.parse(p.joinedAt)) || !Number.isSafeInteger(p.xp) || p.xp < 0 || !Number.isSafeInteger(p.level) || p.level < 1 || !Array.isArray(p.badges) || p.badges.some(b => !b || typeof b.id !== 'string' || typeof b.name !== 'string') || profileErrors(p).length) throw new Error('Profil servisi geçersiz veri döndürdü.');
    return p;
}
