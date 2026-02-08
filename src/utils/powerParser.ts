import { HashPower, PowerUnit } from '../types';

// Hash power unit multipliers (each unit is 1000x the previous)
const UNIT_MULTIPLIERS: Record<PowerUnit, number> = {
    'H': 1,
    'Kh': 1e3,
    'Mh': 1e6,
    'Gh': 1e9,
    'Th': 1e12,
    'Ph': 1e15,
    'Eh': 1e18,
    'Zh': 1e21,
    'Yh': 1e24,
};

const UNIT_ORDER: PowerUnit[] = ['H', 'Kh', 'Mh', 'Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh'];

/**
 * Parse a hash power string like "11.322 Eh/s" or "3.932 Zh/s"
 * @param powerString - The power string to parse
 * @returns HashPower object with value and unit, or null if parsing fails
 */
export function parseHashPower(powerString: string): HashPower | null {
    if (!powerString) return null;

    // Clean up the string
    const cleaned = powerString.trim().replace('/s', '').replace(/\s+/g, ' ');

    // Match pattern like "11.322 Eh" or "881.997 Eh"
    const match = cleaned.match(/^([\d.,]+)\s*([A-Za-z]+)$/);

    if (!match) return null;

    const valueStr = match[1].replace(',', '.');
    const value = parseFloat(valueStr);
    const unitRaw = match[2];

    // Normalize unit (capitalize first letter, lowercase rest)
    const unit = normalizeUnit(unitRaw);

    if (isNaN(value) || !unit) return null;

    return { value, unit };
}

/**
 * Normalize unit string to standard format
 */
function normalizeUnit(unitRaw: string): PowerUnit | null {
    const normalized = unitRaw.charAt(0).toUpperCase() + unitRaw.slice(1).toLowerCase();

    // Handle special case for single 'H'
    if (unitRaw.toLowerCase() === 'h') return 'H';

    // Remove trailing 'h' if present and add it back properly
    const withoutH = normalized.replace(/h$/i, '');
    const finalUnit = withoutH + 'h';

    if (UNIT_ORDER.includes(finalUnit as PowerUnit)) {
        return finalUnit as PowerUnit;
    }

    // Try direct match
    if (UNIT_ORDER.includes(normalized as PowerUnit)) {
        return normalized as PowerUnit;
    }

    return null;
}

/**
 * Convert hash power to base unit (H/s)
 */
export function toBaseUnit(power: HashPower): number {
    return power.value * UNIT_MULTIPLIERS[power.unit];
}

/**
 * Convert base unit (H/s) to a specific power unit
 */
export function fromBaseUnit(baseValue: number, targetUnit: PowerUnit): HashPower {
    return {
        value: baseValue / UNIT_MULTIPLIERS[targetUnit],
        unit: targetUnit,
    };
}

/**
 * Format hash power for display
 */
export function formatHashPower(power: HashPower): string {
    const formatted = power.value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    });
    return `${formatted} ${power.unit}/s`;
}

/**
 * Find the best unit for displaying a value (auto-scale)
 */
export function autoScalePower(baseValue: number): HashPower {
    let bestUnit: PowerUnit = 'H';

    for (const unit of UNIT_ORDER) {
        const converted = baseValue / UNIT_MULTIPLIERS[unit];
        if (converted >= 1 && converted < 1000) {
            bestUnit = unit;
            break;
        }
        if (converted >= 1) {
            bestUnit = unit;
        }
    }

    return fromBaseUnit(baseValue, bestUnit);
}

/**
 * Calculate power ratio (user / league)
 */
export function powerRatio(userPower: HashPower, leaguePower: HashPower): number {
    const userBase = toBaseUnit(userPower);
    const leagueBase = toBaseUnit(leaguePower);

    if (leagueBase === 0) return 0;

    return userBase / leagueBase;
}

import { CoinData } from '../types';

/**
 * Parse full text input pasted from Rollercoin site
 * Expected format blocks:
 * Coin Name
 * Coin Symbol
 * Network Power (e.g. 1.458 Zh/s)
 */
export function parsePowerText(text: string): { coins: CoinData[], userPower: HashPower | null } {
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    const coins: CoinData[] = [];
    let userPower: HashPower | null = null;

    // Iterate through lines to find patterns
    for (let i = 0; i < lines.length; i++) {
        // Check for coin pattern: Symbol on one line, Power on next
        // Or Name, Symbol, Power

        // Try to match power line
        const powerMatch = lines[i].match(/^([\d.,]+)\s*([A-Za-z]+)\/s$/);

        if (powerMatch) {
            // Found a power line. The previous line should be the symbol (e.g. "XRP")
            // And line before that could be name (e.g. "xrp")

            if (i > 0) {
                const symbolRaw = lines[i - 1];
                // Validator: symbol should be short (e.g. < 10 chars)
                if (symbolRaw.length < 10 && /^[A-Za-z0-9]+$/.test(symbolRaw)) {
                    const coinName = symbolRaw.toUpperCase();
                    const powerValue = parseFloat(powerMatch[1].replace(',', '.'));

                    // Helper map for unit case
                    const unitMap: Record<string, string> = {
                        'eh': 'Eh', 'zh': 'Zh', 'ph': 'Ph', 'th': 'Th', 'gh': 'Gh',
                        'Eh': 'Eh', 'Zh': 'Zh', 'Ph': 'Ph', 'Th': 'Th', 'Gh': 'Gh'
                    };
                    const unitRaw = powerMatch[2];
                    const unit = (unitMap[unitRaw] || unitMap[unitRaw.toLowerCase()] || 'Gh') as any;

                    // Determine if game token
                    const isGameToken = ['RLT', 'RST', 'HMT'].includes(coinName);

                    if (coinName !== 'TOTAL' && coinName !== 'TOPLAM') {
                        coins.push({
                            code: coinName,
                            displayName: coinName,
                            leaguePower: { value: powerValue, unit },
                            leaguePowerFormatted: `${powerValue} ${unit}/s`,
                            isGameToken
                        });
                    }
                }
            }
        }
    }

    return { coins, userPower };
}
