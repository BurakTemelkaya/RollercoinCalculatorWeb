import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { RewardChangeEvent, RewardChangeEntry } from '../types/rewardChange';
import { CURRENCY_ID_MAP, getCurrencyConfig } from '../data/currencies';
import { COIN_ICONS } from '../utils/constants';
import './RewardChangeModal.css';

interface RewardChangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: RewardChangeEvent;
}

/** Group changes by leagueId for display */
interface LeagueGroup {
    leagueId: string;
    leagueTitle: string;
    leagueLevel: number;
    leagueImageUrl: string;
    changes: RewardChangeEntry[];
}

/**
 * Format a raw reward value to a human-readable string.
 * Uses the currency's to_small divisor when available.
 */
function formatReward(rawValue: number, currencyName: string): string {
    const config = getCurrencyConfig(currencyName);
    if (config) {
        const humanValue = rawValue / config.to_small;
        // Use precision from config, but cap display to avoid overly long numbers
        const precision = Math.min(config.precision, 6);
        // Remove trailing zeros
        return humanValue.toFixed(precision).replace(/\.?0+$/, '');
    }
    // Fallback: simple formatting
    if (rawValue >= 1e9) return (rawValue / 1e9).toFixed(2) + 'B';
    if (rawValue >= 1e6) return (rawValue / 1e6).toFixed(2) + 'M';
    if (rawValue >= 1e3) return (rawValue / 1e3).toFixed(2) + 'K';
    return rawValue.toFixed(2);
}

function calculateChangePercent(oldVal: number, newVal: number): number {
    if (oldVal === 0) return newVal > 0 ? 100 : 0;
    return ((newVal - oldVal) / oldVal) * 100;
}

const RewardChangeModal: React.FC<RewardChangeModalProps> = ({ isOpen, onClose, data }) => {
    const { t } = useTranslation();
    const [collapsedLeagues, setCollapsedLeagues] = useState<Set<string>>(new Set());

    // Group changes by league
    const leagueGroups = useMemo<LeagueGroup[]>(() => {
        const groupMap = new Map<string, LeagueGroup>();

        for (const change of data.changes) {
            const existing = groupMap.get(change.leagueId);
            if (existing) {
                existing.changes.push(change);
            } else {
                groupMap.set(change.leagueId, {
                    leagueId: change.leagueId,
                    leagueTitle: change.league.title,
                    leagueLevel: change.league.level,
                    leagueImageUrl: change.league.imageUrl,
                    changes: [change],
                });
            }
        }

        // Sort by league level descending (highest first)
        return Array.from(groupMap.values()).sort((a, b) => b.leagueLevel - a.leagueLevel);
    }, [data.changes]);

    const toggleLeague = (leagueId: string) => {
        setCollapsedLeagues(prev => {
            const next = new Set(prev);
            const isCurrentlyCollapsed = next.has(leagueId);
            
            // Mobile screens (<= 768px) use a 1-column layout, so we toggle individually
            const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 769px)').matches;

            if (!isDesktop) {
                if (isCurrentlyCollapsed) next.delete(leagueId);
                else next.add(leagueId);
                return next;
            }
            
            // Find the index of the clicked league
            const index = leagueGroups.findIndex(g => g.leagueId === leagueId);
            if (index === -1) return next;
            
            // Find the paired league (even index pairs with even+1, odd pairs with odd-1)
            const pairIndex = index % 2 === 0 ? index + 1 : index - 1;
            const pairedLeague = leagueGroups[pairIndex];

            if (isCurrentlyCollapsed) {
                // Expand both
                next.delete(leagueId);
                if (pairedLeague) next.delete(pairedLeague.leagueId);
            } else {
                // Collapse both
                next.add(leagueId);
                if (pairedLeague) next.add(pairedLeague.leagueId);
            }
            return next;
        });
    };

    const formatDate = (dateStr: string): string => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay reward-change-modal" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="modal-header">
                    <div className="reward-change-header-info">
                        <div className="header-icon">📊</div>
                        <h2 className="modal-title">{t('rewardChange.title')}</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {/* Body */}
                <div className="modal-body custom-scrollbar">
                    {/* Description */}
                    <p className="reward-change-desc">{t('rewardChange.description')}</p>

                    {/* Meta dates */}
                    <div className="reward-change-meta">
                        <div className="reward-change-meta-item">
                            <span className="meta-label">{t('rewardChange.changedAt')}:</span>
                            <span className="meta-value">{formatDate(data.changedAt)}</span>
                        </div>
                        <div className="reward-change-meta-item">
                            <span className="meta-label">{t('rewardChange.expiresAt')}:</span>
                            <span className="meta-value">{formatDate(data.expiresAt)}</span>
                        </div>
                    </div>

                    {/* League groups */}
                    <div className="reward-league-groups-grid">
                        {leagueGroups.map(group => {
                            const isCollapsed = collapsedLeagues.has(group.leagueId);
                            return (
                                <div key={group.leagueId} className="reward-league-group">
                                    <div
                                        className="reward-league-header"
                                        onClick={() => toggleLeague(group.leagueId)}
                                    >
                                        <img
                                            src={group.leagueImageUrl}
                                            alt={group.leagueTitle}
                                            className="reward-league-badge"
                                        />
                                        <span className="reward-league-name">{group.leagueTitle}</span>
                                        <span className={`reward-league-toggle ${isCollapsed ? 'collapsed' : ''}`}>
                                            ▼
                                        </span>
                                </div>

                                {!isCollapsed && (
                                    <div className="reward-changes-list">
                                        {group.changes.map(change => {
                                            const currencyName = CURRENCY_ID_MAP[change.currencyId] || `ID:${change.currencyId}`;
                                            const coinIcon = COIN_ICONS[currencyName] || COIN_ICONS['RLT'];
                                            const pctChange = calculateChangePercent(change.oldReward, change.newReward);
                                            const isIncrease = pctChange > 0;
                                            const isDecrease = pctChange < 0;
                                            const badgeClass = isIncrease ? 'increase' : isDecrease ? 'decrease' : 'neutral';
                                            const pctDisplay = isIncrease
                                                ? `+${pctChange.toFixed(2)}%`
                                                : `${pctChange.toFixed(2)}%`;

                                            return (
                                                <div key={change.id} className="reward-change-row">
                                                    <div className="reward-coin-info">
                                                        <img
                                                            src={coinIcon}
                                                            alt={currencyName}
                                                            className="reward-coin-icon"
                                                        />
                                                        <span className="reward-coin-name">{currencyName}</span>
                                                    </div>
                                                    <div className="reward-values">
                                                        <span className="reward-old-value">
                                                            {formatReward(change.oldReward, currencyName)}
                                                        </span>
                                                        <span className="reward-arrow">→</span>
                                                        <span className="reward-new-value">
                                                            {formatReward(change.newReward, currencyName)}
                                                        </span>
                                                        <span className={`reward-change-badge ${badgeClass}`}>
                                                            {pctDisplay}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                    </div>
                </div>

                {/* Footer */}
                <div className="modal-footer">
                    <button className="reward-change-dismiss-btn" onClick={onClose}>
                        {t('rewardChange.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RewardChangeModal;
