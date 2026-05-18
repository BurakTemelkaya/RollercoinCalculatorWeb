/**
 * Daily Bonus Quest API Service
 *
 * Fetches daily bonus quest data from the backend API.
 * Uses the shared apiClient for consistent error handling.
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type { DailyBonusQuest, DailyBonusQuestReward } from '../types/dailyBonusQuest';
import type { PaginatedResponse } from '../types/pagination';

type DailyBonusQuestRewardEntry = {
    dailyBonusReward?: DailyBonusQuestReward;
};

function normalizeDailyBonusQuestRewards(rawRewards: unknown): DailyBonusQuestReward[] {
    if (!Array.isArray(rawRewards)) return [];
    return rawRewards
        .map(reward => {
            if (reward && typeof reward === 'object') {
                const entry = reward as DailyBonusQuestRewardEntry;
                if (entry.dailyBonusReward && typeof entry.dailyBonusReward === 'object') {
                    return entry.dailyBonusReward;
                }
            }
            return reward as DailyBonusQuestReward;
        })
        .filter((reward): reward is DailyBonusQuestReward => Boolean(reward));
}

function normalizeDailyBonusQuest(quest: DailyBonusQuest): DailyBonusQuest {
    const rawRewards = (quest as { dailyBonusQuestRewards?: unknown }).dailyBonusQuestRewards;
    return {
        ...quest,
        dailyBonusQuestRewards: normalizeDailyBonusQuestRewards(rawRewards),
    };
}

function normalizeDailyBonusQuestList(
    response: PaginatedResponse<DailyBonusQuest>
): PaginatedResponse<DailyBonusQuest> {
    return {
        ...response,
        items: response.items.map(normalizeDailyBonusQuest),
    };
}

/**
 * Fetches today's daily bonus quest, or a specific quest by ID.
 */
export async function fetchDailyBonusQuest(id?: string): Promise<DailyBonusQuest> {
    const CACHE_KEY = 'rollercoin_web_daily_bonus_quest_cache';

    if (!id) {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                const parsed = JSON.parse(cached);
                if (parsed.expiry && parsed.expiry > Date.now() && parsed.data) {
                    return parsed.data;
                }
            }
        } catch (e) {
            console.warn('Failed to parse cached daily bonus quest', e);
        }
    }

    const base = '/api/DailyBonusQuest';
    const url = id
        ? buildApiUrl(`${base}?id=${encodeURIComponent(id)}`)
        : buildApiUrl(base);
    const data = await apiGet<DailyBonusQuest>(url);
    const normalizedData = normalizeDailyBonusQuest(data);

    if (!id) {
        try {
            const now = new Date();
            const nextMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data: normalizedData,
                expiry: nextMidnight.getTime()
            }));
        } catch (e) {
            console.warn('Failed to set cache for daily bonus quest', e);
        }
    }

    return normalizedData;
}

/**
 * Fetches a paginated list of daily bonus quests.
 */
export async function fetchDailyBonusQuestList(
    pageIndex: number = 0,
    pageSize: number = 10
): Promise<PaginatedResponse<DailyBonusQuest>> {
    const url = buildApiUrl(`/api/DailyBonusQuest/List?PageIndex=${pageIndex}&PageSize=${pageSize}`);
    const data = await apiGet<PaginatedResponse<DailyBonusQuest>>(url);
    return normalizeDailyBonusQuestList(data);
}
