import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COIN_ICONS } from '../utils/constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockDurations: Record<string, number>;
    onSave: (newDurations: Record<string, number>, mode: 'auto' | 'manual') => void;
    coins: string[];
    blockDurationMode: 'auto' | 'manual';
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    blockDurations,
    onSave,
    coins,
    blockDurationMode,
}) => {
    const { t } = useTranslation();
    const [durations, setDurations] = useState<Record<string, number>>(blockDurations);
    const [mode, setMode] = useState<'auto' | 'manual'>(blockDurationMode);

    useEffect(() => {
        setDurations(blockDurations);
        setMode(blockDurationMode);
    }, [blockDurations, blockDurationMode, isOpen]);

    const handleChange = (coin: string, value: string) => {
        const numVal = parseInt(value, 10);
        setDurations(prev => ({
            ...prev,
            [coin]: isNaN(numVal) ? 0 : numVal
        }));
    };

    const handleSave = () => {
        onSave(durations, mode);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content premium-settings">
                <div className="modal-header">
                    <div className="header-icon">⚙️</div>
                    <h2 className="modal-title">{t('settings.title')}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body custom-scrollbar">
                    <div className="settings-info-card">
                        <span className="info-icon">ℹ️</span>
                        <p className="modal-desc">{t('settings.blockDurationDesc')}</p>
                    </div>

                    <div className="block-duration-mode-toggle">
                        <label className="mode-label">{t('settings.blockDurationMode')}</label>
                        <div className="mode-switch">
                            <button
                                className={`mode-switch-btn ${mode === 'auto' ? 'active' : ''}`}
                                onClick={() => setMode('auto')}
                            >
                                {t('settings.auto')}
                            </button>
                            <button
                                className={`mode-switch-btn ${mode === 'manual' ? 'active' : ''}`}
                                onClick={() => setMode('manual')}
                            >
                                {t('settings.manual')}
                            </button>
                        </div>
                        <p className="mode-hint">
                            {mode === 'auto' ? t('settings.autoHint') : t('settings.manualHint')}
                        </p>
                    </div>

                    <div className={`settings-grid ${mode === 'auto' ? 'disabled-grid' : ''}`}>
                        {coins.map(coin => (
                            <div key={coin} className="setting-card">
                                <div className="setting-card-header">
                                    <div className="coin-info-small">
                                        <img
                                            src={COIN_ICONS[coin] || COIN_ICONS['RLT']}
                                            alt={coin}
                                            className="settings-coin-icon"
                                        />
                                        <label>{coin}</label>
                                    </div>
                                </div>
                                <div className="setting-input-field">
                                    <input
                                        type="number"
                                        value={durations[coin] ?? 600}
                                        onChange={(e) => handleChange(coin, e.target.value)}
                                        className="setting-input"
                                        placeholder="600"
                                        disabled={mode === 'auto'}
                                    />
                                    <span className="unit-label">sec</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="cancel-btn-outline" onClick={onClose}>
                        {t('settings.cancel')}
                    </button>
                    <button className="save-btn-primary" onClick={handleSave}>
                        <span>{t('settings.save')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
