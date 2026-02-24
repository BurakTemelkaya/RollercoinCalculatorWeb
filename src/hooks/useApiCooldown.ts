import { useState, useEffect, useCallback } from 'react';

export const API_CACHE_KEY = 'rollercoin_web_api_last_fetch';
const CACHE_COOLDOWN_MS = 15 * 1000;

export function useApiCooldown() {
    const [cooldownRemaining, setCooldownRemaining] = useState(0);

    useEffect(() => {
        const updateCooldown = () => {
            const saved = localStorage.getItem(API_CACHE_KEY);
            if (!saved) {
                setCooldownRemaining(0);
                return;
            }
            const lastFetch = parseInt(saved, 10);
            const elapsed = Date.now() - lastFetch;
            setCooldownRemaining(Math.max(0, CACHE_COOLDOWN_MS - elapsed));
        };

        updateCooldown();
        const interval = setInterval(updateCooldown, 1000);
        return () => clearInterval(interval);
    }, []);

    const setFetchStarted = useCallback(() => {
        localStorage.setItem(API_CACHE_KEY, String(Date.now()));
        setCooldownRemaining(CACHE_COOLDOWN_MS);
    }, []);

    const canFetch = cooldownRemaining === 0;

    return { cooldownRemaining, canFetch, setFetchStarted };
}
