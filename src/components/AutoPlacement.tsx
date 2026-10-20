import { useCallback, useLayoutEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import type { RollercoinRoomResponse, ApiRoomMinerPlacement } from '../types/room';
import type { GetRackSetListDto } from '../services/rackApi';
import type { AutoPlacementResult, AutoPlacementMode } from '../utils/autoPlacement';
import type { LeagueInfo } from '../data/leagues';
import type { PowerUnit } from '../types';
import { parseMinerImport, MINER_IMPORT_STORAGE_KEY, MINER_IMPORT_CHANGE_EVENT } from '../utils/minerImport';
import { autoScalePower, formatHashPower, toBaseUnit } from '../utils/powerParser';
import { getLeaguePowerCeilingGh } from '../utils/leagueHelper';
import './AutoPlacement.css';

interface Props {
    room: RollercoinRoomResponse;
    sets?: GetRackSetListDto[];
    onApply: (result: AutoPlacementResult) => void;
    onLocate: (minerId: string) => void;
    toolbarTarget: HTMLElement | null;
    leagues: LeagueInfo[];
    currentLeagueId: string;
}

export default function AutoPlacement({ room, sets, onApply, onLocate, toolbarTarget, leagues, currentLeagueId }: Props) {
    const { t } = useTranslation();
    const id = useId();
    const workerRef = useRef<Worker | null>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [limitMode, setLimitMode] = useState('none');
    const [limitValue, setLimitValue] = useState('');
    const [limitUnit, setLimitUnit] = useState<PowerUnit>('Zh');
    const [selectedLeagueId, setSelectedLeagueId] = useState('');
    const [mode, setMode] = useState<AutoPlacementMode>('optimal');
    const [keepPlaced, setKeepPlaced] = useState(false);
    const [noMovePlaced, setNoMovePlaced] = useState(true);
    const sortedLeagues = [...leagues].filter(league => Number.isFinite(league.minPower)).sort((a, b) => a.minPower - b.minPower);
    const currentLeague = leagues.find(league => league.id === currentLeagueId);
    const nextLeague = sortedLeagues.find(league => league.minPower > (currentLeague?.minPower ?? Infinity));
    const targetLeague = leagues.find(league => league.id === selectedLeagueId);
    const targetBoundary = targetLeague ? sortedLeagues.find(league => league.minPower > targetLeague.minPower)?.minPower : undefined;
    const leagueMode = limitMode === 'league' || limitMode === 'selectLeague';
    const changeMode = (value: string) => {
        if (value === 'league') setSelectedLeagueId(nextLeague?.id ?? '');
        else if (value === 'selectLeague') setSelectedLeagueId(currentLeagueId);
        setLimitMode(value);
    };
    let maxPowerGh: number | undefined;
    if (leagueMode) {
        maxPowerGh = targetLeague ? getLeaguePowerCeilingGh(targetLeague, leagues) : NaN;
    } else if (limitMode === 'custom') {
        const value = limitValue.trim() ? Number(limitValue.replace(',', '.')) : NaN;
        maxPowerGh = toBaseUnit({ value, unit: limitUnit }) / 1e9;
    }
    const invalidLimit = maxPowerGh !== undefined && (!Number.isFinite(maxPowerGh) || maxPowerGh < 0);
    const [job, setJob] = useState<{ room: RollercoinRoomResponse; sets?: GetRackSetListDto[]; maxPowerGh?: number; mode: AutoPlacementMode; keepPlaced: boolean; noMovePlaced: boolean } | null>(null);
    const [result, setResult] = useState<AutoPlacementResult | null>(null);
    const [notice, setNotice] = useState<{ room: RollercoinRoomResponse; key: string; error?: boolean } | null>(null);
    const running = job?.room === room && job?.sets === sets && Object.is(job?.maxPowerGh, maxPowerGh) && job?.mode === mode && job?.keepPlaced === keepPlaced && job?.noMovePlaced === noMovePlaced;
    const visibleResult = result?.room === room ? result : null;
    const stopWorker = useCallback(() => {
        workerRef.current?.terminate(); workerRef.current = null;
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
    }, []);
    const cancel = () => {
        stopWorker(); setJob(null);
        setNotice({ room, key: 'autoPlacement.cancelled' });
    };
    useLayoutEffect(() => {
        const stockChanged = () => {
            if (!workerRef.current) return;
            stopWorker(); setJob(null);
            setNotice({ room, key: 'autoPlacement.inventoryChanged', error: true });
        };
        const storageChanged = (event: StorageEvent) => {
            if (event.key === MINER_IMPORT_STORAGE_KEY || event.key === null) stockChanged();
        };
        window.addEventListener(MINER_IMPORT_CHANGE_EVENT, stockChanged);
        window.addEventListener('storage', storageChanged);
        return () => {
            stopWorker();
            setJob(null);
            window.removeEventListener(MINER_IMPORT_CHANGE_EVENT, stockChanged);
            window.removeEventListener('storage', storageChanged);
        };
    }, [room, sets, maxPowerGh, mode, keepPlaced, noMovePlaced, stopWorker]);

    const start = () => {
        setNotice(null); setResult(null);
        const fail = (key = 'autoPlacement.error') => {
            stopWorker(); setJob(null); setNotice({ room, key, error: true });
        };
        if (invalidLimit) { fail('autoPlacement.invalidLimit'); return; }
        try {
            const snapshot = localStorage.getItem(MINER_IMPORT_STORAGE_KEY);
            const inventory = snapshot === null ? [] : parseMinerImport(snapshot);
            const worker = new Worker(new URL('../workers/autoPlacement.worker.ts', import.meta.url), { type: 'module' });
            workerRef.current = worker; setJob({ room, sets, maxPowerGh, mode, keepPlaced, noMovePlaced });
            worker.onerror = () => { if (workerRef.current === worker) fail(); };
            worker.onmessageerror = () => { if (workerRef.current === worker) fail(); };
            worker.onmessage = (event: MessageEvent<{ result?: AutoPlacementResult; error?: boolean }>) => {
                if (workerRef.current !== worker) return;
                stopWorker(); setJob(null);
                try {
                    if (localStorage.getItem(MINER_IMPORT_STORAGE_KEY) !== snapshot) { fail('autoPlacement.inventoryChanged'); return; }
                    const next = event.data.result;
                    if (event.data.error || !next || next.mode !== mode) { fail(); return; }
                    if (!next.limitSatisfied || (maxPowerGh !== undefined && next.afterPower > maxPowerGh)) { fail('autoPlacement.limitUnavailable'); return; }
                    if (!next.changes.length && next.afterPower === next.beforePower) {
                        setNotice({ room, key: maxPowerGh === undefined ? 'autoPlacement.noImprovement' : 'autoPlacement.noLimitChange' }); return;
                    }
                    onApply(next);
                    setResult(next);
                } catch { fail(); }
            };
            timeoutRef.current = setTimeout(() => fail(), 15000);
            worker.postMessage({ room, inventory, sets, maxPowerGh, options: { mode, keepPlaced, noMovePlaced } });
        } catch { fail(); }
    };
    const power = (value: number) => formatHashPower(autoScalePower(value * 1e9));
    const location = (placement: ApiRoomMinerPlacement | null) => {
        if (!placement) return t('autoPlacement.inventory');
        const rack = room.racks?.find(rack => rack._id === placement.user_rack_id);
        const roomIndex = room.rooms?.findIndex(r => r._id === rack?.placement?.user_room_id) ?? -1;
        const roomRacks = room.racks?.filter(r => r.placement?.user_room_id === rack?.placement?.user_room_id) ?? [];
        return t('autoPlacement.location', { room: roomIndex + 1,
            rack: roomRacks.findIndex(r => r._id === placement.user_rack_id) + 1,
            row: placement.y + 1, column: placement.x + 1 });
    };
    return <>
        {toolbarTarget && createPortal(<div className="room-auto-placement-toolbar" aria-busy={running}>
            <div className="auto-placement-strategy" role="group" aria-label={t('autoPlacement.priority')} title={t(`autoPlacement.${mode}Help`)}>
                {(['power', 'bonus', 'optimal'] as const).map(value => <button key={value} type="button"
                    data-placement-mode={value} aria-pressed={mode === value} disabled={running} onClick={() => setMode(value)}>
                    {t(`autoPlacement.${value}`)}
                </button>)}
            </div>
            <label className="auto-placement-keep" title={t('autoPlacement.keepPlacedHelp')}>
                <input type="checkbox" checked={keepPlaced} disabled={running} onChange={event => {
                    setKeepPlaced(event.target.checked); if (event.target.checked) setNoMovePlaced(true);
                }} />
                <span>{t('autoPlacement.keepPlaced')}</span>
            </label>
            <label className="auto-placement-keep auto-placement-allow-move" title={t('autoPlacement.allowMovingPlacedHelp')}>
                <input type="checkbox" checked={!noMovePlaced} disabled={running} onChange={event => {
                    setNoMovePlaced(!event.target.checked); if (event.target.checked) setKeepPlaced(false);
                }} />
                <span>{t('autoPlacement.allowMovingPlaced')}</span>
            </label>
            <label className="auto-placement-limit-mode">
                <span>{t('autoPlacement.powerLimit')}</span>
                <select value={limitMode} disabled={running} onChange={event => changeMode(event.target.value)}>
                    <option value="none">{t('autoPlacement.unlimited')}</option>
                    <option value="league" disabled={!nextLeague && limitMode !== 'league'}>{t('autoPlacement.nextLeagueLimit')}</option>
                    <option value="selectLeague">{t('autoPlacement.leagueLimit')}</option>
                    <option value="custom">{t('autoPlacement.customLimit')}</option>
                </select>
            </label>
            {limitMode === 'selectLeague' && <label className="auto-placement-league-choice">
                <span>{t('autoPlacement.selectLeague')}</span>
                <select value={selectedLeagueId} disabled={running} onChange={event => setSelectedLeagueId(event.target.value)}>
                    {sortedLeagues.map(league => <option key={league.id} value={league.id}>{league.name}</option>)}
                </select>
            </label>}
            {limitMode === 'custom' && <div className="auto-placement-custom-limit">
                <input type="text" inputMode="decimal" className="auto-placement-limit-value" value={limitValue} disabled={running}
                    aria-label={t('autoPlacement.targetPower')} aria-invalid={limitValue !== '' && invalidLimit}
                    placeholder={t('autoPlacement.targetPower')} onChange={event => setLimitValue(event.target.value)} />
                <select className="auto-placement-limit-unit" value={limitUnit} disabled={running}
                    aria-label={t('autoPlacement.powerUnit')} onChange={event => setLimitUnit(event.target.value as PowerUnit)}>
                    {(['Gh', 'Th', 'Ph', 'Eh', 'Zh', 'Yh'] as PowerUnit[]).map(unit => <option key={unit} value={unit}>{unit}/s</option>)}
                </select>
            </div>}
            {leagueMode && targetLeague && !invalidLimit && <span className="auto-placement-limit-note">{targetLeague.name}: {targetBoundary === undefined ? t('autoPlacement.noLeagueCeiling') : <>&lt; {power(targetBoundary)}</>}</span>}
            {invalidLimit && (limitValue !== '' || leagueMode) && <span className="auto-placement-limit-note" role="alert">{t(leagueMode ? 'autoPlacement.selectLeague' : 'autoPlacement.invalidLimit')}</span>}
            <button type="button" className="room-auto-placement-button" disabled={!running && (invalidLimit || !room.racks?.some(rack => rack.placement))}
                onClick={running ? cancel : start} aria-controls={id} title={t(running ? 'autoPlacement.running' : maxPowerGh === undefined ? 'autoPlacement.help' : 'autoPlacement.limitHelp')}>
                {running ? <span className="spinner small" aria-hidden="true" /> : <span aria-hidden="true">✦</span>}
                {t(running ? 'autoPlacement.cancel' : 'autoPlacement.title')}
            </button>
        </div>, toolbarTarget)}
        <section className="room-auto-placement" aria-label={t('autoPlacement.title')} aria-busy={running}
            hidden={!visibleResult && notice?.room !== room}>
        {notice?.room === room && <p role={notice.error ? 'alert' : 'status'}>{t(notice.key)}</p>}
        <div id={id}>
            {visibleResult && <details className="room-auto-placement-report" open>
                <summary>{t('autoPlacement.result', { count: visibleResult.changes.length })}
                    <span className={`room-auto-placement-gain ${visibleResult.afterPower < visibleResult.beforePower ? 'is-negative' : ''}`}>
                        {visibleResult.afterPower < visibleResult.beforePower ? '−' : '+'}{power(Math.abs(visibleResult.afterPower - visibleResult.beforePower))}
                    </span>
                </summary>
                <div className="room-auto-placement-totals">
                    <span>{t('autoPlacement.before')} <strong>{power(visibleResult.beforePower)}</strong></span>
                    <span>{t('autoPlacement.after')} <strong>{power(visibleResult.afterPower)}</strong></span>
                    {visibleResult.maxPowerGh !== undefined && <span>{t('autoPlacement.powerLimit')}: <strong>≤ {power(visibleResult.maxPowerGh)}</strong></span>}
                </div>
                <p className="auto-placement-objective">{t('autoPlacement.priority')}: <strong>{t(`autoPlacement.${visibleResult.mode}`)}</strong>
                    {visibleResult.mode !== 'optimal' && <> · {visibleResult.mode === 'bonus'
                        ? `${visibleResult.beforeObjective / 100}% → ${visibleResult.afterObjective / 100}%`
                        : `${power(visibleResult.beforeObjective)} → ${power(visibleResult.afterObjective)}`}</>}
                </p>
                <p>{t(visibleResult.exact ? 'autoPlacement.exact' : 'autoPlacement.bounded')}</p>
                <ol className="room-auto-placement-changes">
                    {visibleResult.changes.map(change => <li key={change.minerId}>
                        <button type="button" disabled={!change.to}
                            onClick={() => change.to && onLocate(change.minerId)}>
                            <strong>{change.name}</strong>
                            <span><b className="auto-placement-action">{t(!change.to ? 'autoPlacement.removedToInventory'
                                : change.from ? 'autoPlacement.moved' : 'autoPlacement.addedFromInventory')}</b>
                                {' · '}{location(change.from)} <span aria-hidden="true">→</span> {location(change.to)}</span>
                        </button>
                    </li>)}
                </ol>
            </details>}
        </div>
        </section>
    </>;
}
