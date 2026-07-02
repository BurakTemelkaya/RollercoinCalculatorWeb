import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { fetchMergesByMinerName } from '../services/mergeApi';
import type { MergeDetail } from '../types/merge';
import { autoScalePower } from '../utils/powerParser';

import './MergePage.css'; // Reusing some base styles
import './MergeMinerLevelsPage.css';

// Using the same imports as MergePage for images
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
import rltImg from '../assets/coins/rlt.svg';
import bonusImg from '../assets/items/bonus.svg';
import craftingImg from '../assets/items/crafting.svg';

const FORGE_DISCOUNTS: Record<number, number> = {
    1: 0,
    2: 0.05,
    3: 0.10,
    4: 0.15,
    5: 0.25,
};

function applyForgeDiscount(rawAmount: number, forgeLevel: number): number {
    const discount = FORGE_DISCOUNTS[forgeLevel] || 0;
    return Math.round(rawAmount * (1 - discount));
}

function getMinerImageUrl(fileName: string, imageVersion?: number): string {
    const base = `https://static.rollercoin.com/static/img/market/miners/${fileName}.gif`;
    return imageVersion ? `${base}?v=${imageVersion}` : base;
}

function getLevelIconUrl(level: number): string {
    return `https://rollercoin.com/static/img/storage/rarity_icons/level_${level}.png?v=1.0.0`;
}

