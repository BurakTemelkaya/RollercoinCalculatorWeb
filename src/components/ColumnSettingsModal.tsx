import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { COIN_ICONS } from '../utils/constants';

type TableColumnType = 'blockReward' | 'blockDuration' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';

interface ColumnSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    visibleColumns: Set<TableColumnType>;
    onVisibleColumnsChange: (columns: Set<TableColumnType>) => void;
    customPeriodDays: number;
    customPeriodHours: number;
    onCustomPeriodDaysChange: (days: number) => void;
    onCustomPeriodHoursChange: (hours: number) => void;
    availableCoins?: string[];
    visibleCoins?: string[] | null;
    onVisibleCoinsChange?: (coins: string[] | null) => void;
    onShowNotification?: (message: string, type: 'success' | 'error' | 'info') => void;
}

const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
    isOpen,
    onClose,
    visibleColumns,
    onVisibleColumnsChange,
    customPeriodDays,
    customPeriodHours,
    onCustomPeriodDaysChange,
    onCustomPeriodHoursChange,
    availableCoins = [],
    visibleCoins = null,
    onVisibleCoinsChange,
    onShowNotification,
}) => {
    const { t } = useTranslation();
    const [isMultiSelectOpen, setIsMultiSelectOpen] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');

    const columns: { id: TableColumnType; labelKey: string }[] = [
        { id: 'blockReward', labelKey: 'table.headers.blockReward' },
        { id: 'blockDuration', labelKey: 'table.headers.blockDuration' },
        { id: 'hourly', labelKey: 'table.headers.hourly' },
        { id: 'daily', labelKey: 'table.headers.daily' },
        { id: 'weekly', labelKey: 'table.headers.weekly' },
        { id: 'monthly', labelKey: 'table.headers.monthly' },
        { id: 'custom', labelKey: 'table.headers.custom' },
    ];

    const toggleColumnVisibility = (column: TableColumnType) => {
        const newColumns = new Set(visibleColumns);
        if (newColumns.has(column)) {
            newColumns.delete(column);
        } else {
            newColumns.add(column);
        }
        onVisibleColumnsChange(newColumns);
    };

    const getCustomPeriodAbbr = (): string => {
        const daysAbbr = t('table.daysAbbr') || 'd';
        const hoursAbbr = t('table.hoursAbbr') || 'h';
        const parts = [];
        if (customPeriodDays > 0) parts.push(`${customPeriodDays} ${daysAbbr}`);
        if (customPeriodHours > 0) parts.push(`${customPeriodHours} ${hoursAbbr}`);
        return parts.join(' ') || '';
    };

    // Prevent background scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'auto';
            };
        }
    }, [isOpen]);

    const handleSafeClose = () => {
        if (visibleCoins !== null && visibleCoins.length === 0) {
            if (onShowNotification) {
                onShowNotification(t('table.atLeastOneCoinError', 'En az bir coin seçili kalmalıdır!'), 'error');
            }
            return;
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleSafeClose}>
            <div className="modal-content premium-settings" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div className="header-icon">🎛️</div>
                    <h2 className="modal-title">{t('table.columnSettings')}</h2>
                    <button className="close-btn" onClick={handleSafeClose}>✕</button>
                </div>

                <div className="modal-body custom-scrollbar">
                    {/* Column Selection Section */}
                    <div className="settings-section" style={{ marginBottom: 0 }}>
                        <h3 className="settings-section-title">{t('table.selectColumns')}</h3>
                        <div className="column-grid-modal">
                            {columns.map(col => {
                                if (col.id === 'custom') {
                                    return (
                                        <div key={col.id} className="checkbox-item-modal custom-group-wrapper" style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', padding: '4px 10px' }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0, flexShrink: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    checked={visibleColumns.has(col.id)}
                                                    onChange={(e) => {
                                                        if (e.target.checked && (!customPeriodDays && !customPeriodHours)) {
                                                            if (onShowNotification) {
                                                                onShowNotification(t('table.customPeriodEmptyWarning', 'Lütfen geçerli bir gün veya saat giriniz.'), 'error');
                                                            }
                                                            return; // Prevent checking if inputs are 0
                                                        }
                                                        toggleColumnVisibility(col.id);
                                                    }}
                                                    className="checkbox-input"
                                                />
                                                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', userSelect: 'none' }}>{t(col.labelKey)}</span>
                                            </label>
                                            
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="365"
                                                    step="1"
                                                    value={customPeriodDays || ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        onCustomPeriodDaysChange(isNaN(val) ? 0 : val);
                                                        if ((val > 0 || customPeriodHours > 0) && !visibleColumns.has('custom')) {
                                                            toggleColumnVisibility('custom');
                                                        } else if (val === 0 && customPeriodHours === 0 && visibleColumns.has('custom')) {
                                                            toggleColumnVisibility('custom');
                                                        }
                                                    }}
                                                    placeholder={t('table.days', 'Days')}
                                                    style={{ width: '70px', padding: '6px 10px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                                                />
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('table.daysAbbr')}</span>

                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="23"
                                                    step="1"
                                                    value={customPeriodHours || ''}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        onCustomPeriodHoursChange(isNaN(val) ? 0 : val);
                                                        if ((val > 0 || customPeriodDays > 0) && !visibleColumns.has('custom')) {
                                                            toggleColumnVisibility('custom');
                                                        } else if (val === 0 && customPeriodDays === 0 && visibleColumns.has('custom')) {
                                                            toggleColumnVisibility('custom');
                                                        }
                                                    }}
                                                    placeholder={t('table.hours', 'Hours')}
                                                    style={{ width: '70px', padding: '6px 10px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', fontSize: '12px' }}
                                                />
                                                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>{t('table.hoursAbbr')}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <label key={col.id} className="checkbox-item-modal">
                                        <input
                                            type="checkbox"
                                            checked={visibleColumns.has(col.id)}
                                            onChange={() => toggleColumnVisibility(col.id)}
                                            className="checkbox-input"
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)', userSelect: 'none' }}>{t(col.labelKey)}</span>
                                    </label>
                                );
                            })}
                        </div>
                        
                        {(customPeriodDays > 0 || customPeriodHours > 0) && (
                            <div className="custom-period-preview" style={{ marginTop: '12px', marginBottom: '20px' }}>
                                <span className="preview-label">{t('table.customPeriodHint', { value: getCustomPeriodAbbr() })}</span>
                            </div>
                        )}
                    </div>

                    {/* Coin Selection Section */}
                    {availableCoins.length > 0 && onVisibleCoinsChange && (
                    <div className="settings-section">
                        <h3 className="settings-section-title">{t('table.filterCoins', 'Filter Coins')}</h3>

                        {/* Custom Multiple Select Dropdown */}
                        <div style={{ position: 'relative', marginBottom: '20px' }}>
                            <div 
                                className="setting-input-large" 
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', background: 'var(--input-bg)' }}
                                onClick={() => {
                                    if (isMultiSelectOpen && visibleCoins !== null && visibleCoins.length === 0) {
                                        if (onShowNotification) {
                                            onShowNotification(t('table.atLeastOneCoinError', 'En az bir coin seçili kalmalıdır!'), 'error');
                                        }
                                        return;
                                    }
                                    setIsMultiSelectOpen(!isMultiSelectOpen);
                                }}
                            >
                                <span style={{ color: visibleCoins === null || visibleCoins.length === availableCoins.length ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                                    {visibleCoins === null || visibleCoins.length === availableCoins.length
                                        ? t('table.allCoinsSelected', 'Tüm Coinler Seçili') 
                                        : visibleCoins.length === 0 
                                            ? t('table.noCoinsSelected', 'Hiçbiri Seçilmedi')
                                            : `${visibleCoins.length} ${t('table.coinsSelected', 'Coin Seçili')} (${visibleCoins.slice(0,3).join(', ')}${visibleCoins.length > 3 ? '...' : ''})`}
                                </span>
                                <span style={{ transform: isMultiSelectOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s', fontSize: '10px' }}>▼</span>
                            </div>
                            
                            {isMultiSelectOpen && (
                                <div className="custom-scrollbar" style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100, maxHeight: '300px', overflowY: 'auto', background: 'var(--modal-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', marginTop: '8px', padding: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.8)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <input
                                        type="text"
                                        placeholder={t('table.searchCoins', 'Coin Ara...')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ width: '100%', padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border-color)', borderRadius: '6px', color: 'var(--text-primary)', outline: 'none', marginBottom: '4px' }}
                                    />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', paddingBottom: '8px', borderBottom: '1px solid var(--border-color)' }}>
                                        <button 
                                            onClick={() => onVisibleCoinsChange(null)} 
                                            style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: '4px 8px', borderRadius: '4px' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {t('table.selectAll', 'Tümünü Seç')}
                                        </button>
                                        <button 
                                            onClick={() => {
                                                if (availableCoins.length > 0) {
                                                    if (onVisibleCoinsChange) {
                                                        onVisibleCoinsChange([]);
                                                    }
                                                }
                                            }} 
                                            style={{ background: 'transparent', border: 'none', color: 'var(--error-color)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', padding: '4px 8px', borderRadius: '4px' }}
                                            onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                                        >
                                            {t('table.deselectAll', 'Tümünü Kaldır')}
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        {availableCoins.filter(c => c.toLowerCase().includes(searchQuery.toLowerCase())).map(coin => {
                                            const isSelected = visibleCoins === null || visibleCoins.includes(coin);
                                            return (
                                                <label key={`select-${coin}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 12px', margin: 0, borderRadius: '6px', background: isSelected ? 'var(--bg-tertiary)' : 'transparent', width: '100%', cursor: 'pointer', transition: 'background 0.2s', border: '1px solid transparent' }}
                                                    onMouseOver={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                                                    onMouseOut={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => {
                                                            const currentVisible = visibleCoins === null ? availableCoins : visibleCoins;
                                                            const newCoins = isSelected 
                                                                ? currentVisible.filter(c => c !== coin)
                                                                : [...currentVisible, coin];
                                                                
                                                            if (newCoins.length === availableCoins.length) {
                                                                if (onVisibleCoinsChange) onVisibleCoinsChange(null);
                                                            } else {
                                                                if (onVisibleCoinsChange) onVisibleCoinsChange(newCoins);
                                                            }
                                                        }}
                                                        className="checkbox-input"
                                                        style={{ margin: 0 }}
                                                    />
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)', fontSize: '14px', fontWeight: '500' }}>
                                                        <img src={COIN_ICONS[coin] || COIN_ICONS['RLT']} alt={coin} style={{width: 20, height: 20, objectFit: 'contain'}} />
                                                        {coin}
                                                    </span>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="save-btn-primary" onClick={handleSafeClose} style={{ marginLeft: 'auto' }}>
                        <span>{t('settings.save')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColumnSettingsModal;
