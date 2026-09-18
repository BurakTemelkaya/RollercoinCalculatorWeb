import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { LEAGUES, LeagueInfo, CURRENCY_MAP, LEAGUE_TIER_CONFIGS, getLeagueTierName } from '../data/leagues';
import { ApiLeagueData } from '../types/api';
import { PowerUnit, HashPower } from '../types';
import { COIN_ICONS } from '../utils/constants';
import { formatCryptoAmount, formatUSD, getBlocksPerPeriod, isWithdrawableCoin, isGameToken } from '../utils/calculator';
import { autoScalePower, formatHashPower, toBaseUnit } from '../utils/powerParser';
import { getBlockRewardsForLeague } from '../utils/leagueHelper';
import { getLeagueImage } from '../data/leagueImages';
import RadixSelect from './RadixSelect';
import './LeagueAnalysisModal.css';

interface LeagueAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
    apiLeagues: LeagueInfo[] | null;
    rawApiData: ApiLeagueData[] | null;
    prices: Record<string, number>;
    blockDurations: Record<string, number>;
    currentLeagueId?: string;
    onSelectLeague?: (league: LeagueInfo, maxPowerGh: number, customPower?: HashPower) => void;
}

interface LeagueEarningInfo {
    displayName: string;
    dailyAmount: number;
    dailyUsd: number;
    weeklyAmount: number;
    weeklyUsd: number;
    monthlyAmount: number;
    monthlyUsd: number;
    isGameToken: boolean;
}

type PeriodType = 'daily' | 'weekly' | 'monthly';

// Default block time in seconds
const DEFAULT_BLOCK_TIME_SECONDS = 596;

/**
 * Format power from Gh/s value (minPower is stored in Gh/s)
 */
function formatPowerGh(ghValue: number): string {
    if (ghValue <= 0) return '0 Gh';
    const power = autoScalePower(ghValue * 1e9);
    return formatHashPower(power);
}

