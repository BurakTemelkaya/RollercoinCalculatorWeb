import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import type { ApiLeagueData } from '../types/api';
import { getCurrencyConfig } from '../data/currencies';
import { COIN_ICONS } from '../utils/constants';
import { formatPowerFromGh } from '../utils/calculator';
import { CURRENCY_MAP } from '../data/leagues';
import './LeaguePowerPartition.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface LeaguePowerPartitionProps {
    league: ApiLeagueData | null;
}

const GAME_CURRENCIES = ['RLT', 'RST', 'HMT'];

// Duration formatting (seconds -> HH:mm:ss)
const formatDuration = (seconds: number) => {
    if (!seconds || seconds <= 0) return '00:00:00';
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
};

export default function LeaguePowerPartition({ league }: LeaguePowerPartitionProps) {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { lang } = useParams<{ lang: string }>();
    const [isOpen, setIsOpen] = useState(false);

    // Process Currencies
    const processedCurrencies = useMemo(() => {
        if (!league) return [];
        return league.currencies.map(c => {
            const displayName = CURRENCY_MAP[c.name] || c.name;
            const config = getCurrencyConfig(displayName);
            let displayPayout = c.payoutAmount;
            if (config) {
                displayPayout = c.payoutAmount / config.to_small;
            }

            return {
                ...c,
                displayName,
                isGameCurrency: GAME_CURRENCIES.includes(displayName),
                color: config?.color || '#ccc',
                displayPayout,
                icon: COIN_ICONS[displayName] || COIN_ICONS['RLT']
            };
        }).sort((a, b) => b.totalPower - a.totalPower);
    }, [league]);

    // Split Lists
    const gameCurrencies = useMemo(() => processedCurrencies.filter(c => c.isGameCurrency), [processedCurrencies]);
    const cryptoCurrencies = useMemo(() => processedCurrencies.filter(c => !c.isGameCurrency), [processedCurrencies]);

    // Pie Chart Data
    const chartData = useMemo(() => {
        if (processedCurrencies.length === 0) return null;
        return {
            labels: processedCurrencies.map(c => c.displayName),
            datasets: [
                {
                    data: processedCurrencies.map(c => c.totalPower),
                    backgroundColor: processedCurrencies.map(c => c.color),
                    borderWidth: 2,
                    borderColor: '#1e2433', // Matches var(--bg-card)
                    hoverOffset: 8
                },
            ],
        };
    }, [processedCurrencies]);

    // Calculate sum of total power strictly for percentage math
    const totalPowerSum = processedCurrencies.reduce((acc, curr) => acc + curr.totalPower, 0);

    const getPercentage = (power: number) => {
        if (totalPowerSum === 0) return '0%';
        return Math.round((power / totalPowerSum) * 100) + '%';
    };

    if (!league) return null;

    return (
        <div className="lpp-wrapper">
            <button className={`lpp-toggle-btn ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
                <span className="lpp-toggle-icon">📊</span>
                <span className="lpp-toggle-text">{t('lpp.title', 'League Power Partition')}</span>
                <svg className="lpp-chevron" viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </button>

            {isOpen && (
                <div className="lpp-container">
                    <h2 className="lpp-title">{t('lpp.title', 'League Power Partition')}</h2>
                    <div className="lpp-content">
                        {/* CHART COLUMN */}
                        <div className="lpp-chart-col">
                            <div className="lpp-pie-wrapper">
                                {chartData && (
                                    <Pie 
                                        data={chartData} 
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                            plugins: {
                                                legend: { display: false },
                                                tooltip: {
                                                    callbacks: {
                                                        label: (ctx: any) => {
                                                            const val = ctx.raw as number;
                                                            return ` ${ctx.label}: ${getPercentage(val)} (${formatPowerFromGh(val)})`;
                                                        }
                                                    }
                                                }
                                            }
                                        }} 
                                    />
                                )}
                            </div>
                            <div className="lpp-league-power">
                                <span className="lpp-lp-label">{t('lpp.leaguePower', 'League power')}</span>
                                <span className="lpp-lp-value">{formatPowerFromGh(totalPowerSum)}</span>
                            </div>
                            <button className="lpp-nav-chart-btn" onClick={() => navigate(`/${lang || 'en'}/charts`)}>
                                <span className="icon">📈</span> {t('lpp.charts', 'POWER CHART')}
                            </button>
                        </div>

                        {/* DATA COLUMN */}
                        <div className="lpp-data-col">
                            {gameCurrencies.length > 0 && (
                                <div className="lpp-section">
                                    <h3 className="lpp-section-title">{t('lpp.gameCurrencies', 'Game currencies')}</h3>
                                    <div className="lpp-grid">
                                        {gameCurrencies.map(c => (
                                            <div key={c.id} className="lpp-card">
                                                <div className="lpp-card-header">
                                                    <div className="lpp-card-title">
                                                        <img src={c.icon} alt={c.displayName} className="lpp-coin-icon" />
                                                        <span style={{ color: c.color }}>{c.displayName}</span>
                                                    </div>
                                                    <span className="lpp-card-percent" style={{ color: c.color }}>{getPercentage(c.totalPower)}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.power', 'Power')}</span>
                                                    <span className="lpp-row-val">{formatPowerFromGh(c.totalPower)}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.activeUsers', 'Active users')}</span>
                                                    <span className="lpp-row-val">{c.userCount.toLocaleString()}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.perBlock', 'Per block')}</span>
                                                    <span className="lpp-row-val">{c.displayPayout.toLocaleString('en-US', {maximumFractionDigits: 8})} {c.displayName}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.blockTime', 'Block time')}</span>
                                                    <span className="lpp-row-val">{formatDuration(c.duration)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {cryptoCurrencies.length > 0 && (
                                <div className="lpp-section">
                                    <h3 className="lpp-section-title">{t('lpp.cryptoCurrencies', 'Crypto currencies')}</h3>
                                    <div className="lpp-grid">
                                        {cryptoCurrencies.map(c => (
                                            <div key={c.id} className="lpp-card">
                                                <div className="lpp-card-header">
                                                    <div className="lpp-card-title">
                                                        <img src={c.icon} alt={c.displayName} className="lpp-coin-icon" />
                                                        <span style={{ color: c.color }}>{c.displayName}</span>
                                                    </div>
                                                    <span className="lpp-card-percent" style={{ color: c.color }}>{getPercentage(c.totalPower)}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.power', 'Power')}</span>
                                                    <span className="lpp-row-val">{formatPowerFromGh(c.totalPower)}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.activeUsers', 'Active users')}</span>
                                                    <span className="lpp-row-val">{c.userCount.toLocaleString()}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.perBlock', 'Per block')}</span>
                                                    <span className="lpp-row-val">{c.displayPayout.toLocaleString('en-US', {maximumFractionDigits: 8})} {c.displayName}</span>
                                                </div>
                                                <div className="lpp-card-row">
                                                    <span className="lpp-row-label">{t('lpp.blockTime', 'Block time')}</span>
                                                    <span className="lpp-row-val">{formatDuration(c.duration)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
