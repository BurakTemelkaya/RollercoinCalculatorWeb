/**
 * Reusable Select Component (Radix UI)
 *
 * A unified dropdown select built on Radix UI primitives.
 * Replaces repeated Select.Root/Trigger/Content/Item boilerplate
 * across EarningsTable, DataInputForm, and LeagueChart.
 */

import React from 'react';
import * as Select from '@radix-ui/react-select';
import classNames from 'classnames';

export interface SelectOption {
    value: string;
    label: string;
    icon?: string;            // URL to icon image
    iconAlt?: string;         // Alt text for icon
    disabled?: boolean;
    group?: string;           // Group label for optgroup-like behavior
}

interface RadixSelectProps {
    value: string;
    onValueChange: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    ariaLabel?: string;
    emptyText?: string;       // Shown when no options available
    className?: string;       // Extra class on trigger
    triggerClassName?: string; // Override trigger class entirely
    contentClassName?: string; // Override content class
    showSelectedIcon?: boolean; // Show icon next to trigger value
    zIndex?: number;
    fullWidth?: boolean; // Add fullWidth prop
}

const RadixSelect: React.FC<RadixSelectProps> = ({
    value,
    onValueChange,
    options,
    placeholder,
    disabled = false,
    ariaLabel,
    emptyText,
    className,
    triggerClassName,
    contentClassName,
    showSelectedIcon = true,
    zIndex = 99999,
    fullWidth = false,
}) => {
    const selectedOption = options.find(o => o.value === value);

    return (
        <div className={classNames('radix-select-wrapper', className)} style={{ display: 'flex', alignItems: 'center', gap: '0', ...(fullWidth ? { width: '100%' } : {}) }}>
            {/* Selected icon outside trigger (not used in current design move to item list) */}
            {/* If we want to hide persistent icons, we keep this false by default */}

            <Select.Root value={value} onValueChange={onValueChange} disabled={disabled}>
                <Select.Trigger
                    className={classNames('custom-dropdown-trigger', triggerClassName, { disabled })}
                    aria-label={ariaLabel || placeholder}
                    style={{ ...(fullWidth ? { width: '100%', justifyContent: 'space-between' } : { justifyContent: 'space-between' }) }}
                >
                    <Select.Value placeholder={placeholder}>
                        {selectedOption ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {/* Icon inside trigger value (only if explicitly requested) */}
                                {showSelectedIcon && selectedOption.icon && (
                                    <img
                                        src={selectedOption.icon}
                                        alt={selectedOption.iconAlt || selectedOption.label}
                                        style={{ width: 20, height: 'auto', objectFit: 'contain', borderRadius: '2px' }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.style.display = 'none';
                                                    }}
                                    />
                                )}
                                <span>{selectedOption.label}</span>
                            </div>
                        ) : (
                            placeholder || ''
                        )}
                    </Select.Value>
                    <Select.Icon className="dropdown-arrow" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        ▼
                    </Select.Icon>
                </Select.Trigger>

                <Select.Portal>
                    <Select.Content
                        className={contentClassName || 'custom-dropdown-list-radix'}
                        position="popper"
                        sideOffset={5}
                        style={{ zIndex, width: 'var(--radix-select-trigger-width)' }}
                    >
                        <Select.Viewport>
                            {options.length === 0 && emptyText ? (
                                <Select.Item className="custom-dropdown-item" value="__empty_placeholder__" disabled>
                                    <Select.ItemText>{emptyText}</Select.ItemText>
                                </Select.Item>
                            ) : (
                                (() => {
                                    const groups: Record<string, typeof options> = { '': [] };
                                    options.forEach(opt => {
                                        const g = opt.group || '';
                                        if (!groups[g]) groups[g] = [];
                                        groups[g].push(opt);
                                    });

                                    return Object.entries(groups).map(([groupName, groupOpts]) => {
                                        if (groupOpts.length === 0) return null;
                                        
                                        const renderItems = () => groupOpts.map(option => (
                                            <Select.Item
                                                key={option.value}
                                                value={option.value}
                                                className={classNames('custom-dropdown-item', { active: option.value === value })}
                                                disabled={option.disabled}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    {option.icon && (
                                                        <img
                                                            src={option.icon}
                                                            alt={option.iconAlt || option.label}
                                                            style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: '50%' }}
                                                            onError={(e) => {
                                                                const target = e.target as HTMLImageElement;
                                                                target.style.display = 'none';
                                                            }}
                                                        />
                                                    )}
                                                    <Select.ItemText>{option.label}</Select.ItemText>
                                                </div>
                                            </Select.Item>
                                        ));

                                        if (!groupName) return renderItems();

                                        return (
                                            <Select.Group key={groupName}>
                                                <Select.Label className="custom-dropdown-label">{groupName}</Select.Label>
                                                {renderItems()}
                                            </Select.Group>
                                        );
                                    });
                                })()
                            )}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    );
};

export default RadixSelect;
