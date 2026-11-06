import type { Sponsor } from '../types/sponsor';
export function safeSponsorUrl(value: string): boolean {
    if (!value) return true;
    try { const url = new URL(value); return (url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password; } catch { return false; }
}
export function sponsorErrors(s: Sponsor): string[] {
    const errors: string[] = [];
    if (!/^[a-zA-Z0-9_-]{1,100}$/.test(s.id) || ['__proto__','constructor','prototype'].includes(s.id)) errors.push('Geçerli ve benzersiz bir ID gerekli.');
    if (!s.name.trim() || s.name.length > 80) errors.push('Sponsor adı 1–80 karakter olmalı.');
    if (s.description.length > 240) errors.push('Açıklama en fazla 240 karakter olabilir.');
    if (!['gold','premium','standard'].includes(s.tier)) errors.push('Sponsor seviyesi geçersiz.');
    if (!Number.isInteger(s.weight) || s.weight < 1 || s.weight > 100) errors.push('Gösterim ağırlığı 1–100 arasında olmalı.');
    if (!Number.isInteger(s.order) || s.order < 0 || s.order > 10000) errors.push('Sıralama 0–10000 arasında olmalı.');
    if (!/^#[0-9a-fA-F]{6}$/.test(s.accent)) errors.push('Marka rengi #RRGGBB biçiminde olmalı.');
    if ([...(s.logoUrl === "/publishers/angarali.png" ? [] : [s.logoUrl]),s.url,...Object.values(s.socials)].some(url => typeof url !== 'string' || url.length > 2048 || !safeSponsorUrl(url))) errors.push('Bağlantılar geçerli HTTP veya HTTPS adresi olmalı.');
    if (!s.url && !Object.values(s.socials).some(Boolean)) errors.push('En az bir kanal veya site bağlantısı gir.');
    const start = s.startsAt ? Date.parse(s.startsAt) : null, end = s.endsAt ? Date.parse(s.endsAt) : null;
    if ((start !== null && !Number.isFinite(start)) || (end !== null && !Number.isFinite(end))) errors.push('Yayın tarihleri geçersiz.');
    if (start !== null && end !== null && end <= start) errors.push('Bitiş başlangıçtan sonra olmalı.');
    return errors;
}
export function eligibleSponsors(sponsors: Sponsor[], now: number): Sponsor[] {
    return sponsors.filter(s => s.active && !sponsorErrors(s).length && (!s.startsAt || Date.parse(s.startsAt) <= now) && (!s.endsAt || now < Date.parse(s.endsAt))).sort((a,b)=>a.order-b.order || a.id.localeCompare(b.id));
}
export function nextSponsor(sponsors: Sponsor[], previous: string, scores: Record<string,number>): string | null {
    if (!sponsors.length) return null;
    const ids = new Set(sponsors.map(s=>s.id));
    for (const id of Object.keys(scores)) if (!ids.has(id)) delete scores[id];
    const total = sponsors.reduce((sum,s)=>sum+s.weight,0);
    for (const s of sponsors) scores[s.id] = (scores[s.id] ?? 0) + s.weight;
    const candidates = sponsors.length > 1 ? sponsors.filter(s=>s.id !== previous) : sponsors;
    const chosen = candidates.reduce((best,s)=>scores[s.id] > scores[best.id] ? s : best);
    scores[chosen.id] -= total;
    return chosen.id;
}
