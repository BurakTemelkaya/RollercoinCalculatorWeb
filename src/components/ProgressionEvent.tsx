import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { fetchProgressionEvent, type ParsedProgressionEvent } from '../services/progressionEventApi';
import type {
    ProgressionReward,
    LevelConfig,
    MinerItem,
    RackItem,
    UtilityItem,
    MutationComponentItem,
    MysteryBoxItem,
} from '../types/progressionEvent';
import {
    BOX_PRICE_OPTIONS,
    DISCOUNT_OPTIONS,
    EVENT_CONSTANTS,
} from '../types/progressionEvent';
import { autoScalePower } from '../utils/powerParser';
import './ProgressionEvent.css';

import batteryImg from '../assets/items/battery.png';
import bonusPowerImg from '../assets/items/bonus_power.png';
import xpImg from '../assets/items/xp.png';
import speedupImg from '../assets/items/speedup_item.gif';
import commonFanImg from '../assets/items/common_fan.png';
import commonHashboardImg from '../assets/items/common_hashboard.png';
import commonWireImg from '../assets/items/common_wire.png';
import uncommonFanImg from '../assets/items/uncommon_fan.png';
import uncommonHashboardImg from '../assets/items/uncommon_hashboard.png';
import uncommonWireImg from '../assets/items/uncommon_wire.png';
import rareFanImg from '../assets/items/rare_fan.png';
import rareHashboardImg from '../assets/items/rare_hashboard.png';
import rareWireImg from '../assets/items/rare_wire.png';
import epicFanImg from '../assets/items/epic_fan.png';
import epicHashboardImg from '../assets/items/epic_hashboard.png';
import epicWireImg from '../assets/items/epic_wire.png';
import legendaryFanImg from '../assets/items/legendary_fan.png';
import legendaryHashboardImg from '../assets/items/legendary_hashboard.png';
import legendaryWireImg from '../assets/items/legendary_wire.png';
import abandonedMineChestImg from '../assets/items/Abandoned_mine_chest_d310e38e-9dea-4756-a017-cf427dc65abf.png';
import wiresCaseImg from '../assets/items/wires_case_855b977d-950c-45e3-a315-b20be4a052ab.png';
import hashboardCaseImg from '../assets/items/hashboard_case_1116df97-ed73-4baf-a0d8-76a9cb7cf588.png';
import fansCaseImg from '../assets/items/fans_case_7bfde88d-fc4c-414f-a539-2ee2673ad216.png';
import rstImg from '../assets/coins/rst.svg';
import rltImg from '../assets/coins/rlt.svg';
import diamondChestImg from '../assets/items/diamond_mine_chest_abbb269d-2d0d-4773-8c76-93e300db4614.png';

type EventTab = 'rewards' | 'multiplier';

// Cache for the fetched event data
const STORAGE_KEY = 'rollercoin_web_progression_event';
const STORAGE_TIMESTAMP_KEY = 'rollercoin_web_progression_event_ts';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Removed fixed RLT_PRICE constant

/**
 * Format power value from API (Gh/s) to human-readable string.
 * API returns power in Gh/s as raw number. We convert to H/s base then auto-scale.
 */
function formatPower(powerGhs: number): string {
    // Convert Gh/s to H/s (base unit), then auto-scale
    const baseValue = powerGhs * 1e9;
    const scaled = autoScalePower(baseValue);
    // Format with thousands separator
    const formatted = scaled.value.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    });
    return `${formatted} ${scaled.unit}/s`;
}

function formatNumber(num: number): string {
    return Math.ceil(num).toLocaleString('en-US');
}

function getMinerImageUrl(filename: string): string {
    return `https://static.rollercoin.com/static/img/market/miners/${filename}.gif?v=1`;
}

function getRackImageUrl(id: string): string {
    return `https://static.rollercoin.com/static/img/market/racks/${id}.png?v=1.0.4`;
}

