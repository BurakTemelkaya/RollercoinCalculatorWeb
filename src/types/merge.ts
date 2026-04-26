/**
 * Merge (Crafting) Types
 *
 * Types for the merge recipes API endpoints.
 * Prices/amounts use the same 1e6 scale as the rest of the app (RLT).
 */

/** A single merge recipe in the paginated list */
export interface MergeListItem {
    id: string;
    /** Raw RLT cost (divide by 1e6 for display) */
    amount: number;
    /** Raw discounted RLT cost (divide by 1e6 for display) */
    discountedAmount: number;
    craftingTimeSeconds: number;
    resultCount: number;
    totalSoldCount: number;
    totalCountLimit: number;
    limitType: string;
    /** Currency ID (1 = RLT) */
    currencyId: number;
    xpReward: number;
    resultItemId: string;
    resultItemName: string;
    resultItemLevel: number;
    /** Result miner power in Gh/s (may be 0 if not yet populated) */
    resultItemPower: number;
    /** Result miner bonus percentage */
    resultItemPercent: number;
    /** Result miner bonus value */
    resultItemBonus: number;
    /** Result miner width (cell count) */
    resultItemWidth: number;
    /** Filename for CDN image URL */
    resultItemFileName: string;
    /** Image cache-buster version (0 = no version suffix) */
    resultItemImageVersion: number;
}

/** A required item for a merge recipe */
export interface MergeRequiredItem {
    itemId: string;
    /** "mutation_components" or "miners" */
    type: string;
    count: number;
    itemName: string;
    level: number;
    /** Miner filename for CDN image (null for mutation_components) */
    fileName: string | null;
    /** Raw unit price for mutation_components (divide by 1e6 for RLT display), null for miners */
    price: number | null;
    /** Miner bonus percentage (null for mutation_components) */
    percent: number | null;
    /** Image cache-buster version */
    imageVersion: number | null;
    /** Miner power in Gh/s (null for mutation_components) */
    power: number | null;
    /** Miner cell width (0 means use result item width) */
    width: number | null;
}

/** Detailed merge recipe (returned by GetById) */
export interface MergeDetail extends MergeListItem {
    requiredItems: MergeRequiredItem[];
}

/** Query parameters for the merge list endpoint */
export interface MergeListParams {
    pageIndex: number;
    pageSize: number;
    searchName?: string;
    sortBy?: 'bonus' | 'percent' | 'name' | 'power';
    isDescending?: boolean;
}
