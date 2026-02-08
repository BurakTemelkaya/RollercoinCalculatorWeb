// Import Coin Icons
import algoIcon from '../assets/coins/algo.svg';
import bnbIcon from '../assets/coins/bnb.svg';
import btcIcon from '../assets/coins/btc.svg';
import busdIcon from '../assets/coins/busd.svg';
import dogeIcon from '../assets/coins/doge.svg';
import ethIcon from '../assets/coins/eth.svg';
import ltcIcon from '../assets/coins/ltc.svg';
import maticIcon from '../assets/coins/matic.svg';
import rltIcon from '../assets/coins/rlt.svg';
import rstIcon from '../assets/coins/rst.svg';
import solIcon from '../assets/coins/sol.svg';
import tonIcon from '../assets/coins/ton.svg';
import trxIcon from '../assets/coins/trx.svg';
import usdtIcon from '../assets/coins/usdt.svg';
import wshibIcon from '../assets/coins/wshib.svg';
import xrpIcon from '../assets/coins/xrp.svg';
import hmtIcon from '../assets/coins/hmt.svg';

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
