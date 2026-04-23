import React, { useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { EarningsResult } from '../types';
import { formatCryptoAmount, formatUSD } from '../utils/calculator';
import { getBlocksPerPeriod } from '../utils/calculator';
import { COIN_ICONS, GAME_TOKEN_COLORS } from '../utils/constants';
import { HashPower } from '../types';
import { toBaseUnit } from '../utils/powerParser';
import RadixSelect from './RadixSelect';

type TableColumnType = 'blockReward' | 'blockDuration' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface EarningsTableProps {
    effectiveUserPower: HashPower | null;
    earnings: EarningsResult[];
    prices: Record<string, number>;
    onOpenSettings: () => void;
    onOpenColumnSettings: () => void;
    onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
    visibleColumns: Set<TableColumnType>;
    blockDurations?: Record<string, number>;
    customPeriodDays: number;
    customPeriodHours: number;
}

const EarningsTable: React.FC<EarningsTableProps> = ({
    effectiveUserPower,
    earnings,
    prices,
    onOpenSettings,
    onOpenColumnSettings,
    onShowNotification,
    visibleColumns,
    blockDurations = {},
    customPeriodDays,
    customPeriodHours,
}) => {
    const { t } = useTranslation();
    const tablesRef = useRef<HTMLDivElement>(null);
    const [isCapturing, setIsCapturing] = useState(false);
    
    // Simulator states V3
    const [sourceAllocations, setSourceAllocations] = useState<Record<string, number>>({});
    const [targetAllocations, setTargetAllocations] = useState<Record<string, number>>({});
    
    // UI states for the panel
    const [selectedSourceAdd, setSelectedSourceAdd] = useState<string>('BTC');
    const [selectedTargetAdd, setSelectedTargetAdd] = useState<string>('BTC');
    const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

    // Sticky header state
    const theadRef = useRef<HTMLTableSectionElement>(null);
    const tableSectionRef = useRef<HTMLDivElement>(null);
    const [showFixedHeader, setShowFixedHeader] = useState(false);
    const [headerWidths, setHeaderWidths] = useState<number[]>([]);
    const [tableLeft, setTableLeft] = useState(0);
    const [tableWidth, setTableWidth] = useState(0);

    // Separate game tokens and crypto
    const gameTokens = earnings.filter(e => e.isGameToken);
    const cryptoCoins = earnings.filter(e => !e.isGameToken);

    // Measure header cells and update fixed header
    const measureHeader = useCallback(() => {
        if (!theadRef.current || !tableSectionRef.current) return;
        const ths = theadRef.current.querySelectorAll('th');
        const widths = Array.from(ths).map(th => th.getBoundingClientRect().width);
        setHeaderWidths(widths);
        const tableRect = tableSectionRef.current.querySelector('.table-container')?.getBoundingClientRect();
        if (tableRect) {
            setTableLeft(tableRect.left);
            setTableWidth(tableRect.width);
        }
    }, []);

    // Scroll-based sticky header (works despite overflow:hidden ancestors)
    useEffect(() => {
        let rafId: number;
        let lastShow = false;

        const handleScroll = () => {
            cancelAnimationFrame(rafId);
            rafId = requestAnimationFrame(() => {
                const thead = theadRef.current;
                const section = tableSectionRef.current;
                if (!thead || !section) {
                    if (lastShow) {
                        lastShow = false;
                        setShowFixedHeader(false);
                    }
                    return;
                }
                const theadRect = thead.getBoundingClientRect();
                const sectionRect = section.getBoundingClientRect();
                
                // If the parent tab is collapsed, the table is invisible, so hide the sticky header
                const isCollapsed = section.closest('.collapsed') !== null;
                const isVisibleHorizontally = sectionRect.right > 0 && sectionRect.left < window.innerWidth;
                
                const shouldShow = !isCollapsed && isVisibleHorizontally && theadRect.bottom < 0 && sectionRect.bottom > 60;
                
                if (shouldShow !== lastShow) {
                    lastShow = shouldShow;
                    setShowFixedHeader(shouldShow);
                }
                if (shouldShow) measureHeader();
            });
        };

        // Listen on multiple targets to catch scroll regardless of which element scrolls
        window.addEventListener('scroll', handleScroll, { passive: true });
        document.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleScroll, { passive: true });

        // Initial check (delayed to ensure refs are populated after render)
        const timer = setTimeout(handleScroll, 200);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
            clearTimeout(timer);
        };
    }, [earnings, measureHeader]);

    // Sort crypto by daily earnings (descending)
    const sortedCrypto = [...cryptoCoins].sort((a, b) => {
        const priceA = prices[a.displayName] || 0;
        const priceB = prices[b.displayName] || 0;
        return (b.earnings.daily * priceB) - (a.earnings.daily * priceA);
    });
    const bestCrypto = sortedCrypto[0];

    const getPrice = (currency: string): number => {
        return prices[currency] || prices[currency.toUpperCase()] || 0;
    };

    // Convert custom period to hours
    const getCustomPeriodInHours = (): number => {
        const totalHours = (customPeriodDays * 24) + customPeriodHours;
        return totalHours <= 0 ? 0 : totalHours;
    };

    // Get custom period abbreviation
    const getCustomPeriodAbbr = (): string => {
        const daysAbbr = t('table.daysAbbr') || 'd';
        const hoursAbbr = t('table.hoursAbbr') || 'h';
        const parts = [];
        if (customPeriodDays > 0) parts.push(`${customPeriodDays} ${daysAbbr}`);
        if (customPeriodHours > 0) parts.push(`${customPeriodHours} ${hoursAbbr}`);
        return parts.join(' ') || '';
    };

    // Get column header translation
    const getColumnHeader = (column: TableColumnType): string => {
        const periodInHours = getCustomPeriodInHours();
        switch (column) {
            case 'blockReward': return t('table.headers.blockReward');
            case 'blockDuration': return t('table.headers.blockDuration');
            case 'hourly': return t('table.headers.hourly');
            case 'daily': return t('table.headers.daily');
            case 'weekly': return t('table.headers.weekly');
            case 'monthly': return t('table.headers.monthly');
            case 'custom': return periodInHours > 0 ? getCustomPeriodAbbr() : t('table.headers.custom');
            default: return '';
        }
    };

    // Format block duration as "Xm Ys" (localized)
    const formatBlockDuration = (seconds: number): string => {
        const mAbbr = t('table.minuteAbbr') || 'm';
        const sAbbr = t('table.secondAbbr') || 's';
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return s > 0 ? `${m}${mAbbr} ${s}${sAbbr}` : `${m}${mAbbr}`;
    };

    const isDefaultColumnSet =
        visibleColumns.size === 3 &&
        visibleColumns.has('daily') &&
        visibleColumns.has('weekly') &&
        visibleColumns.has('monthly');

    const tableContainerClassName = `table-container${isDefaultColumnSet ? ' fit-default-columns' : ''}`;

    // Calculate custom period earnings
    const calculateCustomEarnings = (earning: EarningsResult): number => {
        const periodInHours = getCustomPeriodInHours();
        if (periodInHours <= 0) return 0;
        const coinDuration = blockDurations[earning.displayName] || 596;
        const blockCount = getBlocksPerPeriod('hourly', coinDuration) * periodInHours;
        return earning.earnings.perBlock * blockCount;
    };

    // Format crypto amount with Satoshi conversion for BTC
    const formatCryptoDisplay = (amount: number, coinName: string): React.ReactNode => {
        if (coinName === 'BTC' && amount > 0) {
            const satoshi = amount * 100000000;
            const formattedSat = satoshi.toLocaleString('en-US', { maximumFractionDigits: 0 });
            return (
                <span className="btc-satoshi-wrapper">
                    {formattedSat} SAT
                </span>
            );
        }
        return formatCryptoAmount(amount, coinName);
    };

    const renderCryptoWithTooltip = (amount: number, coinName: string): React.ReactNode => {
        // For BTC, tooltip already shows satoshi; for others, show high-precision value
        let tooltipValue: string;
        if (coinName === 'BTC') {
            tooltipValue = `${formatCryptoAmount(amount)} ${coinName}`;
        } else {
            const absAmount = Math.abs(amount);
            let precision: number;
            if (absAmount < 0.0001) precision = 10;
            else if (absAmount < 0.01) precision = 8;
            else if (absAmount < 1) precision = 6;
            else precision = 4;
            tooltipValue = `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: precision })} ${coinName}`;
        }
        return (
            <div className="earning-crypto earning-crypto-tooltip" tabIndex={0} data-full={tooltipValue}>
                <span className="earning-crypto-text">
                    {formatCryptoDisplay(amount, coinName)}{coinName !== 'BTC' ? ` ${coinName}` : ''}
                </span>
            </div>
        );
    };

    const renderUsdWithDiff = (newAmount: number, baseEarningAmount: number, price: number, coinName: string): React.ReactNode => {
        const newValue = newAmount * price;
        const isSimulatedTarget = targetAllocations[coinName] !== undefined;
        const isSimulatedSource = sourceAllocations[coinName] !== undefined;
        const isSimulatingAnything = Object.keys(sourceAllocations).length > 0 || Object.keys(targetAllocations).length > 0;
        
        // Use the targeted percentage to determine the pre-dilution baseline.
        // This answers: "If I allocate X%, what is that X% worth BEFORE my newly added power dilutes the pool?"
        const targetPercent = isSimulatedTarget ? targetAllocations[coinName] : 100;
        const oldAmount = baseEarningAmount * (targetPercent / 100);
        const oldValue = oldAmount * price;
        
        const diff = newValue - oldValue;
        
        if (!isSimulatingAnything || (!isSimulatedSource && !isSimulatedTarget)) {
            return <div className="earning-usd">{formatUSD(newValue)}</div>;
        }

        const isPositive = diff >= 0;
        const percentDiff = oldValue > 0 ? (diff / oldValue) * 100 : 0;
        const absPercentDiff = Math.abs(percentDiff);
        
        if (Math.abs(diff) < 0.0001 && absPercentDiff < 0.001) {
            return <div className="earning-usd">{formatUSD(newValue)}</div>;
        }

        const formattedPercent = `${isPositive && percentDiff !== 0 ? '+' : ''}${percentDiff.toFixed(2)}%`;
        
        const isTinyChange = Math.abs(diff) < 0.005;
        const oldStr = isTinyChange ? `$${oldValue.toFixed(4)}` : formatUSD(oldValue);
        const newStr = isTinyChange ? `$${newValue.toFixed(4)}` : formatUSD(newValue);
        
        const titleText = oldValue > 0 
            ? `${oldStr} \u2192 ${newStr} (${formattedPercent})` 
            : `${formatUSD(0)} \u2192 ${formatUSD(newValue)}`;
            
        // Show percentage instead of $0.00 if the drop is less than a cent
        const displayValue = isTinyChange ? `%${absPercentDiff.toFixed(2)}` : formatUSD(Math.abs(diff));

        return (
            <div className="earning-usd has-diff">
                {formatUSD(newValue)}
                <span 
                    className={`sim-diff sim-diff-tooltip ${isPositive ? 'positive' : 'negative'}`} 
                    tabIndex={0} 
                    data-full={titleText}
                >
                    {isPositive ? '↗' : '↘'} {displayValue}
                </span>
            </div>
        );
    };

    const handleScreenshot = async () => {
        if (!tablesRef.current || isCapturing) return;
        setIsCapturing(true);
        try {
            const el = tablesRef.current;

            // Temporarily remove overflow constraints and expand to full table width
            const containers = el.querySelectorAll<HTMLElement>('.table-container');
            const origOverflows = Array.from(containers).map(c => c.style.overflow);
            containers.forEach(c => { c.style.overflow = 'visible'; });

            const origWidth = el.style.width;
            const origMinWidth = el.style.minWidth;
            const fullWidth = Math.max(el.scrollWidth, ...Array.from(containers).map(c => c.scrollWidth));
            el.style.width = `${fullWidth}px`;
            el.style.minWidth = `${fullWidth}px`;

            const canvas = await html2canvas(el, {
                backgroundColor: '#0f0f23',
                scale: 1.5,
                useCORS: true,
                logging: false,
                width: fullWidth,
                windowWidth: fullWidth,
            });

            // Restore original styles
            el.style.width = origWidth;
            el.style.minWidth = origMinWidth;
            containers.forEach((c, i) => { c.style.overflow = origOverflows[i]; });

            const fileName = `rollercoin-earnings-${new Date().toISOString().slice(0, 10)}.png`;

            // Convert canvas to blob
            const blob = await new Promise<Blob>((resolve, reject) => {
                canvas.toBlob(b => b ? resolve(b) : reject(new Error('toBlob failed')), 'image/png');
            });

            // Mobile: use native share sheet if available
            const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
            if (isMobile && navigator.share) {
                const file = new File([blob], fileName, { type: 'image/png' });
                try {
                    await navigator.share({ files: [file] });
                    onShowNotification?.(t('table.screenshotSuccess'), 'success');
                    return;
                } catch (e) {
                    // User cancelled share or not supported, fall through to clipboard/download
                    if (e instanceof Error && e.name === 'AbortError') return;
                }
            }

            // Desktop: copy to clipboard for Ctrl+V
            if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    onShowNotification?.(t('table.screenshotCopied'), 'success');
                    return;
                } catch {
                    // Clipboard write failed, fall through to download
                }
            }

            // Fallback: download as file
            const link = document.createElement('a');
            link.download = fileName;
            link.href = URL.createObjectURL(blob);
            link.click();
            URL.revokeObjectURL(link.href);
            onShowNotification?.(t('table.screenshotSuccess'), 'success');
        } catch {
            onShowNotification?.(t('table.screenshotError'), 'error');
        } finally {
            setIsCapturing(false);
        }
    };

    // Simulator Helpers
    const handleAddSourceCoin = () => {
        if (sourceAllocations[selectedSourceAdd] === undefined) {
            setSourceAllocations(prev => {
                const currentSum = Object.values(prev).reduce((a, b) => a + b, 0);
                const remaining = Math.max(0, 100 - currentSum);
                return { ...prev, [selectedSourceAdd]: remaining };
            });
        }
    };

    const handleAddTargetCoin = () => {
        if (targetAllocations[selectedTargetAdd] === undefined) {
            setTargetAllocations(prev => {
                const currentSum = Object.values(prev).reduce((a, b) => a + b, 0);
                const remaining = Math.max(0, 100 - currentSum);
                return { ...prev, [selectedTargetAdd]: remaining };
            });
        }
    };

    const handleSourceChange = (coin: string, val: number) => {
        setSourceAllocations(prev => {
            const otherSum = Object.entries(prev).reduce((sum, [k, v]) => k !== coin ? sum + v : sum, 0);
            const cappedVal = Math.max(0, Math.min(val, 100 - otherSum));
            return { ...prev, [coin]: cappedVal };
        });
    };

    const handleTargetChange = (coin: string, val: number) => {
        setTargetAllocations(prev => {
            const otherSum = Object.entries(prev).reduce((sum, [k, v]) => k !== coin ? sum + v : sum, 0);
            const cappedVal = Math.max(0, Math.min(val, 100 - otherSum));
            return { ...prev, [coin]: cappedVal };
        });
    };

    const removeSourceCoin = (coin: string) => {
        const next = { ...sourceAllocations };
        delete next[coin];
        setSourceAllocations(next);
    };

    const removeTargetCoin = (coin: string) => {
        const next = { ...targetAllocations };
        delete next[coin];
        setTargetAllocations(next);
    };

    const calculateRowEarnings = (baseEarning: EarningsResult): EarningsResult => {
        let earning = { ...baseEarning };

        if (effectiveUserPower) {
            const userBase = toBaseUnit(effectiveUserPower);
            const sourcePercent = sourceAllocations[baseEarning.displayName] || 0;
            const isTargeted = targetAllocations[baseEarning.displayName] !== undefined;
            const targetPercent = isTargeted ? targetAllocations[baseEarning.displayName] : 100;
            const isSimulatingAnything = Object.keys(sourceAllocations).length > 0 || Object.keys(targetAllocations).length > 0;

            const leagueBase = toBaseUnit(baseEarning.leaguePower);

            // Remove user's power if they explicitly marked this coin as a source
            let powerToRemove = 0;
            if (userBase <= leagueBase) {
                 powerToRemove = userBase * (sourcePercent / 100);
            }
            // pureLeagueBase is the pool size stripping away the user's source extraction
            let pureLeagueBase = Math.max(0, leagueBase - powerToRemove);
            
            const allocatedUserBase = userBase * (targetPercent / 100);
            
            let newShare = 0;
            if (pureLeagueBase === 0 && allocatedUserBase === 0) {
                newShare = 0;
            } else if (!isSimulatingAnything) {
                // Default table behavior
                if (allocatedUserBase > pureLeagueBase) {
                    newShare = allocatedUserBase / (pureLeagueBase + allocatedUserBase);
                } else {
                    newShare = allocatedUserBase / pureLeagueBase;
                }
            } else {
                // Simulator is active
                if (isTargeted || allocatedUserBase > pureLeagueBase) {
                    // Real targeted allocation! Explicitly entering a coin expands its pool.
                    newShare = allocatedUserBase / (pureLeagueBase + allocatedUserBase);
                } else {
                    // Hypothetical row: display baseline profitability of the modified pool
                    // without expanding it again with the hypothetical 100%.
                    newShare = allocatedUserBase / pureLeagueBase;
                }
            }

            const originalShare = baseEarning.powerShare / 100;
            const blockReward = originalShare > 0 ? baseEarning.earnings.perBlock / originalShare : 0;
            const newPerBlock = blockReward * newShare;

            const ratio = baseEarning.earnings.perBlock > 0 ? newPerBlock / baseEarning.earnings.perBlock : 0;
            
            earning.powerShare = newShare * 100;
            earning.earnings = {
                perBlock: newPerBlock,
                hourly: baseEarning.earnings.hourly * ratio,
                daily: baseEarning.earnings.daily * ratio,
                weekly: baseEarning.earnings.weekly * ratio,
                monthly: baseEarning.earnings.monthly * ratio,
            };
        }
        return earning;
    };

    const renderRow = (baseEarning: EarningsResult, isBest: boolean = false) => {
        const earning = calculateRowEarnings(baseEarning);
        const price = getPrice(earning.displayName);
        
        const isSimulatedTarget = targetAllocations[baseEarning.displayName] !== undefined;
        const targetPercent = isSimulatedTarget ? targetAllocations[baseEarning.displayName] : 100;

        const isSimulatedSource = sourceAllocations[baseEarning.displayName] !== undefined;
        const sourcePercent = isSimulatedSource ? sourceAllocations[baseEarning.displayName] : 0;
        
        return (
            <React.Fragment key={earning.code}>
                <tr className={`data-row ${isBest ? 'best-earning' : ''}`}>
                    <td>
                        <div className="coin-cell">
                            <img
                            src={COIN_ICONS[earning.displayName] || COIN_ICONS['RLT']}
                            alt={`${earning.displayName} Coin Icon`}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.onerror = null;
                                target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                target.style.visibility = 'hidden';
                                target.parentElement!.style.backgroundColor = GAME_TOKEN_COLORS[earning.displayName] || '#444';
                            }}
                            className="coin-icon-img"
                        />
                        <div className="coin-info-wrapper">
                            <span className="coin-symbol" style={{ color: 'inherit' }}>
                                {earning.displayName}
                            </span>
                            {isSimulatedTarget && (
                                <span className="sim-badge target-badge">{targetPercent}%</span>
                            )}
                            {isSimulatedSource && !isSimulatedTarget && (
                                <span className="sim-badge source-badge">-{sourcePercent}%</span>
                            )}
                        </div>
                    </div>
                </td>
                <td className="league-power">
                    {earning.leaguePowerFormatted}
                </td>

                {visibleColumns.has('blockReward') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.perBlock, earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(earning.earnings.perBlock, baseEarning.earnings.perBlock, price, earning.displayName)
                        )}
                    </td>
                )}

                {visibleColumns.has('blockDuration') && (
                    <td className="earning-cell">
                        <div className="earning-crypto">
                            <span className="earning-crypto-text">
                                {formatBlockDuration(blockDurations[earning.displayName] || 596)}
                            </span>
                        </div>
                    </td>
                )}

                {visibleColumns.has('hourly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.hourly, earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(earning.earnings.hourly, baseEarning.earnings.hourly, price, earning.displayName)
                        )}
                    </td>
                )}

                {visibleColumns.has('daily') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.daily, earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(earning.earnings.daily, baseEarning.earnings.daily, price, earning.displayName)
                        )}
                    </td>
                )}

                {visibleColumns.has('weekly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.weekly, earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(earning.earnings.weekly, baseEarning.earnings.weekly, price, earning.displayName)
                        )}
                    </td>
                )}

                {visibleColumns.has('monthly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.monthly, earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(earning.earnings.monthly, baseEarning.earnings.monthly, price, earning.displayName)
                        )}
                    </td>
                )}

                {visibleColumns.has('custom') && getCustomPeriodInHours() > 0 && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(calculateCustomEarnings(earning), earning.displayName)}
                        {!earning.isGameToken && (
                            renderUsdWithDiff(calculateCustomEarnings(earning), calculateCustomEarnings(baseEarning), price, earning.displayName)
                        )}
                    </td>
                )}
            </tr>
        </React.Fragment>
    );
    };

    if (earnings.length === 0) {
        return (
            <div className="empty-state">
                <div className="empty-icon">📊</div>
                <p>{t('table.noDataTitle')}</p>
                <p className="helper-text">{t('table.noDataDesc')}</p>
            </div>
        );
    }

    return (
        <section className="earnings-tables" ref={tablesRef}>
            {/* Panels moved to headers */}

            {/* Crypto Table */}
            {cryptoCoins.length > 0 && (
                <div className="table-section" ref={tableSectionRef}>
                    <div className="section-header-row">
                        <h2 className="section-title">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            {t('table.cryptoTitle')}
                        </h2>
                        
                        <div className="section-header-actions">
                            <button
                                className={`settings-icon-btn ${isSimulatorOpen ? 'active' : ''}`}
                                onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
                                title={t('simulator.panelTitle')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 107.5 7.5h-7.5V6z"></path>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0013.5 3v7.5z"></path>
                                </svg>
                            </button>
                            <button
                                className="settings-icon-btn screenshot-btn"
                                onClick={handleScreenshot}
                                disabled={isCapturing}
                                title={t('table.screenshotTooltip')}
                            >
                                {isCapturing ? (
                                    <span className="spinner small"></span>
                                ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                                        <circle cx="12" cy="13" r="4"></circle>
                                    </svg>
                                )}
                            </button>
                            <button
                                className="settings-icon-btn"
                                onClick={onOpenColumnSettings}
                                title={t('table.columnSettings')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
                                    <path d="M4 6h16M4 12h16M4 18h16"></path>
                                </svg>
                            </button>
                            <button
                                className="settings-icon-btn"
                                onClick={onOpenSettings}
                                title={t('table.blockDurationsTooltip')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Simulator Panel (Only when activated) */}
                    {isSimulatorOpen && (
                        <div className="simulator-panel open">
                            <div className="simulator-content">
                                <div className="sim-col source-col">
                                    <h4>{t('simulator.sourceTitle')}</h4>
                                    <p className="sim-desc">{t('simulator.sourceDesc')}</p>
                                    <div className="sim-add-row">
                                        <RadixSelect
                                            value={selectedSourceAdd}
                                            onValueChange={setSelectedSourceAdd}
                                            options={earnings
                                                .filter(c => sourceAllocations[c.displayName] === undefined && targetAllocations[c.displayName] === undefined)
                                                .map(c => ({
                                                    value: c.displayName,
                                                    label: c.displayName,
                                                    icon: COIN_ICONS[c.displayName] || COIN_ICONS['RLT']
                                                }))}
                                            placeholder={t('simulator.allAdded')}
                                            emptyText={t('simulator.allAdded')}
                                            triggerClassName="sim-select"
                                            className="sim-select-wrapper"
                                            showSelectedIcon={true}
                                        />
                                        <button className="sim-add-btn" onClick={handleAddSourceCoin} disabled={earnings.filter(c => sourceAllocations[c.displayName] === undefined && targetAllocations[c.displayName] === undefined).length === 0 || !selectedSourceAdd}>{t('simulator.add')}</button>
                                    </div>
                                    <div className="sim-list">
                                        {Object.entries(sourceAllocations).map(([coin, val]) => (
                                            <div key={coin} className="sim-list-item">
                                                <div className="sim-item-info">
                                                    <img src={COIN_ICONS[coin] || COIN_ICONS['RLT']} alt={coin} className="sim-coin-icon" />
                                                    <span className="sim-coin-name">{coin}</span>
                                                </div>
                                                <input className="sim-range warning-range" type="range" min="0" max="100" value={val} onChange={e => handleSourceChange(coin, parseInt(e.target.value))} />
                                                <div className="sim-val-input-group warning-text">
                                                    <input 
                                                        type="number" 
                                                        className="sim-val-input"
                                                        min="0" 
                                                        max="100" 
                                                        value={Number.isNaN(val) ? '' : val} 
                                                        onChange={e => {
                                                            const newVal = parseInt(e.target.value);
                                                            handleSourceChange(coin, Number.isNaN(newVal) ? 0 : newVal);
                                                        }} 
                                                        onFocus={e => e.target.select()}
                                                    />
                                                    <span>%</span>
                                                </div>
                                                <button className="sim-remove-btn" onClick={() => removeSourceCoin(coin)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="sim-col target-col">
                                    <h4>{t('simulator.targetTitle')}</h4>
                                    <p className="sim-desc">{t('simulator.targetDesc')}</p>
                                    <div className="sim-add-row">
                                        <RadixSelect
                                            value={selectedTargetAdd}
                                            onValueChange={setSelectedTargetAdd}
                                            options={earnings
                                                .filter(c => targetAllocations[c.displayName] === undefined && sourceAllocations[c.displayName] === undefined)
                                                .map(c => ({
                                                    value: c.displayName,
                                                    label: c.displayName,
                                                    icon: COIN_ICONS[c.displayName] || COIN_ICONS['RLT']
                                                }))}
                                            placeholder={t('simulator.allAdded')}
                                            emptyText={t('simulator.allAdded')}
                                            triggerClassName="sim-select"
                                            className="sim-select-wrapper"
                                            showSelectedIcon={true}
                                        />
                                        <button className="sim-add-btn" onClick={handleAddTargetCoin} disabled={earnings.filter(c => targetAllocations[c.displayName] === undefined && sourceAllocations[c.displayName] === undefined).length === 0 || !selectedTargetAdd}>{t('simulator.add')}</button>
                                    </div>
                                    <div className="sim-list">
                                        {Object.entries(targetAllocations).map(([coin, val]) => (
                                            <div key={coin} className="sim-list-item">
                                                <div className="sim-item-info">
                                                    <img src={COIN_ICONS[coin] || COIN_ICONS['RLT']} alt={coin} className="sim-coin-icon" />
                                                    <span className="sim-coin-name">{coin}</span>
                                                </div>
                                                <input className="sim-range accent-range" type="range" min="0" max="100" value={val} onChange={e => handleTargetChange(coin, parseInt(e.target.value))} />
                                                <div className="sim-val-input-group accent-text">
                                                    <input 
                                                        type="number" 
                                                        className="sim-val-input"
                                                        min="0" 
                                                        max="100" 
                                                        value={Number.isNaN(val) ? '' : val} 
                                                        onChange={e => {
                                                            const newVal = parseInt(e.target.value);
                                                            handleTargetChange(coin, Number.isNaN(newVal) ? 0 : newVal);
                                                        }} 
                                                        onFocus={e => e.target.select()}
                                                    />
                                                    <span>%</span>
                                                </div>
                                                <button className="sim-remove-btn" onClick={() => removeTargetCoin(coin)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"></path></svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className={tableContainerClassName}>
                        <table className="earnings-table wide-table">
                            <thead ref={theadRef}>
                                <tr>
                                    <th>{t('table.headers.coin')}</th>
                                    <th>{t('table.headers.leaguePower')}</th>
                                    {visibleColumns.has('blockReward') && <th>{getColumnHeader('blockReward')}</th>}
                                    {visibleColumns.has('blockDuration') && <th>{getColumnHeader('blockDuration')}</th>}
                                    {visibleColumns.has('hourly') && <th>{getColumnHeader('hourly')}</th>}
                                    {visibleColumns.has('daily') && <th>{getColumnHeader('daily')}</th>}
                                    {visibleColumns.has('weekly') && <th>{getColumnHeader('weekly')}</th>}
                                    {visibleColumns.has('monthly') && <th>{getColumnHeader('monthly')}</th>}
                                    {visibleColumns.has('custom') && getCustomPeriodInHours() > 0 && <th>{getColumnHeader('custom')}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCrypto.map(e => renderRow(e, e.code === bestCrypto?.code))}
                            </tbody>
                        </table>
                    </div>

                    {/* Fixed sticky header clone - rendered via portal to escape overflow:hidden */}
                    {showFixedHeader && headerWidths.length > 0 && createPortal(
                        <div
                            className="fixed-thead-clone"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: tableLeft,
                                width: tableWidth,
                                zIndex: 100,
                                pointerEvents: 'none',
                            }}
                        >
                            <table className="earnings-table wide-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ width: headerWidths[0] }}>{t('table.headers.coin')}</th>
                                        <th style={{ width: headerWidths[1] }}>{t('table.headers.leaguePower')}</th>
                                        {(() => {
                                            let idx = 2;
                                            const cols: React.ReactNode[] = [];
                                            if (visibleColumns.has('blockReward')) cols.push(<th key="br" style={{ width: headerWidths[idx++] }}>{getColumnHeader('blockReward')}</th>);
                                            if (visibleColumns.has('blockDuration')) cols.push(<th key="bd" style={{ width: headerWidths[idx++] }}>{getColumnHeader('blockDuration')}</th>);
                                            if (visibleColumns.has('hourly')) cols.push(<th key="h" style={{ width: headerWidths[idx++] }}>{getColumnHeader('hourly')}</th>);
                                            if (visibleColumns.has('daily')) cols.push(<th key="d" style={{ width: headerWidths[idx++] }}>{getColumnHeader('daily')}</th>);
                                            if (visibleColumns.has('weekly')) cols.push(<th key="w" style={{ width: headerWidths[idx++] }}>{getColumnHeader('weekly')}</th>);
                                            if (visibleColumns.has('monthly')) cols.push(<th key="m" style={{ width: headerWidths[idx++] }}>{getColumnHeader('monthly')}</th>);
                                            if (visibleColumns.has('custom') && getCustomPeriodInHours() > 0) cols.push(<th key="c" style={{ width: headerWidths[idx++] }}>{getColumnHeader('custom')}</th>);
                                            return cols;
                                        })()}
                                    </tr>
                                </thead>
                            </table>
                        </div>,
                        document.body
                    )}
                </div>
            )}

            {/* Game Tokens Table */}
            {gameTokens.length > 0 && (
                <div className="table-section">
                    <h2 className="section-title">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                        {t('table.gameTokenTitle')}
                    </h2>
                    <div className={tableContainerClassName}>
                        <table className="earnings-table wide-table">
                            <thead>
                                <tr>
                                    <th>{t('table.headers.coin')}</th>
                                    <th>{t('table.headers.leaguePower')}</th>
                                    {visibleColumns.has('blockReward') && <th>{getColumnHeader('blockReward')}</th>}
                                    {visibleColumns.has('blockDuration') && <th>{getColumnHeader('blockDuration')}</th>}
                                    {visibleColumns.has('hourly') && <th>{getColumnHeader('hourly')}</th>}
                                    {visibleColumns.has('daily') && <th>{getColumnHeader('daily')}</th>}
                                    {visibleColumns.has('weekly') && <th>{getColumnHeader('weekly')}</th>}
                                    {visibleColumns.has('monthly') && <th>{getColumnHeader('monthly')}</th>}
                                    {visibleColumns.has('custom') && getCustomPeriodInHours() > 0 && <th>{getColumnHeader('custom')}</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {gameTokens.map(e => renderRow(e))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </section>
    );
};

export default EarningsTable;
