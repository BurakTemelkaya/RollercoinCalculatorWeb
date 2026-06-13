import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchComponentPrices, type ComponentPrice } from '../services/componentApi';

import commonFanImg from '../assets/items/common_fan.png';
import commonWireImg from '../assets/items/common_wire.png';
import commonHashboardImg from '../assets/items/common_hashboard.png';
import uncommonFanImg from '../assets/items/uncommon_fan.png';
import uncommonWireImg from '../assets/items/uncommon_wire.png';
import uncommonHashboardImg from '../assets/items/uncommon_hashboard.png';
import rareFanImg from '../assets/items/rare_fan.png';
import rareWireImg from '../assets/items/rare_wire.png';
import rareHashboardImg from '../assets/items/rare_hashboard.png';
import epicFanImg from '../assets/items/epic_fan.png';
import epicWireImg from '../assets/items/epic_wire.png';
import epicHashboardImg from '../assets/items/epic_hashboard.png';
import legendaryFanImg from '../assets/items/legendary_fan.png';
import legendaryWireImg from '../assets/items/legendary_wire.png';
import legendaryHashboardImg from '../assets/items/legendary_hashboard.png';

import rltImg from '../assets/coins/rlt.svg';
import craftingImg from '../assets/items/crafting.svg';

import './ComponentForgeCalculator.css';

// ── Constants ──

const RARITY_NAMES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary'] as const;
const RARITY_COLORS: Record<string, string> = {
    Common: '#9ca3af',
    Uncommon: '#10b981',
    Rare: '#3b82f6',
    Epic: '#a855f7',
    Legendary: '#f59e0b',
};

const COMPONENT_TYPES = ['Fan', 'Wire', 'Hashboard'] as const;

/** Component images indexed by [Type][Level] */
const COMPONENT_IMAGES: Record<string, Record<number, string>> = {
    Fan: { 0: commonFanImg, 1: uncommonFanImg, 2: rareFanImg, 3: epicFanImg, 4: legendaryFanImg },
    Wire: { 0: commonWireImg, 1: uncommonWireImg, 2: rareWireImg, 3: epicWireImg, 4: legendaryWireImg },
    Hashboard: { 0: commonHashboardImg, 1: uncommonHashboardImg, 2: rareHashboardImg, 3: epicHashboardImg, 4: legendaryHashboardImg },
};

/**
 * Forge recipes sourced from Rollercoin crafting API.
 * Key: source level → { count: parts needed, fee: RLT forge fee (raw ÷1e6) }
 */
const FORGE_RECIPES: Record<string, Record<number, { count: number; fee: number }>> = {
    fan: {
        0: { count: 50, fee: 2_000 },       // 50 Common → 1 Uncommon
        1: { count: 20, fee: 50_000 },       // 20 Uncommon → 1 Rare
        2: { count: 10, fee: 750_000 },      // 10 Rare → 1 Epic
        3: { count: 5, fee: 500_000 },       // 5 Epic → 1 Legendary
    },
    wire: {
        0: { count: 50, fee: 5_000 },
        1: { count: 20, fee: 2_000 },
        2: { count: 10, fee: 50_000 },
        3: { count: 5, fee: 750_000 },
    },
    hashboard: {
        0: { count: 50, fee: 2_000 },
        1: { count: 20, fee: 50_000 },
        2: { count: 10, fee: 750_000 },
        3: { count: 5, fee: 1_600_000 },
    },
};

const FORGE_DISCOUNTS: Record<number, number> = { 1: 0, 2: 0.05, 3: 0.10, 4: 0.15, 5: 0.25 };

const QUICK_AMOUNTS = [1_000, 10_000, 50_000, 100_000, 500_000];

// ── Helpers ──

function applyForgeDiscount(raw: number, forgeLevel: number): number {
    const d = FORGE_DISCOUNTS[forgeLevel] || 0;
    return Math.round(raw * (1 - d));
}

function formatRlt(raw: number): string {
    const rlt = raw / 1e6;
    if (rlt >= 1_000_000) return rlt.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (rlt >= 1_000) return rlt.toLocaleString('en-US', { maximumFractionDigits: 0 });
    if (rlt >= 1) return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 4 });
}

