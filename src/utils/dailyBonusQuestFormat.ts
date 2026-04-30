import { getCurrencyConfig } from '../data/currencies';
import type { DailyBonusQuest } from '../types/dailyBonusQuest';

const CURRENCY_DIVISORS: Record<string, number> = {
    RLT: 1e6,
    RST: 1e6,
    HMT: 1e6,
    TWCOIN: 1e6,
};

export type NormalizedAdditionalData = Record<string, unknown> | null;

export function getCurrencyDivisor(currencyName: string, fallbackDivisor: number = 1): number {
    const config = getCurrencyConfig(currencyName);
    if (config) return config.to_small;
    return CURRENCY_DIVISORS[currencyName] || fallbackDivisor;
}

export function formatAmount(
    amount: number,
    currencyName?: string,
    fallbackDivisor: number = 1
): string {
    if (!currencyName) return String(amount);
    const divisor = getCurrencyDivisor(currencyName, fallbackDivisor);
    const value = amount / divisor;
    if (value >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

export function normalizeAdditionalData(
    additionalData: DailyBonusQuest['additionalData']
): NormalizedAdditionalData {
    if (!additionalData) return null;
    if (typeof additionalData === 'string') {
        try {
            const parsed = JSON.parse(additionalData);
            if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
                return parsed as Record<string, unknown>;
            }
        } catch {
            return null;
        }
        return null;
    }
    if (typeof additionalData === 'object' && !Array.isArray(additionalData)) {
        return additionalData as Record<string, unknown>;
    }
    return null;
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function templateHasCurrencyToken(template: string, currency?: string): boolean {
    if (!currency) return false;
    const pattern = new RegExp(`\\b${escapeRegExp(currency)}\\b`, 'i');
    return pattern.test(template);
}

function getAdditionalDataString(
    additionalData: NormalizedAdditionalData,
    key: string
): string | undefined {
    if (!additionalData) return undefined;
    const direct = additionalData[key];
    if (typeof direct === 'string') return direct;
    const braced = additionalData[`{${key}}`];
    if (typeof braced === 'string') return braced;
    return undefined;
}

export function shouldFormatCountAsCurrency(
    template: string,
    quest: DailyBonusQuest,
    additionalData: NormalizedAdditionalData
): boolean {
    if (additionalData && Array.isArray(additionalData['lootbox_ids'])) {
        return false;
    }

    if (template.includes('{currency}')) {
        return true;
    }

    const dataCurrency = getAdditionalDataString(additionalData, 'currency');
    const candidates = [dataCurrency, quest.replaceConfigCurrency, quest.paidConfigCurrency]
        .filter((value): value is string => Boolean(value));

    return candidates.some(currency => templateHasCurrencyToken(template, currency));
}

export function formatCountRepeats(
    template: string,
    quest: DailyBonusQuest,
    additionalData: NormalizedAdditionalData,
    options?: { fallbackDivisor?: number }
): string {
    if (shouldFormatCountAsCurrency(template, quest, additionalData)) {
        const dataCurrency = getAdditionalDataString(additionalData, 'currency');
        const countCurrency = dataCurrency || quest.replaceConfigCurrency || quest.paidConfigCurrency;
        return formatAmount(quest.countRepeats, countCurrency, options?.fallbackDivisor);
    }

    if (Number.isInteger(quest.countRepeats)) {
        return quest.countRepeats.toLocaleString('en-US');
    }

    return String(quest.countRepeats);
}

export function replaceAdditionalDataPlaceholders(
    template: string,
    additionalData: NormalizedAdditionalData
): string {
    if (!additionalData) return template;
    let result = template;

    for (const [key, value] of Object.entries(additionalData)) {
        if (value === null || value === undefined) continue;
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        const keyWithBraces = key.startsWith('{') ? key : `{${key}}`;
        const valueText = String(value);
        result = result.replace(new RegExp(keyWithBraces.replace(/[{}]/g, '\\$&'), 'g'), valueText);
    }

    return result;
}

export function resolveQuestTemplate(
    template: string,
    quest: DailyBonusQuest,
    options?: {
        rewardSummary?: string;
        rewardPlaceholder?: string;
        additionalData?: NormalizedAdditionalData;
        formatOptions?: { fallbackDivisor?: number };
    }
): string {
    const normalized = options?.additionalData ?? normalizeAdditionalData(quest.additionalData);
    let result = template;

    const countDisplay = formatCountRepeats(template, quest, normalized, options?.formatOptions);
    result = result.replace(/\{count_repeats\}/g, countDisplay);

    if (options?.rewardSummary !== undefined) {
        result = result.replace(/\{reward\}/g, options.rewardSummary);
    } else if (options?.rewardPlaceholder !== undefined) {
        result = result.replace(/\{reward\}/g, options.rewardPlaceholder);
    }

    return replaceAdditionalDataPlaceholders(result, normalized);
}
