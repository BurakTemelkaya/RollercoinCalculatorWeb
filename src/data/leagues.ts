

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
            { name: "RLT", payout: 466160 },
            { name: "RST", payout: 28590940 },
            { name: "SAT", payout: 18000 },
            { name: "LTC_SMALL", payout: 152000 },
        ]
    },
    {
        id: "bronze-2",
        name: "Bronze II",
        minPower: 5000000,
        currencies: [
            { name: "RLT", payout: 828150 },
            { name: "RST", payout: 50792970 },
            { name: "SAT", payout: 39000 },
            { name: "LTC_SMALL", payout: 316000 },
            { name: "BNB_SMALL", payout: 5600000 },
        ]
    },
    {
        id: "bronze-3",
        name: "Bronze III",
        minPower: 30000000,
        currencies: [
            { name: "RLT", payout: 1166980 },
            { name: "RST", payout: 71574820 },
            { name: "SAT", payout: 59000 },
            { name: "LTC_SMALL", payout: 434000 },
            { name: "BNB_SMALL", payout: 7400000 },
            { name: "MATIC_SMALL", payout: 41307700000 },
        ]
    },
    {
        id: "silver-1",
        name: "Silver I",
        minPower: 100000000,
        currencies: [
            { name: "RLT", payout: 686070 },
            { name: "RST", payout: 42078800 },
            { name: "SAT", payout: 31000 },
            { name: "LTC_SMALL", payout: 191000 },
            { name: "BNB_SMALL", payout: 3600000 },
            { name: "MATIC_SMALL", payout: 18870800000 },
            { name: "XRP_SMALL", payout: 163670 },
            { name: "USDT_SMALL", payout: 291670 },
        ]
    },
    {
        id: "silver-2",
        name: "Silver II",
        minPower: 200000000,
        currencies: [
            { name: "RLT", payout: 808890 },
            { name: "RST", payout: 49612130 },
            { name: "SAT", payout: 31000 },
            { name: "LTC_SMALL", payout: 216000 },
            { name: "BNB_SMALL", payout: 3300000 },
            { name: "MATIC_SMALL", payout: 20128800000 },
            { name: "XRP_SMALL", payout: 149640 },
            { name: "DOGE_SMALL", payout: 34067 },
            { name: "USDT_SMALL", payout: 416670 },
        ]
    },
    {
        id: "silver-3",
        name: "Silver III",
        minPower: 500000000,
        currencies: [
            { name: "RLT", payout: 660760 },
            { name: "RST", payout: 40526380 },
            { name: "SAT", payout: 29000 },
            { name: "LTC_SMALL", payout: 191000 },
            { name: "BNB_SMALL", payout: 2200000 },
            { name: "MATIC_SMALL", payout: 6290300000 },
            { name: "XRP_SMALL", payout: 93530 },
            { name: "DOGE_SMALL", payout: 27254 },
            { name: "ETH_SMALL", payout: 1400000 },
            { name: "USDT_SMALL", payout: 555560 },
        ]
    },
    {
        id: "gold-1",
        name: "Gold I",
        minPower: 1000000000,
        currencies: [
            { name: "RLT", payout: 498230 },
            { name: "RST", payout: 30558200 },
            { name: "SAT", payout: 20000 },
            { name: "LTC_SMALL", payout: 153000 },
            { name: "BNB_SMALL", payout: 2100000 },
            { name: "MATIC_SMALL", payout: 9435400000 },
            { name: "XRP_SMALL", payout: 84180 },
            { name: "DOGE_SMALL", payout: 22498 },
            { name: "ETH_SMALL", payout: 1000000 },
            { name: "TRX_SMALL", payout: 12304100000 },
            { name: "USDT_SMALL", payout: 312500 },
        ]
    },
    {
        id: "gold-2",
        name: "Gold II",
        minPower: 2000000000,
        currencies: [
            { name: "RLT", payout: 799300 },
            { name: "RST", payout: 49023850 },
            { name: "SAT", payout: 36000 },
            { name: "LTC_SMALL", payout: 199000 },
            { name: "BNB_SMALL", payout: 2500000 },
            { name: "MATIC_SMALL", payout: 12108900000 },
            { name: "XRP_SMALL", payout: 103870 },
            { name: "DOGE_SMALL", payout: 20440 },
            { name: "ETH_SMALL", payout: 1200000 },
            { name: "TRX_SMALL", payout: 12304100000 },
            { name: "SOL_SMALL", payout: 6510000 },
            { name: "HMT", payout: 625000000 },
            { name: "USDT_SMALL", payout: 555560 },
        ]
    },
    {
        id: "gold-3",
        name: "Gold III",
        minPower: 5000000000,
        currencies: [
            { name: "RLT", payout: 2043550 },
            { name: "RST", payout: 125337630 },
            { name: "SAT", payout: 132000 },
            { name: "LTC_SMALL", payout: 664000 },
            { name: "BNB_SMALL", payout: 7800000 },
            { name: "MATIC_SMALL", payout: 37741500000 },
            { name: "XRP_SMALL", payout: 327350 },
            { name: "DOGE_SMALL", payout: 68134 },
            { name: "ETH_SMALL", payout: 4100000 },
            { name: "TRX_SMALL", payout: 49216300000 },
            { name: "SOL_SMALL", payout: 16270000 },
            { name: "HMT", payout: 1528000000 },
            { name: "USDT_SMALL", payout: 2083330 },
        ]
    },
    {
        id: "platinum-1",
        name: "Platinum I",
        minPower: 15000000000,
        currencies: [
            { name: "RLT", payout: 5510000 },
            { name: "RST", payout: 338000000 },
            { name: "SAT", payout: 184000 },
            { name: "LTC_SMALL", payout: 1384000 },
            { name: "BNB_SMALL", payout: 15100000 },
            { name: "MATIC_SMALL", payout: 75483100000 },
            { name: "XRP_SMALL", payout: 607930 },
            { name: "DOGE_SMALL", payout: 136268 },
            { name: "ETH_SMALL", payout: 8600000 },
            { name: "TRX_SMALL", payout: 110736700000 },
            { name: "SOL_SMALL", payout: 21150000 },
            { name: "ALGO_SMALL", payout: 24061950 },
            { name: "HMT", payout: 3125000000 },
            { name: "USDT_SMALL", payout: 5555560 },
        ]
    },
    {
        id: "platinum-2",
        name: "Platinum II",
        minPower: 50000000000,
        currencies: [
            { name: "RLT", payout: 1585280 },
            { name: "RST", payout: 97230630 },
            { name: "SAT", payout: 160000 },
            { name: "LTC_SMALL", payout: 818000 },
            { name: "BNB_SMALL", payout: 7800000 },
            { name: "MATIC_SMALL", payout: 40886700000 },
            { name: "XRP_SMALL", payout: 583160 },
            { name: "DOGE_SMALL", payout: 145217 },
            { name: "ETH_SMALL", payout: 5900000 },
            { name: "TRX_SMALL", payout: 73824400000 },
            { name: "SOL_SMALL", payout: 22370000 },
            { name: "ALGO_SMALL", payout: 10065280 },
            { name: "HMT", payout: 2430000000 },
            { name: "USDT_SMALL", payout: 3472220 },
        ]
    },
    {
        id: "platinum-3",
        name: "Platinum III",
        minPower: 100000000000,
        currencies: [
            { name: "RLT", payout: 911200 },
            { name: "RST", payout: 55887180 },
            { name: "SAT", payout: 106000 },
            { name: "LTC_SMALL", payout: 382000 },
            { name: "BNB_SMALL", payout: 8400000 },
            { name: "MATIC_SMALL", payout: 34596400000 },
            { name: "XRP_SMALL", payout: 444230 },
            { name: "DOGE_SMALL", payout: 115292 },
            { name: "ETH_SMALL", payout: 5200000 },
            { name: "TRX_SMALL", payout: 61520400000 },
            { name: "SOL_SMALL", payout: 24400000 },
            { name: "ALGO_SMALL", payout: 6479670 },
            { name: "HMT", payout: 2084000000 },
            { name: "USDT_SMALL", payout: 3125000 },
        ]
    },
    {
        id: "diamond-1",
        name: "Diamond I",
        minPower: 200000000000,
        currencies: [
            { name: "RST", payout: 81000000 },
            { name: "SAT", payout: 142800 },
            { name: "LTC_SMALL", payout: 1580000 },
            { name: "BNB_SMALL", payout: 14400000 },
            { name: "MATIC_SMALL", payout: 160400000000 },
            { name: "XRP_SMALL", payout: 1020000 },
            { name: "DOGE_SMALL", payout: 163300 },
            { name: "ETH_SMALL", payout: 7900000 },
            { name: "TRX_SMALL", payout: 50700000000 },
            { name: "SOL_SMALL", payout: 12600000 },
            { name: "ALGO_SMALL", payout: 14494010 },
            { name: "USDT_SMALL", payout: 2777780 },
        ]
    },
    {
        id: "diamond-2",
        name: "Diamond II",
        minPower: 400000000000,
        currencies: [
            { name: "RST", payout: 45592180 },
            { name: "SAT", payout: 136000 },
            { name: "LTC_SMALL", payout: 1145000 },
            { name: "BNB_SMALL", payout: 13400000 },
            { name: "MATIC_SMALL", payout: 94353900000 },
            { name: "XRP_SMALL", payout: 561170 },
            { name: "DOGE_SMALL", payout: 102201 },
            { name: "ETH_SMALL", payout: 5200000 },
            { name: "TRX_SMALL", payout: 29529800000 },
            { name: "SOL_SMALL", payout: 8130000 },
            { name: "ALGO_SMALL", payout: 13117280 },
            { name: "USDT_SMALL", payout: 3819440 },
        ]
    },
    {
        id: "diamond-3",
        name: "Diamond III",
        minPower: 10000000000000,
        currencies: [
            { name: "RST", payout: 88000000 },
            { name: "SAT", payout: 10200 },
            { name: "LTC_SMALL", payout: 127000 },
            { name: "BNB_SMALL", payout: 1300000 },
            { name: "MATIC_SMALL", payout: 9435400000 },
            { name: "XRP_SMALL", payout: 70150 },
            { name: "DOGE_SMALL", payout: 11583 },
            { name: "ETH_SMALL", payout: 600000 },
            { name: "TRX_SMALL", payout: 4350500000 },
            { name: "SOL_SMALL", payout: 1620000 },
            { name: "ALGO_SMALL", payout: 2046210 },
            { name: "USDT_SMALL", payout: 347220 },
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
    'USDT_SMALL': 'USDT',
    'RLT': 'RLT',
    'RST': 'RST',
    'HMT': 'HMT',
};
