import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { LEAGUES, LeagueInfo } from '../data/leagues';
import { fetchLeaguesFromApi } from '../services/leagueApi';
import { ApiLeagueData } from '../types/api';
import { getLeagueImage } from '../data/leagueImages';
import findUsernameImage from '../assets/find_username.png';
import './DataInputForm.css';
import classNames from 'classnames';
import { useApiCooldown } from '../hooks/useApiCooldown';
import { ApiError } from '../services/apiClient';
import RadixSelect from './RadixSelect';

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
    userNotFoundError?: boolean;
    setUserNotFoundError?: (val: boolean) => void;
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
    userNotFoundError = false,
    setUserNotFoundError = () => { },
}) => {
    const { t } = useTranslation();
    const [isExpanded, setIsExpanded] = useState(true);
    const [isTooltipOpen, setIsTooltipOpen] = useState(false);
    const [isImageViewerOpen, setIsImageViewerOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const tooltipRef = React.useRef<HTMLDivElement>(null);
    const tooltipHoverTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const [profileLinkInput, setProfileLinkInput] = useState('');

    const [isLoadingApi, setIsLoadingApi] = useState(false);

    const [isFetchingUserLocal, setIsFetchingUserLocal] = useState(false);

    // Close tooltip when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
                setIsTooltipOpen(false);
            }
        };

        if (isTooltipOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isTooltipOpen]);

    useEffect(() => {
        return () => {
            if (tooltipHoverTimerRef.current) {
                clearTimeout(tooltipHoverTimerRef.current);
            }
        };
    }, []);

    // Show tooltip with error message when user not found
    useEffect(() => {
        if (userNotFoundError) {
            setErrorMessage(t('input.errors.userNotFound'));
            setIsTooltipOpen(true);
            setUserNotFoundError(false); // Reset error flag after displaying
        }
    }, [userNotFoundError, t, setUserNotFoundError]);

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
            if (error instanceof ApiError && error.isRateLimit) {
                onShowNotification(t('input.errors.tooManyRequests'), 'error');
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
        if (currentUserPower) {
            setPowerValue(currentUserPower.value.toString());
            setPowerUnit(currentUserPower.unit);
        }
    }, [currentUserPower]);

    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    // Extract username from rollercoin profile URL
    const extractUsernameFromProfileLink = (link: string): string | null => {
        try {
            // Match: https://rollercoin.com/p/USERNAME or /p/USERNAME/games etc
            const match = link.match(/\/p\/([^\/\s]+)/);
            if (match && match[1]) {
                return match[1].toUpperCase();
            }
            return null;
        } catch {
            return null;
        }
    };

    // Handle profile link paste
    const handleProfileLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
        const link = e.target.value;
        setProfileLinkInput(link);

        if (link.trim()) {
            const username = extractUsernameFromProfileLink(link);
            if (username) {
                setLocalUserName(username);
                onShowNotification(t('input.usernameExtracted', { name: username }), 'success');
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

    const handleFetchAction = async () => {
        if (!canFetch) {
            const remainSec = Math.ceil(cooldownRemaining / 1000);
            onShowNotification(t('input.apiCooldown', { seconds: remainSec }), 'info');
            return;
        }

        const isUsernameMode = fetchMode === 'username' && localUserName.trim();
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

                <div className={`header-arrow ${isExpanded ? 'rotated' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            <div className={`accordion-wrapper ${isExpanded ? 'open' : ''}`}>
                <div className="accordion-inner">
                    <div className="input-content-padding">
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
                                                onChange={(e) => setLocalUserName(e.target.value)}
                                                onBlur={() => setGlobalUserName(localUserName)}
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
                                                    setIsTooltipOpen(!isTooltipOpen);
                                                }}
                                            >
                                                ?
                                            </button>
                                            <div className={`username-help-tooltip ${isTooltipOpen ? 'open' : ''}`} role="tooltip">
                                                {errorMessage && (
                                                    <div style={{ 
                                                        color: '#ef4444', 
                                                        fontSize: '13px', 
                                                        fontWeight: '600',
                                                        marginBottom: '10px',
                                                        padding: '8px 10px',
                                                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                                        borderRadius: '4px'
                                                    }}>
                                                        ⚠️ {errorMessage}
                                                    </div>
                                                )}
                                                <div className="help-title">{t('input.usernameHelpTitle')}</div>
                                                <div className="help-text">{t('input.usernameHelpText')}</div>
                                                <div 
                                                    className="image-viewer-container"
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setIsImageViewerOpen(true);
                                                    }}
                                                    style={{ cursor: 'pointer', position: 'relative', display: 'inline-block', width: '100%' }}
                                                >
                                                    <img
                                                        src={findUsernameImage}
                                                        alt={t('input.usernameHelpPreviewTitle')}
                                                        className="username-help-preview-image"
                                                    />
                                                    <div className="zoom-icon" style={{
                                                        position: 'absolute',
                                                        top: '50%',
                                                        left: '50%',
                                                        transform: 'translate(-50%, -50%)',
                                                        fontSize: '36px',
                                                        opacity: '0.5',
                                                        transition: 'opacity 0.2s ease',
                                                        pointerEvents: 'none',
                                                        textShadow: '0 0 8px rgba(0,0,0,0.7)'
                                                    }}>
                                                        🔍
                                                    </div>
                                                </div>
                                                
                                                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                    <label style={{ fontSize: '12px', fontWeight: '600', color: 'var(--text-primary)' }}>
                                                        {t('input.orPasteProfileLink')}
                                                    </label>
                                                    <input
                                                        type="text"
                                                        placeholder="https://rollercoin.com/p/YOUR_USERNAME"
                                                        value={profileLinkInput}
                                                        onChange={handleProfileLinkPaste}
                                                        style={{
                                                            padding: '8px 10px',
                                                            background: 'var(--bg-primary)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: 'var(--radius-sm)',
                                                            color: 'var(--text-primary)',
                                                            fontSize: '12px',
                                                        }}
                                                        className="username-link-input"
                                                    />
                                                </div>

                                                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                                                    <a
                                                        href="https://rollercoin.com/profile/personal-profile"
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="help-link"
                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                                    >
                                                        📂 {t('input.usernameHelpLink')}
                                                    </a>
                                                </div>
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

        {/* Image Viewer Modal */}
        {isImageViewerOpen && (
            <div 
                className="image-viewer-modal"
                onClick={() => setIsImageViewerOpen(false)}
                style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(2px)',
                }}
            >
                <div
                    onClick={(e) => e.stopPropagation()}
                    style={{
                        position: 'relative',
                        maxWidth: '90vw',
                        maxHeight: '85vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <img
                        src={findUsernameImage}
                        alt={t('input.usernameHelpPreviewTitle')}
                        style={{
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            borderRadius: 'var(--radius-md)',
                            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
                        }}
                    />
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsImageViewerOpen(false);
                        }}
                        style={{
                            position: 'absolute',
                            top: '-40px',
                            right: '0',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: '#fff',
                            border: 'none',
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            fontSize: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                        }}
                    >
                        ✕
                    </button>
                </div>
            </div>
        )}
        </>
    );
};

export default DataInputForm;
