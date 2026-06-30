import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { fetchProgressionEvent, fetchProgressionEventById, fetchCurrencyDiscounts, type ParsedProgressionEvent } from '../services/progressionEventApi';
import { extractEventIdFromSlug } from '../utils/slugUtils';
import type {
    ProgressionReward,
    LevelConfig,
    MinerItem,
    CurrencyDiscount,
} from '../types/progressionEvent';
import {
    BOX_PRICE_OPTIONS,
    DISCOUNT_OPTIONS,
    EVENT_CONSTANTS,
} from '../types/progressionEvent';
import { CURRENCY_ID_MAP } from '../data/currencies';
import { COIN_ICONS } from '../utils/constants';
import { autoScalePower } from '../utils/powerParser';
import RadixSelect from './RadixSelect';
import './ProgressionEvent.css';

import batteryImg from '../assets/items/battery.png';
import bonusPowerImg from '../assets/items/bonus_power.png';
import xpImg from '../assets/items/xp.png';
import speedupImg from '../assets/items/speedup_item.gif';
import rareFanImg from '../assets/items/rare_fan.png';
import legendaryFanImg from '../assets/items/legendary_fan.png';
import commonFanImg from '../assets/items/common_fan.png';
import uncommonFanImg from '../assets/items/uncommon_fan.png';
import epicFanImg from '../assets/items/epic_fan.png';

import commonWireImg from '../assets/items/common_wire.png';
import uncommonWireImg from '../assets/items/uncommon_wire.png';
import rareWireImg from '../assets/items/rare_wire.png';
import epicWireImg from '../assets/items/epic_wire.png';
import legendaryWireImg from '../assets/items/legendary_wire.png';

import commonHashboardImg from '../assets/items/common_hashboard.png';
import uncommonHashboardImg from '../assets/items/uncommon_hashboard.png';
import rareHashboardImg from '../assets/items/rare_hashboard.png';
import epicHashboardImg from '../assets/items/epic_hashboard.png';
import legendaryHashboardImg from '../assets/items/legendary_hashboard.png';
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

function formatPoints(num: number): string {
    if (num >= 1000000) return parseFloat((num / 1000000).toFixed(2)) + 'M';
    if (num >= 1000) return parseFloat((num / 1000).toFixed(2)) + 'K';
    return num.toString();
}

function getMinerImageUrl(filename: string, imageVersion?: number): string {
    const v = imageVersion ? imageVersion : 1;
    return `https://static.rollercoin.com/static/img/market/miners/${filename}.gif?v=${v}`;
}

function getRackImageUrl(id: string): string {
    return `https://static.rollercoin.com/static/img/market/racks/${id}.png?v=1`;
}

function getCdnUrl(path: string): string {
    return `https://static.rollercoin.com/${path}`;
}

function getMutationComponentImage(itemId: string | null, title?: string): string | null {
    const t = (title || '').toLowerCase();
    
    if (t.includes('wire')) {
        if (t.includes('uncommon')) return uncommonWireImg;
        if (t.includes('rare')) return rareWireImg;
        if (t.includes('epic')) return epicWireImg;
        if (t.includes('legendary')) return legendaryWireImg;
        return commonWireImg;
    }
    if (t.includes('fan')) {
        if (t.includes('uncommon')) return uncommonFanImg;
        if (t.includes('rare')) return rareFanImg;
        if (t.includes('epic')) return epicFanImg;
        if (t.includes('legendary')) return legendaryFanImg;
        return commonFanImg;
    }
    if (t.includes('hashboard')) {
        if (t.includes('uncommon')) return uncommonHashboardImg;
        if (t.includes('rare')) return rareHashboardImg;
        if (t.includes('epic')) return epicHashboardImg;
        if (t.includes('legendary')) return legendaryHashboardImg;
        return commonHashboardImg;
    }

    // Hardcoded legacy item IDs as last resort
    if (itemId === '6196269b67433d2dc52e0130') return legendaryFanImg;
    if (itemId === '61b35e3767433d2dc57f86a2') return rareFanImg;
    if (itemId === '61b3604967433d2dc58893b0') return commonWireImg;
    if (itemId === '61b35fea67433d2dc586f7fe') return commonFanImg;
    if (itemId === '61b3606767433d2dc58913a9') return commonHashboardImg;

    return null;
}

function getMutationComponentDisplayName(itemId: string | null, title?: string): string {
    if (title) return title;
    
    if (itemId === '6196269b67433d2dc52e0130') return 'Legendary Fan';
    if (itemId === '61b35e3767433d2dc57f86a2') return 'Rare Fan';
    if (itemId === '61b3604967433d2dc58893b0') return 'Common Wire';
    if (itemId === '61b35fea67433d2dc586f7fe') return 'Common Fan';
    if (itemId === '61b3606767433d2dc58913a9') return 'Common Hashboard';

    return 'Mutation Component';
}

