import React from 'react';
import { useTranslation } from 'react-i18next';
import { EarningsResult } from '../types';
import { formatCryptoAmount } from '../utils/calculator';
import { COIN_ICONS, GAME_TOKEN_COLORS } from '../utils/constants';

interface EarningsTableProps {
    earnings: EarningsResult[];
    prices: Record<string, number>;
}

// Format dollar value
function formatUSD(amount: number): string {
    if (!Number.isFinite(amount) || amount === 0) return '-';
    if (amount < 0.01) return `$${amount.toFixed(4)}`;
    if (amount < 1) return `$${amount.toFixed(3)}`;
    return `$${amount.toFixed(2)}`;
}

const EarningsTable: React.FC<EarningsTableProps> = ({
    earnings,
    prices,
}) => {
    const { t } = useTranslation();

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

    const renderRow = (earning: EarningsResult, isBest: boolean = false) => {
        const price = getPrice(earning.displayName);

        return (
            <tr key={earning.code} className={isBest ? 'best-earning' : ''}>
                <td>
                    <div className="coin-cell">
                        <img
                            src={COIN_ICONS[earning.displayName] || COIN_ICONS['RLT']} // Fallback to RLT icon if missing
                            alt={earning.displayName}
                            onError={(e) => {
                                // Hide image and show symbol instead if fails
                                (e.target as HTMLImageElement).style.visibility = 'hidden';
                                (e.target as HTMLImageElement).parentElement!.style.backgroundColor = GAME_TOKEN_COLORS[earning.displayName] || '#444';
                            }}
                            className="coin-icon-img"
                        />
                        <span className="coin-symbol">{earning.displayName}</span>
                        {isBest && <span className="best-badge">{t('table.best')}</span>}
                    </div>
                </td>
                <td className="league-power">
                    {earning.leaguePowerFormatted}
                </td>

                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.daily)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && (
                        <div className="earning-usd">{formatUSD(earning.earnings.daily * price)}</div>
                    )}
                </td>
                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.weekly)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && (
                        <div className="earning-usd">{formatUSD(earning.earnings.weekly * price)}</div>
                    )}
                </td>
                <td className="earning-cell">
                    <div className="earning-crypto">{formatCryptoAmount(earning.earnings.monthly)} {earning.displayName}</div>
                    {price > 0 && !earning.isGameToken && (
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
        <div className="earnings-tables">
            {/* Crypto Table */}
            {cryptoCoins.length > 0 && (
                <div className="table-section">
                    <h3 className="section-title">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
                        </svg>
                        {t('table.cryptoTitle')}
                    </h3>
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
                    <h3 className="section-title">
                        <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                            <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                        </svg>
                        {t('table.gameTokenTitle')}
                    </h3>
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
