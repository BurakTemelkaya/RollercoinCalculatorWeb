/**
 * Daily Bonus Quest API Service
 *
 * Fetches daily bonus quest data from the backend API.
 * Uses the shared apiClient for consistent error handling.
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type { DailyBonusQuest } from '../types/dailyBonusQuest';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Fetches today's daily bonus quest, or a specific quest by ID.
 */
export async function fetchDailyBonusQuest(id?: string): Promise<DailyBonusQuest> {
    const base = '/api/DailyBonusQuest';
    const url = id
        ? buildApiUrl(`${base}?id=${encodeURIComponent(id)}`)
        : buildApiUrl(base);
    return apiGet<DailyBonusQuest>(url);
}

/**
 * Fetches a paginated list of daily bonus quests.
 */
export async function fetchDailyBonusQuestList(
    pageIndex: number = 0,
    pageSize: number = 10
): Promise<PaginatedResponse<DailyBonusQuest>> {
    const url = buildApiUrl(`/api/DailyBonusQuest/List?PageIndex=${pageIndex}&PageSize=${pageSize}`);
    return apiGet<PaginatedResponse<DailyBonusQuest>>(url);
}
