import type { ApiRoomMiner, ApiRoomMinerPlacement, ApiRoomRack, RollercoinRoomResponse } from '../types/room';
import type { GetRackSetListDto } from '../services/rackApi';
import type { ImportedMiner, ImportedMinerQuantity } from './minerImport';
import { MAX_IMPORTED_MINERS, validateImportedQuantities, isValidMinerFilename } from './minerImport';
import { calculateExactRoomPower, type ExactPowerStats } from './roomParser';
import { isMinerInRackSet } from './rackSetCatalog';
import { SETS_DATA } from '../data/sets';
import { guessSetByMiner } from './setCalculator';

export interface AutoPlacementChange {
    minerId: string;
    name: string;
    from: ApiRoomMinerPlacement | null;
    to: ApiRoomMinerPlacement | null;
}
export type AutoPlacementMode = 'optimal' | 'power' | 'bonus';
export interface AutoPlacementOptions {
    keepPlaced?: boolean;
    noMovePlaced?: boolean;
    mode?: AutoPlacementMode;
}
export interface AutoPlacementResult {
    room: RollercoinRoomResponse;
    inventory: ImportedMiner[];
    stockChanges: ImportedMinerQuantity[];
    changes: AutoPlacementChange[];
    beforePower: number;
    afterPower: number;
    exact: boolean;
    limitSatisfied: boolean;
    maxPowerGh?: number;
    mode: AutoPlacementMode;
    beforeObjective: number;
    afterObjective: number;
}
interface Model {
    miner: ApiRoomMiner;
    originals: ApiRoomMiner[];
    available: number;
}
interface Rack {
    data: ApiRoomRack & { cells: number };
    bonus: number;
    members: boolean[];
    activeMembers: boolean[];
    percentages: number[];
    flat: number[];
    locked: number[];
    maxWide: number;
}
const EPSILON = 64 * Number.EPSILON;
const improves = (next: number, previous: number) => next - previous > EPSILON * Math.max(1, Math.abs(previous));
const better = (value: number, power: number, bestValue: number, bestPower: number) =>
    improves(value, bestValue) || (!improves(bestValue, value) && improves(power, bestPower));

// Counts, rather than individual copies, keep a large stock inexpensive to search.
class Allocation {
    readonly models: Model[];
    readonly racks: Rack[];
    readonly mode: AutoPlacementMode;
    counts: number[][];
    used: number[];
    cells: number[];
    wide: number[];
    files: Map<string, number>[];
    active: number[];
    base = 0;
    bonus = 0;
    rackPower = 0;
    setPercent = 0;
    setFlat = 0;
    constructor(models: Model[], racks: Rack[], mode: AutoPlacementMode, counts?: number[][]) {
        this.models = models;
        this.racks = racks;
        this.mode = mode;
        this.counts = racks.map(() => models.map(() => 0));
        this.used = models.map(() => 0);
        this.cells = racks.map(() => 0);
        this.wide = racks.map(() => 0);
        this.files = racks.map(() => new Map());
        this.active = racks.map(() => 0);
        counts?.forEach((row, r) => row.forEach((n, m) => { if (n) this.change(r, m, n); }));
    }
    power() { return this.base * (1 + (this.bonus + this.setPercent) / 10000) + this.rackPower + this.setFlat; }
    score() { return this.mode === 'power' ? this.base : this.mode === 'bonus' ? this.bonus : this.power(); }
    fits(r: number, m: number) { return this.cells[r] + this.models[m].miner.width <= this.racks[r].data.cells
        && (this.models[m].miner.width === 1 || this.wide[r] < this.racks[r].maxWide) && this.used[m] < this.models[m].available; }
    change(r: number, m: number, delta: number) {
        const model = this.models[m].miner, rack = this.racks[r];
        const oldUnique = this.files[r].size;
        const oldPercent = this.active[r] ? rack.percentages[oldUnique] : 0;
        const oldFlat = this.active[r] ? rack.flat[oldUnique] : 0;
        if (!this.used[m]) this.bonus += model.bonus_percent;
        this.used[m] += delta;
        if (!this.used[m]) this.bonus -= model.bonus_percent;
        this.counts[r][m] += delta;
        this.cells[r] += delta * model.width;
        if (model.width === 2) this.wide[r] += delta;
        this.base += delta * model.power;
        this.rackPower += delta * model.power * rack.bonus / 10000;
        if (rack.members[m]) {
            const key = model.filename || model.name;
            const count = (this.files[r].get(key) ?? 0) + delta;
            if (count) this.files[r].set(key, count); else this.files[r].delete(key);
            if (rack.activeMembers[m]) this.active[r] += delta;
        }
        const unique = this.files[r].size;
        this.setPercent += (this.active[r] ? rack.percentages[unique] : 0) - oldPercent;
        this.setFlat += (this.active[r] ? rack.flat[unique] : 0) - oldFlat;
    }
    trial(changes: [number, number, number][]) {
        const values = [this.base, this.bonus, this.rackPower, this.setPercent, this.setFlat];
        for (const [r, m, n] of changes) this.change(r, m, n);
        const score = { objective: this.score(), power: this.power() };
        for (const [r, m, n] of [...changes].reverse()) this.change(r, m, -n);
        [this.base, this.bonus, this.rackPower, this.setPercent, this.setFlat] = values;
        return score;
    }
    copy() { return new Allocation(this.models, this.racks, this.mode, this.counts); }
}

