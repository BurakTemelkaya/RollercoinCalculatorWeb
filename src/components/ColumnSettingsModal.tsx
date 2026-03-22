import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

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
}

const ColumnSettingsModal: React.FC<ColumnSettingsModalProps> = ({
    isOpen,
    onClose,
    visibleColumns,
    onVisibleColumnsChange,
    customPeriodDays,
    customPeriodHours,
    onCustomPeriodDaysChange,
    onCustomPeriodHoursChange
}) => {
    const { t } = useTranslation();

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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content premium-settings">
                <div className="modal-header">
                    <div className="header-icon">🎛️</div>
                    <h2 className="modal-title">{t('table.columnSettings')}</h2>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                <div className="modal-body custom-scrollbar">
                    {/* Column Selection Section */}
                    <div className="settings-section">
                        <h3 className="settings-section-title">{t('table.selectColumns')}</h3>
                        <div className="column-grid-modal">
                            {columns.map(col => (
                                <label key={col.id} className="checkbox-item-modal">
                                    <input
                                        type="checkbox"
                                        checked={visibleColumns.has(col.id)}
                                        onChange={() => toggleColumnVisibility(col.id)}
                                        className="checkbox-input"
                                    />
                                    <span className="checkbox-label">{t(col.labelKey)}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Custom Period Section */}
                    <div className="settings-section custom-period-section">
                        <h3 className="settings-section-title">{t('table.customPeriod')}</h3>
                        <div className="custom-period-setting-group">
                            <div className="custom-period-setting-item">
                                <label className="setting-label">{t('table.days')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="365"
                                    step="1"
                                    value={customPeriodDays || ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onCustomPeriodDaysChange(isNaN(val) ? 0 : val);
                                        // Auto-enable custom column if any value is set
                                        if ((val > 0 || customPeriodHours > 0) && !visibleColumns.has('custom')) {
                                            toggleColumnVisibility('custom');
                                        }
                                    }}
                                    placeholder="0"
                                    className="setting-input-large"
                                />
                            </div>
                            <div className="custom-period-setting-item">
                                <label className="setting-label">{t('table.hours')}</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="23"
                                    step="1"
                                    value={customPeriodHours || ''}
                                    onChange={(e) => {
                                        const val = parseFloat(e.target.value);
                                        onCustomPeriodHoursChange(isNaN(val) ? 0 : val);
                                        // Auto-enable custom column if any value is set
                                        if ((val > 0 || customPeriodDays > 0) && !visibleColumns.has('custom')) {
                                            toggleColumnVisibility('custom');
                                        }
                                    }}
                                    placeholder="0"
                                    className="setting-input-large"
                                />
                            </div>
                        </div>
                        {(customPeriodDays > 0 || customPeriodHours > 0) && (
                            <div className="custom-period-preview">
                                <span className="preview-label">{t('table.customPeriodHint', { value: getCustomPeriodAbbr() })}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <button className="save-btn-primary" onClick={onClose} style={{ marginLeft: 'auto' }}>
                        <span>{t('settings.save')}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ColumnSettingsModal;
