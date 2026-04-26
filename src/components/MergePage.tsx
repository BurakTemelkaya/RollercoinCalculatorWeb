import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchMerges, fetchMergeById } from '../services/mergeApi';
import type { MergeListItem, MergeDetail, MergeListParams } from '../types/merge';
import type { PaginatedResponse } from '../types/pagination';
import { autoScalePower } from '../utils/powerParser';
import Pagination from './Pagination';
import './MergePage.css';

// Local mutation component images for detail view
import commonHashboardImg from '../assets/items/common_hashboard.png';
import commonWireImg from '../assets/items/common_wire.png';
import commonFanImg from '../assets/items/common_fan.png';
import uncommonHashboardImg from '../assets/items/uncommon_hashboard.png';
import uncommonWireImg from '../assets/items/uncommon_wire.png';
import uncommonFanImg from '../assets/items/uncommon_fan.png';
import rareHashboardImg from '../assets/items/rare_hashboard.png';
import rareWireImg from '../assets/items/rare_wire.png';
import rareFanImg from '../assets/items/rare_fan.png';
import epicHashboardImg from '../assets/items/epic_hashboard.png';
import epicWireImg from '../assets/items/epic_wire.png';
import epicFanImg from '../assets/items/epic_fan.png';
import legendaryHashboardImg from '../assets/items/legendary_hashboard.png';
import legendaryWireImg from '../assets/items/legendary_wire.png';
import legendaryFanImg from '../assets/items/legendary_fan.png';

// Component cases
import fansCaseImg from '../assets/items/fans_case_7bfde88d-fc4c-414f-a539-2ee2673ad216.png';
import hashboardCaseImg from '../assets/items/hashboard_case_1116df97-ed73-4baf-a0d8-76a9cb7cf588.png';
import wiresCaseImg from '../assets/items/wires_case_855b977d-950c-45e3-a315-b20be4a052ab.png';

import rltImg from '../assets/coins/rlt.svg';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/** Builds a CDN URL for a miner GIF by filename, with optional version cache-buster */
function getMinerImageUrl(fileName: string, imageVersion?: number): string {
    const base = `https://static.rollercoin.com/static/img/market/miners/${fileName}.gif`;
    return imageVersion ? `${base}?v=${imageVersion}` : base;
}

/** Builds the Rollercoin CDN level icon URL (only for level > 1) */
function getLevelIconUrl(level: number): string {
    return `https://rollercoin.com/static/img/storage/rarity_icons/level_${level}.png?v=1.0.0`;
}

