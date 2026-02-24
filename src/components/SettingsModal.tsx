import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COIN_ICONS } from '../utils/constants';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    blockDurations: Record<string, number>;
    onSave: (newDurations: Record<string, number>) => void;
    coins: string[];
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    blockDurations,
    onSave,
    coins
}) => {
    const { t } = useTranslation();
    const [durations, setDurations] = useState<Record<string, number>>(blockDurations);

    useEffect(() => {
        setDurations(blockDurations);
    }, [blockDurations, isOpen]);

    const handleChange = (coin: string, value: string) => {
        const numVal = parseInt(value, 10);
        setDurations(prev => ({
            ...prev,
            [coin]: isNaN(numVal) ? 0 : numVal
        }));
    };

    const handleSave = () => {
        onSave(durations);
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

                    <div className="settings-grid">
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
