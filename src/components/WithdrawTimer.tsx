import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
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
    currentUsdValue: number;
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
    const [showDate, setShowDate] = useState<boolean>(() => {
        try {
            return localStorage.getItem('rollercoin_web_withdraw_show_date') === 'true';
        } catch {
            return false;
        }
    });

    // Custom Min Withdraw States
    const [customMinWithdraws, setCustomMinWithdraws] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('rollercoin_web_custom_min_withdraws');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [editingMinCoin, setEditingMinCoin] = useState<string | null>(null);
    const [tempMinValue, setTempMinValue] = useState<string>('');

    // Filter only crypto coins (not game tokens) and exclude non-withdrawable currencies
    const cryptoCoins = earnings.filter(e => !e.isGameToken && e.displayName !== 'ALGO' && e.displayName !== 'USDT');

    if (cryptoCoins.length === 0) {
        return null;
    }

    // Calculate withdrawal data for each coin
    const withdrawData: WithdrawData[] = cryptoCoins.map(earning => {
        const customMin = customMinWithdraws[earning.displayName] !== undefined ? customMinWithdraws[earning.displayName] : (DEFAULT_MIN_WITHDRAW[earning.displayName] ?? 0);
        const minWithdraw = customMin;
        const currentBalance = balances[earning.displayName] ?? 0;
        const earningPerDay = earning.earnings.daily;
        const price = prices[earning.displayName] || prices[earning.displayName.toUpperCase()] || 0;

        const currentUsdValue = currentBalance * price;
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
            currentUsdValue,
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

    const handleStartMinEdit = (code: string, currentValue: number) => {
        setEditingMinCoin(code);
        setTempMinValue(currentValue > 0 ? currentValue.toString() : '');
    };

    const handleEndMinEdit = (code: string) => {
        const value = parseFloat(tempMinValue.replace(',', '.')) || 0;
        setCustomMinWithdraws(prev => {
            const next = { ...prev, [code]: Math.max(0, value) };
            localStorage.setItem('rollercoin_web_custom_min_withdraws', JSON.stringify(next));
            return next;
        });
        setEditingMinCoin(null);
        setTempMinValue('');
    };

    const handleMinKeyDown = (e: React.KeyboardEvent, code: string) => {
        if (e.key === 'Enter') {
            handleEndMinEdit(code);
        } else if (e.key === 'Escape') {
            setEditingMinCoin(null);
            setTempMinValue('');
        }
    };

    const handleResetMinWithdraw = (e: React.MouseEvent, code: string) => {
        e.stopPropagation();
        setCustomMinWithdraws(prev => {
            const next = { ...prev };
            delete next[code];
            localStorage.setItem('rollercoin_web_custom_min_withdraws', JSON.stringify(next));
            return next;
        });
    };

    const handleToggleShowDate = () => {
        const next = !showDate;
        setShowDate(next);
        localStorage.setItem('rollercoin_web_withdraw_show_date', String(next));
    };

    const dateLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    return (
        <section className="withdraw-timer-section">
            <div className="withdraw-header-row">
                <h2 className="section-title">
                    <span className="section-icon">⏱️</span>
                    {t('withdraw.title')}
                </h2>
                <div className="withdraw-display-toggle">
                    <div
                        className="withdraw-toggle-bg"
                        style={{ transform: showDate ? 'translateX(100%)' : 'translateX(0)' }}
                    />
                    <button
                        className={`withdraw-toggle-btn ${!showDate ? 'active' : ''}`}
                        onClick={handleToggleShowDate}
                    >
                        <span>⏱️</span> {t('withdraw.showDuration')}
                    </button>
                    <button
                        className={`withdraw-toggle-btn ${showDate ? 'active' : ''}`}
                        onClick={handleToggleShowDate}
                    >
                        <span>📅</span> {t('withdraw.showDate')}
                    </button>
                </div>
            </div>
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
                            <div className="balance-label-wrapper" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                                <label style={{ marginBottom: 0 }}>{t('withdraw.balanceLabel')}</label>
                                {data.currentBalance > 0 && (
                                    <span className="balance-usd" style={{ fontSize: '0.85em', color: '#10b981' }}>
                                        ≈ ${data.currentUsdValue.toFixed(2)}
                                    </span>
                                )}
                            </div>
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
                                <span className="stat-label">
                                    {t('withdraw.stats.minWithdraw')}
                                </span>
                                {editingMinCoin === data.displayName ? (
                                    <input
                                        type="text"
                                        value={tempMinValue}
                                        onChange={(e) => setTempMinValue(e.target.value)}
                                        onBlur={() => handleEndMinEdit(data.displayName)}
                                        onKeyDown={(e) => handleMinKeyDown(e, data.displayName)}
                                        autoFocus
                                        className="balance-input"
                                        style={{ padding: '2px 4px', fontSize: '0.9em', width: '100%', maxWidth: '80px', marginTop: '2px' }}
                                        placeholder="0"
                                    />
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                        <span 
                                            className="stat-value" 
                                            onClick={() => handleStartMinEdit(data.displayName, data.minWithdraw)}
                                            style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                            title={t('withdraw.editHint')}
                                        >
                                            {formatCryptoAmount(data.minWithdraw)}
                                            <span style={{ fontSize: '0.75em', opacity: 0.7 }}>✏️</span>
                                        </span>
                                        {customMinWithdraws[data.displayName] !== undefined && (
                                            <button 
                                                className="reset-min-btn" 
                                                onClick={(e) => handleResetMinWithdraw(e, data.displayName)}
                                                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px', color: '#f87171', fontSize: '1.1em', display: 'flex', alignItems: 'center' }}
                                                title={t('withdraw.resetMin')}
                                            >
                                                ↺
                                            </button>
                                        )}
                                    </div>
                                )}
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
                            ) : showDate ? (
                                <span className={`time-value ${data.daysToWithdraw < 7 ? 'fast' : data.daysToWithdraw < 30 ? 'medium' : 'slow'}`}>
                                    {(() => {
                                        const target = new Date();
                                        target.setDate(target.getDate() + Math.ceil(data.daysToWithdraw));
                                        return target.toLocaleDateString(dateLocale, { day: 'numeric', month: 'short', year: 'numeric' });
                                    })()}
                                </span>
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
