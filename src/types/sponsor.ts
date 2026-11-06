export type SponsorTier = 'gold' | 'premium' | 'standard';
export type SponsorSocial = 'youtube' | 'instagram' | 'x' | 'tiktok';
export interface Sponsor {
    id: string; name: string; description: string; logoUrl: string; url: string;
    socials: Partial<Record<SponsorSocial, string>>; tier: SponsorTier; active: boolean;
    startsAt: string | null; endsAt: string | null; accent: string; weight: number; order: number;
}
export interface SponsorMetric { impressions: number; clicks: number; visibleMs: number }
export const SPONSOR_TIERS = { gold: { label: 'GOLD SPONSOR', weight: 3 }, premium: { label: 'PREMIUM SPONSOR', weight: 2 }, standard: { label: 'STANDARD SPONSOR', weight: 1 } };
