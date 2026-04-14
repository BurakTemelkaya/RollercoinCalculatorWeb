import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchProgressionEventList } from '../services/progressionEventApi';
import type { ProgressionEventListItem } from '../types/progressionEvent';
import type { PaginatedResponse } from '../types/pagination';
import { buildEventSlug } from '../utils/slugUtils';
import Pagination from './Pagination';
import './ProgressionEvent.css';
import './ProgressionEventHistory.css';

const PAGE_SIZE = 10;

function formatEventDate(dateStr: string, locale: string): string {
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

function formatEventDateRange(createdDate: string, endDate: string): string {
    const start = new Date(
        createdDate && !createdDate.endsWith('Z') && !createdDate.includes('+')
            ? createdDate + 'Z'
            : createdDate
    );
    const end = new Date(
        endDate && !endDate.endsWith('Z') && !endDate.includes('+')
            ? endDate + 'Z'
            : endDate
    );
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.round(diffMs / 86400000);
    return `${diffDays}`;
}

export default function ProgressionEventHistory() {
    const { lang } = useParams<{ lang: string }>();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10) - 1;
    const [currentPage, setCurrentPage] = useState<number>(Math.max(0, pageFromUrl));
    const [data, setData] = useState<PaginatedResponse<ProgressionEventListItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dateLocale = i18n.language === 'tr' ? 'tr-TR' : 'en-US';

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchProgressionEventList(currentPage, PAGE_SIZE);
                setData(result);
            } catch (err) {
                console.error('Failed to fetch event list:', err);
                setError(err instanceof Error ? err.message : t('event.fetchError'));
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
        <div className="peh-container">
            {/* Header */}
            <div className="peh-header">
                <div className="peh-header-left">
                    <Link to={`/${lang}`} className="pe-header-back-btn">
                        {t('event.backToCalc')}
                    </Link>
                    <Link to={`/${lang}/event`} className="pe-header-back-btn peh-current-event-btn">
                        🎉 {t('tabs.event')}
                    </Link>
                </div>

                <h2 className="peh-title">📋 {t('event.eventHistory')}</h2>

                <div className="peh-header-right">
                    {data && (
                        <span className="peh-count">
                            {t('event.totalEvents', { count: data.count })}
                        </span>
                    )}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="peh-loading">
                    <span className="spinner" />
                    <p>{t('event.loading')}</p>
                </div>
            ) : error ? (
                <div className="peh-error">
                    <span className="pe-error-icon">⚠️</span>
                    <p>{t('event.fetchError')}: {error}</p>
                    <button className="btn-primary" onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchProgressionEventList(currentPage, PAGE_SIZE)
                            .then(setData)
                            .catch(e => setError(e instanceof Error ? e.message : t('event.fetchError')))
                            .finally(() => setLoading(false));
                    }}>
                        {t('event.retry')}
                    </button>
                </div>
            ) : data && data.items.length > 0 ? (
                <>
                    <div className="peh-grid">
                        {data.items.map((event, index) => {
                            const durationDays = formatEventDateRange(event.createdDate, event.endDate);
                            const isFirst = currentPage === 0 && index === 0;

                            return (
                                <Link
                                    key={event.id}
                                    to={`/${lang}/event/${buildEventSlug(event.name, event.id)}`}
                                    className={`peh-card ${isFirst ? 'peh-card-latest' : ''}`}
                                >
                                    <div className="peh-card-header">
                                        <span className="peh-card-name">{event.name}</span>
                                        {isFirst && (
                                            <span className="peh-badge-latest">{t('event.latest')}</span>
                                        )}
                                    </div>
                                    <div className="peh-card-meta">
                                        <div className="peh-card-date">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                                <line x1="16" y1="2" x2="16" y2="6" />
                                                <line x1="8" y1="2" x2="8" y2="6" />
                                                <line x1="3" y1="10" x2="21" y2="10" />
                                            </svg>
                                            {formatEventDate(event.createdDate, dateLocale)} — {formatEventDate(event.endDate, dateLocale)}
                                        </div>
                                        <div className="peh-card-duration">
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <circle cx="12" cy="12" r="10" />
                                                <polyline points="12 6 12 12 16 14" />
                                            </svg>
                                            {durationDays} {t('event.days')}
                                        </div>
                                    </div>
                                    <div className="peh-card-action">
                                        {t('event.viewDetails')}
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="9 18 15 12 9 6" />
                                        </svg>
                                    </div>
                                </Link>
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
                <div className="peh-empty">
                    <span style={{ fontSize: '48px' }}>📭</span>
                    <p>{t('event.noEvents')}</p>
                </div>
            )}
        </div>
    );
}
