import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation } from 'react-router-dom';
import { fetchDailyBonusQuest } from '../services/dailyBonusQuestApi';
import { COIN_ICONS } from '../utils/constants';
import { formatAmount, normalizeAdditionalData, resolveQuestTemplate } from '../utils/dailyBonusQuestFormat';
import type { DailyBonusQuest as DailyBonusQuestType, DailyBonusQuestReward } from '../types/dailyBonusQuest';
import xpIcon from '../assets/items/xp.png';
import './DailyBonusQuest.css';

/** Build a human-readable reward summary for {reward} placeholder */
function buildRewardSummary(rewards: DailyBonusQuestReward[], t: (key: string) => string): string {
    return rewards.map(r => {
        if (r.type === 'season_xp') {
            return `${r.amount} ${t('dailyQuest.seasonXp')}`;
        }
        if (r.type === 'money' && r.currency) {
            return `${formatAmount(r.amount, r.currency.name)} ${r.currency.name}`;
        }
        return '';
    }).filter(Boolean).join(' + ');
}

/** Replace template placeholders in a string */

/** Render a single reward badge (icon + amount) */
function RewardBadge({ reward }: { reward: DailyBonusQuestReward }) {
    if (reward.type === 'season_xp') {
        return (
            <div className="dbq-reward-badge dbq-reward-xp">
                <img src={xpIcon} alt="XP" className="dbq-reward-icon" />
                <span>{reward.amount}</span>
            </div>
        );
    }

    if (reward.type === 'money' && reward.currency) {
        const icon = COIN_ICONS[reward.currency.name];
        const displayAmount = formatAmount(reward.amount, reward.currency.name);
        return (
            <div className="dbq-reward-badge dbq-reward-money">
                {icon && <img src={icon} alt={reward.currency.name} className="dbq-reward-icon" />}
                <span>{displayAmount}</span>
            </div>
        );
    }

    return null;
}

export default function DailyBonusQuest() {
    const { t, i18n } = useTranslation();
    const location = useLocation();
    const langFromPath = location.pathname.split('/')[1];
    const lang = (langFromPath === 'tr' || langFromPath === 'en') ? langFromPath : i18n.language;
    const [quest, setQuest] = useState<DailyBonusQuestType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setError(false);
                const data = await fetchDailyBonusQuest();
                if (!cancelled) setQuest(data);
            } catch {
                if (!cancelled) setError(true);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Don't render anything if loading or error (silent fallback)
    if (loading) {
        return (
            <div className="dbq-card dbq-loading">
                <span className="spinner" />
            </div>
        );
    }

    if (error || !quest) {
        return null;
    }

    const rewardSummary = buildRewardSummary(quest.dailyBonusQuestRewards, t);
    const additionalData = normalizeAdditionalData(quest.additionalData);
    const title = resolveQuestTemplate(quest.title, quest, { rewardSummary, additionalData });
    const description = resolveQuestTemplate(quest.description, quest, { rewardSummary, additionalData });

    const replacePrice = formatAmount(quest.replaceConfigPrice, quest.replaceConfigCurrency);
    const paidPrice = formatAmount(quest.paidConfigPrice, quest.paidConfigCurrency);

    return (
        <div className="dbq-card">
            {/* Top row: BONUS tag + History button */}
            <div className="dbq-header">
                <span className="dbq-tag">BONUS</span>
                <Link
                    to={`/${lang}/daily-quests`}
                    className="dbq-history-btn"
                    title={t('dailyQuest.questHistory')}
                >
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                    </svg>
                </Link>
            </div>

            {/* Main content row */}
            <div className="dbq-body">
                {/* Reward icons */}
                <div className="dbq-rewards">
                    {quest.dailyBonusQuestRewards.map((reward, i) => (
                        <RewardBadge key={i} reward={reward} />
                    ))}
                </div>

                {/* Quest info */}
                <div className="dbq-info">
                    <div className="dbq-title-row">
                        <span className="dbq-title">{title}</span>
                        <span className="dbq-info-tooltip" title={description}>
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                            </svg>
                        </span>
                    </div>

                </div>

                {/* Action buttons (info only, non-functional) */}
                <div className="dbq-actions">
                    {quest.replaceConfigIsAvailable && (
                        <div className="dbq-action-btn dbq-replace" title={t('dailyQuest.replace')}>
                            <svg className="dbq-action-icon" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" /></svg>
                            <span>{replacePrice} {quest.replaceConfigCurrency}</span>
                        </div>
                    )}
                    {quest.paidConfigIsAvailable && (
                        <div className="dbq-action-btn dbq-paid" title={t('dailyQuest.paidClaim')}>
                            <svg className="dbq-action-icon" viewBox="0 0 24 24" width="14" height="14" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z" /></svg>
                            <span>{paidPrice} {quest.paidConfigCurrency}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
