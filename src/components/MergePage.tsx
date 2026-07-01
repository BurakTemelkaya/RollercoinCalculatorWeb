import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchMerges, fetchMergeById } from '../services/mergeApi';
import type { MergeListItem, MergeDetail, MergeListParams } from '../types/merge';
import type { PaginatedResponse } from '../types/pagination';
import { autoScalePower, toBaseUnit } from '../utils/powerParser';
import { PowerUnit } from '../types';
import Pagination from './Pagination';
import ComponentForgeCalculator from './ComponentForgeCalculator';
import './MergePage.css';
import './RoomSimulator.css'; // For shared filter UI styles

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

import bonusImg from '../assets/items/bonus.svg';
import craftingImg from '../assets/items/crafting.svg';
import xpImg from '../assets/items/xp.png';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 400;

/** Forge level discount rates: level 1 = 0%, level 2 = 5%, etc. */
const FORGE_DISCOUNTS: Record<number, number> = {
    1: 0,
    2: 0.05,
    3: 0.10,
    4: 0.15,
    5: 0.25,
};

/** Apply forge discount to a raw amount */
function applyForgeDiscount(rawAmount: number, forgeLevel: number): number {
    const discount = FORGE_DISCOUNTS[forgeLevel] || 0;
    return Math.round(rawAmount * (1 - discount));
}

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
    return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
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

