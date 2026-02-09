export interface CurrencyConfig {
    name: string;
    code: string;
    display_name: string;
    balance_key: string; // Used to match with league data often
    to_small: number; // Scale factor
    min_withdraw: number;
    color: string;
    is_game_token: boolean;
    precision: number;
}

export const CURRENCY_CONFIG: CurrencyConfig[] = [
    {
        name: "MATIC",
        code: "matic",
        display_name: "POL",
        balance_key: "MATIC_SMALL",
        to_small: 10000000000,
        min_withdraw: 300,
        color: "#8247e5",
        is_game_token: false,
        precision: 6
    },
    {
        name: "BNB",
        code: "bnb",
        display_name: "BNB",
        balance_key: "BNB_SMALL",
        to_small: 10000000000,
        min_withdraw: 0.06,
        color: "#f3ba2f",
        is_game_token: false,
        precision: 6
    },
    {
        name: "LTC",
        code: "ltc",
        display_name: "LTC",
        balance_key: "LTC_SMALL",
        to_small: 100000000,
        min_withdraw: 5,
        color: "#345d9d",
        is_game_token: false,
        precision: 6
    },
    {
        name: "USDT",
        code: "usdt",
        display_name: "USDT",
        balance_key: "USDT_SMALL",
        to_small: 1000000,
        min_withdraw: 5,
        color: "#26a17b",
        is_game_token: false,
        precision: 6
    },
    {
        name: "ETH",
        code: "eth",
        display_name: "ETH",
        balance_key: "ETH_SMALL",
        to_small: 10000000000,
        min_withdraw: 0.014,
        color: "#987eff",
        is_game_token: false,
        precision: 6
    },
    {
        name: "SOL",
        code: "sol",
        display_name: "SOL",
        balance_key: "SOL_SMALL",
        to_small: 1000000000,
        min_withdraw: 0.6,
        color: "#5696d6",
        is_game_token: false,
        precision: 6
    },
    {
        name: "TRX",
        code: "trx",
        display_name: "TRX",
        balance_key: "TRX_SMALL",
        to_small: 10000000000,
        min_withdraw: 300,
        color: "#5c0e0e",
        is_game_token: false,
        precision: 6
    },
    {
        name: "BTC",
        code: "btc",
        display_name: "BTC",
        balance_key: "SAT",
        to_small: 100000000, // Note: Analysis suggests 1e10 for internal calc match, but config says 1e8
        min_withdraw: 0.00085,
        color: "#f7931a",
        is_game_token: false,
        precision: 8
    },
    {
        name: "DOGE",
        code: "doge",
        display_name: "DOGE",
        balance_key: "DOGE_SMALL",
        to_small: 10000,
        min_withdraw: 220,
        color: "#c2a633",
        is_game_token: false,
        precision: 4
    },
    {
        name: "RLT",
        code: "rlt",
        display_name: "RLT",
        balance_key: "RLT",
        to_small: 1000000,
        min_withdraw: 1,
        color: "#03e1e4",
        is_game_token: true,
        precision: 6
    },
    {
        name: "RST",
        code: "rst",
        display_name: "RST",
        balance_key: "RST",
        to_small: 1000000,
        min_withdraw: 1,
        color: "#82e73b",
        is_game_token: true,
        precision: 6
    },
    {
        name: "HMT",
        code: "hmt", // Assumed as it was not in snippet but present in game
        display_name: "HMT",
        balance_key: "HMT",
        to_small: 1000000,
        min_withdraw: 1,
        color: "#000000",
        is_game_token: true,
        precision: 6
    },
    // Added XRP from manual knowledge since it's common
    {
        name: "XRP",
        code: "xrp",
        display_name: "XRP",
        balance_key: "XRP_SMALL",
        to_small: 1000000,
        min_withdraw: 10,
        color: "#23292f",
        is_game_token: false,
        precision: 6
    },
    {
        name: "ALGO",
        code: "algo",
        display_name: "ALGO",
        balance_key: "ALGO_SMALL",
        to_small: 1000000,
        min_withdraw: 30, // Keeping this for reference, though not used in timer
        color: "#CF2D4D",
        is_game_token: false,
        precision: 6
    }
];

export function getCurrencyConfig(codeOrName: string): CurrencyConfig | undefined {
    const key = codeOrName.toUpperCase();
    return CURRENCY_CONFIG.find(c =>
        c.name === key ||
        c.code.toUpperCase() === key ||
        c.display_name === key ||
        c.balance_key === key
    );
}