/** Formats raw API amount to RLT display value */
function formatRltAmount(rawAmount: number): string {
    const rlt = rawAmount / 1e6;
    if (rlt >= 1000) {
        return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
}

/** Formats power from Gh/s to human-readable */
function formatPower(powerGhs: number): string {
    if (!powerGhs) return '0 H/s';
    const baseValue = powerGhs * 1e9;
    const scaled = autoScalePower(baseValue);
    const formatted = scaled.value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return `${formatted} ${scaled.unit}/s`;
}

/** Gets local image for mutation components by name and level */
function getMutationComponentImage(itemName: string, level?: number): string | null {
    const name = itemName.toLowerCase();

    // Check by explicitly provided level first (0=common, 1=uncommon, 2=rare, 3=epic, 4=legendary)
    if (level !== undefined && level !== null) {
        if (level === 4) {
            if (name.includes('fan')) return legendaryFanImg;
            if (name.includes('hashboard') || name.includes('board')) return legendaryHashboardImg;
            if (name.includes('wire') || name.includes('wiring')) return legendaryWireImg;
        } else if (level === 3) {
            if (name.includes('fan')) return epicFanImg;
            if (name.includes('hashboard') || name.includes('board')) return epicHashboardImg;
            if (name.includes('wire') || name.includes('wiring')) return epicWireImg;
        } else if (level === 2) {
            if (name.includes('fan')) return rareFanImg;
            if (name.includes('hashboard') || name.includes('board')) return rareHashboardImg;
            if (name.includes('wire') || name.includes('wiring')) return rareWireImg;
        } else if (level === 1) {
            if (name.includes('fan')) return uncommonFanImg;
            if (name.includes('hashboard') || name.includes('board')) return uncommonHashboardImg;
            if (name.includes('wire') || name.includes('wiring')) return uncommonWireImg;
        } else if (level === 0) {
            if (name.includes('fan')) return commonFanImg;
            if (name.includes('hashboard') || name.includes('board')) return commonHashboardImg;
            if (name.includes('wire') || name.includes('wiring')) return commonWireImg;
        }
    }

    if (name.includes('legendary')) {
        if (name.includes('fan')) return legendaryFanImg;
        if (name.includes('hashboard')) return legendaryHashboardImg;
        if (name.includes('wire') || name.includes('wiring')) return legendaryWireImg;
    }
    if (name.includes('epic')) {
        if (name.includes('fan')) return epicFanImg;
        if (name.includes('hashboard')) return epicHashboardImg;
        if (name.includes('wire') || name.includes('wiring')) return epicWireImg;
    }
    if (name.includes('rare')) {
        if (name.includes('fan')) return rareFanImg;
        if (name.includes('hashboard')) return rareHashboardImg;
        if (name.includes('wire') || name.includes('wiring')) return rareWireImg;
    }
    if (name.includes('uncommon')) {
        if (name.includes('fan')) return uncommonFanImg;
        if (name.includes('hashboard')) return uncommonHashboardImg;
        if (name.includes('wire') || name.includes('wiring')) return uncommonWireImg;
    }

    // Default to common or by type
    if (name.includes('fan')) return commonFanImg;
    if (name.includes('hashboard') || name.includes('board')) return commonHashboardImg;
    if (name.includes('wire') || name.includes('wiring')) return commonWireImg;

    return null;
}

/** Resolves the component case image based on the item name */
function getCaseImage(itemName: string): string | null {
    const name = itemName.toLowerCase();
    if (name.includes('fan')) return fansCaseImg;
    if (name.includes('wire')) return wiresCaseImg;
    if (name.includes('hashboard')) return hashboardCaseImg;
    return null;
}

/** Resolves the proper display name for a component, handling missing rarity prefixes */
function getPartDisplayName(itemName: string, level?: number | null): string {
    let displayName = itemName;
    if (level !== undefined && level !== null) {
        const lowerName = itemName.toLowerCase();
        if (!lowerName.includes('common') && !lowerName.includes('rare') && !lowerName.includes('epic') && !lowerName.includes('legendary')) {
            const rarityMap = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'];
            if (level >= 0 && level <= 4) {
                displayName = `${rarityMap[level]} ${itemName}`;
            }
        }
    }
    return displayName;
}

type SortByOption = 'newest' | 'bonus' | 'percent' | 'name' | 'power';

export default function MergePage() {
    const { lang } = useParams<{ lang: string }>();
    const { t } = useTranslation();
    const [searchParams, setSearchParams] = useSearchParams();

    // State
    const pageFromUrl = parseInt(searchParams.get('page') || '1', 10) - 1;
    const [currentPage, setCurrentPage] = useState<number>(Math.max(0, pageFromUrl));
    const [data, setData] = useState<PaginatedResponse<MergeListItem> | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Search & Sort
    const [searchInput, setSearchInput] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortByOption>('newest');
    const [isDescending, setIsDescending] = useState(true);

    // Detail modal
    const [selectedMerge, setSelectedMerge] = useState<MergeDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);

    // Level Display Mode
    const [levelDisplayMode, setLevelDisplayMode] = useState<'roman' | 'text'>(() => {
        return (localStorage.getItem('rollercoin_web_level_display') as 'roman' | 'text') || 'text';
    });

    const toggleLevelDisplay = () => {
        const newMode = levelDisplayMode === 'roman' ? 'text' : 'roman';
        setLevelDisplayMode(newMode);
        localStorage.setItem('rollercoin_web_level_display', newMode);
    };

    // Custom Part Prices
    const [customPartPrices, setCustomPartPrices] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('rollercoin_web_custom_part_prices');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });
    const [editingPartPrice, setEditingPartPrice] = useState<string | null>(null);
    const [tempPartPrice, setTempPartPrice] = useState<string>('');

    const [isPartPriceModalOpen, setIsPartPriceModalOpen] = useState(false);
    const [tempSettingsPrices, setTempSettingsPrices] = useState<Record<string, string>>({});

    const openPartPriceSettings = () => {
        const stringified: Record<string, string> = {};
        Object.keys(customPartPrices).forEach(key => {
            stringified[key] = customPartPrices[key].toString();
        });
        setTempSettingsPrices(stringified);
        setIsPartPriceModalOpen(true);
    };

    const savePartPriceSettings = () => {
        const next: Record<string, number> = {};
        Object.keys(tempSettingsPrices).forEach(key => {
            if (tempSettingsPrices[key].trim() !== '') {
                const val = parseFloat(tempSettingsPrices[key].replace(',', '.'));
                if (!isNaN(val) && val >= 0) {
                    next[key] = val;
                }
            }
        });
        setCustomPartPrices(next);
        localStorage.setItem('rollercoin_web_custom_part_prices', JSON.stringify(next));
        setIsPartPriceModalOpen(false);
    };

    const handleSavePartPrice = (itemName: string) => {
        const val = parseFloat(tempPartPrice.replace(',', '.'));
        if (!isNaN(val) && val >= 0) {
            setCustomPartPrices(prev => {
                const next = { ...prev, [itemName]: val };
                localStorage.setItem('rollercoin_web_custom_part_prices', JSON.stringify(next));
                return next;
            });
        }
        setEditingPartPrice(null);
    };

    const handleResetPartPrice = (itemName: string) => {
        setCustomPartPrices(prev => {
            const next = { ...prev };
            delete next[itemName];
            localStorage.setItem('rollercoin_web_custom_part_prices', JSON.stringify(next));
            return next;
        });
    };

    // Debounce search
    const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearchChange = useCallback((value: string) => {
        setSearchInput(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setSearchQuery(value);
            setCurrentPage(0);
        }, SEARCH_DEBOUNCE_MS);
    }, []);

    // Fetch list
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                const params: MergeListParams = {
                    pageIndex: currentPage,
                    pageSize: PAGE_SIZE,
                };

                if (searchQuery.trim()) {
                    params.searchName = searchQuery.trim();
                }

                // Map UI sort to API sort
                if (sortBy !== 'newest') {
                    params.sortBy = sortBy;
                }
                // Always pass isDescending so user can reverse the default (newest) list
                params.isDescending = isDescending;

                const result = await fetchMerges(params);
                setData(result);
            } catch (err) {
                console.error('Failed to fetch merges:', err);
                setError(err instanceof Error ? err.message : t('merge.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [currentPage, searchQuery, sortBy, isDescending, t]);

    // Sync page to URL
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSearchParams({ page: String(page + 1) });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Open detail
    const handleCardClick = async (mergeId: string) => {
        try {
            setDetailLoading(true);
            const detail = await fetchMergeById(mergeId);
            setSelectedMerge(detail);
        } catch (err) {
            console.error('Failed to fetch merge detail:', err);
        } finally {
            setDetailLoading(false);
        }
    };

    // Close detail
    const handleCloseDetail = () => {
        setSelectedMerge(null);
    };

    // Close on ESC
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && selectedMerge) {
                handleCloseDetail();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedMerge]);

    // Calculate total parts cost for a detail
    const calcPartsCost = (detail: MergeDetail): number => {
        return detail.requiredItems
            .filter(item => item.type === 'mutation_components')
            .reduce((sum, item) => {
                const defaultPrice = item.price ? item.price / 1e6 : 0;
                const displayName = getPartDisplayName(item.itemName, item.level);
                const customPrice = customPartPrices[displayName];
                const unitPriceRlt = customPrice !== undefined ? customPrice : defaultPrice;
                // Return to 1e6 scale so it matches the original logic that is expected by formatRltAmount
                return sum + (item.count * (unitPriceRlt * 1e6));
            }, 0);
    };

    return (
        <div className="merge-container">
            {/* Header */}
            <div className="merge-header">
                <div className="merge-header-left">
                    <Link to={`/${lang}`} className="merge-back-btn">
                        {t('merge.backToCalc')}
                    </Link>
                </div>

                <h2 className="merge-title">🔧 {t('merge.title')}</h2>

                <div className="merge-header-right">
                    {data && (
                        <span className="merge-count">
                            {data.count.toLocaleString()} {t('merge.title').toLowerCase()}
                        </span>
                    )}
                </div>
            </div>

            {/* Controls */}
            <div className="merge-controls">
                <div className="merge-search-wrapper">
                    <span className="merge-search-icon">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="11" cy="11" r="8" />
                            <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                    </span>
                    <input
                        type="text"
                        className="merge-search"
                        placeholder={t('merge.search')}
                        value={searchInput}
                        onChange={(e) => handleSearchChange(e.target.value)}
                    />
                </div>

                <div className="merge-sort-group">
                    <select
                        className="merge-sort-select"
                        value={sortBy}
                        onChange={(e) => {
                            setSortBy(e.target.value as SortByOption);
                            setCurrentPage(0);
                        }}
                    >
                        <option value="newest">{t('merge.sortOptions.newest')}</option>
                        <option value="name">{t('merge.sortOptions.name')}</option>
                        <option value="power">{t('merge.sortOptions.power')}</option>
                        <option value="bonus">{t('merge.sortOptions.bonus')}</option>
                        <option value="percent">{t('merge.sortOptions.percent')}</option>
                    </select>

                    <button
                        className={`merge-sort-dir-btn ${isDescending ? 'desc' : 'asc'}`}
                        onClick={() => setIsDescending(!isDescending)}
                        title={isDescending ? t('merge.descending') : t('merge.ascending')}
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 5v14M19 12l-7 7-7-7" />
                        </svg>
                    </button>

                    <button
                        className="merge-sort-dir-btn"
                        onClick={toggleLevelDisplay}
                        title={t('merge.toggleLevelDisplay', 'Seviye Görünümünü Değiştir (Lv / Roma)')}
                        style={{ minWidth: '40px', fontWeight: 'bold', gap: '6px' }}
                    >
                        <span style={{ fontSize: '12px' }}>👁️</span>
                        {levelDisplayMode === 'roman' ? (
                            <img
                                src={getLevelIconUrl(2)}
                                alt="Roman"
                                style={{ width: '18px', height: '12px', objectFit: 'contain' }}
                            />
                        ) : (
                            <span style={{
                                background: '#4f46e5',
                                color: 'white',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '2px 4px',
                                borderRadius: '4px',
                                lineHeight: 1,
                                border: '1px solid rgba(255,255,255,0.2)',
                                display: 'inline-block'
                            }}>
                                Lv.2
                            </span>
                        )}
                    </button>

                    <button
                        className="merge-sort-dir-btn"
                        onClick={openPartPriceSettings}
                        title={t('merge.partPrices', 'Parça Fiyatları')}
                        style={{ minWidth: '40px', fontWeight: 'bold' }}
                    >
                        ⚙️
                    </button>
                </div>
            </div>

            {/* Content */}
            {error ? (
                <div className="merge-error">
                    <span className="pe-error-icon">⚠️</span>
                    <p>{t('merge.fetchError')}: {error}</p>
                    <button className="btn-primary" onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchMerges({ pageIndex: currentPage, pageSize: PAGE_SIZE })
                            .then(setData)
                            .catch(e => setError(e instanceof Error ? e.message : t('merge.fetchError')))
                            .finally(() => setLoading(false));
                    }}>
                        {t('event.retry')}
                    </button>
                </div>
            ) : data && data.items.length > 0 ? (
                <>
                    <div className="merge-grid" style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s ease', pointerEvents: loading ? 'none' : 'auto' }}>
                        {data.items.map((item) => (
                            <div
                                key={item.id}
                                className="merge-card"
                                onClick={() => handleCardClick(item.id)}
                            >
                                <div className="merge-card-img-wrap">
                                    {(item.resultItemLevel + 1) > 1 && (
                                        levelDisplayMode === 'roman' ? (
                                            <img
                                                src={getLevelIconUrl(item.resultItemLevel + 1)}
                                                alt={`Level ${item.resultItemLevel + 1}`}
                                                className="merge-card-level-img"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="merge-card-level-text">Lv.{item.resultItemLevel + 1}</span>
                                        )
                                    )}
                                    <img
                                        src={getMinerImageUrl(item.resultItemFileName, item.resultItemImageVersion || undefined)}
                                        alt={item.resultItemName}
                                        className="merge-card-img"
                                        loading="lazy"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.style.display = 'none';
                                            const parent = target.parentElement;
                                            if (parent && !parent.querySelector('.merge-card-fallback')) {
                                                const span = document.createElement('span');
                                                span.className = 'merge-card-fallback';
                                                span.textContent = '⛏️';
                                                parent.appendChild(span);
                                            }
                                        }}
                                    />
                                </div>

                                <span className="merge-card-name">{item.resultItemName}</span>

                                <div className="merge-card-stats">
                                    <div className="merge-card-stat">
                                        <span>{t('merge.cost')}</span>
                                        <span className="merge-card-stat-value merge-card-cost">
                                            {formatRltAmount(item.amount)} RLT
                                        </span>
                                    </div>
                                    {item.discountedAmount < item.amount && (
                                        <div className="merge-card-stat">
                                            <span>{t('merge.discountedCost')}</span>
                                            <span className="merge-card-stat-value merge-card-cost" style={{ color: '#10b981' }}>
                                                {formatRltAmount(item.discountedAmount)} RLT
                                            </span>
                                        </div>
                                    )}
                                    {item.resultItemPower > 0 && (
                                        <div className="merge-card-stat">
                                            <span>⚡ {t('merge.sortOptions.power')}</span>
                                            <span className="merge-card-stat-value">
                                                {formatPower(item.resultItemPower)}
                                            </span>
                                        </div>
                                    )}
                                    {item.resultItemBonus > 0 && (
                                        <div className="merge-card-stat">
                                            <span>🎯 {t('merge.sortOptions.bonus')}</span>
                                            <span className="merge-card-stat-value" style={{ color: '#a78bfa' }}>
                                                {(item.resultItemBonus / 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    )}
                                    {item.resultItemPercent > 0 && (
                                        <div className="merge-card-stat">
                                            <span>📊 {t('merge.sortOptions.percent')}</span>
                                            <span className="merge-card-stat-value" style={{ color: '#38bdf8' }}>
                                                {(item.resultItemPercent / 100).toFixed(2)}%
                                            </span>
                                        </div>
                                    )}
                                    <div className="merge-card-stat">
                                        <span>XP</span>
                                        <span className="merge-card-stat-value merge-card-xp">
                                            +{item.xpReward.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <Pagination
                        currentPage={data.index}
                        totalPages={data.pages}
                        hasPrevious={data.hasPrevious}
                        hasNext={data.hasNext}
                        onPageChange={handlePageChange}
                    />
                </>
            ) : loading ? (
                <div className="merge-loading">
                    <span className="spinner" />
                    <p>{t('merge.loading')}</p>
                </div>
            ) : (
                <div className="merge-empty">
                    <span style={{ fontSize: '48px' }}>🔍</span>
                    <p>{t('merge.noResults')}</p>
                </div>
            )}

            {/* Detail Loading Overlay */}
            {detailLoading && (
                <div className="merge-detail-overlay" onClick={() => setDetailLoading(false)}>
                    <div className="merge-loading" onClick={e => e.stopPropagation()}>
                        <span className="spinner" />
                    </div>
                </div>
            )}

            {/* Detail Modal */}
            {selectedMerge && (
                <div className="merge-detail-overlay" onClick={handleCloseDetail}>
                    <div className="merge-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="merge-detail-header">
                            <h3>{selectedMerge.resultItemName}</h3>
                            <button className="merge-detail-close" onClick={handleCloseDetail}>×</button>
                        </div>

                        <div className="merge-detail-body">
                            {/* Result Miner */}
                            <div className="merge-result-section">
                                <div style={{ position: 'relative', display: 'inline-flex', flexShrink: 0 }}>
                                    {(selectedMerge.resultItemLevel + 1) > 1 && (
                                        levelDisplayMode === 'roman' ? (
                                            <img
                                                src={getLevelIconUrl(selectedMerge.resultItemLevel + 1)}
                                                alt={`Level ${selectedMerge.resultItemLevel + 1}`}
                                                className="merge-card-level-img"
                                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                            />
                                        ) : (
                                            <span className="merge-card-level-text">Lv.{selectedMerge.resultItemLevel + 1}</span>
                                        )
                                    )}
                                    {selectedMerge.resultItemFileName ? (
                                        <img
                                            src={getMinerImageUrl(selectedMerge.resultItemFileName, selectedMerge.resultItemImageVersion || undefined)}
                                            alt={selectedMerge.resultItemName}
                                            className="merge-result-img"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <span style={{ fontSize: '48px' }}>⛏️</span>
                                    )}
                                </div>
                                <div className="merge-result-info">
                                    <span className="merge-result-name">{selectedMerge.resultItemName}</span>
                                    <div className="merge-result-meta">
                                        <span>📊 Lv.{selectedMerge.resultItemLevel + 1}</span>
                                        <span>
                                            <img src={rltImg} alt="RLT" width="16" height="16" style={{ borderRadius: '50%' }} />
                                            <span className="cost-value">{formatRltAmount(selectedMerge.amount)} RLT</span>
                                        </span>
                                        {selectedMerge.discountedAmount < selectedMerge.amount && (
                                            <span style={{ color: '#10b981' }}>
                                                ({t('merge.discountedCost')}: {formatRltAmount(selectedMerge.discountedAmount)})
                                            </span>
                                        )}
                                        {selectedMerge.resultItemPower > 0 && (
                                            <span>⚡ {formatPower(selectedMerge.resultItemPower)}</span>
                                        )}
                                        {selectedMerge.resultItemBonus > 0 && (
                                            <span style={{ color: '#a78bfa' }}>🎯 {(selectedMerge.resultItemBonus / 100).toFixed(2)}%</span>
                                        )}
                                        {selectedMerge.resultItemPercent > 0 && (
                                            <span style={{ color: '#38bdf8' }}>📊 {(selectedMerge.resultItemPercent / 100).toFixed(2)}%</span>
                                        )}
                                        <span>
                                            <span className="xp-value">+{selectedMerge.xpReward.toLocaleString()} XP</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Required Items */}
                            <h4 className="merge-required-title">{t('merge.requiredItems')}</h4>
                            <div className="merge-required-list">
                                {selectedMerge.requiredItems.map((item, idx) => {
                                    const isMiner = item.type === 'miners';
                                    const isMutationComponent = item.type === 'mutation_components';
                                    
                                    // Determine display name first
                                    let displayName = isMiner ? item.itemName : getPartDisplayName(item.itemName, item.level);
                                    
                                    const defaultUnitPrice = item.price ? item.price / 1e6 : null;
                                    const customPrice = customPartPrices[displayName];
                                    const unitPriceRlt = isMutationComponent ? (customPrice !== undefined ? customPrice : defaultUnitPrice) : null;
                                    
                                    const totalItemCost = unitPriceRlt !== null ? unitPriceRlt * item.count : null;

                                    // Image for this required item
                                    let imgSrc: string | null = null;

                                    if (isMiner && item.fileName) {
                                        imgSrc = getMinerImageUrl(item.fileName, item.imageVersion || undefined);
                                    } else if (isMutationComponent) {
                                        imgSrc = getMutationComponentImage(item.itemName, item.level);
                                    }

                                    // Required miner level: use API level, fallback to resultItemLevel - 1
                                    const reqMinerLevel = isMiner
                                        ? (item.level > 0 ? item.level : Math.max(0, selectedMerge.resultItemLevel - 1)) + 1
                                        : 0;

                                    return (
                                        <div key={`${item.itemId}-${idx}`} className="merge-required-item">
                                            <div className="merge-req-img-wrap">
                                                {isMiner && reqMinerLevel > 1 && (
                                                    levelDisplayMode === 'roman' ? (
                                                        <img
                                                            src={getLevelIconUrl(reqMinerLevel)}
                                                            alt={`Level ${reqMinerLevel}`}
                                                            className="merge-req-level-img"
                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        />
                                                    ) : (
                                                        <span className="merge-req-level-text">Lv.{reqMinerLevel}</span>
                                                    )
                                                )}
                                                {imgSrc ? (
                                                    <img
                                                        src={imgSrc}
                                                        alt={displayName}
                                                        className="merge-req-img"
                                                        loading="lazy"
                                                        onError={(e) => {
                                                            const target = e.target as HTMLImageElement;
                                                            target.style.display = 'none';
                                                            const parent = target.parentElement;
                                                            if (parent && !parent.querySelector('.merge-req-fallback')) {
                                                                const span = document.createElement('span');
                                                                span.className = 'merge-req-fallback';
                                                                span.textContent = isMiner ? '⛏️' : '🔩';
                                                                parent.appendChild(span);
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <span className="merge-req-fallback">{isMiner ? '⛏️' : '🔩'}</span>
                                                )}
                                            </div>
                                            <div className="merge-req-info">
                                                <span className="merge-req-name">{displayName}</span>
                                                <span className="merge-req-type">
                                                    {isMiner ? 'Miner' : t('merge.component')}
                                                </span>
                                                {isMiner && (
                                                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                                        {item.power != null && item.power > 0 && <>⚡ {formatPower(item.power)}</>}
                                                        {item.power != null && item.power > 0 && item.percent != null && item.percent > 0 && ' | '}
                                                        {item.percent != null && item.percent > 0 && <span style={{ color: '#a78bfa' }}>🎯 {(item.percent / 100).toFixed(2)}%</span>}
                                                    </span>
                                                )}
                                                {isMutationComponent && item.level === 0 && (
                                                    <div style={{
                                                        marginTop: '8px',
                                                        padding: '8px 10px',
                                                        background: 'rgba(56, 189, 248, 0.08)',
                                                        borderRadius: '8px',
                                                        border: '1px solid rgba(56, 189, 248, 0.2)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px'
                                                    }}>
                                                        {getCaseImage(item.itemName) ? (
                                                            <img
                                                                src={getCaseImage(item.itemName)!}
                                                                alt={`${item.itemName} Case`}
                                                                style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                                                            />
                                                        ) : (
                                                            <span style={{ fontSize: '24px' }}>📦</span>
                                                        )}
                                                        <span style={{ fontSize: '13px', color: '#38bdf8', fontWeight: '600' }}>
                                                            {t('merge.caseAlternative', { boxes: Math.ceil(item.count / 200), rst: Math.ceil(item.count / 200) * 40 })}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="merge-req-counts">
                                                <span className="merge-req-qty">×{item.count}</span>
                                                {unitPriceRlt !== null ? (
                                                    <>
                                                        <span className="merge-req-price">
                                                            {t('merge.unitPrice')}: {editingPartPrice === displayName ? (
                                                                <input 
                                                                    autoFocus
                                                                    value={tempPartPrice}
                                                                    onChange={e => setTempPartPrice(e.target.value)}
                                                                    onBlur={() => handleSavePartPrice(displayName)}
                                                                    onKeyDown={e => {
                                                                        if (e.key === 'Enter') handleSavePartPrice(displayName);
                                                                        if (e.key === 'Escape') setEditingPartPrice(null);
                                                                    }}
                                                                    style={{
                                                                        width: '60px', 
                                                                        padding: '2px 4px', 
                                                                        background: 'rgba(0,0,0,0.2)', 
                                                                        border: '1px solid var(--accent-primary)', 
                                                                        color: 'white',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <span style={{ 
                                                                        color: customPrice !== undefined ? '#f59e0b' : 'inherit',
                                                                        fontWeight: customPrice !== undefined ? 'bold' : 'normal'
                                                                    }}>
                                                                        {unitPriceRlt.toFixed(4)} RLT
                                                                    </span>
                                                                    <span 
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingPartPrice(displayName);
                                                                            setTempPartPrice(unitPriceRlt.toString());
                                                                        }}
                                                                        style={{ cursor: 'pointer', marginLeft: '4px', opacity: 0.7 }}
                                                                        title="Düzenle"
                                                                    >✏️</span>
                                                                    {customPrice !== undefined && (
                                                                        <span 
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                handleResetPartPrice(displayName);
                                                                            }}
                                                                            style={{ cursor: 'pointer', marginLeft: '4px', color: '#f87171' }}
                                                                            title="Sıfırla"
                                                                        >↺</span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </span>
                                                        <span className="merge-req-total-price" style={{ color: customPrice !== undefined ? '#f59e0b' : 'inherit' }}>
                                                            {totalItemCost!.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 3 })} RLT
                                                        </span>
                                                    </>
                                                ) : isMutationComponent ? (
                                                    <span className="merge-req-price" style={{ color: '#f87171' }}>
                                                        {t('merge.unitPrice')}: - 
                                                        <span 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPartPrice(displayName);
                                                                setTempPartPrice('0.0001');
                                                            }}
                                                            style={{ cursor: 'pointer', marginLeft: '4px', opacity: 0.7 }}
                                                            title="Fiyat Ekle"
                                                        >➕</span>
                                                    </span>
                                                ) : null}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Parts Cost & Merge Fee */}
                            {calcPartsCost(selectedMerge) > 0 && (
                                <div className="merge-total-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.04))', padding: '14px 16px', borderRadius: '10px', marginTop: '12px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <span>{t('merge.partsCost')}</span>
                                        <span>{formatRltAmount(calcPartsCost(selectedMerge))} RLT</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                        <span>{t('merge.cost')} (Fee)</span>
                                        <span>{formatRltAmount(selectedMerge.amount)} RLT</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(245, 158, 11, 0.2)' }}>
                                        <span style={{ color: '#f59e0b' }}>{t('merge.totalCost')}</span>
                                        <span style={{ color: '#f59e0b' }}>
                                            {formatRltAmount(calcPartsCost(selectedMerge) + selectedMerge.amount)} RLT
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Part Price Settings Modal */}
            {isPartPriceModalOpen && (
                <div className="merge-detail-overlay" onClick={() => setIsPartPriceModalOpen(false)}>
                    <div className="merge-detail-modal" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
                        <div className="merge-detail-header">
                            <h3>⚙️ {t('merge.partPrices', 'Parça Fiyatları (RLT)')}</h3>
                            <button className="merge-detail-close" onClick={() => setIsPartPriceModalOpen(false)}>×</button>
                        </div>
                        <div className="merge-detail-body" style={{ padding: '16px' }}>
                            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                                {t('merge.partPricesDesc', 'Pazar yerindeki anlık parça fiyatlarını girerek merge maliyetlerini daha isabetli hesaplayabilirsiniz. Boş bıraktığınız parçalar için API verisi kullanılır.')}
                            </p>
                            
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px', minWidth: '350px' }}>
                                    <thead>
                                        <tr>
                                            <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Rarity</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Wire</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Fan</th>
                                            <th style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-secondary)' }}>Board</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'].map(rarity => {
                                            const rarityColors: Record<string, string> = {
                                                'Common': '#9ca3af',
                                                'Uncommon': '#10b981',
                                                'Rare': '#3b82f6',
                                                'Epic': '#a855f7',
                                                'Legendary': '#f59e0b'
                                            };
                                            return (
                                                <tr key={rarity}>
                                                    <td style={{ padding: '12px 8px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontWeight: 'bold', color: rarityColors[rarity] }}>
                                                        {rarity}
                                                    </td>
                                                    {['Wire', 'Fan', 'Hashboard'].map(type => {
                                                        const itemName = `${rarity} ${type}`;
                                                        return (
                                                            <td key={itemName} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <input 
                                                                    type="text"
                                                                    placeholder="-"
                                                                    value={tempSettingsPrices[itemName] || ''}
                                                                    onChange={(e) => setTempSettingsPrices(prev => ({...prev, [itemName]: e.target.value}))}
                                                                    style={{
                                                                        width: '100%',
                                                                        minWidth: '60px',
                                                                        padding: '6px 8px',
                                                                        background: 'rgba(0,0,0,0.2)',
                                                                        border: '1px solid var(--border-color)',
                                                                        color: 'white',
                                                                        borderRadius: '6px',
                                                                        fontSize: '13px'
                                                                    }}
                                                                />
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                                <button 
                                    onClick={() => setTempSettingsPrices({})} 
                                    className="btn-secondary"
                                    style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '13px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                >
                                    {t('merge.clearAll', 'Sıfırla')}
                                </button>
                                <button 
                                    onClick={savePartPriceSettings} 
                                    className="btn-primary"
                                    style={{ padding: '8px 24px', borderRadius: '6px', fontSize: '13px', background: 'var(--accent-primary)', color: 'white', border: 'none', cursor: 'pointer' }}
                                >
                                    {t('merge.save', 'Kaydet')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
