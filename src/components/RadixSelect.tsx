/**
 * Reusable Select Component (Radix UI)
 *
 * A unified dropdown select built on Radix UI primitives.
 * Replaces repeated Select.Root/Trigger/Content/Item boilerplate
 * across EarningsTable, DataInputForm, and LeagueChart.
 */

import React, { useEffect, useRef, useState } from 'react';
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
    searchPlaceholder?: string; // When set, shows a search box above long option lists
}

// Case- and accent-insensitive ("turkiye" matches "Türkiye")
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase();

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
    zIndex = 1000005,
    fullWidth = false,
    searchPlaceholder,
}) => {
    const selectedOption = options.find(o => o.value === value);
    const [query, setQuery] = useState('');
    const [open, setOpen] = useState(false);
    const searchRef = useRef<HTMLInputElement>(null);

    // Keyboard handling while searching, in one place: Radix keeps moving focus between the box and items.
    // Typed characters always go to the search box (instead of Radix's typeahead); Enter picks the first match
    // and ArrowDown moves into the list unless an item is already focused (then Radix handles the key).
    const handleSearchKeys = (e: React.KeyboardEvent<HTMLDivElement>) => {
        const target = e.target as HTMLElement;
        const inBox = target === searchRef.current;
        if (e.key === 'Escape' || e.key === 'Tab' || e.ctrlKey || e.metaKey || e.altKey) return;
        if (e.key.length === 1 || e.key === 'Backspace') {
            e.stopPropagation();
            if (!inBox) {
                e.preventDefault();
                setQuery(q => (e.key === 'Backspace' ? q.slice(0, -1) : q + e.key));
                searchRef.current?.focus();
            }
            return;
        }
        if (target.getAttribute('role') === 'option') return;
        const first = visibleOptions.find(o => !o.disabled);
        if (e.key === 'Enter' && first) {
            e.preventDefault();
            e.stopPropagation();
            onValueChange(first.value);
            setOpen(false);
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopPropagation();
            e.currentTarget.querySelector<HTMLElement>('[role=option]:not([data-disabled])')?.focus();
        }
    };

    // Radix focuses the selected item on open; move focus to the search box after it
    useEffect(() => {
        if (!open || !searchPlaceholder) return;
        const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
        return () => window.clearTimeout(timer);
    }, [open, searchPlaceholder]);
    const visibleOptions = searchPlaceholder && query.trim()
        ? options.filter(o => normalize(o.label).includes(normalize(query.trim())) || normalize(o.value).includes(normalize(query.trim())))
        : options;

    return (
        <div className={classNames('radix-select-wrapper', className)} style={{ display: 'flex', alignItems: 'center', gap: '0', ...(fullWidth ? { width: '100%' } : {}) }}>
            {/* Selected icon outside trigger (not used in current design move to item list) */}
            {/* If we want to hide persistent icons, we keep this false by default */}

            <Select.Root value={value} onValueChange={onValueChange} disabled={disabled} open={open} onOpenChange={isOpen => { setOpen(isOpen); setQuery(''); }}>
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
                        onKeyDownCapture={searchPlaceholder ? handleSearchKeys : undefined}
                    >
                        {searchPlaceholder && (
                            <input
                                type="search"
                                className="custom-dropdown-search"
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                ref={searchRef}
                                placeholder={searchPlaceholder}
                                aria-label={searchPlaceholder}
                                style={{ width: '100%', boxSizing: 'border-box', padding: '8px 10px', marginBottom: 4, background: 'rgba(15, 15, 30, 0.6)', border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: '0.9rem', outline: 'none' }}
                            />
                        )}
                        <Select.Viewport>
                            {visibleOptions.length === 0 && (emptyText || searchPlaceholder) ? (
                                <Select.Item className="custom-dropdown-item" value="__empty_placeholder__" disabled>
                                    <Select.ItemText>{query ? '—' : emptyText}</Select.ItemText>
                                </Select.Item>
                            ) : (
                                (() => {
                                    const groups: Record<string, typeof options> = { '': [] };
                                    visibleOptions.forEach(opt => {
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
