

export interface LeagueInfo {
    id: string;
    name: string;
    minPower: number; // in Gh/s based on analysis
    currencies: {
        name: string;
        payout: number;
    }[];
}

// Helper to scale payouts to block rewards
// Based on RLT/RST (1e6 scale) matching our calculations
// Only RLT, RST, HMT seem consistent with 1e6 scale compared to calc.
// Others are tricky. For now, we'll try to map them dynamically.
export const LEAGUES: LeagueInfo[] = [
    {
        id: "bronze-1",
        name: "Bronze I",
        minPower: 0,
        currencies: [
            { name: "RLT", payout: 738280 },
            { name: "RST", payout: 46000000 },
            { name: "SAT", payout: 17900 },
            { name: "LTC_SMALL", payout: 119000 },
        ]
    },
    {
        id: "bronze-2",
        name: "Bronze II",
        minPower: 5000000,
        currencies: [
            { name: "RLT", payout: 1339840 },
            { name: "RST", payout: 83000000 },
            { name: "SAT", payout: 38900 },
            { name: "LTC_SMALL", payout: 253000 },
            { name: "BNB_SMALL", payout: 6700000 },
        ]
    },
    {
        id: "bronze-3",
        name: "Bronze III",
        minPower: 30000000,
        currencies: [
            { name: "RLT", payout: 1900000 },
            { name: "RST", payout: 117000000 },
            { name: "SAT", payout: 75900 },
            { name: "LTC_SMALL", payout: 490000 },
            { name: "BNB_SMALL", payout: 8700000 },
            { name: "MATIC_SMALL", payout: 67300000000 },
        ]
    },
    {
        id: "silver-1",
        name: "Silver I",
        minPower: 100000000,
        currencies: [
            { name: "RLT", payout: 1120000 },
            { name: "RST", payout: 69000000 },
            { name: "SAT", payout: 49400 },
            { name: "LTC_SMALL", payout: 300000 },
            { name: "BNB_SMALL", payout: 5100000 },
            { name: "MATIC_SMALL", payout: 37600000000 },
            { name: "XRP_SMALL", payout: 300000 },
        ]
    },
    {
        id: "silver-2",
        name: "Silver II",
        minPower: 200000000,
        currencies: [
            { name: "RLT", payout: 1320000 },
            { name: "RST", payout: 81000000 },
            { name: "SAT", payout: 52800 },
            { name: "LTC_SMALL", payout: 310000 },
            { name: "BNB_SMALL", payout: 4900000 },
            { name: "MATIC_SMALL", payout: 34400000000 },
            { name: "XRP_SMALL", payout: 260000 },
            { name: "DOGE_SMALL", payout: 63900 },
        ]
    },
    {
        id: "silver-3",
        name: "Silver III",
        minPower: 500000000,
        currencies: [
            { name: "RLT", payout: 1080000 },
            { name: "RST", payout: 66000000 },
            { name: "SAT", payout: 47100 },
            { name: "LTC_SMALL", payout: 260000 },
            { name: "BNB_SMALL", payout: 4000000 },
            { name: "MATIC_SMALL", payout: 26300000000 },
            { name: "XRP_SMALL", payout: 190000 },
            { name: "DOGE_SMALL", payout: 44200 },
            { name: "ETH_SMALL", payout: 2400000 },
        ]
    },
    {
        id: "gold-1",
        name: "Gold I",
        minPower: 1000000000,
        currencies: [
            { name: "RLT", payout: 810000 },
            { name: "RST", payout: 50000000 },
            { name: "SAT", payout: 39600 },
            { name: "LTC_SMALL", payout: 210000 },
            { name: "BNB_SMALL", payout: 3000000 },
            { name: "MATIC_SMALL", payout: 19000000000 },
            { name: "XRP_SMALL", payout: 130000 },
            { name: "DOGE_SMALL", payout: 28700 },
            { name: "ETH_SMALL", payout: 1500000 },
            { name: "TRX_SMALL", payout: 25600000000 },
        ]
    },
    {
        id: "gold-2",
        name: "Gold II",
        minPower: 2000000000,
        currencies: [
            { name: "RLT", payout: 1300000 },
            { name: "RST", payout: 80000000 },
            { name: "SAT", payout: 63200 },
            { name: "LTC_SMALL", payout: 270000 },
            { name: "BNB_SMALL", payout: 4000000 },
            { name: "MATIC_SMALL", payout: 22900000000 },
            { name: "XRP_SMALL", payout: 150000 },
            { name: "DOGE_SMALL", payout: 33900 },
            { name: "ETH_SMALL", payout: 1700000 },
            { name: "TRX_SMALL", payout: 28700000000 },
            { name: "SOL_SMALL", payout: 10700000 },
            { name: "HMT", payout: 625000000 },
        ]
    },
    {
        id: "gold-3",
        name: "Gold III",
        minPower: 5000000000,
        currencies: [
            { name: "RLT", payout: 3330000 },
            { name: "RST", payout: 204000000 },
            { name: "SAT", payout: 176000 },
            { name: "LTC_SMALL", payout: 840000 },
            { name: "BNB_SMALL", payout: 12700000 },
            { name: "MATIC_SMALL", payout: 77100000000 },
            { name: "XRP_SMALL", payout: 520000 },
            { name: "DOGE_SMALL", payout: 120300 },
            { name: "ETH_SMALL", payout: 6100000 },
            { name: "TRX_SMALL", payout: 108300000000 },
            { name: "SOL_SMALL", payout: 28000000 },
            { name: "HMT", payout: 1528000000 },
        ]
    },
    {
        id: "platinum-1",
        name: "Platinum I",
        minPower: 15000000000,
        currencies: [
            { name: "RLT", payout: 5510000 },
            { name: "RST", payout: 338000000 },
            { name: "SAT", payout: 354600 },
            { name: "LTC_SMALL", payout: 1750000 },
            { name: "BNB_SMALL", payout: 27300000 },
            { name: "MATIC_SMALL", payout: 171500000000 },
            { name: "XRP_SMALL", payout: 1200000 },
            { name: "DOGE_SMALL", payout: 283900 },
            { name: "ETH_SMALL", payout: 14800000 },
            { name: "TRX_SMALL", payout: 270500000000 },
            { name: "SOL_SMALL", payout: 36200000 },
            { name: "ALGO_SMALL", payout: 30900000 },
            { name: "HMT", payout: 3125000000 },
        ]
    },
    {
        id: "platinum-2",
        name: "Platinum II",
        minPower: 50000000000,
        currencies: [
            { name: "RLT", payout: 2580000 },
            { name: "RST", payout: 158000000 },
            { name: "SAT", payout: 217200 },
            { name: "LTC_SMALL", payout: 1070000 },
            { name: "BNB_SMALL", payout: 17400000 },
            { name: "MATIC_SMALL", payout: 111100000000 },
            { name: "XRP_SMALL", payout: 800000 },
            { name: "DOGE_SMALL", payout: 194100 },
            { name: "ETH_SMALL", payout: 10400000 },
            { name: "TRX_SMALL", payout: 193500000000 },
            { name: "SOL_SMALL", payout: 39800000 },
            { name: "ALGO_SMALL", payout: 12900000 },
            { name: "HMT", payout: 2430000000 },
        ]
    },
    // Add simplified versions for others if needed, skipping to Diamond III just in case
    {
        id: "diamond-3",
        name: "Diamond III",
        minPower: 10000000000000,
        currencies: [
            { name: "RST", payout: 11000000 },
            { name: "SAT", payout: 19800 },
            { name: "LTC_SMALL", payout: 199000 },
            { name: "BNB_SMALL", payout: 3000000 },
            { name: "MATIC_SMALL", payout: 13216300000 },
            { name: "XRP_SMALL", payout: 117720 },
            { name: "DOGE_SMALL", payout: 17745 },
            { name: "ETH_SMALL", payout: 900000 },
            { name: "TRX_SMALL", payout: 12620000000 },
            { name: "SOL_SMALL", payout: 2490000 },
            { name: "ALGO_SMALL", payout: 1839420 },
        ]
    }
];

// Map currency internal names to standard codes
export const CURRENCY_MAP: Record<string, string> = {
    'SAT': 'BTC',
    'LTC_SMALL': 'LTC',
    'BNB_SMALL': 'BNB',
    'MATIC_SMALL': 'POL',
    'XRP_SMALL': 'XRP',
    'DOGE_SMALL': 'DOGE',
    'ETH_SMALL': 'ETH',
    'TRX_SMALL': 'TRX',
    'SOL_SMALL': 'SOL',
    'ALGO_SMALL': 'ALGO',
    'RLT': 'RLT',
    'RST': 'RST',
    'HMT': 'HMT',
};
