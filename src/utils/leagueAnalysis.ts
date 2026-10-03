import { CURRENCY_MAP, type LeagueInfo } from '../data/leagues';
import type { ApiLeagueData } from '../types/api';
import { getBlocksPerPeriod } from './calculator';
import { getBlockRewardsForLeague } from './leagueHelper';
import { autoScalePower, toBaseUnit } from './powerParser';

export function getLeagueAnalysisCeilingGh(league: LeagueInfo, nextLeague?: LeagueInfo): number {
    // The highest league has no ceiling; keep its entry power as the default.
    if (!nextLeague) return league.minPower;

    const boundary = autoScalePower(nextLeague.minPower * 1e9);
    // Express the 1 Yh boundary in Zh so it also uses the requested 0.1 Zh margin.
    if (boundary.unit === 'Yh') {
        boundary.value *= 1000;
        boundary.unit = 'Zh';
    }
    const margin = boundary.unit === 'Eh' || boundary.unit === 'Zh' ? 0.1
        : boundary.unit === 'Ph' ? 1 : 0;
    const ceilingGh = margin > 0
        ? toBaseUnit({ value: Math.round((boundary.value - margin) * 100) / 100, unit: boundary.unit }) / 1e9
        : nextLeague.minPower - 1;
    return Math.max(league.minPower, ceilingGh);
}

/** Shared mining model for the earnings estimate and its inverse. Power is in Gh/s. */
export function getLeagueMiningRate(
    league: LeagueInfo,
    currencyName: string,
    referencePowerGh: number,
    blockDurations: Record<string, number>,
    apiLeagueData?: ApiLeagueData,
) {
    const displayName = CURRENCY_MAP[currencyName] || currencyName;
    const currency = league.currencies.find(c => c.name === currencyName);
    const blockReward = getBlockRewardsForLeague(league)[displayName];
    if (!currency || !Number.isFinite(blockReward) || blockReward <= 0) return null;

    const apiCurrency = apiLeagueData?.currencies.find(c => c.name === currencyName);
    const hasNetworkPower = !!apiCurrency && Number.isFinite(apiCurrency.totalPower) && apiCurrency.totalPower > 0;
    const totalPowerGh = hasNetworkPower ? apiCurrency.totalPower
        : apiLeagueData || referencePowerGh >= 1e15 ? 1e15 : referencePowerGh * 100;
    const duration = apiCurrency && apiCurrency.duration > 0 ? apiCurrency.duration
        : currency.duration && currency.duration > 0 ? currency.duration
            : blockDurations[displayName] || 596;

    return { totalPowerGh, duration, blockReward, dailyReward: blockReward * getBlocksPerPeriod('daily', duration), hasNetworkPower };
}

export type NextLeaguePower =
    | { status: 'available'; powerGh: number; exceedsLeague: boolean }
    | { status: 'missingCoin' | 'missingData' | 'unreachable' };

/** Minimum power to earn at least the same amount of the same coin in the next league. */
export function getNextLeaguePower(
    dailyAmount: number,
    coin: string,
    nextLeague: LeagueInfo,
    upperLeague: LeagueInfo | undefined,
    blockDurations: Record<string, number>,
    apiLeagueData?: ApiLeagueData,
): NextLeaguePower {
    const currency = nextLeague.currencies.find(c => (CURRENCY_MAP[c.name] || c.name) === coin);
    if (!currency) return { status: 'missingCoin' };
    const rate = getLeagueMiningRate(nextLeague, currency.name, nextLeague.minPower, blockDurations, apiLeagueData);
    if (!rate?.hasNetworkPower || !Number.isFinite(rate.dailyReward) || rate.dailyReward <= 0 || !Number.isFinite(dailyAmount) || dailyAmount <= 0) {
        return { status: 'missingData' };
    }
    // The earnings model caps the player's share at 100% of the block reward.
    if (dailyAmount > rate.dailyReward * (1 + 1e-12)) return { status: 'unreachable' };
    const powerGh = Math.max(nextLeague.minPower, Math.min(1, dailyAmount / rate.dailyReward) * rate.totalPowerGh);
    return { status: 'available', powerGh, exceedsLeague: !!upperLeague && powerGh >= upperLeague.minPower };
}