function formatRltAmount(rawAmount: number): string {
    const rlt = rawAmount / 1e6;
    if (rlt >= 1000) {
        return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

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

function getMutationComponentImage(itemName: string, level?: number): string | null {
    const name = itemName.toLowerCase();
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
    if (name.includes('legendary')) return name.includes('fan') ? legendaryFanImg : name.includes('hashboard') ? legendaryHashboardImg : legendaryWireImg;
    if (name.includes('epic')) return name.includes('fan') ? epicFanImg : name.includes('hashboard') ? epicHashboardImg : epicWireImg;
    if (name.includes('rare')) return name.includes('fan') ? rareFanImg : name.includes('hashboard') ? rareHashboardImg : rareWireImg;
    if (name.includes('uncommon')) return name.includes('fan') ? uncommonFanImg : name.includes('hashboard') ? uncommonHashboardImg : uncommonWireImg;
    return name.includes('fan') ? commonFanImg : name.includes('hashboard') || name.includes('board') ? commonHashboardImg : commonWireImg;
}

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

type ForgeLevel = 1 | 2 | 3 | 4 | 5;

export default function MergeMinerLevelsPage() {
    const { lang, minerName } = useParams<{ lang: string, minerName: string }>();
    const { t } = useTranslation();

    const [data, setData] = useState<MergeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for toggling level 1 parts market cost visibility
    const [showLevel1Cost, setShowLevel1Cost] = useState(false);
    const [targetLevel, setTargetLevel] = useState<number | 'all'>('all');

    // Forge Level
    const [forgeLevel, setForgeLevel] = useState<ForgeLevel>(() => {
        const saved = localStorage.getItem('rollercoin_web_forge_level');
        return (saved ? parseInt(saved, 10) : 1) as ForgeLevel;
    });

    const handleForgeLevelChange = (level: ForgeLevel) => {
        setForgeLevel(level);
        localStorage.setItem('rollercoin_web_forge_level', String(level));
    };

    // Custom Part Prices
    const [customPartPrices] = useState<Record<string, number>>(() => {
        try {
            const saved = localStorage.getItem('rollercoin_web_custom_part_prices');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    useEffect(() => {
        const loadData = async () => {
            if (!minerName) return;
            try {
                setLoading(true);
                setError(null);
                const result = await fetchMergesByMinerName(minerName);
                // Sort by level ascending
                const sorted = result.sort((a, b) => a.resultItemLevel - b.resultItemLevel);
                setData(sorted);
            } catch (err) {
                console.error('Failed to fetch miner levels:', err);
                setError(err instanceof Error ? err.message : t('merge.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [minerName, t]);

    // Calculate cost logic
    const calcLevelCost = (detail: MergeDetail): { partsCost: number, totalCost: number } => {
        const partsCost = detail.requiredItems
            .filter(item => item.type === 'mutation_components')
            .reduce((sum, item) => {
                // Ignore Level 1 parts (level 0 in API) if toggle is off
                if (item.level === 0 && !showLevel1Cost) {
                    return sum;
                }
                const defaultPrice = item.price ? item.price / 1e6 : 0;
                const displayName = getPartDisplayName(item.itemName, item.level);
                const customPrice = customPartPrices[displayName];
                const unitPriceRlt = customPrice !== undefined ? customPrice : defaultPrice;
                const discountedCount = applyForgeDiscount(item.count, forgeLevel);
                return sum + (discountedCount * (unitPriceRlt * 1e6));
            }, 0);

        const feeCost = applyForgeDiscount(detail.amount, forgeLevel);
        return { partsCost, totalCost: partsCost + feeCost };
    };

    const availableLevels = [...new Set(data.map(d => d.resultItemLevel + 1))].sort((a, b) => a - b);
    const filteredData = targetLevel === 'all' ? data : data.filter(d => (d.resultItemLevel + 1) <= targetLevel);

    let grandTotalPartsCost = 0;
    let grandTotalFee = 0;
    let grandTotalCost = 0;

    filteredData.forEach(detail => {
        const { partsCost, totalCost } = calcLevelCost(detail);
        grandTotalPartsCost += partsCost;
        grandTotalFee += applyForgeDiscount(detail.amount, forgeLevel);
        grandTotalCost += totalCost;
    });

    const aggregatedItems = new Map<string, any>();
    
    filteredData.forEach(detail => {
        detail.requiredItems.forEach(item => {
            const isMiner = item.type === 'miners';
            const isMutationComponent = item.type === 'mutation_components';
            
            if (isMutationComponent && item.level === 0 && !showLevel1Cost) {
                return;
            }
            
            const reqMinerLevel = isMiner ? (item.level > 0 ? item.level : Math.max(0, detail.resultItemLevel - 1)) + 1 : 0;
            const displayName = isMiner ? `${item.itemName} Level ${reqMinerLevel}` : getPartDisplayName(item.itemName, item.level);
            const discountedCount = isMutationComponent ? applyForgeDiscount(item.count, forgeLevel) : item.count;
            const key = `${item.itemId}-${reqMinerLevel}`;
            
            if (aggregatedItems.has(key)) {
                aggregatedItems.get(key)!.totalCount += discountedCount;
            } else {
                let imgSrc: string | null = null;
                if (isMiner && item.fileName) {
                    imgSrc = getMinerImageUrl(item.fileName, item.imageVersion || undefined);
                } else if (isMutationComponent) {
                    imgSrc = getMutationComponentImage(item.itemName, item.level);
                }
                
                aggregatedItems.set(key, {
                    ...item,
                    displayName,
                    reqMinerLevel,
                    imgSrc,
                    isMiner,
                    totalCount: discountedCount
                });
            }
        });
    });

    const grandTotalItems = Array.from(aggregatedItems.values());
    const totalMiners = grandTotalItems.filter(item => item.isMiner);
    const totalParts = grandTotalItems.filter(item => !item.isMiner);

    return (
        <div className="merge-container">
            <div className="merge-header">
                <div className="merge-header-left">
                    <Link to={`/${lang}/merges`} className="merge-back-btn">
                        {t('merge.backToMerges', '← Geri')}
                    </Link>
                </div>
                <h2 className="merge-title">
                    {minerName} - {t('merge.allLevelsCost', 'Tüm Seviyelerin Maliyeti')}
                </h2>
                <div className="merge-header-right">
                    {/* Forge Level Selector */}
                    <div className="merge-forge-selector" style={{ marginRight: '16px' }}>
                        <img src={craftingImg} alt="Forge" width="18" height="18" className="merge-forge-label" />
                        <select
                            className="merge-forge-select"
                            value={forgeLevel}
                            onChange={(e) => handleForgeLevelChange(parseInt(e.target.value, 10) as ForgeLevel)}
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

            <div className="merge-miner-levels-controls" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
                <div className="merge-target-level" style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ color: 'var(--text-secondary)', marginRight: '8px', fontSize: '14px', fontWeight: 600 }}>
                        {t('merge.targetLevel', 'Hedef Seviye:')}
                    </span>
                    <select
                        className="merge-forge-select"
                        value={targetLevel}
                        onChange={(e) => setTargetLevel(e.target.value === 'all' ? 'all' : parseInt(e.target.value, 10))}
                    >
                        <option value="all">{t('merge.allLevels', 'Tüm Seviyeler')}</option>
                        {availableLevels.map(lv => (
                            <option key={lv} value={lv}>{t('merge.upToLevel', 'Seviye {{level}}', { level: lv })}</option>
                        ))}
                    </select>
                </div>
                <label className="toggle-switch" style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                    <input
                        type="checkbox"
                        checked={showLevel1Cost}
                        onChange={() => setShowLevel1Cost(!showLevel1Cost)}
                        style={{ display: 'none' }}
                    />
                    <div style={{
                        width: '40px',
                        height: '24px',
                        background: showLevel1Cost ? '#06b6d4' : 'rgba(255,255,255,0.1)',
                        borderRadius: '12px',
                        position: 'relative',
                        transition: 'background 0.3s'
                    }}>
                        <div style={{
                            width: '20px',
                            height: '20px',
                            background: '#fff',
                            borderRadius: '50%',
                            position: 'absolute',
                            top: '2px',
                            left: showLevel1Cost ? '18px' : '2px',
                            transition: 'left 0.3s'
                        }} />
                    </div>
                    <span style={{ marginLeft: '12px', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                        {t('merge.showLevel1Cost', '1. Seviye Parça Maliyetlerini Dahil Et')}
                    </span>
                </label>
            </div>

            {error ? (
                <div className="merge-error">
                    <span className="pe-error-icon">⚠️</span>
                    <p>{t('merge.fetchError')}: {error}</p>
                </div>
            ) : loading ? (
                <div className="merge-loading">
                    <span className="spinner" />
                    <p>{t('merge.loading')}</p>
                </div>
            ) : (
                <>
                    <div className="merge-miner-levels-list">
                        {filteredData.map((detail) => {
                            const { partsCost, totalCost } = calcLevelCost(detail);
                            const resultLevel = detail.resultItemLevel + 1; // API 1 = Level 2 display

                            return (
                                <div key={detail.id} className="miner-level-card">
                                    <div className="miner-level-card-top">
                                        <div className="miner-level-result">
                                            <div className="miner-level-img-wrap">
                                                <img
                                                    src={getLevelIconUrl(resultLevel)}
                                                    alt={`Level ${resultLevel}`}
                                                    className="miner-level-badge"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                {detail.resultItemFileName ? (
                                                    <img
                                                        src={getMinerImageUrl(detail.resultItemFileName, detail.resultItemImageVersion || undefined)}
                                                        alt={detail.resultItemName}
                                                        className="miner-level-img"
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '48px' }}>⛏️</span>
                                                )}
                                            </div>
                                            <h3 className="miner-level-title">
                                                {detail.resultItemName} Level {resultLevel}
                                            </h3>
                                            <div className="miner-level-stats">
                                                {detail.resultItemPower > 0 && (
                                                    <span className="merge-req-stat-pill">
                                                        <span className="merge-req-stat-icon">⚡</span>
                                                        {formatPower(detail.resultItemPower)}
                                                    </span>
                                                )}
                                                {detail.resultItemPercent > 0 && (
                                                    <span className="merge-req-stat-pill merge-req-stat-bonus">
                                                        <img src={bonusImg} alt="Bonus" width="12" height="12" />
                                                        {(detail.resultItemPercent / 100).toFixed(2)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="miner-level-requirements">
                                            <h4 className="requirements-title">{t('merge.requiredItems')}</h4>
                                            <div className="requirements-grid">
                                                {detail.requiredItems.map((item, idx) => {
                                                    const isMiner = item.type === 'miners';
                                                    const isMutationComponent = item.type === 'mutation_components';
                                                    const reqMinerLevel = isMiner ? (item.level > 0 ? item.level : Math.max(0, detail.resultItemLevel - 1)) + 1 : 0;
                                                    const displayName = isMiner ? `${item.itemName} Level ${reqMinerLevel}` : getPartDisplayName(item.itemName, item.level);

                                                    const discountedCount = isMutationComponent ? applyForgeDiscount(item.count, forgeLevel) : item.count;


                                                    let imgSrc: string | null = null;
                                                    if (isMiner && item.fileName) {
                                                        imgSrc = getMinerImageUrl(item.fileName, item.imageVersion || undefined);
                                                    } else if (isMutationComponent) {
                                                        imgSrc = getMutationComponentImage(item.itemName, item.level);
                                                    }

                                                    return (
                                                        <div key={`${item.itemId}-${idx}`} className="req-item-card">
                                                            <div className="req-item-img-wrap">
                                                                {isMiner && reqMinerLevel > 1 && (
                                                                    <img
                                                                        src={getLevelIconUrl(reqMinerLevel)}
                                                                        alt={`Level ${reqMinerLevel}`}
                                                                        className="req-item-badge"
                                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                    />
                                                                )}
                                                                {imgSrc ? (
                                                                    <img src={imgSrc} alt={displayName} className="req-item-img" />
                                                                ) : (
                                                                    <span className="req-item-fallback">{isMiner ? '⛏️' : '🔩'}</span>
                                                                )}
                                                            </div>
                                                            <div className="req-item-info">
                                                                <span className="req-item-name">{displayName}</span>
                                                                <div className="req-item-bottom">
                                                                    <span className="req-item-qty">x{discountedCount}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="miner-level-cost-summary">
                                        <div className="cost-row">
                                            <span>{t('merge.partsCost')}:</span>
                                            <span className="cost-val">
                                                <img src={rltImg} alt="RLT" width="14" /> {formatRltAmount(partsCost)} RLT
                                            </span>
                                        </div>
                                        <div className="cost-row">
                                            <span>{t('merge.cost')} (Fee):</span>
                                            <span className="cost-val">
                                                <img src={rltImg} alt="RLT" width="14" /> {formatRltAmount(applyForgeDiscount(detail.amount, forgeLevel))} RLT
                                            </span>
                                        </div>
                                        <div className="cost-row total-row">
                                            <span>{t('merge.totalCost')}:</span>
                                            <span className="cost-val highlight">
                                                <img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(totalCost)} RLT
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    {filteredData.length > 0 && (
                        <div className="miner-levels-grand-total">
                            <h3 className="grand-total-title">{t('merge.grandTotal', 'Tüm Seviyelerin Toplam Maliyeti')}</h3>
                            <div className="grand-total-stats">
                                <div className="grand-total-stat">
                                    <span className="stat-label">{t('merge.totalPartsCost', 'Toplam Parça Maliyeti')}</span>
                                    <span className="stat-val"><img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(grandTotalPartsCost)} RLT</span>
                                </div>
                                <div className="grand-total-stat">
                                    <span className="stat-label">{t('merge.totalFeeCost', 'Toplam Forge Ücreti')}</span>
                                    <span className="stat-val"><img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(grandTotalFee)} RLT</span>
                                </div>
                                <div className="grand-total-stat highlight">
                                    <span className="stat-label">{t('merge.finalCost', 'Genel Toplam')}</span>
                                    <span className="stat-val"><img src={rltImg} alt="RLT" width="22" /> {formatRltAmount(grandTotalCost)} RLT</span>
                                </div>
                                </div>
                                
                                {grandTotalItems.length > 0 && (
                                    <div style={{ marginTop: '32px', width: '100%' }}>
                                        <h4 className="requirements-title" style={{ textAlign: 'center', marginBottom: '24px' }}>{t('merge.totalRequiredItems', 'Toplam Gerekli Malzemeler')}</h4>
                                        <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                                            {totalMiners.length > 0 && (
                                                <div style={{ flex: '1 1 300px' }}>
                                                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>⛏️ {t('merge.miners', 'Madenciler')}</h5>
                                                    <div className="requirements-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                                                        {totalMiners.map((gItem, idx) => (
                                                            <div key={`gt-${gItem.itemId}-${idx}`} className="req-item-card">
                                                                <div className="req-item-img-wrap">
                                                                    {gItem.reqMinerLevel > 1 && (
                                                                        <img
                                                                            src={getLevelIconUrl(gItem.reqMinerLevel)}
                                                                            alt={`Level ${gItem.reqMinerLevel}`}
                                                                            className="req-item-badge"
                                                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                                        />
                                                                    )}
                                                                    {gItem.imgSrc ? (
                                                                        <img src={gItem.imgSrc} alt={gItem.displayName} className="req-item-img" />
                                                                    ) : (
                                                                        <span className="req-item-fallback">⛏️</span>
                                                                    )}
                                                                </div>
                                                                <div className="req-item-info">
                                                                    <span className="req-item-name">{gItem.displayName}</span>
                                                                    <div className="req-item-bottom">
                                                                        <span className="req-item-qty">x{gItem.totalCount}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {totalParts.length > 0 && (
                                                <div style={{ flex: '1 1 300px' }}>
                                                    <h5 style={{ color: 'var(--text-secondary)', marginBottom: '12px', fontSize: '15px', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>🔩 {t('merge.parts', 'Parçalar')}</h5>
                                                    <div className="requirements-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                                                        {totalParts.map((gItem, idx) => (
                                                            <div key={`gt-${gItem.itemId}-${idx}`} className="req-item-card">
                                                                <div className="req-item-img-wrap">
                                                                    {gItem.imgSrc ? (
                                                                        <img src={gItem.imgSrc} alt={gItem.displayName} className="req-item-img" />
                                                                    ) : (
                                                                        <span className="req-item-fallback">🔩</span>
                                                                    )}
                                                                </div>
                                                                <div className="req-item-info">
                                                                    <span className="req-item-name">{gItem.displayName}</span>
                                                                    <div className="req-item-bottom">
                                                                        <span className="req-item-qty">x{gItem.totalCount}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                    )}
                </>
            )}
        </div>
    );
}
