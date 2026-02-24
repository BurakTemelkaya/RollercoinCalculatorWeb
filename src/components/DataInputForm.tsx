import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { parsePowerText } from '../utils/powerParser';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';
import { getLeagueImage } from '../data/leagueImages';
import './DataInputForm.css';
import * as Select from '@radix-ui/react-select';
import classNames from 'classnames';
import { useApiCooldown } from '../hooks/useApiCooldown';

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
    onFetchUser?: (username: string, showNotif?: boolean) => Promise<void>;
    isFetchingUser?: boolean;
    globalUserName?: string;
    setGlobalUserName?: (val: string) => void;
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
    isFetchingUser,
    globalUserName = '',
    setGlobalUserName = () => { },
}) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);
    const prevCoinsLengthRef = useRef(currentCoins.length);

    // Auto-collapse when coins are populated
    useEffect(() => {
        if (currentCoins.length > 0 && prevCoinsLengthRef.current === 0) {
            setIsExpanded(false);
        }
        prevCoinsLengthRef.current = currentCoins.length;
    }, [currentCoins.length]);

    const [dataSource, setDataSource] = useState<'manual' | 'api'>('api');
    const [isLoadingApi, setIsLoadingApi] = useState(false);

    const [isFetchingUserLocal, setIsFetchingUserLocal] = useState(false);
    const [fetchMode, setFetchMode] = useState<'username' | 'power'>('username');

    // Use an uncontrolled local state for input to prevent whole-app rerenders on every keystroke
    const [localUserName, setLocalUserName] = useState(globalUserName);
    useEffect(() => {
        setLocalUserName(globalUserName);
    }, [globalUserName]);

    const [powerValue, setPowerValue] = useState<string>('');
    const [powerUnit, setPowerUnit] = useState<PowerUnit>('Eh');

    const DATA_SOURCE_KEY = 'rollercoin_web_data_source';

    useEffect(() => {
        const saved = localStorage.getItem(DATA_SOURCE_KEY);
        if (saved === 'api' || saved === 'manual') setDataSource(saved);
    }, []);

    useEffect(() => {
        localStorage.setItem(DATA_SOURCE_KEY, dataSource);
    }, [dataSource]);

    const { cooldownRemaining, canFetch, setFetchStarted } = useApiCooldown();

    const handleFetchFromApi = async (showSuccessNotif: boolean = true) => {
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

            setFetchStarted();
            if (showSuccessNotif) {
                onShowNotification(t('input.apiSuccess'), 'success');
            }
            return true;
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            if (errorMessage === 'RATE_LIMIT') {
                onShowNotification(t('input.errors.tooManyRequests'), 'error');
            } else {
                onShowNotification(t('input.apiError', { error: errorMessage }), 'error');
            }
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
        // If we are in API mode, power updates come from the API/User fetch,
        // but we still need to update when user manually changes power
        if (dataSource === 'api' && fetchMode === 'username') {
            // In username mode, power comes from API, so don't trigger on manual change
            // But if user switches to power mode and changes manually, we should update
            return;
        }

        if (!powerValue) return;
        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;

        const timeoutId = setTimeout(() => {
            onDataParsed(currentCoins, { value: val, unit: powerUnit });
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit, dataSource, fetchMode, currentCoins, onDataParsed]);

    const handleFetchUserLocal = async (showSuccessNotif: boolean = true) => {
        setGlobalUserName(localUserName.trim());
        if (!localUserName.trim() || !onFetchUser) return false;
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return false;
        }
        setIsFetchingUserLocal(true);
        try {
            await onFetchUser(localUserName.trim(), showSuccessNotif);
            setFetchStarted();
            return true;
        } catch (error) {
            // Error is handled upstream
            return false;
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
                    <h2 className="section-title">{t('input.title')}</h2>
                </div>

                {!isExpanded && currentCoins.length > 0 && (
                    <div className="collapsed-summary">
                        {currentUserPower && (
                            <div className="summary-chip power">
                                <span className="chip-icon">⚡</span>
                                <span className="chip-value">
                                    {currentUserPower.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} {currentUserPower.unit}/s
                                </span>
                            </div>
                        )}
                        <div className="summary-chip league">
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
                            <div
                                className="data-source-bg"
                                style={{ transform: dataSource === 'manual' ? 'translateX(0)' : 'translateX(100%)' }}
                            />
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

                            </button>
                        </div>

                        <div className="desktop-3-up">
                            <div className="input-group">
                                {dataSource === 'api' ? (
                                    <div className="fetch-mode-selector">
                                        <div
                                            className="mode-tab-bg"
                                            style={{ transform: fetchMode === 'username' ? 'translateX(0)' : 'translateX(100%)' }}
                                        />
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
                                            placeholder={t('input.usernamePlaceholder')}
                                            value={localUserName}
                                            onChange={(e) => setLocalUserName(e.target.value)}
                                            onBlur={() => setGlobalUserName(localUserName)}
                                            className="power-value-input flex-grow-input"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleFetchUserLocal();
                                            }}
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
                                                if (!canFetch) {
                                                    const remainSec = Math.ceil(cooldownRemaining / 1000);
                                                    onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
                                                    return;
                                                }
                                                const both = fetchMode === 'username' && localUserName.trim();
                                                const aP = handleFetchFromApi(!both);
                                                if (both) {
                                                    const uP = handleFetchUserLocal(!both);
                                                    const [userSuccess, apiSuccess] = await Promise.all([uP, aP]);
                                                    if (userSuccess && apiSuccess) {
                                                        onShowNotification(t('input.allDataFetched'), 'success');
                                                    }
                                                } else {
                                                    await aP;
                                                }
                                                // setIsExpanded(false); // Moved to useEffect to wait for data
                                            }}
                                            disabled={isFetchingUserLocal || isFetchingUser || isLoadingApi || (fetchMode === 'username' && (!localUserName.trim() || !canFetch)) || (fetchMode === 'power' && !canFetch)}
                                            title={t('input.fetchFromApi')}
                                        >
                                            {isFetchingUserLocal || isFetchingUser || isLoadingApi ? (
                                                <span className="spinner small"></span>
                                            ) : !canFetch && dataSource === 'api' ? (
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
                                <Select.Root
                                    value={currentLeague.id}
                                    onValueChange={onLeagueChange}
                                    disabled={isAutoLeague}
                                >
                                    <Select.Trigger className={classNames("custom-dropdown-trigger", { disabled: isAutoLeague })} aria-label={t('input.leagueSelect')}>
                                        <Select.Value>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <img src={getLeagueImage(currentLeague.id)} alt="" className="league-icon-dropdown" />
                                                <span>{currentLeague.name}</span>
                                            </div>
                                        </Select.Value>
                                        <Select.Icon className="dropdown-arrow">
                                            ▼
                                        </Select.Icon>
                                    </Select.Trigger>

                                    <Select.Portal>
                                        <Select.Content className="custom-dropdown-list-radix" position="popper" sideOffset={5}>
                                            <Select.Viewport>
                                                {leaguesList.map(l => (
                                                    <Select.Item key={l.id} value={l.id} className={classNames("custom-dropdown-item", { active: l.id === currentLeague.id })}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <img src={getLeagueImage(l.id)} alt="" style={{ width: 20, height: 20 }} />
                                                            <Select.ItemText>{l.name}</Select.ItemText>
                                                        </div>
                                                    </Select.Item>
                                                ))}
                                            </Select.Viewport>
                                        </Select.Content>
                                    </Select.Portal>
                                </Select.Root>
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
        </div >
    );
};

export default DataInputForm;
