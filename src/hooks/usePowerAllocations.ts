import { useEffect, useState } from 'react';

export type PowerAllocations = Record<string, number>;
export const POWER_ALLOCATIONS_KEY = 'rollercoin_web_power_allocations';

function readAllocations(value: unknown): PowerAllocations {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    const result: PowerAllocations = {};
    let remaining = 100;
    for (const [coin, percent] of Object.entries(value)) {
        if (!/^[A-Z0-9]+$/.test(coin) || typeof percent !== 'number' || !Number.isFinite(percent)) continue;
        result[coin] = Math.max(0, Math.min(percent, remaining));
        remaining -= result[coin];
    }
    return result;
}

export function usePowerAllocations() {
    const [allocations, setAllocations] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(POWER_ALLOCATIONS_KEY) || '{}');
            return { source: readAllocations(saved?.source), target: readAllocations(saved?.target) };
        } catch {
            return { source: {}, target: {} };
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(POWER_ALLOCATIONS_KEY, JSON.stringify(allocations));
        } catch { /* Keep the simulation usable if storage is unavailable. */ }
    }, [allocations]);

    const setSourceAllocations: React.Dispatch<React.SetStateAction<PowerAllocations>> = update => {
        setAllocations(prev => ({ ...prev, source: typeof update === 'function' ? update(prev.source) : update }));
    };
    const setTargetAllocations: React.Dispatch<React.SetStateAction<PowerAllocations>> = update => {
        setAllocations(prev => ({ ...prev, target: typeof update === 'function' ? update(prev.target) : update }));
    };
    return { sourceAllocations: allocations.source, targetAllocations: allocations.target, setSourceAllocations, setTargetAllocations };
}
