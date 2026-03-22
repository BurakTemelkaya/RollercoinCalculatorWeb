/**
 * League API Service
 * 
 * Handles fetching league data from the backend API
 */

import { getApiUrl } from '../config/api';
import { ApiLeaguesResponse, ApiLeagueData } from '../types/api';
import { LeagueInfo } from '../data/leagues';
import { CoinData } from '../types';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import { CURRENCY_MAP } from '../data/leagues';

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
 * Converts raw API league data to internal LeagueInfo format
 */
export function convertApiLeagueToInternal(apiLeague: ApiLeagueData): LeagueInfo {
    return {
        id: apiLeague.id,
        name: apiLeague.title,
        minPower: apiLeague.minPower,
        currencies: apiLeague.currencies.map(currency => ({
            name: currency.name,
            payout: currency.payoutAmount,
            duration: currency.duration,
        })),
    };
}

/**
 * Converts API league data to CoinData format for calculations.
 * API totalPower is in Gh/s, we convert to base H/s then auto-scale.
 */
export function convertApiLeagueToCoinData(apiLeague: ApiLeagueData): CoinData[] {
    return apiLeague.currencies.map(currency => {
        const displayName = CURRENCY_MAP[currency.name] || currency.name;
        const isGameToken = ['RLT', 'RST', 'HMT'].includes(displayName);

        // API totalPower is in Gh/s → convert to base H/s
        const baseValue = currency.totalPower * 1e9;
        const leaguePower = autoScalePower(baseValue);

        return {
            code: displayName.toLowerCase(),
            displayName,
            leaguePower,
            leaguePowerFormatted: formatHashPower(leaguePower),
            isGameToken,
        };
    });
}

/**
 * Converts raw API response to internal league format
 */
export function convertApiResponseToLeagues(apiData: ApiLeaguesResponse): LeagueInfo[] {
    return apiData.map(convertApiLeagueToInternal);
}