function getMysteryBoxLocalFallback(_box?: unknown, fallbackTitle?: string): string {
    const title = (fallbackTitle ?? '').toLowerCase();

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
): { text: string; subText: string; imageUrl?: string; coverUrl?: string; localImage?: string; level?: number; scale?: number } {
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
                    imageUrl: getMinerImageUrl(miner.filename, miner.image_version),
                    level: (miner.level || 0) + 1,
                };
            }
            return { text: t('event.rewardTypes.miner'), subText: `x${reward.amount}` };
        }
        case 'rack': {
            const rackName = reward.title.en || t('event.rewardTypes.rack');
            const capacityText = reward.rack_capacity ? ` (${reward.rack_capacity} slots)` : '';
            return {
                text: rackName,
                subText: `${t('event.rewardTypes.rack')}${capacityText}`,
                imageUrl: reward.item_id ? getRackImageUrl(reward.item_id) : undefined,
            };
        }
        case 'utility_item': {
            const utilityName = reward.title.en || t('event.rewardTypes.utilityItem');
            const utilityImage = reward.item_media_url ? getCdnUrl(reward.item_media_url) : undefined;
            return {
                text: utilityName,
                subText: `x${reward.amount}`,
                imageUrl: utilityImage,
                localImage: !utilityImage ? speedupImg : undefined,
            };
        }
        case 'mutation_component': {
            const titleEn = reward.title.en || '';
            const displayName = getMutationComponentDisplayName(reward.item_id, titleEn);
            return {
                text: `${displayName} x${reward.amount}`,
                subText: displayName,
                localImage: getMutationComponentImage(reward.item_id, titleEn) ?? undefined,
            };
        }
        case 'mystery_box': {
            const boxName = reward.title.en || t('event.rewardTypes.mysteryBox');
            const boxUrl = reward.box_image_url || reward.cover_image_url || reward.item_media_url;
            const coverUrl = reward.cover_image_url || reward.item_media_url;
            
            const boxImage = boxUrl ? getCdnUrl(boxUrl) : undefined;
            const coverImage = coverUrl ? getCdnUrl(coverUrl) : undefined;

            return {
                text: `${boxName} x${reward.amount}`,
                subText: boxName,
                imageUrl: boxImage,
                coverUrl: (boxImage && coverImage && boxImage !== coverImage) ? coverImage : undefined,
                localImage: !boxImage ? getMysteryBoxLocalFallback(undefined, reward.title.en) : undefined,
            };
        }
        case 'trophy':
            return { text: reward.title.en || t('event.rewardTypes.trophy'), subText: '' };
        case 'hat':
            return { text: reward.title.en || t('event.rewardTypes.hat'), subText: '' };
        default:
            return { text: reward.title.en || reward.type, subText: '' };
    }
}

