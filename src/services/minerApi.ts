/**
 * Miner API Service
 * 
 * Provides miner-specific API calls (sellable check, etc.)
 */

import { buildApiUrl } from '../config/api';
import { apiFetch } from './apiClient';

export interface GetSellableMinerDto {
    minerId: string;
    isSellable: boolean | null;
}

/**
 * Checks which miners are sellable on the marketplace.
 * Sends an array of miner IDs and returns their sellable status.
 * 
 * @param minerIds - Array of miner_id values (definition IDs, not instance IDs)
 * @returns Array of sellable status objects, or empty array on failure
 */
export async function fetchSellableMiners(minerIds: string[]): Promise<GetSellableMinerDto[]> {
    if (!minerIds || minerIds.length === 0) return [];

    try {
        const url = buildApiUrl(`/api/Miner/get-sellable`);
        const response = await apiFetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(minerIds)
        });
        
        return await response.json() as GetSellableMinerDto[];
    } catch (error) {
        console.warn('Failed to fetch sellable miners:', error);
        return [];
    }
}
