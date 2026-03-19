import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import trFlag from './assets/flags/tr.svg';
import gbFlag from './assets/flags/gb.svg';
import appLogo from './assets/logo.png';
import { Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
// ... existing imports ...

import { CoinData, HashPower, EarningsResult } from './types';
import { calculateAllEarnings } from './utils/calculator';
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
import { Helmet } from 'react-helmet-async';

// Lazy load complex components to improve initial load and shorten critical request chains
const WithdrawTimer = React.lazy(() => import('./components/WithdrawTimer'));
const PowerSimulator = React.lazy(() => import('./components/PowerSimulator'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const ColumnSettingsModal = React.lazy(() => import('./components/ColumnSettingsModal'));
const ProgressionEvent = React.lazy(() => import('./components/ProgressionEvent'));
const AboutPage = React.lazy(() => import('./components/AboutPage'));
const PrivacyPage = React.lazy(() => import('./components/PrivacyPage'));
const FaqPage = React.lazy(() => import('./components/FaqPage'));
const GuidesPage = React.lazy(() => import('./components/GuidesPage'));
const SupportPage = React.lazy(() => import('./components/SupportPage'));

import SeoArticle from './components/SeoArticle';
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
  TABLE_COLUMNS: 'rollercoin_web_table_columns',
  CUSTOM_PERIOD_DAYS: 'rollercoin_web_custom_period_days',
  CUSTOM_PERIOD_HOURS: 'rollercoin_web_custom_period_hours',
};

const PRICES_CACHE_KEY = 'rollercoin_web_prices_cache';

// Fetch prices from Binance API - only fetches the specific pairs needed
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
    'POL': ['POLUSDT', 'MATICUSDT'],
    'MATIC': ['POLUSDT', 'MATICUSDT'],
    'ALGO': ['ALGOUSDT'],
  };

  // Build deduplicated list of only the Binance pairs we actually need
  const neededPairs = new Set<string>();
  for (const symbol of symbols) {
    const candidates = symbolMap[symbol.toUpperCase()];
    if (candidates) candidates.forEach(c => neededPairs.add(c));
  }

  try {
    // Fetch only the specific pairs needed (~1KB) instead of all ~2000 pairs (~500KB)
    const encoded = encodeURIComponent(JSON.stringify([...neededPairs]));
    const response = await fetch(`https://api.binance.com/api/v3/ticker/price?symbols=${encoded}`);
    const data = await response.json();

    const priceMap = new Map<string, number>();
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
            break;
          }
        }
      }
    }

    // Cache successful result in localStorage
    prices['USDT'] = 1;
    localStorage.setItem(PRICES_CACHE_KEY, JSON.stringify({ prices, ts: Date.now() }));
    return prices;
  } catch (error) {
    console.error('Failed to fetch prices:', error);
    // Use cached prices as fallback only if they are less than 10 minutes old
    try {
      const cached = localStorage.getItem(PRICES_CACHE_KEY);
      if (cached) {
        const { prices: cachedPrices, ts } = JSON.parse(cached);
        if (Date.now() - ts < 10 * 60 * 1000) {
          return cachedPrices;
        }
      }
    } catch (_) { /* ignore */ }
  }

  // USDT is a stablecoin, hardcode $1 price
  prices['USDT'] = 1;
  return prices;
}

type Tab = 'calculator' | 'withdraw' | 'simulator';

const TAB_ORDER: Record<Tab, number> = {
  calculator: 0,
  simulator: 1,
  withdraw: 2,
};

import Notification from './components/Notification';

function AutoRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage first
    const savedLang = localStorage.getItem('rollercoin_web_language');
    if (savedLang && (savedLang === 'tr' || savedLang === 'en')) {
      navigate(`/${savedLang}`, { replace: true });
      return;
    }

    // Otherwise detect from browser
    const browserLang = navigator.language.split('-')[0];
    const targetLang = browserLang === 'tr' ? 'tr' : 'en';
    navigate(`/${targetLang}`, { replace: true });
  }, [navigate]);

  return null;
}

