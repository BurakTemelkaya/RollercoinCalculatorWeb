import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CoinData, HashPower, PowerUnit } from '../types';
import { parsePowerText } from '../utils/powerParser';
import { LEAGUES, LeagueInfo } from '../data/leagues';

interface DataInputFormProps {
    onDataParsed: (coins: CoinData[], userPower: HashPower) => void;
    currentCoins: CoinData[];
    currentUserPower: HashPower | null;
    currentLeague: LeagueInfo;
    isAutoLeague: boolean;
    onLeagueChange: (newLeagueId: string) => void;
    onToggleAutoLeague: () => void;
    onShowNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

const DataInputForm: React.FC<DataInputFormProps> = ({
    onDataParsed,
    currentCoins,
    currentUserPower,
    currentLeague,
    isAutoLeague,
    onLeagueChange,
    onToggleAutoLeague,
    onShowNotification
}) => {
    const { t } = useTranslation();
    const [inputText, setInputText] = useState('');
    const [isExpanded, setIsExpanded] = useState(true);

    // Manual power input state
    const [powerValue, setPowerValue] = useState<string>('');
    const [powerUnit, setPowerUnit] = useState<PowerUnit>('Eh');

    const handleParse = () => {
        try {
            let coins = currentCoins;
            let userPower = currentUserPower;

            // Parse text if provided
            if (inputText.trim()) {
                const result = parsePowerText(inputText);
                if (result.coins.length > 0) {
                    coins = result.coins;
                }
                if (result.userPower) {
                    userPower = result.userPower;
                }
            }

            // Override user power if manually entered
            let finalPower = userPower;
            if (powerValue) {
                const value = parseFloat(powerValue);
                if (!isNaN(value) && value > 0) {
                    finalPower = {
                        value: value,
                        unit: powerUnit
                    };
                }
            }

            const hasCoins = coins.length > 0;
            const hasPower = !!finalPower;

            // Validation: Both or one missing
            if (!hasCoins && !hasPower) {
                onShowNotification(t('input.errors.missingBoth'), 'error');
                return;
            }
            if (!hasCoins) {
                onShowNotification(t('input.errors.missingLeagueData'), 'error');
                return;
            }
            if (!hasPower) {
                onShowNotification(t('input.errors.missingUserPower'), 'error');
                return;
            }

            // Success
            onDataParsed(coins, finalPower!);
            setIsExpanded(false);
            onShowNotification(t('input.loadedData', { count: coins.length }), 'success');

        } catch (error) {
            console.error('Parse error:', error);
            onShowNotification(t('input.errors.parseError'), 'error');
        }
    };

    // Pre-fill manual power inputs from currentUserPower
    useEffect(() => {
        if (currentUserPower) {
            setPowerValue(currentUserPower.value.toString());
            setPowerUnit(currentUserPower.unit);
        }
    }, [currentUserPower]);

    // Power units options
    const units: PowerUnit[] = ['Gh', 'Th', 'Ph', 'Eh', 'Zh'];

    // Auto-update user power when typing (debounced)
    useEffect(() => {
        if (!powerValue) return;

        const val = parseFloat(powerValue);
        if (isNaN(val) || val <= 0) return;

        const timeoutId = setTimeout(() => {
            // Update parent state with current coins (even if empty) and new power
            const newPower: HashPower = { value: val, unit: powerUnit };
            onDataParsed(currentCoins, newPower);
        }, 500); // 500ms delay

        return () => clearTimeout(timeoutId);
    }, [powerValue, powerUnit]);

    return (
        <div className="data-input-section">
            <div
                className="section-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <div className="header-left">
                    <span className="section-icon">⚙️</span>
                    <h3 className="section-title">{t('input.title')}</h3>
                </div>
                <div className={`header-arrow ${isExpanded ? 'rotated' : ''}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </div>
            </div>

            {isExpanded && (
                <div className="input-content">

                    <div className="compact-row">
                        {/* User Power Input */}
                        <div className="input-group compact-group">
                            <label>{t('input.userPower')}</label>
                            <div className="power-input-container small-height">
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={powerValue}
                                    onChange={(e) => setPowerValue(e.target.value)}
                                    className="power-value-input small-input"
                                />
                                <select
                                    value={powerUnit}
                                    onChange={(e) => setPowerUnit(e.target.value as PowerUnit)}
                                    className="power-unit-select small-select"
                                >
                                    {units.map(u => <option key={u} value={u}>{u}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* League Selection */}
                        <div className="input-group compact-group">
                            <label>{t('input.leagueSelect')}</label>

                            <div className="league-input-row small-height">
                                <select
                                    value={currentLeague ? currentLeague.id : ''}
                                    onChange={(e) => onLeagueChange(e.target.value)}
                                    disabled={isAutoLeague}
                                    className="league-select flex-grow-select"
                                >
                                    {LEAGUES.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                    ))}
                                </select>

                                <label className="auto-toggle-inline" title="Güce göre otomatik belirle">
                                    <input
                                        type="checkbox"
                                        checked={isAutoLeague}
                                        onChange={onToggleAutoLeague}
                                    />
                                    <span>{t('input.auto')}</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="input-group full-width">
                        <label>{t('input.leaguePowers')}</label>
                        <textarea
                            className="data-textarea"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder={t('input.placeholder')}
                            rows={6}
                        />
                    </div>

                    <div className="action-row-centered">
                        <button
                            className="primary-button wide-button"
                            onClick={handleParse}
                        >
                            {t('input.calculate')}
                        </button>

                        {currentCoins.length > 0 && (
                            <div className="status-overlay">
                                <span className="status-text success">
                                    {t('input.loadedData', { count: currentCoins.length })}
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataInputForm;
