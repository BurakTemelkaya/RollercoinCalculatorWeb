import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import i18n from '../i18n';
import { fetchDailyBonusQuestList } from '../services/dailyBonusQuestApi';
import { getCurrencyConfig } from '../data/currencies';
import { COIN_ICONS } from '../utils/constants';
import type { DailyBonusQuest } from '../types/dailyBonusQuest';
import type { PaginatedResponse } from '../types/pagination';
import xpIcon from '../assets/items/xp.png';
import Pagination from './Pagination';
import './DailyBonusQuestHistory.css';

const PAGE_SIZE = 10;

function formatAmount(amount: number, currencyName?: string): string {
    if (!currencyName) return String(amount);
    const config = getCurrencyConfig(currencyName);
    const divisor = config?.to_small || 1e6;
    const value = amount / divisor;
    if (value >= 1) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
    return value.toLocaleString('en-US', { maximumFractionDigits: 6 });
}

function formatDate(dateStr: string, locale: string): string {
    const date = new Date(
        dateStr && !dateStr.endsWith('Z') && !dateStr.includes('+')
            ? dateStr + 'Z'
            : dateStr
    );
    return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
}

/** Replace template placeholders */
function resolveTitle(title: string, quest: DailyBonusQuest): string {
    let result = title;
    const countDisplay = formatAmount(quest.countRepeats, quest.replaceConfigCurrency || 'RLT');
    result = result.replace(/\{count_repeats\}/g, countDisplay);
    result = result.replace(/\{reward\}/g, '...');

    if (quest.additionalData) {
        for (const [key, value] of Object.entries(quest.additionalData)) {
            const keyWithBraces = key.startsWith('{') ? key : `{${key}}`;
            result = result.replace(new RegExp(keyWithBraces.replace(/[{}]/g, '\\$&'), 'g'), value);
        }
    }

    return result;
}

export default function DailyBonusQuestHistory() {
    const { lang } = useParams<{ lang: string }>();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10) - 1;
    const [currentPage, setCurrentPage] = useState<number>(Math.max(0, pageFromUrl));
    const [data, setData] = useState<PaginatedResponse<DailyBonusQuest> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dateLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchDailyBonusQuestList(currentPage, PAGE_SIZE);
                setData(result);
            } catch (err) {
                console.error('Failed to fetch quest list:', err);
                setError(err instanceof Error ? err.message : t('dailyQuest.fetchError'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentPage, t]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSearchParams({ page: String(page + 1) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="dbqh-container">
            {/* Header */}
            <div className="dbqh-header">
                <div className="dbqh-header-left">
                    <Link to={`/${lang}`} className="pe-header-back-btn">
                        {t('event.backToCalc')}
                    </Link>
                </div>

                <h2 className="dbqh-title">📋 {t('dailyQuest.questHistory')}</h2>

                <div className="dbqh-header-right">
                    {data && (
                        <span className="dbqh-count">
                            {t('dailyQuest.totalQuests', { count: data.count })}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="dbqh-loading">
                    <span className="spinner" />
                    <p>{t('dailyQuest.loading')}</p>
                </div>
            ) : error ? (
                <div className="dbqh-error">
                    <span className="pe-error-icon">⚠️</span>
                    <p>{t('dailyQuest.fetchError')}: {error}</p>
                    <button className="btn-primary" onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchDailyBonusQuestList(currentPage, PAGE_SIZE)
                            .then(setData)
                            .catch(e => setError(e instanceof Error ? e.message : t('dailyQuest.fetchError')))
                            .finally(() => setLoading(false));
                    }}>
                        {t('event.retry')}
                    </button>
                </div>
            ) : data && data.items.length > 0 ? (
                <>
                    <div className="dbqh-grid">
                        {data.items.map((quest, index) => {
                            const isFirst = currentPage === 0 && index === 0;
                            const title = resolveTitle(quest.title, quest);

                            return (
                                <div
                                    key={quest.id}
                                    className={`dbqh-card ${isFirst ? 'dbqh-card-latest' : ''}`}
                                >
                                    <div className="dbqh-card-header">
                                        <span className="dbq-tag">BONUS</span>
                                        <span className="dbqh-card-title">{title}</span>
                                        {isFirst && (
                                            <span className="dbqh-badge-latest">{t('event.latest')}</span>
                                        )}
                                    </div>

                                    {/* Rewards */}
                                    <div className="dbqh-card-rewards">
                                        {quest.dailyBonusQuestRewards.map((reward, i) => (
                                            <div key={i} className="dbqh-reward-item">
                                                {reward.type === 'season_xp' ? (
                                                    <>
                                                        <img src={xpIcon} alt="XP" className="dbqh-reward-icon" />
                                                        <span>{reward.amount} XP</span>
                                                    </>
                                                ) : reward.type === 'money' && reward.currency ? (
                                                    <>
                                                        {COIN_ICONS[reward.currency.name] && (
                                                            <img src={COIN_ICONS[reward.currency.name]} alt={reward.currency.name} className="dbqh-reward-icon" />
                                                        )}
                                                        <span>{formatAmount(reward.amount, reward.currency.name)} {reward.currency.name}</span>
                                                    </>
                                                ) : null}
                                            </div>
                                        ))}
                                    </div>

                                    {/* Meta */}
                                    <div className="dbqh-card-meta">
                                        <div className="dbqh-card-date">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {formatDate(quest.createdDate, dateLocale)}
                                        </div>
                                        <div className="dbqh-card-config">
                                            {quest.replaceConfigIsAvailable && (
                                                <span className="dbqh-config-tag">
                                                    ⇄ {formatAmount(quest.replaceConfigPrice, quest.replaceConfigCurrency)} {quest.replaceConfigCurrency}
                                                </span>
                                            )}
                                            {quest.paidConfigIsAvailable && (
                                                <span className="dbqh-config-tag">
                                                    ▸▸ {formatAmount(quest.paidConfigPrice, quest.paidConfigCurrency)} {quest.paidConfigCurrency}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <Pagination
                        currentPage={data.index}
                        totalPages={data.pages}
                        hasPrevious={data.hasPrevious}
                        hasNext={data.hasNext}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : (
                <div className="dbqh-empty">
                    <span style={{ fontSize: '48px' }}>📭</span>
                    <p>{t('dailyQuest.noQuests')}</p>
                </div>
            )}
        </div>
    );
}
