import { CoinData, EarningsResult, HashPower, Period, GAME_TOKENS } from '../types';
import { powerRatio, formatHashPower } from './powerParser';
import { TFunction } from 'i18next';

// Default block time in minutes (9 minutes 56 seconds = 596 seconds)
const DEFAULT_BLOCK_TIME_SECONDS = 596;

/**
 * Calculate blocks per period based on duration
 */
export function getBlocksPerPeriod(period: Period, blockDurationSeconds: number = DEFAULT_BLOCK_TIME_SECONDS): number {
    const blockTimeMinutes = blockDurationSeconds / 60;
    // Protect against zero division
    if (blockTimeMinutes <= 0) return 0;

    const hourly = 60 / blockTimeMinutes;

    switch (period) {
        case 'hourly': return hourly;
        case 'daily': hourly * 24; // Implicit fallthrough fix below
            return hourly * 24;
        case 'weekly': return hourly * 24 * 7;
        case 'monthly': return hourly * 24 * 30;
    }
}

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
    blockRewards: Record<string, number>,
    blockDurationSeconds: number = DEFAULT_BLOCK_TIME_SECONDS
): EarningsResult {
    const { code, displayName, leaguePower, isGameToken: gameToken } = coin;

    // Get block reward (use user override or default)
    const blockReward = blockRewards[displayName] ?? 0;

    // Calculate power share ratio
    const share = powerRatio(userPower, leaguePower);

    // Calculate reward per block
    const rewardPerBlock = blockReward * share;

    // Calculate earnings for each period
    const earnings = {
        perBlock: rewardPerBlock,
        hourly: rewardPerBlock * getBlocksPerPeriod('hourly', blockDurationSeconds),
        daily: rewardPerBlock * getBlocksPerPeriod('daily', blockDurationSeconds),
        weekly: rewardPerBlock * getBlocksPerPeriod('weekly', blockDurationSeconds),
        monthly: rewardPerBlock * getBlocksPerPeriod('monthly', blockDurationSeconds),
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
    blockRewards: Record<string, number>,
    customBlockDurations: Record<string, number> = {}
): EarningsResult[] {
    return coins.map(coin => {
        // Look up by symbol (e.g. BTC, ETH)
        // Duration is 596 if not found
        const duration = customBlockDurations[coin.displayName]
            || customBlockDurations[coin.code]
            || DEFAULT_BLOCK_TIME_SECONDS;

        return calculateCoinEarnings(coin, userPower, blockRewards, duration);
    });
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
 * Format USD amount
 */
/**
 * Format USD amount
 */
export function formatUSD(amount: number): string {
    if (amount === null || amount === undefined || !Number.isFinite(amount) || Number.isNaN(amount)) {
        return '$0.00';
    }

    // User requested "100.51" format.
    // If amount is very small (less than 1 cent), we can show it as < $0.01 or just 0.00 depending on interpretation.
    // "en fazla 1 cent altını göstermemize gerek yok" -> We don't need to show below 1 cent.
    // So simple standard currency format (2 decimals) should suffice.

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
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
