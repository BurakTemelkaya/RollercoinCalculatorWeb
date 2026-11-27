import { buildApiUrl } from '../../config/api';
import { apiFetch } from '../../services/apiClient';
import { editableProfile, profileErrors, parseClubProfile, type ClubProfile, type ClubProfileUpdate } from './model';
export const clubApiEnabled = import.meta.env.VITE_CLUB_API_ENABLED === 'true';
export class ClubUnavailableError extends Error { constructor() { super('Üye profili servisi henüz bağlanmadı. Hesabın ve mevcut girişin kullanılmaya devam ediyor.'); } }
export async function clubRequest(token: string, method = 'GET', body?: unknown, signal?: AbortSignal) {
    if (!clubApiEnabled) throw new ClubUnavailableError();
    if (!token) throw new Error('Oturum gerekli.');
    return apiFetch(buildApiUrl('/api/Club/me'), { method, headers: { Authorization: `Bearer ${token}`, ...(body ? { 'Content-Type': 'application/json' } : {}) }, credentials: 'omit', cache: 'no-store', signal, ...(body ? { body: JSON.stringify(body) } : {}) });
}
export async function getClubProfile(token: string, signal?: AbortSignal): Promise<ClubProfile | null> {
    const response = await clubRequest(token, 'GET', undefined, signal);
    if (response.status === 204) return null;
    return parseClubProfile(await response.json());
}
export async function saveClubProfile(token: string, draft: ClubProfileUpdate): Promise<ClubProfile> {
    const body = editableProfile(draft);
    const errors = profileErrors(body);
    if (errors.length) throw new Error(errors.join(' '));
    const response = await clubRequest(token, 'PUT', body);
    return parseClubProfile(await response.json());
}
export async function deleteClubProfile(token: string): Promise<void> { await clubRequest(token, 'DELETE'); }
