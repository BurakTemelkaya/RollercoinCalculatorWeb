import { CoinData, GAME_TOKENS } from '../types';
import { parseHashPower, formatHashPower } from './powerParser';

/**
 * Parse league data from pasted text
 * 
 * Expected format (groups of 3 lines):
 * code
 * DISPLAY_NAME
 * X.XXX Xh/s
 * 
 * Example:
 * rlt
 * RLT
 * 2.827 Zh/s
 * 
 * btc
 * BTC
 * 2.844 Zh/s
 */
export function parseLeagueData(text: string): CoinData[] {
    const coins: CoinData[] = [];

    // Normalize line endings and split
    const lines = text
        .replace(/\r\n/g, '\n')
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

    // Process in groups
    let i = 0;
    while (i < lines.length) {
        // Skip section headers like "Crypto Currencies"
        if (lines[i].includes(' ') && !lines[i].match(/[\d.,]+\s*[A-Za-z]h\/s/i)) {
            i++;
            continue;
        }

        // Need at least 3 lines for a complete coin entry
        if (i + 2 >= lines.length) break;

        const code = lines[i].toLowerCase();
        const displayName = lines[i + 1].toUpperCase();
        const powerString = lines[i + 2];

        // Validate that third line is a power string
        if (!powerString.match(/[\d.,]+\s*[A-Za-z]h/i)) {
            i++;
            continue;
        }

        const leaguePower = parseHashPower(powerString);

        if (leaguePower && code && displayName) {
            coins.push({
                code,
                displayName,
                leaguePower,
                leaguePowerFormatted: formatHashPower(leaguePower),
                isGameToken: GAME_TOKENS.includes(displayName),
            });
        }

        i += 3;
    }

    return coins;
}

/**
 * Validate user power input
 */
export function parseUserPower(text: string) {
    return parseHashPower(text.trim());
}