type SortByOption = 'newest' | 'percent' | 'name' | 'power';
type ForgeLevel = 1 | 2 | 3 | 4 | 5;

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

    const [minPower, setMinPower] = useState('');
    const [maxPower, setMaxPower] = useState('');
    const [minPowerUnit, setMinPowerUnit] = useState<PowerUnit>('Gh');
    const [maxPowerUnit, setMaxPowerUnit] = useState<PowerUnit>('Gh');
    const [minBonus, setMinBonus] = useState('');
    const [maxBonus, setMaxBonus] = useState('');
    const [minerWidth, setMinerWidth] = useState('');

    const [tempMinPower, setTempMinPower] = useState('');
    const [tempMaxPower, setTempMaxPower] = useState('');
    const [tempMinPowerUnit, setTempMinPowerUnit] = useState<PowerUnit>('Gh');
    const [tempMaxPowerUnit, setTempMaxPowerUnit] = useState<PowerUnit>('Gh');

    const getMinPowerGh = (val: string, unit: PowerUnit) => val ? (toBaseUnit({ value: Number(val), unit }) / 1e9) : undefined;
    const getMaxPowerGh = (val: string, unit: PowerUnit) => val ? (toBaseUnit({ value: Number(val), unit }) / 1e9) : undefined;

    const handleMinPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (tempMinPowerUnit === 'Th') converted = asHs / 1e12;
        else if (tempMinPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (tempMinPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal;
        setTempMinPower(converted.toString());
    };

    const handleMaxPowerSlider = (ghVal: number) => {
        const asHs = ghVal * 1e9;
        let converted = asHs;
        if (tempMaxPowerUnit === 'Th') converted = asHs / 1e12;
        else if (tempMaxPowerUnit === 'Ph') converted = asHs / 1e15;
        else if (tempMaxPowerUnit === 'Eh') converted = asHs / 1e18;
        else converted = ghVal;
        setTempMaxPower(converted.toString());
    };
    const [tempMinBonus, setTempMinBonus] = useState('');
    const [tempMaxBonus, setTempMaxBonus] = useState('');
    const [tempMinerWidth, setTempMinerWidth] = useState('');

    const applyFilters = () => {
        setMinPower(tempMinPower);
        setMaxPower(tempMaxPower);
        setMinPowerUnit(tempMinPowerUnit);
        setMaxPowerUnit(tempMaxPowerUnit);
        setMinBonus(tempMinBonus);
        setMaxBonus(tempMaxBonus);
        setMinerWidth(tempMinerWidth);
        setCurrentPage(0);
    };

    // Detail modal
    const [selectedMerge, setSelectedMerge] = useState<MergeDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [mergeCount, setMergeCount] = useState(1);

    // Forge Level
    const [forgeLevel, setForgeLevel] = useState<ForgeLevel>(() => {
        const saved = localStorage.getItem('rollercoin_web_forge_level');
        return (saved ? parseInt(saved, 10) : 1) as ForgeLevel;
    });

    const handleForgeLevelChange = (level: ForgeLevel) => {
        setForgeLevel(level);
        localStorage.setItem('rollercoin_web_forge_level', String(level));
    };

    // Level Display Mode
    const [levelDisplayMode, setLevelDisplayMode] = useState<'roman' | 'text'>(() => {
        return (localStorage.getItem('rollercoin_web_level_display') as 'roman' | 'text') || 'roman';
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

    const [activeTab, setActiveTab] = useState<'miners' | 'parts'>('miners');

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

                const minGh = getMinPowerGh(minPower, minPowerUnit);
                if (minGh !== undefined) params.minPower = minGh;

                const maxGh = getMaxPowerGh(maxPower, maxPowerUnit);
                if (maxGh !== undefined) params.maxPower = maxGh;
                if (minBonus) params.minBonus = Math.round(Number(minBonus) * 100);
                if (maxBonus) params.maxBonus = Math.round(Number(maxBonus) * 100);
                if (minerWidth) params.minerWidth = Number(minerWidth);

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
    }, [currentPage, searchQuery, sortBy, isDescending, t, minPower, maxPower, minBonus, maxBonus, minerWidth]);

    // Sync page to URL
    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setSearchParams({ page: String(page + 1) });
    };

    // Open detail
    const handleCardClick = async (mergeId: string) => {
        try {
            setDetailLoading(true);
            setMergeCount(1);
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

    // Calculate total parts cost for a detail (applies forge discount to part counts)
    const calcPartsCost = (detail: MergeDetail, count: number = 1): number => {
        return detail.requiredItems
            .filter(item => item.type === 'mutation_components')
            .reduce((sum, item) => {
                const defaultPrice = item.price ? item.price / 1e6 : 0;
                const displayName = getPartDisplayName(item.itemName, item.level);
                const customPrice = customPartPrices[displayName];
                const unitPriceRlt = customPrice !== undefined ? customPrice : defaultPrice;
                const discountedCount = applyForgeDiscount(item.count, forgeLevel);
                // Return to 1e6 scale so it matches the original logic that is expected by formatRltAmount
                return sum + (discountedCount * count * (unitPriceRlt * 1e6));
            }, 0);
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case 'name':
                return isDescending ? t('merge.sort.nameDesc', 'Z - A') : t('merge.sort.nameAsc', 'A - Z');
            case 'newest':
                return isDescending ? t('merge.sort.newestDesc', 'Yeni - Eski') : t('merge.sort.newestAsc', 'Eski - Yeni');
            case 'power':
            case 'percent':
            default:
                return isDescending ? t('merge.sort.highLow', 'Yüksek - Düşük') : t('merge.sort.lowHigh', 'Düşük - Yüksek');
        }
    };

    return (
        <div className="merge-container">
            <>
                <title>{`${t('merge.title')} | RollerCoin Calculator`}</title>
                <meta name="description" content={t('merge.seoContent', 'RollerCoin Merge Calculator and Parts Cost Analysis')} />
                <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/merge`} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={`${t('merge.title')} | RollerCoin Calculator`} />
                <meta property="og:description" content={t('merge.seoContent', 'RollerCoin Merge Calculator and Parts Cost Analysis')} />
                <meta property="og:url" content={`https://rollercoincalculator.app/${lang}/merge`} />
                <meta property="og:image" content="https://rollercoincalculator.app/icon.png" />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={`${t('merge.title')} | RollerCoin Calculator`} />
                <meta name="twitter:description" content={t('merge.seoContent', 'RollerCoin Merge Calculator and Parts Cost Analysis')} />
                <meta name="twitter:image" content="https://rollercoincalculator.app/icon.png" />
            </>
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

            {/* Main Tabs and Controls Row */}
            <div className="merge-tabs-controls-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="merge-main-tabs" style={{ display: 'flex', gap: '12px' }}>
                        <button
                            onClick={() => setActiveTab('miners')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px',
                                fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: activeTab === 'miners' ? '#06b6d4' : 'rgba(255, 255, 255, 0.03)',
                                color: activeTab === 'miners' ? '#fff' : '#94a3b8',
                                border: `1px solid ${activeTab === 'miners' ? '#06b6d4' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: activeTab === 'miners' ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>⛏️</span> Miners
                        </button>
                        <button
                            onClick={() => setActiveTab('parts')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '8px',
                                fontWeight: '700', fontSize: '15px', cursor: 'pointer', transition: 'all 0.2s',
                                backgroundColor: activeTab === 'parts' ? '#06b6d4' : 'rgba(255, 255, 255, 0.03)',
                                color: activeTab === 'parts' ? '#fff' : '#94a3b8',
                                border: `1px solid ${activeTab === 'parts' ? '#06b6d4' : 'rgba(255,255,255,0.08)'}`,
                                boxShadow: activeTab === 'parts' ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none'
                            }}
                        >
                            <span style={{ fontSize: '18px' }}>🔩</span> Parts
                        </button>
                    </div>

                    {/* Forge Level Selector */}
                    <div className="merge-forge-selector">
                        <img src={craftingImg} alt="Forge" width="18" height="18" className="merge-forge-label" />
                        <select
                            className="merge-forge-select"
                            value={forgeLevel}
                            onChange={(e) => handleForgeLevelChange(parseInt(e.target.value, 10) as ForgeLevel)}
                            title={t('merge.forgeLevel', 'Forge Seviyesi')}
                        >
                            {[1, 2, 3, 4, 5].map(lv => (
                                <option key={lv} value={lv}>
                                    Lv.{lv}{FORGE_DISCOUNTS[lv] > 0 ? ` (-${FORGE_DISCOUNTS[lv] * 100}%)` : ''}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            {activeTab === 'miners' && (
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                    {/* LEFT: FILTER SIDEBAR */}
                    <div className="rc-filter-container" style={{ flex: '1 1 250px', maxWidth: 350 }}>
                        {/* Search */}
                        <div className="rc-filter-group">
                            <div className="merge-search-wrapper" style={{ minWidth: 0 }}>
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
                                    style={{ width: '100%' }}
                                />
                            </div>
                        </div>

                        {/* Sort */}
                        <div className="rc-filter-group">
                            <label className="rc-filter-label">{t('merge.sorting')}:</label>
                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                <select
                                    className="merge-sort-select"
                                    value={sortBy}
                                    onChange={(e) => {
                                        setSortBy(e.target.value as SortByOption);
                                        setCurrentPage(0);
                                    }}
                                    style={{ flex: 1 }}
                                >
                                    <option value="newest">{t('merge.sortOptions.newest')}</option>
                                    <option value="name">{t('merge.sortOptions.name')}</option>
                                    <option value="power">{t('merge.sortOptions.power')}</option>
                                    <option value="percent">{t('merge.sortOptions.bonus')}</option>
                                </select>

                                <button
                                    className={`merge-sort-dir-btn ${isDescending ? 'desc' : 'asc'}`}
                                    onClick={() => setIsDescending(!isDescending)}
                                    title={getSortLabel()}
                                    style={{ gap: '6px', fontSize: '12px', fontWeight: '600' }}
                                >
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 5v14M19 12l-7 7-7-7" />
                                    </svg>
                                    <span>{getSortLabel()}</span>
                                </button>
                            </div>
                        </div>

                        {/* Quick actions row */}
                        <div className="rc-filter-group" style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
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

                        <div style={{ borderTop: '1px solid #3c3e58', margin: '12px 0' }} />

                        <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: 16, color: '#94a3b8' }}>{t('merge.filters', 'Filtreler')}</h3>

                        {/* Power range */}
                        <div className="rc-filter-group">
                            <label className="rc-filter-label">{t('merge.filterPower')}:</label>
                            <div className="rc-dual-slider-container">
                                <div className="rc-dual-slider-fill" style={{ left: `${((getMinPowerGh(tempMinPower, tempMinPowerUnit) || 0) / 16830000000) * 100}%`, width: `${(((getMaxPowerGh(tempMaxPower, tempMaxPowerUnit) || 16830000000) - (getMinPowerGh(tempMinPower, tempMinPowerUnit) || 0)) / 16830000000) * 100}%` }} />
                                <input
                                    type="range"
                                    className="rc-native-slider rc-slider-min"
                                    min="0" max="16830000000" step="1000000"
                                    value={getMinPowerGh(tempMinPower, tempMinPowerUnit) || 0}
                                    onChange={e => handleMinPowerSlider(Math.min(Number(e.target.value), (getMaxPowerGh(tempMaxPower, tempMaxPowerUnit) || 16830000000) - 1000000))}
                                />
                                <input
                                    type="range"
                                    className="rc-native-slider rc-slider-max"
                                    min="0" max="16830000000" step="1000000"
                                    value={getMaxPowerGh(tempMaxPower, tempMaxPowerUnit) || 16830000000}
                                    onChange={e => handleMaxPowerSlider(Math.max(Number(e.target.value), (getMinPowerGh(tempMinPower, tempMinPowerUnit) || 0) + 1000000))}
                                />
                            </div>
                            <div className="rc-filter-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" className="rc-filter-input" value={tempMinPower} onChange={e => setTempMinPower(e.target.value)} placeholder="0" style={{ width: '100%' }} />
                                    <select className="rc-select" value={tempMinPowerUnit} onChange={e => setTempMinPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                        <option value="Gh">Gh</option>
                                        <option value="Th">Th</option>
                                        <option value="Ph">Ph</option>
                                        <option value="Eh">Eh</option>
                                    </select>
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <input type="number" className="rc-filter-input" value={tempMaxPower} onChange={e => setTempMaxPower(e.target.value)} placeholder={t('merge.max')} style={{ width: '100%' }} />
                                    <select className="rc-select" value={tempMaxPowerUnit} onChange={e => setTempMaxPowerUnit(e.target.value as PowerUnit)} style={{ padding: '0 4px' }}>
                                        <option value="Gh">Gh</option>
                                        <option value="Th">Th</option>
                                        <option value="Ph">Ph</option>
                                        <option value="Eh">Eh</option>
                                    </select>
                                </div>
                                <button className="rc-filter-ok" onClick={applyFilters}>OK</button>
                            </div>
                            <div style={{ fontSize: 12, color: '#03e1e4', marginTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                                <span>{t('merge.min')}: {getMinPowerGh(tempMinPower, tempMinPowerUnit) ? formatPower(getMinPowerGh(tempMinPower, tempMinPowerUnit)!) : '0'}</span>
                                <span>{t('merge.max')}: {(getMaxPowerGh(tempMaxPower, tempMaxPowerUnit) || 16830000000) < 16830000000 ? formatPower(getMaxPowerGh(tempMaxPower, tempMaxPowerUnit)!) : t('merge.unlimited')}</span>
                            </div>
                        </div>

                        {/* Bonus range */}
                        <div className="rc-filter-group">
                            <label className="rc-filter-label">{t('merge.filterBonus')}:</label>
                            <div className="rc-dual-slider-container">
                                <div className="rc-dual-slider-fill" style={{ left: `${Math.min(Math.max((Number(tempMinBonus || 0) / 200) * 100, 0), 100)}%`, width: `${Math.min(Math.max(((Math.min(Number(tempMaxBonus || 200), 200) - Math.min(Number(tempMinBonus || 0), 200)) / 200) * 100, 0), 100)}%` }} />
                                <input
                                    type="range"
                                    className="rc-native-slider rc-slider-min"
                                    min="0" max="200" step="1"
                                    value={tempMinBonus || 0}
                                    onChange={e => setTempMinBonus(Math.min(Number(e.target.value), Number(tempMaxBonus || 200) - 1).toString())}
                                />
                                <input
                                    type="range"
                                    className="rc-native-slider rc-slider-max"
                                    min="0" max="200" step="1"
                                    value={tempMaxBonus || 200}
                                    onChange={e => setTempMaxBonus(Math.max(Number(e.target.value), Number(tempMinBonus || 0) + 1).toString())}
                                />
                            </div>
                            <div className="rc-filter-inputs">
                                <input type="number" className="rc-filter-input" value={tempMinBonus} onChange={e => setTempMinBonus(e.target.value)} placeholder="0" />
                                <span className="rc-filter-separator">-</span>
                                <input type="number" className="rc-filter-input" value={tempMaxBonus} onChange={e => setTempMaxBonus(e.target.value)} placeholder={t('merge.max')} />
                                <button className="rc-filter-ok" onClick={applyFilters}>OK</button>
                            </div>
                        </div>

                        {/* Cells count */}
                        <div className="rc-filter-group">
                            <label className="rc-filter-label">{t('merge.filterCells')}:</label>
                            <div className="rc-checkbox-group">
                                <label className="rc-checkbox-label">
                                    <input type="checkbox" checked={tempMinerWidth === '1'} onChange={() => {
                                        setTempMinerWidth(tempMinerWidth === '1' ? '' : '1');
                                    }} />
                                    <span className="rc-checkbox-custom"></span>
                                    1
                                </label>
                                <label className="rc-checkbox-label">
                                    <input type="checkbox" checked={tempMinerWidth === '2'} onChange={() => {
                                        setTempMinerWidth(tempMinerWidth === '2' ? '' : '2');
                                    }} />
                                    <span className="rc-checkbox-custom"></span>
                                    2
                                </label>
                                <button className="rc-filter-ok" onClick={applyFilters} style={{ marginLeft: 'auto' }}>OK</button>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: CONTENT */}
                    <div style={{ flex: '2 1 500px', minWidth: 0 }}>
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
                                                    <span className="merge-card-stat-value merge-card-cost" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <img src={rltImg} alt="RLT" width="14" height="14" />
                                                        {formatRltAmount(applyForgeDiscount(item.amount, forgeLevel))} RLT
                                                    </span>
                                                </div>
                                                {item.discountedAmount < item.amount && (
                                                    <div className="merge-card-stat">
                                                        <span>{t('merge.discountedCost')}</span>
                                                        <span className="merge-card-stat-value merge-card-cost" style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <img src={rltImg} alt="RLT" width="14" height="14" />
                                                            {formatRltAmount(applyForgeDiscount(item.discountedAmount, forgeLevel))} RLT
                                                        </span>
                                                    </div>
                                                )}
                                                <div className="merge-card-power-bonus">
                                                    {item.resultItemPower > 0 && (
                                                        <span className="merge-req-stat-pill">
                                                            <span className="merge-req-stat-icon">⚡</span>
                                                            {formatPower(item.resultItemPower)}
                                                        </span>
                                                    )}
                                                    <span className="merge-req-stat-pill merge-req-stat-bonus">
                                                        <img src={bonusImg} alt="Bonus" width="12" height="12" />
                                                        {(item.resultItemPercent / 100).toFixed(2)}%
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
                    </div>
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
                            <h3>{selectedMerge.resultItemName} {mergeCount > 1 && <span style={{ fontSize: '14px', color: 'var(--text-muted)', fontWeight: 400 }}>×{mergeCount}</span>}</h3>
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
                                    <span className="merge-result-name">{selectedMerge.resultItemName} Level {selectedMerge.resultItemLevel + 1}</span>
                                    <div className="merge-result-meta">
                                        <span className="merge-req-stat-pill merge-req-stat-rlt">
                                            <img src={rltImg} alt="RLT" width="14" height="14" style={{ borderRadius: '50%' }} />
                                            {formatRltAmount(applyForgeDiscount(selectedMerge.amount, forgeLevel) * mergeCount)} RLT
                                            {forgeLevel > 1 && <span style={{ fontSize: '10px', marginLeft: '2px', opacity: 0.8 }}>(-{FORGE_DISCOUNTS[forgeLevel] * 100}%)</span>}
                                        </span>
                                        {selectedMerge.discountedAmount < selectedMerge.amount && (
                                            <span className="merge-req-stat-pill merge-req-stat-rlt" style={{ borderColor: '#10b981', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                                                ({t('merge.discountedCost')}: <img src={rltImg} alt="RLT" width="12" height="12" /> {formatRltAmount(applyForgeDiscount(selectedMerge.discountedAmount, forgeLevel) * mergeCount)} RLT)
                                            </span>
                                        )}
                                        {selectedMerge.resultItemPower > 0 && (
                                            <span className="merge-req-stat-pill">
                                                <span className="merge-req-stat-icon">⚡</span>
                                                {formatPower(selectedMerge.resultItemPower)}
                                            </span>
                                        )}
                                        {selectedMerge.resultItemPercent > 0 && (
                                            <span className="merge-req-stat-pill merge-req-stat-bonus">
                                                <img src={bonusImg} alt="Bonus" width="12" height="12" />
                                                {(selectedMerge.resultItemPercent / 100).toFixed(2)}%
                                            </span>
                                        )}
                                        <span className="merge-req-stat-pill merge-req-stat-xp">
                                            {(() => {
                                                const xp = selectedMerge.xpReward;
                                                let formatted = xp.toLocaleString('en-US');
                                                if (xp >= 1_000_000) {
                                                    formatted = (xp / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 }) + 'm';
                                                } else if (xp >= 1_000) {
                                                    formatted = (xp / 1_000).toLocaleString('en-US', { maximumFractionDigits: 1 }) + 'k';
                                                }
                                                return (
                                                    <>
                                                        <img src={xpImg} alt="XP" width="16" height="16" />
                                                        +{formatted} XP
                                                    </>
                                                );
                                            })()}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Required Items */}
                            {/* Merge Count Selector */}
                            <div className="merge-count-row">
                                <h4 className="merge-required-title" style={{ margin: 0 }}>{t('merge.requiredItems')}</h4>
                                <div className="merge-count-control">
                                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{t('merge.mergeCount', 'Adet')}:</span>
                                    <button
                                        className="merge-count-btn"
                                        onClick={() => setMergeCount(Math.max(1, mergeCount - 1))}
                                        disabled={mergeCount <= 1}
                                    >−</button>
                                    <input
                                        type="number"
                                        className="merge-count-input"
                                        value={mergeCount}
                                        min={1}
                                        max={999}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            if (!isNaN(val) && val >= 1 && val <= 999) setMergeCount(val);
                                        }}
                                    />
                                    <button
                                        className="merge-count-btn"
                                        onClick={() => setMergeCount(Math.min(999, mergeCount + 1))}
                                    >+</button>
                                </div>
                            </div>
                            <div className="merge-required-list">
                                {selectedMerge.requiredItems.map((item, idx) => {
                                    const isMiner = item.type === 'miners';
                                    const isMutationComponent = item.type === 'mutation_components';

                                    // Required miner level: use API level, fallback to resultItemLevel - 1
                                    const reqMinerLevel = isMiner
                                        ? (item.level > 0 ? item.level : Math.max(0, selectedMerge.resultItemLevel - 1)) + 1
                                        : 0;

                                    // Determine display name first
                                    let displayName = isMiner ? `${item.itemName} Level ${reqMinerLevel}` : getPartDisplayName(item.itemName, item.level);

                                    const defaultUnitPrice = item.price ? item.price / 1e6 : null;
                                    const customPrice = customPartPrices[displayName];
                                    const unitPriceRlt = isMutationComponent ? (customPrice !== undefined ? customPrice : defaultUnitPrice) : null;

                                    const discountedCount = isMutationComponent ? applyForgeDiscount(item.count, forgeLevel) : item.count;
                                    const effectiveCount = discountedCount * mergeCount;
                                    const totalItemCost = unitPriceRlt !== null ? unitPriceRlt * effectiveCount : null;

                                    // Image for this required item
                                    let imgSrc: string | null = null;

                                    if (isMiner && item.fileName) {
                                        imgSrc = getMinerImageUrl(item.fileName, item.imageVersion || undefined);
                                    } else if (isMutationComponent) {
                                        imgSrc = getMutationComponentImage(item.itemName, item.level);
                                    }

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
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                                    <span className="merge-req-name">{displayName}</span>
                                                    {isMiner && (item.power != null && item.power > 0 || item.percent != null && item.percent > 0) && (
                                                        <div className="merge-req-miner-stats" style={{ margin: 0 }}>
                                                            {item.power != null && item.power > 0 && (
                                                                <span className="merge-req-stat-pill">
                                                                    <span className="merge-req-stat-icon">⚡</span>
                                                                    {formatPower(item.power)}
                                                                </span>
                                                            )}
                                                            {item.percent != null && item.percent > 0 && (
                                                                <span className="merge-req-stat-pill merge-req-stat-bonus">
                                                                    <img src={bonusImg} alt="Bonus" width="14" height="14" />
                                                                    {(item.percent / 100).toFixed(2)}%
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="merge-req-type">
                                                    {isMiner ? 'Miner' : t('merge.component')}
                                                </span>
                                            </div>
                                            <div className="merge-req-counts" style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: '8px' }}>
                                                <span className="merge-req-stat-pill merge-req-stat-qty">×{effectiveCount}{((isMutationComponent && forgeLevel > 1) || mergeCount > 1) && <span style={{ fontSize: '10px', opacity: 0.8, marginLeft: '4px' }}>({item.count}{isMutationComponent && forgeLevel > 1 ? ` -${FORGE_DISCOUNTS[forgeLevel] * 100}%` : ''}{mergeCount > 1 ? ` ×${mergeCount}` : ''})</span>}</span>
                                                {unitPriceRlt !== null ? (
                                                    <>
                                                        <span className="merge-req-stat-pill merge-req-stat-rlt" style={{ color: '#f59e0b' }}>
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
                                                                        fontSize: '12px'
                                                                    }}
                                                                />
                                                            ) : (
                                                                <>
                                                                    <span
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setEditingPartPrice(displayName);
                                                                            setTempPartPrice(unitPriceRlt.toString());
                                                                        }}
                                                                        style={{ cursor: 'pointer', borderBottom: '1px dashed currentColor', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                                    >
                                                                        {unitPriceRlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RLT
                                                                        <span style={{ fontSize: '10px', opacity: 0.8 }}>✏️</span>
                                                                    </span>
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
                                                        <span className="merge-req-stat-pill merge-req-stat-rlt" style={{ color: customPrice !== undefined ? '#f59e0b' : 'inherit', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                            <img src={rltImg} alt="RLT" width="12" height="12" />
                                                            {totalItemCost!.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} RLT
                                                        </span>
                                                    </>
                                                ) : isMutationComponent ? (
                                                    <span className="merge-req-stat-pill" style={{ color: '#f87171', borderColor: 'rgba(248, 113, 113, 0.2)', background: 'rgba(248, 113, 113, 0.1)' }}>
                                                        {t('merge.unitPrice')}: -
                                                        <span
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingPartPrice(displayName);
                                                                setTempPartPrice('0.0001');
                                                            }}
                                                            style={{ cursor: 'pointer', marginLeft: '4px', opacity: 0.8 }}
                                                            title="Fiyat Ekle"
                                                        >➕</span>
                                                    </span>
                                                ) : null}
                                            </div>
                                            {isMutationComponent && item.level === 0 && (
                                                <div className="merge-case-alternative">
                                                    {getCaseImage(item.itemName) ? (
                                                        <img
                                                            src={getCaseImage(item.itemName)!}
                                                            alt={`${item.itemName} Case`}
                                                            style={{ width: '22px', height: '22px', objectFit: 'contain', flexShrink: 0 }}
                                                        />
                                                    ) : (
                                                        <span style={{ fontSize: '18px' }}>📦</span>
                                                    )}
                                                    <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: '600' }}>
                                                        {t('merge.caseAlternative', { boxes: Math.ceil(effectiveCount / 200), rst: Math.ceil(effectiveCount / 200) * 40 })}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Total Parts Cost & Merge Fee */}
                            {(() => {
                                const partsCost = calcPartsCost(selectedMerge, mergeCount);
                                const feeCost = applyForgeDiscount(selectedMerge.amount, forgeLevel) * mergeCount;
                                return partsCost > 0 ? (
                                    <div className="merge-total-summary-container" style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08), rgba(251, 191, 36, 0.04))', padding: '14px 16px', borderRadius: '10px', marginTop: '12px', border: '1px solid rgba(245, 158, 11, 0.15)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <span>{t('merge.partsCost')}{mergeCount > 1 ? ` (×${mergeCount})` : ''}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <img src={rltImg} alt="RLT" width="14" height="14" />
                                                {formatRltAmount(partsCost)} RLT
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-secondary)' }}>
                                            <span>{t('merge.cost')} (Fee){mergeCount > 1 ? ` (×${mergeCount})` : ''}{forgeLevel > 1 ? ` (-${FORGE_DISCOUNTS[forgeLevel] * 100}%)` : ''}</span>
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                <img src={rltImg} alt="RLT" width="14" height="14" />
                                                {formatRltAmount(feeCost)} RLT
                                            </span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)', marginTop: '8px', paddingTop: '8px', borderTop: '1px dashed rgba(245, 158, 11, 0.2)' }}>
                                            <span style={{ color: '#f59e0b' }}>{t('merge.totalCost')}</span>
                                            <span style={{ color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                <img src={rltImg} alt="RLT" width="16" height="16" />
                                                {formatRltAmount(partsCost + feeCost)} RLT
                                            </span>
                                        </div>
                                    </div>
                                ) : null;
                            })()}
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
                                                        const rarityLevelMap: Record<string, number> = {
                                                            'Common': 0,
                                                            'Uncommon': 1,
                                                            'Rare': 2,
                                                            'Epic': 3,
                                                            'Legendary': 4
                                                        };
                                                        const imgSrc = getMutationComponentImage(type, rarityLevelMap[rarity]);

                                                        return (
                                                            <td key={itemName} style={{ padding: '8px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                    {imgSrc && <img src={imgSrc} alt={itemName} width="24" height="24" style={{ objectFit: 'contain' }} />}
                                                                    <input
                                                                        type="text"
                                                                        placeholder="-"
                                                                        value={tempSettingsPrices[itemName] || ''}
                                                                        onChange={(e) => setTempSettingsPrices(prev => ({ ...prev, [itemName]: e.target.value }))}
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
                                                                </div>
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

            {/* Component Calculator */}
            {activeTab === 'parts' && (
                <ComponentForgeCalculator
                    forgeLevel={forgeLevel as 1 | 2 | 3 | 4 | 5}
                    customPartPrices={customPartPrices}
                    onOpenSettings={openPartPriceSettings}
                />
            )}

            {/* SEO Content Section */}
            <article className="static-content seo-article-container" style={{ padding: '24px', backgroundColor: 'var(--surface-50)', borderRadius: '12px', marginTop: '32px' }}>
                <h2 style={{ borderBottom: 'none', marginBottom: '12px', color: 'var(--primary-400)', fontSize: '18px' }}>{t('merge.seoTitle')}</h2>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.7' }}>{t('merge.seoContent')}</p>
            </article>
        </div>
    );
}