function formatCount(n: number): string {
    return n.toLocaleString('en-US');
}

interface ForgeStepResult {
    fromLevel: number;
    toLevel: number;
    partsNeeded: number;
    mergeCount: number;
    feePerMerge: number;
    totalFee: number;
}

interface ForgeTargetResult {
    targetLevel: number;
    targetRarity: string;
    partsPerUnit: number;
    producedCount: number;
    totalForgeFees: number;
    forgeFeePerUnit: number;
    marketPricePerUnit: number;
    totalMarketValue: number;
    steps: ForgeStepResult[];
}

/**
 * Forward simulation: given inputCount parts at startLevel,
 * calculate how many targetLevel parts can be forged and the total fees.
 */
function calculateForgeForward(
    typeKey: string,
    startLevel: number,
    targetLevel: number,
    inputCount: number,
    forgeLevel: number,
): { producedCount: number; totalFees: number; steps: ForgeStepResult[] } {
    const recipes = FORGE_RECIPES[typeKey];
    if (!recipes) return { producedCount: 0, totalFees: 0, steps: [] };

    let current = inputCount;
    let totalFees = 0;
    const steps: ForgeStepResult[] = [];

    for (let lvl = startLevel; lvl < targetLevel; lvl++) {
        const recipe = recipes[lvl];
        if (!recipe) break;
        const dc = applyForgeDiscount(recipe.count, forgeLevel);
        const df = applyForgeDiscount(recipe.fee, forgeLevel);
        const merges = Math.floor(current / dc);
        const fee = merges * df;

        steps.push({
            fromLevel: lvl,
            toLevel: lvl + 1,
            partsNeeded: dc,
            mergeCount: merges,
            feePerMerge: df,
            totalFee: fee,
        });
        totalFees += fee;
        current = merges;
    }

    return { producedCount: current, totalFees, steps };
}

/**
 * Backward calculation: how many source-level parts needed for exactly 1 target-level part.
 */
function calcPartsPerUnit(
    typeKey: string,
    startLevel: number,
    targetLevel: number,
    forgeLevel: number,
): number {
    const recipes = FORGE_RECIPES[typeKey];
    if (!recipes) return 0;
    let ppu = 1;
    for (let lvl = targetLevel - 1; lvl >= startLevel; lvl--) {
        const recipe = recipes[lvl];
        if (!recipe) break;
        ppu *= applyForgeDiscount(recipe.count, forgeLevel);
    }
    return ppu;
}

/**
 * Backward calculation: total forge fee for exactly 1 target-level part.
 */
function calcFeePerUnit(
    typeKey: string,
    startLevel: number,
    targetLevel: number,
    forgeLevel: number,
): number {
    const recipes = FORGE_RECIPES[typeKey];
    if (!recipes) return 0;
    let fee = 0;
    for (let lvl = targetLevel - 1; lvl >= startLevel; lvl--) {
        const recipe = recipes[lvl];
        if (!recipe) break;
        const dc = applyForgeDiscount(recipe.count, forgeLevel);
        const df = applyForgeDiscount(recipe.fee, forgeLevel);
        fee = fee * dc + df;
    }
    return fee;
}

// ── Component ──

interface Props {
    forgeLevel: 1 | 2 | 3 | 4 | 5;
    customPartPrices: Record<string, number>;
    onOpenSettings?: () => void;
}

