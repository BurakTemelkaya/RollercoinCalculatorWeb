import { CoinData, EarningsResult, HashPower, Period, GAME_TOKENS, DEFAULT_BLOCK_REWARDS } from '../types';
import { powerRatio, formatHashPower } from './powerParser';
import { TFunction } from 'i18next';

// Block time in minutes (Rollercoin standard)
const BLOCK_TIME_MINUTES = 10;

// Blocks per period
const BLOCKS_PER_PERIOD: Record<Period, number> = {
    hourly: 60 / BLOCK_TIME_MINUTES,           // 6 blocks
    daily: (60 / BLOCK_TIME_MINUTES) * 24,     // 144 blocks
    weekly: (60 / BLOCK_TIME_MINUTES) * 24 * 7, // 1008 blocks
    monthly: (60 / BLOCK_TIME_MINUTES) * 24 * 30, // 4320 blocks
};

/**
 * Check if a currency is a game token
 */
export function isGameToken(currency: string): boolean {
    return GAME_TOKENS.includes(currency.toUpperCase());
}

/**
 * Calculate earnings for a single coin
 */
export function calculateCoinEarnings(
    coin: CoinData,
    userPower: HashPower,
    blockRewards: Record<string, number>
): EarningsResult {
    const { code, displayName, leaguePower, isGameToken: gameToken } = coin;

    // Get block reward (use user override or default)
    const blockReward = blockRewards[displayName] ?? DEFAULT_BLOCK_REWARDS[displayName] ?? 0;

    // Calculate power share ratio
    const share = powerRatio(userPower, leaguePower);

    // Calculate reward per block
    const rewardPerBlock = blockReward * share;

    // Calculate earnings for each period
    const earnings = {
        perBlock: rewardPerBlock,
        hourly: rewardPerBlock * BLOCKS_PER_PERIOD.hourly,
        daily: rewardPerBlock * BLOCKS_PER_PERIOD.daily,
        weekly: rewardPerBlock * BLOCKS_PER_PERIOD.weekly,
        monthly: rewardPerBlock * BLOCKS_PER_PERIOD.monthly,
    };

    return {
        code,
        displayName,
        leaguePower,
        leaguePowerFormatted: formatHashPower(leaguePower),
        powerShare: share * 100,
        earnings,
        isGameToken: gameToken,
    };
}

/**
 * Calculate all coin earnings
 */
export function calculateAllEarnings(
    coins: CoinData[],
    userPower: HashPower,
    blockRewards: Record<string, number>
): EarningsResult[] {
    return coins.map(coin => calculateCoinEarnings(coin, userPower, blockRewards));
}

/**
 * Format crypto amount based on typical values
 */
export function formatCryptoAmount(amount: number, _currency?: string): string {
    if (amount === null || amount === undefined || !Number.isFinite(amount) || Number.isNaN(amount)) {
        return '0.00';
    }

    const absAmount = Math.abs(amount);
    let decimals: number;

    if (absAmount === 0) {
        decimals = 2;
    } else if (absAmount < 0.0001) {
        decimals = 8;
    } else if (absAmount < 0.01) {
        decimals = 6;
    } else if (absAmount < 1) {
        decimals = 4;
    } else if (absAmount < 100) {
        decimals = 2;
    } else {
        decimals = 0;
    }

    try {
        return amount.toLocaleString('en-US', {
            minimumFractionDigits: Math.min(2, decimals),
            maximumFractionDigits: decimals,
        });
    } catch {
        return amount.toFixed(2);
    }
}

/**
 * Calculate days to withdraw based on progress percentage
 */
export function calculateWithdrawTime(
    earningPerDay: number,
    minWithdraw: number,
    currentPercent: number
): { daysToWithdraw: number; currentBalance: number; remainingToEarn: number; canWithdrawNow: boolean } {
    const currentBalance = minWithdraw * (currentPercent / 100);
    const remainingToEarn = Math.max(0, minWithdraw - currentBalance);
    const canWithdrawNow = currentPercent >= 100;

    const daysToWithdraw = canWithdrawNow ? 0 : (earningPerDay > 0 ? remainingToEarn / earningPerDay : Infinity);

    return {
        daysToWithdraw,
        currentBalance,
        remainingToEarn,
        canWithdrawNow,
    };
}


/**
 * Format time duration for display
 */
export function formatDuration(days: number, t: TFunction): string {
    if (!Number.isFinite(days)) return '-';

    if (days < 1) {
        const hours = Math.ceil(days * 24);
        return `${hours} ${t('withdraw.hours')}`;
    } else if (days < 30) {
        return `${Math.ceil(days)} ${t('withdraw.days')}`;
    } else {
        const months = Math.floor(days / 30);
        const remainingDays = Math.ceil(days % 30);
        if (remainingDays > 0) {
            return `${months} ${t('withdraw.months')} ${remainingDays} ${t('withdraw.days')}`;
        }
        return `${months} ${t('withdraw.months')}`;
    }
}

/**
 * Get period display name
 */
export function getPeriodName(period: Period): string {
    const names: Record<Period, string> = {
        hourly: 'Saatlik',
        daily: 'Günlük',
        weekly: 'Haftalık',
        monthly: 'Aylık',
    };
    return names[period];
}

/**
 * Format power from Gh value (for API-like values)
 */
export function formatPowerFromGh(power: number): string {
    if (!Number.isFinite(power) || Number.isNaN(power) || power <= 0) {
        return '0 Gh/s';
    }

    const units = ['Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh'];
    let unitIndex = 0;
    let value = power;

    while (value >= 1000 && unitIndex < units.length - 1) {
        value /= 1000;
        unitIndex++;
    }

    return `${value.toFixed(2)} ${units[unitIndex]}/s`;
}
