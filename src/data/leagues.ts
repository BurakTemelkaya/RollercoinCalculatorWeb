
export interface LeagueInfo {
    id: string;
    name: string;
    minPower: number; // in Gh/s based on analysis
    currencies: {
        name: string;
        payout: number;
        duration?: number;
    }[];
}

// Helper to scale payouts to block rewards
// Based on RLT/RST (1e6 scale) matching our calculations
// Only RLT, RST, HMT seem consistent with 1e6 scale compared to calc.
// Others are tricky. For now, we'll try to map them dynamically.
export const LEAGUES: LeagueInfo[] = [
    {
        id: "6a846d84d4be9e1aa9a15591",
        name: "Bronze I",
        minPower: 0,
        currencies: [
            { name: "RLT", payout: 3012700 },
            { name: "RST", payout: 160676800 },
            { name: "SAT", payout: 77200 },
            { name: "LTC_SMALL", payout: 482480 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15592",
        name: "Bronze II",
        minPower: 25000000,
        currencies: [
            { name: "RLT", payout: 514400 },
            { name: "RST", payout: 77160100 },
            { name: "SAT", payout: 38960 },
            { name: "LTC_SMALL", payout: 292180 },
            { name: "BNB_SMALL", payout: 2922000 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15593",
        name: "Bronze III",
        minPower: 50000000,
        currencies: [
            { name: "RLT", payout: 1019600 },
            { name: "RST", payout: 81566300 },
            { name: "SAT", payout: 44120 },
            { name: "LTC_SMALL", payout: 287770 },
            { name: "BNB_SMALL", payout: 5036000 },
            { name: "MATIC_SMALL", payout: 38369000000 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15594",
        name: "Silver I",
        minPower: 100000000,
        currencies: [
            { name: "RLT", payout: 819000 },
            { name: "RST", payout: 51186200 },
            { name: "SAT", payout: 38590 },
            { name: "LTC_SMALL", payout: 192960 },
            { name: "BNB_SMALL", payout: 1351000 },
            { name: "MATIC_SMALL", payout: 13507000000 },
            { name: "XRP_SMALL", payout: 241200 },
            { name: "USDT_SMALL", payout: 102400 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15595",
        name: "Silver II",
        minPower: 150000000,
        currencies: [
            { name: "RLT", payout: 564400 },
            { name: "RST", payout: 51304600 },
            { name: "SAT", payout: 31720 },
            { name: "LTC_SMALL", payout: 192230 },
            { name: "BNB_SMALL", payout: 961000 },
            { name: "MATIC_SMALL", payout: 9611000000 },
            { name: "XRP_SMALL", payout: 96100 },
            { name: "DOGE_SMALL", payout: 52862 },
            { name: "USDT_SMALL", payout: 205200 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15596",
        name: "Silver III",
        minPower: 250000000,
        currencies: [
            { name: "RLT", payout: 2058500 },
            { name: "RST", payout: 154389300 },
            { name: "SAT", payout: 67530 },
            { name: "LTC_SMALL", payout: 723510 },
            { name: "BNB_SMALL", payout: 4823000 },
            { name: "MATIC_SMALL", payout: 28941000000 },
            { name: "XRP_SMALL", payout: 385900 },
            { name: "DOGE_SMALL", payout: 57881 },
            { name: "ETH_SMALL", payout: 2412000 },
            { name: "USDT_SMALL", payout: 257300 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15597",
        name: "Gold I",
        minPower: 650000000,
        currencies: [
            { name: "RLT", payout: 1591600 },
            { name: "RST", payout: 106103800 },
            { name: "SAT", payout: 120950 },
            { name: "LTC_SMALL", payout: 483800 },
            { name: "BNB_SMALL", payout: 7257000 },
            { name: "MATIC_SMALL", payout: 33866000000 },
            { name: "XRP_SMALL", payout: 290300 },
            { name: "DOGE_SMALL", payout: 77409 },
            { name: "ETH_SMALL", payout: 2903000 },
            { name: "TRX_SMALL", payout: 19352000000 },
            { name: "USDT_SMALL", payout: 371400 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15598",
        name: "Gold II",
        minPower: 1500000000,
        currencies: [
            { name: "RLT", payout: 2093700 },
            { name: "RST", payout: 157024400 },
            { name: "SAT", payout: 63120 },
            { name: "LTC_SMALL", payout: 252480 },
            { name: "BNB_SMALL", payout: 4855000 },
            { name: "MATIC_SMALL", payout: 26219000000 },
            { name: "XRP_SMALL", payout: 165100 },
            { name: "DOGE_SMALL", payout: 77686 },
            { name: "ETH_SMALL", payout: 2719000 },
            { name: "TRX_SMALL", payout: 20393000000 },
            { name: "SOL_SMALL", payout: 7768600 },
            { name: "HMT", payout: 68043900 },
            { name: "USDT_SMALL", payout: 314000 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a15599",
        name: "Gold III",
        minPower: 3500000000,
        currencies: [
            { name: "RLT", payout: 4208400 },
            { name: "RST", payout: 263025800 },
            { name: "SAT", payout: 290320 },
            { name: "LTC_SMALL", payout: 967740 },
            { name: "BNB_SMALL", payout: 16452000 },
            { name: "MATIC_SMALL", payout: 67742000000 },
            { name: "XRP_SMALL", payout: 677400 },
            { name: "DOGE_SMALL", payout: 290323 },
            { name: "ETH_SMALL", payout: 5806000 },
            { name: "TRX_SMALL", payout: 77419000000 },
            { name: "SOL_SMALL", payout: 20322600 },
            { name: "HMT", payout: 1630760100 },
            { name: "USDT_SMALL", payout: 1736000 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559a",
        name: "Platinum I",
        minPower: 16000000000,
        currencies: [
            { name: "RLT", payout: 5742800 },
            { name: "RST", payout: 417655500 },
            { name: "SAT", payout: 416360 },
            { name: "LTC_SMALL", payout: 1936550 },
            { name: "BNB_SMALL", payout: 22754000 },
            { name: "MATIC_SMALL", payout: 150083000000 },
            { name: "XRP_SMALL", payout: 1210300 },
            { name: "DOGE_SMALL", payout: 319531 },
            { name: "ETH_SMALL", payout: 12878000 },
            { name: "TRX_SMALL", payout: 227545000000 },
            { name: "SOL_SMALL", payout: 31953100 },
            { name: "ALGO_SMALL", payout: 36544900 },
            { name: "HMT", payout: 4072141500 },
            { name: "USDT_SMALL", payout: 3132400 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559b",
        name: "Platinum II",
        minPower: 50000000000,
        currencies: [
            { name: "RLT", payout: 2658600 },
            { name: "RST", payout: 212690400 },
            { name: "SAT", payout: 271420 },
            { name: "LTC_SMALL", payout: 1211700 },
            { name: "BNB_SMALL", payout: 14540000 },
            { name: "MATIC_SMALL", payout: 96936000000 },
            { name: "XRP_SMALL", payout: 969400 },
            { name: "DOGE_SMALL", payout: 242339 },
            { name: "ETH_SMALL", payout: 9694000 },
            { name: "TRX_SMALL", payout: 164791000000 },
            { name: "SOL_SMALL", payout: 36835500 },
            { name: "ALGO_SMALL", payout: 14888300 },
            { name: "HMT", payout: 3043599000 },
            { name: "USDT_SMALL", payout: 1914200 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559c",
        name: "Platinum III",
        minPower: 100000000000,
        currencies: [
            { name: "RLT", payout: 1909300 },
            { name: "RST", payout: 143618900 },
            { name: "SAT", payout: 213410 },
            { name: "LTC_SMALL", payout: 1021510 },
            { name: "BNB_SMALL", payout: 13120000 },
            { name: "MATIC_SMALL", payout: 89078000000 },
            { name: "XRP_SMALL", payout: 776200 },
            { name: "DOGE_SMALL", payout: 222620 },
            { name: "ETH_SMALL", payout: 9530000 },
            { name: "TRX_SMALL", payout: 172590000000 },
            { name: "SOL_SMALL", payout: 47062700 },
            { name: "ALGO_SMALL", payout: 11638700 },
            { name: "HMT", payout: 3285474500 },
            { name: "USDT_SMALL", payout: 2075600 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559d",
        name: "Diamond I",
        minPower: 200000000000,
        currencies: [
            { name: "RST", payout: 94267100 },
            { name: "SAT", payout: 170780 },
            { name: "LTC_SMALL", payout: 1775650 },
            { name: "BNB_SMALL", payout: 11838000 },
            { name: "MATIC_SMALL", payout: 126832000000 },
            { name: "XRP_SMALL", payout: 1056900 },
            { name: "DOGE_SMALL", payout: 194476 },
            { name: "ETH_SMALL", payout: 6764000 },
            { name: "TRX_SMALL", payout: 43123000000 },
            { name: "SOL_SMALL", payout: 10146600 },
            { name: "ALGO_SMALL", payout: 21681400 },
            { name: "USDT_SMALL", payout: 1508300 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559e",
        name: "Diamond II",
        minPower: 375000000000,
        currencies: [
            { name: "RST", payout: 41929000 },
            { name: "SAT", payout: 263530 },
            { name: "LTC_SMALL", payout: 2125220 },
            { name: "BNB_SMALL", payout: 22102000 },
            { name: "MATIC_SMALL", payout: 119012000000 },
            { name: "XRP_SMALL", payout: 892600 },
            { name: "DOGE_SMALL", payout: 297530 },
            { name: "ETH_SMALL", payout: 5951000 },
            { name: "TRX_SMALL", payout: 34003000000 },
            { name: "SOL_SMALL", payout: 12751300 },
            { name: "ALGO_SMALL", payout: 33077300 },
            { name: "USDT_SMALL", payout: 2795300 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a1559f",
        name: "Diamond III",
        minPower: 650000000000,
        currencies: [
            { name: "RST", payout: 22869500 },
            { name: "SAT", payout: 141750 },
            { name: "LTC_SMALL", payout: 1140620 },
            { name: "BNB_SMALL", payout: 11529000 },
            { name: "MATIC_SMALL", payout: 63032000000 },
            { name: "XRP_SMALL", payout: 472500 },
            { name: "DOGE_SMALL", payout: 157344 },
            { name: "ETH_SMALL", payout: 3213000 },
            { name: "TRX_SMALL", payout: 19373000000 },
            { name: "SOL_SMALL", payout: 6804000 },
            { name: "ALGO_SMALL", payout: 17359000 },
            { name: "USDT_SMALL", payout: 1351400 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a0",
        name: "Titan I",
        minPower: 1150000000000,
        currencies: [
            { name: "RST", payout: 23535800 },
            { name: "SAT", payout: 145540 },
            { name: "LTC_SMALL", payout: 1185740 },
            { name: "BNB_SMALL", payout: 11986000 },
            { name: "MATIC_SMALL", payout: 65601000000 },
            { name: "XRP_SMALL", payout: 492300 },
            { name: "DOGE_SMALL", payout: 163734 },
            { name: "ETH_SMALL", payout: 3317000 },
            { name: "TRX_SMALL", payout: 20119000000 },
            { name: "SOL_SMALL", payout: 7063000 },
            { name: "ALGO_SMALL", payout: 18240300 },
            { name: "USDT_SMALL", payout: 1388600 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a1",
        name: "Titan II",
        minPower: 2160000000000,
        currencies: [
            { name: "RST", payout: 22231200 },
            { name: "SAT", payout: 112300 },
            { name: "LTC_SMALL", payout: 988210 },
            { name: "BNB_SMALL", payout: 10107000 },
            { name: "MATIC_SMALL", payout: 55026000000 },
            { name: "XRP_SMALL", payout: 415500 },
            { name: "DOGE_SMALL", payout: 140371 },
            { name: "ETH_SMALL", payout: 2807000 },
            { name: "TRX_SMALL", payout: 16845000000 },
            { name: "SOL_SMALL", payout: 5951700 },
            { name: "ALGO_SMALL", payout: 15064300 },
            { name: "USDT_SMALL", payout: 1161000 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a2",
        name: "Titan III",
        minPower: 4000000000000,
        currencies: [
            { name: "RST", payout: 38278500 },
            { name: "SAT", payout: 253040 },
            { name: "LTC_SMALL", payout: 2065610 },
            { name: "BNB_SMALL", payout: 20656000 },
            { name: "MATIC_SMALL", payout: 114383000000 },
            { name: "XRP_SMALL", payout: 839200 },
            { name: "DOGE_SMALL", payout: 285313 },
            { name: "ETH_SMALL", payout: 5551000 },
            { name: "TRX_SMALL", payout: 34857000000 },
            { name: "SOL_SMALL", payout: 12264600 },
            { name: "ALGO_SMALL", payout: 31473400 },
            { name: "USDT_SMALL", payout: 2551900 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a3",
        name: "Emerald I",
        minPower: 13000000000000,
        currencies: [
            { name: "RST", payout: 254873300 },
            { name: "SAT", payout: 32410 },
            { name: "LTC_SMALL", payout: 483700 },
            { name: "BNB_SMALL", payout: 1935000 },
            { name: "MATIC_SMALL", payout: 19348000000 },
            { name: "XRP_SMALL", payout: 232200 },
            { name: "DOGE_SMALL", payout: 33859 },
            { name: "ETH_SMALL", payout: 967000 },
            { name: "TRX_SMALL", payout: 8707000000 },
            { name: "SOL_SMALL", payout: 3289100 },
            { name: "ALGO_SMALL", payout: 4893600 },
            { name: "USDT_SMALL", payout: 917500 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a4",
        name: "Emerald II",
        minPower: 25000000000000,
        currencies: [
            { name: "RST", payout: 204325100 },
            { name: "SAT", payout: 26600 },
            { name: "LTC_SMALL", payout: 483580 },
            { name: "BNB_SMALL", payout: 2321000 },
            { name: "MATIC_SMALL", payout: 16828000000 },
            { name: "XRP_SMALL", payout: 193400 },
            { name: "DOGE_SMALL", payout: 29015 },
            { name: "ETH_SMALL", payout: 970000 },
            { name: "TRX_SMALL", payout: 7737000000 },
            { name: "SOL_SMALL", payout: 2901500 },
            { name: "ALGO_SMALL", payout: 4086500 },
            { name: "USDT_SMALL", payout: 766200 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a5",
        name: "Emerald III",
        minPower: 70000000000000,
        currencies: [
            { name: "RST", payout: 102521000 },
            { name: "SAT", payout: 14580 },
            { name: "LTC_SMALL", payout: 165250 },
            { name: "BNB_SMALL", payout: 1166000 },
            { name: "MATIC_SMALL", payout: 9235000000 },
            { name: "XRP_SMALL", payout: 82600 },
            { name: "DOGE_SMALL", payout: 14581 },
            { name: "ETH_SMALL", payout: 583000 },
            { name: "TRX_SMALL", payout: 4180000000 },
            { name: "SOL_SMALL", payout: 1458100 },
            { name: "ALGO_SMALL", payout: 2563000 },
            { name: "USDT_SMALL", payout: 410100 },
        ]
    },
    {
        id: "6a846d84d4be9e1aa9a155a6",
        name: "Legend",
        minPower: 1000000000000000,
        currencies: [
            { name: "RST", payout: 53099400 },
            { name: "SAT", payout: 8400 },
            { name: "LTC_SMALL", payout: 84000 },
            { name: "BNB_SMALL", payout: 504000 },
            { name: "MATIC_SMALL", payout: 4200000000 },
            { name: "XRP_SMALL", payout: 42000 },
            { name: "DOGE_SMALL", payout: 7140 },
            { name: "ETH_SMALL", payout: 252000 },
            { name: "TRX_SMALL", payout: 2100000000 },
            { name: "SOL_SMALL", payout: 672000 },
            { name: "ALGO_SMALL", payout: 1327500 },
            { name: "USDT_SMALL", payout: 203500 },
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
