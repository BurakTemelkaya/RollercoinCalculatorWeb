import { LEAGUES, LeagueInfo } from '../data/leagues';
import { HashPower } from '../types';
import { toBaseUnit } from './powerParser';
import { getCurrencyConfig } from '../data/currencies';

// Manual overrides or fallbacks if config is missing
const PAYOUT_SCALES_FALLBACK: Record<string, number> = {
    'SAT': 1e10, // BTC Special case override
    'BTC': 1e10,
    'ETH_SMALL': 1e10, // Config confirms 1e10
    'BNB_SMALL': 1e10, // Config confirms 1e10
    'MATIC_SMALL': 1e10, // Config confirms 1e10
    'TRX_SMALL': 1e10, // Config confirms 1e10
    'SOL_SMALL': 1e9, // Config confirms 1e9
    'LTC_SMALL': 1e8, // Config confirms 1e8
    'DOGE_SMALL': 1e4, // Config confirms 1e4
    'USDT_SMALL': 1e6, // Config confirms 1e6
};

/**
 * Get the appropriate league based on user's power
 * @param power - User's hash power
 * @param customLeagues - Optional custom leagues to search (e.g. from API)
 */
export function getLeagueByPower(power: HashPower | null, customLeagues?: LeagueInfo[]): LeagueInfo {
    const leaguesList = customLeagues || LEAGUES;
    if (!power) return leaguesList[0];

    const powerInGh = toBaseUnit(power) / 1e9; // Convert to Gh/s

    // Create a copy and sort by minPower descending
    const sortedLeagues = [...leaguesList].sort((a, b) => b.minPower - a.minPower);

    for (const league of sortedLeagues) {
        if (powerInGh >= league.minPower) {
            return league;
        }
    }

    return leaguesList[0]; // Default to first league
}

/**
 * Extract block rewards from league info
 */
export function getBlockRewardsForLeague(league: LeagueInfo): Record<string, number> {
    const rewards: Record<string, number> = {};

    if (!league || !league.currencies) return rewards;

    league.currencies.forEach(currency => {
        let name = currency.name;
        const payout = currency.payout;

        // Try to get config
        const config = getCurrencyConfig(name);
        let scale = 1e8; // Default

        if (config) {
            // Use config scale
            scale = config.to_small;

            // Special case for BTC if config says 1e8 but we need 1e10 for correct values
            if (config.name === 'BTC' && scale === 1e8) {
                scale = 1e10;
            }
        } else {
            // Fallback to manual map
            scale = PAYOUT_SCALES_FALLBACK[name] || 1e8;
        }

        // Map internal names to standard codes
        let code = name;
        if (config) {
            code = config.display_name; // e.g. "POL" for MATIC
        } else {
            if (name === 'SAT') code = 'BTC';
            else if (name.endsWith('_SMALL')) {
                code = name.replace('_SMALL', '');
            }
            if (code === 'MATIC') code = 'POL';
        }

        // Calculate reward
        rewards[code] = payout / scale;
    });

    return rewards;
}