const LeagueAnalysisModal: React.FC<LeagueAnalysisModalProps> = ({
    isOpen,
    onClose,
    apiLeagues,
    rawApiData,
    prices,
    blockDurations,
    currentLeagueId,
    onSelectLeague,
}) => {
    const { t } = useTranslation();
    const NONE_VALUE = '__none__';
    const [selectedCoin, setSelectedCoin] = useState<string>(NONE_VALUE);
    const [selectedTier, setSelectedTier] = useState<string>('all');
    const [activePeriod, setActivePeriod] = useState<PeriodType>('daily');

    // Custom Ceilings State (like WithdrawTimer's customMinWithdraws)
    const [customCeilings, setCustomCeilings] = useState<Record<string, { value: number; unit: PowerUnit }>>(() => {
        try {
            const saved = localStorage.getItem('rollercoin_web_league_custom_ceilings');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [editingLeagueId, setEditingLeagueId] = useState<string | null>(null);
    const [tempEditValue, setTempEditValue] = useState<string>('');
    const [tempEditUnit, setTempEditUnit] = useState<PowerUnit>('Eh');

    const handleStartEditCeiling = (e: React.MouseEvent, leagueId: string, val: number, unit: PowerUnit) => {
        e.stopPropagation();
        setEditingLeagueId(leagueId);
        const cleanVal = Math.round((val + Number.EPSILON) * 100) / 100;
        setTempEditValue(cleanVal > 0 ? cleanVal.toString() : '');
        setTempEditUnit(unit);
    };

    const handleSaveEditCeiling = (e?: React.MouseEvent | React.FormEvent | React.KeyboardEvent, leagueId?: string) => {
        if (e) e.stopPropagation();
        const id = leagueId || editingLeagueId;
        if (!id) return;
        const parsedVal = parseFloat(tempEditValue.replace(',', '.'));
        if (isNaN(parsedVal) || parsedVal <= 0) {
            setEditingLeagueId(null);
            return;
        }
        const cleanVal = Math.round((parsedVal + Number.EPSILON) * 100) / 100;
        setCustomCeilings(prev => {
            const next = { ...prev, [id]: { value: cleanVal, unit: tempEditUnit } };
            localStorage.setItem('rollercoin_web_league_custom_ceilings', JSON.stringify(next));
            return next;
        });
        setEditingLeagueId(null);
    };

    const handleCancelEditCeiling = (e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditingLeagueId(null);
    };

    const handleResetCeiling = (e: React.MouseEvent, leagueId: string) => {
        e.stopPropagation();
        setCustomCeilings(prev => {
            const next = { ...prev };
            delete next[leagueId];
            localStorage.setItem('rollercoin_web_league_custom_ceilings', JSON.stringify(next));
            return next;
        });
    };

    const modalBodyRef = React.useRef<HTMLDivElement>(null);
    const currentLeagueCardRef = React.useRef<HTMLDivElement>(null);

    // Prevent body background scroll when modal is open
    React.useEffect(() => {
        if (isOpen) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [isOpen]);

    // Automatically center the user's current league when modal opens
    React.useEffect(() => {
        if (isOpen && currentLeagueId) {
            const timer = setTimeout(() => {
                const body = modalBodyRef.current;
                const currentCard = currentLeagueCardRef.current || (body ? body.querySelector('.la-card--current') as HTMLElement : null);
                if (body && currentCard) {
                    const bodyRect = body.getBoundingClientRect();
                    const cardRect = currentCard.getBoundingClientRect();
                    const relativeTop = cardRect.top - bodyRect.top + body.scrollTop;
                    const targetScrollTop = relativeTop - (body.clientHeight / 2) + (cardRect.height / 2);
                    body.scrollTo({
                        top: Math.max(0, targetScrollTop),
                        behavior: 'smooth',
                    });
                }
            }, 80);
            return () => clearTimeout(timer);
        }
    }, [isOpen, currentLeagueId]);

    // Use API leagues if available, otherwise fallback
    const leagues = useMemo(() => apiLeagues || LEAGUES, [apiLeagues]);

    // Precompute power range and max power (ceiling) for each league accurately in ascending order
    const leaguePowerInfo = useMemo(() => {
        const asc = [...leagues].sort((a, b) => a.minPower - b.minPower);
        const infoMap: Record<string, {
            minPowerStr: string;
            maxPowerStr: string;
            maxPowerDisplay: string;
            maxPowerGh: number;
            powerVal: number;
            powerUnit: PowerUnit;
            isCustom: boolean;
        }> = {};

        for (let i = 0; i < asc.length; i++) {
            const league = asc[i];
            const nextLeague = i < asc.length - 1 ? asc[i + 1] : null;

            const minPowerStr = formatPowerGh(league.minPower);
            const maxPowerStr = nextLeague ? formatPowerGh(nextLeague.minPower - 1) : '∞';

            // Default ceiling power for calculations
            const defaultMaxGh = nextLeague ? (nextLeague.minPower - 1) : league.minPower;
            const defaultPower = autoScalePower(defaultMaxGh * 1e9);

            const custom = customCeilings[league.id];
            const isCustom = !!custom;
            const rawVal = custom ? custom.value : defaultPower.value;
            const powerUnit = custom ? custom.unit : defaultPower.unit;
            // Round to at most 2 decimal places to avoid e.g. 999.999999999991 or 69.999999999899
            const powerVal = Math.round((rawVal + Number.EPSILON) * 100) / 100;
            const maxPowerGh = custom ? (toBaseUnit(custom) / 1e9) : defaultMaxGh;
            const formattedValStr = powerVal.toLocaleString('en-US', { maximumFractionDigits: 2 });
            const maxPowerDisplay = `${formattedValStr} ${powerUnit}`;

            infoMap[league.id] = {
                minPowerStr,
                maxPowerStr,
                maxPowerDisplay,
                maxPowerGh,
                powerVal,
                powerUnit,
                isCustom,
            };
        }

        return infoMap;
    }, [leagues, customCeilings]);

    // Sort leagues descending by minPower: Highest league (Legend/Emerald/Titan/Diamond) first, lowest (Bronze) last
    const sortedLeagues = useMemo(() =>
        [...leagues].sort((a, b) => b.minPower - a.minPower),
        [leagues]
    );

    // Extract available tiers present in current leagues data, following centralized LEAGUE_TIER_CONFIGS order
    const availableTiers = useMemo(() => {
        const presentTierNames = new Set<string>();
        for (const l of leagues) {
            presentTierNames.add(getLeagueTierName(l.name).toLowerCase());
        }
        return LEAGUE_TIER_CONFIGS.filter(t => presentTierNames.has(t.name.toLowerCase()));
    }, [leagues]);

    // Filter leagues based on selected tier or current league
    const filteredLeagues = useMemo(() => {
        if (selectedTier === 'current') {
            if (currentLeagueId) {
                return sortedLeagues.filter(l => String(l.id) === String(currentLeagueId));
            }
            return sortedLeagues;
        }
        if (selectedTier !== 'all') {
            return sortedLeagues.filter(l => getLeagueTierName(l.name).toLowerCase() === selectedTier.toLowerCase());
        }
        return sortedLeagues;
    }, [sortedLeagues, selectedTier, currentLeagueId]);

    // Get all unique coins across all leagues
    const allCoins = useMemo(() => {
        const coinSet = new Set<string>();
        for (const league of sortedLeagues) {
            for (const currency of league.currencies) {
                const displayName = CURRENCY_MAP[currency.name] || currency.name;
                coinSet.add(displayName);
            }
        }
        return Array.from(coinSet).sort();
    }, [sortedLeagues]);

    // Coin select options: allow picking any coin across leagues (including USDT, ALGO, RLT, etc.)
    const coinOptions = useMemo(() => [
        { value: NONE_VALUE, label: t('leagueAnalysis.noCoinSelected', 'Coin seçilmedi'), icon: '' },
        ...allCoins.map(c => ({
            value: c,
            label: c,
            icon: COIN_ICONS[c] || COIN_ICONS['RLT']
        }))
    ], [allCoins, t]);

    // Resolved selected coin (empty if none selected)
    const activeCoin = selectedCoin === NONE_VALUE ? '' : selectedCoin;

    /**
     * Calculate daily, weekly, and monthly earnings for a coin in a specific league at a given power
     */
    const calculateLeagueEarning = (
        league: LeagueInfo,
        currencyName: string,
        maxPowerGh: number,
        apiLeagueData?: ApiLeagueData
    ): LeagueEarningInfo | null => {
        const displayName = CURRENCY_MAP[currencyName] || currencyName;
        const isGameTokenCoin = isGameToken(displayName);

        // Find the currency in league data
        const currencyData = league.currencies.find(c => c.name === currencyName);
        if (!currencyData) return null;

        // Get block reward
        const rewards = getBlockRewardsForLeague(league);
        const blockReward = rewards[displayName];
        if (!blockReward || blockReward <= 0) return null;

        // Get league total power for this coin from API data
        let leagueTotalPowerBase: number; // in H/s
        if (apiLeagueData) {
            const apiCurrency = apiLeagueData.currencies.find(c => c.name === currencyName);
            if (apiCurrency && apiCurrency.totalPower > 0) {
                leagueTotalPowerBase = apiCurrency.totalPower * 1e9; // API gives Gh/s
            } else {
                // Nobody currently in league (Legend), calculate based on baseline 1 Yh total power
                leagueTotalPowerBase = 1e24;
            }
        } else {
            // No API data - estimate based on power
            leagueTotalPowerBase = maxPowerGh >= 1e15 ? 1e24 : (maxPowerGh * 1e9 * 100);
        }

        // User power at max for this league
        const userPowerBase = maxPowerGh * 1e9; // Convert Gh to H

        // Power share
        const share = Math.min(1, userPowerBase / leagueTotalPowerBase);

        // Reward per block
        const rewardPerBlock = blockReward * share;

        // Get block duration
        const duration = blockDurations[displayName] || DEFAULT_BLOCK_TIME_SECONDS;

        // Blocks per period
        const dailyBlocks = getBlocksPerPeriod('daily', duration);
        const weeklyBlocks = getBlocksPerPeriod('weekly', duration);
        const monthlyBlocks = getBlocksPerPeriod('monthly', duration);

        const dailyAmount = rewardPerBlock * dailyBlocks;
        const weeklyAmount = rewardPerBlock * weeklyBlocks;
        const monthlyAmount = rewardPerBlock * monthlyBlocks;

        // USD values: USDT is $1. RLT is RollerCoin shop currency pegged to $1 USD.
        const price = prices[displayName] || (displayName === 'USDT' ? 1 : displayName === 'RLT' ? 1 : 0);
        const dailyUsd = dailyAmount * price;
        const weeklyUsd = weeklyAmount * price;
        const monthlyUsd = monthlyAmount * price;

        return {
            displayName,
            dailyAmount,
            dailyUsd,
            weeklyAmount,
            weeklyUsd,
            monthlyAmount,
            monthlyUsd,
            isGameToken: isGameTokenCoin,
        };
    };

    /**
     * Get the best earning for a league given filter mode
     * - 'withdrawable': Only coins that can actually be withdrawn (matches withdraw timer)
     * - 'nonWithdrawable': Non-withdrawable coins (USDT, ALGO, RLT, RST, HMT)
     */
    const getBestEarning = (
        league: LeagueInfo,
        maxPowerGh: number,
        apiLeagueData?: ApiLeagueData,
        filterMode?: 'withdrawable' | 'nonWithdrawable',
        excludeCoin?: string
    ): LeagueEarningInfo | null => {
        let best: LeagueEarningInfo | null = null;

        for (const currency of league.currencies) {
            const displayName = CURRENCY_MAP[currency.name] || currency.name;
            const isWithdrawable = isWithdrawableCoin(displayName);

            // Apply filter based on filterMode
            if (filterMode === 'withdrawable' && !isWithdrawable) continue;
            if (filterMode === 'nonWithdrawable' && isWithdrawable) continue;
            if (excludeCoin && displayName === excludeCoin) continue;

            const earning = calculateLeagueEarning(league, currency.name, maxPowerGh, apiLeagueData);
            if (!earning) continue;

            if (!best) {
                best = earning;
            } else {
                if (filterMode === 'nonWithdrawable') {
                    // Compare by USD value if either has USD value > 0; otherwise compare by token amount
                    if (earning.dailyUsd > 0 || best.dailyUsd > 0) {
                        if (earning.dailyUsd > best.dailyUsd) best = earning;
                    } else {
                        if (earning.dailyAmount > best.dailyAmount) best = earning;
                    }
                } else {
                    // For withdrawable crypto, compare by USD value
                    if (earning.dailyUsd > best.dailyUsd) best = earning;
                }
            }
        }

        return best;
    };

    /**
     * Get earning for a specific coin in a league
     */
    const getCoinEarning = (
        league: LeagueInfo,
        coinDisplayName: string,
        maxPowerGh: number,
        apiLeagueData?: ApiLeagueData
    ): LeagueEarningInfo | null => {
        const currencyEntry = league.currencies.find(c => {
            const dn = CURRENCY_MAP[c.name] || c.name;
            return dn === coinDisplayName;
        });

        if (!currencyEntry) return null;

        return calculateLeagueEarning(league, currencyEntry.name, maxPowerGh, apiLeagueData);
    };

    if (!isOpen) return null;

    /**
     * Render a single earning box with primary view + 3-period breakdown
     */
    const renderEarningItem = (
        label: string,
        icon: string,
        earning: LeagueEarningInfo | null,
        tooltip?: string,
        warningText?: string
    ) => {
        if (!earning) {
            return (
                <div className="la-earning-item">
                    <div className="la-earning-label" title={tooltip}>
                        <span className="la-earning-label-icon">{icon}</span>
                        <span>{label}</span>
                    </div>
                    <span className="la-earning-unavailable">
                        {t('leagueAnalysis.notAvailable', 'Bu ligde mevcut değil')}
                    </span>
                </div>
            );
        }

        // Primary display based on activePeriod
        let primaryCrypto = '';
        let primaryUsd = 0;
        let perUnitText = '';

        if (activePeriod === 'daily') {
            primaryCrypto = earning.displayName === 'BTC'
                ? `${(earning.dailyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                : `${formatCryptoAmount(earning.dailyAmount)} ${earning.displayName}`;
            primaryUsd = earning.dailyUsd;
            perUnitText = t('leagueAnalysis.perDay', '/ gün');
        } else if (activePeriod === 'weekly') {
            primaryCrypto = earning.displayName === 'BTC'
                ? `${(earning.weeklyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                : `${formatCryptoAmount(earning.weeklyAmount)} ${earning.displayName}`;
            primaryUsd = earning.weeklyUsd;
            perUnitText = t('leagueAnalysis.perWeek', '/ hf');
        } else {
            primaryCrypto = earning.displayName === 'BTC'
                ? `${(earning.monthlyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                : `${formatCryptoAmount(earning.monthlyAmount)} ${earning.displayName}`;
            primaryUsd = earning.monthlyUsd;
            perUnitText = t('leagueAnalysis.perMonth', '/ ay');
        }

        return (
            <div className="la-earning-item">
                <div className="la-earning-label" title={tooltip}>
                    <span className="la-earning-label-icon">{icon}</span>
                    <span>{label}</span>
                </div>

                <div className="la-earning-coin-info">
                    <img
                        src={COIN_ICONS[earning.displayName] || COIN_ICONS['RLT']}
                        alt={earning.displayName}
                        className="la-earning-coin-icon"
                    />
                    <span className="la-earning-coin-name">{earning.displayName}</span>
                </div>

                {/* Primary prominent value */}
                <div className="la-earning-values">
                    <span className="la-earning-crypto">{primaryCrypto}</span>
                    {primaryUsd > 0 && (
                        <span className="la-earning-usd">
                            {formatUSD(primaryUsd)} <span className="la-per-unit">{perUnitText}</span>
                        </span>
                    )}
                </div>

                {/* 3-period breakdown row: Daily, Weekly, Monthly */}
                <div className="la-period-breakdown">
                    <div className={`la-period-cell ${activePeriod === 'daily' ? 'is-active' : ''}`}>
                        <span className="la-period-cell-tag">{t('leagueAnalysis.shortDaily', 'Günlük')}</span>
                        <span className="la-period-cell-crypto">
                            {earning.displayName === 'BTC'
                                ? `${(earning.dailyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                                : formatCryptoAmount(earning.dailyAmount)}
                        </span>
                        {earning.dailyUsd > 0 && (
                            <span className="la-period-cell-usd">{formatUSD(earning.dailyUsd)}</span>
                        )}
                    </div>
                    <div className={`la-period-cell ${activePeriod === 'weekly' ? 'is-active' : ''}`}>
                        <span className="la-period-cell-tag">{t('leagueAnalysis.shortWeekly', 'Haftalık')}</span>
                        <span className="la-period-cell-crypto">
                            {earning.displayName === 'BTC'
                                ? `${(earning.weeklyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                                : formatCryptoAmount(earning.weeklyAmount)}
                        </span>
                        {earning.weeklyUsd > 0 && (
                            <span className="la-period-cell-usd">{formatUSD(earning.weeklyUsd)}</span>
                        )}
                    </div>
                    <div className={`la-period-cell ${activePeriod === 'monthly' ? 'is-active' : ''}`}>
                        <span className="la-period-cell-tag">{t('leagueAnalysis.shortMonthly', 'Aylık')}</span>
                        <span className="la-period-cell-crypto">
                            {earning.displayName === 'BTC'
                                ? `${(earning.monthlyAmount * 1e8).toLocaleString('en-US', { maximumFractionDigits: 0 })} SAT`
                                : formatCryptoAmount(earning.monthlyAmount)}
                        </span>
                        {earning.monthlyUsd > 0 && (
                            <span className="la-period-cell-usd">{formatUSD(earning.monthlyUsd)}</span>
                        )}
                    </div>
                </div>

                {warningText && (
                    <div className="la-earning-warning">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                            <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                        </svg>
                        <span>{warningText}</span>
                    </div>
                )}
            </div>
        );
    };

    const modalContent = (
        <div className="league-analysis-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="league-analysis-modal">
                {/* Modal Header */}
                <div className="league-analysis-header">
                    <div className="league-analysis-header-left">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
                            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
                        </svg>
                        <div>
                            <h2>{t('leagueAnalysis.title', 'Lig Bazlı Kazanç Analizi')}</h2>
                            <p className="la-header-sub">{t('leagueAnalysis.subtitle', 'Her ligin tavan gücünde en karlı coinlerin kazanç potansiyeli')}</p>
                        </div>
                    </div>
                    <div className="league-analysis-header-right">
                        <div className="league-analysis-coin-select">
                            <RadixSelect
                                value={selectedCoin}
                                onValueChange={setSelectedCoin}
                                options={coinOptions}
                                placeholder={t('leagueAnalysis.selectCoin', 'Coin seç...')}
                                triggerClassName="sim-select"
                                className="sim-select-wrapper"
                                showSelectedIcon={true}
                            />
                        </div>
                        <button className="league-analysis-close-btn" onClick={onClose} aria-label="Close">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                                <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="league-analysis-body" ref={modalBodyRef}>
                    {/* Information Banner */}
                    <div className="la-info-banner">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" className="la-info-icon">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                        </svg>
                        <span>{t('leagueAnalysis.infoBanner', 'Tüm kazançlar, her ligin tavan (maksimum) gücüne ulaşıldığı varsayılarak hesaplanmıştır.')}</span>
                    </div>

                    {/* Toolbar: Tier Filter Pills + Period Switcher */}
                    <div className="la-toolbar">
                        <div className="la-filter-pills">
                            <button
                                className={`la-filter-pill ${selectedTier === 'all' ? 'active' : ''}`}
                                onClick={() => setSelectedTier('all')}
                            >
                                {t('leagueAnalysis.allTiers', 'Tümü')}
                            </button>
                            {currentLeagueId && (
                                <button
                                    className={`la-filter-pill la-filter-pill--current ${selectedTier === 'current' ? 'active' : ''}`}
                                    onClick={() => setSelectedTier(selectedTier === 'current' ? 'all' : 'current')}
                                >
                                    🎯 {t('leagueAnalysis.onlyCurrentLeague', 'Mevcut Ligim')}
                                </button>
                            )}
                            {availableTiers.map(tier => (
                                <button
                                    key={tier.id}
                                    className={`la-filter-pill ${selectedTier.toLowerCase() === tier.name.toLowerCase() ? 'active' : ''}`}
                                    onClick={() => setSelectedTier(selectedTier.toLowerCase() === tier.name.toLowerCase() ? 'all' : tier.name)}
                                >
                                    {tier.name}
                                </button>
                            ))}
                        </div>

                        <div className="la-period-toggle">
                            <button
                                className={`la-period-btn ${activePeriod === 'daily' ? 'active' : ''}`}
                                onClick={() => setActivePeriod('daily')}
                            >
                                {t('leagueAnalysis.periodDaily', 'Günlük')}
                            </button>
                            <button
                                className={`la-period-btn ${activePeriod === 'weekly' ? 'active' : ''}`}
                                onClick={() => setActivePeriod('weekly')}
                            >
                                {t('leagueAnalysis.periodWeekly', 'Haftalık')}
                            </button>
                            <button
                                className={`la-period-btn ${activePeriod === 'monthly' ? 'active' : ''}`}
                                onClick={() => setActivePeriod('monthly')}
                            >
                                {t('leagueAnalysis.periodMonthly', 'Aylık')}
                            </button>
                        </div>
                    </div>

                    {filteredLeagues.length === 0 ? (
                        <div className="la-no-data">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p>{t('leagueAnalysis.noFilteredResults', 'Seçilen filtreye uygun lig bulunamadı.')}</p>
                            <button className="la-clear-filter-btn" onClick={() => setSelectedTier('all')}>
                                {t('leagueAnalysis.allTiers', 'Tümü')}
                            </button>
                        </div>
                    ) : (
                        <div className="league-analysis-grid">
                            {filteredLeagues.map((league) => {
                                const powerInfo = leaguePowerInfo[league.id] || {
                                    minPowerStr: formatPowerGh(league.minPower),
                                    maxPowerStr: '∞',
                                    maxPowerDisplay: formatPowerGh(league.minPower),
                                    maxPowerGh: league.minPower,
                                };

                                const isCurrentLeague = currentLeagueId === league.id;

                                // Find matching API data for this league
                                const apiLeagueData = rawApiData?.find(l => String(l.id) === String(league.id));

                                // Best withdrawable crypto (only coins that can actually be withdrawn)
                                const bestWithdrawable = getBestEarning(league, powerInfo.maxPowerGh, apiLeagueData, 'withdrawable');

                                // Best non-withdrawable coin (USDT, ALGO, RLT, RST, HMT)
                                const bestNonWithdrawable = getBestEarning(league, powerInfo.maxPowerGh, apiLeagueData, 'nonWithdrawable');

                                // Slot 3: If coin selected -> show that coin (or fallback if absent).
                                // If NO coin selected -> show 2nd best withdrawable coin!
                                let thirdSlotLabel: string;
                                let thirdSlotIcon: string;
                                let thirdSlotEarning: LeagueEarningInfo | null = null;
                                let thirdSlotTooltip: string | undefined;
                                let thirdSlotWarning: string | undefined;

                                if (activeCoin) {
                                    thirdSlotLabel = activeCoin;
                                    thirdSlotIcon = '📌';
                                    thirdSlotEarning = getCoinEarning(league, activeCoin, powerInfo.maxPowerGh, apiLeagueData);

                                    if (!thirdSlotEarning) {
                                        // Coin not in this league - show 2nd best instead with warning
                                        const isSelectedWithdrawable = isWithdrawableCoin(activeCoin);
                                        const secondBest = isSelectedWithdrawable
                                            ? getBestEarning(league, powerInfo.maxPowerGh, apiLeagueData, 'withdrawable', bestWithdrawable?.displayName)
                                            : getBestEarning(league, powerInfo.maxPowerGh, apiLeagueData, 'nonWithdrawable', bestNonWithdrawable?.displayName);

                                        if (secondBest) {
                                            thirdSlotEarning = secondBest;
                                            thirdSlotWarning = t(
                                                'leagueAnalysis.coinNotInLeague',
                                                '{{coin}} bu ligde yok, 2. en karlı coin gösteriliyor',
                                                { coin: activeCoin }
                                            );
                                        }
                                    }
                                } else {
                                    thirdSlotLabel = t('leagueAnalysis.secondBestWithdrawable', 'En Karlı 2. Çekilebilir');
                                    thirdSlotIcon = '🥈';
                                    thirdSlotTooltip = t('leagueAnalysis.secondBestWithdrawableTooltip', 'Cüzdana çekilebilir coinler arasında en yüksek 2. kazanç sağlayan');
                                    thirdSlotEarning = getBestEarning(league, powerInfo.maxPowerGh, apiLeagueData, 'withdrawable', bestWithdrawable?.displayName);
                                }

                                return (
                                    <div
                                        key={league.id}
                                        ref={isCurrentLeague ? currentLeagueCardRef : undefined}
                                        className={`la-card${isCurrentLeague ? ' la-card--current' : ''}${onSelectLeague ? ' la-card--selectable' : ''}`}
                                    >
                                        <div
                                            className="la-card-header"
                                            onClick={() => {
                                                if (onSelectLeague) {
                                                    onSelectLeague(league, powerInfo.maxPowerGh, { value: powerInfo.powerVal, unit: powerInfo.powerUnit });
                                                    onClose();
                                                }
                                            }}
                                            style={{ cursor: onSelectLeague ? 'pointer' : 'default' }}
                                            title={onSelectLeague ? t('leagueAnalysis.applyToMainTooltip', 'Bu ligin tavan gücünü ana sayfadaki hesaplayıcıya uygula ve tüm coinleri incele') : undefined}
                                        >
                                            <img
                                                src={getLeagueImage(league.id)}
                                                alt={league.name}
                                                className="la-card-badge"
                                            />
                                            <div className="la-card-title-group">
                                                <div className="la-card-title-row">
                                                    <h3 className="la-card-name">{league.name}</h3>
                                                    {isCurrentLeague && (
                                                        <span className="la-card-current-badge">
                                                            {t('leagueAnalysis.currentLeague', 'Mevcut Lig')}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="la-card-power-range">
                                                    <span className="la-power-label">{t('leagueAnalysis.leagueRange', 'Lig Aralığı')}:</span>{' '}
                                                    {powerInfo.minPowerStr} — {powerInfo.maxPowerStr}
                                                </p>
                                            </div>

                                            <div className="la-card-header-actions">
                                                {/* Clearly labeled calculated power */}
                                                <div
                                                    className={`la-card-calc-power${powerInfo.isCustom ? ' is-custom' : ''}`}
                                                    title={t('leagueAnalysis.infoBanner', 'Tüm kazançlar, her ligin tavan (maksimum) gücüne ulaşıldığı varsayılarak hesaplanmıştır.')}
                                                >
                                                    <div className="la-calc-power-label">
                                                        <span className="la-calc-icon">⚡</span>
                                                        <span>
                                                            {powerInfo.isCustom
                                                                ? t('leagueAnalysis.customCalculatedPower', 'Hesaplanan Güç (Özel)')
                                                                : t('leagueAnalysis.calculatedPower', 'Hesaplanan Güç (Lig Tavanı)')}
                                                        </span>
                                                    </div>
                                                    {editingLeagueId === league.id ? (
                                                        <div className="la-calc-power-edit-box" onClick={(e) => e.stopPropagation()}>
                                                            <div className="la-calc-power-edit-inputs">
                                                                <input
                                                                    type="text"
                                                                    inputMode="decimal"
                                                                    className="la-calc-power-input"
                                                                    value={tempEditValue}
                                                                    onChange={(e) => setTempEditValue(e.target.value)}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') handleSaveEditCeiling(e, league.id);
                                                                        else if (e.key === 'Escape') handleCancelEditCeiling(e as any);
                                                                    }}
                                                                    autoFocus
                                                                    placeholder="0"
                                                                />
                                                                <select
                                                                    className="la-calc-power-select"
                                                                    value={tempEditUnit}
                                                                    onChange={(e) => setTempEditUnit(e.target.value as PowerUnit)}
                                                                >
                                                                    {(['Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh'] as PowerUnit[]).map(u => (
                                                                        <option key={u} value={u}>{u}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                            <div className="la-calc-power-edit-btns">
                                                                <button
                                                                    type="button"
                                                                    className="la-calc-power-save-btn"
                                                                    onClick={(e) => handleSaveEditCeiling(e, league.id)}
                                                                    title={t('leagueAnalysis.saveCeiling', 'Kaydet')}
                                                                >
                                                                    ✓
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="la-calc-power-cancel-btn"
                                                                    onClick={handleCancelEditCeiling}
                                                                    title={t('leagueAnalysis.cancelCeiling', 'İptal')}
                                                                >
                                                                    ✕
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="la-calc-power-val-row">
                                                            <span
                                                                className={`la-calc-power-val${powerInfo.isCustom ? ' is-custom' : ''}`}
                                                                onClick={(e) => handleStartEditCeiling(e, league.id, powerInfo.powerVal, powerInfo.powerUnit)}
                                                                title={t('leagueAnalysis.editCeiling', 'Tavan gücü düzenle')}
                                                            >
                                                                {powerInfo.maxPowerDisplay}
                                                                <span className="la-calc-edit-hint">✏️</span>
                                                            </span>
                                                            {powerInfo.isCustom && (
                                                                <button
                                                                    type="button"
                                                                    className="la-reset-ceiling-btn"
                                                                    onClick={(e) => handleResetCeiling(e, league.id)}
                                                                    title={t('leagueAnalysis.resetCeiling', 'Varsayılana sıfırla')}
                                                                >
                                                                    ↺
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                {onSelectLeague && (
                                                    <button
                                                        type="button"
                                                        className="la-card-apply-btn"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onSelectLeague(league, powerInfo.maxPowerGh, { value: powerInfo.powerVal, unit: powerInfo.powerUnit });
                                                            onClose();
                                                        }}
                                                        title={t('leagueAnalysis.applyToMainTooltip', 'Bu ligin tavan gücünü ana sayfadaki hesaplayıcıya uygula ve tüm coinleri incele')}
                                                    >
                                                        <span>{t('leagueAnalysis.applyToMain', 'Tüm Coinleri Göster')}</span>
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
                                                            <path d="M5 12h14M12 5l7 7-7 7" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="la-card-earnings">
                                            {renderEarningItem(
                                                t('leagueAnalysis.bestWithdrawable', 'En Karlı Çekilebilir'),
                                                '🏆',
                                                bestWithdrawable,
                                                t('leagueAnalysis.bestWithdrawableTooltip', 'Cüzdana çekilebilir coinler arasında en yüksek kazanç sağlayan')
                                            )}
                                            {renderEarningItem(
                                                t('leagueAnalysis.bestNonWithdrawable', 'En Karlı Çekilemez'),
                                                '🔒',
                                                bestNonWithdrawable,
                                                t('leagueAnalysis.bestNonWithdrawableTooltip', 'Çekilemez coinler arasında en yüksek kazanç sağlayan (USDT, ALGO, RLT, RST vb.)')
                                            )}
                                            {renderEarningItem(
                                                thirdSlotLabel,
                                                thirdSlotIcon,
                                                thirdSlotEarning,
                                                thirdSlotTooltip,
                                                thirdSlotWarning
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default LeagueAnalysisModal;
