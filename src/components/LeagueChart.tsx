import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import {
    Chart,
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { fetchLeaguesFromApi, convertApiResponseToLeagues } from '../services/leagueApi';
import { fetchLeagueChartData, type LeagueChartDataPoint } from '../services/leagueChartApi';
import { ApiError } from '../services/apiClient';
import type { ApiLeagueData, ApiCurrency } from '../types/api';
import type { LeagueInfo } from '../data/leagues';
import { LEAGUES, CURRENCY_MAP } from '../data/leagues';
import { getLeagueImage } from '../data/leagueImages';
import { getCurrencyConfig } from '../data/currencies';
import { formatPowerFromGh } from '../utils/calculator';
import { COIN_ICONS } from '../utils/constants';
import RadixSelect from './RadixSelect';
import './LeagueChart.css';

// Register Chart.js components
Chart.register(
    LineController,
    LineElement,
    PointElement,
    LinearScale,
    CategoryScale,
    Tooltip,
    Legend,
    Filler
);

// Cache keys
const CHART_LEAGUES_KEY = 'rollercoin_web_chart_leagues';
const CHART_RAW_KEY = 'rollercoin_web_chart_raw_api';
const CHART_LEAGUES_TS_KEY = 'rollercoin_web_chart_leagues_ts';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Format payout value from raw API value using currency's to_small divisor
 */
function formatPayout(rawValue: number, currencyName: string): string {
    const displayName = CURRENCY_MAP[currencyName] || currencyName;
    const config = getCurrencyConfig(displayName);
    if (!config) {
        return rawValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
    }
    const real = rawValue / config.to_small;
    if (real < 0.0001) return real.toFixed(8);
    if (real < 0.01) return real.toFixed(6);
    if (real < 1) return real.toFixed(4);
    if (real < 100) return real.toFixed(2);
    return real.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

/**
 * Format payout value for the tooltip (shorter)
 */
function formatPayoutShort(rawValue: number, currencyName: string): string {
    const displayName = CURRENCY_MAP[currencyName] || currencyName;
    const config = getCurrencyConfig(displayName);
    if (!config) return rawValue.toLocaleString('en-US', { maximumFractionDigits: 2 });
    const real = rawValue / config.to_small;
    return real.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
}

export default function LeagueChart() {
    const { lang } = useParams<{ lang: string }>();
    const { t, i18n } = useTranslation();

    // State
    const [leagues, setLeagues] = useState<LeagueInfo[]>([]);
    const [rawApiData, setRawApiData] = useState<ApiLeagueData[]>([]);
    const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
    const [selectedCurrencyId, setSelectedCurrencyId] = useState<number | null>(null);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');
    const [chartData, setChartData] = useState<LeagueChartDataPoint[]>([]);
    const [loading, setLoading] = useState(false);
    const [leaguesLoading, setLeaguesLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activePreset, setActivePreset] = useState<'all' | '7d' | '30d'>('all');

    // Chart ref
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<Chart | null>(null);

    // Force language sync
    useEffect(() => {
        if (lang && (lang === 'tr' || lang === 'en')) {
            if (i18n.language !== lang) {
                i18n.changeLanguage(lang);
            }
        }
    }, [lang, i18n]);

    // Load leagues from API or cache
    useEffect(() => {
        const loadLeagues = async () => {
            // Try cache first
            try {
                const cachedRaw = localStorage.getItem(CHART_RAW_KEY);
                const cachedLeagues = localStorage.getItem(CHART_LEAGUES_KEY);
                const cachedTs = localStorage.getItem(CHART_LEAGUES_TS_KEY);
                if (cachedRaw && cachedLeagues && cachedTs) {
                    const elapsed = Date.now() - parseInt(cachedTs, 10);
                    if (elapsed < CACHE_DURATION) {
                        const parsed: ApiLeagueData[] = JSON.parse(cachedRaw);
                        const parsedLeagues: LeagueInfo[] = JSON.parse(cachedLeagues);
                        setRawApiData(parsed);
                        setLeagues(parsedLeagues);
                        if (parsedLeagues.length > 0) {
                            setSelectedLeagueId(parsedLeagues[0].id);
                        }
                        setLeaguesLoading(false);
                        return;
                    }
                }
            } catch { /* ignore cache errors */ }

            // Also try the main app's cached leagues
            try {
                const appCachedRaw = localStorage.getItem('rollercoin_web_raw_api_data');
                const appCachedLeagues = localStorage.getItem('rollercoin_web_api_leagues');
                if (appCachedRaw && appCachedLeagues) {
                    const parsed: ApiLeagueData[] = JSON.parse(appCachedRaw);
                    const parsedLeagues: LeagueInfo[] = JSON.parse(appCachedLeagues);
                    if (parsed.length > 0 && parsedLeagues.length > 0) {
                        setRawApiData(parsed);
                        setLeagues(parsedLeagues);
                        if (parsedLeagues.length > 0) {
                            setSelectedLeagueId(parsedLeagues[0].id);
                        }
                        // Cache it for our page too
                        localStorage.setItem(CHART_RAW_KEY, appCachedRaw);
                        localStorage.setItem(CHART_LEAGUES_KEY, appCachedLeagues);
                        localStorage.setItem(CHART_LEAGUES_TS_KEY, Date.now().toString());
                        setLeaguesLoading(false);
                        return;
                    }
                }
            } catch { /* ignore */ }

            // Fetch from API
            try {
                setLeaguesLoading(true);
                const apiData = await fetchLeaguesFromApi();
                const converted = convertApiResponseToLeagues(apiData);
                setRawApiData(apiData);
                setLeagues(converted);
                if (converted.length > 0) {
                    setSelectedLeagueId(converted[0].id);
                }
                localStorage.setItem(CHART_RAW_KEY, JSON.stringify(apiData));
                localStorage.setItem(CHART_LEAGUES_KEY, JSON.stringify(converted));
                localStorage.setItem(CHART_LEAGUES_TS_KEY, Date.now().toString());
            } catch (err) {
                console.error('Failed to fetch leagues:', err);
                // Fallback to static leagues
                setLeagues(LEAGUES);
                if (LEAGUES.length > 0) {
                    setSelectedLeagueId(LEAGUES[0].id);
                }
            } finally {
                setLeaguesLoading(false);
            }
        };

        loadLeagues();
    }, []);

    // Get currencies for the selected league
    const availableCurrencies = useMemo<ApiCurrency[]>(() => {
        if (!selectedLeagueId || rawApiData.length === 0) return [];
        const league = rawApiData.find(l => String(l.id) === String(selectedLeagueId));
        if (!league) return [];
        return league.currencies;
    }, [selectedLeagueId, rawApiData]);

    // Auto-select first currency when league changes
    useEffect(() => {
        if (availableCurrencies.length > 0) {
            setSelectedCurrencyId(prev => {
                if (prev !== null && availableCurrencies.find(c => c.id === prev)) {
                    return prev; // Keep current selection
                }
                return availableCurrencies[0].id;
            });
        } else {
            setSelectedCurrencyId(null);
        }
    }, [availableCurrencies]);

    // Get the selected currency's internal name (for formatting)
    const selectedCurrencyName = useMemo(() => {
        if (selectedCurrencyId === null) return '';
        const found = availableCurrencies.find(c => c.id === selectedCurrencyId);
        return found?.name || '';
    }, [selectedCurrencyId, availableCurrencies]);

    const selectedCurrencyDisplay = useMemo(() => {
        return CURRENCY_MAP[selectedCurrencyName] || selectedCurrencyName;
    }, [selectedCurrencyName]);

    // Fetch chart data
    const fetchChart = useCallback(async () => {
        if (!selectedLeagueId || selectedCurrencyId === null) return;
        const currId = selectedCurrencyId; // narrow type for closure

        setLoading(true);
        setError(null);

        try {
            let fmtStart = undefined;
            let fmtEnd = undefined;
            if (startDate) {
                const parts = startDate.split('-');
                if (parts.length === 3) fmtStart = `${parts[1]}.${parts[2]}.${parts[0]}`;
            }
            if (endDate) {
                const parts = endDate.split('-');
                if (parts.length === 3) fmtEnd = `${parts[1]}.${parts[2]}.${parts[0]}`;
            }

            const data = await fetchLeagueChartData(selectedLeagueId, currId, fmtStart, fmtEnd);
            setChartData(data);
        } catch (err) {
            console.error('Failed to fetch chart data:', err);
            const msg = err instanceof Error ? err.message : t('charts.fetchError');
            setError(err instanceof ApiError && err.isRateLimit ? t('input.errors.tooManyRequests') : msg);
        } finally {
            setLoading(false);
        }
    }, [selectedLeagueId, selectedCurrencyId, startDate, endDate, t]);

    // Auto-fetch when inputs change
    useEffect(() => {
        if (selectedLeagueId && selectedCurrencyId !== null && !leaguesLoading) {
            fetchChart();
        }
    }, [selectedLeagueId, selectedCurrencyId, startDate, endDate, leaguesLoading, fetchChart]);

    // Render chart
    useEffect(() => {
        if (!canvasRef.current || chartData.length === 0) return;

        // Destroy previous chart
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        const labels = chartData.map(d => {
            const date = new Date(d.date);
            return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        });

        const powerData = chartData.map(d => d.averagePower);
        const payoutData = chartData.map(d => d.averagePayout);

        // Colors
        const powerColor = '#6366f1';
        const payoutColor = '#10b981';
        const powerColorBg = 'rgba(99, 102, 241, 0.1)';
        const payoutColorBg = 'rgba(16, 185, 129, 0.1)';

        // Get CSS variables for theming
        const computedStyle = getComputedStyle(document.documentElement);
        const textColor = computedStyle.getPropertyValue('--text-muted').trim() || '#9ca3af';
        const gridColor = computedStyle.getPropertyValue('--border-color').trim() || 'rgba(255,255,255,0.08)';

        const currName = selectedCurrencyName;

        chartInstanceRef.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels,
                datasets: [
                    {
                        label: t('charts.power'),
                        data: powerData,
                        borderColor: powerColor,
                        backgroundColor: powerColorBg,
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: powerColor,
                        pointBorderColor: '#1e2433',
                        pointBorderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        yAxisID: 'yPower',
                    },
                    {
                        label: t('charts.payout'),
                        data: payoutData,
                        borderColor: payoutColor,
                        backgroundColor: payoutColorBg,
                        borderWidth: 2.5,
                        pointRadius: 3,
                        pointHoverRadius: 6,
                        pointBackgroundColor: payoutColor,
                        pointBorderColor: '#1e2433',
                        pointBorderWidth: 2,
                        tension: 0.35,
                        fill: true,
                        yAxisID: 'yPayout',
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                animation: {
                    duration: 800,
                    easing: 'easeInOutQuart',
                },
                plugins: {
                    legend: {
                        display: false, // We use custom legend below
                    },
                    tooltip: {
                        backgroundColor: 'rgba(30, 36, 51, 0.95)',
                        titleColor: '#e5e7eb',
                        bodyColor: '#d1d5db',
                        borderColor: 'rgba(99, 102, 241, 0.3)',
                        borderWidth: 1,
                        cornerRadius: 8,
                        padding: 12,
                        titleFont: { size: 13, weight: 'bold' },
                        bodyFont: { size: 13 },
                        displayColors: true,
                        callbacks: {
                            title: (tooltipItems) => {
                                const idx = tooltipItems[0].dataIndex;
                                const d = chartData[idx];
                                const date = new Date(d.date);
                                return date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                });
                            },
                            label: (context) => {
                                const value = context.parsed.y ?? 0;
                                if (context.datasetIndex === 0) {
                                    // Power
                                    return ` ${t('charts.power')}: ${formatPowerFromGh(value)}`;
                                } else {
                                    // Payout
                                    return ` ${t('charts.payout')}: ${formatPayoutShort(value, currName)} ${selectedCurrencyDisplay}`;
                                }
                            },
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: textColor,
                            font: { size: 11 },
                            maxRotation: 45,
                            minRotation: 0,
                        },
                        grid: {
                            color: gridColor,
                        },
                    },
                    yPower: {
                        type: 'linear',
                        position: 'left',
                        ticks: {
                            color: powerColor,
                            font: { size: 11 },
                            callback: (value) => formatPowerFromGh(Number(value)),
                        },
                        grid: {
                            color: gridColor,
                        },
                        title: {
                            display: true,
                            text: t('charts.power'),
                            color: powerColor,
                            font: { size: 12, weight: 'bold' },
                        },
                    },
                    yPayout: {
                        type: 'linear',
                        position: 'right',
                        ticks: {
                            color: payoutColor,
                            font: { size: 11 },
                            callback: (value) => formatPayout(Number(value), currName),
                        },
                        grid: {
                            drawOnChartArea: false, // Don't draw grid for right axis
                        },
                        title: {
                            display: true,
                            text: `${t('charts.payout')} (${selectedCurrencyDisplay})`,
                            color: payoutColor,
                            font: { size: 12, weight: 'bold' },
                        },
                    },
                },
            },
        });

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
            }
        };
    }, [chartData, t, lang, selectedCurrencyName, selectedCurrencyDisplay]);

    // Get display name for a currency API name
    const getCurrencyDisplayName = (apiName: string): string => {
        return CURRENCY_MAP[apiName] || apiName;
    };

    // Get icon for a currency
    const getCurrencyIcon = (apiName: string): string | undefined => {
        const display = getCurrencyDisplayName(apiName);
        return COIN_ICONS[display];
    };

    // Get league name by ID
    const selectedLeagueName = useMemo(() => {
        const found = leagues.find(l => l.id === selectedLeagueId);
        return found?.name || '';
    }, [leagues, selectedLeagueId]);

    if (leaguesLoading) {
        return (
            <div className="lc-container">
                <div className="lc-loading">
                    <span className="spinner" />
                    <p>{t('charts.loading')}</p>
                    <Link to={`/${lang}`} className="lc-header-back-btn" style={{ marginTop: '12px' }}>
                        {t('charts.backToCalc')}
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="lc-container">
            {/* Header */}
            <div className="lc-header">
                <Link to={`/${lang}`} className="lc-header-back-btn">
                    {t('charts.backToCalc')}
                </Link>
                <h2 className="lc-title">
                    <span className="lc-title-icon">📈</span>
                    {t('charts.title')}
                </h2>
                <div style={{ width: '140px' }} /> {/* Spacer for centering */}
            </div>

            <p className="lc-desc">{t('charts.desc')}</p>

            {/* Controls */}
            <div className="lc-controls-wrapper">
                <div className="lc-controls">
                        <div className="lc-control-group">
                            <label className="lc-control-label">{t('charts.selectLeague')}</label>
                            <RadixSelect
                                value={selectedLeagueId}
                                onValueChange={setSelectedLeagueId}
                                options={leagues.map(l => ({
                                    value: String(l.id),
                                    label: l.name,
                                    icon: getLeagueImage(String(l.id))
                                }))}
                                placeholder={t('charts.selectLeague')}
                                className="league-select"
                                showSelectedIcon={true}
                                fullWidth={true}
                                triggerClassName="lc-select"
                            />
                        </div>

                        <div className="lc-control-group">
                            <label className="lc-control-label">{t('charts.selectCurrency')}</label>
                            <RadixSelect
                                value={selectedCurrencyId !== null ? String(selectedCurrencyId) : ''}
                                onValueChange={(val) => setSelectedCurrencyId(Number(val))}
                                options={availableCurrencies.map(c => ({
                                    value: String(c.id),
                                    label: CURRENCY_MAP[c.name] || c.name,
                                    icon: COIN_ICONS[CURRENCY_MAP[c.name] || c.name]
                                }))}
                                placeholder={t('charts.selectCurrency')}
                                className="currency-select"
                                disabled={!selectedLeagueId || availableCurrencies.length === 0}
                                fullWidth={true}
                                triggerClassName="lc-select"
                            />
                        </div>

                </div>

                <div className="lc-date-section">
                    <div className="lc-date-header">
                        <label className="lc-control-label">{t('table.customPeriod')}</label>
                        <div className="lc-date-presets">
                            <div
                                className="lc-presets-slider"
                                style={{
                                    transform: `translateX(calc(${activePreset === 'all' ? 0 : activePreset === '7d' ? 1 : 2} * (100% + 4px)))`
                                }}
                            />
                            <button
                                className={`lc-preset-btn ${activePreset === 'all' ? 'active' : ''}`}
                                onClick={() => {
                                    setActivePreset('all');
                                    setStartDate('');
                                    setEndDate('');
                                }}>{t('charts.allTime')}</button>
                            <button
                                className={`lc-preset-btn ${activePreset === '7d' ? 'active' : ''}`}
                                onClick={() => {
                                    setActivePreset('7d');
                                    const end = new Date();
                                    const start = new Date();
                                    start.setDate(end.getDate() - 7);
                                    setEndDate(end.toISOString().split('T')[0]);
                                    setStartDate(start.toISOString().split('T')[0]);
                                }}>{t('charts.7days')}</button>
                            <button
                                className={`lc-preset-btn ${activePreset === '30d' ? 'active' : ''}`}
                                onClick={() => {
                                    setActivePreset('30d');
                                    const end = new Date();
                                    const start = new Date();
                                    start.setDate(end.getDate() - 30);
                                    setEndDate(end.toISOString().split('T')[0]);
                                    setStartDate(start.toISOString().split('T')[0]);
                                }}>{t('charts.30days')}</button>
                        </div>
                    </div>

                    <div className="lc-date-body">
                        <div className="lc-date-group">
                            <label className="lc-date-label">{t('charts.startDate')}</label>
                            <div className="lc-date-inputs">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="lc-date-input"
                                />
                            </div>
                        </div>
                        <div className="lc-date-group">
                            <label className="lc-date-label">{t('charts.endDate')}</label>
                            <div className="lc-date-inputs">
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="lc-date-input"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart Area */}
            <div className="lc-chart-wrapper">
                {error ? (
                    <div className="lc-error">
                        <div className="error-container">
                            <p className="error-message">{error}</p>
                            <button className="retry-btn" onClick={() => window.location.reload()}>{t('charts.retry')}</button>
                        </div>
                    </div>
                ) : loading ? (
                    <div className="lc-loading">
                        <span className="spinner" />
                        <p>{t('charts.loading')}</p>
                    </div>
                ) : !loading && !error && chartData.length === 0 && (selectedLeagueId || selectedCurrencyId) ? (
                    <div className="no-data-container">
                        <p>{t('charts.noData')}</p>
                    </div>
                ) : (
                    <>
                        <div className="lc-chart-header">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <img src={getLeagueImage(selectedLeagueId)} alt="League" style={{ width: '28px', height: '28px' }} />
                                    <h3 className="lc-chart-title" style={{ margin: 0 }}>
                                        {selectedLeagueName} — {selectedCurrencyDisplay}
                                    </h3>
                                </div>
                                <p className="lc-chart-subtitle" style={{ margin: 0 }}>
                                    {t('charts.date')}: {new Date(chartData[0].date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')} – {new Date(chartData[chartData.length - 1].date).toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}
                                </p>
                            </div>
                            {getCurrencyIcon(selectedCurrencyName) && (
                                <img
                                    src={getCurrencyIcon(selectedCurrencyName)}
                                    alt={selectedCurrencyDisplay}
                                    style={{ width: 32, height: 32 }}
                                />
                            )}
                        </div>

                        <div className="lc-chart-canvas-container">
                            <canvas ref={canvasRef} />
                        </div>

                        {/* Custom Legend */}
                        <div className="lc-legend">
                            <div className="lc-legend-item">
                                <span className="lc-legend-dot" style={{ backgroundColor: '#6366f1' }} />
                                {t('charts.power')}
                            </div>
                            <div className="lc-legend-item">
                                <span className="lc-legend-dot" style={{ backgroundColor: '#10b981' }} />
                                {t('charts.payout')} ({selectedCurrencyDisplay})
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