function CalculatorArea({ showEventPageRoute = false }: { showEventPageRoute?: boolean }) {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [coins, setCoins] = useState<CoinData[]>([]);

  // Force language sync with URL parmater on mount and param change
  useEffect(() => {
    if (lang && (lang === 'tr' || lang === 'en')) {
      if (i18n.language !== lang) {
        i18n.changeLanguage(lang);
      }
      localStorage.setItem('rollercoin_web_language', lang);
    } else {
      // Invalid lang parameter, redirect to detected language
      navigate('/', { replace: true });
    }
  }, [lang, i18n, navigate]);

  // Notification state
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Use the route prop directly instead of hash-based routing
  const showEventPage = showEventPageRoute;

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };


  // Dynamic SEO: update lang on language change
  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);


  const currentUrl = `https://rollercoincalculator.app/${lang || i18n.language}${showEventPageRoute ? '/event' : ''}`;

  const [userPower, setUserPower] = useState<HashPower | null>(null);
  const [earnings, setEarnings] = useState<EarningsResult[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<Tab>('calculator');
  const [collapsedTabs, setCollapsedTabs] = useState<Set<Tab>>(new Set(['simulator', 'withdraw']));

  const handleTabChange = (newTab: Tab) => {
    if (newTab === activeTab) return;
    const oldTab = activeTab;
    // Uncollapse incoming panel immediately so it's visible during slide
    setCollapsedTabs(prev => { const next = new Set(prev); next.delete(newTab); return next; });
    setActiveTab(newTab);
    // Collapse outgoing panel after animation completes
    setTimeout(() => {
      setCollapsedTabs(prev => { const next = new Set(prev); next.add(oldTab); return next; });
    }, 400);
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
      } else if (msg === 'Failed to fetch') {
        // Handle generic network fetch failure
        msg = t('input.fetchUserError', { error: 'Network Data Error / CORS' });
      } else {
        msg = t('input.fetchUserError', { error: msg });
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
    'USDT': 596,
    "XRP": 596,
    "HMT": 596,
    "POL": 596,
    "RLT": 596,
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Table column configuration state
  type TableColumnType = 'blockReward' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  const [visibleColumns, setVisibleColumns] = useState<Set<TableColumnType>>(
    new Set(['daily', 'weekly', 'monthly'])
  );
  const [customPeriodDays, setCustomPeriodDays] = useState<number>(0);
  const [customPeriodHours, setCustomPeriodHours] = useState<number>(0);

  const CACHE_VERSION_KEY = 'rollercoin_web_cache_version';
  const CURRENT_CACHE_VERSION = '1.0.4';

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
      if (savedTab === 'calculator' || savedTab === 'withdraw' || savedTab === 'simulator') {
        setActiveTab(savedTab);
        setCollapsedTabs(prev => { const next = new Set(prev); next.delete(savedTab); return next; });
      }
      if (savedApiLeagues) setApiLeagues(JSON.parse(savedApiLeagues));
      const savedRawApiData = localStorage.getItem('rollercoin_web_raw_api_data');
      if (savedRawApiData) setRawApiData(JSON.parse(savedRawApiData));

      const savedDurations = localStorage.getItem('rollercoin_web_block_durations');
      if (savedDurations) {
        setBlockDurations(JSON.parse(savedDurations));
      }

      // Load table column configuration
      const savedTableColumns = localStorage.getItem(STORAGE_KEYS.TABLE_COLUMNS);
      if (savedTableColumns) {
        try {
          const columnArray = JSON.parse(savedTableColumns);
          setVisibleColumns(new Set(columnArray));
        } catch (_) {
          // Use default if JSON parse fails
        }
      }

      // Load custom period configuration
      const savedCustomDays = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERIOD_DAYS);
      if (savedCustomDays) setCustomPeriodDays(parseInt(savedCustomDays, 10));
      const savedCustomHours = localStorage.getItem(STORAGE_KEYS.CUSTOM_PERIOD_HOURS);
      if (savedCustomHours) setCustomPeriodHours(parseInt(savedCustomHours, 10));

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

  // Synchronize 'league' state when 'apiLeagues' updates so latest block rewards are always used
  useEffect(() => {
    if (apiLeagues && apiLeagues.length > 0) {
      const updatedLeague = apiLeagues.find(l => String(l.id) === String(league.id));
      if (updatedLeague && updatedLeague !== league) {
        setLeague(updatedLeague);
      }
    }
  }, [apiLeagues, league.id, league]);


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
            if (foundLeague.id !== league.id || foundLeague !== league) {
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
      if (detectedLeague.id !== league.id || detectedLeague !== league) {
        setLeague(detectedLeague);
      }
    }
  }, [userPower, isAutoLeague, league, apiLeagues, fetchedUser, fetchMode]);

  // Regenerate CoinData when league changes and we have raw API data
  useEffect(() => {
    if (rawApiData && rawApiData.length > 0) {
      // Try matching by league.id first
      let matchingApiLeague = rawApiData.find(l => String(l.id) === String(league.id));

      // If no match and we have a fetched user, try matching by user's league_Id directly
      if (!matchingApiLeague && fetchedUser?.userProfileResponseDto?.league_Id) {
        const userLeagueId = fetchedUser.userProfileResponseDto.league_Id;
        matchingApiLeague = rawApiData.find(l => String(l.id) === String(userLeagueId));
        // Also update the league state to the correct API league
        if (matchingApiLeague && apiLeagues) {
          const correctLeague = apiLeagues.find(l => String(l.id) === String(userLeagueId));
          if (correctLeague && correctLeague.id !== league.id) {
            setLeague(correctLeague);
          }
        }
      }

      if (matchingApiLeague) {
        const newCoins = convertApiLeagueToCoinData(matchingApiLeague);
        if (newCoins.length > 0) {
          setCoins(newCoins);
        }
      }
    }
  }, [league, rawApiData, fetchedUser, apiLeagues]);

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
    // current_Power includes ALL power sources (miners, bonus, racks, games, temp, freon)
    // max_Power only includes league-qualifying power (miners + bonus + racks) and excludes freon, games, temp
    if (fetchMode === 'username' && fetchedUser) {
      if (fetchedUser.userPowerResponseDto.current_Power) {
        effectiveUserPower = autoScalePower(fetchedUser.userPowerResponseDto.current_Power * 1e9);
      } else {
        // Fallback: manually compute total power from all components
        const minersRaw = (fetchedUser.userPowerResponseDto.miners || 0) * 1e9;
        const gamesRaw = (fetchedUser.userPowerResponseDto.games || 0) * 1e9;
        const racksRaw = (fetchedUser.userPowerResponseDto.racks || 0) * 1e9;
        const tempRaw = (fetchedUser.userPowerResponseDto.temp || 0) * 1e9;
        const freonRaw = (fetchedUser.userPowerResponseDto.freon || 0) * 1e9;
        const bonusRaw = Math.max(0, ((fetchedUser.userPowerResponseDto.bonus || 0) * 1e9) - freonRaw);
        effectiveUserPower = autoScalePower(minersRaw + gamesRaw + racksRaw + tempRaw + freonRaw + bonusRaw);
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

    // Optional sync: update current league to latest API data if it's the same ID
    const foundLeague = leagues.find(l => String(l.id) === String(league.id));
    if (foundLeague && foundLeague !== league) {
      setLeague(foundLeague);
    }
  };

  // Sync League Logic Merged into main Auto-Detect Effect above.
  // Previous separate useEffect removed to prevent conflicts and auto-league disabling.

  const handleSaveDurations = (newDurations: Record<string, number>) => {
    setBlockDurations(newDurations);
    localStorage.setItem('rollercoin_web_block_durations', JSON.stringify(newDurations));
  };

  // Compute the effective power to display in the header badge.
  // In username fetch mode, power comes from fetchedUser, not from the userPower state.
  const displayPower = useMemo<HashPower | null>(() => {
    if (fetchMode === 'username' && fetchedUser) {
      if (fetchedUser.userPowerResponseDto.current_Power) {
        return autoScalePower(fetchedUser.userPowerResponseDto.current_Power * 1e9);
      }
      // Fallback: manually compute total power from all components
      const minersRaw = (fetchedUser.userPowerResponseDto.miners || 0) * 1e9;
      const gamesRaw = (fetchedUser.userPowerResponseDto.games || 0) * 1e9;
      const racksRaw = (fetchedUser.userPowerResponseDto.racks || 0) * 1e9;
      const tempRaw = (fetchedUser.userPowerResponseDto.temp || 0) * 1e9;
      const freonRaw = (fetchedUser.userPowerResponseDto.freon || 0) * 1e9;
      const bonusRaw = Math.max(0, ((fetchedUser.userPowerResponseDto.bonus || 0) * 1e9) - freonRaw);
      return autoScalePower(minersRaw + gamesRaw + racksRaw + tempRaw + freonRaw + bonusRaw);
    }
    return userPower;
  }, [fetchMode, fetchedUser, userPower]);

  return (
    <div className="app-layout">
      {/* Left Side Ad - Desktop Only */}
      <div className="side-ad side-ad-left">
        <div className="side-ad-inner">
          <iframe data-aa="2429727" src="//ad.a-ads.com/2429727/?size=160x600&background_color=1e2433&title_color=fffffe"
            style={{ border: 0, padding: 0, width: 160, height: 600, overflow: 'hidden', display: 'block', margin: '0 auto' }}
            title="Ad Left" />
        </div>
      </div>

      <div className="app">
        <React.Suspense fallback={null}>
          <SettingsModal
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            blockDurations={blockDurations}
            onSave={handleSaveDurations}
            coins={coins.length > 0 ? coins.map(c => c.displayName) : ['BTC', 'ETH', 'DOGE', 'BNB', 'MATIC', 'SOL', 'TRX', 'LTC', 'RST']}
          />
          <ColumnSettingsModal
            isOpen={columnModalOpen}
            onClose={() => setColumnModalOpen(false)}
            visibleColumns={visibleColumns}
            onVisibleColumnsChange={(newCols) => {
              setVisibleColumns(newCols);
              localStorage.setItem(STORAGE_KEYS.TABLE_COLUMNS, JSON.stringify([...newCols]));
            }}
            customPeriodDays={customPeriodDays}
            customPeriodHours={customPeriodHours}
            onCustomPeriodDaysChange={(days) => {
              setCustomPeriodDays(days);
              localStorage.setItem(STORAGE_KEYS.CUSTOM_PERIOD_DAYS, days.toString());
            }}
            onCustomPeriodHoursChange={(hours) => {
              setCustomPeriodHours(hours);
              localStorage.setItem(STORAGE_KEYS.CUSTOM_PERIOD_HOURS, hours.toString());
            }}
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

        {/* SEO Tags */}
        <Helmet>
          <title>{t('seo.title')}</title>
          <meta name="description" content={t('seo.description')} />
          <link rel="canonical" href={currentUrl} />
          <meta property="og:title" content={t('seo.title')} />
          <meta property="og:description" content={t('seo.description')} />
          <meta property="og:url" content={currentUrl} />
          <meta name="twitter:title" content={t('seo.title')} />
          <meta name="twitter:description" content={t('seo.description')} />
        </Helmet>

        {/* Header */}
        <header className="header">
          <div className="header-content">
            <div className="header-logo">
              <img src={appLogo} alt="Logo" width="80" height="80" className="app-main-logo" />
            </div>
            <div className="header-title">
              <h1>{t('app.title')}</h1>
            </div>
            <div className="header-right-group">
              <div className="main-nav-links">
                 <Link to={`/${i18n.language}/guides`} className="nav-link">{t('nav.guides')}</Link>
                 <Link to={`/${i18n.language}/faq`} className="nav-link">{t('nav.faq')}</Link>
                 <Link to={`/${i18n.language}/support`} className="nav-link">{t('nav.support')}</Link>
              </div>
              <div className="lang-switcher">
                <button
                  className={`lang-btn ${i18n.language === 'tr' ? 'active' : ''}`}
                  onClick={() => navigate('/tr' + (showEventPageRoute ? '/event' : ''))}
                  title="Türkçe"
                >
                  <img src={trFlag} alt="TR" className="flag-icon" />
                  <span className="lang-text">Türkçe</span>
                </button>
                <button
                  className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                  onClick={() => navigate('/en' + (showEventPageRoute ? '/event' : ''))}
                  title="English"
                >
                  <img src={gbFlag} alt="EN" className="flag-icon" />
                  <span className="lang-text">English</span>
                </button>
              </div>
              <a
                href="https://github.com/BurakTemelkaya/RollercoinCalculatorWeb"
                target="_blank"
                rel="noopener noreferrer"
                className="github-link"
                title="GitHub"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
            </div>
          </div>
        </header>

        {/* Mobile Ad Banner - Hidden on desktop where side ads show */}
        <div className="mobile-ad">
          <iframe data-aa="2429728" src="//acceptable.a-ads.com/2429728/?size=Adaptive&background_color=1e2433&title_color=fffffe"
            style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: '0 auto' }}
            title="Ad Mobile" />
        </div>

        {/* Main Content */}
        {showEventPage ? (
          <main className="main-content">
            <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
              <ProgressionEvent />
            </React.Suspense>
          </main>
        ) : (
          <main className="main-content">
            {/* Event Page Link (Top) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <Link to={`/${lang}/event`} className="pe-event-link" style={{ margin: 0 }}>
                <span className="tab-icon">🎉</span>
                {t('tabs.event')}
              </Link>
            </div>

            {/* Data Input Form */}
            <DataInputForm
              onDataParsed={handleDataParsed}
              currentCoins={coins}
              currentUserPower={userPower}
              displayPower={displayPower}
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
            <div className="tab-slider-viewport">
              <div
                className="tab-slider-track"
                style={{ transform: `translateX(-${TAB_ORDER[activeTab] * 100}%)` }}
              >
                {earnings.length > 0 && (
                  <>
                    <div className={`tab-panel${collapsedTabs.has('calculator') ? ' collapsed' : ''}`}>
                      <EarningsTable
                        earnings={earnings}
                        prices={prices}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenColumnSettings={() => setColumnModalOpen(true)}
                        onShowNotification={showNotification}
                        visibleColumns={visibleColumns}
                        blockDurations={blockDurations}
                        customPeriodDays={customPeriodDays}
                        customPeriodHours={customPeriodHours}
                      />
                    </div>
                    <div className={`tab-panel${collapsedTabs.has('simulator') ? ' collapsed' : ''}`}>
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
                    <div className={`tab-panel${collapsedTabs.has('withdraw') ? ' collapsed' : ''}`}>
                      <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
                        <WithdrawTimer
                          earnings={earnings}
                          balances={balances}
                          onBalanceChange={handleBalanceChange}
                          prices={prices}
                        />
                      </React.Suspense>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Mobile Ad Banner - Moved above SeoArticle per user request */}
            <div className="mobile-ad">
              <iframe data-aa="2429728" src="//acceptable.a-ads.com/2429728/?size=Adaptive&background_color=1e2433&title_color=fffffe"
                style={{ border: 0, padding: 0, width: '70%', height: 'auto', overflow: 'hidden', display: 'block', margin: '0 auto' }}
                title="Ad Mobile Bottom" />
            </div>

            <SeoArticle />
          </main>
        )}

        {/* Footer */}
        <footer className="footer">
          <p>{t('app.footerLink')}</p>
          <p className="footer-note">
            {t('app.footerText')}{' '}
            <a href="https://rollercoin.com/game" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>
              rollercoin.com
            </a>
          </p>
          <p className="footer-note">
            <Link to={`/${lang}/about`}>{lang === 'tr' ? 'Hakkımızda' : 'About Us'}</Link>
            {' · '}
            <Link to={`/${lang}/privacy`}>{lang === 'tr' ? 'Gizlilik Politikası' : 'Privacy Policy'}</Link>
          </p>
        </footer>
      </div>

      {/* Right Side Ad - Desktop Only */}
      <div className="side-ad side-ad-right">
        <div className="side-ad-inner">
          <iframe data-aa="2429727" src="//ad.a-ads.com/2429727/?size=160x600&background_color=1e2433&title_color=fffffe"
            style={{ border: 0, padding: 0, width: 160, height: 600, overflow: 'hidden', display: 'block', margin: '0 auto' }}
            title="Ad Right" />
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<AutoRedirect />} />
      <Route path="/:lang" element={<CalculatorArea />} />
      <Route path="/:lang/event" element={<CalculatorArea showEventPageRoute={true} />} />
      <Route path="/:lang/about" element={<React.Suspense fallback={null}><AboutPage /></React.Suspense>} />
      <Route path="/:lang/privacy" element={<React.Suspense fallback={null}><PrivacyPage /></React.Suspense>} />
      <Route path="/:lang/faq" element={<React.Suspense fallback={null}><FaqPage /></React.Suspense>} />
      <Route path="/:lang/guides" element={<React.Suspense fallback={null}><GuidesPage /></React.Suspense>} />
      <Route path="/:lang/support" element={<React.Suspense fallback={null}><SupportPage /></React.Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
