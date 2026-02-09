import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
// ... existing imports ...

import { CoinData, HashPower, EarningsResult } from './types';
import { calculateAllEarnings } from './utils/calculator';
import { formatHashPower } from './utils/powerParser';
import { getLeagueByPower, getBlockRewardsForLeague } from './utils/leagueHelper';
import { LEAGUES, LeagueInfo } from './data/leagues';
import DataInputForm from './components/DataInputForm';
import EarningsTable from './components/EarningsTable';
import WithdrawTimer from './components/WithdrawTimer';
import './index.css';

// Local storage keys
const STORAGE_KEYS = {
  COINS: 'rollercoin_web_coins',
  USER_POWER: 'rollercoin_web_userpower',
  BALANCES: 'rollercoin_web_balances',
  ACTIVE_TAB: 'rollercoin_web_active_tab',
  LEAGUE_ID: 'rollercoin_web_league_id',
  AUTO_LEAGUE: 'rollercoin_web_auto_league',
};

// Fetch prices from Binance API
async function fetchPrices(symbols: string[]): Promise<Record<string, number>> {
  const prices: Record<string, number> = {};

  // Map to Binance symbols with correct priority
  const symbolMap: Record<string, string[]> = {
    'BTC': ['BTCUSDT'],
    'ETH': ['ETHUSDT'],
    'SOL': ['SOLUSDT'],
    'DOGE': ['DOGEUSDT'],
    'BNB': ['BNBUSDT'],
    'LTC': ['LTCUSDT'],
    'XRP': ['XRPUSDT'],
    'TRX': ['TRXUSDT'],
    'POL': ['POLUSDT', 'MATICUSDT'], // Try POL first
    'MATIC': ['POLUSDT', 'MATICUSDT'],
    'ALGO': ['ALGOUSDT'],
  };

  try {
    // Fetch all prices at once
    const response = await fetch('https://api.binance.com/api/v3/ticker/price');
    const data = await response.json();

    // Create map for faster lookup
    const priceMap = new Map();
    if (Array.isArray(data)) {
      data.forEach((item: { symbol: string; price: string }) => {
        priceMap.set(item.symbol, parseFloat(item.price));
      });
    }

    for (const symbol of symbols) {
      const candidates = symbolMap[symbol.toUpperCase()];
      if (candidates) {
        for (const candidate of candidates) {
          if (priceMap.has(candidate)) {
            prices[symbol.toUpperCase()] = priceMap.get(candidate) as number;
            break; // Found price, stop checking candidates
          }
        }
      }
    }
  } catch (error) {
    console.error('Failed to fetch prices:', error);
  }

  return prices;
}

type Tab = 'calculator' | 'withdraw';

import Notification from './components/Notification';

