// Import Coin Icons
import algoIcon from '../assets/coins/algo.svg?url';
import bnbIcon from '../assets/coins/bnb.svg?url';
import btcIcon from '../assets/coins/btc.svg?url';
import busdIcon from '../assets/coins/busd.svg?url';
import dogeIcon from '../assets/coins/doge.svg?url';
import ethIcon from '../assets/coins/eth.svg?url';
import ltcIcon from '../assets/coins/ltc.svg?url';
import maticIcon from '../assets/coins/matic.svg?url';
import rltIcon from '../assets/coins/rlt.svg?url';
import rstIcon from '../assets/coins/rst.svg?url';
import solIcon from '../assets/coins/sol.svg?url';
import tonIcon from '../assets/coins/ton.svg?url';
import trxIcon from '../assets/coins/trx.svg?url';
import usdtIcon from '../assets/coins/usdt.svg?url';
import wshibIcon from '../assets/coins/wshib.svg?url';
import xrpIcon from '../assets/coins/xrp.svg?url';
import hmtIcon from '../assets/coins/hmt.svg?url';

// Coin icons mapping
export const COIN_ICONS: Record<string, string> = {
    // Crypto
    'BTC': btcIcon,
    'ETH': ethIcon,
    'SOL': solIcon,
    'DOGE': dogeIcon,
    'BNB': bnbIcon,
    'LTC': ltcIcon,
    'XRP': xrpIcon,
    'TRX': trxIcon,
    'POL': maticIcon, // Using MATIC icon for POL as they are related/rebranded
    'MATIC': maticIcon,
    'USDT': usdtIcon,
    'BUSD': busdIcon,
    'ALGO': algoIcon,
    'TON': tonIcon,
    'WSHIB': wshibIcon,

    // Rollercoin Tokens
    'RLT': rltIcon,
    'RST': rstIcon,
    // HMT doesn't have an icon in the list, keeping placeholder or verify if needed
    'HMT': hmtIcon,
};

// Fallback for missing game tokens
export const GAME_TOKEN_COLORS: Record<string, string> = {
    'RLT': '#2d9cdb',
    'RST': '#f2994a',
    'HMT': '#9b51e0',
};