export function optimizeRoomPlacement(room: RollercoinRoomResponse, inventory: ImportedMiner[], sets?: GetRackSetListDto[], maxPowerGh?: number,
    options: AutoPlacementOptions = {}): AutoPlacementResult {
    const keepPlaced = options.keepPlaced ?? false;
    const noMovePlaced = options.noMovePlaced ?? false;
    const mode = options.mode ?? 'optimal';
    if (typeof keepPlaced !== 'boolean' || typeof noMovePlaced !== 'boolean' || !['optimal', 'power', 'bonus'].includes(mode)) throw new Error('Invalid placement options');
    const objective = (stats: ExactPowerStats) => mode === 'power' ? stats.baseMinerPowerGh
        : mode === 'bonus' ? stats.collectionBonusPercent : stats.totalLeaguePowerGh;
    if (maxPowerGh !== undefined && (!Number.isFinite(maxPowerGh) || maxPowerGh < 0)) throw new Error('Invalid power limit');
    const withinLimit = (power: number) => maxPowerGh === undefined || power <= maxPowerGh;
    if (inventory.length) validateImportedQuantities(inventory);
    const byId = new Map<string, Model>();
    const originalIds = new Set<string>();
    const register = (miner: ApiRoomMiner, quantity: number, original: boolean) => {
        if (!/^[a-f\d]{24}$/i.test(miner.miner_id) || ![1, 2].includes(miner.width)
            || !Number.isFinite(miner.power) || miner.power < 0 || !Number.isFinite(miner.bonus_percent) || miner.bonus_percent < 0
            || !Number.isSafeInteger(miner.level) || miner.level < 0 || !isValidMinerFilename(miner.filename) || !miner.name) throw new Error('Invalid miner');
        let model = byId.get(miner.miner_id);
        if (model && ['power', 'width', 'bonus_percent', 'level', 'filename'].some(key =>
            model!.miner[key as keyof ApiRoomMiner] !== miner[key as keyof ApiRoomMiner])) throw new Error('Conflicting model metadata');
        if (!model) { model = { miner, originals: [], available: 0 }; byId.set(miner.miner_id, model); }
        model.available += quantity;
        if (original) model.originals.push(miner);
    };
    for (const miner of room.miners) {
        if (!miner._id || originalIds.has(miner._id)) throw new Error('Duplicate instance');
        originalIds.add(miner._id); register(miner, 1, true);
    }
    const inventoryIds = new Set<string>();
    for (const item of inventory) {
        if (inventoryIds.has(item.id)) throw new Error('Duplicate inventory model');
        inventoryIds.add(item.id);
        if (!item.miner) throw new Error('Unresolved inventory miner');
        register({ _id: '', miner_id: item.id, name: item.name, filename: item.miner.fileName ?? '',
            power: item.power, bonus_percent: item.percent, width: item.miner.width, level: item.miner.level,
            type: item.miner.type ?? 'miner', is_in_set: false, updated: item.miner.createdDate, placement: null }, item.quantity, false);
    }
    let models = [...byId.values()].filter(model => model.available > 0);
    const roomIds = new Set(room.rooms?.map(r => r._id));
    const rackIds = new Set<string>();
    for (const rack of room.racks ?? []) {
        if (!rack._id || rackIds.has(rack._id)) throw new Error('Duplicate rack');
        rackIds.add(rack._id);
    }
    const physicalRacks = (room.racks ?? []).filter(r => r.placement).map(r => {
        const info = r.rack_info;
        if (info && (info.width !== 2 || !Number.isSafeInteger(info.height) || info.height < 1)) throw new Error('Invalid rack dimensions');
        const cells = r.cells ?? info?.capacity ?? (info ? info.width * info.height : NaN);
        if (!roomIds.has(r.placement!.user_room_id)
            || !Number.isSafeInteger(cells) || cells < 1 || cells > 64
            || (info && cells > info.width * info.height)) throw new Error('Invalid rack');
        const bonus = r.bonus ?? r.bonus_percent;
        if (typeof bonus !== 'number' || !Number.isFinite(bonus) || bonus < 0) throw new Error('Invalid rack bonus');
        return { data: { ...r, cells }, bonus };
    });
    const occupied = new Set<string>();
    for (const m of room.miners) if (m.placement) {
        const r = physicalRacks.find(r => r.data._id === m.placement!.user_rack_id)?.data;
        const { x, y } = m.placement;
        if (!r || !Number.isInteger(x) || !Number.isInteger(y) || x < 0 || x + m.width > 2 || y < 0 || y * 2 + x + m.width > r.cells) throw new Error('Invalid placement');
        for (let dx = 0; dx < m.width; dx++) {
            const key = `${r._id}:${y * 2 + x + dx}`;
            if (occupied.has(key)) throw new Error('Overlapping miners'); occupied.add(key);
        }
    }
    const beforeStats = calculateExactRoomPower(room, sets);
    const beforePower = beforeStats.totalLeaguePowerGh, beforeObjective = objective(beforeStats);
    if (!Number.isFinite(beforePower)) throw new Error('Invalid baseline power');
    const unchanged = (exact: boolean): AutoPlacementResult => ({ room, inventory, stockChanges: [], changes: [], beforePower, afterPower: beforePower,
        mode, beforeObjective, afterObjective: beforeObjective, exact, limitSatisfied: withinLimit(beforePower), maxPowerGh });
    const buildResult = (miners: ApiRoomMiner[], exact: boolean): AutoPlacementResult | null => {
        const counts = new Map<string, number>();
        for (const miner of miners) counts.set(miner.miner_id, (counts.get(miner.miner_id) ?? 0) + 1);
        const stock = new Map(inventory.map(item => [item.id, { ...item }]));
        const stockChanges: ImportedMinerQuantity[] = [];
        models.forEach(model => {
            const delta = (counts.get(model.miner.miner_id) ?? 0) - model.originals.length;
            if (!delta) return;
            const miner = model.miner;
            const item = stock.get(miner.miner_id) ?? { id: miner.miner_id, name: miner.name, power: miner.power,
                percent: miner.bonus_percent, quantity: 0, miner: { id: miner.miner_id, name: miner.name,
                    power: miner.power, percent: miner.bonus_percent, width: miner.width, level: miner.level,
                    fileName: miner.filename, type: miner.type, imageVersion: 1, createdDate: miner.updated } };
            stock.set(item.id, { ...item, quantity: item.quantity - delta });
            stockChanges.push({ id: item.id, quantity: delta });
        });
        const nextInventory = [...stock.values()];
        if (nextInventory.reduce((sum, item) => sum + item.quantity, 0) > MAX_IMPORTED_MINERS) return null;
        if (nextInventory.length) validateImportedQuantities(nextInventory);
        const nextRoom = { ...room, miners };
        const originals = new Map(room.miners.map(m => [m._id, m]));
        const nextIds = new Set(miners.map(m => m._id));
        const changes: AutoPlacementChange[] = [];
        for (const miner of miners) {
            const from = originals.get(miner._id)?.placement ?? null, to = miner.placement;
            if (from?.user_rack_id !== to?.user_rack_id || from?.x !== to?.x || from?.y !== to?.y) changes.push({ minerId: miner._id, name: miner.name, from, to });
        }
        for (const miner of room.miners) if (!nextIds.has(miner._id)) changes.push({ minerId: miner._id, name: miner.name, from: miner.placement, to: null });
        const afterStats = calculateExactRoomPower(nextRoom, sets), afterPower = afterStats.totalLeaguePowerGh;
        return { room: nextRoom, inventory: nextInventory, stockChanges, changes, beforePower,
            afterPower, mode, beforeObjective, afterObjective: objective(afterStats), exact, limitSatisfied: withinLimit(afterPower), maxPowerGh };
    };
    if (!physicalRacks.length || !models.length) return unchanged(true);
    const totalCells = physicalRacks.reduce((sum, r) => sum + r.data.cells, 0);
    if (noMovePlaced && !keepPlaced) {
        const placed = room.miners.filter(miner => miner.placement);
        const extraCopies = models.reduce((sum, model) => sum + Math.min(model.available - model.originals.filter(miner => miner.placement).length,
            Math.floor(totalCells / model.miner.width)), 0);
        const exact = placed.length + extraCopies <= 8 && 2 ** placed.length * (physicalRacks.length + 1) ** extraCopies <= 100000;
        let best = unchanged(exact), bestRemoved: ApiRoomMiner[] = [];
        const visited = new Set<string>();
        const deadline = performance.now() + 8000;
        const tryRemoved = (removed: ApiRoomMiner[]) => {
            if (!exact && (visited.size >= 64 || performance.now() >= deadline)) return false;
            const removedIds = new Set(removed.map(miner => miner._id));
            const key = JSON.stringify([...removedIds].sort());
            if (visited.has(key)) return true;
            visited.add(key);
            const fixedRoom = { ...room, miners: room.miners.filter(miner => !removedIds.has(miner._id)) };
            // Removed instances are returned after the search, never offered as movable stock in this operation.
            const filled = optimizeRoomPlacement(fixedRoom, inventory, sets, maxPowerGh, { mode, keepPlaced: true });
            if (!filled.limitSatisfied) return true;
            const reserved = new Set([...originalIds, ...filled.room.miners.map(miner => miner._id)]);
            const miners = filled.room.miners.map(miner => {
                if (!removedIds.has(miner._id)) return miner;
                let n = 0;
                while (reserved.has(`auto_${miner.miner_id}_${n}`)) n++;
                const id = `auto_${miner.miner_id}_${n}`; reserved.add(id);
                return { ...miner, _id: id };
            });
            const candidate = buildResult(miners, exact);
            if (candidate?.limitSatisfied && (!best.limitSatisfied || better(candidate.afterObjective, candidate.afterPower, best.afterObjective, best.afterPower))) {
                best = candidate; bestRemoved = removed;
            }
            return true;
        };
        if (exact) {
            for (let mask = 0; mask < 2 ** placed.length; mask++) tryRemoved(placed.filter((_, index) => (mask & (1 << index)) !== 0));
        } else {
            // shortcut: large anchored layouts test at most 64 removal groups for 8 seconds; use a global solver if exact large-room search is required.
            const rank = (miner: ApiRoomMiner) => mode === 'bonus' ? miner.bonus_percent : miner.power * (mode === 'optimal' ? 1 + miner.bonus_percent / 10000 : 1);
            const ordered = [...placed].sort((a, b) => rank(a) - rank(b));
            tryRemoved([]); tryRemoved(placed);
            for (const miner of ordered.slice(0, 16)) if (!tryRemoved([miner])) break;
            for (let count = 2; count < placed.length; count *= 2) if (!tryRemoved(ordered.slice(0, count))) break;
            for (const rack of physicalRacks) if (!tryRemoved(placed.filter(miner => miner.placement!.user_rack_id === rack.data._id))) break;
            for (const miner of ordered) {
                const next = bestRemoved.some(item => item._id === miner._id) ? bestRemoved.filter(item => item._id !== miner._id) : [...bestRemoved, miner];
                if (!tryRemoved(next)) break;
            }
        }
        return best;
    }
    const movableCopies = (model: Model) => model.available - (keepPlaced ? model.originals.filter(miner => miner.placement).length : 0);
    const fullCopies = models.reduce((sum, m) => sum + Math.min(movableCopies(m), Math.floor(totalCells / m.miner.width)), 0);
    const exact = fullCopies <= 8 && (physicalRacks.length + 1) ** fullCopies <= 100000;
    if (!exact && models.length > 200) {
        // shortcut: large pools use bounded search; use a global solver if exact large-room optimization becomes required.
        const keep = new Set(models.filter(m => m.originals.length || physicalRacks.some(r => isMinerInRackSet(r.data, m.miner.miner_id, m.miner.filename, sets))));
        const priorities = [(m: Model) => m.miner.power, (m: Model) => m.miner.bonus_percent, (m: Model) => m.miner.power / m.miner.width];
        if (mode === 'bonus') priorities.push(m => m.miner.bonus_percent / m.miner.width);
        for (const value of priorities) {
            models.filter(m => withinLimit(m.miner.power)).sort((a, b) => value(b) - value(a)).slice(0, 70).forEach(m => keep.add(m));
        }
        if (maxPowerGh !== undefined) [...models].sort((a, b) => a.miner.power - b.miner.power).slice(0, 70).forEach(m => keep.add(m));
        models = models.filter(m => keep.has(m));
    }
    const racks: Rack[] = physicalRacks.map(r => {
        const dynamic = sets?.length ? sets.find(s => s.requiredRackId === r.data.rack_id) : undefined;
        const local = !sets?.length ? SETS_DATA.find(s => s.rack?.id === r.data.rack_id) : undefined;
        const members = models.map(m => isMinerInRackSet(r.data, m.miner.miner_id, m.miner.filename, sets) && (dynamic
            ? dynamic.rackSetItems.some(i => i.minerFilename === m.miner.filename)
            : local?.miners?.some(i => i.filename === m.miner.filename || i.title.en === m.miner.name) ?? false));
        const activeMembers = models.map((m, i) => members[i] && (Boolean(dynamic) || guessSetByMiner(m.miner)?.rack?.id === r.data.rack_id));
        const percentages = Array.from({ length: r.data.cells + 1 }, (_, count) => count === 0 ? 0 : dynamic
            ? dynamic.rackSetLevels.filter(l => count >= l.conditionAmount).reduce((sum, l) => sum + (l.bonusPercent || 0), 0)
            : (local?.levels ?? []).filter(l => count >= l.condition_amount).reduce((sum, l) => sum + (l.percent_power || 0), 0));
        const flat = Array.from({ length: r.data.cells + 1 }, (_, count) => count === 0 || dynamic ? 0
            : (local?.levels ?? []).filter(l => count >= l.condition_amount).reduce((sum, l) => sum + (l.bonus_power || 0), 0));
        if ([...percentages, ...flat].some(n => !Number.isFinite(n) || n < 0)) throw new Error('Invalid set bonus');
        const locked = models.map(model => keepPlaced ? model.originals.filter(miner => miner.placement?.user_rack_id === r.data._id).length : 0);
        const fixedWide = models.reduce((sum, model, m) => sum + (model.miner.width === 2 ? locked[m] : 0), 0);
        const freePairs = Array.from({ length: Math.floor(r.data.cells / 2) }, (_, row) => row * 2)
            .filter(cell => !occupied.has(`${r.data._id}:${cell}`) && !occupied.has(`${r.data._id}:${cell + 1}`)).length;
        return { ...r, members, activeMembers, percentages, flat, locked,
            maxWide: keepPlaced ? fixedWide + freePairs : Math.floor(r.data.cells / 2) };
    });
    const baseline = new Allocation(models, racks, mode);
    room.miners.forEach(miner => {
        const m = models.findIndex(m => m.miner.miner_id === miner.miner_id);
        const r = racks.findIndex(r => r.data._id === miner.placement?.user_rack_id);
        if (r >= 0) baseline.change(r, m, 1);
    });
    const newState = () => keepPlaced ? baseline.copy() : new Allocation(models, racks, mode);
    let best = unchanged(exact);
    let bestState: Allocation | null = null;
    const materialize = (state: Allocation): AutoPlacementResult | null => {
        const remaining = models.map(m => m.originals.filter(miner => !keepPlaced || !miner.placement));
        const reserved = new Set(originalIds);
        const miners: ApiRoomMiner[] = [];
        for (let r = 0; r < racks.length; r++) {
            const onRack = keepPlaced ? room.miners.filter(miner => miner.placement?.user_rack_id === racks[r].data._id) : [];
            const usedCells = new Set<number>();
            for (const miner of onRack) for (let dx = 0; dx < miner.width; dx++) usedCells.add(miner.placement!.y * 2 + miner.placement!.x + dx);
            const order = models.map((_, m) => m).sort((a, b) => models[b].miner.width - models[a].miner.width || a - b);
            for (const m of order) for (let copy = 0; copy < state.counts[r][m] - racks[r].locked[m]; copy++) {
                const model = models[m];
                const sameRack = remaining[m].findIndex(miner => miner.placement?.user_rack_id === racks[r].data._id);
                let miner = remaining[m].splice(sameRack < 0 ? 0 : sameRack, 1)[0];
                if (!miner) {
                    let n = 0;
                    while (reserved.has(`auto_${model.miner.miner_id}_${n}`)) n++;
                    const instanceId = `auto_${model.miner.miner_id}_${n}`; reserved.add(instanceId);
                    miner = { ...model.miner, _id: instanceId };
                }
                let cell = 0;
                while (cell < racks[r].data.cells && (cell % 2 + miner.width > 2
                    || Array.from({ length: miner.width }, (_, x) => cell + x).some(c => usedCells.has(c)))) cell++;
                if (cell + miner.width > racks[r].data.cells) throw new Error('Packing failed');
                for (let dx = 0; dx < miner.width; dx++) usedCells.add(cell + dx);
                onRack.push({ ...miner, placement: { user_rack_id: racks[r].data._id, x: cell % 2, y: Math.floor(cell / 2) },
                    is_in_set: isMinerInRackSet(racks[r].data, miner.miner_id, miner.filename, sets) });
            }
            // Local fallback determines the set from the first flagged miner.
            onRack.sort((a, b) => Number(guessSetByMiner(b)?.rack?.id === racks[r].data.rack_id) - Number(guessSetByMiner(a)?.rack?.id === racks[r].data.rack_id));
            miners.push(...onRack);
        }
        return buildResult(miners, exact);
    };
    const consider = (state: Allocation) => {
        const candidate = materialize(state);
        if (candidate && candidate.limitSatisfied && Number.isFinite(candidate.afterPower)
            && (!best.limitSatisfied || better(candidate.afterObjective, candidate.afterPower, best.afterObjective, best.afterPower))) {
            best = candidate; bestState = state.copy();
        }
    };
    if (exact) {
        const copies = models.flatMap((model, m) => Array.from({ length: Math.min(movableCopies(model), Math.floor(totalCells / model.miner.width)) }, () => m))
            .sort((a, b) => models[b].miner.width - models[a].miner.width || a - b);
        const state = newState();
        const choices: number[] = [];
        const visit = (index: number) => {
            if (index === copies.length) { consider(state); return; }
            const m = copies[index];
            const start = index && copies[index - 1] === m ? choices[index - 1] : -1;
            for (let r = start; r < racks.length; r++) {
                if (r >= 0 && !state.fits(r, m)) continue;
                choices[index] = r;
                if (r >= 0) state.change(r, m, 1);
                visit(index + 1);
                if (r >= 0) state.change(r, m, -1);
            }
        };
        visit(0);
        return best;
    }
    let evaluations = 0;
    const limit = 160000;
    const fill = (state: Allocation, allowance: number) => {
        const end = Math.min(limit, evaluations + allowance);
        while (evaluations < end) {
            let move: [number, number, number] | null = null, highest = state.score(), highestPower = state.power();
            for (let m = 0; m < models.length; m++) {
                if (state.used[m] >= models[m].available) continue;
                let ordinaryRack = -1;
                const candidates: number[] = [];
                for (let r = 0; r < racks.length; r++) if (state.fits(r, m)) {
                    if (racks[r].members[m]) candidates.push(r);
                    else if (ordinaryRack < 0 || racks[r].bonus > racks[ordinaryRack].bonus) ordinaryRack = r;
                }
                if (ordinaryRack >= 0) candidates.push(ordinaryRack);
                for (const r of candidates) {
                    if (evaluations++ >= end) break;
                    const score = state.trial([[r, m, 1]]);
                    if (withinLimit(score.power) && better(score.objective, score.power, highest, highestPower)) {
                        highest = score.objective; highestPower = score.power; move = [r, m, 1];
                    }
                }
            }
            if (!move) break;
            state.change(...move);
        }
        // Finish filling even when the search budget is spent.
        const order = models.map((_, i) => i).sort((a, b) => (mode === 'bonus'
            ? models[b].miner.bonus_percent / models[b].miner.width - models[a].miner.bonus_percent / models[a].miner.width : 0)
            || models[b].miner.power / models[b].miner.width - models[a].miner.power / models[a].miner.width);
        for (const m of order) for (const r of racks.map((_, i) => i).sort((a, b) => racks[b].bonus - racks[a].bonus)) {
            while (state.fits(r, m)) {
                if (maxPowerGh !== undefined && !withinLimit(state.trial([[r, m, 1]]).power)) break;
                state.change(r, m, 1);
            }
        }
        consider(state);
    };
    fill(baseline.copy(), 30000);
    fill(newState(), 40000);
    const seeds = racks.flatMap((rack, r) => {
        const unique = new Map<string, number>();
        models.forEach((model, m) => {
            if (!rack.members[m]) return;
            const old = unique.get(model.miner.filename);
            if (old === undefined || models[old].miner.power < model.miner.power) unique.set(model.miner.filename, m);
        });
        const members = [...unique.values()].sort((a, b) => models[b].miner.power - models[a].miner.power);
        return members.length ? [{ r, members, weight: rack.percentages[Math.min(members.length, rack.data.cells)] }] : [];
    }).sort((a, b) => b.weight - a.weight).slice(0, 4);
    for (const seed of seeds) {
        const state = newState();
        for (const m of seed.members) if (state.fits(seed.r, m) && withinLimit(state.trial([[seed.r, m, 1]]).power)) state.change(seed.r, m, 1);
        fill(state, 15000);
    }
    let state = bestState ?? baseline;
    for (let pass = 0; pass < 12 && evaluations < limit; pass++) {
        let move: [number, number, number][] | null = null, highest = state.score(), highestPower = state.power();
        const tryMove = (changes: [number, number, number][]) => {
            if (evaluations++ >= limit) return;
            if (keepPlaced && changes.some(([r, m, delta]) => (delta < 0 && state.counts[r][m] + delta < racks[r].locked[m])
                || state.wide[r] + changes.filter(([target, model]) => target === r && models[model].miner.width === 2)
                    .reduce((sum, [, , count]) => sum + count, 0) > racks[r].maxWide)) return;
            const score = state.trial(changes);
            if (withinLimit(score.power) && better(score.objective, score.power, highest, highestPower)) {
                highest = score.objective; highestPower = score.power; move = changes;
            }
        };
        for (let r = 0; r < racks.length && evaluations < limit; r++) for (let m = 0; m < models.length && evaluations < limit; m++) {
            if (state.counts[r][m] <= racks[r].locked[m]) continue;
            for (let target = 0; target < racks.length && evaluations < limit; target++) if (target !== r) {
                if (state.cells[target] + models[m].miner.width <= racks[target].data.cells) tryMove([[r, m, -1], [target, m, 1]]);
                for (let other = 0; other < models.length && evaluations < limit; other++) {
                    if (state.counts[target][other] <= racks[target].locked[other] || m === other) continue;
                    const widthDelta = models[m].miner.width - models[other].miner.width;
                    if (state.cells[r] - widthDelta <= racks[r].data.cells && state.cells[target] + widthDelta <= racks[target].data.cells)
                        tryMove([[r, m, -1], [target, other, -1], [r, other, 1], [target, m, 1]]);
                }
            }
            for (let other = 0; other < models.length && evaluations < limit; other++) {
                if (state.used[other] >= models[other].available || state.cells[r] - models[m].miner.width + models[other].miner.width > racks[r].data.cells) continue;
                tryMove([[r, m, -1], [r, other, 1]]);
            }
        }
        if (!move) break;
        for (const change of move as [number, number, number][]) state.change(...change);
        consider(state);
        state = bestState ?? state;
    }
    return best;
}
