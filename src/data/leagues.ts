

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
        id: "68af01ce48490927df92d687",
        name: "Bronze I",
        minPower: 0,
        currencies: [
            { name: "RLT", payout: 760000 },
            { name: "RST", payout: 48000000 },
            { name: "SAT", payout: 20100 },
            { name: "LTC_SMALL", payout: 150000 },
        ]
    },
    {
        id: "68af01ce48490927df92d686",
        name: "Bronze II",
        minPower: 5000000,
        currencies: [
            { name: "RLT", payout: 1400000 },
            { name: "RST", payout: 86000000 },
            { name: "SAT", payout: 41100 },
            { name: "LTC_SMALL", payout: 269000 },
            { name: "BNB_SMALL", payout: 7000000 },
        ]
    },
    {
        id: "68af01ce48490927df92d685",
        name: "Bronze III",
        minPower: 30000000,
        currencies: [
            { name: "RLT", payout: 1550000 },
            { name: "RST", payout: 117000000 },
            { name: "SAT", payout: 75900 },
            { name: "LTC_SMALL", payout: 490000 },
            { name: "BNB_SMALL", payout: 8700000 },
            { name: "MATIC_SMALL", payout: 67300000000 },
        ]
    },
    {
        id: "68af01ce48490927df92d684",
        name: "Silver I",
        minPower: 100000000,
        currencies: [
            { name: "RLT", payout: 910000 },
            { name: "RST", payout: 69000000 },
            { name: "SAT", payout: 43000 },
            { name: "LTC_SMALL", payout: 260000 },
            { name: "BNB_SMALL", payout: 4400000 },
            { name: "MATIC_SMALL", payout: 32700000000 },
            { name: "XRP_SMALL", payout: 260000 },
            { name: "USDT_SMALL", payout: 142870 },
        ]
    },
    {
        id: "68af01ce48490927df92d683",
        name: "Silver II",
        minPower: 200000000,
        currencies: [
            { name: "RLT", payout: 1070000 },
            { name: "RST", payout: 49612130 },
            { name: "SAT", payout: 45900 },
            { name: "LTC_SMALL", payout: 270000 },
            { name: "BNB_SMALL", payout: 4300000 },
            { name: "MATIC_SMALL", payout: 29900000000 },
            { name: "XRP_SMALL", payout: 220000 },
            { name: "DOGE_SMALL", payout: 55600 },
            { name: "USDT_SMALL", payout: 195529 },
        ]
    },
    {
        id: "68af01ce48490927df92d682",
        name: "Silver III",
        minPower: 500000000,
        currencies: [
            { name: "RLT", payout: 880000 },
            { name: "RST", payout: 66000000 },
            { name: "SAT", payout: 41000 },
            { name: "LTC_SMALL", payout: 230000 },
            { name: "BNB_SMALL", payout: 3500000 },
            { name: "MATIC_SMALL", payout: 22900000000 },
            { name: "XRP_SMALL", payout: 160000 },
            { name: "DOGE_SMALL", payout: 38400 },
            { name: "ETH_SMALL", payout: 2100000 },
            { name: "USDT_SMALL", payout: 274038 },
        ]
    },
    {
        id: "68af01ce48490927df92d681",
        name: "Gold I",
        minPower: 1000000000,
        currencies: [
            { name: "RLT", payout: 660000 },
            { name: "RST", payout: 50000000 },
            { name: "SAT", payout: 34500 },
            { name: "LTC_SMALL", payout: 180000 },
            { name: "BNB_SMALL", payout: 2600000 },
            { name: "MATIC_SMALL", payout: 16500000000 },
            { name: "XRP_SMALL", payout: 110000 },
            { name: "DOGE_SMALL", payout: 25000 },
            { name: "ETH_SMALL", payout: 1300000 },
            { name: "TRX_SMALL", payout: 22300000000 },
            { name: "USDT_SMALL", payout: 151647 },
        ]
    },
    {
        id: "68af01ce48490927df92d680",
        name: "Gold II",
        minPower: 2000000000,
        currencies: [
            { name: "RLT", payout: 1060000 },
            { name: "RST", payout: 80000000 },
            { name: "SAT", payout: 36000 },
            { name: "LTC_SMALL", payout: 230000 },
            { name: "BNB_SMALL", payout: 3500000 },
            { name: "MATIC_SMALL", payout: 19900000000 },
            { name: "XRP_SMALL", payout: 130000 },
            { name: "DOGE_SMALL", payout: 29500 },
            { name: "ETH_SMALL", payout: 1400000 },
            { name: "TRX_SMALL", payout: 25000000000 },
            { name: "SOL_SMALL", payout: 9300000 },
            { name: "HMT", payout: 625000000 },
            { name: "USDT_SMALL", payout: 274038 },
        ]
    },
    {
        id: "68af01ce48490927df92d67f",
        name: "Gold III",
        minPower: 5000000000,
        currencies: [
            { name: "RLT", payout: 2720000 },
            { name: "RST", payout: 204000000 },
            { name: "SAT", payout: 153100 },
            { name: "LTC_SMALL", payout: 730000 },
            { name: "BNB_SMALL", payout: 11100000 },
            { name: "MATIC_SMALL", payout: 67100000000 },
            { name: "XRP_SMALL", payout: 460000 },
            { name: "DOGE_SMALL", payout: 104700 },
            { name: "ETH_SMALL", payout: 5300000 },
            { name: "TRX_SMALL", payout: 94200000000 },
            { name: "SOL_SMALL", payout: 24300000 },
            { name: "HMT", payout: 1528000000 },
            { name: "USDT_SMALL", payout: 1000000 },
        ]
    },
    {
        id: "68af01ce48490927df92d67e",
        name: "Platinum I",
        minPower: 15000000000,
        currencies: [
            { name: "RLT", payout: 4500000 },
            { name: "RST", payout: 338000000 },
            { name: "SAT", payout: 308500 },
            { name: "LTC_SMALL", payout: 1520000 },
            { name: "BNB_SMALL", payout: 23800000 },
            { name: "MATIC_SMALL", payout: 149200000000 },
            { name: "XRP_SMALL", payout: 1040000 },
            { name: "DOGE_SMALL", payout: 247000 },
            { name: "ETH_SMALL", payout: 12900000 },
            { name: "TRX_SMALL", payout: 235300000000 },
            { name: "SOL_SMALL", payout: 31500000 },
            { name: "ALGO_SMALL", payout: 26900000 },
            { name: "HMT", payout: 3125000000 },
            { name: "USDT_SMALL", payout: 2340383 },
        ]
    },
    {
        id: "68af01ce48490927df92d67d",
        name: "Platinum II",
        minPower: 50000000000,
        currencies: [
            { name: "RLT", payout: 2110000 },
            { name: "RST", payout: 158000000 },
            { name: "SAT", payout: 189000 },
            { name: "LTC_SMALL", payout: 930000 },
            { name: "BNB_SMALL", payout: 15100000 },
            { name: "MATIC_SMALL", payout: 96700000000 },
            { name: "XRP_SMALL", payout: 690000 },
            { name: "DOGE_SMALL", payout: 168800 },
            { name: "ETH_SMALL", payout: 9000000 },
            { name: "TRX_SMALL", payout: 168400000000 },
            { name: "SOL_SMALL", payout: 34600000 },
            { name: "ALGO_SMALL", payout: 11200000 },
            { name: "HMT", payout: 2430000000 },
            { name: "USDT_SMALL", payout: 1462740 },
        ]
    },
    {
        id: "68af01ce48490927df92d67c",
        name: "Platinum III",
        minPower: 100000000000,
        currencies: [
            { name: "RLT", payout: 1210000 },
            { name: "RST", payout: 91000000 },
            { name: "SAT", payout: 127500 },
            { name: "LTC_SMALL", payout: 640000 },
            { name: "BNB_SMALL", payout: 10900000 },
            { name: "MATIC_SMALL", payout: 71600000000 },
            { name: "XRP_SMALL", payout: 530000 },
            { name: "DOGE_SMALL", payout: 134400 },
            { name: "ETH_SMALL", payout: 7400000 },
            { name: "TRX_SMALL", payout: 142800000000 },
            { name: "SOL_SMALL", payout: 36800000 },
            { name: "ALGO_SMALL", payout: 7200000 },
            { name: "HMT", payout: 2084000000 },
            { name: "USDT_SMALL", payout: 1316466 },
        ]
    },
    {
        id: "68af01ce48490927df92d67b",
        name: "Diamond I",
        minPower: 200000000000,
        currencies: [
            { name: "RST", payout: 81000000 },
            { name: "SAT", payout: 124200 },
            { name: "LTC_SMALL", payout: 1370000 },
            { name: "BNB_SMALL", payout: 12600000 },
            { name: "MATIC_SMALL", payout: 139500000000 },
            { name: "XRP_SMALL", payout: 890000 },
            { name: "DOGE_SMALL", payout: 142100 },
            { name: "ETH_SMALL", payout: 6800000 },
            { name: "TRX_SMALL", payout: 44100000000 },
            { name: "SOL_SMALL", payout: 11500000 },
            { name: "ALGO_SMALL", payout: 16200000 },
            { name: "USDT_SMALL", payout: 1170192 },
        ]
    },
    {
        id: "68af01ce48490927df92d67a",
        name: "Diamond II",
        minPower: 400000000000,
        currencies: [
            { name: "RST", payout: 45592180 },
            { name: "SAT", payout: 151000 },
            { name: "LTC_SMALL", payout: 1670000 },
            { name: "BNB_SMALL", payout: 17400000 },
            { name: "MATIC_SMALL", payout: 169600000000 },
            { name: "XRP_SMALL", payout: 1080000 },
            { name: "DOGE_SMALL", payout: 172800 },
            { name: "ETH_SMALL", payout: 8300000 },
            { name: "TRX_SMALL", payout: 53700000000 },
            { name: "SOL_SMALL", payout: 13300000 },
            { name: "ALGO_SMALL", payout: 19700000 },
            { name: "USDT_SMALL", payout: 1609014 },
        ]
    },
    {
        id: "68af01ce48490927df92d679",
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
