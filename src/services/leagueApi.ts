/**
 * League API Service
 * 
 * Handles fetching league data from the backend API
 */

import { getApiUrl } from '../config/api';
import { ApiLeaguesResponse, ApiLeagueData } from '../types/api';
import { LeagueInfo } from '../data/leagues';

/**
 * Fetches league data from the API
 * @returns Promise resolving to array of league data
 * @throws Error if the request fails
 */
export async function fetchLeaguesFromApi(): Promise<ApiLeaguesResponse> {
    try {
        const url = getApiUrl('leagues');
        const response = await fetch(url);

        if (!response.ok) {
            if (response.status === 429) {
                throw new Error('RATE_LIMIT');
            }
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }

        const data: ApiLeaguesResponse = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching leagues from API:', error);
        throw error;
    }
}

/**
 * Converts API league data to internal LeagueInfo format
 * @param apiLeague - League data from API
 * @returns LeagueInfo object compatible with internal format
 */
export function convertApiLeagueToInternal(apiLeague: ApiLeagueData): LeagueInfo {
    return {
        id: apiLeague.id,
        name: apiLeague.title,
        minPower: apiLeague.minPower,
        currencies: apiLeague.currencies.map(currency => ({
            name: currency.name,
            payout: currency.payoutAmount,
        })),
    };
}

/**
 * Fetches and converts league data from API to internal format
 * @returns Promise resolving to array of LeagueInfo
 */
export async function getLeaguesFromApi(): Promise<LeagueInfo[]> {
    const apiData = await fetchLeaguesFromApi();
    return apiData.map(convertApiLeagueToInternal);
}

/**
 * Updates league data with latest values from API
 * This can be used to refresh payout amounts while keeping existing league structure
 * 
 * @param currentLeagues - Current league data
 * @param apiData - Fresh data from API
 * @returns Updated league array with latest payouts
 */
export function mergeLeagueData(
    currentLeagues: LeagueInfo[],
    apiData: ApiLeagueData[]
): LeagueInfo[] {
    const apiMap = new Map(apiData.map(league => [league.id, league]));

    return currentLeagues.map(league => {
        const apiLeague = apiMap.get(league.id);
        if (!apiLeague) {
            // League not found in API data, keep original
            return league;
        }

        // Update with API data
        return convertApiLeagueToInternal(apiLeague);
    });
}

import { CoinData, GAME_TOKENS } from '../types';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import { CURRENCY_MAP } from '../data/leagues';

/**
 * Converts API league data for a specific league into CoinData array
 * This creates the coin list with totalPower values needed for calculation
 * 
 * @param apiLeague - The specific league data from API
 * @returns CoinData array ready for calculation
 */
export function convertApiLeagueToCoinData(apiLeague: ApiLeagueData): CoinData[] {
    return apiLeague.currencies.map(currency => {
        // Get display name from currency map (e.g., SAT -> BTC, LTC_SMALL -> LTC)
        const displayName = CURRENCY_MAP[currency.name] || currency.name;
        const code = displayName;

        // API totalPower is in Gh/s (Gigahash/s)
        // Convert to H/s (Hash/s) by multiplying with GH_TO_H (1 Gh = 10^9 H)
        const GH_TO_H = 1e9;
        const leaguePower = autoScalePower(currency.totalPower * GH_TO_H);

        const isGameToken = GAME_TOKENS.includes(displayName);

        return {
            code,
            displayName,
            leaguePower,
            leaguePowerFormatted: formatHashPower(leaguePower),
            isGameToken,
        };
    });
}