export default function ProgressionEvent() {
    const { lang, eventId: eventSlug } = useParams<{ lang: string; eventId?: string }>();
    const eventId = eventSlug ? extractEventIdFromSlug(eventSlug) : undefined;
    const { t } = useTranslation();
    const [eventData, setEventData] = useState<ParsedProgressionEvent | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<EventTab>('rewards');
    const [collapsedTabs, setCollapsedTabs] = useState<Set<EventTab>>(new Set(['multiplier']));
    const [adBlockWarning, setAdBlockWarning] = useState(false);
    const [currencyDiscounts, setCurrencyDiscounts] = useState<CurrencyDiscount[]>([]);

    const handleTabChange = (newTab: EventTab) => {
        if (newTab === activeTab) return;
        const oldTab = activeTab;
        setCollapsedTabs(prev => { const next = new Set(prev); next.delete(newTab); return next; });
        setActiveTab(newTab);
        setTimeout(() => {
            setCollapsedTabs(prev => { const next = new Set(prev); next.add(oldTab); return next; });
        }, 400);
    };

    // Multiplier settings
    const [rltPrice, setRltPrice] = useState<number>(1.05);
    const [boxPrice, setBoxPrice] = useState<number>(BOX_PRICE_OPTIONS[0]);
    const [discount, setDiscount] = useState<number>(35);
    const [filterMin, setFilterMin] = useState<number>(1);
    const [filterMax, setFilterMax] = useState<number>(100);
    const [showChart, setShowChart] = useState(false);
    const [showMarketplace, setShowMarketplace] = useState(false);

    const MAX_MULTIPLIER = 100;

    // Fetch event data — by specific ID or latest
    useEffect(() => {
        const loadEvent = async () => {
            // Only use cache for the latest event (no eventId)
            if (!eventId) {
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
            }

            try {
                setLoading(true);
                setError(null);
                const data = eventId
                    ? await fetchProgressionEventById(eventId)
                    : await fetchProgressionEvent();
                setEventData(data);
                // Only cache the latest event
                if (!eventId) {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                    localStorage.setItem(STORAGE_TIMESTAMP_KEY, Date.now().toString());
                }
            } catch (err) {
                console.error('Failed to fetch progression event:', err);
                setError(err instanceof Error ? err.message : t('event.fetchError'));
            } finally {
                setLoading(false);
            }
        };

        loadEvent();
    }, [t, eventId]);

    // Fetch currency discounts when event data is available
    useEffect(() => {
        if (!eventData?.endDate) return;
        const loadDiscounts = async () => {
            try {
                let rawStart: string;
                if (eventData.createdDate) {
                    rawStart = eventData.createdDate.replace(/Z$/, '');
                } else {
                    // Fallback: use endDate minus 14 days if createdDate is missing
                    const endMs = new Date(eventData.endDate).getTime();
                    rawStart = new Date(endMs - 14 * 86400000).toISOString().replace(/Z$/, '').split('.')[0];
                }
                // Subtract 1 day buffer — discounts may be created shortly before the event
                const startMs = new Date(rawStart).getTime() - 86400000;
                const startDate = new Date(startMs).toISOString().replace(/Z$/, '').split('.')[0];
                const endDate = eventData.endDate.replace(/Z$/, '');
                console.log('[CurrencyDiscount] Fetching discounts:', { startDate, endDate });
                const discounts = await fetchCurrencyDiscounts(startDate, endDate);
                
                // Filter out discounts that ended before or right as the event started
                // We add a 1-hour tolerance to handle events starting slightly before their official 15:00:00 UTC time
                const eventStartMs = new Date(rawStart + 'Z').getTime();
                const filteredDiscounts = discounts.filter(d => {
                    const discountEndUtc = d.endDate && !d.endDate.endsWith('Z') && !d.endDate.includes('+') ? d.endDate + 'Z' : d.endDate;
                    const discountEndMs = new Date(discountEndUtc).getTime();
                    return discountEndMs > eventStartMs + 3600000; // Must end strictly > 1 hour after event start
                });

                console.log('[CurrencyDiscount] Filtered:', filteredDiscounts);
                setCurrencyDiscounts(filteredDiscounts);
                if (filteredDiscounts.length > 0) {
                    setDiscount(filteredDiscounts[0].amount);
                }
            } catch (err) {
                console.error('Failed to fetch currency discounts:', err);
            }
        };
        loadDiscounts();
    }, [eventData?.createdDate, eventData?.endDate]);

    // Ad-blocker detection (syncs with global class added by index.html)
    useEffect(() => {
        const checkAdsBlocked = () => {
            if (document.body.classList.contains('ads-blocked')) {
                setAdBlockWarning(true);
            }
        };
        const timer = setTimeout(checkAdsBlocked, 2000);
        const observer = new MutationObserver(() => checkAdsBlocked());
        observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, []);

    // Calculate total event rewards summary
    const eventSummary = useMemo(() => {
        if (!eventData) return null;

        const rewards = eventData.rewards;
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

        const max_xp = eventData.maxXp;
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

    // Sticky header state for Rewards Table
    const theadRewardsRef = useRef<HTMLTableSectionElement>(null);
    const tableSectionRewardsRef = useRef<HTMLDivElement>(null);
    const [showFixedRewards] = useState(false);
    const [headerWidthsRewards] = useState<number[]>([]);
    const [tableLeftRewards] = useState(0);
    const [tableWidthRewards] = useState(0);
    const [innerTableWidthRewards] = useState(0);
    const stickyContainerRewardsRef = useRef<HTMLDivElement>(null);

    // Sticky header state for Multiplier Table
    const theadMultiplierRef = useRef<HTMLTableSectionElement>(null);
    const tableSectionMultiplierRef = useRef<HTMLDivElement>(null);
    const [showFixedMultiplier] = useState(false);
    const [headerWidthsMultiplier] = useState<number[]>([]);
    const [tableLeftMultiplier] = useState(0);
    const [tableWidthMultiplier] = useState(0);
    const [innerTableWidthMultiplier] = useState(0);
    const stickyContainerMultiplierRef = useRef<HTMLDivElement>(null);

    // Sticky Sidebar state
    const sidebarRefRewards = useRef<HTMLElement>(null);
    const [showFixedSidebarRewards] = useState(false);
    const [sidebarLeftRewards] = useState(0);
    const [sidebarWidthRewards] = useState(0);

    const sidebarRefMultiplier = useRef<HTMLElement>(null);
    const [showFixedSidebarMultiplier] = useState(false);
    const [sidebarLeftMultiplier] = useState(0);
    const [sidebarWidthMultiplier] = useState(0);


    useEffect(() => {
        // Scroll layout thrashing disabled
    }, []);

    // Countdown timer
    const [timeLeft, setTimeLeft] = useState('');
    const [isEnded, setIsEnded] = useState(false);

    useEffect(() => {
        if (!eventData) return;

        const updateCountdown = () => {
            const end = new Date(eventData.endDate).getTime();
            const now = Date.now();
            const diff = end - now;

            if (diff <= 0) {
                // Formatting dates safely based on localized strings, or fallback to current locale
                const formatLang = lang || 'en-US';
                const createdDateStr = eventData.createdDate
                    ? new Date(eventData.createdDate).toLocaleDateString(formatLang, { day: 'numeric', month: 'short', year: 'numeric' })
                    : t('event.ended');
                const endDateStr = new Date(eventData.endDate).toLocaleDateString(formatLang, { day: 'numeric', month: 'short', year: 'numeric' });
                setTimeLeft(`${createdDateStr} - ${endDateStr}`);
                setIsEnded(true);
                return;
            }

            setIsEnded(false);
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

    const rewards = eventData.rewards;
    const levels_config = eventData.levels;

    const renderCards = () => (
        <>
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
                    {eventData.taskData && eventData.taskData.length > 0 ? (
                        eventData.taskData.map(task => {
                            let label = task.title;
                            if (task.type === 'game_level') label = t('event.gameDifficulty');
                            if (task.type === 'spend_rlt') label = t('event.spend1Rlt');
                            if (task.type === 'marketplace') label = t('event.marketplace');
                            
                            return (
                                <div className="pe-info-row" key={task.id}>
                                    <span>{label}</span>
                                    <span className="pe-info-value">{task.xp_reward}</span>
                                </div>
                            );
                        })
                    ) : (
                        <>
                            <div className="pe-info-row">
                                <span>{t('event.gameDifficulty')}</span>
                                <span className="pe-info-value">{dynamicConstants.GAME_DIFFICULTY}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.spend1Rlt')}</span>
                                <span className="pe-info-value">{dynamicConstants.XP_PER_RLT}</span>
                            </div>
                            <div className="pe-info-row">
                                <span>{t('event.marketplace')}</span>
                                <span className="pe-info-value">{dynamicConstants.MARKETPLACE_RATE}</span>
                            </div>
                        </>
                    )}
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
        </>
    );

    const renderDiscountCard = () => {
        if (currencyDiscounts.length === 0) return null;
        const now = Date.now();
        const formatLang = lang || 'en-US';
        return (
            <div className="pe-info-card pe-discount-card">
                <h3 className="pe-info-title">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14" style={{ marginRight: '6px', verticalAlign: 'middle' }}>
                        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
                        <line x1="7" y1="7" x2="7.01" y2="7" />
                    </svg>
                    {t('event.tokenDiscounts')}
                </h3>
                <div className="pe-info-table">
                    {currencyDiscounts.map((d) => {
                        const currencyName = CURRENCY_ID_MAP[d.currencyId] ?? `ID:${d.currencyId}`;
                        const icon = COIN_ICONS[currencyName];
                        const discountEndUtc = d.endDate && !d.endDate.endsWith('Z') && !d.endDate.includes('+') ? d.endDate + 'Z' : d.endDate;
                        const endMs = new Date(discountEndUtc).getTime();
                        const isActive = endMs > now;

                        // Calculate remaining time
                        let timeText = t('event.discountExpired');
                        if (isActive) {
                            const diffMs = endMs - now;
                            const diffDays = Math.floor(diffMs / 86400000);
                            const diffHours = Math.floor((diffMs % 86400000) / 3600000);
                            const diffMinutes = Math.floor((diffMs % 3600000) / 60000);

                            let timeStr = '';
                            if (diffDays > 0) timeStr += `${diffDays}${t('event.daysShort')} `;
                            if (diffHours > 0 || diffDays > 0) timeStr += `${diffHours}${t('event.hoursShort')} `;
                            timeStr += `${diffMinutes}${t('event.minutesShort')}`;

                            timeText = t('event.discountEndsIn', { time: timeStr.trim() });
                        }

                        const formatOptions: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
                        const endDateStr = new Date(discountEndUtc).toLocaleDateString(formatLang, formatOptions);

                        if (!isActive) {
                            let rawStart = '';
                            if (d.createdDate) {
                                rawStart = d.createdDate.replace(/Z$/, '');
                            } else if (eventData?.createdDate) {
                                rawStart = eventData.createdDate.replace(/Z$/, '');
                            }

                            if (rawStart) {
                                const startDateUtc = rawStart + 'Z';
                                const startDateStr = new Date(startDateUtc).toLocaleDateString(formatLang, formatOptions);
                                timeText = `${startDateStr} — ${endDateStr}`;
                            } else {
                                timeText = t('event.discountExpired');
                            }
                        }

                        return (
                            <div key={d.id} className={`pe-info-row pe-discount-row ${!isActive ? 'pe-discount-expired' : ''}`}>
                                <span className="pe-discount-coin">
                                    {icon && <img src={icon} alt={currencyName} className="pe-discount-coin-icon" />}
                                    {currencyName}
                                </span>
                                <span className="pe-discount-details">
                                    <span className={`pe-discount-badge ${isActive ? 'pe-discount-badge-active' : 'pe-discount-badge-expired'}`}>
                                        %{d.amount}
                                    </span>
                                    <span className="pe-discount-date" title={endDateStr}>
                                        {timeText}
                                    </span>
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    const finalReward = eventData?.rewards && eventData.rewards.length > 0 ? eventData.rewards[eventData.rewards.length - 1] : null;
    const finalRewardDisplay = finalReward ? getRewardDisplay(finalReward, t) : null;

    return (
        <div className="pe-container">
            {/* Dynamic SEO for Progression Event */}
            <>
                <title>{`${eventData.name} | Rollercoin Calculator`}</title>
                <meta name="description" content={`${eventData.name} — Progression Event rewards, multiplier calculator, and budget planner.`} />
                <link rel="canonical" href={`https://rollercoincalculator.app/${lang}/event`} />
                <meta property="og:type" content="article" />
                <meta property="og:title" content={`${eventData.name} | Rollercoin Calculator`} />
                <meta property="og:description" content={`${eventData.name} — Progression Event rewards, multiplier calculator, and budget planner.`} />
                <meta property="og:url" content={`https://rollercoincalculator.app/${lang}/event`} />
                <meta property="og:image" content={`https://static.rollercoin.com/static/img/pe/${eventData.id}/progression-event-modal-bg.png?v=1`} />
                <meta name="twitter:card" content="summary" />
                <meta name="twitter:title" content={`${eventData.name} | Rollercoin Calculator`} />
                <meta name="twitter:description" content={`${eventData.name} — Progression Event rewards, multiplier calculator, and budget planner.`} />
                <meta name="twitter:image" content={`https://static.rollercoin.com/static/img/pe/${eventData.id}/progression-event-modal-bg.png?v=1`} />
            </>
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
            <div className="pe-header" style={{
                backgroundImage: `url(https://static.rollercoin.com/static/img/pe/${eventData.id}/progression-event-modal-bg.png?v=1)`
            }}>
                <div className="pe-header-top-row">
                    <div className="pe-header-actions pe-header-left">
                        <Link to={`/${lang}`} className="pe-header-back-btn" title={t('event.backToCalc')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                            <span className="pe-btn-label">{t('event.backToCalc')}</span>
                        </Link>
                        <Link to={`/${lang}/events`} className="pe-header-back-btn pe-header-history-btn" title={t('event.viewHistory')}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                            <span className="pe-btn-label">{t('event.viewHistory')}</span>
                        </Link>
                    </div>

                    <div className="pe-header-center">
                        <div className="pe-header-time pe-time-mobile" title={isEnded ? timeLeft : `${t('event.leftTime')}: ${timeLeft}`} style={{ marginBottom: '12px' }}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {!isEnded && <span className="pe-time-label">{t('event.leftTime')}:&nbsp;</span>}
                            <strong>{timeLeft}</strong>
                        </div>
                        <h2 className="pe-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {eventData.name}
                        </h2>

                        {finalRewardDisplay && finalRewardDisplay.imageUrl && (
                            <div className="pe-header-final-reward">
                                <div className="pe-final-reward-img-wrapper" style={{ marginTop: '4px' }}>
                                    <img src={finalRewardDisplay.imageUrl} alt={finalRewardDisplay.text} className="pe-final-reward-img" />
                                    {finalRewardDisplay.coverUrl && (
                                        <img src={finalRewardDisplay.coverUrl} alt={finalRewardDisplay.text} className="pe-final-reward-img" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none' }} />
                                    )}
                                    {finalRewardDisplay.level && finalRewardDisplay.level > 1 && (
                                        <img
                                            src={`https://rollercoin.com/static/img/storage/rarity_icons/level_${finalRewardDisplay.level}.png?v=1.0.0`}
                                            alt={`Level ${finalRewardDisplay.level}`}
                                            style={{ position: 'absolute', top: '25px', left: '-5px', width: '28px', height: '18px', objectFit: 'contain', zIndex: 3, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}
                                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                        />
                                    )}
                                </div>
                                {finalRewardDisplay.subText && (
                                    <div className="pe-final-reward-stats">
                                        {finalRewardDisplay.subText.split('|')[0]}
                                        {finalRewardDisplay.subText.split('|')[1] && <span style={{ color: '#06b6d4', marginLeft: '4px' }}>|{finalRewardDisplay.subText.split('|')[1]}</span>}
                                    </div>
                                )}
                            </div>
                        )}

                        {eventData.totalPoint != null && eventData.totalPoint > 0 && (
                            <div className="pe-header-total-points large" title="Total Points Required">
                                <span className="pe-tp-icon">🏆</span>
                                {eventData.totalPoint.toLocaleString()} Points
                            </div>
                        )}
                    </div>

                    <div className="pe-header-actions pe-header-right pe-time-desktop">
                        <div className="pe-header-time" title={isEnded ? timeLeft : `${t('event.leftTime')}: ${timeLeft}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                            {!isEnded && <span className="pe-time-label">{t('event.leftTime')}:&nbsp;</span>}
                            <strong>{timeLeft}</strong>
                        </div>
                    </div>
                </div>

                {/* PC Cards inside the Banner */}
                <div className="pe-header-cards-desktop">
                </div>
            </div>

            <div className="pe-layout">
                {/* Left Sidebar - Mobile Only */}
                <aside className="pe-sidebar pe-sidebar-mobile">
                    {renderCards()}
                    {renderDiscountCard()}
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
                            onClick={() => handleTabChange('rewards')}
                        >
                            {t('event.rewardsTab')}
                        </button>
                        <button
                            className={`main-tab ${activeTab === 'multiplier' ? 'active' : ''}`}
                            onClick={() => handleTabChange('multiplier')}
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
                            <div className={`tab-panel ${activeTab === 'rewards' ? 'active' : ''}${collapsedTabs.has('rewards') ? ' collapsed' : ''}`}>
                                <div className="pe-rewards-layout pe-rewards-layout--balanced">
                                    {/* Desktop discount sidebar */}
                                    <aside className="pe-discount-sidebar" ref={sidebarRefRewards} style={{ visibility: showFixedSidebarRewards ? 'hidden' : 'visible' }}>
                                        {renderDiscountCard()}
                                        <div className="pe-sidebar-desktop-cards">
                                            {renderCards()}
                                        </div>
                                    </aside>
                                    <div
                                        className="pe-table-container"
                                        ref={tableSectionRewardsRef}
                                        onScroll={(e) => {
                                            if (stickyContainerRewardsRef.current) {
                                                stickyContainerRewardsRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                            }
                                        }}
                                    >
                                        <table className="pe-table pe-rewards-table">
                                            <thead ref={theadRewardsRef}>
                                                <tr>
                                                    <th>{t('event.headers.lvl')}</th>
                                                    <th>{t('event.headers.total')}</th>
                                                    <th>{t('event.headers.points')}</th>
                                                    <th className="pe-rewards-col">{t('event.headers.rewards')}</th>
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
                                                                <span className="pe-text-desktop">{formatNumber(level.required_xp)}</span>
                                                                <span className="pe-text-mobile pe-tooltip" tabIndex={0} data-full={formatNumber(level.required_xp)}>{formatPoints(level.required_xp)}</span>
                                                            </td>
                                                            <td className="pe-number-cell pe-boxes-cell" style={{ color: 'var(--accent-primary)' }}>
                                                                <span className="pe-text-desktop">{formatNumber(level.level_xp)}</span>
                                                                <span className="pe-text-mobile pe-tooltip" tabIndex={0} data-full={formatNumber(level.level_xp)}>{formatPoints(level.level_xp)}</span>
                                                            </td>
                                                            <td className="pe-rewards-col">
                                                                <div className="pe-reward-item-container">
                                                                    <div className="pe-reward-img-wrapper">
                                                                        {display?.imageUrl ? (
                                                                            <div style={{ position: 'relative', display: 'inline-flex' }}>
                                                                                {(display?.level ?? 0) > 1 && (
                                                                                    <img
                                                                                        src={`https://rollercoin.com/static/img/storage/rarity_icons/level_${display.level}.png?v=1.0.0`}
                                                                                        alt={`Level ${display.level}`}
                                                                                        style={{ position: 'absolute', top: '2px', left: '-10px', width: '22px', height: '14px', objectFit: 'contain', zIndex: 2 }}
                                                                                        onError={(e) => {
                                                                                            const target = e.target as HTMLImageElement;
                                                                                            target.style.display = 'none';
                                                                                        }}
                                                                                    />
                                                                                )}
                                                                                <img
                                                                                    src={display.imageUrl}
                                                                                    alt={display.text}
                                                                                    className="pe-reward-img-api"
                                                                                    style={display.scale ? { transform: `scale(${display.scale})` } : undefined}
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
                                                                                {display.coverUrl && (
                                                                                    <img 
                                                                                        src={display.coverUrl} 
                                                                                        alt={display.text} 
                                                                                        className="pe-reward-img-api" 
                                                                                        style={{ 
                                                                                            position: 'absolute', top: 0, left: 0, zIndex: 1, pointerEvents: 'none',
                                                                                            ...(display.scale ? { transform: `scale(${display.scale})` } : {})
                                                                                        }} 
                                                                                    />
                                                                                )}
                                                                            </div>
                                                                        ) : display?.localImage ? (
                                                                            <img
                                                                                src={display.localImage}
                                                                                alt={display.text}
                                                                                className="pe-reward-img-local"
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
                                                                                className="pe-reward-img-local"
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
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Fixed sticky header clone - Rewards */}
                                    {activeTab === 'rewards' && showFixedRewards && headerWidthsRewards.length > 0 && createPortal(
                                        <div
                                            className="fixed-thead-clone"
                                            ref={stickyContainerRewardsRef}
                                            style={{ position: 'fixed', top: 0, left: tableLeftRewards, width: tableWidthRewards, zIndex: 100, pointerEvents: 'none', overflowX: 'hidden' }}
                                        >
                                            <table className="pe-table pe-rewards-table" style={{ width: innerTableWidthRewards || '100%', margin: 0 }}>
                                                <thead>
                                                    <tr>
                                                        <th style={{ width: headerWidthsRewards[0], borderTop: 'none' }}>{t('event.headers.lvl')}</th>
                                                        <th style={{ width: headerWidthsRewards[1], borderTop: 'none' }}>{t('event.headers.total')}</th>
                                                        <th style={{ width: headerWidthsRewards[2], borderTop: 'none' }}>{t('event.headers.points')}</th>
                                                        <th className="pe-rewards-col" style={{ width: headerWidthsRewards[3], borderTop: 'none' }}>{t('event.headers.rewards')}</th>
                                                    </tr>
                                                </thead>
                                            </table>
                                        </div>,
                                        document.body
                                    )}

                                    {/* Fixed sticky sidebar clone - Rewards */}
                                    {activeTab === 'rewards' && showFixedSidebarRewards && createPortal(
                                        <aside className="pe-discount-sidebar" style={{ position: 'fixed', top: 16, left: sidebarLeftRewards, width: sidebarWidthRewards, zIndex: 99, margin: 0 }}>
                                            {renderDiscountCard()}
                                            <div className="pe-sidebar-desktop-cards">
                                                {renderCards()}
                                            </div>
                                        </aside>,
                                        document.body
                                    )}
                                </div>
                            </div>

                            {/* Multiplier Section */}
                            <div className={`tab-panel ${activeTab === 'multiplier' ? 'active' : ''}${collapsedTabs.has('multiplier') ? ' collapsed' : ''}`}>
                                {/* Controls Bar (Full Width) */}
                                <div className="pe-controls-bar" style={{ marginBottom: '16px' }}>
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
                                    <div className="pe-control-group" style={{ justifyContent: 'flex-end', display: 'flex', flexDirection: 'column' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600, height: '36px' }}>
                                            <input
                                                type="checkbox"
                                                checked={showMarketplace}
                                                onChange={(e) => setShowMarketplace(e.target.checked)}
                                                style={{ width: '16px', height: '16px', margin: 0, cursor: 'pointer' }}
                                            />
                                            {t('event.headers.marketTrade')} & {t('event.headers.fee')}
                                        </label>
                                    </div>
                                </div>

                                {/* Chart (Full Width) */}
                                {showChart && (
                                    <div className="pe-chart-container" style={{ marginBottom: '16px' }}>
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

                                <div className="pe-rewards-layout pe-rewards-layout--centered">
                                    {/* Desktop discount sidebar */}
                                    <aside className="pe-discount-sidebar" ref={sidebarRefMultiplier} style={{ visibility: showFixedSidebarMultiplier ? 'hidden' : 'visible' }}>
                                        {renderDiscountCard()}
                                        <div className="pe-sidebar-desktop-cards">
                                            {renderCards()}
                                        </div>
                                    </aside>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: 0 }}>
                                        {/* Table */}
                                        <div

                                            className="pe-table-container"
                                            ref={tableSectionMultiplierRef}
                                            onScroll={(e) => {
                                                if (stickyContainerMultiplierRef.current) {
                                                    stickyContainerMultiplierRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                                }
                                            }}
                                        >
                                            <table className="pe-table pe-multiplier-table">
                                                <thead ref={theadMultiplierRef}>
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
                                                                <RadixSelect
                                                                    value={String(discount || '')}
                                                                    onValueChange={(val) => setDiscount(Number(val))}
                                                                    placeholder={t('event.headers.discount')}
                                                                    options={[
                                                                        ...currencyDiscounts.map(cd => {
                                                                            const coinName = CURRENCY_ID_MAP[cd.currencyId] ?? `ID:${cd.currencyId}`;
                                                                            return {
                                                                                value: String(cd.amount),
                                                                                label: `${cd.amount}% (${coinName})`,
                                                                                icon: COIN_ICONS[coinName] || '',
                                                                                group: t('event.tokenDiscountGroup')
                                                                            };
                                                                        }),
                                                                        ...DISCOUNT_OPTIONS.filter(d => !currencyDiscounts.some(cd => cd.amount === d)).map(d => ({
                                                                            value: String(d),
                                                                            label: `${d}%`,
                                                                            group: 'Standart'
                                                                        }))
                                                                    ]}
                                                                    contentClassName="custom-dropdown-list-radix pe-multiplier-select-list"
                                                                    triggerClassName="pe-select pe-select-lg"
                                                                />
                                                            </div>
                                                        </th>
                                                        <th>
                                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                                {t('event.headers.boxesOf')}
                                                                <RadixSelect
                                                                    value={String(boxPrice)}
                                                                    onValueChange={(val) => setBoxPrice(Number(val))}
                                                                    options={BOX_PRICE_OPTIONS.map(price => ({
                                                                        value: String(price),
                                                                        label: `${price} RLT`
                                                                    }))}
                                                                    contentClassName="custom-dropdown-list-radix pe-multiplier-select-list"
                                                                    triggerClassName="pe-select pe-select-lg"
                                                                />
                                                            </div>
                                                        </th>
                                                        <th>{t('event.headers.totalCost')}</th>
                                                        {showMarketplace && <th>{t('event.headers.marketTrade')}</th>}
                                                        {showMarketplace && <th>{t('event.headers.fee')}</th>}
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
                                                            {showMarketplace && (
                                                                <td className="pe-number-cell">
                                                                    {formatNumber(row.marketTrade)}
                                                                </td>
                                                            )}
                                                            {showMarketplace && (
                                                                <td className="pe-number-cell pe-fee-cell">
                                                                    {formatNumber(row.fee)}
                                                                </td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>

                                        {/* Fixed sticky header clone - Multiplier */}
                                        {activeTab === 'multiplier' && showFixedMultiplier && headerWidthsMultiplier.length > 0 && createPortal(
                                            <div
                                                className="fixed-thead-clone hide-scrollbar"
                                                ref={stickyContainerMultiplierRef}
                                                style={{ position: 'fixed', top: 0, left: tableLeftMultiplier, width: tableWidthMultiplier, zIndex: 100, overflowX: 'auto' }}
                                                onScroll={(e) => {
                                                    if (tableSectionMultiplierRef.current) {
                                                        tableSectionMultiplierRef.current.scrollLeft = e.currentTarget.scrollLeft;
                                                    }
                                                }}
                                            >
                                                <table className="pe-table pe-multiplier-table" style={{ width: innerTableWidthMultiplier || '100%', margin: 0 }}>
                                                    <thead>
                                                        <tr>
                                                            <th style={{ width: headerWidthsMultiplier[0], borderTop: 'none' }}>{t('event.headers.multiplier')}</th>
                                                            <th style={{ width: headerWidthsMultiplier[1], borderTop: 'none' }}>
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
                                                            <th style={{ width: headerWidthsMultiplier[2], borderTop: 'none' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                                    {t('event.headers.discount')}
                                                                    <RadixSelect
                                                                        value={String(discount || '')}
                                                                        onValueChange={(val) => setDiscount(Number(val))}
                                                                        placeholder={t('event.headers.discount')}
                                                                        options={[
                                                                            ...currencyDiscounts.map(cd => {
                                                                                const coinName = CURRENCY_ID_MAP[cd.currencyId] ?? `ID:${cd.currencyId}`;
                                                                                return {
                                                                                    value: String(cd.amount),
                                                                                    label: `${cd.amount}% (${coinName})`,
                                                                                    icon: COIN_ICONS[coinName] || '',
                                                                                    group: t('event.tokenDiscountGroup')
                                                                                };
                                                                            }),
                                                                            ...DISCOUNT_OPTIONS.filter(d => !currencyDiscounts.some(cd => cd.amount === d)).map(d => ({
                                                                                value: String(d),
                                                                                label: `${d}%`,
                                                                                group: 'Standart'
                                                                            }))
                                                                        ]}
                                                                        contentClassName="custom-dropdown-list-radix pe-multiplier-select-list"
                                                                        triggerClassName="pe-select pe-select-lg"
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th style={{ width: headerWidthsMultiplier[3], borderTop: 'none' }}>
                                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                                                                    {t('event.headers.boxesOf')}
                                                                    <RadixSelect
                                                                        value={String(boxPrice)}
                                                                        onValueChange={(val) => setBoxPrice(Number(val))}
                                                                        options={BOX_PRICE_OPTIONS.map(price => ({
                                                                            value: String(price),
                                                                            label: `${price} RLT`
                                                                        }))}
                                                                        contentClassName="custom-dropdown-list-radix pe-multiplier-select-list"
                                                                        triggerClassName="pe-select pe-select-lg"
                                                                    />
                                                                </div>
                                                            </th>
                                                            <th style={{ width: headerWidthsMultiplier[4], borderTop: 'none' }}>{t('event.headers.totalCost')}</th>
                                                        </tr>
                                                    </thead>
                                                </table>
                                            </div>,
                                            document.body
                                        )}

                                        {/* Fixed sticky sidebar clone - Multiplier */}
                                        {activeTab === 'multiplier' && showFixedSidebarMultiplier && createPortal(
                                            <aside className="pe-discount-sidebar" style={{ position: 'fixed', top: 16, left: sidebarLeftMultiplier, width: sidebarWidthMultiplier, zIndex: 99, margin: 0 }}>
                                                {renderDiscountCard()}
                                                <div className="pe-sidebar-desktop-cards">
                                                    {renderCards()}
                                                </div>
                                            </aside>,
                                            document.body
                                        )}
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
