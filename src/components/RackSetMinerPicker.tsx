import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchUserMinersFromApi, type MinerDto } from '../services/userApi';
import type { RackSetCatalogItem } from '../utils/rackSetCatalog';
import { autoScalePower } from '../utils/powerParser';
import CdnImage from './CdnImage';

interface Props {
    name: string;
    items: RackSetCatalogItem[];
    placedIds: string[];
    onAdd: (miner: MinerDto) => void;
    onRemove: (minerId: string) => void;
    onReplaceAll: (miners: MinerDto[]) => void;
}

export default function RackSetMinerPicker({ name, items, placedIds, onAdd, onRemove, onReplaceAll }: Props) {
    const { t } = useTranslation();
    const [query, setQuery] = useState('');
    const [loadingId, setLoadingId] = useState<string | null>(null);
    const [error, setError] = useState('');
    const resolvedMiners = useRef(new Map<string, MinerDto>());
    const onAddRef = useRef(onAdd);
    const onReplaceAllRef = useRef(onReplaceAll);
    useEffect(() => { onAddRef.current = onAdd; }, [onAdd]);
    useEffect(() => { onReplaceAllRef.current = onReplaceAll; }, [onReplaceAll]);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    const resolveMiner = async (item: RackSetCatalogItem): Promise<MinerDto> => {
        const knownMiner = item.miner || resolvedMiners.current.get(item.id);
        if (knownMiner) return { ...knownMiner, fileName: knownMiner.fileName || item.filename };
        // Older API responses and the local set catalog lack width. Resolve the
        // real catalog entry before placing it rather than guessing its size.
        let page = 0;
        let found: MinerDto | undefined;
        let hasNext: boolean;
        do {
            // Older responses for new sets only expose a filename, which
            // cannot be used with the API's display-name filter.
            const result = await fetchUserMinersFromApi({
                Name: item.name === item.filename ? undefined : item.name,
                PageIndex: page,
            });
            if (!mounted.current) throw new Error('Picker closed');
            found = result.items.find(miner => miner.id === item.id);
            hasNext = result.hasNext;
            if (found) break;
            page++;
        } while (hasNext);
        if (!found) throw new Error('Missing set miner');
        resolvedMiners.current.set(item.id, found);
        return { ...found, fileName: found.fileName || item.filename };
    };

    const addMiner = async (item: RackSetCatalogItem) => {
        if (loadingId !== null) return;
        setError('');
        setLoadingId(item.id);
        try {
            const miner = await resolveMiner(item);
            if (mounted.current) onAddRef.current(miner);
        } catch {
            if (mounted.current) setError(t('simulator.setMinerUnavailable'));
        } finally {
            if (mounted.current) setLoadingId(null);
        }
    };

    const replaceAll = async () => {
        if (loadingId !== null || items.length === 0) return;
        setError('');
        setLoadingId('replace-all');
        try {
            // Resolve the entire set before changing the rack; a failed lookup
            // must leave the existing miners in place. Ignore the name filter.
            const miners: MinerDto[] = [];
            for (const item of items) {
                miners.push(await resolveMiner(item));
                if (!mounted.current) return;
            }
            onReplaceAllRef.current(miners);
        } catch {
            if (mounted.current) setError(t('simulator.setMinerUnavailable'));
        } finally {
            if (mounted.current) setLoadingId(null);
        }
    };

    const filtered = items.filter(item => item.name.toLowerCase().includes(query.trim().toLowerCase()));
    return (
        <section className="rack-set-picker" aria-label={t('simulator.setMiners')}>
            <h4>{name} · {t('simulator.setMiners')}</h4>
            <button type="button" className="rack-set-replace-all rack-edit-unmount-btn"
                disabled={loadingId !== null || items.length === 0} onClick={() => void replaceAll()}>
                {loadingId === 'replace-all' ? '…' : t('simulator.replaceAllWithSetMiners')}
            </button>
            <input className="rc-search-input" value={query} onChange={event => setQuery(event.target.value)}
                placeholder={t('merge.searchByName')} aria-label={t('merge.searchByName')} />
            {error && <p role="alert">{error}</p>}
            <div className="rack-set-miners">
                {filtered.map(item => {
                    const miner = item.miner || resolvedMiners.current.get(item.id);
                    const power = miner ? autoScalePower(miner.power * 1e9) : null;
                    return (
                        <div className="rack-set-miner" key={item.id}>
                            <CdnImage type="miner" itemId={item.filename.split('.')[0]}
                                fallbackUrl={`https://static.rollercoin.com/static/img/market/miners/${item.filename}.gif?v=${miner?.imageVersion || 1}`}
                                alt={item.name} loading="lazy" />
                            <div className="rack-set-miner-copy">
                                <strong>{item.name}</strong>
                                {miner && <span>Lv. {miner.level + 1} · {power?.value.toLocaleString(undefined, { maximumFractionDigits: 2 })} {power?.unit}/s · {miner.percent / 100}%</span>}
                            </div>
                            {placedIds.includes(miner?.id || item.id) && (
                                <button type="button" className="rack-edit-action-btn rack-set-remove" disabled={loadingId !== null}
                                    title={t('simulator.removeMinerFromRack')}
                                    aria-label={`${t('simulator.removeMinerFromRack')}: ${item.name}`}
                                    onClick={() => onRemove(miner?.id || item.id)}>✕</button>
                            )}
                            <button type="button" className="rack-edit-action-btn" disabled={loadingId !== null}
                                aria-label={`${t('simulator.addMiner')}: ${item.name}`} onClick={() => void addMiner(item)}>
                                {loadingId === item.id ? '…' : '+'}
                            </button>
                        </div>
                    );
                })}
                {filtered.length === 0 && <p>{t('simulator.noMinersFound')}</p>}
            </div>
        </section>
    );
}
