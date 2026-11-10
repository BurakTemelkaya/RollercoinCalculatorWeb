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

export interface LeaderboardResponse extends PaginatedResponse<LeaderboardItem> {
    /** Countries that have at least one account in the leaderboard */
    countries: string[];
}

export interface LeaderboardFilter {
    pageIndex: number;
    pageSize: number;
    country?: string;
    /** Rollercoin league id (the user's actual league, stored by the backend) */
    leagueId?: string;
}

export async function getLeaderboard(filter: LeaderboardFilter): Promise<LeaderboardResponse> {
    const params = new URLSearchParams({
        'PageRequest.PageIndex': String(filter.pageIndex),
        'PageRequest.PageSize': String(filter.pageSize),
    });
    if (filter.country) params.set('Country', filter.country);
    if (filter.leagueId) params.set('LeagueId', filter.leagueId);
    const response = await apiFetch(buildApiUrl(`/api/User/leaderboard?${params}`));
    return response.json();
}
