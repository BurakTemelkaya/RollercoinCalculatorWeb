/**
 * Component Price API Service
 *
 * Fetches marketplace prices for mutation components (Fan, Wire, Hashboard)
 * at all rarity levels from the backend API.
 * Prices are in raw format (divide by 1e6 for RLT display).
 */

import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';

/** A single component price entry from the API */
export interface ComponentPrice {
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
export async function fetchComponentPrices(): Promise<ComponentPrice[]> {
    const url = buildApiUrl('/api/Component');
    return apiGet<ComponentPrice[]>(url);
}
