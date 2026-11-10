import { apiFetch } from './apiClient';
import { buildApiUrl } from '../config/api';

export interface UserProfile {
    rollercoinUserName: string | null;
    preferredLanguage: string | null;
    showInLeaderboard: boolean;
}

export interface LeaderboardItem {
    rollercoinUserName: string;
    avatarId: string | null;
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

export async function getLeaderboard(): Promise<LeaderboardItem[]> {
    const response = await apiFetch(buildApiUrl('/api/User/leaderboard'));
    return response.json();
}
