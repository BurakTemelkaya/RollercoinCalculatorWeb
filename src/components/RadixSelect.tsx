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
                    className={classNames(triggerClassName || 'custom-dropdown-trigger', { disabled })}
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
                                        style={{ width: 20, height: 20 }}
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null;
                                            target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
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
                        style={{ zIndex }}
                    >
                        <Select.Viewport>
                            {options.length === 0 && emptyText ? (
                                <Select.Item className="custom-dropdown-item" value="" disabled>
                                    <Select.ItemText>{emptyText}</Select.ItemText>
                                </Select.Item>
                            ) : (
                                options.map(option => (
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
                                                    style={{ width: 20, height: 20 }}
                                                    onError={(e) => {
                                                        const target = e.target as HTMLImageElement;
                                                        target.onerror = null;
                                                        target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                                                    }}
                                                />
                                            )}
                                            <Select.ItemText>{option.label}</Select.ItemText>
                                        </div>
                                    </Select.Item>
                                ))
                            )}
                        </Select.Viewport>
                    </Select.Content>
                </Select.Portal>
            </Select.Root>
        </div>
    );
};

export default RadixSelect;
