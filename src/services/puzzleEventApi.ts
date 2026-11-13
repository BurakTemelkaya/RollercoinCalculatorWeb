import { buildApiUrl } from '../config/api';
import { apiGet } from './apiClient';
import type { PaginatedResponse } from '../types/pagination';
import type { ProgressionEventListItem } from '../types/progressionEvent';

export interface PuzzleReward {
    type: string;
    name: string | null;
    amount: number;
    currency: string | null;
    ttlTime: number;
    itemId: string | null;
    /** Image path on static.rollercoin.com (fallback source) */
    mediaUrl: string | null;
    /** Image path on our CDN; null for types resolved another way (miners, coins, parts…) */
    imagePath: string | null;
    fileName: string | null;
    power: number | null;   // Gh/s
    bonus: number | null;   // percent * 100
    minerLevel: number | null;
    imageVersion: number | null;
    /** Board only: how many grid columns the tile spans */
    cells: number;
    sort: number;
}

export interface PuzzleEventData {
    /** null when the backend has no puzzle event stored yet */
    id: string | null;
    name: string;
    slug: string | null;
    startDate: string | null;
    endDate: string | null;
    cols: number;
    maxXp: number;
    headerImg: string | null;
    backgroundImg: string | null;
    rewardIcon: string | null;
    levels: { level: number; requiredXp: number; rewards: PuzzleReward[] }[];
    board: PuzzleReward[];
    tasks: { title: string; type: string | null; spins: number }[];
}

/** Puzzle (spin) event by slug (the backend also accepts an ID); the latest one when no slug is given. */
export function fetchPuzzleEvent(slug?: string): Promise<PuzzleEventData> {
    return apiGet<PuzzleEventData>(buildApiUrl(
        slug ? `/api/PuzzleEvents/GetBySlug?slug=${encodeURIComponent(slug)}` : '/api/PuzzleEvents'));
}

/** History row; same fields as a progression event row so both lists share one page. */
export type PuzzleEventListItem = ProgressionEventListItem & { headerImg: string | null };

/** Paginated list of puzzle events, newest first. */
export function fetchPuzzleEventList(pageIndex: number = 0, pageSize: number = 10): Promise<PaginatedResponse<PuzzleEventListItem>> {
    return apiGet<PaginatedResponse<PuzzleEventListItem>>(
        buildApiUrl(`/api/PuzzleEvents/GetList?PageIndex=${pageIndex}&PageSize=${pageSize}`));
}

let latestPuzzlePathPromise: Promise<string | null> | null = null;

/**
 * Path segment of the latest puzzle event (shared, fetched once per page load) so links
 * point straight at `/puzzle/{slug}` instead of the redirecting `/puzzle`.
 */
export function fetchLatestPuzzlePathSegment(): Promise<string | null> {
    latestPuzzlePathPromise ??= fetchPuzzleEvent()
        .then(event => event.slug || event.id)
        .catch(() => {
            latestPuzzlePathPromise = null; // allow retry on next call
            return null;
        });
    return latestPuzzlePathPromise;
}
