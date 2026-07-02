/**
 * Merge API Service
 *
 * Handles fetching merge (crafting) recipe data from the backend API.
 * List endpoint uses query string parameters for pagination, search, and sorting.
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type { MergeListItem, MergeDetail, MergeListParams } from '../types/merge';
import type { PaginatedResponse } from '../types/pagination';

/**
 * Fetches a paginated list of merge recipes.
 * Default sort: createdDate descending (API default when no SortBy is provided).
 */
export async function fetchMerges(
    params: MergeListParams
): Promise<PaginatedResponse<MergeListItem>> {
    const searchParams = new URLSearchParams();
    searchParams.set('PageRequest.PageIndex', params.pageIndex.toString());
    searchParams.set('PageRequest.PageSize', params.pageSize.toString());

    if (params.searchName?.trim()) {
        searchParams.set('Name', params.searchName.trim());
    }
    if (params.sortBy) {
        searchParams.set('SortBy', params.sortBy);
    }
    if (params.isDescending !== undefined) {
        searchParams.set('IsDescending', params.isDescending.toString());
    }

    if (params.minPower !== undefined) searchParams.set('MinMinerPower', params.minPower.toString());
    if (params.maxPower !== undefined) searchParams.set('MaxMinerPower', params.maxPower.toString());
    if (params.minBonus !== undefined) searchParams.set('MinMinerBonus', params.minBonus.toString());
    if (params.maxBonus !== undefined) searchParams.set('MaxMinerBonus', params.maxBonus.toString());
    if (params.minerWidth !== undefined) searchParams.set('Width', params.minerWidth.toString());

    const url = buildApiUrl(`/api/Merges?${searchParams.toString()}`);
    return apiGet<PaginatedResponse<MergeListItem>>(url);
}

/**
 * Fetches a single merge recipe by ID (includes requiredItems).
 */
export async function fetchMergeById(mergeId: string): Promise<MergeDetail> {
    const url = buildApiUrl(`/api/Merges/GetById?id=${encodeURIComponent(mergeId)}`);
    return apiGet<MergeDetail>(url);
}

/**
 * Fetches all merge levels for a given miner name.
 */
export async function fetchMergesByMinerName(minerName: string): Promise<MergeDetail[]> {
    const url = buildApiUrl(`/api/Merges/get-by-miner-name?minerName=${encodeURIComponent(minerName)}`);
    return apiGet<MergeDetail[]>(url);
}
