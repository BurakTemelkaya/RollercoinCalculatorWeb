import { useEffect, useId, useMemo, useRef, useState, type PointerEvent, type ReactNode } from 'react';
import type { MinerDto } from '../services/userApi';
import { useTranslation } from 'react-i18next';
import { resolveImportedMiners } from '../services/minerImport';
import { MAX_IMPORTED_MINERS, MINER_IMPORT_STORAGE_KEY, MINER_IMPORT_CHANGE_EVENT, parseMinerImport,
    readSavedImportedMiners, saveImportedMiners, adjustImportedQuantities,
    validateImportedQuantities, type ImportedMiner } from '../utils/minerImport';
import { autoScalePower, formatHashPower } from '../utils/powerParser';
import CdnImage from './CdnImage';
import './MinerImport.css';

export default function MinerImport({ onAdd, embedded = false, onMinerPointerDown, addAllLabel, actions }: {
    onAdd: (miners: ImportedMiner[]) => void | false;
    embedded?: boolean;
    addAllLabel?: string;
    actions?: ReactNode;
    onMinerPointerDown?: (event: PointerEvent<HTMLDivElement>, miner: MinerDto, onPlaced: () => void) => void;
}) {
    const { t } = useTranslation();
    const id = useId();
    const [source, setSource] = useState('');
    const [items, setItems] = useState<ImportedMiner[]>(readSavedImportedMiners);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [search, setSearch] = useState('');
    const [sort, setSort] = useState('power-desc');
    const visibleItems = useMemo(() => {
        const query = search.trim().toLowerCase();
        const [field, direction] = sort.split('-');
        const order = direction === 'asc' ? 1 : -1;
        return items.filter(item => item.name.toLowerCase().includes(query)).sort((a, b) => {
            const difference = field === 'name' ? a.name.localeCompare(b.name)
                : field === 'percent' ? a.percent - b.percent : a.power - b.power;
            return difference * order || a.name.localeCompare(b.name) || a.id.localeCompare(b.id);
        });
    }, [items, search, sort]);
    const itemsRef = useRef(items);
    useEffect(() => { itemsRef.current = items; }, [items]);
    const mounted = useRef(true);
    useEffect(() => {
        mounted.current = true;
        const sync = () => { setItems(readSavedImportedMiners()); setError(''); setMessage(''); };
        const storage = (event: StorageEvent) => { if (event.key === MINER_IMPORT_STORAGE_KEY || event.key === null) sync(); };
        window.addEventListener(MINER_IMPORT_CHANGE_EVENT, sync);
        window.addEventListener('storage', storage);
        return () => {
            mounted.current = false;
            window.removeEventListener(MINER_IMPORT_CHANGE_EVENT, sync);
            window.removeEventListener('storage', storage);
        };
    }, []);

    const save = (next: ImportedMiner[]) => {
        if (next.length) {
            try { validateImportedQuantities(next); }
            catch { setError(t('minerImport.quantityError', { max: MAX_IMPORTED_MINERS })); return false; }
        }
        setItems(next);
        try {
            saveImportedMiners(next);
            return true;
        } catch {
            setError(t('minerImport.storageError'));
            return false;
        }
    };
    const read = async () => {
        setBusy(true); setError(''); setMessage('');
        try {
            const parsed = parseMinerImport(source);
            const resolved = await resolveImportedMiners(parsed);
            if (!mounted.current) return;
            const combined = new Map(itemsRef.current.map(item => [item.id, item]));
            for (const item of resolved) combined.set(item.id, item);
            const next = [...combined.values()];
            validateImportedQuantities(next);
            if (save(next)) { setSource(''); setMessage(t('minerImport.saved')); }
        } catch {
            if (mounted.current) setError(t('minerImport.invalid'));
        } finally { if (mounted.current) setBusy(false); }
    };
    const add = (selected: ImportedMiner[]) => {
        setError(''); setMessage('');
        try {
            const available = selected.filter(item => item.quantity > 0);
            if (!available.length) return;
            const next = adjustImportedQuantities(itemsRef.current, available, -1);
            if (onAdd(available) === false) return;
            if (save(next)) setMessage(t('minerImport.added'));
        } catch { setError(t('minerImport.addError')); }
    };
    const changeQuantity = (minerId: string, quantity: number) => {
        const next = items.map(item => item.id === minerId ? { ...item, quantity } : item);
        setItems(next); setError(''); setMessage('');
        try { validateImportedQuantities(next); }
        catch { setError(t('minerImport.quantityError', { max: MAX_IMPORTED_MINERS })); return; }
        save(next);
    };
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
    const valid = items.length > 0 && items.every(item => Number.isSafeInteger(item.quantity) && item.quantity >= 0)
        && totalQuantity <= MAX_IMPORTED_MINERS;

    const Container = embedded ? 'section' : 'details';
    return <Container className={`miner-import ${onMinerPointerDown ? 'miner-import-draggable' : ''}`} aria-label={t('minerImport.title')}>
        {!embedded && <summary>{t('minerImport.title')}{items.length > 0 && ` (${items.length})`}</summary>}
        <div className="miner-import-content">
            <details className="miner-import-source" open={items.length === 0 || undefined}>
                <summary>{t('minerImport.pasteData')}</summary>
                <div className="miner-import-source-content">
                    <p id={`${id}-help`}>{t('minerImport.help')}</p>
                    <div className="miner-import-guide">
                        <strong>{t('minerImport.apiMethod')}</strong>
                        <p>{t('minerImport.apiHelp')} <a href="https://rollercoin.com/api/game/inventory" target="_blank" rel="noreferrer">https://rollercoin.com/api/game/inventory</a></p>
                        <p>{t('minerImport.apiSteps')}</p>
                    </div>
                    <div className="miner-import-guide">
                        <a href="https://rollercoin.com/storage/collection" target="_blank" rel="noreferrer">{t('minerImport.collection')}</a>
                        <p>{t('minerImport.collectionHelp')}</p>
                        <img className="miner-import-guide-image" src="/guides/miner-get-data.png" width={1014} height={781}
                            alt={t('minerImport.collectionExampleAlt')} loading="lazy" />
                    </div>
                    <p>{t('minerImport.quantityHelp')}</p>
                    <label htmlFor={id}>{t('minerImport.input')}</label>
                    <textarea id={id} value={source} disabled={busy} aria-describedby={`${id}-help`} rows={5}
                        onChange={event => { setSource(event.target.value); setError(''); setMessage(''); }} />
                    <button type="button" className="simulator-start-button miner-import-read" disabled={busy || !source.trim()} onClick={() => void read()}>
                        {busy ? '…' : t('minerImport.read')}
                    </button>
                </div>
            </details>
            {items.length > 0 && <>
                <div className="miner-import-toolbar">
                    <label className="miner-import-search">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                            <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4 4" />
                        </svg>
                        <input type="search" value={search} onChange={event => setSearch(event.target.value)}
                            placeholder={t('merge.search')} aria-label={t('merge.search')} />
                    </label>
                    <select className="miner-import-sort" value={sort} onChange={event => setSort(event.target.value)} aria-label={t('merge.sortBy')}>
                        <option value="power-desc">{t('merge.sortOptions.power')} ↓</option>
                        <option value="power-asc">{t('merge.sortOptions.power')} ↑</option>
                        <option value="percent-desc">{t('merge.sortOptions.bonus')} ↓</option>
                        <option value="percent-asc">{t('merge.sortOptions.bonus')} ↑</option>
                        <option value="name-asc">{t('merge.sortOptions.name')} A-Z</option>
                        <option value="name-desc">{t('merge.sortOptions.name')} Z-A</option>
                    </select>
                    <output className="miner-import-count" aria-label={t('merge.searchResults')}>{visibleItems.length} / {items.length}</output>
                </div>
                <div className="miner-import-list">
                    {visibleItems.length === 0 && <p className="miner-import-empty" role="status">{t('merge.dragDropHint')}</p>}
                    {visibleItems.map(item => <div className={`inv-miner-card miner-import-row ${item.quantity === 0 ? 'is-empty' : ''}`} key={item.id}
                        onDragStart={event => event.preventDefault()}
                        onClick={event => {
                            // Pointer capture sends a click without dragging to the card itself.
                            if (event.target === event.currentTarget && !busy && valid && item.quantity > 0) add([{ ...item, quantity: 1 }]);
                        }}
                        onPointerDown={event => {
                            if (busy || !valid || item.quantity <= 0 || !item.miner
                                || (event.target instanceof Element && event.target.closest('.miner-import-controls, .miner-import-remove'))) return;
                            onMinerPointerDown?.(event, item.miner, () => {
                                try { save(adjustImportedQuantities(itemsRef.current, [{ id: item.id, quantity: 1 }], -1)); }
                                catch { setError(t('minerImport.addError')); }
                            });
                        }}>
                        <button type="button" className="miner-import-pick" disabled={busy || !valid || item.quantity <= 0}
                            title={`${t('simulator.addMiner')}: ${item.name}`}
                            aria-label={`${t('simulator.addMiner')}: ${item.name}`} onClick={() => add([{ ...item, quantity: 1 }])}>
                            <div className="inv-miner-card-img-wrapper">
                                {item.miner && item.miner.level > 0 && <div className="inv-miner-card-badge">
                                    <img src={item.miner.type === 'old_merge' ? '/miner-levels/level_star.png' : `/miner-levels/level_${item.miner.level + 1}.webp`}
                                        alt={`Lvl ${item.miner.level + 1}`} />
                                </div>}
                                <CdnImage type="miner" className="inv-miner-card-img" itemId={item.miner?.fileName?.split('.')[0] ?? ''}
                                    fallbackUrl={`https://static.rollercoin.com/static/img/market/miners/${item.miner?.fileName?.includes('.') ? item.miner.fileName : `${item.miner?.fileName}.gif`}?v=1.2.1`}
                                    alt="" loading="lazy" />
                            </div>
                            <span className="inv-miner-card-name" title={item.name}>{item.name}</span>
                            <span className="inv-miner-card-power">{formatHashPower(autoScalePower(item.power * 1e9))}</span>
                            <span className="inv-miner-card-bonus">+{item.percent / 100}%</span>
                        </button>
                        <button type="button" className="miner-import-remove" disabled={busy}
                            title={`${t('minerImport.remove')}: ${item.name}`}
                            aria-label={`${t('minerImport.remove')}: ${item.name}`} onClick={() => { setError(''); setMessage(''); save(items.filter(existing => existing.id !== item.id)); }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
                            </svg>
                        </button>
                        <div className="miner-import-controls">
                            <button type="button" className="miner-import-card-action miner-import-decrease" disabled={busy || item.quantity <= 0}
                                title={`${t('minerImport.decreaseQuantity')}: ${item.name}`}
                                aria-label={`${t('minerImport.decreaseQuantity')}: ${item.name}`} onClick={() => changeQuantity(item.id, item.quantity - 1)}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M3 8h10" /></svg>
                            </button>
                            <label title={t('minerImport.quantity')}><span>{t('minerImport.quantityShort')}</span>
                                <input type="number" min={0} max={MAX_IMPORTED_MINERS} step={1} value={item.quantity} disabled={busy}
                                    aria-label={`${t('minerImport.quantity')}: ${item.name}`} onChange={event => changeQuantity(item.id, Number(event.target.value))} />
                            </label>
                            <button type="button" className="miner-import-card-action miner-import-increase" disabled={busy || totalQuantity >= MAX_IMPORTED_MINERS}
                                title={`${t('minerImport.increaseQuantity')}: ${item.name}`}
                                aria-label={`${t('minerImport.increaseQuantity')}: ${item.name}`} onClick={() => changeQuantity(item.id, item.quantity + 1)}>
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M8 3v10M3 8h10" /></svg>
                            </button>
                        </div>
                    </div>)}
                </div>
            </>}
            {(items.length > 0 || actions) && <div className="miner-import-actions">
                {actions}
                {items.length > 0 && <>
                    <button type="button" className="simulator-start-button miner-import-add" disabled={busy || !valid || totalQuantity === 0} onClick={() => add(items)}>{addAllLabel ?? t('minerImport.addAll')}</button>
                    <button type="button" className="simulator-start-button miner-import-clear" disabled={busy} onClick={() => { setError(''); setMessage(''); save([]); }}>{t('minerImport.clear')}</button>
                </>}
            </div>}
            {error && <p role="alert">{error}</p>}
            {message && <p role="status">{message}</p>}
        </div>
    </Container>;
}
