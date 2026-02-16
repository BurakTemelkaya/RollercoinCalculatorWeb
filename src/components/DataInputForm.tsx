import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { parsePowerText } from '../utils/powerParser';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';
import { getLeagueImage } from '../data/leagueImages';
import './DataInputForm.css';

const API_CACHE_KEY = 'rollercoin_web_api_last_fetch';
const CACHE_COOLDOWN_MS = 30 * 1000; // 30 seconds

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
    onFetchUser?: (username: string) => Promise<void>;
    isFetchingUser?: boolean;
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
    apiLeagues,
    onFetchUser,
}) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    const [dataSource, setDataSource] = useState<'manual' | 'api'>('manual');
    const [isLoadingApi, setIsLoadingApi] = useState(false);

    const [userName, setUserName] = useState('');
    const [isFetchingUserLocal, setIsFetchingUserLocal] = useState(false);
    const [fetchMode, setFetchMode] = useState<'username' | 'power'>('username');

    const [powerValue, setPowerValue] = useState<string>('');
    const [powerUnit, setPowerUnit] = useState<PowerUnit>('Eh');

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const DATA_SOURCE_KEY = 'rollercoin_web_data_source';

    useEffect(() => {
        const saved = localStorage.getItem(DATA_SOURCE_KEY);
        if (saved === 'api' || saved === 'manual') setDataSource(saved);

        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        localStorage.setItem(DATA_SOURCE_KEY, dataSource);
    }, [dataSource]);

    const [lastFetchTime, setLastFetchTime] = useState<number | null>(() => {
        const saved = localStorage.getItem(API_CACHE_KEY);
        return saved ? parseInt(saved, 10) : null;
    });
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    useEffect(() => {
        if (!lastFetchTime) return;
        const updateCooldown = () => {
            const elapsed = Date.now() - lastFetchTime;
            setCooldownRemaining(Math.max(0, CACHE_COOLDOWN_MS - elapsed));
        };
        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, [lastFetchTime]);

    const canFetch = cooldownRemaining === 0;

    const handleFetchFromApi = async () => {
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return;
        }

        setIsLoadingApi(true);
        try {
            const rawApiData = await fetchLeaguesFromApi();
            const apiLeaguesResolved = rawApiData.map(l => ({
                id: l.id,
                name: l.title,
                minPower: l.minPower,
                currencies: l.currencies.map(c => ({
                    name: c.name,
                    payout: c.payoutAmount,
                })),
            }));

            if (onApiLeaguesLoaded) onApiLeaguesLoaded(apiLeaguesResolved, rawApiData);

            const now = Date.now();
            setLastFetchTime(now);
            localStorage.setItem(API_CACHE_KEY, String(now));
            onShowNotification(t('input.apiSuccess'), 'success');
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            onShowNotification(t('input.apiError', { error: errorMessage }), 'error');
            return false;
        } finally {
            setIsLoadingApi(false);
        }
    };

    const handleParse = () => {
        try {
            let coins = currentCoins;
            let userPower = currentUserPower;

            if (inputText.trim()) {
                const result = parsePowerText(inputText);
                if (result.coins.length > 0) coins = result.coins;
                if (result.userPower) userPower = result.userPower;
            }

            let finalPower = userPower;
            if (powerValue) {
                const value = parseFloat(powerValue);
                if (!isNaN(value) && value > 0) finalPower = { value, unit: powerUnit };
            }

            if (!coins.length && !finalPower) {
                onShowNotification(t('input.errors.missingBoth'), 'error');
                return;
            }
            if (!coins.length) {
                onShowNotification(t('input.errors.missingLeagueData'), 'error');
                return;
            }
            if (!finalPower) {
                onShowNotification(t('input.errors.missingUserPower'), 'error');
                return;
            }

            onDataParsed(coins, finalPower);
            setIsExpanded(false);
            onShowNotification(t('input.loadedData', { count: coins.length }), 'success');
        } catch (error) {
            onShowNotification(t('input.errors.parseError'), 'error');
        }
    };

    useEffect(() => {
        if (currentUserPower) {
            setPowerValue(currentUserPower.value.toString());
            setPowerUnit(currentUserPower.unit);
        }
    }, [currentUserPower]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    useEffect(() => {
        if (!powerValue) return;
        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;
        const timeoutId = setTimeout(() => {
            onDataParsed(currentCoins, { value: val, unit: powerUnit });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit]);

    const handleFetchUser = async () => {
        if (!userName.trim() || !onFetchUser) return;
        setIsFetchingUserLocal(true);
        try {
            await onFetchUser(userName.trim());
        } catch (error) {
            onShowNotification(t('input.errors.parseError'), 'error');
        } finally {
            setIsFetchingUserLocal(false);
        }
    };

    const leaguesList = apiLeagues && apiLeagues.length > 0 ? apiLeagues : LEAGUES;

    return (
        <div className={`data-input-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="header-left">
                    <span className="section-icon">⚙️</span>
                    <h3 className="section-title">{t('input.title')}</h3>
                </div>

                {!isExpanded && currentCoins.length > 0 && (
                    <div className="collapsed-summary">
                        {currentUserPower && (
                            <div className="summary-chip">
                                <span className="chip-icon">⚡</span>
                                <span className="chip-value">
                                    {currentUserPower.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currentUserPower.unit}/s
                                </span>
                            </div>
                        )}
                        <div className="summary-chip">
                            <span className="chip-value">
                                <img src={getLeagueImage(currentLeague.id)} className="league-icon-summary" alt="" />
                                {currentLeague.name}
                            </span>
                        </div>
                        <div className="summary-chip success">
                            <span className="chip-icon">📊</span>
                            <span className="chip-value">{currentCoins.length} coins</span>
                        </div>
                    </div>
                )}

                <div className={`header-arrow ${isExpanded ? 'rotated' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <div className={`accordion-wrapper ${isExpanded ? 'open' : ''}`}>
                <div className="accordion-inner">
                    <div className="input-content-padding">
                        <div className="data-source-cards">
                            <button className={`data-source-card ${dataSource === 'manual' ? 'active' : ''}`} onClick={() => setDataSource('manual')}>
                                <span className="data-source-icon">✏️</span>
                                <div className="data-source-info">
                                    <span className="data-source-label">{t('input.manualLabel')}</span>
                                    <span className="data-source-desc">{t('input.manualDesc')}</span>
                                </div>
                            </button>
                            <button className={`data-source-card ${dataSource === 'api' ? 'active' : ''}`} onClick={() => setDataSource('api')}>
                                <span className="data-source-icon">☁️</span>
                                <div className="data-source-info">
                                    <span className="data-source-label">{t('input.serverLabel')}</span>
                                    <span className="data-source-desc">{t('input.serverDesc')}</span>
                                </div>
                                {lastFetchTime && dataSource === 'api' && (
                                    <span className="data-source-badge">{t('input.lastFetched', { time: new Date(lastFetchTime).toLocaleTimeString() })}</span>
                                )}
                            </button>
                        </div>

                        <div className="desktop-3-up">
                            <div className="input-group">
                                {dataSource === 'api' ? (
                                    <div className="fetch-mode-selector">
                                        <button
                                            className={`mode-tab ${fetchMode === 'username' ? 'active' : ''}`}
                                            onClick={() => setFetchMode('username')}
                                        >
                                            {t('input.byUsername')}
                                        </button>
                                        <button
                                            className={`mode-tab ${fetchMode === 'power' ? 'active' : ''}`}
                                            onClick={() => setFetchMode('power')}
                                        >
                                            {t('input.byPower')}
                                        </button>
                                    </div>
                                ) : (
                                    <label>{t('input.userPower')}</label>
                                )}

                                <div className="api-fetch-row">
                                    {dataSource === 'api' && fetchMode === 'username' ? (
                                        <input
                                            type="text"
                                            value={userName}
                                            onChange={(e) => setUserName(e.target.value)}
                                            placeholder={t('input.usernamePlaceholder')}
                                            className="power-value-input flex-grow-input"
                                        />
                                    ) : (
                                        <div className="power-input-container flex-grow-input">
                                            <input
                                                type="number"
                                                placeholder="0"
                                                value={powerValue}
                                                onChange={(e) => setPowerValue(e.target.value)}
                                                className="power-value-input"
                                            />
                                            <select
                                                value={powerUnit}
                                                onChange={(e) => setPowerUnit(e.target.value as PowerUnit)}
                                                className="power-unit-select"
                                            >
                                                {units.map(u => <option key={u} value={u}>{u}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    {dataSource === 'api' && (
                                        <button
                                            className="fetch-btn"
                                            onClick={async () => {
                                                const aP = handleFetchFromApi();
                                                if (fetchMode === 'username' && userName.trim()) {
                                                    const uP = handleFetchUser();
                                                    await Promise.all([uP, aP]);
                                                } else {
                                                    await aP;
                                                }
                                                // Optional: setIsExpanded(false); 
                                                // Removed setIsExpanded(false) to keep it minimal and let user see results
                                            }}
                                            disabled={isFetchingUserLocal || isLoadingApi || (fetchMode === 'username' && !userName.trim()) || (fetchMode === 'power' && !canFetch)}
                                            title={t('input.fetchFromApi')}
                                        >
                                            {isFetchingUserLocal || isLoadingApi ? (
                                                <span className="spinner small"></span>
                                            ) : !canFetch && dataSource === 'api' && lastFetchTime ? (
                                                <span className="cooldown-text">{Math.ceil(cooldownRemaining / 1000)}s</span>
                                            ) : (
                                                <span className="fetch-icon">{currentCoins.length > 0 ? '🔄' : '🚀'}</span>
                                            )}
                                            <span className="btn-text">
                                                {currentCoins.length > 0 && canFetch ? t('input.fetchButton') : t('input.fetchAction')}
                                            </span>
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>{t('input.leagueSelect')}</label>
                                <div className="custom-dropdown-container" ref={dropdownRef}>
                                    <div className={`custom-dropdown-trigger ${isAutoLeague ? 'disabled' : ''}`} onClick={() => !isAutoLeague && setIsDropdownOpen(!isDropdownOpen)}>
                                        <img src={getLeagueImage(currentLeague.id)} alt="" className="league-icon-dropdown" />
                                        <span>{currentLeague.name}</span>
                                        <span className="dropdown-arrow">▼</span>
                                    </div>
                                    {isDropdownOpen && (
                                        <div className="custom-dropdown-list">
                                            {leaguesList.map(l => (
                                                <div key={l.id} className={`custom-dropdown-item ${l.id === currentLeague.id ? 'active' : ''}`} onClick={() => { onLeagueChange(l.id); setIsDropdownOpen(false); }}>
                                                    <img src={getLeagueImage(l.id)} alt="" />
                                                    <span>{l.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="input-group">
                                <label>&nbsp;</label>
                                <label className="auto-toggle-inline" title="Güce göre otomatik belirle">
                                    <input type="checkbox" checked={isAutoLeague} onChange={onToggleAutoLeague} />
                                    <span>{t('input.auto')}</span>
                                </label>
                            </div>
                        </div>

                        {dataSource === 'manual' && (
                            <div className="input-group full-width">
                                <label>{t('input.leaguePowers')}</label>
                                <textarea className="data-textarea" value={inputText} onChange={(e) => setInputText(e.target.value)} placeholder={t('input.placeholder')} rows={8} />
                                <div className="action-row-centered">
                                    <button className="primary-button wide-button" onClick={handleParse}>{t('input.calculate')}</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DataInputForm;