function getMutationComponentImage(itemId: string | null, item?: MutationComponentItem): string | null {
    const name = item?.name?.en?.toLowerCase() ?? '';

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
    if (name.includes('common')) {
        if (name.includes('fan')) return commonFanImg;
        if (name.includes('hashboard')) return commonHashboardImg;
        if (name.includes('wire') || name.includes('wiring')) return commonWireImg;
    }

    // Fallbacks if rarity is not specified
    if (name.includes('fan')) return commonFanImg;
    if (name.includes('hashboard')) return commonHashboardImg;
    if (name.includes('wire') || name.includes('wiring')) return commonWireImg;

    // Hardcoded legacy item IDs as last resort
    if (itemId === '6196269b67433d2dc52e0130') {
        return legendaryFanImg;
    }
    if (itemId === '61b35e3767433d2dc57f86a2') {
        return rareFanImg;
    }

    return null;
}

function getMutationComponentDisplayName(itemId: string | null, item?: MutationComponentItem): string {
    if (itemId === '6196269b67433d2dc52e0130') {
        return 'Legendary Fan';
    }
    if (itemId === '61b35e3767433d2dc57f86a2') {
        return 'Rare Fan';
    }

    return item?.name?.en ?? 'Mutation Component';
}

function getMysteryBoxImageUrl(box?: MysteryBoxItem): string | null {
    // Prefer API-provided image URL (dynamic, no manual update needed)
    if (box?.media?.box_image_url) {
        return `https://static.rollercoin.com/${box.media.box_image_url}`;
    }
    return null;
}

function getMysteryBoxLocalFallback(box?: MysteryBoxItem, fallbackTitle?: string): string {
    const title = (box?.title?.en ?? fallbackTitle ?? '').toLowerCase();

    if (title.includes('wires') || title.includes('wire')) {
        return wiresCaseImg;
    }
    if (title.includes('hashboard')) {
        return hashboardCaseImg;
    }
    if (title.includes('fan')) {
        return fansCaseImg;
    }
    if (title.includes('diamond mine chest')) {
        return diamondChestImg;
    }

    return abandonedMineChestImg;
}

// Get local image for known reward types
function getRewardTypeImage(type: string): string | null {
    switch (type) {
        case 'power': return bonusPowerImg;
        case 'battery': return batteryImg;
        case 'season_pass_xp': return xpImg;
        case 'utility_item': return speedupImg;
        case 'mutation_component':
            return rewardTypeFallbackIcon;
        case 'mystery_box':
            return rewardTypeFallbackIcon;
        default: return null;
    }
}

const rewardTypeFallbackIcon = xpImg;

