import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';
import { getLeagueImage } from '../data/leagueImages';
import profileLinkImage from '../assets/profile_link.png';
import './DataInputForm.css';
import * as Select from '@radix-ui/react-select';
import classNames from 'classnames';
import { useApiCooldown } from '../hooks/useApiCooldown';

interface DataInputFormProps {
    onDataParsed: (coins: CoinData[], userPower: HashPower, isManual?: boolean) => void;
    currentCoins: CoinData[];
    currentUserPower: HashPower | null;
    displayPower?: HashPower | null;
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
    onForceFetchPrices?: () => void;
    fetchMode: 'username' | 'power';
    setFetchMode: (mode: 'username' | 'power') => void;
}

const DataInputForm: React.FC<DataInputFormProps> = ({
    onDataParsed,
    currentCoins,
    currentUserPower,
    displayPower,
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
    onForceFetchPrices,
    fetchMode,
    setFetchMode,
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);

    const [isLoadingApi, setIsLoadingApi] = useState(false);

    const [isFetchingUserLocal, setIsFetchingUserLocal] = useState(false);

    // Use an uncontrolled local state for input to prevent whole-app rerenders on every keystroke
    const [localUserName, setLocalUserName] = useState(globalUserName);
    useEffect(() => {
        if (globalUserName && !localUserName) {
            setLocalUserName(globalUserName);
        }
    }, [globalUserName]);

    const [powerValue, setPowerValue] = useState<string>('');
    const [powerUnit, setPowerUnit] = useState<PowerUnit>('Eh');

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
                    duration: c.duration,
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

    useEffect(() => {
        if (currentUserPower) {
            setPowerValue(currentUserPower.value.toString());
            setPowerUnit(currentUserPower.unit);
        }
    }, [currentUserPower]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    useEffect(() => {
        // In username mode, power comes from API, so don't trigger on manual change
        if (fetchMode === 'username') {
            return;
        }

        if (!powerValue) return;
        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;

        const timeoutId = setTimeout(() => {
            onDataParsed(currentCoins, { value: val, unit: powerUnit }, true);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit, fetchMode, currentCoins, onDataParsed]);

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
        <section className={`data-input-section ${isExpanded ? 'expanded' : 'collapsed'}`}>
            <div className="section-header" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="header-left">
                    <span className="section-icon">⚙️</span>
                    <h2 className="section-title">{t('input.title')}</h2>
                </div>

                {!isExpanded && currentCoins.length > 0 && (
                    <div className="collapsed-summary">
                        {(displayPower || currentUserPower) && (
                            <div className="summary-chip power">
                                <span className="chip-icon">⚡</span>
                                <span className="chip-value">
                                    {(displayPower || currentUserPower)!.value.toLocaleString(undefined, { maximumFractionDigits: 4 })} {(displayPower || currentUserPower)!.unit}/s
                                </span>
                            </div>
                        )}
                        <div className="summary-chip league">
                            <span className="chip-value">
                                <img
                                    src={getLeagueImage(currentLeague.id)}
                                    className="league-icon-summary"
                                    alt={`${currentLeague.name} League`}
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                        target.style.display = 'none';
                                    }}
                                />
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
                        <div className="alternative-site-hint">
                            <a href="https://rchesapla.github.io" target="_blank" rel="noreferrer">
                                {t('input.alternativeSite')} ↗
                            </a>
                        </div>
                        <div className="desktop-3-up">
                            <div className="input-group">
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

                                <div className="api-fetch-row">
                                    {fetchMode === 'username' ? (
                                        <div className="username-input-with-help flex-grow-input">
                                            <input
                                                type="text"
                                                placeholder={t('input.usernamePlaceholder')}
                                                value={localUserName}
                                                onChange={(e) => setLocalUserName(e.target.value)}
                                                onBlur={() => setGlobalUserName(localUserName)}
                                                className="power-value-input"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleFetchUserLocal();
                                                }}
                                            />
                                            <button
                                                type="button"
                                                className="username-help-btn"
                                                aria-label={t('input.usernameHelpAria')}
                                            >
                                                ?
                                            </button>
                                            <div className="username-help-tooltip" role="tooltip">
                                                <div className="help-title">{t('input.usernameHelpTitle')}</div>
                                                <div className="help-text">{t('input.usernameHelpText')}</div>
                                                <img
                                                    src={profileLinkImage}
                                                    alt={t('input.usernameHelpPreviewTitle')}
                                                    className="username-help-preview-image"
                                                />
                                                <a
                                                    href="https://rollercoin.com/profile/personal-profile"
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="help-link"
                                                >
                                                    {t('input.usernameHelpLink')}
                                                </a>
                                            </div>
                                        </div>
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

                                    <button
                                        className="fetch-btn"
                                        onClick={async () => {
                                            if (!canFetch) {
                                                const remainSec = Math.ceil(cooldownRemaining / 1000);
                                                onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
                                                return;
                                            }
                                            const isUsernameMode = fetchMode === 'username' && localUserName.trim();
                                            const aP = handleFetchFromApi(!isUsernameMode);

                                            if (isUsernameMode) {
                                                const uP = handleFetchUserLocal(!isUsernameMode);
                                                const [userSuccess, apiSuccess] = await Promise.all([uP, aP]);
                                                if (userSuccess && apiSuccess) {
                                                    onShowNotification(t('input.allDataFetched'), 'success');
                                                }
                                                if (onForceFetchPrices && (userSuccess || apiSuccess)) {
                                                    onForceFetchPrices();
                                                }
                                                if (userSuccess) {
                                                    setIsExpanded(false);
                                                }
                                            } else {
                                                const apiSuccess = await aP;
                                                if (onForceFetchPrices && apiSuccess) {
                                                    onForceFetchPrices();
                                                }
                                            }
                                        }}
                                        disabled={isFetchingUserLocal || isFetchingUser || isLoadingApi || (fetchMode === 'username' && !localUserName.trim()) || !canFetch}
                                        title={t('input.fetchFromApi')}
                                    >
                                        {isFetchingUserLocal || isFetchingUser || isLoadingApi ? (
                                            <span className="spinner small"></span>
                                        ) : !canFetch ? (
                                            <span className="cooldown-text">{Math.ceil(cooldownRemaining / 1000)}s</span>
                                        ) : (
                                            <span className="fetch-icon">{currentCoins.length > 0 ? '🔄' : '🚀'}</span>
                                        )}
                                        <span className="btn-text">
                                            {currentCoins.length > 0 && canFetch ? t('input.fetchButton') : t('input.fetchAction')}
                                        </span>
                                    </button>
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
                                                <img
                                                    src={getLeagueImage(currentLeague.id)}
                                                    alt={`${currentLeague.name} League`}
                                                    className="league-icon-dropdown"
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                    }}
                                                />
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
                                                            <img
                                                                src={getLeagueImage(l.id)}
                                                                alt={`${l.name} League`}
                                                                style={{ width: 20, height: 20 }}
                                                                onError={(e) => {
                                                                    const target = e.target as HTMLImageElement;
                                                                    target.onerror = null;
                                                                    target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                                }}
                                                            />
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
                    </div>
                </div>
            </div>
        </section >
    );
};

export default DataInputForm;
