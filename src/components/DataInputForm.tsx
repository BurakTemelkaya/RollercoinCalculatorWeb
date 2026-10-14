import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';
import { getLeagueImage } from '../data/leagueImages';
import findUsernameImage from '../assets/find_username.png';
import leagueIconSvg from '../assets/leagues/league.svg';
import './DataInputForm.css';
import classNames from 'classnames';
import { useApiCooldown } from '../hooks/useApiCooldown';
import { ApiError } from '../services/apiClient';
import RadixSelect from './RadixSelect';
import { parseUsernameInput } from '../utils/usernameParser';



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
    usernameError?: string | null;
    onClearUsernameError?: () => void;
    hasRewardChangeData?: boolean;
    onShowRewardChange?: () => void;
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
    usernameError,
    onClearUsernameError,
    hasRewardChangeData = false,
    onShowRewardChange,
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const helpPanelRef = React.useRef<HTMLDivElement>(null);
    const tooltipHoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profileLinkInput, setProfileLinkInput] = useState('');

    const [isLoadingApi, setIsLoadingApi] = useState(false);

    const [isFetchingUserLocal, setIsFetchingUserLocal] = useState(false);

    const closeUsernameHelp = () => {
        setIsTooltipOpen(false);
        onClearUsernameError?.();
        tooltipRef.current?.querySelector<HTMLButtonElement>('.username-help-btn')?.focus();
    };

    useEffect(() => {
        if (!usernameError) return;
        setIsExpanded(true);
        setIsTooltipOpen(true);
    }, [usernameError]);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (!tooltipRef.current?.contains(event.target as Node)
                && !helpPanelRef.current?.contains(event.target as Node)) {
                setIsTooltipOpen(false);
                onClearUsernameError?.();
            }
        };
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            setIsTooltipOpen(false);
            onClearUsernameError?.();
            tooltipRef.current?.querySelector<HTMLButtonElement>('.username-help-btn')?.focus();
        };

        if (isTooltipOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEscape);
            helpPanelRef.current?.focus();
            return () => {
                document.removeEventListener('mousedown', handleClickOutside);
                document.removeEventListener('keydown', handleEscape);
            };
        }
    }, [isTooltipOpen, onClearUsernameError]);

    useEffect(() => {
        return () => {
            if (tooltipHoverTimerRef.current) {
                clearTimeout(tooltipHoverTimerRef.current);
            }
        };
    }, []);

    // Use an uncontrolled local state for input to prevent whole-app rerenders on every keystroke
    const [localUserName, setLocalUserName] = useState(globalUserName);
    useEffect(() => {
        setLocalUserName(globalUserName);
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
            if (error instanceof ApiError && error.isRateLimit) {
                onShowNotification(t('input.errors.tooManyRequests'), 'error');
            } else if (error instanceof ApiError && error.isForbidden) {
                onShowNotification(t('input.errors.turnstileFailed'), 'error');
            } else {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                onShowNotification(t('input.apiError', { error: errorMessage }), 'error');
            }
            return false;
        } finally {
            setIsLoadingApi(false);
        }
    };

    useEffect(() => {
        const target = currentUserPower || displayPower;
        if (target) {
            setPowerValue(target.value.toString());
            setPowerUnit(target.unit);
        }
    }, [currentUserPower?.value, currentUserPower?.unit, displayPower?.value, displayPower?.unit]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh'];

    // Handle profile link paste
    const handleProfileLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
        const link = e.target.value;
        setProfileLinkInput(link);

        if (link.trim()) {
            const parsed = parseUsernameInput(link);
            if (parsed?.isProfileLink) {
                setLocalUserName(parsed.username);
                setGlobalUserName(parsed.username);
                onClearUsernameError?.();
                onShowNotification(t('input.usernameExtracted', { name: parsed.username }), 'success');
            }
        }
    };

    useEffect(() => {
        // In username mode, power comes from API, so don't trigger on manual change
        if (fetchMode === 'username') {
            return;
        }

        if (!powerValue) return;
        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;

        // If parent already has this exact value and unit, avoid re-triggering
        if (currentUserPower && currentUserPower.value === val && currentUserPower.unit === powerUnit) {
            return;
        }

        const timeoutId = setTimeout(() => {
            onDataParsed(currentCoins, { value: val, unit: powerUnit }, true);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit, fetchMode, currentCoins, onDataParsed, currentUserPower]);

    const handleFetchUserLocal = async (showSuccessNotif: boolean = true) => {
        const parsed = parseUsernameInput(localUserName);
        const username = parsed?.username ?? localUserName.trim();
        setLocalUserName(username);
        if (parsed) setGlobalUserName(username);
        if (!localUserName.trim() || !onFetchUser) return false;
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return false;
        }
        setIsFetchingUserLocal(true);
        try {
            await onFetchUser(username, showSuccessNotif);
            return true;
        } catch (error) {
            // Error is handled upstream
            return false;
        } finally {
            setIsFetchingUserLocal(false);
            if (parsed) setFetchStarted();
        }
    };

    const handleFetchAction = async () => {
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return;
        }

        const isUsernameMode = fetchMode === 'username' && localUserName.trim();
        if (isUsernameMode && !parseUsernameInput(localUserName)) {
            await handleFetchUserLocal(false);
            return;
        }
        const apiPromise = handleFetchFromApi(!isUsernameMode);

        if (isUsernameMode) {
            const userPromise = handleFetchUserLocal(!isUsernameMode);
            const [userSuccess, apiSuccess] = await Promise.all([userPromise, apiPromise]);

            if (userSuccess && apiSuccess) {
                onShowNotification(t('input.allDataFetched'), 'success');
            }

            if (onForceFetchPrices && (userSuccess || apiSuccess)) {
                onForceFetchPrices();
            }

            if (userSuccess) {
                setIsExpanded(false);
            }
            return;
        }

        const apiSuccess = await apiPromise;
        if (onForceFetchPrices && apiSuccess) {
            onForceFetchPrices();
        }
    };

    const leaguesList = apiLeagues && apiLeagues.length > 0 ? apiLeagues : LEAGUES;

    return (
        <>
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

                    <div className="header-right-actions" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`header-arrow ${isExpanded ? 'rotated' : ''}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>
                </div>

                <div className={`accordion-wrapper ${isExpanded ? 'open' : 'collapsed'}`}>
                    <div className="accordion-inner">
                        <div className="input-content-padding" style={{ position: 'relative' }}>
                            {hasRewardChangeData && onShowRewardChange && (
                                <button
                                    className="show-reward-change-btn desktop-only"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onShowRewardChange();
                                    }}
                                    style={{
                                        position: 'absolute',
                                        top: '24px',
                                        right: '24px',
                                        height: '36px',
                                        padding: '0 16px',
                                        fontSize: '13px',
                                        fontWeight: 'bold',
                                        zIndex: 10
                                    }}
                                    title={t('input.showRewardChangeTooltip', 'Son blok ödülü değişimini göster')}
                                >
                                    <img src={leagueIconSvg} alt="icon" style={{ width: 18, height: 18, marginRight: '6px' }} />
                                    {t('input.showRewardChange', 'Son Blok Ödülü Değişimi')}
                                </button>
                            )}
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
                                            <div className="username-input-with-help flex-grow-input" ref={tooltipRef}>
                                                <input
                                                    type="text"
                                                    placeholder={t('input.usernamePlaceholder')}
                                                    value={localUserName}
                                                    onChange={(e) => {
                                                        setLocalUserName(e.target.value);
                                                        if (usernameError) onClearUsernameError?.();
                                                    }}
                                                    onPaste={(e) => {
                                                        const parsed = parseUsernameInput(e.clipboardData.getData('text'));
                                                        if (!parsed?.isProfileLink) return;
                                                        e.preventDefault();
                                                        setLocalUserName(parsed.username);
                                                        setGlobalUserName(parsed.username);
                                                        onClearUsernameError?.();
                                                    }}
                                                    onBlur={() => {
                                                        const parsed = parseUsernameInput(localUserName);
                                                        if (parsed) {
                                                            setLocalUserName(parsed.username);
                                                            setGlobalUserName(parsed.username);
                                                        }
                                                    }}
                                                    className="power-value-input"
                                                    onKeyDown={async (e) => {
                                                        if (e.key === 'Enter') {
                                                            e.preventDefault();
                                                            await handleFetchAction();
                                                        }
                                                    }}
                                                />
                                                <button
                                                    type="button"
                                                    className="username-help-btn"
                                                    aria-label={t('input.usernameHelpAria')}
                                                    aria-expanded={isTooltipOpen}
                                                    aria-controls="username-help-dialog"
                                                    onMouseEnter={() => {
                                                        if (tooltipHoverTimerRef.current) {
                                                            clearTimeout(tooltipHoverTimerRef.current);
                                                        }
                                                        tooltipHoverTimerRef.current = setTimeout(() => {
                                                            setIsTooltipOpen(true);
                                                        }, 2000);
                                                    }}
                                                    onMouseLeave={() => {
                                                        if (tooltipHoverTimerRef.current) {
                                                            clearTimeout(tooltipHoverTimerRef.current);
                                                        }
                                                    }}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        if (tooltipHoverTimerRef.current) {
                                                            clearTimeout(tooltipHoverTimerRef.current);
                                                        }
                                                        if (isTooltipOpen) closeUsernameHelp();
                                                        else setIsTooltipOpen(true);
                                                    }}
                                                >
                                                    ?
                                                </button>
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
                                            onClick={handleFetchAction}
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
                                    <RadixSelect
                                        value={currentLeague.id}
                                        onValueChange={onLeagueChange}
                                        disabled={isAutoLeague}
                                        options={leaguesList.map(l => ({
                                            value: l.id,
                                            label: l.name,
                                            icon: getLeagueImage(l.id),
                                            iconAlt: `${l.name} League`
                                        }))}
                                        ariaLabel={t('input.leagueSelect')}
                                        triggerClassName={classNames("custom-dropdown-trigger", { disabled: isAutoLeague })}
                                        showSelectedIcon={false}
                                        fullWidth={true}
                                    />
                                </div>

                                <div className="input-group">
                                    <label className="auto-toggle-inline" title="Güce göre otomatik belirle">
                                        <input type="checkbox" checked={isAutoLeague} onChange={onToggleAutoLeague} />
                                        <span>{t('input.auto')}</span>
                                    </label>
                                    {hasRewardChangeData && onShowRewardChange && (
                                        <button
                                            className="show-reward-change-btn mobile-only"
                                            onClick={onShowRewardChange}
                                            title={t('input.showRewardChangeTooltip', 'Son blok ödülü değişimini göster')}
                                        >
                                            <img src={leagueIconSvg} alt="icon" style={{ width: 16, height: 16, marginRight: '6px' }} />
                                            {t('input.showRewardChange', 'Son Blok Ödülü Değişimi')}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section >

            {isTooltipOpen && createPortal(
                <div className="username-help-tooltip open" id="username-help-dialog"
                    role="dialog" aria-labelledby="username-help-title" ref={helpPanelRef} tabIndex={-1}>
                    <div className="username-help-header">
                        <h3 className="help-title" id="username-help-title">{t('input.usernameHelpTitle')}</h3>
                        <button type="button" className="username-help-close" onClick={closeUsernameHelp}
                            aria-label={t('input.closeUsernameHelp')}>×</button>
                    </div>
                    {usernameError && <p className="username-help-error" role="alert">{usernameError}</p>}
                    <a href="https://rollercoin.com/profile/personal-profile" target="_blank"
                        rel="noreferrer" className="help-link username-profile-open">
                        {t('input.usernameHelpLink')} <span aria-hidden="true">↗</span>
                    </a>
                    <p className="help-text">{t('input.usernameHelpText')}</p>
                    <p className="username-power-alternative">{t('input.usernamePowerAlternative')}</p>
                    <img src={findUsernameImage} alt={t('input.usernameHelpPreviewTitle')}
                        className="username-help-preview-image" />
                    <div className="username-help-link-field">
                        <label htmlFor="username-profile-link">{t('input.orPasteProfileLink')}</label>
                        <input id="username-profile-link" type="text" className="username-link-input"
                            placeholder="https://rollercoin.com/p/YOUR_USERNAME" value={profileLinkInput}
                            onChange={handleProfileLinkPaste} />
                    </div>
                </div>, document.body
            )}
        </>
    );
};

export default DataInputForm;