function getRewardDisplay(
    reward: ProgressionReward,
    t: (key: string, opts?: Record<string, unknown>) => string
): { text: string; subText: string; imageUrl?: string; localImage?: string; level?: number } {
    switch (reward.type) {
        case 'power': {
            const durationDays = reward.ttl_time > 0 ? Math.round(reward.ttl_time / 86400000) : 0;
            const duration = durationDays > 0 ? ` (${durationDays}${t('event.daysShort')})` : '';
            return {
                text: t('event.rewardTypes.power'),
                subText: `${formatPower(reward.amount)}${duration}`,
                localImage: bonusPowerImg,
            };
        }
        case 'money': {
            const amount = reward.amount / 1e6;
            let moneyIcon = undefined;
            if (reward.currency === 'RST') {
                moneyIcon = rstImg;
            } else if (reward.currency === 'RLT') {
                moneyIcon = rltImg;
            }
            return {
                text: `${amount} ${reward.currency}`,
                subText: `${amount} ${reward.currency}`,
                localImage: moneyIcon,
            };
        }
        case 'season_pass_xp':
            return {
                text: `Event Pass ${reward.amount} XP`,
                subText: `Event Pass ${reward.amount} XP`,
                localImage: xpImg,
            };
        case 'battery':
            return {
                text: t('event.rewardTypes.battery'),
                subText: `Battery x${reward.amount}`,
                localImage: batteryImg,
            };
        case 'miner': {
            const miner = reward.item as MinerItem | undefined;
            if (miner) {
                const bonusPct = (miner.bonus / 100);
                return {
                    text: miner.name.en,
                    subText: `${formatPower(miner.power)} | ${bonusPct}%`,
                    imageUrl: getMinerImageUrl(miner.filename),
                    level: miner.level,
                };
            }
            return { text: t('event.rewardTypes.miner'), subText: '' };
        }
        case 'rack': {
            const rack = reward.item as RackItem | undefined;
            if (rack) {
                return {
                    text: rack.name.en,
                    subText: `Rack Bonus:${rack.capacity * 5}%`,
                    imageUrl: getRackImageUrl(rack._id),
                };
            }
            return { text: t('event.rewardTypes.rack'), subText: '' };
        }
        case 'utility_item': {
            const utility = reward.item as UtilityItem | undefined;
            if (utility) {
                // Use API-provided image URL (dynamic, no manual update needed)
                const utilityImageUrl = utility.media?.preview_url
                    ? `https://static.rollercoin.com/${utility.media.preview_url}`
                    : undefined;
                return {
                    text: `${utility.name.en} x${reward.amount}`,
                    subText: utility.name.en,
                    imageUrl: utilityImageUrl,
                    localImage: utilityImageUrl ? undefined : speedupImg,
                };
            }
            return { text: t('event.rewardTypes.utilityItem'), subText: '' };
        }
        case 'mutation_component': {
            const component = reward.item as MutationComponentItem | undefined;
            const displayName = getMutationComponentDisplayName(reward.item_id, component);
            return {
                text: `${displayName} x${reward.amount}`,
                subText: displayName,
                localImage: getMutationComponentImage(reward.item_id, component) ?? undefined,
            };
        }
        case 'mystery_box': {
            const box = reward.item as MysteryBoxItem | undefined;
            const boxTitle = box?.title?.en ?? reward.title.en;
            // Use API-provided image URL (dynamic, no manual update needed)
            const boxImageUrl = getMysteryBoxImageUrl(box);
            return {
                text: `${boxTitle} x${reward.amount}`,
                subText: '',
                imageUrl: boxImageUrl ?? undefined,
                localImage: boxImageUrl ? undefined : getMysteryBoxLocalFallback(box, reward.title.en),
            };
        }
        default:
            return { text: reward.title.en, subText: '' };
    }
}

