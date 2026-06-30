/**
 * Reward Change Event Types
 *
 * Type definitions for the RewardChange API endpoint
 */

/** League information embedded in a reward change entry */
export interface RewardChangeLeague {
    id: string;
    title: string;
    level: number;
    minPower: number;
    imageUrl: string;
    latestSnapshotId: string;
}

/** Individual reward change for a specific league + currency pair */
export interface RewardChangeEntry {
    id: string;
    rewardChangeEventId: string;
    leagueId: string;
    currencyId: number;
    oldReward: number;
    newReward: number;
    currency: unknown | null;
    league: RewardChangeLeague;
}

/** Top-level reward change event response */
export interface RewardChangeEvent {
    id: string;
    changedAt: string;
    expiresAt: string;
    changes: RewardChangeEntry[];
}
