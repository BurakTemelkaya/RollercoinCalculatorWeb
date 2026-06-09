/**
 * Progression Event API Service
 * 
 * Fetches and parses progression event data from the backend API
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type {
    ProgressionEventResponse,
    ProgressionReward,
    LevelConfig,
    MultiplierData,
    TaskData,
    ProgressionEventListItem,
    CurrencyDiscount,
    ApiReward,
    ApiLevel,
    ApiMultiplier,
    ApiTask,
    ApiMiner,
    MinerItem,
} from '../types/progressionEvent';
import type { PaginatedResponse } from '../types/pagination';

export interface ParsedProgressionEvent {
    id: string;
    name: string;
    endDate: string;
    createdDate?: string;
    totalPoint?: number;
    rewards: ProgressionReward[];
    levels: LevelConfig[];
    maxXp: number;
    multiplierData?: MultiplierData[];
    taskData?: TaskData[];
}

/**
 * Converts an API miner (camelCase) to internal MinerItem format.
 */
function convertApiMiner(apiMiner: ApiMiner): MinerItem {
    return {
        _id: apiMiner.id,
        power: apiMiner.power,
        width: apiMiner.width,
        name: { en: apiMiner.name, cn: apiMiner.name },
        description: { en: '', cn: '' },
        created_by_title: { link: '', text: '' },
        level: apiMiner.level,
        type: 'basic',
        filename: apiMiner.fileName,
        image_version: apiMiner.imageVersion,
        frames_data: { frame_width: 0, frame_height: 0 },
        is_can_be_sold_on_mp: false,
        bonus: apiMiner.percent,
        is_in_set: false,
    };
}

/**
 * Converts an API reward (camelCase, flat) to internal ProgressionReward format.
 */
function convertApiReward(apiReward: ApiReward): ProgressionReward {
    const emptyText = { en: '', cn: '' };
    return {
        id: apiReward.id,
        item_id: apiReward.itemId ?? null,
        amount: apiReward.amount,
        currency: apiReward.currency,
        ttl_time: apiReward.ttlTime ?? 0,
        required_level: apiReward.requiredLevel,
        type: apiReward.rewardType,
        title: apiReward.itemName ? { en: apiReward.itemName, cn: apiReward.itemName } : emptyText,
        description: emptyText,
        range_count: { min: 0, max: 0 },
        item_media_url: apiReward.itemPreviewUrl ?? null,
        box_image_url: apiReward.itemBoxUrl ?? null,
        cover_image_url: apiReward.itemCoverUrl ?? null,
        rack_capacity: apiReward.rackCapacity ?? null,
        item: apiReward.miner ? convertApiMiner(apiReward.miner) : undefined,
    };
}

/**
 * Converts an API level (camelCase) to internal LevelConfig format.
 */
function convertApiLevel(apiLevel: ApiLevel): LevelConfig {
    return {
        level: apiLevel.level,
        level_xp: apiLevel.levelXp,
        required_xp: apiLevel.requiredXp,
    };
}

/**
 * Converts API multiplier to internal MultiplierData format.
 */
function convertApiMultiplier(apiMult: ApiMultiplier): MultiplierData {
    return {
        id: apiMult.id,
        multiplier: apiMult.multiplier,
        amount: apiMult.amount,
        title: apiMult.title,
    };
}

/**
 * Converts API task to internal TaskData format.
 */
function convertApiTask(apiTask: ApiTask): TaskData {
    return {
        id: apiTask.id,
        amount: apiTask.amount,
        title: apiTask.title,
        type: apiTask.type,
        xp_reward: apiTask.xpReward,
        xp_type: apiTask.xpType,
    };
}

/**
 * Parses a raw ProgressionEventResponse into a ParsedProgressionEvent.
 * Converts the new flat API format (camelCase) into internal snake_case types.
 */
function parseProgressionEventResponse(raw: ProgressionEventResponse): ParsedProgressionEvent {
    const rewards = (raw.rewards || []).map(convertApiReward);
    const levels = (raw.levels || []).map(convertApiLevel);

    // Sort levels by level number
    levels.sort((a, b) => a.level - b.level);

    // Calculate max_xp from levels (the highest requiredXp)
    const maxXp = levels.length > 0
        ? Math.max(...levels.map(l => l.required_xp))
        : 0;

    let multiplierData: MultiplierData[] | undefined;
    let taskData: TaskData[] | undefined;

    if (raw.multipliers && raw.multipliers.length > 0) {
        multiplierData = raw.multipliers.map(convertApiMultiplier);
    }

    if (raw.tasks && raw.tasks.length > 0) {
        taskData = raw.tasks.map(convertApiTask);
    }

    // Ensure endDate is treated as UTC. The API returns dates without timezone info
    // (e.g. "2026-03-09T15:00:00"), which JavaScript would parse as local time instead of UTC.
    const endDate = raw.endDate && !raw.endDate.endsWith('Z') && !raw.endDate.includes('+')
        ? raw.endDate + 'Z'
        : raw.endDate;

    const createdDate = raw.createdDate && !raw.createdDate.endsWith('Z') && !raw.createdDate.includes('+')
        ? raw.createdDate + 'Z'
        : raw.createdDate;

    return {
        id: raw.id,
        name: raw.name,
        endDate,
        createdDate,
        totalPoint: raw.totalPoint,
        rewards,
        levels,
        maxXp,
        multiplierData,
        taskData,
    };
}

/**
 * Fetches the current (latest) progression event from the API
 */
export async function fetchProgressionEvent(): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl('/api/ProgressionEvents');
    const raw = await apiGet<ProgressionEventResponse>(url);
    return parseProgressionEventResponse(raw);
}

/**
 * Fetches a specific progression event by ID
 */
export async function fetchProgressionEventById(id: string): Promise<ParsedProgressionEvent> {
    const url = buildApiUrl(`/api/ProgressionEvents/GetById?id=${encodeURIComponent(id)}`);
    const raw = await apiGet<ProgressionEventResponse>(url);
    return parseProgressionEventResponse(raw);
}

/**
 * Fetches a paginated list of progression events
 */
export async function fetchProgressionEventList(
    pageIndex: number = 0,
    pageSize: number = 10
): Promise<PaginatedResponse<ProgressionEventListItem>> {
    const url = buildApiUrl(`/api/ProgressionEvents/GetList?PageIndex=${pageIndex}&PageSize=${pageSize}`);
    return apiGet<PaginatedResponse<ProgressionEventListItem>>(url);
}

/**
 * Fetches currency discounts for a given date range (typically the event's duration).
 */
export async function fetchCurrencyDiscounts(
    startDate: string,
    endDate: string
): Promise<CurrencyDiscount[]> {
    const params = new URLSearchParams({
        StartDate: startDate,
        EndDate: endDate,
    });
    const url = buildApiUrl(`/api/CurrencyDiscount?${params.toString()}`);
    const response = await apiGet<PaginatedResponse<CurrencyDiscount>>(url);
    return response.items;
}