export default function ProgressionEvent() {
    const { lang } = useParams<{ lang: string }>();
    const { t } = useTranslation();
    const [eventData, setEventData] = useState<ParsedProgressionEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<EventTab>('rewards');
    const [adBlockWarning, setAdBlockWarning] = useState(false);

    // Multiplier settings
    const [rltPrice, setRltPrice] = useState<number>(1.05);
    const [boxPrice, setBoxPrice] = useState<number>(BOX_PRICE_OPTIONS[0]);
    const [discount, setDiscount] = useState<number>(35);
    const [filterMin, setFilterMin] = useState<number>(1);
    const [filterMax, setFilterMax] = useState<number>(100);
    const [showChart, setShowChart] = useState(false);

    const MAX_MULTIPLIER = 100;

    // Fetch event data
    useEffect(() => {
        const loadEvent = async () => {
            // Check cache first
            try {
                const cachedData = localStorage.getItem(STORAGE_KEY);
                const cachedTimestamp = localStorage.getItem(STORAGE_TIMESTAMP_KEY);
                if (cachedData && cachedTimestamp) {
                    const elapsed = Date.now() - parseInt(cachedTimestamp, 10);
                    if (elapsed < CACHE_DURATION) {
                        setEventData(JSON.parse(cachedData));
                        setLoading(false);
                        return;
                    }
                }
            } catch {
                // Ignore cache errors
            }

            try {
                setLoading(true);
                setError(null);
                const data = await fetchProgressionEvent();
                setEventData(data);
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
            } catch (err) {
                console.error('Failed to fetch progression event:', err);
                setError(err instanceof Error ? err.message : t('event.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [t]);

    // Test for ad-blocker by attempting to load external resource
    useEffect(() => {
        const testAdBlocker = async () => {
            try {
                const testUrl = 'https://static.rollercoin.com/static/img/market/miners/antminer_s9.gif?v=1';
                await fetch(testUrl, { method: 'HEAD', mode: 'no-cors' });
                // If we get here without error, external resources are accessible
                setAdBlockWarning(false);
            } catch (err) {
                console.warn('External resource blocked - possible ad-blocker detected:', err);
                setAdBlockWarning(true);
            }
        };

        // Delay test slightly to avoid interfering with main data load
        const timer = setTimeout(testAdBlocker, 1000);
        return () => clearTimeout(timer);
    }, []);

    // Calculate total event rewards summary
    const eventSummary = useMemo(() => {
        if (!eventData) return null;

        const rewards = eventData.data.rewards;
        let totalMinerPower = 0;
        let totalBonus = 0;
        let tempPower = 0;
        let seasonExp = 0;
        let rstAmount = 0;

        for (const reward of rewards) {
            switch (reward.type) {
                case 'miner': {
                    const miner = reward.item as MinerItem | undefined;
                    if (miner) {
                        totalMinerPower += miner.power * reward.amount;
                        totalBonus += miner.bonus * reward.amount;
                    }
                    break;
                }
                case 'power':
                    tempPower += reward.amount;
                    break;
                case 'season_pass_xp':
                    seasonExp += reward.amount;
                    break;
                case 'money':
                    if (reward.currency === 'RST') {
                        rstAmount += reward.amount / 1e6;
                    }
                    break;
            }
        }

        return { totalMinerPower, totalBonus, tempPower, seasonExp, rstAmount };
    }, [eventData]);

    const dynamicConstants = useMemo(() => {
        const base: Record<string, number> = { ...EVENT_CONSTANTS };
        if (!eventData) return base;

        if (eventData.taskData) {
            const gameLevel = eventData.taskData.find((t: any) => t.type === 'game_level');
            if (gameLevel) base.GAME_DIFFICULTY = gameLevel.xp_reward;

            const spendRlt = eventData.taskData.find((t: any) => t.type === 'spend_rlt');
            if (spendRlt) base.XP_PER_RLT = spendRlt.xp_reward;

            const marketplace = eventData.taskData.find((t: any) => t.type === 'marketplace');
            if (marketplace) base.MARKETPLACE_RATE = marketplace.xp_reward;
        }

        if (eventData.multiplierData && eventData.multiplierData.length > 0) {
            const mData = eventData.multiplierData[0];
            if (mData.multiplier && mData.amount) {
                base.MULTIPLIER_STEP_RLT = (100 / mData.multiplier) * mData.amount;
            }
        }

        return base;
    }, [eventData]);

    // Calculate multiplier table data
    const multiplierData = useMemo(() => {
        if (!eventData) return [];

        const { max_xp } = eventData.data.event;
        const rows = [];

        for (let m = 1; m <= MAX_MULTIPLIER; m++) {
            const rltToBuy = (m - 1) * dynamicConstants.MULTIPLIER_STEP_RLT;
            const xpPerBox = boxPrice * dynamicConstants.XP_PER_RLT * m;
            const boxes = Math.ceil(max_xp / xpPerBox);
            const totalRltCost = rltToBuy + boxes * boxPrice;
            const marketTrade = Math.ceil(max_xp / (dynamicConstants.MARKETPLACE_RATE * m));
            const fee = Math.ceil(marketTrade * dynamicConstants.FEE_RATE);
            const discountPrice = rltToBuy * rltPrice * (1 - discount / 100);

            rows.push({
                multiplier: m,
                rltToBuy,
                boxes,
                totalRltCost,
                marketTrade,
                fee,
                discountPrice,
            });
        }

        return rows;
    }, [eventData, boxPrice, discount, rltPrice, dynamicConstants]);

    // Filtered data for display
    const filteredData = useMemo(() => {
        return multiplierData.filter(r => r.multiplier >= filterMin && r.multiplier <= filterMax);
    }, [multiplierData, filterMin, filterMax]);

    // Chart max value for scaling
    const chartMaxBoxes = useMemo(() => {
        if (filteredData.length === 0) return 1;
        return filteredData[0].boxes; // x1 always has the most boxes
    }, [filteredData]);

    // Countdown timer
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        if (!eventData) return;

        const updateCountdown = () => {
            const end = new Date(eventData.endDate).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                setTimeLeft(t('event.ended'));
                return;
            }

            const days = Math.floor(diff / 86400000);
            const hours = Math.floor((diff % 86400000) / 3600000);
            const minutes = Math.floor((diff % 3600000) / 60000);

            if (days > 0) {
                setTimeLeft(`${days}${t('event.daysShort')} : ${hours}${t('event.hoursShort')} : ${minutes}${t('event.minutesShort')}`);
            } else {
                setTimeLeft(`${hours}${t('event.hoursShort')} : ${minutes}${t('event.minutesShort')}`);
            }
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 60000);
        return () => clearInterval(interval);
    }, [eventData, t]);

    if (loading) {
        return (
            <div className="pe-container">
                <div className="pe-loading">
                    <span className="spinner" />
                    <p>{t('event.loading')}</p>
                    <Link to={`/${lang}`} className="pe-header-back-btn" style={{ marginTop: '20px' }}>
                        {t('event.backToCalc')}
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="pe-container">
                <div className="pe-error">
                    <span className="pe-error-icon">⚠️</span>
                    <p>{t('event.fetchError')}: {error}</p>
                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginTop: '16px' }}>
                        <button
                            className="btn-primary"
                            onClick={() => window.location.reload()}
                        >
                            {t('event.retry')}
                        </button>
                        <Link to={`/${lang}`} className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                            {t('event.backToCalc')}
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!eventData) return null;

    const { event, rewards, levels_config } = eventData.data;

    return (
        <div className="pe-container">
            {/* Ad-Blocker Warning */}
            {adBlockWarning && (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    marginBottom: '16px',
                    color: '#ef4444',
                    fontSize: '13px',
                }}>
                    <span style={{ fontSize: '16px' }}>⚠️</span>
                    <span>{t('event.adBlockerWarning') || 'Ad-blocker detected: Item images may not load properly. Some rewards won\'t display images.'}</span>
                </div>
            )}

            {/* Event Header */}
            <div className="pe-header">
                <div className="pe-header-actions pe-header-left">
                    <Link to={`/${lang}`} className="pe-header-back-btn">
                        {t('event.backToCalc')}
                    </Link>
                </div>

                <h2 className="pe-title">{event.title.en}</h2>

                <div className="pe-header-actions pe-header-right">
                    <div className="pe-header-time">
                        {t('event.leftTime')}:&nbsp;<strong>{timeLeft}</strong>
                    </div>
                </div>
            </div>

            <div className="pe-layout">
                {/* Left Sidebar - Event Info */}
                <aside className="pe-sidebar">
                    {/* Event Difficulty */}
                    <div className="pe-info-card">
                        <h3 className="pe-info-title">{t('event.eventDifficulty')}</h3>
                        <div className="pe-info-table">
                            <div className="pe-info-row">
                                <span>{t('event.multiplier')}</span>
                                <span className="pe-info-value">{t('event.multiplierRate', { amount: dynamicConstants.MULTIPLIER_STEP_RLT })}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.multiplierDuration')}</span>
                                <span className="pe-info-value">{EVENT_CONSTANTS.MULTIPLIER_DURATION_HOURS} {t('event.hourUnit')}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.gameDifficulty')}</span>
                                <span className="pe-info-value">{EVENT_CONSTANTS.GAME_DIFFICULTY}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.spend1Rlt')}</span>
                                <span className="pe-info-value">{dynamicConstants.XP_PER_RLT}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.marketplace')}</span>
                                <span className="pe-info-value">{dynamicConstants.MARKETPLACE_RATE}</span>
                            </div>
                        </div>
                    </div>

                    {/* Total Event Rewards */}
                    {eventSummary && (
                        <div className="pe-info-card">
                            <h3 className="pe-info-title">{t('event.totalRewards')}</h3>
                            <div className="pe-info-table">
                                <div className="pe-info-row">
                                    <span>{t('event.minersPower')}</span>
                                    <span className="pe-info-value pe-highlight">{formatPower(eventSummary.totalMinerPower)}</span>
                                </div>
                                <div className="pe-info-row">
                                    <span>{t('event.minersBonus')}</span>
                                    <span className="pe-info-value pe-highlight">{(eventSummary.totalBonus / 100).toFixed(2)}%</span>
                                </div>
                                <div className="pe-info-row">
                                    <span>{t('event.tempPower')}</span>
                                    <span className="pe-info-value pe-highlight">{formatPower(eventSummary.tempPower)}</span>
                                </div>
                                <div className="pe-info-row">
                                    <span>{t('event.seasonExp')}</span>
                                    <span className="pe-info-value pe-highlight">{eventSummary.seasonExp} EXP</span>
                                </div>
                                <div className="pe-info-row">
                                    <span>RST</span>
                                    <span className="pe-info-value pe-highlight">{eventSummary.rstAmount} RST</span>
                                </div>
                            </div>
                        </div>
                    )}
                </aside>

                {/* Main Content */}
                <div className="pe-main">
                    {/* Sub-tabs */}
                    <div className="main-tabs main-tabs-2" style={{ marginBottom: '16px' }}>
                        <div
                            className="main-tabs-bg"
                            style={{ transform: `translateX(calc(${activeTab === 'rewards' ? 0 : 1} * (100% + var(--tab-gap))))` }}
                        />
                        <button
                            className={`main-tab ${activeTab === 'rewards' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rewards')}
                        >
                            {t('event.rewardsTab')}
                        </button>
                        <button
                            className={`main-tab ${activeTab === 'multiplier' ? 'active' : ''}`}
                            onClick={() => setActiveTab('multiplier')}
                        >
                            {t('event.multiplierTab')}
                        </button>
                    </div>

                    {/* Tab Slider Content */}
                    <div className="tab-slider-viewport" style={{ marginTop: '4px' }}>
                        <div
                            className="tab-slider-track"
                            style={{ transform: activeTab === 'rewards' ? 'translateX(0)' : 'translateX(-100%)' }}
                        >
                            {/* Rewards Table */}
                            <div className={`tab-panel ${activeTab === 'rewards' ? 'active' : ''}`}>
                                <div className="pe-table-container">
                                    <table className="pe-table">
                                        <thead>
                                            <tr>
                                                <th>{t('event.headers.lvl')}</th>
                                                <th>{t('event.headers.total')}</th>
                                                <th className="pe-rewards-col">{t('event.headers.rewards')}</th>
                                                <th>{t('event.headers.points')}</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {levels_config.map((level: LevelConfig) => {
                                                const reward = rewards.find(
                                                    (r: ProgressionReward) => r.required_level === level.level
                                                );
                                                const display = reward ? getRewardDisplay(reward, t) : null;
                                                const typeImage = reward ? getRewardTypeImage(reward.type) : null;

                                                return (
                                                    <tr key={level.level} className="pe-multiplier-row">
                                                        <td className="pe-number-cell pe-multiplier-cell">
                                                            <span className="pe-multiplier-badge">{level.level}</span>
                                                        </td>
                                                        <td className="pe-number-cell pe-total-cell">
                                                            {formatNumber(level.required_xp)}
                                                        </td>
                                                        <td className="pe-rewards-col">
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '280px', maxWidth: '100%', margin: '0 auto', textAlign: 'left' }}>
                                                                <div style={{ width: '96px', display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
                                                                    {display?.imageUrl ? (
                                                                        <div style={{ position: 'relative', display: 'inline-flex' }}>
                                                                            {(display?.level ?? 0) > 1 && (
                                                                                <img
                                                                                    src={`https://rollercoin.com/static/img/storage/rarity_icons/level_${display.level}.png?v=1.0.0`}
                                                                                    alt={`Level ${display.level}`}
                                                                                    style={{ position: 'absolute', top: '0px', left: '-5px', width: '22px', height: '14px', objectFit: 'contain', zIndex: 2 }}
                                                                                    onError={(e) => {
                                                                                        const target = e.target as HTMLImageElement;
                                                                                        target.style.display = 'none';
                                                                                    }}
                                                                                />
                                                                            )}
                                                                            <img
                                                                                src={display.imageUrl}
                                                                                alt={display.text}
                                                                                style={{ maxWidth: '96px', maxHeight: '64px', objectFit: 'contain' }}
                                                                                loading="lazy"
                                                                                onError={(e) => {
                                                                                    const target = e.target as HTMLImageElement;
                                                                                    target.style.display = 'none';
                                                                                    // Show fallback text icon
                                                                                    const parent = target.parentElement;
                                                                                    if (parent && !parent.querySelector('span.fallback-icon')) {
                                                                                        const span = document.createElement('span');
                                                                                        span.className = 'fallback-icon';
                                                                                        span.style.fontSize = '32px';
                                                                                        span.textContent = '📦';
                                                                                        parent.appendChild(span);
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : display?.localImage ? (
                                                                        <img
                                                                            src={display.localImage}
                                                                            alt={display.text}
                                                                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : typeImage ? (
                                                                        <img
                                                                            src={typeImage}
                                                                            alt={reward?.type || ''}
                                                                            style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                                                                            loading="lazy"
                                                                            onError={(e) => {
                                                                                const target = e.target as HTMLImageElement;
                                                                                target.style.display = 'none';
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span style={{ fontSize: '32px' }}>🎁</span>
                                                                    )}
                                                                </div>
                                                                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                                                                    <span style={{ fontWeight: 500, fontSize: '14px', color: 'var(--text-secondary)' }}>{display?.text ?? '-'}</span>
                                                                    <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{display?.subText ?? ''}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="pe-number-cell pe-boxes-cell" style={{ color: 'var(--accent-primary)' }}>
                                                            {formatNumber(level.level_xp)} {t('event.pointsUnit')}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Multiplier Section */}
                            <div className={`tab-panel ${activeTab === 'multiplier' ? 'active' : ''}`}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {/* Controls Bar */}
                                    <div className="pe-controls-bar">
                                        <div className="pe-control-group pe-filter-group">
                                            <label className="pe-control-label">{t('event.filter')}</label>
                                            <div className="pe-filter-inputs">
                                                <input
                                                    type="number"
                                                    className="pe-filter-input"
                                                    value={filterMin}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value);
                                                        if (!isNaN(v) && v >= 1 && v <= filterMax) setFilterMin(v);
                                                    }}
                                                    min={1}
                                                    max={filterMax}
                                                />
                                                <span className="pe-filter-sep">—</span>
                                                <input
                                                    type="number"
                                                    className="pe-filter-input"
                                                    value={filterMax}
                                                    onChange={(e) => {
                                                        const v = parseInt(e.target.value);
                                                        if (!isNaN(v) && v >= filterMin && v <= MAX_MULTIPLIER) setFilterMax(v);
                                                    }}
                                                    min={filterMin}
                                                    max={MAX_MULTIPLIER}
                                                />
                                            </div>
                                        </div>
                                        <div className="pe-control-group">
                                            <label className="pe-control-label">{t('event.chart')}</label>
                                            <button
                                                className={`pe-chart-toggle ${showChart ? 'active' : ''}`}
                                                onClick={() => setShowChart(!showChart)}
                                            >
                                                📊
                                            </button>
                                        </div>
                                    </div>

                                    {/* Chart */}
                                    {showChart && (
                                        <div className="pe-chart-container">
                                            <h4 className="pe-chart-title">{t('event.chartTitle')}</h4>
                                            <div className="pe-chart">
                                                {filteredData.map((row) => {
                                                    const barWidth = (row.boxes / chartMaxBoxes) * 100;
                                                    return (
                                                        <div key={row.multiplier} className="pe-chart-row">
                                                            <span className="pe-chart-label">x{row.multiplier}</span>
                                                            <div className="pe-chart-bar-bg">
                                                                <div
                                                                    className="pe-chart-bar"
                                                                    style={{ width: `${barWidth}%` }}
                                                                />
                                                            </div>
                                                            <span className="pe-chart-value">{formatNumber(row.boxes)}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* Table */}
                                    <div className="pe-table-container">
                                        <table className="pe-table pe-multiplier-table">
                                            <thead>
                                                <tr>
                                                    <th>{t('event.headers.multiplier')}</th>
                                                    <th>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                            {t('event.headers.rltToBuy')}
                                                            <input
                                                                type="number"
                                                                className="pe-filter-input"
                                                                value={rltPrice}
                                                                onChange={(e) => setRltPrice(Number(e.target.value))}
                                                                step="0.01"
                                                                min="0"
                                                                style={{ width: '68px', padding: '4px 6px', fontSize: '13px', lineHeight: '1' }}
                                                            />
                                                        </div>
                                                    </th>
                                                    <th>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                            {t('event.headers.discount')}
                                                            <select
                                                                className="pe-select"
                                                                value={discount}
                                                                onChange={(e) => setDiscount(Number(e.target.value))}
                                                                style={{ padding: '4px 24px 4px 10px', fontSize: '13px', height: 'auto', lineHeight: '1' }}
                                                            >
                                                                {DISCOUNT_OPTIONS.map((d) => (
                                                                    <option key={d} value={d}>{d}%</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </th>
                                                    <th>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                            {t('event.headers.boxesOf')}
                                                            <select
                                                                className="pe-select"
                                                                value={boxPrice}
                                                                onChange={(e) => setBoxPrice(Number(e.target.value))}
                                                                style={{ padding: '4px 24px 4px 10px', fontSize: '13px', height: 'auto', lineHeight: '1' }}
                                                            >
                                                                {BOX_PRICE_OPTIONS.map((p) => (
                                                                    <option key={p} value={p}>{p} RLT</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </th>
                                                    <th>{t('event.headers.totalCost')}</th>
                                                    <th>{t('event.headers.marketTrade')}</th>
                                                    <th>{t('event.headers.fee')}</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredData.map((row) => (
                                                    <tr key={row.multiplier} className="pe-multiplier-row">
                                                        <td className="pe-multiplier-cell">
                                                            <span className="pe-multiplier-badge">x{row.multiplier}</span>
                                                        </td>
                                                        <td className="pe-number-cell">{row.rltToBuy}</td>
                                                        <td className="pe-number-cell pe-discount-cell">
                                                            $ {row.discountPrice.toFixed(2)}
                                                        </td>
                                                        <td className="pe-number-cell pe-boxes-cell">
                                                            {formatNumber(row.boxes)}
                                                        </td>
                                                        <td className="pe-number-cell pe-total-cell">
                                                            {formatNumber(row.totalRltCost)}
                                                        </td>
                                                        <td className="pe-number-cell">
                                                            {formatNumber(row.marketTrade)}
                                                        </td>
                                                        <td className="pe-number-cell pe-fee-cell">
                                                            {formatNumber(row.fee)}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