function App() {
  const { t, i18n } = useTranslation();
  const [coins, setCoins] = useState<CoinData[]>([]);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  const [userPower, setUserPower] = useState<HashPower | null>(null);
  const [earnings, setEarnings] = useState<EarningsResult[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  // League State
  const [league, setLeague] = useState<LeagueInfo>(LEAGUES[0]);
  const [isAutoLeague, setIsAutoLeague] = useState(true);
  const [blockRewards, setBlockRewards] = useState<Record<string, number>>({});

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
      const savedPower = localStorage.getItem(STORAGE_KEYS.USER_POWER);
      const savedBalances = localStorage.getItem(STORAGE_KEYS.BALANCES);
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      const savedLeagueId = localStorage.getItem(STORAGE_KEYS.LEAGUE_ID);
      const savedAutoLeague = localStorage.getItem(STORAGE_KEYS.AUTO_LEAGUE);

      if (savedCoins) setCoins(JSON.parse(savedCoins));
      if (savedPower) setUserPower(JSON.parse(savedPower));
      if (savedBalances) setBalances(JSON.parse(savedBalances));
      if (savedTab === 'calculator' || savedTab === 'withdraw') setActiveTab(savedTab);

      if (savedAutoLeague !== null) {
        setIsAutoLeague(savedAutoLeague === 'true');
      }

      // If manual league was saved, restore it
      if (savedLeagueId && savedAutoLeague === 'false') {
        const foundLeague = LEAGUES.find(l => l.id === savedLeagueId);
        if (foundLeague) setLeague(foundLeague);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // Fetch prices when coins are loaded
  useEffect(() => {
    if (coins.length > 0) {
      const cryptoSymbols = coins
        .filter(c => !c.isGameToken)
        .map(c => c.displayName);

      if (cryptoSymbols.length > 0) {
        fetchPrices(cryptoSymbols).then(setPrices);
      }
    }
  }, [coins]);

  // Auto-detect league when userPower changes
  useEffect(() => {
    if (userPower && isAutoLeague) {
      const detectedLeague = getLeagueByPower(userPower);
      if (detectedLeague.id !== league.id) {
        setLeague(detectedLeague);
      }
    }
  }, [userPower, isAutoLeague, league.id]); // Added league.id to dependencies to prevent infinite loop if league is not updated

  // Update block rewards when league changes
  useEffect(() => {
    const rewards = getBlockRewardsForLeague(league);
    setBlockRewards(rewards);

    // Save league preference
    localStorage.setItem(STORAGE_KEYS.LEAGUE_ID, league.id);
    localStorage.setItem(STORAGE_KEYS.AUTO_LEAGUE, String(isAutoLeague));
  }, [league, isAutoLeague]);

  // Calculate earnings when coins, userPower or blockRewards change
  useEffect(() => {
    if (coins.length > 0 && userPower) {
      const results = calculateAllEarnings(coins, userPower, blockRewards);
      setEarnings(results);
    } else {
      setEarnings([]);
    }
  }, [coins, userPower, blockRewards]);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.COINS, JSON.stringify(coins));
  }, [coins]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USER_POWER, JSON.stringify(userPower));
  }, [userPower]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
  }, [balances]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
  }, [activeTab]);

  const handleDataParsed = (parsedCoins: CoinData[], parsedUserPower: HashPower) => {
    setCoins(parsedCoins);
    setUserPower(parsedUserPower);
  };

  const handleBalanceChange = (code: string, balance: number) => {
    setBalances(prev => ({
      ...prev,
      [code]: balance,
    }));
  };

  const handleLeagueChange = (newLeagueId: string) => {
    const foundLeague = LEAGUES.find(l => l.id === newLeagueId);
    if (foundLeague) {
      setLeague(foundLeague);
      setIsAutoLeague(false); // Disable auto-detect if manually changed
    }
  };

  const toggleAutoLeague = () => {
    const newVal = !isAutoLeague;
    setIsAutoLeague(newVal);
    // If turning on auto, trigger detection
    if (newVal && userPower) {
      setLeague(getLeagueByPower(userPower));
    }
  };

  return (
    <div className="app">
      {/* Notification */}
      {notification && (
        <div className="notification-container">
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        </div>
      )}

      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-title">
            <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h1>{t('app.title')}</h1>
          </div>
          <div className="header-right-group">
            <div className="lang-switcher">
              <button
                onClick={() => changeLanguage('tr')}
                className={`lang-btn ${i18n.language === 'tr' ? 'active' : ''}`}
              >TR</button>
              <div className="lang-divider">|</div>
              <button
                onClick={() => changeLanguage('en')}
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >EN</button>
            </div>
            {userPower && (
              <div className="user-power-badge">
                <span className="power-label">{t('app.powerBadge')}:</span>
                <span className="power-value">{formatHashPower(userPower)}</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Data Input Form */}
        <DataInputForm
          onDataParsed={handleDataParsed}
          currentCoins={coins}
          currentUserPower={userPower}
          currentLeague={league}
          isAutoLeague={isAutoLeague}
          onLeagueChange={handleLeagueChange}
          onToggleAutoLeague={toggleAutoLeague}
          onShowNotification={showNotification}
        />

        {/* Tabs */}
        {earnings.length > 0 && (
          <div className="main-tabs">
            <button
              className={`main-tab ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => setActiveTab('calculator')}
            >
              <span className="tab-icon">📊</span>
              {t('tabs.earnings')}
            </button>
            <button
              className={`main-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >
              <span className="tab-icon">⏱️</span>
              {t('tabs.withdraw')}
            </button>
          </div>
        )}

        {/* Content based on Tab */}
        {earnings.length > 0 && (
          <div className="tab-content">
            {activeTab === 'calculator' ? (
              <EarningsTable
                earnings={earnings}
                prices={prices}
              />
            ) : (
              <WithdrawTimer
                earnings={earnings}
                balances={balances}
                onBalanceChange={handleBalanceChange}
                prices={prices}
              />
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>{t('app.footerLink')}</p>
        <p className="footer-note">
          {t('app.footerText')}{' '}
          <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer">
            rollercoin.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
