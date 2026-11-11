import { useEffect, useState } from 'react';
import { fetchLatestEventPathSegment } from '../services/progressionEventApi';
import { fetchLatestPuzzlePathSegment } from '../services/puzzleEventApi';

/** Link to the latest progression event (`/{lang}/event/{slug}`); falls back to `/{lang}/event` until loaded. */
export function useLatestEventPath(lang: string): string {
    const [segment, setSegment] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        fetchLatestEventPathSegment().then(s => { if (active) setSegment(s); });
        return () => { active = false; };
    }, []);
    return segment ? `/${lang}/event/${segment}` : `/${lang}/event`;
}

/** Link to the latest puzzle event (`/{lang}/puzzle/{slug}`); falls back to `/{lang}/puzzle` until loaded. */
export function useLatestPuzzlePath(lang: string): string {
    const [segment, setSegment] = useState<string | null>(null);
    useEffect(() => {
        let active = true;
        fetchLatestPuzzlePathSegment().then(s => { if (active) setSegment(s); });
        return () => { active = false; };
    }, []);
    return segment ? `/${lang}/puzzle/${segment}` : `/${lang}/puzzle`;
}
