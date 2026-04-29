/**
 * Daily Bonus Quest Types
 *
 * Types for the Daily Bonus Quest API endpoints.
 * Template variables in title/description (e.g. {count_repeats}, {reward})
 * are resolved on the frontend using quest data + additionalData.
 */

export interface DailyBonusQuestCurrency {
    name: string;
    id: number;
    createdDate: string;
    updatedDate: string | null;
    deletedDate: string | null;
}

export interface DailyBonusQuestReward {
    amount: number;
    currency: DailyBonusQuestCurrency | null;
    currencyId: number | null;
    description: string;       // Template like "{amount} {currency}"
    type: 'season_xp' | 'money' | string;
    itemId: string | null;
}

export interface DailyBonusQuest {
    id: string;
    title: string;             // Template: "Exchange {count_repeats} RLT or more"
    description: string;       // Template with placeholders
    countRepeats: number;
    replaceConfigCurrency: string;
    replaceConfigIsAvailable: boolean;
    replaceConfigPrice: number;
    paidConfigCurrency: string;
    paidConfigIsAvailable: boolean;
    paidConfigPrice: number;
    createdDate: string;
    endDate: string;
    additionalData: Record<string, string> | null;
    dailyBonusQuestRewards: DailyBonusQuestReward[];
}
