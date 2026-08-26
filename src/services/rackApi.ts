/**
 * Rack API Service
 * 
 * Fetches set rack data from the backend for dynamic set bonus calculations.
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';

// ---- DTO types matching the backend response ----

export interface GetRackSetLevelListDto {
    id: string;
    minerSetId: string;
    level: number;
    requiredUniqueMiners: number;
    bonusPercent: number;
    conditionAmount: number;
    conditionType: string;
}

export interface GetRackSetItemListDto {
    minerSetId: string;
    minerFilename: string;
    minerId: string;
}

export interface GetRackListDto {
    id: string;
    name: string;
    capacity: number;
    powerBonus: number;
    createdDate: string;
    updatedDate?: string;
}

export interface GetRackSetListDto {
    id: string;
    name: string;
    requiredRackId: string;
    rackSetLevels: GetRackSetLevelListDto[];
    rackSetItems: GetRackSetItemListDto[];
    requiredRack: GetRackListDto;
}

let cachedSetRackList: GetRackSetListDto[] | null = null;
let fetchPromise: Promise<GetRackSetListDto[]> | null = null;

/**
 * Fetches the list of all set racks from the backend.
 * Uses a memory cache so it only requests once per session.
 * Returns an empty array on failure so callers can fall back to hardcoded data.
 */
export async function fetchSetRackList(): Promise<GetRackSetListDto[]> {
    if (cachedSetRackList) {
        return cachedSetRackList;
    }
    
    if (fetchPromise) {
        return fetchPromise;
    }

    fetchPromise = (async () => {
        try {
            const url = buildApiUrl('/api/Rack/get-set-rack-list');
            const data = await apiGet<GetRackSetListDto[]>(url);
            cachedSetRackList = data;
            return data;
        } catch (error) {
            console.warn('Failed to fetch set rack list, falling back to local data:', error);
            return [];
        } finally {
            fetchPromise = null;
        }
    })();
    
    return fetchPromise;
}
