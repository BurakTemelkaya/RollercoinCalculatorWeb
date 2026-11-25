import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fetchMergesByMinerSlug } from '../services/mergeApi';
import { fetchComponentPrices, type ComponentPrice } from '../services/componentApi';
import { fetchPuzzleEvent } from '../services/puzzleEventApi';
import { fetchProgressionEvent } from '../services/progressionEventApi';
import type { MinerItem } from '../types/progressionEvent';
import { priceMergePart } from '../utils/marketDepth';
import MergeMarketTiers from './MergeMarketTiers';
import type { MergeDetail } from '../types/merge';
import { forgeBatchParts, planOwnedMerges } from '../utils/forgeAnalysis';
import { autoScalePower } from '../utils/powerParser';
import CdnImage from './CdnImage';
import MinerStatusBadges from './MinerStatusBadges';

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
    return Math.floor(rawAmount * (1 - discount));
}

function getMinerImageUrl(fileName: string, imageVersion?: number): string {
    const v = imageVersion ? imageVersion : 1;
    const sanitizedFilename = fileName?.replace(/['’]/g, '') || '';
    return `https://static.rollercoin.com/static/img/market/miners/${sanitizedFilename}.gif?v=${v}`;
}

function getLevelIconUrl(level: number, type?: string): string {
    if (type === 'old_merge') return '/miner-levels/level_star.png';
    return `/miner-levels/level_${level}.webp`;
}

function formatRltAmount(rawAmount: number): string {
    const rlt = rawAmount / 1e6;
    if (rlt >= 1000) {
        return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
    return rlt.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: rlt < 1 ? 4 : 2 });
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
    const { lang, minerSlug } = useParams<{ lang: string, minerSlug: string }>();
    const navigate = useNavigate();
    // Slug we just redirected to; skips refetching data we already have
    const redirectedSlugRef = useRef<string | null>(null);
    const { t } = useTranslation();

    const [data, setData] = useState<MergeDetail[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // State for toggling level 1 parts market cost visibility
    const [showLevel1Cost, setShowLevel1Cost] = useState(() => localStorage.getItem('rollercoin_web_show_level1_cost') === 'true');
    useEffect(() => { localStorage.setItem('rollercoin_web_show_level1_cost', String(showLevel1Cost)); }, [showLevel1Cost]);
    const [targetLevel, setTargetLevel] = useState<number | 'all'>('all');
    // Owned miner counts by level; empty means show the all-combinations table
    const [owned, setOwned] = useState<Record<number, number>>({});

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
            if (!minerSlug || minerSlug === redirectedSlugRef.current) return;
            try {
                setLoading(true);
                setError(null);
                const result = await fetchMergesByMinerSlug(minerSlug);
                // Sort by level ascending
                const sorted = result.sort((a, b) => a.resultItemLevel - b.resultItemLevel);
                setData(sorted);

                // Legacy name URLs (e.g. "Poolside%20Haul") → canonical /merges/miner/{slug}
                const slug = sorted[0]?.resultItemSlug;
                if (slug && slug !== minerSlug) {
                    redirectedSlugRef.current = slug;
                    navigate(`/${lang}/merges/miner/${slug}`, { replace: true });
                }
            } catch (err) {
                console.error('Failed to fetch miner levels:', err);
                setError(err instanceof Error ? err.message : t('merge.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [minerSlug, t, lang, navigate]);

    const [marketPrices, setMarketPrices] = useState<ComponentPrice[]>([]);
    useEffect(() => {
        let active = true;
        fetchComponentPrices({ fresh: true })
            .then(prices => { if (active && Array.isArray(prices)) setMarketPrices(prices); })
            .catch(() => {});
        return () => { active = false; };
    }, []);

    // Miner rewards of the latest puzzle and progression events (API levels are 0-based)
    const [eventMiners, setEventMiners] = useState<{ kind: 'puzzle' | 'event'; name: string; path: string; miners: { name: string; level: number; amount: number }[] }[]>([]);
    useEffect(() => {
        let active = true;
        Promise.allSettled([fetchPuzzleEvent(), fetchProgressionEvent()]).then(([puzzle, progression]) => {
            if (!active) return;
            const list: typeof eventMiners = [];
            if (puzzle.status === 'fulfilled' && puzzle.value.id) {
                const p = puzzle.value;
                // Assumes the whole board gets collected, as with level rewards
                const rewards = [...p.levels.flatMap(l => l.rewards), ...p.board].filter(r => r.type === 'miner' && r.name && r.minerLevel !== null);
                list.push({ kind: 'puzzle', name: p.name, path: `/${lang}/puzzle/${p.slug ?? p.id}`, miners: rewards.map(r => ({ name: r.name!, level: r.minerLevel!, amount: r.amount })) });
            }
            if (progression.status === 'fulfilled') {
                const e = progression.value;
                const rewards = e.rewards.filter(r => r.type === 'miner' && r.item).map(r => ({ amount: r.amount, item: r.item as MinerItem }));
                list.push({ kind: 'event', name: e.name, path: `/${lang}/event/${e.slug ?? e.id}`, miners: rewards.map(r => ({ name: r.item!.name.en, level: r.item!.level, amount: r.amount })) });
            }
            setEventMiners(list);
        });
        return () => { active = false; };
    }, [lang]);

    type RequiredItem = MergeDetail['requiredItems'][number];
    const findMarket = (item: RequiredItem) => {
        const name = getPartDisplayName(item.itemName, item.level).toLowerCase();
        return marketPrices.find(price => price.level === item.level && getPartDisplayName(price.name, price.level).toLowerCase() === name);
    };
    const getPartCost = (item: RequiredItem, quantity: number) =>
        priceMergePart(findMarket(item), item.price, quantity, customPartPrices[getPartDisplayName(item.itemName, item.level)]);
    const isCostCounted = (item: RequiredItem) => item.type === 'mutation_components' && (item.level !== 0 || showLevel1Cost);

    const calcLevelCost = (detail: MergeDetail, merges = 1): { partsCost: number, feeCost: number, totalCost: number } => {
        const partsCost = detail.requiredItems
            .filter(isCostCounted)
            .reduce((sum, item) => sum + getPartCost(item, forgeBatchParts(item.count, merges, forgeLevel)).total, 0);
        const feeCost = applyForgeDiscount(detail.amount, forgeLevel) * merges;
        return { partsCost, feeCost, totalCost: partsCost + feeCost };
    };

    const availableLevels = [...new Set(data.map(d => d.resultItemLevel + 1))].sort((a, b) => a - b);
    const filteredData = targetLevel === 'all' ? data : data.filter(d => (d.resultItemLevel + 1) <= targetLevel);
    // Detail with resultItemLevel r merges two level-r miners into one level r+1
    const fromLevels = filteredData.map(d => d.resultItemLevel);
    const topLevel = fromLevels.length ? Math.max(...fromLevels) + 1 : 0;
    const detailFrom = (level: number) => filteredData.find(d => d.resultItemLevel === level);

    const costPlan = (miners: Record<number, number>) => {
        const result = planOwnedMerges(miners, Math.min(...fromLevels), topLevel);
        const steps = filteredData
            .filter(d => result.merges[d.resultItemLevel] > 0)
            .map(d => ({ detail: d, merges: result.merges[d.resultItemLevel], ...calcLevelCost(d, result.merges[d.resultItemLevel]) }));
        return { ...result, steps, partsCost: steps.reduce((sum, s) => sum + s.partsCost, 0), feeCost: steps.reduce((sum, s) => sum + s.feeCost, 0) };
    };

    const hasOwned = fromLevels.some(level => (owned[level] || 0) > 0);
    const plan = hasOwned ? costPlan(owned) : null;
    const planSteps = plan?.steps ?? [];
    const planPartsCost = plan?.partsCost ?? 0;
    const planFeeCost = plan?.feeCost ?? 0;

    // Latest events that give this miner in enough copies to reach the top level
    const minerName = data[0]?.resultItemName?.toLowerCase();
    const eventPlans = fromLevels.length && minerName ? eventMiners
        .map(ev => {
            const miners: Record<number, number> = {};
            ev.miners.filter(m => m.name.toLowerCase() === minerName)
                .forEach(m => { miners[m.level + 1] = (miners[m.level + 1] || 0) + m.amount; });
            return { ...ev, miners, plan: costPlan(miners) };
        })
        .filter(ev => ev.plan.result[topLevel] > 0) : [];
    // Cost of one level-`to` miner built from 2^(to-from) level-`from` miners
    const comboCost = (from: number, to: number) => {
        let total = 0;
        for (let level = from; level < to; level++) {
            const detail = detailFrom(level);
            if (!detail) return null;
            total += calcLevelCost(detail, 2 ** (to - 1 - level)).totalCost;
        }
        return total;
    };

    // Miner image per level: results give levels 2+, the required miner gives the lowest level
    const minerImages = new Map<number, { fileName: string; imageVersion?: number | null }>();
    data.forEach(d => {
        const reqMiner = d.requiredItems.find(item => item.type === 'miners' && item.fileName);
        if (reqMiner?.fileName && !minerImages.has(d.resultItemLevel)) minerImages.set(d.resultItemLevel, { fileName: reqMiner.fileName, imageVersion: reqMiner.imageVersion });
        if (d.resultItemFileName) minerImages.set(d.resultItemLevel + 1, { fileName: d.resultItemFileName, imageVersion: d.resultItemImageVersion });
    });
    const levelTag = (level: number) => (
        <span className="level-tag">
            {minerImages.has(level) && (
                <CdnImage
                    type="miner"
                    itemId={minerImages.get(level)!.fileName.split('.')[0]}
                    fallbackUrl={getMinerImageUrl(minerImages.get(level)!.fileName, minerImages.get(level)!.imageVersion || undefined)}
                    alt=""
                    className="level-tag-miner"
                />
            )}
            {level > 1 && <img src={getLevelIconUrl(level)} alt="" />}
            Lv.{level}
        </span>
    );

    return (
        <div className="merge-container">
            <div className="merge-header">
                <div className="merge-header-left">
                    <Link to={`/${lang}/merges`} className="merge-back-btn">
                        {t('merge.backToMerges', '← Geri')}
                    </Link>
                </div>
                <h2 className="merge-title">
                    {data[0]?.resultItemName ?? minerSlug} - {t('merge.allLevelsCost', 'Tüm Seviyelerin Maliyeti')}
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
                    {filteredData.length > 0 && (
                        <div className="miner-levels-grand-total">
                            <h3 className="grand-total-title">{t('merge.ownedTitle', 'Elimdeki Minerlar')}</h3>
                            <p className="owned-hint">{t('merge.ownedHint', 'Her seviyeden kaç tane olduğunu girin; bunları birleştirmenin maliyeti hesaplansın. Boş bırakırsanız tüm kombinasyonlar gösterilir.')}</p>
                            {eventPlans.map(ev => (
                                <div key={ev.path} className="event-merge-card">
                                    <div className="event-merge-head">
                                        <Link to={ev.path}>{ev.kind === 'puzzle' ? 'Puzzle' : 'Event'}: {ev.name}</Link>
                                        <span className="cost-val highlight"><img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(ev.plan.partsCost + ev.plan.feeCost)} RLT</span>
                                    </div>
                                    <p className="owned-hint">
                                        {t('merge.eventMergeHint', 'Etkinlikten gelen minerlarla Lv.{{level}} yapma maliyeti', { level: topLevel })}:{' '}
                                        {Object.entries(ev.miners).map(([lv, n]) => `${n}× Lv.${lv}`).join(', ')}
                                    </p>
                                    <button type="button" className="owned-clear" onClick={() => setOwned(ev.miners)}>
                                        {t('merge.eventMergeUse', 'Detayları göster')}
                                    </button>
                                </div>
                            ))}
                            <div className="owned-inputs">
                                {fromLevels.map(level => (
                                    <label key={level} className="owned-input">
                                        {levelTag(level)}
                                        <input
                                            type="number"
                                            min={0}
                                            inputMode="numeric"
                                            aria-label={`Level ${level}`}
                                            value={owned[level] || ''}
                                            placeholder="0"
                                            onChange={(e) => setOwned(prev => ({ ...prev, [level]: Math.max(0, parseInt(e.target.value, 10) || 0) }))}
                                        />
                                    </label>
                                ))}
                                {hasOwned && (
                                    <button type="button" className="owned-clear" onClick={() => setOwned({})}>
                                        {t('merge.ownedClear', 'Temizle')}
                                    </button>
                                )}
                            </div>

                            {plan ? (
                                <>
                                    {planSteps.length === 0 ? (
                                        <p className="owned-hint">{t('merge.ownedNothing', 'Birleştirilecek çift yok.')}</p>
                                    ) : (
                                        <div className="merge-plan">
                                            <div className="merge-plan-row merge-plan-head">
                                                <span>{t('merge.planStep', 'Birleştirme')}</span>
                                                <span>{t('merge.planParts', 'Parçalar')}</span>
                                                <span className="merge-plan-num">{t('merge.planFee', 'Forge Ücreti')}</span>
                                                <span className="merge-plan-num">{t('merge.totalCost', 'Toplam')}</span>
                                            </div>
                                            {planSteps.map(step => (
                                                <div key={step.detail.id} className="merge-plan-row">
                                                    <span className="merge-plan-step">
                                                        <span className="merge-plan-count">{step.merges}×</span>
                                                        {levelTag(step.detail.resultItemLevel)}
                                                        <span className="merge-plan-arrow">→</span>
                                                        {levelTag(step.detail.resultItemLevel + 1)}
                                                    </span>
                                                    <span className="merge-plan-parts">
                                                        {!step.detail.requiredItems.some(isCostCounted) && '–'}
                                                        {step.detail.requiredItems.filter(isCostCounted).map((item, idx) => (
                                                            <span key={idx} className="merge-plan-part">
                                                                <img src={getMutationComponentImage(item.itemName, item.level) ?? undefined} alt="" />
                                                                {forgeBatchParts(item.count, step.merges, forgeLevel)}× {getPartDisplayName(item.itemName, item.level)}
                                                            </span>
                                                        ))}
                                                    </span>
                                                    <span className="merge-plan-num merge-plan-fee"><img src={rltImg} alt="RLT" width="14" /> {formatRltAmount(step.feeCost)}</span>
                                                    <span className="merge-plan-num merge-plan-total"><img src={rltImg} alt="RLT" width="14" /> {formatRltAmount(step.totalCost)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    <div className="merge-plan-result">
                                        <span className="merge-plan-result-label">{t('merge.ownedResult', 'Sonuç')}</span>
                                        {Object.entries(plan.result).filter(([, n]) => n > 0).map(([lv, n]) => (
                                            <span key={lv} className="merge-plan-chip">{n}× {levelTag(Number(lv))}</span>
                                        ))}
                                    </div>
                                    <div className="grand-total-stats">
                                        <div className="grand-total-stat">
                                            <span className="stat-label">{t('merge.totalPartsCost', 'Toplam Parça Maliyeti')}</span>
                                            <span className="stat-val"><img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(planPartsCost)} RLT</span>
                                        </div>
                                        <div className="grand-total-stat">
                                            <span className="stat-label">{t('merge.totalFeeCost', 'Toplam Forge Ücreti')}</span>
                                            <span className="stat-val"><img src={rltImg} alt="RLT" width="16" /> {formatRltAmount(planFeeCost)} RLT</span>
                                        </div>
                                        <div className="grand-total-stat highlight">
                                            <span className="stat-label">{t('merge.finalCost', 'Genel Toplam')}</span>
                                            <span className="stat-val"><img src={rltImg} alt="RLT" width="22" /> {formatRltAmount(planPartsCost + planFeeCost)} RLT</span>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="combo-table-wrap">
                                    <table className="combo-table">
                                        <thead>
                                            <tr>
                                                <th>{t('merge.comboFromTo', 'Başlangıç → Hedef')}</th>
                                                {fromLevels.map(level => <th key={level} className={level + 1 === topLevel ? 'combo-top' : undefined}>{levelTag(level + 1)}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {fromLevels.map(from => (
                                                <tr key={from}>
                                                    <th>{levelTag(from)}</th>
                                                    {fromLevels.map(level => {
                                                        const to = level + 1;
                                                        const cost = to > from ? comboCost(from, to) : null;
                                                        return (
                                                            <td key={to} className={cost === null ? 'combo-empty' : to === topLevel ? 'combo-top' : undefined}>
                                                                {cost === null ? null : (
                                                                    <>
                                                                        <span className="combo-cost"><img src={rltImg} alt="RLT" width="14" /> {formatRltAmount(cost)}</span>
                                                                        <span className="combo-miners">{2 ** (to - from)}× Lv.{from}</span>
                                                                    </>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                    <div className="merge-miner-levels-list">
                        {filteredData.map((detail) => {
                            const { partsCost, totalCost } = calcLevelCost(detail);
                            const resultLevel = detail.resultItemLevel + 1; // API 1 = Level 2 display

                            return (
                                <div key={detail.id} className="miner-level-card">
                                    <div className="miner-level-card-top">
                                        <div className="miner-level-result">
                                            <div className="miner-level-img-wrap">
                                                <MinerStatusBadges isCanBeSoldOnMp={detail.resultItemIsCanBeSoldOnMp} isInSet={detail.resultItemIsInSet} />
                                                <img
                                                    src={getLevelIconUrl(resultLevel)}
                                                    alt={`Level ${resultLevel}`}
                                                    className="miner-level-badge"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                                {detail.resultItemFileName ? (
                                                    <CdnImage
                                                        type="miner"
                                                        itemId={detail.resultItemFileName?.split('.')[0] || ''}
                                                        fallbackUrl={getMinerImageUrl(detail.resultItemFileName, detail.resultItemImageVersion || undefined)}
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
                                            <div className="requirements-lines">
                                                {detail.requiredItems.map((item, idx) => {
                                                    const isMiner = item.type === 'miners';
                                                    const isMutationComponent = item.type === 'mutation_components';
                                                    const reqMinerLevel = isMiner ? (item.level > 0 ? item.level : Math.max(0, detail.resultItemLevel - 1)) + 1 : 0;
                                                    const displayName = isMiner ? `${item.itemName} Level ${reqMinerLevel}` : getPartDisplayName(item.itemName, item.level);
                                                    const discountedCount = isMutationComponent ? forgeBatchParts(item.count, 1, forgeLevel) : item.count;
                                                    const unit = isMutationComponent ? getPartCost(item, discountedCount).unit : null;

                                                    const line = (
                                                        <span className="req-line">
                                                            <span className="req-line-img">
                                                                {isMiner && item.fileName ? (
                                                                    <CdnImage
                                                                        type="miner"
                                                                        itemId={item.fileName.split('.')[0]}
                                                                        fallbackUrl={getMinerImageUrl(item.fileName, item.imageVersion || undefined)}
                                                                        alt={displayName}
                                                                    />
                                                                ) : isMutationComponent ? (
                                                                    <img src={getMutationComponentImage(item.itemName, item.level) ?? undefined} alt={displayName} />
                                                                ) : (
                                                                    <span>{isMiner ? '⛏️' : '🔩'}</span>
                                                                )}
                                                            </span>
                                                            <span className="req-line-text">
                                                                <strong>{discountedCount}×</strong> {displayName}
                                                                {unit !== null && <span className="req-line-price"> · {formatRltAmount(unit * 1e6)} RLT</span>}
                                                            </span>
                                                        </span>
                                                    );

                                                    if (!isMutationComponent) return <div key={`${item.itemId}-${idx}`} className="mmt mmt-static">{line}</div>;
                                                    const market = findMarket(item);
                                                    return (
                                                        <MergeMarketTiers
                                                            key={`${item.itemId}-${idx}`}
                                                            summary={line}
                                                            quantity={discountedCount}
                                                            offers={market?.componentPrices}
                                                            totalCount={market?.totalCount}
                                                        />
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
                </>
            )}
        </div>
    );
}
