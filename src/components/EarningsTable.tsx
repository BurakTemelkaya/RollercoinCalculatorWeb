import React, { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import html2canvas from 'html2canvas';
import { EarningsResult } from '../types';
import { formatCryptoAmount, formatUSD } from '../utils/calculator';
import { COIN_ICONS, GAME_TOKEN_COLORS } from '../utils/constants';

interface EarningsTableProps {
    earnings: EarningsResult[];
    prices: Record<string, number>;
    onOpenSettings: () => void;
    onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const EarningsTable: React.FC<EarningsTableProps> = ({
    earnings,
    prices,
    onOpenSettings,
    onShowNotification
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

    const handleScreenshot = async () => {
        if (!tablesRef.current || isCapturing) return;
        setIsCapturing(true);
        try {
            const canvas = await html2canvas(tablesRef.current, {
                backgroundColor: '#0f0f23',
                scale: 1.5,
                useCORS: true,
                logging: false,
            });
            const link = document.createElement('a');
            link.download = `rollercoin-earnings-${new Date().toISOString().slice(0, 10)}.jpg`;
            link.href = canvas.toDataURL('image/jpeg', 0.85);
            link.click();
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

                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.daily)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && earning.displayName !== 'USDT' && (
                        <div className="earning-usd">{formatUSD(earning.earnings.daily * price)}</div>
                    )}
                </td>
                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.weekly)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && earning.displayName !== 'USDT' && (
                        <div className="earning-usd">{formatUSD(earning.earnings.weekly * price)}</div>
                    )}
                </td>
                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.monthly)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && earning.displayName !== 'USDT' && (
                        <div className="earning-usd">{formatUSD(earning.earnings.monthly * price)}</div>
                    )}
                </td>
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
        <div className="earnings-tables" ref={tablesRef}>
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
                                onClick={onOpenSettings}
                                title={t('table.settingsTooltip')}
                            >
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="18" height="18">
                                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                                    <circle cx="12" cy="12" r="3"></circle>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div className="table-container">
                        <table className="earnings-table wide-table">
                            <thead>
                                <tr>
                                    <th>{t('table.headers.coin')}</th>
                                    <th>{t('table.headers.leaguePower')}</th>
                                    <th>{t('table.headers.daily')}</th>
                                    <th>{t('table.headers.weekly')}</th>
                                    <th>{t('table.headers.monthly')}</th>
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
                    <div className="table-container">
                        <table className="earnings-table wide-table">
                            <thead>
                                <tr>
                                    <th>{t('table.headers.coin')}</th>
                                    <th>{t('table.headers.leaguePower')}</th>
                                    <th>{t('table.headers.daily')}</th>
                                    <th>{t('table.headers.weekly')}</th>
                                    <th>{t('table.headers.monthly')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {gameTokens.map(e => renderRow(e))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EarningsTable;