export default function ComponentForgeCalculator({ forgeLevel, customPartPrices, onOpenSettings }: Props) {
    const { t } = useTranslation();

    const [componentType, setComponentType] = useState<string>('Fan');
    const [startLevel, setStartLevel] = useState<number>(0);
    const [partCount, setPartCount] = useState<number>(0);
    const [partCountInput, setPartCountInput] = useState<string>('0');
    const [apiPrices, setApiPrices] = useState<ComponentPrice[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [showAllForgeLevels, setShowAllForgeLevels] = useState(false);

    // Fetch marketplace prices
    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        fetchComponentPrices()
            .then(data => { if (!cancelled) setApiPrices(data); })
            .catch(err => { if (!cancelled) setError(err instanceof Error ? err.message : String(err)); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, []);

    // Get market price for a component type and level
    const getMarketPrice = (type: string, level: number): number => {
        const customKey = `${RARITY_NAMES[level]} ${type}`;
        if (customPartPrices[customKey] !== undefined) {
            return customPartPrices[customKey] * 1e6; // custom is in RLT → raw
        }
        const item = apiPrices.find(p =>
            p.name.toLowerCase() === type.toLowerCase() && p.level === level
        );
        return item?.price || 0;
    };

    // Check if using custom price
    const isCustomPrice = (type: string, level: number): boolean => {
        const customKey = `${RARITY_NAMES[level]} ${type}`;
        return customPartPrices[customKey] !== undefined;
    };

    // Handle count input
    const handleCountChange = (value: string) => {
        setPartCountInput(value);
        const num = parseInt(value.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num) && num >= 0) {
            setPartCount(num);
        }
    };

    const handleCountBlur = () => {
        setPartCountInput(formatCount(partCount));
    };

    const handleCountFocus = () => {
        setPartCountInput(partCount.toString());
    };

    const addQuickAmount = (amount: number) => {
        const newCount = partCount + amount;
        setPartCount(newCount);
        setPartCountInput(formatCount(newCount));
    };

    // Calculate results for selected forge level
    const results: ForgeTargetResult[] = useMemo(() => {
        const typeKey = componentType.toLowerCase();
        const output: ForgeTargetResult[] = [];

        for (let target = startLevel + 1; target <= 4; target++) {
            const { producedCount, totalFees, steps } = calculateForgeForward(
                typeKey, startLevel, target, partCount, forgeLevel
            );
            const ppu = calcPartsPerUnit(typeKey, startLevel, target, forgeLevel);
            const fpu = calcFeePerUnit(typeKey, startLevel, target, forgeLevel);
            const marketPrice = getMarketPrice(componentType, target);

            output.push({
                targetLevel: target,
                targetRarity: RARITY_NAMES[target],
                partsPerUnit: ppu,
                producedCount,
                totalForgeFees: totalFees,
                forgeFeePerUnit: fpu,
                marketPricePerUnit: marketPrice,
                totalMarketValue: producedCount * marketPrice,
                steps,
            });
        }
        return output;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componentType, startLevel, partCount, forgeLevel, apiPrices, customPartPrices]);

    // Calculate forge level comparison for the highest target
    const forgeLevelComparison = useMemo(() => {
        const typeKey = componentType.toLowerCase();
        const maxTarget = 4; // Legendary
        if (startLevel >= maxTarget) return [];

        return [1, 2, 3, 4, 5].map(fl => {
            const { producedCount, totalFees } = calculateForgeForward(
                typeKey, startLevel, maxTarget, partCount, fl
            );
            const ppu = calcPartsPerUnit(typeKey, startLevel, maxTarget, fl);
            const fpu = calcFeePerUnit(typeKey, startLevel, maxTarget, fl);
            const marketPrice = getMarketPrice(componentType, maxTarget);

            return {
                forgeLevel: fl,
                discount: FORGE_DISCOUNTS[fl],
                partsPerUnit: ppu,
                producedCount,
                totalFees,
                feePerUnit: fpu,
                marketPrice,
                totalMarketValue: producedCount * marketPrice,
            };
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [componentType, startLevel, partCount, apiPrices, customPartPrices]);

    // Render
    return (
        <div className="cfc-container">
            <div className="cfc-header">
                <div className="cfc-header-icon">
                    <img src={craftingImg} alt="Forge" width="22" height="22" />
                </div>
                <h3 className="cfc-title">{t('merge.componentCalc.title', 'Parça Birleştirme Hesaplayıcı')}</h3>
            </div>
            <p className="cfc-desc">{t('merge.componentCalc.desc', 'Elinizdeki parçalardan kaç üst seviye parça üretebileceğinizi hesaplayın ve pazar fiyatlarıyla karşılaştırın.')}</p>

            {/* Controls */}
            <div className="cfc-controls">
                {/* Component Type Tabs */}
                <div className="cfc-type-tabs">
                    {COMPONENT_TYPES.map(type => (
                        <button
                            key={type}
                            className={`cfc-type-tab ${componentType === type ? 'active' : ''}`}
                            onClick={() => setComponentType(type)}
                        >
                            <span>{type}</span>
                        </button>
                    ))}
                </div>

                <div className="cfc-controls-row">
                    {/* Starting Rarity */}
                    <div className="cfc-control-group">
                        <label className="cfc-label">{t('merge.componentCalc.partLevel', 'Parça Seviyesi')}</label>
                        <div className="cfc-rarity-select-group" style={{ display: 'flex', gap: '8px' }}>
                            {[0, 1, 2, 3].map(level => (
                                <button
                                    key={level}
                                    className={`cfc-rarity-select-btn ${startLevel === level ? 'active' : ''}`}
                                    onClick={() => {
                                        setStartLevel(level);
                                        setExpandedRow(null);
                                    }}
                                    style={{
                                        padding: '8px',
                                        borderRadius: '8px',
                                        background: startLevel === level ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.05)',
                                        border: `1px solid ${startLevel === level ? '#06b6d4' : 'rgba(255, 255, 255, 0.1)'}`,
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: startLevel === level ? '0 0 8px rgba(6, 182, 212, 0.2)' : 'none'
                                    }}
                                    title={RARITY_NAMES[level]}
                                >
                                    <img 
                                        src={COMPONENT_IMAGES[componentType]?.[level]} 
                                        alt={RARITY_NAMES[level]} 
                                        style={{ width: '32px', height: '32px', objectFit: 'contain' }}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Part Count Input */}
                    <div className="cfc-control-group cfc-count-group">
                        <label className="cfc-label">{t('merge.componentCalc.partCount', 'Parça Sayısı')}</label>
                        <div className="cfc-count-wrapper">
                            <button
                                className="cfc-count-btn"
                                onClick={() => {
                                    const v = Math.max(0, partCount - 1000);
                                    setPartCount(v);
                                    setPartCountInput(formatCount(v));
                                }}
                            >−</button>
                            <input
                                type="text"
                                className="cfc-count-input"
                                value={partCountInput}
                                onChange={e => handleCountChange(e.target.value)}
                                onBlur={handleCountBlur}
                                onFocus={handleCountFocus}
                            />
                            <button
                                className="cfc-count-btn"
                                onClick={() => {
                                    const v = partCount + 1000;
                                    setPartCount(v);
                                    setPartCountInput(formatCount(v));
                                }}
                            >+</button>
                        </div>
                    </div>
                </div>

                {/* Quick Amount Buttons */}
                <div className="cfc-quick-btns">
                    {QUICK_AMOUNTS.map(amount => (
                        <button
                            key={amount}
                            className="cfc-quick-btn"
                            onClick={() => addQuickAmount(amount)}
                        >
                            +{amount >= 1000 ? `${amount / 1000}k` : amount}
                        </button>
                    ))}
                    <button
                        className="cfc-quick-btn cfc-quick-clear"
                        onClick={() => { setPartCount(0); setPartCountInput('0'); }}
                    >
                        ✕
                    </button>
                </div>
            </div>

            {/* Results */}
            {loading ? (
                <div className="cfc-loading">
                    <span className="spinner" />
                    <p>{t('merge.componentCalc.loading', 'Parça fiyatları yükleniyor...')}</p>
                </div>
            ) : error ? (
                <div className="cfc-error">
                    <span>⚠️</span>
                    <p>{t('merge.componentCalc.fetchError', 'Parça fiyatları yüklenemedi')}: {error}</p>
                    <button className="btn-primary" onClick={() => {
                        setError(null);
                        setLoading(true);
                        fetchComponentPrices()
                            .then(setApiPrices)
                            .catch(err => setError(err instanceof Error ? err.message : String(err)))
                            .finally(() => setLoading(false));
                    }}>{t('event.retry', 'Tekrar Dene')}</button>
                </div>
            ) : partCount > 0 && results.length > 0 ? (
                <>
                    {/* Info badge */}
                    <div className="cfc-info-badge">
                        <img src={COMPONENT_IMAGES[componentType]?.[startLevel]} alt="" className="cfc-info-img" />
                        <span>
                            <strong>{formatCount(partCount)}</strong> {RARITY_NAMES[startLevel]} {componentType}
                        </span>
                        <span className="cfc-info-forge">
                            <img src={craftingImg} alt="Forge" width="14" height="14" />
                            Lv.{forgeLevel}
                            {FORGE_DISCOUNTS[forgeLevel] > 0 && <span className="cfc-discount-badge">-{FORGE_DISCOUNTS[forgeLevel] * 100}%</span>}
                        </span>
                    </div>

                    {/* Results Table */}
                    <div className="cfc-table-wrap">
                        <table className="cfc-table">
                            <thead>
                                <tr>
                                    <th>{t('merge.componentCalc.target', 'Hedef')}</th>
                                    <th>{t('merge.componentCalc.required', 'Birim Başı')}</th>
                                    <th>{t('merge.componentCalc.producible', 'Üretilebilir')}</th>
                                    <th>{t('merge.componentCalc.forgeCost', 'Forge Ücreti')}</th>
                                    <th>{t('merge.componentCalc.marketPrice', 'Pazar Fiyatı')}</th>
                                    <th>
                                        <span 
                                            className="cfc-tooltip" 
                                            data-tooltip={t('merge.componentCalc.totalValueTooltip', 'Toplam Pazar Fiyatı - Toplam Forge Ücreti = Net Kâr')}
                                            style={{ textDecorationColor: 'rgba(160, 174, 192, 0.5)' }}
                                        >
                                            {t('merge.componentCalc.totalValue', 'Toplam Değer')}
                                        </span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {results.map((r) => {
                                    const isExpanded = expandedRow === r.targetLevel;
                                    const netValue = r.totalMarketValue - r.totalForgeFees;
                                    const isProfit = netValue > 0;

                                    return (
                                        <tr key={r.targetLevel} className="cfc-result-row-group">
                                            <td>
                                                <div className="cfc-rarity-cell" onClick={() => setExpandedRow(isExpanded ? null : r.targetLevel)} style={{ cursor: 'pointer' }}>
                                                    <img
                                                        src={COMPONENT_IMAGES[componentType]?.[r.targetLevel]}
                                                        alt={r.targetRarity}
                                                        className="cfc-rarity-img"
                                                    />
                                                    <span className="cfc-rarity-badge" style={{ color: RARITY_COLORS[r.targetRarity] }}>
                                                        {r.targetRarity}
                                                    </span>
                                                    <span className="cfc-expand-icon">{isExpanded ? '▾' : '▸'}</span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className="cfc-parts-per-unit">{formatCount(r.partsPerUnit)}</span>
                                            </td>
                                            <td>
                                                <span className={`cfc-produced ${r.producedCount === 0 ? 'zero' : ''}`}>
                                                    {formatCount(r.producedCount)}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cfc-fee-cell">
                                                    <span className="cfc-fee-total">
                                                        <img src={rltImg} alt="RLT" width="12" height="12" />
                                                        {formatRlt(r.totalForgeFees)}
                                                    </span>
                                                    <span 
                                                        className="cfc-fee-unit cfc-tooltip" 
                                                        data-tooltip={t('merge.componentCalc.eaTooltip', 'adet başına')}
                                                    >
                                                        ({formatRlt(r.forgeFeePerUnit)}{t('merge.componentCalc.ea', '/adet')})
                                                    </span>
                                                </div>
                                            </td>
                                            <td>
                                                <span className={`cfc-market-price ${isCustomPrice(componentType, r.targetLevel) ? 'custom' : ''}`}>
                                                    <img src={rltImg} alt="RLT" width="12" height="12" />
                                                    {formatRlt(r.marketPricePerUnit)}
                                                    {isCustomPrice(componentType, r.targetLevel) && <span className="cfc-custom-tag">✏️</span>}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="cfc-value-cell">
                                                    <span className={`cfc-net-value ${isProfit ? 'profit' : 'loss'}`}>
                                                        <img src={rltImg} alt="RLT" width="12" height="12" />
                                                        {formatRlt(r.totalMarketValue)}
                                                    </span>
                                                    {r.producedCount > 0 && r.totalForgeFees > 0 && (
                                                        <span className={`cfc-net-badge ${isProfit ? 'profit' : 'loss'}`}>
                                                            {isProfit ? '▲' : '▼'} {formatRlt(Math.abs(netValue))} {isProfit
                                                                ? t('merge.componentCalc.netProfit', 'Net Kâr')
                                                                : t('merge.componentCalc.netLoss', 'Net Zarar')}
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Expanded Step Details */}
                    {expandedRow !== null && (() => {
                        const r = results.find(r => r.targetLevel === expandedRow);
                        if (!r || r.steps.length === 0) return null;
                        return (
                            <div className="cfc-steps-detail">
                                <h4 className="cfc-steps-title">
                                    {RARITY_NAMES[startLevel]} → {r.targetRarity} {t('merge.componentCalc.stepsTitle', 'Adımlar')}
                                </h4>
                                <div className="cfc-steps-list">
                                    {r.steps.map((step, idx) => (
                                        <div key={idx} className="cfc-step-card">
                                            <div className="cfc-step-header">
                                                <img src={COMPONENT_IMAGES[componentType]?.[step.fromLevel]} alt="" className="cfc-step-img" />
                                                <span className="cfc-step-arrow">→</span>
                                                <img src={COMPONENT_IMAGES[componentType]?.[step.toLevel]} alt="" className="cfc-step-img" />
                                            </div>
                                            <div className="cfc-step-info">
                                                <span style={{ color: RARITY_COLORS[RARITY_NAMES[step.fromLevel]] }}>
                                                    {RARITY_NAMES[step.fromLevel]}
                                                </span>
                                                <span className="cfc-step-arrow-text">→</span>
                                                <span style={{ color: RARITY_COLORS[RARITY_NAMES[step.toLevel]] }}>
                                                    {RARITY_NAMES[step.toLevel]}
                                                </span>
                                            </div>
                                            <div className="cfc-step-stats">
                                                <span className="cfc-step-stat">
                                                    {step.partsNeeded}:1
                                                </span>
                                                <span className="cfc-step-stat">
                                                    ×{formatCount(step.mergeCount)}
                                                </span>
                                                <span className="cfc-step-stat cfc-step-fee cfc-tooltip" data-tooltip={t('merge.componentCalc.eaTooltip', 'adet başına')} style={{ fontSize: '13px' }}>
                                                    <img src={rltImg} alt="RLT" width="12" height="12" />
                                                    {formatRlt(step.feePerMerge)} {t('merge.componentCalc.ea', '/adet')}
                                                </span>
                                                <span 
                                                    className="cfc-step-stat cfc-tooltip" 
                                                    style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)', cursor: 'help', marginTop: '2px' }}
                                                    data-tooltip={t('merge.componentCalc.stepTotalFeeTooltip', 'Bu adımdaki tüm birleştirmeler için ödenen toplam tutar')}
                                                >
                                                    {t('merge.componentCalc.total', 'Toplam')}: {formatRlt(step.totalFee)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* Forge Level Comparison */}
                    {startLevel < 4 && (
                        <div className="cfc-forge-comparison">
                            <button
                                className="cfc-forge-toggle"
                                onClick={() => setShowAllForgeLevels(!showAllForgeLevels)}
                            >
                                <img src={craftingImg} alt="Forge" width="16" height="16" />
                                {t('merge.componentCalc.forgeLevelComparison', 'Forge Seviyesi Karşılaştırması')}
                                <span className="cfc-toggle-icon">{showAllForgeLevels ? '▾' : '▸'}</span>
                                <span className="cfc-forge-target-badge" style={{ color: RARITY_COLORS.Legendary }}>
                                    → Legendary
                                </span>
                            </button>

                            {showAllForgeLevels && forgeLevelComparison.length > 0 && (
                                <div className="cfc-forge-table-wrap">
                                    <table className="cfc-table cfc-forge-table">
                                        <thead>
                                            <tr>
                                                <th>Forge</th>
                                                <th>{t('merge.componentCalc.required', 'Birim Başı')}</th>
                                                <th>{t('merge.componentCalc.producible', 'Üretilebilir')}</th>
                                                <th>{t('merge.componentCalc.forgeCostPerUnit', 'Ücret/Birim')}</th>
                                                <th>{t('merge.componentCalc.totalForgeFee', 'Toplam Ücret')}</th>
                                                <th>{t('merge.componentCalc.totalValue', 'Toplam Değer')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {forgeLevelComparison.map(row => {
                                                const isActive = row.forgeLevel === forgeLevel;
                                                return (
                                                    <tr key={row.forgeLevel} className={isActive ? 'cfc-active-forge' : ''}>
                                                        <td>
                                                            <span className="cfc-forge-level-cell">
                                                                Lv.{row.forgeLevel}
                                                                {row.discount > 0 && (
                                                                    <span className="cfc-discount-badge">-{row.discount * 100}%</span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td>{formatCount(row.partsPerUnit)}</td>
                                                        <td>
                                                            <strong>{formatCount(row.producedCount)}</strong>
                                                        </td>
                                                        <td>
                                                            <span className="cfc-fee-total">
                                                                <img src={rltImg} alt="RLT" width="12" height="12" />
                                                                {formatRlt(row.feePerUnit)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="cfc-fee-total">
                                                                <img src={rltImg} alt="RLT" width="12" height="12" />
                                                                {formatRlt(row.totalFees)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span className="cfc-fee-total" style={{ color: '#10b981' }}>
                                                                <img src={rltImg} alt="RLT" width="12" height="12" />
                                                                {formatRlt(row.totalMarketValue)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : partCount === 0 ? (
                <div className="cfc-empty">
                    <span style={{ fontSize: '32px' }}>🔩</span>
                    <p>{t('merge.componentCalc.enterCount', 'Hesaplamak için parça sayısı girin')}</p>
                </div>
            ) : null}

            {/* Market Prices Reference */}
            {!loading && !error && apiPrices.length > 0 && (
                <div className="cfc-market-ref">
                    <h4 className="cfc-market-ref-title">{t('merge.componentCalc.marketPrices', 'Güncel Pazar Fiyatları')}</h4>
                    <div className="cfc-market-table-wrap">
                        <table className="cfc-market-table">
                            <thead>
                                <tr>
                                    <th></th>
                                    {RARITY_NAMES.map((r, i) => (
                                        <th key={i} style={{ color: RARITY_COLORS[r] }}>{r}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {COMPONENT_TYPES.map(type => (
                                    <tr key={type}>
                                        <td className="cfc-market-type-cell">
                                            <img src={COMPONENT_IMAGES[type]?.[0]} alt={type} className="cfc-market-type-img" />
                                            <span>{type}</span>
                                        </td>
                                        {RARITY_NAMES.map((_, level) => {
                                            const price = getMarketPrice(type, level);
                                            const custom = isCustomPrice(type, level);
                                            return (
                                                <td 
                                                    key={level} 
                                                    className={custom ? 'cfc-custom-cell' : ''}
                                                    onClick={onOpenSettings}
                                                    style={{ cursor: onOpenSettings ? 'pointer' : 'default', position: 'relative' }}
                                                    title={t('merge.componentCalc.editPrice', 'Fiyatı Düzenle')}
                                                >
                                                    <span className="cfc-market-price-cell">
                                                        <img src={COMPONENT_IMAGES[type]?.[level]} alt="" style={{ width: '18px', height: '18px', objectFit: 'contain' }} />
                                                        {price > 0 ? formatRlt(price) : '—'}
                                                        {custom && <span className="cfc-custom-tag" style={{ marginLeft: '4px' }}>✏️</span>}
                                                    </span>
                                                    {onOpenSettings && (
                                                        <span className="cfc-market-edit-icon">⚙️</span>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <p className="cfc-market-ref-hint">
                        {t('merge.componentCalc.marketHint', "Fiyatlar API'den çekilmektedir.")}
                    </p>
                </div>
            )}
        </div>
    );
}
