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

function getAdditionalDataValue(
    additionalData: NormalizedAdditionalData,
    key: string
): unknown {
    if (!additionalData) return undefined;
    if (Object.prototype.hasOwnProperty.call(additionalData, key)) {
        return additionalData[key];
    }
    const bracedKey = `{${key}}`;
    if (Object.prototype.hasOwnProperty.call(additionalData, bracedKey)) {
        return additionalData[bracedKey];
    }
    return undefined;
}

function coerceNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) return parsed;
    }
    return null;
}

function formatPlainNumber(value: number): string {
    if (Number.isInteger(value)) return value.toLocaleString('en-US');
    return String(value);
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

function shouldFormatAmountAsCurrency(
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

function replacePlaceholder(template: string, key: string, value: string): string {
    const keyWithBraces = key.startsWith('{') ? key : `{${key}}`;
    return template.replace(new RegExp(escapeRegExp(keyWithBraces), 'g'), value);
}

export function replaceAdditionalDataPlaceholders(
    template: string,
    additionalData: NormalizedAdditionalData,
    options?: {
        quest?: DailyBonusQuest;
        formatOptions?: { fallbackDivisor?: number };
    }
): string {
    if (!additionalData) return template;
    let result = template;

    const quest = options?.quest;
    const fallbackDivisor = options?.formatOptions?.fallbackDivisor;
    const fallbackCurrency = quest ? (quest.replaceConfigCurrency || quest.paidConfigCurrency) : undefined;
    const dataCurrency = getAdditionalDataString(additionalData, 'currency') || fallbackCurrency;

    if (quest) {
        const amountValue = getAdditionalDataValue(additionalData, 'amount');
        if (amountValue !== undefined && amountValue !== null) {
            let amountText: string | undefined;
            if (typeof amountValue === 'string') {
                const numeric = coerceNumber(amountValue);
                if (numeric !== null) {
                    amountText = shouldFormatAmountAsCurrency(template, quest, additionalData) && dataCurrency
                        ? formatAmount(numeric, dataCurrency, fallbackDivisor)
                        : formatPlainNumber(numeric);
                } else {
                    amountText = amountValue;
                }
            } else {
                const numeric = coerceNumber(amountValue);
                if (numeric !== null) {
                    amountText = shouldFormatAmountAsCurrency(template, quest, additionalData) && dataCurrency
                        ? formatAmount(numeric, dataCurrency, fallbackDivisor)
                        : formatPlainNumber(numeric);
                }
            }
            if (amountText !== undefined) {
                result = replacePlaceholder(result, 'amount', amountText);
            }
        } else if (result.includes('{amount}')) {
            result = replacePlaceholder(result, 'amount', '');
        }

        if (dataCurrency) {
            result = replacePlaceholder(result, 'currency', dataCurrency);
        } else if (result.includes('{currency}')) {
            result = replacePlaceholder(result, 'currency', '');
        }
    }

    // Specific Rollercoin map for provider_name -> provider_title & offertoro -> torox
    const providerTitle = getAdditionalDataString(additionalData, 'provider_title');
    if (providerTitle) {
        const providerName = providerTitle.toLowerCase() === 'offertoro' ? 'torox' : providerTitle;
        // In local web we might not want to inject HTML tags directly into strings
        // if we are rendering React safely, but we can match the upper-case aesthetic or just string
        result = replacePlaceholder(result, 'provider_name', providerName.toUpperCase());
    }

    const handledKeys = new Set(['amount', '{amount}', 'currency', '{currency}', 'provider_title']);

    for (const [key, value] of Object.entries(additionalData)) {
        if (handledKeys.has(key)) continue;
        const keyWithBraces = key.startsWith('{') ? key : `{${key}}`;
        if (!result.includes(keyWithBraces)) continue;
        if (value === null || value === undefined) {
            result = result.replace(new RegExp(escapeRegExp(keyWithBraces), 'g'), '');
            continue;
        }
        if (typeof value !== 'string' && typeof value !== 'number') continue;
        const valueText = typeof value === 'number' ? formatPlainNumber(value) : value;
        result = result.replace(new RegExp(escapeRegExp(keyWithBraces), 'g'), valueText);
    }

    return result;
}

export function resolveQuestTemplate(
    template: string,
    quest: DailyBonusQuest,
    options?: {
        rewardSummary?: string;
        rewardPlaceholder?: string;
        dayType?: string;
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

    if (options?.dayType !== undefined) {
        result = result.replace(/\{day_type\}/g, options.dayType);
    }

    return replaceAdditionalDataPlaceholders(result, normalized, {
        quest,
        formatOptions: options?.formatOptions
    });
}
