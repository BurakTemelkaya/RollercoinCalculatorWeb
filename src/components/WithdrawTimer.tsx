import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EarningsResult, DEFAULT_MIN_WITHDRAW } from '../types';
import { formatDuration, formatCryptoAmount } from '../utils/calculator';
import { COIN_ICONS, GAME_TOKEN_COLORS } from '../utils/constants';

interface WithdrawTimerProps {
    earnings: EarningsResult[];
    balances: Record<string, number>;  // code -> actual balance amount
    onBalanceChange: (code: string, balance: number) => void;
    prices: Record<string, number>;
}

interface WithdrawData {
    code: string;
    displayName: string;
    minWithdraw: number;
    currentBalance: number;
    remainingToEarn: number;
    earningPerDay: number;
    daysToWithdraw: number;
    percent: number;
    canWithdrawNow: boolean;
    usdValue: number;
}

const WithdrawTimer: React.FC<WithdrawTimerProps> = ({
    earnings,
    balances,
    onBalanceChange,
    prices
}) => {
    const { t } = useTranslation();
    const [editingCoin, setEditingCoin] = useState<string | null>(null);
    const [tempValue, setTempValue] = useState<string>('');

    // Filter only crypto coins (not game tokens) and exclude non-withdrawable currencies
    const cryptoCoins = earnings.filter(e => !e.isGameToken && e.displayName !== 'ALGO' && e.displayName !== 'USDT');

    if (cryptoCoins.length === 0) {
        return null;
    }

    // Calculate withdrawal data for each coin
    const withdrawData: WithdrawData[] = cryptoCoins.map(earning => {
        const minWithdraw = DEFAULT_MIN_WITHDRAW[earning.displayName] ?? 0;
        const currentBalance = balances[earning.displayName] ?? 0;
        const earningPerDay = earning.earnings.daily;
        const price = prices[earning.displayName] || prices[earning.displayName.toUpperCase()] || 0;

        const remainingToEarn = Math.max(0, minWithdraw - currentBalance);
        const canWithdrawNow = currentBalance >= minWithdraw;
        const percent = minWithdraw > 0 ? Math.min(100, (currentBalance / minWithdraw) * 100) : 0;
        const usdValue = minWithdraw * price;

        let daysToWithdraw: number;
        if (canWithdrawNow) {
            daysToWithdraw = 0;
        } else if (earningPerDay > 0) {
            daysToWithdraw = remainingToEarn / earningPerDay;
        } else {
            daysToWithdraw = Infinity;
        }

        return {
            code: earning.code,
            displayName: earning.displayName,
            minWithdraw,
            currentBalance,
            remainingToEarn,
            earningPerDay,
            daysToWithdraw,
            percent,
            canWithdrawNow,
            usdValue
        };
    });

    // Sort by days to withdraw (fastest first)
    withdrawData.sort((a, b) => {
        if (a.canWithdrawNow && !b.canWithdrawNow) return -1;
        if (!a.canWithdrawNow && b.canWithdrawNow) return 1;

        if (!Number.isFinite(a.daysToWithdraw) && Number.isFinite(b.daysToWithdraw)) return 1;
        if (Number.isFinite(a.daysToWithdraw) && !Number.isFinite(b.daysToWithdraw)) return -1;
        return a.daysToWithdraw - b.daysToWithdraw;
    });

    const handleStartEdit = (code: string, currentValue: number) => {
        setEditingCoin(code);
        setTempValue(currentValue > 0 ? currentValue.toString() : '');
    };

    const handleEndEdit = (code: string) => {
        const value = parseFloat(tempValue.replace(',', '.')) || 0;
        onBalanceChange(code, Math.max(0, value));
        setEditingCoin(null);
        setTempValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent, code: string) => {
        if (e.key === 'Enter') {
            handleEndEdit(code);
        } else if (e.key === 'Escape') {
            setEditingCoin(null);
            setTempValue('');
        }
    };

    return (
        <section className="withdraw-timer-section">
            <h2 className="section-title">
                <span className="section-icon">⏱️</span>
                {t('withdraw.title')}
            </h2>
            <p className="section-desc">
                {t('withdraw.desc')}
            </p>

            <div className="withdraw-grid">
                {withdrawData.map((data) => (
                    <div
                        key={data.code}
                        className={`withdraw-card ${data.canWithdrawNow ? 'ready' : ''}`}
                    >
                        <div className="withdraw-card-header">
                            <div className="coin-info">
                                <img
                                    src={COIN_ICONS[data.displayName] || COIN_ICONS['RLT']}
                                    alt={data.displayName}
                                    className="coin-icon"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.visibility = 'hidden';
                                        (e.target as HTMLImageElement).parentElement!.style.backgroundColor = GAME_TOKEN_COLORS[data.displayName] || '#444';
                                    }}
                                />
                                <span className="coin-name">{data.displayName}</span>
                            </div>
                            {data.canWithdrawNow && (
                                <span className="ready-badge">{t('withdraw.readyBadge')}</span>
                            )}
                        </div>

                        {/* Balance input */}
                        <div className="balance-input-row">
                            <label>{t('withdraw.balanceLabel')}</label>
                            {editingCoin === data.displayName ? (
                                <input
                                    type="text"
                                    value={tempValue}
                                    onChange={(e) => setTempValue(e.target.value)}
                                    onBlur={() => handleEndEdit(data.displayName)}
                                    onKeyDown={(e) => handleKeyDown(e, data.displayName)}
                                    autoFocus
                                    className="balance-input"
                                    placeholder="0"
                                />
                            ) : (
                                <div
                                    className="balance-display"
                                    onClick={() => handleStartEdit(data.displayName, data.currentBalance)}
                                >
                                    {data.currentBalance > 0 ? formatCryptoAmount(data.currentBalance) : '0'}
                                    <span className="edit-hint">✏️</span>
                                </div>
                            )}
                        </div>

                        {/* Progress bar */}
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${data.percent}%` }}
                                />
                            </div>
                            <span className="progress-percent">{data.percent.toFixed(1)}%</span>
                        </div>

                        <div className="withdraw-stats">
                            <div className="stat">
                                <span className="stat-label">{t('withdraw.stats.minWithdraw')}</span>
                                <span className="stat-value">{formatCryptoAmount(data.minWithdraw)}</span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">{t('withdraw.stats.minValue')}</span>
                                <span className="stat-value" style={{ color: '#10b981' }}>
                                    ${data.usdValue.toFixed(2)}
                                </span>
                            </div>
                            <div className="stat">
                                <span className="stat-label">{t('withdraw.stats.remaining')}</span>
                                <span className="stat-value">{formatCryptoAmount(data.remainingToEarn)}</span>
                            </div>
                        </div>

                        <div className="withdraw-time">
                            {data.canWithdrawNow ? (
                                <span className="time-ready">{t('withdraw.readyNow')}</span>
                            ) : !Number.isFinite(data.daysToWithdraw) ? (
                                <span className="time-na">-</span>
                            ) : (
                                <span className={`time-value ${data.daysToWithdraw < 7 ? 'fast' : data.daysToWithdraw < 30 ? 'medium' : 'slow'}`}>
                                    {formatDuration(data.daysToWithdraw, t)}
                                </span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default WithdrawTimer;
