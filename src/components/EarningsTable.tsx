import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { EarningsResult } from '../types';
import { formatCryptoAmount, formatUSD } from '../utils/calculator';
import { getBlocksPerPeriod } from '../utils/calculator';
import { COIN_ICONS, GAME_TOKEN_COLORS } from '../utils/constants';

type TableColumnType = 'blockReward' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface EarningsTableProps {
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

    // Separate game tokens and crypto
    const gameTokens = earnings.filter(e => e.isGameToken);
    const cryptoCoins = earnings.filter(e => !e.isGameToken);

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
            case 'hourly': return t('table.headers.hourly');
            case 'daily': return t('table.headers.daily');
            case 'weekly': return t('table.headers.weekly');
            case 'monthly': return t('table.headers.monthly');
            case 'custom': return periodInHours > 0 ? getCustomPeriodAbbr() : t('table.headers.custom');
            default: return '';
        }
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
        const fullValue = `${formatCryptoAmount(amount)} ${coinName}`;
        return (
            <div className="earning-crypto earning-crypto-tooltip" tabIndex={0} data-full={fullValue}>
                <span className="earning-crypto-text">
                    {formatCryptoDisplay(amount, coinName)}{coinName !== 'BTC' ? ` ${coinName}` : ''}
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

    const renderRow = (earning: EarningsResult, isBest: boolean = false) => {
        const price = getPrice(earning.displayName);

        return (
            <tr key={earning.code} className={isBest ? 'best-earning' : ''}>
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
                        <span className="coin-symbol">{earning.displayName}</span>
                    </div>
                </td>
                <td className="league-power">
                    {earning.leaguePowerFormatted}
                </td>

                {visibleColumns.has('blockReward') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.perBlock, earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(earning.earnings.perBlock * price)}</div>
                        )}
                    </td>
                )}

                {visibleColumns.has('hourly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.hourly, earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(earning.earnings.hourly * price)}</div>
                        )}
                    </td>
                )}

                {visibleColumns.has('daily') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.daily, earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(earning.earnings.daily * price)}</div>
                        )}
                    </td>
                )}

                {visibleColumns.has('weekly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.weekly, earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(earning.earnings.weekly * price)}</div>
                        )}
                    </td>
                )}

                {visibleColumns.has('monthly') && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(earning.earnings.monthly, earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(earning.earnings.monthly * price)}</div>
                        )}
                    </td>
                )}

                {visibleColumns.has('custom') && getCustomPeriodInHours() > 0 && (
                    <td className="earning-cell">
                        {renderCryptoWithTooltip(calculateCustomEarnings(earning), earning.displayName)}
                        {!earning.isGameToken && earning.displayName !== 'USDT' && (
                            <div className="earning-usd">{formatUSD(calculateCustomEarnings(earning) * price)}</div>
                        )}
                    </td>
                )}
            </tr>
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
            {/* Crypto Table */}
            {cryptoCoins.length > 0 && (
                <div className="table-section">
                    <div className="section-header-row">
                        <h2 className="section-title">
                            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                            </svg>
                            {t('table.cryptoTitle')}
                        </h2>
                        <div className="section-header-actions">
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

                    <div className={tableContainerClassName}>
                        <table className="earnings-table wide-table">
                            <thead>
                                <tr>
                                    <th>{t('table.headers.coin')}</th>
                                    <th>{t('table.headers.leaguePower')}</th>
                                    {visibleColumns.has('blockReward') && <th>{getColumnHeader('blockReward')}</th>}
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
