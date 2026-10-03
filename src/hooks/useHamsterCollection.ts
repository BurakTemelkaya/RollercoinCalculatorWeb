import { useState } from 'react';

const STORAGE_KEY = 'hamster-collection-v1';

export default function useHamsterCollection() {
  const [owned, setOwned] = useState<string[]>(() => {
    try {
      const value: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
    } catch { return []; }
  });
  const toggleOwned = (slug: string) => setOwned(previous => {
    const next = previous.includes(slug) ? previous.filter(item => item !== slug) : [...previous, slug];
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* Collection still works in memory. */ }
    return next;
  });
  return { owned, toggleOwned };
}
