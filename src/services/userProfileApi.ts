import { apiFetch } from './apiClient';
import { buildApiUrl } from '../config/api';
import type { PaginatedResponse } from '../types/pagination';

export interface UserProfile {
    rollercoinUserName: string | null;
    preferredLanguage: string | null;
    showInLeaderboard: boolean;
    /** ISO 3166-1 alpha-2, optional */
    country: string | null;
}

export interface LeaderboardItem {
    rollercoinUserName: string;
    avatarId: string | null;
    country: string | null;
    leagueId: string | null;
    /** Rollercoin current_Power (GH/s) */
    power: number;
    syncedDate: string | null;
    /** Rollercoin's latest end-of-day power record minus the day before (GH/s); null without both days */
    powerChange: number | null;
    /** In-game global rank from Rollercoin's latest daily record (not the position on this site) */
    gameRank: number | null;
    /** Change of the in-game rank vs the day before; positive = moved up */
    gameRankChange: number | null;
    /** 1-based position on this site under the current filters (by live power) */
    position: number;
    /** Change of the site position between Rollercoin's last two daily records; positive = moved up */
    siteRankChange: number | null;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
    const response = await apiFetch(buildApiUrl('/api/User/profile'), {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
}

/** Rollercoin kullanıcı adını backend doğrular; bulunamazsa ApiError (detail = yerelleştirilmiş mesaj) fırlar. */
export async function updateUserProfile(token: string, profile: UserProfile): Promise<UserProfile> {
    const response = await apiFetch(buildApiUrl('/api/User/profile'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(profile),
    });
    return response.json();
}

export type LeaderboardResponse = PaginatedResponse<LeaderboardItem>;

export interface LeaderboardFilter {
    country?: string;
    /** Rollercoin league id (the user's actual league, stored by the backend) */
    leagueId?: string;
}

function filterParams(filter: LeaderboardFilter, params = new URLSearchParams()): URLSearchParams {
    if (filter.country) params.set('Country', filter.country);
    if (filter.leagueId) params.set('LeagueId', filter.leagueId);
    return params;
}

export async function getLeaderboard(filter: LeaderboardFilter & { pageIndex: number; pageSize: number }): Promise<LeaderboardResponse> {
    const params = filterParams(filter, new URLSearchParams({
        'PageRequest.PageIndex': String(filter.pageIndex),
        'PageRequest.PageSize': String(filter.pageSize),
    }));
    const response = await apiFetch(buildApiUrl(`/api/User/leaderboard?${params}`));
    return response.json();
}

export interface LeaderboardFilterCount {
    /** ISO country code or Rollercoin league id */
    value: string;
    count: number;
}

export interface LeaderboardFilters {
    countries: LeaderboardFilterCount[];
    leagues: LeaderboardFilterCount[];
}

/** Countries and leagues that have accounts in the leaderboard, with account counts. */
export async function getLeaderboardFilters(): Promise<LeaderboardFilters> {
    const response = await apiFetch(buildApiUrl('/api/User/leaderboard/filters'));
    return response.json();
}

export interface LeaderboardPosition {
    /** 1-based position on this site's leaderboard with the same filters; null when the account is not listed */
    position: number | null;
    item: LeaderboardItem | null;
}

export interface LeaderboardHistoryPoint {
    /** yyyy-MM-dd (UTC day) */
    date: string;
    /** Average of the 30-minute samples (GH/s) */
    averagePower: number | null;
    /** Rollercoin's end-of-day power record (GH/s) */
    power: number | null;
    /** In-game global rank */
    rank: number | null;
}

/** The last N days (at most 365) or one calendar year; the API never returns more than a year at once. */
export type HistoryRange = { days: number } | { year: number };

const rangeQuery = (range: HistoryRange) => ('year' in range ? `year=${range.year}` : `days=${range.days}`);

/** Daily history of an account on the leaderboard; empty for accounts that are not listed. */
export async function getLeaderboardHistory(avatarId: string, range: HistoryRange): Promise<LeaderboardHistoryPoint[]> {
    const response = await apiFetch(buildApiUrl(`/api/User/leaderboard/history/${encodeURIComponent(avatarId)}?${rangeQuery(range)}`));
    return response.json();
}

/** The signed-in user's own history; works without joining the leaderboard. */
export async function getMyLeaderboardHistory(token: string, range: HistoryRange): Promise<LeaderboardHistoryPoint[]> {
    const response = await apiFetch(buildApiUrl(`/api/User/leaderboard/history/me?${rangeQuery(range)}`), {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
}

export async function getMyLeaderboardPosition(token: string, filter: LeaderboardFilter): Promise<LeaderboardPosition> {
    const response = await apiFetch(buildApiUrl(`/api/User/leaderboard/me?${filterParams(filter)}`), {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.json();
}
