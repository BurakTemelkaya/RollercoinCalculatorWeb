import React from 'react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useMemo } from 'react';
import { Routes, Route, Navigate, useParams, useNavigate, Link } from 'react-router-dom';
// ... existing imports ...

import { CoinData, HashPower, EarningsResult } from './types';
import { calculateAllEarnings } from './utils/calculator';
import { getLeagueByPower, getBlockRewardsForLeague } from './utils/leagueHelper';
import { LEAGUES, LeagueInfo, CURRENCY_MAP } from './data/leagues';
import { ApiLeagueData } from './types/api';
import { convertApiLeagueToCoinData } from './services/leagueApi';
import { fetchUserFromApi } from './services/userApi';
import { autoScalePower } from './utils/powerParser';
import { COIN_ICONS } from './utils/constants';
import { LEAGUE_IMAGES } from './data/leagueImages';
import { RollercoinUserResponse } from './types/user';
import DataInputForm from './components/DataInputForm';
import EarningsTable from './components/EarningsTable';
import { ApiError } from './services/apiClient';
import { NAV_ICONS } from './components/MainLayout';

// Lazy load complex components to improve initial load and shorten critical request chains
const WithdrawTimer = React.lazy(() => import('./components/WithdrawTimer'));
const PowerSimulator = React.lazy(() => import('./components/PowerSimulator'));
const SettingsModal = React.lazy(() => import('./components/SettingsModal'));
const ColumnSettingsModal = React.lazy(() => import('./components/ColumnSettingsModal'));
const ProgressionEvent = React.lazy(() => import('./components/ProgressionEvent'));
const ProgressionEventHistory = React.lazy(() => import('./components/ProgressionEventHistory'));
const AboutPage = React.lazy(() => import('./components/AboutPage'));
const PrivacyPage = React.lazy(() => import('./components/PrivacyPage'));
const FaqPage = React.lazy(() => import('./components/FaqPage'));
const GuidesPage = React.lazy(() => import('./components/GuidesPage'));
const F2PGuide = React.lazy(() => import('./components/guides/F2PGuide'));
const BonusPowerGuide = React.lazy(() => import('./components/guides/BonusPowerGuide'));
const MarketplaceArbitrageGuide = React.lazy(() => import('./components/guides/MarketplaceArbitrageGuide'));
const MiningPowerGuide = React.lazy(() => import('./components/guides/MiningPowerGuide'));
const CalculationLogicGuide = React.lazy(() => import('./components/guides/CalculationLogicGuide'));
const SupportPage = React.lazy(() => import('./components/SupportPage'));
const LeagueChart = React.lazy(() => import('./components/LeagueChart'));
const BlogPage = React.lazy(() => import('./components/BlogPage'));
const WhatIsRollercoin = React.lazy(() => import('./components/blog/WhatIsRollercoin'));
const LeagueSystemExplained = React.lazy(() => import('./components/blog/LeagueSystemExplained'));
const MarketplaceTradingGuide = React.lazy(() => import('./components/blog/MarketplaceTradingGuide'));
const MostProfitableCoin = React.lazy(() => import('./components/blog/MostProfitableCoin'));
const BeginnersCompleteGuide = React.lazy(() => import('./components/blog/BeginnersCompleteGuide'));
const MergePage = React.lazy(() => import('./components/MergePage'));
const DailyBonusQuestHistory = React.lazy(() => import('./components/DailyBonusQuestHistory'));

import SeoArticle from './components/SeoArticle';
import MainLayout from './components/MainLayout';
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

import { fetchPrices, PriceApiProvider } from './services/priceApi';

type Tab = 'calculator' | 'withdraw' | 'simulator';

const TAB_ORDER: Record<Tab, number> = {
  calculator: 0,
  simulator: 1,
  withdraw: 2,
};

import Notification from './components/Notification';
import LeaguePowerPartition from './components/LeaguePowerPartition';

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

