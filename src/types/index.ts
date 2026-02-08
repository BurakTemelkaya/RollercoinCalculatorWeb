// Hash power units
export type PowerUnit = 'H' | 'Kh' | 'Mh' | 'Gh' | 'Th' | 'Ph' | 'Eh' | 'Zh' | 'Yh';

// Hash power value with unit
export interface HashPower {
  value: number;
  unit: PowerUnit;
}

// Time periods for earnings calculation
export type Period = 'hourly' | 'daily' | 'weekly' | 'monthly';

// Parsed coin data from league power text
export interface CoinData {
  code: string;           // e.g., "btc", "sol", "rlt"
  displayName: string;    // e.g., "BTC", "SOL", "RLT"
  leaguePower: HashPower; // e.g., { value: 2.827, unit: 'Zh' }
  leaguePowerFormatted: string; // e.g., "2.827 Zh/s"
  isGameToken: boolean;   // true for RLT, RST, HMT
}

// Earnings calculation result for a single coin
export interface EarningsResult {
  code: string;
  displayName: string;
  leaguePower: HashPower;
  leaguePowerFormatted: string;
  powerShare: number;     // percentage (0-100)
  earnings: {
    perBlock: number;
    hourly: number;
    daily: number;
    weekly: number;
    monthly: number;
  };
  isGameToken: boolean;
}

// Withdraw progress tracking
export interface WithdrawProgress {
  code: string;
  displayName: string;
  minWithdraw: number;
  currentPercent: number;   // 0-100 user input
  currentBalance: number;   // calculated from percent
  remainingToEarn: number;
  daysToWithdraw: number;
  canWithdrawNow: boolean;
}

// Block reward data (manually input or default)
export interface BlockReward {
  code: string;
  reward: number;
}

// Default minimum withdraw amounts from official config
export const DEFAULT_MIN_WITHDRAW: Record<string, number> = {
  'BTC': 0.00085,
  'ETH': 0.014,
  'SOL': 0.6,
  'DOGE': 220,
  'BNB': 0.06,
  'LTC': 5,
  'XRP': 40,
  'TRX': 300,
  'POL': 300,
  'MATIC': 300,
  'RLT': 1,
  'RST': 1,
  'HMT': 1,
};

// Default block rewards per block (calculated from typical Rollercoin data)
// These values are approximations - actual values change over time
export const DEFAULT_BLOCK_REWARDS: Record<string, number> = {
  'BTC': 0.0000177,
  'ETH': 0.000612,
  'SOL': 0.028,
  'DOGE': 12.08,
  'BNB': 0.00127,
  'LTC': 0.0085,
  'XRP': 0.522,
  'TRX': 10.9,
  'POL': 7.74,
  'RLT': 3.34,
  'RST': 204.4,
  'HMT': 1533,
};

// Game tokens that don't have market prices
export const GAME_TOKENS = ['RLT', 'RST', 'HMT'];
