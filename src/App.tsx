import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
// ... existing imports ...

import { CoinData, HashPower, EarningsResult } from './types';
import { calculateAllEarnings } from './utils/calculator';
import { formatHashPower } from './utils/powerParser';
import { getLeagueByPower, getBlockRewardsForLeague } from './utils/leagueHelper';
import { LEAGUES, LeagueInfo } from './data/leagues';
import { ApiLeagueData } from './types/api';
import { convertApiLeagueToCoinData } from './services/leagueApi';
import { fetchUserFromApi } from './services/userApi';
import { autoScalePower } from './utils/powerParser';
import { RollercoinUserResponse } from './types/user';
import DataInputForm from './components/DataInputForm';
import EarningsTable from './components/EarningsTable';
import WithdrawTimer from './components/WithdrawTimer';
import PowerSimulator from './components/PowerSimulator';
import SettingsModal from './components/SettingsModal';
import './index.css';

// Local storage keys
const STORAGE_KEYS = {
  COINS: 'rollercoin_web_coins',
  USER_POWER: 'rollercoin_web_userpower',
  BALANCES: 'rollercoin_web_balances',
  ACTIVE_TAB: 'rollercoin_web_active_tab',
  LEAGUE_ID: 'rollercoin_web_league_id',
  AUTO_LEAGUE: 'rollercoin_web_auto_league',
  API_LEAGUES: 'rollercoin_web_api_leagues',
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

type Tab = 'calculator' | 'withdraw' | 'simulator';

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

  // Dynamic SEO: update title, lang, and meta description on language change
  useEffect(() => {
    document.title = t('seo.title');
    document.documentElement.lang = i18n.language;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', t('seo.description'));
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', t('seo.title'));
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', t('seo.description'));
    const twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', t('seo.title'));
    const twitterDesc = document.querySelector('meta[name="twitter:description"]');
    if (twitterDesc) twitterDesc.setAttribute('content', t('seo.description'));
  }, [i18n.language, t]);

  const [userPower, setUserPower] = useState<HashPower | null>(null);
  const [earnings, setEarnings] = useState<EarningsResult[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<Tab>('calculator');

  // League State
  const [league, setLeague] = useState<LeagueInfo>(LEAGUES[0]);
  const [isAutoLeague, setIsAutoLeague] = useState(true);
  const [blockRewards, setBlockRewards] = useState<Record<string, number>>({});

  // API State
  const [apiLeagues, setApiLeagues] = useState<LeagueInfo[] | null>(null);
  const [rawApiData, setRawApiData] = useState<ApiLeagueData[] | null>(null);

  // User Fetch State (Lifted)
  const [fetchedUser, setFetchedUser] = useState<RollercoinUserResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);

  // Services
  // We need to import these at top level, checking imports now...

  // ... imports check ... 
  // I need to ensure fetchUserFromApi is imported.
  // And autoScalePower.

  // Helper to fetch and set user data globally
  const handleFetchUser = async (username: string) => {
    if (!username.trim()) return;
    setIsFetchingUser(true);
    try {
      const data = await fetchUserFromApi(username.trim());
      setFetchedUser(data);

      // 1. Update User Power
      // API returns total power in current_Power (raw value in Gh) 
      // User reported it's 1000x smaller (e.g. Ph instead of Eh).
      // We need to convert Gh to Hashes (* 1e9).
      const rawHashes = (data.userPowerResponseDto.current_Power || 0) * 1e9;
      const scaledPower = autoScalePower(rawHashes);
      setUserPower(scaledPower);

      // 2. Update League from API league_Id
      // API league_Id might be something like "18" (Diamond) etc.
      // We need to match this with our LeagueInfo.id
      // Our IDs are internal strings usually "0", "1", ... or matching API?
      // Let's check LEAGUES data. LEAGUES IDs are "13", "14", etc. from API integration earlier.

      const apiLeagueId = data.userProfileResponseDto.league_Id;
      if (apiLeagueId) {
        const leaguesSource = apiLeagues || LEAGUES;

        // Try strict match first
        let foundLeague = leaguesSource.find(l => l.id === apiLeagueId);

        // If not found, maybe type mismatch? (string vs number)
        if (!foundLeague) {
          foundLeague = leaguesSource.find(l => String(l.id) === String(apiLeagueId));
        }

        if (foundLeague) {
          setLeague(foundLeague);
          setIsAutoLeague(false); // Disable auto-detect since we set it from API
        }
      }

      showNotification(t('input.userFetched', { name: data.userProfileResponseDto.name }), 'success');

    } catch (error) {
      console.error('Failed to fetch user:', error);
      showNotification('Failed to fetch user data', 'error');
    } finally {
      setIsFetchingUser(false);
    }
  };

  // Block Duration State
  const [blockDurations, setBlockDurations] = useState<Record<string, number>>({
    'TRX': 602,
    'LTC': 602,
    'DOGE': 596,
    'BTC': 596,
    'ETH': 596,
    'BNB': 596,
    'MATIC': 596,
    'SOL': 596,
    'RST': 596,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
      const savedPower = localStorage.getItem(STORAGE_KEYS.USER_POWER);
      const savedBalances = localStorage.getItem(STORAGE_KEYS.BALANCES);
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      const savedLeagueId = localStorage.getItem(STORAGE_KEYS.LEAGUE_ID);
      const savedAutoLeague = localStorage.getItem(STORAGE_KEYS.AUTO_LEAGUE);
      const savedApiLeagues = localStorage.getItem(STORAGE_KEYS.API_LEAGUES);

      if (savedCoins) setCoins(JSON.parse(savedCoins));
      if (savedPower) setUserPower(JSON.parse(savedPower));
      if (savedBalances) setBalances(JSON.parse(savedBalances));
      if (savedTab === 'calculator' || savedTab === 'withdraw') setActiveTab(savedTab);
      if (savedApiLeagues) setApiLeagues(JSON.parse(savedApiLeagues));
      if (savedApiLeagues) setApiLeagues(JSON.parse(savedApiLeagues));
      const savedRawApiData = localStorage.getItem('rollercoin_web_raw_api_data');
      if (savedRawApiData) setRawApiData(JSON.parse(savedRawApiData));

      const savedDurations = localStorage.getItem('rollercoin_web_block_durations');
      if (savedDurations) {
        setBlockDurations(JSON.parse(savedDurations));
      }

      if (savedAutoLeague !== null) {
        setIsAutoLeague(savedAutoLeague === 'true');
      }

      // If manual league was saved, restore it
      if (savedLeagueId && savedAutoLeague === 'false') {
        // Try to find in API leagues first, then fall back to LEAGUES
        const savedLeaguesSource = savedApiLeagues ? JSON.parse(savedApiLeagues) : LEAGUES;
        const foundLeague = savedLeaguesSource.find((l: LeagueInfo) => l.id === savedLeagueId);
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
      let powerForLeague = userPower;

      // If we have fetched user data, use max_Power for league detection as requested.
      // This is the definitive source for their current rank.
      if (fetchedUser && fetchedUser.userPowerResponseDto.max_Power) {
        // API gives values in Gh. Convert to Hashes (* 1e9).
        const maxPowerRaw = fetchedUser.userPowerResponseDto.max_Power * 1e9;

        // Use autoScalePower to get the unit-agnostic HashPower object
        powerForLeague = autoScalePower(maxPowerRaw);
      } else if (fetchedUser) {
        // Fallback if max_Power is missing (unlikely)
        const minersRaw = (fetchedUser.userPowerResponseDto.miners || 0) * 1e9;
        const racksRaw = (fetchedUser.userPowerResponseDto.racks || 0) * 1e9;
        const bonusRaw = (fetchedUser.userPowerResponseDto.bonus || 0) * 1e9;

        const base = minersRaw + racksRaw;
        const totalMinerPower = base + bonusRaw;
        powerForLeague = autoScalePower(totalMinerPower);
      }

      // Use API leagues if available, otherwise default LEAGUES
      const detectedLeague = getLeagueByPower(powerForLeague, apiLeagues || undefined);
      if (detectedLeague.id !== league.id) {
        setLeague(detectedLeague);
      }
    }
  }, [userPower, isAutoLeague, league.id, apiLeagues, fetchedUser]);

  // Regenerate CoinData when league changes and we have raw API data
  useEffect(() => {
    if (rawApiData && rawApiData.length > 0) {
      const matchingApiLeague = rawApiData.find(l => l.id === league.id);
      if (matchingApiLeague) {
        const newCoins = convertApiLeagueToCoinData(matchingApiLeague);
        if (newCoins.length > 0) {
          setCoins(newCoins);
        }
      }
    }
  }, [league, rawApiData]);

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
      const results = calculateAllEarnings(coins, userPower, blockRewards, blockDurations);
      setEarnings(results);
    } else {
      setEarnings([]);
    }
  }, [coins, userPower, blockRewards, blockDurations]);

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
    // Use API leagues if available, otherwise fall back to default LEAGUES
    const leaguesSource = apiLeagues || LEAGUES;
    const foundLeague = leaguesSource.find(l => l.id === newLeagueId);
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
      setLeague(getLeagueByPower(userPower, apiLeagues || undefined));
    }
  };

  const handleApiLeaguesLoaded = (leagues: LeagueInfo[], rawData: ApiLeagueData[]) => {
    setApiLeagues(leagues);
    setRawApiData(rawData);
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.API_LEAGUES, JSON.stringify(leagues));
    localStorage.setItem('rollercoin_web_raw_api_data', JSON.stringify(rawData));

    // Auto-detect league from API leagues based on user power
    if (userPower && isAutoLeague) {
      const detectedLeague = getLeagueByPower(userPower, leagues);
      setLeague(detectedLeague);
    } else {
      // Try to find current league in API data by name
      const matchedLeague = leagues.find(l => l.name === league.name);
      if (matchedLeague) {
        setLeague(matchedLeague);
      } else {
        // Default to first API league
        setLeague(leagues[0]);
      }
    }
  };

  const handleSaveDurations = (newDurations: Record<string, number>) => {
    setBlockDurations(newDurations);
    localStorage.setItem('rollercoin_web_block_durations', JSON.stringify(newDurations));
  };

  return (
    <div className="app">
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        blockDurations={blockDurations}
        onSave={handleSaveDurations}
        coins={coins.length > 0 ? coins.map(c => c.displayName) : ['BTC', 'ETH', 'DOGE', 'BNB', 'MATIC', 'SOL', 'TRX', 'LTC', 'RST']}
      />
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
          onApiLeaguesLoaded={handleApiLeaguesLoaded}
          apiLeagues={apiLeagues}
          onFetchUser={handleFetchUser}
          isFetchingUser={isFetchingUser}
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
              className={`main-tab ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => setActiveTab('simulator')}
            >
              <span className="tab-icon">⚡</span>
              {t('tabs.simulator')}
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
          <div className="tab-content" key={activeTab}>
            {activeTab === 'calculator' && (
              <EarningsTable
                earnings={earnings}
                prices={prices}
                onOpenSettings={() => setIsSettingsOpen(true)}
              />
            )}
            {activeTab === 'simulator' && (
              <PowerSimulator
                currentLeague={league}
                apiLeagues={apiLeagues || null}
                fetchedUser={fetchedUser}
                onFetchUser={handleFetchUser}
                isFetchingUser={isFetchingUser}
              />
            )}
            {activeTab === 'withdraw' && (
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