function CalculatorArea({ isEventPage = false }: { isEventPage?: boolean }) {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [coins, setCoins] = useState<CoinData[]>([]);

  // Force language sync with URL parameter on mount and param change
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

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
  };

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

  // User Not Found Error State
  const [userNotFoundError, setUserNotFoundError] = useState(false);

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
      if (error instanceof ApiError && error.isRateLimit) {
        msg = t('input.errors.tooManyRequests');
      } else if (error instanceof ApiError && error.isForbidden) {
        msg = t('input.errors.turnstileFailed');
      } else if (msg === 'RATE_LIMIT') { // Fallback, just in case
        msg = t('input.errors.tooManyRequests');
      } else if (error instanceof ApiError && error.status === 400) {
        // Treat all 400 responses in user fetch flow as user-not-found.
        msg = t('input.errors.userNotFound');
        setUserNotFoundError(true);
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
  const [blockDurationMode, setBlockDurationMode] = useState<'auto' | 'manual'>(() => {
    const saved = localStorage.getItem('rollercoin_web_block_duration_mode');
    return saved === 'manual' ? 'manual' : 'auto';
  });
  const [priceApiPref, setPriceApiPref] = useState<PriceApiProvider>(() => {
    const saved = localStorage.getItem('rollercoin_web_price_api');
    return saved === 'coingecko' ? 'coingecko' : 'binance';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [columnModalOpen, setColumnModalOpen] = useState(false);

  // Table column configuration state
  type TableColumnType = 'blockReward' | 'blockDuration' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  const [visibleColumns, setVisibleColumns] = useState<Set<TableColumnType>>(
    new Set(['daily', 'weekly', 'monthly'])
  );
  const [customPeriodDays, setCustomPeriodDays] = useState<number>(0);
  const [customPeriodHours, setCustomPeriodHours] = useState<number>(0);

  const CACHE_VERSION_KEY = 'rollercoin_web_cache_version';
  const CURRENT_CACHE_VERSION = '1.0.5';

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
  const [lastPricePrefFetched, setLastPricePrefFetched] = useState<PriceApiProvider | null>(null);

  useEffect(() => {
    if (!pricesInitializedRef.current || lastPricePrefFetched !== priceApiPref) {
      pricesInitializedRef.current = true;
      setLastPricePrefFetched(priceApiPref);
      const allCryptos = ['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'LTC', 'XRP', 'TRX', 'POL', 'MATIC', 'ALGO'];
      fetchPrices(allCryptos, priceApiPref).then(setPrices).catch(console.error);
    }
  }, [priceApiPref, lastPricePrefFetched]);

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
    fetchPrices(allCryptos, priceApiPref).then(setPrices).catch(console.error);
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

        // Extract block durations from API data for the matched league
        const apiDurations: Record<string, number> = {};
        for (const currency of matchingApiLeague.currencies) {
          if (currency.duration) {
            const displayName = CURRENCY_MAP[currency.name] || currency.name;
            apiDurations[displayName] = currency.duration;
          }
        }
        if (Object.keys(apiDurations).length > 0 && blockDurationMode === 'auto') {
          setBlockDurations(prev => {
            const merged = { ...prev, ...apiDurations };
            localStorage.setItem('rollercoin_web_block_durations', JSON.stringify(merged));
            return merged;
          });
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

  const handleSaveSettings = (newDurations: Record<string, number>, newMode: 'auto' | 'manual', newPriceApiMode: PriceApiProvider) => {
    setBlockDurationMode(newMode);
    localStorage.setItem('rollercoin_web_block_duration_mode', newMode);

    setPriceApiPref(newPriceApiMode);
    localStorage.setItem('rollercoin_web_price_api', newPriceApiMode);

    if (newMode === 'auto' && rawApiData && rawApiData.length > 0) {
      // Re-apply API durations immediately
      const matchingApiLeague = rawApiData.find(l => l.id === league.id);
      if (matchingApiLeague) {
        const apiDurations: Record<string, number> = {};
        for (const currency of matchingApiLeague.currencies) {
          if (currency.duration) {
            const displayName = CURRENCY_MAP[currency.name] || currency.name;
            apiDurations[displayName] = currency.duration;
          }
        }
        if (Object.keys(apiDurations).length > 0) {
          const merged = { ...newDurations, ...apiDurations };
          setBlockDurations(merged);
          localStorage.setItem('rollercoin_web_block_durations', JSON.stringify(merged));
          return;
        }
      }
    }

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
    <div className="app">
      <React.Suspense fallback={null}>
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          blockDurations={blockDurations}
          onSave={handleSaveSettings}
          coins={coins.length > 0 ? coins.map(c => c.displayName) : ['BTC', 'ETH', 'DOGE', 'BNB', 'MATIC', 'SOL', 'TRX', 'LTC', 'RST']}
          blockDurationMode={blockDurationMode}
          priceApiPref={priceApiPref}
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

      {/* Content */}
      {isEventPage ? (
        <>
          <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
            <ProgressionEvent />
          </React.Suspense>
        </>
      ) : (
        <React.Suspense fallback={<div className="tab-loading-placeholder"><span className="spinner"></span></div>}>
          <>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
              <Link to={`/${lang}/event`} className="pe-event-link" style={{ margin: 0 }}>
                <span className="tab-icon">{NAV_ICONS.events}</span>
                {t('tabs.event')}
              </Link>
              <Link to={`/${lang}/merges`} className="pe-event-link" style={{ margin: 0, background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.1), rgba(14, 165, 233, 0.1))', borderColor: 'rgba(56, 189, 248, 0.2)' }}>
                <span className="tab-icon">{NAV_ICONS.merges}</span>
                {t('nav.merges')}
              </Link>
              <Link to={`/${lang}/support`} className="pe-event-link" style={{ margin: 0, background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(251, 191, 36, 0.1))', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
                <span className="tab-icon">{NAV_ICONS.support}</span>
                {t('nav.support')}
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
              userNotFoundError={userNotFoundError}
              setUserNotFoundError={setUserNotFoundError}
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
                        effectiveUserPower={displayPower}
                        prices={prices}
                        onOpenSettings={() => setIsSettingsOpen(true)}
                        onOpenColumnSettings={() => setColumnModalOpen(true)}
                        onShowNotification={showNotification}
                        visibleColumns={visibleColumns}
                        blockDurations={blockDurations}
                        customPeriodDays={customPeriodDays}
                        customPeriodHours={customPeriodHours}
                      />
                      <LeaguePowerPartition league={(rawApiData || []).find(l => String(l.id) === String(league.id)) || (rawApiData && rawApiData[0]) || null} />
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


            <SeoArticle />
          </>
        </React.Suspense>
      )}
    </div>
  );
}

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<AutoRedirect />} />
        <Route path="/:lang" element={<CalculatorArea />} />
        <Route path="/:lang/event" element={<CalculatorArea isEventPage={true} />} />
        <Route path="/:lang/event/:eventId" element={<CalculatorArea isEventPage={true} />} />
        <Route path="/:lang/events" element={<React.Suspense fallback={null}><ProgressionEventHistory /></React.Suspense>} />
        <Route path="/:lang/about" element={<React.Suspense fallback={null}><AboutPage /></React.Suspense>} />
        <Route path="/:lang/privacy" element={<React.Suspense fallback={null}><PrivacyPage /></React.Suspense>} />
        <Route path="/:lang/faq" element={<React.Suspense fallback={null}><FaqPage /></React.Suspense>} />
        <Route path="/:lang/guides" element={<React.Suspense fallback={null}><GuidesPage /></React.Suspense>} />
        <Route path="/:lang/guides/f2p-strategy" element={<React.Suspense fallback={null}><F2PGuide /></React.Suspense>} />
        <Route path="/:lang/guides/bonus-power" element={<React.Suspense fallback={null}><BonusPowerGuide /></React.Suspense>} />
        <Route path="/:lang/guides/marketplace-arbitrage" element={<React.Suspense fallback={null}><MarketplaceArbitrageGuide /></React.Suspense>} />
        <Route path="/:lang/guides/mining-power" element={<React.Suspense fallback={null}><MiningPowerGuide /></React.Suspense>} />
        <Route path="/:lang/guides/calculation-logic" element={<React.Suspense fallback={null}><CalculationLogicGuide /></React.Suspense>} />
        <Route path="/:lang/support" element={<React.Suspense fallback={null}><SupportPage /></React.Suspense>} />
        <Route path="/:lang/charts" element={<React.Suspense fallback={null}><LeagueChart /></React.Suspense>} />
        <Route path="/:lang/merges" element={<React.Suspense fallback={null}><MergePage /></React.Suspense>} />
        <Route path="/:lang/daily-quests" element={<React.Suspense fallback={null}><DailyBonusQuestHistory /></React.Suspense>} />
        <Route path="/:lang/blog" element={<React.Suspense fallback={null}><BlogPage /></React.Suspense>} />
        <Route path="/:lang/blog/what-is-rollercoin" element={<React.Suspense fallback={null}><WhatIsRollercoin /></React.Suspense>} />
        <Route path="/:lang/blog/league-system-explained" element={<React.Suspense fallback={null}><LeagueSystemExplained /></React.Suspense>} />
        <Route path="/:lang/blog/marketplace-trading-guide" element={<React.Suspense fallback={null}><MarketplaceTradingGuide /></React.Suspense>} />
        <Route path="/:lang/blog/most-profitable-coin" element={<React.Suspense fallback={null}><MostProfitableCoin /></React.Suspense>} />
        <Route path="/:lang/blog/beginners-complete-guide" element={<React.Suspense fallback={null}><BeginnersCompleteGuide /></React.Suspense>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
