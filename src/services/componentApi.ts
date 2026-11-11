/**
 * Component Price API Service
 *
 * Fetches marketplace prices for mutation components (Fan, Wire, Hashboard)
 * at all rarity levels from the backend API.
 * Prices are in raw format (divide by 1e6 for RLT display).
 */

import { buildApiUrl } from '../config/api';
import { apiGet, apiFetch } from './apiClient';

/** A single component price entry from the API */
export interface ComponentPrice {
    componentPrices?: { id: string; price: number; quantity: number; createdDate: string }[];
    id: string;
    name: string;       // "Fan" | "Wire" | "Hashboard"
    level: number;      // 0=Common, 1=Uncommon, 2=Rare, 3=Epic, 4=Legendary
    price: number;      // Raw price (÷ 1e6 for RLT display)
    fileName: string | null;
    imageVersion: number;
    createdDate: string;
    updatedDate: string;
}

/**
 * Fetches all component marketplace prices.
 * Returns 15 entries (3 types × 5 levels).
 */
export async function fetchComponentPrices(options?: { fresh?: boolean }): Promise<ComponentPrice[]> {
    const url = buildApiUrl('/api/Component');
    if (!options?.fresh) return apiGet<ComponentPrice[]>(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    try {
        const response = await apiFetch(url, { cache: 'no-store', signal: controller.signal });
        return await response.json() as ComponentPrice[];
    } finally { clearTimeout(timeout); }
}
