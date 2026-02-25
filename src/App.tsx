import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import trFlag from './assets/flags/tr.svg';
import gbFlag from './assets/flags/gb.svg';
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
import { COIN_ICONS } from './utils/constants';
import { LEAGUE_IMAGES } from './data/leagueImages';
import { RollercoinUserResponse } from './types/user';
import DataInputForm from './components/DataInputForm';
import EarningsTable from './components/EarningsTable';

// Lazy load complex components to improve initial load and shorten critical request chains
const WithdrawTimer = React.lazy(() => import('./components/WithdrawTimer'));
const PowerSimulator = React.lazy(() => import('./components/PowerSimulator'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));

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

const TAB_ORDER: Record<Tab, number> = {
  calculator: 0,
  simulator: 1,
  withdraw: 2,
};

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

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;
    setActiveTab(newTab);
  };

  // League State
  const [league, setLeague] = useState<LeagueInfo>(LEAGUES[0]);
  const [isAutoLeague, setIsAutoLeague] = useState(true);
  const [blockRewards, setBlockRewards] = useState<Record<string, number>>({});

  // Global Username State
  const [globalUserName, setGlobalUserName] = useState<string>(() => {
    return localStorage.getItem('rollercoin_web_username') || '';
  });

  useEffect(() => {
    if (globalUserName) {
      localStorage.setItem('rollercoin_web_username', globalUserName);
    }
  }, [globalUserName]);

  // Handle 5-minute expiration for user data and league data
  useEffect(() => {
    const powerTimestamp = localStorage.getItem('rollercoin_web_userpower_timestamp');
    const clearData = () => {
      localStorage.removeItem(STORAGE_KEYS.USER_POWER);
      localStorage.removeItem(STORAGE_KEYS.COINS);
      localStorage.removeItem(STORAGE_KEYS.API_LEAGUES);
      localStorage.removeItem('rollercoin_web_raw_api_data');
      localStorage.removeItem('rollercoin_web_fetched_user');
      localStorage.removeItem('rollercoin_web_userpower_timestamp');
    };

    if (powerTimestamp) {
      const savedTime = parseInt(powerTimestamp, 10);
      const currentTime = new Date().getTime();
      const fiveMinutesInMs = 5 * 60 * 1000;

      if (currentTime - savedTime > fiveMinutesInMs) {
        clearData();
      }
    } else {
      clearData();
    }
  }, []);

  // API State
  const [apiLeagues, setApiLeagues] = useState<LeagueInfo[] | null>(null);
  const [rawApiData, setRawApiData] = useState<ApiLeagueData[] | null>(null);

  // User Fetch State (Lifted)
  const [fetchedUser, setFetchedUser] = useState<RollercoinUserResponse | null>(null);
  const [isFetchingUser, setIsFetchingUser] = useState(false);
  const [fetchMode, setFetchMode] = useState<'username' | 'power'>('username');

  // Services
  // We need to import these at top level, checking imports now...

  // ... imports check ... 
  // I need to ensure fetchUserFromApi is imported.
  // And autoScalePower.

  // Helper to fetch and set user data globally
  const handleFetchUser = async (username: string, showSuccessNotif: boolean = true) => {
    if (!username.trim()) return;
    setIsFetchingUser(true);
    try {
      const data = await fetchUserFromApi(username.trim());
      setFetchedUser(data);

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
          // setIsAutoLeague(false); // Disable auto-detect since we set it from API -> KEEP AUTO ENABLED AS REQUESTED
        }
      }

      if (showSuccessNotif) {
        showNotification(t('input.userFetched', { name: data.userProfileResponseDto.name }), 'success');
      }

    } catch (error) {
      console.error('Failed to fetch user:', error);
      // Always show error notifications
      let msg = error instanceof Error ? error.message : t('input.errors.parseError');
      if (msg === 'RATE_LIMIT') {
        msg = t('input.errors.tooManyRequests');
      }
      showNotification(msg, 'error');
      throw error;
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

  const CACHE_VERSION_KEY = 'rollercoin_web_cache_version';
  const CURRENT_CACHE_VERSION = '1.0.1';

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedVersion = localStorage.getItem(CACHE_VERSION_KEY);
      if (savedVersion !== CURRENT_CACHE_VERSION) {
        // App version updated, clear old cache to prevent malformed data bugs
        console.log(`Cache version mismatch (${savedVersion} vs ${CURRENT_CACHE_VERSION}). Clearing cache...`);
        const keysToRemove = [
          STORAGE_KEYS.COINS, STORAGE_KEYS.USER_POWER, STORAGE_KEYS.BALANCES,
          STORAGE_KEYS.ACTIVE_TAB, STORAGE_KEYS.LEAGUE_ID, STORAGE_KEYS.AUTO_LEAGUE,
          STORAGE_KEYS.API_LEAGUES, 'rollercoin_web_fetched_user',
          'rollercoin_web_raw_api_data', 'rollercoin_web_block_durations'
        ];
        keysToRemove.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(CACHE_VERSION_KEY, CURRENT_CACHE_VERSION);
        return; // Don't load erased data
      }

      const savedCoins = localStorage.getItem(STORAGE_KEYS.COINS);
      const savedBalances = localStorage.getItem(STORAGE_KEYS.BALANCES);
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      const savedLeagueId = localStorage.getItem(STORAGE_KEYS.LEAGUE_ID);
      const savedAutoLeague = localStorage.getItem(STORAGE_KEYS.AUTO_LEAGUE);
      const savedApiLeagues = localStorage.getItem(STORAGE_KEYS.API_LEAGUES);

      if (savedCoins) setCoins(JSON.parse(savedCoins));
      const savedPower = localStorage.getItem(STORAGE_KEYS.USER_POWER);
      if (savedPower) setUserPower(JSON.parse(savedPower));
      const savedFetchedUser = localStorage.getItem('rollercoin_web_fetched_user');
      if (savedFetchedUser) setFetchedUser(JSON.parse(savedFetchedUser));
      if (savedBalances) setBalances(JSON.parse(savedBalances));
      if (savedTab === 'calculator' || savedTab === 'withdraw') setActiveTab(savedTab);
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

      // If a league was saved, always restore it as visual default even if auto-league is true
      if (savedLeagueId) {
        // Try to find in API leagues first, then fall back to LEAGUES
        const savedLeaguesSource = savedApiLeagues ? JSON.parse(savedApiLeagues) : LEAGUES;
        const foundLeague = savedLeaguesSource.find((l: LeagueInfo) => l.id === savedLeagueId);
        if (foundLeague) setLeague(foundLeague);
      }
    } catch (e) {
      console.error('Error loading from localStorage:', e);
    }
  }, []);

  // Fetch ALL supported crypto prices once initially, further fetches are manual
  const pricesInitializedRef = React.useRef(false);
  useEffect(() => {
    if (!pricesInitializedRef.current) {
      pricesInitializedRef.current = true;
      const allCryptos = ['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'LTC', 'XRP', 'TRX', 'POL', 'MATIC', 'ALGO'];
      fetchPrices(allCryptos).then(setPrices);
    }
  }, []);

  // Preload UI images (Coins and Leagues) to prevent flashing/delay on appearance
  useEffect(() => {
    // Preload coin icons
    Object.values(COIN_ICONS).forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    // Preload league badges
    LEAGUE_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Track if this is the initial load to prevent power from overriding cached league
  const isInitialLoadRef = React.useRef(true);

  const handleForceFetchPrices = () => {
    const allCryptos = ['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'LTC', 'XRP', 'TRX', 'POL', 'MATIC', 'ALGO'];
    fetchPrices(allCryptos).then(setPrices).catch(console.error);
  };

  // Auto-detect league when userPower or fetchMode changes
  useEffect(() => {
    // Skip auto-detect on initial load so cached league takes precedence
    if (isInitialLoadRef.current) {
      if (userPower || fetchedUser) {
        isInitialLoadRef.current = false;
      }
      return;
    }

    if ((userPower || fetchedUser) && isAutoLeague) {
      let powerForLeague = userPower;

      // If we are in 'username' mode and have fetched user data, that takes priority
      if (fetchMode === 'username' && fetchedUser) {
        // Priority 1: Use specific league ID from User Profile
        if (fetchedUser.userProfileResponseDto?.league_Id) {
          const apiLeagueId = fetchedUser.userProfileResponseDto.league_Id;
          const leaguesSource = apiLeagues || LEAGUES;

          let foundLeague = leaguesSource.find(l => l.id === apiLeagueId);
          if (!foundLeague) {
            foundLeague = leaguesSource.find(l => String(l.id) === String(apiLeagueId));
          }

          if (foundLeague) {
            if (foundLeague.id !== league.id) {
              setLeague(foundLeague);
            }
            return; // Skip power-based calculation
          } else if (!apiLeagues) {
            return; // Wait for apiLeagues to load
          }
        }

        // Priority 2: Use Max Power logic if API User is fetched but no league ID (fallback)
        if (fetchedUser.userPowerResponseDto.max_Power) {
          const maxPowerRaw = fetchedUser.userPowerResponseDto.max_Power * 1e9;
          powerForLeague = autoScalePower(maxPowerRaw);
        } else {
          // Fallback if max_Power is missing (unlikely)
          const minersRaw = (fetchedUser.userPowerResponseDto.miners || 0) * 1e9;
          const racksRaw = (fetchedUser.userPowerResponseDto.racks || 0) * 1e9;
          const freonRaw = (fetchedUser.userPowerResponseDto.freon || 0) * 1e9;
          const bonusRaw = Math.max(0, ((fetchedUser.userPowerResponseDto.bonus || 0) * 1e9) - freonRaw);

          const base = minersRaw + racksRaw;
          const totalMinerPower = base + bonusRaw;
          powerForLeague = autoScalePower(totalMinerPower);
        }
      }
      // If we are in 'power' mode, or haven't fetched a user yet, we just use `userPower` (which is `powerForLeague` default)
      if (!powerForLeague) return;

      // Use API leagues if available, otherwise default LEAGUES
      const detectedLeague = getLeagueByPower(powerForLeague, apiLeagues || undefined);
      if (detectedLeague.id !== league.id) {
        setLeague(detectedLeague);
      }
    }
  }, [userPower, isAutoLeague, league.id, apiLeagues, fetchedUser, fetchMode]);

  // Regenerate CoinData when league changes and we have raw API data
  useEffect(() => {
    if (rawApiData && rawApiData.length > 0) {
      const matchingApiLeague = rawApiData.find(l => String(l.id) === String(league.id));
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
    let effectiveUserPower = userPower;

    // If we are in 'username' mode, we use the fetched user power
    if (fetchMode === 'username' && fetchedUser) {
      if (fetchedUser.userPowerResponseDto.max_Power) {
        effectiveUserPower = autoScalePower(fetchedUser.userPowerResponseDto.max_Power * 1e9);
      } else {
        const minersRaw = (fetchedUser.userPowerResponseDto.miners || 0) * 1e9;
        const racksRaw = (fetchedUser.userPowerResponseDto.racks || 0) * 1e9;
        const freonRaw = (fetchedUser.userPowerResponseDto.freon || 0) * 1e9;
        const bonusRaw = Math.max(0, ((fetchedUser.userPowerResponseDto.bonus || 0) * 1e9) - freonRaw);
        effectiveUserPower = autoScalePower(minersRaw + racksRaw + bonusRaw);
      }
    }

    if (coins.length > 0 && effectiveUserPower) {
      const results = calculateAllEarnings(coins, effectiveUserPower, blockRewards, blockDurations);
      setEarnings(results);
    } else {
      setEarnings([]);
    }
  }, [coins, userPower, blockRewards, blockDurations, fetchMode, fetchedUser]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (coins.length > 0) {
      localStorage.setItem(STORAGE_KEYS.COINS, JSON.stringify(coins));
    }
  }, [coins]);

  useEffect(() => {
    if (userPower) {
      localStorage.setItem(STORAGE_KEYS.USER_POWER, JSON.stringify(userPower));
      localStorage.setItem('rollercoin_web_userpower_timestamp', new Date().getTime().toString());
    }
  }, [userPower]);

  useEffect(() => {
    if (fetchedUser) {
      localStorage.setItem('rollercoin_web_fetched_user', JSON.stringify(fetchedUser));
    }
  }, [fetchedUser]);

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
  };

  // Sync League Logic Merged into main Auto-Detect Effect above.
  // Previous separate useEffect removed to prevent conflicts and auto-league disabling.

  const handleSaveDurations = (newDurations: Record<string, number>) => {
    setBlockDurations(newDurations);
    localStorage.setItem('rollercoin_web_block_durations', JSON.stringify(newDurations));
  };

  return (
    <div className="app">
      <React.Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          blockDurations={blockDurations}
          onSave={handleSaveDurations}
          coins={coins.length > 0 ? coins.map(c => c.displayName) : ['BTC', 'ETH', 'DOGE', 'BNB', 'MATIC', 'SOL', 'TRX', 'LTC', 'RST']}
        />
      </React.Suspense>
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
              >
                <img src={trFlag} alt="TR" className="flag-icon" />
                <span className="lang-text">Türkçe</span>
              </button>
              <button
                onClick={() => changeLanguage('en')}
                className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
              >
                <img src={gbFlag} alt="GB" className="flag-icon" />
                <span className="lang-text">English</span>
              </button>
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
          globalUserName={globalUserName}
          setGlobalUserName={setGlobalUserName}
          onForceFetchPrices={handleForceFetchPrices}
          fetchMode={fetchMode}
          setFetchMode={setFetchMode}
        />

        {/* Tabs */}
        {earnings.length > 0 && (
          <div className="main-tabs">
            <div
              className="main-tabs-bg"
              style={{ transform: `translateX(calc(${TAB_ORDER[activeTab] * 100}% + calc(${TAB_ORDER[activeTab]} * var(--tab-gap))))` }}
            />
            <button
              className={`main-tab ${activeTab === 'calculator' ? 'active' : ''}`}
              onClick={() => handleTabChange('calculator')}
            >
              <span className="tab-icon">📊</span>
              {t('tabs.earnings')}
            </button>
            <button
              className={`main-tab ${activeTab === 'simulator' ? 'active' : ''}`}
              onClick={() => handleTabChange('simulator')}
            >
              <span className="tab-icon">⚡</span>
              {t('tabs.simulator')}
            </button>
            <button
              className={`main-tab ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => handleTabChange('withdraw')}
            >
              <span className="tab-icon">⏱️</span>
              {t('tabs.withdraw')}
            </button>
          </div>
        )}

        {/* Content based on Tab - Slider */}
        {earnings.length > 0 && (
          <div className="tab-slider-viewport">
            <div
              className="tab-slider-track"
              style={{ transform: `translateX(-${TAB_ORDER[activeTab] * 100}%)` }}
            >
              <div className="tab-panel">
                <EarningsTable
                  earnings={earnings}
                  prices={prices}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>
              <div className="tab-panel">
                <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
                  <PowerSimulator
                    currentLeague={league}
                    apiLeagues={apiLeagues || null}
                    fetchedUser={fetchedUser}
                    onFetchUser={handleFetchUser}
                    isFetchingUser={isFetchingUser}
                    globalUserName={globalUserName}
                    setGlobalUserName={setGlobalUserName}
                  />
                </React.Suspense>
              </div>
              <div className="tab-panel">
                <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
                  <WithdrawTimer
                    earnings={earnings}
                    balances={balances}
                    onBalanceChange={handleBalanceChange}
                    prices={prices}
                  />
                </React.Suspense>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="footer">
        <p>{t('app.footerLink')}</p>
        <p className="footer-note">
          {t('app.footerText')}{' '}
          <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
            rollercoin.com
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
