import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { eventPathSegment, fetchProgressionEventList } from '../services/progressionEventApi';
import type { ProgressionEventListItem } from '../types/progressionEvent';
import type { PaginatedResponse } from '../types/pagination';
import { fetchPuzzleEventList } from '../services/puzzleEventApi';
import { useLatestEventPath, useLatestPuzzlePath } from '../hooks/useLatestEventPath';
import { getCdnBaseUrl } from '../config/api';
import Pagination from './Pagination';
import './ProgressionEvent.css';
import './ProgressionEventHistory.css';

const PAGE_SIZE = 10;

/** Which history is shown; `?type=puzzle` selects the puzzle events. */
type EventKind = 'progression' | 'puzzle';

/** Puzzle rows carry their banner URL; progression banners are derived from the id. */
type EventRow = ProgressionEventListItem & { headerImg?: string | null; headerImgPath?: string | null };

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
    const latestEventPath = useLatestEventPath(lang ?? i18n.language);
    const latestPuzzlePath = useLatestPuzzlePath(lang ?? i18n.language);
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    const kind: EventKind = searchParams.get('type') === 'puzzle' ? 'puzzle' : 'progression';
    const fetchList: (pageIndex: number, pageSize: number) => Promise<PaginatedResponse<EventRow>> =
        kind === 'puzzle' ? fetchPuzzleEventList : fetchProgressionEventList;
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10) - 1;
    // Read from the URL (not component state) so the menu links, the tabs and the back button all land on the right page
    const currentPage = Math.max(0, pageFromUrl);
    const [data, setData] = useState<PaginatedResponse<EventRow> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const dateLocale = i18n.language || 'en-US';

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                setError(null);
                const result = await fetchList(currentPage, PAGE_SIZE);
                setData(result);
            } catch (err) {
                console.error('Failed to fetch event list:', err);
                setError(err instanceof Error ? err.message : t('event.fetchError'));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [currentPage, fetchList, t]);

    const handlePageChange = (page: number) => {
        setSearchParams({ ...(kind === 'puzzle' ? { type: 'puzzle' } : {}), page: String(page + 1) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleKindChange = (next: EventKind) => {
        if (next === kind) return;
        setSearchParams(next === 'puzzle' ? { type: 'puzzle' } : {});
    };

    return (
        <div className="peh-container">
            <>
                <title>{`${t('event.eventHistory')} | RollerCoin Calculator`}</title>
                <meta name="description" content={t('event.historyDesc', 'History of past RollerCoin Progression Events')} />
                <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/events`} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${t('event.eventHistory')} | RollerCoin Calculator`} />
                <meta property="og:description" content={t('event.historyDesc', 'History of past RollerCoin Progression Events')} />
                <meta property="og:url" content={`https://rollercoincalculator.app/${lang}/events`} />
                <meta property="og:image" content="https://rollercoincalculator.app/icon.png" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={`${t('event.eventHistory')} | RollerCoin Calculator`} />
                <meta name="twitter:description" content={t('event.historyDesc', 'History of past RollerCoin Progression Events')} />
                <meta name="twitter:image" content="https://rollercoincalculator.app/icon.png" />
            </>
            {/* Header */}
            <div className="peh-header">
                <div className="peh-header-left">
                    <Link to={`/${lang}`} className="pe-header-back-btn">
                        {t('event.backToCalc')}
                    </Link>
                    <Link to={kind === 'puzzle' ? latestPuzzlePath : latestEventPath} className="pe-header-back-btn peh-current-event-btn">
                        {kind === 'puzzle' ? `🧩 ${t('puzzle.title')}` : `🎉 ${t('tabs.event')}`}
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

            <div className="pe-tabs peh-kind-tabs" role="tablist">
                {/* lang="en": the tabs are upper-cased by CSS, and Turkish casing would turn this name into "PROGRESSİON" */}
                <button type="button" role="tab" lang="en" aria-selected={kind === 'progression'} className={`pe-tab ${kind === 'progression' ? 'active' : ''}`} onClick={() => handleKindChange('progression')}>
                    Progression Event
                </button>
                <button type="button" role="tab" aria-selected={kind === 'puzzle'} className={`pe-tab ${kind === 'puzzle' ? 'active' : ''}`} onClick={() => handleKindChange('puzzle')}>
                    {t('puzzle.title')}
                </button>
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
                        fetchList(currentPage, PAGE_SIZE)
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
                                    to={`/${lang}/${kind === 'puzzle' ? 'puzzle' : 'event'}/${eventPathSegment(event)}`}
                                    className={`peh-card ${isFirst ? 'peh-card-latest' : ''}`}
                                >
                                    <div className="peh-card-banner">
                                        <img
                                            src={(event.headerImgPath ? `${getCdnBaseUrl()}/${event.headerImgPath}` : event.headerImg) ?? `${getCdnBaseUrl()}/pe/${event.id}/progression-event-modal-bg.png`}
                                            alt=""
                                            width={648}
                                            height={192}
                                            loading={index < 2 ? 'eager' : 'lazy'}
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                if (kind === 'puzzle') {
                                                    // Our copy missing: try Rollercoin's original; if that fails too, show the plain card
                                                    if (event.headerImg && target.src !== event.headerImg) target.src = event.headerImg;
                                                    else target.style.display = 'none';
                                                } else if (!target.src.includes('static.rollercoin.com')) {
                                                    target.src = `https://static.rollercoin.com/static/img/pe/${event.id}/progression-event-modal-bg.png?v=1`;
                                                }
                                            }}
                                        />
                                        <div className="peh-card-header">
                                            <span className="peh-card-name">{event.name}</span>
                                            {isFirst && (
                                                <span className="peh-badge-latest">{t('event.latest')}</span>
                                            )}
                                        </div>
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
                                        {event.totalPoint != null && event.totalPoint > 0 && (
                                            <div className="peh-card-duration peh-card-points" style={{ marginLeft: 'auto' }}>
                                                🏆 {event.totalPoint.toLocaleString()}
                                            </div>
                                        )}
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
