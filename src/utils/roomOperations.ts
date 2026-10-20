import type { RollercoinRoomResponse } from '../types/room';
import type { GetRackSetListDto } from '../services/rackApi';
import { calculateExactRoomPower } from './roomParser';

const operationKinds = ['change', 'autoPlacement', 'undo', 'reset', 'load', 'save'] as const;
const changeKinds = ['added', 'removed', 'moved', 'updated'] as const;
const entities = ['miner', 'rack', 'room'] as const;
type OperationKind = typeof operationKinds[number];
interface ChangeSummary {
    entity: typeof entities[number];
    kind: typeof changeKinds[number];
    count: number;
    names: string[];
    otherNames: number;
    miners?: { id: string; name: string }[];
}
export interface RoomOperation {
    id: string;
    at: number;
    kind: OperationKind;
    beforePowerGh: number | null;
    afterPowerGh: number | null;
    changes: ChangeSummary[];
}

export const roomOperationsKey = (userId?: string) => `rollercoin_web_room_operations_${userId ? `account:${userId}` : 'sandbox'}`;
export const appendRoomOperation = (entries: RoomOperation[], entry: RoomOperation) => [entry, ...entries].slice(0, 100);

export function serializeRoomOperations(entries: RoomOperation[]): string {
    const text = JSON.stringify(entries);
    if (text.length > 2_000_000) throw new Error('Operation history too large');
    return text;
}

export function createRoomOperation(before: RollercoinRoomResponse, after: RollercoinRoomResponse,
    sets?: GetRackSetListDto[], kind: OperationKind = 'change'): RoomOperation | null {
    const groups = new Map<string, { entity: ChangeSummary['entity']; kind: ChangeSummary['kind']; count: number; names: Set<string>; miners?: ChangeSummary['miners'] }>();
    const add = (entity: ChangeSummary['entity'], kind: ChangeSummary['kind'], name: string, id: string) => {
        const key = `${entity}:${kind}`;
        const group = groups.get(key) ?? { entity, kind, count: 0, names: new Set<string>(), ...(entity === 'miner' ? { miners: [] } : {}) };
        group.miners?.push({ id, name: name.slice(0, 200) });
        group.count++; group.names.add(name.slice(0, 200)); groups.set(key, group);
    };
    const compare = <T extends { _id: string }>(entity: ChangeSummary['entity'], oldItems: T[], newItems: T[],
        describe: (item: T) => { name: string; position?: string; value: string }) => {
        const oldById = new Map(oldItems.map(item => [item._id, item]));
        const newById = new Map(newItems.map(item => [item._id, item]));
        for (const item of oldItems) {
            const next = newById.get(item._id), previous = describe(item);
            if (!next) add(entity, 'removed', previous.name, item._id);
            else {
                const current = describe(next);
                if (previous.position !== current.position) add(entity, 'moved', current.name, item._id);
                else if (previous.value !== current.value) add(entity, 'updated', current.name, item._id);
            }
        }
        for (const item of newItems) if (!oldById.has(item._id)) add(entity, 'added', describe(item).name, item._id);
    };
    compare('miner', before.miners, after.miners, m => ({ name: m.name,
        position: JSON.stringify(m.placement ? [m.placement.user_rack_id, m.placement.x, m.placement.y] : null),
        value: JSON.stringify([m.miner_id, m.name, m.power, m.bonus_percent, m.width, m.level, m.filename, m.type, m.is_in_set]) }));
    compare('rack', before.racks ?? [], after.racks ?? [], r => ({ name: r.name,
        position: JSON.stringify(r.placement ? [r.placement.user_room_id, r.placement.x, r.placement.y] : null),
        value: JSON.stringify([r.rack_id, r.name, r.bonus ?? r.bonus_percent ?? 0,
            r.cells ?? r.rack_info?.capacity ?? (r.rack_info ? r.rack_info.width * r.rack_info.height : null)]) }));
    compare('room', before.rooms ?? [], after.rooms ?? [], r => ({ name: String(r.room_info.level + 1),
        value: JSON.stringify([r.room_info.room_id, r.room_info.level, r.room_info.cols, r.room_info.rows]) }));
    if (!groups.size && kind === 'change') return null;
    const power = (room: RollercoinRoomResponse) => {
        const value = calculateExactRoomPower(room, sets).totalLeaguePowerGh;
        return Number.isFinite(value) && value >= 0 ? value : null;
    };
    return { id: crypto.randomUUID(), at: Date.now(), kind, beforePowerGh: power(before), afterPowerGh: power(after),
        changes: [...groups.values()].map(group => ({ entity: group.entity, kind: group.kind, count: group.count,
            names: [...group.names].slice(0, 3), otherNames: Math.max(0, group.names.size - 3),
            ...(group.miners ? { miners: group.miners } : {}) })) };
}

export function parseRoomOperations(text: string): RoomOperation[] {
    try {
        if (text.length > 2_000_000) return [];
        const entries: unknown = JSON.parse(text);
        const power = (value: unknown) => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0);
        if (!Array.isArray(entries) || entries.length > 100 || entries.some(entry => !entry
            || typeof entry.id !== 'string' || !entry.id.length || entry.id.length > 100 || !Number.isSafeInteger(entry.at) || entry.at < 0 || entry.at > 8640000000000000
            || !operationKinds.includes(entry.kind) || !power(entry.beforePowerGh) || !power(entry.afterPowerGh)
            || !Array.isArray(entry.changes) || entry.changes.length > 12 || entry.changes.some((change: ChangeSummary) => !change
                || !entities.includes(change.entity) || !changeKinds.includes(change.kind)
                || !Number.isSafeInteger(change.count) || change.count < 1 || !Number.isSafeInteger(change.otherNames) || change.otherNames < 0
                || !Array.isArray(change.names) || change.names.length > 3 || change.names.some(name => typeof name !== 'string' || name.length > 200)
                || change.names.length + change.otherNames > change.count
                || (change.miners !== undefined && (change.entity !== 'miner' || !Array.isArray(change.miners)
                    || change.miners.length !== change.count || change.miners.some(miner => !miner
                        || typeof miner.id !== 'string' || !miner.id.length || miner.id.length > 100
                        || typeof miner.name !== 'string' || miner.name.length > 200)
                    || new Set(change.miners.map(miner => miner.id)).size !== change.miners.length))))) return [];
        return entries as RoomOperation[];
    } catch { return []; }
}

export function readRoomOperations(userId?: string): RoomOperation[] {
    try { return parseRoomOperations(localStorage.getItem(roomOperationsKey(userId)) ?? '[]'); }
    catch { return []; }
}
