import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { parsePowerText } from '../utils/powerParser';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';

const API_CACHE_KEY = 'rollercoin_web_api_last_fetch';
const CACHE_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

interface DataInputFormProps {
    onDataParsed: (coins: CoinData[], userPower: HashPower) => void;
    currentCoins: CoinData[];
    currentUserPower: HashPower | null;
    currentLeague: LeagueInfo;
    isAutoLeague: boolean;
    onLeagueChange: (newLeagueId: string) => void;
    onToggleAutoLeague: () => void;
    onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
    onApiLeaguesLoaded?: (leagues: LeagueInfo[], rawData: ApiLeagueData[]) => void;
    apiLeagues?: LeagueInfo[] | null;
}

const DataInputForm: React.FC<DataInputFormProps> = ({
    onDataParsed,
    currentCoins,
    currentUserPower,
    currentLeague,
    isAutoLeague,
    onLeagueChange,
    onToggleAutoLeague,
    onShowNotification,
    onApiLeaguesLoaded,
    apiLeagues
}) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    // Data source mode: 'manual' or 'api'
    const [dataSource, setDataSource] = useState<'manual' | 'api'>('manual');
    const [isLoadingApi, setIsLoadingApi] = useState(false);

    // Manual power input state
    const [powerValue, setPowerValue] = useState<string>('');
    const [powerUnit, setPowerUnit] = useState<PowerUnit>('Eh');

    // Storage key for data source mode
    const DATA_SOURCE_KEY = 'rollercoin_web_data_source';

    // Load saved data source preference
    useEffect(() => {
        const saved = localStorage.getItem(DATA_SOURCE_KEY);
        if (saved === 'api' || saved === 'manual') {
            setDataSource(saved);
        }
    }, []);

    // Save data source preference
    useEffect(() => {
        localStorage.setItem(DATA_SOURCE_KEY, dataSource);
    }, [dataSource]);

    // Cache state
    const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
        const saved = localStorage.getItem(API_CACHE_KEY);
        return saved ? parseInt(saved, 10) : null;
    });
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    // Cooldown timer
    useEffect(() => {
        if (!lastFetchTime) return;

        const updateCooldown = () => {
            const elapsed = Date.now() - lastFetchTime;
            const remaining = Math.max(0, CACHE_COOLDOWN_MS - elapsed);
            setCooldownRemaining(remaining);
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, [lastFetchTime]);

    const canFetch = cooldownRemaining === 0;

    // Handle fetch from API
    const handleFetchFromApi = async () => {
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return;
        }

        setIsLoadingApi(true);
        try {
            // Fetch raw API data to get totalPower per currency
            const rawApiData = await fetchLeaguesFromApi();

            // Convert to internal league format for league selector
            const apiLeagues = rawApiData.map(l => ({
                id: l.id,
                name: l.title,
                minPower: l.minPower,
                currencies: l.currencies.map(c => ({
                    name: c.name,
                    payout: c.payoutAmount,
                })),
            }));

            // Pass both converted leagues AND raw data to parent
            if (onApiLeaguesLoaded) {
                onApiLeaguesLoaded(apiLeagues, rawApiData);
            }

            // Update cache timestamp
            const now = Date.now();
            setLastFetchTime(now);
            localStorage.setItem(API_CACHE_KEY, String(now));

            onShowNotification(t('input.apiSuccess'), 'success');
            setIsExpanded(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            onShowNotification(t('input.apiError', { error: errorMessage }), 'error');
            console.error('API fetch error:', error);
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleParse = () => {
        try {
            let coins = currentCoins;
            let userPower = currentUserPower;

            // Parse text if provided
            if (inputText.trim()) {
                const result = parsePowerText(inputText);
                if (result.coins.length > 0) {
                    coins = result.coins;
                }
                if (result.userPower) {
                    userPower = result.userPower;
                }
            }

            // Override user power if manually entered
            let finalPower = userPower;
            if (powerValue) {
                const value = parseFloat(powerValue);
                if (!isNaN(value) && value > 0) {
                    finalPower = {
                        value: value,
                        unit: powerUnit
                    };
                }
            }

            const hasCoins = coins.length > 0;
            const hasPower = !!finalPower;

            // Validation: Both or one missing
            if (!hasCoins && !hasPower) {
                onShowNotification(t('input.errors.missingBoth'), 'error');
                return;
            }
            if (!hasCoins) {
                onShowNotification(t('input.errors.missingLeagueData'), 'error');
                return;
            }
            if (!hasPower) {
                onShowNotification(t('input.errors.missingUserPower'), 'error');
                return;
            }

            // Success
            onDataParsed(coins, finalPower!);
            setIsExpanded(false);
            onShowNotification(t('input.loadedData', { count: coins.length }), 'success');

        } catch (error) {
            console.error('Parse error:', error);
            onShowNotification(t('input.errors.parseError'), 'error');
        }
    };

    // Pre-fill manual power inputs from currentUserPower
    useEffect(() => {
        if (currentUserPower) {
            setPowerValue(currentUserPower.value.toString());
            setPowerUnit(currentUserPower.unit);
        }
    }, [currentUserPower]);

    // Power units options
    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    // Auto-update user power when typing (debounced)
    useEffect(() => {
        if (!powerValue) return;

        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;

        const timeoutId = setTimeout(() => {
            // Update parent state with current coins (even if empty) and new power
            const newPower: HashPower = { value: val, unit: powerUnit };
            onDataParsed(currentCoins, newPower);
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit]);

    return (
        <div className="data-input-section">
            <div
                className="section-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="header-left">
                    <span className="section-icon">⚙️</span>
                    <h3 className="section-title">{t('input.title')}</h3>
                </div>
                <div className={`header-arrow ${isExpanded ? 'rotated' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div className="input-content">

                    {/* Data Source Toggle Cards */}
                    <div className="data-source-cards">
                        <button
                            className={`data-source-card ${dataSource === 'manual' ? 'active' : ''}`}
                            onClick={() => setDataSource('manual')}
                        >
                            <span className="data-source-icon">✏️</span>
                            <div className="data-source-info">
                                <span className="data-source-label">{t('input.manualLabel')}</span>
                                <span className="data-source-desc">{t('input.manualDesc')}</span>
                            </div>
                        </button>
                        <button
                            className={`data-source-card ${dataSource === 'api' ? 'active' : ''}`}
                            onClick={() => setDataSource('api')}
                        >
                            <span className="data-source-icon">☁️</span>
                            <div className="data-source-info">
                                <span className="data-source-label">{t('input.serverLabel')}</span>
                                <span className="data-source-desc">{t('input.serverDesc')}</span>
                            </div>
                            {lastFetchTime && dataSource === 'api' && (
                                <span className="data-source-badge">
                                    {t('input.lastFetched', { time: new Date(lastFetchTime).toLocaleTimeString() })}
                                </span>
                            )}
                        </button>
                    </div>

                    <div className="compact-row">
                        {/* User Power Input */}
                        <div className="input-group compact-group">
                            <label>{t('input.userPower')}</label>
                            <div className="power-input-container small-height">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={powerValue}
                                    onChange={(e) => setPowerValue(e.target.value)}
                                    className="power-value-input small-input"
                                />
                                <select
                                    value={powerUnit}
                                    onChange={(e) => setPowerUnit(e.target.value as PowerUnit)}
                                    className="power-unit-select small-select"
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* League Selection */}
                        <div className="input-group compact-group">
                            <label>{t('input.leagueSelect')}</label>

                            <div className="league-input-row small-height">
                                <select
                                    value={currentLeague ? currentLeague.id : ''}
                                    onChange={(e) => onLeagueChange(e.target.value)}
                                    disabled={isAutoLeague}
                                    className="league-select flex-grow-select"
                                >
                                    {(apiLeagues && apiLeagues.length > 0 ? apiLeagues : LEAGUES).map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>

                                <label className="auto-toggle-inline" title="Güce göre otomatik belirle">
                                    <input
                                        type="checkbox"
                                        checked={isAutoLeague}
                                        onChange={onToggleAutoLeague}
                                    />
                                    <span>{t('input.auto')}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* League Powers Input - Only in Manual Mode */}
                    {dataSource === 'manual' ? (
                        <div className="input-group full-width">
                            <label>{t('input.leaguePowers')}</label>
                            <textarea
                                className="data-textarea"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                placeholder={t('input.placeholder')}
                                rows={6}
                            />
                        </div>
                    ) : (
                        <div className="input-group full-width">
                            <button
                                className="primary-button wide-button fetch-button"
                                onClick={handleFetchFromApi}
                                disabled={isLoadingApi || !canFetch}
                            >
                                {isLoadingApi
                                    ? <><span className="spinner"></span> {t('input.fetching')}</>
                                    : !canFetch
                                        ? <><span className="cooldown-icon">⏳</span> {t('input.apiCooldownBtn', { seconds: Math.ceil(cooldownRemaining / 1000) })}</>
                                        : <><span className="fetch-icon">🔄</span> {t('input.fetchFromApi')}</>
                                }
                            </button>
                        </div>
                    )}

                    {/* Calculate Button - Only in Manual Mode */}
                    {dataSource === 'manual' && (
                        <div className="action-row-centered">
                            <button
                                className="primary-button wide-button"
                                onClick={handleParse}
                            >
                                {t('input.calculate')}
                            </button>

                            {currentCoins.length > 0 && (
                                <div className="status-overlay">
                                    <span className="status-text success">
                                        {t('input.loadedData', { count: currentCoins.length })}
                                    </span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DataInputForm;
